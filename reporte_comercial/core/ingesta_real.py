"""
Ingesta de fuentes reales: data_20 (fichas/membresías), data_21 (VPOS),
y Template Mecanismo Superior → genera ventas_diarias consolidadas.
"""
import pandas as pd
from datetime import date
from pathlib import Path
from typing import Optional

from reporte_comercial.config import SIMULACION_GOLD_PREFERENTE_SPLIT


def _norm_rut(rut) -> str:
    return str(rut).strip().upper().replace(".", "").replace(" ", "")


def _cargar_data_20(ruta: Path) -> pd.DataFrame:
    df = pd.read_excel(ruta)
    df = df.dropna(subset=["RUT EJEUTIVO"])
    df = df[df["AUDITORIA"] != "SE DESCUENTA"].copy()
    df["rut"] = df["RUT EJEUTIVO"].apply(_norm_rut)
    df["FECHA"] = pd.to_datetime(df["FECHA"], errors="coerce")
    df["MONTO"] = pd.to_numeric(df["MONTO"], errors="coerce").fillna(0)
    return df


def _cargar_data_21(ruta: Path) -> pd.DataFrame:
    df = pd.read_excel(ruta)
    df = df.dropna(subset=["RUT EJECUTIVO"])
    df["rut"] = df["RUT EJECUTIVO"].apply(_norm_rut)
    df["FECHA"] = pd.to_datetime(df["FECHA"], errors="coerce")
    df["MONTO"] = pd.to_numeric(df["MONTO"], errors="coerce").fillna(0)
    return df


def _cargar_ms_template(ruta: Path, mes: int = 9, anio: int = 2026) -> pd.DataFrame:
    df = pd.read_excel(ruta, sheet_name="Detalle")
    df = df[(df["Mes"] == mes) & (df["Año"] == anio)].copy()
    rechazos = ["Rechazo Auditoría Marcel", "Rechazo Control de Ingresos"]
    df = df[~df["Auditoria"].isin(rechazos)]
    df["rut"] = df["Rut_ejecutivo"].apply(_norm_rut)
    df["monto"] = pd.to_numeric(df["monto"], errors="coerce").fillna(0)
    return df


def construir_ventas_desde_fuentes(
    ruta_data20: Path,
    ruta_data21: Path,
    ruta_ms: Path,
    ruts_validos: set[str],
    mes_ms: int = 9,
    anio_ms: int = 2026,
) -> pd.DataFrame:
    d20 = _cargar_data_20(ruta_data20)
    d21 = _cargar_data_21(ruta_data21)
    ms = _cargar_ms_template(ruta_ms, mes_ms, anio_ms)

    ruts_norm = {_norm_rut(r) for r in ruts_validos}

    fechas = pd.concat([d20["FECHA"], d21["FECHA"]]).dropna()
    fecha_corte = fechas.max().date() if not fechas.empty else date.today()

    resultados = []
    for rut in ruts_norm:
        e20 = d20[d20["rut"] == rut]
        e21 = d21[d21["rut"] == rut]
        ems = ms[ms["rut"] == rut]

        q_acuerdos = len(e20) + len(e21)
        monto_volumen = e20["MONTO"].sum() + e21["MONTO"].sum()

        ms_superior = ems[ems["Mecanismo"] == "SUPERIOR"]["monto"].sum()

        donaciones = ems[
            ems["plan_name"].str.contains("Donaci", case=False, na=False)
        ]["monto"].sum()

        split = SIMULACION_GOLD_PREFERENTE_SPLIT
        monto_gold = ms_superior * split
        monto_preferente = ms_superior * (1 - split)

        resultados.append({
            "rut": rut,
            "fecha_corte": fecha_corte,
            "real_q_acuerdos": q_acuerdos,
            "real_monto_acuerdos": monto_volumen,
            "real_captacion": monto_volumen,
            "real_mecanismo_superior": ms_superior,
            "real_reajustes": 0,
            "real_donaciones": donaciones,
            "venta_total": monto_volumen,
            "monto_preferente": monto_preferente,
            "monto_gold": monto_gold,
        })

    return pd.DataFrame(resultados)


def construir_ms_resumen(
    ruta_ms: Path,
    ruts_validos: set[str],
    mes: int = 9,
    anio: int = 2026,
) -> pd.DataFrame:
    ms = _cargar_ms_template(ruta_ms, mes, anio)
    ruts_norm = {_norm_rut(r) for r in ruts_validos}
    ms_ours = ms[ms["rut"].isin(ruts_norm)]

    if ms_ours.empty:
        return pd.DataFrame(columns=["rut", "fecha_corte", "monto_superior"])

    fecha_corte = date(anio, mes, 28)

    resumen = (
        ms_ours[ms_ours["Mecanismo"] == "SUPERIOR"]
        .groupby("rut")["monto"]
        .sum()
        .reset_index()
    )
    resumen.columns = ["rut", "monto_superior"]
    resumen["fecha_corte"] = fecha_corte

    return resumen
