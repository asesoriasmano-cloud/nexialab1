import fs from "node:fs";
import path from "node:path";
import { config } from "../config.ts";

/**
 * Carpeta de trabajo de una tarea: output/<taskId>/
 *   brief.json            ← Market Scout
 *   product/              ← Product Builder (manifest.json + archivos del kit + guía HTML/PDF)
 *   marketing/            ← Growth & Copy (landing, SEO, emails, RRSS, ficha de venta)
 *   reports/              ← QA y Ops (un JSON por iteración)
 *   dist/                 ← paquete final listo para publicar
 */
export class Workspace {
  readonly dir: string;

  constructor(readonly taskId: string) {
    this.dir = path.join(config.outputDir, taskId);
  }

  path(...parts: string[]): string {
    const target = path.resolve(this.dir, ...parts);
    // Las rutas vienen en parte del modelo: nunca permitir escribir fuera de la carpeta de la tarea.
    if (target !== this.dir && !target.startsWith(this.dir + path.sep)) {
      throw new Error(`Ruta fuera del workspace rechazada: ${parts.join("/")}`);
    }
    return target;
  }

  write(rel: string, content: string | Uint8Array): string {
    const p = this.path(rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content);
    return p;
  }

  writeJson(rel: string, data: unknown): string {
    return this.write(rel, JSON.stringify(data, null, 2) + "\n");
  }

  exists(rel: string): boolean {
    return fs.existsSync(this.path(rel));
  }

  read(rel: string): string {
    return fs.readFileSync(this.path(rel), "utf8");
  }

  readJson<T>(rel: string): T {
    return JSON.parse(this.read(rel)) as T;
  }

  /** Lista archivos (rutas relativas) bajo una subcarpeta. */
  list(rel: string): string[] {
    const base = this.path(rel);
    if (!fs.existsSync(base)) return [];
    const out: string[] = [];
    const walk = (d: string) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        const full = path.join(d, entry.name);
        if (entry.isDirectory()) walk(full);
        else out.push(path.relative(this.dir, full).split(path.sep).join("/"));
      }
    };
    walk(base);
    return out.sort();
  }

  remove(rel: string): void {
    fs.rmSync(this.path(rel), { recursive: true, force: true });
  }
}
