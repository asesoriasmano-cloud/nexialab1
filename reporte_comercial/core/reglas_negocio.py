"""
Motor de reglas de negocio: cálculo de metas, comisiones y alertas.
"""
import pandas as pd
from datetime import date
from typing import Optional
from reporte_comercial.config import (
    TRAMOS_ANTIGUEDAD,
    TIPOS_CONTRATO,
    META_PROVISORIA_FACTOR,
    TRAMOS_COMISION,
)


def clasificar_antiguedad(meses: int) -> dict:
    for tramo in TRAMOS_ANTIGUEDAD:
        if tramo["min_meses"] <= meses <= tramo["max_meses"]:
            return tramo
    return TRAMOS_ANTIGUEDAD[-1]


def calcular_meta_efectiva(
    meta_base: float,
    meta_asignada: float,
    estado_meta: str,
    tipo_contrato: str,
    antiguedad_meses: int,
) -> tuple[float, str]:
    """Retorna (meta_efectiva, alerta_firma)."""
    tramo = clasificar_antiguedad(antiguedad_meses)
    factor_tramo = tramo["factor_meta"]

    meta_contrato = meta_asignada * factor_tramo

    if estado_meta != "Firmada":
        meta_efectiva = meta_contrato * META_PROVISORIA_FACTOR
        alerta = (
            f"Meta provisoria ({META_PROVISORIA_FACTOR:.0%} de "
            f"${meta_contrato:,.0f}). Pendiente firma de anexo."
        )
    else:
        meta_efectiva = meta_contrato
        alerta = ""

    return meta_efectiva, alerta


def calcular_comision(
    venta: float,
    meta_efectiva: float,
    tipo_contrato: str,
    mandatos_aprobados: Optional[float] = None,
) -> float:
    if meta_efectiva <= 0:
        return 0.0

    base_calculo = mandatos_aprobados if mandatos_aprobados is not None else venta
    pct_avance = (base_calculo / meta_efectiva) * 100

    tasa = 0.0
    for tramo in TRAMOS_COMISION:
        if tramo["min_pct"] <= pct_avance <= tramo["max_pct"]:
            tasa = tramo["tasa"]
            break

    factor_contrato = TIPOS_CONTRATO.get(tipo_contrato, {}).get("factor_comision", 1.0)
    comision = base_calculo * tasa * factor_contrato
    return round(comision, 0)


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
