"""
Genera archivos Excel de ejemplo con datos ficticios para 15 vendedores piloto.
Ejecutar una vez: python -m reporte_comercial.generar_datos_ejemplo
"""
import pandas as pd
from datetime import date, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)

VENDEDORES = [
    ("12.345.678-9", "María González", "+56912345678", "Norte", "Indefinido", 30, "Firmada", 5_000_000, 5_500_000),
    ("13.456.789-0", "Carlos Muñoz", "+56923456789", "Norte", "Indefinido", 18, "Firmada", 4_500_000, 4_800_000),
    ("14.567.890-1", "Andrea Soto", "+56934567890", "Centro", "Plazo Fijo", 8, "Pendiente", 3_500_000, 3_800_000),
    ("15.678.901-2", "Roberto Díaz", "+56945678901", "Centro", "Indefinido", 36, "Firmada", 6_000_000, 6_500_000),
    ("16.789.012-3", "Camila Reyes", "+56956789012", "Sur", "Indefinido", 14, "Firmada", 4_000_000, 4_200_000),
    ("17.890.123-4", "Felipe Hernández", "+56967890123", "Sur", "Honorarios", 4, "Pendiente", 3_000_000, 3_200_000),
    ("18.901.234-5", "Valentina López", "+56978901234", "Norte", "Indefinido", 24, "Firmada", 5_200_000, 5_500_000),
    ("19.012.345-6", "Matías Torres", "+56989012345", "Centro", "Plazo Fijo", 10, "Firmada", 3_800_000, 4_000_000),
    ("20.123.456-7", "Sofía Morales", "+56990123456", "Sur", "Indefinido", 42, "Firmada", 6_500_000, 7_000_000),
    ("21.234.567-8", "Diego Vargas", "+56901234567", "Norte", "Indefinido", 6, "Pendiente", 3_000_000, 3_500_000),
    ("22.345.678-9", "Francisca Rojas", "+56912340001", "Centro", "Indefinido", 20, "Firmada", 4_800_000, 5_000_000),
    ("23.456.789-0", "Tomás Fuentes", "+56912340002", "Sur", "Plazo Fijo", 3, "Pendiente", 2_800_000, 3_000_000),
    ("24.567.890-1", "Constanza Peña", "+56912340003", "Norte", "Indefinido", 15, "Firmada", 4_200_000, 4_500_000),
    ("25.678.901-2", "Sebastián Araya", "+56912340004", "Centro", "Honorarios", 9, "Firmada", 3_500_000, 3_700_000),
    ("26.789.012-3", "Isidora Castillo", "+56912340005", "Sur", "Indefinido", 28, "Firmada", 5_500_000, 5_800_000),
]

def generar():
    hoy = date.today()

    maestro = pd.DataFrame(VENDEDORES, columns=[
        "rut", "nombre", "telefono", "equipo",
        "tipo_contrato", "antiguedad_meses",
        "estado_meta", "meta_base", "meta_asignada",
    ])
    maestro.to_excel(DATA_DIR / "maestro_vendedores.xlsx", index=False)
    print(f"Maestro vendedores: {len(maestro)} registros")

    import random
    random.seed(42)
    ventas_data = []
    for rut, nombre, *_ in VENDEDORES:
        meta = _[5]  # meta_base
        venta = round(random.uniform(meta * 0.3, meta * 1.3), 0)
        ventas_data.append({"rut": rut, "venta_acumulada": venta, "fecha_corte": hoy})

    ventas = pd.DataFrame(ventas_data)
    ventas.to_excel(DATA_DIR / "ventas_diarias.xlsx", index=False)
    print(f"Ventas diarias: {len(ventas)} registros (corte {hoy})")

    fecha_mec = hoy - timedelta(days=3)
    mec_data = []
    for rut, nombre, *_ in VENDEDORES:
        meta = _[5]
        mandatos = round(random.uniform(meta * 0.2, meta * 1.1), 0)
        mec_data.append({"rut": rut, "mandatos_aprobados": mandatos, "fecha_corte": fecha_mec})

    mecanismo = pd.DataFrame(mec_data)
    mecanismo.to_excel(DATA_DIR / "mecanismo_superior.xlsx", index=False)
    print(f"Mecanismo Superior: {len(mecanismo)} registros (corte {fecha_mec})")


if __name__ == "__main__":
    generar()
