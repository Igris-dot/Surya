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

  const tick = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const value = Math.round(eased * 100);
    count.textContent = String(value).padStart(2, '0');
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

/* ---------- Split headlines into words for the staggered reveal ---------- */
function initSplit() {
  $$('[data-split]').forEach((el) => {
    let i = 0;
    const wrap = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.className = 'w__i';
            inner.style.setProperty('--i', i++);
            inner.textContent = part;
            w.append(inner);
            frag.append(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          wrap(child);
        }
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    wrap(el);
    $$('.w', el).forEach((w) => w.setAttribute('aria-hidden', 'true'));
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
  const items = $$('[data-reveal], [data-split]');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    // Stagger elements that enter together.
    entries
      .filter((e) => e.isIntersecting)
      .forEach((entry, index) => {
        const el = entry.target;
        el.style.setProperty('--d', index * 90);
        el.classList.add('is-in');
        $$('[data-count]', el).forEach(animateCount);
        io.unobserve(el);
      });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

  // Hero items wait for the intro to finish.
  const heroItems = items.filter((el) => el.closest('.hero'));
  const rest = items.filter((el) => !el.closest('.hero'));
  rest.forEach((el) => io.observe(el));

  const startHero = () => heroItems.forEach((el, i) => {
    el.style.setProperty('--d', 450 + i * 120);
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
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.setProperty('--p', max > 0 ? y / max : 0);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Show the header again when keyboard focus moves into it.
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  const links = $$('.nav__link');
  const sections = links.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((l) => {
        const active = l.getAttribute('href') === `#${entry.target.id}`;
        l.classList.toggle('is-active', active);
        if (active) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
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
  const label = $('.cursor__label', cursor);
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { ...pos };

  addEventListener('pointermove', (e) => {
    target.x = e.clientX;
    target.y = e.clientY;
    cursor.classList.add('is-visible');
  }, { passive: true });
  document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));

  document.addEventListener('pointerover', (e) => {
    const labelled = e.target.closest('[data-cursor]');
    const link = e.target.closest('a, button');
    cursor.classList.toggle('is-label', !!labelled);
    cursor.classList.toggle('is-link', !!link && !labelled);
    if (labelled) label.textContent = labelled.dataset.cursor;
  });

  const loop = () => {
    pos.x = lerp(pos.x, target.x, 0.2);
    pos.y = lerp(pos.y, target.y, 0.2);
    cursor.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* ---------- Magnetic buttons ---------- */
function initMagnetic() {
  if (!finePointer || reduceMotion) return;
  $$('[data-magnetic]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.3;
      const y = (e.clientY - r.top - r.height / 2) * 0.4;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });
}

/* ---------- Pointer-tracked effects: spotlight cards, image parallax ---------- */
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
      media.style.setProperty('--mx', `${nx * -18}px`);
      media.style.setProperty('--my', `${ny * -18}px`);
    });
    card.addEventListener('pointerleave', () => {
      media.style.setProperty('--mx', '0px');
      media.style.setProperty('--my', '0px');
    });
  });
}

/* ---------- Scroll-linked: stacked project cards + marquee skew ---------- */
function initScrollEffects() {
  if (reduceMotion) return;
  const stackQuery = matchMedia('(min-width: 64rem) and (min-height: 44rem)');
  const projects = $$('[data-project]');
  const track = $('.marquee__track');
  let lastY = scrollY;
  let skew = 0;
  let ticking = false;

  const update = () => {
    ticking = false;
    if (stackQuery.matches) {
      projects.forEach((li, i) => {
        const card = li.firstElementChild;
        const next = projects[i + 1];
        if (!next) return;
        const a = li.getBoundingClientRect();
        const b = next.getBoundingClientRect();
        const p = clamp(1 - (b.top - a.top) / a.height, 0, 1);
        card.style.setProperty('--s', (1 - p * 0.06).toFixed(4));
        card.style.setProperty('--b', (1 - p * 0.5).toFixed(3));
      });
    } else {
      projects.forEach((li) => {
        li.firstElementChild.style.removeProperty('--s');
        li.firstElementChild.style.removeProperty('--b');
      });
    }
  };

  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  stackQuery.addEventListener('change', update);
  update();

  if (!track) return;
  const skewLoop = () => {
    const velocity = scrollY - lastY;
    lastY = scrollY;
    skew = lerp(skew, clamp(velocity * -0.15, -8, 8), 0.1);
    track.style.setProperty('--skew', `${skew.toFixed(2)}deg`);
    requestAnimationFrame(skewLoop);
  };
  skewLoop();
}

