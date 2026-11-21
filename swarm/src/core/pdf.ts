import { createRequire } from "node:module";
import { marked } from "marked";

const PRINT_CSS = `
  @page { size: A4; margin: 22mm 18mm; }
  :root { color-scheme: light; }
  body { font-family: Georgia, "Times New Roman", serif; font-size: 11.5pt; line-height: 1.6; color: #1d1d1f; max-width: 760px; margin: 0 auto; padding: 24px; background: #fff; }
  h1, h2, h3 { font-family: "Helvetica Neue", Arial, sans-serif; line-height: 1.25; color: #0b2545; }
  h1 { font-size: 26pt; margin-top: 0; }
  h2 { font-size: 17pt; margin-top: 2em; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; page-break-before: always; }
  h2:first-of-type { page-break-before: auto; }
  h3 { font-size: 13pt; margin-top: 1.4em; }
  table { border-collapse: collapse; width: 100%; font-size: 10pt; margin: 1em 0; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f4f6; }
  blockquote { border-left: 4px solid #134074; margin: 1em 0; padding: 0.4em 1em; background: #f5f8fc; }
  code { font-family: "SFMono-Regular", Consolas, monospace; font-size: 10pt; background: #f3f4f6; padding: 1px 4px; border-radius: 3px; }
  pre { background: #f3f4f6; padding: 12px; overflow-x: auto; }
  .cover { text-align: center; padding: 30vh 0 10vh; page-break-after: always; }
  .cover p { color: #4b5563; }
`;

export function renderGuideHtml(title: string, subtitle: string, markdown: string, lang = "es"): string {
  const body = marked.parse(markdown, { async: false });
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${PRINT_CSS}</style>
</head>
<body>
<section class="cover"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p></section>
${body}
</body>
</html>`;
}

/**
 * Exporta HTML → PDF con Playwright si está instalado (opcional: `npm i -D playwright && npx playwright install chromium`).
 * Si no está disponible devuelve false: el HTML queda listo para "Imprimir → Guardar como PDF".
 */
export async function tryExportPdf(htmlPath: string, pdfPath: string): Promise<boolean> {
  let chromium: { launch: () => Promise<any> };
  try {
    const require = createRequire(import.meta.url);
    chromium = require("playwright").chromium;
  } catch {
    return false;
  }
  try {
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.goto(`file://${htmlPath}`);
      await page.pdf({ path: pdfPath, format: "A4", printBackground: true });
    } finally {
      await browser.close();
    }
    return true;
  } catch {
    return false;
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
