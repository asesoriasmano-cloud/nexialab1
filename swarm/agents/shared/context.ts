import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AgentName } from "../../src/config.ts";
import type { Logger } from "../../src/core/logger.ts";
import type { Store } from "../../src/core/store.ts";
import type { Task } from "../../src/core/types.ts";
import type { Workspace } from "../../src/core/workspace.ts";

/** Todo lo que un agente necesita para trabajar. Los agentes no tocan la máquina de estados. */
export interface AgentContext {
  store: Store;
  logger: Logger;
  task: Task;
  runId: string;
  workspace: Workspace;
  dryRun: boolean;
}

const AGENTS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Carga agents/<agente>/system.md (prompt del sistema versionado junto a la lógica del agente). */
export function loadSystemPrompt(agent: AgentName, vars: Record<string, string> = {}): string {
  let text = fs.readFileSync(path.join(AGENTS_DIR, agent, "system.md"), "utf8");
  for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{{${k}}}`, v);
  return text;
}
