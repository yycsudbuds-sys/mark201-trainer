// Formula typesetting check: converts every FIN 201 string (concept cards, Formula Vault, stems, options,
// explanations, worked solutions, step labels, error library, three seeds of every generator) through
// app/math.js and renders the result with KaTeX in node. Fails on any KaTeX parse error and writes a proof
// sheet (tools/math_proof.html) to eyeball against the exam formula sheet.
// Usage: node tools/math_check.mjs [path-to-katex.mjs]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { toLatex, segments } from '../app/math.js';
import { GENERATORS, rng } from '../app/courses/fin201/generators.js';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const katexPath = process.argv[2] || path.join(ROOT, 'app', 'vendor', 'katex', 'katex.min.js');
let katex;
if (katexPath.endsWith('.mjs')) katex = (await import(pathToFileURL(katexPath).href)).default;
else { const { createRequire } = await import('node:module'); katex = createRequire(import.meta.url)(katexPath); }

const strings = []; // { where, text, kind: 'display' | 'inline' }
const add = (where, text, kind) => { if (text && typeof text === 'string') strings.push({ where, text, kind }); };
for (const f of fs.readdirSync(path.join(ROOT, 'content', 'fin201')).filter(f => /^ch\d+\.json$/.test(f)).sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', 'fin201', f), 'utf8'));
  for (const c of d.concepts) {
    add(c.id + '.formula', c.formula, 'display');
    for (const k of ['definition', 'explain', 'example', 'contrast', 'trap', 'mnemonic']) add(c.id + '.' + k, c[k], 'inline');
  }
  for (const fm of d.formulas || []) { add(fm.id + '.formula', fm.formula, 'display'); add(fm.id + '.when', fm.when, 'inline'); add(fm.id + '.trap', fm.trap, 'inline'); }
  for (const q of d.questions) {
    add(q.id + '.stem', q.stem, 'inline'); add(q.id + '.explanation', q.explanation, 'inline');
    (q.options || []).forEach((o, i) => add(q.id + '.opt' + i, String(o), 'inline'));
    (q.solution || []).forEach((s, i) => add(q.id + '.sol' + i, s, 'inline'));
    (q.steps || []).forEach((s, i) => add(q.id + '.step' + i, s.label, 'inline'));
    (q.errors || []).forEach((e, i) => { add(q.id + '.err' + i, e.label, 'inline'); add(q.id + '.errx' + i, e.explain, 'inline'); });
  }
}
for (const [name, g] of Object.entries(GENERATORS)) {
  for (const seed of [11, 22, 33]) {
    const q = g.make(rng(seed));
    add('gen:' + name + '#' + seed + '.stem', q.stem, 'inline');
    (q.solution || []).forEach((s, i) => add('gen:' + name + '#' + seed + '.sol' + i, s, 'inline'));
    (q.steps || []).forEach((s, i) => add('gen:' + name + '#' + seed + '.step' + i, s.label, 'inline'));
    (q.errors || []).forEach((e, i) => { add('gen:' + name + '#' + seed + '.err' + i, e.label, 'inline'); add('gen:' + name + '#' + seed + '.errx' + i, e.explain, 'inline'); });
  }
}

const render = latex => katex.renderToString(latex, { displayMode: false, throwOnError: true, strict: 'ignore', trust: false, output: 'html' });
const failures = []; let mathRuns = 0, displayLines = 0, inlineStrings = 0, unparsed = 0;
const proofDisplay = []; const proofInline = [];
for (const s of strings) {
  if (s.kind === 'display') {
    const lines = toLatex(s.text);
    const html = [];
    for (const l of lines) {
      displayLines++;
      if (!l.latex) { unparsed++; failures.push({ where: s.where, text: l.text, err: 'no latex' }); html.push('<div class="plain">' + esc(l.text) + '</div>'); continue; }
      try { html.push('<div class="fl">' + render(l.latex) + '</div>'); } catch (e) { failures.push({ where: s.where, text: l.text, latex: l.latex, err: String(e.message || e).slice(0, 160) }); html.push('<div class="plain">' + esc(l.text) + '</div>'); }
    }
    proofDisplay.push({ where: s.where, text: s.text, html: html.join('') });
  } else {
    inlineStrings++;
    const segs = segments(s.text);
    let html = ''; let hasMath = false;
    for (const seg of segs) {
      if (!seg.math) { html += esc(seg.text); continue; }
      mathRuns++; hasMath = true;
      try { html += '<span class="m">' + render(seg.math) + '</span>'; } catch (e) { failures.push({ where: s.where, text: seg.text, latex: seg.math, err: String(e.message || e).slice(0, 160) }); html += '<span class="bad">' + esc(seg.text) + '</span>'; }
    }
    if (hasMath) proofInline.push({ where: s.where, text: s.text, html });
  }
}
function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

console.log('strings ' + strings.length + ' | display lines ' + displayLines + ' | inline strings ' + inlineStrings + ' with ' + mathRuns + ' maths runs in ' + proofInline.length + ' strings | failures ' + failures.length);
for (const f of failures.slice(0, 60)) console.log('FAIL ' + f.where + ' :: ' + f.text + ' :: ' + (f.latex || '') + ' :: ' + f.err);

// proof sheet: every display formula, then a deterministic sample of inline strings
const every = Math.max(1, Math.floor(proofInline.length / 220));
const sample = proofInline.filter((_, i) => i % every === 0).slice(0, 240);
const css = fs.readFileSync(path.join(ROOT, 'app', 'vendor', 'katex', 'katex.min.css'), 'utf8').replace(/url\(fonts\//g, 'url(../app/vendor/katex/fonts/');
const page = '<!doctype html><meta charset="utf-8"><title>Formula proof</title><style>' + css + '\nbody{font-family:Georgia,serif;max-width:1100px;margin:1rem auto;padding:0 1rem;color:#1b1710;background:#fbf7ef}.row{display:grid;grid-template-columns:220px 1fr 1fr;gap:1rem;border-top:1px solid #d8cdb8;padding:.5rem 0;align-items:start}.src{font-family:Consolas,monospace;font-size:.78rem;color:#555;white-space:pre-wrap}.where{font-size:.72rem;color:#8a6d3b;font-family:Consolas,monospace}.fl{margin:.15rem 0}.plain{color:#b00;font-family:Consolas,monospace}.bad{background:#fdd}.katex{font-size:1.08em}.m .katex{font-size:1.02em}h2{margin:2rem 0 .5rem;font-size:1rem;color:#8a6d3b;text-transform:uppercase;letter-spacing:.1em}.inl{display:grid;grid-template-columns:200px 1fr;gap:1rem;border-top:1px solid #d8cdb8;padding:.5rem 0;font-size:1rem;line-height:1.7}</style>'
  + '<h2>Display formulas (concept cards and Formula Vault): ' + proofDisplay.length + '</h2>'
  + proofDisplay.map(p => '<div class="row"><div class="where">' + esc(p.where) + '</div><div class="src">' + esc(p.text) + '</div><div>' + p.html + '</div></div>').join('')
  + '<h2>Inline sample (' + sample.length + ' of ' + proofInline.length + ' strings with maths)</h2>'
  + sample.map(p => '<div class="inl"><div class="where">' + esc(p.where) + '<div class="src">' + esc(p.text) + '</div></div><div>' + p.html + '</div></div>').join('');
fs.writeFileSync(path.join(ROOT, 'tools', 'math_proof.html'), page, 'utf8');
console.log('proof sheet: tools/math_proof.html');
if (failures.length) process.exit(1);
