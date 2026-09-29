"""
Constructor de mensajes dinámicos para cada vendedor.
"""
from datetime import date
from typing import Optional


def barra_progreso(pct: float, largo: int = 10) -> str:
    llenos = min(int(pct / 100 * largo), largo)
    vacios = largo - llenos
    return "█" * llenos + "░" * vacios


def formato_clp(monto: float) -> str:
    return f"${monto:,.0f}".replace(",", ".")


def construir_mensaje(
    nombre: str,
    equipo: str,
    tipo_contrato: str,
    tramo_antiguedad: str,
    estado_meta: str,
    meta_efectiva: float,
    venta_acumulada: float,
    mandatos_aprobados: float,
    pct_avance: float,
    comision_proyectada: float,
    fecha_corte_ventas: date,
    fecha_corte_mecanismo: Optional[date],
    alerta_firma: str,
    alerta_corte: str,
) -> str:
    fecha_str = fecha_corte_ventas.strftime("%d/%m/%Y")
    barra = barra_progreso(pct_avance)

    lineas = [
        f"📊 *Reporte Diario de Ventas*",
        f"━━━━━━━━━━━━━━━━━━━━━━",
        f"",
        f"👤 *{nombre}*",
        f"📅 Corte: {fecha_str} | Equipo: {equipo}",
    ]

    if alerta_firma:
        lineas.append(f"⚠️ _{alerta_firma}_")

    estado_label = "✅ Meta vigente" if estado_meta == "Firmada" else "🔶 Meta provisoria"
    lineas += [
        f"",
        f"*Estado:* {estado_label}",
        f"*Contrato:* {tipo_contrato} | *Tramo:* {tramo_antiguedad}",
        f"",
        f"━━━ *Metricas* ━━━",
        f"🎯 Meta asignada: {formato_clp(meta_efectiva)}",
        f"💰 Venta acumulada: {formato_clp(venta_acumulada)}",
        f"📈 Avance: *{pct_avance}%* {barra}",
    ]

    if mandatos_aprobados > 0:
        lineas.append(
            f"✔️ Mandatos aprobados: {formato_clp(mandatos_aprobados)}"
        )

    lineas += [
        f"",
        f"━━━ *Comision Proyectada* ━━━",
        f"💵 {formato_clp(comision_proyectada)}",
        f"",
        f"━━━━━━━━━━━━━━━━━━━━━━",
        f"📋 _{alerta_corte}_",
    ]

    return "\n".join(lineas)
