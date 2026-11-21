# Reporte de Ops: Pressure Washing Quote, Contract and Collection Kit

Tarea T0001 en etapa qa (failed). Costo US$3.8706 de US$5 (77.4%). Iteraciones: build 3, growth 0.

## Costos por agente
| Agente | Runs | Fallidos | Tokens entrada | Tokens salida | Costo USD | Duración (s) |
|---|---|---|---|---|---|---|
| scout | 2 | 0 | 38944 | 39487 | 0.0236 | 180.6 |
| builder | 9 | 0 | 153854 | 209203 | 2.7585 | 1168.5 |
| qa | 10 | 1 | 742 | 42791 | 1.0885 | 1210.7 |
| ops | 2 | 0 | 0 | 0 | 0.0000 | 0.0 |

**Total:** US$3.8706 de US$5 aprobados (77.4%)

## QA
- product #1: reject (score 40)
- product #2: reject (score 40)
- product #3: reject (score 72)
- product #1: reject (score 62)
- product #2: reject (score 66)
- product #3: reject (score 40)
- product #1: reject (score 62)
- product #2: reject (score 76)
- product #3: reject (score 79)

## Defectos más frecuentes
- (1x) The chapter says the worksheet has 23 rows and that its numbers, names and order match the table in 'The worksheet rows'
- (1x) The 'Rounding' section says the 'round up to the next $5' rule is this chapter's own convention and that Chapter 1 does 
- (1x) The 'How to reproduce the examples' table uses row names that do not exist in the CSV: 'Gallons of mixed solution per jo
- (1x) The chapter claims to use the Chapter 1 method, but its examples count only production hours: 1.0 h on the patio and 3.0
- (1x) Chapter 3 says JOB-0410 in the Quote Log is a 'Driveway wash' of 600 sq ft at $360.00 ($0.60 per sq ft). The CSV row for
- (1x) The guide text exposes Spanish folder names to an English-speaking buyer: `plantillas/service-agreement-template.md`, `h
- (1x) The JOB-0410 row (Maria Lopez) has sq_ft=1000 and job_type 'Driveway, front sidewalks and oil-stain pre-treatment'. Chap

## Mercado
Sin datos. Regístralos con `swarm metrics <id> --visits N --sales N --revenue N`.

## Próximas iteraciones recomendadas
- **[alta] proceso:** Subir EFFORT_BUILDER a high o reforzar agents/builder/system.md con los defectos recurrentes. _(QA vetó el producto 3 veces.)_
