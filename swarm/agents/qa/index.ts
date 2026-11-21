import { complete } from "../../src/core/llm.ts";
import type { Defect } from "../../src/core/types.ts";
import { QaReviewSchema, type Brief, type Manifest } from "../../src/schemas.ts";
import { loadSystemPrompt, type AgentContext } from "../shared/context.ts";
import { checkGrowth, checkProduct } from "./checks.ts";

export interface QaResult {
  target: "product" | "growth";
  iteration: number;
  verdict: "approve" | "reject";
  score: number;
  summary: string;
  valueProposition: string;
  defects: Defect[];
  reportPath: string;
}

/**
 * QA & Critic: chequeos determinísticos + crítica del modelo.
 * Veta (reject) si hay cualquier defecto blocker/major, venga de los chequeos o del modelo.
 */
export async function runQa(
  ctx: AgentContext,
  input: { target: "product" | "growth"; brief: Brief; iteration: number },
): Promise<QaResult> {
  const { workspace, logger, task } = ctx;
  const checkDefects = input.target === "product" ? checkProduct(workspace) : checkGrowth(workspace, input.brief);
  const material = input.target === "product" ? productMaterial(ctx) : growthMaterial(ctx);

  const { data: review } = await complete(ctx, {
    agent: "qa",
    system: loadSystemPrompt("qa"),
    context: `# Brief aprobado\n\n${JSON.stringify(input.brief, null, 2)}\n\n# Material a auditar (${input.target === "product" ? "kit del producto" : "landing y copy de growth"})\n\n${material}`,
    prompt: `Audita el material contra el brief y sus criterios de aceptación.\n\nDefectos ya detectados por los chequeos automáticos (no los repitas):\n${
      checkDefects.length ? checkDefects.map((d) => `- [${d.severity}] ${d.file ?? "global"}: ${d.issue}`).join("\n") : "- ninguno"
    }`,
    schema: QaReviewSchema,
    maxTokens: 32000,
    expectedOutputTokens: 6000,
    mock: () => mockReview(input.target, input.iteration, firstChapter(ctx)),
  });

  const defects: Defect[] = [...checkDefects, ...review.defects.map((d) => ({ ...d, source: "llm" as const }))];
  const hardFail = defects.some((d) => d.severity === "blocker" || d.severity === "major");
  const verdict = review.verdict === "reject" || hardFail ? "reject" : "approve";
  const score = defects.some((d) => d.severity === "blocker") ? Math.min(review.score, 40) : review.score;

  const reportPath = `reports/qa-${input.target}-${input.iteration + 1}.json`;
  const result: QaResult = {
    target: input.target,
    iteration: input.iteration + 1,
    verdict,
    score,
    summary: review.summary,
    valueProposition: review.valueProposition,
    defects,
    reportPath,
  };
  workspace.writeJson(reportPath, result);

  const counts = (s: Defect["severity"]) => defects.filter((d) => d.severity === s).length;
  logger.info(
    "qa",
    task.id,
    `${input.target}: ${verdict === "approve" ? "APROBADO" : "VETADO"} (score ${score}, blocker ${counts("blocker")}, major ${counts("major")}, minor ${counts("minor")}).`,
  );
  return result;
}

function productMaterial(ctx: AgentContext): string {
  const ws = ctx.workspace;
  if (!ws.exists("product/manifest.json")) return "(sin manifiesto)";
  const manifest = ws.readJson<Manifest>("product/manifest.json");
  // Se envía el contenido completo (sin truncar): el kit cabe holgadamente en la ventana de contexto.
  return manifest.files
    .map((f) => `## Archivo: ${f.path} (${f.kind}, objetivo ~${f.targetWords} palabras)\n\n${ws.exists(`product/${f.path}`) ? ws.read(`product/${f.path}`) : "(NO EXISTE)"}`)
    .join("\n\n---\n\n");
}

function growthMaterial(ctx: AgentContext): string {
  const ws = ctx.workspace;
  const landing = ws.exists("marketing/landing.html") ? ws.read("marketing/landing.html") : "(NO EXISTE)";
  const pack = ws.exists("marketing/growth.json") ? ws.read("marketing/growth.json") : "(NO EXISTE)";
  const manifest = ws.exists("product/manifest.json") ? ws.read("product/manifest.json") : "(sin manifiesto)";
  return `## Manifiesto del producto (lo que realmente incluye el kit)\n${manifest}\n\n## landing.html\n${landing}\n\n## growth.json (SEO, ficha de venta, correos, RRSS)\n${pack}`;
}

/** En --dry-run, QA veta la primera versión del producto para demostrar el bucle Builder⇄QA. */
function firstChapter(ctx: AgentContext): string | null {
  if (!ctx.workspace.exists("product/manifest.json")) return null;
  return ctx.workspace.readJson<Manifest>("product/manifest.json").files.find((f) => f.kind === "guide_chapter")?.path ?? null;
}

function mockReview(target: "product" | "growth", iteration: number, chapter: string | null) {
  if (target === "product" && iteration === 0) {
    return {
      verdict: "reject" as const,
      score: 64,
      summary: "Simulado: el primer capítulo carece de un ejemplo aplicado al mercado objetivo.",
      valueProposition: "Promete un sistema, pero el capítulo 1 se queda en teoría.",
      defects: [
        {
          severity: "major" as const,
          file: chapter,
          issue: "No incluye un ejemplo aplicado al mercado objetivo.",
          fix: "Agregar una sección '### Ejemplo aplicado' con un caso ilustrativo.",
        },
      ],
    };
  }
  return {
    verdict: "approve" as const,
    score: 86,
    summary: "Simulado: cumple los criterios de aceptación.",
    valueProposition: "Sistema completo y accionable por un precio de impulso.",
    defects: [],
  };
}
