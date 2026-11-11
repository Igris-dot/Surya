/**
 * main.js — all site behavior. No dependencies.
 *
 * The page is fully readable without this file. Each feature below is a small
 * function that exits quietly when its markup is missing. Anything decorative
 * is skipped when the visitor prefers reduced motion.
 */

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

/* ---------- Intro loader → hero entrance ---------- */
function initIntro() {
  const ready = () => {
    root.classList.add('is-loaded');
    requestAnimationFrame(() => setTimeout(() => root.classList.add('is-ready'), 250));
  };

  const loader = $('.loader');
  if (reduceMotion || root.classList.contains('intro-seen') || !loader) {
    root.classList.add('is-loaded', 'is-ready');
    return;
  }

  const count = $('[data-loader-count]', loader);
  const duration = 1400;
  const start = performance.now();
  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  let fontsDone = false;
  fonts.then(() => { fontsDone = true; });
  setTimeout(() => { fontsDone = true; }, 4000); // never wait on a slow font forever

  const tick = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    count.textContent = String(Math.round(eased * 100)).padStart(2, '0');
    loader.style.setProperty('--load', eased);
    if (t < 1 || !fontsDone) {
      requestAnimationFrame(tick);
    } else {
      try { sessionStorage.setItem('ds-intro', '1'); } catch (e) { /* storage blocked */ }
      setTimeout(ready, 150);
    }
  };
  requestAnimationFrame(tick);
}

/* ---------- Text splitting: words ([data-split]) and letters ([data-chars]) ----------
   Both keep the full sentence in aria-label and hide the pieces from assistive tech. */
function splitText(el, makePiece) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          frag.append(/^\s+$/.test(part) ? ' ' : makePiece(part));
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(el);
}

const span = (className, text) => {
  const s = document.createElement('span');
  s.className = className;
  if (text !== undefined) s.textContent = text;
  return s;
};

function label(el, pieceSelector) {
  if (el.getAttribute('aria-hidden') === 'true') return;
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  $$(pieceSelector, el).forEach((p) => p.setAttribute('aria-hidden', 'true'));
}

function initSplit() {
  $$('[data-split]').forEach((el) => {
    let i = 0;
    splitText(el, (word) => {
      const w = span('w');
      const inner = span('w__i', word);
      inner.style.setProperty('--i', i++);
      w.append(inner);
      return w;
    });
    label(el, '.w');
  });

  $$('[data-chars]').forEach((el) => {
    const lines = $$('.line', el);
    (lines.length ? lines : [el]).forEach((line, li) => {
      let ci = 0;
      splitText(line, (word) => {
        const w = span('cw');
        [...word].forEach((ch) => {
          const c = span('c', ch);
          c.style.setProperty('--ci', ci++);
          c.style.setProperty('--li', li);
          w.append(c);
        });
        return w;
      });
    });
    label(el, '.line, .cw');
  });
}

