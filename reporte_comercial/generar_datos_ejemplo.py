"""
Genera datos de ejemplo para 15 ejecutivas (7A + 5B + 3C).
Ejecutar: python -m reporte_comercial.generar_datos_ejemplo
"""
import random
import pandas as pd
from datetime import date, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)

random.seed(42)

# ── GRUPO A: 7 ejecutivas — 3 KPIs (Q, Monto, Mec.Sup) ──
GRUPO_A = [
    #  RUT               Nombre               Telefono         Equipo   meta_q  meta_monto  meta_ms
    ("12.345.678-9", "María González",    "+56912345678", "Norte",  30,  1_500_000,  800_000),
    ("13.456.789-0", "Carlos Muñoz",      "+56923456789", "Norte",  25,  1_200_000,  700_000),
    ("14.567.890-1", "Andrea Soto",       "+56934567890", "Centro", 28,  1_300_000,  750_000),
    ("15.678.901-2", "Roberto Díaz",      "+56945678901", "Centro", 35,  1_800_000,  900_000),
    ("16.789.012-3", "Camila Reyes",      "+56956789012", "Sur",    22,  1_100_000,  600_000),
    ("17.890.123-4", "Felipe Hernández",  "+56967890123", "Sur",    32,  1_600_000,  850_000),
    ("18.901.234-5", "Valentina López",   "+56978901234", "Norte",  27,  1_400_000,  780_000),
]

# ── GRUPO B: 5 ejecutivas — 2 KPIs + Reajustes ──
GRUPO_B = [
    #  RUT               Nombre              Telefono         Equipo   meta_captacion  meta_ms
    ("19.012.345-6", "Matías Torres",    "+56989012345", "Centro", 350_000,  70_000),
    ("20.123.456-7", "Sofía Morales",    "+56990123456", "Sur",    400_000,  80_000),
    ("21.234.567-8", "Diego Vargas",     "+56901234567", "Norte",  320_000,  65_000),
    ("22.345.678-9", "Francisca Rojas",  "+56912340001", "Centro", 380_000,  75_000),
    ("23.456.789-0", "Tomás Fuentes",    "+56912340002", "Sur",    350_000,  70_000),
]

# ── GRUPO C: 3 ejecutivas — Sin metas ──
GRUPO_C = [
    #  RUT               Nombre               Telefono         Equipo
    ("24.567.890-1", "Constanza Peña",   "+56912340003", "Norte"),
    ("25.678.901-2", "Sebastián Araya",  "+56912340004", "Centro"),
    ("26.789.012-3", "Isidora Castillo", "+56912340005", "Sur"),
]


def generar():
    hoy = date.today()

    # ── Maestro Vendedores ──
    maestro_rows = []
    for rut, nombre, tel, equipo, mq, mm, mms in GRUPO_A:
        maestro_rows.append({
            "rut": rut, "nombre": nombre, "telefono": tel, "equipo": equipo,
            "grupo": "A",
            "meta_q_acuerdos": mq, "meta_monto_acuerdos": mm,
            "meta_mecanismo_superior": mms,
            "meta_captacion": 0, "dias_trabajados": 0, "dias_mes": 30,
        })
    for rut, nombre, tel, equipo, mc, mms in GRUPO_B:
        maestro_rows.append({
            "rut": rut, "nombre": nombre, "telefono": tel, "equipo": equipo,
            "grupo": "B",
            "meta_q_acuerdos": 0, "meta_monto_acuerdos": 0,
            "meta_mecanismo_superior": mms,
            "meta_captacion": mc, "dias_trabajados": 0, "dias_mes": 30,
        })
    for rut, nombre, tel, equipo in GRUPO_C:
        maestro_rows.append({
            "rut": rut, "nombre": nombre, "telefono": tel, "equipo": equipo,
            "grupo": "C",
            "meta_q_acuerdos": 0, "meta_monto_acuerdos": 0,
            "meta_mecanismo_superior": 0,
            "meta_captacion": 0, "dias_trabajados": 0, "dias_mes": 30,
        })

    pd.DataFrame(maestro_rows).to_excel(DATA_DIR / "maestro_vendedores.xlsx", index=False)
    print(f"Maestro: {len(maestro_rows)} ejecutivas (7A + 5B + 3C)")

    # ── Ventas Diarias ──
    ventas_rows = []
    for rut, _, _, _, mq, mm, mms in GRUPO_A:
        ventas_rows.append({
            "rut": rut, "fecha_corte": hoy,
            "real_q_acuerdos": random.randint(int(mq * 0.6), int(mq * 1.3)),
            "real_monto_acuerdos": round(random.uniform(mm * 0.5, mm * 1.4), 0),
            "real_mecanismo_superior": round(random.uniform(mms * 0.4, mms * 1.3), 0),
        })
    for rut, _, _, _, mc, mms in GRUPO_B:
        ventas_rows.append({
            "rut": rut, "fecha_corte": hoy,
            "real_captacion": round(random.uniform(mc * 0.6, mc * 1.5), 0),
            "real_mecanismo_superior": round(random.uniform(mms * 0.5, mms * 1.4), 0),
            "real_reajustes": round(random.choice([0, 60_000, 120_000, 250_000]), 0),
            "real_donaciones": round(random.choice([0, 0, 50_000, 100_000]), 0),
        })
    for rut, _, _, _ in GRUPO_C:
        total = round(random.uniform(80_000, 300_000), 0)
        pref = round(random.uniform(0, total * 0.5), 0)
        gold = round(random.uniform(0, (total - pref) * 0.4), 0)
        ventas_rows.append({
            "rut": rut, "fecha_corte": hoy,
            "venta_total": total,
            "monto_preferente": pref,
            "monto_gold": gold,
        })

    pd.DataFrame(ventas_rows).to_excel(DATA_DIR / "ventas_diarias.xlsx", index=False)
    print(f"Ventas diarias: {len(ventas_rows)} registros (corte {hoy})")

    # ── Mecanismo Superior ──
    fecha_mec = hoy - timedelta(days=3)
    mec_rows = []
    for rut, _, _, _, _, _, mms in GRUPO_A:
        mec_rows.append({
            "rut": rut, "fecha_corte": fecha_mec,
            "real_mecanismo_superior": round(random.uniform(mms * 0.5, mms * 1.2), 0),
        })
    for rut, _, _, _, _, mms in GRUPO_B:
        mec_rows.append({
            "rut": rut, "fecha_corte": fecha_mec,
            "real_mecanismo_superior": round(random.uniform(mms * 0.5, mms * 1.3), 0),
        })

    pd.DataFrame(mec_rows).to_excel(DATA_DIR / "mecanismo_superior.xlsx", index=False)
    print(f"Mecanismo Superior: {len(mec_rows)} registros (corte {fecha_mec})")


if __name__ == "__main__":
    generar()
