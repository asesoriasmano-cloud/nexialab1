"""
Modelos de datos para los 3 esquemas de comisión.
"""
from dataclasses import dataclass, field
from datetime import date
from typing import Optional


@dataclass
class Vendedor:
    rut: str
    nombre: str
    telefono: str
    equipo: str
    grupo: str  # "A", "B", "C"
    # Grupo A: meta_q, meta_monto, meta_ms
    meta_q_acuerdos: float = 0
    meta_monto_acuerdos: float = 0
    meta_mecanismo_superior: float = 0
    # Grupo B: meta_captacion, meta_ms
    meta_captacion: float = 0
    # Grupo C: no tiene metas
    dias_trabajados: int = 0  # 0 = mes completo
    dias_mes: int = 30


@dataclass
class ProduccionDiaria:
    rut: str
    fecha_corte: date
    # Grupo A
    real_q_acuerdos: float = 0
    real_monto_acuerdos: float = 0
    real_mecanismo_superior: float = 0
    # Grupo B
    real_captacion: float = 0
    real_reajustes: float = 0
    real_donaciones: float = 0
    # Grupo C
    venta_total: float = 0
    monto_general: float = 0
    monto_preferente: float = 0
    monto_gold: float = 0


@dataclass
class ResultadoGrupoA:
    pct_q: float = 0
    pct_monto: float = 0
    pct_ms: float = 0
    pct_q_clamped: float = 0
    pct_monto_clamped: float = 0
    pct_ms_clamped: float = 0
    aporte_q: float = 0
    aporte_monto: float = 0
    aporte_ms: float = 0
    cumplimiento_global: float = 0
    comision: float = 0
    tramo_label: str = ""


@dataclass
class ResultadoGrupoB:
    pct_captacion: float = 0
    pct_ms: float = 0
    pct_captacion_clamped: float = 0
    pct_ms_clamped: float = 0
    ponderado_captacion: float = 0
    ponderado_ms: float = 0
    cumplimiento_global: float = 0
    variable1: float = 0  # tabla
    variable2: float = 0  # reajustes
    variable3: float = 0  # donaciones
    comision_total: float = 0
    tramo_label: str = ""


@dataclass
class ResultadoGrupoC:
    venta_total: float = 0
    monto_general: float = 0
    monto_preferente: float = 0
    monto_gold: float = 0
    pct_general: float = 0
    pct_preferente: float = 0
    pct_gold: float = 0
    com_general: float = 0
    com_preferente: float = 0
    com_gold: float = 0
    comision_total: float = 0
    tramo_label: str = ""
