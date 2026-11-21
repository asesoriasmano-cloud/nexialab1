import type { Brief, Opportunities } from "../schemas.ts";

/**
 * Validación determinística (gratis) del brief ANTES de mostrárselo a una persona.
 * Detecta los errores que el Scout ya cometió en la práctica: promesas de formatos que el enjambre no puede
 * construir, unidades de otro mercado, nombre en idioma mezclado y estructura del MVP inválida.
 * Si hay problemas, el Scout reintenta solo (SCOUT_AUTO_FIX_ATTEMPTS) y la persona ve un brief ya depurado.
 */

export interface BriefIssue {
  rule: "format" | "units" | "name_language" | "structure" | "consistency";
  issue: string;
  fix: string;
}

const NEGATION = /\b(sin|no|ni|nunca|without|not|never|excluye|fuera de alcance)\b/i;

/** Busca `re` en `text` ignorando apariciones precedidas de una negación cercana ("sin DOCX", "no fórmulas"). */
function affirmative(text: string, re: RegExp): string | null {
  const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  for (const m of text.matchAll(global)) {
    const before = text.slice(Math.max(0, (m.index ?? 0) - 40), m.index);
    if (!NEGATION.test(before)) return m[0];
  }
  return null;
}

// Formatos que el enjambre NO puede producir (solo Markdown y CSV planos).
const FORBIDDEN_FORMATS = /\b(docx?|xlsx?|pptx?|pdf editable|pestañas|pestanas|hojas? de cálculo con fórmulas|f[oó]rmulas|macros?|figma|canva|app móvil)\b|\btabs?\b/i;
const METRIC_UNITS = /\b(m2|m²|metros? cuadrados?|square met(?:er|re)s?|litros?|liters?|litres?|kil[oó]metros?|kg|kilos?)\b/i;
const IMPERIAL_UNITS = /\b(sq\.? ?ft|square feet|pies cuadrados|gallons?|galones|miles?)\b/i;
const SPANISH_IN_NAME = /[ñáéíóú¿¡]|\b(para|con|del|los|las|una|que|de la|por)\b/i;
const ENGLISH_IN_ES_NAME = /\b(the|for|and|with|your|kit guide)\b/i;

