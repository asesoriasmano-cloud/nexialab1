import assert from "node:assert/strict";
import { test } from "node:test";
import { isolate, loadSwarm } from "./helpers.ts";

// Perfil eco (haiku) + 1 iteración por ronda: cada veto agota la ronda y debe subir de modelo solo.
isolate({ SWARM_PROFILE: "eco", MAX_ITERATIONS: "1", MAX_ESCALATIONS: "2" });
const { store, logger, Orchestrator } = await loadSwarm();
const { config } = await import("../src/config.ts");

test("la escalera de modelos sube haiku → sonnet → opus y el esfuerzo bajo sube a medium", () => {
  assert.equal(config.llm.model("builder", 0), "claude-haiku-5-5");
  assert.equal(config.llm.model("builder", 1), "claude-sonnet-5-5");
  assert.equal(config.llm.model("builder", 2), "claude-opus-5-5");
  assert.equal(config.llm.model("builder", 5), "claude-opus-5-5", "no pasa del tope");
  assert.equal(config.llm.model("ops", 2), config.llm.model("ops", 0), "Ops no escala");
  assert.equal(config.llm.effort("builder", 0), "low");
  assert.equal(config.llm.effort("builder", 1), "medium");
});

test("tras agotar vetos, el enjambre sube de modelo solo (2 veces) antes de escalar a una persona", async () => {
  const orch = new Orchestrator(store, logger, { autoApprove: true });
  const task = orch.createTask("", true);
  const result = await orch.run(task.id);

  // Simulado: QA veta siempre la iteración 0. Con MAX_ITERATIONS=1 cada ronda termina en veto.
  assert.equal(result.escalation, 2, "usó las 2 subidas permitidas");
  assert.equal(result.status, "failed", "recién entonces se escala a una persona");
  assert.equal(store.runsFor(task.id).filter((r) => r.agent === "builder").length, 3, "una ronda por cada nivel");
  assert.match(result.lastError ?? "", /QA vetó el producto/);
});
