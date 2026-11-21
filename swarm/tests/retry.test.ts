import assert from "node:assert/strict";
import { test } from "node:test";
import { isolate } from "./helpers.ts";

isolate();
const { withRetry, isTransient } = await import("../src/core/llm.ts");

test("isTransient reconoce cortes de conexión y sobrecarga, pero no errores permanentes", () => {
  const cut = Object.assign(new TypeError("terminated"), { cause: new Error("other side closed") });
  assert.equal(isTransient(cut), true);
  assert.equal(isTransient(new Error("read ECONNRESET")), true);
  assert.equal(isTransient(new Error("fetch failed")), true);
  assert.equal(isTransient(new Error("Respuesta truncada por max_tokens")), false);
  assert.equal(isTransient(new Error("401 invalid x-api-key")), false);
});

test("withRetry reintenta un corte transitorio y termina bien", async () => {
  let calls = 0;
  const retries: number[] = [];
  const out = await withRetry(
    async () => {
      calls++;
      if (calls < 3) throw new TypeError("terminated");
      return "ok";
    },
    (n) => retries.push(n),
    0,
  );
  assert.equal(out, "ok");
  assert.equal(calls, 3);
  assert.deepEqual(retries, [1, 2]);
});

test("withRetry no reintenta errores permanentes y se rinde tras varios cortes seguidos", async () => {
  let permanent = 0;
  await assert.rejects(() => withRetry(async () => { permanent++; throw new Error("invalid x-api-key"); }, () => {}, 0), /invalid/);
  assert.equal(permanent, 1);

  let always = 0;
  await assert.rejects(() => withRetry(async () => { always++; throw new TypeError("terminated"); }, () => {}, 0), /terminated/);
  assert.equal(always, 4, "4 intentos en total");
});
