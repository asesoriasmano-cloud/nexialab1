"""
Constructor de mensajes WhatsApp individualizados por grupo.
"""
from datetime import date
from typing import Optional


def _clp(monto: float) -> str:
    return f"${monto:,.0f}".replace(",", ".")


def _barra(pct: float, largo: int = 10, tope: float = 100) -> str:
    ratio = min(pct / tope, 1.0) if tope > 0 else 0
    llenos = int(ratio * largo)
    return "█" * llenos + "░" * (largo - llenos)


def construir_mensaje(row: dict) -> str:
    grupo = row["grupo"]
    fecha_str = row["fecha_corte_ventas"].strftime("%d/%m/%Y") if row["fecha_corte_ventas"] else "N/A"

    lineas = [
        f"📊 *Reporte Diario de Ventas*",
        f"━━━━━━━━━━━━━━━━━━━━━━",
        f"",
        f"👤 *{row['nombre']}*",
        f"📅 Corte: {fecha_str} | Equipo: {row['equipo']}",
    ]

    if grupo == "A":
        lineas += _bloque_grupo_a(row)
    elif grupo == "B":
        lineas += _bloque_grupo_b(row)
    elif grupo == "C":
        lineas += _bloque_grupo_c(row)

    lineas += [
        f"",
        f"━━━ *Comision Proyectada* ━━━",
        f"💵 *{_clp(row['comision'])}*",
        f"",
        f"━━━━━━━━━━━━━━━━━━━━━━",
        f"📋 _{row['alerta_corte']}_",
    ]

    return "\n".join(lineas)


def _bloque_grupo_a(row: dict) -> list[str]:
    g = row.get("cumplimiento_global", 0)
    return [
        f"",
        f"*Esquema:* 3 KPIs ponderados (tope 140%)",
        f"",
        f"━━━ *Metricas* ━━━",
        f"📌 Q Acuerdos: *{row.get('pct_q', 0)}%* (peso 25%)",
        f"💰 Monto Acuerdos: *{row.get('pct_monto', 0)}%* (peso 40%)",
        f"🏦 Mec. Superior: *{row.get('pct_ms', 0)}%* (peso 35%)",
        f"",
        f"📈 Cumplimiento Global: *{g}%* {_barra(g, 10, 140)}",
        f"📊 Tramo: {row.get('tramo', '')}",
    ]


def _bloque_grupo_b(row: dict) -> list[str]:
    g = row.get("cumplimiento_global", 0)
    v1 = row.get("variable1", 0)
    v2 = row.get("variable2", 0)
    v3 = row.get("variable3", 0)
    lineas = [
        f"",
        f"*Esquema:* 2 KPIs + Reajustes (tope 300%)",
        f"",
        f"━━━ *Metricas* ━━━",
        f"💰 Captacion: *{row.get('pct_captacion', 0)}%* (peso 70%)",
        f"🏦 Mec. Superior: *{row.get('pct_ms', 0)}%* (peso 30%)",
        f"",
        f"📈 Cumplimiento Global: *{g}%* {_barra(g, 10, 300)}",
        f"📊 Tramo: {row.get('tramo', '')}",
        f"",
        f"━━━ *Desglose Comision* ━━━",
        f"  V1 (Tabla): {_clp(v1)}",
        f"  V2 (Reajustes): {_clp(v2)}",
        f"  V3 (Donaciones): {_clp(v3)}",
    ]
    return lineas


def _bloque_grupo_c(row: dict) -> list[str]:
    return [
        f"",
        f"*Esquema:* Comision por produccion (sin metas)",
        f"",
        f"━━━ *Produccion del Mes* ━━━",
        f"💰 Venta Total: *{_clp(row.get('venta_total', 0))}*",
        f"",
        f"  General: {_clp(row.get('monto_general', 0))} → {_clp(row.get('com_general', 0))}",
        f"  Preferente: {_clp(row.get('monto_preferente', 0))} → {_clp(row.get('com_preferente', 0))}",
        f"  Gold: {_clp(row.get('monto_gold', 0))} → {_clp(row.get('com_gold', 0))}",
    ]
