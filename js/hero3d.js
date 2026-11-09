/* Hero 3D: globo de partículas + escudo hexagonal + arcos de ataque interceptados */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { inLand, CITIES } from './geo.js';

const canvas = document.getElementById('hero-canvas');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
catch (e) { console.warn('WebGL no disponible, se usa fondo estático.'); canvas.remove(); throw 0; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
camera.position.set(0, 0, 9);
const root = new THREE.Group(); scene.add(root);
const globe = new THREE.Group(); root.add(globe);
const R = 2.4;
const ll2v = (lon, lat, r = R) => { const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)); };

// Points sphere (land brighter)
const N = innerWidth < 700 ? 6000 : 12000, pos = [], col = [], sz = [];
const cLand = new THREE.Color('#3ee6ff'), cSea = new THREE.Color('#123a7a');
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2, rad = Math.sqrt(1 - y * y), th = Math.PI * (3 - Math.sqrt(5)) * i;
  const v = new THREE.Vector3(Math.cos(th) * rad, y, Math.sin(th) * rad).multiplyScalar(R);
  const lat = Math.asin(v.y / R) * 180 / Math.PI; let lon = Math.atan2(v.z, -v.x) * 180 / Math.PI - 180; if (lon < -180) lon += 360;
  const land = inLand(lon, lat);
  if (!land && Math.random() > .35) continue;
  pos.push(v.x, v.y, v.z); const c = land ? cLand : cSea; col.push(c.r, c.g, c.b); sz.push(land ? 1 : .6);
}
const pg = new THREE.BufferGeometry();
pg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
pg.setAttribute('size', new THREE.Float32BufferAttribute(sz, 1));
const pMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() } },
  vertexShader: `attribute float size; attribute vec3 color; varying vec3 vC; varying float vF; uniform float uTime; uniform float uPx;
    void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.); vec3 n=normalize(normalMatrix*position);
      vF=smoothstep(-.2,.6,n.z); float scan=smoothstep(.06,0.,abs(fract(position.y*.25-uTime*.12)-.5));
      vC+=vec3(.4,.9,1.)*scan; gl_PointSize=size*uPx*(3.4+scan*3.)*(6./-mv.z); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `varying vec3 vC; varying float vF; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(vC,(1.-d*2.)*(.15+vF*.85)); }`
});
globe.add(new THREE.Points(pg, pMat));

// Atmosphere fresnel
const atm = new THREE.Mesh(new THREE.SphereGeometry(R * 1.08, 64, 64), new THREE.ShaderMaterial({
  transparent: true, side: THREE.FrontSide, blending: THREE.AdditiveBlending, depthWrite: false,
  uniforms: { uK: { value: 1 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader: `uniform float uK; varying vec3 vN; varying vec3 vV; void main(){ float r=1.-max(dot(vN,vV),0.); float i=pow(r,3.)*.9+pow(r,8.)*.6; gl_FragColor=vec4(.1,.6,1.,i*uK); }`
}));
root.add(atm);

// Hex shield (icosahedron wireframe) that pulses
const shieldMat = new THREE.LineBasicMaterial({ color: 0x00a3ff, transparent: true, opacity: .16, blending: THREE.AdditiveBlending });
const shield = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(R * 1.32, 2)), shieldMat);
root.add(shield);

// Orbit rings
const rings = [];
[[R * 1.6, .3, 0x3ee6ff], [R * 1.85, -.5, 0x2f6bff], [R * 2.1, .9, 0x00a3ff]].forEach(([r, tilt, c], i) => {
  const g = new THREE.BufferGeometry().setFromPoints(new THREE.EllipseCurve(0, 0, r, r).getPoints(200));
  const m = new THREE.LineDashedMaterial({ color: c, transparent: true, opacity: .35, dashSize: .15 + i * .1, gapSize: .1 });
  const l = new THREE.Line(g, m); l.computeLineDistances(); l.rotation.x = Math.PI / 2 + tilt; l.rotation.y = tilt * .5;
  const sat = new THREE.Mesh(new THREE.SphereGeometry(.05, 12, 12), new THREE.MeshBasicMaterial({ color: c }));
  l.add(sat); l.userData = { r, sat, sp: .2 + i * .12 }; root.add(l); rings.push(l);
});

// Attack arcs -> home (Madrid), intercepted by shield
const home = ll2v(...CITIES.madrid);
const homeMark = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
homeMark.position.copy(home); globe.add(homeMark);
const srcs = Object.entries(CITIES).filter(([k]) => k !== 'madrid').map(([, c]) => ll2v(...c));
const arcs = [];
function makeArc() {
  const a = srcs[(Math.random() * srcs.length) | 0];
  const mid = a.clone().add(home).multiplyScalar(.5); mid.setLength(R + a.distanceTo(home) * .55);
  const curve = new THREE.QuadraticBezierCurve3(a, mid, home);
  const pts = curve.getPoints(80);
  const g = new THREE.BufferGeometry().setFromPoints(pts); g.setDrawRange(0, 0);
  const red = Math.random() > .25;
  const m = new THREE.LineBasicMaterial({ color: red ? 0xff3b5c : 0x3ee6ff, transparent: true, opacity: .9, blending: THREE.AdditiveBlending });
  const line = new THREE.Line(g, m); globe.add(line);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.04, 8, 8), new THREE.MeshBasicMaterial({ color: red ? 0xff8095 : 0xaef6ff }));
  globe.add(head);
  arcs.push({ line, head, pts, t: 0, sp: .25 + Math.random() * .35, block: .55 + Math.random() * .3 });
}
const pulses = [];
function blockPulse(p) {
  const m = new THREE.Mesh(new THREE.RingGeometry(.05, .09, 32), new THREE.MeshBasicMaterial({ color: 0x3ee6ff, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
  m.position.copy(p); m.lookAt(p.clone().multiplyScalar(2)); globe.add(m); pulses.push({ m, t: 0 });
}

// Floating dust
const dN = 900, dPos = new Float32Array(dN * 3);
for (let i = 0; i < dN; i++) { dPos[i * 3] = (Math.random() - .5) * 30; dPos[i * 3 + 1] = (Math.random() - .5) * 18; dPos[i * 3 + 2] = (Math.random() - .5) * 14 - 3; }
const dG = new THREE.BufferGeometry(); dG.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
const dust = new THREE.Points(dG, new THREE.PointsMaterial({ color: 0x4aa8ff, size: .03, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
scene.add(dust);

// Layout & interaction
let mx = 0, my = 0, tx = 0, ty = 0, scrollK = 0, intro = 0;
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  const mobile = w < 900;
  root.position.set(mobile ? 0 : 2.6, mobile ? -2.4 : .1, 0); root.scale.setScalar(mobile ? .8 : 1);
}
addEventListener('resize', resize); resize();
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });
addEventListener('scroll', () => scrollK = Math.min(1, scrollY / innerHeight), { passive: true });
let visible = true; new IntersectionObserver(e => visible = e[0].isIntersecting).observe(canvas);
addEventListener('site:ready', () => intro = .0001);
setTimeout(() => { if (!intro) intro = .0001; }, 2500);

const clock = new THREE.Clock(); let spawnAcc = 0;
globe.rotation.y = 2.2; globe.rotation.x = .35;
function tick() {
  const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
  if (!reduce) requestAnimationFrame(tick);
  if (!visible && !reduce) return;
  if (intro > 0 && intro < 1) intro = Math.min(1, intro + dt * .6);
  const e = reduce ? 1 : 1 - Math.pow(1 - intro, 3);
  root.scale.setScalar((innerWidth < 900 ? .8 : 1) * (.6 + .4 * e) * (1 + scrollK * .25));
  pMat.uniforms.uTime.value = t;
  globe.rotation.y += dt * .08;
  tx += (mx - tx) * .05; ty += (my - ty) * .05;
  root.rotation.y = tx * .5; root.rotation.x = ty * .3 + scrollK * .4;
  camera.position.z = 9 + scrollK * 2;
  shield.rotation.y -= dt * .05; shield.rotation.z += dt * .02;
  shieldMat.opacity = .1 + Math.sin(t * 1.5) * .05 + .05;
  atm.material.uniforms.uK.value = e;
  rings.forEach((l, i) => { const a = t * l.userData.sp + i * 2; l.userData.sat.position.set(Math.cos(a) * l.userData.r, Math.sin(a) * l.userData.r, 0); });
  dust.rotation.y = t * .01; dust.position.y = Math.sin(t * .2) * .2;
  spawnAcc += dt; if (spawnAcc > .45 && arcs.length < 14 && intro > .5) { spawnAcc = 0; makeArc(); }
  if (reduce && arcs.length < 8) { for (let i = 0; i < 8; i++) makeArc(); }
  for (const a of arcs) {
    a.t += reduce ? a.block : dt * a.sp;
    const tt = Math.min(a.t, a.block), n = Math.floor(tt * a.pts.length);
    const start = Math.max(0, n - 30); a.line.geometry.setDrawRange(start, n - start);
    a.head.position.copy(a.pts[Math.min(n, a.pts.length - 1)]);
    if (a.t >= a.block && !a.hit) { a.hit = true; blockPulse(a.head.position); a.head.visible = false; }
    if (a.hit) a.line.material.opacity -= dt * 1.5;
  }
  for (let i = arcs.length - 1; i >= 0; i--) if (arcs[i].line.material.opacity <= 0) { const a = arcs[i]; globe.remove(a.line, a.head); a.line.geometry.dispose(); arcs.splice(i, 1); }
  for (let i = pulses.length - 1; i >= 0; i--) { const p = pulses[i]; p.t += dt; p.m.scale.setScalar(1 + p.t * 8); p.m.material.opacity = 1 - p.t; if (p.t >= 1) { globe.remove(p.m); pulses.splice(i, 1); } }
  homeMark.scale.setScalar(1 + Math.sin(t * 4) * .3);
  renderer.render(scene, camera);
}
tick();
