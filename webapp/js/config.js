/**
 * Configuración central — esquemas de comisión reales (Hogar de Cristo 2025-2026).
 * Port directo del config.py de Python.
 */
const CONFIG = {
  SIMULACION_GOLD_PREFERENTE_SPLIT: 0.50,

  GRUPO_A: {
    nombre: "Esquema 3 KPIs (tope 140%)",
    kpis: [
      { id: "q_acuerdos", label: "Q Acuerdos", peso: 0.25 },
      { id: "monto_acuerdos", label: "Monto $ Acuerdos", peso: 0.40 },
      { id: "mecanismo_superior", label: "Mecanismo Superior", peso: 0.35 },
    ],
    piso_pct: 70,
    tope_pct: 140,
    tramos_comision: [
      { min: 0, max: 69.99, valor: 0 },
      { min: 70, max: 79.99, valor: 132000 },
      { min: 80, max: 89.99, valor: 211000 },
      { min: 90, max: 99.99, valor: 264000 },
      { min: 100, max: 104.99, valor: 316000 },
      { min: 105, max: 109.99, valor: 369600 },
      { min: 110, max: 119.99, valor: 422400 },
      { min: 120, max: 129.99, valor: 528000 },
      { min: 130, max: 139.99, valor: 607000 },
      { min: 140, max: 9999, valor: 683300 },
    ],
  },

  GRUPO_B: {
    nombre: "Esquema 2 KPIs (tope 300%) + Reajustes",
    kpis: [
      { id: "monto_captacion", label: "Captación ($)", peso: 0.70 },
      { id: "mecanismo_superior", label: "Mecanismo Superior", peso: 0.30 },
    ],
    piso_pct: 70,
    tope_pct: 300,
    tramos_comision: [
      { min: 0, max: 69.99, valor: 0 },
      { min: 70, max: 79.99, valor: 132000 },
      { min: 80, max: 89.99, valor: 211000 },
      { min: 90, max: 99.99, valor: 264000 },
      { min: 100, max: 104.99, valor: 316000 },
      { min: 105, max: 109.99, valor: 369600 },
      { min: 110, max: 119.99, valor: 422400 },
      { min: 120, max: 129.99, valor: 528000 },
      { min: 130, max: 139.99, valor: 607000 },
      { min: 140, max: 149.99, valor: 683300 },
      { min: 150, max: 159.99, valor: 715000 },
      { min: 160, max: 169.99, valor: 750000 },
      { min: 170, max: 179.99, valor: 800000 },
      { min: 180, max: 189.99, valor: 850000 },
      { min: 190, max: 199.99, valor: 900000 },
      { min: 200, max: 214.99, valor: 950000 },
      { min: 215, max: 249.99, valor: 1000000 },
      { min: 250, max: 274.99, valor: 1137500 },
      { min: 275, max: 299.99, valor: 1251250 },
      { min: 300, max: 9999, valor: 1365000 },
    ],
    reajustes_factores: [
      { min: 50000, max: 99999, factor: 0.5 },
      { min: 100000, max: 199999, factor: 1.0 },
      { min: 200000, max: 1600000, factor: 1.3 },
    ],
    donaciones_pct: 0.20,
  },

  GRUPO_C: {
    nombre: "Sin metas — comisión por producción",
    tramos: [
      { min: 0, max: 99999, general: 0.02, preferente: 0.20, gold: 0.40 },
      { min: 100000, max: 149999, general: 0.30, preferente: 1.20, gold: 1.80 },
      { min: 150000, max: 199999, general: 0.40, preferente: 1.60, gold: 2.40 },
      { min: 200000, max: 249999, general: 0.50, preferente: 2.20, gold: 3.00 },
      { min: 250000, max: 999999999, general: 0.60, preferente: 2.50, gold: 3.50 },
    ],
  },

  TIPO_CONTRATO_A_GRUPO: { 1.4: "A", 3: "B" },
};
