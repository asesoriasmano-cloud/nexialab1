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
      `📊 *Reporte Diario*`,
      `👤 *${row.nombre}*`,
      `📅 Corte: ${fecha}`,
    ];

    if (row.grupo === "S") {
      lines.push(...bloqueSuper(row));
    } else {
      if (row.grupo === "A") lines.push(...bloqueA(row));
      else if (row.grupo === "B") lines.push(...bloqueB(row));
      else if (row.grupo === "C") lines.push(...bloqueC(row));
      lines.push("", `💵 *Comision: ${clp(row.comision)}* (${row.tramo || "—"})`);
    }
    const msNota = row.fechaCorteMs ? ` · MS al ${row.fechaCorteMs}` : "";
    lines.push("", `_Captacion al ${fecha}${msNota}_`);
    return lines.join("\n");
  }

  function proyLabel(r) {
    const dt = r.diasTranscurridos || 0;
    const dtot = r.diasTotales || 0;
    if (!dt || !dtot) return null;
    return `dia ${dt} de ${dtot} lab.`;
  }

  function bloqueA(r) {
    const av = r.avanceRaw || 0;
    const g = r.cumplimientoGlobal || 0;
    const pl = proyLabel(r);
    const lines = [
      "",
      `*Llevas / Meta:*`,
      `  Q Acuerdos: *${r.realQ || 0}* de *${r.metaQ || 0}* (${r.pctQ}%)`,
      `  Monto: *${clp(r.realMonto || 0)}* de *${clp(r.metaMonto || 0)}* (${r.pctMonto}%)`,
      `  Mec. Sup: *${clp(r.realMs || 0)}* de *${clp(r.metaMs || 0)}* (${r.pctMs}%)`,
      "",
      `📈 Avance: *${av}%* · Cumpl: *${g}%*`,
    ];
    if (pl) {
      lines.push("", `🔮 *Proyeccion al cierre* (${pl})`);
      lines.push(`  Q Acuerdos: *${r.proyQ || 0}* · Monto: *${clp(r.proyMonto || 0)}*`);
      lines.push(`  Mec. Sup: *${clp(r.proyMs || 0)}*`);
    }
    return lines;
  }

  function bloqueB(r) {
    const av = r.avanceRaw || 0;
    const g = r.cumplimientoGlobal || 0;
    const pl = proyLabel(r);
    const lines = [
      "",
      `*Llevas / Meta:*`,
      `  Captacion: *${clp(r.realCaptacion || 0)}* de *${clp(r.metaCaptacion || 0)}* (${r.pctCaptacion}%)`,
      `  Mec. Sup: *${clp(r.realMs || 0)}* de *${clp(r.metaMs || 0)}* (${r.pctMs}%)`,
      "",
      `📈 Avance: *${av}%* · Cumpl: *${g}%*`,
      "",
      `*Desglose:*`,
      `  Tabla: ${clp(r.variable1 || 0)} · Reaj: ${clp(r.variable2 || 0)} · Don: ${clp(r.variable3 || 0)}`,
    ];
    if (pl) {
      lines.push("", `🔮 *Proyeccion al cierre* (${pl})`);
      lines.push(`  Captacion: *${clp(r.proyCaptacion || 0)}* · Mec. Sup: *${clp(r.proyMs || 0)}*`);
    }
    return lines;
  }

  function bloqueC(r) {
    const pl = proyLabel(r);
    const lines = [
      "",
      `💰 Venta Total: *${clp(r.ventaTotal || 0)}*`,
      `  General: ${clp(r.montoGeneral || 0)} → ${clp(r.comGeneral || 0)}`,
      `  Preferente: ${clp(r.montoPreferente || 0)} → ${clp(r.comPreferente || 0)}`,
      `  Gold: ${clp(r.montoGold || 0)} → ${clp(r.comGold || 0)}`,
    ];
    if (pl) {
      lines.push("", `🔮 *Proyeccion al cierre* (${pl})`);
      lines.push(`  Venta: *${clp(r.proyVenta || 0)}* · Mec. Sup: *${clp(r.proyMs || 0)}*`);
    }
    return lines;
  }

  function bloqueSuper(r) {
    const a = r.acumulado || {};
    const dt = a.diasTranscurridos || 0;
    const dtot = a.diasTotales || 1;
    return [
      "",
      `*Equipo* (${a.n_ejecutivas || 0} ejecutivas)`,
      `💰 Captaciones: *${clp(a.total_captacion || 0)}*`,
      `🏦 Mec. Superior: *${clp(a.total_ms || 0)}*`,
      "",
      `🔮 *Proyeccion al cierre* (dia ${dt} de ${dtot} lab.)`,
      `💰 Captaciones: *${clp(a.proyCapt || 0)}*`,
      `🏦 Mec. Superior: *${clp(a.proyMs || 0)}*`,
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
