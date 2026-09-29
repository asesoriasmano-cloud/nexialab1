"""
Genera un dashboard HTML estático desde el consolidado procesado.
Ejecutar: python -m reporte_comercial.generar_dashboard
"""
import pandas as pd
from pathlib import Path
from datetime import datetime

from reporte_comercial.config import ARCHIVOS
from reporte_comercial.core.mensaje import formato_clp


def generar_html(df: pd.DataFrame) -> str:
    fecha = datetime.now().strftime("%d/%m/%Y %H:%M")
    total_venta = df["venta_acumulada"].sum()
    total_meta = df["meta_efectiva"].sum()
    pct_global = round((total_venta / total_meta) * 100, 1) if total_meta > 0 else 0
    total_comision = df["comision_proyectada"].sum()
    pendientes_firma = len(df[df["estado_meta"] != "Firmada"])

    filas_html = ""
    for _, r in df.sort_values("pct_avance", ascending=False).iterrows():
        color_pct = (
            "#22c55e" if r["pct_avance"] >= 100
            else "#f59e0b" if r["pct_avance"] >= 70
            else "#ef4444"
        )
        badge_meta = (
            '<span style="color:#22c55e">Firmada</span>'
            if r["estado_meta"] == "Firmada"
            else '<span style="color:#f59e0b">Pendiente</span>'
        )
        filas_html += f"""
        <tr>
            <td>{r['nombre']}</td>
            <td>{r['equipo']}</td>
            <td>{r['tipo_contrato']}</td>
            <td>{r['tramo_antiguedad']}</td>
            <td>{badge_meta}</td>
            <td style="text-align:right">{formato_clp(r['meta_efectiva'])}</td>
            <td style="text-align:right">{formato_clp(r['venta_acumulada'])}</td>
            <td style="text-align:right;color:{color_pct};font-weight:700">{r['pct_avance']}%</td>
            <td style="text-align:right">{formato_clp(r['comision_proyectada'])}</td>
        </tr>"""

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard Comercial</title>
<style>
:root {{
  --bg: #0f172a; --surface: #1e293b; --border: #334155;
  --text: #f1f5f9; --muted: #94a3b8; --accent: #3b82f6;
  --green: #22c55e; --yellow: #f59e0b; --red: #ef4444;
}}
@media (prefers-color-scheme: light) {{
  :root:not([data-theme="dark"]) {{
    --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0;
    --text: #1e293b; --muted: #64748b; --accent: #2563eb;
    --green: #16a34a; --yellow: #d97706; --red: #dc2626;
  }}
}}
:root[data-theme="dark"] {{
  --bg: #0f172a; --surface: #1e293b; --border: #334155;
  --text: #f1f5f9; --muted: #94a3b8; --accent: #3b82f6;
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:var(--bg); color:var(--text); font-family:system-ui,-apple-system,sans-serif; padding:16px; }}
h1 {{ font-size:1.5rem; margin-bottom:4px; }}
.subtitle {{ color:var(--muted); font-size:0.875rem; margin-bottom:24px; }}
.cards {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:24px; }}
.card {{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; }}
.card .label {{ color:var(--muted); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; }}
.card .value {{ font-size:1.5rem; font-weight:700; margin-top:4px; }}
.card .value.green {{ color:var(--green); }}
.card .value.yellow {{ color:var(--yellow); }}
.card .value.red {{ color:var(--red); }}
table {{ width:100%; border-collapse:collapse; background:var(--surface); border-radius:12px; overflow:hidden; border:1px solid var(--border); }}
th {{ background:var(--accent); color:#fff; padding:10px 12px; text-align:left; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.05em; }}
td {{ padding:10px 12px; border-bottom:1px solid var(--border); font-size:0.875rem; }}
tr:last-child td {{ border-bottom:none; }}
tr:hover td {{ background:color-mix(in srgb, var(--accent) 8%, transparent); }}
@media (max-width:768px) {{
  table {{ display:block; overflow-x:auto; }}
  .cards {{ grid-template-columns:repeat(2,1fr); }}
}}
</style>
</head>
<body>
<h1>Dashboard Comercial</h1>
<p class="subtitle">Generado: {fecha} &mdash; {len(df)} vendedores piloto</p>

<div class="cards">
  <div class="card">
    <div class="label">Venta Total Acumulada</div>
    <div class="value">{formato_clp(total_venta)}</div>
  </div>
  <div class="card">
    <div class="label">Meta Total Efectiva</div>
    <div class="value">{formato_clp(total_meta)}</div>
  </div>
  <div class="card">
    <div class="label">Avance Global</div>
    <div class="value {'green' if pct_global >= 80 else 'yellow' if pct_global >= 50 else 'red'}">{pct_global}%</div>
  </div>
  <div class="card">
    <div class="label">Comision Total Proyectada</div>
    <div class="value">{formato_clp(total_comision)}</div>
  </div>
  <div class="card">
    <div class="label">Pendientes de Firma</div>
    <div class="value {'red' if pendientes_firma > 0 else 'green'}">{pendientes_firma}</div>
  </div>
</div>

<table>
<thead>
<tr>
  <th>Vendedor</th><th>Equipo</th><th>Contrato</th><th>Tramo</th>
  <th>Meta</th><th>Meta Efectiva</th><th>Venta Acum.</th>
  <th>Avance</th><th>Comision Proy.</th>
</tr>
</thead>
<tbody>
{filas_html}
</tbody>
</table>
</body>
</html>"""


def main():
    df = pd.read_excel(ARCHIVOS["consolidado"])
    html = generar_html(df)
    out = ARCHIVOS["consolidado"].parent / "dashboard.html"
    out.write_text(html, encoding="utf-8")
    print(f"Dashboard generado: {out}")


if __name__ == "__main__":
    main()
