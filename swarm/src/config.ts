import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Raíz del paquete `swarm/` (independiente del cwd desde donde se invoque la CLI). */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Carga `.env` si existe (Node >= 20.12 trae process.loadEnvFile, sin dependencias).
const envPath = path.join(ROOT, ".env");
if (fs.existsSync(envPath)) process.loadEnvFile(envPath);

export type AgentName = "scout" | "builder" | "qa" | "growth" | "ops";
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

function num(name: string, def: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return def;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Variable ${name} debe ser numérica (recibido: "${raw}")`);
  return n;
}

function str(name: string, def: string): string {
  const raw = process.env[name];
  return raw === undefined || raw.trim() === "" ? def : raw.trim();
}

function bool(name: string, def: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return def;
  return ["1", "true", "yes", "si", "sí"].includes(raw.trim().toLowerCase());
}

const DEFAULT_MODEL = str("SWARM_MODEL", "claude-opus-5-5");

const DEFAULT_EFFORT: Record<AgentName, Effort> = {
  scout: "high",
  builder: "medium",
  qa: "high",
  growth: "medium",
  ops: "low",
};

export const config = {
  root: ROOT,
  stateFile: path.resolve(ROOT, str("SWARM_STATE_FILE", "state/swarm.json")),
  /** Vista resumida y legible de las tareas, junto al archivo de estado. */
  get tasksExport(): string {
    return path.join(path.dirname(this.stateFile), "tasks.json");
  },
  outputDir: path.resolve(ROOT, str("SWARM_OUTPUT_DIR", "output")),
  logDir: path.resolve(ROOT, str("SWARM_LOG_DIR", "logs")),

  /** Presupuesto preaprobado (USD) de tokens LLM por tarea/producto. Superarlo activa el gate HITL #2. */
  budgetUsdPerTask: num("BUDGET_USD_PER_TASK", 5),
  /** Máximo de ciclos Builder⇄QA (y Growth⇄QA) antes de marcar la tarea como failed. */
  maxIterations: num("MAX_ITERATIONS", 3),
  /** Máximo de reintentos de investigación cuando rechazas el concepto. */
  maxResearchAttempts: num("MAX_RESEARCH_ATTEMPTS", 3),

  llm: {
    fallbacks: str("LLM_FALLBACKS", "default"), // "default" | "off"
    model(agent: AgentName): string {
      return str(`MODEL_${agent.toUpperCase()}`, DEFAULT_MODEL);
    },
    effort(agent: AgentName): Effort {
      return str(`EFFORT_${agent.toUpperCase()}`, DEFAULT_EFFORT[agent]) as Effort;
    },
  },

  scout: {
    /** Búsqueda web real (API de pago: ~US$10 / 1000 búsquedas). Requiere aprobación HITL #2. */
    webSearch: bool("SCOUT_WEB_SEARCH", false),
    webSearchMaxUses: num("SCOUT_WEB_SEARCH_MAX_USES", 5),
  },

  kit: {
    maxFiles: num("KIT_MAX_FILES", 8),
    language: str("PRODUCT_LANGUAGE", "es"),
    market: str("TARGET_MARKET", "Chile y LatAm hispanohablante"),
  },

  launch: {
    brandName: str("BRAND_NAME", "Nexia Lab Pro"),
    supportEmail: str("SUPPORT_EMAIL", ""),
    checkoutUrl: str("CHECKOUT_URL", ""),
    deployProvider: str("DEPLOY_PROVIDER", "manual") as "manual" | "netlify" | "vercel",
    netlifySiteId: str("NETLIFY_SITE_ID", ""),
  },
};

export function hasApiCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}
