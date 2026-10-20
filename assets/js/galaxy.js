/* ==========================================================================
   A spiral galaxy in raw WebGL — ~60k additive point sprites, a dusty
   nebula layer and a twinkling star dome. No dependencies.
   Usage: const g = SKGalaxy(canvas); g.state.R = 8;  (tween state freely)
   ========================================================================== */
window.SKGalaxy = function SKGalaxy(canvas, opts = {}) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, depth: false, powerPreference: "high-performance" });
  if (!gl) return null;

  const small = window.matchMedia("(max-width: 760px)").matches;
  const P = Object.assign({
    count: small ? 24000 : 58000,
    stars: small ? 2200 : 4200,
    dust: small ? 380 : 800,
    radius: 6,
    branches: 4,
    spin: 1.08,
    randomness: 0.46,
    power: 2.4,
    inside: [1.0, 0.62, 0.34],
    outside: [0.32, 0.42, 1.0],
    bg: [0.02, 0.024, 0.04],
  }, opts);

  const state = {
    R: 10.5, el: 0.42, az: 0.6, shiftX: 0, shiftY: 0, bright: 1, rotSpeed: 0.035,
    mx: 0, my: 0, parallax: 1,
  };

  /* ---------- Shaders ---------- */
  const VS = `
    attribute vec3 aPos;
    attribute vec3 aColor;
    attribute vec2 aMisc;
    uniform mat4 uPV;
    uniform float uTime, uPR, uRot, uSizeK, uBright, uMaxSize;
    varying vec3 vColor;
    varying float vA;
    void main() {
      float c = cos(uRot), s = sin(uRot);
      vec3 p = vec3(aPos.x * c - aPos.z * s, aPos.y, aPos.x * s + aPos.z * c);
      vec4 clip = uPV * vec4(p, 1.0);
      gl_Position = clip;
      float tw = 0.7 + 0.3 * sin(uTime * (0.8 + aMisc.y * 2.4) + aMisc.y * 61.0);
      gl_PointSize = clamp(aMisc.x * uPR * uSizeK / max(clip.w, 0.001), 1.0, uMaxSize);
      vColor = aColor;
      vA = tw * uBright;
    }`;
  const FS = `
    precision mediump float;
    varying vec3 vColor;
    varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      a *= a;
      gl_FragColor = vec4(vColor * a * vA, 1.0);
    }`;

  function shader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
  gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return null; }
  gl.useProgram(prog);

  const loc = {
    aPos: gl.getAttribLocation(prog, "aPos"),
    aColor: gl.getAttribLocation(prog, "aColor"),
    aMisc: gl.getAttribLocation(prog, "aMisc"),
    uPV: gl.getUniformLocation(prog, "uPV"),
    uTime: gl.getUniformLocation(prog, "uTime"),
    uPR: gl.getUniformLocation(prog, "uPR"),
    uRot: gl.getUniformLocation(prog, "uRot"),
    uSizeK: gl.getUniformLocation(prog, "uSizeK"),
    uBright: gl.getUniformLocation(prog, "uBright"),
    uMaxSize: gl.getUniformLocation(prog, "uMaxSize"),
  };
  const maxPoint = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1] || 64;

  /* ---------- Geometry ---------- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (n = 1) => (Math.random() - 0.5) * 2 * n;
  const signedPow = (p) => Math.pow(Math.random(), p) * (Math.random() < 0.5 ? 1 : -1);

  function makeBuffer(n, fill) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), misc = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) fill(i, pos, col, misc);
    const mk = (arr) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); return b; };
    return { n, pos: mk(pos), col: mk(col), misc: mk(misc) };
  }

  const galaxy = makeBuffer(P.count, (i, pos, col, misc) => {
    const bulge = i % 14 === 0;
    let x, y, z, t;
    if (bulge) {
      const r = Math.pow(Math.random(), 2) * 1.1;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(rnd());
      x = r * Math.sin(ph) * Math.cos(th); z = r * Math.sin(ph) * Math.sin(th); y = r * Math.cos(ph) * 0.55;
      t = r / P.radius;
    } else {
      const r = Math.pow(Math.random(), 1.25) * P.radius;
      const branch = ((i % P.branches) / P.branches) * Math.PI * 2;
      const a = branch + r * P.spin;
      const spread = P.randomness * (0.35 + r * 0.22);
      x = Math.cos(a) * r + signedPow(P.power) * spread;
      z = Math.sin(a) * r + signedPow(P.power) * spread;
      y = signedPow(P.power) * spread * 0.32 * (1.15 - r / P.radius);
      t = r / P.radius;
    }
    pos.set([x, y, z], i * 3);
    let c = [lerp(P.inside[0], P.outside[0], t), lerp(P.inside[1], P.outside[1], t), lerp(P.inside[2], P.outside[2], t)];
    const roll = Math.random();
    if (roll < 0.035) c = [1.0, 0.45, 0.72];
    else if (roll < 0.07) c = [0.9, 0.92, 1.0];
    const k = 0.55 + Math.random() * 0.45;
    col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
    misc[i * 2] = bulge ? 0.7 + Math.random() * 1.1 : 0.35 + Math.pow(Math.random(), 4) * 1.6;
    misc[i * 2 + 1] = Math.random();
  });

  const dust = makeBuffer(P.dust, (i, pos, col, misc) => {
    const r = 0.6 + Math.random() * P.radius * 0.95;
    const branch = ((i % P.branches) / P.branches) * Math.PI * 2;
    const a = branch + r * P.spin + rnd(0.25);
    pos.set([Math.cos(a) * r + rnd(0.5), rnd(0.12), Math.sin(a) * r + rnd(0.5)], i * 3);
    const palette = [[0.45, 0.25, 0.85], [0.25, 0.35, 0.95], [0.85, 0.3, 0.6], [1.0, 0.55, 0.3]];
    const c = palette[r < 1.6 ? 3 : Math.floor(Math.random() * 3)];
    const k = 0.035 + Math.random() * 0.03;
    col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
    misc[i * 2] = 18 + Math.random() * 30;
    misc[i * 2 + 1] = Math.random();
  });

  const stars = makeBuffer(P.stars, (i, pos, col, misc) => {
    const th = Math.random() * Math.PI * 2, ph = Math.acos(rnd());
    const d = 30 + Math.random() * 40;
    pos.set([d * Math.sin(ph) * Math.cos(th), d * Math.cos(ph), d * Math.sin(ph) * Math.sin(th)], i * 3);
    const warm = Math.random();
    const c = warm < 0.15 ? [1.0, 0.82, 0.62] : warm < 0.3 ? [0.7, 0.78, 1.0] : [0.95, 0.95, 1.0];
    const k = 0.4 + Math.random() * 0.6;
    col.set([c[0] * k, c[1] * k, c[2] * k], i * 3);
    misc[i * 2] = 0.5 + Math.pow(Math.random(), 6) * 2.6;
    misc[i * 2 + 1] = Math.random();
  });

  function bind(b) {
    gl.bindBuffer(gl.ARRAY_BUFFER, b.pos); gl.enableVertexAttribArray(loc.aPos); gl.vertexAttribPointer(loc.aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, b.col); gl.enableVertexAttribArray(loc.aColor); gl.vertexAttribPointer(loc.aColor, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, b.misc); gl.enableVertexAttribArray(loc.aMisc); gl.vertexAttribPointer(loc.aMisc, 2, gl.FLOAT, false, 0, 0);
  }

  /* ---------- Matrices (column-major) ---------- */
  function perspective(fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
  }
  function lookAt(e, t, u) {
    let zx = e[0] - t[0], zy = e[1] - t[1], zz = e[2] - t[2];
    let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
    let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx;
    l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return new Float32Array([
      xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
      -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1,
    ]);
  }
  function mul(a, b) {
    const o = new Float32Array(16);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k];
      o[i * 4 + j] = s;
    }
    return o;
  }

  /* ---------- Sizing ---------- */
  let W = 0, H = 0, PR = 1;
  function resize() {
    PR = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    canvas.width = Math.round(W * PR);
    canvas.height = Math.round(H * PR);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- Pointer parallax ---------- */
  let tmx = 0, tmy = 0;
  window.addEventListener("mousemove", (e) => {
    tmx = (e.clientX / window.innerWidth - 0.5) * 2;
    tmy = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  /* ---------- Render loop ---------- */
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(P.bg[0], P.bg[1], P.bg[2], 1);

  let rot = 0, last = performance.now(), running = true, raf = 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || !running) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!reduce) rot += dt * state.rotSpeed;
    state.mx += (tmx - state.mx) * 0.035;
    state.my += (tmy - state.my) * 0.035;

    const az = state.az + state.mx * 0.18 * state.parallax;
    const el = Math.max(0.05, Math.min(1.45, state.el + state.my * 0.08 * state.parallax));
    const eye = [state.R * Math.cos(el) * Math.sin(az), state.R * Math.sin(el), state.R * Math.cos(el) * Math.cos(az)];
    const proj = perspective((55 * Math.PI) / 180, W / H, 0.1, 200);
    proj[8] = state.shiftX;
    proj[9] = state.shiftY;
    const pv = mul(proj, lookAt(eye, [0, 0, 0], [0, 1, 0]));

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(loc.uPV, false, pv);
    gl.uniform1f(loc.uTime, now / 1000);
    gl.uniform1f(loc.uPR, PR);
    gl.uniform1f(loc.uMaxSize, maxPoint);

    bind(stars);
    gl.uniform1f(loc.uRot, rot * 0.25);
    gl.uniform1f(loc.uSizeK, 75);
    gl.uniform1f(loc.uBright, Math.min(1, state.bright * 1.2));
    gl.drawArrays(gl.POINTS, 0, stars.n);

    gl.uniform1f(loc.uRot, rot);
    gl.uniform1f(loc.uBright, state.bright);
    bind(dust);
    gl.uniform1f(loc.uSizeK, 22);
    gl.drawArrays(gl.POINTS, 0, dust.n);
    bind(galaxy);
    gl.drawArrays(gl.POINTS, 0, galaxy.n);
  }
  raf = requestAnimationFrame(frame);

  return {
    state,
    pause() { running = false; },
    play() { running = true; },
    destroy() { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); },
  };
};
