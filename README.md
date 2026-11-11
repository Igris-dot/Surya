# Dhana Surya — Portfolio

A single-page, dependency-free portfolio: plain HTML, CSS and JavaScript, split into one file per
section. A small build script (Node standard library only) joins the HTML sections into `index.html`.
CSS and JavaScript need no build: browsers load the section files directly.

```
.
├── src/                      HTML source — edit here, never index.html
│   ├── index.html            page skeleton: lists the sections in order
│   ├── partials/             head, icons, chrome (loader, grain, guides, cursor), header, footer
│   └── sections/             hero, metrics, marquee, work, research, skills, about, contact
├── assets/
│   ├── css/                  one stylesheet per section, loaded in filename order
│   │   ├── 01-tokens.css     colours, fonts, type scale, spacing, easing (:root)
│   │   ├── 02-base.css … 12-contact.css
│   │   ├── 13-motion.css     reveal states and transitions
│   │   ├── 14-responsive.css all breakpoints, largest first
│   │   └── 15-reduced-motion.css
│   ├── js/
│   │   ├── main.js           entry point: imports each feature and starts it, in order
│   │   ├── utils.js          shared helpers ($, $$, clamp, lerp) and media-query flags
│   │   └── features/         one module per behaviour (see Motion below)
│   └── images/
├── scripts/build.mjs         builds index.html from src/
├── index.html                generated — do not edit by hand
├── vercel.json               runs the build on deploy; redirects old /work.html etc. to sections
└── package.json
```

## Commands

```bash
npm run serve    # build, then serve at http://localhost:8080
npm run build    # rebuild index.html after editing anything in src/
npm run watch    # rebuild automatically while you edit
npm run check    # fail if index.html is out of date (useful before committing)
```

Vercel runs `npm run build` on every deploy, so the live site is always built from `src/`.

## How to edit

| To change… | Edit |
| --- | --- |
| Text or markup in a section | `src/sections/<section>.html`, then `npm run build` |
| Page title, meta tags, fonts | `src/partials/head.html` |
| Navigation links | `src/partials/header.html` |
| Section order, or add a section | `src/index.html` — add an `<!-- @include sections/<name>.html -->` line |
| Colours, fonts, spacing | `assets/css/01-tokens.css` |
| A section's styles | its numbered file in `assets/css/` (refresh the browser — no build) |
| Layout at a breakpoint | `assets/css/14-responsive.css` |
| A behaviour | its module in `assets/js/features/` (refresh the browser — no build) |

**Adding a stylesheet:** create it in `assets/css/` with a number prefix that puts it in the right
place in the cascade (later files override earlier ones), then run `npm run build`. The build adds
the `<link>` tag itself.

**Adding a script feature:** create `assets/js/features/<name>.js` that exports an `init…` function,
import and call it in `main.js`, then run `npm run build`. The build adds a preload tag for every
module `main.js` imports, so they download in parallel.

The build stops with an error if an included file or any linked local file is missing.

## Design system

- **Type:** Geist (UI), Instrument Serif (display and italic accents), Geist Mono (labels and data).
- **Colour:** near-black ink `#0a0a0b`, warm white `#ededea`, signal orange `#ff6b3d`.
  All text pairs meet WCAG AA. `--dim` is only used for decorative or large text.
- **Layout:** content spans the full width of the screen, inset by `--gutter` so it lines up with
  the header. Running text keeps its own `max-width` so lines stay readable on wide screens.
- **Structure:** hairline rules, a faint column grid behind the page (`.guides`) and mono labels
  carry the layout. Cards are reserved for the three projects; everything else sits on the grid.

## Page sections

