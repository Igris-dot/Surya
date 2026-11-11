/* Custom cursor with labels ([data-cursor]). */
import { root, reduceMotion, finePointer, $, lerp } from '../utils.js';

/* ---------- Custom cursor ---------- */
export function initCursor() {
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
