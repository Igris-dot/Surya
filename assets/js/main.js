/**
 * main.js — entry point. Each feature lives in its own module in ./features/;
 * shared helpers are in ./utils.js. No dependencies.
 *
 * The page is fully readable without JavaScript. Each feature exits quietly when
 * its markup is missing, and anything decorative is skipped when the visitor
 * prefers reduced motion.
 *
 * Order matters: text is split before reveals observe it, and the intro sets the
 * classes that start the hero entrance.
 */
import { initSplit } from './features/text-split.js';
import { initIntro } from './features/intro.js';
import { initReveal } from './features/reveal.js';
import { initHeader } from './features/header.js';
import { initNav } from './features/mobile-menu.js';
import { initCursor } from './features/cursor.js';
import { initMagnetic } from './features/magnetic.js';
import { initPointerEffects } from './features/pointer-effects.js';
import { initRotator } from './features/rotator.js';
import { initScrollEffects } from './features/scroll-effects.js';
import { initHeroCanvas } from './features/hero-canvas.js';
import { initClock } from './features/clock.js';
import { initCopy } from './features/copy.js';

initSplit();
initIntro();
initReveal();
initHeader();
initNav();
initCursor();
initMagnetic();
initPointerEffects();
initRotator();
initScrollEffects();
initHeroCanvas();
initClock();
initCopy();
