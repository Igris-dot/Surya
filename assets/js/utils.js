/* Shared helpers and media-query flags used by every feature module. */

export const root = document.documentElement;
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;
