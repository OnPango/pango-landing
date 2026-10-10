/**
 * Page motion: scroll reveal (fade in and out) and the magnifier lens.
 * Both respect prefers-reduced-motion; the lens also follows the cursor on hover.
 */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Scroll reveal ---------- */
function initReveal() {
  const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (reduce) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.target.classList.toggle("is-in", e.isIntersecting);
    },
    { threshold: 0.12, rootMargin: "-6% 0px -6% 0px" },
  );
  els.forEach((el) => io.observe(el));
}

/* ---------- Magnifier lens ---------- */
type Lens = { layer: HTMLElement; set: (x: number, y: number, r: number, z: number) => void };

const visible = new Set<HTMLElement>();
const hovered = new Set<HTMLElement>();
const lenses = new WeakMap<HTMLElement, Lens>();

function buildLens(card: HTMLElement): Lens {
  lenses.get(card)?.layer.remove();

  const clone = card.cloneNode(true) as HTMLElement;
  clone.removeAttribute("data-lens");
  clone.removeAttribute("data-reveal");
  clone.setAttribute("aria-hidden", "true");
  clone.setAttribute("inert", "");
  clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
  clone.querySelectorAll("[data-reveal]").forEach((n) => n.removeAttribute("data-reveal"));
  clone.querySelectorAll(".lens-layer").forEach((n) => n.remove());
  Object.assign(clone.style, {
    position: "absolute", inset: "0", width: "100%", height: "100%", margin: "0",
    transform: "none", opacity: "1", transition: "none", animation: "none",
  });

  const layer = document.createElement("div");
  layer.className = "lens-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = '<div class="lens-clip"><div class="lens-zoom"></div></div><div class="lens-ring"></div>';
  layer.querySelector(".lens-zoom")!.appendChild(clone);
  card.appendChild(layer);

  const lens: Lens = {
    layer,
    set(x, y, r, z) {
      layer.style.setProperty("--x", `${x}px`);
      layer.style.setProperty("--y", `${y}px`);
      layer.style.setProperty("--r", `${r}px`);
      layer.style.setProperty("--z", `${z}`);
    },
  };
  lenses.set(card, lens);
  return lens;
}

const radiusFor = (card: HTMLElement) => Math.max(44, Math.min(78, card.clientHeight * 0.28));
const smooth = (t: number) => t * t * (3 - 2 * t);
const isShown = (el: HTMLElement) =>
  el.getClientRects().length > 0 && getComputedStyle(el).visibility !== "hidden" &&
  getComputedStyle(el.closest<HTMLElement>(".panel") ?? el).visibility !== "hidden";

/** One sweep: the lens enters, glides across the card while magnifying, then leaves. */
function sweep(card: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const lens = buildLens(card);
    const { clientWidth: w, clientHeight: h } = card;
    const r = radiusFor(card);
    const dur = 3800;
    const t0 = performance.now();
    lens.layer.classList.add("on");

    const frame = (now: number) => {
      const p = (now - t0) / dur;
      if (p >= 1 || hovered.has(card) || !isShown(card) || document.hidden) {
        lens.layer.classList.remove("on");
        setTimeout(resolve, 350);
        return;
      }
      const x = w * (0.16 + 0.68 * smooth(p));
      const y = h * (0.5 + 0.2 * Math.sin(p * Math.PI * 2));
      const edge = Math.min(1, p / 0.14, (1 - p) / 0.14);
      lens.set(x, y, r, 1 + 0.32 * smooth(edge));
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

async function autoLoop(cards: HTMLElement[]) {
  let i = 0;
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  for (;;) {
    const ready = cards.filter((c) => visible.has(c) && !hovered.has(c) && isShown(c));
    if (!ready.length || document.hidden) { await wait(500); continue; }
    const card = ready[i++ % ready.length];
    await sweep(card);
    await wait(900);
  }
}

function initLens() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-lens]"));
  if (!cards.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const el = e.target as HTMLElement;
      e.isIntersecting && e.intersectionRatio > 0.5 ? visible.add(el) : visible.delete(el);
    }
  }, { threshold: [0, 0.5, 1] });

  for (const card of cards) {
    if (getComputedStyle(card).position === "static") card.style.position = "relative";
    io.observe(card);

    // Hover: the lens follows the cursor (mouse and pen only).
    card.addEventListener("pointermove", (ev) => {
      if (ev.pointerType === "touch") return;
      const rect = card.getBoundingClientRect();
      if (!hovered.has(card)) {
        hovered.add(card);
        buildLens(card).layer.classList.add("on");
      }
      lenses.get(card)?.set(ev.clientX - rect.left, ev.clientY - rect.top, radiusFor(card) * 0.85, 1.35);
    });
    card.addEventListener("pointerleave", () => {
      hovered.delete(card);
      lenses.get(card)?.layer.classList.remove("on");
    });
  }

  if (!reduce) autoLoop(cards);
}

/* ---------- How it works: auto-advancing steps ---------- */
function initHow() {
  const root = document.querySelector<HTMLElement>("[data-how]");
  if (!root) return;
  const steps = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-step]"));
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-panel]"));
  let current = 0;
  let paused = false;
  let inView = false;
  let timer: number | undefined;

  const show = (n: number, auto: boolean) => {
    current = n;
    steps.forEach((s, i) => {
      s.classList.toggle("on", i === n);
      s.classList.toggle("auto", i === n && auto);
      s.setAttribute("aria-pressed", String(i === n));
    });
    panels.forEach((p, i) => p.classList.toggle("is-active", i === n));
  };
  const schedule = () => {
    clearTimeout(timer);
    if (reduce || paused || !inView) return;
    timer = window.setTimeout(() => { show((current + 1) % steps.length, true); schedule(); }, 4500);
  };

  steps.forEach((s, i) =>
    s.addEventListener("click", () => { paused = true; clearTimeout(timer); show(i, false); }),
  );
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    // Restart the progress bar when the section comes back into view.
    if (inView && !paused) show(current, true);
    schedule();
  }, { threshold: 0.35 }).observe(root);
}

initReveal();
initHow();
initLens();
