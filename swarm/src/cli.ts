#!/usr/bin/env -S npx tsx
import { Command } from "commander";
import { runBuilder } from "../agents/builder/index.ts";
import { runGrowth } from "../agents/growth/index.ts";
import { runOps } from "../agents/ops/index.ts";
import { runQa } from "../agents/qa/index.ts";
import { runScout } from "../agents/scout/index.ts";
import { config, hasApiCredentials, type AgentName } from "./config.ts";
import { decide } from "./core/gates.ts";
import { Logger } from "./core/logger.ts";
import { shareTask } from "./core/share.ts";
import { Store } from "./core/store.ts";
import type { Task } from "./core/types.ts";
import { Workspace } from "./core/workspace.ts";
import { gateTitle, Orchestrator } from "./orchestrator.ts";
import type { Brief } from "./schemas.ts";

const program = new Command();
program
  .name("swarm")
  .description("Enjambre de agentes: investiga, construye, audita, empaqueta y lanza productos digitales.")
  .showHelpAfterError();

function setup(opts: { interactive?: boolean; yes?: boolean } = {}) {
  const store = new Store();
  const logger = new Logger(store);
  return { store, logger, orchestrator: new Orchestrator(store, logger, { interactive: opts.interactive, autoApprove: opts.yes }) };
}

function requireCredentials(dryRun: boolean) {
  if (!dryRun && !hasApiCredentials()) {
    console.error("Falta ANTHROPIC_API_KEY en swarm/.env. Para probar sin gastar usa --dry-run.");
    process.exit(1);
  }
}

function printSummary(store: Store, task: Task) {
  const spent = store.spentUsd(task.id);
  console.log(
    `\n${task.id} · ${task.title}\n  etapa: ${task.stage} · estado: ${task.status}${task.dryRun ? " · dry-run" : ""}\n  costo: US$${spent.toFixed(4)} / US$${task.budgetUsd.toFixed(2)} · iteraciones build ${task.iterations.build}, growth ${task.iterations.growth}`,
  );
  if (task.lastError) console.log(`  último error: ${task.lastError}`);
  if (task.deployUrl) console.log(`  publicado en: ${task.deployUrl}`);
  console.log(`  archivos: ${new Workspace(task.id).dir}`);
}

// ---------------- run ----------------
program
  .command("run")
  .description("Crea una tarea nueva o reanuda una existente (--task) y avanza hasta el próximo gate. Sin --niche, el Scout explora oportunidades libremente.")
  .option("-n, --niche <texto>", "semilla opcional: punto de partida para explorar, no un límite")
  .option("-t, --task <id>", "reanudar una tarea existente")
  .option("--dry-run", "simula todos los agentes sin llamadas a la API (costo US$0)")
  .option("-i, --interactive", "preguntar s/n en cada gate en lugar de pausar")
  .option("-y, --yes", "auto-aprobar gates (solo permitido con --dry-run)")
  .action(async (opts: { niche?: string; task?: string; dryRun?: boolean; interactive?: boolean; yes?: boolean }) => {
    const { store, orchestrator } = setup(opts);
    if (opts.yes && opts.task && !store.getTask(opts.task).dryRun) throw new Error("--yes solo se permite en tareas --dry-run.");
    if (opts.yes && !opts.task && !opts.dryRun) throw new Error("--yes solo se permite junto con --dry-run.");
    const task = opts.task ? store.getTask(opts.task) : orchestrator.createTask(opts.niche ?? "", Boolean(opts.dryRun));
    requireCredentials(task.dryRun);
    const result = await orchestrator.run(task.id);
    printSummary(store, result);
  });

