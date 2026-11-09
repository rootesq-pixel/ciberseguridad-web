/* Fondo shader guiado por scroll: rejilla hexagonal con flujo de datos. Ligero (media resolución) y se pausa si no se ve. */
const FS = `precision mediump float;
uniform vec2 res; uniform float time, scroll; uniform vec2 mouse;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec4 hex(vec2 p){ vec2 r=vec2(1.,1.732); vec2 h=r*.5; vec2 a=mod(p,r)-h; vec2 b=mod(p-h,r)-h; vec2 g=dot(a,a)<dot(b,b)?a:b; return vec4(g, p-g); }
void main(){
  vec2 uv=gl_FragCoord.xy/res; vec2 p=(gl_FragCoord.xy-.5*res)/res.y;
  p.y+=scroll*.35; p*=9.;
  vec4 h=hex(p); vec2 id=h.zw;
  vec2 q=abs(h.xy); float edge=max(dot(q,normalize(vec2(1.,1.732))),q.x);
  float line=smoothstep(.5,.47,edge)-smoothstep(.47,.44,edge);
  float rnd=hash(id);
  float wave=sin(id.y*.35-time*1.2+rnd*6.28)*.5+.5;
  float pulse=pow(wave,12.)*step(.72,rnd);
  vec2 m=(mouse-.5*res)/res.y; m.y=-m.y; m.y+=scroll*.35; m*=9.;
  float md=length(id-m); float glow=smoothstep(4.,0.,md);
  float flow=smoothstep(.04,0.,abs(fract(id.x*.11+id.y*.07-time*.08-scroll*.05)-.5))*.6;
  float fill=smoothstep(.45,0.,edge)*(pulse*.55+glow*.12);
  float a=line*(.035+glow*.28+flow*.2)+fill*.75;
  float vign=smoothstep(1.2,.2,length(uv-.5));
  vec3 col=mix(vec3(0.,.35,1.),vec3(.25,.9,1.),pulse+glow*.5);
  gl_FragColor=vec4(vec3(.008,.016,.04)+col*a*vign,1.);
}`;
export function initBg({ reduce }) {
  const cv = document.getElementById('bg-canvas'); if (!cv) return;
  let gl; try { gl = cv.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); } catch { gl = null; }
  if (!gl) { cv.remove(); return; }
  const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, mk(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(pr, mk(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { cv.remove(); return; }
  gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n), uR = U('res'), uT = U('time'), uS = U('scroll'), uM = U('mouse');
  const scale = innerWidth < 800 ? .35 : .5;
  let mx = -9999, my = -9999, tmx = mx, tmy = my, sc = 0;
  function resize() { cv.width = Math.round(innerWidth * scale); cv.height = Math.round(innerHeight * scale); gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(uR, cv.width, cv.height); draw(performance.now()); }
  addEventListener('pointermove', e => { tmx = e.clientX * scale; tmy = e.clientY * scale; if (mx < -999) { mx = tmx; my = tmy; } }, { passive: true });
  const hero = document.querySelector('.hero');
  const covered = () => { if (!hero) return false; const r = hero.getBoundingClientRect(); return r.top <= 0 && r.bottom >= innerHeight; };
  function draw(now) {
    sc += (scrollY / innerHeight - sc) * (reduce ? 1 : .08); mx += (tmx - mx) * .1; my += (tmy - my) * .1;
    gl.uniform1f(uT, reduce ? 0 : now / 1000); gl.uniform1f(uS, sc); gl.uniform2f(uM, mx, cv.height - my);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  let last = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden || covered() || document.body.classList.contains('locked')) return;
    if (now - last < 33) return; last = now; // ~30 fps es suficiente para el fondo
    draw(now);
  }
  addEventListener('resize', resize); resize();
  if (reduce) addEventListener('scroll', () => draw(0), { passive: true }); else requestAnimationFrame(loop);
}
