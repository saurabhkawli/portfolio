/* ==========================================================================
   Adventure — the word that opens, stamps, the photo journal, postcards
   ========================================================================== */
(() => {
  const SK = window.SK || {};
  const anim = !!SK.hasST && !SK.reduceMotion;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Hero: ADVEN | TURE splits open onto Kumbhalgarh ---------- */
  const hero = $("[data-adv-hero]");
  if (hero && anim) {
    const halfL = $(".adv-hero__half--l", hero);
    const halfR = $(".adv-hero__half--r", hero);
    gsap.from([halfL, halfR], { yPercent: 40, opacity: 0, duration: 1.6, ease: "expo.out", stagger: 0.12, delay: 0.2 });
    gsap.from(".adv-hero__photo", { opacity: 0, scale: 0.85, duration: 1.8, ease: "expo.out", delay: 0.35 });
    gsap.from(".adv-hero__note", { opacity: 0, y: 30, duration: 1.2, ease: "expo.out", delay: 0.9 });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 0.7 },
    });
    tl.to(halfL, { xPercent: -125 }, 0)
      .to(halfR, { xPercent: 125 }, 0)
      .fromTo(".adv-hero__photo", {
        clipPath: window.innerWidth <= 600 ? "inset(30% 20% 30% 20% round 14px)" : "inset(32% 38% 32% 38% round 14px)",
      }, { clipPath: "inset(0% 0% 0% 0% round 0px)" }, 0)
      .to(".adv-hero__photo img", { scale: 1 }, 0)
      .to(".adv-hero__note, .adv-hero__meta", { opacity: 0, y: -40, duration: 0.35 }, 0)
      .to(".adv-hero__caption", { opacity: 1, duration: 0.3 }, 0.7);
  }

  /* ---------- Tally counters ---------- */
  $$(".tally b").forEach((b) => {
    const target = parseInt(b.textContent, 10);
    if (!anim || !target) return;
    const o = { v: 0 };
    b.textContent = "00";
    ScrollTrigger.create({
      trigger: b, start: "top 90%", once: true,
      onEnter: () => gsap.to(o, { v: target, duration: 1.6, ease: "power2.out", onUpdate: () => { b.textContent = String(Math.round(o.v)).padStart(2, "0"); } }),
    });
  });

  /* ---------- Passport stamps thump down ---------- */
  const stamps = $$(".stamp");
  if (stamps.length && anim) {
    gsap.set(stamps, { opacity: 0 });
    $$(".passport__page").forEach((page) => {
      const set = $$(".stamp", page);
      ScrollTrigger.create({
        trigger: page, start: "top 72%", once: true,
        onEnter: () => {
          gsap.fromTo(set, { scale: 1.9, opacity: 0 }, {
            scale: 1, opacity: 0.9, duration: 0.42, ease: "power4.in",
            stagger: {
              each: 0.22,
              onComplete() {
                gsap.fromTo(page, { y: 0 }, { y: 3, duration: 0.05, yoyo: true, repeat: 1, ease: "power1.out" });
              },
            },
          });
        },
      });
    });
  }

  /* ---------- Photo journal: horizontal on desktop ---------- */
  const track = $(".journal__track");
  if (track && anim) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      gsap.to(track, {
        x: () => -dist(), ease: "none",
        scrollTrigger: {
          trigger: ".journal", pin: ".journal__pin", start: "top top", end: () => "+=" + dist(),
          scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        },
      });
    });
  }

  /* ---------- Lightbox for polaroids ---------- */
  const lb = $("[data-lightbox]");
  if (lb) {
    const lbImg = $("img", lb);
    const lbCap = $(".lightbox__cap", lb);
    let lastFocus = null;
    const close = () => {
      lb.hidden = true;
      if (SK.lenis) SK.lenis.start();
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    };
    const open = (fig) => {
      const img = $("img", fig);
      const cap = $("figcaption", fig);
      lastFocus = fig;
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = cap ? cap.childNodes[0].textContent.trim() : "";
      lb.hidden = false;
      if (SK.lenis) SK.lenis.stop();
      $(".lightbox__close", lb).focus({ preventScroll: true });
      if (anim) gsap.fromTo(lbImg, { scale: 0.92, rotate: -2, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.6, ease: "expo.out" });
    };
    $$("[data-zoom]").forEach((fig) => {
      fig.tabIndex = 0;
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", "Enlarge photo: " + ($("img", fig).alt || ""));
      fig.addEventListener("click", () => open(fig));
      fig.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(fig); } });
    });
    lb.addEventListener("click", close);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) close(); });
  }

  /* ---------- Field notes: a postcard follows the cursor ---------- */
  const postcard = $(".postcard");
  if (postcard && SK.finePointer && SK.hasGSAP) {
    const pImg = $("img", postcard);
    const pEmoji = $("span", postcard);
    const xTo = gsap.quickTo(postcard, "left", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(postcard, "top", { duration: 0.5, ease: "power3.out" });
    window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
    $$(".note").forEach((n) => {
      n.addEventListener("pointerenter", () => {
        if (n.dataset.img) {
          pImg.hidden = false;
          if (pImg.getAttribute("src") !== n.dataset.img) pImg.src = n.dataset.img;
          pEmoji.textContent = "";
        } else {
          pImg.hidden = true;
          pEmoji.textContent = n.dataset.emoji || "✦";
        }
        postcard.classList.add("is-on");
      });
      n.addEventListener("pointerleave", () => postcard.classList.remove("is-on"));
    });
    const hideIfIdle = () => { if (!$(".note:hover")) postcard.classList.remove("is-on"); };
    if (SK.lenis) SK.lenis.on("scroll", hideIfIdle);
    else window.addEventListener("scroll", hideIfIdle, { passive: true });
  }

  /* ---------- Notes & passes slide in ---------- */
  if (anim) {
    ScrollTrigger.batch(".note", {
      start: "top 90%", once: true,
      onEnter: (batch) => gsap.from(batch, { opacity: 0, y: 40, duration: 0.9, ease: "expo.out", stagger: 0.06 }),
    });
  }

  if (anim) {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }
})();
