import type { GateKind } from "./types.ts";

/** El flujo debe pausarse hasta que un humano decida en un gate HITL. */
export class GatePendingError extends Error {
  constructor(public readonly gate: GateKind, public readonly approvalId: string, message: string) {
    super(message);
    this.name = "GatePendingError";
  }
}

/** La siguiente llamada superaría el presupuesto aprobado (gate #2). */
export class BudgetExceededError extends Error {
  constructor(
    public readonly spentUsd: number,
    public readonly estimateUsd: number,
    public readonly budgetUsd: number,
  ) {
    super(
      `Presupuesto insuficiente: gastado US$${spentUsd.toFixed(4)} + estimado US$${estimateUsd.toFixed(4)} > aprobado US$${budgetUsd.toFixed(2)}`,
    );
    this.name = "BudgetExceededError";
  }
}

/** El modelo rechazó la solicitud (stop_reason = refusal) incluso tras los fallbacks. */
export class RefusalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RefusalError";
  }
}

/** La respuesta se cortó por max_tokens o no cumplió el schema esperado. */
export class OutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OutputError";
  }
}
