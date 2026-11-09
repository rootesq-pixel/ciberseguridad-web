import { PRODUCTS, COURSES, BUNDLES } from './data.js';
import { productArt, courseArt } from './art.js';
import { initFx } from './fx.js';
import { initBg } from './bg.js';
import { initTrail } from './trail.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const G = window.gsap, hasG = !!G;
const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
document.documentElement.classList.add('js');
$('#year').textContent = new Date().getFullYear();
const eur = n => n.toLocaleString('es-ES', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stars = r => '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r));
const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
PRODUCTS.forEach(p => p.img = productArt(p));
COURSES.forEach(c => { c.img = courseArt(c); c.cat = 'curso'; });
const ALL = {}; [...PRODUCTS, ...COURSES].forEach(i => ALL[i.id] = i);
BUNDLES.forEach(b => { b.img = ALL[b.items[0]].img; b.cat = 'pack'; ALL[b.id] = b; });
const CAT_LABEL = { hardware: 'Hardware', software: 'Software', kits: 'Kit', curso: 'Curso', pack: 'Pack oferta' };

/* ---------------- Scramble ---------------- */
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFX$%&';
function scramble(el, dur = 1200, delay = 0) {
  const final = el.dataset.text || el.textContent;
  if (reduce) { el.textContent = final; return; }
  const start = performance.now() + delay;
  const tick = now => {
    const p = Math.max(0, Math.min(1, (now - start) / dur)); let out = '';
    for (let i = 0; i < final.length; i++) out += final[i] === ' ' ? ' ' : (i / final.length < p * 1.15 - .1) ? final[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
    el.textContent = out; p < 1 ? requestAnimationFrame(tick) : el.textContent = final;
  };
  requestAnimationFrame(tick);
}
$$('.split').forEach(h => {
  h.setAttribute('aria-label', h.textContent.trim());
  h.innerHTML = h.textContent.trim().split(/\s+/).map(w => `<span class="w" aria-hidden="true">${[...w].map(c => `<span class="c" data-c="${c}">${c}</span>`).join('')}</span>`).join(' ');
});
function decodeChars(h, dur = 900) {
  const cs = $$('.c', h); if (reduce) return;
  const t0 = performance.now();
  const tick = now => {
    const p = (now - t0) / dur; let done = true;
    cs.forEach((c, i) => { const at = i / cs.length * .8; if (p < at + .2) { done = false; c.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0]; } else c.textContent = c.dataset.c; });
    if (!done) requestAnimationFrame(tick); else cs.forEach(c => c.textContent = c.dataset.c);
  };
  requestAnimationFrame(tick);
}

/* ---------------- Lenis ---------------- */
let lenis = null;
if (!reduce && window.Lenis) {
  lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  if (hasG) { lenis.on('scroll', () => window.ScrollTrigger && ScrollTrigger.update()); G.ticker.add(t => lenis.raf(t * 1000)); G.ticker.lagSmoothing(0); }
  else { const r = t => { lenis.raf(t); requestAnimationFrame(r); }; requestAnimationFrame(r); }
}
const scrollToEl = t => lenis ? lenis.scrollTo(t, { offset: -90 }) : t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
const lock = on => { document.body.classList.toggle('locked', on); lenis && (on ? lenis.stop() : lenis.start()); };

/* ---------------- Intro "hacker" (una vez por sesión, saltable) + preloader ---------------- */
const pre = $('.preloader');
let seen = false; try { seen = sessionStorage.getItem('ciphera_intro') === '1'; } catch {}
const fullIntro = !seen && !reduce && hasG;
let introDone = false;
const INTRO = [['dim', '> ciphera://boot --secure --region=eu'], ['ok', '[ OK ] Cargando módulos criptográficos AES-256'], ['ok', '[ OK ] Handshake TLS 1.3 verificado'], ['warn', '[WARN] 3 intentos de intrusión detectados'], ['ok', '[ OK ] Amenazas neutralizadas en 0,04 s'], ['ok', '[ OK ] Catálogo descifrado: 9 productos · 6 cursos'], ['hi', '> ejecutando ciphera_store.exe']];
function finishIntro() {
  if (introDone) return; introDone = true;
  try { sessionStorage.setItem('ciphera_intro', '1'); } catch {}
  removeEventListener('keydown', skipKey);
  if (hasG && !reduce) {
    G.timeline({ onComplete: () => pre.remove() })
      .to('.intro__granted', { autoAlpha: 1, scale: 1, duration: .25, ease: 'expo.out' })
      .to(pre, { clipPath: 'polygon(0 0,100% 0,100% 0,0 0)', duration: .9, ease: 'expo.inOut' }, '+=.25');
    G.from('.hero__title .line > span', { yPercent: 110, rotateX: -60, duration: 1.2, ease: 'expo.out', stagger: .12, delay: .75 });
    G.from('.chapter--0 .eyebrow, .chapter--0 .hero__lead, .chapter--0 .hero__ctas, .hero__hud', { opacity: 0, y: 30, duration: 1, stagger: .1, delay: 1.1 });
    G.from('.nav', { opacity: 0, duration: 1, delay: .9 });
    setTimeout(() => $$('.hero .scramble').forEach((el, i) => scramble(el, 1300, i * 250)), 700);
  } else { pre.remove(); $$('.hero .scramble').forEach(el => scramble(el)); }
  window.dispatchEvent(new Event('site:ready'));
}
const skipKey = e => { if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') finishIntro(); };
$('.intro__skip').addEventListener('click', finishIntro);
if (fullIntro) {
  pre.classList.add('is-intro'); addEventListener('keydown', skipKey); pre.addEventListener('click', finishIntro);
  const box = $('#intro-lines'); let i = 0;
  const typeLine = () => {
    if (introDone) return;
    if (i >= INTRO.length) { setTimeout(finishIntro, 350); return; }
    const [cls, txt] = INTRO[i++], d = document.createElement('div'); d.className = cls; box.appendChild(d);
    let k = 0; const ty = () => { if (introDone) return; k += 3; d.textContent = txt.slice(0, k) + (k < txt.length ? '█' : ''); if (k < txt.length) setTimeout(ty, 12); else setTimeout(typeLine, 120); };
    ty();
  };
  setTimeout(typeLine, 250);
  setTimeout(finishIntro, 9000);
} else {
  $('.intro__skip').remove();
  let lp = 0;
  const pt = setInterval(() => {
    lp = Math.min(100, lp + Math.random() * 25 + 15); $('.preloader__pct').textContent = lp | 0; $('.preloader__bar span').style.width = lp + '%';
    if (lp >= 100) { clearInterval(pt); setTimeout(finishIntro, 100); }
  }, reduce ? 5 : 60);
}

/* ---------------- Nav / progress / menu ---------------- */
const nav = $('#nav'), prog = $('.scroll-progress'); let lastY = 0;
addEventListener('scroll', () => {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  nav.classList.toggle('scrolled', y > 30); lastY = y;
}, { passive: true });
const burger = $('.nav__burger'), menu = $('.mobile-menu');
const closeMenu = () => { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); };
burger.addEventListener('click', () => { const o = !menu.classList.contains('open'); menu.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); menu.setAttribute('aria-hidden', !o); });
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]'); if (!a) return;
  const id = a.getAttribute('href'); if (id.length < 2 || id.startsWith('#/')) return;
  const t = $(id); if (!t) return; e.preventDefault(); closeMenu();
  if (a.dataset.filterLink) setFilter(a.dataset.filterLink);
  if (view.classList.contains('on')) { location.hash = ''; setTimeout(() => scrollToEl(t), 900); } else scrollToEl(t);
});

