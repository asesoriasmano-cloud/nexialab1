"""
Fase 2 — Envío programático vía WhatsApp Business API (Meta Cloud API).
Requiere configuración de phone_id y token en config.py.
"""
import requests
import logging
from datetime import datetime
from reporte_comercial.config import WHATSAPP

logger = logging.getLogger(__name__)


def enviar_mensaje_texto(telefono: str, mensaje: str) -> dict:
    telefono_limpio = telefono.replace("+", "").replace(" ", "").replace("-", "")
    url = WHATSAPP["api_url"].format(phone_id=WHATSAPP["phone_id"])

    headers = {
        "Authorization": f"Bearer {WHATSAPP['token']}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": telefono_limpio,
        "type": "text",
        "text": {"body": mensaje},
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        result = resp.json()
        logger.info("Mensaje enviado a %s — id: %s", telefono_limpio, result.get("messages", [{}])[0].get("id"))
        return {"status": "ok", "response": result}
    except requests.RequestException as e:
        logger.error("Error enviando a %s: %s", telefono_limpio, e)
        return {"status": "error", "error": str(e)}


def enviar_masivo(registros: list[dict]) -> list[dict]:
    """
    Recibe lista de dicts con 'telefono' y 'mensaje'.
    Retorna la lista con 'envio_status' y 'envio_timestamp'.
    """
    resultados = []
    for r in registros:
        resultado = enviar_mensaje_texto(r["telefono"], r["mensaje"])
        resultados.append({
            **r,
            "envio_status": resultado["status"],
            "envio_timestamp": datetime.now().isoformat(),
            "envio_detalle": resultado.get("error", resultado.get("response", "")),
        })
    return resultados
