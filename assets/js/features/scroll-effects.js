/* Scroll-linked effects: hero, stacked cards, pipeline, parallax, marquee. */
import { reduceMotion, $, $$, clamp, lerp } from '../utils.js';

/* ---------- Scroll-linked: hero parallax, stacked cards, pipeline, marquee ----------
   One rAF-throttled pass reads layout, then writes custom properties for CSS to use. */
export function initScrollEffects() {
  const steps = $('.pipeline__steps');
  const stepItems = steps ? $$('.step', steps) : [];
  if (reduceMotion) { stepItems.forEach((s) => s.classList.add('is-on')); return; }

  const stackQuery = matchMedia('(min-width: 64rem) and (min-height: 44rem)');
  const hero = $('.hero');
  const projects = $$('[data-project]');
  const parallax = $$('[data-parallax]');
  const track = $('.marquee__track');
  let lastY = scrollY;
  let skew = 0;
  let skewTarget = 0;
  let ticking = false;
  let skewRaf = 0;

  const update = () => {
    ticking = false;
    const vh = innerHeight;

    if (hero) {
      const h = hero.offsetHeight;
      if (scrollY <= h) hero.style.setProperty('--hp', clamp(scrollY / h, 0, 1).toFixed(4));
    }

    if (stackQuery.matches) {
      projects.forEach((li, i) => {
        const card = li.firstElementChild;
        const next = projects[i + 1];
        if (!next) return;
        const a = li.getBoundingClientRect();
        const b = next.getBoundingClientRect();
        const p = clamp(1 - (b.top - a.top) / a.height, 0, 1);
        card.style.setProperty('--s', (1 - p * 0.06).toFixed(4));
        card.style.setProperty('--b', (1 - p * 0.55).toFixed(3));
      });
    } else {
      projects.forEach((li) => {
        li.firstElementChild.style.removeProperty('--s');
        li.firstElementChild.style.removeProperty('--b');
      });
    }

    if (steps) {
      const r = steps.getBoundingClientRect();
      if (r.bottom > -vh && r.top < vh * 2) {
        const p = clamp((vh * 0.62 - r.top) / r.height, 0, 1);
        steps.style.setProperty('--pp', p.toFixed(4));
        stepItems.forEach((s) => s.classList.toggle('is-on', s.offsetTop <= p * r.height + 1));
      }
    }

    parallax.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const offset = (r.top + r.height / 2 - vh / 2) * -parseFloat(el.dataset.parallax || '0.1');
      el.style.setProperty('--py', `${offset.toFixed(1)}px`);
    });
  };

  // The marquee leans with scroll speed, then settles and stops its own loop.
  const skewLoop = () => {
    skew = lerp(skew, skewTarget, 0.1);
    skewTarget *= 0.85;
    track.style.setProperty('--skew', `${skew.toFixed(2)}deg`);
    skewRaf = Math.abs(skew) > 0.02 || Math.abs(skewTarget) > 0.02 ? requestAnimationFrame(skewLoop) : 0;
  };

  addEventListener('scroll', () => {
    if (track) {
      skewTarget = clamp((scrollY - lastY) * -0.25, -8, 8);
      if (!skewRaf) skewRaf = requestAnimationFrame(skewLoop);
    }
    lastY = scrollY;
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  addEventListener('resize', update);
  stackQuery.addEventListener('change', update);
  update();
}
