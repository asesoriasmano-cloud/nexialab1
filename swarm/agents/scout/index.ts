import { config, LANGUAGE_NAMES } from "../../src/config.ts";
import { requireApproval } from "../../src/core/gates.ts";
import { complete } from "../../src/core/llm.ts";
import { WEB_SEARCH_USD_PER_CALL } from "../../src/core/pricing.ts";
import type { Feedback } from "../../src/core/types.ts";
import { BriefSchema, OpportunitiesSchema, type Brief, type Opportunities } from "../../src/schemas.ts";
import { loadSystemPrompt, type AgentContext } from "../shared/context.ts";
import { mockBrief, mockOpportunities } from "./mock.ts";

/**
 * Market Scout en dos fases:
 *   1. Exploración divergente: N oportunidades en mercados y segmentos distintos → opportunities.json
 *   2. Convergencia: brief completo de la oportunidad elegida → brief.json / brief.md
 * El nicho es opcional: sin él, la exploración es totalmente abierta; con él, es solo una semilla.
 * Si SCOUT_WEB_SEARCH=true pide aprobación (gate #2) antes de usar la búsqueda web de pago.
 */
export async function runScout(ctx: AgentContext, input: { niche: string; feedback: Feedback | null }): Promise<Brief> {
  const { store, task, logger, workspace } = ctx;
  const webSearchMaxUses = webSearchBudget(ctx);

  const system = loadSystemPrompt("scout", {
    markets: config.scout.markets,
    languages: config.scout.languages.map((l) => `${l} (${LANGUAGE_NAMES[l]})`).join(", "),
    exclude: config.scout.exclude ? `- Evita estos temas o nichos: ${config.scout.exclude}.` : "",
    maxFiles: String(config.kit.maxFiles),
  });

  const seed = input.niche.trim();
  const previous = workspace.exists("opportunities.json") ? workspace.read("opportunities.json") : null;
  const feedbackBlock = input.feedback
    ? `\n\n## Feedback humano sobre la propuesta anterior (obligatorio atenderlo)\n${input.feedback.summary}${
        previous ? `\n\n## Oportunidades exploradas antes\n${previous}` : ""
      }`
    : "";
  const searchNote = webSearchMaxUses
    ? `\nTienes búsqueda web (máx. ${webSearchMaxUses} búsquedas en total): úsala para buscar dolores reales en foros y comunidades, competidores y precios.`
    : "\nNo tienes búsqueda web: usa tu conocimiento y marca la confianza y los supuestos con honestidad.";

  // ---------- Fase 1: exploración ----------
  const { data: opportunities } = await complete(ctx, {
    agent: "scout",
    system,
    prompt: `FASE 1 · EXPLORACIÓN
${seed ? `Nicho semilla: "${seed}". Es un punto de partida, no un límite: al menos la mitad de los candidatos debe estar fuera de ese segmento.` : "Exploración abierta: no hay nicho semilla. Recorre ampliamente mercados, segmentos y oficios."}
Genera exactamente ${config.scout.candidates} oportunidades distintas, puntúalas y elige la mejor.${searchNote}${feedbackBlock}`,
    schema: OpportunitiesSchema,
    maxTokens: 32000,
    expectedOutputTokens: 10000,
    webSearchMaxUses,
    mock: () => mockOpportunities(task.iterations.research),
  });
  const selected = opportunities.candidates.find((c) => c.id === opportunities.selectedId) ?? topCandidate(opportunities);
  workspace.writeJson("opportunities.json", opportunities);
  logger.info(
    "scout",
    task.id,
    `Exploró ${opportunities.candidates.length} oportunidades en ${new Set(opportunities.candidates.map((c) => c.market)).size} mercados. Elegida: #${selected.id} "${selected.name}" (${selected.market}, score ${selected.score}).`,
  );

  // ---------- Fase 2: brief de la oportunidad elegida ----------
  const { data: brief } = await complete(ctx, {
    agent: "scout",
    system,
    prompt: `FASE 2 · BRIEF
Oportunidad elegida:
${JSON.stringify(selected, null, 2)}

Motivo de la elección: ${opportunities.selectionRationale}${feedbackBlock}

Entrega el brief completo. El campo "niche" describe el segmento elegido; "market" y "language" son los del público objetivo (idiomas permitidos: ${config.scout.languages.join(", ")}).`,
    schema: BriefSchema,
    maxTokens: 32000,
    expectedOutputTokens: 9000,
    mock: () => mockBrief(task.iterations.research),
  });
  if (!config.scout.languages.includes(brief.language)) {
    throw new Error(`El Scout eligió el idioma "${brief.language}", que no está en SCOUT_LANGUAGES (${config.scout.languages.join(", ")}).`);
  }

  workspace.writeJson("brief.json", brief);
  workspace.write("brief.md", briefToMarkdown(brief, opportunities));
  logger.info(
    "scout",
    task.id,
    `Brief listo: "${brief.productName}" · ${brief.market} · ${brief.language} · viabilidad ${brief.viabilityScore}/100 · US$${brief.pricing.price}.`,
  );
  return brief;
}

