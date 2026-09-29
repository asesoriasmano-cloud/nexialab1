"""
Módulo de ingesta: carga y validación de las fuentes de datos.
Soporta tanto el formato real (ejecutivos.xlsx) como el formato normalizado.
"""
import pandas as pd
from pathlib import Path
from typing import Optional

TIPO_CONTRATO_A_GRUPO = {1.4: "A", 3: "B", 3.0: "B"}


def _normalizar_telefono(tel) -> str:
    s = str(tel).strip().replace(" ", "").replace(".0", "")
    if s.startswith("56") and not s.startswith("+"):
        s = "+" + s
    if not s.startswith("+"):
        s = "+56" + s
    return s


def _normalizar_rut(rut) -> str:
    return str(rut).strip().upper()


def cargar_maestro_vendedores(ruta: Path) -> pd.DataFrame:
    df = pd.read_excel(ruta, dtype={"rut": str, "telefono": str})

    if "Ejecutivo normalizado" in df.columns or "tipo contrato" in df.columns:
        df = _convertir_formato_real(df)
    else:
        requeridas = ["rut", "nombre", "telefono", "grupo"]
        faltantes = [c for c in requeridas if c not in df.columns]
        if faltantes:
            raise ValueError(f"Maestro_Vendedores: faltan columnas {faltantes}")

    df["rut"] = df["rut"].apply(_normalizar_rut)
    df["telefono"] = df["telefono"].apply(_normalizar_telefono)
    df["grupo"] = df["grupo"].str.strip().str.upper()
    if "equipo" not in df.columns:
        df["equipo"] = ""
    return df


def _convertir_formato_real(df: pd.DataFrame) -> pd.DataFrame:
    renombrar = {}
    if "Ejecutivo normalizado" in df.columns:
        renombrar["Ejecutivo normalizado"] = "nombre"
    if "volumen" in df.columns:
        renombrar["volumen"] = "meta_volumen"
    col_ms = [c for c in df.columns if "mec" in c.lower() and "sup" in c.lower()]
    if col_ms:
        renombrar[col_ms[0]] = "meta_mecanismo_superior"
    col_q = [c for c in df.columns if "acuerdo" in c.lower()]
    if col_q:
        renombrar[col_q[0]] = "meta_q_acuerdos"

    df = df.rename(columns=renombrar)

    def mapear_grupo(tc):
        tc_str = str(tc).strip().lower()
        if any(k in tc_str for k in ("sup", "jef", "coord", "lider")):
            return "S"
        if "sin" in tc_str:
            return "C"
        try:
            tc_num = float(tc)
        except (ValueError, TypeError):
            return "C"
        return TIPO_CONTRATO_A_GRUPO.get(tc_num, "C")

    df["grupo"] = df["tipo contrato"].apply(mapear_grupo)

    df["meta_monto_acuerdos"] = 0
    df["meta_captacion"] = 0
    df["meta_q_acuerdos"] = df.get("meta_q_acuerdos", pd.Series(0, index=df.index)).fillna(0).astype(int)

    for idx, row in df.iterrows():
        g = row["grupo"]
        vol = row.get("meta_volumen", 0)
        if pd.isna(vol):
            vol = 0
        if g == "A":
            df.at[idx, "meta_monto_acuerdos"] = int(vol)
        elif g == "B":
            df.at[idx, "meta_captacion"] = int(vol)

    if "meta_mecanismo_superior" in df.columns:
        df["meta_mecanismo_superior"] = df["meta_mecanismo_superior"].fillna(0).astype(int)
    else:
        df["meta_mecanismo_superior"] = 0

    df["dias_trabajados"] = 0
    df["dias_mes"] = 30

    columnas_finales = [
        "rut", "nombre", "telefono", "grupo",
        "meta_q_acuerdos", "meta_monto_acuerdos",
        "meta_mecanismo_superior", "meta_captacion",
        "dias_trabajados", "dias_mes",
    ]
    for c in columnas_finales:
        if c not in df.columns:
            df[c] = 0
    return df[columnas_finales]


def cargar_ventas_diarias(ruta: Path) -> pd.DataFrame:
    df = pd.read_excel(ruta, dtype={"rut": str})
    if "rut" not in df.columns or "fecha_corte" not in df.columns:
        raise ValueError("Ventas_Diarias: faltan columnas requeridas")
    df["rut"] = df["rut"].apply(_normalizar_rut)
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
    df["rut"] = df["rut"].apply(_normalizar_rut)
    if "fecha_corte" in df.columns:
        df["fecha_corte"] = pd.to_datetime(df["fecha_corte"]).dt.date
    numeric_cols = df.select_dtypes(include="number").columns
    df[numeric_cols] = df[numeric_cols].fillna(0)
    return df
