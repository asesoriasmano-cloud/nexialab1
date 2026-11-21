import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { config, ROOT } from "../config.ts";

/**
 * Copia los resultados de una tarea a swarm/shared/<tarea>/ y, opcionalmente, los commitea y sube a la rama actual,
 * para poder revisarlos con un `git pull` sin copiar y pegar.
 *
 * SEGURIDAD: el kit y el copy de marketing son lo que se vende. Por defecto NO se comparten (product/, marketing/,
 * dist/): solo la investigación, los reportes de QA/Ops y los manifiestos. `withProduct` los incluye, y solo se permite
 * si se CONFIRMA que el repositorio es privado (un repo público regalaría el producto).
 * Nunca se incluyen .env, state/ ni logs/, ni binarios (zip, pdf).
 */
const TEXT_EXT = new Set([".md", ".json", ".csv", ".html", ".txt"]);
const PRODUCT_DIRS = ["product/", "marketing/", "dist/"];
/** Metadatos del producto que no revelan el contenido vendible. */
const SAFE_PRODUCT_FILES = new Set(["product/manifest.json", "product/build_report.json"]);

function git(args: string[], cwd: string) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  return { ok: r.status === 0, out: `${r.stdout ?? ""}${r.stderr ?? ""}`.trim() };
}

/** true solo si se confirma que el repo de GitHub es PRIVADO (la API anónima responde 404). Ante la duda, false. */
export async function isConfirmedPrivate(repoDir: string): Promise<boolean> {
  const url = git(["remote", "get-url", "origin"], repoDir);
  const m = /github\.com[:/]+([^/]+)\/([^/.\s]+)/i.exec(url.out);
  if (!url.ok || !m) return false;
  try {
    const res = await fetch(`https://api.github.com/repos/${m[1]}/${m[2]}`, {
      headers: { "User-Agent": "swarm-share", Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(8000),
    });
    return res.status === 404;
  } catch {
    return false;
  }
}

export function isShareable(rel: string, withProduct: boolean): boolean {
  if (!TEXT_EXT.has(path.extname(rel).toLowerCase())) return false;
  if (withProduct) return true;
  if (SAFE_PRODUCT_FILES.has(rel)) return true;
  return !PRODUCT_DIRS.some((d) => rel.startsWith(d));
}

export async function shareTask(
  taskId: string,
  opts: { push: boolean; withProduct?: boolean },
): Promise<{ dir: string; files: number; message: string }> {
  const src = path.join(config.outputDir, taskId);
  if (!fs.existsSync(src)) throw new Error(`No hay resultados para ${taskId} en ${src}.`);

  const top = git(["rev-parse", "--show-toplevel"], ROOT);
  if (opts.push && opts.withProduct) {
    if (!top.ok || !(await isConfirmedPrivate(top.out))) {
      throw new Error(
        "Bloqueado: --with-product sube el kit (lo que vendes) y no se pudo confirmar que el repositorio sea PRIVADO. " +
          "Un repositorio público regalaría el producto. Usa un repositorio privado o quita --with-product.",
      );
    }
  }

  const dest = path.join(ROOT, "shared", taskId);
  fs.rmSync(dest, { recursive: true, force: true });
  let files = 0;
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const rel = path.relative(src, full).split(path.sep).join("/");
      if (!isShareable(rel, Boolean(opts.withProduct))) continue;
      const target = path.join(dest, rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(full, target);
      files++;
    }
  };
  walk(src);
  if (files === 0) throw new Error(`No se encontraron archivos para compartir en ${src}.`);
  const scope = opts.withProduct ? "incluido el kit" : "sin el kit ni el copy de marketing";
  if (!opts.push) return { dir: dest, files, message: `${files} archivos copiados a ${dest} (${scope}; sin subir).` };

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
  return { dir: dest, files, message: `${files} archivos compartidos y subidos a la rama actual (${scope}).` };
}
