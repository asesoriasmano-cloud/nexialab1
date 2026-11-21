# Nexia Swarm 🐝

Enjambre de agentes autónomos que **investiga un nicho, construye un kit digital vendible, lo audita, prepara su lanzamiento y lo publica**. Solo te pide aprobación en tres momentos clave.

```
 Market Scout ──▶ ⏸ HITL #1 concepto ──▶ Product Builder ⇄ QA & Critic (veto, máx. 3)
                                               │
                         Growth & Copy ⇄ QA ◀──┘
                               │
                    Empaquetado ──▶ ⏸ HITL #3 despliegue ──▶ Publicado
 Ops & Metrics: registra tokens, costos y estados, y propone iteraciones
 ⏸ HITL #2 gasto: salta si se agota el presupuesto o se requiere una API de pago
```

| Agente | Entrega |
|---|---|
| **Market Scout** | `opportunities.json` (10 oportunidades en mercados y segmentos distintos, puntuadas) + `brief.json`/`brief.md` de la elegida: mercado, idioma, público, demanda, competencia, MVP, precio y criterios de aceptación |
| **Product Builder** | `product/`: capítulos de la guía, plantillas, checklists, prompts y CSV, más la guía ensamblada en HTML/PDF |
| **QA & Critic** | `reports/qa-*.json`: chequeos automáticos + crítica del modelo, con veredicto y defectos accionables (puede vetar) |
| **Growth & Copy** | `marketing/`: landing de conversión, SEO, ficha para la pasarela, 5 correos y 8 o más piezas para RRSS |
| **Ops & Metrics** | `reports/ops.md`: costos por agente, iteraciones, defectos frecuentes y próximas acciones priorizadas |

