import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import type { AgentContext } from "../../agents/shared/context.ts";
import { config, hasApiCredentials, type AgentName } from "../config.ts";
import { OutputError, RefusalError } from "./errors.ts";
import { ensureBudget } from "./gates.ts";
import { costUsd, estimateTokens, isKnownModel } from "./pricing.ts";

export interface LlmRequest<T> {
  agent: AgentName;
  system: string;
  /** Contexto compartido entre varias llamadas (p. ej. el brief). Se marca para prompt caching. */
  context?: string;
  prompt: string;
  /** Si se entrega, la respuesta se fuerza a JSON con este schema (structured outputs) y se valida. */
  schema?: z.ZodType<T>;
  maxTokens: number;
  /** Tokens de salida esperados (incluye razonamiento). Se usa para el control de presupuesto previo. */
  expectedOutputTokens: number;
  /** Activa la herramienta de búsqueda web del servidor (solo Scout, requiere gate #2). */
  webSearchMaxUses?: number;
  /** Respuesta simulada para --dry-run (sin llamadas ni gasto). */
  mock: () => T;
}

export interface LlmResult<T> {
  data: T;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Server-side fallback ante rechazos del clasificador de seguridad: solo en modelos que lo soportan.
const FALLBACK_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5", "claude-fable-5-2"]);

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!hasApiCredentials()) {
    throw new Error("Falta ANTHROPIC_API_KEY en swarm/.env (o usa --dry-run para probar sin gastar).");
  }
  client ??= new Anthropic();
  return client;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(trimmed);
}

/**
 * Llamada única al modelo con:
 *  - control de presupuesto previo (gate #2 si no alcanza),
 *  - registro de tokens/costo en la ejecución (run) del agente,
 *  - structured outputs + validación zod,
 *  - modo simulado para --dry-run.
 */
export async function complete<T>(ctx: AgentContext, req: LlmRequest<T>): Promise<LlmResult<T>> {
  const model = config.llm.model(req.agent);

  if (ctx.dryRun) {
    return { data: req.mock(), inputTokens: 0, outputTokens: 0, costUsd: 0 };
  }

  if (!isKnownModel(model)) {
    ctx.logger.warn(req.agent, ctx.task.id, `Modelo ${model} sin precio conocido: se estima con la tarifa más alta.`);
  }

  // Gate #2: el gasto estimado de esta llamada debe caber en el presupuesto aprobado.
  const estimate = costUsd(model, {
    inputTokens: estimateTokens(req.system + (req.context ?? "") + req.prompt),
    outputTokens: req.expectedOutputTokens,
  });
  ensureBudget(ctx.store, ctx.store.getTask(ctx.task.id), estimate);

  const content: Anthropic.Beta.BetaTextBlockParam[] = [];
  if (req.context) content.push({ type: "text", text: req.context, cache_control: { type: "ephemeral" } });
  content.push({ type: "text", text: req.prompt });

  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content }];
  const useFallbacks = config.llm.fallbacks !== "off" && FALLBACK_MODELS.has(model);

  const base = runBaseline(ctx);
  const totals: Totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, searches: 0 };
  let text = "";
  let attempts = 0;
  let parseRetries = 0;

  // Bucle corto: continúa turnos pausados por la búsqueda web (pause_turn) y reintenta una vez si el JSON no valida.
  while (true) {
    attempts += 1;
    const message = await getClient()
      .beta.messages.stream({
        model,
        max_tokens: req.maxTokens,
        system: req.system,
        messages,
        thinking: { type: "adaptive" },
        output_config: {
          effort: config.llm.effort(req.agent),
          ...(req.schema ? { format: zodOutputFormat(req.schema) } : {}),
        },
        ...(req.webSearchMaxUses
          ? { tools: [{ type: "web_search_20260209" as const, name: "web_search" as const, max_uses: req.webSearchMaxUses }] }
          : {}),
        ...(useFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      })
      .finalMessage();

    const u = message.usage;
    totals.input += u.input_tokens;
    totals.output += u.output_tokens;
    totals.cacheRead += u.cache_read_input_tokens ?? 0;
    totals.cacheWrite += u.cache_creation_input_tokens ?? 0;
    totals.searches += u.server_tool_use?.web_search_requests ?? 0;
    recordUsage(ctx, model, base, totals);

    if (message.stop_reason === "refusal") {
      throw new RefusalError(`El modelo rechazó la solicitud de ${req.agent}: ${message.stop_details?.explanation ?? "sin detalle"}`);
    }
    if (message.stop_reason === "pause_turn" && attempts < 4) {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    if (message.stop_reason === "max_tokens") {
      throw new OutputError(`Respuesta de ${req.agent} truncada por max_tokens (${req.maxTokens}). Sube el límite o divide la tarea.`);
    }

    text = message.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    if (!req.schema) {
      return { data: text as T, ...summary(model, totals) };
    }
    try {
      return { data: req.schema.parse(extractJson(text)), ...summary(model, totals) };
    } catch (err) {
      if (parseRetries >= 1) throw new OutputError(`Salida de ${req.agent} no cumple el schema: ${(err as Error).message}`);
      parseRetries += 1;
      ctx.logger.warn(req.agent, ctx.task.id, "La salida no validó contra el schema; reintentando una vez.");
      messages.splice(1); // descarta turnos previos y repite la misma solicitud
    }
  }
}

function summary(model: string, t: Totals) {
  return {
    inputTokens: t.input,
    outputTokens: t.output,
    costUsd: costUsd(model, {
      inputTokens: t.input,
      outputTokens: t.output,
      cacheReadTokens: t.cacheRead,
      cacheWriteTokens: t.cacheWrite,
      webSearches: t.searches,
    }),
  };
}

/** Foto del uso acumulado del run al iniciar una llamada; luego se suma el total de la llamada sin duplicar. */
function runBaseline(ctx: AgentContext) {
  const run = ctx.store.runsFor(ctx.task.id).find((r) => r.id === ctx.runId);
  if (!run) throw new Error(`Run ${ctx.runId} no encontrado`);
  return {
    input: run.inputTokens,
    output: run.outputTokens,
    cacheRead: run.cacheReadTokens,
    cacheWrite: run.cacheWriteTokens,
    searches: run.webSearches,
    cost: run.costUsd,
  };
}

type Totals = { input: number; output: number; cacheRead: number; cacheWrite: number; searches: number };

/** Persiste el uso tras cada respuesta, para que un error posterior no pierda el gasto ya incurrido. */
function recordUsage(ctx: AgentContext, model: string, base: ReturnType<typeof runBaseline>, t: Totals): void {
  ctx.store.updateRun(ctx.runId, {
    model,
    inputTokens: base.input + t.input,
    outputTokens: base.output + t.output,
    cacheReadTokens: base.cacheRead + t.cacheRead,
    cacheWriteTokens: base.cacheWrite + t.cacheWrite,
    webSearches: base.searches + t.searches,
    costUsd: base.cost + summary(model, t).costUsd,
  });
}
