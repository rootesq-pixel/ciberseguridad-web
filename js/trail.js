/* Estela "líquida" del cursor (solo ratón, sin reduced-motion). */
export function initTrail() {
  const cv = document.getElementById('trail-canvas'); if (!cv) return;
  const ctx = cv.getContext('2d'); if (!ctx) return;
  const N = 22, pts = Array.from({ length: N }, () => ({ x: -100, y: -100 }));
  let mx = -100, my = -100, idle = 0, dpr = Math.min(devicePixelRatio || 1, 2), W, H;
  const resize = () => { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  resize(); addEventListener('resize', resize);
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; idle = 0; if (pts[0].x < 0) pts.forEach(p => { p.x = mx; p.y = my; }); }, { passive: true });
  (function loop() {
    requestAnimationFrame(loop);
    idle++; if (idle > 90) { ctx.clearRect(0, 0, W, H); return; }
    pts[0].x += (mx - pts[0].x) * .5; pts[0].y += (my - pts[0].y) * .5;
    for (let i = 1; i < N; i++) { pts[i].x += (pts[i - 1].x - pts[i].x) * .42; pts[i].y += (pts[i - 1].y - pts[i].y) * .42; }
    ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const fade = Math.max(0, 1 - idle / 90);
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < N; i++) {
        const t = 1 - i / N, a = pts[i - 1], b = pts[i];
        ctx.strokeStyle = pass ? `rgba(180,245,255,${.5 * t * fade})` : `rgba(0,140,255,${.16 * t * fade})`;
        ctx.lineWidth = (pass ? 3 : 16) * t + 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  })();
}