// ---------------- agent ----------------
program
  .command("agent <nombre>")
  .description("Ejecuta un solo agente (scout | builder | qa | growth | ops) sin avanzar la máquina de estados.")
  .option("-t, --task <id>", "tarea sobre la que trabajar")
  .option("-n, --niche <texto>", "solo scout: semilla opcional al crear una tarea nueva")
  .option("--target <product|growth>", "solo qa: qué auditar", "product")
  .option("--insights", "solo ops: agrega el análisis del modelo (consume tokens)")
  .option("--dry-run", "simular (solo al crear una tarea nueva con scout)")
  .action(async (name: string, opts: { task?: string; niche?: string; target: "product" | "growth"; insights?: boolean; dryRun?: boolean }) => {
    const agents: AgentName[] = ["scout", "builder", "qa", "growth", "ops"];
    if (!agents.includes(name as AgentName)) throw new Error(`Agente desconocido "${name}". Opciones: ${agents.join(", ")}`);
    const agent = name as AgentName;
    const { store, orchestrator } = setup();

    let task: Task;
    if (opts.task) task = store.getTask(opts.task);
    else if (agent === "scout") task = orchestrator.createTask(opts.niche ?? "", Boolean(opts.dryRun));
    else throw new Error("Indica --task <id>.");
    requireCredentials(task.dryRun || agent === "ops");

    const ws = new Workspace(task.id);
    const brief = () => {
      if (!ws.exists("brief.json")) throw new Error("La tarea aún no tiene brief.json: ejecuta primero el scout.");
      return ws.readJson<Brief>("brief.json");
    };

    switch (agent) {
      case "scout":
        await orchestrator.withRun(task.id, "scout", (ctx) => runScout(ctx, { niche: task.niche, feedback: task.feedback }));
        store.updateTask(task.id, {
          iterations: { ...task.iterations, research: task.iterations.research + 1 },
          stage: "concept_gate",
          status: "review",
          feedback: null,
        });
        console.log(`Brief en ${ws.path("brief.md")}. Continúa con: npm run swarm -- run --task ${task.id}`);
        break;
      case "builder":
        await orchestrator.withRun(task.id, "builder", (ctx) => runBuilder(ctx, { brief: brief(), feedback: task.feedback }));
        break;
      case "qa": {
        const r = await orchestrator.withRun(task.id, "qa", (ctx) =>
          runQa(ctx, { target: opts.target, brief: brief(), iteration: task.iterations[opts.target === "product" ? "build" : "growth"] }),
        );
        console.log(`Veredicto: ${r.verdict} (score ${r.score}). Reporte: ${ws.path(r.reportPath)}`);
        break;
      }
      case "growth":
        await orchestrator.withRun(task.id, "growth", (ctx) => runGrowth(ctx, { brief: brief(), feedback: task.feedback }));
        break;
      case "ops": {
        if (opts.insights) requireCredentials(task.dryRun);
        await orchestrator.withRun(task.id, "ops", (ctx) => runOps(ctx, { insights: Boolean(opts.insights) }));
        console.log(ws.read("reports/ops.md"));
        break;
      }
    }
    printSummary(store, store.getTask(task.id));
  });

// ---------------- approve / reject ----------------
function pendingFor(store: Store, taskId: string, gate?: string) {
  const pending = store.pendingApprovals().filter((a) => a.taskId === taskId && (!gate || a.gate === gate));
  if (pending.length === 0) throw new Error(`La tarea ${taskId} no tiene aprobaciones pendientes${gate ? ` del gate "${gate}"` : ""}.`);
  return pending[pending.length - 1]!;
}

program
  .command("approve <taskId>")
  .description("Aprueba el gate pendiente de una tarea y reanuda el flujo.")
  .option("-g, --gate <concept|spend|deploy>", "qué gate aprobar (por defecto, el último pendiente)")
  .option("-a, --amount <usd>", "gate de gasto: monto aprobado en USD", parseFloat)
  .option("--note <texto>", "comentario opcional")
  .option("--no-resume", "solo registrar la decisión, sin continuar el flujo")
  .action(async (taskId: string, opts: { gate?: string; amount?: number; note?: string; resume: boolean }) => {
    const { store, orchestrator } = setup();
    const approval = pendingFor(store, taskId, opts.gate);
    decide(store, approval, "approved", opts.note ?? null, opts.amount ?? approval.amountUsd ?? undefined);
    console.log(`✔ ${gateTitle(approval)}: aprobado.`);
    if (opts.resume) {
      const task = store.getTask(taskId);
      requireCredentials(task.dryRun);
      printSummary(store, await orchestrator.run(taskId));
    }
  });

program
  .command("reject <taskId>")
  .description("Rechaza el gate pendiente. En el concepto, el Scout reintenta con tu nota como feedback.")
  .option("-g, --gate <concept|spend|deploy>", "qué gate rechazar")
  .option("--note <texto>", "qué cambiar (se envía como feedback al agente)")
  .option("--no-resume", "solo registrar la decisión, sin continuar el flujo")
  .action(async (taskId: string, opts: { gate?: string; note?: string; resume: boolean }) => {
    const { store, orchestrator } = setup();
    const approval = pendingFor(store, taskId, opts.gate);
    decide(store, approval, "rejected", opts.note ?? null);
    console.log(`✖ ${gateTitle(approval)}: rechazado.`);
    if (opts.resume) {
      const task = store.getTask(taskId);
      requireCredentials(task.dryRun);
      printSummary(store, await orchestrator.run(taskId));
    }
  });

// ---------------- retry ----------------
program
  .command("retry <taskId>")
  .description("Reinicia el contador de iteraciones de una tarea fallida por el límite de QA y la reanuda.")
  .action(async (taskId: string) => {
    const { store, orchestrator } = setup();
    const task = store.getTask(taskId);
    if (task.status !== "failed") throw new Error(`La tarea ${taskId} no está en estado failed (está en ${task.status}).`);
    const patch: Partial<Task> = { status: "pending", lastError: null };
    if (task.stage === "qa") Object.assign(patch, { stage: "build", iterations: { ...task.iterations, build: 0 } });
    if (task.stage === "growth_qa") Object.assign(patch, { stage: "growth", iterations: { ...task.iterations, growth: 0 } });
    store.updateTask(taskId, patch);
    requireCredentials(task.dryRun);
    printSummary(store, await orchestrator.run(taskId));
  });

