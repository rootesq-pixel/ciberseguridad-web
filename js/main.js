(() => {
'use strict';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasGSAP = typeof window.gsap !== 'undefined';
document.documentElement.classList.add('js');
const $ = (s, c=document) => c.querySelector(s), $$ = (s, c=document) => [...c.querySelectorAll(s)];
$('#year').textContent = new Date().getFullYear();

/* ---------- Text scramble ---------- */
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFX$%&';
function scramble(el, dur = 1200, delay = 0) {
  const final = el.dataset.text || el.textContent;
  if (reduce) { el.textContent = final; return Promise.resolve(); }
  return new Promise(res => {
    const start = performance.now() + delay;
    const tick = now => {
      const p = Math.max(0, Math.min(1, (now - start) / dur));
      let out = '';
      for (let i = 0; i < final.length; i++) {
        const reveal = i / final.length < p * 1.15 - 0.1;
        out += final[i] === ' ' ? ' ' : reveal ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      p < 1 ? requestAnimationFrame(tick) : (el.textContent = final, res());
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- Split words for headings ---------- */
$$('.split').forEach(h => {
  h.innerHTML = h.textContent.trim().split(/\s+/).map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
});

/* ---------- Preloader ---------- */
const pre = $('.preloader'), pct = $('.preloader__pct'), bar = $('.preloader__bar span');
let loadP = 0;
const preTimer = setInterval(() => {
  loadP = Math.min(100, loadP + Math.random() * 18 + 6);
  pct.textContent = Math.floor(loadP); bar.style.width = loadP + '%';
  if (loadP >= 100) { clearInterval(preTimer); setTimeout(intro, 200); }
}, reduce ? 10 : 90);

function intro() {
  if (hasGSAP && !reduce) {
    gsap.to(pre, { yPercent: -100, duration: .9, ease: 'expo.inOut', onComplete: () => pre.remove() });
    gsap.from('.hero__title .line > span', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .12, delay: .5 });
    gsap.to('.hero .reveal-up', { opacity: 1, y: 0, duration: 1, stagger: .12, delay: 1, ease: 'power3.out' });
    gsap.from('.hero__term', { opacity: 0, x: 60, duration: 1.2, delay: 1.3, ease: 'power3.out' });
    gsap.from('.hero__hud > div', { opacity: 0, y: 20, stagger: .1, delay: 1.5 });
  } else { pre.remove(); $$('.hero .reveal-up').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; }); }
  $$('.hero .scramble').forEach((el, i) => scramble(el, 1300, 600 + i * 260));
  window.dispatchEvent(new Event('site:ready'));
}

/* ---------- Smooth scroll (Lenis) ---------- */
let lenis = null;
if (!reduce && typeof window.Lenis !== 'undefined') {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  if (hasGSAP) {
    lenis.on('scroll', () => window.ScrollTrigger && ScrollTrigger.update());
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
  } else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
}
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href'); if (id.length < 2) return;
  const t = $(id); if (!t) return; e.preventDefault(); closeMenu();
  lenis ? lenis.scrollTo(t, { offset: -20 }) : t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}));

/* ---------- Nav: hide on scroll down, progress bar ---------- */
const nav = $('#nav'), prog = $('.scroll-progress'); let lastY = 0;
const onScroll = () => {
  const y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  nav.classList.toggle('hide', y > lastY && y > 300); lastY = y;
};
addEventListener('scroll', onScroll, { passive: true });

/* ---------- Mobile menu ---------- */
const burger = $('.nav__burger'), menu = $('.mobile-menu');
function closeMenu() { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); }
burger.addEventListener('click', () => {
  const open = !menu.classList.contains('open');
  menu.classList.toggle('open', open); burger.setAttribute('aria-expanded', open); menu.setAttribute('aria-hidden', !open);
});

