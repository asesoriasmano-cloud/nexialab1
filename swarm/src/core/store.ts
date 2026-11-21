import fs from "node:fs";
import path from "node:path";
import { config } from "../config.ts";
import type { Approval, Run, SwarmEvent, SwarmState, Task } from "./types.ts";

/**
 * Almacén de estado en un archivo JSON local (state/swarm.json).
 * - Escritura atómica (archivo temporal + rename) para no corromper el estado si el proceso muere.
 * - Exporta además state/tasks.json (vista resumida y legible de las tareas).
 * Se eligió JSON en lugar de SQLite para no depender de módulos nativos: corre igual en Windows/macOS/Linux.
 */
export class Store {
  private state: SwarmState;

  constructor(private readonly file: string = config.stateFile) {
    this.state = Store.load(file);
  }

  private static load(file: string): SwarmState {
    if (!fs.existsSync(file)) return { version: 1, seq: 0, tasks: [], runs: [], approvals: [], events: [] };
    const parsed = JSON.parse(fs.readFileSync(file, "utf8")) as SwarmState;
    if (parsed.version !== 1) throw new Error(`Versión de estado no soportada en ${file}`);
    return parsed;
  }

  save(): void {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.state, null, 2));
    fs.renameSync(tmp, this.file);
    if (this.file === config.stateFile) {
      const summary = this.state.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        stage: t.stage,
        status: t.status,
        dryRun: t.dryRun,
        spentUsd: Number(this.spentUsd(t.id).toFixed(4)),
        budgetUsd: t.budgetUsd,
        iterations: t.iterations,
        updatedAt: t.updatedAt,
      }));
      fs.writeFileSync(config.tasksExport, JSON.stringify(summary, null, 2));
    }
  }

  nextId(prefix: string): string {
    this.state.seq += 1;
    return `${prefix}${String(this.state.seq).padStart(4, "0")}`;
  }

  // ---- tareas ----
  addTask(task: Task): Task {
    this.state.tasks.push(task);
    this.save();
    return task;
  }

  getTask(id: string): Task {
    const t = this.state.tasks.find((x) => x.id === id);
    if (!t) throw new Error(`No existe la tarea ${id}. Usa \`swarm status\` para ver las tareas.`);
    return t;
  }

  listTasks(): Task[] {
    return [...this.state.tasks];
  }

  updateTask(id: string, patch: Partial<Task>): Task {
    const t = this.getTask(id);
    Object.assign(t, patch, { updatedAt: new Date().toISOString() });
    this.save();
    return t;
  }

  // ---- ejecuciones de agentes ----
  addRun(run: Run): Run {
    this.state.runs.push(run);
    this.save();
    return run;
  }

  updateRun(id: string, patch: Partial<Run>): void {
    const r = this.state.runs.find((x) => x.id === id);
    if (!r) throw new Error(`No existe la ejecución ${id}`);
    Object.assign(r, patch);
    this.save();
  }

  runsFor(taskId: string): Run[] {
    return this.state.runs.filter((r) => r.taskId === taskId);
  }

  spentUsd(taskId: string): number {
    return this.runsFor(taskId).reduce((acc, r) => acc + r.costUsd, 0);
  }

  // ---- aprobaciones (HITL) ----
  addApproval(a: Approval): Approval {
    this.state.approvals.push(a);
    this.save();
    return a;
  }

  approvalsFor(taskId: string): Approval[] {
    return this.state.approvals.filter((a) => a.taskId === taskId);
  }

  pendingApprovals(): Approval[] {
    return this.state.approvals.filter((a) => a.status === "pending");
  }

  findApproval(taskId: string, key: string): Approval | undefined {
    // la más reciente para esa clave
    return [...this.approvalsFor(taskId)].reverse().find((a) => a.key === key);
  }

  decideApproval(id: string, status: "approved" | "rejected", note: string | null, amountUsd?: number): Approval {
    const a = this.state.approvals.find((x) => x.id === id);
    if (!a) throw new Error(`No existe la aprobación ${id}`);
    a.status = status;
    a.note = note;
    a.decidedAt = new Date().toISOString();
    if (amountUsd !== undefined) a.amountUsd = amountUsd;
    this.save();
    return a;
  }

  // ---- eventos / logs ----
  addEvent(e: SwarmEvent): void {
    this.state.events.push(e);
    // limitamos el histórico en el estado; el log completo vive en logs/swarm.log
    if (this.state.events.length > 2000) this.state.events.splice(0, this.state.events.length - 2000);
    this.save();
  }

  eventsFor(taskId: string): SwarmEvent[] {
    return this.state.events.filter((e) => e.taskId === taskId);
  }
}
