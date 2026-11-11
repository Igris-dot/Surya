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
- **Structure:** hairline rules, a faint column grid behind the page (`.guides`) and mono labels
  carry the layout. Cards are reserved for the three projects; everything else sits on the grid.

`styles.css` is numbered by section (1 Tokens … 13 Motion system, 14 Responsive, 15 Reduced motion).

## Page sections

| Section | Markup |
| --- | --- |
| Hero: title, rotating focus label, lattice canvas, metrics, marquee | `.hero`, `.metrics`, `.marquee` |
| Work: three framed projects that pin and stack | `.project` |
| Research: stats, request inspector, pipeline, benchmark figure | `.research__stats`, `.inspector`, `.pipeline`, `.research__figure` |
| Skills: a ruled ledger, one row per group | `.ledger__row` |
| About: portrait, bio, timeline | `.about`, `.timeline` |
| Contact and footer | `.contact`, `.footer` |

The request inspector shows sample requests only. It is labelled "Illustration · simulated traffic"
in the page and is not measured data.

## Motion

Markup opts in with data attributes; `main.js` writes CSS custom properties and the stylesheet does the drawing.

| Effect | Hook | Driven by |
| --- | --- | --- |
| Intro loader with counter (first visit per session) | `.loader`, `[data-loader-count]` | `initIntro` |
| Hero title and footer name by character, section titles by word | `[data-chars]`, `[data-split]` (`--ci`, `--li`, `--i`) | `initSplit`, `initReveal` |
| Blur-and-rise reveals, staggered as elements enter | `[data-reveal]` (`--d`) | `initReveal` |
| Wipe-in for images and figures | `[data-reveal="clip"]` | `initReveal` |
| Count-up metrics | `[data-count]`, `[data-decimals]` | `initReveal` |
| Routing lattice with packets and a pointer crosshair | `.hero__canvas` (`--gx`, `--gy`) | `initHeroCanvas` |
| Header that hides on scroll down, progress bar | `--p` | `initHeader` |
| Sliding pill behind the active nav link, mobile menu | `--x`, `--w`, `--o` | `initHeader`, `initNav` |
| Custom cursor with labels on project images | `[data-cursor]` | `initCursor` |
| Magnetic buttons | `[data-magnetic]` | `initMagnetic` |
| Spotlight border and image parallax on hover | `[data-spotlight]`, `[data-project]` (`--mx`, `--my`) | `initPointerEffects` |
| Rotating word in the hero | `[data-rotate="a\|b\|c"]` | `initRotator` |
| Hero scroll-out, project cards that pin and stack | `--hp`, `--s`, `--b` | `initScrollEffects` |
| Pipeline wire that fills and lights each step | `[data-pipeline]` (`--pp`) | `initScrollEffects` |
| Image parallax | `[data-parallax="0.08"]` (`--py`) | `initScrollEffects` |
| Marquee that skews with scroll speed | `--skew` | `initScrollEffects` |
| Inspector scan line, status pings | CSS `@keyframes scan`, `ping`, `blink` | CSS only |

Everything is progressive: without JavaScript all content is visible.
With `prefers-reduced-motion: reduce`, the loader, cursor, grain and all movement are switched off
and the lattice draws a single still frame. Pointer effects only run on devices with a fine pointer and hover.

## Editing content

- **Add a project:** copy one `<li class="project" data-project>` block in `index.html`. For a 4th card,
  add a `.project:nth-child(4)` `top` offset next to the others in section 14 of `styles.css`.
- **Add a skill group:** copy a `<li class="ledger__row">` inside `.ledger`.
- **Add a pipeline step:** copy a `<li class="step">`. The wire and step highlights adapt to the count.
- **Add a timeline entry:** copy a `<li>` inside `.timeline`.
- **Change the hero's rotating words:** edit the `data-rotate` attribute (values separated by `|`).
- **Update section counters:** the `01 / 05` labels in each `.section-head__count` are written by hand.

## Accessibility

Semantic landmarks, one `<h1>`, a skip link, `aria-current` on the active nav link, visible focus
rings, real buttons for the menu and copy actions, and `<dl>` for every metric.
Split headlines keep their full text in `aria-label`. Decorative layers (canvas, guides, grain,
cursor) are hidden from assistive technology.
