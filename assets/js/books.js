/* ==========================================================================
   Books — candlelight, the shelf, the detective's lens
   ========================================================================== */
(() => {
  const SK = window.SK || {};
  const reduceMotion = !!SK.reduceMotion;
  const hasGSAP = !!SK.hasGSAP;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Candlelight ---------- */
  const candle = $(".candle");
  if (candle) {
    const fine = window.matchMedia("(pointer: fine)").matches;
    let tx = window.innerWidth * 0.62, ty = window.innerHeight * 0.3, cx = tx, cy = ty;
    if (fine) window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const tick = (now) => {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      const t = now / 1000;
      const flicker = reduceMotion ? 0 : Math.sin(t * 7.3) * 0.35 + Math.sin(t * 13.1) * 0.25 + Math.sin(t * 2.1) * 0.4;
      candle.style.setProperty("--cx", cx.toFixed(1) + "px");
      candle.style.setProperty("--cy", cy.toFixed(1) + "px");
      candle.style.setProperty("--cr", (460 + flicker * 22).toFixed(1) + "px");
      candle.style.setProperty("--ca", (0.13 + flicker * 0.012).toFixed(3));
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Tome: entrance + gentle tilt ---------- */
  const tome = $(".tome__book");
  if (tome && hasGSAP && !reduceMotion) {
    gsap.from(tome, { y: 120, rotateX: 70, opacity: 0, duration: 1.8, ease: "expo.out", delay: 0.3 });
    if (window.matchMedia("(pointer: fine)").matches) {
      gsap.set(tome, { rotationX: 30, rotation: -7 });
      const rx = gsap.quickTo(tome, "rotationX", { duration: 1.2, ease: "power3.out" });
      const rz = gsap.quickTo(tome, "rotation", { duration: 1.2, ease: "power3.out" });
      window.addEventListener("pointermove", (e) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        rx(30 + ny * 10);
        rz(-7 + nx * 8);
      }, { passive: true });
    }
  }

  /* ---------- The shelf ---------- */
  const BOOKS = {
    princess: {
      tag: "All-time favourite",
      title: "A Little Princess",
      author: "Frances Hodgson Burnett",
      note: "My favourite book of all. Sara Crewe goes from the richest girl at Miss Minchin's to a servant in the attic — and never once lets go of her kindness or her imagination.",
      quote: "“Whatever comes, cannot alter one thing. If I am a princess in rags and tatters, I can be a princess inside.”",
    },
    crusoe: {
      tag: "My first book",
      title: "Robinson Crusoe",
      author: "Daniel Defoe",
      note: "The first book I ever read cover to cover. Shipwrecked, alone, and endlessly resourceful — it made me fall in love with reading, and with adventure.",
      quote: "“Thus fear of danger is ten thousand times more terrifying than danger itself.”",
    },
    sherlock: {
      tag: "Mystery",
      title: "Sherlock Holmes",
      author: "Sir Arthur Conan Doyle",
      note: "The detective who taught me to notice things. Data before theories, observation before assumption — which is, honestly, also the job description of a good tester.",
      quote: "“It is a capital mistake to theorize before one has data.”",
    },
    poirot: {
      tag: "Mystery",
      title: "The Poirot Stories",
      author: "Agatha Christie",
      note: "Hercule Poirot: order, method and the little grey cells. Christie plays fair with every clue and still fools me almost every time.",
      quote: "“Order and method.”",
    },
    shiva: {
      tag: "Mythology",
      title: "Tales of Mahadev",
      author: "From the Puranas & the stories I grew up with",
      note: "Hindu mythology is my other great love — and Mahadev's stories most of all. Neelkanth, Gangadhar, Nataraja… they're further down this page.",
      quote: "ॐ नमः शिवाय",
      lang: "sa",
    },
    potter: {
      tag: "Magic",
      title: "Harry Potter",
      author: "J.K. Rowling",
      note: "Seven books, one cupboard under the stairs, and an entire world hiding behind platform nine and three-quarters. I grew up alongside Harry — and part of me is still waiting for my Hogwarts letter.",
      quote: "“It does not do to dwell on dreams and forget to live.”",
    },
    meluha: {
      tag: "Mythology",
      title: "The Shiva Trilogy",
      author: "Amish Tripathi",
      note: "The Immortals of Meluha, The Secret of the Nagas and The Oath of the Vayuputras. Amish imagines Shiva as a man — a Tibetan tribal chief whose deeds made him Mahadev. For a Shiva devotee it's the most gripping “what if” ever written.",
      quote: "हर हर महादेव",
      lang: "hi",
    },
    hidden: {
      tag: "Mythology · Thriller",
      title: "The Hidden Hindu",
      author: "Akshat Gupta",
      note: "A mysterious aghori named Om who claims to have lived through every yuga, and a hunt for the chiranjeevis — the immortals said to still walk among us. Mythology that reads like a thriller; I couldn't put it down.",
      quote: "",
    },
    mrityunjay: {
      tag: "Marathi classic",
      title: "Mrityunjay",
      author: "Shivaji Sawant",
      note: "Karna's life, told in his own voice — the son of the Sun raised by a charioteer, the greatest giver of the Mahabharata, standing on the wrong side of the war. The title means “the one who conquered death”, and the book never leaves you.",
      quote: "मृत्युंजय",
      lang: "mr",
    },
    untitled: {
      tag: "???",
      title: "Untitled",
      author: "Author unknown",
      note: "No title, no author, no blurb. Some stories are still being written — and some secrets hide in plain sight. Look closely at the spine.",
      quote: "",
    },
  };
  const card = $(".book-card");
  const fields = card ? {
    tag: $("[data-bc=tag]", card), title: $("[data-bc=title]", card), author: $("[data-bc=author]", card),
    note: $("[data-bc=note]", card), quote: $("[data-bc=quote]", card),
  } : null;
  let current = null;

  function fill(id) {
    const b = BOOKS[id];
    fields.tag.textContent = b.tag;
    fields.title.textContent = b.title;
    fields.author.textContent = b.author;
    fields.note.textContent = b.note;
    fields.quote.textContent = b.quote;
    if (b.lang) fields.quote.setAttribute("lang", b.lang);
    else fields.quote.removeAttribute("lang");
  }

  function select(id, animate) {
    if (!card || !BOOKS[id] || id === current) return;
    current = id;
    $$(".spine[data-book]").forEach((s) => {
      const on = s.dataset.book === id;
      s.classList.toggle("is-active", on);
      if (s.tagName === "BUTTON") s.setAttribute("aria-pressed", on ? "true" : "false");
    });
    if (!animate || !hasGSAP || reduceMotion) { fill(id); return; }
    const kids = Array.from(card.children);
    gsap.killTweensOf(kids);
    gsap.to(kids, {
      opacity: 0, y: -12, duration: 0.25, stagger: 0.03, ease: "power2.in",
      onComplete: () => {
        fill(id);
        gsap.fromTo(kids, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.05, ease: "expo.out" });
      },
    });
    gsap.fromTo(card, { rotate: 1.2 }, { rotate: id === "untitled" ? -1.5 : 1.2, duration: 0.8, ease: "expo.out" });
  }

  $$(".spine[data-book]").forEach((s) => {
    s.addEventListener("click", () => select(s.dataset.book, true));
  });
  select("princess", false);

  /* ---------- The detective's lens ---------- */
  const file = $("[data-lens]");
  if (file) {
    const sigil = $(".ink__sigil", file);
    let w = 0, h = 0, lr = 110, active = false;
    let tx = 0, ty = 0, x = 0, y = 0;
    const measure = () => {
      w = file.offsetWidth; h = file.offsetHeight;
      lr = parseFloat(getComputedStyle(file).getPropertyValue("--lr")) || 110;
      if (!active) { tx = x = w * 0.78; ty = y = h * 0.16; }
    };
    measure();
    window.addEventListener("resize", measure);

    const toLocal = (e) => {
      const r = file.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top;
    };
    file.addEventListener("pointermove", (e) => { active = true; toLocal(e); });
    file.addEventListener("pointerdown", (e) => { active = true; toLocal(e); });
    if (sigil) {
      sigil.addEventListener("focus", () => {
        active = true;
        const r = file.getBoundingClientRect(), s = sigil.getBoundingClientRect();
        tx = s.left + s.width / 2 - r.left; ty = s.top + s.height / 2 - r.top;
      });
    }

    let visible = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; }, { threshold: 0.05 }).observe(file);
    } else visible = true;

    const tick = (now) => {
      requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      if (!active && !reduceMotion) {
        const t = now / 1000;
        tx = w * (0.55 + 0.3 * Math.sin(t * 0.37));
        ty = h * (0.42 + 0.3 * Math.sin(t * 0.53 + 1));
      }
      x += (tx - x) * 0.16;
      y += (ty - y) * 0.16;
      file.style.setProperty("--lx", x.toFixed(1) + "px");
      file.style.setProperty("--ly", y.toFixed(1) + "px");
      if (sigil) {
        const r = file.getBoundingClientRect(), s = sigil.getBoundingClientRect();
        const dx = s.left + s.width / 2 - r.left - x, dy = s.top + s.height / 2 - r.top - y;
        sigil.classList.toggle("is-lit", dx * dx + dy * dy < (lr - 14) * (lr - 14));
      }
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Section accents ---------- */
  if (hasGSAP && SK.hasST && !reduceMotion) {
    const trishul = $(".trishul");
    if (trishul) {
      gsap.from(trishul, {
        y: 60, opacity: 0, scale: 0.8, duration: 1.6, ease: "expo.out",
        scrollTrigger: { trigger: trishul, start: "top 85%" },
      });
    }
    $$(".shelf").forEach((shelf) => {
      $$(".spine", shelf).forEach((s, i) => {
        gsap.from(s, {
          y: -40, opacity: 0, duration: 1, ease: "bounce.out", delay: i * 0.05, clearProps: "transform,opacity",
          scrollTrigger: { trigger: shelf, start: "top 80%" },
        });
      });
    });
  }
})();
