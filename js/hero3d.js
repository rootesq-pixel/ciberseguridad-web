/* Hero cinematográfico: llave de seguridad 3D con cámara guiada por scroll.
   Si WebGL o la CDN fallan, se muestra una ilustración estática (sin errores en consola). */
const canvas = document.getElementById('hero-canvas');
const heroEl = document.querySelector('.hero');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
function fallback(reason) { document.documentElement.classList.add('no-webgl'); canvas && canvas.remove(); console.info('[hero] modo estático:', reason); }
function hasWebGL() { try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; } }

async function init() {
  if (!canvas) return;
  if (!hasWebGL()) return fallback('WebGL no disponible');
  let THREE, RoomEnvironment, RoundedBoxGeometry, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
  try {
    THREE = await import('three');
    [{ RoomEnvironment }, { RoundedBoxGeometry }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import('three/addons/environments/RoomEnvironment.js'), import('three/addons/geometries/RoundedBoxGeometry.js'),
      import('three/addons/postprocessing/EffectComposer.js'), import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'), import('three/addons/postprocessing/OutputPass.js')]);
  } catch (e) { return fallback('no se pudo cargar Three.js'); }
  try { build({ THREE, RoomEnvironment, RoundedBoxGeometry, EffectComposer, RenderPass, UnrealBloomPass, OutputPass }); }
  catch (e) { fallback('error al iniciar la escena: ' + e.message); }
}

function build({ THREE, RoomEnvironment, RoundedBoxGeometry, EffectComposer, RenderPass, UnrealBloomPass, OutputPass }) {
  const mobile = () => innerWidth < 800;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('sin contexto');
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile() ? 1.25 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 100);
  const look = new THREE.Vector3();

  // ---------- canvas textures ----------
  const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const fingerprint = ctex(512, 512, (g, w) => {
    g.fillStyle = '#000'; g.fillRect(0, 0, w, w); g.strokeStyle = '#7ff3ff'; g.lineCap = 'round'; g.lineWidth = 9;
    for (let i = 0; i < 9; i++) { const r = 30 + i * 24; g.beginPath(); g.arc(256, 290, r, Math.PI * (1.05 + i * .01), Math.PI * (1.95 - (i % 3) * .05)); g.stroke(); g.beginPath(); g.arc(256, 260, r * .9, Math.PI * .2, Math.PI * (.5 + (i % 2) * .2)); g.stroke(); }
    g.beginPath(); g.moveTo(256, 300); g.lineTo(256, 230); g.stroke();
  });
  const decal = ctex(512, 1024, (g, w, h) => {
    g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(160,210,255,.55)'; g.font = '600 46px "JetBrains Mono", monospace'; g.textAlign = 'center';
    g.fillText((window.SITE?.brand || 'CIPHERA').toUpperCase(), w / 2, 800); g.font = '400 28px "JetBrains Mono", monospace'; g.fillStyle = 'rgba(62,230,255,.6)'; g.fillText('FIDO2 · X1', w / 2, 850);
    g.strokeStyle = 'rgba(62,230,255,.25)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w / 2 - 120, 880); g.lineTo(w / 2 + 120, 880); g.stroke();
  });

  // ---------- security key ----------
  const key = new THREE.Group(); scene.add(key);
  const W = 1.3, H = 3.2, R = .5, D = .3;
  const shape = new THREE.Shape();
  shape.moveTo(-W / 2 + R, -H / 2); shape.lineTo(W / 2 - R, -H / 2); shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
  shape.lineTo(W / 2, H / 2 - R); shape.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2); shape.lineTo(-W / 2 + R, H / 2);
  shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - R); shape.lineTo(-W / 2, -H / 2 + R); shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);
  const hole = new THREE.Path(); hole.absarc(0, H / 2 - .42, .2, 0, Math.PI * 2, true); shape.holes.push(hole);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: .07, bevelSize: .07, bevelSegments: 8, curveSegments: 48 });
  bodyGeo.translate(0, 0, -D / 2);
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: 0x0b1426, metalness: .75, roughness: .26, clearcoat: 1, clearcoatRoughness: .12, iridescence: .25, iridescenceIOR: 1.4, envMapIntensity: .55 });
  key.add(new THREE.Mesh(bodyGeo, bodyMat));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(W * .95, H * .95), new THREE.MeshBasicMaterial({ map: decal, transparent: true, depthWrite: false }));
  face.position.z = D / 2 + .071; key.add(face);
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xd9a74a, metalness: 1, roughness: .22, clearcoat: .5 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.38, .04, 24, 96), gold); ring.position.set(0, .05, D / 2 + .06); key.add(ring);
  const sensorMat = new THREE.MeshStandardMaterial({ color: 0x02060c, emissive: 0x3ee6ff, emissiveMap: fingerprint, emissiveIntensity: 1.2, roughness: .4, metalness: .2 });
  const sensor = new THREE.Mesh(new THREE.CircleGeometry(.35, 64), sensorMat); sensor.position.set(0, .05, D / 2 + .075); key.add(sensor);
  const silver = new THREE.MeshPhysicalMaterial({ color: 0x9aa6b8, metalness: 1, roughness: .3, envMapIntensity: .6 });
  const conn = new THREE.Mesh(new RoundedBoxGeometry(.62, .6, .2, 4, .07), silver); conn.position.y = -H / 2 - .3; key.add(conn);
  const slot = new THREE.Mesh(new RoundedBoxGeometry(.44, .05, .09, 2, .02), new THREE.MeshBasicMaterial({ color: 0x05070c })); slot.position.set(0, -H / 2 - .58, 0); key.add(slot);
  const keyring = new THREE.Mesh(new THREE.TorusGeometry(.62, .045, 20, 120), silver); keyring.position.set(0, H / 2 + .05, 0); keyring.rotation.y = Math.PI / 2.4; key.add(keyring);
  const led = new THREE.Mesh(new THREE.CircleGeometry(.05, 24), new THREE.MeshBasicMaterial({ color: 0x29f0a6 })); led.position.set(0, -.9, D / 2 + .075); key.add(led);
  key.scale.setScalar(innerWidth < 800 ? .62 : .82);

  // halo + shield
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.1, .012, 16, 200), new THREE.MeshBasicMaterial({ color: 0x00a3ff, transparent: true, opacity: .8 })); scene.add(halo);
  const halo2 = new THREE.Mesh(new THREE.TorusGeometry(2.45, .006, 16, 200), new THREE.MeshBasicMaterial({ color: 0x3ee6ff, transparent: true, opacity: .4 })); scene.add(halo2);
  const shieldMat = new THREE.MeshBasicMaterial({ color: 0x00a3ff, wireframe: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
  const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(2.7, 3), shieldMat); scene.add(shield);
  const shellMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { k: { value: 0 }, time: { value: 0 } },
    vertexShader: `varying vec3 n;varying vec3 v;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
    fragmentShader: `uniform float k,time;varying vec3 n;varying vec3 v;void main(){float f=pow(1.-max(dot(n,v),0.),2.5);gl_FragColor=vec4(.1,.6,1.,f*k*.55*(.8+.2*sin(time*3.)));}` });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(2.68, 64, 64), shellMat); scene.add(shell);

  // particles: amenaza (rojo) -> repelidas por el escudo (azul)
  const N = mobile() ? 2200 : 4500, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { const v = new THREE.Vector3().randomDirection(); const r = 4 + Math.random() * 7; pos.set([v.x * r, v.y * r * .7, v.z * r], i * 3); seed[i] = Math.random(); }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  const pMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, attack: { value: 0 }, shieldK: { value: 0 }, px: { value: renderer.getPixelRatio() } },
    vertexShader: `attribute float seed;uniform float time,attack,shieldK,px;varying vec3 col;varying float a;
      void main(){ vec3 p=position; float r=length(p); vec3 dir=normalize(p);
        float ang=time*(.05+seed*.08); mat2 rot=mat2(cos(ang),-sin(ang),sin(ang),cos(ang)); p.xz=rot*p.xz; dir=normalize(p);
        float inR=mix(r, 1.4+seed*.8, attack*(1.-shieldK)); float outR=2.75+seed*.12+sin(time*2.+seed*40.)*.03;
        float fr=mix(inR,outR,shieldK*step(.35,seed)); fr=mix(fr, r+2.5, shieldK*(1.-step(.35,seed)));
        p=dir*fr; vec4 mv=modelViewMatrix*vec4(p,1.);
        col=mix(vec3(.25,.55,1.), vec3(1.,.22,.33), attack*(1.-shieldK)); col=mix(col, vec3(.25,.9,1.), shieldK);
        a=.35+.65*fract(seed*7.+time*.2);
        gl_PointSize=px*(1.+seed*1.8)*(1.+attack*.5)*(7./-mv.z); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `varying vec3 col;varying float a;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(col,a*(1.-d*2.));}` });
  scene.add(new THREE.Points(pg, pMat));

  // lights
  const rim1 = new THREE.PointLight(0x00a3ff, 30, 20); rim1.position.set(-3, 2, -2); scene.add(rim1);
  const rim2 = new THREE.PointLight(0x3ee6ff, 20, 20); rim2.position.set(3, -1, 3); scene.add(rim2);
  const redL = new THREE.PointLight(0xff2244, 0, 15); redL.position.set(2, 2, 2); scene.add(redL);
  scene.add(new THREE.AmbientLight(0x223355, .6));

  // post
  let composer = null, bloom = null;
  if (!mobile()) try {
    composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .7, .5, .5); composer.addPass(bloom); composer.addPass(new OutputPass());
  } catch { composer = null; }

  // keyframes [p, cam, target, keyPos, keyRot, attack, shield]
  const KF = () => {
    const m = mobile(), s = m ? 0 : 1;
    return [
      { p: 0, cam: [0, 0, m ? 11 : 8.5], keyPos: [2.3 * s, m ? 2.2 : 0, 0], keyRot: [.15, -.5, -.18], attack: 0, shield: 0 },
      { p: .3, cam: [-1.2, .6, m ? 9.5 : 6.8], keyPos: [1.4 * s, m ? 2.2 : 0, 0], keyRot: [.05, .35, .05], attack: 1, shield: 0 },
      { p: .58, cam: [0, .2, m ? 11.5 : 8.6], keyPos: [0, m ? 1.6 : 0, 0], keyRot: [0, 0, 0], attack: 1, shield: 1 },
      { p: .86, cam: [2.4, -.4, m ? 10 : 7.2], keyPos: [-2 * s, m ? 2.6 : 0, 0], keyRot: [.2, Math.PI * 2 - .7, .25], attack: 0, shield: .35 },
      { p: 1, cam: [2.4, -.4, m ? 10 : 7.2], keyPos: [-2 * s, m ? 2.6 : 0, 0], keyRot: [.2, Math.PI * 2 - .7, .25], attack: 0, shield: .35 }];
  };
  let kf = KF();
  const sm = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t, L3 = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
  function sample(p) {
    let i = 0; while (i < kf.length - 2 && p > kf[i + 1].p) i++;
    const a = kf[i], b = kf[i + 1], t = sm(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))));
    return { cam: L3(a.cam, b.cam, t), keyPos: L3(a.keyPos, b.keyPos, t), keyRot: L3(a.keyRot, b.keyRot, t), attack: lerp(a.attack, b.attack, t), shield: lerp(a.shield, b.shield, t) };
  }

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    if (composer) { composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2); }
    kf = KF(); if (reduce) render(0);
  }
  let mx = 0, my = 0, tx = 0, ty = 0, pp = 0, intro = reduce ? 1 : 0, visible = true;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(heroEl);
  addEventListener('site:ready', () => { if (!intro) intro = .001; }); setTimeout(() => { if (!intro) intro = .001; }, 3000);
  const progress = () => { const r = heroEl.getBoundingClientRect(), span = r.height - innerHeight; return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0; };
  const clock = new THREE.Clock();

  function render(dt) {
    const t = clock.elapsedTime;
    pp += (progress() - pp) * (reduce ? 1 : .08);
    if (intro > 0 && intro < 1) intro = Math.min(1, intro + dt * .5);
    const ei = 1 - Math.pow(1 - intro, 3), s = sample(pp);
    tx += (mx - tx) * .05; ty += (my - ty) * .05;
    camera.position.set(s.cam[0] + tx * .6, s.cam[1] - ty * .4, s.cam[2] + (1 - ei) * 6);
    look.set(0, 0, 0); camera.lookAt(look);
    key.position.set(s.keyPos[0], s.keyPos[1] + (reduce ? 0 : Math.sin(t * 1.2) * .08), s.keyPos[2]);
    key.rotation.set(s.keyRot[0] + ty * .25, s.keyRot[1] + tx * .6 + (1 - ei) * -2.5 + (reduce ? 0 : Math.sin(t * .5) * .12), s.keyRot[2]);
    [halo, halo2, shield, shell].forEach(o => o.position.copy(key.position));
    halo.rotation.set(Math.PI / 2 + .35 + Math.sin(t * .3) * .1, t * .2, 0); halo2.rotation.set(Math.PI / 2 - .25, -t * .15, .4);
    halo.material.opacity = .8 * ei * (1 - s.shield * .5); halo2.material.opacity = .4 * ei;
    shield.rotation.y = t * .08; shield.rotation.x = t * .05; shieldMat.opacity = s.shield * .16;
    shellMat.uniforms.k.value = s.shield; shellMat.uniforms.time.value = t;
    const pulse = .5 + .5 * Math.sin(t * 3);
    sensorMat.emissiveIntensity = 1 + s.shield * 1.2 * (.6 + .4 * pulse) + (1 - s.attack) * .3;
    sensorMat.emissive.setRGB(lerp(.24, 1, s.attack * (1 - s.shield)) , lerp(.9, .25, s.attack * (1 - s.shield)), lerp(1, .35, s.attack * (1 - s.shield)));
    led.material.color.setHex(s.attack > .5 && s.shield < .5 ? (Math.sin(t * 12) > 0 ? 0xff3b5c : 0x330000) : 0x29f0a6);
    redL.intensity = s.attack * (1 - s.shield) * 40 * (.7 + .3 * Math.sin(t * 10));
    pMat.uniforms.time.value = t; pMat.uniforms.attack.value = s.attack; pMat.uniforms.shieldK.value = s.shield;
    if (bloom) bloom.strength = .6 + s.shield * .15 + s.attack * .15;
    composer ? composer.render() : renderer.render(scene, camera);
  }
  function loop() { requestAnimationFrame(loop); const dt = Math.min(clock.getDelta(), .05); if (!visible) return; render(dt); }
  addEventListener('resize', resize); resize();
  if (reduce) { clock.getDelta(); render(0); addEventListener('scroll', () => render(0), { passive: true }); }
  else loop();
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); fallback('contexto WebGL perdido'); });
}
init();
