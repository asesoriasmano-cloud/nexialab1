"""
Configuración central — esquemas de comisión reales (Hogar de Cristo 2025-2026).
"""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

ARCHIVOS = {
    "maestro_vendedores": DATA_DIR / "maestro_vendedores.xlsx",
    "ventas_diarias": DATA_DIR / "ventas_diarias.xlsx",
    "mecanismo_superior": DATA_DIR / "mecanismo_superior.xlsx",
    "consolidado": DATA_DIR / "consolidado_procesado.xlsx",
    "log_envios": DATA_DIR / "log_envios.xlsx",
}

# ──────────────────────────────────────────────────────────
# GRUPO A — 3 ejecutivas (tipo contrato 1.4)
# 3 KPIs: Q Acuerdos (25%) + Monto $ Acuerdos (40%) + Mec. Superior (35%)
# Piso 70% por KPI (bajo 70% → pondera 0%), tope 140% por KPI
# Cumplimiento global ponderado → tabla de monto fijo
# ──────────────────────────────────────────────────────────
GRUPO_A = {
    "nombre": "Esquema 3 KPIs (tope 140%)",
    "kpis": [
        {"id": "q_acuerdos", "label": "Q Acuerdos", "peso": 0.25},
        {"id": "monto_acuerdos", "label": "Monto $ Acuerdos", "peso": 0.40},
        {"id": "mecanismo_superior", "label": "Mecanismo Superior", "peso": 0.35},
    ],
    "piso_pct": 70,
    "tope_pct": 140,
    "tramos_comision": [
        {"min": 0, "max": 69.99, "valor": 0},
        {"min": 70, "max": 79.99, "valor": 132_000},
        {"min": 80, "max": 89.99, "valor": 211_000},
        {"min": 90, "max": 99.99, "valor": 264_000},
        {"min": 100, "max": 104.99, "valor": 316_000},
        {"min": 105, "max": 109.99, "valor": 369_600},
        {"min": 110, "max": 119.99, "valor": 422_400},
        {"min": 120, "max": 129.99, "valor": 528_000},
        {"min": 130, "max": 139.99, "valor": 607_000},
        {"min": 140, "max": 9999, "valor": 683_300},
    ],
}

# ──────────────────────────────────────────────────────────
# GRUPO B — 7 ejecutivas (tipo contrato 3)
# 2 KPIs: Captación/Monto (70%) + Mec. Superior (30%)
# Piso 70% por KPI, tope 300%
# Cumplimiento global → tabla de monto fijo
# + Variable 2: Reajustes IPC/UF (factor 0.5 / 1.0 / 1.3)
# + Variable 3: Donaciones (20% del monto)
# ──────────────────────────────────────────────────────────
GRUPO_B = {
    "nombre": "Esquema 2 KPIs (tope 300%) + Reajustes",
    "kpis": [
        {"id": "monto_captacion", "label": "Captación ($)", "peso": 0.70},
        {"id": "mecanismo_superior", "label": "Mecanismo Superior", "peso": 0.30},
    ],
    "piso_pct": 70,
    "tope_pct": 300,
    "tramos_comision": [
        {"min": 0, "max": 69.99, "valor": 0},
        {"min": 70, "max": 79.99, "valor": 132_000},
        {"min": 80, "max": 89.99, "valor": 211_000},
        {"min": 90, "max": 99.99, "valor": 264_000},
        {"min": 100, "max": 104.99, "valor": 316_000},
        {"min": 105, "max": 109.99, "valor": 369_600},
        {"min": 110, "max": 119.99, "valor": 422_400},
        {"min": 120, "max": 129.99, "valor": 528_000},
        {"min": 130, "max": 139.99, "valor": 607_000},
        {"min": 140, "max": 149.99, "valor": 683_300},
        {"min": 150, "max": 159.99, "valor": 715_000},
        {"min": 160, "max": 169.99, "valor": 750_000},
        {"min": 170, "max": 179.99, "valor": 800_000},
        {"min": 180, "max": 189.99, "valor": 850_000},
        {"min": 190, "max": 199.99, "valor": 900_000},
        {"min": 200, "max": 214.99, "valor": 950_000},
        {"min": 215, "max": 249.99, "valor": 1_000_000},
        {"min": 250, "max": 274.99, "valor": 1_137_500},
        {"min": 275, "max": 299.99, "valor": 1_251_250},
        {"min": 300, "max": 9999, "valor": 1_365_000},
    ],
    "reajustes_factores": [
        {"min": 50_000, "max": 99_999, "factor": 0.5},
        {"min": 100_000, "max": 199_999, "factor": 1.0},
        {"min": 200_000, "max": 1_600_000, "factor": 1.3},
    ],
    "donaciones_pct": 0.20,
}

# ──────────────────────────────────────────────────────────
# GRUPO C — 3 ejecutivas (Sin meta)
# Sin metas. Comisión desde la primera venta.
# Tramo se determina por venta total del mes.
# Se aplica % por categoría (General / Preferente / Gold).
# ──────────────────────────────────────────────────────────
GRUPO_C = {
    "nombre": "Sin metas — comisión por producción",
    "tramos": [
        {"min": 0, "max": 99_999, "general": 0.02, "preferente": 0.20, "gold": 0.40},
        {"min": 100_000, "max": 149_999, "general": 0.30, "preferente": 1.20, "gold": 1.80},
        {"min": 150_000, "max": 199_999, "general": 0.40, "preferente": 1.60, "gold": 2.40},
        {"min": 200_000, "max": 249_999, "general": 0.50, "preferente": 2.20, "gold": 3.00},
        {"min": 250_000, "max": 999_999_999, "general": 0.60, "preferente": 2.50, "gold": 3.50},
    ],
}

ESQUEMAS = {"A": GRUPO_A, "B": GRUPO_B, "C": GRUPO_C}

WHATSAPP = {
    "api_url": "https://graph.facebook.com/v18.0/{phone_id}/messages",
    "phone_id": "",
    "token": "",
}
