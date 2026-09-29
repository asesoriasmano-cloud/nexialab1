"""
Configuración central del sistema de reportería comercial.
"""
from pathlib import Path
from datetime import date

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
SAMPLES_DIR = DATA_DIR / "samples"
TEMPLATES_DIR = BASE_DIR / "templates"

ARCHIVOS = {
    "maestro_vendedores": DATA_DIR / "maestro_vendedores.xlsx",
    "ventas_diarias": DATA_DIR / "ventas_diarias.xlsx",
    "mecanismo_superior": DATA_DIR / "mecanismo_superior.xlsx",
    "consolidado": DATA_DIR / "consolidado_procesado.xlsx",
    "log_envios": DATA_DIR / "log_envios.xlsx",
}

TRAMOS_ANTIGUEDAD = [
    {"min_meses": 0, "max_meses": 6, "etiqueta": "Nuevo", "factor_meta": 0.70},
    {"min_meses": 7, "max_meses": 12, "etiqueta": "En desarrollo", "factor_meta": 0.85},
    {"min_meses": 13, "max_meses": 24, "etiqueta": "Consolidado", "factor_meta": 1.00},
    {"min_meses": 25, "max_meses": 9999, "etiqueta": "Senior", "factor_meta": 1.10},
]

TIPOS_CONTRATO = {
    "Indefinido": {"factor_comision": 1.00},
    "Plazo Fijo": {"factor_comision": 0.90},
    "Honorarios": {"factor_comision": 0.80},
}

META_PROVISORIA_FACTOR = 0.90

TRAMOS_COMISION = [
    {"min_pct": 0, "max_pct": 49.99, "tasa": 0.00},
    {"min_pct": 50, "max_pct": 79.99, "tasa": 0.02},
    {"min_pct": 80, "max_pct": 99.99, "tasa": 0.04},
    {"min_pct": 100, "max_pct": 119.99, "tasa": 0.06},
    {"min_pct": 120, "max_pct": 9999, "tasa": 0.08},
]

WHATSAPP = {
    "api_url": "https://graph.facebook.com/v18.0/{phone_id}/messages",
    "phone_id": "",  # Configurar con el Phone Number ID de Meta
    "token": "",     # Configurar con el token de acceso
    "template_name": "reporte_ventas_diario",
}

FORMATO_MONEDA = "CLP"
HORA_ENVIO_PROGRAMADO = "08:00"
