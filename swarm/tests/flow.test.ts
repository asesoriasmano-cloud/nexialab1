import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import { isolate, loadSwarm } from "./helpers.ts";

isolate();
const { store, logger, Orchestrator } = await loadSwarm();
const { decide, requireApproval } = await import("../src/core/gates.ts");
const { GatePendingError } = await import("../src/core/errors.ts");
const { Workspace } = await import("../src/core/workspace.ts");

test("ciclo completo en dry-run: investiga, construye, veta, corrige, empaqueta y despliega", async () => {
  const orch = new Orchestrator(store, logger, { autoApprove: true });
  const task = orch.createTask("", true); // exploración abierta
  const done = await orch.run(task.id);

  assert.equal(done.stage, "done");
  assert.equal(done.status, "approved");
  assert.equal(done.iterations.build, 1, "QA simulado veta la primera versión");
  assert.deepEqual(
    done.qaHistory.map((q) => `${q.target}:${q.verdict}`),
    ["product:reject", "product:approve", "growth:approve"],
  );
  const ws = new Workspace(task.id);
  for (const rel of ["brief.json", "brief.md", "product/manifest.json", "marketing/landing.html", "dist/LAUNCH_CHECKLIST.md", "dist/site/index.html", "reports/ops.md"]) {
    assert.ok(ws.exists(rel), `debe existir ${rel}`);
  }
  assert.ok(ws.list("dist").some((p) => p.endsWith(".zip")), "debe existir el zip del kit");
  const site = fs.readFileSync(ws.path("dist/site/index.html"), "utf8");
  assert.ok(!site.includes("{{CHECKOUT_URL}}") && site.includes("https://example.com/checkout"));
  assert.equal(store.spentUsd(task.id), 0, "dry-run no gasta");
  assert.ok(store.approvalsFor(task.id).every((a) => a.status === "approved"));
});

test("sin auto-aprobación el flujo se pausa en el gate de concepto", async () => {
  const orch = new Orchestrator(store, logger);
  const task = orch.createTask("Plantillas Notion para freelancers", true);
  const paused = await orch.run(task.id);
  assert.equal(paused.stage, "concept_gate");
  assert.equal(paused.status, "awaiting_approval");
  // reanudar sin decidir no avanza ni duplica la solicitud
  await orch.run(task.id);
  assert.equal(store.pendingApprovals().filter((a) => a.taskId === task.id).length, 1);
});

test("--yes (auto-aprobación) se rechaza en tareas reales", async () => {
  const orch = new Orchestrator(store, logger, { autoApprove: true });
  const task = new Orchestrator(store, logger).createTask("Tarea real", false);
  await assert.rejects(() => orch.run(task.id), /solo se permite en tareas --dry-run/);
});

test("requireApproval es idempotente y respeta la decisión humana", () => {
  const orch = new Orchestrator(store, logger);
  const task = orch.createTask("Gate test", true);
  const req = { gate: "spend" as const, key: "spend:web_search", summary: "usar búsqueda web", amountUsd: 0.05 };
  assert.throws(() => requireApproval(store, task, req), GatePendingError);
  assert.throws(() => requireApproval(store, task, req), GatePendingError);
  assert.equal(store.approvalsFor(task.id).length, 1);
  decide(store, store.approvalsFor(task.id)[0]!, "approved", null);
  assert.equal(requireApproval(store, task, req).status, "approved");
});

test("gate #2: presupuesto insuficiente pausa ANTES de llamar a la API y se amplía al aprobar", async () => {
  const orch = new Orchestrator(store, logger);
  const task = orch.createTask("Tarea con presupuesto mínimo", false);
  store.updateTask(task.id, { budgetUsd: 0.0001 });

  const paused = await orch.run(task.id);
  assert.equal(paused.status, "awaiting_approval");
  assert.equal(paused.stage, "research");
  const pending = store.pendingApprovals().filter((a) => a.taskId === task.id);
  assert.equal(pending.length, 1);
  assert.equal(pending[0]!.gate, "spend");
  assert.ok(pending[0]!.key.startsWith("spend:budget"));
  assert.equal(store.spentUsd(task.id), 0, "no se gastó nada");

  // reanudar sin aprobar no crea solicitudes duplicadas
  await orch.run(task.id);
  assert.equal(store.pendingApprovals().filter((a) => a.taskId === task.id).length, 1);

  decide(store, pending[0]!, "approved", null, 3);
  assert.equal(store.getTask(task.id).budgetUsd, 3.0001);
});

test("Scout explora oportunidades diversas y el humano puede elegir otra al rechazar", async () => {
  const orch = new Orchestrator(store, logger);
  const task = orch.createTask("", true);
  assert.equal(task.title, "Exploración abierta");
  await orch.run(task.id);

  const ws = new Workspace(task.id);
  const opps = ws.readJson<{ candidates: Array<{ market: string; segment: string }>; selectedId: number }>("opportunities.json");
  assert.ok(opps.candidates.length >= 8);
  assert.ok(new Set(opps.candidates.map((c) => c.market)).size >= 3, "al menos 3 mercados distintos");
  assert.ok(new Set(opps.candidates.map((c) => c.segment)).size >= 4, "al menos 4 segmentos distintos");
  const brief = ws.readJson<{ market: string; language: string }>("brief.json");
  assert.ok(brief.market && brief.language);
  assert.match(ws.read("brief.md"), /Oportunidades exploradas/);

  const pending = store.pendingApprovals().find((a) => a.taskId === task.id)!;
  decide(store, pending, "rejected", "usa la oportunidad #3");
  const again = await orch.run(task.id);
  assert.equal(again.iterations.research, 2);
  assert.equal(ws.readJson<{ selectedId: number }>("opportunities.json").selectedId, 3);
});
