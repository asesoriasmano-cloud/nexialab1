const SUPABASE = (() => {
  var URL = "https://edviwnyjlugkqjglytad.supabase.co";
  var KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkdml3bnlqbHVna3FqZ2x5dGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3Mzc1MDMsImV4cCI6MjEwNjMxMzUwM30.St2Tbcmue51TQgraSizzpHUfDFztUL4BIIHmkxKSvQk";

  var hdrs = {
    "apikey": KEY,
    "Authorization": "Bearer " + KEY,
    "Content-Type": "application/json",
  };

  async function buscarPorRut(rut) {
    var res = await fetch(
      URL + "/rest/v1/reportes?rut=eq." + encodeURIComponent(rut) + "&order=periodo.desc,updated_at.desc&limit=1",
      { headers: hdrs }
    );
    if (!res.ok) throw new Error("Error " + res.status);
    return res.json();
  }

  async function rpcUpsert(adminKey, data) {
    var res = await fetch(URL + "/rest/v1/rpc/upsert_reporte", {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({
        admin_key: adminKey,
        p_rut: data.rut,
        p_nombre: data.nombre,
        p_telefono: data.telefono || "",
        p_grupo: data.grupo,
        p_esquema: data.esquema || "",
        p_fecha_corte: data.fecha_corte || "",
        p_fecha_corte_ms: data.fecha_corte_ms || "",
        p_periodo: data.periodo,
        p_datos: data.datos,
        p_mensaje: data.mensaje || "",
      }),
    });
    if (!res.ok) {
      var txt = await res.text();
      throw new Error("Supabase " + res.status + ": " + txt);
    }
    return res;
  }

  return { buscarPorRut: buscarPorRut, rpcUpsert: rpcUpsert };
})();