/* ---------- Custom cursor ---------- */
if (fine && !reduce) {
  document.body.classList.add('has-cursor');
  const c = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`; });
  (function loop() { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`; requestAnimationFrame(loop); })();
  $$('a,button,.card,.badge,input,select,textarea').forEach(el => {
    el.addEventListener('mouseenter', () => c.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => c.classList.remove('is-hover'));
  });
} else { $('.cursor').remove(); }

/* ---------- Magnetic buttons ---------- */
if (fine && !reduce) $$('.magnetic').forEach(b => {
  b.addEventListener('mousemove', e => {
    const r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
    b.style.transform = `translate(${x * .3}px,${y * .4}px)`;
  });
  b.addEventListener('mouseleave', () => { b.style.transition = 'transform .5s cubic-bezier(.2,1.6,.4,1)'; b.style.transform = ''; setTimeout(() => b.style.transition = '', 500); });
});

/* ---------- Tilt + spotlight glow ---------- */
if (fine && !reduce) $$('.tilt').forEach(c => {
  c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.style.setProperty('--x', px * 100 + '%'); c.style.setProperty('--y', py * 100 + '%');
    c.style.setProperty('--ry', (px - .5) * 10 + 'deg'); c.style.setProperty('--rx', (.5 - py) * 10 + 'deg');
  });
  c.addEventListener('mouseleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
});

/* ---------- Footer scramble on hover ---------- */
$$('.scramble-hover').forEach(el => el.parentElement.addEventListener('mouseenter', () => scramble(el, 700)));

/* ---------- Counters ---------- */
const fmt = (v, dec) => v.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
function runCounter(el) {
  const to = +el.dataset.to, dec = +(el.dataset.dec || 0), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
  if (reduce) { el.textContent = pre + fmt(to, dec) + suf; return; }
  const t0 = performance.now(), d = 2200;
  const step = n => { const p = Math.min(1, (n - t0) / d), e = 1 - Math.pow(1 - p, 4); el.textContent = pre + fmt(to * e, dec) + suf; if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { runCounter(e.target); io.unobserve(e.target); } }), { threshold: .5 });
$$('.counter').forEach(c => io.observe(c));

/* ---------- Hero terminal + HUD (DEMO) ---------- */
const term = $('#hero-term');
const LINES = [
  ['dim','[init] cargando firmas de amenazas… OK'],['ok','[edr] 1.248 endpoints protegidos'],['warn','[ids] escaneo de puertos desde 185.220.x.x'],
  ['ok','[fw] IP bloqueada · regla auto-generada'],['bad','[soc] intento de fuerza bruta RDP · 412 intentos'],['ok','[soar] cuenta aislada en 0,8 s'],
  ['warn','[mail] phishing “Factura pendiente” detectado'],['ok','[mail] 37 correos puestos en cuarentena'],['dim','[intel] IoC actualizados (MITRE T1566)'],
  ['bad','[edr] proceso sospechoso: powershell -enc …'],['ok','[edr] proceso terminado · host limpio'],['ok','[waf] SQLi bloqueada en /api/login'],
];
let li = 0, blocked = 1840;
function pushTerm() {
  const [cls, txt] = LINES[li++ % LINES.length];
  const d = document.createElement('div'); d.className = cls;
  d.textContent = `${new Date().toLocaleTimeString('es-ES')} ${txt}`;
  term.appendChild(d); while (term.children.length > 11) term.firstChild.remove();
  if (cls === 'ok') { blocked += (Math.random() * 5 | 0) + 1; $('#hud-blocked').textContent = blocked.toLocaleString('es-ES'); }
}
for (let i = 0; i < 8; i++) pushTerm();
if (!reduce) setInterval(pushTerm, 1300);

