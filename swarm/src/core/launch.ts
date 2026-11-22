import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { zipSync } from "fflate";
import { config } from "../config.ts";
import type { Brief, GrowthPack, Manifest } from "../schemas.ts";
import type { Store } from "./store.ts";
import type { Task } from "./types.ts";
import type { Workspace } from "./workspace.ts";

export interface PackageSummary {
  zip: string;
  siteDir: string;
  files: string[];
  checkoutConfigured: boolean;
}

const INTERNAL = new Set(["manifest.json", "build_report.json", "guide.md"]);

/**
 * Empaqueta todo lo necesario para lanzar en output/<task>/dist/:
 *   kit/            archivos que recibe el cliente (+ guide.pdf/guide.html)
 *   <slug>.zip      el kit comprimido, listo para subir a Gumroad/Lemon Squeezy/Hotmart
 *   site/index.html la landing con el CHECKOUT_URL aplicado
 *   marketing/      correos, RRSS y ficha de venta
 *   LAUNCH_CHECKLIST.md
 */
export function packageTask(ws: Workspace): PackageSummary {
  const manifest = ws.readJson<Manifest>("product/manifest.json");
  const brief = ws.readJson<Brief>("brief.json");
  const pack = ws.readJson<GrowthPack>("marketing/growth.json");

  ws.remove("dist");
  const zipEntries: Record<string, Uint8Array> = {};
  const kitFiles: string[] = [];
  for (const rel of ws.list("product")) {
    const inner = rel.replace(/^product\//, "");
    if (INTERNAL.has(inner)) continue;
    if (inner === "guide.html" && ws.exists("product/guide.pdf")) continue; // si hay PDF, el HTML no se entrega
    const data = fs.readFileSync(ws.path(rel));
    ws.write(`dist/kit/${inner}`, data);
    zipEntries[`${manifest.slug}/${inner}`] = new Uint8Array(data);
    kitFiles.push(inner);
  }
  const zipRel = `dist/${manifest.slug}.zip`;
  ws.write(zipRel, zipSync(zipEntries, { level: 9 }));

  for (const rel of ws.list("marketing")) {
    if (rel.endsWith("landing.html") || rel.startsWith("assets/")) continue;
    ws.write(`dist/${rel}`, fs.readFileSync(ws.path(rel)));
  }

  const checkoutConfigured = renderSite(ws);
  ws.write("dist/LAUNCH_CHECKLIST.md", launchChecklist(brief, pack, manifest, zipRel, checkoutConfigured));
  return { zip: zipRel, siteDir: "dist/site", files: kitFiles, checkoutConfigured };
}

/** Genera dist/site/index.html reemplazando {{CHECKOUT_URL}}. Devuelve si el checkout está configurado. */
export function renderSite(ws: Workspace): boolean {
  const url = config.launch.checkoutUrl;
  const html = ws.read("marketing/landing.html");
  ws.write("dist/site/index.html", url ? html.replaceAll("{{CHECKOUT_URL}}", url) : html);
  // Medios de la landing (imágenes, video): viajan junto al index.html.
  for (const rel of ws.list("marketing/assets")) {
    ws.write(`dist/site/${rel.replace(/^marketing\//, "")}`, fs.readFileSync(ws.path(rel)));
  }
  return Boolean(url);
}

/**
 * Aplica una landing diseñada a mano (landing.html + assets/) a una tarea y regenera dist/site.
 * Sirve para mejorar el diseño sin gastar tokens; la landing debe conservar {{CHECKOUT_URL}}.
 */
export function applyLanding(ws: Workspace, dir: string): { assets: number; checkoutConfigured: boolean } {
  const htmlPath = path.join(dir, "landing.html");
  if (!fs.existsSync(htmlPath)) throw new Error(`No existe ${htmlPath}`);
  const html = fs.readFileSync(htmlPath, "utf8");
  if (!html.includes("{{CHECKOUT_URL}}")) throw new Error("La landing no usa {{CHECKOUT_URL}} en sus botones de compra.");
  ws.write("marketing/landing.html", html);
  let assets = 0;
  const assetsDir = path.join(dir, "assets");
  if (fs.existsSync(assetsDir)) {
    for (const name of fs.readdirSync(assetsDir)) {
      const file = path.join(assetsDir, name);
      if (!fs.statSync(file).isFile()) continue;
      ws.write(`marketing/assets/${name}`, fs.readFileSync(file));
      assets++;
    }
  }
  return { assets, checkoutConfigured: renderSite(ws) };
}

function launchChecklist(brief: Brief, pack: GrowthPack, manifest: Manifest, zipRel: string, checkout: boolean): string {
  return `# Checklist de lanzamiento: ${brief.productName}

El enjambre dejó todo listo. Estos pasos requieren tu cuenta y tu aprobación (gate HITL #3).

## 1. Pasarela de pago (manual: las APIs de Gumroad y Lemon Squeezy no permiten crear productos)
- [ ] Crea el producto en Gumroad, Lemon Squeezy o Hotmart con el nombre **${pack.listing.name}**.
- [ ] Precio: **US$${pack.listing.price}**.
- [ ] Sube el archivo \`${path.basename(zipRel)}\` (está en \`dist/\`).
- [ ] Copia la descripción desde \`dist/marketing/listing.md\` y agrega los tags: ${pack.listing.tags.join(", ")}.
- [ ] Copia la URL de checkout en \`swarm/.env\` → \`CHECKOUT_URL=\` ${checkout ? "(✔ ya configurada)" : "(⚠ pendiente: la landing no se publica sin ella)"}

## 2. Landing
- [ ] Revisa \`dist/site/index.html\` en el navegador (móvil y escritorio).
- [ ] Aprueba el despliegue: \`npm run swarm -- approve <ID_TAREA>\`, que publica en ${config.launch.deployProvider === "manual" ? "tu hosting (modo manual: sube la carpeta dist/site)" : config.launch.deployProvider}.

## 3. Distribución
- [ ] Carga los 5 correos de \`dist/marketing/emails/\` en tu herramienta de email marketing.
- [ ] Programa las piezas de \`dist/marketing/social.md\` (sugerencia: 1 por día hábil).
- [ ] Registra métricas cada semana: \`npm run swarm -- metrics <ID_TAREA> --visits N --sales N --revenue N\`.

## Contenido del kit (${manifest.files.length} archivos)
${manifest.files.map((f) => `- ${f.title} (\`${f.path}\`)`).join("\n")}
`;
}

/**
 * Despliegue público (solo se llama con el gate #3 aprobado; se vuelve a verificar aquí).
 * manual  → no publica nada; deja dist/site listo para subir.
 * netlify → `netlify deploy --prod` (requiere NETLIFY_AUTH_TOKEN y opcional NETLIFY_SITE_ID).
 * vercel  → `vercel deploy --prod` (requiere VERCEL_TOKEN).
 */
export function deploySite(store: Store, task: Task, ws: Workspace): { url: string | null; message: string } {
  const approval = [...store.approvalsFor(task.id)].reverse().find((a) => a.gate === "deploy");
  if (approval?.status !== "approved") throw new Error("Despliegue bloqueado: falta la aprobación HITL #3.");
  if (!renderSite(ws)) {
    throw new Error("Falta CHECKOUT_URL en swarm/.env: la landing quedaría con botones de compra rotos. Configúralo y ejecuta `swarm run --task " + task.id + "`.");
  }
  const siteDir = ws.path("dist/site");
  const provider = config.launch.deployProvider;

  if (task.dryRun) return { url: null, message: `[dry-run] Se habría publicado ${siteDir} con el proveedor "${provider}".` };
  if (provider === "manual") {
    return { url: null, message: `Modo manual: sube la carpeta ${siteDir} a tu hosting (Netlify Drop, Vercel, cPanel…).` };
  }
  if (provider === "netlify") {
    if (!process.env.NETLIFY_AUTH_TOKEN) throw new Error("Falta NETLIFY_AUTH_TOKEN en swarm/.env");
    const args = ["--yes", "netlify-cli", "deploy", "--dir", siteDir, "--prod", "--json"];
    if (config.launch.netlifySiteId) args.push("--site", config.launch.netlifySiteId);
    const res = spawnSync("npx", args, { encoding: "utf8", env: process.env });
    if (res.status !== 0) throw new Error(`netlify deploy falló: ${res.stderr || res.stdout}`);
    const out = JSON.parse(res.stdout) as { url?: string; deploy_url?: string };
    const url = out.url ?? out.deploy_url ?? null;
    return { url, message: `Publicado en Netlify: ${url}` };
  }
  if (provider === "vercel") {
    if (!process.env.VERCEL_TOKEN) throw new Error("Falta VERCEL_TOKEN en swarm/.env");
    const res = spawnSync("npx", ["--yes", "vercel", "deploy", siteDir, "--prod", "--yes", "--token", process.env.VERCEL_TOKEN], {
      encoding: "utf8",
      env: process.env,
    });
    if (res.status !== 0) throw new Error(`vercel deploy falló: ${res.stderr || res.stdout}`);
    const url = res.stdout.trim().split("\n").pop() ?? null;
    return { url, message: `Publicado en Vercel: ${url}` };
  }
  throw new Error(`DEPLOY_PROVIDER desconocido: ${provider}`);
}
