"""
Genera datos de ejemplo de ventas para las 13 ejecutivas reales (3A + 7B + 3C).
Lee el maestro real y genera ventas_diarias y mecanismo_superior con valores aleatorios.
Ejecutar: python -m reporte_comercial.generar_datos_ejemplo
"""
import random
import pandas as pd
from datetime import date, timedelta
from pathlib import Path
from reporte_comercial.core.ingesta import cargar_maestro_vendedores

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)

random.seed(42)


def generar():
    hoy = date.today()

    maestro = cargar_maestro_vendedores(DATA_DIR / "maestro_vendedores.xlsx")
    print(f"Maestro cargado: {len(maestro)} ejecutivas")
    for g in ["A", "B", "C"]:
        print(f"  Grupo {g}: {len(maestro[maestro['grupo'] == g])}")

    ventas_rows = []
    mec_rows = []
    fecha_mec = hoy - timedelta(days=3)

    for _, v in maestro.iterrows():
        rut = v["rut"]
        grupo = v["grupo"]

        if grupo == "A":
            mq = int(v["meta_q_acuerdos"])
            mm = int(v["meta_monto_acuerdos"])
            mms = int(v["meta_mecanismo_superior"])
            ventas_rows.append({
                "rut": rut, "fecha_corte": hoy,
                "real_q_acuerdos": random.randint(int(mq * 0.6), int(mq * 1.3)),
                "real_monto_acuerdos": round(random.uniform(mm * 0.5, mm * 1.4)),
                "real_mecanismo_superior": round(random.uniform(mms * 0.4, mms * 1.3)),
            })
            mec_rows.append({
                "rut": rut, "fecha_corte": fecha_mec,
                "real_mecanismo_superior": round(random.uniform(mms * 0.5, mms * 1.2)),
            })

        elif grupo == "B":
            mc = int(v["meta_captacion"])
            mms = int(v["meta_mecanismo_superior"])
            ventas_rows.append({
                "rut": rut, "fecha_corte": hoy,
                "real_captacion": round(random.uniform(mc * 0.6, mc * 1.5)),
                "real_mecanismo_superior": round(random.uniform(mms * 0.5, mms * 1.4)),
                "real_reajustes": random.choice([0, 60_000, 120_000, 250_000]),
                "real_donaciones": random.choice([0, 0, 50_000, 100_000]),
            })
            mec_rows.append({
                "rut": rut, "fecha_corte": fecha_mec,
                "real_mecanismo_superior": round(random.uniform(mms * 0.5, mms * 1.3)),
            })

        elif grupo == "C":
            total = round(random.uniform(80_000, 300_000))
            pref = round(random.uniform(0, total * 0.5))
            gold = round(random.uniform(0, (total - pref) * 0.4))
            ventas_rows.append({
                "rut": rut, "fecha_corte": hoy,
                "venta_total": total,
                "monto_preferente": pref,
                "monto_gold": gold,
            })

    pd.DataFrame(ventas_rows).to_excel(DATA_DIR / "ventas_diarias.xlsx", index=False)
    print(f"Ventas diarias: {len(ventas_rows)} registros (corte {hoy})")

    pd.DataFrame(mec_rows).to_excel(DATA_DIR / "mecanismo_superior.xlsx", index=False)
    print(f"Mecanismo Superior: {len(mec_rows)} registros (corte {fecha_mec})")


if __name__ == "__main__":
    generar()