| Section | File | Markup |
| --- | --- | --- |
| Hero: title, rotating focus label, lattice canvas | `sections/hero.html` | `.hero` |
| Key metrics and scrolling marquee | `sections/metrics.html`, `sections/marquee.html` | `.metrics`, `.marquee` |
| Work: three framed projects that pin and stack | `sections/work.html` | `.project` |
| Research: stats, request inspector, pipeline, benchmark figure | `sections/research.html` | `.research__stats`, `.inspector`, `.pipeline`, `.research__figure` |
| Skills: a ruled ledger, one row per group | `sections/skills.html` | `.ledger__row` |
| About: portrait, bio, timeline | `sections/about.html` | `.about`, `.timeline` |
| Contact | `sections/contact.html` | `.contact` |
| Footer | `partials/footer.html` | `.footer` |

The request inspector shows sample requests only. It is labelled "Illustration · simulated traffic"
in the page and is not measured data.

## Motion

Markup opts in with data attributes; the feature modules write CSS custom properties and the
stylesheets do the drawing.

| Effect | Hook | Module (`assets/js/features/`) |
| --- | --- | --- |
| Intro loader with counter (first visit per session) | `.loader`, `[data-loader-count]` | `intro.js` |
| Hero title and footer name by character, section titles by word | `[data-chars]`, `[data-split]` (`--ci`, `--li`, `--i`) | `text-split.js`, `reveal.js` |
| Blur-and-rise reveals, staggered as elements enter | `[data-reveal]` (`--d`) | `reveal.js` |
| Wipe-in for images and figures | `[data-reveal="clip"]` | `reveal.js` |
| Count-up metrics | `[data-count]`, `[data-decimals]` | `reveal.js` |
| Routing lattice with packets and a pointer crosshair | `.hero__canvas` (`--gx`, `--gy`) | `hero-canvas.js` |
| Header that hides on scroll down, progress bar, sliding nav pill | `--p`, `--x`, `--w`, `--o` | `header.js` |
| Mobile menu | `.nav__toggle` | `mobile-menu.js` |
| Custom cursor with labels on project images | `[data-cursor]` | `cursor.js` |
| Magnetic buttons | `[data-magnetic]` | `magnetic.js` |
| Spotlight border and image parallax on hover | `[data-spotlight]`, `[data-project]` (`--mx`, `--my`) | `pointer-effects.js` |
| Rotating word in the hero | `[data-rotate="a\|b\|c"]` | `rotator.js` |
| Hero scroll-out, stacked project cards, pipeline wire, image parallax, marquee skew | `--hp`, `--s`, `--b`, `--pp`, `--py`, `--skew` | `scroll-effects.js` |
| Live local time | `[data-clock]` | `clock.js` |
| Copy email | `[data-copy]` | `copy.js` |
| Inspector scan line, status pings | CSS `@keyframes scan`, `ping`, `blink` | CSS only |

Everything is progressive: without JavaScript all content is visible.
With `prefers-reduced-motion: reduce`, the loader, cursor, grain and all movement are switched off
and the lattice draws a single still frame. Pointer effects only run on devices with a fine pointer and hover.

## Editing content

- **Add a project:** copy one `<li class="project" data-project>` block in `src/sections/work.html`.
  For a 4th card, add a `.project:nth-child(4)` `top` offset next to the others in `14-responsive.css`.
- **Add a skill group:** copy a `<li class="ledger__row">` in `src/sections/skills.html`.
- **Add a pipeline step:** copy a `<li class="step">` in `src/sections/research.html`.
  The wire and step highlights adapt to the count.
- **Add a timeline entry:** copy a `<li>` inside `.timeline` in `src/sections/about.html`.
- **Change the hero's rotating words:** edit `data-rotate` in `src/sections/hero.html` (values separated by `|`).
- **Update section counters:** the `01 / 05` labels in each `.section-head__count` are written by hand.

Run `npm run build` after any change in `src/`.

## Accessibility

Semantic landmarks, one `<h1>`, a skip link, `aria-current` on the active nav link, visible focus
rings, real buttons for the menu and copy actions, and `<dl>` for every metric.
Split headlines keep their full text in `aria-label`. Decorative layers (canvas, guides, grain,
cursor) are hidden from assistive technology.
