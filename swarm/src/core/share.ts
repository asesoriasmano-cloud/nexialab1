import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { config, ROOT } from "../config.ts";

/**
 * Copia los resultados de una tarea (solo texto: md, json, csv, html) a swarm/shared/<tarea>/ y, opcionalmente,
 * los commitea y sube a la rama actual. NUNCA incluye .env, state/ ni logs/: solo lo que está en output/<tarea>/.
 * Sirve para que otra persona (o sesión de Claude) pueda revisar el brief y el kit con un `git pull`.
 */
const TEXT_EXT = new Set([".md", ".json", ".csv", ".html", ".txt"]);

function git(args: string[], cwd: string) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim() };
}

export function shareTask(taskId: string, opts: { push: boolean }): { dir: string; files: number; message: string } {
  const src = path.join(config.outputDir, taskId);
  if (!fs.existsSync(src)) throw new Error(`No hay resultados para ${taskId} en ${src}.`);

  const dest = path.join(ROOT, "shared", taskId);
  fs.rmSync(dest, { recursive: true, force: true });
  let files = 0;
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (TEXT_EXT.has(path.extname(entry.name).toLowerCase())) {
        const target = path.join(dest, path.relative(src, full));
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.copyFileSync(full, target);
        files++;
      }
    }
  };
  walk(src);
  if (files === 0) throw new Error(`No se encontraron archivos de texto en ${src}.`);
  if (!opts.push) return { dir: dest, files, message: `${files} archivos copiados a ${dest} (sin subir).` };

  const top = git(["rev-parse", "--show-toplevel"], ROOT);
  if (!top.ok) throw new Error("Esto no es un repositorio git; usa --no-push para solo copiar los archivos.");
  const repo = top.out;
  const rel = path.relative(repo, dest).split(path.sep).join("/");

  // -f: shared/ puede estar en .gitignore en el futuro; aquí se sube a propósito y solo esta carpeta.
  const add = git(["add", "-f", "--", rel], repo);
  if (!add.ok) throw new Error(`git add falló: ${add.out}`);
  const staged = git(["diff", "--cached", "--quiet", "--", rel], repo);
  if (staged.ok) return { dir: dest, files, message: `Sin cambios nuevos para ${taskId}; ya estaba compartido.` };

  const commit = git(["commit", "-m", `Comparte resultados de ${taskId}`, "--", rel], repo);
  if (!commit.ok) throw new Error(`git commit falló: ${commit.out}`);
  let push = git(["push"], repo);
  if (!push.ok) {
    // El remoto puede haber avanzado (p. ej. código nuevo del repo): nuestro commit solo toca shared/, el rebase es limpio.
    const pull = git(["pull", "--rebase", "--autostash"], repo);
    if (pull.ok) push = git(["push"], repo);
  }
  if (!push.ok) {
    throw new Error(`Se hizo el commit pero git push falló (¿sesión de GitHub?): ${push.out}\nReintenta con: git push`);
  }
  return { dir: dest, files, message: `${files} archivos compartidos y subidos a la rama actual.` };
}
