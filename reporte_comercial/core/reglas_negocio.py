"""
Motor de reglas de negocio — 3 esquemas de comisión reales.
"""
import math
from datetime import date
from typing import Optional

from reporte_comercial.config import GRUPO_A, GRUPO_B, GRUPO_C
from reporte_comercial.core.modelos import (
    ResultadoGrupoA,
    ResultadoGrupoB,
    ResultadoGrupoC,
)


def _buscar_tramo(tramos: list[dict], valor: float) -> dict:
    for t in tramos:
        if t["min"] <= valor <= t["max"]:
            return t
    return tramos[0]


def _clamp_kpi(pct_raw: float, piso: float, tope: float) -> float:
    if pct_raw < piso:
        return 0.0
    return min(pct_raw, tope)


def _pct(real: float, meta: float) -> float:
    if meta <= 0:
        return 0.0
    return (real / meta) * 100


# ──────────────────────────────────────────────────────────
# GRUPO A — 3 KPIs ponderados, tope 140%
# ──────────────────────────────────────────────────────────
def calcular_grupo_a(
    meta_q: float,
    meta_monto: float,
    meta_ms: float,
    real_q: float,
    real_monto: float,
    real_ms: float,
    dias_trabajados: int = 0,
    dias_mes: int = 30,
) -> ResultadoGrupoA:
    cfg = GRUPO_A
    piso = cfg["piso_pct"]
    tope = cfg["tope_pct"]

    prop = (dias_trabajados / dias_mes) if dias_trabajados > 0 and dias_mes > 0 else 1.0
    meta_q_adj = meta_q * prop
    meta_monto_adj = meta_monto * prop
    meta_ms_adj = meta_ms * prop

    pct_q = _pct(real_q, meta_q_adj)
    pct_monto = _pct(real_monto, meta_monto_adj)
    pct_ms = _pct(real_ms, meta_ms_adj)

    cq = _clamp_kpi(pct_q, piso, tope)
    cm = _clamp_kpi(pct_monto, piso, tope)
    cms = _clamp_kpi(pct_ms, piso, tope)

    aporte_q = cq * 0.25
    aporte_m = cm * 0.40
    aporte_ms = cms * 0.35
    global_pct = aporte_q + aporte_m + aporte_ms

    tramo = _buscar_tramo(cfg["tramos_comision"], global_pct)
    comision = tramo["valor"]
    if prop < 1 and prop > 0:
        comision = round(comision * prop)

    return ResultadoGrupoA(
        pct_q=round(pct_q, 1),
        pct_monto=round(pct_monto, 1),
        pct_ms=round(pct_ms, 1),
        pct_q_clamped=round(cq, 1),
        pct_monto_clamped=round(cm, 1),
        pct_ms_clamped=round(cms, 1),
        aporte_q=round(aporte_q, 1),
        aporte_monto=round(aporte_m, 1),
        aporte_ms=round(aporte_ms, 1),
        cumplimiento_global=round(global_pct, 1),
        comision=comision,
        tramo_label=f"{tramo['min']:.0f}%-{tramo['max']:.0f}%",
    )


# ──────────────────────────────────────────────────────────
# GRUPO B — 2 KPIs + reajustes + donaciones, tope 300%
# ──────────────────────────────────────────────────────────
def _factor_reajuste(monto: float) -> float:
    for r in GRUPO_B["reajustes_factores"]:
        if r["min"] <= monto <= r["max"]:
            return r["factor"]
    return 0.0


def calcular_grupo_b(
    meta_captacion: float,
    meta_ms: float,
    real_captacion: float,
    real_ms: float,
    real_reajustes: float = 0,
    real_donaciones: float = 0,
) -> ResultadoGrupoB:
    cfg = GRUPO_B
    piso = cfg["piso_pct"]
    tope = cfg["tope_pct"]

    pct_cap = _pct(real_captacion, meta_captacion)
    pct_ms = _pct(real_ms, meta_ms)

    ccap = _clamp_kpi(pct_cap, piso, tope)
    cms = _clamp_kpi(pct_ms, piso, tope)

    pond_cap = (ccap / 100) * 70
    pond_ms = (cms / 100) * 30
    global_raw = pond_cap + pond_ms
    global_pct = math.ceil(global_raw * 10) / 10

    tramo = _buscar_tramo(cfg["tramos_comision"], global_pct)
    variable1 = tramo["valor"]

    factor = _factor_reajuste(real_reajustes)
    variable2 = round(real_reajustes * factor)

    variable3 = round(real_donaciones * cfg["donaciones_pct"])

    return ResultadoGrupoB(
        pct_captacion=round(pct_cap, 1),
        pct_ms=round(pct_ms, 1),
        pct_captacion_clamped=round(ccap, 1),
        pct_ms_clamped=round(cms, 1),
        ponderado_captacion=round(pond_cap, 1),
        ponderado_ms=round(pond_ms, 1),
        cumplimiento_global=global_pct,
        variable1=variable1,
        variable2=variable2,
        variable3=variable3,
        comision_total=variable1 + variable2 + variable3,
        tramo_label=f"{tramo['min']:.0f}%-{tramo['max']:.0f}%",
    )


# ──────────────────────────────────────────────────────────
# GRUPO C — Sin metas, comisión por producción
# ──────────────────────────────────────────────────────────
def calcular_grupo_c(
    venta_total: float,
    monto_preferente: float = 0,
    monto_gold: float = 0,
) -> ResultadoGrupoC:
    monto_general = max(0, venta_total - monto_preferente - monto_gold)

    tramo = _buscar_tramo(GRUPO_C["tramos"], venta_total)

    com_gen = round(monto_general * tramo["general"])
    com_pref = round(monto_preferente * tramo["preferente"])
    com_gold = round(monto_gold * tramo["gold"])

    return ResultadoGrupoC(
        venta_total=venta_total,
        monto_general=monto_general,
        monto_preferente=monto_preferente,
        monto_gold=monto_gold,
        pct_general=tramo["general"],
        pct_preferente=tramo["preferente"],
        pct_gold=tramo["gold"],
        com_general=com_gen,
        com_preferente=com_pref,
        com_gold=com_gold,
        comision_total=com_gen + com_pref + com_gold,
        tramo_label=f"${tramo['min']:,}-${tramo['max']:,}",
    )


# ──────────────────────────────────────────────────────────
# Alertas de corte temporal
# ──────────────────────────────────────────────────────────
def generar_alerta_corte(
    fecha_mecanismo: Optional[date],
    fecha_ventas: date,
) -> str:
    if fecha_mecanismo is None:
        return "Sin reporte de Mecanismo Superior disponible. Comision basada en ventas brutas."
    dias_desfase = (fecha_ventas - fecha_mecanismo).days
    if dias_desfase > 7:
        return (
            f"Mecanismo Superior con {dias_desfase} dias de desfase "
            f"(corte: {fecha_mecanismo.strftime('%d/%m/%Y')}). "
            f"Comision sujeta a ajuste."
        )
    return f"Mecanismo Superior al {fecha_mecanismo.strftime('%d/%m/%Y')}."