## Requisitos
- Node.js 20.12 o superior (`node -v`).
- Una API key de Claude ([console.anthropic.com](https://console.anthropic.com/settings/keys)). No hace falta para el modo simulado.
- Opcional, para generar el PDF de la guía: `npm i -D playwright && npx playwright install chromium`. Sin él se genera `guide.html`, listo para imprimir a PDF.

## Primer ciclo completo, paso a paso

### 0. Instalar
```bash
cd swarm
npm install
cp .env.example .env
```

### 1. Ensayo sin costo (recomendado)
```bash
npm run demo
```
Simula todos los agentes (US$0) y se detiene en el gate de concepto. Continúa con `npm run swarm -- approve T0001` y observa cómo QA veta la primera versión, el Builder la corrige y todo queda empaquetado en `output/T0001/dist/`. Luego borra `state/` y `output/` para empezar de cero.

### 2. Configurar la API
Edita `.env` y completa `ANTHROPIC_API_KEY`. El presupuesto preaprobado por producto es `BUDGET_USD_PER_TASK=5`. Verifica con:
```bash
npm run swarm -- config
```

### 3. Investigar (Market Scout)
```bash
npm run swarm -- run                                   # exploración abierta (recomendado)
npm run swarm -- run --niche "mascotas"                 # con una semilla opcional
```
El Scout **no está atado a ningún nicho, país ni negocio existente**. Primero explora 10 oportunidades distintas: mercados (LatAm, España, EE.UU., Brasil…), idiomas (es, en, pt) y segmentos (consumo, oficios, trámites, momentos de vida, B2B vertical). Luego las puntúa y desarrolla la mejor. Si le das una semilla, la usa como punto de partida, pero al menos la mitad de los candidatos queda fuera de ese segmento.

El enjambre **se pausa en el HITL #1**. En `output/T0001/brief.md` verás el concepto elegido y la tabla con todas las oportunidades exploradas. Decide:
```bash
npm run swarm -- approve T0001
# o bien
npm run swarm -- reject T0001 --note "usa la oportunidad #3"
npm run swarm -- reject T0001 --note "busca algo en inglés para EE.UU., ticket bajo US$15"
```
Si rechazas, el Scout reexplora usando tu nota como feedback. Para acotar o ampliar dónde busca, ajusta `SCOUT_MARKETS`, `SCOUT_LANGUAGES` y `SCOUT_EXCLUDE` en `.env`. Con `SCOUT_WEB_SEARCH=true` investiga con datos reales de la web (requiere tu aprobación de gasto).

### 4. Construcción y QA (autónomo)
Al aprobar, el Builder crea el kit y QA lo audita. Si QA lo veta, el Builder corrige solo los archivos con defectos, hasta 3 ciclos. Después Growth crea la landing y el copy, y QA los audita también. Todo termina empaquetado en `output/T0001/dist/`:
```
dist/
  <slug>.zip            ← el kit para subir a la pasarela
  kit/                  ← los archivos sueltos (guía PDF, plantillas, CSV)
  site/index.html       ← la landing
  marketing/            ← correos, RRSS y ficha de venta
  LAUNCH_CHECKLIST.md   ← tus pasos manuales
```

### 5. Pasarela de pago (manual)
Sigue `dist/LAUNCH_CHECKLIST.md`: crea el producto en Gumroad, Lemon Squeezy o Hotmart, sube el `.zip`, pega la descripción de `listing.md` y copia la URL de checkout en `.env`:
```
CHECKOUT_URL=https://tu-tienda.gumroad.com/l/tu-kit
```
Este paso es manual porque esas pasarelas no permiten crear productos por API, y así controlas qué se publica a tu nombre.

### 6. Despliegue (HITL #3)
```bash
npm run swarm -- approve T0001
```
Con `DEPLOY_PROVIDER=manual` (por defecto) solo deja `dist/site/` listo para subir a tu hosting. Con `netlify` o `vercel`, más su token en `.env`, publica automáticamente. Sin `CHECKOUT_URL` el despliegue se bloquea, para no publicar botones de compra rotos.

### 7. Medir e iterar (Ops)
```bash
npm run swarm -- metrics T0001 --visits 350 --sales 6 --revenue 114
npm run swarm -- report T0001 --insights
```

## Los 3 puntos de aprobación humana (HITL)
| Gate | Cuándo salta | Qué apruebas |
|---|---|---|
| **#1 Concepto** | Siempre, tras la investigación | Que valga la pena construir este producto |
| **#2 Gasto** | Si la próxima llamada superaría el presupuesto aprobado, o si un agente quiere usar una API de pago (p. ej. `SCOUT_WEB_SEARCH=true`) | Ampliar el presupuesto (`--amount`) o autorizar el gasto |
| **#3 Despliegue** | Con todo empaquetado y auditado | Publicar en internet |

¿Prefieres responder en el momento? Usa `run -i` para que el enjambre pregunte s/n por terminal en cada gate.

## Costos
**La investigación es casi gratis.** Es la etapa donde más ideas se descartan, así que se paga lo mínimo:

| Paso | Cómo | Costo estimado |
|---|---|---|
| Lluvia de 10 oportunidades | Claude Haiku 5.5 | ~US$0.005 |
| Validación de las 6 mejores | Google y YouTube Suggest (búsquedas reales, sin API key) | **US$0** |
| Elección con evidencia y brief | Claude Sonnet 5.5 (Haiku en `SWARM_PROFILE=eco`) | ~US$0.11 (eco: ~US$0.006) |
| **Total por concepto** | | **~US$0.12** (eco: **~US$0.01**) |

Antes, la misma investigación con Opus costaba ~US$0.44 (~US$0.60 con búsqueda web de pago). Rechazar conceptos ahora es barato: puedes pedir varios hasta encontrar uno que te convenza.

Después de que apruebas el concepto, la construcción y la auditoría usan el modelo del perfil:
- `SWARM_PROFILE=quality` (por defecto): Claude Opus 5.5. Estimado entre US$1.5 y US$3 por kit.
- `balanced`: Claude Sonnet 5.5, aproximadamente la mitad.
- `eco`: Claude Haiku 5.5, unos centavos, con menor calidad de redacción.

Son estimaciones, aún no medidas con una ejecución real; el costo exacto queda registrado por agente en `npm run swarm -- status T0001` y en el reporte de Ops.
- Antes de cada llamada se estima su costo. Si no cabe en el presupuesto, el enjambre **se pausa antes de gastar**.
- Si el modelo rechaza una solicitud por seguridad, la API reintenta con otro modelo (`LLM_FALLBACKS=default`). Ese gasto también queda registrado.

## Estado y reanudación
Todo queda en `state/swarm.json` (tareas, ejecuciones, aprobaciones y eventos) y en `state/tasks.json` (resumen). Si algo falla (red, clave o límite), corrige la causa y ejecuta `npm run swarm -- run --task T0001`: retoma desde la etapa en que quedó, sin repetir archivos ya generados.

Más detalles para desarrollar o extender el enjambre: [`CLAUDE.md`](./CLAUDE.md).
