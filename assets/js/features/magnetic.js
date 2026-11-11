/* Magnetic buttons ([data-magnetic]). */
import { reduceMotion, finePointer, $$, lerp } from '../utils.js';

/* ---------- Magnetic buttons: eased pull toward the pointer, spring back on leave ---------- */
export function initMagnetic() {
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
