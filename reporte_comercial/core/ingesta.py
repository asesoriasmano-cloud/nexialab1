"""
Módulo de ingesta: carga y validación de las fuentes de datos.
"""
import pandas as pd
from pathlib import Path
from typing import Optional


def cargar_maestro_vendedores(ruta: Path) -> pd.DataFrame:
    df = pd.read_excel(ruta, dtype={"rut": str, "telefono": str})
    requeridas = ["rut", "nombre", "telefono", "equipo", "grupo"]
    faltantes = [c for c in requeridas if c not in df.columns]
    if faltantes:
        raise ValueError(f"Maestro_Vendedores: faltan columnas {faltantes}")
    df["rut"] = df["rut"].str.strip().str.upper()
    df["telefono"] = df["telefono"].str.strip()
    df["grupo"] = df["grupo"].str.strip().str.upper()
    return df


def cargar_ventas_diarias(ruta: Path) -> pd.DataFrame:
    df = pd.read_excel(ruta, dtype={"rut": str})
    if "rut" not in df.columns or "fecha_corte" not in df.columns:
        raise ValueError("Ventas_Diarias: faltan columnas requeridas")
    df["rut"] = df["rut"].str.strip().str.upper()
    df["fecha_corte"] = pd.to_datetime(df["fecha_corte"]).dt.date
    numeric_cols = df.select_dtypes(include="number").columns
    df[numeric_cols] = df[numeric_cols].fillna(0)
    return df


def cargar_mecanismo_superior(ruta: Path) -> Optional[pd.DataFrame]:
    if not ruta.exists():
        return None
    df = pd.read_excel(ruta, dtype={"rut": str})
    if "rut" not in df.columns:
        raise ValueError("Mecanismo_Superior: falta columna 'rut'")
    df["rut"] = df["rut"].str.strip().str.upper()
    if "fecha_corte" in df.columns:
        df["fecha_corte"] = pd.to_datetime(df["fecha_corte"]).dt.date
    numeric_cols = df.select_dtypes(include="number").columns
    df[numeric_cols] = df[numeric_cols].fillna(0)
    return df
