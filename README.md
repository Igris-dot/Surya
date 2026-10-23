# Dhana Surya — Portfolio

A single-page, dependency-free portfolio. Plain HTML, one stylesheet, one script.
No build step: edit a file, refresh the browser.

```
.
├── index.html            all content (hero, work, research, skills, about, contact)
├── assets/
│   ├── css/styles.css    all styles; design tokens live at the top in :root
│   ├── js/main.js        all behavior (motion, nav, cursor, hero canvas, clock)
│   └── images/
├── vercel.json           redirects old /work.html, /research.html, /contact.html to sections
└── package.json          `npm run serve` → http://localhost:8080
```

## Run locally

```bash
npm run serve        # or any static server, e.g. npx serve .
```

## Design system

- **Type:** Geist (UI), Instrument Serif (display and italic accents), Geist Mono (labels and data).
- **Color:** near-black ink `#0a0a0b`, warm white `#ededea`, signal orange `#ff6b3d`.
  All text pairs meet WCAG AA. `--dim` is only used for decorative or large text.
- **Tokens:** change palette, fonts, type scale, spacing and easing in the `:root` block of `styles.css`.

## Motion

| Effect | Where |
| --- | --- |
| Intro loader with counter (first visit per session) | `initIntro` |
| Line-by-line hero title, word-by-word section titles | `initSplit`, `initReveal` |
| Blur-and-rise reveals, staggered as elements enter | `[data-reveal]` |
| Count-up metrics | `[data-count]` |
| Live telemetry network canvas that reacts to the pointer | `initHeroCanvas` |
| Custom cursor with labels on project images | `initCursor`, `[data-cursor]` |
| Magnetic buttons | `[data-magnetic]` |
| Project cards that pin and stack while scrolling | `initScrollEffects` |
| Marquee that skews with scroll speed | `initScrollEffects` |
| Spotlight border on skill cards | `[data-spotlight]` |
| Animated research pipeline (packet + step pulse) | CSS `@keyframes packet`, `stepPulse` |

Everything is progressive: without JavaScript all content is visible.
With `prefers-reduced-motion: reduce`, the loader, cursor, grain and all movement are switched off.

## Editing content

- **Add a project:** copy one `<li class="project">` block in `index.html`. The stacking effect
  applies automatically (add a `top` offset for a 4th card in section 14 of `styles.css`).
- **Add a skill group:** copy a `<li class="bento__item">`; add `bento__item--wide` to span two columns.
- **Add a timeline entry:** copy a `<li>` inside `.timeline`.

## Accessibility

Semantic landmarks, one `<h1>`, a skip link, `aria-current` on the active nav link, visible focus
rings, real buttons for the menu and copy actions, and `<dl>` for every metric.
Split headlines keep their full text in `aria-label`.
