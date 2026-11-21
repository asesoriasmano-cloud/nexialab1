import type { Defect } from "../../src/core/types.ts";
import type { Workspace } from "../../src/core/workspace.ts";
import type { Brief, GrowthPack, Manifest } from "../../src/schemas.ts";
import { countWords } from "../builder/index.ts";

/**
 * Chequeos determinísticos (sin LLM, sin costo). Detectan fallos objetivos antes de la crítica del modelo.
 * Cualquier defecto blocker/major produce veto automático.
 */

const PLACEHOLDER_RE = /\b(TODO|TBD|FIXME|lorem ipsum)\b|\[(completar|insertar|rellenar)[^\]]*\]/i;
const AI_LEAK_RE = /como (un )?(modelo de lenguaje|asistente de ia|inteligencia artificial)|as an ai\b/i;
const RISKY_CLAIMS_RE = /(ingresos|resultados|ganancias) (garantizad|asegurad)|garantizamos (que )?(ganar|vender|resultados)|hazte rico|dinero f[aá]cil|100% (seguro|garantizado)/i;

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

export function checkProduct(ws: Workspace): Defect[] {
  const defects: Defect[] = [];
  const add = (severity: Defect["severity"], file: string | null, issue: string, fix: string) =>
    defects.push({ severity, file, issue, fix, source: "check" });

  if (!ws.exists("product/manifest.json")) {
    add("blocker", "manifest.json", "No existe product/manifest.json", "Generar el manifiesto del kit");
    return defects;
  }
  const manifest = ws.readJson<Manifest>("product/manifest.json");
  if (manifest.files.length === 0) add("blocker", "manifest.json", "El manifiesto no tiene archivos", "Planificar los entregables del MVP");

  for (const f of manifest.files) {
    const rel = `product/${f.path}`;
    if (!ws.exists(rel)) {
      add("blocker", f.path, "Archivo declarado en el manifiesto pero inexistente", "Generar el archivo");
      continue;
    }
    const text = ws.read(rel);
    if (text.trim().length === 0) {
      add("blocker", f.path, "Archivo vacío", "Generar el contenido completo");
      continue;
    }
    if (PLACEHOLDER_RE.test(text)) add("major", f.path, "Contiene marcadores sin completar (TODO, lorem ipsum, [completar]…)", "Reemplazar todo marcador por contenido final");
    if (AI_LEAK_RE.test(text)) add("major", f.path, "Menciona que fue escrito por una IA", "Eliminar toda referencia al proceso de creación");
    if (RISKY_CLAIMS_RE.test(text)) add("major", f.path, "Promete resultados o ingresos garantizados", "Reformular sin promesas de resultados");

    if (f.kind === "csv") {
      const rows = parseCsv(text);
      const width = rows[0]?.length ?? 0;
      const bad = rows.findIndex((r) => r.length !== width);
      if (bad >= 0) add("blocker", f.path, `La fila ${bad + 1} tiene ${rows[bad]!.length} columnas; el encabezado tiene ${width}`, "Igualar columnas y entrecomillar valores con comas");
      if (rows.length < 3) add("major", f.path, "El CSV no trae filas de ejemplo suficientes", "Agregar filas de ejemplo realistas");
      if (/^```/m.test(text)) add("blocker", f.path, "El CSV contiene bloques de código Markdown", "Entregar CSV puro");
    } else {
      const words = countWords(text);
      if (words < f.targetWords * 0.6) {
        add("major", f.path, `Extensión insuficiente: ${words} palabras de ~${f.targetWords} objetivo`, "Desarrollar el contenido hasta la extensión objetivo sin relleno");
      }
      if (f.kind === "guide_chapter" && !/^##\s/m.test(text)) add("minor", f.path, "El capítulo no empieza con un encabezado H2", "Iniciar con `## Título`");
      if (f.kind !== "guide_chapter" && !/^#\s/m.test(text)) add("minor", f.path, "Falta el título H1", "Iniciar con `# Título`");
    }
  }

  if (!ws.exists("product/guide.html")) add("major", null, "No se generó la guía ensamblada (guide.html)", "Ensamblar los capítulos");
  if (!ws.exists("product/guide.pdf")) add("minor", null, "No hay PDF (Playwright no instalado)", "Instalar Playwright o imprimir guide.html a PDF antes de publicar");
  return defects;
}

export function checkGrowth(ws: Workspace, brief: Brief): Defect[] {
  const defects: Defect[] = [];
  const add = (severity: Defect["severity"], file: string | null, issue: string, fix: string) =>
    defects.push({ severity, file, issue, fix, source: "check" });

  if (!ws.exists("marketing/landing.html")) {
    add("blocker", "landing.html", "No existe la landing", "Generar marketing/landing.html");
  } else {
    const html = ws.read("marketing/landing.html");
    if (!/<title>[^<]{5,}<\/title>/i.test(html)) add("major", "landing.html", "Falta <title>", "Agregar un título SEO");
    if (!/<meta[^>]+name=["']description["']/i.test(html)) add("major", "landing.html", "Falta la meta description", "Agregar una meta description");
    if (!/<meta[^>]+name=["']viewport["']/i.test(html)) add("major", "landing.html", "Falta la meta viewport (no es responsive)", "Agregar la meta viewport");
    if (!/<h1[\s>]/i.test(html)) add("major", "landing.html", "Falta el H1", "Agregar un H1 con la propuesta de valor");
    if (!html.includes("{{CHECKOUT_URL}}")) add("blocker", "landing.html", "Ningún CTA apunta a {{CHECKOUT_URL}}", "Usar href=\"{{CHECKOUT_URL}}\" en los botones de compra");
    if (/<script[^>]+src=/i.test(html)) add("major", "landing.html", "Carga scripts externos", "Eliminar scripts externos (la landing debe ser HTML+CSS autocontenido)");
    if (RISKY_CLAIMS_RE.test(html)) add("major", "landing.html", "Promete resultados o ingresos garantizados", "Reformular sin promesas de resultados");
    if (!html.includes(String(brief.pricing.price))) add("major", "landing.html", `El precio de la landing no coincide con el brief (${brief.pricing.price})`, "Mostrar el precio aprobado");
  }

  if (!ws.exists("marketing/growth.json")) {
    add("blocker", "growth.json", "No existe el paquete de growth", "Generar SEO, ficha, correos y RRSS");
    return defects;
  }
  const pack = ws.readJson<GrowthPack>("marketing/growth.json");
  if (pack.emails.length < 5) add("major", "growth.json", `Secuencia con ${pack.emails.length} correos (mínimo 5)`, "Completar 5 correos");
  if (pack.social.length < 6) add("minor", "growth.json", `Solo ${pack.social.length} piezas para RRSS`, "Entregar al menos 6 piezas");
  if (pack.seo.title.length > 60) add("minor", "growth.json", `Título SEO de ${pack.seo.title.length} caracteres (> 60)`, "Acortar el título SEO");
  if (pack.seo.metaDescription.length < 70 || pack.seo.metaDescription.length > 160) {
    add("minor", "growth.json", `Meta description de ${pack.seo.metaDescription.length} caracteres (ideal 70–160)`, "Ajustar la longitud");
  }
  if (pack.listing.price !== brief.pricing.price) add("major", "growth.json", "El precio de la ficha no coincide con el brief", `Usar US$${brief.pricing.price}`);
  const allCopy = JSON.stringify(pack);
  if (RISKY_CLAIMS_RE.test(allCopy)) add("major", "growth.json", "El copy promete resultados o ingresos garantizados", "Reformular sin promesas de resultados");
  return defects;
}
