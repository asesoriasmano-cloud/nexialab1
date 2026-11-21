import { config, LANGUAGE_NAMES } from "../../src/config.ts";
import { complete } from "../../src/core/llm.ts";
import { renderGuideHtml, tryExportPdf } from "../../src/core/pdf.ts";
import type { Defect, Feedback } from "../../src/core/types.ts";
import { ManifestSchema, type Brief, type Manifest } from "../../src/schemas.ts";
import { loadSystemPrompt, type AgentContext } from "../shared/context.ts";
import { mockFileContent, mockManifest } from "./mock.ts";

export interface BuildReport {
  iteration: number;
  productName: string;
  files: Array<{ path: string; kind: string; words: number; regenerated: boolean }>;
  guide: { markdown: string; html: string; pdf: string | null };
  builtAt: string;
}

/**
 * Product Builder: brief aprobado (+ defectos de QA) → output/<task>/product/
 * 1) Planifica el manifiesto de archivos (solo en la primera iteración o si QA lo pide).
 * 2) Genera cada archivo en una llamada separada (contexto del brief cacheado).
 * 3) Ensambla los capítulos en guide.md → guide.html → guide.pdf (si hay Playwright).
 */
export async function runBuilder(ctx: AgentContext, input: { brief: Brief; feedback: Feedback | null }): Promise<BuildReport> {
  const { workspace, logger, task } = ctx;
  const system = loadSystemPrompt("builder", { market: input.brief.market, language: LANGUAGE_NAMES[input.brief.language] });
  const briefContext = `# Brief aprobado (fuente de verdad)\n\n${JSON.stringify(input.brief, null, 2)}`;
  const defects = input.feedback?.target === "product" ? input.feedback.defects : [];

  // ---------- 1. Manifiesto ----------
  // Un manifiesto sin fuente de verdad (versiones anteriores) se vuelve a planificar: generar cada archivo a ciegas
  // de los demás produce contradicciones entre capítulos, hojas y contrato.
  const existing = workspace.exists("product/manifest.json") ? workspace.readJson<Manifest>("product/manifest.json") : null;
  const needsPlan = !existing || !existing.sharedFacts || defects.some((d) => normalizeFile(d.file) === "manifest.json");
  const folders = kitFolders(input.brief.language);
  let manifest: Manifest;
  if (needsPlan) {
    const planDefects = defects.filter((d) => normalizeFile(d.file) === "manifest.json");
    const { data } = await complete(ctx, {
      agent: "builder",
      system,
      context: briefContext,
      prompt: `Diseña el manifiesto del kit: entre 4 y ${config.kit.maxFiles} archivos que cubran todos los entregables del MVP y permitan cumplir cada criterio de aceptación.
- path: ruta relativa en minúsculas, sin espacios, con extensión .md (o .csv para kind "csv"). Carpetas y nombres de archivo en el idioma del kit (${LANGUAGE_NAMES[input.brief.language]}), nunca en otro idioma: capítulos en "${folders.guide}/NN-nombre.md" en orden de lectura, plantillas/checklists/prompts en "${folders.templates}/" y hojas CSV en "${folders.sheets}/".
- targetWords: guide_chapter 1200–2500, template/prompts 600–1500, checklist 300–800, csv 150–400.
- slug: kebab-case corto para el nombre del producto.
- sharedFacts: la FUENTE DE VERDAD que todos los archivos respetarán al pie de la letra (Markdown, en el idioma del kit). Debe fijar, ya decididos y verificados:
  1) los nombres EXACTOS y el orden de cada fila y columna de cada hoja CSV (con el nombre del archivo);
  2) cada ejemplo resuelto con sus cifras de entrada y TODOS sus resultados intermedios y finales, ya calculados y comprobados, incluidas las filas de ejemplo que se repiten en un CSV y en un capítulo;
  3) las reglas y convenciones únicas (redondeo, notación de porcentajes, plazos, impuestos, términos del contrato, qué hojas llevan o no fórmulas);
  4) los nombres de archivos y carpetas que el texto citará y el vocabulario fijo.
  Si dos archivos hablan de lo mismo, deben tomarlo de aquí.${formatDefects(planDefects)}`,
      schema: ManifestSchema,
      maxTokens: 16000,
      expectedOutputTokens: 3000,
      mock: () => mockManifest(input.brief),
    });
    manifest = sanitizeManifest(data, config.kit.maxFiles);
    workspace.writeJson("product/manifest.json", manifest);
    logger.info("builder", task.id, `Manifiesto con ${manifest.files.length} archivos y fuente de verdad compartida.`);
  } else {
    manifest = existing!;
  }

  // ---------- 2. Archivos ----------
  // Defectos sin archivo, o con una ruta que no existe en el manifiesto, se aplican a todos los archivos
  // (si no, el Builder los ignoraría y el bucle con QA quemaría iteraciones sin corregir nada).
  const known = new Set([...manifest.files.map((f) => f.path), "manifest.json"]);
  const globalDefects = defects.filter((d) => {
    const file = normalizeFile(d.file);
    return d.severity !== "minor" && (!file || !known.has(file));
  });
  const regenerate = new Set<string>();
  for (const f of manifest.files) {
    const fileDefects = defects.filter((d) => normalizeFile(d.file) === f.path);
    if (needsPlan || !workspace.exists(`product/${f.path}`) || fileDefects.length > 0 || globalDefects.length > 0) {
      regenerate.add(f.path);
    }
  }

  const manifestContext = `${briefContext}\n\n# Manifiesto del kit\n\n${JSON.stringify({ ...manifest, sharedFacts: undefined }, null, 2)}\n\n# FUENTE DE VERDAD (sharedFacts): todos los archivos la respetan al pie de la letra\n\n${manifest.sharedFacts}`;
  for (const f of manifest.files) {
    if (!regenerate.has(f.path)) continue;
    const fileDefects = [...defects.filter((d) => normalizeFile(d.file) === f.path), ...globalDefects];
    const previous = fileDefects.length && workspace.exists(`product/${f.path}`) ? workspace.read(`product/${f.path}`) : null;

    // Al corregir, el Builder ve los demás archivos: así puede resolver inconsistencias entre archivos en vez de
    // arreglar uno a ciegas y romper otro (lo que mantenía a QA vetando ronda tras ronda).
    const others = previous
      ? manifest.files
          .filter((o) => o.path !== f.path && workspace.exists(`product/${o.path}`))
          .map((o) => `### ${o.path}\n${workspace.read(`product/${o.path}`)}`)
          .join("\n\n")
      : "";
    const prompt = previous
      ? `Revisa el archivo "${f.path}" (${f.kind}: ${f.title}).\n\n## Versión actual\n${previous}\n${formatDefects(fileDefects)}\n\n## Los demás archivos del kit (estado actual)\n${others}\n\nEntrega el archivo completo corregido. Si un defecto describe una inconsistencia con otro archivo, haz que ESTE archivo coincida con la fuente de verdad (y con el otro archivo si ya la respeta). No cambies lo que ya estaba bien.`
      : `Escribe el archivo "${f.path}" (${f.kind}: ${f.title}).\nPropósito: ${f.purpose}\nExtensión objetivo: ~${f.targetWords} palabras.\nCumple los criterios de aceptación del brief que apliquen a este archivo.\nRespeta al pie de la letra la FUENTE DE VERDAD: nombres exactos de filas y columnas, cifras de los ejemplos, reglas y términos.`;

    const { data: raw } = await complete(ctx, {
      agent: "builder",
      system,
      context: manifestContext,
      prompt,
      maxTokens: 32000,
      expectedOutputTokens: Math.round(f.targetWords * 1.6) + 2500,
      mock: () => mockFileContent(f, task.iterations.build),
    });
    workspace.write(`product/${f.path}`, stripFences(raw).trim() + "\n");
    logger.info("builder", task.id, `${previous ? "Corregido" : "Generado"}: product/${f.path}`);
  }

  // ---------- 3. Guía ensamblada ----------
  const chapters = manifest.files.filter((f) => f.kind === "guide_chapter");
  const toc = chapters.map((c, i) => `${i + 1}. ${c.title}`).join("\n");
  const guideMd = `# ${manifest.guideTitle}\n\n## Contenido\n\n${toc}\n\n${chapters
    .map((c) => workspace.read(`product/${c.path}`))
    .join("\n\n")}`;
  workspace.write("product/guide.md", guideMd);
  const htmlPath = workspace.write("product/guide.html", renderGuideHtml(manifest.guideTitle, input.brief.oneLiner, guideMd, input.brief.language));
  const pdfOk = await tryExportPdf(htmlPath, workspace.path("product/guide.pdf"));
  if (!pdfOk) logger.warn("builder", task.id, "PDF no generado (Playwright no instalado). guide.html queda listo para imprimir a PDF.");

  const report: BuildReport = {
    iteration: task.iterations.build + 1,
    productName: manifest.productName,
    files: manifest.files.map((f) => ({
      path: f.path,
      kind: f.kind,
      words: countWords(workspace.read(`product/${f.path}`)),
      regenerated: regenerate.has(f.path),
    })),
    guide: { markdown: "product/guide.md", html: "product/guide.html", pdf: pdfOk ? "product/guide.pdf" : null },
    builtAt: new Date().toISOString(),
  };
  workspace.writeJson("product/build_report.json", report);
  return report;
}

