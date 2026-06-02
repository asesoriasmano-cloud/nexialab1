/* ============================================================
   Nexia Lab — Widget de chat IA flotante (Netlify) + WhatsApp
   Inyecta el botón "Habla con Nexi" (abre el agente IA alojado
   en chatnexialabpro.netlify.app dentro de un modal) y un botón
   flotante de WhatsApp. Funciona en cualquier página: basta con
   incluir <script src="assets/nexia-chat.js"></script>.
   ============================================================ */
(function () {
  if (window.__nexiaChatLoaded) return;
  window.__nexiaChatLoaded = true;

  var CHAT_URL = "https://chatnexialabpro.netlify.app";
  var WA_URL = "https://wa.me/56965088060";

  // ---- Estilos (auto-contenidos, colores del sitio oscuro) ----
  var css = `
  .nx-chat-btn{position:fixed;bottom:96px;right:24px;z-index:500;display:flex;align-items:center;cursor:pointer}
  .nx-chat-circle{width:56px;height:56px;background:#0E1812;border:2px solid #CFFF3D;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(207,255,61,.25);transition:transform .25s,box-shadow .2s;flex-shrink:0;position:relative}
  .nx-chat-btn:hover .nx-chat-circle{transform:scale(1.08);box-shadow:0 6px 28px rgba(207,255,61,.4)}
  .nx-chat-circle svg{width:26px;height:26px;fill:#CFFF3D}
  .nx-chat-label{background:#0E1812;border:1px solid rgba(207,255,61,.25);color:rgba(255,255,255,.88);font-size:12px;font-weight:600;padding:8px 14px 8px 18px;border-radius:24px 0 0 24px;margin-right:-10px;white-space:nowrap;opacity:0;transform:translateX(10px);transition:opacity .25s,transform .25s;pointer-events:none;font-family:system-ui,-apple-system,sans-serif}
  .nx-chat-btn:hover .nx-chat-label{opacity:1;transform:translateX(0)}
  .nx-chat-dot{position:absolute;top:2px;right:2px;width:12px;height:12px;border-radius:50%;background:#CFFF3D;border:2px solid #0E1812;animation:nxPulse 2.5s ease-out infinite}
  .nx-overlay{position:fixed;inset:0;z-index:600;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}
  .nx-overlay.open{opacity:1;visibility:visible}
  .nx-modal{position:fixed;bottom:96px;right:24px;z-index:601;width:400px;height:600px;max-width:calc(100vw - 40px);max-height:calc(100vh - 140px);border-radius:16px;overflow:hidden;border:1px solid rgba(207,255,61,.2);box-shadow:0 24px 80px rgba(0,0,0,.5);transform:scale(.92) translateY(20px);opacity:0;visibility:hidden;transition:transform .35s,opacity .3s,visibility .3s;background:#0E1812}
  .nx-modal.open{transform:scale(1) translateY(0);opacity:1;visibility:visible}
  .nx-modal iframe{width:100%;height:100%;border:none;display:block}
  .nx-modal-close{position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.7);font-size:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2;transition:background .2s}
  .nx-modal-close:hover{background:rgba(0,0,0,.8);color:#fff}
  .nx-wa{position:fixed;bottom:24px;right:24px;z-index:500;display:flex;align-items:center;cursor:pointer;text-decoration:none}
  .nx-wa-btn{width:56px;height:56px;background:#25d366;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,.45);transition:transform .25s,background .2s;flex-shrink:0;position:relative}
  .nx-wa:hover .nx-wa-btn{background:#1db954;transform:scale(1.08)}
  .nx-wa-btn svg{width:28px;height:28px;fill:#fff}
  .nx-wa-label{background:#0E1812;color:#fff;font-size:12px;font-weight:600;padding:8px 14px 8px 18px;border-radius:24px 0 0 24px;margin-right:-10px;white-space:nowrap;opacity:0;transform:translateX(10px);transition:opacity .25s,transform .25s;pointer-events:none;font-family:system-ui,-apple-system,sans-serif}
  .nx-wa:hover .nx-wa-label{opacity:1;transform:translateX(0)}
  .nx-wa-btn::after{content:'';position:absolute;width:56px;height:56px;border-radius:50%;border:2px solid rgba(37,211,102,.5);animation:nxPulse 2.2s ease-out infinite}
  @keyframes nxPulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.7);opacity:0}}
  @media(max-width:640px){.nx-chat-btn,.nx-modal{right:16px}.nx-wa{right:16px}}
  `;
  var style = document.createElement("style");
  style.id = "nx-chat-styles";
  style.textContent = css;
  document.head.appendChild(style);

  // ---- Marcado ----
  var wrap = document.createElement("div");
  wrap.innerHTML = `
  <div class="nx-chat-btn" id="nxChatBtn" role="button" aria-label="Hablar con Nexia IA">
    <span class="nx-chat-label">Habla con Nexia IA</span>
    <div class="nx-chat-circle">
      <div class="nx-chat-dot"></div>
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
    </div>
  </div>
  <div class="nx-overlay" id="nxOverlay"></div>
  <div class="nx-modal" id="nxModal">
    <button class="nx-modal-close" id="nxClose" aria-label="Cerrar">✕</button>
    <iframe id="nxIframe" src="" data-src="${CHAT_URL}" title="Nexia IA" allow="clipboard-write" loading="lazy"></iframe>
  </div>
  <a href="${WA_URL}" target="_blank" rel="noopener" class="nx-wa" aria-label="WhatsApp">
    <span class="nx-wa-label">¿Hablamos?</span>
    <div class="nx-wa-btn">
      <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    </div>
  </a>`;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

  // ---- Comportamiento ----
  var open = false;
  var modal = document.getElementById("nxModal");
  var overlay = document.getElementById("nxOverlay");
  var iframe = document.getElementById("nxIframe");

  function openChat() {
    open = true;
    if (!iframe.src || iframe.src === window.location.href) iframe.src = iframe.dataset.src;
    modal.classList.add("open");
    overlay.classList.add("open");
  }
  function closeChat() {
    open = false;
    modal.classList.remove("open");
    overlay.classList.remove("open");
  }
  document.getElementById("nxChatBtn").addEventListener("click", function () {
    open ? closeChat() : openChat();
  });
  document.getElementById("nxClose").addEventListener("click", closeChat);
  overlay.addEventListener("click", closeChat);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && open) closeChat();
  });
})();
