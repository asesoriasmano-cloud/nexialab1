import assert from "node:assert/strict";
import { test } from "node:test";
import { isolate } from "./helpers.ts";

isolate();
const { parseCsv, checkProduct } = await import("../agents/qa/checks.ts");
const { sanitizeManifest, normalizeFile } = await import("../agents/builder/index.ts");
const { Workspace } = await import("../src/core/workspace.ts");
const { costUsd } = await import("../src/core/pricing.ts");

test("parseCsv respeta comillas, comas internas y comillas escapadas", () => {
  const rows = parseCsv('a,b,c\n1,"x, y","dijo ""hola"""\n');
  assert.deepEqual(rows, [["a", "b", "c"], ["1", "x, y", 'dijo "hola"']]);
});

test("checkProduct detecta CSV inconsistente, marcadores y archivos faltantes", () => {
  const ws = new Workspace("T-checks");
  ws.writeJson("product/manifest.json", {
    productName: "X",
    slug: "x",
    guideTitle: "X",
    files: [
      { path: "guia/01.md", kind: "guide_chapter", title: "Uno", purpose: "p", targetWords: 10 },
      { path: "crm.csv", kind: "csv", title: "CRM", purpose: "p", targetWords: 10 },
      { path: "falta.md", kind: "template", title: "Falta", purpose: "p", targetWords: 10 },
    ],
  });
  ws.write("product/guia/01.md", "## Uno\n\nTODO: escribir este capítulo con más detalle y ejemplos concretos.");
  ws.write("product/crm.csv", "a,b\n1,2\n3,4,5\n");
  const defects = checkProduct(ws);
  const has = (file: string, re: RegExp) => defects.some((d) => d.file === file && re.test(d.issue));
  assert.ok(has("guia/01.md", /marcadores/));
  assert.ok(has("crm.csv", /columnas/));
  assert.ok(has("falta.md", /inexistente/));
});

test("sanitizeManifest neutraliza rutas peligrosas del modelo", () => {
  const m = sanitizeManifest(
    {
      productName: "X",
      slug: "Mi Kit!!",
      guideTitle: "X",
      files: [
        { path: "../../etc/passwd", kind: "template", title: "a", purpose: "p", targetWords: 500 },
        { path: "/abs/Guía Básica.md", kind: "guide_chapter", title: "b", purpose: "p", targetWords: 500 },
        { path: "datos.txt", kind: "csv", title: "c", purpose: "p", targetWords: 5 },
      ],
    },
    8,
  );
  for (const f of m.files) assert.ok(!f.path.includes("..") && !f.path.startsWith("/"), f.path);
  assert.equal(m.files[1]!.path, "abs/guia-basica.md");
  assert.equal(m.files[2]!.path, "datos.csv");
  assert.equal(m.files[2]!.targetWords, 100);
  assert.equal(m.slug, "mi-kit");
  assert.equal(normalizeFile("product/guia/01.md"), "guia/01.md");
});

test("Workspace rechaza escrituras fuera de la carpeta de la tarea", () => {
  const ws = new Workspace("T-safe");
  assert.throws(() => ws.write("../otro/x.md", "x"), /fuera del workspace/);
});

test("costUsd calcula tokens, caché y búsquedas web", () => {
  // Opus 5.5: $4/M entrada, $20/M salida, búsqueda $0.01
  assert.equal(costUsd("claude-opus-5-5", { inputTokens: 1_000_000, outputTokens: 0 }), 4);
  assert.equal(costUsd("claude-opus-5-5", { inputTokens: 0, outputTokens: 100_000, webSearches: 2 }), 2.02);
});
