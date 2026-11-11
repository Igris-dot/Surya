/* Hero canvas: the routing lattice. */
import { reduceMotion, finePointer, $, clamp, lerp } from '../utils.js';

/* ---------- Hero canvas: a routing lattice ----------
   A grid of nodes with packets that travel along its rows and columns, turning
   at intersections. The pointer lights nearby nodes and draws a crosshair.     */
export function initHeroCanvas() {
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
