import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { isolate } from "./helpers.ts";

isolate({ CHECKOUT_URL: "https://example.com/l/abc" });
const { applyLanding } = await import("../src/core/launch.ts");
const { Workspace } = await import("../src/core/workspace.ts");

test("applyLanding copia la landing y sus medios a dist/site y aplica el CHECKOUT_URL", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "landing-"));
  fs.mkdirSync(path.join(dir, "assets"));
  fs.writeFileSync(path.join(dir, "landing.html"), '<a href="{{CHECKOUT_URL}}">Buy</a><img src="assets/a.webp">');
  fs.writeFileSync(path.join(dir, "assets", "a.webp"), Buffer.from([1, 2, 3]));
  const ws = new Workspace("T-landing");
  const res = applyLanding(ws, dir);
  assert.equal(res.assets, 1);
  assert.equal(res.checkoutConfigured, true);
  assert.match(ws.read("dist/site/index.html"), /href="https:\/\/example\.com\/l\/abc"/);
  assert.ok(ws.exists("dist/site/assets/a.webp"), "los medios viajan con el sitio");
});

test("applyLanding rechaza una landing sin {{CHECKOUT_URL}}", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "landing-"));
  fs.writeFileSync(path.join(dir, "landing.html"), "<a href='#'>Buy</a>");
  assert.throws(() => applyLanding(new Workspace("T-landing2"), dir), /CHECKOUT_URL/);
});

test("applyLanding acepta una carpeta con solo assets/ y conserva la landing existente", () => {
  const ws = new Workspace("T-landing3");
  ws.write("marketing/landing.html", '<a href="{{CHECKOUT_URL}}">Buy</a>');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "landing-"));
  fs.mkdirSync(path.join(dir, "assets"));
  fs.writeFileSync(path.join(dir, "assets", "uso.webp"), Buffer.from([1]));
  const res = applyLanding(ws, dir);
  assert.equal(res.assets, 1);
  assert.match(ws.read("marketing/landing.html"), /CHECKOUT_URL/);
  assert.ok(ws.exists("dist/site/assets/uso.webp"));
});

test("estándar visual: QA marca una landing sin imágenes", async () => {
  const { checkGrowth } = await import("../agents/qa/checks.ts");
  const ws = new Workspace("T-visual");
  ws.write("marketing/landing.html", '<!doctype html><html><head><meta name="viewport" content="x"><meta name="description" content="d"><title>Titulo largo</title></head><body><h1>x</h1><a href="{{CHECKOUT_URL}}">US$19</a></body></html>');
  const brief = { pricing: { price: 19 } } as never;
  const issues = checkGrowth(ws, brief).map((d) => d.issue);
  assert.ok(issues.some((i) => /imágenes/.test(i)));
  assert.ok(issues.some((i) => /video/.test(i)));
});
