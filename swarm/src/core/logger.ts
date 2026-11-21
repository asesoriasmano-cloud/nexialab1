import fs from "node:fs";
import path from "node:path";
import { config } from "../config.ts";
import type { Store } from "./store.ts";
import type { SwarmEvent } from "./types.ts";

const COLORS: Record<SwarmEvent["level"], string> = { info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m" };
const RESET = "\x1b[0m";

export class Logger {
  constructor(private readonly store: Store, private readonly quiet = false) {}

  log(level: SwarmEvent["level"], agent: string, taskId: string | null, message: string, data?: unknown): void {
    const event: SwarmEvent = { at: new Date().toISOString(), taskId, level, agent, message, data };
    this.store.addEvent(event);
    fs.mkdirSync(config.logDir, { recursive: true });
    fs.appendFileSync(path.join(config.logDir, "swarm.log"), JSON.stringify(event) + "\n");
    if (!this.quiet) {
      const color = process.stdout.isTTY ? COLORS[level] : "";
      const reset = process.stdout.isTTY ? RESET : "";
      console.log(`${color}[${agent}]${reset}${taskId ? ` ${taskId}` : ""} ${message}`);
    }
  }

  info(agent: string, taskId: string | null, message: string, data?: unknown) {
    this.log("info", agent, taskId, message, data);
  }
  warn(agent: string, taskId: string | null, message: string, data?: unknown) {
    this.log("warn", agent, taskId, message, data);
  }
  error(agent: string, taskId: string | null, message: string, data?: unknown) {
    this.log("error", agent, taskId, message, data);
  }
}
