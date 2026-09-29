"""
Fase 1 — Generación de enlaces wa.me para disparo manual/masivo simple.
No requiere API ni costos adicionales.
"""
from urllib.parse import quote


def generar_link_whatsapp(telefono: str, mensaje: str) -> str:
    telefono_limpio = telefono.replace("+", "").replace(" ", "").replace("-", "")
    return f"https://wa.me/{telefono_limpio}?text={quote(mensaje)}"


def generar_links_masivos(registros: list[dict]) -> list[dict]:
    """
    Recibe lista de dicts con 'telefono', 'nombre' y 'mensaje'.
    Retorna la misma lista enriquecida con 'link_whatsapp'.
    """
    for r in registros:
        r["link_whatsapp"] = generar_link_whatsapp(r["telefono"], r["mensaje"])
    return registros
