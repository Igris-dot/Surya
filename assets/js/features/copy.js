/* Copy-to-clipboard buttons ([data-copy]). */
import { $, $$ } from '../utils.js';

/* ---------- Copy email ---------- */
export function initCopy() {
  $$('[data-copy]').forEach((btn) => {
    const text = $('[data-copy-label]', btn);
    const original = text.textContent;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        text.textContent = 'Copied!';
      } catch {
        text.textContent = 'Press ⌘C';
      }
      btn.classList.add('is-copied');
      setTimeout(() => { text.textContent = original; btn.classList.remove('is-copied'); }, 2000);
    });
  });
}
