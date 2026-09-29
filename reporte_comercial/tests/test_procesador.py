"""Tests para el procesador de consolidado."""
import unittest
from reporte_comercial.config import ARCHIVOS
from reporte_comercial.core.procesador import procesar_consolidado


class TestProcesador(unittest.TestCase):
    def setUp(self):
        self.df = procesar_consolidado(
            ARCHIVOS["maestro_vendedores"],
            ARCHIVOS["ventas_diarias"],
            ARCHIVOS["mecanismo_superior"],
        )

    def test_vendedores_procesados(self):
        n_abc = len(self.df[self.df["grupo"].isin(["A", "B", "C"])])
        self.assertEqual(n_abc, 13)

    def test_distribucion_grupos(self):
        self.assertEqual(len(self.df[self.df["grupo"] == "A"]), 3)
        self.assertEqual(len(self.df[self.df["grupo"] == "B"]), 7)
        self.assertEqual(len(self.df[self.df["grupo"] == "C"]), 3)

    def test_supervisora_tiene_acumulado(self):
        sup = self.df[self.df["grupo"] == "S"]
        for _, row in sup.iterrows():
            self.assertIn("acumulado", row)
            self.assertIn("grupo_a", row["acumulado"])
            self.assertIn("comision_equipo", row["acumulado"])

    def test_comision_no_negativa(self):
        self.assertTrue((self.df["comision"] >= 0).all())

    def test_grupo_a_tiene_cumplimiento_global(self):
        ga = self.df[self.df["grupo"] == "A"]
        self.assertTrue("cumplimiento_global" in ga.columns)

    def test_grupo_c_tiene_venta_total(self):
        gc = self.df[self.df["grupo"] == "C"]
        self.assertTrue((gc["venta_total"] > 0).all())

    def test_columnas_base(self):
        for col in ["rut", "nombre", "telefono", "grupo", "comision", "alerta_corte"]:
            self.assertIn(col, self.df.columns)


if __name__ == "__main__":
    unittest.main()
