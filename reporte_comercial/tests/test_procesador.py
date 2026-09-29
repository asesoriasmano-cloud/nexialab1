"""Tests para el procesador de consolidado."""
import unittest
from pathlib import Path
from reporte_comercial.config import ARCHIVOS
from reporte_comercial.core.procesador import procesar_consolidado


class TestProcesador(unittest.TestCase):
    def setUp(self):
        self.df = procesar_consolidado(
            ARCHIVOS["maestro_vendedores"],
            ARCHIVOS["ventas_diarias"],
            ARCHIVOS["mecanismo_superior"],
        )

    def test_15_vendedores_procesados(self):
        self.assertEqual(len(self.df), 15)

    def test_columnas_consolidado(self):
        cols_esperadas = [
            "rut", "nombre", "telefono", "equipo", "meta_efectiva",
            "venta_acumulada", "pct_avance", "comision_proyectada",
            "alerta_firma", "alerta_corte",
        ]
        for col in cols_esperadas:
            self.assertIn(col, self.df.columns)

    def test_pct_avance_no_negativo(self):
        self.assertTrue((self.df["pct_avance"] >= 0).all())

    def test_comision_no_negativa(self):
        self.assertTrue((self.df["comision_proyectada"] >= 0).all())

    def test_vendedores_pendientes_tienen_alerta(self):
        pendientes = self.df[self.df["estado_meta"] != "Firmada"]
        for _, row in pendientes.iterrows():
            self.assertNotEqual(row["alerta_firma"], "")


if __name__ == "__main__":
    unittest.main()
