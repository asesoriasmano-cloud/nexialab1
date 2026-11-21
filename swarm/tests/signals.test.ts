import assert from "node:assert/strict";
import { test } from "node:test";
import { isolate } from "./helpers.ts";

isolate();
const { collectSignals } = await import("../src/core/signals.ts");

test("collectSignals cuenta sugerencias, detecta intención comercial y tolera fallos de red", async () => {
  const realFetch = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL) => {
    const u = new URL(String(url));
    calls.push(u.searchParams.get("q") ?? "");
    if (u.searchParams.get("q") === "falla") throw new Error("red caída");
    const q = u.searchParams.get("q")!;
    const body = JSON.stringify([q, [`${q} plantilla excel`, `${q} gratis`, `${q} curso`]]);
    return new Response(body, { headers: { "content-type": "application/json; charset=utf-8" } });
  }) as typeof fetch;
  try {
    const [ok, ko] = await collectSignals([
      { id: 1, language: "es", country: "mx", queries: ["gastos comunes condominio"] },
      { id: 2, language: "es", country: "", queries: ["falla"] },
    ]);
    assert.ok(ok!.suggestionCount > 0);
    assert.ok(ok!.commercialCount > 0, "'plantilla excel' y 'gratis' cuentan como intención comercial");
    assert.ok(ok!.signalScore > 0 && ok!.signalScore <= 100);
    assert.ok(ko!.errors > 0, "los fallos de red se registran sin lanzar excepción");
    assert.ok(calls.includes("plantilla gastos comunes condominio"), "agrega modificadores de intención en el idioma");
  } finally {
    globalThis.fetch = realFetch;
  }
});
