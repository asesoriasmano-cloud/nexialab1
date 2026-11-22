# CLAUDE.md: Nexia Swarm

Enjambre de agentes que investiga, construye, audita, empaqueta y lanza **kits digitales descargables** (modelo A). Está diseñado para extenderse luego a sitios de nicho con micro-herramientas (modelo B).

## Comandos
```bash
npm install                      # una vez
npm run demo                     # ciclo simulado (sin API, US$0) hasta el gate de concepto
npm run swarm -- <comando>       # CLI (ver abajo)
npm test                         # tests (node:test), siempre en modo simulado
npm run typecheck                # tsc --noEmit
```

CLI (`npm run swarm -- …`):
| Comando | Qué hace |
|---|---|
| `run [--niche "semilla"] [--dry-run] [-i] [-y]` | Crea una tarea y avanza hasta el próximo gate. Sin `--niche` es exploración abierta. `-i` pregunta s/n por terminal; `-y` auto-aprueba (solo con dry-run). |
| `run --task T0001` | Reanuda una tarea (después de un gate, un error o un presupuesto agotado). |
| `agent <scout\|builder\|qa\|growth\|ops> --task T0001` | Ejecuta un solo agente sin mover la máquina de estados. |
| `approve T0001 [--amount N] [--note …]` | Aprueba el gate pendiente y reanuda. |
| `reject T0001 --note "…"` | Rechaza. En el concepto, la nota vuelve al Scout como feedback. |
| `retry T0001` | Reinicia el contador de iteraciones de una tarea fallida por el límite de QA. |
| `share T0001 [--no-push] [--with-product]` | Copia los resultados de la tarea a `swarm/shared/T0001/` y los sube a la rama actual. Por defecto NO incluye el kit ni el copy (lo que se vende); `--with-product` solo funciona si el repo es privado. Nunca `.env`, estado ni logs. |
| `landing T0001 [--dir ruta]` | Aplica una landing diseñada (`swarm/landing/<tarea>/landing.html` + `assets/`) y regenera `dist/site` con tu `CHECKOUT_URL`. Sin gasto de API; la landing debe conservar `{{CHECKOUT_URL}}`. |
| `status [T0001]` · `approvals` · `config` | Estado, gates pendientes y configuración efectiva. |
| `report T0001 [--insights]` | Reporte de Ops (`--insights` usa el LLM). |
| `metrics T0001 --visits N --sales N --revenue N` | Registra datos reales de mercado para que Ops recomiende iteraciones. |

## Arquitectura
```
src/cli.ts            CLI (commander)
src/orchestrator.ts   Orquestador central: máquina de estados por etapas
src/config.ts         Variables de entorno y valores por defecto
src/schemas.ts        Contratos zod entre agentes (brief, manifiesto, QA, growth, ops)
src/core/             store (estado JSON), llm (Claude API + presupuesto), gates (HITL),
                      launch (empaquetado y despliegue), pdf, workspace, pricing, logger
agents/<agente>/      system.md (prompt del sistema) + index.ts (lógica) [+ mock.ts para dry-run]
tests/                node:test; cada archivo se aísla en un directorio temporal
state/swarm.json      estado persistente (tareas, runs, aprobaciones, eventos); state/tasks.json = resumen
output/<tarea>/       brief.json/md · product/ · marketing/ · reports/ · dist/
logs/swarm.log        log JSONL de eventos
```

Flujo: `research → concept_gate(HITL#1) → build ⇄ qa → growth ⇄ growth_qa → package → deploy_gate(HITL#3) → deploy → done`.
El HITL#2 (gasto) puede saltar en cualquier etapa.

