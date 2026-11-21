import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Aísla cada archivo de test en un directorio temporal. Debe llamarse ANTES de importar
 * módulos del enjambre (config.ts lee las variables de entorno al cargarse).
 */
export function isolate(extraEnv: Record<string, string> = {}): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "swarm-test-"));
  process.env.SWARM_STATE_FILE = path.join(dir, "state", "swarm.json");
  process.env.SWARM_OUTPUT_DIR = path.join(dir, "output");
  process.env.SWARM_LOG_DIR = path.join(dir, "logs");
  process.env.CHECKOUT_URL = "https://example.com/checkout";
  process.env.DEPLOY_PROVIDER = "manual";
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_AUTH_TOKEN;
  Object.assign(process.env, extraEnv);
  return dir;
}

export async function loadSwarm() {
  const { Store } = await import("../src/core/store.ts");
  const { Logger } = await import("../src/core/logger.ts");
  const { Orchestrator } = await import("../src/orchestrator.ts");
  const store = new Store();
  const logger = new Logger(store, true);
  return { store, logger, Orchestrator };
}
