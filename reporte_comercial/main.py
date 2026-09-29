"""
Orquestador principal — ejecuta el ciclo completo de procesamiento y entrega.

Uso:
    python -m reporte_comercial.main [--modo link|api] [--exportar]
"""
import argparse
import logging
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

from reporte_comercial.config import ARCHIVOS
from reporte_comercial.core.procesador import procesar_consolidado, guardar_consolidado
from reporte_comercial.core.mensaje import construir_mensaje
from reporte_comercial.delivery.whatsapp_link import generar_links_masivos

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


def ejecutar(modo: str = "link", exportar: bool = True) -> pd.DataFrame:
    logger.info("=== Inicio del ciclo de procesamiento ===")

    logger.info("Paso 1: Cargando y cruzando fuentes de datos...")
    consolidado = procesar_consolidado(
        ruta_maestro=ARCHIVOS["maestro_vendedores"],
        ruta_ventas=ARCHIVOS["ventas_diarias"],
        ruta_mecanismo=ARCHIVOS["mecanismo_superior"],
    )
    logger.info("Consolidado: %d vendedores procesados", len(consolidado))

    if exportar:
        ruta_salida = guardar_consolidado(consolidado, ARCHIVOS["consolidado"])
        logger.info("Consolidado exportado: %s", ruta_salida)

    logger.info("Paso 2: Generando mensajes individualizados...")
    registros_envio = []
    for _, row in consolidado.iterrows():
        mensaje = construir_mensaje(
            nombre=row["nombre"],
            equipo=row["equipo"],
            tipo_contrato=row["tipo_contrato"],
            tramo_antiguedad=row["tramo_antiguedad"],
            estado_meta=row["estado_meta"],
            meta_efectiva=row["meta_efectiva"],
            venta_acumulada=row["venta_acumulada"],
            mandatos_aprobados=row["mandatos_aprobados"],
            pct_avance=row["pct_avance"],
            comision_proyectada=row["comision_proyectada"],
            fecha_corte_ventas=row["fecha_corte_ventas"],
            fecha_corte_mecanismo=row["fecha_corte_mecanismo"],
            alerta_firma=row["alerta_firma"],
            alerta_corte=row["alerta_corte"],
        )
        registros_envio.append({
            "rut": row["rut"],
            "nombre": row["nombre"],
            "telefono": row["telefono"],
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
        "--exportar", action="store_true", default=True,
        help="Exportar consolidado a Excel",
    )
    args = parser.parse_args()
    ejecutar(modo=args.modo, exportar=args.exportar)


if __name__ == "__main__":
    main()