// ---------- utilidades ----------

/** Nombres de carpeta del kit en el idioma del comprador (un comprador de EE.UU. no debe ver "plantillas/"). */
export function kitFolders(language: "es" | "en" | "pt"): { guide: string; templates: string; sheets: string } {
  return {
    es: { guide: "guia", templates: "plantillas", sheets: "hojas" },
    en: { guide: "guide", templates: "templates", sheets: "worksheets" },
    pt: { guide: "guia", templates: "modelos", sheets: "planilhas" },
  }[language];
}

export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function stripFences(text: string): string {
  const m = text.trim().match(/^```[a-z]*\n([\s\S]*?)\n```$/i);
  return m ? m[1]! : text;
}

/** Normaliza la referencia de archivo que entrega QA ("product/guia/01.md" → "guia/01.md"). */
export function normalizeFile(file: string | null | undefined): string | null {
  if (!file) return null;
  return file.trim().replace(/^\.?\//, "").replace(/^product\//, "") || null;
}

function formatDefects(defects: Defect[]): string {
  if (!defects.length) return "";
  return `\n\n## Defectos a corregir (veto de QA)\n${defects
    .map((d) => `- [${d.severity}] ${d.issue}\n  Corrección esperada: ${d.fix}`)
    .join("\n")}`;
}

/** Las rutas vienen del modelo: se limpian y se fuerzan a un formato seguro dentro de product/. */
export function sanitizeManifest(m: Manifest, maxFiles: number): Manifest {
  const seen = new Set<string>();
  const files = m.files.slice(0, maxFiles).map((f, i) => {
    const ext = f.kind === "csv" ? ".csv" : ".md";
    let p = f.path
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/^\.?\/?(product\/)?/, "")
      .replace(/\.\.+/g, ".")
      .replace(/[^a-z0-9/_.-]+/g, "-")
      .replace(/\/+/g, "/")
      .replace(/^[-/.]+/, "")
      .replace(/\.(md|csv|txt|markdown)$/, "");
    if (!p) p = `archivo-${i + 1}`;
    p += ext;
    while (seen.has(p)) p = p.replace(ext, `-${i + 1}${ext}`);
    seen.add(p);
    return { ...f, path: p, targetWords: Math.max(100, Math.round(f.targetWords)) };
  });
  const slug = m.slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "kit";
  return { ...m, slug, files };
}
