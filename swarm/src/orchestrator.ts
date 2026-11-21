import { runBuilder } from "../agents/builder/index.ts";
import { runGrowth } from "../agents/growth/index.ts";
import { runOps } from "../agents/ops/index.ts";
import { runQa, type QaResult } from "../agents/qa/index.ts";
import { runScout } from "../agents/scout/index.ts";
import type { AgentContext } from "../agents/shared/context.ts";
import { config, type AgentName } from "./config.ts";
import { BudgetExceededError, GatePendingError } from "./core/errors.ts";
import { askText, askYesNo, decide, requireApproval } from "./core/gates.ts";
import { conceptSummary, type BriefIssue } from "./core/briefcheck.ts";
import { shareTask } from "./core/share.ts";
import { deploySite, packageTask } from "./core/launch.ts";
import type { Logger } from "./core/logger.ts";
import type { Store } from "./core/store.ts";
import type { Approval, Stage, Task } from "./core/types.ts";
import { Workspace } from "./core/workspace.ts";
import type { Brief } from "./schemas.ts";

export interface OrchestratorOptions {
  /** Pregunta s/n por terminal en cada gate en lugar de pausar. */
  interactive?: boolean;
  /** Aprueba gates automáticamente. Solo permitido en tareas --dry-run (pruebas y demos). */
  autoApprove?: boolean;
}

type StepResult = "continue" | "stop";

/**
 * Orquestador central: máquina de estados por etapas.
 *
 *   research → concept_gate(HITL#1) → build ⇄ qa (máx. N) → growth ⇄ growth_qa (máx. N)
 *   → package → deploy_gate(HITL#3) → deploy → done
 *
 * El gate HITL#2 (gasto) puede saltar en cualquier etapa: presupuesto insuficiente o API de pago externa.
 * Cada paso persiste en el estado, así que el flujo es reanudable con `swarm run --task <id>`.
 */
export class Orchestrator {
  constructor(
    private readonly store: Store,
    private readonly logger: Logger,
    private readonly opts: OrchestratorOptions = {},
  ) {}

  /** `niche` vacío = exploración abierta (el Scout busca oportunidades en cualquier mercado y segmento). */
  createTask(niche: string, dryRun: boolean): Task {
    const now = new Date().toISOString();
    niche = niche.trim();
    const task = this.store.addTask({
      id: this.store.nextId("T"),
      title: niche ? niche.slice(0, 80) : "Exploración abierta",
      niche,
      productType: "digital-kit",
      stage: "research",
      status: "pending",
      dryRun,
      budgetUsd: config.budgetUsdPerTask,
      iterations: { research: 0, build: 0, growth: 0 },
      feedback: null,
      qaHistory: [],
      market: null,
      deployUrl: null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    });
    this.logger.info("orchestrator", task.id, `Tarea creada${dryRun ? " (dry-run)" : ""}: ${niche ? `semilla "${niche}"` : "exploración abierta de oportunidades"}. Presupuesto US$${task.budgetUsd}.`);
    return task;
  }

  /** Avanza la tarea hasta que termine, falle o requiera una decisión humana. Con SWARM_AUTO_SHARE, sube los resultados al terminar. */
  async run(taskId: string): Promise<Task> {
    try {
      return await this.runInner(taskId);
    } finally {
      this.autoShare(taskId);
    }
  }

