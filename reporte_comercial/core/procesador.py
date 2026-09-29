"""
Bucle de procesamiento: cruza fuentes y genera consolidado por grupo.
"""
import pandas as pd
from pathlib import Path

from reporte_comercial.core.ingesta import (
    cargar_maestro_vendedores,
    cargar_ventas_diarias,
    cargar_mecanismo_superior,
)
from reporte_comercial.core.reglas_negocio import (
    calcular_grupo_a,
    calcular_grupo_b,
    calcular_grupo_c,
    generar_alerta_corte,
)


def _val(df, rut, col, default=0):
    fila = df.loc[df["rut"] == rut]
    if fila.empty or col not in df.columns:
        return default
    return fila[col].iloc[0]


def _acumular_equipo(resultados: list[dict], ventas: pd.DataFrame) -> dict:
    """Calcula acumulados por item para el resumen de la supervisora."""
    acum = {
        "grupo_a": {"n": 0, "real_q": 0, "meta_q": 0, "real_monto": 0, "meta_monto": 0,
                     "real_ms": 0, "meta_ms": 0, "comision_total": 0},
        "grupo_b": {"n": 0, "real_captacion": 0, "meta_captacion": 0,
                     "real_ms": 0, "meta_ms": 0,
                     "real_reajustes": 0, "real_donaciones": 0,
                     "comision_total": 0},
        "grupo_c": {"n": 0, "venta_total": 0, "monto_general": 0,
                     "monto_preferente": 0, "monto_gold": 0,
                     "comision_total": 0},
        "comision_equipo": 0,
    }

    for r in resultados:
        g = r.get("grupo")
        com = r.get("comision", 0)
        acum["comision_equipo"] += com

        if g == "A":
            a = acum["grupo_a"]
            a["n"] += 1
            a["real_q"] += r.get("pct_q", 0)
            a["real_monto"] += r.get("pct_monto", 0)
            a["real_ms"] += r.get("pct_ms", 0)
            a["comision_total"] += com

        elif g == "B":
            b = acum["grupo_b"]
            b["n"] += 1
            b["real_captacion"] += r.get("pct_captacion", 0)
            b["real_ms"] += r.get("pct_ms", 0)
            b["real_reajustes"] += r.get("variable2", 0)
            b["real_donaciones"] += r.get("variable3", 0)
            b["comision_total"] += com

        elif g == "C":
            c = acum["grupo_c"]
            c["n"] += 1
            c["venta_total"] += r.get("venta_total", 0)
            c["monto_general"] += r.get("monto_general", 0)
            c["monto_preferente"] += r.get("monto_preferente", 0)
            c["monto_gold"] += r.get("monto_gold", 0)
            c["comision_total"] += com

    return acum


