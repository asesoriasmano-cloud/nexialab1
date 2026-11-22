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