export function checkBrief(
  brief: Brief,
  ctx: { opportunities?: Opportunities; maxFiles: number; languages: string[] },
): BriefIssue[] {
  const issues: BriefIssue[] = [];
  const add = (rule: BriefIssue["rule"], issue: string, fix: string) => issues.push({ rule, issue, fix });

  const promised = [
    brief.mvp.format,
    ...brief.mvp.deliverables.flatMap((d) => [d.name, d.description]),
    ...brief.acceptanceCriteria,
  ].join("\n");

  // 1. Formatos imposibles
  const bad = affirmative(promised, FORBIDDEN_FORMATS);
  if (bad) {
    add(
      "format",
      `El MVP o los criterios prometen "${bad}", un formato que el enjambre no puede producir (solo Markdown y CSV planos).`,
      "Reformula entregables y criterios usando solo Markdown y CSV planos; no menciones DOCX/XLSX, pestañas, fórmulas ni macros salvo para negarlos.",
    );
  }

  // 2. Unidades coherentes con el mercado
  const isUs = /united states|estados unidos|\bUS\b|\bUSA\b|ee\.? ?uu/i.test(brief.market);
  if (isUs) {
    const metric = affirmative(promised + "\n" + brief.oneLiner, METRIC_UNITS);
    if (metric) {
      add(
        "units",
        `El brief usa unidades métricas ("${metric}") para un mercado de EE.UU.`,
        "Usa pies cuadrados (sq ft), galones, libras, °F y USD; sin conversiones métricas.",
      );
    }
  } else if (brief.language !== "en") {
    const imperial = affirmative(promised, IMPERIAL_UNITS);
    if (imperial && !/mile|milla/i.test(imperial) && !/united|estados|eeuu|us\b/i.test(brief.market)) {
      add("units", `El brief usa unidades imperiales ("${imperial}") para el mercado "${brief.market}".`, "Usa el sistema métrico y la moneda local o USD.");
    }
  }

  // 3. Idioma del nombre del producto
  if (brief.language === "en" && SPANISH_IN_NAME.test(brief.productName)) {
    add("name_language", `El nombre "${brief.productName}" mezcla español con un kit en inglés.`, "Escribe el nombre del producto completamente en inglés.");
  }
  if (brief.language === "es" && ENGLISH_IN_ES_NAME.test(brief.productName) && /\b(the|for|and|with)\b/i.test(brief.productName)) {
    add("name_language", `El nombre "${brief.productName}" mezcla inglés con un kit en español.`, "Escribe el nombre del producto completamente en español.");
  }
  if (!ctx.languages.includes(brief.language)) {
    add("structure", `El idioma "${brief.language}" no está permitido (${ctx.languages.join(", ")}).`, "Elige un idioma permitido.");
  }

  // 4. Estructura del MVP
  const d = brief.mvp.deliverables;
  const chapters = d.filter((x) => x.kind === "guide_chapter").length;
  const tools = d.filter((x) => x.kind !== "guide_chapter").length;
  if (d.length < 4 || d.length > ctx.maxFiles) add("structure", `El MVP tiene ${d.length} entregables; debe tener entre 4 y ${ctx.maxFiles}.`, "Ajusta la cantidad de entregables.");
  if (chapters < 3) add("structure", `Solo ${chapters} capítulos de guía; se requieren al menos 3.`, "Agrega capítulos (guide_chapter).");
  if (tools < 1) add("structure", "Falta una herramienta práctica (template, checklist, prompts o csv).", "Agrega al menos una herramienta práctica.");
  if (!(brief.pricing.price > 0)) add("structure", "El precio debe ser mayor que 0.", "Define un precio en USD.");
  if (brief.acceptanceCriteria.length < 4) add("structure", "Muy pocos criterios de aceptación (mínimo 4).", "Agrega criterios verificables para QA.");

  // 5. Consistencia con la exploración
  if (ctx.opportunities && !ctx.opportunities.candidates.some((c) => c.id === brief.opportunityId)) {
    add("consistency", `opportunityId ${brief.opportunityId} no existe en la lista de oportunidades.`, "Usa el id de una oportunidad de la lista.");
  }
  if (!brief.selectionRationale.trim()) add("consistency", "Falta la razón de la elección (selectionRationale).", "Explica por qué esta oportunidad gana frente a las otras.");

  return issues;
}

/** Resumen corto (≈10 líneas) y recomendación automática para el gate humano de concepto. */
export function conceptSummary(
  brief: Brief,
  opts: { signalScore?: number | null; commercial?: number | null; remainingIssues: BriefIssue[]; minViability?: number },
): { text: string; recommendation: "APROBAR" | "REVISAR" } {
  const topCompetitor = brief.competitors[0];
  const reasons: string[] = [];
  if (brief.viabilityScore < (opts.minViability ?? 60)) reasons.push(`viabilidad baja (${brief.viabilityScore}/100)`);
  if (opts.signalScore != null && opts.signalScore < 50) reasons.push(`señal de demanda real débil (${opts.signalScore}/100)`);
  if (opts.remainingIssues.length) reasons.push(`${opts.remainingIssues.length} aviso(s) automático(s) sin resolver`);
  const recommendation = reasons.length ? "REVISAR" : "APROBAR";

  const lines = [
    `Producto:   ${brief.productName}`,
    `Mercado:    ${brief.market} · idioma del kit: ${brief.language} · precio US$${brief.pricing.price}`,
    `Para quién: ${brief.targetAudience.persona}`,
    `Entrega:    ${brief.mvp.deliverables.length} archivos (${brief.mvp.deliverables.map((x) => x.name).slice(0, 4).join("; ")}${brief.mvp.deliverables.length > 4 ? "…" : ""})`,
    `Demanda:    señal real ${opts.signalScore ?? "—"}/100${opts.commercial != null ? ` (${opts.commercial} búsquedas de recurso descargable)` : ""} · viabilidad ${brief.viabilityScore}/100`,
    topCompetitor ? `Compite con: ${topCompetitor.name} (${topCompetitor.price})` : "",
    `Riesgo principal: ${brief.risks[0] ?? "—"}`,
    `Recomendación automática: ${recommendation}${reasons.length ? ` — ${reasons.join("; ")}` : ""}`,
  ].filter(Boolean);
  return { text: lines.join("\n   "), recommendation };
}
