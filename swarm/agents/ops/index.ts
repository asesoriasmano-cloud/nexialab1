import { complete } from "../../src/core/llm.ts";
import type { Store } from "../../src/core/store.ts";
import type { Defect } from "../../src/core/types.ts";
import { Workspace } from "../../src/core/workspace.ts";
import { OpsInsightsSchema, type OpsInsights } from "../../src/schemas.ts";
import { loadSystemPrompt, type AgentContext } from "../shared/context.ts";

export interface TaskMetrics {
  taskId: string;
  title: string;
  stage: string;
  status: string;
  dryRun: boolean;
  cost: { spentUsd: number; budgetUsd: number; usedPct: number };
  tokens: { input: number; output: number; cacheRead: number; cacheWrite: number };
  byAgent: Record<string, { runs: number; failed: number; costUsd: number; inputTokens: number; outputTokens: number; durationMs: number }>;
  iterations: { research: number; build: number; growth: number };
  qa: Array<{ target: string; iteration: number; verdict: string; score: number }>;
  topDefects: Array<{ issue: string; count: number }>;
  approvals: Array<{ gate: string; status: string; summary: string }>;
  market: null | { visits: number; sales: number; revenueUsd: number; refunds: number; conversionPct: number; netUsd: number };
}

/** Métricas determinísticas de una tarea (sin LLM, sin costo). */
export function buildMetrics(store: Store, taskId: string): TaskMetrics {
  const task = store.getTask(taskId);
  const runs = store.runsFor(taskId);
  const byAgent: TaskMetrics["byAgent"] = {};
  const tokens = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  for (const r of runs) {
    const a = (byAgent[r.agent] ??= { runs: 0, failed: 0, costUsd: 0, inputTokens: 0, outputTokens: 0, durationMs: 0 });
    a.runs += 1;
    if (r.status === "failed") a.failed += 1;
    a.costUsd += r.costUsd;
    a.inputTokens += r.inputTokens;
    a.outputTokens += r.outputTokens;
    a.durationMs += r.durationMs;
    tokens.input += r.inputTokens;
    tokens.output += r.outputTokens;
    tokens.cacheRead += r.cacheReadTokens;
    tokens.cacheWrite += r.cacheWriteTokens;
  }
  const spent = store.spentUsd(taskId);

  // Defectos más frecuentes a partir de los reportes de QA guardados.
  const ws = new Workspace(taskId);
  const counts = new Map<string, number>();
  for (const rel of ws.list("reports").filter((p) => /reports\/qa-/.test(p))) {
    const report = ws.readJson<{ defects: Defect[] }>(rel);
    for (const d of report.defects) {
      if (d.severity === "minor") continue;
      const key = d.issue.slice(0, 120);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const m = task.market;
  return {
    taskId,
    title: task.title,
    stage: task.stage,
    status: task.status,
    dryRun: task.dryRun,
    cost: { spentUsd: round(spent), budgetUsd: task.budgetUsd, usedPct: round((spent / task.budgetUsd) * 100, 1) },
    tokens,
    byAgent: Object.fromEntries(Object.entries(byAgent).map(([k, v]) => [k, { ...v, costUsd: round(v.costUsd) }])),
    iterations: task.iterations,
    qa: task.qaHistory.map((q) => ({ target: q.target, iteration: q.iteration, verdict: q.verdict, score: q.score })),
    topDefects: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([issue, count]) => ({ issue, count })),
    approvals: store.approvalsFor(taskId).map((a) => ({ gate: a.gate, status: a.status, summary: a.summary })),
    market: m
      ? {
          ...m,
          conversionPct: m.visits > 0 ? round((m.sales / m.visits) * 100, 2) : 0,
          netUsd: round(m.revenueUsd - spent),
        }
      : null,
  };
}

/** Recomendaciones por reglas, siempre disponibles (y gratis). */
export function heuristicRecommendations(m: TaskMetrics): OpsInsights["recommendations"] {
  const recs: OpsInsights["recommendations"] = [];
  if (m.iterations.build >= 2) {
    recs.push({
      priority: "alta",
      area: "proceso",
      action: "Subir EFFORT_BUILDER a high o reforzar agents/builder/system.md con los defectos recurrentes.",
      rationale: `QA vetó el producto ${m.iterations.build} veces.`,
    });
  }
  if (m.cost.usedPct >= 80) {
    recs.push({
      priority: "alta",
      area: "costos",
      action: "Bajar el effort de builder/growth o reducir KIT_MAX_FILES para el próximo producto.",
      rationale: `Se usó el ${m.cost.usedPct}% del presupuesto de la tarea.`,
    });
  }
  if (m.stage === "done" && !m.market) {
    recs.push({
      priority: "alta",
      area: "distribucion",
      action: "Publicar las piezas de marketing/social.md durante 2 semanas y registrar visitas y ventas con `swarm metrics`.",
      rationale: "El producto está publicado y aún no hay datos de mercado.",
    });
  }
  if (m.market && m.market.visits >= 200) {
    if (m.market.conversionPct < 1) {
      recs.push({ priority: "alta", area: "landing", action: "Reescribir el hero y la oferta de la landing; probar un precio menor.", rationale: `Conversión de ${m.market.conversionPct}% con ${m.market.visits} visitas.` });
    } else if (m.market.conversionPct >= 3) {
      recs.push({ priority: "alta", area: "distribucion", action: "Escalar tráfico (más contenido, colaboraciones) y crear un producto complementario de mayor ticket.", rationale: `Conversión de ${m.market.conversionPct}%.` });
    }
  }
  if (m.market && m.market.sales > 0 && m.market.refunds / m.market.sales > 0.1) {
    recs.push({ priority: "alta", area: "producto", action: "Revisar el contenido contra lo que promete la landing; los reembolsos indican expectativa no cumplida.", rationale: `${m.market.refunds} reembolsos de ${m.market.sales} ventas.` });
  }
  return recs;
}

/** Ops & Metrics: métricas + recomendaciones por reglas, y opcionalmente análisis del modelo (--insights). */
export async function runOps(ctx: AgentContext, opts: { insights: boolean }): Promise<{ metrics: TaskMetrics; insights: OpsInsights }> {
  const metrics = buildMetrics(ctx.store, ctx.task.id);
  const heuristics = heuristicRecommendations(metrics);
  let insights: OpsInsights = { summary: summarize(metrics), recommendations: heuristics };

  if (opts.insights) {
    const { data } = await complete(ctx, {
      agent: "ops",
      system: loadSystemPrompt("ops"),
      prompt: `Métricas de la tarea:\n${JSON.stringify(metrics, null, 2)}\n\nRecomendaciones por reglas ya detectadas:\n${JSON.stringify(heuristics, null, 2)}\n\nPropón las próximas iteraciones priorizadas.`,
      schema: OpsInsightsSchema,
      maxTokens: 16000,
      expectedOutputTokens: 2500,
      mock: () => ({ summary: `${summarize(metrics)} (análisis simulado)`, recommendations: heuristics }),
    });
    insights = { summary: data.summary, recommendations: [...heuristics, ...data.recommendations] };
  }

  ctx.workspace.writeJson("reports/ops.json", { metrics, insights, generatedAt: new Date().toISOString() });
  ctx.workspace.write("reports/ops.md", renderOpsMarkdown(metrics, insights));
  return { metrics, insights };
}

function summarize(m: TaskMetrics): string {
  return `Tarea ${m.taskId} en etapa ${m.stage} (${m.status}). Costo US$${m.cost.spentUsd} de US$${m.cost.budgetUsd} (${m.cost.usedPct}%). Iteraciones: build ${m.iterations.build}, growth ${m.iterations.growth}.`;
}

export function renderOpsMarkdown(m: TaskMetrics, insights: OpsInsights): string {
  const agents = Object.entries(m.byAgent)
    .map(([a, v]) => `| ${a} | ${v.runs} | ${v.failed} | ${v.inputTokens} | ${v.outputTokens} | ${v.costUsd.toFixed(4)} | ${(v.durationMs / 1000).toFixed(1)} |`)
    .join("\n");
  return `# Reporte de Ops: ${m.title}

${insights.summary}

## Costos por agente
| Agente | Runs | Fallidos | Tokens entrada | Tokens salida | Costo USD | Duración (s) |
|---|---|---|---|---|---|---|
${agents || "| (sin ejecuciones) | | | | | | |"}

**Total:** US$${m.cost.spentUsd} de US$${m.cost.budgetUsd} aprobados (${m.cost.usedPct}%)${m.dryRun ? " · modo simulado (dry-run)" : ""}

## QA
${m.qa.map((q) => `- ${q.target} #${q.iteration}: ${q.verdict} (score ${q.score})`).join("\n") || "- sin revisiones"}

## Defectos más frecuentes
${m.topDefects.map((d) => `- (${d.count}x) ${d.issue}`).join("\n") || "- ninguno"}

## Mercado
${m.market ? `Visitas ${m.market.visits} · Ventas ${m.market.sales} · Conversión ${m.market.conversionPct}% · Ingresos US$${m.market.revenueUsd} · Reembolsos ${m.market.refunds} · Neto después del costo LLM US$${m.market.netUsd}` : "Sin datos. Regístralos con `swarm metrics <id> --visits N --sales N --revenue N`."}

## Próximas iteraciones recomendadas
${insights.recommendations.map((r) => `- **[${r.priority}] ${r.area}:** ${r.action} _(${r.rationale})_`).join("\n") || "- Sin recomendaciones por ahora."}
`;
}

function round(n: number, d = 4): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}
