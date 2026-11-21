import { config, LANGUAGE_NAMES } from "../../src/config.ts";
import { requireApproval } from "../../src/core/gates.ts";
import { complete } from "../../src/core/llm.ts";
import { WEB_SEARCH_USD_PER_CALL } from "../../src/core/pricing.ts";
import { collectSignals, type CandidateSignals } from "../../src/core/signals.ts";
import type { Feedback } from "../../src/core/types.ts";
import { BriefSchema, OpportunitiesSchema, type Brief, type Opportunities } from "../../src/schemas.ts";
import { loadSystemPrompt, type AgentContext } from "../shared/context.ts";
import { mockBrief, mockOpportunities } from "./mock.ts";

/**
 * Market Scout, optimizado para costo:
 *   1. Exploración divergente con un modelo barato: N oportunidades en mercados y segmentos distintos → opportunities.json
 *   2. Validación GRATIS con Google/YouTube Suggest de las mejores K → signals.json (US$0)
 *   3. Convergencia: elige con evidencia y escribe el brief completo → brief.json / brief.md
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

  // ---------- Fase 1: exploración (modelo barato) ----------
  const { data: opportunities } = await complete(ctx, {
    agent: "scout",
    model: config.scout.exploreModel,
    system,
    prompt: `FASE 1 · EXPLORACIÓN
${seed ? `Nicho semilla: "${seed}". Es un punto de partida, no un límite: al menos la mitad de los candidatos debe estar fuera de ese segmento.` : "Exploración abierta: no hay nicho semilla. Recorre ampliamente mercados, segmentos y oficios."}
Genera exactamente ${config.scout.candidates} oportunidades distintas, puntúalas y elige la mejor.
Para cada una incluye "queries": 2–3 búsquedas cortas tal como las escribiría ese público en Google, en su idioma (se usarán para validar la demanda con datos reales), y "country" con el código ISO de 2 letras del país principal.
Si el feedback humano elige un candidato anterior, inclúyelo en la lista nueva y selecciónalo.${searchNote}${feedbackBlock}`,
    schema: OpportunitiesSchema,
    maxTokens: 32000,
    expectedOutputTokens: 10000,
    webSearchMaxUses,
    mock: () => mockOpportunities(task.iterations.research),
  });
  logger.info(
    "scout",
    task.id,
    `Exploró ${opportunities.candidates.length} oportunidades en ${new Set(opportunities.candidates.map((c) => c.market)).size} mercados (modelo ${ctx.dryRun ? "simulado" : config.scout.exploreModel}).`,
  );

  // ---------- Validación gratuita (Google/YouTube Suggest, US$0) ----------
  const shortlist = shortlistFor(opportunities, config.scout.validateTop);
  let signals: CandidateSignals[] = [];
  if (config.scout.freeSignals) {
    signals = ctx.dryRun ? mockSignals(shortlist) : await collectSignals(shortlist);
    workspace.writeJson("signals.json", signals);
    const failed = signals.filter((s) => s.suggestionCount === 0 && s.errors > 0).length;
    logger.info(
      "scout",
      task.id,
      `Validó gratis ${signals.length} oportunidades con Google/YouTube Suggest (US$0)${failed ? `; ${failed} sin respuesta de red` : ""}.`,
    );
  }

  // ---------- Fase 2: elección con evidencia + brief ----------
  const evidence = shortlist.map((c) => ({ ...c, signals: signals.find((s) => s.id === c.id) ?? null }));
  const { data: brief } = await complete(ctx, {
    agent: "scout",
    system,
    prompt: `FASE 2 · BRIEF
Oportunidades preseleccionadas${signals.length ? ", con señales REALES de demanda (sugerencias de Google y YouTube: lo que la gente escribe de verdad)" : ""}:
${JSON.stringify(evidence, null, 2)}

Recomendación provisional de la fase 1 (puedes cambiarla): #${opportunities.selectedId}. ${opportunities.selectionRationale}
${signals.length ? `\nCómo leer las señales: "suggestionCount" alto indica que el tema se busca; "commercialCount" alto indica que buscan recursos descargables (plantilla, excel, template…), justo lo que vende un kit. Sin sugerencias suele haber poca demanda o una query mal planteada. Usa las sugerencias como evidencia citable en demandSignals y keywords, y cambia la elección de la fase 1 si la evidencia lo justifica.` : ""}${feedbackBlock}

Elige UNA oportunidad, indica su id en "opportunityId" y entrega el brief completo. El campo "niche" describe el segmento elegido; "market" y "language" son los del público objetivo (idiomas permitidos: ${config.scout.languages.join(", ")}).`,
    schema: BriefSchema,
    maxTokens: 32000,
    expectedOutputTokens: 9000,
    mock: () => mockBrief(task.iterations.research),
  });
  if (!config.scout.languages.includes(brief.language)) {
    throw new Error(`El Scout eligió el idioma "${brief.language}", que no está en SCOUT_LANGUAGES (${config.scout.languages.join(", ")}).`);
  }
  if (opportunities.candidates.some((c) => c.id === brief.opportunityId)) opportunities.selectedId = brief.opportunityId;
  workspace.writeJson("opportunities.json", opportunities);

  workspace.writeJson("brief.json", brief);
  workspace.write("brief.md", briefToMarkdown(brief, opportunities, signals));
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

/** Las K oportunidades de mayor score, incluyendo siempre la recomendada por la fase 1. */
function shortlistFor(o: Opportunities, k: number): Opportunities["candidates"] {
  if (o.candidates.length === 0) throw new Error("El Scout no devolvió oportunidades.");
  const ranked = [...o.candidates].sort((a, b) => b.score - a.score);
  const top = ranked.slice(0, Math.max(1, k));
  const recommended = o.candidates.find((c) => c.id === o.selectedId);
  if (recommended && !top.includes(recommended)) top.push(recommended);
  return top;
}

