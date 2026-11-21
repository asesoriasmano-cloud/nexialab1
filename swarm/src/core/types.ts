import type { AgentName } from "../config.ts";

/** Estado de la tarea dentro de su etapa actual. */
export type TaskStatus =
  | "pending"
  | "in_progress"
  | "review"
  | "awaiting_approval"
  | "approved"
  | "failed";

/** Etapas de la máquina de estados del orquestador. */
export type Stage =
  | "research"
  | "concept_gate"
  | "build"
  | "qa"
  | "growth"
  | "growth_qa"
  | "package"
  | "deploy_gate"
  | "deploy"
  | "done";

export type GateKind = "concept" | "spend" | "deploy";

export interface Task {
  id: string;
  title: string;
  niche: string;
  productType: "digital-kit";
  stage: Stage;
  status: TaskStatus;
  dryRun: boolean;
  /** Presupuesto total aprobado (base + ampliaciones aprobadas en gate #2). */
  budgetUsd: number;
  iterations: { research: number; build: number; growth: number };
  /** Feedback pendiente para el siguiente agente (veto de QA o rechazo humano). */
  feedback: Feedback | null;
  qaHistory: Array<{ target: "product" | "growth"; iteration: number; verdict: "approve" | "reject"; score: number; at: string }>;
  market: { visits: number; sales: number; revenueUsd: number; refunds: number } | null;
  deployUrl: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  from: "qa" | "human";
  target: "research" | "product" | "growth";
  summary: string;
  defects: Defect[];
}

export type Severity = "blocker" | "major" | "minor";

export interface Defect {
  severity: Severity;
  file?: string | null;
  issue: string;
  fix: string;
  source?: "check" | "llm";
}

export interface Run {
  id: string;
  taskId: string;
  agent: AgentName | "orchestrator";
  stage: Stage;
  status: "in_progress" | "approved" | "review" | "failed";
  model: string | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  webSearches: number;
  costUsd: number;
  durationMs: number;
  note: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface Approval {
  id: string;
  taskId: string;
  gate: GateKind;
  /** Clave única de la acción (p. ej. "spend:web_search") para no pedir dos veces lo mismo. */
  key: string;
  status: "pending" | "approved" | "rejected";
  summary: string;
  amountUsd: number | null;
  note: string | null;
  requestedAt: string;
  decidedAt: string | null;
}

export interface SwarmEvent {
  at: string;
  taskId: string | null;
  level: "info" | "warn" | "error";
  agent: string;
  message: string;
  data?: unknown;
}

export interface SwarmState {
  version: 1;
  seq: number;
  tasks: Task[];
  runs: Run[];
  approvals: Approval[];
  events: SwarmEvent[];
}
