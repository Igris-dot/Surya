/* Spotlight borders ([data-spotlight]) and project image parallax. */
import { reduceMotion, finePointer, $, $$ } from '../utils.js';

/* ---------- Pointer-tracked effects: spotlight borders, image parallax ---------- */
export function initPointerEffects() {
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
