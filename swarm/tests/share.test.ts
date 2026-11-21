import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { isolate } from "./helpers.ts";

isolate();
const { config, ROOT } = await import("../src/config.ts");
const { shareTask, isShareable } = await import("../src/core/share.ts");

function fixture(id: string) {
  const out = path.join(config.outputDir, id);
  const w = (rel: string, content: string) => {
    fs.mkdirSync(path.dirname(path.join(out, rel)), { recursive: true });
    fs.writeFileSync(path.join(out, rel), content);
  };
  w("brief.md", "# Brief");
  w("opportunities.json", "{}");
  w("reports/qa-product-1.json", "{}");
  w("product/manifest.json", "{}");
  w("product/build_report.json", "{}");
  w("product/guia/01-capitulo.md", "# EL KIT QUE SE VENDE");
  w("product/hojas/calc.csv", "a,b\n1,2\n");
  w("marketing/landing.html", "<html>copy</html>");
  w("dist/site/index.html", "<html>copy</html>");
  w("kit.zip", "binario");
  return out;
}

test("share por defecto NO publica el kit ni el copy: solo investigación, reportes y manifiestos", async () => {
  const id = "T-share-safe";
  fixture(id);
  const res = await shareTask(id, { push: false });
  const shared = path.join(ROOT, "shared", id);
  try {
    for (const ok of ["brief.md", "opportunities.json", "reports/qa-product-1.json", "product/manifest.json", "product/build_report.json"]) {
      assert.ok(fs.existsSync(path.join(shared, ok)), `debe compartirse ${ok}`);
    }
    for (const no of ["product/guia/01-capitulo.md", "product/hojas/calc.csv", "marketing/landing.html", "dist/site/index.html", "kit.zip"]) {
      assert.ok(!fs.existsSync(path.join(shared, no)), `NO debe compartirse ${no}`);
    }
    assert.equal(res.files, 5);
  } finally {
    fs.rmSync(shared, { recursive: true, force: true });
  }
});

test("isShareable: con withProduct incluye el kit, pero nunca binarios", () => {
  assert.equal(isShareable("product/guia/01.md", false), false);
  assert.equal(isShareable("product/guia/01.md", true), true);
  assert.equal(isShareable("marketing/social.md", false), false);
  assert.equal(isShareable("product/manifest.json", false), true);
  assert.equal(isShareable("dist/kit.zip", true), false);
});

test("subir el kit (withProduct + push) se bloquea si no se confirma que el repo es privado", async () => {
  const id = "T-share-block";
  fixture(id);
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response("{}", { status: 200 })) as typeof fetch; // 200 = repo público
  try {
    await assert.rejects(() => shareTask(id, { push: true, withProduct: true }), /Bloqueado/);
  } finally {
    globalThis.fetch = realFetch;
    fs.rmSync(path.join(ROOT, "shared", id), { recursive: true, force: true });
  }
});

test("share falla con un mensaje claro si la tarea no tiene resultados", async () => {
  await assert.rejects(() => shareTask("T-no-existe", { push: false }), /No hay resultados/);
});
