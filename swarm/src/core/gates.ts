import readline from "node:readline/promises";
import { BudgetExceededError, GatePendingError } from "./errors.ts";
import type { Store } from "./store.ts";
import type { Approval, GateKind, Task } from "./types.ts";

/**
 * Human-in-the-Loop estratégico. Solo existen 3 gates:
 *   concept → aprobar el concepto de producto antes de construirlo
 *   spend   → gasto real / APIs de pago externas / superar el presupuesto preaprobado
 *   deploy  → despliegue público o publicación en pasarela de pagos
 *
 * requireApproval() es idempotente por `key`: si ya hay una decisión, la devuelve;
 * si no, crea la solicitud y lanza GatePendingError para que el orquestador pause.
 */
export function requireApproval(
  store: Store,
  task: Task,
  req: { gate: GateKind; key: string; summary: string; amountUsd?: number },
): Approval {
  const existing = store.findApproval(task.id, req.key);
  if (existing?.status === "approved" || existing?.status === "rejected") return existing;
  if (existing?.status === "pending") {
    throw new GatePendingError(req.gate, existing.id, existing.summary);
  }
  const approval = store.addApproval({
    id: store.nextId("A"),
    taskId: task.id,
    gate: req.gate,
    key: req.key,
    status: "pending",
    summary: req.summary,
    amountUsd: req.amountUsd ?? null,
    note: null,
    requestedAt: new Date().toISOString(),
    decidedAt: null,
  });
  throw new GatePendingError(req.gate, approval.id, req.summary);
}

/** Lanza BudgetExceededError si la llamada estimada superaría el presupuesto aprobado de la tarea. */
export function ensureBudget(store: Store, task: Task, estimateUsd: number): void {
  const spent = store.spentUsd(task.id);
  if (spent + estimateUsd > task.budgetUsd) {
    throw new BudgetExceededError(spent, estimateUsd, task.budgetUsd);
  }
}

/** Aplica la decisión humana sobre una aprobación y sus efectos colaterales (p. ej. ampliar presupuesto). */
export function decide(
  store: Store,
  approval: Approval,
  decision: "approved" | "rejected",
  note: string | null,
  amountUsd?: number,
): Approval {
  const decided = store.decideApproval(approval.id, decision, note, amountUsd);
  if (decision === "approved" && decided.key.startsWith("spend:budget")) {
    const task = store.getTask(decided.taskId);
    store.updateTask(task.id, { budgetUsd: task.budgetUsd + (decided.amountUsd ?? 0) });
  }
  return decided;
}

/** Pregunta de texto libre por terminal. Enter vacío devuelve "". */
export async function askText(question: string): Promise<string> {
  if (!process.stdin.isTTY) return "";
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(`${question} `)).trim();
  } finally {
    rl.close();
  }
}

/** Pregunta s/n por terminal (modo interactivo). */
export async function askYesNo(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (await rl.question(`${question} [s/N] `)).trim().toLowerCase();
    return answer === "s" || answer === "si" || answer === "sí" || answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}
