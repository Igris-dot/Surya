/* Rotating word ([data-rotate]). */
import { reduceMotion, $$ } from '../utils.js';

/* ---------- Rotating word ([data-rotate="a|b|c"]) ---------- */
export function initRotator() {
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