  private autoShare(taskId: string): void {
    if (!config.autoShare || this.store.getTask(taskId).dryRun) return;
    try {
      this.logger.info("orchestrator", taskId, shareTask(taskId, { push: true }).message);
    } catch (e) {
      this.logger.warn("orchestrator", taskId, `No se pudieron compartir los resultados: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  private async runInner(taskId: string): Promise<Task> {
    if (this.opts.autoApprove && !this.store.getTask(taskId).dryRun) {
      throw new Error("--yes (auto-aprobación) solo se permite en tareas --dry-run. Los gates reales requieren tu decisión.");
    }
    for (let guard = 0; guard < 100; guard++) {
      const task = this.store.getTask(taskId);
      if (task.stage === "done") return task;
      try {
        if ((await this.step(task)) === "stop") return this.store.getTask(taskId);
      } catch (caught) {
        const err = caught instanceof BudgetExceededError ? this.budgetGate(task, caught) : caught;
        if (err instanceof GatePendingError) {
          this.store.updateTask(taskId, { status: "awaiting_approval" });
          if (await this.resolveGate(taskId, err)) continue;
          this.printGate(taskId, err);
          return this.store.getTask(taskId);
        }
        const message = err instanceof Error ? err.message : String(err);
        this.store.updateTask(taskId, { status: "failed", lastError: message });
        this.logger.error("orchestrator", taskId, `Falló la etapa ${task.stage}: ${message}`);
        this.logger.info("orchestrator", taskId, `Corrige la causa y reanuda con: npm run swarm -- run --task ${taskId}`);
        return this.store.getTask(taskId);
      }
    }
    throw new Error("Demasiados pasos en una sola ejecución (posible bucle).");
  }

  private async step(task: Task): Promise<StepResult> {
    const ws = new Workspace(task.id);
    switch (task.stage) {
      case "research": {
        this.setStage(task.id, "research", "in_progress");
        await this.withRun(task.id, "scout", (ctx) => runScout(ctx, { niche: task.niche, feedback: task.feedback }));
        this.store.updateTask(task.id, {
          iterations: { ...task.iterations, research: task.iterations.research + 1 },
          feedback: null,
          stage: "concept_gate",
          status: "review",
        });
        return "continue";
      }

      case "concept_gate": {
        const brief = ws.readJson<Brief>("brief.json");
        const checks = ws.exists("brief-checks.json") ? ws.readJson<{ issues: BriefIssue[] }>("brief-checks.json").issues : [];
        const signals = ws.exists("signals.json") ? ws.readJson<Array<{ id: number; signalScore: number; commercialCount: number }>>("signals.json") : [];
        const sig = signals.find((s) => s.id === brief.opportunityId);
        const { text } = conceptSummary(brief, { signalScore: sig?.signalScore ?? null, commercial: sig?.commercialCount ?? null, remainingIssues: checks });
        const approval = requireApproval(this.store, task, {
          gate: "concept",
          key: `concept:${task.iterations.research}`,
          summary: `${text}\n   Detalle completo: ${ws.path("brief.md")}`,
        });
        if (approval.status === "approved") {
          this.store.updateTask(task.id, { title: brief.productName });
          this.setStage(task.id, "build", "pending");
          return "continue";
        }
        if (task.iterations.research >= config.maxResearchAttempts) {
          this.store.updateTask(task.id, { status: "failed", lastError: `Concepto rechazado ${task.iterations.research} veces.` });
          return "stop";
        }
        this.store.updateTask(task.id, {
          stage: "research",
          status: "pending",
          feedback: {
            from: "human",
            target: "research",
            summary: approval.note ?? "Concepto rechazado sin comentarios: propone un ángulo distinto.",
            defects: [],
          },
        });
        this.logger.info("orchestrator", task.id, "Concepto rechazado: el Market Scout investigará un nuevo ángulo.");
        return "continue";
      }

      case "build": {
        this.setStage(task.id, "build", "in_progress");
        const brief = ws.readJson<Brief>("brief.json");
        await this.withRun(task.id, "builder", (ctx) => runBuilder(ctx, { brief, feedback: task.feedback }));
        this.setStage(task.id, "qa", "review");
        return "continue";
      }

      case "qa":
        return this.review(task, ws, "product");

      case "growth": {
        this.setStage(task.id, "growth", "in_progress");
        const brief = ws.readJson<Brief>("brief.json");
        await this.withRun(task.id, "growth", (ctx) => runGrowth(ctx, { brief, feedback: task.feedback }));
        this.setStage(task.id, "growth_qa", "review");
        return "continue";
      }

      case "growth_qa":
        return this.review(task, ws, "growth");

      case "package": {
        const summary = packageTask(ws);
        this.logger.info("orchestrator", task.id, `Paquete listo: ${summary.zip} (${summary.files.length} archivos) y landing en ${summary.siteDir}.`);
        if (!summary.checkoutConfigured) {
          this.logger.warn("orchestrator", task.id, "CHECKOUT_URL no está configurada: defínela en .env antes de aprobar el despliegue.");
        }
        this.setStage(task.id, "deploy_gate", "review");
        return "continue";
      }

      case "deploy_gate": {
        const rejected = this.store.approvalsFor(task.id).filter((a) => a.gate === "deploy" && a.status === "rejected").length;
        const approval = requireApproval(this.store, task, {
          gate: "deploy",
          key: `deploy:${rejected}`,
          summary: `Publicar la landing (proveedor: ${config.launch.deployProvider}) y lanzar el producto. Revisa ${ws.path("dist/LAUNCH_CHECKLIST.md")}`,
        });
        if (approval.status === "approved") {
          this.setStage(task.id, "deploy", "approved");
          return "continue";
        }
        this.store.updateTask(task.id, {
          status: "failed",
          lastError: `Despliegue rechazado${approval.note ? `: ${approval.note}` : ""}. Ajusta y vuelve a pedirlo con \`swarm run --task ${task.id}\`.`,
        });
        return "stop";
      }

