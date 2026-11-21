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
export type ProductLanguage = "es" | "en" | "pt";

/** Cómo se le describe el idioma de salida a los agentes de contenido. */
export const LANGUAGE_NAMES: Record<ProductLanguage, string> = {
  es: "español neutro",
  en: "inglés (US)",
  pt: "portugués de Brasil",
};

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

/**
 * Perfil de costo (SWARM_PROFILE):
 *   eco      → todo con Claude Haiku 5.5 (lo más barato; ideal para probar ideas)
 *   balanced → todo con Claude Sonnet 5.5
 *   quality  → Claude Opus 5.5 para construir y auditar (por defecto)
 * En cualquier perfil, la investigación inicial usa modelos baratos (ver scout.exploreModel / MODEL_SCOUT):
 * es la etapa donde más ideas se descartan, así que no tiene sentido pagar el modelo más caro ahí.
 */
export type Profile = "eco" | "balanced" | "quality";
const PROFILE = str("SWARM_PROFILE", "quality") as Profile;
const PROFILE_MODEL: Record<Profile, string> = {
  eco: "claude-haiku-5-5",
  balanced: "claude-sonnet-5-5",
  quality: "claude-opus-5-5",
};
if (!(PROFILE in PROFILE_MODEL)) throw new Error(`SWARM_PROFILE debe ser eco, balanced o quality (recibido: "${PROFILE}")`);
const DEFAULT_MODEL = str("SWARM_MODEL", PROFILE_MODEL[PROFILE]);
/** El brief del Scout (fase 2) usa Sonnet salvo en eco; la exploración (fase 1) usa Haiku. */
const DEFAULT_MODEL_BY_AGENT: Partial<Record<AgentName, string>> = {
  scout: PROFILE === "eco" ? "claude-haiku-5-5" : "claude-sonnet-5-5",
};

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

  profile: PROFILE,

  /** Reintentos automáticos del Scout cuando la validación del brief encuentra problemas (antes de molestar a una persona). */
  autoFixAttempts: num("SCOUT_AUTO_FIX_ATTEMPTS", 2),
  /** Sube los resultados (brief, kit, reportes) a la rama actual en cada pausa y al terminar, para revisarlos sin copiar y pegar. */
  autoShare: bool("SWARM_AUTO_SHARE", false),

  llm: {
    fallbacks: str("LLM_FALLBACKS", "default"), // "default" | "off"
    model(agent: AgentName): string {
      return str(`MODEL_${agent.toUpperCase()}`, process.env.SWARM_MODEL?.trim() || DEFAULT_MODEL_BY_AGENT[agent] || DEFAULT_MODEL);
    },
    effort(agent: AgentName): Effort {
      return str(`EFFORT_${agent.toUpperCase()}`, DEFAULT_EFFORT[agent]) as Effort;
    },
  },

  scout: {
    /** Búsqueda web real (API de pago: ~US$10 / 1000 búsquedas). Requiere aprobación HITL #2. */
    webSearch: bool("SCOUT_WEB_SEARCH", false),
    webSearchMaxUses: num("SCOUT_WEB_SEARCH_MAX_USES", 8),
    /** Validación gratuita con Google/YouTube Suggest (US$0). Reemplaza en gran parte a la búsqueda web de pago. */
    freeSignals: bool("SCOUT_FREE_SIGNALS", true),
    /** Cuántas oportunidades (las de mayor score) se validan con señales gratuitas. */
    validateTop: num("SCOUT_VALIDATE_TOP", 6),
    /** Modelo de la fase 1 (lluvia de oportunidades). Barato por defecto. */
    exploreModel: str("MODEL_SCOUT_EXPLORE", "claude-haiku-5-5"),
    /** Cuántas oportunidades distintas explora antes de elegir una (pensamiento divergente → convergente). */
    candidates: num("SCOUT_CANDIDATES", 10),
    /** Mercados permitidos. Por defecto: abierto, sin anclarse a ningún país, sector ni negocio existente. */
    markets: str("SCOUT_MARKETS", "abierto: cualquier país, idioma, sector o segmento donde la oportunidad sea mejor"),
    /** Idiomas en los que el enjambre puede producir el kit. */
    languages: str("SCOUT_LANGUAGES", "es,en,pt")
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is ProductLanguage => s === "es" || s === "en" || s === "pt"),
    /** Temas o nichos que el Scout debe evitar (separados por coma). Opcional. */
    exclude: str("SCOUT_EXCLUDE", ""),
  },

  kit: {
    maxFiles: num("KIT_MAX_FILES", 8),
  },

  launch: {
    /** Marca que firma la landing. Vacío = se usa el nombre del producto (independiente de cualquier empresa). */
    brandName: str("BRAND_NAME", ""),
    supportEmail: str("SUPPORT_EMAIL", ""),
    checkoutUrl: str("CHECKOUT_URL", ""),
    deployProvider: str("DEPLOY_PROVIDER", "manual") as "manual" | "netlify" | "vercel",
    netlifySiteId: str("NETLIFY_SITE_ID", ""),
  },
};

export function hasApiCredentials(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}
