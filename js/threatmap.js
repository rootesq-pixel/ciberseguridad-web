/* Mapa de amenazas 2D — SIMULACIÓN DEMOSTRATIVA (datos aleatorios) */
import { inLand, CITIES } from './geo.js';
const cv = document.getElementById('threat-map');
const ctx = cv.getContext('2d');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let W, H, dpr, dots = [];
const HOME = CITIES.madrid;
const SRC = Object.entries(CITIES).filter(([k]) => k !== 'madrid');
const proj = ([lon, lat]) => [((lon + 180) / 360) * W, ((80 - lat) / 140) * H];

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
  cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  dots = []; const step = Math.max(7, W / 110);
  for (let x = step / 2; x < W; x += step) for (let y = step / 2; y < H; y += step) {
    const lon = (x / W) * 360 - 180, lat = 80 - (y / H) * 140;
    if (inLand(lon, lat)) dots.push([x, y, Math.random()]);
  }
}
let attacks = [], ripples = [];
function spawn() {
  const [name, c] = SRC[(Math.random() * SRC.length) | 0];
  const a = proj(c), b = proj(HOME);
  const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - Math.hypot(b[0] - a[0], b[1] - a[1]) * .35;
  attacks.push({ a, b, c: [mx, my], t: 0, sp: .006 + Math.random() * .008, name });
}
const bez = (p, t) => [(1 - t) ** 2 * p.a[0] + 2 * (1 - t) * t * p.c[0] + t * t * p.b[0], (1 - t) ** 2 * p.a[1] + 2 * (1 - t) * t * p.c[1] + t * t * p.b[1]];

let visible = true, last = 0, tAcc = 0;
new IntersectionObserver(e => visible = e[0].isIntersecting).observe(cv);
function frame(now) {
  requestAnimationFrame(frame);
  if (!visible && !reduce) return;
  const dt = Math.min(50, now - last); last = now; tAcc += dt;
  ctx.clearRect(0, 0, W, H);
  // land dots
  for (const [x, y, s] of dots) {
    const tw = .25 + .2 * Math.sin(now * .001 + s * 20);
    ctx.fillStyle = `rgba(0,163,255,${tw})`; ctx.fillRect(x - 1, y - 1, 2, 2);
  }
  // sources
  for (const [, c] of SRC) { const [x, y] = proj(c); ctx.fillStyle = 'rgba(255,59,92,.8)'; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, 7); ctx.fill(); }
  // home node + shield
  const [hx, hy] = proj(HOME), pr = 14 + Math.sin(now * .004) * 3;
  ctx.strokeStyle = 'rgba(62,230,255,.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx, hy, pr, 0, 7); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.shadowColor = '#3ee6ff'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(hx, hy, 4, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  ctx.font = '600 10px JetBrains Mono, monospace'; ctx.fillStyle = '#3ee6ff'; ctx.fillText('TU EMPRESA', hx + 20, hy + 4);
  // attacks
  if (!reduce && tAcc > 380) { tAcc = 0; spawn(); }
  if (reduce && attacks.length < 6) for (let i = 0; i < 6; i++) { spawn(); attacks[i].t = .9; }
  for (const p of attacks) {
    if (!reduce) p.t += p.sp * dt / 16;
    const end = Math.min(p.t, 1), startT = Math.max(0, end - .35);
    const g = ctx.createLinearGradient(p.a[0], p.a[1], p.b[0], p.b[1]);
    g.addColorStop(0, 'rgba(255,59,92,0)'); g.addColorStop(1, 'rgba(255,59,92,.9)');
    ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let t = startT; t <= end; t += .02) { const [x, y] = bez(p, t); t === startT ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    const [x, y] = bez(p, end);
    ctx.fillStyle = '#ff3b5c'; ctx.shadowColor = '#ff3b5c'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    if (p.t >= 1 && !p.done) { p.done = true; ripples.push({ r: pr, a: 1 }); }
  }
  attacks = attacks.filter(p => p.t < 1.15);
  for (const r of ripples) { r.r += 1.4 * dt / 16; r.a -= .02 * dt / 16; ctx.strokeStyle = `rgba(0,163,255,${Math.max(0, r.a)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hx, hy, r.r, 0, 7); ctx.stroke(); }
  ripples = ripples.filter(r => r.a > 0);
}
resize(); addEventListener('resize', resize); requestAnimationFrame(frame);
