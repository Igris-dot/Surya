#!/usr/bin/env node
/**
 * Builds index.html from the section files in src/.
 *
 *   node scripts/build.mjs           write index.html
 *   node scripts/build.mjs --check   fail if index.html is out of date (nothing is written)
 *
 * src/index.html is the page skeleton. A line holding only a marker is replaced,
 * indented to match the marker:
 *
 *   <!-- @include sections/work.html -->      that file. The path is relative to the
 *                                              file holding the marker; includes can nest.
 *   <!-- @stylesheets assets/css -->           a <link rel="stylesheet"> for every .css file
 *                                              in that folder, in filename order (01-, 02-, …).
 *   <!-- @modulepreload assets/js/main.js -->  a <link rel="modulepreload"> for every module that
 *                                              file imports, directly or indirectly, so they
 *                                              download in parallel instead of one after another.
 *
 * @stylesheets and @modulepreload paths are relative to the site root.
 * The build also fails if the page links a local file (assets/…) that does not exist.
 * No dependencies: Node's standard library only.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = join(ROOT, 'src', 'index.html');
const OUT = join(ROOT, 'index.html');
const MARKER = /^(\s*)<!--\s*@(include|stylesheets|modulepreload)\s+(\S+)\s*-->\s*$/;
const BANNER = '<!-- Built from src/ by scripts/build.mjs. Edit the files in src/, then run `npm run build`. -->';

function stylesheets(dir) {
  if (!existsSync(join(ROOT, dir))) throw new Error(`@stylesheets folder not found: ${dir}`);
  const files = readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.css')).sort();
  if (!files.length) throw new Error(`@stylesheets folder has no .css files: ${dir}`);
  return files.map((f) => `<link rel="stylesheet" href="${posix.join(dir, f)}" />`);
}

// Static imports only: `import … from './x.js'`, `import './x.js'`, `export … from './x.js'`.
const IMPORT = /^\s*(?:import|export)\b[^'"]*?(?:from\s*)?['"](\.{1,2}\/[^'"]+)['"]/gm;
function modulepreload(entry) {
  const seen = new Set();
  const visit = (path) => {
    if (!existsSync(join(ROOT, path))) throw new Error(`Module not found: ${path}`);
    for (const [, spec] of readFileSync(join(ROOT, path), 'utf8').matchAll(IMPORT)) {
      const dep = posix.normalize(posix.join(posix.dirname(path), spec));
      if (!seen.has(dep)) { seen.add(dep); visit(dep); }
    }
  };
  visit(entry);
  return [...seen].map((m) => `<link rel="modulepreload" href="${m}" />`);
}

function expand(file, indent = '', stack = []) {
  const rel = relative(ROOT, file);
  if (!existsSync(file)) {
    throw new Error(`Missing include: ${rel}${stack.length ? ` (from ${relative(ROOT, stack.at(-1))})` : ''}`);
  }
  if (stack.includes(file)) {
    throw new Error(`Include loop: ${[...stack, file].map((f) => relative(ROOT, f)).join(' → ')}`);
  }
  const lines = readFileSync(file, 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
  return lines.flatMap((line) => {
    const m = line.match(MARKER);
    if (!m) return line === '' ? [''] : [indent + line];
    const [, pad, kind, arg] = m;
    if (kind === 'include') return expand(join(dirname(file), arg), indent + pad, [...stack, file]);
    const links = kind === 'stylesheets' ? stylesheets(arg) : modulepreload(arg);
    return links.map((l) => indent + pad + l);
  });
}

function checkAssets(html) {
  const refs = [...html.matchAll(/\s(?:href|src)="([^"#:?]+)"/g)].map((m) => m[1]);
  const missing = [...new Set(refs)].filter((ref) => !existsSync(join(ROOT, ref)));
  if (missing.length) throw new Error(`Linked files not found:\n  ${missing.join('\n  ')}`);
  return refs.length;
}

try {
  const lines = expand(ENTRY);
  if (!/^<!doctype html>$/i.test(lines[0])) throw new Error('src/index.html must start with <!DOCTYPE html>');
  lines.splice(1, 0, BANNER);
  const html = lines.join('\n') + '\n';
  const linked = checkAssets(html);

  if (process.argv.includes('--check')) {
    const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
    if (current !== html) {
      console.error('index.html is out of date with src/. Run: npm run build');
      process.exit(1);
    }
    console.log(`index.html is up to date (${linked} local links checked).`);
  } else {
    writeFileSync(OUT, html);
    console.log(`Built index.html: ${lines.length} lines, ${linked} local links checked.`);
  }
} catch (err) {
  console.error(`Build failed: ${err.message}`);
  process.exit(1);
}
