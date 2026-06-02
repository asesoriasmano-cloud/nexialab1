/* Nexia Lab — Hero background animations
   Three canvas-based variants: constellation / bars / aurora.
   Cleaned-up on switch so we never run two at once. */

(function () {
  const HERO = document.getElementById('hero');
  if (!HERO) return;

  // Mount a canvas inside hero-bg, behind the grid pattern.
  const heroBg = HERO.querySelector('.hero-bg');
  if (!heroBg) return;

  const canvas = document.createElement('canvas');
  canvas.id = '__hero-anim';
  canvas.style.cssText = `
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    z-index: 0; pointer-events: none;
    opacity: 0.9;
  `;
  heroBg.insertBefore(canvas, heroBg.firstChild);

  const ctx = canvas.getContext('2d', { alpha: true });
  let dpr = 1, w = 0, h = 0;
  let rafId = null;
  let renderFrame = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function getLime() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--lime').trim() || '#CFFF3D';
  }

  // ============================================================
  // VARIANT A — Constellation (nodes + connecting lines)
  // ============================================================
  function buildConstellation() {
    const N = Math.max(40, Math.floor(w * h / 18000));
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.6 + 0.6,
      pulse: Math.random() * Math.PI * 2,
    }));
    const MAX_DIST = Math.min(180, Math.max(120, w * 0.12));

    return function frame(t) {
      ctx.clearRect(0, 0, w, h);
      const lime = getLime();

      // Move
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        n.pulse += 0.02;
        if (n.x < -10) n.x = w + 10; if (n.x > w + 10) n.x = -10;
        if (n.y < -10) n.y = h + 10; if (n.y > h + 10) n.y = -10;
      }

      // Lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < MAX_DIST * MAX_DIST) {
            const alpha = (1 - Math.sqrt(d2) / MAX_DIST) * 0.22;
            ctx.strokeStyle = `${lime}`;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      // Nodes
      for (const n of nodes) {
        const pulse = 0.6 + Math.sin(n.pulse) * 0.4;
        ctx.fillStyle = lime;
        ctx.globalAlpha = 0.4 + pulse * 0.3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
        // glow
        ctx.globalAlpha = 0.06 * pulse;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
  }

  // ============================================================
  // VARIANT B — Audio-style vertical bars
  // ============================================================
  function buildBars() {
    const BAR_W = 6;
    const GAP = 8;
    const cols = Math.ceil(w / (BAR_W + GAP));
    const bars = Array.from({ length: cols }, (_, i) => ({
      phase: i * 0.18 + Math.random() * Math.PI,
      speed: 0.012 + Math.random() * 0.018,
      amp: 0.5 + Math.random() * 0.5,
    }));

    return function frame(t) {
      ctx.clearRect(0, 0, w, h);
      const lime = getLime();
      const cy = h * 0.5;

      for (let i = 0; i < bars.length; i++) {
        const b = bars[i];
        b.phase += b.speed;
        const wave = (Math.sin(b.phase) + Math.sin(b.phase * 1.7 + i * 0.3) * 0.5) * 0.5 + 0.5;
        const hh = wave * b.amp * h * 0.32;
        const x = i * (BAR_W + GAP);
        // distance from horizontal center -> fade outer bars
        const dx = Math.abs(x - w * 0.5) / (w * 0.5);
        const alpha = (1 - dx * 0.5) * 0.25;

        ctx.fillStyle = lime;
        ctx.globalAlpha = alpha;
        // top half
        ctx.fillRect(x, cy - hh, BAR_W, hh);
        // bottom half (mirror, dimmer)
        ctx.globalAlpha = alpha * 0.55;
        ctx.fillRect(x, cy, BAR_W, hh * 0.7);
      }
      ctx.globalAlpha = 1;
    };
  }

  // ============================================================
  // VARIANT C — Aurora drift (soft moving lime blobs)
  // ============================================================
  function buildAurora() {
    const blobs = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.6,
      r: 200 + Math.random() * 200,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.15,
      hueOffset: i * 12,
      phase: Math.random() * Math.PI * 2,
    }));

    return function frame(t) {
      ctx.clearRect(0, 0, w, h);
      const lime = getLime();

      ctx.globalCompositeOperation = 'lighter';
      for (const b of blobs) {
        b.x += b.vx; b.y += b.vy;
        b.phase += 0.005;
        if (b.x < -b.r) b.x = w + b.r; if (b.x > w + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = h + b.r; if (b.y > h + b.r) b.y = -b.r;

        const r = b.r * (0.9 + Math.sin(b.phase) * 0.15);
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
        grad.addColorStop(0, hexToRgba(lime, 0.18));
        grad.addColorStop(0.5, hexToRgba(lime, 0.05));
        grad.addColorStop(1, hexToRgba(lime, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };
  }

  function hexToRgba(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // ============================================================
  // Driver — picks a variant and runs RAF
  // ============================================================
  let current = 'none';
  function setVariant(v) {
    if (v === current) return;
    current = v;
    if (rafId) cancelAnimationFrame(rafId);
    resize();
    if (v === 'none') {
      ctx.clearRect(0, 0, w, h);
      canvas.style.display = 'none';
      return;
    }
    canvas.style.display = '';
    if (v === 'constellation') renderFrame = buildConstellation();
    else if (v === 'bars') renderFrame = buildBars();
    else if (v === 'aurora') renderFrame = buildAurora();
    const tick = (t) => { renderFrame(t); rafId = requestAnimationFrame(tick); };
    rafId = requestAnimationFrame(tick);
  }

  window.__nexiaHeroAnim = { setVariant };

  // Initial: constellation
  resize();
  setVariant('constellation');

  let resizeT;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      resize();
      // rebuild current variant (positions depend on size)
      const v = current; current = 'none'; setVariant(v);
    }, 200);
  });

  // Pause when tab hidden to save CPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId = null; }
    else if (!document.hidden && !rafId && current !== 'none') {
      const tick = (t) => { renderFrame(t); rafId = requestAnimationFrame(tick); };
      rafId = requestAnimationFrame(tick);
    }
  });
})();
