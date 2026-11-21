import { config } from "../../src/config.ts";
import { requireApproval } from "../../src/core/gates.ts";
import { complete } from "../../src/core/llm.ts";
import { WEB_SEARCH_USD_PER_CALL } from "../../src/core/pricing.ts";
import type { Feedback } from "../../src/core/types.ts";
import { BriefSchema, type Brief } from "../../src/schemas.ts";
import { loadSystemPrompt, type AgentContext } from "../shared/context.ts";
import { mockBrief } from "./mock.ts";

/**
 * Market Scout: nicho → brief.json (concepto + MVP + criterios de aceptación).
 * Si SCOUT_WEB_SEARCH=true pide aprobación (gate #2) antes de usar la búsqueda web de pago.
 */
export async function runScout(ctx: AgentContext, input: { niche: string; feedback: Feedback | null }): Promise<Brief> {
  const { store, task, logger, workspace } = ctx;

  let webSearchMaxUses: number | undefined;
  if (config.scout.webSearch && !ctx.dryRun) {
    const uses = config.scout.webSearchMaxUses;
    const approval = requireApproval(store, task, {
      gate: "spend",
      key: "spend:web_search",
      summary: `Market Scout quiere usar la búsqueda web de pago: hasta ${uses} búsquedas ≈ US$${(uses * WEB_SEARCH_USD_PER_CALL).toFixed(2)} (más tokens).`,
      amountUsd: uses * WEB_SEARCH_USD_PER_CALL,
    });
    if (approval.status === "approved") webSearchMaxUses = uses;
    else logger.warn("scout", task.id, "Búsqueda web rechazada: se investiga solo con conocimiento del modelo.");
  }

  const system = loadSystemPrompt("scout", {
    market: config.kit.market,
    language: config.kit.language,
    maxFiles: String(config.kit.maxFiles),
  });

  const feedbackBlock = input.feedback
    ? `\n\n## Feedback sobre el concepto anterior (debes atenderlo)\n${input.feedback.summary}\n${input.feedback.defects
        .map((d) => `- ${d.issue} → ${d.fix}`)
        .join("\n")}`
    : "";

  const prompt = `Nicho a investigar: "${input.niche}".${
    webSearchMaxUses
      ? `\nTienes búsqueda web (máx. ${webSearchMaxUses} búsquedas): úsala para validar demanda, competidores y precios reales.`
      : "\nNo tienes búsqueda web: usa tu conocimiento y marca la confianza y los supuestos con honestidad."
  }${feedbackBlock}\n\nEntrega el brief completo.`;

  const { data: brief } = await complete(ctx, {
    agent: "scout",
    system,
    prompt,
    schema: BriefSchema,
    maxTokens: 32000,
    expectedOutputTokens: 9000,
    webSearchMaxUses,
    mock: () => mockBrief(input.niche, task.iterations.research),
  });

  workspace.writeJson("brief.json", brief);
  workspace.write("brief.md", briefToMarkdown(brief));
  logger.info("scout", task.id, `Brief listo: "${brief.productName}" (viabilidad ${brief.viabilityScore}/100, US$${brief.pricing.price}).`);
  return brief;
}

/** Versión legible del brief para la revisión humana del gate #1. */
export function briefToMarkdown(b: Brief): string {
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  return `# ${b.productName}

> ${b.oneLiner}

**Nicho:** ${b.niche}
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
`;
}