function webSearchBudget(ctx: AgentContext): number | undefined {
  if (!config.scout.webSearch || ctx.dryRun) return undefined;
  const uses = config.scout.webSearchMaxUses;
  const approval = requireApproval(ctx.store, ctx.task, {
    gate: "spend",
    key: "spend:web_search",
    summary: `Market Scout quiere usar la búsqueda web de pago: hasta ${uses} búsquedas por fase ≈ US$${(uses * 2 * WEB_SEARCH_USD_PER_CALL).toFixed(2)} (más tokens).`,
    amountUsd: uses * 2 * WEB_SEARCH_USD_PER_CALL,
  });
  if (approval.status === "approved") return uses;
  ctx.logger.warn("scout", ctx.task.id, "Búsqueda web rechazada: se investiga solo con conocimiento del modelo.");
  return undefined;
}

function topCandidate(o: Opportunities) {
  const best = [...o.candidates].sort((a, b) => b.score - a.score)[0];
  if (!best) throw new Error("El Scout no devolvió oportunidades.");
  return best;
}

/** Versión legible para la revisión humana del gate #1: brief + todas las oportunidades exploradas. */
export function briefToMarkdown(b: Brief, o?: Opportunities): string {
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  const ranked = o ? [...o.candidates].sort((a, b) => b.score - a.score) : [];
  const exploration = o
    ? `## Oportunidades exploradas (${o.candidates.length})
| # | Oportunidad | Mercado | Idioma | Segmento | Competencia | Disposición a pagar | Score |
|---|---|---|---|---|---|---|---|
${ranked
  .map((c) => `| ${c.id === o.selectedId ? `**${c.id} ✔**` : c.id} | ${c.name} | ${c.market} | ${c.language} | ${c.segment} | ${c.competition} | ${c.willingnessToPay} | ${c.score} |`)
  .join("\n")}

**Por qué se eligió la #${o.selectedId}:** ${o.selectionRationale}

> ¿Prefieres otra? Recházala indicando cuál: \`npm run swarm -- reject <ID> --note "usa la oportunidad #3"\`

<details><summary>Detalle de cada oportunidad</summary>

${ranked
  .map((c) => `### #${c.id} ${c.name}\n- **Problema:** ${c.problem}\n- **Idea:** ${c.productIdea}\n- **Por qué ahora:** ${c.whyNow}\n- **Evidencia (${c.confidence}):** ${c.demandEvidence}\n- **Distribución:** ${c.distributionPath}`)
  .join("\n\n")}

</details>
`
    : "";

  return `# ${b.productName}

> ${b.oneLiner}

**Nicho:** ${b.niche}
**Mercado:** ${b.market} · **Idioma del kit:** ${b.language}
**Precio propuesto:** ${b.pricing.currency} ${b.pricing.price}. ${b.pricing.rationale}
**Upsell:** ${b.pricing.upsell}
**Viabilidad estimada:** ${b.viabilityScore}/100

## Público objetivo
${b.targetAudience.persona}

**Dolores**
${list(b.targetAudience.pains)}

**Trabajos por hacer**
${list(b.targetAudience.jobsToBeDone)}

## Señales de demanda
${b.demandSignals.map((s) => `- **${s.signal}** (confianza ${s.confidence}): ${s.evidence}`).join("\n")}

## Palabras clave
${b.keywords.map((k) => `- ${k.term} · ${k.intent} · prioridad ${k.priority}`).join("\n")}

## Competencia y alternativas
${b.competitors.map((c) => `- **${c.name}** (${c.price}): ${c.offer}. Debilidad: ${c.weakness}`).join("\n")}

## Brecha
${b.gap}

## MVP: ${b.mvp.format}
${b.mvp.deliverables.map((d) => `- [${d.kind}] **${d.name}**: ${d.description}`).join("\n")}

**Fuera de alcance**
${list(b.mvp.outOfScope)}

## Criterios de aceptación (los usará QA)
${list(b.acceptanceCriteria)}

## Riesgos
${list(b.risks)}

## Supuestos por validar
${list(b.assumptionsToValidate)}

${exploration}`;
}
