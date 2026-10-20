/* ==========================================================================
   Astronomy — rotating sky, long exposure, eyepiece moon, star chart, Voyager
   ========================================================================== */
(() => {
  const { reduceMotion } = window.SK;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const TAU = Math.PI * 2;

  /* ---------- Moon phase (shared) ---------- */
  const SYNODIC = 29.530588853;
  const NEW_MOON_REF = Date.UTC(2000, 0, 6, 18, 14);
  function moonPhase(date = new Date()) {
    const days = (date.getTime() - NEW_MOON_REF) / 86400000;
    const age = ((days % SYNODIC) + SYNODIC) % SYNODIC;
    const p = age / SYNODIC;
    const illum = (1 - Math.cos(TAU * p)) / 2;
    const names = [
      [0.0339, "New Moon"], [0.216, "Waxing Crescent"], [0.284, "First Quarter"], [0.466, "Waxing Gibbous"],
      [0.534, "Full Moon"], [0.716, "Waning Gibbous"], [0.784, "Last Quarter"], [0.966, "Waning Crescent"], [1.01, "New Moon"],
    ];
    const name = names.find(([lim]) => p < lim)[1];
    const toFull = (((0.5 - p) % 1) + 1) % 1 * SYNODIC;
    const toNew = (((1 - p) % 1) + 1) % 1 * SYNODIC;
    return { p, age, illum, name, toFull, toNew };
  }
  const moon = moonPhase();

  /* ---------- Rotating sky + long exposure ---------- */
  const sky = $("#sky");
  const ctx = sky.getContext("2d");
  const trail = document.createElement("canvas");
  const tctx = trail.getContext("2d");
  let W = 0, H = 0, dpr = 1, pole = { x: 0, y: 0 }, stars = [];
  const BG = "#02030a";

  function buildSky() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    sky.width = trail.width = Math.round(W * dpr);
    sky.height = trail.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pole = { x: W * 0.78, y: H * 0.16 };
    const maxR = Math.hypot(Math.max(pole.x, W - pole.x), Math.max(pole.y, H - pole.y)) * 1.02;
    const n = Math.min(1800, Math.round((W * H) / 1000));
    const palette = ["#ffffff", "#ffffff", "#ffffff", "#cfdcff", "#ffe2bf", "#ffd0a8"];
    stars = [];
    for (let i = 0; i < n; i++) {
      stars.push({ r: Math.sqrt(Math.random()) * maxR, th: Math.random() * TAU, s: Math.pow(Math.random(), 5) * 2.2 + 0.5, a: 0.35 + Math.random() * 0.65, c: palette[(Math.random() * palette.length) | 0], tw: 0.6 + Math.random() * 2.4, ph: Math.random() * TAU });
    }
    // Milky Way: a dense band of faint stars crossing the sky
    const bandAngle = 2.2, bandOffset = maxR * 0.38;
    const bx = pole.x + Math.cos(bandAngle) * bandOffset, by = pole.y + Math.sin(bandAngle) * bandOffset;
    const dirA = bandAngle + Math.PI / 2;
    const bandN = Math.min(2600, Math.round((W * H) / 700));
    for (let i = 0; i < bandN; i++) {
      const t = (Math.random() - 0.5) * 2 * maxR * 1.2;
      const g = (Math.random() + Math.random() + Math.random() - 1.5) * maxR * 0.07;
      const x = bx + Math.cos(dirA) * t + Math.cos(bandAngle) * g;
      const y = by + Math.sin(dirA) * t + Math.sin(bandAngle) * g;
      const dx = x - pole.x, dy = y - pole.y;
      stars.push({ r: Math.hypot(dx, dy), th: Math.atan2(dy, dx), s: 0.6 + Math.random() * 0.5, a: 0.12 + Math.random() * 0.3, c: Math.random() < 0.2 ? "#d8c8ff" : "#ffffff", tw: 1 + Math.random(), ph: Math.random() * TAU, band: true });
    }
    stars.push({ r: 0, th: 0, s: 3, a: 1, c: "#fff6e0", tw: 0.5, ph: 0, polaris: true });
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
  }
  buildSky();
  let resizeT;
  window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(buildSky, 150); });

  const OMEGA_IDLE = reduceMotion ? 0 : 0.006;
  const OMEGA_EXPOSE = 0.24;
  const EARTH_OMEGA = TAU / 86164;
  let rot = 0, omega = OMEGA_IDLE, exposing = false, trailAlpha = 0, expStart = 0, expRot = 0, last = performance.now();

  function drawStars(c, t, alphaScale, twinkle) {
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const ang = s.th + rot;
      const x = pole.x + s.r * Math.cos(ang);
      const y = pole.y + s.r * Math.sin(ang);
      if (x < -4 || y < -4 || x > W + 4 || y > H + 4) continue;
      c.globalAlpha = s.a * alphaScale * (twinkle ? 0.65 + 0.35 * Math.sin(t * s.tw + s.ph) : 1);
      c.fillStyle = s.c;
      if (s.s < 1.3) c.fillRect(x, y, s.s, s.s);
      else { c.beginPath(); c.arc(x, y, s.s * 0.6, 0, TAU); c.fill(); }
      if (s.polaris && !exposing) {
        c.globalAlpha = 0.25 * alphaScale;
        c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill();
      }
    }
    c.globalAlpha = 1;
  }

  function skyFrame(now) {
    requestAnimationFrame(skyFrame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const target = exposing ? OMEGA_EXPOSE : OMEGA_IDLE;
    omega += (target - omega) * (exposing ? 0.06 : 0.12);
    rot += omega * dt;
    const t = now / 1000;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    if (exposing) {
      expRot += omega * dt;
      drawStars(tctx, t, 0.22, false);
      ctx.drawImage(trail, 0, 0, W, H);
      const secs = (now - expStart) / 1000;
      exposureBtn.style.setProperty("--p", Math.min(1, secs / 12));
      readout.textContent = `Shutter open · ${secs.toFixed(1)} s`;
      return;
    }
    if (trailAlpha > 0) {
      trailAlpha = Math.max(0, trailAlpha - dt / 3);
      ctx.globalAlpha = trailAlpha;
      ctx.drawImage(trail, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    drawStars(ctx, t, 1 - trailAlpha * 0.85, !reduceMotion);
  }
  requestAnimationFrame(skyFrame);

  const exposureBtn = $("[data-exposure]");
  const readout = $("[data-exposure-readout]");
  function startExposure(e) {
    if (e) e.preventDefault();
    if (exposing) return;
    exposing = true;
    trailAlpha = 0;
    expStart = performance.now();
    expRot = 0;
    exposureBtn.classList.add("is-on");
    tctx.clearRect(0, 0, W, H);
  }
  function stopExposure() {
    if (!exposing) return;
    exposing = false;
    trailAlpha = 1;
    exposureBtn.classList.remove("is-on");
    exposureBtn.style.setProperty("--p", 0);
    const secs = (performance.now() - expStart) / 1000;
    const simulated = expRot / EARTH_OMEGA;
    const h = Math.floor(simulated / 3600), m = Math.round((simulated % 3600) / 60);
    readout.textContent = `${secs.toFixed(1)} s exposure ≈ ${h}h ${String(m).padStart(2, "0")}m of Earth's rotation`;
  }
  exposureBtn.addEventListener("pointerdown", (e) => { exposureBtn.setPointerCapture(e.pointerId); startExposure(e); });
  exposureBtn.addEventListener("pointerup", stopExposure);
  exposureBtn.addEventListener("pointercancel", stopExposure);
  exposureBtn.addEventListener("lostpointercapture", stopExposure);
  exposureBtn.addEventListener("contextmenu", (e) => e.preventDefault());
  exposureBtn.addEventListener("keydown", (e) => { if ((e.key === " " || e.key === "Enter") && !e.repeat) startExposure(e); });
  exposureBtn.addEventListener("keyup", (e) => { if (e.key === " " || e.key === "Enter") stopExposure(); });

  /* ---------- Eyepiece: procedural moon ---------- */
  function seeded(seed) {
    return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  }
  function drawMoon(c, cx, cy, R, phase) {
    const g = c.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.05, cx, cy, R);
    g.addColorStop(0, "#f6f1e6"); g.addColorStop(0.6, "#d6cfc0"); g.addColorStop(1, "#9a9386");
    c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.closePath();
    c.fillStyle = g; c.fill();
    c.clip();

    const maria = [
      [-0.55, -0.05, 0.34, 0.55], [-0.28, -0.42, 0.28, 0.26], [0.18, -0.38, 0.17, 0.16], [0.32, -0.08, 0.21, 0.19],
      [0.68, -0.3, 0.12, 0.1], [0.56, 0.15, 0.14, 0.15], [0.35, 0.3, 0.09, 0.09], [-0.18, 0.38, 0.18, 0.16],
      [-0.48, 0.38, 0.1, 0.1], [0.0, -0.7, 0.42, 0.08], [-0.68, -0.35, 0.16, 0.2],
    ];
    maria.forEach(([x, y, rx, ry]) => {
      for (let k = 0; k < 3; k++) {
        const ox = cx + (x + (k - 1) * rx * 0.25) * R, oy = cy + (y + ((k * 7) % 3 - 1) * ry * 0.2) * R;
        const rr = Math.max(rx, ry) * R * (1 - k * 0.15);
        const mg = c.createRadialGradient(ox, oy, 0, ox, oy, rr);
        mg.addColorStop(0, "rgba(88, 84, 78, 0.42)"); mg.addColorStop(0.7, "rgba(88, 84, 78, 0.28)"); mg.addColorStop(1, "rgba(88, 84, 78, 0)");
        c.fillStyle = mg;
        c.beginPath(); c.ellipse(ox, oy, rx * R, ry * R, 0, 0, TAU); c.fill();
      }
    });

    const rnd = seeded(42);
    for (let i = 0; i < 260; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.97;
      const x = cx + Math.cos(a) * d * R, y = cy + Math.sin(a) * d * R;
      const r = R * (0.004 + Math.pow(rnd(), 3) * 0.04);
      c.fillStyle = "rgba(40, 36, 30, 0.22)";
      c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      c.strokeStyle = "rgba(255, 252, 240, 0.28)";
      c.lineWidth = Math.max(0.6, r * 0.25);
      c.beginPath(); c.arc(x + r * 0.15, y + r * 0.15, r, Math.PI * 0.9, Math.PI * 1.9); c.stroke();
    }
    const tycho = [cx - 0.12 * R, cy + 0.72 * R];
    c.strokeStyle = "rgba(255, 252, 240, 0.07)";
    c.lineWidth = R * 0.012;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + 0.2;
      c.beginPath(); c.moveTo(tycho[0], tycho[1]); c.lineTo(tycho[0] + Math.cos(a) * R * 0.9, tycho[1] + Math.sin(a) * R * 0.9); c.stroke();
    }
    c.fillStyle = "rgba(255, 252, 244, 0.7)";
    c.beginPath(); c.arc(tycho[0], tycho[1], R * 0.022, 0, TAU); c.fill();
    c.fillStyle = "rgba(255, 252, 244, 0.45)";
    c.beginPath(); c.arc(cx - 0.3 * R, cy - 0.12 * R, R * 0.025, 0, TAU); c.fill();

    const limb = c.createRadialGradient(cx, cy, R * 0.6, cx, cy, R);
    limb.addColorStop(0, "rgba(0,0,0,0)"); limb.addColorStop(1, "rgba(0,0,0,0.35)");
    c.fillStyle = limb;
    c.fillRect(cx - R, cy - R, R * 2, R * 2);

    const cosp = Math.cos(TAU * phase);
    const waxing = phase < 0.5;
    const passRight = waxing ? cosp > 0 : cosp < 0;
    c.shadowColor = "rgba(2, 3, 10, 0.9)";
    c.shadowBlur = R * 0.06;
    c.fillStyle = "rgba(2, 3, 10, 0.9)";
    c.beginPath();
    c.arc(cx, cy, R + 2, -Math.PI / 2, Math.PI / 2, waxing);
    c.ellipse(cx, cy, Math.max(0.5, R * Math.abs(cosp)), R + 2, 0, Math.PI / 2, -Math.PI / 2, passRight);
    c.closePath();
    c.fill();
    c.restore();
  }

  const scope = $("[data-scope]");
  const mc = $(".scope__moon");
  const mctx = mc.getContext("2d");
  function paintScope() {
    const r = scope.getBoundingClientRect();
    const d = Math.min(window.devicePixelRatio || 1, 2);
    mc.width = Math.round(r.width * d); mc.height = Math.round(r.height * d);
    mctx.setTransform(d, 0, 0, d, 0, 0);
    mctx.clearRect(0, 0, r.width, r.height);
    const rs = seeded(7);
    for (let i = 0; i < 220; i++) {
      mctx.globalAlpha = 0.2 + rs() * 0.6;
      mctx.fillStyle = "#fff";
      mctx.fillRect(rs() * r.width, rs() * r.height, 1, 1);
    }
    mctx.globalAlpha = 1;
    drawMoon(mctx, r.width / 2, r.height / 2, Math.min(r.width, r.height) * 0.42, moon.p);
  }
  paintScope();
  window.addEventListener("resize", () => { clearTimeout(scope._t); scope._t = setTimeout(paintScope, 150); });

  let lensX = 0.5, lensY = 0.5, tx = 0.5, ty = 0.5, userLens = false, idleT = 0;
  const setTarget = (e) => {
    const r = scope.getBoundingClientRect();
    tx = (e.clientX - r.left) / r.width;
    ty = (e.clientY - r.top) / r.height;
    userLens = true;
    clearTimeout(idleT);
    idleT = setTimeout(() => { userLens = false; }, 2600);
  };
  scope.addEventListener("pointermove", setTarget);
  scope.addEventListener("pointerdown", setTarget);
  let scopeVisible = false;
  new IntersectionObserver((en) => { scopeVisible = en[0].isIntersecting; }).observe(scope);
  const lensLoop = (now) => {
    requestAnimationFrame(lensLoop);
    if (!scopeVisible) return;
    if (!userLens) {
      const t = now / 1000;
      tx = 0.5 + Math.sin(t * 0.35) * 0.16;
      ty = 0.5 + Math.sin(t * 0.52 + 1) * 0.2;
    }
    lensX += (tx - lensX) * (reduceMotion ? 1 : 0.12);
    lensY += (ty - lensY) * (reduceMotion ? 1 : 0.12);
    scope.style.setProperty("--x", `${(lensX * 100).toFixed(2)}%`);
    scope.style.setProperty("--y", `${(lensY * 100).toFixed(2)}%`);
  };
  requestAnimationFrame(lensLoop);

  /* ---------- Tonight panel ---------- */
  (function tonight() {
    const set = (k, v) => { const el = $(`[data-moon="${k}"]`); if (el) el.textContent = v; };
    const fmtDate = (daysAhead) => new Date(Date.now() + daysAhead * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    set("name", moon.name);
    set("illum", `${Math.round(moon.illum * 100)}%`);
    set("age", `${moon.age.toFixed(1)} days`);
    set("full", moon.toFull < 0.6 ? "Tonight" : fmtDate(moon.toFull));
    set("new", moon.toNew < 0.6 ? "Tonight" : fmtDate(moon.toNew));
    const c = Math.cos(TAU * moon.p);
    const waxing = moon.p < 0.5;
    const passRight = waxing ? c > 0 : c < 0;
    const rx = Math.max(0.01, 46 * Math.abs(c)).toFixed(2);
    $(".tonight__shadow").setAttribute("d", `M50 4 A46 46 0 0 ${waxing ? 0 : 1} 50 96 A${rx} 46 0 0 ${passRight ? 0 : 1} 50 4 Z`);
  })();

  /* ---------- Star chart ---------- */
  const bg = $(".chart__bg");
  if (bg) {
    const rs = seeded(99);
    let s = "";
    for (let i = 0; i < 280; i++) s += `<circle cx="${(rs() * 1000).toFixed(1)}" cy="${(rs() * 560).toFixed(1)}" r="${(0.3 + rs() * rs() * 1.3).toFixed(2)}" opacity="${(0.15 + rs() * 0.6).toFixed(2)}"/>`;
    bg.innerHTML = s;
  }
  const INFO = {
    orion: ["Orion · The hunter", "Orion", "Red Betelgeuse at his shoulder, blue-white Rigel at his knee, and three belt stars — Alnitak, Alnilam and Mintaka — in an almost perfect line. Below the belt glows the Orion Nebula, where new stars are being born right now. In Indian skies he is Mriga, the deer; his head is the nakshatra Mrigashira."],
    saptarishi: ["The seven sages", "Saptarishi", "Kratu, Pulaha, Pulastya, Atri, Angiras, Vasishtha and Marichi. Look closely beside Vasishtha and you'll find a faint companion — Arundhati, his wife. Couples are shown this pair at Hindu weddings as a symbol of devotion. The West calls it the Big Dipper."],
    dhruva: ["The steadfast star", "Dhruva", "Follow the two end stars of the Saptarishi and they point straight at Dhruva — Polaris. He is named after the boy whose devotion was so unshakeable that he was given the one place in the sky that never moves. Everything else turns around him — try the long exposure at the top of this page."],
    cassiopeia: ["The queen", "Cassiopeia", "An unmistakable “W” sitting across Dhruva from the Saptarishi. When one is low on the horizon, the other rides high — a clock made of stars."],
    scorpius: ["The scorpion", "Vrishchika", "Scorpius, with red Antares — the nakshatra Jyeshtha — burning at its heart. Antares is so enormous that if it replaced our Sun, it would swallow the orbit of Mars."],
  };
  const cons = $$(".con");
  const info = { k: $('[data-chart="kicker"]'), t: $('[data-chart="title"]'), p: $('[data-chart="text"]') };
  const activate = (g) => {
    cons.forEach((c) => c.classList.toggle("is-on", c === g));
    const d = INFO[g.dataset.con];
    if (!d) return;
    info.k.textContent = d[0]; info.t.textContent = d[1]; info.p.textContent = d[2];
  };
  cons.forEach((g) => {
    g.addEventListener("mouseenter", () => activate(g));
    g.addEventListener("focus", () => activate(g));
    g.addEventListener("click", () => activate(g));
  });

  /* ---------- Lightbox ---------- */
  const lb = $("[data-lightbox]");
  const lbImg = $("img", lb);
  const closeLb = () => { lb.hidden = true; if (window.SK.lenis) window.SK.lenis.start(); };
  $$(".shot").forEach((s) => s.addEventListener("click", () => {
    const img = $("img", s);
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lb.hidden = false;
    if (window.SK.lenis) window.SK.lenis.stop();
  }));
  lb.addEventListener("click", closeLb);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLb(); });

  /* ---------- Voyager 1 live distance ---------- */
  const REF = Date.UTC(2026, 10, 15);
  const LIGHT_DAY_KM = 25902068371;
  const KM_PER_S = 16.95;
  const vEl = $("[data-voyager]");
  const vLight = $("[data-voyager-light]");
  const nf = new Intl.NumberFormat("en-US");
  const vTick = () => {
    const km = LIGHT_DAY_KM + ((Date.now() - REF) / 1000) * KM_PER_S;
    vEl.textContent = nf.format(Math.round(km));
    const secs = km / 299792.458;
    vLight.textContent = `${Math.floor(secs / 3600)}h ${String(Math.floor((secs % 3600) / 60)).padStart(2, "0")}m`;
  };
  vTick();
  setInterval(vTick, reduceMotion ? 5000 : 60);
})();
