"""Tests para el motor de reglas de negocio."""
import unittest
from datetime import date
from reporte_comercial.core.reglas_negocio import (
    clasificar_antiguedad,
    calcular_meta_efectiva,
    calcular_comision,
    generar_alerta_corte,
)


class TestClasificarAntiguedad(unittest.TestCase):
    def test_nuevo(self):
        t = clasificar_antiguedad(3)
        self.assertEqual(t["etiqueta"], "Nuevo")
        self.assertAlmostEqual(t["factor_meta"], 0.70)

    def test_en_desarrollo(self):
        t = clasificar_antiguedad(10)
        self.assertEqual(t["etiqueta"], "En desarrollo")

    def test_consolidado(self):
        t = clasificar_antiguedad(18)
        self.assertEqual(t["etiqueta"], "Consolidado")

    def test_senior(self):
        t = clasificar_antiguedad(30)
        self.assertEqual(t["etiqueta"], "Senior")
        self.assertAlmostEqual(t["factor_meta"], 1.10)


class TestCalcularMetaEfectiva(unittest.TestCase):
    def test_meta_firmada_senior(self):
        meta, alerta = calcular_meta_efectiva(5_000_000, 5_500_000, "Firmada", "Indefinido", 30)
        self.assertEqual(meta, 5_500_000 * 1.10)
        self.assertEqual(alerta, "")

    def test_meta_pendiente_aplica_provisoria(self):
        meta, alerta = calcular_meta_efectiva(3_000_000, 3_500_000, "Pendiente", "Indefinido", 3)
        expected = 3_500_000 * 0.70 * 0.90
        self.assertAlmostEqual(meta, expected)
        self.assertIn("provisoria", alerta.lower())


class TestCalcularComision(unittest.TestCase):
    def test_bajo_50_sin_comision(self):
        c = calcular_comision(1_000_000, 5_000_000, "Indefinido")
        self.assertEqual(c, 0.0)

    def test_sobre_100_con_mandatos(self):
        c = calcular_comision(6_000_000, 5_000_000, "Indefinido", mandatos_aprobados=5_500_000)
        self.assertGreater(c, 0)

    def test_factor_contrato_honorarios(self):
        c_indef = calcular_comision(4_500_000, 5_000_000, "Indefinido")
        c_honor = calcular_comision(4_500_000, 5_000_000, "Honorarios")
        self.assertGreater(c_indef, c_honor)


class TestGenerarAlertaCorte(unittest.TestCase):
    def test_sin_mecanismo(self):
        alerta = generar_alerta_corte(None, date(2026, 9, 29))
        self.assertIn("Sin reporte", alerta)

    def test_desfase_mayor_7_dias(self):
        alerta = generar_alerta_corte(date(2026, 9, 15), date(2026, 9, 29))
        self.assertIn("desfase", alerta)

    def test_dentro_rango(self):
        alerta = generar_alerta_corte(date(2026, 9, 26), date(2026, 9, 29))
        self.assertNotIn("desfase", alerta)


if __name__ == "__main__":
    unittest.main()
