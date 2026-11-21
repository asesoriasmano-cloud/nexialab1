import assert from "node:assert/strict";
import { test } from "node:test";
import { isolate, loadSwarm } from "./helpers.ts";

// Con MAX_ITERATIONS=1, el primer veto de QA (simulado) agota el límite.
isolate({ MAX_ITERATIONS: "1" });
const { store, logger, Orchestrator } = await loadSwarm();

test("al agotar MAX_ITERATIONS la tarea falla y se escala a humano (sin bucle infinito)", async () => {
  const orch = new Orchestrator(store, logger, { autoApprove: true });
  const task = orch.createTask("Límite de iteraciones", true);
  const result = await orch.run(task.id);

  assert.equal(result.status, "failed");
  assert.equal(result.stage, "qa");
  assert.equal(result.iterations.build, 1);
  assert.match(result.lastError ?? "", /QA vetó el producto 1 veces/);
  assert.equal(store.runsFor(task.id).filter((r) => r.agent === "builder").length, 1);
});
