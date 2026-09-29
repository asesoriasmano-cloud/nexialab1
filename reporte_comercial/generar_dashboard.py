"""
Genera dashboard HTML desde el consolidado procesado.
Ejecutar: python -m reporte_comercial.generar_dashboard
"""
import pandas as pd
from pathlib import Path
from datetime import datetime
from reporte_comercial.config import ARCHIVOS


def _clp(monto):
    return f"${monto:,.0f}".replace(",", ".")


def generar_html(df: pd.DataFrame) -> str:
    fecha = datetime.now().strftime("%d/%m/%Y %H:%M")
    total_com = df["comision"].sum()
    n_a = len(df[df["grupo"] == "A"])
    n_b = len(df[df["grupo"] == "B"])
    n_c = len(df[df["grupo"] == "C"])

    filas_html = ""
    for _, r in df.sort_values("comision", ascending=False).iterrows():
        grupo_badge = {
            "A": '<span style="background:#7c3aed;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">A</span>',
            "B": '<span style="background:#0891b2;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">B</span>',
            "C": '<span style="background:#d97706;color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">C</span>',
        }.get(r["grupo"], "")

        cum = r.get("cumplimiento_global", "")
        cum_str = f"{cum}%" if cum != "" and pd.notna(cum) else "N/A"
        com_color = "#22c55e" if r["comision"] > 0 else "#94a3b8"

        filas_html += f"""
        <tr>
            <td>{r['nombre']}</td>
            <td>{r['equipo']}</td>
            <td style="text-align:center">{grupo_badge}</td>
            <td>{r.get('esquema','')}</td>
            <td style="text-align:center">{cum_str}</td>
            <td style="text-align:right">{r.get('tramo','')}</td>
            <td style="text-align:right;color:{com_color};font-weight:700">{_clp(r['comision'])}</td>
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
}}
@media (prefers-color-scheme: light) {{
  :root:not([data-theme="dark"]) {{
    --bg: #f8fafc; --surface: #ffffff; --border: #e2e8f0;
    --text: #1e293b; --muted: #64748b; --accent: #2563eb;
  }}
}}
:root[data-theme="dark"] {{
  --bg: #0f172a; --surface: #1e293b; --border: #334155;
  --text: #f1f5f9; --muted: #94a3b8; --accent: #3b82f6;
}}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ background:var(--bg); color:var(--text); font-family:system-ui,sans-serif; padding:16px; }}
h1 {{ font-size:1.5rem; margin-bottom:4px; }}
.sub {{ color:var(--muted); font-size:0.875rem; margin-bottom:24px; }}
.cards {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; margin-bottom:24px; }}
.card {{ background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:16px; }}
.card .lbl {{ color:var(--muted); font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; }}
.card .val {{ font-size:1.4rem; font-weight:700; margin-top:4px; }}
table {{ width:100%; border-collapse:collapse; background:var(--surface); border-radius:12px; overflow:hidden; border:1px solid var(--border); }}
th {{ background:var(--accent); color:#fff; padding:10px 12px; text-align:left; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em; }}
td {{ padding:10px 12px; border-bottom:1px solid var(--border); font-size:0.85rem; }}
tr:last-child td {{ border-bottom:none; }}
tr:hover td {{ background:color-mix(in srgb, var(--accent) 8%, transparent); }}
@media (max-width:768px) {{ table {{ display:block; overflow-x:auto; }} }}
</style>
</head>
<body>
<h1>Dashboard Comercial</h1>
<p class="sub">Generado: {fecha} — {len(df)} ejecutivas ({n_a}A + {n_b}B + {n_c}C)</p>
<div class="cards">
  <div class="card"><div class="lbl">Grupo A (3 KPIs)</div><div class="val">{n_a}</div></div>
  <div class="card"><div class="lbl">Grupo B (2 KPIs+Reaj.)</div><div class="val">{n_b}</div></div>
  <div class="card"><div class="lbl">Grupo C (Sin metas)</div><div class="val">{n_c}</div></div>
  <div class="card"><div class="lbl">Comision Total Proyectada</div><div class="val" style="color:#22c55e">{_clp(total_com)}</div></div>
</div>
<table>
<thead><tr>
  <th>Ejecutiva</th><th>Equipo</th><th>Grupo</th><th>Esquema</th>
  <th>Cumpl.</th><th>Tramo</th><th>Comision</th>
</tr></thead>
<tbody>{filas_html}</tbody>
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
