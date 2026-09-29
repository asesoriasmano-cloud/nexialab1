"""
Bucle de procesamiento: cruza las 3 fuentes y genera el consolidado.
"""
import pandas as pd
from datetime import date
from pathlib import Path
from typing import Optional

from reporte_comercial.core.ingesta import (
    cargar_maestro_vendedores,
    cargar_ventas_diarias,
    cargar_mecanismo_superior,
)
from reporte_comercial.core.reglas_negocio import (
    clasificar_antiguedad,
    calcular_meta_efectiva,
    calcular_comision,
    generar_alerta_corte,
)


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
    if mecanismo is not None and not mecanismo.empty:
        fecha_corte_mecanismo = mecanismo["fecha_corte"].max()

    resultados = []

    for _, v in maestro.iterrows():
        rut = v["rut"]

        tramo = clasificar_antiguedad(v["antiguedad_meses"])
        meta_efectiva, alerta_firma = calcular_meta_efectiva(
            meta_base=v["meta_base"],
            meta_asignada=v["meta_asignada"],
            estado_meta=v["estado_meta"],
            tipo_contrato=v["tipo_contrato"],
            antiguedad_meses=v["antiguedad_meses"],
        )

        fila_ventas = ventas.loc[ventas["rut"] == rut]
        venta_acumulada = (
            fila_ventas["venta_acumulada"].iloc[0]
            if not fila_ventas.empty
            else 0.0
        )

        mandatos = None
        if mecanismo is not None:
            fila_mec = mecanismo.loc[mecanismo["rut"] == rut]
            if not fila_mec.empty:
                mandatos = fila_mec["mandatos_aprobados"].iloc[0]

        pct_avance = (
            round((venta_acumulada / meta_efectiva) * 100, 1)
            if meta_efectiva > 0
            else 0.0
        )

        comision = calcular_comision(
            venta=venta_acumulada,
            meta_efectiva=meta_efectiva,
            tipo_contrato=v["tipo_contrato"],
            mandatos_aprobados=mandatos,
        )

        alerta_corte = generar_alerta_corte(fecha_corte_mecanismo, fecha_corte_ventas)

        resultados.append({
            "rut": rut,
            "nombre": v["nombre"],
            "telefono": v["telefono"],
            "equipo": v["equipo"],
            "tipo_contrato": v["tipo_contrato"],
            "tramo_antiguedad": tramo["etiqueta"],
            "estado_meta": v["estado_meta"],
            "meta_efectiva": meta_efectiva,
            "venta_acumulada": venta_acumulada,
            "mandatos_aprobados": mandatos if mandatos is not None else 0.0,
            "pct_avance": pct_avance,
            "comision_proyectada": comision,
            "fecha_corte_ventas": fecha_corte_ventas,
            "fecha_corte_mecanismo": fecha_corte_mecanismo,
            "alerta_firma": alerta_firma,
            "alerta_corte": alerta_corte,
        })

    return pd.DataFrame(resultados)


def guardar_consolidado(df: pd.DataFrame, ruta: Path) -> Path:
    df.to_excel(ruta, index=False, sheet_name="Consolidado")
    return ruta