## Reglas del enjambre (no romper)
1. **Solo 3 gates humanos:** concepto, gasto real o APIs de pago, y despliegue público. Todo lo demás es autónomo. No agregues pausas nuevas ni elimines estas tres.
2. **Presupuesto:** toda llamada al modelo pasa por `complete()` en `src/core/llm.ts`, que verifica el presupuesto **antes** de llamar y registra tokens y costo en el run. Nunca llames al SDK directamente desde un agente.
3. **APIs de pago externas** (búsqueda web, dominios, anuncios…) deben pedir `requireApproval(..., { gate: "spend" })` antes de usarse.
4. **Despliegue:** `deploySite()` verifica de nuevo la aprobación HITL#3 y exige `CHECKOUT_URL`. `--yes` jamás auto-aprueba tareas reales.
5. **Límite de iteraciones:** QA tiene veto. Al llegar a `MAX_ITERATIONS` la tarea pasa a `failed`; no hay bucles infinitos.
6. **Contratos:** si cambias lo que produce un agente, actualiza su schema en `src/schemas.ts` y su `mock.ts`.
7. **Honestidad del producto:** nada de testimonios, cifras ni promesas de resultados inventadas (lo exigen los prompts y QA lo veta con chequeos determinísticos).
8. **Rutas del modelo:** todo archivo que escribe un agente pasa por `Workspace`, que bloquea rutas fuera de `output/<tarea>/`.
9. Los agentes no cambian la etapa de la tarea; eso lo decide solo el orquestador.
10. **El Scout no tiene nicho de origen.** No lo ancles a los negocios ni a la experiencia de los dueños del repo: explora en tres pasos (oportunidades diversas con modelo barato → validación gratis con Google/YouTube Suggest en `src/core/signals.ts` → brief de la mejor con evidencia) y el mercado y el idioma los decide el brief. Builder, Growth y QA leen `brief.market` y `brief.language`; no fijes mercado ni idioma en sus prompts.
14. **Los archivos del kit se escriben por separado, pero deben encajar.** El Builder planifica una *fuente de verdad* (`manifest.sharedFacts`: nombres exactos de filas y columnas, ejemplos resueltos, reglas) que todos los archivos y QA respetan; al corregir, el Builder ve los demás archivos. Sin esto, QA vetaba ronda tras ronda por inconsistencias entre capítulo, hoja y contrato.
13. **Nunca publiques el producto.** `share` excluye `product/`, `marketing/` y `dist/` salvo `--with-product`, que se bloquea si no se confirma que el repo de GitHub es privado. Este repo es público.
12. **Poca interacción humana es un requisito, no un extra.** Si QA veta el máximo de iteraciones, el orquestador sube solo de modelo (`MAX_ESCALATIONS`) antes de pedir ayuda humana. Todo lo que se pueda validar con código o con otro agente debe validarse antes de llegar a una persona (ver `src/core/briefcheck.ts`: el Scout se autocorrige). Los gates muestran un resumen corto con recomendación, no documentos para leer. Si descubres un error que una persona tuvo que señalar, agrega la regla al validador y un test.
11. **La investigación debe seguir siendo casi gratis:** no subas el modelo de exploración ni reemplaces las señales gratuitas por APIs de pago sin pasar por el gate #2.

## Convenciones
- TypeScript ESM ejecutado con `tsx` (sin paso de build). Imports con extensión `.ts`.
- Textos para la persona usuaria y prompts en español; identificadores en inglés.
- Estados de tarea: `pending`, `in_progress`, `review`, `awaiting_approval`, `approved`, `failed`.
- Cada agente nuevo se compone de `agents/<nombre>/system.md`, `index.ts` y `mock.ts`, más su schema, su caso en el orquestador y un test en dry-run.
- Antes de commitear: `npm run typecheck && npm test`.

## Extender al modelo B (sitio de nicho)
Agrega un `productType` nuevo en `src/core/types.ts` y bifurca en el orquestador según `task.productType`: Builder genera las herramientas web, QA agrega tests de las fórmulas y `launch.ts` despliega el sitio completo. Los gates, el presupuesto y el estado se reutilizan tal cual.
