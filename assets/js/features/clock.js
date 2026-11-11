/* Live local time ([data-clock]). */
import { $$ } from '../utils.js';

/* ---------- Live local time (IST) ---------- */
export function initClock() {
  const clocks = $$('[data-clock]');
  if (!clocks.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tick = () => {
    const t = fmt.format(new Date());
    clocks.forEach((c, i) => { c.textContent = i === 0 ? `IST ${t}` : `${t} IST`; });
  };
  tick();
  setInterval(tick, 1000);
}
