"""
Módulo de ingesta: carga y validación de las tres fuentes de datos.
"""
import pandas as pd
from pathlib import Path
from datetime import date
from typing import Optional


def cargar_maestro_vendedores(ruta: Path) -> pd.DataFrame:
    df = pd.read_excel(ruta, dtype={"rut": str, "telefono": str})
    columnas_requeridas = [
        "rut", "nombre", "telefono", "equipo",
        "tipo_contrato", "antiguedad_meses",
        "estado_meta", "meta_base", "meta_asignada",
    ]
    faltantes = [c for c in columnas_requeridas if c not in df.columns]
    if faltantes:
        raise ValueError(f"Maestro_Vendedores: faltan columnas {faltantes}")

    df["rut"] = df["rut"].str.strip().str.upper()
    df["telefono"] = df["telefono"].str.strip()
    return df


def cargar_ventas_diarias(ruta: Path) -> pd.DataFrame:
    df = pd.read_excel(ruta, dtype={"rut": str})
    for col in ["rut", "venta_acumulada", "fecha_corte"]:
        if col not in df.columns:
            raise ValueError(f"Ventas_Diarias: falta columna '{col}'")

    df["rut"] = df["rut"].str.strip().str.upper()
    df["fecha_corte"] = pd.to_datetime(df["fecha_corte"]).dt.date
    return df


def cargar_mecanismo_superior(ruta: Path) -> Optional[pd.DataFrame]:
    if not ruta.exists():
        return None

    df = pd.read_excel(ruta, dtype={"rut": str})
    for col in ["rut", "mandatos_aprobados", "fecha_corte"]:
        if col not in df.columns:
            raise ValueError(f"Mecanismo_Superior: falta columna '{col}'")

    df["rut"] = df["rut"].str.strip().str.upper()
    df["fecha_corte"] = pd.to_datetime(df["fecha_corte"]).dt.date
    return df
