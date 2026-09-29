"""
Modelos de datos: esquemas esperados para cada tabla de entrada.
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
    tipo_contrato: str
    antiguedad_meses: int
    estado_meta: str  # "Firmada" | "Pendiente"
    meta_base: float
    meta_asignada: float
    meta_efectiva: float = 0.0
    tramo_antiguedad: str = ""
    alerta_firma: str = ""


@dataclass
class VentaDiaria:
    rut: str
    venta_acumulada: float
    fecha_corte: date


@dataclass
class MecanismoSuperior:
    rut: str
    mandatos_aprobados: float
    fecha_corte: date


@dataclass
class Consolidado:
    rut: str
    nombre: str
    telefono: str
    equipo: str
    tipo_contrato: str
    tramo_antiguedad: str
    estado_meta: str
    meta_efectiva: float
    venta_acumulada: float
    mandatos_aprobados: float
    pct_avance: float
    comision_proyectada: float
    fecha_corte_ventas: date
    fecha_corte_mecanismo: Optional[date]
    alerta_firma: str
    alerta_corte: str
