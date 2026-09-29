"""Tests para los 3 esquemas de comisión."""
import unittest
from datetime import date
from reporte_comercial.core.reglas_negocio import (
    calcular_grupo_a,
    calcular_grupo_b,
    calcular_grupo_c,
    generar_alerta_corte,
)


class TestGrupoA(unittest.TestCase):
    def test_100pct_en_todo(self):
        r = calcular_grupo_a(
            meta_q=30, meta_monto=1_500_000, meta_ms=800_000,
            real_q=30, real_monto=1_500_000, real_ms=800_000,
        )
        self.assertAlmostEqual(r.cumplimiento_global, 100.0)
        self.assertEqual(r.comision, 316_000)

    def test_bajo_70_pondera_cero(self):
        r = calcular_grupo_a(
            meta_q=30, meta_monto=1_500_000, meta_ms=800_000,
            real_q=10, real_monto=500_000, real_ms=200_000,
        )
        self.assertEqual(r.pct_q_clamped, 0)
        self.assertEqual(r.pct_monto_clamped, 0)
        self.assertEqual(r.pct_ms_clamped, 0)
        self.assertEqual(r.cumplimiento_global, 0)
        self.assertEqual(r.comision, 0)

    def test_tope_140(self):
        r = calcular_grupo_a(
            meta_q=30, meta_monto=1_500_000, meta_ms=800_000,
            real_q=60, real_monto=3_000_000, real_ms=1_600_000,
        )
        self.assertEqual(r.pct_q_clamped, 140)
        self.assertEqual(r.pct_monto_clamped, 140)
        self.assertEqual(r.pct_ms_clamped, 140)
        self.assertAlmostEqual(r.cumplimiento_global, 140.0)
        self.assertEqual(r.comision, 683_300)

    def test_proporcionalidad_dias(self):
        r_full = calcular_grupo_a(
            meta_q=30, meta_monto=1_500_000, meta_ms=800_000,
            real_q=30, real_monto=1_500_000, real_ms=800_000,
        )
        r_half = calcular_grupo_a(
            meta_q=30, meta_monto=1_500_000, meta_ms=800_000,
            real_q=15, real_monto=750_000, real_ms=400_000,
            dias_trabajados=15, dias_mes=30,
        )
        self.assertAlmostEqual(r_half.cumplimiento_global, r_full.cumplimiento_global)
        self.assertEqual(r_half.comision, r_full.comision // 2)

    def test_tramo_90_99(self):
        r = calcular_grupo_a(
            meta_q=30, meta_monto=1_500_000, meta_ms=800_000,
            real_q=28, real_monto=1_400_000, real_ms=750_000,
        )
        self.assertGreaterEqual(r.cumplimiento_global, 90)
        self.assertLess(r.cumplimiento_global, 100)
        self.assertEqual(r.comision, 264_000)


class TestGrupoB(unittest.TestCase):
    def test_100pct_sin_extras(self):
        r = calcular_grupo_b(
            meta_captacion=350_000, meta_ms=70_000,
            real_captacion=350_000, real_ms=70_000,
        )
        self.assertAlmostEqual(r.cumplimiento_global, 100.0)
        self.assertEqual(r.variable1, 316_000)
        self.assertEqual(r.variable2, 0)
        self.assertEqual(r.variable3, 0)
        self.assertEqual(r.comision_total, 316_000)

    def test_bajo_70_pondera_cero(self):
        r = calcular_grupo_b(
            meta_captacion=350_000, meta_ms=70_000,
            real_captacion=100_000, real_ms=20_000,
        )
        self.assertEqual(r.comision_total, 0)

    def test_tope_300(self):
        r = calcular_grupo_b(
            meta_captacion=350_000, meta_ms=70_000,
            real_captacion=1_050_000, real_ms=210_000,
        )
        self.assertEqual(r.pct_captacion_clamped, 300)
        self.assertEqual(r.pct_ms_clamped, 300)
        self.assertEqual(r.variable1, 1_365_000)

    def test_reajustes_factor_05(self):
        r = calcular_grupo_b(
            meta_captacion=350_000, meta_ms=70_000,
            real_captacion=350_000, real_ms=70_000,
            real_reajustes=80_000,
        )
        self.assertEqual(r.variable2, 40_000)

    def test_reajustes_factor_13(self):
        r = calcular_grupo_b(
            meta_captacion=350_000, meta_ms=70_000,
            real_captacion=350_000, real_ms=70_000,
            real_reajustes=250_000,
        )
        self.assertEqual(r.variable2, 325_000)

    def test_donaciones_20pct(self):
        r = calcular_grupo_b(
            meta_captacion=350_000, meta_ms=70_000,
            real_captacion=350_000, real_ms=70_000,
            real_donaciones=100_000,
        )
        self.assertEqual(r.variable3, 20_000)


class TestGrupoC(unittest.TestCase):
    def test_tramo_1_bajo_100k(self):
        r = calcular_grupo_c(venta_total=80_000, monto_preferente=30_000, monto_gold=10_000)
        self.assertEqual(r.monto_general, 40_000)
        self.assertAlmostEqual(r.pct_general, 0.02)
        self.assertAlmostEqual(r.pct_preferente, 0.20)
        self.assertAlmostEqual(r.pct_gold, 0.40)
        self.assertEqual(r.com_general, 800)
        self.assertEqual(r.com_preferente, 6_000)
        self.assertEqual(r.com_gold, 4_000)
        self.assertEqual(r.comision_total, 10_800)

    def test_tramo_5_sobre_250k(self):
        r = calcular_grupo_c(venta_total=300_000, monto_preferente=100_000, monto_gold=50_000)
        self.assertAlmostEqual(r.pct_general, 0.60)
        self.assertAlmostEqual(r.pct_preferente, 2.50)
        self.assertAlmostEqual(r.pct_gold, 3.50)
        expected = (150_000 * 0.60) + (100_000 * 2.50) + (50_000 * 3.50)
        self.assertEqual(r.comision_total, round(expected))

    def test_solo_general(self):
        r = calcular_grupo_c(venta_total=200_000)
        self.assertEqual(r.monto_general, 200_000)
        self.assertEqual(r.monto_preferente, 0)
        self.assertEqual(r.monto_gold, 0)
        self.assertEqual(r.comision_total, round(200_000 * 0.50))


class TestAlertaCorte(unittest.TestCase):
    def test_sin_mecanismo(self):
        a = generar_alerta_corte(None, date(2026, 9, 29))
        self.assertIn("Sin reporte", a)

    def test_desfase(self):
        a = generar_alerta_corte(date(2026, 9, 15), date(2026, 9, 29))
        self.assertIn("desfase", a)

    def test_ok(self):
        a = generar_alerta_corte(date(2026, 9, 26), date(2026, 9, 29))
        self.assertNotIn("desfase", a)


if __name__ == "__main__":
    unittest.main()
