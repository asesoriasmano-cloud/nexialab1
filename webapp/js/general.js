/**
 * Vista general del equipo: KPIs, avance vs ritmo, tramos, proyeccion, alertas,
 * curva acumulada, cierres mensuales (solo en este navegador) y comparativas.
 */
const GENERAL = (() => {
  const KEY_ACTUAL = "gen_actual";
  const KEY_SNAPS = "gen_snapshots";
  const KEY_CIERRES = "gen_cierres";
  const MAX_SNAPS = 12;
  const ESCALA = 140;
  const CORTES = [40, 70, 100];
  const TRAMOS = [
    { label: "Critico", desde: "menos de 40%", color: "#ef4444" },
    { label: "En riesgo", desde: "40% a 69%", color: "#f59e0b" },
    { label: "En ritmo", desde: "70% a 99%", color: "#3b82f6" },
    { label: "Meta cumplida", desde: "100% o mas", color: "#22c55e" },
  ];
  const GRUPO_COLOR = { A: "#7c3aed", B: "#0891b2", C: "#d97706" };
  const MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  let actual = null;
  let snapshots = [];
  let cierres = [];
  let lectura = false;
  let alCambiar = null;
  let curva = { rut: "equipo", metric: "capt" };

  function esc(s) {
    return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function fmtPct(v) {
    return Number(v || 0).toLocaleString("es-CL", { maximumFractionDigits: 1 }) + "%";
  }

  function clpCorto(v) {
    if (v >= 1000000) return (v / 1000000).toLocaleString("es-CL", { maximumFractionDigits: 1 }) + " M";
    return Math.round(v / 1000) + " mil";
  }

  function periodoLabel(p) {
    const [y, m] = String(p).split("-").map(Number);
    return m ? MESES[m] + " " + y : String(p);
  }

  function fechaKey(f) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(f || "");
    return m ? (+m[3]) * 10000 + (+m[2]) * 100 + (+m[1]) : 0;
  }

  function claveOrden(s) {
    return Number(String(s.periodo).replace("-", "")) * 1e8 + fechaKey(s.fechaCorte);
  }

  function sumOf(rows, k) {
    return rows.reduce((s, r) => s + (r[k] || 0), 0);
  }

  function tramoDe(av) {
    if (av < CORTES[0]) return 0;
    if (av < CORTES[1]) return 1;
    if (av < CORTES[2]) return 2;
    return 3;
  }

  function diasDelMes(y, m) {
    return new Date(y, m, 0).getDate();
  }

  function diasLabHasta(y, m, d) {
    let c = 0;
    for (let i = 1; i <= d; i++) {
      const dow = new Date(y, m - 1, i).getDay();
      if (dow !== 0 && dow !== 6) c++;
    }
    return c;
  }

  function extraer(resultados) {
    const ejec = resultados.filter(r => r.grupo !== "S");
    const base = ejec[0] || resultados[0] || {};
    return {
      fechaCorte: base.fechaCorte || "",
      diaCorte: parseInt(String(base.fechaCorte || "").split("/")[0]) || 0,
      dt: base.diasTranscurridos || 0,
      dtot: base.diasTotales || 0,
      rows: ejec.map(r => ({
        rut: r.rut,
        nombre: r.nombre,
        grupo: r.grupo,
        capt: (r.grupo === "A" ? r.realMonto : r.grupo === "B" ? r.realCaptacion : r.ventaTotal) || 0,
        metaCapt: (r.grupo === "A" ? r.metaMonto : r.grupo === "B" ? r.metaCaptacion : 0) || 0,
        proyCapt: (r.grupo === "A" ? r.proyMonto : r.grupo === "B" ? r.proyCaptacion : r.proyVenta) || 0,
        ms: r.realMs || 0,
        metaMs: r.metaMs || 0,
        proyMs: r.proyMs || 0,
        avance: r.grupo === "C" ? null : (r.avanceRaw || 0),
        comision: r.comision || 0,
        socios: r.socios || 0,
        ticket: r.ticket || 0,
        pctMsCapt: r.pctMsCapt || 0,
        serie: r.serie || null,
      })),
    };
  }

  function guardarSnapshot(snap) {
    snapshots = snapshots.filter(s => !(s.periodo === snap.periodo && s.fechaCorte === snap.fechaCorte));
    snapshots.push(snap);
    snapshots.sort((a, b) => claveOrden(a) - claveOrden(b));
    snapshots = snapshots.slice(-MAX_SNAPS);
  }

  function corteAnterior(cur) {
    const previos = snapshots.filter(s => s.periodo === cur.periodo && claveOrden(s) < claveOrden(cur));
    return previos.length ? previos[previos.length - 1] : null;
  }

  function leerCierres() {
    return cierres;
  }

  function persistir() {
    try {
      localStorage.setItem(KEY_ACTUAL, JSON.stringify(actual));
      localStorage.setItem(KEY_SNAPS, JSON.stringify(snapshots));
      localStorage.setItem(KEY_CIERRES, JSON.stringify(cierres));
    } catch (e) { /* empty */ }
    if (alCambiar) alCambiar({ actual, snapshots, cierres });
  }

  function actualizar(resultados, periodo) {
    if (lectura) return;
    const data = extraer(resultados);
    if (!data.rows.length) return;
    actual = { ...data, periodo };
    guardarSnapshot(actual);
    persistir();
    render();
  }

  function iniciar() {
    const leer = (k, def) => {
      try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch (e) { return def; }
    };
    actual = leer(KEY_ACTUAL, null);
    snapshots = leer(KEY_SNAPS, []);
    cierres = leer(KEY_CIERRES, []);
    render();
  }

  function cargarVista(estado) {
    lectura = true;
    actual = estado.actual || null;
    snapshots = estado.snapshots || [];
    cierres = estado.cierres || [];
    render();
  }

  function publicarCon(fn) {
    alCambiar = fn;
  }

  function cerrarMes() {
    if (!actual || lectura) return;
    const lista = leerCierres();
    const existente = lista.find(c => c.periodo === actual.periodo);
    if (existente && !window.confirm(`Ya existe un cierre de ${periodoLabel(actual.periodo)} (corte ${existente.fechaCorte}). Reemplazarlo?`)) return;
    const R = actual.rows;
    const capt = sumOf(R, "capt"), ms = sumOf(R, "ms"), socios = sumOf(R, "socios");
    const cierre = {
      periodo: actual.periodo,
      fechaCorte: actual.fechaCorte,
      cerradoEn: new Date().toLocaleString("es-CL"),
      capt, ms, socios,
      ticket: socios ? capt / socios : 0,
      pctMs: capt ? ms / capt * 100 : 0,
      comision: sumOf(R, "comision"),
      ejecutivas: R.map(r => ({ nombre: r.nombre, grupo: r.grupo, capt: r.capt, ms: r.ms, socios: r.socios, comision: r.comision })),
    };
    cierres = lista.filter(c => c.periodo !== actual.periodo).concat(cierre);
    persistir();
    render();
  }

  function setCurva(k, v) {
    curva[k] = v;
    const el = document.getElementById("gen-curva");
    if (el) el.innerHTML = curvaHtml();
  }

  function curvaHtml() {
    const R = actual.rows;
    const { y, m } = { y: parseInt(actual.periodo.split("-")[0]), m: parseInt(actual.periodo.split("-")[1]) };
    const N = diasDelMes(y, m);
    const rutSel = R.some(r => r.rut === curva.rut) ? curva.rut : "equipo";
    const key = curva.metric === "ms" ? "ms" : "capt";
    const filas = rutSel === "equipo" ? R : R.filter(r => r.rut === rutSel);

    const real = Array(N).fill(0);
    filas.forEach(r => { if (r.serie) r.serie[key].forEach((v, i) => { real[i] += v; }); });
    const meta = sumOf(filas, key === "ms" ? "metaMs" : "metaCapt");
    const dt = actual.diaCorte || 0;
    const diasLabMes = diasLabHasta(y, m, N);

    const W = 640, H = 260, PL = 64, PR = 18, PT = 14, PB = 28;
    const max = Math.max(meta, ...real.slice(0, dt), 1) * 1.1;
    const x = d => PL + (d - 1) / (N - 1) * (W - PL - PR);
    const yy = v => PT + (1 - v / max) * (H - PT - PB);

    const pathReal = real.slice(0, dt).map((v, i) => `${i === 0 ? "M" : "L"}${x(i + 1).toFixed(1)},${yy(v).toFixed(1)}`).join(" ");
    const pathRitmo = meta ? Array.from({ length: N }, (_, i) => {
      const v = meta * diasLabHasta(y, m, i + 1) / diasLabMes;
      return `${i === 0 ? "M" : "L"}${x(i + 1).toFixed(1)},${yy(v).toFixed(1)}`;
    }).join(" ") : "";
    const ticksDias = [...new Set([1, 5, 10, 15, 20, 25, N])].filter(d => d <= N);
    const top = max / 1.1;
    const ticksY = [0, top / 2, top];

    const svg = `<svg viewBox="0 0 ${W} ${H}" class="gen-svg" role="img" aria-label="Curva acumulada">
      ${ticksY.map(v => `<line x1="${PL}" x2="${W - PR}" y1="${yy(v)}" y2="${yy(v)}" class="gen-grid"/>
        <text x="${PL - 8}" y="${yy(v) + 4}" text-anchor="end" class="gen-axis">${clpCorto(v)}</text>`).join("")}
      ${ticksDias.map(d => `<text x="${x(d)}" y="${H - 8}" text-anchor="middle" class="gen-axis">${d}</text>`).join("")}
      ${dt ? `<line x1="${x(dt)}" x2="${x(dt)}" y1="${PT}" y2="${H - PB}" class="gen-corte"/>` : ""}
      ${meta ? `<line x1="${PL}" x2="${W - PR}" y1="${yy(meta)}" y2="${yy(meta)}" class="gen-meta"/>` : ""}
      ${pathRitmo ? `<path d="${pathRitmo}" class="gen-ritmo"/>` : ""}
      ${pathReal ? `<path d="${pathReal}" class="gen-real"/>` : ""}
    </svg>`;

    const opts = [`<option value="equipo"${rutSel === "equipo" ? " selected" : ""}>Equipo</option>`]
      .concat(R.map(r => `<option value="${esc(r.rut)}"${rutSel === r.rut ? " selected" : ""}>${esc(r.nombre)}</option>`)).join("");
    const etiqueta = curva.metric === "ms" ? "Mec. Superior" : "Captacion";
    const ultimo = real[dt - 1] || 0;

    return `<div class="gen-controls">
        <select onchange="GENERAL.setCurva('rut', this.value)" aria-label="Ejecutiva">${opts}</select>
        <select onchange="GENERAL.setCurva('metric', this.value)" aria-label="Metrica">
          <option value="capt"${key === "capt" ? " selected" : ""}>Captacion</option>
          <option value="ms"${key === "ms" ? " selected" : ""}>Mec. Superior</option>
        </select>
      </div>
      <div class="gen-curva-stats small">
        <span><b class="gen-real-txt">━</b> Real acumulado: <b>${ENGINE.clp(ultimo)}</b> al ${esc(actual.fechaCorte)}</span>
        ${meta ? `<span><b class="gen-ritmo-txt">┅</b> Ritmo esperado al dia ${dt}: <b>${ENGINE.clp(meta * diasLabHasta(y, m, dt) / diasLabMes)}</b></span>
        <span><b class="gen-meta-txt">━</b> Meta final ${etiqueta}: <b>${ENGINE.clp(meta)}</b></span>` : `<span>Sin meta para esta seleccion (${etiqueta}).</span>`}
      </div>
      ${svg}`;
  }

  function historialHtml(cierres) {
    if (!cierres.length) {
      return '<p class="small">Aun no hay meses cerrados. Cuando termines un mes, usa "Cerrar mes" en la parte superior.</p>';
    }
    const orden = [...cierres].sort((a, b) => a.periodo.localeCompare(b.periodo));
    const filasMes = orden.map(c => `<tr>
        <td><strong>${periodoLabel(c.periodo)}</strong></td>
        <td class="num">${esc(c.fechaCorte)}</td>
        <td class="num">${ENGINE.clp(c.capt)}</td>
        <td class="num">${ENGINE.clp(c.ms)}</td>
        <td class="num">${fmtPct(c.pctMs)}</td>
        <td class="num">${c.socios}</td>
        <td class="num">${ENGINE.clp(c.ticket)}</td>
        <td class="num">${ENGINE.clp(c.comision)}</td>
      </tr>`).join("");

    const nombres = [];
    orden.forEach(c => c.ejecutivas.forEach(e => { if (!nombres.includes(e.nombre)) nombres.push(e.nombre); }));
    const filasEj = nombres.map(n => `<tr><td><strong>${esc(n)}</strong></td>${orden.map(c => {
      const e = c.ejecutivas.find(x => x.nombre === n);
      return `<td class="num">${e ? ENGINE.clp(e.capt) : "—"}</td>`;
    }).join("")}</tr>`).join("");

    return `<div class="gen-table-wrap"><table>
        <thead><tr><th>Mes</th><th class="num">Corte</th><th class="num">Captacion</th><th class="num">Mec. Sup.</th><th class="num">% MS</th><th class="num">Socios</th><th class="num">Ticket</th><th class="num">Comision</th></tr></thead>
        <tbody>${filasMes}</tbody>
      </table></div>
      <h4 class="gen-sub-h">Captacion por ejecutiva y mes</h4>
      <div class="gen-table-wrap"><table>
        <thead><tr><th>Ejecutiva</th>${orden.map(c => `<th class="num">${periodoLabel(c.periodo)}</th>`).join("")}</tr></thead>
        <tbody>${filasEj}</tbody>
      </table></div>`;
  }

  function deltaHtml(d, desde) {
    if (d === null) return "";
    const signo = d >= 0 ? "+" : "−";
    const clase = d >= 0 ? "up" : "down";
    return `<span class="${clase}">${d >= 0 ? "▲" : "▼"} ${signo}${ENGINE.clp(Math.abs(d))}</span> vs corte ${esc(desde)}`;
  }

  function bloqueProy(titulo, real, proy, meta) {
    if (!meta) {
      return `<div class="gen-proy"><div class="gen-proy-head"><b>${titulo}</b></div><p class="small">Sin metas en este grupo</p></div>`;
    }
    const max = Math.max(real, proy, meta, 1);
    const p = v => (v / max) * 100;
    return `<div class="gen-proy">
      <div class="gen-proy-head"><b>${titulo}</b><span class="small">Proyeccion ${ENGINE.clp(proy)} · ${Math.round(proy / meta * 100)}% de la meta</span></div>
      <div class="gen-track tall">
        <div class="gen-fill" style="width:${p(proy)}%;background:var(--accent);opacity:.3"></div>
        <div class="gen-fill" style="width:${p(real)}%;background:var(--accent)"></div>
        <div class="gen-pace" style="left:${p(meta)}%;background:var(--green);opacity:1"></div>
      </div>
      <div class="small">Real ${ENGINE.clp(real)} · Meta ${ENGINE.clp(meta)}</div>
    </div>`;
  }

  function render() {
    const root = document.getElementById("gen-root");
    if (!root) return;
    const cierres = leerCierres();
    if (!actual || !actual.rows.length) {
      root.innerHTML = '<p class="empty">Procesa los datos para ver la vista general.</p>'
        + '<section class="gen-panel wide"><h3>Historico de cierres</h3>' + historialHtml(cierres) + '</section>';
      return;
    }

    const R = actual.rows;
    const prev = corteAnterior(actual);
    const prevByRut = {};
    if (prev) prev.rows.forEach(r => { prevByRut[r.rut] = r; });

    const capt = sumOf(R, "capt"), ms = sumOf(R, "ms");
    const proyCapt = sumOf(R, "proyCapt"), proyMs = sumOf(R, "proyMs");
    const comision = sumOf(R, "comision");
    const pacing = actual.dtot ? actual.dt / actual.dtot * 100 : 0;
    const conMeta = R.filter(r => r.avance !== null);
    const sinMeta = R.length - conMeta.length;
    const enCritico = conMeta.filter(r => r.avance < CORTES[0]).length;
    const enMeta = conMeta.filter(r => r.avance >= CORTES[2]).length;
    const nG = g => R.filter(r => r.grupo === g).length;

    const cerrado = cierres.find(c => c.periodo === actual.periodo);
    const partes = (actual.periodo || "").split("-");
    const periodoTxt = partes[1] ? MESES[parseInt(partes[1])] + " " + partes[0] : actual.periodo;

    const hero = `<div class="gen-hero">
      <div>
        <h2>Vista general del equipo</h2>
        <div class="small">Corte ${esc(actual.fechaCorte)} · ${periodoTxt} · ${R.length} ejecutivas</div>
      </div>
      <div class="gen-month">
        <div class="small">Dia ${actual.dt} de ${actual.dtot} laborales · ${fmtPct(pacing)} del mes</div>
        <div class="gen-month-track"><div class="gen-month-fill" style="width:${Math.min(pacing, 100)}%"></div></div>
        <div class="gen-cierre">
          ${cerrado ? `<span class="small">Cerrado el ${esc(cerrado.cerradoEn)}</span>` : ""}
          ${lectura ? "" : `<button class="btn btn-sm" onclick="GENERAL.cerrarMes()">${cerrado ? "Actualizar cierre" : "Cerrar mes"}</button>`}
        </div>
      </div>
    </div>`;

    const kpis = `<div class="gen-kpis">
      <div class="gen-kpi" style="--kc:var(--accent)">
        <div class="k-lbl">Captacion equipo</div>
        <div class="k-val">${ENGINE.clp(capt)}</div>
        <div class="k-sub">Proyeccion al cierre ${ENGINE.clp(proyCapt)}</div>
        ${prev ? `<div class="k-sub">${deltaHtml(capt - sumOf(prev.rows, "capt"), prev.fechaCorte)}</div>` : ""}
      </div>
      <div class="gen-kpi" style="--kc:#06b6d4">
        <div class="k-lbl">Mecanismo Superior</div>
        <div class="k-val">${ENGINE.clp(ms)}</div>
        <div class="k-sub">Proyeccion al cierre ${ENGINE.clp(proyMs)}</div>
        ${prev ? `<div class="k-sub">${deltaHtml(ms - sumOf(prev.rows, "ms"), prev.fechaCorte)}</div>` : ""}
      </div>
      <div class="gen-kpi" style="--kc:#22c55e">
        <div class="k-lbl">Comision potencial</div>
        <div class="k-val">${ENGINE.clp(comision)}</div>
        <div class="k-sub">Sobre produccion actual · A ${nG("A")} · B ${nG("B")} · C ${nG("C")}</div>
      </div>
      <div class="gen-kpi" style="--kc:#ef4444">
        <div class="k-lbl">Zona critica (menos de 40%)</div>
        <div class="k-val">${enCritico} de ${conMeta.length}</div>
        <div class="k-sub">${enMeta} con meta cumplida (100% o mas)</div>
      </div>
    </div>`;

    const filasAvance = [...conMeta].sort((a, b) => b.avance - a.avance).map(r => `
      <div class="gen-row">
        <span class="gen-name" title="${esc(r.nombre)}">${esc(r.nombre)}</span>
        <div class="gen-track">
          <div class="gen-fill" style="width:${Math.min(r.avance, ESCALA) / ESCALA * 100}%;background:${TRAMOS[tramoDe(r.avance)].color}"></div>
          <div class="gen-pace" style="left:${Math.min(pacing, ESCALA) / ESCALA * 100}%"></div>
        </div>
        <span class="gen-val">${fmtPct(r.avance)}</span>
      </div>`).join("");
    const panelAvance = `<section class="gen-panel">
      <h3>Avance vs ritmo esperado</h3>
      <p class="p-sub">La linea marca el ritmo esperado al dia ${actual.dt} (${fmtPct(pacing)}).</p>
      ${filasAvance || '<p class="small">Sin ejecutivas con meta.</p>'}
    </section>`;

    const cuenta = [0, 0, 0, 0];
    conMeta.forEach(r => { cuenta[tramoDe(r.avance)]++; });
    const seg = cuenta.map((n, i) => n ? `<div style="flex:${n};background:${TRAMOS[i].color}" title="${TRAMOS[i].label}: ${n}"></div>` : "").join("")
      + (sinMeta ? `<div style="flex:${sinMeta};background:var(--muted)" title="Sin meta: ${sinMeta}"></div>` : "");
    const chips = TRAMOS.map((t, i) => `
      <div class="gen-chip" style="--c:${t.color}">
        <div class="chip-n">${cuenta[i]}</div>
        <div class="small">${t.label}<br>${t.desde}</div>
      </div>`).join("");
    const panelTramos = `<section class="gen-panel">
      <h3>Distribucion por tramo de avance</h3>
      <p class="p-sub">Ejecutivas agrupadas segun su avance sobre meta.</p>
      <div class="gen-seg">${seg}</div>
      <div class="gen-chips">${chips}</div>
      <p class="small" style="margin-top:10px">Sin meta (grupo C): ${sinMeta}</p>
    </section>`;

    const gmax = Math.max(...["A", "B", "C"].map(g => sumOf(R.filter(r => r.grupo === g), "capt")), 1);
    const filasGrupo = ["A", "B", "C"].filter(g => nG(g) > 0).map(g => {
      const Rg = R.filter(r => r.grupo === g);
      const cg = sumOf(Rg, "capt"), mg = sumOf(Rg, "ms");
      return `<div class="gen-row grupo">
        <span class="gen-name"><span class="badge" style="background:${GRUPO_COLOR[g]}">${g}</span> ${Rg.length} ejec.</span>
        <div class="gen-stack">
          <div class="gen-track thin"><div class="gen-fill" style="width:${cg / gmax * 100}%;background:var(--accent)"></div></div>
          <div class="gen-track thin"><div class="gen-fill" style="width:${mg / gmax * 100}%;background:#06b6d4"></div></div>
        </div>
        <span class="gen-val">${ENGINE.clp(cg)}<br><span class="small">MS ${ENGINE.clp(mg)}</span></span>
      </div>`;
    }).join("");
    const panelGrupos = `<section class="gen-panel">
      <h3>Captacion y Mec. Superior por grupo</h3>
      <p class="p-sub"><span class="leg" style="--c:var(--accent)"></span>Captacion <span class="leg" style="--c:#06b6d4"></span>Mec. Superior</p>
      ${filasGrupo}
    </section>`;

    const realCm = sumOf(conMeta, "capt"), proyCm = sumOf(conMeta, "proyCapt"), metaCm = sumOf(conMeta, "metaCapt");
    const realMsCm = sumOf(conMeta, "ms"), proyMsCm = sumOf(conMeta, "proyMs"), metaMsCm = sumOf(conMeta, "metaMs");
    const panelProy = `<section class="gen-panel">
      <h3>Proyeccion al cierre vs meta</h3>
      <p class="p-sub">Solo ejecutivas con meta (grupos A y B). La linea verde es la meta.</p>
      ${bloqueProy("Captacion", realCm, proyCm, metaCm)}
      ${bloqueProy("Mecanismo Superior", realMsCm, proyMsCm, metaMsCm)}
    </section>`;

    const alertas = [];
    R.forEach(r => {
      const motivos = [];
      let sev = 1;
      if (r.avance !== null) {
        if (r.avance < CORTES[0]) { motivos.push(`avance ${fmtPct(r.avance)}, bajo 40%`); sev = 2; }
        else if (r.avance < pacing) motivos.push(`avance ${fmtPct(r.avance)}, bajo el ritmo esperado (${fmtPct(pacing)})`);
      }
      if (r.capt === 0) { motivos.push("sin captacion en el corte"); sev = 2; }
      else if (r.ms === 0) motivos.push("sin Mec. Superior");
      if (motivos.length) alertas.push({ nombre: r.nombre, sev, texto: motivos.join(" · ") });
    });
    alertas.sort((a, b) => b.sev - a.sev || a.nombre.localeCompare(b.nombre));
    const panelAlertas = `<section class="gen-panel">
      <h3>Alertas del corte</h3>
      <p class="p-sub">Ejecutivas que requieren seguimiento.</p>
      ${alertas.length ? alertas.map(a => `
        <div class="gen-alert">
          <span class="gen-dot" style="background:${a.sev === 2 ? "var(--red)" : "#f59e0b"}"></span>
          <div><b>${esc(a.nombre)}</b><div class="small">${esc(a.texto)}</div></div>
        </div>`).join("") : '<p class="small">Sin alertas en este corte.</p>'}
    </section>`;

    const sociosTot = sumOf(R, "socios");
    const ticketEq = sociosTot ? capt / sociosTot : 0;
    const pctMsEq = capt ? ms / capt * 100 : 0;
    const filasSocios = [...R].sort((a, b) => b.socios - a.socios).map(r => `<tr>
        <td><strong>${esc(r.nombre)}</strong></td>
        <td class="gen-hide-m"><span class="badge" style="background:${GRUPO_COLOR[r.grupo]}">${r.grupo}</span></td>
        <td class="num">${r.socios}</td>
        <td class="num">${ENGINE.clp(r.ticket)}</td>
        <td class="num">${fmtPct(r.pctMsCapt)}</td>
      </tr>`).join("");
    const panelSocios = `<section class="gen-panel wide">
      <h3>Socios, ticket y Mec. Superior por ejecutiva</h3>
      <p class="p-sub">Equipo: ${sociosTot} socios (suma por ejecutiva) · ticket promedio ${ENGINE.clp(ticketEq)} · Mec. Superior ${fmtPct(pctMsEq)} de la captacion.</p>
      <div class="gen-table-wrap"><table>
        <thead><tr><th>Ejecutiva</th><th class="gen-hide-m">Grupo</th><th class="num">Socios</th><th class="num">Ticket prom.</th><th class="num">% MS / capt.</th></tr></thead>
        <tbody>${filasSocios}</tbody>
      </table></div>
    </section>`;

    const panelCurva = `<section class="gen-panel wide">
      <h3>Acumulado del mes vs ritmo y meta</h3>
      <p class="p-sub">Linea real acumulada por dia del mes, comparada con el ritmo esperado (dias laborales) y la meta final.</p>
      <div id="gen-curva">${curvaHtml()}</div>
    </section>`;

    let panelComp;
    if (prev) {
      const filas = R.map(r => {
        const p = prevByRut[r.rut] || { capt: 0, ms: 0 };
        const d = r.capt - p.capt;
        return {
          nombre: r.nombre, grupo: r.grupo, cp: p.capt, ca: r.capt, d,
          dp: p.capt ? d / p.capt * 100 : null, dms: r.ms - p.ms,
        };
      }).sort((a, b) => b.d - a.d);
      const signed = v => (v >= 0 ? "+" : "−") + ENGINE.clp(Math.abs(v));
      const tabla = filas.map(f => `<tr>
        <td><strong>${esc(f.nombre)}</strong></td>
        <td class="gen-hide-m"><span class="badge" style="background:${GRUPO_COLOR[f.grupo]}">${f.grupo}</span></td>
        <td class="num">${ENGINE.clp(f.cp)}</td>
        <td class="num">${ENGINE.clp(f.ca)}</td>
        <td class="num ${f.d >= 0 ? "up" : "down"}">${signed(f.d)}</td>
        <td class="num gen-hide-m ${f.dp === null ? "" : f.dp >= 0 ? "up" : "down"}">${f.dp === null ? "—" : (f.dp >= 0 ? "+" : "") + fmtPct(f.dp)}</td>
        <td class="num gen-hide-m ${f.dms >= 0 ? "up" : "down"}">${signed(f.dms)}</td>
      </tr>`).join("");
      panelComp = `<section class="gen-panel wide">
        <h3>Comparativa vs corte anterior</h3>
        <p class="p-sub">Corte ${esc(prev.fechaCorte)} contra corte ${esc(actual.fechaCorte)}, mismo periodo.</p>
        <div class="gen-table-wrap"><table>
          <thead><tr><th>Ejecutiva</th><th class="gen-hide-m">Grupo</th><th class="num">Capt. anterior</th><th class="num">Capt. actual</th><th class="num">Δ $</th><th class="num gen-hide-m">Δ %</th><th class="num gen-hide-m">Δ MS</th></tr></thead>
          <tbody>${tabla}</tbody>
        </table></div>
      </section>`;
    } else {
      panelComp = `<section class="gen-panel wide">
        <h3>Comparativa vs corte anterior</h3>
        <p class="small">Aun no hay un corte anterior del mismo mes. Al procesar un corte distinto, aqui aparecera la variacion. Se guarda en este navegador.</p>
      </section>`;
    }

    const panelHistorial = `<section class="gen-panel wide">
      <h3>Historico de cierres</h3>
      <p class="p-sub">Meses cerrados desde este navegador.</p>
      ${historialHtml(cierres)}
    </section>`;

    root.innerHTML = hero + kpis
      + `<div class="gen-grid">${panelAvance}${panelTramos}${panelGrupos}${panelProy}${panelAlertas}</div>`
      + panelCurva + panelSocios + panelComp + panelHistorial;
  }

  return { actualizar, iniciar, render, cerrarMes, setCurva, cargarVista, publicarCon };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (!document.body.dataset.vista) GENERAL.iniciar();
});
