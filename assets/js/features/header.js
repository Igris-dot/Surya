/* Header: scrolled state, hide on scroll down, progress bar, active nav pill. */
import { root, finePointer, $, $$ } from '../utils.js';

/* ---------- Header: scrolled state, hide on scroll down, active section ---------- */
export function initHeader() {
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
