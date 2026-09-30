/**
 * Motor de reglas de negocio — 3 esquemas de comisión.
 * Port directo de reglas_negocio.py
 */
const ENGINE = (() => {
  function buscarTramo(tramos, valor) {
    for (const t of tramos) {
      if (valor >= t.min && valor <= t.max) return t;
    }
    return tramos[0];
  }

  function clampKpi(pctRaw, piso, tope) {
    if (pctRaw < piso) return 0;
    return Math.min(pctRaw, tope);
  }

  function pct(real, meta) {
    if (meta <= 0) return 0;
    return (real / meta) * 100;
  }

  function round1(n) {
    return Math.round(n * 10) / 10;
  }

  function clp(monto) {
    return "$" + Math.round(monto).toLocaleString("es-CL");
  }

  function calcularGrupoA({ metaQ, metaMonto, metaMs, realQ, realMonto, realMs, diasTrabajados = 0, diasMes = 30 }) {
    const cfg = CONFIG.GRUPO_A;
    const piso = cfg.piso_pct;
    const tope = cfg.tope_pct;

    const prop = (diasTrabajados > 0 && diasMes > 0) ? diasTrabajados / diasMes : 1.0;
    const metaQAdj = metaQ * prop;
    const metaMontoAdj = metaMonto * prop;
    const metaMsAdj = metaMs * prop;

    const pctQ = pct(realQ, metaQAdj);
    const pctMonto = pct(realMonto, metaMontoAdj);
    const pctMs = pct(realMs, metaMsAdj);

    const cq = clampKpi(pctQ, piso, tope);
    const cm = clampKpi(pctMonto, piso, tope);
    const cms = clampKpi(pctMs, piso, tope);

    const aporteQ = cq * 0.25;
    const aporteM = cm * 0.40;
    const aporteMs = cms * 0.35;
    const globalPct = aporteQ + aporteM + aporteMs;

    const tramo = buscarTramo(cfg.tramos_comision, globalPct);
    let comision = tramo.valor;
    if (prop < 1 && prop > 0) comision = Math.round(comision * prop);

    const avanceRaw = round1(pctQ * 0.25 + pctMonto * 0.40 + pctMs * 0.35);

    return {
      pctQ: round1(pctQ), pctMonto: round1(pctMonto), pctMs: round1(pctMs),
      pctQClamped: round1(cq), pctMontoClamped: round1(cm), pctMsClamped: round1(cms),
      cumplimientoGlobal: round1(globalPct),
      avanceRaw,
      comision,
      tramoLabel: `${tramo.min}%-${tramo.max}%`,
    };
  }

  function factorReajuste(monto) {
    for (const r of CONFIG.GRUPO_B.reajustes_factores) {
      if (monto >= r.min && monto <= r.max) return r.factor;
    }
    return 0;
  }

  function calcularGrupoB({ metaCaptacion, metaMs, realCaptacion, realMs, realReajustes = 0, realDonaciones = 0 }) {
    const cfg = CONFIG.GRUPO_B;
    const piso = cfg.piso_pct;
    const tope = cfg.tope_pct;

    const pctCap = pct(realCaptacion, metaCaptacion);
    const pctMsVal = pct(realMs, metaMs);

    const ccap = clampKpi(pctCap, piso, tope);
    const cms = clampKpi(pctMsVal, piso, tope);

    const pondCap = (ccap / 100) * 70;
    const pondMs = (cms / 100) * 30;
    const globalRaw = pondCap + pondMs;
    const globalPct = Math.ceil(globalRaw * 10) / 10;

    const tramo = buscarTramo(cfg.tramos_comision, globalPct);
    const variable1 = tramo.valor;
    const factor = factorReajuste(realReajustes);
    const variable2 = Math.round(realReajustes * factor);
    const variable3 = Math.round(realDonaciones * cfg.donaciones_pct);

    const avanceRaw = round1(pctCap * 0.70 + pctMsVal * 0.30);

    return {
      pctCaptacion: round1(pctCap), pctMs: round1(pctMsVal),
      pctCaptacionClamped: round1(ccap), pctMsClamped: round1(cms),
      cumplimientoGlobal: globalPct,
      avanceRaw,
      variable1, variable2, variable3,
      comisionTotal: variable1 + variable2 + variable3,
      tramoLabel: `${tramo.min}%-${tramo.max}%`,
    };
  }

  function calcularGrupoC({ ventaTotal, montoPreferente = 0, montoGold = 0 }) {
    const montoGeneral = Math.max(0, ventaTotal - montoPreferente - montoGold);
    const tramo = buscarTramo(CONFIG.GRUPO_C.tramos, ventaTotal);

    const comGen = Math.round(montoGeneral * tramo.general);
    const comPref = Math.round(montoPreferente * tramo.preferente);
    const comGold = Math.round(montoGold * tramo.gold);

    return {
      ventaTotal, montoGeneral, montoPreferente, montoGold,
      pctGeneral: tramo.general, pctPreferente: tramo.preferente, pctGold: tramo.gold,
      comGeneral: comGen, comPreferente: comPref, comGold: comGold,
      comisionTotal: comGen + comPref + comGold,
      tramoLabel: `${clp(tramo.min)}-${clp(tramo.max)}`,
    };
  }

  function construirMensaje(row) {
    const fecha = row.fechaCorte || "N/A";
    const lines = [
      `📊 *Reporte Diario de Ventas*`,
      `━━━━━━━━━━━━━━━━━━━━━━`,
      ``,
      `👤 *${row.nombre}*`,
      `📅 Corte: ${fecha}`,
    ];

    if (row.grupo === "S") {
      lines.push(...bloqueSuper(row));
    } else {
      if (row.grupo === "A") lines.push(...bloqueA(row));
      else if (row.grupo === "B") lines.push(...bloqueB(row));
      else if (row.grupo === "C") lines.push(...bloqueC(row));
      lines.push("", "━━━ *Comision Proyectada* ━━━", `💵 *${clp(row.comision)}*`);
    }
    lines.push("", "━━━━━━━━━━━━━━━━━━━━━━", `📋 _${row.alerta || ""}_`);
    return lines.join("\n");
  }

  function barra(pctVal, largo = 10, tope = 100) {
    const ratio = tope > 0 ? Math.min(pctVal / tope, 1.0) : 0;
    const llenos = Math.floor(ratio * largo);
    return "█".repeat(llenos) + "░".repeat(largo - llenos);
  }

  function bloqueA(r) {
    const g = r.cumplimientoGlobal || 0;
    const av = r.avanceRaw || 0;
    return [
      "", "*Esquema:* 3 KPIs ponderados (tope 140%)", "",
      "━━━ *Avance por KPI* ━━━",
      `📌 Q Acuerdos: *${r.realQ || 0}* de meta *${r.metaQ || 0}* → *${r.pctQ}%* ${barra(r.pctQ, 10, 100)} (peso 25%)`,
      `💰 Monto: *${clp(r.realMonto || 0)}* de meta *${clp(r.metaMonto || 0)}* → *${r.pctMonto}%* ${barra(r.pctMonto, 10, 100)} (peso 40%)`,
      `🏦 Mec. Sup: *${clp(r.realMs || 0)}* de meta *${clp(r.metaMs || 0)}* → *${r.pctMs}%* ${barra(r.pctMs, 10, 100)} (peso 35%)`,
      "",
      `📈 Avance Global: *${av}%* ${barra(av, 10, 140)}`,
      `📊 Cumpl. Efectivo: *${g}%* (piso 70%) → Tramo: ${r.tramo}`,
    ];
  }

  function bloqueB(r) {
    const g = r.cumplimientoGlobal || 0;
    const av = r.avanceRaw || 0;
    return [
      "", "*Esquema:* 2 KPIs + Reajustes (tope 300%)", "",
      "━━━ *Avance por KPI* ━━━",
      `💰 Captacion: *${clp(r.realCaptacion || 0)}* de meta *${clp(r.metaCaptacion || 0)}* → *${r.pctCaptacion}%* ${barra(r.pctCaptacion, 10, 100)} (peso 70%)`,
      `🏦 Mec. Sup: *${clp(r.realMs || 0)}* de meta *${clp(r.metaMs || 0)}* → *${r.pctMs}%* ${barra(r.pctMs, 10, 100)} (peso 30%)`,
      "",
      `📈 Avance Global: *${av}%* ${barra(av, 10, 100)}`,
      `📊 Cumpl. Efectivo: *${g}%* (piso 70%) → Tramo: ${r.tramo}`,
      "", "━━━ *Desglose Comision* ━━━",
      `  V1 (Tabla): ${clp(r.variable1 || 0)}`,
      `  V2 (Reajustes): ${clp(r.variable2 || 0)}`,
      `  V3 (Donaciones): ${clp(r.variable3 || 0)}`,
    ];
  }

  function bloqueC(r) {
    return [
      "", "*Esquema:* Comision por produccion (sin metas)", "",
      "━━━ *Produccion del Mes* ━━━",
      `💰 Venta Total: *${clp(r.ventaTotal || 0)}*`,
      "", `  General: ${clp(r.montoGeneral || 0)} → ${clp(r.comGeneral || 0)}`,
      `  Preferente: ${clp(r.montoPreferente || 0)} → ${clp(r.comPreferente || 0)}`,
      `  Gold: ${clp(r.montoGold || 0)} → ${clp(r.comGold || 0)}`,
    ];
  }

  function bloqueSuper(r) {
    const a = r.acumulado || {};
    const dt = a.diasTranscurridos || 0;
    const dtot = a.diasTotales || 1;
    return [
      "", `*Resumen Acumulado del Equipo* (${a.n_ejecutivas || 0} ejecutivas)`, "",
      "━━━ *Totales Acumulados* ━━━",
      `💰 Total Captaciones: *${clp(a.total_captacion || 0)}*`,
      `🏦 Total Mec. Superior: *${clp(a.total_ms || 0)}*`,
      "",
      `━━━ *Proyeccion Lineal* ━━━`,
      `📅 Dia laboral *${dt}* de *${dtot}*`,
      `💰 Captaciones proyectadas: *${clp(a.proyCapt || 0)}*`,
      `🏦 Mec. Superior proyectado: *${clp(a.proyMs || 0)}*`,
    ];
  }

  function generarLinkWA(telefono, mensaje) {
    let tel = String(telefono).replace(/\s/g, "").replace(/\+/g, "");
    if (!tel.startsWith("56")) tel = "56" + tel;
    return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`;
  }

  return {
    calcularGrupoA, calcularGrupoB, calcularGrupoC,
    construirMensaje, generarLinkWA, clp, round1,
  };
})();