def procesar_consolidado(
    ruta_maestro: Path,
    ruta_ventas: Path,
    ruta_mecanismo: Path,
) -> pd.DataFrame:
    maestro = cargar_maestro_vendedores(ruta_maestro)
    ventas = cargar_ventas_diarias(ruta_ventas)
    mecanismo = cargar_mecanismo_superior(ruta_mecanismo)

    fecha_corte_ventas = ventas["fecha_corte"].max()
    fecha_corte_mecanismo = None
    if mecanismo is not None and not mecanismo.empty and "fecha_corte" in mecanismo.columns:
        fecha_corte_mecanismo = mecanismo["fecha_corte"].max()

    resultados = []
    supervisoras = []

    for _, v in maestro.iterrows():
        rut = v["rut"]
        grupo = v["grupo"]

        base = {
            "rut": rut,
            "nombre": v["nombre"],
            "telefono": v["telefono"],
            "equipo": v.get("equipo", ""),
            "grupo": grupo,
            "fecha_corte_ventas": fecha_corte_ventas,
            "fecha_corte_mecanismo": fecha_corte_mecanismo,
            "alerta_corte": generar_alerta_corte(fecha_corte_mecanismo, fecha_corte_ventas),
        }

        if grupo == "S":
            supervisoras.append(base)
            continue

        if grupo == "A":
            r = calcular_grupo_a(
                meta_q=v.get("meta_q_acuerdos", 0),
                meta_monto=v.get("meta_monto_acuerdos", 0),
                meta_ms=v.get("meta_mecanismo_superior", 0),
                real_q=_val(ventas, rut, "real_q_acuerdos"),
                real_monto=_val(ventas, rut, "real_monto_acuerdos"),
                real_ms=_val(ventas, rut, "real_mecanismo_superior"),
                dias_trabajados=int(v.get("dias_trabajados", 0)),
                dias_mes=int(v.get("dias_mes", 30)),
            )
            base.update({
                "esquema": "3 KPIs (tope 140%)",
                "pct_q": r.pct_q,
                "pct_monto": r.pct_monto,
                "pct_ms": r.pct_ms,
                "cumplimiento_global": r.cumplimiento_global,
                "comision": r.comision,
                "tramo": r.tramo_label,
                "detalle": (
                    f"Q:{r.pct_q}%[→{r.pct_q_clamped}%]×25% + "
                    f"$:{r.pct_monto}%[→{r.pct_monto_clamped}%]×40% + "
                    f"MS:{r.pct_ms}%[→{r.pct_ms_clamped}%]×35% = {r.cumplimiento_global}%"
                ),
            })

        elif grupo == "B":
            r = calcular_grupo_b(
                meta_captacion=v.get("meta_captacion", 0),
                meta_ms=v.get("meta_mecanismo_superior", 0),
                real_captacion=_val(ventas, rut, "real_captacion"),
                real_ms=_val(ventas, rut, "real_mecanismo_superior"),
                real_reajustes=_val(ventas, rut, "real_reajustes"),
                real_donaciones=_val(ventas, rut, "real_donaciones"),
            )
            base.update({
                "esquema": "2 KPIs (tope 300%) + Reajustes",
                "pct_captacion": r.pct_captacion,
                "pct_ms": r.pct_ms,
                "cumplimiento_global": r.cumplimiento_global,
                "variable1": r.variable1,
                "variable2": r.variable2,
                "variable3": r.variable3,
                "comision": r.comision_total,
                "tramo": r.tramo_label,
                "detalle": (
                    f"Cap:{r.pct_captacion}%×70% + MS:{r.pct_ms}%×30% = {r.cumplimiento_global}% | "
                    f"V1:${r.variable1:,} + V2:${r.variable2:,} + V3:${r.variable3:,}"
                ),
            })

        elif grupo == "C":
            r = calcular_grupo_c(
                venta_total=_val(ventas, rut, "venta_total"),
                monto_preferente=_val(ventas, rut, "monto_preferente"),
                monto_gold=_val(ventas, rut, "monto_gold"),
            )
            base.update({
                "esquema": "Sin metas — por produccion",
                "venta_total": r.venta_total,
                "monto_general": r.monto_general,
                "monto_preferente": r.monto_preferente,
                "monto_gold": r.monto_gold,
                "com_general": r.com_general,
                "com_preferente": r.com_preferente,
                "com_gold": r.com_gold,
                "comision": r.comision_total,
                "tramo": r.tramo_label,
                "detalle": (
                    f"Gen:${r.monto_general:,}×{r.pct_general:.0%} + "
                    f"Pref:${r.monto_preferente:,}×{r.pct_preferente:.0%} + "
                    f"Gold:${r.monto_gold:,}×{r.pct_gold:.0%}"
                ),
            })

        resultados.append(base)

    if supervisoras:
        acum = _acumular_equipo(resultados, ventas)
        for sup in supervisoras:
            sup.update({
                "esquema": "Supervisora — Resumen acumulado",
                "comision": 0,
                "tramo": "",
                "acumulado": acum,
            })
            resultados.append(sup)

    return pd.DataFrame(resultados)


def guardar_consolidado(df: pd.DataFrame, ruta: Path) -> Path:
    df.to_excel(ruta, index=False, sheet_name="Consolidado")
    return ruta