/** Señales simuladas para --dry-run (sin red). */
function mockSignals(cands: Opportunities["candidates"]): CandidateSignals[] {
  return cands.map((c, i) => ({
    id: c.id,
    queries: c.queries,
    google: c.queries.map((q) => `${q} plantilla`),
    youtube: [],
    suggestionCount: 20 - i * 2,
    commercialCount: 6 - Math.min(i, 5),
    signalScore: 60 - i * 5,
    errors: 0,
  }));
}

/** Versión legible para la revisión humana del gate #1: brief + todas las oportunidades exploradas. */
export function briefToMarkdown(b: Brief, o?: Opportunities, signals: CandidateSignals[] = []): string {
  const list = (xs: string[]) => xs.map((x) => `- ${x}`).join("\n");
  const ranked = o ? [...o.candidates].sort((a, b) => b.score - a.score) : [];
  const sig = (id: number) => {
    const s = signals.find((x) => x.id === id);
    return s ? `${s.signalScore} (${s.suggestionCount} sug., ${s.commercialCount} com.)` : "—";
  };
  const exploration = o
    ? `## Oportunidades exploradas (${o.candidates.length})
| # | Oportunidad | Mercado | Idioma | Segmento | Competencia | Disposición a pagar | Score | Señal real (gratis) |
|---|---|---|---|---|---|---|---|---|
${ranked
  .map((c) => `| ${c.id === o.selectedId ? `**${c.id} ✔**` : c.id} | ${c.name} | ${c.market} | ${c.language} | ${c.segment} | ${c.competition} | ${c.willingnessToPay} | ${c.score} | ${sig(c.id)} |`)
  .join("\n")}

${signals.length ? "_Señal real: búsquedas sugeridas por Google/YouTube para las queries de cada oportunidad (sug.) y cuántas piden un recurso descargable como plantilla, excel o template (com.). Detalle en signals.json._" : ""}

**Por qué se eligió la #${o.selectedId}:** ${b.selectionRationale || o.selectionRationale}

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
