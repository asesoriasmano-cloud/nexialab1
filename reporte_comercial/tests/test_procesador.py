"""Tests para el procesador de consolidado (modo ejemplo y modo real)."""
import unittest
from reporte_comercial.config import ARCHIVOS
from reporte_comercial.core.procesador import procesar_consolidado, procesar_consolidado_real


class TestProcesadorEjemplo(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.df = procesar_consolidado(
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

    def test_columnas_base(self):
        for col in ["rut", "nombre", "telefono", "grupo", "comision", "alerta_corte"]:
            self.assertIn(col, self.df.columns)


class TestProcesadorReal(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.df = procesar_consolidado_real(
            ARCHIVOS["maestro_vendedores"],
            ARCHIVOS["data_20"],
            ARCHIVOS["data_21"],
            ARCHIVOS["ms_template"],
        )

    def test_14_reportes(self):
        self.assertEqual(len(self.df), 14)

    def test_distribucion_real(self):
        self.assertEqual(len(self.df[self.df["grupo"] == "A"]), 3)
        self.assertEqual(len(self.df[self.df["grupo"] == "B"]), 7)
        self.assertEqual(len(self.df[self.df["grupo"] == "C"]), 3)
        self.assertEqual(len(self.df[self.df["grupo"] == "S"]), 1)

    def test_comision_no_negativa(self):
        self.assertTrue((self.df["comision"] >= 0).all())

    def test_supervisora_acumulado_completo(self):
        sup = self.df[self.df["grupo"] == "S"].iloc[0]
        acum = sup["acumulado"]
        self.assertEqual(acum["grupo_a"]["n"], 3)
        self.assertEqual(acum["grupo_b"]["n"], 7)
        self.assertEqual(acum["grupo_c"]["n"], 3)
        self.assertGreater(acum["comision_equipo"], 0)

    def test_grupo_b_elizabeth_cuello_comision_positiva(self):
        ec = self.df[self.df["nombre"] == "Elizabeth Cuello"]
        self.assertEqual(len(ec), 1)
        self.assertGreater(ec.iloc[0]["comision"], 0)

    def test_grupo_c_rosa_araya_tiene_gold_preferente(self):
        ra = self.df[self.df["nombre"] == "Rosa Araya"]
        self.assertEqual(len(ra), 1)
        self.assertGreater(ra.iloc[0]["monto_gold"], 0)
        self.assertGreater(ra.iloc[0]["monto_preferente"], 0)

    def test_grupo_c_gold_preferente_split_50_50(self):
        gc = self.df[self.df["grupo"] == "C"]
        for _, row in gc.iterrows():
            if row.get("monto_gold", 0) > 0:
                self.assertAlmostEqual(
                    row["monto_gold"], row["monto_preferente"], places=0
                )

    def test_columnas_base(self):
        for col in ["rut", "nombre", "telefono", "grupo", "comision", "alerta_corte"]:
            self.assertIn(col, self.df.columns)


if __name__ == "__main__":
    unittest.main()
