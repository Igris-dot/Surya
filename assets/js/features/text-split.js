/* Splits headings into words ([data-split]) and letters ([data-chars]). */
import { $$ } from '../utils.js';

/* ---------- Text splitting: words ([data-split]) and letters ([data-chars]) ----------
   Both keep the full sentence in aria-label and hide the pieces from assistive tech. */
function splitText(el, makePiece) {
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          frag.append(/^\s+$/.test(part) ? ' ' : makePiece(part));
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walk(child);
      }
    });
  };
  walk(el);
}

const span = (className, text) => {
  const s = document.createElement('span');
  s.className = className;
  if (text !== undefined) s.textContent = text;
  return s;
};

function label(el, pieceSelector) {
  if (el.getAttribute('aria-hidden') === 'true') return;
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  $$(pieceSelector, el).forEach((p) => p.setAttribute('aria-hidden', 'true'));
}

export function initSplit() {
  $$('[data-split]').forEach((el) => {
    let i = 0;
    splitText(el, (word) => {
      const w = span('w');
      const inner = span('w__i', word);
      inner.style.setProperty('--i', i++);
      w.append(inner);
      return w;
    });
    label(el, '.w');
  });

  $$('[data-chars]').forEach((el) => {
    const lines = $$('.line', el);
    (lines.length ? lines : [el]).forEach((line, li) => {
      let ci = 0;
      splitText(line, (word) => {
        const w = span('cw');
        [...word].forEach((ch) => {
          const c = span('c', ch);
          c.style.setProperty('--ci', ci++);
          c.style.setProperty('--li', li);
          w.append(c);
        });
        return w;
      });
    });
    label(el, '.line, .cw');
  });
}