/* ---------- Hero canvas: a drifting telemetry network with moving packets ---------- */
function initHeroCanvas() {
  const canvas = $('.hero__canvas');
  const hero = $('.hero');
  if (!canvas || !hero) return;
  const ctx = canvas.getContext('2d');
  const glow = $('.hero__glow');
  const ACCENT = '255, 107, 61';
  const INK = '237, 237, 234';
  const LINK_DIST = 150;

  let w = 0, h = 0, dpr = 1;
  let nodes = [];
  let packets = [];
  let running = false;
  const mouse = { x: -9999, y: -9999, gx: 0, gy: 0, tx: 0, ty: 0 };

  const resize = () => {
    const r = hero.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(clamp((w * h) / 15000, 28, 95));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.4 + 0.6,
      hub: Math.random() < 0.12,
    }));
    packets = [];
    mouse.gx = mouse.tx = w * 0.72;
    mouse.gy = mouse.ty = h * 0.3;
    if (!running) draw(0);
  };

  const spawnPacket = () => {
    const a = nodes[(Math.random() * nodes.length) | 0];
    let best = null, bestD = Infinity;
    for (const b of nodes) {
      if (b === a) continue;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < LINK_DIST && d < bestD && Math.random() > 0.3) { best = b; bestD = d; }
    }
    if (best) packets.push({ a, b: best, t: 0, speed: 0.008 + Math.random() * 0.01 });
  };

  const draw = (time) => {
    ctx.clearRect(0, 0, w, h);

    // Nodes drift and wrap around the edges; the pointer gently pushes them.
    for (const n of nodes) {
      if (!reduceMotion) {
        const dx = n.x - mouse.x, dy = n.y - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < 160 && d > 0) { n.x += (dx / d) * 0.6; n.y += (dy / d) * 0.6; }
        n.x += n.vx; n.y += n.vy;
        if (n.x < -20) n.x = w + 20; else if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20; else if (n.y > h + 20) n.y = -20;
      }
    }

    // Links
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > LINK_DIST) continue;
        const near = Math.hypot((a.x + b.x) / 2 - mouse.x, (a.y + b.y) / 2 - mouse.y) < 200;
        const alpha = (1 - d / LINK_DIST) * (near ? 0.45 : 0.12);
        ctx.strokeStyle = `rgba(${near ? ACCENT : INK}, ${alpha})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }

    // Nodes (hubs pulse like live vehicles)
    for (const n of nodes) {
      if (n.hub) {
        const pulse = (Math.sin(time / 600 + n.x) + 1) / 2;
        ctx.fillStyle = `rgba(${ACCENT}, ${0.12 * pulse})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, 6 + pulse * 8, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(${ACCENT}, 0.95)`;
        ctx.beginPath(); ctx.arc(n.x, n.y, 2.2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = `rgba(${INK}, 0.45)`;
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    // Packets travelling along links
    if (!reduceMotion) {
      if (packets.length < 14 && Math.random() < 0.08) spawnPacket();
      packets = packets.filter((p) => p.t <= 1);
      for (const p of packets) {
        p.t += p.speed;
        const x = lerp(p.a.x, p.b.x, p.t), y = lerp(p.a.y, p.b.y, p.t);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 10);
        grad.addColorStop(0, `rgba(${ACCENT}, 0.9)`);
        grad.addColorStop(1, `rgba(${ACCENT}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
      }

      if (glow) {
        mouse.gx = lerp(mouse.gx, mouse.tx, 0.04);
        mouse.gy = lerp(mouse.gy, mouse.ty, 0.04);
        glow.style.setProperty('--gx', `${mouse.gx}px`);
        glow.style.setProperty('--gy', `${mouse.gy}px`);
      }
    }

    if (running) requestAnimationFrame(draw);
  };

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    mouse.x = mouse.tx = e.clientX - r.left;
    mouse.y = mouse.ty = e.clientY - r.top;
  });
  hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });
  resize();

  if (reduceMotion) return; // One static frame is enough.

  // Only animate while the hero is on screen and the tab is visible.
  let visible = true;
  const setRunning = () => {
    const should = visible && !document.hidden;
    if (should && !running) { running = true; requestAnimationFrame(draw); }
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
    const label = $('[data-copy-label]', btn);
    const original = label.textContent;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        label.textContent = 'Copied!';
      } catch {
        label.textContent = 'Press ⌘C';
      }
      btn.classList.add('is-copied');
      setTimeout(() => { label.textContent = original; btn.classList.remove('is-copied'); }, 2000);
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
initScrollEffects();
initHeroCanvas();
initClock();
initCopy();
