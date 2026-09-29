"""
Orquestador principal — ejecuta el ciclo completo de procesamiento y entrega.

Uso:
    python -m reporte_comercial.main [--modo link|api|preview] [--fuentes real|ejemplo]
"""
import argparse
import logging
from pathlib import Path

import pandas as pd

from reporte_comercial.config import ARCHIVOS
from reporte_comercial.core.procesador import (
    procesar_consolidado,
    procesar_consolidado_real,
    guardar_consolidado,
)
from reporte_comercial.core.mensaje import construir_mensaje
from reporte_comercial.delivery.whatsapp_link import generar_links_masivos

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def ejecutar(modo: str = "link", fuentes: str = "real", exportar: bool = True) -> pd.DataFrame:
    logger.info("=== Inicio del ciclo de procesamiento (fuentes: %s) ===", fuentes)

    logger.info("Paso 1: Cargando y cruzando fuentes de datos...")
    if fuentes == "real":
        consolidado = procesar_consolidado_real(
            ruta_maestro=ARCHIVOS["maestro_vendedores"],
            ruta_data20=ARCHIVOS["data_20"],
            ruta_data21=ARCHIVOS["data_21"],
            ruta_ms_template=ARCHIVOS["ms_template"],
        )
    else:
        consolidado = procesar_consolidado(
            ruta_maestro=ARCHIVOS["maestro_vendedores"],
            ruta_ventas=ARCHIVOS["ventas_diarias"],
            ruta_mecanismo=ARCHIVOS["mecanismo_superior"],
        )

    for g in ["A", "B", "C", "S"]:
        n = len(consolidado[consolidado["grupo"] == g])
        if n > 0:
            logger.info("  Grupo %s: %d", g, n)

    if exportar:
        ruta_salida = guardar_consolidado(consolidado, ARCHIVOS["consolidado"])
        logger.info("Consolidado exportado: %s", ruta_salida)

    logger.info("Paso 2: Generando mensajes individualizados...")
    registros_envio = []
    for _, row in consolidado.iterrows():
        mensaje = construir_mensaje(row.to_dict())
        registros_envio.append({
            "rut": row["rut"],
            "nombre": row["nombre"],
            "telefono": row["telefono"],
            "grupo": row["grupo"],
            "comision": row.get("comision", 0),
            "mensaje": mensaje,
        })

    logger.info("Paso 3: Preparando entrega (%s)...", modo)
    if modo == "link":
        registros_envio = generar_links_masivos(registros_envio)
        df_envio = pd.DataFrame(registros_envio)
        ruta_links = ARCHIVOS["log_envios"].parent / "links_whatsapp.xlsx"
        df_envio.to_excel(ruta_links, index=False)
        logger.info("Links generados: %s", ruta_links)

    elif modo == "api":
        from reporte_comercial.delivery.whatsapp_api import enviar_masivo
        resultados = enviar_masivo(registros_envio)
        df_envio = pd.DataFrame(resultados)
        df_envio.to_excel(ARCHIVOS["log_envios"], index=False)
        logger.info("Envio API completado. Log: %s", ARCHIVOS["log_envios"])

    else:
        df_envio = pd.DataFrame(registros_envio)
        logger.info("Modo '%s': mensajes generados sin entrega.", modo)

    logger.info("=== Ciclo completado: %d reportes procesados ===", len(df_envio))
    return df_envio


def main():
    parser = argparse.ArgumentParser(description="Reporteria Comercial Individualizada")
    parser.add_argument(
        "--modo", choices=["link", "api", "preview"],
        default="link",
        help="Modo de entrega: 'link' (wa.me), 'api' (WhatsApp Business API), 'preview' (solo generar)",
    )
    parser.add_argument(
        "--fuentes", choices=["real", "ejemplo"],
        default="real",
        help="Origen de datos: 'real' (data_20+data_21+MS template), 'ejemplo' (archivos pre-generados)",
    )
    args = parser.parse_args()
    ejecutar(modo=args.modo, fuentes=args.fuentes)


if __name__ == "__main__":
    main()
