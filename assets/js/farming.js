/* ==========================================================================
   Farming — sunrise, a plant grown by scrolling, seasons, FarmOS
   ========================================================================== */
(() => {
  const SK = window.SK || {};
  const anim = !!SK.hasST && !SK.reduceMotion;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Sunrise ---------- */
  if (anim && $("[data-f-hero]")) {
    gsap.from(".f-sun", { yPercent: 160, duration: 2.8, ease: "power2.out", delay: 0.2 });
    gsap.from(".f-land", { yPercent: 30, duration: 2, ease: "expo.out", delay: 0.1 });
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: "[data-f-hero]", start: "top top", end: "bottom top", scrub: 0.6 },
    })
      .to(".f-sun", { y: () => -window.innerHeight * 0.42, scale: 0.8 }, 0)
      .to(".f-sky", { "--day": 1 }, 0)
      .to(".f-hill--3", { y: -30 }, 0)
      .to(".f-hill--2", { y: -60 }, 0)
      .to(".f-trees", { y: -60 }, 0)
      .to(".f-hero__copy", { y: -120, opacity: 0 }, 0);
  }

  /* ---------- Seed to harvest ---------- */
  const grow = $("[data-grow]");
  if (grow) {
    const stages = $$(".stage", grow);
    const sigil = $(".grow__sigil", grow);
    const meter = $(".grow__meter", grow);
    const dayEl = $("[data-grow-day]", grow);
    const thresholds = [0, 0.12, 0.32, 0.55, 0.84];
    let current = 0;
    const setStage = (p) => {
      let i = 0;
      thresholds.forEach((t, k) => { if (p >= t) i = k; });
      if (i !== current) {
        stages[current].classList.remove("is-on");
        stages[i].classList.add("is-on");
        current = i;
      }
      if (sigil) sigil.classList.toggle("is-buried", p < 0.22);
      meter.style.setProperty("--gp", p.toFixed(3));
      dayEl.textContent = p >= 0.995 ? "Harvest · Day 90" : `Day ${Math.round(p * 90)}`;
    };

    if (anim) {
      const draw = (el) => {
        const len = el.getTotalLength();
        el.style.strokeDasharray = `${len} ${len}`;
        el.style.strokeDashoffset = len;
        return el;
      };
      const roots = $$(".plant__roots path", grow).map(draw);
      const stem = draw($(".plant__stem", grow));
      const leaves = $$(".leaf", grow);
      gsap.set(leaves, { scale: 0 });
      gsap.set(".plant__flower", { scale: 0, rotation: -120 });
      gsap.set(".plant__seed", { scale: 0.4, transformOrigin: "50% 50%" });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: grow, start: "top top", end: "bottom bottom", scrub: 0.6,
          onUpdate: (self) => setStage(self.progress),
        },
      });
      tl.to(".plant__seed", { scale: 1, duration: 0.8 }, 0)
        .to(roots, { strokeDashoffset: 0, duration: 1.6, stagger: 0.25 }, 0.8)
        .to(stem, { strokeDashoffset: 0, duration: 3.6 }, 2.8)
        .to(leaves, { scale: 1, duration: 0.9, stagger: 0.7, ease: "back.out(1.6)" }, 3.4)
        .to(".plant__flower", { scale: 1, rotation: 0, duration: 1.8, ease: "back.out(1.2)" }, 6.6)
        .to(".plant__glow", { opacity: 1, duration: 1.4 }, 8.2)
        .to({}, { duration: 0.6 });
    } else {
      stages.forEach((s) => s.classList.add("is-on"));
      setStage(1);
    }
  }

  /* ---------- Seasons ---------- */
  const SEASONS = {
    kharif: {
      emoji: "🌧️",
      when: "Monsoon · sown June–July · harvested September–October",
      title: "The rain crops",
      text: "When the monsoon arrives, the whole country turns green. Kharif crops love heat and plenty of water — the first rain is the starting gun.",
      crops: ["Rice", "Maize", "Cotton", "Soybean", "Jowar", "Bajra", "Groundnut"],
    },
    rabi: {
      emoji: "🌾",
      when: "Winter · sown October–December · harvested March–April",
      title: "The winter crops",
      text: "Sown as the monsoon retreats, rabi crops grow through the cool, dry winter on stored moisture and irrigation — and turn the fields gold by spring.",
      crops: ["Wheat", "Gram", "Mustard", "Barley", "Peas", "Lentil"],
    },
    zaid: {
      emoji: "🍉",
      when: "Summer · between rabi and kharif · March–June",
      title: "The summer sprint",
      text: "A short, hot season squeezed between the two big ones — mostly fast-growing fruits, vegetables and fodder on irrigated land.",
      crops: ["Watermelon", "Muskmelon", "Cucumber", "Bitter gourd", "Fodder"],
    },
  };
  const seasonsEl = $(".seasons");
  if (seasonsEl) {
    const tabs = $$("[data-tab]", seasonsEl);
    const body = $(".season-body", seasonsEl);
    const f = (k) => $(`[data-s=${k}]`, body);
    const emoji = $("[data-season-emoji]", seasonsEl);
    const show = (id, focus) => {
      const s = SEASONS[id];
      seasonsEl.dataset.season = id;
      tabs.forEach((t) => {
        const on = t.dataset.tab === id;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      const fill = () => {
        f("when").textContent = s.when;
        f("title").textContent = s.title;
        f("text").textContent = s.text;
        f("crops").innerHTML = s.crops.map((c) => `<li>${c}</li>`).join("");
        emoji.textContent = s.emoji;
      };
      if (!anim) { fill(); return; }
      gsap.to([body, emoji], {
        opacity: 0, y: 12, duration: 0.25, ease: "power2.in",
        onComplete: () => {
          fill();
          gsap.to([body, emoji], { opacity: 1, y: 0, duration: 0.6, ease: "expo.out" });
          gsap.from($$("li", f("crops")), { opacity: 0, y: 10, duration: 0.5, stagger: 0.04, ease: "expo.out" });
        },
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => show(t.dataset.tab));
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
        show(n.dataset.tab, true);
      });
    });
  }

  /* ---------- FarmOS: a simulated smart farm ---------- */
  const os = $("[data-farmos]");
  if (!os) return;
  const q = (k) => $(`[data-f=${k}]`, os);
  const gauge = $("[data-f-gauge]", os);
  const tankEl = $("[data-f-tank]", os);
  const pumpBtn = $("[data-f-pump]", os);
  const autoBox = $("[data-f-auto]", os);
  const mapEl = $("[data-f-map]", os);
  const logEl = $("[data-f-log]", os);
  const clockEl = $("[data-f-clock]", os);
  const micBtn = $("[data-f-mic]", os);
  const micLabel = $("[data-f-mic-label]", os);
  const heardEl = $("[data-f-heard]", os);

  const S = { moisture: 37, tank: 74, pump: false, auto: true, pumpTicks: 0, temp: 28, hum: 60, lux: 0 };
  const hist = { temp: [], hum: [], lux: [] };
  const nodes = Array.from({ length: 40 }, (_, i) => {
    const el = document.createElement("i");
    mapEl.appendChild(el);
    return { el, off: Math.sin(i * 12.9898) * 9, col: i % 8 };
  });

  const pad = (n) => String(n).padStart(2, "0");
  const stamp = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };
  function log(msg, cls = "") {
    const li = document.createElement("li");
    if (cls) li.className = cls;
    li.innerHTML = `<time>${stamp()}</time><span></span>`;
    li.lastChild.textContent = msg;
    logEl.prepend(li);
    while (logEl.children.length > 9) logEl.lastChild.remove();
    if (anim) gsap.from(li, { opacity: 0, x: -10, duration: 0.5, ease: "expo.out" });
  }

  function setPump(on, reason) {
    if (S.pump === on) return;
    S.pump = on;
    S.pumpTicks = 0;
    pumpBtn.setAttribute("aria-pressed", on ? "true" : "false");
    q("pumpState").textContent = on ? "ON" : "OFF";
    log(`Pump ${on ? "ON" : "OFF"} · ${reason}`, "is-act");
  }

  function spark(key, max) {
    const pts = hist[key];
    const line = $(`[data-spark=${key}]`, os);
    if (!line || pts.length < 2) return;
    const lo = Math.min(...pts), hi = Math.max(...pts), span = Math.max(hi - lo, max * 0.05);
    line.setAttribute("points", pts.map((v, i) => `${(i / (pts.length - 1)) * 200},${46 - ((v - lo) / span) * 42}`).join(" "));
  }

  function sample() {
    const now = new Date();
    const h = now.getHours() + now.getMinutes() / 60;
    const noise = () => (Math.random() - 0.5);
    S.temp = 25 + 7 * Math.sin(((h - 9) / 24) * Math.PI * 2) + noise() * 0.4;
    S.hum = Math.min(96, Math.max(25, 82 - (S.temp - 20) * 2.6 + noise() * 1.5));
    S.lux = Math.max(0, Math.sin(((h - 6) / 12) * Math.PI) * 82000 + (h > 6 && h < 18 ? noise() * 2500 : 0));
    ["temp", "hum", "lux"].forEach((k) => { hist[k].push(S[k]); if (hist[k].length > 40) hist[k].shift(); });
  }

  function step() {
    sample();
    if (S.pump) {
      S.pumpTicks++;
      S.moisture += 2.3;
      S.tank -= 0.7;
    } else {
      S.moisture -= 0.42 + Math.max(0, S.temp - 24) * 0.03;
      S.tank += 0.12;
    }
    S.moisture = Math.min(95, Math.max(8, S.moisture));
    S.tank = Math.min(100, Math.max(0, S.tank));

    if (S.auto) {
      if (!S.pump && S.moisture < 30) { log(`Moisture ${Math.round(S.moisture)}% — below threshold`, "is-warn"); setPump(true, "auto"); }
      else if (S.pump && S.moisture > 62) { log(`Moisture ${Math.round(S.moisture)}% — target reached`); setPump(false, "auto"); }
    }
    if (S.pump && S.tank < 8) { log("Tank almost empty — stopping to protect the pump", "is-warn"); setPump(false, "safety"); }
    render();
  }

  function render() {
    const m = Math.round(S.moisture);
    q("moisture").textContent = m;
    gauge.style.setProperty("--m", (S.moisture / 100).toFixed(3));
    const dry = S.moisture < 30;
    gauge.classList.toggle("is-dry", dry);
    const st = q("moistureState");
    st.textContent = dry ? "Thirsty — needs water" : S.moisture > 70 ? "Saturated" : "Optimal";
    st.classList.toggle("is-dry", dry);
    q("temp").textContent = S.temp.toFixed(1);
    q("hum").textContent = Math.round(S.hum);
    q("lux").textContent = S.lux < 50 ? "0" : new Intl.NumberFormat("en-IN").format(Math.round(S.lux / 100) * 100);
    q("tank").textContent = Math.round(S.tank);
    tankEl.style.setProperty("--t", S.tank.toFixed(1) + "%");
    spark("temp", 40); spark("hum", 100); spark("lux", 90000);
    nodes.forEach((n, i) => {
      const wave = S.pump && S.pumpTicks > n.col ? 6 : 0;
      const v = Math.min(100, Math.max(0, S.moisture + n.off + wave));
      const hue = 36 + (v / 100) * 130;
      n.el.style.setProperty("--h", hue.toFixed(0));
      n.el.style.setProperty("--l", (28 + (v / 100) * 12).toFixed(0) + "%");
      n.el.classList.toggle("is-wet", wave > 0);
      n.el.title = `node-${pad(i + 1)} · ${Math.round(v)}%`;
    });
  }

  pumpBtn.addEventListener("click", () => {
    if (S.auto) { S.auto = false; autoBox.checked = false; log("Manual override — auto mode paused"); }
    setPump(!S.pump, "manual");
    render();
  });
  autoBox.addEventListener("change", () => {
    S.auto = autoBox.checked;
    log(`Auto mode ${S.auto ? "armed · threshold 30%" : "off"}`);
  });

  /* Voice — real speech recognition where the browser supports it, a demo otherwise */
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  let demoIdx = 0;
  function speak(text) {
    try {
      if (!("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-IN"; u.rate = 1.02;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  function command(text, spoken) {
    const t = text.toLowerCase();
    heardEl.textContent = `Heard: “${text}”`;
    if (/(pump|water|motor).*(on|start)|start.*(pump|water)|irrigate/.test(t)) {
      S.auto = false; autoBox.checked = false;
      setPump(true, "voice");
      if (spoken) speak("Pump on. Watering the field.");
    } else if (/(pump|water|motor).*(off|stop)|stop/.test(t)) {
      S.auto = false; autoBox.checked = false;
      setPump(false, "voice");
      if (spoken) speak("Pump off.");
    } else if (/status|report|how/.test(t)) {
      const msg = `Soil moisture is ${Math.round(S.moisture)} percent. Pump is ${S.pump ? "on" : "off"}. Tank at ${Math.round(S.tank)} percent.`;
      log(`Status · moisture ${Math.round(S.moisture)}% · tank ${Math.round(S.tank)}%`);
      if (spoken) speak(msg);
    } else {
      log(`Voice: “${text}” — not a command I know yet`, "is-warn");
    }
    render();
  }
  function demo() {
    const cmds = S.pump ? ["pump off", "status"] : ["pump on", "status"];
    const text = cmds[demoIdx++ % 2];
    micBtn.classList.add("is-listening");
    micLabel.textContent = "Listening… (demo)";
    let i = 0;
    heardEl.textContent = "";
    const type = setInterval(() => {
      heardEl.textContent = "“" + text.slice(0, ++i);
      if (i >= text.length) {
        clearInterval(type);
        setTimeout(() => {
          micBtn.classList.remove("is-listening");
          micLabel.textContent = "Tap & say “pump on”";
          command(text, false);
        }, 350);
      }
    }, 70);
  }
  let rec = null;
  micBtn.addEventListener("click", () => {
    if (!Rec || location.protocol === "file:") { demo(); return; }
    try {
      rec = new Rec();
      rec.lang = "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      let got = false;
      rec.onresult = (e) => { got = true; command(e.results[0][0].transcript, true); };
      rec.onerror = () => { if (!got) demo(); };
      rec.onend = () => { micBtn.classList.remove("is-listening"); micLabel.textContent = "Tap & say “pump on”"; };
      micBtn.classList.add("is-listening");
      micLabel.textContent = "Listening…";
      rec.start();
    } catch (e) { demo(); }
  });

  /* Run only while visible */
  log("Node mesh online · 40/40 sensors reporting");
  log("Auto-irrigation armed · threshold 30%");
  for (let i = 0; i < 24; i++) sample();
  render();
  let timer = null;
  const tickClock = () => { clockEl.textContent = stamp(); };
  tickClock();
  setInterval(tickClock, 1000);
  const start = () => { if (!timer) timer = setInterval(step, 1200); };
  const stop = () => { clearInterval(timer); timer = null; };
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => (es[0].isIntersecting ? start() : stop()), { threshold: 0.1 }).observe(os);
  } else start();
})();