// ---------------- status / approvals ----------------
program
  .command("status [taskId]")
  .description("Muestra el estado de todas las tareas o el detalle de una.")
  .action((taskId?: string) => {
    const { store } = setup();
    if (taskId) {
      const task = store.getTask(taskId);
      printSummary(store, task);
      const pending = store.pendingApprovals().filter((a) => a.taskId === taskId);
      for (const a of pending) console.log(`  ⏸ ${gateTitle(a)} [${a.id}]: ${a.summary}`);
      console.log("\n  Ejecuciones:");
      for (const r of store.runsFor(taskId)) {
        console.log(`   ${r.id} ${r.agent.padEnd(8)} ${r.status.padEnd(11)} US$${r.costUsd.toFixed(4)}  in ${r.inputTokens} / out ${r.outputTokens}${r.note ? `  (${r.note.slice(0, 80)})` : ""}`);
      }
      return;
    }
    const tasks = store.listTasks();
    if (tasks.length === 0) return console.log("Sin tareas. Crea una con: npm run swarm -- run [--niche \"semilla\"] [--dry-run]");
    console.log("ID      ETAPA         ESTADO              COSTO      TÍTULO");
    for (const t of tasks) {
      console.log(
        `${t.id.padEnd(7)} ${t.stage.padEnd(13)} ${t.status.padEnd(19)} US$${store.spentUsd(t.id).toFixed(3).padStart(6)} ${t.title}${t.dryRun ? " (dry-run)" : ""}`,
      );
    }
  });

program
  .command("approvals")
  .description("Lista las decisiones humanas pendientes (gates HITL).")
  .action(() => {
    const { store } = setup();
    const pending = store.pendingApprovals();
    if (pending.length === 0) return console.log("No hay aprobaciones pendientes.");
    for (const a of pending) console.log(`${a.taskId} [${a.id}] ${gateTitle(a)}\n   ${a.summary}\n`);
  });

// ---------------- report / metrics ----------------
program
  .command("report <taskId>")
  .description("Reporte de Ops: costos, tokens, iteraciones, QA y próximas iteraciones recomendadas.")
  .option("--insights", "agrega el análisis del modelo (consume tokens del presupuesto)")
  .action(async (taskId: string, opts: { insights?: boolean }) => {
    const { store, orchestrator } = setup();
    const task = store.getTask(taskId);
    if (opts.insights) requireCredentials(task.dryRun);
    await orchestrator.withRun(taskId, "ops", (ctx) => runOps(ctx, { insights: Boolean(opts.insights) }));
    console.log(new Workspace(taskId).read("reports/ops.md"));
  });

program
  .command("metrics <taskId>")
  .description("Registra datos reales de mercado (visitas, ventas, ingresos) para que Ops proponga iteraciones.")
  .requiredOption("--visits <n>", "visitas a la landing", parseInt)
  .requiredOption("--sales <n>", "ventas", parseInt)
  .requiredOption("--revenue <usd>", "ingresos en USD", parseFloat)
  .option("--refunds <n>", "reembolsos", parseInt, 0)
  .action(async (taskId: string, opts: { visits: number; sales: number; revenue: number; refunds: number }) => {
    const { store, orchestrator } = setup();
    store.updateTask(taskId, { market: { visits: opts.visits, sales: opts.sales, revenueUsd: opts.revenue, refunds: opts.refunds } });
    await orchestrator.withRun(taskId, "ops", (ctx) => runOps(ctx, { insights: false }));
    console.log(new Workspace(taskId).read("reports/ops.md"));
  });

program
  .command("share <taskId>")
  .description("Sube a la rama actual los resultados de una tarea (brief, kit, reportes) para revisarlos con un git pull. Nunca sube .env ni la clave.")
  .option("--no-push", "solo copiar a swarm/shared/<tarea>/ sin commitear ni subir")
  .action((taskId: string, opts: { push: boolean }) => {
    const { store } = setup();
    store.getTask(taskId); // valida que la tarea exista
    console.log(shareTask(taskId, { push: opts.push }).message);
  });

program
  .command("config")
  .description("Muestra la configuración efectiva (sin secretos).")
  .action(() => {
    const agents: AgentName[] = ["scout", "builder", "qa", "growth", "ops"];
    console.log(
      JSON.stringify(
        {
          apiKey: hasApiCredentials() ? "configurada" : "FALTA",
          budgetUsdPerTask: config.budgetUsdPerTask,
          maxIterations: config.maxIterations,
          models: Object.fromEntries(agents.map((a) => [a, `${config.llm.model(a)} (effort ${config.llm.effort(a)})`])),
          fallbacks: config.llm.fallbacks,
          scout: { ...config.scout },
          kit: config.kit,
          launch: { ...config.launch, checkoutUrl: config.launch.checkoutUrl || "(sin definir)" },
        },
        null,
        2,
      ),
    );
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  console.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
