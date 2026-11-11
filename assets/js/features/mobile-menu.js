/* Mobile menu toggle. */
import { $ } from '../utils.js';

/* ---------- Mobile menu ---------- */
export function initNav() {
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
