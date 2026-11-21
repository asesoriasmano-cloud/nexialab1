import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { isolate } from "./helpers.ts";

isolate();
const { config, ROOT } = await import("../src/config.ts");
const { shareTask } = await import("../src/core/share.ts");

test("share copia solo archivos de texto de output/<tarea> y no toca .env ni state", () => {
  const id = "T-share-test";
  const out = path.join(config.outputDir, id);
  fs.mkdirSync(path.join(out, "product"), { recursive: true });
  fs.writeFileSync(path.join(out, "brief.md"), "# Brief");
  fs.writeFileSync(path.join(out, "product", "guide.csv"), "a,b\n1,2\n");
  fs.writeFileSync(path.join(out, "kit.zip"), "binario");
  fs.writeFileSync(path.join(out, "guide.pdf"), "binario");

  const res = shareTask(id, { push: false });
  const shared = path.join(ROOT, "shared", id);
  try {
    assert.equal(res.files, 2);
    assert.ok(fs.existsSync(path.join(shared, "brief.md")));
    assert.ok(fs.existsSync(path.join(shared, "product", "guide.csv")));
    assert.ok(!fs.existsSync(path.join(shared, "kit.zip")), "los binarios no se comparten");
    assert.ok(!fs.existsSync(path.join(shared, "guide.pdf")));
  } finally {
    fs.rmSync(shared, { recursive: true, force: true });
  }
});

test("share falla con un mensaje claro si la tarea no tiene resultados", () => {
  assert.throws(() => shareTask("T-no-existe", { push: false }), /No hay resultados/);
});