/* ---------------- Cursor / magnetic / tilt ---------------- */
const cursor = $('.cursor');
if (fine && !reduce) {
  document.body.classList.add('has-cursor');
  const dot = $('.cursor__dot'), ring = $('.cursor__ring'), lab = $('.cursor__label');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; });
  (function loop() { rx += (mx - rx) * .2; ry += (my - ry) * .2; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('a,button,[data-cursor],input,select,summary,.pcard__media,.ccard__media');
    cursor.classList.toggle('is-hover', !!t);
    const l = t && t.closest('[data-cursor]')?.dataset.cursor; cursor.classList.toggle('has-label', !!l); if (l) lab.textContent = l;
  });
} else cursor.remove();
function bindInteractive(root = document) {
  if (!fine || reduce) return;
  $$('.magnetic', root).forEach(b => {
    if (b._mag) return; b._mag = 1;
    b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .3}px,${(e.clientY - r.top - r.height / 2) * .4}px)`; });
    b.addEventListener('mouseleave', () => { b.style.transition = 'transform .5s cubic-bezier(.2,1.6,.4,1)'; b.style.transform = ''; setTimeout(() => b.style.transition = '', 500); });
  });
  $$('.tilt', root).forEach(c => {
    if (c._tilt) return; c._tilt = 1;
    c.addEventListener('mousemove', e => { const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.setProperty('--x', px * 100 + '%'); c.style.setProperty('--y', py * 100 + '%'); c.style.setProperty('--ry', (px - .5) * 9 + 'deg'); c.style.setProperty('--rx', (.5 - py) * 9 + 'deg'); c.style.setProperty('--px', (px - .5) * 2); c.style.setProperty('--py', (py - .5) * 2); });
    c.addEventListener('mouseleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); c.style.setProperty('--px', 0); c.style.setProperty('--py', 0); });
  });
}
$$('.scramble-hover').forEach(el => el.parentElement.addEventListener('mouseenter', () => scramble(el, 700)));

/* ---------------- Toasts / fly to cart ---------------- */
function toast(html) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; $('#toasts').appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 2400);
}
function burst(x, y) {
  for (let i = 0; i < 18; i++) {
    const d = document.createElement('i'); d.className = 'spark'; document.body.appendChild(d);
    const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 50;
    G.set(d, { x, y, scale: Math.random() * .8 + .4, background: i % 3 ? '#3ee6ff' : (i % 2 ? '#29f0a6' : '#2f6bff') });
    G.to(d, { x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, opacity: 0, scale: 0, duration: .6 + Math.random() * .4, ease: 'expo.out', onComplete: () => d.remove() });
  }
  const ring = document.createElement('i'); ring.className = 'spark-ring'; document.body.appendChild(ring);
  G.fromTo(ring, { x, y, scale: .2, opacity: 1 }, { scale: 2.6, opacity: 0, duration: .6, ease: 'expo.out', onComplete: () => ring.remove() });
}
function fly(from, img) {
  if (reduce || !from || !hasG) return;
  const a = from.getBoundingClientRect(), cartBtn = $('#btn-cart'), b = cartBtn.getBoundingClientRect();
  const d = document.createElement('div'); d.className = 'fly'; if (img) d.style.backgroundImage = `url("${img}")`; document.body.appendChild(d);
  const sx = a.left + a.width / 2 - 28, sy = a.top + a.height / 2 - 28, ex = b.left + b.width / 2 - 28, ey = b.top + b.height / 2 - 28;
  const peak = Math.min(sy, ey) - 140, o = { t: 0 };
  G.set(d, { x: sx, y: sy, scale: .3, rotate: 0 });
  G.to(d, { scale: 1, duration: .25, ease: 'back.out(3)' });
  G.to(o, { t: 1, duration: .85, ease: 'power2.in', onUpdate: () => { const t = o.t, mx = (sx + ex) / 2;
      G.set(d, { x: (1 - t) ** 2 * sx + 2 * (1 - t) * t * mx + t * t * ex, y: (1 - t) ** 2 * sy + 2 * (1 - t) * t * peak + t * t * ey, rotate: t * 360, scale: 1 - t * .7 }); },
    onComplete: () => { d.remove(); burst(b.left + b.width / 2, b.top + b.height / 2);
      G.timeline().to(cartBtn, { scaleX: 1.35, scaleY: .7, duration: .1 }).to(cartBtn, { scaleX: .85, scaleY: 1.25, duration: .12 }).to(cartBtn, { scale: 1, duration: .6, ease: 'elastic.out(1.2,.35)' }); } });
}

/* ---------------- Wishlist ---------------- */
let wish = new Set(store.get('ciphera_wish', []));
const wishSvg = '<svg viewBox="0 0 24 24"><path d="M12 21s-8-5.5-8-11a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 5.5-8 11-8 11z"/></svg>';
function toggleWish(id, btn) {
  wish.has(id) ? wish.delete(id) : wish.add(id); store.set('ciphera_wish', [...wish]);
  $$(`.wish[data-wish="${id}"]`).forEach(b => { b.classList.toggle('on', wish.has(id)); b.setAttribute('aria-pressed', wish.has(id)); });
  $$(`.btn[data-wish="${id}"] span`).forEach(s => s.textContent = wish.has(id) ? '♥ En favoritos' : '♡ Guardar en favoritos');
  btn && (btn.classList.remove('pop'), void btn.offsetWidth, btn.classList.add('pop'));
  updateCounts(); toast(wish.has(id) ? '♥ Añadido a favoritos' : 'Eliminado de favoritos');
  if (filter === 'wish') renderProducts();
}

/* ---------------- Cart ---------------- */
let cart = store.get('ciphera_cart', {}); Object.keys(cart).forEach(k => { if (!ALL[k]) delete cart[k]; });
const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
const cartSub = () => Object.entries(cart).reduce((s, [id, q]) => s + ALL[id].price * q, 0);
function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function updateCounts() { $('#cart-count').textContent = cartCount(); $('#wish-count').textContent = wish.size; }
function addToCart(id, q = 1, from) {
  cart[id] = (cart[id] || 0) + q; store.set('ciphera_cart', cart); renderCart(); fly(from, ALL[id].img);
  setTimeout(() => bump($('#cart-count')), reduce ? 0 : 900);
  toast(`<span style="color:var(--ok)">✓</span> ${esc(ALL[id].name)} añadido`);
}
function setQty(id, q) { if (q <= 0) delete cart[id]; else cart[id] = q; store.set('ciphera_cart', cart); renderCart(); }
function renderCart() {
  updateCounts();
  const ids = Object.keys(cart), list = $('#cart-list'), sub = cartSub(), free = SITE.freeShipping;
  $('#cart-items-n').textContent = ids.length ? `(${cartCount()})` : '';
  $('#cart-sub').textContent = eur(sub);
  $('#ship-msg').innerHTML = sub >= free ? '<b>✓ ¡Envío gratis desbloqueado!</b>' : `Te faltan <b>${eur(free - sub)}</b> para el envío gratis`;
  $('#ship-bar').style.width = Math.min(100, sub / free * 100) + '%';
  $('#go-checkout').disabled = !ids.length;
  list.innerHTML = ids.length ? ids.map(id => { const p = ALL[id]; return `<li class="citem"><img src="${p.img}" alt=""><div><h4>${esc(p.name)}</h4><small>${CAT_LABEL[p.cat] || ''}</small><div class="qty"><button data-dec="${id}" aria-label="Restar">−</button><span>${cart[id]}</span><button data-inc="${id}" aria-label="Sumar">+</button></div></div><div class="citem__r"><b>${eur(p.price * cart[id])}</b><button class="rm" data-rm="${id}">Quitar</button></div></li>`; }).join('')
    : `<li class="cart-empty"><svg viewBox="0 0 24 24"><path d="M3 4h2l2.5 11h11L21 7H6.5"/></svg><p>Tu carrito está vacío.<br>Un buen momento para blindarte.</p><a href="#tienda" class="btn btn--sm" data-close-cart><span>Ir a la tienda</span></a></li>`;
  if (view.classList.contains('on') && location.hash === '#/checkout') renderCheckout();
}
const scrim = $('#scrim'), drawer = $('#cart'), qv = $('#qv');
let lastFocus = null;
function openLayer(el) { lastFocus = document.activeElement; el.classList.add('on'); el.setAttribute('aria-hidden', 'false'); scrim.classList.add('on'); lock(true); setTimeout(() => el.querySelector('[data-close]')?.focus(), 50); }
function closeLayers() { [drawer, qv].forEach(el => { el.classList.remove('on'); el.setAttribute('aria-hidden', 'true'); }); scrim.classList.remove('on'); if (!view.classList.contains('on')) lock(false); lastFocus?.focus?.(); }
$('#btn-cart').addEventListener('click', () => openLayer(drawer));
$('#btn-wish').addEventListener('click', () => { setFilter('wish'); scrollToEl($('#tienda')); });
$('#btn-search').addEventListener('click', () => { scrollToEl($('#tienda')); setTimeout(() => $('#search').focus({ preventScroll: true }), 900); });
scrim.addEventListener('click', closeLayers);
addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeLayers(); closeMenu(); }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); scrollToEl($('#tienda')); setTimeout(() => $('#search').focus({ preventScroll: true }), 700); }
});
document.addEventListener('click', e => {
  const t = e.target;
  if (t.closest('[data-close]')) return closeLayers();
  if (t.closest('[data-close-cart]')) { e.preventDefault(); closeLayers(); setTimeout(() => scrollToEl($('#tienda')), 300); return; }
  const add = t.closest('[data-add]'); if (add) { addToCart(add.dataset.add, +(add.dataset.qty || 1), add); if (add.classList.contains('add')) { add.classList.add('done'); setTimeout(() => add.classList.remove('done'), 900); } return; }
  const w = t.closest('[data-wish]'); if (w) return toggleWish(w.dataset.wish, w);
  const qb = t.closest('[data-qv]'); if (qb) return openQV(qb.dataset.qv);
  const inc = t.closest('[data-inc]'); if (inc) return setQty(inc.dataset.inc, cart[inc.dataset.inc] + 1);
  const dec = t.closest('[data-dec]'); if (dec) return setQty(dec.dataset.dec, cart[dec.dataset.dec] - 1);
  const rm = t.closest('[data-rm]'); if (rm) return setQty(rm.dataset.rm, 0);
  const cc = t.closest('[data-course]'); if (cc) { location.hash = '#/curso/' + cc.dataset.course; return; }
});
$('#go-checkout').addEventListener('click', () => { closeLayers(); location.hash = '#/checkout'; });

/* ---------------- Quick view ---------------- */
function openQV(id) {
  const p = ALL[id]; let q = 1;
  $('#qv-body').innerHTML = `<div class="qv__media fx"><img src="${p.img}" alt="${esc(p.name)}">${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}</div>
  <div class="qv__info"><span class="pcard__cat">${CAT_LABEL[p.cat]}</span><h3>${esc(p.name)}</h3><div class="stars">${stars(p.rating)}<small>${p.rating} · ${p.reviews.toLocaleString('es-ES')} opiniones</small></div>
  <p>${esc(p.desc)}</p><ul class="feats">${p.feats.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
  <div class="price"><b>${eur(p.price)}</b>${p.unit ? `<small>${p.unit}</small>` : ''}${p.old ? `<s>${eur(p.old)}</s>` : ''}</div>
  <div class="qv__buy"><div class="qty"><button id="qv-dec" aria-label="Restar">−</button><span id="qv-q">1</span><button id="qv-inc" aria-label="Sumar">+</button></div>
  <button class="btn magnetic" data-add="${p.id}" id="qv-add"><span>Añadir · ${eur(p.price)}</span></button>
  <button class="wish ${wish.has(p.id) ? 'on' : ''}" data-wish="${p.id}" aria-label="Favorito" style="position:static">${wishSvg}</button></div>
  <p class="mono small muted">Envío 24-48 h · Devolución 30 días · Producto de ejemplo</p></div>`;
  const upd = () => { $('#qv-q').textContent = q; $('#qv-add').dataset.qty = q; $('#qv-add span').textContent = `Añadir · ${eur(p.price * q)}`; };
  $('#qv-inc').onclick = () => { q++; upd(); }; $('#qv-dec').onclick = () => { q = Math.max(1, q - 1); upd(); };
  openLayer(qv); bindInteractive(qv); fx.bind(qv);
}

/* ---------------- Products (filter/search/sort + Flip) ---------------- */
let filter = 'all', query = '', sort = 'pop';
const grid = $('#product-grid');
grid.innerHTML = PRODUCTS.map(p => `<article class="pcard tilt" data-id="${p.id}" data-cat="${p.cat}">
  <div class="pcard__media fx" data-qv="${p.id}" data-cursor="Ver"><img src="${p.img}" alt="${esc(p.name)}" loading="lazy" width="800" height="600">
  ${p.badge ? `<span class="badge ${p.badge === 'Nuevo' ? 'badge--blue' : ''}">${esc(p.badge)}</span>` : ''}
  <button class="btn btn--sm btn--ghost qv-btn" data-qv="${p.id}" style="backdrop-filter:blur(8px)"><span>Vista rápida</span></button></div>
  <button class="wish ${wish.has(p.id) ? 'on' : ''}" data-wish="${p.id}" aria-label="Añadir ${esc(p.name)} a favoritos" aria-pressed="${wish.has(p.id)}">${wishSvg}</button>
  <div class="pcard__body"><span class="pcard__cat">${CAT_LABEL[p.cat]}</span><h3>${esc(p.name)}</h3><p>${esc(p.short)}</p>
  <div class="stars">${stars(p.rating)}<small>${p.rating} (${p.reviews.toLocaleString('es-ES')})</small></div>
  <div class="pcard__foot"><div class="price"><b>${eur(p.price)}</b>${p.unit ? `<small>${p.unit}</small>` : ''}${p.old ? `<s>${eur(p.old)}</s>` : ''}</div>
  <button class="add" data-add="${p.id}" aria-label="Añadir ${esc(p.name)} al carrito"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div></div></article>`).join('');
const cards = Object.fromEntries($$('.pcard', grid).map(c => [c.dataset.id, c]));
const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function renderProducts() {
  const state = hasG && window.Flip && !reduce ? Flip.getState($$('.pcard', grid)) : null;
  let list = PRODUCTS.filter(p => (filter === 'all' || (filter === 'wish' ? wish.has(p.id) : p.cat === filter)) && (!query || norm(p.name + ' ' + p.short + ' ' + p.feats.join(' ') + ' ' + p.cat).includes(norm(query))));
  const sorters = { pop: (a, b) => b.reviews - a.reviews, asc: (a, b) => a.price - b.price, desc: (a, b) => b.price - a.price, rate: (a, b) => b.rating - a.rating };
  list.sort(sorters[sort]);
  const vis = new Set(list.map(p => p.id));
  PRODUCTS.forEach(p => cards[p.id].style.display = vis.has(p.id) ? '' : 'none');
  list.forEach(p => grid.appendChild(cards[p.id]));
  $('#empty').hidden = list.length > 0;
  if (state) Flip.from(state, { duration: .7, ease: 'power3.inOut', scale: true, absolute: true, stagger: .03,
    onEnter: els => G.fromTo(els, { opacity: 0, scale: .8, filter: 'blur(10px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: .6 }),
    onLeave: els => G.to(els, { opacity: 0, scale: .8, duration: .4 }), onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh() });
}
const chips = $('.toolbar .chips'), pill = $('.chips__pill', chips);
function movePill() { const a = $('.chip.is-active', chips); if (!a) return; pill.style.width = a.offsetWidth + 'px'; pill.style.transform = `translateX(${a.offsetLeft}px)`; pill.style.height = a.offsetHeight + 'px'; pill.style.top = a.offsetTop + 'px'; }
function setFilter(f) { filter = f; $$('.chip', chips).forEach(c => { const on = c.dataset.filter === f; c.classList.toggle('is-active', on); c.setAttribute('aria-selected', on); }); movePill(); renderProducts(); }
chips.addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) setFilter(c.dataset.filter); });
let qt; $('#search').addEventListener('input', e => { clearTimeout(qt); qt = setTimeout(() => { query = e.target.value.trim(); renderProducts(); }, 180); });
$('#sort').addEventListener('change', e => { sort = e.target.value; renderProducts(); });
addEventListener('resize', movePill); document.fonts?.ready.then(movePill); movePill();
renderProducts();

/* ---------------- Bundles + countdown ---------------- */
$('#bundles').innerHTML = BUNDLES.map(b => `<article class="bundle reveal"><div class="bundle__in"><div class="mesh" aria-hidden="true"><i></i><i></i><i></i></div>
  <span class="bundle__save">-${Math.round((1 - b.price / b.old) * 100)}%</span>
  <div class="bundle__imgs">${b.items.map(i => `<img src="${ALL[i].img}" alt="">`).join('')}</div>
  <h3>${esc(b.name)}</h3><p>${esc(b.desc)}</p>
  <div class="bundle__foot"><div class="price"><b>${eur(b.price)}</b><s>${eur(b.old)}</s></div><button class="btn btn--sm magnetic" data-add="${b.id}"><span>Lo quiero</span></button></div></div></article>`).join('');
let dealEnd = store.get('ciphera_deal_end', 0);
if (!dealEnd || dealEnd < Date.now()) { dealEnd = Date.now() + (3 * 86400 + 7 * 3600 + 42 * 60) * 1000; store.set('ciphera_deal_end', dealEnd); }
const pad = n => String(n).padStart(2, '0');
function tickCD() {
  let s = Math.max(0, Math.floor((dealEnd - Date.now()) / 1000));
  const vals = { d: s / 86400 | 0, h: (s % 86400) / 3600 | 0, m: (s % 3600) / 60 | 0, s: s % 60 };
  for (const k in vals) { const el = $('#cd-' + k), v = pad(vals[k]); if (el.textContent !== v) { el.textContent = v; if (hasG && !reduce) G.fromTo(el, { yPercent: -40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .35 }); } }
}
tickCD(); setInterval(tickCD, 1000);

/* ---------------- Courses ---------------- */
const lvlN = { Principiante: 1, Intermedio: 2, Avanzado: 3, Todos: 1 };
const cgrid = $('#course-grid');
cgrid.innerHTML = COURSES.map(c => `<article class="ccard tilt" data-level="${c.level}">
  <div class="ccard__media fx" data-course="${c.id}" data-cursor="Temario"><img src="${c.img}" alt="" loading="lazy"><div class="ccard__lvl"><span>${c.level}</span>${c.tag ? `<span style="color:var(--cyan)">${c.tag}</span>` : ''}</div>
  <button class="wish ${wish.has(c.id) ? 'on' : ''}" data-wish="${c.id}" aria-label="Favorito">${wishSvg}</button></div>
  <div class="ccard__body"><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>
  <div class="ccard__meta"><span>⏱ <b>${c.hours} h</b></span><span>▤ <b>${c.modules.length}</b> módulos</span><span class="stars">★ ${c.rating}</span><span>👥 ${c.students.toLocaleString('es-ES')}</span></div>
  <div class="ccard__foot"><div class="price"><b>${eur(c.price)}</b>${c.unit ? `<small>${c.unit}</small>` : ''}${c.old ? `<s>${eur(c.old)}</s>` : ''}</div>
  <div style="display:flex;gap:.5rem"><button class="btn btn--sm btn--ghost" data-course="${c.id}"><span>Temario</span></button><button class="add" data-add="${c.id}" aria-label="Añadir curso al carrito"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div></div></div></article>`).join('');
$('.chips--lvl').addEventListener('click', e => {
  const c = e.target.closest('.chip'); if (!c) return;
  $$('.chips--lvl .chip').forEach(x => x.classList.toggle('is-active', x === c));
  const st = hasG && window.Flip && !reduce ? Flip.getState($$('.ccard', cgrid)) : null;
  $$('.ccard', cgrid).forEach(k => k.style.display = c.dataset.level === 'all' || k.dataset.level === c.dataset.level ? '' : 'none');
  st && Flip.from(st, { duration: .6, ease: 'power3.inOut', absolute: true, onEnter: els => G.fromTo(els, { opacity: 0, y: 40 }, { opacity: 1, y: 0 }), onLeave: els => G.to(els, { opacity: 0 }), onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh() });
});

/* ---------------- Reviews ---------------- */
const REVS = [['Marta G.', 'La llave X1 se configuró en 2 minutos. Ya no me preocupa el phishing en el trabajo.'], ['Carlos P.', 'El curso de Ethical Hacking es brutal: laboratorios reales y nada de relleno.'], ['Lucía R.', 'Pasé el Security+ a la primera con los simulacros. 100% recomendado.'], ['Andrés M.', 'Montamos el Kit Pyme en la oficina y el firewall bloqueó un ataque la primera semana.'], ['Sofía L.', 'El gestor de contraseñas me avisó de una filtración antes que el propio servicio.'], ['Javier T.', 'Atención de 10. Me ayudaron a elegir el pack adecuado para mi familia.'], ['Elena V.', 'Formación de concienciación amena: la plantilla incluso pidió más sesiones.'], ['Raúl S.', 'El USB cifrado es tanque. Lo llevo a todas partes con datos de clientes.']];
const revHTML = arr => arr.map(([n, t], i) => `<article class="rev"><div class="stars">★★★★★</div><p>“${t}”</p><footer><span class="avatar">${n.split(' ').map(x => x[0]).join('')}</span>${n}<span class="ver">✓ COMPRA VERIFICADA (EJEMPLO)</span></footer></article>`).join('');
$('#rev-a').innerHTML = revHTML(REVS) + revHTML(REVS); $('#rev-b').innerHTML = revHTML([...REVS].reverse()) + revHTML([...REVS].reverse());
$$('.reviews__row article').forEach((a, i) => { if (i >= REVS.length) a.setAttribute('aria-hidden', 'true'); });

/* ---------------- FAQ smooth ---------------- */
$$('.faq details').forEach(d => d.addEventListener('toggle', () => { if (d.open) { $$('.faq details').forEach(o => o !== d && (o.open = false)); hasG && !reduce && G.from(d.querySelector('div'), { height: 0, opacity: 0, duration: .45, ease: 'power3.out', clearProps: 'all' }); } setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 500); }));

/* ---------------- Newsletter ---------------- */
$('#news-form').addEventListener('submit', e => {
  e.preventDefault(); const v = $('#news-email').value.trim(), m = $('.news__msg');
  if (!/^\S+@\S+\.\S+$/.test(v)) { m.classList.add('err'); m.textContent = '✖ Introduce un email válido.'; return; }
  m.classList.remove('err'); m.textContent = '✔ ¡Dentro! Tu código: CIPHER10 (demo, no se ha enviado nada).'; e.target.reset();
});

/* ---------------- Views (router) + page transition ---------------- */
const view = $('#view'), vbody = $('#view-body'), tr = $('.transition');
function transition(mid) {
  if (!hasG || reduce) { mid(); return Promise.resolve(); }
  return new Promise(res => {
    const cols = $$('.transition__cols i'), txt = $('.transition__txt span');
    G.timeline({ onComplete: res })
      .set(tr, { visibility: 'visible' })
      .set(cols, { transformOrigin: 'top' })
      .to(cols, { scaleY: 1, duration: .5, ease: 'expo.in', stagger: { each: .04, from: 'random' } })
      .to('.transition__txt', { opacity: 1, duration: .15 }, '-=.1')
      .add(() => { scramble(txt, 400); mid(); })
      .set(cols, { transformOrigin: 'bottom' }, '+=.35')
      .to('.transition__txt', { opacity: 0, duration: .15 })
      .to(cols, { scaleY: 0, duration: .55, ease: 'expo.out', stagger: { each: .04, from: 'random' } })
      .set(tr, { visibility: 'hidden' });
  });
}
function showView(html, title) {
  vbody.innerHTML = html; view.classList.add('on'); view.setAttribute('aria-hidden', 'false'); view.scrollTop = 0; lock(true);
  document.title = `${title} · ${SITE.brand} Store`; bindInteractive(view); fx.bind(view);
  if (hasG && !reduce) G.from($$('.view__inner > *', view), { opacity: 0, y: 40, stagger: .07, duration: .8, delay: .3, ease: 'power3.out' });
  setTimeout(() => vbody.querySelector('h1')?.focus?.(), 900);
}
function hideView() { view.classList.remove('on'); view.setAttribute('aria-hidden', 'true'); vbody.innerHTML = ''; lock(false); document.title = `${SITE.brand} · Ciber Store — Hardware, software y cursos de ciberseguridad`; }
function courseHTML(c) {
  return `<button class="back" data-back>← Volver a la tienda</button>
  <section class="cd-hero fx"><img src="${c.img}" alt=""><div><p class="eyebrow mono">// curso · ${c.level}</p><h1 tabindex="-1">${esc(c.name)}</h1><p class="muted">${esc(c.desc)}</p></div></section>
  <div class="cd-grid"><div>
    <div class="cd-meta"><div><small>Nivel</small><b>${c.level}</b><div class="lvl-bar" style="margin-top:.4rem">${[1, 2, 3].map(i => `<i class="${i <= lvlN[c.level] ? 'on' : ''}"></i>`).join('')}</div></div><div><small>Duración</small><b>${c.hours} h</b></div><div><small>Valoración</small><b>★ ${c.rating}</b></div><div><small>Alumnos</small><b>${c.students.toLocaleString('es-ES')}</b></div></div>
    <h2 style="font-size:1.8rem;margin-bottom:1rem">Temario</h2>
    <div class="curr">${c.modules.map(([t, d], i) => `<details ${i === 0 ? 'open' : ''}><summary>${esc(t)}<span>${Math.max(2, Math.round(c.hours / c.modules.length))} h ${i > 0 ? '🔒' : '· vista previa'}</span></summary><div>${esc(d)}. ${i === 0 ? 'Lección de muestra disponible gratis.' : '<span class="lock">Contenido completo tras la inscripción.</span>'}</div></details>`).join('')}</div>
    <h2 style="font-size:1.8rem;margin:2.5rem 0 1rem">Tu instructor (ejemplo)</h2>
    <div class="glass" style="padding:1.4rem;display:flex;gap:1rem;align-items:center"><span class="avatar" style="width:56px;height:56px">AX</span><div><b>Alex X.</b><p class="muted small">Pentester OSCP con 12 años de experiencia en Red Team. Perfil ficticio.</p></div></div>
  </div>
  <aside class="buybox glass"><div class="price"><b>${eur(c.price)}</b>${c.unit ? `<small>${c.unit}</small>` : ''}${c.old ? `<s>${eur(c.old)}</s>` : ''}</div>
    <button class="btn btn--full magnetic" data-add="${c.id}"><span>Inscribirme ahora</span></button>
    <button class="btn btn--full btn--ghost" data-wish="${c.id}"><span>${wish.has(c.id) ? '♥ En favoritos' : '♡ Guardar en favoritos'}</span></button>
    <ul><li>Acceso de por vida</li><li>Laboratorios en la nube</li><li>Certificado verificable</li><li>Garantía de 14 días</li></ul></aside></div>`;
}
let coDone = false;
function checkoutHTML() {
  const ids = Object.keys(cart), sub = cartSub(), shipSel = $('input[name=ship]:checked', view)?.value || 'std';
  const ship = ids.every(id => ALL[id].cat === 'curso' || ALL[id].cat === 'software') ? 0 : sub >= SITE.freeShipping ? 0 : shipSel === 'exp' ? 9.9 : 4.9;
  const shipFinal = shipSel === 'exp' && ship === 0 && ids.some(id => !['curso', 'software'].includes(ALL[id].cat)) ? 5 : ship;
  const total = sub + shipFinal;
  if (coDone) return `<div class="success"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m7 12 3.5 3.5L17 9"/></svg><h1 tabindex="-1">Pedido simulado</h1><p class="muted">Referencia de demostración <b class="mono">CPH-${Date.now().toString(36).toUpperCase()}</b>. No se ha cobrado nada ni se han recogido datos.</p><button class="btn" data-back><span>Volver a la tienda</span></button></div>`;
  return `<button class="back" data-back>← Seguir comprando</button>
  <p class="eyebrow mono">// checkout seguro</p><h1 tabindex="-1" style="font-size:clamp(2.2rem,5vw,4rem);letter-spacing:-.04em;line-height:1">Finalizar compra</h1>
  <div class="demo-banner"><span style="font-size:1.6rem">⚠</span><div><b>Demo: pagos no activados.</b><br>Esta tienda es una demostración: no se solicitan ni almacenan datos de pago.</div></div>
  <div class="co-grid"><div>
    <div class="steps"><span class="on">1 · Carrito</span><span class="on">2 · Envío</span><span>3 · Pago (desactivado)</span></div>
    ${ids.length ? `<h2 style="font-size:1.5rem;margin-bottom:1rem">Método de entrega</h2>
    <label class="opt"><input type="radio" name="ship" value="std" ${shipSel === 'std' ? 'checked' : ''}> Estándar 24-48 h<span>${sub >= SITE.freeShipping ? 'Gratis' : '4,90 €'}</span></label>
    <label class="opt"><input type="radio" name="ship" value="exp" ${shipSel === 'exp' ? 'checked' : ''}> Exprés en el día<span>${sub >= SITE.freeShipping ? '5 €' : '9,90 €'}</span></label>
    <p class="muted small" style="margin-top:.6rem">Cursos y licencias se entregan al instante por email.</p>` : '<p class="muted">Tu carrito está vacío.</p>'}
  </div>
  <aside class="summary glass"><h3>Resumen del pedido</h3>
    ${ids.map(id => `<div class="line-it"><img src="${ALL[id].img}" alt=""><div>${esc(ALL[id].name)}<br><small class="muted mono">× ${cart[id]}</small></div><span>${eur(ALL[id].price * cart[id])}</span></div>`).join('')}
    <div class="row"><span class="muted">Subtotal</span><span>${eur(sub)}</span></div>
    <div class="row"><span class="muted">Envío</span><span>${shipFinal ? eur(shipFinal) : 'Gratis'}</span></div>
    <div class="row"><span class="muted">IVA (21%) incluido</span><span>${eur(total - total / 1.21)}</span></div>
    <div class="row total"><span>Total</span><span>${eur(total)}</span></div>
    <button class="btn btn--full" id="co-confirm" ${ids.length ? '' : 'disabled'}><span>Confirmar pedido (demo)</span></button>
    <p class="mono small muted" style="text-align:center">🔒 Pagos no activados en esta demo</p></aside></div>`;
}
function renderCheckout() { vbody.innerHTML = checkoutHTML(); bindInteractive(view); }
view.addEventListener('change', e => { if (e.target.name === 'ship') renderCheckout(); });
view.addEventListener('click', e => {
  if (e.target.closest('[data-back]')) { coDone = false; location.hash = ''; }
  if (e.target.closest('#co-confirm')) { coDone = true; cart = {}; store.set('ciphera_cart', cart); renderCart(); renderCheckout(); toast('✓ Pedido simulado completado'); }
});
let firstRoute = true;
function route() {
  const h = location.hash, m = h.match(/^#\/curso\/([\w-]+)/);
  const go = () => {
    if (m && ALL[m[1]]) showView(courseHTML(ALL[m[1]]), ALL[m[1]].name);
    else if (h === '#/checkout') { showView(checkoutHTML(), 'Checkout'); }
    else if (view.classList.contains('on')) hideView();
  };
  if (firstRoute) { firstRoute = false; go(); return; }
  if (!m && h !== '#/checkout' && !view.classList.contains('on')) return;
  transition(go);
}
addEventListener('hashchange', route);

/* ---------------- Scroll animations ---------------- */
let curChap = 0;
function scrollAnims() {
  if (!hasG || reduce || !window.ScrollTrigger) { $$('.reveal').forEach(e => { e.style.opacity = 1; e.style.transform = 'none'; }); $$('.draw').forEach(e => e.classList.add('drawn')); return; }
  G.registerPlugin(ScrollTrigger); window.Flip && G.registerPlugin(Flip);
  // hero story chapters
  const tl = G.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: .6,
    onUpdate: s => { $('.hud__bar span').style.transform = `scaleX(${s.progress})`;
      const ch = s.progress < .2 ? 0 : s.progress < .48 ? 1 : s.progress < .74 ? 2 : 3;
      if (ch !== curChap) { curChap = ch; $('.hud__n').textContent = '0' + (ch + 1); window.dispatchEvent(new CustomEvent('hero:chapter', { detail: ch }));
        const el = $('.chapter--' + ch); el.classList.remove('glitching'); void el.offsetWidth; el.classList.add('glitching'); } } } });
  tl.to('.chapter--0', { opacity: 0, y: -80, filter: 'blur(10px)', duration: 1 }, .6)
    .fromTo('.chapter--1', { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 1 }, 1.4)
    .to('.chapter--1', { autoAlpha: 0, y: -80, filter: 'blur(10px)', duration: 1 }, 2.8)
    .fromTo('.chapter--2', { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: 1 }, 3.4)
    .to('.chapter--2', { autoAlpha: 0, y: -80, filter: 'blur(10px)', duration: 1 }, 4.8)
    .fromTo('.chapter--3', { autoAlpha: 0, x: 80 }, { autoAlpha: 1, x: 0, duration: 1 }, 5.4)
    .to({}, { duration: 1 });
  $$('.split').forEach(h => G.from(h.querySelectorAll('.c'), { opacity: 0, rotateX: -100, yPercent: 60, z: -80, duration: 1, ease: 'expo.out', stagger: .018,
    scrollTrigger: { trigger: h, start: 'top 88%', onEnter: () => decodeChars(h) } }));
  $$('.reveal-clip, .cat, .news, .bundle').forEach(el => G.fromTo(el, { clipPath: 'inset(45% 8% 45% 8% round 28px)' }, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.3, ease: 'expo.inOut', clearProps: 'clipPath', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('.section__head .eyebrow').forEach(e => G.from(e, { clipPath: 'inset(0 100% 0 0)', duration: 1, ease: 'expo.out', scrollTrigger: { trigger: e, start: 'top 90%' } }));
  ScrollTrigger.batch('.draw', { start: 'top 90%', once: true, onEnter: b => b.forEach((e, i) => setTimeout(() => e.classList.add('drawn'), i * 150)) });
  $$('.reveal').forEach(e => G.to(e, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: e, start: 'top 90%' } }));
  G.from('.cat', { opacity: 0, y: 80, rotateX: -25, duration: 1.1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.cats', start: 'top 85%' } });
  ScrollTrigger.batch('.pcard', { start: 'top 92%', once: true, onEnter: b => G.from(b, { opacity: 0, y: 70, rotateX: -15, stagger: .08, duration: .9, ease: 'power3.out', clearProps: 'opacity,transform' }) });
  ScrollTrigger.batch('.ccard', { start: 'top 92%', once: true, onEnter: b => G.from(b, { opacity: 0, y: 70, stagger: .1, duration: .9, ease: 'power3.out', clearProps: 'opacity,transform' }) });
  G.from('.countdown div', { opacity: 0, scale: .5, stagger: .08, ease: 'back.out(2)', scrollTrigger: { trigger: '.countdown', start: 'top 90%' } });
  G.from('.faq details', { opacity: 0, x: -40, stagger: .07, scrollTrigger: { trigger: '.faq__list', start: 'top 85%' } });
  G.from('.news', { scale: .92, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.news', start: 'top 85%' } });
  G.to('.footer__big', { yPercent: -18, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  addEventListener('load', () => ScrollTrigger.refresh());
}

/* ---------------- Init ---------------- */
$$('.draw *').forEach(e => e.setAttribute('pathLength', '1'));
const fx = initFx({ enabled: fine && !reduce });
initBg({ reduce }); if (fine && !reduce) initTrail();
renderCart(); bindInteractive(); fx.bind(document); scrollAnims(); route();
