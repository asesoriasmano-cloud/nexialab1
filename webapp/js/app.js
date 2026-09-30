/**
 * App controller — maneja UI, carga de archivos, y procesamiento.
 */
const APP = (() => {
  let maestro = [];
  let dataCargada = { data20: null, data21: null, ms: null };
  let resultados = [];

  // ── Inicialización ──
  function init() {
    setupTabs();
    cargarMaestroDesdeStorage();
    setupFileUploads();
    renderMaestro();
    const now = new Date();
    document.getElementById("sel-mes").value = now.getMonth() + 1;
    document.getElementById("inp-anio").value = now.getFullYear();
  }

  // ── Tabs ──
  function setupTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(btn.dataset.tab).classList.add("active");
      });
    });
  }

  // ── Maestro CRUD ──
  function cargarMaestroDesdeStorage() {
    try {
      const saved = localStorage.getItem("maestro_vendedores");
      if (saved) maestro = JSON.parse(saved);
    } catch (e) { /* empty */ }
  }

  function guardarMaestro() {
    try {
      localStorage.setItem("maestro_vendedores", JSON.stringify(maestro));
    } catch (e) { /* empty */ }
  }

  function normRut(rut) {
    return String(rut).trim().toUpperCase().replace(/[^0-9K]/g, "");
  }

  function colVal(row, ...names) {
    for (const n of names) {
      if (row[n] !== undefined && row[n] !== "") return row[n];
    }
    const lower = names.map(n => n.toLowerCase());
    for (const k of Object.keys(row)) {
      if (lower.includes(k.toLowerCase()) && row[k] !== undefined && row[k] !== "") return row[k];
    }
    return "";
  }

  function mapearGrupo(tc) {
    const s = String(tc).trim().toLowerCase();
    if (["sup", "jef", "coord", "lider"].some(k => s.includes(k))) return "S";
    if (s.includes("sin")) return "C";
    const num = parseFloat(tc);
    if (isNaN(num)) return "C";
    return CONFIG.TIPO_CONTRATO_A_GRUPO[num] || "C";
  }

  function normTelefono(tel) {
    let s = String(tel).trim().replace(/\s/g, "").replace(".0", "");
    if (s.startsWith("56") && !s.startsWith("+")) s = "+" + s;
    if (!s.startsWith("+")) s = "+56" + s;
    return s;
  }

  window.uploadMaestro = function(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const findCol = (row, names) => {
        const key = Object.keys(row).find(k => names.includes(k.toLowerCase()));
        return key ? row[key] : "";
      };

      maestro = rows
        .filter(r => findCol(r, ["rut"]) || r["Ejecutivo normalizado"])
        .map(r => {
          const isReal = "Ejecutivo normalizado" in r || "tipo contrato" in r;
          const rut = normRut(findCol(r, ["rut"]));
          const tc = r["tipo contrato"] || r.tipo_contrato || "";
          const grupo = isReal ? mapearGrupo(tc) : (r.grupo || "C").toUpperCase();

          const volKey = Object.keys(r).find(k => k.toLowerCase() === "volumen") || "";
          const msKey = Object.keys(r).find(k => k.toLowerCase().includes("mec") && k.toLowerCase().includes("sup")) || "";
          const qKey = Object.keys(r).find(k => k.toLowerCase().includes("acuerdo")) || "";
          const vol = parseFloat(r[volKey]) || 0;

          return {
            rut,
            nombre: r["Ejecutivo normalizado"] || r.nombre || "",
            telefono: normTelefono(findCol(r, ["telefono"]) || ""),
            tipoContrato: tc,
            grupo,
            metaVolumen: vol,
            metaMontoAcuerdos: grupo === "A" ? vol : 0,
            metaCaptacion: grupo === "B" ? vol : 0,
            metaMs: parseFloat(r[msKey]) || 0,
            metaQAcuerdos: parseInt(r[qKey]) || 0,
          };
        })
        .filter(r => r.rut);

      guardarMaestro();
      renderMaestro();
      checkReadyToProcess();
      showToast(`Maestro cargado: ${maestro.length} ejecutivas`);
    };
    reader.readAsArrayBuffer(file);
    input.value = "";
  };

  function renderMaestro() {
    const container = document.getElementById("maestro-table");
    if (!maestro.length) {
      container.innerHTML = '<p class="empty">No hay maestro cargado. Sube el archivo Excel.</p>';
      document.getElementById("maestro-count").textContent = "0 ejecutivas";
      return;
    }
    document.getElementById("maestro-count").textContent = `${maestro.length} ejecutivas`;

    const grupoBadge = g => {
      const colors = { A: "#7c3aed", B: "#0891b2", C: "#d97706", S: "#dc2626" };
      const label = g === "S" ? "SUP" : g;
      return `<span class="badge" style="background:${colors[g] || '#666'}">${label}</span>`;
    };

    let html = `<table><thead><tr>
      <th>Nombre</th><th>RUT</th><th>Tel</th><th>Grupo</th>
      <th>Meta Vol.</th><th>Meta MS</th><th>Meta Q</th><th></th>
    </tr></thead><tbody>`;

    maestro.forEach((v, i) => {
      html += `<tr>
        <td><input value="${v.nombre}" onchange="APP.editMaestro(${i},'nombre',this.value)"></td>
        <td class="mono">${v.rut}</td>
        <td><input value="${v.telefono}" onchange="APP.editMaestro(${i},'telefono',this.value)" style="width:120px"></td>
        <td>${grupoBadge(v.grupo)}</td>
        <td class="num">${v.metaVolumen > 0 ? ENGINE.clp(v.metaVolumen) : "N/A"}</td>
        <td class="num">${v.metaMs > 0 ? ENGINE.clp(v.metaMs) : "N/A"}</td>
        <td class="num">${v.metaQAcuerdos > 0 ? v.metaQAcuerdos : "N/A"}</td>
        <td><button class="btn-icon" onclick="APP.removeMaestro(${i})" title="Eliminar">✕</button></td>
      </tr>`;
    });
    html += "</tbody></table>";
    container.innerHTML = html;
  }

  function editMaestro(idx, field, value) {
    maestro[idx][field] = value;
    guardarMaestro();
  }

  function removeMaestro(idx) {
    maestro.splice(idx, 1);
    guardarMaestro();
    renderMaestro();
  }

  // ── File Uploads (data_20, data_21, MS) ──
  function setupFileUploads() {
    ["data20", "data21", "ms"].forEach(key => {
      const zone = document.getElementById(`zone-${key}`);
      const input = zone.querySelector("input[type=file]");

      zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
      zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
      zone.addEventListener("drop", e => {
        e.preventDefault();
        zone.classList.remove("dragover");
        if (e.dataTransfer.files.length) processFile(key, e.dataTransfer.files[0]);
      });
      input.addEventListener("change", () => {
        if (input.files.length) processFile(key, input.files[0]);
        input.value = "";
      });
    });
  }

  function processFile(key, file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target.result, { type: "array" });
      let rows;

      if (key === "ms") {
        const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes("detalle")) || wb.SheetNames[0];
        rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
      } else {
        rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
      }

      dataCargada[key] = rows;
      updateFileStatus(key, rows.length, file.name);
      checkReadyToProcess();
    };
    reader.readAsArrayBuffer(file);
  }

  function updateFileStatus(key, count, filename) {
    const status = document.getElementById(`status-${key}`);
    status.innerHTML = `<span class="file-ok">✓ ${count} registros</span> <small>${filename}</small>`;
    status.classList.add("loaded");
  }

  function checkReadyToProcess() {
    const ready = dataCargada.data20 && dataCargada.data21 && dataCargada.ms && maestro.length > 0;
    document.getElementById("btn-procesar").disabled = !ready;
    if (!maestro.length) {
      document.getElementById("btn-procesar").title = "Primero carga el Maestro en la pestaña anterior";
    } else {
      document.getElementById("btn-procesar").title = "";
    }
  }

  // ── Procesamiento ──
  function parseDateField(val) {
    if (!val) return null;
    if (typeof val === "number") return excelDateToJS(val);
    const d = new Date(val);
    return isNaN(d) ? null : d;
  }

  window.procesar = function() {
    if (!maestro.length) return showToast("Carga el maestro primero", "error");

    const mesMS = parseInt(document.getElementById("sel-mes").value);
    const anioMS = parseInt(document.getElementById("inp-anio").value);
    const rutsSet = new Set(maestro.map(v => v.rut));

    // Procesar data_20
    const d20 = (dataCargada.data20 || [])
      .filter(r => {
        const aud = String(colVal(r, "AUDITORIA", "auditoria")).trim();
        return aud !== "SE DESCUENTA";
      })
      .map(r => ({
        rut: normRut(colVal(r, "RUT EJEUTIVO", "RUT EJECUTIVO", "rut_ejecutivo")),
        monto: parseFloat(colVal(r, "MONTO", "monto")) || 0,
        fecha: colVal(r, "FECHA", "fecha"),
      }))
      .filter(r => r.rut);

    // Procesar data_21
    const d21 = (dataCargada.data21 || [])
      .map(r => ({
        rut: normRut(colVal(r, "RUT EJECUTIVO", "RUT EJEUTIVO", "rut_ejecutivo")),
        monto: parseFloat(colVal(r, "MONTO", "monto")) || 0,
        fecha: colVal(r, "FECHA", "fecha"),
      }))
      .filter(r => r.rut);

    // Procesar MS — filtrar por mes/año y excluir rechazos
    const msRechazos = ["Rechazo Auditoría Marcel", "Rechazo Control de Ingresos"];
    const msData = (dataCargada.ms || [])
      .filter(r => {
        const aud = String(colVal(r, "Auditoria", "auditoria")).trim();
        if (msRechazos.includes(aud)) return false;
        // Filter by month/year: prefer Mes/Año columns, fallback to date
        let m = parseInt(colVal(r, "Mes", "mes"));
        let a = parseInt(colVal(r, "Año", "año", "anio", "Anio"));
        if (!m || !a || isNaN(m) || isNaN(a)) {
          const d = parseDateField(colVal(r, "date", "Date", "fecha", "FECHA"));
          if (d) { m = d.getMonth() + 1; a = d.getFullYear(); }
        }
        return m === mesMS && a === anioMS;
      })
      .map(r => {
        let mec = String(colVal(r, "Mecanismo", "mecanismo")).trim().toUpperCase();
        if (mec.startsWith("=") || !mec) mec = "SUPERIOR";
        return {
          rut: normRut(colVal(r, "Rut_ejecutivo", "rut_ejecutivo", "RUT EJECUTIVO", "RUT EJEUTIVO", "rut", "Rut", "RUT")),
          monto: parseFloat(colVal(r, "monto", "MONTO", "amount")) || 0,
          mecanismo: mec,
          planName: String(colVal(r, "plan_name", "Plan_name")),
        };
      })
      .filter(r => r.rut);

    // Debug: column names in each source
    if (dataCargada.data20 && dataCargada.data20[0]) console.log("D20 cols:", Object.keys(dataCargada.data20[0]).join(", "));
    if (dataCargada.data21 && dataCargada.data21[0]) console.log("D21 cols:", Object.keys(dataCargada.data21[0]).join(", "));
    if (dataCargada.ms && dataCargada.ms[0]) console.log("MS cols:", Object.keys(dataCargada.ms[0]).join(", "));
    console.log(`Procesando: d20=${d20.length}, d21=${d21.length}, MS mes ${mesMS}/${anioMS}=${msData.length} registros`);

    // Debug: RUTs en cada fuente vs maestro
    const d20Ruts = new Set(d20.map(r => r.rut));
    const d21Ruts = new Set(d21.map(r => r.rut));
    const msRuts = new Set(msData.map(r => r.rut));
    maestro.forEach(v => {
      const inD20 = d20Ruts.has(v.rut);
      const inD21 = d21Ruts.has(v.rut);
      const inMS = msRuts.has(v.rut);
      if (!inD20 && !inD21 && !inMS) {
        console.warn(`⚠ ${v.nombre} (${v.rut}) sin datos en ninguna planilla`);
      } else {
        console.log(`✓ ${v.nombre} (${v.rut}): d20=${inD20} d21=${inD21} ms=${inMS}`);
      }
    });

    // Agregar por ejecutiva
    const fechaCorte = calcularFechaCorte(d20, d21);
    const ventas = {};
    rutsSet.forEach(rut => {
      const e20 = d20.filter(r => r.rut === rut);
      const e21 = d21.filter(r => r.rut === rut);
      const ems = msData.filter(r => r.rut === rut);
      const emsSup = ems.filter(r => r.mecanismo === "SUPERIOR");
      const eDon = ems.filter(r => r.planName.toLowerCase().includes("donaci"));

      const qAcuerdos = e20.length + e21.length;
      const montoVol = e20.reduce((s, r) => s + r.monto, 0) + e21.reduce((s, r) => s + r.monto, 0);
      const msSuperior = emsSup.reduce((s, r) => s + r.monto, 0);
      const donaciones = eDon.reduce((s, r) => s + r.monto, 0);

      const split = CONFIG.SIMULACION_GOLD_PREFERENTE_SPLIT;
      ventas[rut] = {
        realQAcuerdos: qAcuerdos,
        realMontoAcuerdos: montoVol,
        realCaptacion: montoVol,
        realMs: msSuperior,
        realReajustes: 0,
        realDonaciones: donaciones,
        ventaTotal: montoVol,
        montoPreferente: msSuperior * (1 - split),
        montoGold: msSuperior * split,
      };
    });

    // Calcular comisiones
    resultados = [];
    const supervisoras = [];

    maestro.forEach(v => {
      const vt = ventas[v.rut] || {};
      const base = {
        rut: v.rut,
        nombre: v.nombre,
        telefono: v.telefono,
        grupo: v.grupo,
        fechaCorte: fechaCorte,
        alerta: `Mecanismo Superior al ${fechaCorte}.`,
      };

      if (v.grupo === "S") {
        supervisoras.push(base);
        return;
      }

      if (v.grupo === "A") {
        const r = ENGINE.calcularGrupoA({
          metaQ: v.metaQAcuerdos,
          metaMonto: v.metaMontoAcuerdos,
          metaMs: v.metaMs,
          realQ: vt.realQAcuerdos || 0,
          realMonto: vt.realMontoAcuerdos || 0,
          realMs: vt.realMs || 0,
        });
        Object.assign(base, {
          esquema: "3 KPIs (tope 140%)",
          pctQ: r.pctQ, pctMonto: r.pctMonto, pctMs: r.pctMs,
          cumplimientoGlobal: r.cumplimientoGlobal,
          avanceRaw: r.avanceRaw,
          comision: r.comision, tramo: r.tramoLabel,
          realQ: vt.realQAcuerdos || 0, metaQ: v.metaQAcuerdos || 0,
          realMonto: vt.realMontoAcuerdos || 0, metaMonto: v.metaMontoAcuerdos || 0,
          realMs: vt.realMs || 0, metaMs: v.metaMs || 0,
        });
      } else if (v.grupo === "B") {
        const r = ENGINE.calcularGrupoB({
          metaCaptacion: v.metaCaptacion,
          metaMs: v.metaMs,
          realCaptacion: vt.realCaptacion || 0,
          realMs: vt.realMs || 0,
          realReajustes: vt.realReajustes || 0,
          realDonaciones: vt.realDonaciones || 0,
        });
        Object.assign(base, {
          esquema: "2 KPIs (tope 300%) + Reajustes",
          pctCaptacion: r.pctCaptacion, pctMs: r.pctMs,
          cumplimientoGlobal: r.cumplimientoGlobal,
          avanceRaw: r.avanceRaw,
          variable1: r.variable1, variable2: r.variable2, variable3: r.variable3,
          comision: r.comisionTotal, tramo: r.tramoLabel,
          realCaptacion: vt.realCaptacion || 0, metaCaptacion: v.metaCaptacion || 0,
          realMs: vt.realMs || 0, metaMs: v.metaMs || 0,
        });
      } else if (v.grupo === "C") {
        const r = ENGINE.calcularGrupoC({
          ventaTotal: vt.ventaTotal || 0,
          montoPreferente: vt.montoPreferente || 0,
          montoGold: vt.montoGold || 0,
        });
        Object.assign(base, {
          esquema: "Sin metas — por producción",
          ventaTotal: r.ventaTotal, montoGeneral: r.montoGeneral,
          montoPreferente: r.montoPreferente, montoGold: r.montoGold,
          comGeneral: r.comGeneral, comPreferente: r.comPreferente, comGold: r.comGold,
          comision: r.comisionTotal, tramo: r.tramoLabel,
        });
      }
      resultados.push(base);
    });

    // Supervisora
    if (supervisoras.length) {
      const acum = acumularEquipo(resultados);
      supervisoras.forEach(sup => {
        sup.esquema = "Supervisora — Resumen acumulado";
        sup.comision = 0;
        sup.tramo = "";
        sup.acumulado = acum;
        resultados.push(sup);
      });
    }

    renderDashboard();
    renderMensajes();
    document.querySelector('[data-tab="tab-resultados"]').click();
    showToast(`${resultados.length} reportes · d20:${d20.length} d21:${d21.length} MS:${msData.length}`);
  };

  function calcularFechaCorte(d20, d21) {
    let maxDate = null;
    [...d20, ...d21].forEach(r => {
      if (r.fecha) {
        const d = typeof r.fecha === "number" ? excelDateToJS(r.fecha) : new Date(r.fecha);
        if (!isNaN(d) && (!maxDate || d > maxDate)) maxDate = d;
      }
    });
    if (maxDate) {
      const dd = String(maxDate.getDate()).padStart(2, "0");
      const mm = String(maxDate.getMonth() + 1).padStart(2, "0");
      return `${dd}/${mm}/${maxDate.getFullYear()}`;
    }
    const now = new Date();
    return `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
  }

  function excelDateToJS(serial) {
    return new Date((serial - 25569) * 86400 * 1000);
  }

  function acumularEquipo(res) {
    const acum = {
      grupo_a: { n: 0, real_q: 0, real_monto: 0, real_ms: 0, comision_total: 0 },
      grupo_b: { n: 0, real_captacion: 0, real_ms: 0, real_reajustes: 0, real_donaciones: 0, comision_total: 0 },
      grupo_c: { n: 0, venta_total: 0, monto_general: 0, monto_preferente: 0, monto_gold: 0, comision_total: 0 },
      comision_equipo: 0,
    };
    res.forEach(r => {
      acum.comision_equipo += r.comision || 0;
      if (r.grupo === "A") {
        acum.grupo_a.n++;
        acum.grupo_a.real_q += r.pctQ || 0;
        acum.grupo_a.real_monto += r.pctMonto || 0;
        acum.grupo_a.real_ms += r.pctMs || 0;
        acum.grupo_a.comision_total += r.comision || 0;
      } else if (r.grupo === "B") {
        acum.grupo_b.n++;
        acum.grupo_b.real_captacion += r.pctCaptacion || 0;
        acum.grupo_b.real_ms += r.pctMs || 0;
        acum.grupo_b.real_reajustes += r.variable2 || 0;
        acum.grupo_b.real_donaciones += r.variable3 || 0;
        acum.grupo_b.comision_total += r.comision || 0;
      } else if (r.grupo === "C") {
        acum.grupo_c.n++;
        acum.grupo_c.venta_total += r.ventaTotal || 0;
        acum.grupo_c.monto_general += r.montoGeneral || 0;
        acum.grupo_c.monto_preferente += r.montoPreferente || 0;
        acum.grupo_c.monto_gold += r.montoGold || 0;
        acum.grupo_c.comision_total += r.comision || 0;
      }
    });
    return acum;
  }

  // ── Dashboard ──
  function renderDashboard() {
    const abc = resultados.filter(r => r.grupo !== "S");
    const totalCom = abc.reduce((s, r) => s + (r.comision || 0), 0);
    const ga = abc.filter(r => r.grupo === "A");
    const gb = abc.filter(r => r.grupo === "B");
    const gc = abc.filter(r => r.grupo === "C");

    document.getElementById("card-total").textContent = ENGINE.clp(totalCom);
    document.getElementById("card-ga").textContent = `${ga.length} — ${ENGINE.clp(ga.reduce((s,r) => s+r.comision, 0))}`;
    document.getElementById("card-gb").textContent = `${gb.length} — ${ENGINE.clp(gb.reduce((s,r) => s+r.comision, 0))}`;
    document.getElementById("card-gc").textContent = `${gc.length} — ${ENGINE.clp(gc.reduce((s,r) => s+r.comision, 0))}`;

    const sorted = [...resultados].sort((a, b) => (b.comision || 0) - (a.comision || 0));
    const colors = { A: "#7c3aed", B: "#0891b2", C: "#d97706", S: "#dc2626" };

    let html = `<table><thead><tr>
      <th>Ejecutiva</th><th>Grupo</th><th>Esquema</th>
      <th>Avance</th><th>Cumpl.</th><th>Tramo</th><th>Comisión</th>
    </tr></thead><tbody>`;

    sorted.forEach(r => {
      const label = r.grupo === "S" ? "SUP" : r.grupo;
      const av = r.avanceRaw != null ? `${r.avanceRaw}%` : "—";
      const cum = r.cumplimientoGlobal != null ? `${r.cumplimientoGlobal}%` : "N/A";
      const comColor = (r.comision || 0) > 0 ? "#22c55e" : "var(--muted)";
      const avColor = (r.avanceRaw || 0) > 0 ? "var(--text)" : "var(--muted)";
      html += `<tr>
        <td><strong>${r.nombre}</strong></td>
        <td><span class="badge" style="background:${colors[r.grupo]}">${label}</span></td>
        <td class="small">${r.esquema || ""}</td>
        <td class="num" style="color:${avColor}">${av}</td>
        <td class="num">${cum}</td>
        <td class="mono small">${r.tramo || ""}</td>
        <td class="num" style="color:${comColor};font-weight:700">${ENGINE.clp(r.comision || 0)}</td>
      </tr>`;
    });
    html += "</tbody></table>";
    document.getElementById("dashboard-table").innerHTML = html;
  }

  // ── Mensajes ──
  function renderMensajes() {
    const container = document.getElementById("mensajes-list");
    const colors = { A: "#7c3aed", B: "#0891b2", C: "#d97706", S: "#dc2626" };

    let html = "";
    resultados.forEach((r, i) => {
      const msg = ENGINE.construirMensaje(r);
      const link = ENGINE.generarLinkWA(r.telefono, msg);
      const label = r.grupo === "S" ? "SUP" : r.grupo;
      html += `
        <div class="msg-card">
          <div class="msg-header">
            <span class="badge" style="background:${colors[r.grupo]}">${label}</span>
            <strong>${r.nombre}</strong>
            <span class="msg-com">${ENGINE.clp(r.comision || 0)}</span>
          </div>
          <pre class="msg-preview" id="msg-${i}">${escapeHtml(msg)}</pre>
          <div class="msg-actions">
            <button class="btn btn-sm" onclick="APP.copyMsg(${i})">📋 Copiar</button>
            <a class="btn btn-sm btn-wa" href="${link}" target="_blank">💬 WhatsApp</a>
          </div>
        </div>`;
    });
    container.innerHTML = html || '<p class="empty">Procesa los datos primero.</p>';
  }

  function copyMsg(i) {
    const el = document.getElementById(`msg-${i}`);
    navigator.clipboard.writeText(el.textContent).then(() => showToast("Mensaje copiado"));
  }

  function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // ── Toast ──
  function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.className = `toast show ${type}`;
    setTimeout(() => toast.className = "toast", 3000);
  }

  // ── Export ──
  window.exportarExcel = function() {
    if (!resultados.length) return;
    const data = resultados.map(r => ({
      Nombre: r.nombre, RUT: r.rut, Telefono: r.telefono,
      Grupo: r.grupo, Esquema: r.esquema || "",
      Cumplimiento: r.cumplimientoGlobal || "",
      Tramo: r.tramo || "", Comision: r.comision || 0,
      Link_WhatsApp: ENGINE.generarLinkWA(r.telefono, ENGINE.construirMensaje(r)),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consolidado");
    XLSX.writeFile(wb, `reporte_comercial_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast("Excel exportado");
  };

  return { init, editMaestro, removeMaestro, copyMsg };
})();

document.addEventListener("DOMContentLoaded", APP.init);
