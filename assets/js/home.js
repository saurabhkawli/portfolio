/* ==========================================================================
   Home page choreography
   ========================================================================== */
(() => {
  const SK = window.SK;
  const { reduceMotion, hasGSAP, hasST, lenis, split } = SK;
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const anim = hasGSAP && !reduceMotion;

  /* ---------- Galaxy ---------- */
  const canvas = $("#galaxy");
  const galaxy = window.SKGalaxy ? window.SKGalaxy(canvas) : null;
  if (!galaxy) canvas.style.display = "none";
  const base = { R: 10.5, el: 0.42, az: 0.6, bright: 1 };
  let heroP = 0, pageP = 0;

  function updateCamera() {
    if (!galaxy) return;
    const G = galaxy.state;
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const endP = smooth(0.86, 1, pageP);
    const wide = window.innerWidth > 900;
    G.R = base.R * (1 - 0.38 * heroP) + endP * 7;
    G.el = base.el + 0.5 * heroP - 0.62 * endP;
    G.az = base.az + pageP * 3.1;
    G.shiftX = (wide ? -0.5 : 0) * heroP * (1 - endP);
    G.shiftY = (wide ? 0 : -0.25) * heroP * (1 - endP);
    G.bright = base.bright * (1 - 0.5 * heroP + 0.4 * endP);
  }

  if (galaxy && hasST) {
    ScrollTrigger.create({ trigger: ".hero", start: "top top", end: "bottom top", onUpdate: (s) => { heroP = s.progress; } });
    ScrollTrigger.create({ trigger: "main", start: "top top", end: "bottom bottom", onUpdate: (s) => { pageP = s.progress; } });
  }
  if (hasGSAP) gsap.ticker.add(updateCamera);
  else updateCamera();

  /* ---------- Hero + intro ---------- */
  const intro = $("#intro");
  const hero = $(".hero");
  const heroChars = $$("[data-hero-chars]").flatMap((el) => split(el, "chars"));
  const heroFades = $$("[data-hero-fade], .hero__top");
  if (anim) {
    gsap.set(heroChars, { yPercent: 115 });
    gsap.set(heroFades, { opacity: 0, y: 24 });
  }
  if (hero) hero.classList.add("is-ready");

  function playHero(delay = 0) {
    if (!anim) return;
    gsap.to(heroChars, { yPercent: 0, duration: 1.7, ease: "expo.out", stagger: 0.05, delay });
    gsap.to(heroFades, { opacity: 1, y: 0, duration: 1.3, ease: "expo.out", stagger: 0.08, delay: delay + 0.55 });
  }

  let skipIntro = !anim || !!location.hash || html.classList.contains("pt-enter");
  try { if (sessionStorage.getItem("sk-intro")) skipIntro = true; } catch (e) { /* ignore */ }

  if (skipIntro) {
    intro.classList.add("is-done");
    playHero(html.classList.contains("pt-enter") ? 0.7 : 0.15);
  } else {
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
    document.body.classList.add("is-intro");
    base.R = 44; base.el = 0.16; base.bright = 0.3;
    const countEl = $("[data-intro-count]", intro);
    const counter = { v: 0 };
    gsap.to(counter, {
      v: 100, duration: 2.4, ease: "power2.inOut",
      onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(3, "0"); },
      onComplete: () => { intro.classList.add("is-ready"); armEnter(); },
    });
    gsap.to(base, { R: 32, bright: 0.45, duration: 2.6, ease: "power2.out" });
  }

  function armEnter() {
    const btn = $(".intro__enter", intro);
    let done = false, near = false;
    const hover = (e) => {
      const dx = e.clientX - window.innerWidth / 2, dy = e.clientY - window.innerHeight / 2;
      const on = Math.hypot(dx, dy) < Math.min(window.innerWidth, window.innerHeight) * 0.3;
      if (on === near) return;
      near = on;
      intro.classList.toggle("is-near", on);
      gsap.to(base, { bright: on ? 0.75 : 0.45, R: on ? 29 : 32, duration: 1.2, ease: "power3.out", overwrite: true });
    };
    const go = (e) => {
      if (done) return;
      if (e && e.type === "keydown" && !["Enter", " ", "ArrowDown", "PageDown"].includes(e.key)) return;
      done = true;
      window.removeEventListener("wheel", go);
      window.removeEventListener("touchmove", go);
      window.removeEventListener("keydown", go);
      intro.removeEventListener("pointermove", hover);
      enter();
    };
    btn.addEventListener("click", go);
    intro.addEventListener("pointermove", hover);
    window.addEventListener("wheel", go, { passive: true });
    window.addEventListener("touchmove", go, { passive: true });
    window.addEventListener("keydown", go);
  }

  function enter() {
    try { sessionStorage.setItem("sk-intro", "1"); } catch (e) { /* ignore */ }
    const tl = gsap.timeline();
    intro.classList.add("is-leaving");
    tl.to(base, { R: 22, bright: 0.9, duration: 1.1, ease: "expo.in", overwrite: true }, 0)
      .to(".intro__top, .intro__bottom", { opacity: 0, y: 10, duration: 0.5 }, 0)
      .to(".intro__flash", { opacity: 1, scale: 180, duration: 1, ease: "expo.in" }, 0.4)
      .add(() => gsap.to(base, { R: 10.5, el: 0.42, bright: 1, duration: 3.4, ease: "expo.out" }), 1.1)
      .to(intro, { opacity: 0, duration: 1, ease: "power2.out" }, 1.25)
      .add(() => playHero(0), 1.35)
      .add(() => document.body.classList.remove("is-intro"), 1.6)
      .add(() => {
        intro.classList.add("is-done");
        document.body.style.overflow = "";
        if (lenis) lenis.start();
      }, 2.2);
  }

  /* ---------- Role rotator ---------- */
  const roles = $$(".rotator span");
  if (roles.length) {
    let ri = 0;
    roles[0].classList.add("is-on");
    if (!reduceMotion) {
      setInterval(() => {
        const prev = roles[ri];
        ri = (ri + 1) % roles.length;
        const next = roles[ri];
        prev.classList.remove("is-on");
        prev.classList.add("is-out");
        next.classList.remove("is-out");
        void next.offsetWidth;
        next.classList.add("is-on");
        setTimeout(() => prev.classList.remove("is-out"), 900);
      }, 2800);
    }
  }

  /* ---------- Navigation ---------- */
  const nav = $("#nav");
  let lastY = 0;
  const onScroll = (y) => {
    nav.classList.toggle("is-solid", y > 40);
    if (y > 300 && y > lastY + 4) nav.classList.add("is-hidden");
    else if (y < lastY - 4 || y < 300) nav.classList.remove("is-hidden");
    lastY = y;
  };
  if (lenis) lenis.on("scroll", (l) => onScroll(l.scroll));
  else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });

  if (hasST) {
    ["about", "work", "origins", "beyond", "next"].forEach((id) => {
      const link = $(`.nav__links a[href="#${id}"]`);
      const sec = document.getElementById(id);
      if (!link || !sec) return;
      ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%", onToggle: (s) => link.classList.toggle("is-active", s.isActive) });
    });
  }

  const burger = $(".nav__burger");
  const menu = $("#menu");
  const setMenu = (open) => {
    burger.setAttribute("aria-expanded", String(open));
    menu.classList.toggle("is-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener("click", () => setMenu(burger.getAttribute("aria-expanded") !== "true"));
  $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  const clock = $("[data-clock]");
  const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick();
  setInterval(tick, 15000);

  /* ---------- Stats ---------- */
  $$("[data-count]").forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const from = parseInt(el.dataset.from || "0", 10);
    const pad = parseInt(el.dataset.pad || "1", 10);
    const show = (v) => { el.textContent = String(Math.round(v)).padStart(pad, "0"); };
    if (!anim || !hasST) { show(target); return; }
    show(from);
    const o = { v: from };
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => gsap.to(o, { v: target, duration: 2, ease: "power3.out", onUpdate: () => show(o.v) }) });
  });

  /* ---------- Marquee (speeds up with scroll velocity) ---------- */
  const mTrack = $(".marquee__track");
  if (mTrack) {
    mTrack.innerHTML += mTrack.innerHTML;
    if (!reduceMotion && hasGSAP) {
      let x = 0;
      gsap.ticker.add((t, dt) => {
        const vel = lenis ? lenis.velocity : 0;
        const dir = lenis && lenis.direction ? lenis.direction : 1;
        const speed = 0.045 + Math.min(Math.abs(vel), 80) * 0.01;
        x -= speed * dt * dir;
        const w = mTrack.scrollWidth / 2;
        if (w > 0) { if (-x >= w) x += w; if (x > 0) x -= w; }
        mTrack.style.transform = `translate3d(${x}px, 0, 0)`;
      });
    }
  }

  /* ---------- Skills: a comet shower (replaces the marquee) ---------- */
  const sky = $(".comets__sky");
  if (sky && anim) {
    const section = sky.closest(".comets");
    const skills = $$(".comets__list li", section).map((li) => li.textContent.trim());
    const hint = $("[data-comet-hint]", section);
    section.classList.add("is-flying");

    const small = window.innerWidth < 700;
    const LAYERS = [
      { cls: "is-near", speed: 0.1, n: small ? 2 : 3 },
      { cls: "is-mid", speed: 0.068, n: small ? 3 : 4 },
      { cls: "is-far", speed: 0.042, n: small ? 3 : 5 },
    ];
    const ANGLE = 4;
    const TAN = Math.tan((ANGLE * Math.PI) / 180);
    const LANES = small ? 6 : 8;
    const laneLast = new Map();
    const comets = [];
    let W = 0, H = 0, si = Math.floor(Math.random() * skills.length), visible = false;

    const laneY = (lane) => {
      const drift = (W / 2) * TAN;
      const top = drift + 56, bottom = H - drift - 16;
      return top + ((bottom - top) * (lane + 0.5)) / LANES;
    };
    const measure = () => {
      W = sky.clientWidth; H = sky.clientHeight;
      comets.forEach((c) => { c.len = c.el.offsetWidth; c.ext = Math.max(c.len, c.label.offsetWidth + c.hs + 12); });
    };

    // Labels sit above their comet, so the lane just above a big label only carries the faint far comets.
    LAYERS.forEach((l) => { l.lanes = []; });
    for (let i = 0; i < LANES; i++) LAYERS[[2, 0, 1][i % 3]].lanes.push(i);

    const spawn = (c, x, lane) => {
      if (c.exploding) return;
      if (lane === undefined) {
        const free = c.layer.lanes.filter((i) => {
          const o = laneLast.get(c.layer.cls + i);
          return !o || o === c || !o.live || o.x - o.ext > 60;
        });
        if (!free.length) return;
        lane = free[Math.floor(Math.random() * free.length)];
      }
      c.lane = lane;
      laneLast.set(c.layer.cls + lane, c);
      c.label.textContent = skills[si++ % skills.length];
      c.el.dataset.hue = String(Math.floor(Math.random() * 3));
      c.el.classList.remove("is-exploding", "is-caught");
      c.len = c.el.offsetWidth;
      c.ext = Math.max(c.len, c.label.offsetWidth + c.hs + 12);
      c.k = 0.85 + Math.random() * 0.3;
      c.x = x === undefined ? -10 - Math.random() * 140 : x;
      c.live = true;
      c.exploding = false;
      c.respawnAt = 0;
      c.el.style.visibility = "visible";
      c.el.style.opacity = "";
    };

    const explode = (c) => {
      if (!c.live || c.exploding) return;
      c.exploding = true;
      c.live = false;
      c.hover = false;
      c.el.classList.add("is-exploding", "is-caught");

      const head = c.el.querySelector(".comet__head");
      const hr = head.getBoundingClientRect();
      const sr = sky.getBoundingClientRect();
      const ox = hr.left + hr.width / 2 - sr.left;
      const oy = hr.top + hr.height / 2 - sr.top;
      const glow = getComputedStyle(c.el).getPropertyValue("--glow").trim() || "rgba(255,178,107,0.8)";
      const count = c.layer.cls === "is-near" ? 28 : c.layer.cls === "is-mid" ? 20 : 12;

      for (let i = 0; i < count; i++) {
        const p = document.createElement("i");
        p.className = `comet-burst${i % 3 === 0 ? " is-spark" : ""}`;
        p.style.setProperty("--burst", glow);
        p.style.left = `${ox}px`;
        p.style.top = `${oy}px`;
        sky.appendChild(p);
        const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const dist = 40 + Math.random() * (c.layer.cls === "is-near" ? 120 : 80);
        gsap.to(p, {
          x: Math.cos(ang) * dist,
          y: Math.sin(ang) * dist - 10 - Math.random() * 30,
          scale: 0.15 + Math.random() * 0.5,
          opacity: 0,
          duration: 0.55 + Math.random() * 0.45,
          ease: "power3.out",
          onComplete: () => p.remove(),
        });
      }
      const flash = document.createElement("i");
      flash.className = "comet-burst";
      flash.style.cssText = `left:${ox}px;top:${oy}px;width:18px;height:18px;margin:-9px 0 0 -9px;--burst:${glow}`;
      sky.appendChild(flash);
      gsap.fromTo(flash, { scale: 0.4, opacity: 1 }, {
        scale: 4.5, opacity: 0, duration: 0.55, ease: "power2.out", onComplete: () => flash.remove(),
      });

      gsap.to(c.el, {
        opacity: 0, duration: 0.2, ease: "power2.in",
        onComplete: () => {
          c.el.style.visibility = "hidden";
          c.el.classList.remove("is-exploding", "is-caught");
          c.respawnAt = performance.now() + 450 + Math.random() * 550;
          c.exploding = false;
        },
      });
    };

    const seed = () => {
      LAYERS.forEach((layer) => {
        const mine = comets.filter((c) => c.layer === layer);
        const shift = Math.random();
        mine.forEach((c, i) => {
          const slot = ((i + shift) % mine.length + 0.5 + (Math.random() - 0.5) * 0.4) / mine.length;
          spawn(c, W * (0.12 + slot * 0.86), layer.lanes[i % layer.lanes.length]);
        });
      });
    };

    LAYERS.slice().reverse().forEach((layer) => {
      for (let i = 0; i < layer.n; i++) {
        const el = document.createElement("div");
        el.className = `comet ${layer.cls}`;
        el.innerHTML = '<span class="comet__body"><i class="comet__tail"></i><i class="comet__dust" aria-hidden="true"></i><b class="comet__head"></b></span><span class="comet__label"></span>';
        sky.appendChild(el);
        const c = { el, layer, label: el.querySelector(".comet__label"), hs: 0, x: 0, lane: 0, len: 0, ext: 0, k: 1, mult: 1, hover: false, live: false, exploding: false, respawnAt: 0 };
        c.hs = el.querySelector(".comet__head").offsetWidth || 6;
        el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") c.hover = true; });
        el.addEventListener("pointerleave", () => { c.hover = false; });
        el.addEventListener("click", (e) => { e.preventDefault(); explode(c); });
        comets.push(c);
      }
    });
    measure();
    seed();
    window.addEventListener("resize", measure);
    if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(sky);
    else visible = true;

    gsap.ticker.add((t, dt) => {
      if (!visible || document.hidden) return;
      const vel = lenis ? Math.min(Math.abs(lenis.velocity || 0), 60) : 0;
      const boost = 1 + vel * 0.035;
      const now = performance.now();
      for (const c of comets) {
        if (c.exploding) continue;
        if (!c.live) {
          if (c.respawnAt && now < c.respawnAt) continue;
          c.respawnAt = 0;
          spawn(c);
          continue;
        }
        const held = c.hover;
        c.el.classList.toggle("is-caught", held);
        c.mult += ((held ? 0.03 : boost) - c.mult) * 0.08;
        c.x += c.layer.speed * c.k * c.mult * Math.min(dt, 64);
        if (c.x - c.ext > W + 20) {
          c.live = false;
          c.hover = false;
          c.el.style.visibility = "hidden";
          continue;
        }
        const y = laneY(c.lane) + (c.x - W / 2) * TAN;
        c.el.style.transform = `translate3d(${(c.x - c.len).toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${ANGLE}deg)`;
      }
    });
  }

  /* ---------- Work: pinned horizontal scroll on desktop ---------- */
  $$(".viz-devices i").forEach((i) => i.style.setProperty("--d", `${(Math.random() * 3.6).toFixed(2)}s`));

  if (hasST && !reduceMotion) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      const pin = $(".work__pin");
      const track = $(".work__track");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: pin, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, refreshPriority: 1, anticipatePin: 1 },
      });
      gsap.to(".work__progress span", { scaleX: 1, ease: "none", scrollTrigger: { trigger: pin, start: "top top", end: () => `+=${dist()}`, scrub: true, invalidateOnRefresh: true } });
      $$(".panel").forEach((p) => {
        gsap.fromTo(p, { opacity: 0.35, scale: 0.9, rotate: 1.5 }, {
          opacity: 1, scale: 1, rotate: 0, ease: "power2.out",
          scrollTrigger: { trigger: p, containerAnimation: tween, start: "left 100%", end: "left 55%", scrub: true },
        });
      });
    });
  }

  /* ---------- Terminal ---------- */
  const term = $("[data-term]");
  const LINES = [
    { t: "$ sk-test run --suite regression --platform android,ios --cloud browserstack", c: "p", type: true },
    { t: "› Resolving device matrix ............ 4 device profiles", c: "dim" },
    { t: "› Booting real-device sessions in parallel ... done", c: "dim" },
    { t: "  Pixel 8 · Android 15 ............... 142 passed", c: "ok" },
    { t: "  Galaxy S24 · Android 14 ............ 142 passed", c: "ok" },
    { t: "  iPhone 15 · iOS 17 ................. 142 passed  (1 auto-healed ✦)", c: "ok" },
    { t: "  iPad Air · iPadOS 17 ............... 142 passed", c: "ok" },
    { t: "› AI triage: locator 'login_button' changed → healed, fix PR opened", c: "ai" },
    { t: "› Publishing report → GitHub Actions summary", c: "dim" },
    { t: "✔ 568 passed · 0 failed · 0 flaky — build is green. Ship it.", c: "ok" },
  ];
  function runTerminal() {
    let li = 0;
    term.innerHTML = "";
    const cursor = document.createElement("span");
    cursor.className = "cursor-blink";
    const next = () => {
      if (li >= LINES.length) {
        const p = document.createElement("span");
        p.className = "p";
        p.textContent = "$ ";
        term.appendChild(p);
        term.appendChild(cursor);
        setTimeout(runTerminal, 9000);
        return;
      }
      const L = LINES[li++];
      const span = document.createElement("span");
      span.className = L.c;
      term.appendChild(span);
      term.appendChild(cursor);
      if (L.type) {
        let ci = 0;
        const typeIt = () => {
          span.textContent = L.t.slice(0, ++ci);
          if (ci < L.t.length) setTimeout(typeIt, 18 + Math.random() * 30);
          else { span.textContent += "\n"; setTimeout(next, 500); }
        };
        typeIt();
      } else {
        span.textContent = `${L.t}\n`;
        setTimeout(next, 260 + Math.random() * 380);
      }
    };
    next();
  }
  if (term) {
    if (reduceMotion || !hasST) term.innerHTML = LINES.map((l) => `<span class="${l.c}">${l.t}</span>`).join("\n");
    else ScrollTrigger.create({ trigger: term, start: "top 80%", once: true, onEnter: runTerminal });
  }

  /* ---------- Origins ---------- */
  if (hasST && !reduceMotion) {
    gsap.to(".timeline__line span", { scaleY: 1, ease: "none", scrollTrigger: { trigger: ".timeline", start: "top 70%", end: "bottom 60%", scrub: true } });
  } else {
    const l = $(".timeline__line span");
    if (l) l.style.transform = "none";
  }

  // Desktop: each column stacks its own cards (masonry), so a short card never stretches to match its neighbour.
  const timeline = $(".timeline");
  if (timeline && "ResizeObserver" in window) {
    const cards = $$(":scope > .tl", timeline);
    const wide = window.matchMedia("(min-width: 901px)");
    let refreshT = 0;
    const pack = () => {
      const on = wide.matches;
      timeline.classList.toggle("is-packed", on);
      cards.forEach((c) => {
        c.style.gridRowEnd = on ? `span ${Math.ceil(c.offsetHeight + parseFloat(getComputedStyle(c).marginTop) + 40)}` : "";
      });
      if (hasST) { clearTimeout(refreshT); refreshT = setTimeout(() => ScrollTrigger.refresh(), 200); }
    };
    new ResizeObserver(pack).observe(timeline);
    cards.forEach((c) => new ResizeObserver(pack).observe(c));
    pack();
  }

  const speech = $(".car__speech");
  if (speech && !reduceMotion) {
    const cmds = ["“Go forward.”", "“Turn left.”", "“Faster!”", "“Stop.”", "“Go forward.”"];
    let ci = 0;
    setInterval(() => {
      speech.style.opacity = 0;
      setTimeout(() => { ci = (ci + 1) % cmds.length; speech.textContent = cmds[ci]; speech.style.opacity = 1; }, 400);
    }, 1750);
  }

  const onScreen = (el, start, stop) => {
    if (!("IntersectionObserver" in window)) { start(); return; }
    new IntersectionObserver((e) => (e[0].isIntersecting ? start() : stop()), { threshold: 0.15 }).observe(el);
  };
  // Runs `step` every `ms` while `el` is on screen; returns a function that restarts the clock.
  const cycle = (el, ms, step) => {
    let id = 0, on = false;
    const start = () => { on = true; clearInterval(id); id = setInterval(step, ms); };
    onScreen(el, start, () => { on = false; clearInterval(id); id = 0; });
    return () => { if (on) start(); };
  };
  const swap = (items, from, to, cls = "is-out") => {
    if (from === to) return;
    const prev = items[from];
    prev.classList.remove("is-on");
    prev.classList.add(cls);
    setTimeout(() => prev.classList.remove(cls), 750);
    items[to].classList.remove(cls);
    items[to].classList.add("is-on");
  };

  const duo = $("[data-duo]");
  if (duo && !reduceMotion) {
    const code = $("[data-duo-code]", duo);
    const out = $("[data-duo-out]", duo);
    const tabs = $$(".duo__tab", duo);
    const SNIPS = [
      [["k", "def "], ["f", "greet"], ["", "(name):\n    "], ["k", "return "], ["s", 'f"Hello, {name}!"'], ["", "\n\n"], ["f", "print"], ["", "(greet("], ["s", '"universe"'], ["", "))"]],
      [["k", "class "], ["f", "Hello"], ["", " {\n  "], ["k", "public static void "], ["f", "main"], ["", "(String[] a) {\n    System.out."], ["f", "println"], ["", "("], ["s", '"Hello, universe!"'], ["", ");\n  }\n}"]],
    ];
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const total = (parts) => parts.reduce((a, p) => a + p[1].length, 0);
    const render = (parts, n) => {
      let left = n, h = "";
      for (const [c, t] of parts) {
        if (left <= 0) break;
        const piece = esc(t.slice(0, left));
        left -= t.length;
        h += c ? `<span class="${c}">${piece}</span>` : piece;
      }
      return h;
    };
    let si = 0, n = 0, timer = 0, running = false;
    const step = () => {
      if (!running) return;
      const parts = SNIPS[si];
      if (n === 0) {
        tabs.forEach((t, i) => t.classList.toggle("is-on", i === si));
        duo.classList.remove("is-done");
      }
      n = Math.min(total(parts), n + (Math.random() < 0.35 ? 2 : 1));
      code.innerHTML = render(parts, n) + '<i class="duo__caret"></i>';
      if (n >= total(parts)) {
        duo.classList.add("is-done");
        out.textContent = "› Hello, universe!";
        n = 0;
        si = (si + 1) % SNIPS.length;
        timer = setTimeout(step, 2800);
      } else timer = setTimeout(step, 26 + Math.random() * 46);
    };
    onScreen(duo, () => { if (!running) { running = true; step(); } }, () => { running = false; clearTimeout(timer); });
  }

  const deck = $("[data-deck]");
  if (deck) {
    const slides = $$(".deck__slide", deck);
    const chips = $$("[data-slide]", deck.closest(".tl"));
    const no = $("[data-deck-no]", deck);
    const bar = $(".deck__bar b", deck);
    let di = 0;
    const show = (i) => {
      swap(slides, di, i);
      di = i;
      no.textContent = String(i + 1).padStart(2, "0");
      bar.style.width = `${((i + 1) / slides.length) * 100}%`;
      chips.forEach((c, ci) => c.classList.toggle("is-on", ci === i));
    };
    const restart = reduceMotion ? () => {} : cycle(deck, 2800, () => show((di + 1) % slides.length));
    chips.forEach((c, ci) => c.addEventListener("click", () => { show(ci); restart(); }));
  }

  const droid = $("[data-droid]");
  if (droid) {
    const apps = $$(".app", droid);
    const items = $$(".droid__apps li", droid);
    let ai = 0;
    const show = (i) => {
      swap(apps, ai, i);
      items[ai].classList.remove("is-on");
      void items[i].offsetWidth;
      items[i].classList.add("is-on");
      ai = i;
    };
    const restart = reduceMotion ? () => {} : cycle(droid, 4000, () => show((ai + 1) % apps.length));
    items.forEach((li, i) => li.addEventListener("click", () => { if (i !== ai) show(i); restart(); }));
  }

  const field = $("[data-field]");
  if (field && !reduceMotion) {
    const hud = $("[data-field-hud]", field);
    const MSGS = [
      ["Zone A · moisture 41% · healthy", false],
      ["Zone B · moisture 22% · watering", true],
      ["Zone C · nitrogen low · fertilising", true],
      ["Farmer notified ✓ · crop is happy", false],
    ];
    let fi = 0;
    cycle(field, 2600, () => {
      fi = (fi + 1) % MSGS.length;
      hud.parentNode.style.opacity = 0;
      setTimeout(() => {
        hud.textContent = MSGS[fi][0];
        field.classList.toggle("is-alert", MSGS[fi][1]);
        hud.parentNode.style.opacity = 1;
      }, 350);
    });
  }

  const mesh = $("[data-mesh] svg");
  if (mesh && reduceMotion && mesh.pauseAnimations) mesh.pauseAnimations();

  const eye = $(".eye");
  if (eye && anim) {
    const parts = $$(".eye__lid, .eye__iris, .eye__pupil", eye);
    const bar = $(".eye__meter b i", eye);
    const label = $("[data-ear]", eye);
    const o = { s: 1 };
    const paint = () => {
      gsap.set(parts, { scaleY: Math.max(0.06, o.s) });
      const ear = 0.31 * o.s;
      bar.style.width = `${Math.max(4, o.s * 80)}%`;
      const drowsy = ear < 0.12;
      eye.classList.toggle("is-alert", drowsy);
      label.textContent = `${ear.toFixed(2)} · ${drowsy ? "drowsy — ALERT!" : "awake"}`;
    };
    const blink = () => gsap.timeline().to(o, { s: 0.06, duration: 0.09, ease: "power2.in", onUpdate: paint }).to(o, { s: 1, duration: 0.16, ease: "power2.out", onUpdate: paint });
    const tl = gsap.timeline({ repeat: -1, delay: 1 });
    tl.add(blink(), 1.4).add(blink(), 3.6).add(blink(), 4.1)
      .to(o, { s: 0.35, duration: 1.2, ease: "sine.inOut", onUpdate: paint }, 6)
      .to(o, { s: 0.05, duration: 0.6, ease: "sine.in", onUpdate: paint }, 7.4)
      .to(o, { s: 1, duration: 0.35, ease: "back.out(2)", onUpdate: paint }, 9.4)
      .add(() => {}, 10.5);
    ScrollTrigger.create({ trigger: eye, start: "top bottom", end: "bottom top", onToggle: (s) => (s.isActive ? tl.play() : tl.pause()) });
  }

  /* ---------- Next orbit: planets that tell you who I am ---------- */
  const orbit = $("[data-orbit]");
  if (orbit) {
    const tip = $(".orbit__tip", orbit);
    const planets = $$(".orbit__planet", orbit);
    const ohint = $("[data-orbit-hint]");
    if (ohint && !SK.finePointer) ohint.textContent = "✦ Tap a planet to meet a part of me";
    let active = null, hideT = 0, lastPointer = "mouse";

    const place = (p) => {
      const o = orbit.getBoundingClientRect(), r = p.getBoundingClientRect();
      const cx = r.left + r.width / 2 - o.left, cy = r.top + r.height / 2 - o.top;
      const tw = tip.offsetWidth, th = tip.offsetHeight, gap = 22;
      let x = null, y;
      if (cx + gap + tw <= o.width) x = cx + gap;
      else if (cx - gap - tw >= 0) x = cx - gap - tw;
      if (x !== null) {
        y = Math.max(-10, Math.min(o.height - th + 10, cy - th / 2));
      } else {
        x = Math.max(0, Math.min(o.width - tw, cx - tw / 2));
        y = cy < o.height / 2 ? cy + gap : cy - gap - th;
      }
      tip.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px)`;
    };
    const show = (p) => {
      clearTimeout(hideT);
      if (active && active !== p) { active.classList.remove("is-active"); active.closest(".orbit__ring").classList.remove("is-lit"); }
      active = p;
      p.classList.add("is-active");
      p.closest(".orbit__ring").classList.add("is-lit");
      orbit.classList.add("is-paused");
      tip.style.setProperty("--c", p.style.getPropertyValue("--c"));
      tip.firstChild.textContent = p.dataset.q;
      tip.lastChild.textContent = p.dataset.d;
      place(p);
      tip.classList.add("is-on");
    };
    const hide = (now) => {
      clearTimeout(hideT);
      hideT = setTimeout(() => {
        if (active) { active.classList.remove("is-active"); active.closest(".orbit__ring").classList.remove("is-lit"); }
        active = null;
        orbit.classList.remove("is-paused");
        tip.classList.remove("is-on");
      }, now ? 0 : 260);
    };
    planets.forEach((p) => {
      p.addEventListener("pointerdown", (e) => { lastPointer = e.pointerType; });
      p.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") show(p); });
      p.addEventListener("pointerleave", (e) => { if (e.pointerType === "mouse") hide(); });
      p.addEventListener("click", () => {
        if (lastPointer === "mouse") return;
        if (active === p) hide(true);
        else show(p);
      });
      p.addEventListener("focus", () => { if (p.matches(":focus-visible")) show(p); });
      p.addEventListener("blur", () => { if (active === p && lastPointer !== "touch") hide(); });
    });
    document.addEventListener("pointerdown", (e) => { if (active && !e.target.closest(".orbit__planet")) hide(true); });
    window.addEventListener("resize", () => { if (active) place(active); });
  }

  /* ---------- Astronomy tile: twinkling stars ---------- */
  const tc = $(".tile__stars");
  if (tc) {
    const ctx = tc.getContext("2d");
    let stars = [], visible = false, w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const size = () => {
      w = tc.clientWidth; h = tc.clientHeight;
      tc.width = w * dpr; tc.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: Math.round((w * h) / 2600) }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() ** 3 * 1.6 + 0.3, p: Math.random() * 6.28, s: 0.5 + Math.random() * 2 }));
    };
    const draw = (t) => {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (const s of stars) {
          const a = 0.35 + 0.65 * Math.abs(Math.sin(t / 1000 * s.s + s.p));
          ctx.globalAlpha = a;
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      requestAnimationFrame(draw);
    };
    size();
    window.addEventListener("resize", size);
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }).observe(tc);
    if (reduceMotion) { visible = true; draw(0); visible = false; } else requestAnimationFrame(draw);
  }

  /* ---------- Hobby tiles: subtle tilt ---------- */
  if (SK.finePointer && anim) {
    $$(".tile").forEach((t) => {
      t.addEventListener("mousemove", (e) => {
        const r = t.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(t, { rotateY: x * 5, rotateX: -y * 5, transformPerspective: 1200, duration: 0.8, ease: "power3.out" });
      });
      t.addEventListener("mouseleave", () => gsap.to(t, { rotateY: 0, rotateX: 0, duration: 1, ease: "power3.out" }));
    });
  }

  /* ---------- Shooting stars ---------- */
  if (!reduceMotion && Element.prototype.animate) {
    const shoot = () => {
      if (!document.hidden) {
        const s = document.createElement("div");
        s.className = "shooting-star";
        const angle = 18 + Math.random() * 22;
        s.style.left = `${Math.random() * 70 + 15}vw`;
        s.style.top = `${Math.random() * 40}vh`;
        s.style.transform = `rotate(${angle}deg)`;
        document.body.appendChild(s);
        const dist = 380 + Math.random() * 300;
        s.animate(
          [
            { transform: `rotate(${angle}deg) translateX(0)`, opacity: 0 },
            { opacity: 1, offset: 0.15 },
            { transform: `rotate(${angle}deg) translateX(${dist}px)`, opacity: 0 },
          ],
          { duration: 1100 + Math.random() * 600, easing: "cubic-bezier(.3,.1,.3,1)" }
        ).onfinish = () => s.remove();
      }
      setTimeout(shoot, 5000 + Math.random() * 7000);
    };
    setTimeout(shoot, 4000);
  }

  if (hasST) {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }
})();