/* ---------- SOC feed (DEMO) ---------- */
const feed = $('#feed');
const EVENTS = [
  ['crit','Ransomware LockBit — firma detectada en srv-files-02'],['ok','Contención automática: host aislado de la red'],
  ['warn','Login anómalo desde ubicación inusual (Lagos)'],['ok','MFA exigido · acceso denegado'],['warn','Exfiltración DNS sospechosa · 2,3 MB'],
  ['ok','Dominio sinkhole aplicado'],['crit','Explotación CVE en VPN perimetral'],['ok','Parche virtual desplegado en WAF'],
  ['warn','Credenciales filtradas en dark web (2)'],['ok','Contraseñas rotadas · usuarios notificados'],['crit','DDoS 38 Gbps contra web corporativa'],['ok','Tráfico mitigado en el edge'],
];
const LV = { crit: 'CRÍTICO', warn: 'AVISO', ok: 'RESUELTO' };
let ei = 0;
function pushFeed() {
  const [lv, txt] = EVENTS[ei++ % EVENTS.length];
  const li = document.createElement('li');
  li.innerHTML = `<time>${new Date().toLocaleTimeString('es-ES')}</time><b class="lv-${lv}">${LV[lv]}</b><span></span>`;
  li.lastChild.textContent = txt; feed.prepend(li); while (feed.children.length > 9) feed.lastChild.remove();
}
for (let i = 0; i < 7; i++) pushFeed();
if (!reduce) setInterval(pushFeed, 2200);

/* ---------- Form (front-end only) ---------- */
const form = $('#contact-form'), msg = $('.form__msg');
form.addEventListener('submit', e => {
  e.preventDefault(); msg.classList.remove('err'); let ok = true;
  $$('[required]', form).forEach(f => {
    const bad = f.type === 'checkbox' ? !f.checked : !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
    f.closest('.field')?.classList.toggle('invalid', bad); if (bad) ok = false;
  });
  if (!ok) { msg.classList.add('err'); msg.textContent = '✖ Revisa los campos marcados y acepta la política de privacidad.'; return; }
  const btn = form.querySelector('button span'); btn.textContent = 'Cifrando…';
  setTimeout(() => { btn.textContent = 'Enviado ✓'; msg.textContent = '✔ Mensaje recibido (demo, sin envío real). Te contactaremos en menos de 24 h.'; form.reset(); }, 1200);
});

/* ---------- GSAP scroll animations ---------- */
function scrollAnims() {
  if (!hasGSAP || reduce || !window.ScrollTrigger) { $$('.reveal-up').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; }); return; }
  gsap.registerPlugin(ScrollTrigger);
  $$('.split').forEach(h => gsap.from(h.querySelectorAll('.w > span'), { yPercent: 110, duration: 1, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: h, start: 'top 85%' } }));
  $$('.reveal-up').forEach(e => { if (e.closest('.hero')) return; gsap.to(e, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: e, start: 'top 88%' } }); });
  gsap.from('.bento .card', { opacity: 0, y: 80, scale: .94, duration: 1, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: '.bento', start: 'top 80%' } });
  gsap.from('.compliance .badge', { opacity: 0, scale: .6, rotate: -20, duration: 1, ease: 'back.out(1.6)', stagger: .1, scrollTrigger: { trigger: '.compliance', start: 'top 80%' } });
  gsap.from('.stats__grid .stat', { opacity: 0, y: 40, stagger: .1, scrollTrigger: { trigger: '.stats__grid', start: 'top 85%' } });
  gsap.from('.soc__grid > *', { opacity: 0, y: 60, stagger: .15, duration: 1, scrollTrigger: { trigger: '.soc__grid', start: 'top 80%' } });
  // hero parallax out
  gsap.to('.hero__content', { yPercent: 30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.footer__big', { yPercent: -20, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  // pinned horizontal process
  const track = $('.process__track');
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: '.process', start: 'top top', end: () => '+=' + (dist() + innerHeight * .3), pin: '.process__pin', scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
  gsap.to('.process__bar span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '.process', start: 'top top', end: () => '+=' + (dist() + innerHeight * .3), scrub: true } });
  $$('.step').forEach((s, i) => gsap.from(s, { opacity: .25, scale: .92, duration: .6, scrollTrigger: { trigger: '.process', start: () => `top+=${i * 200} top`, toggleActions: 'play none none reverse' } }));
  addEventListener('load', () => ScrollTrigger.refresh());
}
scrollAnims();
})();
