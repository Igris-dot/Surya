/* Scroll reveals ([data-reveal]) and count-up numbers ([data-count]). */
import { root, reduceMotion, $$, clamp } from '../utils.js';

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

export function initReveal() {
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
