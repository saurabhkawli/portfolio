/* ==========================================================================
   Movies & Music — leader countdown, marquee, JARVIS, spells, Wall-E,
   Pokéball, compass, Moriarty, turntable, post-credit scene
   ========================================================================== */
(() => {
  const SK = window.SK || {};
  const anim = !!SK.hasST && !SK.reduceMotion;
  const html = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Marquee bulbs ---------- */
  const bulbs = $(".bulbs");
  const layBulbs = () => {
    if (!bulbs) return;
    const w = bulbs.clientWidth, h = bulbs.clientHeight;
    const per = 2 * (w + h);
    const n = Math.max(8, Math.round(per / 26 / 2) * 2);
    const step = per / n;
    let out = "";
    for (let i = 0; i < n; i++) {
      let d = i * step, x, y;
      if (d < w) { x = d; y = 0; }
      else if ((d -= w) < h) { x = w; y = d; }
      else if ((d -= h) < w) { x = w - d; y = h; }
      else { d -= w; x = 0; y = h - d; }
      out += `<span class="bulb${i % 2 ? " is-b" : ""}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px"></span>`;
    }
    bulbs.innerHTML = out;
  };
  layBulbs();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layBulbs);
  let resizeT;
  window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(layBulbs, 150); });

  /* ---------- Hero intro: curtains part, title lights up ---------- */
  const title = $("[data-m-title]");
  const chars = title && SK.split ? SK.split(title, "chars") : [];
  if (!anim) chars.forEach((c) => { c.style.transform = "none"; });

  const heroIntro = () => {
    if (!anim) return;
    const open = window.innerWidth <= 600 ? 90 : 82;
    gsap.timeline()
      .fromTo(".curtain--l", { x: 0, xPercent: 0 }, { xPercent: -open, duration: 2.2, ease: "power3.inOut" }, 0)
      .fromTo(".curtain--r", { x: 0, xPercent: 0 }, { xPercent: open, duration: 2.2, ease: "power3.inOut" }, 0)
      .fromTo(".marquee-sign", { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: "expo.out", clearProps: "transform" }, 0.5)
      .fromTo(chars, { y: 0, yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.045, onComplete: () => title.classList.add("is-lit") }, 0.85)
      .fromTo([".marquee-sign__now", ".marquee-sign__sub"], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1, stagger: 0.12, ease: "power2.out" }, 1.25);
  };

  /* ---------- Film leader countdown (once per visit) ---------- */
  const leader = $("[data-leader]");
  let seen = "1";
  try { seen = sessionStorage.getItem("sk-leader"); } catch (e) { /* storage blocked: skip the leader */ }
  const arrived = new Promise((resolve) => {
    if (!html.classList.contains("pt-enter")) return resolve();
    const mo = new MutationObserver(() => {
      if (!html.classList.contains("pt-enter")) { mo.disconnect(); resolve(); }
    });
    mo.observe(html, { attributes: true, attributeFilter: ["class"] });
    setTimeout(() => { mo.disconnect(); resolve(); }, 3000);
  });

  if (leader && anim && !seen) {
    try { sessionStorage.setItem("sk-leader", "1"); } catch (e) { /* ignore */ }
    leader.hidden = false;
    if (SK.lenis) SK.lenis.stop();
    const num = $("[data-leader-num]", leader);
    let n = 3, done = false, iv;
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(iv);
      gsap.timeline({ onComplete: () => { leader.hidden = true; leader.classList.remove("is-running"); } })
        .to(leader, { backgroundColor: "#fff6e2", duration: 0.08 })
        .to(leader, { opacity: 0, duration: 0.5, ease: "power2.in" });
      if (SK.lenis) SK.lenis.start();
      heroIntro();
    };
    leader.addEventListener("click", finish);
    window.addEventListener("keydown", finish, { once: true });
    arrived.then(() => {
      if (done) return;
      leader.classList.add("is-running");
      iv = setInterval(() => {
        n -= 1;
        if (n <= 0) finish();
        else num.textContent = n;
      }, 800);
    });
  } else {
    arrived.then(heroIntro);
  }

  /* ---------- JARVIS ---------- */
  const jarvis = $("[data-jarvis]");
  if (jarvis) {
    if (anim) {
      const bars = $$(".hud-stats i", jarvis);
      bars.forEach((b) => b.style.setProperty("--p", 0));
      ScrollTrigger.create({
        trigger: ".hud-stats", start: "top 85%", once: true,
        onEnter: () => gsap.to(bars, { "--p": 1, duration: 1.8, ease: "expo.out", stagger: 0.15, delay: 0.3 }),
      });
    }

    if (anim && SK.finePointer) {
      const ret = $(".reticle", jarvis);
      const lab = $("i", ret);
      const xTo = gsap.quickTo(ret, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(ret, "y", { duration: 0.5, ease: "power3" });
      jarvis.addEventListener("pointermove", (e) => {
        const r = jarvis.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        xTo(x); yTo(y);
        lab.textContent = `TGT ${String(Math.round(x)).padStart(4, "0")} · ${String(Math.round(y)).padStart(4, "0")}`;
        jarvis.classList.add("is-tracking");
      });
      jarvis.addEventListener("pointerleave", () => jarvis.classList.remove("is-tracking"));
    }

    const reactor = $("[data-reactor]", jarvis);
    const hud = $(".hud", jarvis);
    const consoleEl = $("[data-console]", jarvis);
    const powerEl = $("[data-power]", jarvis);
    const BOOTS = [
      ["Arc reactor output: 400%", "Repulsors: charged", "Flight stabilisers: online", "J.A.R.V.I.S.: Welcome home, sir."],
      ["Running full diagnostics…", "1,024 tests passed · 0 failed", "Flaky tests: none. Naturally.", "J.A.R.V.I.S.: Shall I render the suit, sir?"],
      ["Nanotech housing: online", "Mark LXXXV: assembling", "Snap protocol: armed", "J.A.R.V.I.S.: And you, sir, are Iron Man."],
    ];
    let boot = 0, busy = false;
    const print = (text) => {
      const li = document.createElement("li");
      li.textContent = `> ${text}`;
      consoleEl.appendChild(li);
      while (consoleEl.children.length > 5) consoleEl.firstElementChild.remove();
    };
    const power = { v: 100 };
    const setPower = (v, d) => {
      if (!SK.hasGSAP || SK.reduceMotion) { powerEl.textContent = v; return; }
      gsap.to(power, { v, duration: d, ease: "power2.inOut", onUpdate: () => { powerEl.textContent = Math.round(power.v); } });
    };
    reactor.addEventListener("click", () => {
      if (busy) return;
      busy = true;
      const lines = BOOTS[boot++ % BOOTS.length];
      jarvis.classList.add("is-boost");
      if (SK.hasGSAP && !SK.reduceMotion) {
        gsap.fromTo(reactor, { scale: 1 }, { scale: 1.08, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", clearProps: "transform" });
        gsap.fromTo(hud, { filter: "brightness(1.9)" }, { filter: "brightness(1)", duration: 1.4, ease: "power2.out", clearProps: "filter" });
      }
      setPower(400, 1.4);
      lines.forEach((l, i) => setTimeout(() => print(l), 250 + i * 520));
      setTimeout(() => {
        jarvis.classList.remove("is-boost");
        setPower(100, 1.2);
        busy = false;
      }, 250 + lines.length * 520 + 1400);
    });
  }

  /* ---------- Marvel: collect the stones ---------- */
  const marvel = $(".uni--marvel");
  if (marvel) {
    const label = $("[data-stone-label]", marvel);
    const got = new Set();
    const collect = (s) => {
      if (got.size === 6) return;
      s.classList.add("is-on");
      got.add(s);
      if (got.size === 6) {
        label.textContent = "6 / 6 — “And I… am… Iron Man.”";
        marvel.classList.add("is-complete");
      } else {
        label.textContent = `${s.dataset.stone} · ${got.size} / 6`;
      }
    };
    $$(".stone", marvel).forEach((s) => {
      ["pointerenter", "focus", "click"].forEach((ev) => s.addEventListener(ev, () => collect(s)));
    });
  }

  /* ---------- Harry Potter: spells ---------- */
  const hp = $("[data-hp]");
  if (hp) {
    const msg = $("[data-hp-msg]", hp);
    const floaters = [".hp__bolt", ".uni__tag", "h3"].map((s) => $(s, hp));
    let lev = null;
    const say = (t) => {
      msg.textContent = t;
      if (anim) gsap.fromTo(msg, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
    };
    hp.addEventListener("pointermove", (e) => {
      const r = hp.getBoundingClientRect();
      hp.style.setProperty("--wx", `${e.clientX - r.left}px`);
      hp.style.setProperty("--wy", `${e.clientY - r.top}px`);
    });
    $$("[data-spell]", hp).forEach((b) => {
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => {
        const on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", String(on));
        const spell = b.dataset.spell;
        if (spell === "lumos") {
          hp.classList.toggle("is-lumos", on);
          say(on ? "Lumos! ✨" : "Nox.");
        } else if (spell === "leviosa") {
          if (anim) {
            if (lev) lev.kill();
            lev = on
              ? gsap.to(floaters, { y: -18, rotation: (i) => [8, -2, 1][i], duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.2 })
              : gsap.to(floaters, { y: 0, rotation: 0, duration: 0.8, ease: "power2.out" });
          }
          say(on ? "It's Levi-O-sa, not Levio-SAR." : "…and gently back down.");
        } else if (spell === "map") {
          hp.classList.toggle("is-map", on);
          b.textContent = on ? "Mischief managed" : "I solemnly swear…";
          say(on ? "I solemnly swear that I am up to no good." : "Mischief managed.");
        }
      });
    });
  }

  /* ---------- Wall-E rolls across on scroll ---------- */
  const scene = $(".walle__scene");
  if (scene && anim) {
    const track = $(".walle__track", scene);
    const eve = $(".eve", scene);
    const dist = () => Math.max(0, scene.clientWidth * 0.9 - eve.getBoundingClientRect().width - track.offsetLeft - track.offsetWidth - 12);
    gsap.timeline({
      scrollTrigger: { trigger: scene, start: "top 85%", end: "bottom 35%", scrub: 0.8, invalidateOnRefresh: true },
    })
      .fromTo(track, { x: 0 }, { x: dist, ease: "none", duration: 1 }, 0)
      .fromTo(".walle", { y: 0 }, { y: -3, duration: 0.05, ease: "sine.inOut", repeat: 15, yoyo: true }, 0)
      .fromTo(".walle__eyes", { rotation: 6 }, { rotation: -8, transformOrigin: "50% 100%", duration: 0.15, ease: "power2.out" }, 0.82)
      .fromTo(".walle__say", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.08 }, 0.86)
      .fromTo(".walle__heart", { opacity: 0, scale: 0.3, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.1, ease: "back.out(3)" }, 0.92);
  }

  /* ---------- Naruto & Pokémon ---------- */
  const naruto = $("[data-clone]");
  if (naruto) naruto.addEventListener("click", () => naruto.classList.toggle("is-clones"));
  const ball = $("[data-pokeball]");
  if (ball) {
    const card = ball.closest(".poke");
    ball.addEventListener("click", () => {
      const open = card.classList.toggle("is-open");
      ball.setAttribute("aria-label", open ? "Close the Pokéball" : "Open the Pokéball");
    });
  }

  /* ---------- Jack's compass ---------- */
  const jack = $("[data-compass-card]");
  const needle = $("[data-needle]");
  if (jack && needle && SK.hasGSAP) {
    const compass = $(".compass", jack);
    const note = $("[data-compass-note]", jack);
    const rotTo = gsap.quickTo(needle, "rotation", { duration: SK.reduceMotion ? 0.01 : 1.1, ease: "elastic.out(1, 0.45)" });
    let cur = 0, idleT = null, tracking = false;
    const point = (deg) => {
      const d = ((((deg - cur) % 360) + 540) % 360) - 180;
      cur += d;
      rotTo(cur);
    };
    const settleNorth = () => {
      tracking = false;
      point(Math.random() * 8 - 4);
      note.textContent = "Left alone, it always swings north. Make of that what you will.";
    };
    if (!SK.finePointer) note.textContent = "Watch where it settles.";
    if (SK.finePointer) {
      window.addEventListener("pointermove", (e) => {
        const r = jack.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const c = compass.getBoundingClientRect();
        point((Math.atan2(e.clientY - (c.top + c.height / 2), e.clientX - (c.left + c.width / 2)) * 180) / Math.PI + 90);
        if (!tracking) { tracking = true; note.textContent = "It's pointing at you. Interesting…"; }
        clearTimeout(idleT);
        idleT = setTimeout(settleNorth, 2600);
      }, { passive: true });
    }
    const wander = () => {
      [130, -70, 210].forEach((a, i) => setTimeout(() => { if (!tracking) point(a); }, i * 650));
      setTimeout(() => { if (!tracking) settleNorth(); }, 2100);
    };
    if (SK.hasST) ScrollTrigger.create({ trigger: jack, start: "top 70%", once: true, onEnter: wander });
    else settleNorth();
  }

  /* ---------- Sherlock: did you miss me? ---------- */
  const sherlock = $("[data-miss]");
  if (sherlock) {
    const glitch = () => {
      if (sherlock.classList.contains("is-glitch")) return;
      sherlock.classList.add("is-glitch");
    };
    $(".miss", sherlock).addEventListener("animationend", () => sherlock.classList.remove("is-glitch"));
    ["pointerenter", "click", "focus"].forEach((ev) => sherlock.addEventListener(ev, glitch));
  }

  /* ---------- Turntable ---------- */
  const music = $(".music");
  const play = $("[data-play]");
  if (music && play) {
    const label = $("[data-play-label]", play);
    play.addEventListener("click", () => {
      const on = !music.classList.contains("is-playing");
      music.classList.toggle("is-playing", on);
      play.setAttribute("aria-pressed", String(on));
      label.textContent = on ? "Lift the needle" : "Drop the needle";
    });
  }

  /* ---------- Post-credit scene ---------- */
  const pc = $("[data-postcredit]");
  if (pc) {
    const lines = $$("[data-pc-line]", pc);
    const sigil = $(".postcredit__sigil", pc);
    if (anim) {
      ScrollTrigger.create({
        trigger: pc, start: "top 55%", once: true,
        onEnter: () => {
          pc.classList.add("is-on");
          gsap.timeline({ delay: 0.6 })
            .fromTo(lines.slice(0, 3), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.2, ease: "power2.out", stagger: 0.9 })
            .fromTo(sigil, { opacity: 0, scale: 0.4 }, { opacity: 0.22, scale: 1, duration: 1, ease: "back.out(2)", clearProps: "opacity,transform" }, "-=0.4")
            .fromTo(lines.slice(3), { opacity: 0, letterSpacing: "0.3em" }, { opacity: 1, letterSpacing: "0.08em", duration: 1.6, ease: "expo.out" }, "+=0.5");
        },
      });
    } else {
      pc.classList.add("is-on");
    }
  }
})();
