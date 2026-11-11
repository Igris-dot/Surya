/* Intro loader with a counter, then the hero entrance. */
import { root, reduceMotion, $, clamp } from '../utils.js';

/* ---------- Intro loader → hero entrance ---------- */
export function initIntro() {
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
