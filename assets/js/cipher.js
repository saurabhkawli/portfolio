/* ==========================================================================
   The Cipher — two dream destinations, hidden in twelve fragments.
   Each page contains <button class="sigil" data-fragment="id"></button>
   elements. Finding them reveals letters and clues. Progress is saved
   in localStorage so the hunt continues across pages and visits.
   ========================================================================== */
(() => {
  const STORE = "sk-cipher-v1";
  const BLOB = "fV1dIlNJTEFJUk9CQVJPUlVBIiwiVEhHSUxOUkVIVFJPTkVIVCIsIlNUSEdJTFJBTE9QIiwiU0FST1JVQSIsIkFST1JVQUVIVCIsIlNJTEFFUk9CQVJPUlVBRUhUIiwiU0lMQUVST0JBUk9SVUEiLCJBUk9SVUEiLCJUSEdJTE5SRUhUUk9OIiwiU1RIR0lMTlJFSFRST05FSFQiLCJTVEhHSUxOUkVIVFJPTiJbLF0iQVpJR1RBU0RJTUFSWVAiLCJVRlVIS0ZPRElNQVJZUFRBRVJHIiwiVUZVSEtGT0RJTUFSWVAiLCJVRlVISyIsIkFaSUdESU1BUllQIiwiU0RJTUFSWVBFSFQiLCJTRElNQVJZUCIsIkFaSUciLCJESU1BUllQVEFFUkdFSFQiLCJESU1BUllQVEFFUkciLCJBWklHVEFESU1BUllQVEFFUkciLCJBWklHRElNQVJZUFRBRVJHIiwiU0RJTUFSWVBBWklHRUhUIiwiU0RJTUFSWVBBWklHIiwiRElNQVJZUEFaSUciLCJBWklHRk9TRElNQVJZUEVIVCIsIkFaSUdGT1NESU1BUllQIiwiQVpJR0ZPRElNQVJZUCIsIkFaSUdGT0RJTUFSWVBUQUVSRyIsIkFaSUdGT0RJTUFSWVBUQUVSR0VIVCJbWzoiYSIsXSJTVEhHSUwgTlJFSFRST04iLCJBWklHIEZPIERJTUFSWVAgVEFFUkcgRUhUIls6InAiew==";
  const DATA = JSON.parse(atob(BLOB).split("").reverse().join(""));

  const SIGIL_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5 22 20.5H2Z"/><path d="M6.6 14.6c3.2-3 7.6-3 10.8 0-3.2 3-7.6 3-10.8 0Z"/><circle class="sigil__eye" cx="12" cy="14.6" r="1.5"/></svg>';

  const FRAGMENTS = [
    { id: "home-hero", page: "index.html", dream: 0, hint: "Home — drifting among the coordinates beneath my name" },
    { id: "home-work", page: "index.html", dream: 1, hint: "Home — at the far end of what I do" },
    { id: "home-origins", page: "index.html", dream: 0, hint: "Home — inside the project that listened to my voice" },
    { id: "home-footer", page: "index.html", dream: 1, hint: "Home — at the very end of everything" },
    { id: "astro-orion", page: "astronomy.html", dream: 0, hint: "Astronomy — a hunter wears a belt of three stars. Count again." },
    { id: "astro-voyager", page: "astronomy.html", dream: 1, hint: "Astronomy — travelling with the farthest wanderer" },
    { id: "books-shelf", page: "books.html", dream: 0, hint: "Books — a book without a title" },
    { id: "books-lens", page: "books.html", dream: 1, hint: "Books — some things only appear under the detective's lens" },
    { id: "adv-stamp", page: "adventure.html", dream: 0, hint: "Adventure — pressed into the ink of a passport stamp" },
    { id: "adv-pass", page: "adventure.html", dream: 1, hint: "Adventure — a ticket to somewhere not yet printed" },
    { id: "farm-soil", page: "farming.html", dream: 0, hint: "Farming — buried in the soil, beside the roots" },
    { id: "movie-credits", page: "movies.html", dream: 1, hint: "Movies — true fans always stay after the credits" },
  ];
  const BY_ID = Object.fromEntries(FRAGMENTS.map((f) => [f.id, f]));

  const CLUES = [
    [
      "It is about 4,500 years old — and people still travel across the world to see it.",
      "For nearly 3,800 years, nothing built by human hands stood taller.",
      "Its sides face north, south, east and west with astonishing precision.",
      "Some say it and its two siblings mirror the belt of Orion, the hunter.",
      "It is the last of the Seven Wonders of the Ancient World still standing.",
      "It was built for the pharaoh Khufu, on a plateau beside the Nile.",
    ],
    [
      "It isn't a building. It isn't even on the ground.",
      "It needs a storm — not on Earth, but on the Sun.",
      "Charged particles strike oxygen high above the planet, and the sky glows green.",
      "It is best seen on long, dark winter nights in Norway, Iceland, Finland or Canada.",
      "Galileo is said to have named it after the Roman goddess of the dawn.",
      "Its southern twin is called Australis.",
    ],
  ];
  const DREAM_NAMES = ["Dream destination I", "Dream destination II"];

  /* Letter positions revealed per fragment, shuffled deterministically */
  const CHUNK_SIZES = [[4, 4, 3, 4, 3, 3], [2, 3, 2, 3, 2, 2]];
  function mulberry32(a) {
    return () => {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const CHUNKS = DATA.p.map((phrase, d) => {
    const letters = phrase.replace(/\s/g, "").length;
    const idx = Array.from({ length: letters }, (_, i) => i);
    const rnd = mulberry32(d === 0 ? 1977 : 2026);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const out = [];
    let p = 0;
    CHUNK_SIZES[d].forEach((n) => { out.push(idx.slice(p, p + n)); p += n; });
    return out;
  });

  /* ---------- State ---------- */
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE));
      if (s && Array.isArray(s.found)) return { found: s.found.filter((id) => BY_ID[id]), guessed: s.guessed || [false, false], finaleSeen: !!s.finaleSeen };
    } catch (e) { /* ignore */ }
    return { found: [], guessed: [false, false], finaleSeen: false };
  }
  let state = load();
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* ignore */ } };

  const foundFor = (d) => FRAGMENTS.filter((f) => f.dream === d && state.found.includes(f.id)).length;
  const isSolved = (d) => state.guessed[d] || foundFor(d) >= CHUNK_SIZES[d].length;
  const revealedSet = (d) => {
    if (isSolved(d)) return null; // null = everything visible
    return new Set(CHUNKS[d].slice(0, foundFor(d)).flat());
  };

  /* ---------- Blanks rendering ---------- */
  const shownMap = {};
  function blanksHTML(d, animate, ctx = "panel") {
    const phrase = DATA.p[d];
    const rev = revealedSet(d);
    const shown = (shownMap[`${ctx}${d}`] = shownMap[`${ctx}${d}`] || new Set());
    let li = 0;
    return phrase.split(" ").map((word) => {
      const cells = Array.from(word).map((ch) => {
        const i = li++;
        const on = rev === null || rev.has(i);
        const isNew = on && animate && !shown.has(i);
        if (on) shown.add(i);
        return `<span class="blank${on ? " is-on" : ""}" style="${isNew ? `animation-delay:${(Math.random() * 0.5).toFixed(2)}s` : "animation:none"}">${on ? ch : ""}</span>`;
      }).join("");
      return `<span class="blanks__word">${cells}</span>`;
    }).join("");
  }

  /* ---------- Panel ---------- */
  const page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  let panel, lastFocus;

  function buildPanel() {
    panel = document.createElement("div");
    panel.className = "cipher";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "cipher-title");
    panel.innerHTML = `
      <div class="cipher__backdrop" data-cipher-close></div>
      <div class="cipher__card" data-lenis-prevent>
        <button class="cipher__close" data-cipher-close aria-label="Close">×</button>
        <p class="cipher__kicker">The Cipher · Two dreams, twelve fragments</p>
        <h2 class="cipher__title" id="cipher-title">Where would I go if I could go <em>anywhere?</em></h2>
        <p class="cipher__intro">I've hidden two dream destinations across this whole website. Every ◬ sigil you find reveals letters and a new clue. Find them all — or crack the code early and type your guess below.</p>
        <div class="cipher__progress"><span data-cx="count">0 / 12</span><div class="cipher__bar"><span data-cx="bar"></span></div></div>
        <div class="cipher__dreams">
          ${[0, 1].map((d) => `
            <div class="dream" data-dream="${d}">
              <div class="dream__head"><span class="dream__name">${DREAM_NAMES[d]}</span><span class="dream__status" data-cx="status${d}"></span></div>
              <div class="blanks" data-cx="blanks${d}" aria-live="polite"></div>
              <ul class="clues" data-cx="clues${d}"></ul>
            </div>`).join("")}
        </div>
        <form class="cipher__guess" data-cx="form" autocomplete="off">
          <label class="sr-only" for="cipher-guess">Your guess</label>
          <input id="cipher-guess" name="guess" type="text" placeholder="Think you know one? Type it here…" maxlength="60" />
          <button type="submit">Guess</button>
        </form>
        <p class="cipher__feedback" data-cx="feedback" aria-live="polite"></p>
        <div class="cipher__hunt">
          <h3>Where the fragments hide</h3>
          <div class="hunt-list" data-cx="hunt"></div>
        </div>
        <div class="cipher__actions">
          <button class="cipher__finale-btn" data-cx="finale" hidden>Witness both dreams ✦</button>
          <button class="cipher__link" data-cx="reset">Reset my progress</button>
        </div>
      </div>`;
    document.body.appendChild(panel);

    panel.addEventListener("click", (e) => {
      if (e.target.closest("[data-cipher-close]")) close();
      const link = e.target.closest("[data-hunt-link]");
      if (link && link.getAttribute("href") === page) { e.preventDefault(); close(); }
      else if (link) close(true);
    });
    panel.querySelector('[data-cx="form"]').addEventListener("submit", (e) => {
      e.preventDefault();
      guess(e.target.guess.value);
    });
    panel.querySelector('[data-cx="finale"]').addEventListener("click", () => { close(); openFinale(); });
    panel.querySelector('[data-cx="reset"]').addEventListener("click", () => {
      if (!window.confirm("Forget every fragment you've found and start the hunt again?")) return;
      state = { found: [], guessed: [false, false], finaleSeen: false };
      Object.values(shownMap).forEach((s) => s.clear());
      save();
      document.querySelectorAll(".sigil.is-found").forEach((s) => s.classList.remove("is-found"));
      render(false);
    });
  }

  function render(animate = true) {
    const total = state.found.length;
    document.querySelectorAll("[data-cipher-count]").forEach((el) => { el.textContent = `${total} / ${FRAGMENTS.length}`; });
    updateFab();
    renderTeasers(animate);
    if (!panel) return;
    const $ = (k) => panel.querySelector(`[data-cx="${k}"]`);
    $("count").textContent = `${total} / ${FRAGMENTS.length} fragments`;
    $("bar").style.width = `${(total / FRAGMENTS.length) * 100}%`;
    [0, 1].forEach((d) => {
      const n = isSolved(d) ? CLUES[d].length : foundFor(d);
      panel.querySelector(`[data-dream="${d}"]`).classList.toggle("is-solved", isSolved(d));
      $(`status${d}`).textContent = isSolved(d) ? "✦ Decoded" : `${foundFor(d)} of 6 fragments`;
      $(`blanks${d}`).innerHTML = blanksHTML(d, animate);
      $(`clues${d}`).innerHTML = CLUES[d].map((c, i) => (i < n ? `<li>${c}</li>` : `<li class="is-locked">Find another fragment to unlock this clue</li>`)).join("");
    });
    $("hunt").innerHTML = FRAGMENTS.map((f, i) => {
      const found = state.found.includes(f.id);
      return `<a href="${f.page}" data-hunt-link class="${found ? "is-found" : ""}"><i>${found ? "✦" : String(i + 1).padStart(2, "0")}</i><span>${f.hint}</span></a>`;
    }).join("");
    $("finale").hidden = !(isSolved(0) && isSolved(1));
  }

  function open() {
    if (!panel) buildPanel();
    lastFocus = document.activeElement;
    render(true);
    panel.classList.add("is-open");
    if (window.SK && SK.lenis) SK.lenis.stop();
    setTimeout(() => panel.querySelector(".cipher__close").focus(), 50);
  }
  function close(navigating) {
    if (!panel) return;
    panel.classList.remove("is-open");
    if (!navigating && window.SK && SK.lenis) SK.lenis.start();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ---------- Guessing ---------- */
  function guess(raw) {
    const fb = panel.querySelector('[data-cx="feedback"]');
    const g = String(raw || "").toUpperCase().replace(/[^A-Z]/g, "");
    fb.className = "cipher__feedback";
    void fb.offsetWidth;
    if (!g) { fb.textContent = "Type a place first."; return; }
    const d = DATA.a.findIndex((list) => list.includes(g));
    if (d === -1) {
      const lines = ["Not quite. Keep exploring.", "Interesting guess — but no.", "The stars say no. Try again.", "Close your eyes, read the clues again."];
      fb.textContent = lines[Math.floor(Math.random() * lines.length)];
      fb.classList.add("is-bad");
      return;
    }
    if (isSolved(d)) { fb.textContent = "You've already decoded that one ✦"; fb.classList.add("is-good"); return; }
    state.guessed[d] = true;
    save();
    fb.textContent = `Yes! ${d === 0 ? "Dream I" : "Dream II"} decoded.`;
    fb.classList.add("is-good");
    panel.querySelector("#cipher-guess").value = "";
    render(true);
    maybeFinale();
  }

  function maybeFinale() {
    if (isSolved(0) && isSolved(1) && !state.finaleSeen) {
      state.finaleSeen = true;
      save();
      setTimeout(() => { close(); openFinale(); }, 1600);
    }
  }

  /* ---------- Fragments on the page ---------- */
  function initSigils() {
    document.querySelectorAll(".sigil[data-fragment]").forEach((el) => {
      if (!el.innerHTML.trim()) el.innerHTML = SIGIL_SVG;
      if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", "A hidden fragment");
      if (el.tagName === "BUTTON") el.type = "button";
      if (state.found.includes(el.dataset.fragment)) el.classList.add("is-found");
      el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); collect(el); });
    });
  }

  function collect(el) {
    const id = el.dataset.fragment;
    const f = BY_ID[id];
    if (!f) return;
    if (state.found.includes(id)) { open(); return; }
    const wasSolved = isSolved(f.dream);
    state.found.push(id);
    save();
    el.classList.add("is-found");
    burst(el);
    const n = foundFor(f.dream);
    const clue = CLUES[f.dream][Math.min(n, 6) - 1];
    const nowSolved = !wasSolved && isSolved(f.dream);
    toast(
      nowSolved ? `${f.dream === 0 ? "Dream I" : "Dream II"} fully decoded!` : `Fragment ${state.found.length} of ${FRAGMENTS.length} found`,
      wasSolved ? "This dream is already decoded — but every fragment counts." : `New clue: “${clue}”`
    );
    render(true);
    maybeFinale();
  }

  function burst(el) {
    const r = el.getBoundingClientRect();
    const dot = document.createElement("div");
    dot.className = "sigil-burst";
    dot.style.left = `${r.left + r.width / 2}px`;
    dot.style.top = `${r.top + r.height / 2}px`;
    document.body.appendChild(dot);
    const fabEl = fab.getBoundingClientRect();
    const tx = fabEl.left + 22 - (r.left + r.width / 2);
    const ty = fabEl.top + fabEl.height / 2 - (r.top + r.height / 2);
    const anim = dot.animate(
      [
        { transform: "translate(0,0) scale(1)", opacity: 1 },
        { transform: "translate(0,-40px) scale(2.4)", opacity: 1, offset: 0.25 },
        { transform: `translate(${tx}px, ${ty}px) scale(0.6)`, opacity: 0.9 },
      ],
      { duration: 1100, easing: "cubic-bezier(.6,0,.2,1)" }
    );
    anim.onfinish = () => {
      dot.remove();
      fab.classList.remove("is-bump");
      void fab.offsetWidth;
      fab.classList.add("is-bump");
    };
  }

  /* ---------- Toast ---------- */
  let toastEl, toastTimer;
  function toast(title, body) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "cipher-toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
      toastEl.addEventListener("click", () => { toastEl.classList.remove("is-in"); open(); });
    }
    toastEl.innerHTML = `${SIGIL_SVG}<div><strong>${title}</strong>${body}</div>`;
    requestAnimationFrame(() => toastEl.classList.add("is-in"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-in"), 5200);
  }

  /* ---------- Floating button ---------- */
  const fab = document.createElement("button");
  fab.className = "cipher-fab";
  fab.type = "button";
  fab.setAttribute("aria-label", "Open the cipher");
  fab.innerHTML = `${SIGIL_SVG}<span data-cipher-count>0 / 12</span>`;
  document.body.appendChild(fab);
  fab.addEventListener("click", open);
  function updateFab() {
    fab.classList.toggle("is-visible", state.found.length > 0 || state.guessed.some(Boolean) || document.body.hasAttribute("data-cipher-always"));
  }

  /* ---------- Teasers (e.g. on the home page) ---------- */
  function renderTeasers(animate) {
    document.querySelectorAll("[data-cipher-teaser]").forEach((el) => {
      el.innerHTML = [0, 1].map((d) => `
        <div class="teaser-dream${isSolved(d) ? " is-solved" : ""}">
          <span class="teaser-dream__label">${d === 0 ? "I." : "II."}</span>
          <div class="blanks">${blanksHTML(d, animate, "teaser")}</div>
        </div>`).join("");
    });
  }

  /* ---------- Finale ---------- */
  let finale;
  function starsSVG(n, w, h) {
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = (Math.random() * w).toFixed(1), y = (Math.random() * h).toFixed(1);
      const r = (Math.random() ** 3 * 1.6 + 0.3).toFixed(2), o = (Math.random() * 0.7 + 0.3).toFixed(2);
      s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${o}"/>`;
    }
    return `<svg class="finale__stars" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${s}</svg>`;
  }
  function openFinale() {
    if (!finale) {
      finale = document.createElement("div");
      finale.className = "finale";
      finale.setAttribute("role", "dialog");
      finale.setAttribute("aria-label", "Both dream destinations revealed");
      finale.innerHTML = `
        <button class="finale__close">Close ✕</button>
        <div class="finale__center"><p>You found them. Thank you for exploring my universe.</p></div>
        <section class="finale__scene finale__scene--giza">
          ${starsSVG(140, 800, 900)}
          <svg class="finale__pyramids" viewBox="0 0 800 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs><linearGradient id="dune" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b2c1a"/><stop offset="1" stop-color="#1c0c08"/></linearGradient></defs>
            <polygon points="70,430 230,250 390,430" fill="#3a1a12"/><polygon points="230,250 390,430 300,430" fill="#24100b"/>
            <polygon points="300,440 520,160 740,440" fill="#4a2214"/><polygon points="520,160 740,440 610,440" fill="#2a120b"/>
            <polygon points="600,450 690,350 780,450" fill="#33170f"/><polygon points="690,350 780,450 730,450" fill="#1f0d08"/>
            <path d="M0 430 Q200 400 400 432 T800 425 V500 H0Z" fill="url(#dune)"/>
          </svg>
          <div class="finale__text">
            <p class="finale__num">Dream I</p>
            <h3 class="finale__name">${titleCase(DATA.p[0])}</h3>
            <p class="finale__line">The last surviving wonder of the ancient world — built by human hands, aligned with the stars. One day I'll stand at its base and simply look up.</p>
          </div>
        </section>
        <section class="finale__scene finale__scene--aurora">
          ${starsSVG(180, 800, 900)}
          <div class="finale__aurora"><span></span><span></span><span></span></div>
          <svg class="finale__ground" viewBox="0 0 800 200" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 120 L90 60 L160 110 L260 30 L360 105 L450 55 L560 115 L650 45 L800 110 V200 H0Z" fill="#020610"/>
          </svg>
          <div class="finale__text">
            <p class="finale__num">Dream II</p>
            <h3 class="finale__name">${titleCase(DATA.p[1])}</h3>
            <p class="finale__line">The sky itself, set alight in green and violet. For someone who loves the universe, there's no better ceiling to sleep under.</p>
          </div>
        </section>`;
      document.body.appendChild(finale);
      finale.querySelector(".finale__close").addEventListener("click", closeFinale);
    }
    if (toastEl) { clearTimeout(toastTimer); toastEl.classList.remove("is-in"); }
    requestAnimationFrame(() => finale.classList.add("is-open"));
    if (window.SK && SK.lenis) SK.lenis.stop();
    finale.querySelector(".finale__close").focus();
  }
  function closeFinale() {
    finale.classList.remove("is-open");
    if (window.SK && SK.lenis) SK.lenis.start();
  }
  function titleCase(s) {
    return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\bOf\b/g, "of");
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (finale && finale.classList.contains("is-open")) closeFinale();
    else if (panel && panel.classList.contains("is-open")) close();
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-cipher-open]")) { e.preventDefault(); open(); }
  });

  initSigils();
  render(false);

  window.SKCipher = { open, initSigils, total: FRAGMENTS.length };
})();