/* ---------- Scroll reveals + number counters ---------- */
function animateCount(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const format = (v) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  if (reduceMotion || target === 0) { el.textContent = format(target); return; }

  const duration = 1800;
  const start = performance.now();
  const step = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = format(target * eased);
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initReveal() {
  const items = $$('[data-reveal], [data-split], [data-reveal-chars]');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const onEnter = (entries, observer) => {
    // Stagger elements that enter together.
    entries
      .filter((e) => e.isIntersecting)
      .forEach((entry, index) => {
        const el = entry.target;
        el.style.setProperty('--d', index * 90);
        el.classList.add('is-in');
        $$('[data-count]', el).forEach(animateCount);
        observer.unobserve(el);
      });
  };
  const io = new IntersectionObserver(onEnter, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  // The footer ends the page, inside the bottom margin the main observer
  // ignores, so it gets an observer that fires as soon as it shows at all.
  const ioEnd = new IntersectionObserver(onEnter, { threshold: 0 });

  // Hero items wait for the intro to finish.
  const heroItems = items.filter((el) => el.closest('.hero'));
  items
    .filter((el) => !el.closest('.hero'))
    .forEach((el) => (el.closest('.footer') ? ioEnd : io).observe(el));

  const startHero = () => heroItems.forEach((el, i) => {
    el.style.setProperty('--d', 500 + i * 120);
    el.classList.add('is-in');
  });
  if (root.classList.contains('is-ready')) startHero();
  else new MutationObserver((_, obs) => {
    if (root.classList.contains('is-ready')) { startHero(); obs.disconnect(); }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });
}

/* ---------- Header: scrolled state, hide on scroll down, active section ---------- */
function initHeader() {
  const header = $('.header');
  if (!header) return;
  const progress = $('.progress');
  let lastY = scrollY;

  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 20);
    const goingDown = y > lastY && y > 500;
    if (!document.body.classList.contains('menu-open')) header.classList.toggle('is-hidden', goingDown);
    lastY = y;

    if (progress) {
      const max = root.scrollHeight - innerHeight;
      progress.style.setProperty('--p', max > 0 ? y / max : 0);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Show the header again when keyboard focus moves into it.
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  const list = $('.nav__list');
  const links = $$('.nav__link');
  const sections = links.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  if (!list || !('IntersectionObserver' in window)) return;

  // The pill slides to the active link, and previews whichever link is hovered.
  let active = null;
  const moveIndicator = (link) => {
    if (!link) { list.style.setProperty('--o', 0); return; }
    list.style.setProperty('--x', `${link.offsetLeft}px`);
    list.style.setProperty('--w', `${link.offsetWidth}px`);
    list.style.setProperty('--o', 1);
  };
  const setActive = (id) => {
    active = null;
    links.forEach((l) => {
      const on = l.getAttribute('href') === `#${id}`;
      l.classList.toggle('is-active', on);
      if (on) { l.setAttribute('aria-current', 'true'); active = l; } else l.removeAttribute('aria-current');
    });
    moveIndicator(active);
  };

  const inView = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) inView.add(e.target.id); else inView.delete(e.target.id); });
    setActive([...inView].pop() || null);
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));

  if (finePointer) {
    links.forEach((l) => l.addEventListener('pointerenter', () => moveIndicator(l)));
    list.addEventListener('pointerleave', () => moveIndicator(active));
  }
  addEventListener('resize', () => moveIndicator(active));
  if (document.fonts) document.fonts.ready.then(() => moveIndicator(active));
}

/* ---------- Mobile menu ---------- */
function initNav() {
  const toggle = $('.nav__toggle');
  const menu = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  if (!menu) return;
  const header = $('.header');

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    header.classList.toggle('menu-open', open);
    if (open) header.classList.remove('is-hidden');
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
  });
  matchMedia('(min-width: 52.01rem)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

/* ---------- Custom cursor ---------- */
function initCursor() {
  const cursor = $('.cursor');
  if (!cursor || !finePointer || reduceMotion) return;
  const text = $('.cursor__label', cursor);
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { ...pos };
  let raf = 0;

  const loop = () => {
    pos.x = lerp(pos.x, target.x, 0.22);
    pos.y = lerp(pos.y, target.y, 0.22);
    cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    // Rest once the dot has caught up; the next pointermove wakes it.
    raf = Math.abs(pos.x - target.x) + Math.abs(pos.y - target.y) > 0.1 ? requestAnimationFrame(loop) : 0;
  };

  addEventListener('pointermove', (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
    cursor.classList.add('is-visible');
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  root.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  addEventListener('pointerup', () => cursor.classList.remove('is-down'));

  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button');
    cursor.classList.toggle('is-label', !!labelled);
    cursor.classList.toggle('is-link', !!link && !labelled);
    if (labelled) text.textContent = labelled.dataset.cursor;
  });
}

/* ---------- Magnetic buttons: eased pull toward the pointer, spring back on leave ---------- */
function initMagnetic() {
  if (!finePointer || reduceMotion) return;
  $$('[data-magnetic]').forEach((el) => {
    const cur = { x: 0, y: 0 };
    const to = { x: 0, y: 0 };
    let raf = 0;

    const loop = () => {
      cur.x = lerp(cur.x, to.x, 0.16);
      cur.y = lerp(cur.y, to.y, 0.16);
      const settled = Math.abs(cur.x - to.x) + Math.abs(cur.y - to.y) < 0.05;
      el.style.translate = settled && !to.x && !to.y ? '' : `${cur.x.toFixed(2)}px ${cur.y.toFixed(2)}px`;
      raf = settled ? 0 : requestAnimationFrame(loop);
    };
    const pull = (x, y) => { to.x = x; to.y = y; if (!raf) raf = requestAnimationFrame(loop); };

    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      pull((e.clientX - r.left - r.width / 2) * 0.3, (e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => pull(0, 0));
  });
}

/* ---------- Pointer-tracked effects: spotlight borders, image parallax ---------- */
function initPointerEffects() {
  if (!finePointer) return;
  $$('[data-spotlight]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--x', `${e.clientX - r.left}px`);
      el.style.setProperty('--y', `${e.clientY - r.top}px`);
    });
  });

  if (reduceMotion) return;
  $$('.project__card').forEach((card) => {
    const media = $('.project__media', card);
    if (!media) return;
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      media.style.setProperty('--mx', `${nx * -14}px`);
      media.style.setProperty('--my', `${ny * -14}px`);
    });
    card.addEventListener('pointerleave', () => {
      media.style.setProperty('--mx', '0px');
      media.style.setProperty('--my', '0px');
    });
  });
}

