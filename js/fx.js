/* Distorsión/glitch WebGL al pasar el ratón: un único contexto WebGL que se "mueve" al elemento activo. */
const VS = `attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;uv.y=1.-uv.y;gl_Position=vec4(p,0.,1.);}`;
const FS = `precision mediump float;varying vec2 uv;uniform sampler2D t;uniform float time,str;uniform vec2 m,res;
float h(float n){return fract(sin(n)*43758.5453);}
void main(){
  vec2 u=uv; vec2 d=u-m; d.x*=res.x/res.y; float dist=length(d);
  float wave=sin(dist*28.-time*6.)*.012*str*smoothstep(.55,0.,dist);
  u+=normalize(d+1e-4)*wave;
  float row=floor(u.y*24.+floor(time*12.)); float g=step(.9,h(row+floor(time*9.)))*str;
  u.x+=(h(row)-.5)*.08*g;
  float sh=.012*str+g*.02;
  vec3 c=vec3(texture2D(t,u+vec2(sh,0.)).r,texture2D(t,u).g,texture2D(t,u-vec2(sh,0.)).b);
  c+=vec3(0.,.35,.6)*smoothstep(.35,0.,dist)*str*.35;
  c*=1.-.08*str*step(.5,fract(uv.y*res.y*.25));
  gl_FragColor=vec4(c,1.);
}`;
export function initFx({ enabled }) {
  const noop = { bind() {} };
  if (!enabled) return noop;
  const cv = document.createElement('canvas'); cv.id = 'fx-canvas'; cv.setAttribute('aria-hidden', 'true');
  let gl;
  try { gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false }); } catch { gl = null; }
  if (!gl) return noop;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return noop;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = n => gl.getUniformLocation(pr, n), uT = U('time'), uS = U('str'), uM = U('m'), uR = U('res');
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  let active = null, str = 0, target = 0, mx = .5, my = .5, raf = 0, t0 = performance.now();
  function upload(el) {
    const img = el.querySelector('img'); if (!img || !img.complete || !img.naturalWidth) return false;
    const r = el.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 1.5);
    const W = Math.max(2, Math.round(r.width * dpr)), H = Math.max(2, Math.round(r.height * dpr));
    off.width = W; off.height = H; cv.width = W; cv.height = H;
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight), w = img.naturalWidth * s, h = img.naturalHeight * s;
    octx.fillStyle = '#02040a'; octx.fillRect(0, 0, W, H); octx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, off);
    gl.viewport(0, 0, W, H); gl.uniform2f(uR, W, H); return true;
  }
  function loop() {
    str += (target - str) * .12;
    gl.uniform1f(uT, (performance.now() - t0) / 1000); gl.uniform1f(uS, str); gl.uniform2f(uM, mx, my);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    if (target === 0 && str < .01) { cv.style.display = 'none'; raf = 0; return; }
    raf = requestAnimationFrame(loop);
  }
  function enter(el) {
    if (!upload(el)) return;
    active = el; el.appendChild(cv); cv.style.display = 'block'; target = 1; if (!raf) raf = requestAnimationFrame(loop);
  }
  return {
    bind(root) {
      root.querySelectorAll('.fx').forEach(el => {
        if (el._fx) return; el._fx = 1;
        el.addEventListener('mouseenter', () => enter(el));
        el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; });
        el.addEventListener('mouseleave', () => { if (active === el) target = 0; });
      });
    }
  };
}
