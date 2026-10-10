/**
 * Page motion: scroll reveal (fade in and out) and the automatic ripple magnifier on cards.
 * Both are disabled under prefers-reduced-motion.
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

/* ---------- Ripple magnifier ---------- */
// Each [data-zoom] card emits ripples on its own, at random moments and from random
// points. A ripple is a ring that expands across the card; content under the ring is
// magnified and pushed outward (like a lens bulge travelling through the component),
// then settles. Text is split into words and boxes (chips, inputs, icons...) are single
// units, so the wave moves through the content continuously instead of scaling blocks.
const RIPPLE = {
  speed: [210, 330],      // px/s the ring expands
  thickness: [48, 80],    // px, width of the bulge
  amplitude: [0.75, 1],
  scale: 0.2,             // max extra scale at the ring for boxes and icons (1.2x)
  wordScale: 0.1,         // smaller for words so neighbours do not collide
  push: 9,                // max px each unit is pushed away from the origin
  rest: [1400, 5200],     // ms between ripples
  firstDelay: [300, 3500],
};
const rand = (r: number[]) => r[0] + Math.random() * (r[1] - r[0]);
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));
const visible = new Set<HTMLElement>();

type Unit = { el: HTMLElement | SVGElement; cx: number; cy: number; word: boolean };
type Wave = { ox: number; oy: number; t0: number; speed: number; width: number; amp: number; life: number };
type State = { units: Unit[]; waves: Wave[] };
const states = new Map<HTMLElement, State>();

const SHAPES = new Set(["line", "polyline", "polygon", "circle", "path", "rect", "ellipse"]);

function isBox(el: Element) {
  const cs = getComputedStyle(el);
  return (
    cs.backgroundColor !== "rgba(0, 0, 0, 0)" ||
    cs.backgroundImage !== "none" ||
    parseFloat(cs.borderTopWidth) > 0 ||
    parseFloat(cs.borderLeftWidth) > 0 ||
    cs.boxShadow !== "none"
  );
}

/** Wrap each word of a text node in an inline-block span so words can move independently. */
function splitWords(node: Text) {
  const text = node.textContent ?? "";
  if (!text.trim()) return;
  const frag = document.createDocumentFragment();
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
    const w = document.createElement("span");
    w.className = "w";
    w.textContent = part;
    frag.appendChild(w);
  }
  node.replaceWith(frag);
}

/** Decide which elements of a card move. Boxes and icons move whole; text moves word by word. */
function collect(el: Element, out: Element[]) {
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) { splitWords(node as Text); continue; }
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const child = node as Element;
    if (child.tagName.toLowerCase() === "svg") {
      const big = (child as SVGSVGElement).getBoundingClientRect().width > 120;
      if (big) child.querySelectorAll(Array.from(SHAPES).join(",")).forEach((n) => out.push(n));
      else out.push(child);
    } else if (isBox(child)) out.push(child);
    else collect(child, out);
  }
}

function prepare(card: HTMLElement) {
  const els: Element[] = [];
  collect(card, els);
  card.querySelectorAll(".w").forEach((w) => els.push(w));
  for (const el of els) {
    const h = el as HTMLElement;
    if (el.namespaceURI === "http://www.w3.org/2000/svg") { h.style.transformBox = "fill-box"; h.style.transformOrigin = "center"; }
    else if (!el.classList.contains("w") && getComputedStyle(el).display === "inline") h.style.display = "inline-block";
  }
  states.set(card, { units: els.map((el) => ({ el: el as HTMLElement, cx: 0, cy: 0, word: el.classList.contains("w") })), waves: [] });
}

/** Unit centres relative to the card, measured while nothing is displaced. */
function measure(card: HTMLElement, st: State) {
  const c = card.getBoundingClientRect();
  for (const u of st.units) {
    const r = u.el.getBoundingClientRect();
    u.cx = r.left - c.left + r.width / 2;
    u.cy = r.top - c.top + r.height / 2;
  }
}

function emit(card: HTMLElement, st: State) {
  if (!st.waves.length) measure(card, st);
  const w = card.clientWidth, h = card.clientHeight;
  const ox = Math.random() * w, oy = Math.random() * h;
  const far = Math.max(Math.hypot(ox, oy), Math.hypot(w - ox, oy), Math.hypot(ox, h - oy), Math.hypot(w - ox, h - oy));
  const speed = rand(RIPPLE.speed), width = rand(RIPPLE.thickness);
  st.waves.push({ ox, oy, t0: performance.now(), speed, width, amp: rand(RIPPLE.amplitude), life: ((far + width * 2.5) / speed) * 1000 });
}

function render(now: number) {
  for (const [, st] of states) {
    if (!st.waves.length) continue;
    st.waves = st.waves.filter((wv) => now - wv.t0 < wv.life);
    for (const u of st.units) {
      let k = 0, dx = 0, dy = 0;
      for (const wv of st.waves) {
        const t = (now - wv.t0) / 1000;
        const R = wv.speed * t;
        const fade = 1 - (now - wv.t0) / wv.life;          // ripple loses strength as it travels
        const vx = u.cx - wv.ox, vy = u.cy - wv.oy;
        const d = Math.hypot(vx, vy) || 1;
        // Main ring plus a weaker trailing ring, like a water ripple.
        const f = Math.exp(-(((d - R) / wv.width) ** 2)) + 0.45 * Math.exp(-(((d - (R - wv.width * 1.5)) / wv.width) ** 2));
        const e = f * wv.amp * fade;
        k += e;
        dx += (vx / d) * e * RIPPLE.push;
        dy += (vy / d) * e * RIPPLE.push;
      }
      const el = u.el as HTMLElement;
      el.style.transform = k > 0.002 ? `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${(1 + (u.word ? RIPPLE.wordScale : RIPPLE.scale) * Math.min(k, 1.2)).toFixed(4)})` : "";
    }
    if (!st.waves.length) for (const u of st.units) (u.el as HTMLElement).style.transform = "";
  }
  requestAnimationFrame(render);
}

const isShown = (el: HTMLElement) =>
  el.getClientRects().length > 0 &&
  getComputedStyle(el.closest<HTMLElement>(".panel") ?? el).visibility !== "hidden";

async function behave(card: HTMLElement) {
  const st = states.get(card)!;
  await wait(rand(RIPPLE.firstDelay));
  for (;;) {
    if (!visible.has(card) || document.hidden || !isShown(card)) { await wait(500); continue; }
    emit(card, st);
    // Sometimes a second ripple follows close behind; otherwise rest for a random time.
    if (Math.random() < 0.3) { await wait(rand([350, 900])); if (visible.has(card)) emit(card, st); }
    await wait(rand(RIPPLE.rest) + 1800);
  }
}

function initZoom() {
  const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-zoom]"));
  if (!cards.length || reduce) return;

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const el = e.target as HTMLElement;
      e.isIntersecting && e.intersectionRatio > 0.3 ? visible.add(el) : visible.delete(el);
    }
  }, { threshold: [0, 0.3, 1] });

  for (const card of cards) {
    prepare(card);
    io.observe(card);
    behave(card);
  }
  requestAnimationFrame(render);
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
initZoom();
