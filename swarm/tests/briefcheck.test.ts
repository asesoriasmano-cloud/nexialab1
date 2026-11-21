import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { isolate } from "./helpers.ts";

isolate();
const { checkBrief, conceptSummary } = await import("../src/core/briefcheck.ts");
const { mockBrief } = await import("../agents/scout/mock.ts");
const ctx = { maxFiles: 8, languages: ["es", "en", "pt"] };

/** Brief base válido de EE.UU. en inglés, ajustado por cada caso. */
function usBrief() {
  const b = mockBrief(0);
  b.market = "United States";
  b.language = "en";
  b.productName = "Pressure Washing Quote, Contract and Collection Kit";
  b.mvp.format = "Markdown guide and plain CSV worksheets, without tabs, formulas or DOCX";
  b.acceptanceCriteria = [
    "Todos los CSV son planos, sin fórmulas ni pestañas",
    "Todas las medidas están en sq ft, galones y USD; no aparecen unidades métricas",
    "El nombre de los entregables está en inglés",
    "Ninguna parte promete ingresos",
  ];
  return b;
}

test("un brief bueno (formatos negados, sq ft, nombre en inglés) pasa sin problemas", () => {
  assert.deepEqual(checkBrief(usBrief(), ctx), []);
});

test("detecta los 3 errores del primer brief real: formatos imposibles, m² en EE.UU. y nombre mezclado", () => {
  const b = usBrief();
  b.productName = "Pricing and Contracts Kit para lavadores a presion";
  b.mvp.format = "Paquete descargable en PDF, CSV y DOCX";
  b.mvp.deliverables[3]!.description = "CSV con pestañas y fórmulas explicadas";
  b.acceptanceCriteria.push("Los ejemplos incluyen conversión a metros cuadrados");
  const rules = checkBrief(b, ctx).map((i) => i.rule);
  assert.ok(rules.includes("format"), "DOCX / pestañas / fórmulas");
  assert.ok(rules.includes("units"), "metros cuadrados en EE.UU.");
  assert.ok(rules.includes("name_language"), "nombre con español");
});

test("la negación no cuenta como promesa ('sin DOCX', 'no fórmulas')", () => {
  const b = usBrief();
  b.mvp.deliverables[0]!.description = "Hoja plana. Sin fórmulas, no DOCX y sin macros.";
  assert.equal(checkBrief(b, ctx).filter((i) => i.rule === "format").length, 0);
});

test("valida estructura del MVP y consistencia con las oportunidades", () => {
  const b = usBrief();
  b.mvp.deliverables = b.mvp.deliverables.slice(0, 2);
  b.opportunityId = 99;
  const issues = checkBrief(b, { ...ctx, opportunities: { candidates: [], selectedId: 1, selectionRationale: "" } });
  assert.ok(issues.some((i) => /entregables/.test(i.issue)));
  assert.ok(issues.some((i) => /capítulos/.test(i.issue)));
  assert.ok(issues.some((i) => i.rule === "consistency"));
});

test("conceptSummary recomienda APROBAR o REVISAR según viabilidad, señal y avisos", () => {
  const b = usBrief();
  b.viabilityScore = 68;
  assert.equal(conceptSummary(b, { signalScore: 93, commercial: 11, remainingIssues: [] }).recommendation, "APROBAR");
  assert.equal(conceptSummary(b, { signalScore: 30, commercial: 1, remainingIssues: [] }).recommendation, "REVISAR");
  const withIssue = [{ rule: "format" as const, issue: "x", fix: "y" }];
  assert.equal(conceptSummary(b, { signalScore: 93, remainingIssues: withIssue }).recommendation, "REVISAR");
  assert.ok(conceptSummary(b, { signalScore: 93, remainingIssues: [] }).text.split("\n").length <= 10, "resumen corto");
});

test("el brief real de la ejecución anterior (T0001, 2.º intento) pasa la validación", () => {
  const file = path.resolve(import.meta.dirname, "../shared/T0001/brief.json");
  if (!fs.existsSync(file)) return; // el resultado compartido puede no existir en otros clones
  const brief = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!brief.selectionRationale) brief.selectionRationale = "n/a (brief previo al campo)";
  assert.deepEqual(checkBrief(brief, ctx).filter((i) => i.rule !== "consistency"), []);
});