/* ---------- Rotating word ([data-rotate="a|b|c"]) ---------- */
function initRotator() {
  if (reduceMotion) return;
  $$('[data-rotate]').forEach((el) => {
    const words = el.dataset.rotate.split('|');
    if (words.length < 2) return;
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      el.classList.add('is-out');
      setTimeout(() => {
        i = (i + 1) % words.length;
        el.textContent = words[i];
        el.classList.replace('is-out', 'is-pre');
        void el.offsetWidth; // commit the start position before easing in
        el.classList.remove('is-pre');
      }, 420);
    }, 2800);
  });
}

/* ---------- Scroll-linked: hero parallax, stacked cards, pipeline, marquee ----------
   One rAF-throttled pass reads layout, then writes custom properties for CSS to use. */
function initScrollEffects() {
  const steps = $('.pipeline__steps');
  const stepItems = steps ? $$('.step', steps) : [];
  if (reduceMotion) { stepItems.forEach((s) => s.classList.add('is-on')); return; }

  const stackQuery = matchMedia('(min-width: 64rem) and (min-height: 44rem)');
  const hero = $('.hero');
  const projects = $$('[data-project]');
  const parallax = $$('[data-parallax]');
  const track = $('.marquee__track');
  let lastY = scrollY;
  let skew = 0;
  let skewTarget = 0;
  let ticking = false;
  let skewRaf = 0;

  const update = () => {
    ticking = false;
    const vh = innerHeight;

    if (hero) {
      const h = hero.offsetHeight;
      if (scrollY <= h) hero.style.setProperty('--hp', clamp(scrollY / h, 0, 1).toFixed(4));
    }

    if (stackQuery.matches) {
      projects.forEach((li, i) => {
        const card = li.firstElementChild;
        const next = projects[i + 1];
        if (!next) return;
        const a = li.getBoundingClientRect();
        const b = next.getBoundingClientRect();
        const p = clamp(1 - (b.top - a.top) / a.height, 0, 1);
        card.style.setProperty('--s', (1 - p * 0.06).toFixed(4));
        card.style.setProperty('--b', (1 - p * 0.55).toFixed(3));
      });
    } else {
      projects.forEach((li) => {
        li.firstElementChild.style.removeProperty('--s');
        li.firstElementChild.style.removeProperty('--b');
      });
    }

    if (steps) {
      const r = steps.getBoundingClientRect();
      if (r.bottom > -vh && r.top < vh * 2) {
        const p = clamp((vh * 0.62 - r.top) / r.height, 0, 1);
        steps.style.setProperty('--pp', p.toFixed(4));
        stepItems.forEach((s) => s.classList.toggle('is-on', s.offsetTop <= p * r.height + 1));
      }
    }

    parallax.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const offset = (r.top + r.height / 2 - vh / 2) * -parseFloat(el.dataset.parallax || '0.1');
      el.style.setProperty('--py', `${offset.toFixed(1)}px`);
    });
  };

  // The marquee leans with scroll speed, then settles and stops its own loop.
  const skewLoop = () => {
    skew = lerp(skew, skewTarget, 0.1);
    skewTarget *= 0.85;
    track.style.setProperty('--skew', `${skew.toFixed(2)}deg`);
    skewRaf = Math.abs(skew) > 0.02 || Math.abs(skewTarget) > 0.02 ? requestAnimationFrame(skewLoop) : 0;
  };

  addEventListener('scroll', () => {
    if (track) {
      skewTarget = clamp((scrollY - lastY) * -0.25, -8, 8);
      if (!skewRaf) skewRaf = requestAnimationFrame(skewLoop);
    }
    lastY = scrollY;
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  addEventListener('resize', update);
  stackQuery.addEventListener('change', update);
  update();
}

/* ---------- Hero canvas: a routing lattice ----------
   A grid of nodes with packets that travel along its rows and columns, turning
   at intersections. The pointer lights nearby nodes and draws a crosshair.     */
function initHeroCanvas() {
  const canvas = $('.hero__canvas');
  const hero = $('.hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  const glow = $('.hero__glow');
  const ACCENT = '255, 107, 61';
  const INK = '237, 237, 234';
  const REACH = 170;
  const TRAIL = 38;

  let w = 0, h = 0, gap = 44, cols = 0, rows = 0, ox = 0, oy = 0;
  let packets = [];
  let maxPackets = 12;
  let running = false;
  let last = 0;
  const mouse = { x: -9999, y: -9999, gx: 0, gy: 0, tx: 0, ty: 0 };

  const resize = () => {
    const r = hero.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gap = w < 640 ? 32 : 44;
    cols = Math.ceil(w / gap) + 1;
    rows = Math.ceil(h / gap) + 1;
    ox = (w - (cols - 1) * gap) / 2;
    oy = (h - (rows - 1) * gap) / 2;
    maxPackets = clamp(Math.round((cols * rows) / 60), 5, 16);
    packets = [];
    mouse.gx = mouse.tx = w * 0.72;
    mouse.gy = mouse.ty = h * 0.3;
    if (!running) draw(0);
  };

  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const spawn = () => {
    const [dc, dr] = DIRS[(Math.random() * 4) | 0];
    packets.push({
      c: (Math.random() * cols) | 0, r: (Math.random() * rows) | 0,
      dc, dr, t: 0,
      speed: 0.035 + Math.random() * 0.035,     // cells per frame
      hops: 5 + ((Math.random() * 14) | 0),
      trail: [], done: false,
    });
  };

  const advance = (p, dt) => {
    if (p.done) { p.trail.splice(0, 2); return; }
    p.t += p.speed * dt;
    if (p.t >= 1) {
      p.t = 0; p.c += p.dc; p.r += p.dr; p.hops--;
      if (Math.random() < 0.35) [p.dc, p.dr] = p.dc ? [0, Math.random() < 0.5 ? 1 : -1] : [Math.random() < 0.5 ? 1 : -1, 0];
      if (p.hops <= 0 || p.c < 0 || p.r < 0 || p.c >= cols || p.r >= rows) p.done = true;
    }
    p.trail.push(ox + (p.c + p.dc * p.t) * gap, oy + (p.r + p.dr * p.t) * gap);
    if (p.trail.length > TRAIL * 2) p.trail.splice(0, 2);
  };

  const draw = (time) => {
    const dt = last ? clamp((time - last) / 16.67, 0.2, 3) : 1;
    last = time;
    ctx.clearRect(0, 0, w, h);

    // Crosshair on the lattice lines nearest the pointer.
    if (mouse.x > -999) {
      const cx = ox + Math.round((mouse.x - ox) / gap) * gap;
      const cy = oy + Math.round((mouse.y - oy) / gap) * gap;
      const gh = ctx.createLinearGradient(cx - 420, 0, cx + 420, 0);
      gh.addColorStop(0, `rgba(${ACCENT}, 0)`); gh.addColorStop(0.5, `rgba(${ACCENT}, 0.28)`); gh.addColorStop(1, `rgba(${ACCENT}, 0)`);
      ctx.fillStyle = gh; ctx.fillRect(cx - 420, cy - 0.5, 840, 1);
      const gv = ctx.createLinearGradient(0, cy - 420, 0, cy + 420);
      gv.addColorStop(0, `rgba(${ACCENT}, 0)`); gv.addColorStop(0.5, `rgba(${ACCENT}, 0.28)`); gv.addColorStop(1, `rgba(${ACCENT}, 0)`);
      ctx.fillStyle = gv; ctx.fillRect(cx - 0.5, cy - 420, 1, 840);
    }

    // Nodes: a slow wave of brightness, plus a lift around the pointer.
    const phase = time * 0.0007;
    for (let c = 0; c < cols; c++) {
      const x = ox + c * gap;
      for (let r = 0; r < rows; r++) {
        const y = oy + r * gap;
        const d = Math.hypot(x - mouse.x, y - mouse.y);
        const k = d < REACH ? 1 - d / REACH : 0;
        const wave = Math.sin(c * 0.35 + r * 0.22 + phase);
        const size = 1.5 + k * 2;
        ctx.fillStyle = k > 0.04
          ? `rgba(${ACCENT}, ${(0.25 + k * 0.75).toFixed(3)})`
          : `rgba(${INK}, ${(0.2 + wave * 0.1).toFixed(3)})`;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
    }

    if (!reduceMotion) {
      if (packets.length < maxPackets && Math.random() < 0.06 * dt) spawn();
      ctx.lineWidth = 1;
      for (const p of packets) {
        advance(p, dt);
        const t = p.trail;
        const n = t.length / 2;
        for (let i = 1; i < n; i++) {
          const a = (i / n) ** 1.6 * 0.9;
          ctx.strokeStyle = `rgba(${ACCENT}, ${a.toFixed(3)})`;
          ctx.beginPath(); ctx.moveTo(t[i * 2 - 2], t[i * 2 - 1]); ctx.lineTo(t[i * 2], t[i * 2 + 1]); ctx.stroke();
        }
        if (n && !p.done) {
          const x = t[t.length - 2], y = t[t.length - 1];
          ctx.fillStyle = `rgba(${ACCENT}, 0.16)`;
          ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = `rgb(${ACCENT})`;
          ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
        }
      }
      packets = packets.filter((p) => !p.done || p.trail.length);

      if (glow) {
        mouse.gx = lerp(mouse.gx, mouse.tx, 0.04);
        mouse.gy = lerp(mouse.gy, mouse.ty, 0.04);
        glow.style.setProperty('--gx', `${mouse.gx.toFixed(1)}px`);
        glow.style.setProperty('--gy', `${mouse.gy.toFixed(1)}px`);
      }
    }

    if (running) requestAnimationFrame(draw);
  };

  if (finePointer) {
    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = mouse.tx = e.clientX - r.left;
      mouse.y = mouse.ty = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
  }

  let resizeTimer;
  let lastW = 0;
  addEventListener('resize', () => {
    // Mobile browsers fire resize as the URL bar hides; only width changes matter there.
    if (innerWidth === lastW && !finePointer) return;
    lastW = innerWidth;
    clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150);
  });
  lastW = innerWidth;
  resize();

  if (reduceMotion) return; // One static frame is enough.

  // Only animate while the hero is on screen and the tab is visible.
  let visible = true;
  const setRunning = () => {
    const should = visible && !document.hidden;
    if (should && !running) { running = true; last = 0; requestAnimationFrame(draw); }
    else if (!should) running = false;
  };
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; setRunning(); }).observe(hero);
  document.addEventListener('visibilitychange', setRunning);
}

/* ---------- Live local time (IST) ---------- */
function initClock() {
  const clocks = $$('[data-clock]');
  if (!clocks.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tick = () => {
    const t = fmt.format(new Date());
    clocks.forEach((c, i) => { c.textContent = i === 0 ? `IST ${t}` : `${t} IST`; });
  };
  tick();
  setInterval(tick, 1000);
}

/* ---------- Copy email ---------- */
function initCopy() {
  $$('[data-copy]').forEach((btn) => {
    const text = $('[data-copy-label]', btn);
    const original = text.textContent;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        text.textContent = 'Copied!';
      } catch {
        text.textContent = 'Press ⌘C';
      }
      btn.classList.add('is-copied');
      setTimeout(() => { text.textContent = original; btn.classList.remove('is-copied'); }, 2000);
    });
  });
}

initSplit();
initIntro();
initReveal();
initHeader();
initNav();
initCursor();
initMagnetic();
initPointerEffects();
initRotator();
initScrollEffects();
initHeroCanvas();
initClock();
initCopy();