      case "deploy": {
        const result = deploySite(this.store, task, ws);
        this.logger.info("orchestrator", task.id, result.message);
        this.store.updateTask(task.id, { deployUrl: result.url, stage: "done", status: "approved", lastError: null });
        await this.withRun(task.id, "ops", (ctx) => runOps(ctx, { insights: false }));
        this.logger.info("orchestrator", task.id, `Ciclo completo. Reporte: ${ws.path("reports/ops.md")}`);
        return "stop";
      }

      case "done":
        return "stop";
    }
  }

  /** Revisión de QA con poder de veto y límite de iteraciones. */
  private async review(task: Task, ws: Workspace, target: "product" | "growth"): Promise<StepResult> {
    const brief = ws.readJson<Brief>("brief.json");
    const iterKey = target === "product" ? "build" : "growth";
    const iteration = task.iterations[iterKey];
    this.store.updateTask(task.id, { status: "in_progress" });
    const result: QaResult = await this.withRun(task.id, "qa", (ctx) => runQa(ctx, { target, brief, iteration }));
    const qaHistory = [...task.qaHistory, { target, iteration: result.iteration, verdict: result.verdict, score: result.score, at: new Date().toISOString() }];

    if (result.verdict === "approve") {
      this.store.updateTask(task.id, { qaHistory, feedback: null });
      this.setStage(task.id, target === "product" ? "growth" : "package", "approved");
      return "continue";
    }

    const rejections = iteration + 1;
    const iterations = { ...task.iterations, [iterKey]: rejections };
    if (rejections >= config.maxIterations) {
      this.store.updateTask(task.id, {
        qaHistory,
        iterations,
        status: "failed",
        lastError: `QA vetó ${target === "product" ? "el producto" : "el copy"} ${rejections} veces (límite MAX_ITERATIONS=${config.maxIterations}). Revisa ${ws.path(result.reportPath)}. Puedes ajustar los prompts y reanudar con \`swarm retry ${task.id}\`.`,
      });
      this.logger.error("orchestrator", task.id, `Límite de iteraciones alcanzado en ${target}. Se escala a revisión humana.`);
      await this.withRun(task.id, "ops", (ctx) => runOps(ctx, { insights: false }));
      return "stop";
    }
    this.store.updateTask(task.id, {
      qaHistory,
      iterations,
      feedback: { from: "qa", target, summary: result.summary, defects: result.defects },
    });
    this.setStage(task.id, target === "product" ? "build" : "growth", "pending");
    this.logger.info("orchestrator", task.id, `Veto de QA: vuelve a ${target === "product" ? "Builder" : "Growth"} (iteración ${rejections + 1}/${config.maxIterations}).`);
    return "continue";
  }

  /** Ejecuta un agente dentro de un "run" registrado (tokens, costo, duración, estado). */
  async withRun<T>(taskId: string, agent: AgentName, fn: (ctx: AgentContext) => Promise<T>): Promise<T> {
    const task = this.store.getTask(taskId);
    const run = this.store.addRun({
      id: this.store.nextId("R"),
      taskId,
      agent,
      stage: task.stage,
      status: "in_progress",
      model: task.dryRun ? "dry-run" : config.llm.model(agent),
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      webSearches: 0,
      costUsd: 0,
      durationMs: 0,
      note: null,
      startedAt: new Date().toISOString(),
      endedAt: null,
    });
    const started = Date.now();
    const ctx: AgentContext = { store: this.store, logger: this.logger, task, runId: run.id, workspace: new Workspace(taskId), dryRun: task.dryRun };
    try {
      const out = await fn(ctx);
      this.store.updateRun(run.id, { status: "approved", durationMs: Date.now() - started, endedAt: new Date().toISOString() });
      return out;
    } catch (err) {
      const pausedForHuman = err instanceof GatePendingError || err instanceof BudgetExceededError;
      this.store.updateRun(run.id, {
        status: pausedForHuman ? "review" : "failed",
        durationMs: Date.now() - started,
        endedAt: new Date().toISOString(),
        note: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  private setStage(taskId: string, stage: Stage, status: Task["status"]): void {
    this.store.updateTask(taskId, { stage, status });
  }

  /** Convierte un presupuesto insuficiente en una solicitud de gate #2 (reutiliza la pendiente si ya existe). */
  private budgetGate(task: Task, err: BudgetExceededError): GatePendingError {
    this.logger.warn("orchestrator", task.id, `Gate #2 (gasto): ${err.message}`);
    const budgetApprovals = this.store.approvalsFor(task.id).filter((a) => a.key.startsWith("spend:budget"));
    const pending = budgetApprovals.find((a) => a.status === "pending");
    if (pending) return new GatePendingError("spend", pending.id, pending.summary);
    const suggested = Math.max(1, Math.ceil(err.spentUsd + err.estimateUsd - err.budgetUsd + 1));
    try {
      requireApproval(this.store, task, {
        gate: "spend",
        key: `spend:budget:${budgetApprovals.length}`,
        summary: `${err.message}. Se sugiere ampliar el presupuesto en US$${suggested}.`,
        amountUsd: suggested,
      });
    } catch (e) {
      if (e instanceof GatePendingError) return e;
      throw e;
    }
    throw new Error("Estado inesperado al crear la solicitud de presupuesto");
  }

  /** Modo interactivo / auto-aprobación. Devuelve true si el gate quedó resuelto y se puede continuar. */
  private async resolveGate(taskId: string, err: GatePendingError): Promise<boolean> {
    const approval = this.store.pendingApprovals().find((a) => a.id === err.approvalId);
    if (!approval) return true; // ya se decidió
    if (this.opts.autoApprove) {
      decide(this.store, approval, "approved", "auto-aprobado (dry-run)");
      this.logger.info("orchestrator", taskId, `[dry-run] Gate "${approval.gate}" auto-aprobado.`);
      return true;
    }
    if (!this.opts.interactive) return false;
    console.log(`\n⏸  ${gateTitle(approval)}\n   ${approval.summary}`);
    const ok = await askYesNo("¿Apruebas?");
    let note: string | null = null;
    if (!ok) {
      note = (await askText(approval.gate === "concept" ? "¿Qué cambiar? (Enter = que el Scout proponga otro ángulo; o escribe p. ej. «usa la #3»):" : "Motivo (opcional):")) || "Rechazado en modo interactivo";
    }
    decide(this.store, approval, ok ? "approved" : "rejected", note);
    return true;
  }

  private printGate(taskId: string, err: GatePendingError): void {
    const approval = this.store.pendingApprovals().find((a) => a.id === err.approvalId);
    if (!approval) return;
    const amount = approval.amountUsd ? ` --amount ${approval.amountUsd}` : "";
    console.log(`\n⏸  ${gateTitle(approval)}  [${approval.id}]
   ${approval.summary}

   Aprobar:   npm run swarm -- approve ${taskId}${amount}
   Rechazar:  npm run swarm -- reject ${taskId} --note "qué cambiar"\n`);
  }
}

export function gateTitle(a: Approval): string {
  return {
    concept: "HITL #1 · Aprobación del concepto de producto",
    spend: "HITL #2 · Gasto de dinero real / API de pago",
    deploy: "HITL #3 · Despliegue público",
  }[a.gate];
}
