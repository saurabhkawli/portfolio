/* ==========================================================================
   Saurabh Kawli — shared runtime
   Smooth scroll, custom cursor, page transitions, reveal animations.
   Exposes window.SK for page scripts.
   ========================================================================== */
(() => {
  const html = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";

  if (hasST) gsap.registerPlugin(ScrollTrigger);
  if (!hasGSAP || reduceMotion) html.classList.add("no-anim");

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (typeof window.Lenis !== "undefined" && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    if (hasGSAP) {
      if (hasST) lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  function scrollTo(target, opts = {}) {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, ...opts });
    else {
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (typeof target === "number") window.scrollTo({ top: target, behavior: reduceMotion ? "auto" : "smooth" });
      else if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    scrollTo(target, { offset: parseFloat(a.dataset.offset || 0) });
  });

  /* ---------- Text splitting ---------- */
  function split(el, mode = "words") {
    if (el._split) return el._split;
    const out = [];
    if (!el.hasAttribute("aria-label") && mode !== "none") el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "sw";
            w.setAttribute("aria-hidden", "true");
            if (mode === "chars") {
              Array.from(part).forEach((c) => {
                const ch = document.createElement("span");
                ch.className = "sc";
                ch.textContent = c;
                w.appendChild(ch);
                out.push(ch);
              });
            } else {
              const i = document.createElement("span");
              i.className = "sw__i";
              i.textContent = part;
              w.appendChild(i);
              out.push(i);
            }
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.matches(".sigil, br, svg, img, [data-nosplit]")) {
          walk(child);
        }
      });
    };
    walk(el);
    el._split = out;
    return out;
  }

  /* ---------- Reveal animations ---------- */
  function initReveals(scope = document) {
    const els = scope.querySelectorAll("[data-reveal]:not([data-reveal-init])");
    if (!hasST || reduceMotion) {
      els.forEach((el) => el.setAttribute("data-reveal-init", ""));
      return;
    }
    els.forEach((el) => {
      el.setAttribute("data-reveal-init", "");
      const type = el.dataset.reveal || "up";
      const delay = parseFloat(el.dataset.delay || 0);
      const start = el.dataset.start || "top 88%";
      let tween;
      const unmask = () => el.classList.add("is-revealed");
      switch (type) {
        case "words":
        case "lines":
          tween = gsap.fromTo(split(el, "words"), { y: 0, yPercent: 115 }, { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.035, delay, paused: true, onComplete: unmask });
          break;
        case "chars":
          tween = gsap.fromTo(split(el, "chars"), { y: 0, yPercent: 115 }, { yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.022, delay, paused: true, onComplete: unmask });
          break;
        case "fade":
          tween = gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power2.out", delay, paused: true });
          break;
        case "scale":
          tween = gsap.fromTo(el, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.4, ease: "expo.out", delay, paused: true });
          break;
        case "clip":
          tween = gsap.fromTo(el, { opacity: 1, clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.inOut", delay, paused: true });
          break;
        case "stagger":
          gsap.set(el, { opacity: 1 });
          tween = gsap.fromTo(el.children, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: 0.08, delay, paused: true });
          break;
        case "left":
          tween = gsap.fromTo(el, { opacity: 0, x: -60 }, { opacity: 1, x: 0, duration: 1.2, ease: "expo.out", delay, paused: true });
          break;
        case "right":
          tween = gsap.fromTo(el, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 1.2, ease: "expo.out", delay, paused: true });
          break;
        default:
          tween = gsap.fromTo(el, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", delay, paused: true });
      }
      ScrollTrigger.create({ trigger: el, start, once: true, onEnter: () => tween.play() });
    });

    /* Words that light up as you scroll through them */
    scope.querySelectorAll("[data-scrub-words]").forEach((el) => {
      const words = split(el, "words");
      gsap.set(words, { yPercent: 0 });
      gsap.fromTo(words, { opacity: 0.14 }, {
        opacity: 1, ease: "none", stagger: 0.08,
        scrollTrigger: { trigger: el, start: el.dataset.scrubStart || "top 78%", end: el.dataset.scrubEnd || "bottom 50%", scrub: 0.6 },
      });
    });

    /* Simple parallax */
    scope.querySelectorAll("[data-speed]").forEach((el) => {
      const amt = parseFloat(el.dataset.speed) * 100;
      gsap.fromTo(el, { y: -amt }, {
        y: amt, ease: "none",
        scrollTrigger: { trigger: el.closest("[data-speed-root]") || el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (!finePointer || reduceMotion) return;
    const c = document.createElement("div");
    c.className = "cursor is-hidden";
    c.setAttribute("aria-hidden", "true");
    c.innerHTML = '<div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div>';
    document.body.appendChild(c);
    html.classList.add("has-cursor");
    const ring = c.querySelector(".cursor__ring");
    const dot = c.querySelector(".cursor__dot");
    const label = c.querySelector(".cursor__label");
    let mx = -100, my = -100, rx = -100, ry = -100;
    window.addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      c.classList.remove("is-hidden");
    }, { passive: true });
    document.addEventListener("mouseleave", () => c.classList.add("is-hidden"));
    window.addEventListener("mousedown", () => c.classList.add("is-down"));
    window.addEventListener("mouseup", () => c.classList.remove("is-down"));
    const loop = () => {
      rx += (mx - rx) * 0.2;
      ry += (my - ry) * 0.2;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("[data-cursor], a, button, input, select, textarea, label, [role='button']");
      if (!t) { c.classList.remove("is-hover", "has-label"); return; }
      const text = t.getAttribute("data-cursor");
      if (text) { label.textContent = text; c.classList.add("has-label"); c.classList.remove("is-hover"); }
      else { c.classList.add("is-hover"); c.classList.remove("has-label"); }
    });
  }

  /* ---------- Magnetic elements ---------- */
  function initMagnetic(scope = document) {
    if (!finePointer || !hasGSAP || reduceMotion) return;
    scope.querySelectorAll("[data-magnetic]").forEach((el) => {
      const s = parseFloat(el.dataset.magnetic) || 0.3;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * s, y: (e.clientY - r.top - r.height / 2) * s, duration: 0.6, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" }));
    });
  }

  /* ---------- Page transitions ---------- */
  const pt = document.createElement("div");
  pt.className = "pt";
  pt.setAttribute("aria-hidden", "true");
  pt.innerHTML = '<div class="pt__panel"></div><div class="pt__label"></div>';
  document.body.appendChild(pt);
  const ptLabel = pt.querySelector(".pt__label");

  function arrive() {
    if (!html.classList.contains("pt-enter")) return;
    let data = {};
    try { data = JSON.parse(sessionStorage.getItem("sk-pt")) || {}; } catch (e) { /* ignore */ }
    sessionStorage.removeItem("sk-pt");
    ptLabel.textContent = data.label || "";
    const go = () => {
      pt.classList.add("is-revealing");
      html.classList.remove("pt-enter");
      setTimeout(() => pt.classList.remove("is-revealing"), 1100);
    };
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    Promise.race([fontsReady, new Promise((r) => setTimeout(r, 900))]).then(() => requestAnimationFrame(go));
  }

  function leave(href, { color = "#0b0d14", ink = "#ece8e1", label = "" } = {}) {
    try { sessionStorage.setItem("sk-pt", JSON.stringify({ color, ink, label })); } catch (e) { /* ignore */ }
    html.style.setProperty("--pt-color", color);
    html.style.setProperty("--pt-ink", ink);
    ptLabel.textContent = label;
    pt.classList.remove("is-revealing");
    pt.classList.add("is-covering");
    setTimeout(() => { window.location.href = href; }, reduceMotion ? 0 : 880);
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (a.target === "_blank" || a.hasAttribute("download") || a.dataset.noTransition !== undefined) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    let url;
    try { url = new URL(a.href, window.location.href); } catch (err) { return; }
    if (url.protocol !== window.location.protocol || url.host !== window.location.host) return;
    if (url.pathname === window.location.pathname) return;
    if (!/(\.html?|\/)$/.test(url.pathname)) return;
    e.preventDefault();
    leave(url.href, { color: a.dataset.ptColor, ink: a.dataset.ptInk, label: a.dataset.ptLabel });
  });

  window.addEventListener("pageshow", (e) => {
    if (e.persisted) { pt.classList.remove("is-covering", "is-revealing"); html.classList.remove("pt-enter"); }
  });

  /* ---------- Hobby page chrome hides on scroll down ---------- */
  function initChrome() {
    const chrome = document.querySelector(".page-chrome");
    if (!chrome) return;
    let last = 0;
    const onScroll = (y) => {
      if (y > 140 && y > last + 4) chrome.classList.add("is-hidden");
      else if (y < last - 4 || y < 140) chrome.classList.remove("is-hidden");
      last = y;
    };
    if (lenis) lenis.on("scroll", (l) => onScroll(l.scroll));
    else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
  }

  /* ---------- Site config (contact links) ---------- */
  function initSiteConfig() {
    const cfg = window.SITE_CONFIG || {};
    document.querySelectorAll("[data-site]").forEach((el) => {
      const key = el.dataset.site;
      const val = cfg[key];
      if (!val) { el.style.display = "none"; return; }
      if (el.tagName === "A") el.href = key === "email" ? `mailto:${val}` : val;
      if (el.hasAttribute("data-site-text")) el.textContent = key === "email" ? val : el.textContent;
      if (key !== "email" && el.tagName === "A") { el.target = "_blank"; el.rel = "noopener"; }
    });
    document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* ---------- Boot ---------- */
  initCursor();
  initSiteConfig();
  initChrome();
  arrive();
  initReveals();
  initMagnetic();
  if (hasST) {
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  console.log(
    "%c✦ Saurabh Kawli %c SDET · Mobile Automation · AI\n%cHey, inspector. Looking for secrets? The source won't hand them over — explore the site instead. ◬",
    "font:600 14px serif;color:#ffb26b",
    "font:12px monospace;color:#8b9bff",
    "font:12px monospace;color:#9a98a6"
  );

  window.SK = { lenis, split, initReveals, initMagnetic, scrollTo, leave, reduceMotion, finePointer, hasGSAP, hasST };
})();
