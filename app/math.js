// Formula typesetting. Content is written in keyboard notation ("P0 = D1/(R − g)", "σ_P = √(w_A²σ_A² + …)");
// this module parses it and renders it with KaTeX so it looks like the exam formula sheet: real fractions,
// subscripts, exponents, Σ and √. tokenize/toLatex/segments are pure (node can test them); mathText and
// formulaBlock need the DOM and window.katex (vendored in app/vendor/katex). Anything that fails to parse
// falls back to the original text, so a bad string can never blank a question.

const GREEK = { 'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\varepsilon', 'θ': '\\theta', 'λ': '\\lambda', 'μ': '\\mu', 'π': '\\pi', 'ρ': '\\rho', 'σ': '\\sigma', 'τ': '\\tau', 'φ': '\\phi', 'ϕ': '\\phi', 'ω': '\\omega', 'Δ': '\\Delta', '∆': '\\Delta', 'Ω': '\\Omega', 'Φ': '\\Phi', 'Θ': '\\Theta', 'Γ': '\\Gamma', 'Λ': '\\Lambda' };
const BIG = { 'Σ': '\\sum', '∑': '\\sum', 'Π': '\\prod', '∏': '\\prod' };
const SUPS = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
const OPS = { '=': '=', '+': '+', '-': '-', '−': '-', '–': '-', '×': '\\times', '·': '\\cdot', '⋅': '\\cdot', '÷': '/', '/': '/', '<': '<', '>': '>', '≤': '\\le', '≥': '\\ge', '≈': '\\approx', '≠': '\\ne', '→': '\\to', '⇒': '\\Rightarrow', '⇔': '\\Leftrightarrow', '±': '\\pm', '|': '\\mid', ':': ':', ',': ',', ';': ';', '∝': '\\propto', '≡': '\\equiv', '⊂': '\\subset', '∞': '\\infty' };
const QUAL_OPS = new Set(['=', '<', '>', '≤', '≥', '≈', '≠', '→', '⇒', '⇔', '×', '·', '⋅', '±', '∝', '≡']);
const FUNCS = { min: '\\min', max: '\\max', ln: '\\ln', log: '\\log', exp: '\\exp', tan: '\\tan', sin: '\\sin', cos: '\\cos', cov: '\\operatorname{cov}', var: '\\operatorname{var}', corr: '\\operatorname{corr}' };
// All-caps tokens that are English words, not symbols, when they sit next to maths ("= 11.74% PA").
const CAPS_WORDS = new Set(['PA', 'AND', 'OR', 'NOT', 'TRUE', 'FALSE', 'MC', 'TF', 'OK', 'TI', 'BA', 'II', 'PLUS', 'DOWN', 'UP', 'OWN', 'RUN', 'POPULATION', 'SAMPLE', 'USD', 'CAD', 'ALL', 'NO', 'YES', 'IF', 'SO', 'ON', 'IN', 'AT', 'TO', 'BY', 'OF', 'AN', 'AS', 'IS', 'IT', 'DO', 'THE', 'A', 'I']);
const SPLIT_SUBS = { CFN: ['CF', 'N'] };
const STOP_WORDS = new Set(['for', 'or', 'and', 'if', 'when', 'whenever', 'until', 'so', 'then', 'where', 'means', 'is', 'are', 'the', 'a', 'an', 'otherwise', 'else', 'unless', 'while', 'but', 'use', 'take', 'with', 'without', 'equal', 'equals']);

const RE_NUM = /(\d+(?:,\d{3}(?!\d))*(?:\.\d+)?|\.\d+)(%?)/y;
const RE_SUB = /[A-Za-z0-9]+(?:,[A-Za-z0-9]+)*/y;
const RE_SUP = /[+\-−]?[A-Za-z0-9.*]+/y;

function balanced(src, i) { // src[i] is an opener; returns the index after the matching closer, or -1
  const pairs = { '(': ')', '[': ']', '{': '}' }; const stack = [];
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (pairs[c]) stack.push(pairs[c]);
    else if (c === ')' || c === ']' || c === '}') { if (stack.pop() !== c) return -1; if (!stack.length) return j + 1; }
  }
  return -1;
}

export function tokenize(src) {
  const toks = []; const n = src.length; let i = 0;
  const push = (t, s, e, extra) => { toks.push(Object.assign({ t, s, e, raw: src.slice(s, e) }, extra || {})); i = e; };
  const prev = () => toks.length ? toks[toks.length - 1] : null;
  while (i < n) {
    const ch = src[i];
    if (/\s/.test(ch)) { let j = i + 1; while (j < n && /\s/.test(src[j])) j++; push('ws', i, j); continue; }
    if (ch === '_' && src[i + 1] === '_') { let j = i; while (j < n && src[j] === '_') j++; push('punct', i, j, { text: src.slice(i, j) }); continue; }
    if (/\d/.test(ch) || (ch === '.' && /\d/.test(src[i + 1] || ''))) { RE_NUM.lastIndex = i; const m = RE_NUM.exec(src); if (m) { push('num', i, i + m[0].length, { text: m[1], pct: !!m[2] }); continue; } }
    if (ch === '$') { push('dollar', i, i + 1); continue; }
    if (BIG[ch]) { push('big', i, i + 1, { latex: BIG[ch] }); continue; }
    if (ch === '√') { push('sqrt', i, i + 1); continue; }
    if (GREEK[ch]) { push('id', i, i + 1, { name: GREEK[ch], kind: 'greek' }); continue; }
    if (SUPS[ch]) { let j = i; let txt = ''; while (j < n && SUPS[src[j]]) { txt += SUPS[src[j]]; j++; } push('sup', i, j, { text: txt, grouped: false }); continue; }
    if (ch === '_' || ch === '^') {
      const nx = src[i + 1];
      if (nx === '{' || nx === '(' || (ch === '^' && nx === '[')) { const e = balanced(src, i + 1); if (e > 0) { push(ch === '_' ? 'sub' : 'sup', i, e, { text: src.slice(i + 2, e - 1), grouped: true }); continue; } }
      const re = ch === '_' ? RE_SUB : RE_SUP; re.lastIndex = i + 1; const m = re.exec(src);
      if (m && m[0].length) { push(ch === '_' ? 'sub' : 'sup', i, i + 1 + m[0].length, { text: m[0], grouped: false }); continue; }
      push('punct', i, i + 1, { text: ch }); continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      let j = i; while (j < n && /[A-Za-z]/.test(src[j])) j++;
      const letters = src.slice(i, j);
      let k = j; while (k < n && /\d/.test(src[k])) k++;
      const digits = src.slice(j, k); const letterAfter = k < n && /[A-Za-z]/.test(src[k]);
      if (digits && letterAfter) { let e = k; while (e < n && /[A-Za-z0-9]/.test(src[e])) e++; push('word', i, e, { text: src.slice(i, e) }); continue; }
      if (digits && (/^[A-Za-z]$/.test(letters) || /^[A-Z]+$/.test(letters))) { push('id', i, k, { name: letters, kind: 'latin', sub0: digits }); continue; }
      if (digits) { push('word', i, k, { text: src.slice(i, k) }); continue; }
      if (SPLIT_SUBS[letters]) { push('id', i, j, { name: SPLIT_SUBS[letters][0], kind: 'latin', sub0: SPLIT_SUBS[letters][1] }); continue; }
      if (letters.length === 1) { push('id', i, j, { name: letters, kind: 'latin' }); continue; }
      if (/^[A-Z]+$/.test(letters) && !CAPS_WORDS.has(letters)) { push('id', i, j, { name: letters, kind: 'latin' }); continue; }
      if (FUNCS[letters]) { push('id', i, j, { name: FUNCS[letters], kind: 'func' }); continue; }
      // a word: allow apostrophes and hyphens between letters (year's, after-tax)
      let e = j;
      for (;;) {
        if ((src[e] === "'" || src[e] === '’') && /[A-Za-z]/.test(src[e + 1] || '')) { e++; while (e < n && /[A-Za-z]/.test(src[e])) e++; continue; }
        if (src[e] === '-' && /[A-Za-z]/.test(src[e + 1] || '')) { e++; while (e < n && /[A-Za-z]/.test(src[e])) e++; continue; }
        break;
      }
      push('word', i, e, { text: src.slice(i, e) }); continue;
    }
    if (ch === '*') { const p = prev(); const nx = src[i + 1] || ''; if (p && (p.t === 'id' || p.t === 'close' || p.t === 'sub' || p.t === 'sup' || p.t === 'word') && !/[A-Za-z0-9(]/.test(nx)) { push('sup', i, i + 1, { text: '*', grouped: false }); continue; } push('op', i, i + 1, { text: '×', latex: '\\times' }); continue; }
    if (ch === '&') { push('amp', i, i + 1); continue; }
    if (ch === '…' || ch === '⋯') { push('dots', i, i + 1); continue; }
    if (ch === '.' && src[i + 1] === '.' && src[i + 2] === '.') { push('dots', i, i + 3); continue; }
    if (ch === '(' || ch === '[' || ch === '{') { push('open', i, i + 1, { ch }); continue; }
    if (ch === ')' || ch === ']' || ch === '}') { push('close', i, i + 1, { ch }); continue; }
    if (ch === '-' && src[i + 1] === '>') { push('op', i, i + 2, { text: '→', latex: '\\to' }); continue; }
    if (ch === '=' && src[i + 1] === '>') { push('op', i, i + 2, { text: '⇒', latex: '\\Rightarrow' }); continue; }
    if (ch === '<' && src[i + 1] === '=') { push('op', i, i + 2, { text: '≤', latex: '\\le' }); continue; }
    if (ch === '>' && src[i + 1] === '=') { push('op', i, i + 2, { text: '≥', latex: '\\ge' }); continue; }
    if (OPS[ch] !== undefined) { push('op', i, i + 1, { text: ch, latex: OPS[ch] }); continue; }
    push('punct', i, i + 1, { text: ch });
  }
  return toks;
}

/** Nest balanced brackets: a list of tokens and { t: 'group', open, close, kids } nodes. Unmatched brackets become punctuation. */
export function nest(toks) {
  const CLOSE = { '(': ')', '[': ']', '{': '}' };
  const root = []; const stack = [];
  let cur = root;
  for (const tk of toks) {
    if (tk.t === 'open') { const g = { t: 'group', open: tk.ch, close: CLOSE[tk.ch], kids: [], s: tk.s, e: tk.e }; cur.push(g); stack.push(g); cur = g.kids; continue; }
    if (tk.t === 'close') {
      const top = stack[stack.length - 1];
      if (top && top.close === tk.ch) { stack.pop(); top.e = tk.e; cur = stack.length ? stack[stack.length - 1].kids : root; continue; }
      cur.push({ t: 'punct', s: tk.s, e: tk.e, raw: tk.raw, text: tk.raw }); continue;
    }
    cur.push(tk);
  }
  while (stack.length) { // unmatched openers: flatten back into the parent as punctuation
    const g = stack.pop(); const parent = stack.length ? stack[stack.length - 1].kids : root; const at = parent.indexOf(g);
    parent.splice(at, 1, { t: 'punct', s: g.s, e: g.s + 1, raw: g.open, text: g.open }, ...g.kids);
  }
  return root;
}

function escText(s) { return s.replace(/[\\{}$%&#_^~]/g, m => m === '\\' ? '\\textbackslash{}' : m === '~' ? '\\textasciitilde{}' : m === '^' ? '\\textasciicircum{}' : '\\' + m); }
function subLatex(text) { // "T+1", "t-1", "AB", "nom", "real,i", "i=1"
  return text.split(',').map(p => {
    const t = p.trim();
    if (/^[a-z]{2,}$/.test(t)) return '\\mathrm{' + t + '}';
    if (/^[A-Za-z0-9]+$/.test(t)) return t;
    return renderString(t, { sub: true, inlineSlash: true }) || escText(t);
  }).join(',');
}
function supLatex(text, grouped) {
  let t = text.trim();
  if (t === '*') return '*';
  if (grouped && /^\(.*\)$/.test(t) && balanced(t, 0) === t.length) t = t.slice(1, -1);
  return renderString(t, { sub: true, inlineSlash: true }) || escText(t);
}

/** Turn a nested node list into items: atoms (with sub/sup attached) and operators. */
function toItems(nodes, ctx) {
  const items = [];
  const last = () => items.length ? items[items.length - 1] : null;
  const atom = (a) => { items.push(Object.assign({ type: 'atom' }, a)); };
  let pendingDollar = false; let pendingSqrt = false; let pendingDelta = null;
  const applyPrefixes = (a) => {
    if (pendingDollar) { a.latex = '\\$' + a.latex; a.dollar = true; pendingDollar = false; }
    if (pendingDelta) { a.latex = pendingDelta + ' ' + a.latex; a.delta = true; pendingDelta = null; }
    if (pendingSqrt) { a.latex = '\\sqrt{' + (a.kind === 'group' && (a.open === '(' || a.open === '[') && !a.sub && !a.sup ? a.inner : a.latex) + '}'; a.kind = 'sqrt'; a.tall = true; pendingSqrt = false; }
    return a;
  };
  const flushPending = () => {
    if (pendingDollar) { atom({ kind: 'text', latex: '\\$' }); pendingDollar = false; }
    if (pendingSqrt) { atom({ kind: 'text', latex: '\\surd' }); pendingSqrt = false; }
    if (pendingDelta) { atom({ kind: 'id', latex: pendingDelta, greek: true }); pendingDelta = null; }
  };
  for (let i = 0; i < nodes.length; i++) {
    const nd = nodes[i];
    if (nd.t === 'ws') { const l = last(); if (l) l.wsAfter = true; continue; }
    if (nd.t === 'group') {
      const kids = toItems(nd.kids, ctx);
      const inner = emit(kids, ctx);
      const tall = /\\dfrac|\\sqrt|\\sum|\\prod|\\left/.test(inner);
      const o = nd.open === '{' ? '\\{' : nd.open, c = nd.close === '}' ? '\\}' : nd.close;
      const loneFrac = kids.length === 1 && kids[0].kind === 'frac' && nd.open === '(';
      const latex = tall ? '\\left' + o + ' ' + inner + ' \\right' + c : o + inner + c;
      const wordy = kids.some(x => x.kind === 'word') && !kids.some(x => x.type === 'op');
      atom(applyPrefixes({ kind: 'group', open: nd.open, inner, latex, tall, loneFrac, wordy, kidsQualify: qualifies(kids) })); continue;
    }
    if (nd.t === 'id') {
      if (nd.kind === 'func') { flushPending(); atom({ kind: 'func', latex: nd.name }); continue; }
      if (nd.name === '\\Delta' && nodes[i + 1] && (nodes[i + 1].t === 'id' || nodes[i + 1].t === 'word')) { flushPending(); pendingDelta = '\\Delta'; continue; }
      if (ctx.display && nd.name === 'x' && !nd.sub0 && nodes[i - 1] && nodes[i - 1].t === 'ws' && nodes[i + 1] && nodes[i + 1].t === 'ws') { flushPending(); items.push({ type: 'op', text: '×', latex: '\\times' }); continue; } // "NPV x (1+R)^N"
      const a = { kind: 'id', latex: nd.name, greek: nd.kind === 'greek', single: nd.kind === 'latin' && nd.name.length === 1, name: nd.name };
      if (nd.sub0) { a.sub = nd.sub0; a.latex += '_{' + nd.sub0 + '}'; }
      atom(applyPrefixes(a)); continue;
    }
    if (nd.t === 'num') { let latex = nd.text.replace(/,/g, '{,}'); if (nd.pct) latex += '\\%'; atom(applyPrefixes({ kind: 'num', latex, text: nd.text })); continue; }
    if (nd.t === 'word') {
      const l = last();
      if (l && l.kind === 'word' && l.wsAfter && !l.sub && !l.sup && !pendingDollar && !pendingSqrt && !pendingDelta) { l.text += ' ' + nd.text; l.latex = (ctx.sub ? '\\mathrm{' : '\\textit{') + escText(l.text) + '}'; l.wsAfter = false; continue; }
      atom(applyPrefixes({ kind: 'word', text: nd.text, latex: (ctx.sub ? '\\mathrm{' : '\\textit{') + escText(nd.text) + '}' })); continue;
    }
    if (nd.t === 'dollar') { flushPending(); pendingDollar = true; continue; }
    if (nd.t === 'sqrt') { flushPending(); pendingSqrt = true; continue; }
    if (nd.t === 'big') { flushPending(); atom({ kind: 'big', latex: nd.latex }); continue; }
    if (nd.t === 'dots') { flushPending(); atom({ kind: 'dots', latex: '\\cdots' }); continue; }
    if (nd.t === 'amp') { const l = last(); if (l && l.type === 'atom' && !l.wsAfter) { l.latex += '\\&'; l.joinNext = true; } else { flushPending(); atom({ kind: 'text', latex: '\\&' }); } continue; }
    if (nd.t === 'sub' || nd.t === 'sup') {
      const l = last();
      if (l && l.type === 'atom' && !l.wsAfter && l.kind !== 'func' && l.kind !== 'text') {
        if (nd.t === 'sub') { if (l.sub) l.latex += '{}_{' + subLatex(nd.text) + '}'; else { l.sub = nd.text; l.latex += '_{' + subLatex(nd.text) + '}'; } }
        else { const s = supLatex(nd.text, nd.grouped); if (l.sup) l.latex += '{}^{' + s + '}'; else { l.sup = nd.text; l.latex += '^{' + s + '}'; } }
        continue;
      }
      flushPending(); atom({ kind: 'text', latex: '\\text{' + escText(nd.raw) + '}', punct: true }); continue;
    }
    if (nd.t === 'op') { flushPending(); items.push({ type: 'op', text: nd.text, latex: nd.latex }); continue; }
    if (nd.t === 'punct') { flushPending(); atom({ kind: 'text', latex: '\\text{' + escText(nd.text || nd.raw) + '}', punct: true }); continue; }
  }
  flushPending();
  for (let i = 0; i < items.length - 1; i++) { // D&A
    if (items[i].joinNext && items[i + 1].type === 'atom') { items[i].latex += items[i + 1].latex; items[i].wsAfter = items[i + 1].wsAfter; items[i].joinNext = items[i + 1].joinNext; items.splice(i + 1, 1); i--; }
  }
  for (let i = 0; i < items.length; i++) { // (1/N)ΣR_i: a bracketed lone fraction glued to a neighbour drops its brackets
    const g = items[i]; if (!g.loneFrac || g.sub || g.sup || g.dollar) continue;
    const tightNext = items[i + 1] && items[i + 1].type === 'atom' && !g.wsAfter;
    const tightPrev = items[i - 1] && items[i - 1].type === 'atom' && !items[i - 1].wsAfter;
    if (tightNext || tightPrev) { g.kind = 'frac'; g.latex = g.inner; }
  }
  for (let i = 1; i < items.length - 1; i++) { // P/E, D/E: a ratio name written tight, kept inline
    const it = items[i]; if (it.type !== 'op' || it.text !== '/') continue;
    const L = items[i - 1], Rt = items[i + 1];
    const ratioLetter = a => a && a.type === 'atom' && a.kind === 'id' && a.single && !a.sub && !a.sup && !a.dollar && /^[A-Z]$/.test(a.name);
    if (ratioLetter(L) && ratioLetter(Rt) && !L.wsAfter && !it.wsAfter) { items.splice(i - 1, 3, { type: 'atom', kind: 'id', latex: L.latex + '/' + Rt.latex, name: L.name + '/' + Rt.name, single: false, wsAfter: Rt.wsAfter }); i--; }
  }
  return resolveFracs(items, ctx);
}

const bareNum = a => a && a.type === 'atom' && a.kind === 'num' && !a.sub && !a.sup && !a.dollar;
function resolveFracs(items, ctx) {
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.type !== 'op' || (it.text !== '/' && it.text !== '÷')) continue;
    // numerator: atoms back to the previous operator, passing through × and · unless a fraction sits beyond;
    // a clause word ("or 1/R", "1/R for a perpetuity") ends the run on either side
    const lastWord = x => x.kind === 'word' && STOP_WORDS.has(x.text.split(' ').pop().toLowerCase());
    const firstWord = x => x.kind === 'word' && STOP_WORDS.has(x.text.split(' ')[0].toLowerCase());
    let j = i - 1; const num = [];
    while (j >= 0) { const x = items[j]; if (x.type === 'atom' && !x.punct && !lastWord(x)) num.unshift(x); else if (x.type === 'op' && (x.text === '×' || x.text === '·' || x.text === '⋅') && num.length && items[j - 1] && items[j - 1].type === 'atom' && !items[j - 1].tall && items[j - 1].kind !== 'ratio') num.unshift(x); else break; j--; }
    while (num.length && num[0].type === 'op') num.shift();
    let k = i + 1; const den = []; // denominator: atoms forward to the next operator (a Σ starts a new term, a bracket closes the run)
    while (k < items.length) { const x = items[k]; if (x.type === 'atom' && !x.punct && x.kind !== 'big' && !(den.length && firstWord(x))) { den.push(x); k++; if (x.kind === 'group') break; } else break; }
    if (!num.length || !den.length) continue;
    const numStart = i - num.length;
    const single = a => a.length === 1 && a[0].type === 'atom';
    const splice = (a) => { items.splice(numStart, num.length + 1 + den.length, a); i = numStart; };
    // 68/95/99, or 1/N inside an exponent: keep the slash
    if (ctx.inlineSlash || (it.text === '/' && single(num) && single(den) && (num[0].kind === 'ratio' || (bareNum(num[0]) && bareNum(den[0]) && items[k] && items[k].type === 'op' && items[k].text === '/')))) {
      splice({ type: 'atom', kind: 'ratio', latex: emit(num, ctx) + '/' + emit(den, ctx), wsAfter: den[den.length - 1].wsAfter }); continue;
    }
    const unwrap = a => (a.length === 1 && a[0].kind === 'group' && (a[0].open === '(' || a[0].open === '[') && !a[0].sub && !a[0].sup) ? a[0].inner : emit(a, ctx);
    splice({ type: 'atom', kind: 'frac', latex: '\\dfrac{' + unwrap(num) + '}{' + unwrap(den) + '}', tall: true, wsAfter: den[den.length - 1].wsAfter });
  }
  return items;
}

/** Join items into LaTeX with sensible spacing. */
function emit(items) {
  let out = '';
  for (let i = 0; i < items.length; i++) {
    const it = items[i]; const prev = items[i - 1];
    let sep = out ? ' ' : '';
    if (prev && it.type === 'atom' && prev.type === 'atom') {
      if (it.kind === 'word' || prev.kind === 'word' || it.wordy || prev.wordy) sep = '\\;';
      else if (prev.kind === 'func') sep = prev.wsAfter ? '\\,' : '';
      else if (it.punct || prev.punct) sep = prev.wsAfter ? '\\ ' : '';
    }
    if (prev && prev.type === 'op' && prev.text === ';') sep = '\\;\\; ';
    out += sep + it.latex;
  }
  return out;
}

/** Does this item list contain real maths (not just a bare number or an acronym)? */
function qualifies(items) {
  for (const it of items) {
    if (it.type === 'op') { if (QUAL_OPS.has(it.text)) return true; continue; }
    if (it.kind === 'frac' || it.kind === 'sqrt' || it.kind === 'big' || it.greek || it.sub || it.sup || it.delta) return true;
    if (it.kind === 'group' && it.kidsQualify) return true;
  }
  return false;
}

function renderString(text, ctx) {
  try { const items = toItems(nest(tokenize(text)), ctx || {}); return emit(items); } catch (e) { return null; }
}

/** Whole-string formulas (concept cards, the Formula Vault). One entry per `;`-separated formula: { text, latex | null }. */
export function toLatex(src) {
  src = String(src || '');
  const nodes = nest(tokenize(src));
  const parts = []; let cur = [];
  for (const nd of nodes) { if (nd.t === 'op' && nd.text === ';') { parts.push(cur); cur = []; } else cur.push(nd); }
  parts.push(cur);
  return parts.map(p => {
    while (p.length && p[0].t === 'ws') p.shift(); while (p.length && p[p.length - 1].t === 'ws') p.pop();
    if (!p.length) return null;
    const text = src.slice(p[0].s, p[p.length - 1].e);
    try { const items = toItems(p, { display: true }); return { text, latex: '\\displaystyle ' + emit(items) }; } catch (e) { return { text, latex: null }; }
  }).filter(Boolean);
}

/** Prose with maths inside ("In r_E = (P1 + D1)/P0 − 1, the dividend yield is D1 divided by…"): [{ text } | { math, text }]. */
export function segments(src) {
  src = String(src || '');
  const nodes = nest(tokenize(src));
  const out = []; let run = [];
  const BREAK_OPS = new Set([',', ';', ':']);
  const LEAD_OK = new Set(['=', '≈', '→', '⇒', '<', '>', '≤', '≥', '−', '-']);
  const mathy = (nd, prev, next) => nd.t === 'id' || nd.t === 'num' || nd.t === 'dollar' || nd.t === 'sub' || nd.t === 'sup' || nd.t === 'big' || nd.t === 'sqrt' || nd.t === 'dots' || nd.t === 'amp' || (nd.t === 'op' && !BREAK_OPS.has(nd.text)) || (nd.t === 'group' && groupOk(nd, prev, next)) || nd.t === 'ws';
  function groupOk(g, prev, next) { // a bracket joins the maths when it holds an operator or a scripted symbol and is not mostly prose,
    let ops = 0, words = 0, math = 0, scripts = 0; // or when it carries an exponent / is a function argument: (1.08)^t, NPV(8%)
    const walk = kids => { for (const k of kids) { if (k.t === 'op' && k.text !== ',') ops++; else if (k.t === 'word') words++; else if (k.t === 'sub' || k.t === 'sup') { scripts++; math++; } else if (k.t === 'id' || k.t === 'num' || k.t === 'big' || k.t === 'sqrt') { math++; if (k.sub0 || k.kind === 'greek') scripts++; } else if (k.t === 'group') walk(k.kids); } };
    walk(g.kids);
    if (!math || words > 3) return false;
    if (ops > 0 || scripts > 0) return true;
    if (next && (next.t === 'sup' || next.t === 'sub')) return true;
    if (prev && prev.t === 'id' && prev.e === g.s) return true;
    return false;
  }
  const flushText = (s, e) => { if (e > s) { const l = out[out.length - 1]; if (l && !l.math) l.text += src.slice(s, e); else out.push({ text: src.slice(s, e) }); } };
  const flushRun = () => {
    if (!run.length) return;
    let a = 0, b = run.length;
    const isArticle = i => run[i].t === 'id' && run[i].kind === 'latin' && (run[i].name === 'a' || run[i].name === 'I' || run[i].name === 'A') && !run[i].sub0;
    for (;;) { // trim whitespace, leading operators (except = ≈ → < > −), trailing operators, bare articles "a"/"I"
      const before = a * 100000 + b;
      while (a < b && (run[a].t === 'ws' || run[a].t === 'sub' || run[a].t === 'sup')) a++;
      while (a < b && run[b - 1].t === 'ws') b--;
      while (a < b && run[a].t === 'op' && !(LEAD_OK.has(run[a].text) && a + 1 < b)) a++;
      while (a < b && run[b - 1].t === 'op') b--;
      while (a < b && run[a].t === 'dollar' && a + 1 >= b) a++;
      while (a < b && isArticle(a) && (a + 1 >= b || run[a + 1].t === 'ws')) a++;
      while (a < b && isArticle(b - 1) && (b - 1 === a || run[b - 2].t === 'ws')) b--;
      if (a * 100000 + b === before) break;
    }
    const s0 = run[0].s, e0 = run[run.length - 1].e;
    if (a >= b) { flushText(s0, e0); run = []; return; }
    const sub = run.slice(a, b);
    let rendered = null;
    try { const items = toItems(sub, {}); if (qualifies(items)) rendered = emit(items); } catch (e) { rendered = null; }
    const s = sub[0].s, e = sub[sub.length - 1].e;
    flushText(s0, s);
    if (rendered) out.push({ math: '\\displaystyle ' + rendered, text: src.slice(s, e) }); else flushText(s, e);
    flushText(e, e0);
    run = [];
  };
  let pos = 0;
  for (let i = 0; i < nodes.length; i++) {
    const nd = nodes[i];
    if (mathy(nd, nodes[i - 1], nodes[i + 1])) { if (!run.length) flushText(pos, nd.s); run.push(nd); pos = nd.e; continue; }
    flushRun(); flushText(pos, nd.e); pos = nd.e;
  }
  flushRun(); flushText(pos, src.length);
  return out;
}

// ---- DOM side
function katexHtml(latex) {
  const K = typeof window !== 'undefined' ? window.katex : null;
  if (!K) return null;
  try { return K.renderToString(latex, { displayMode: false, throwOnError: true, strict: 'ignore', trust: false, output: 'html' }); } catch (e) { return null; }
}
/** Prose with inline maths → DocumentFragment (text nodes + <span class="math">). */
export function mathText(src) {
  const frag = document.createDocumentFragment();
  for (const seg of segments(src)) {
    if (seg.math) { const html = katexHtml(seg.math); if (html) { const span = document.createElement('span'); span.className = 'math'; span.innerHTML = html; span.setAttribute('aria-label', seg.text); frag.appendChild(span); continue; } }
    frag.appendChild(document.createTextNode(seg.text));
  }
  return frag;
}
/** A whole formula (or several, `;`-separated) as sheet-style lines → <div class="formula-lines">. */
export function formulaBlock(src, cls) {
  const box = document.createElement('div'); box.className = 'formula-lines' + (cls ? ' ' + cls : '');
  for (const f of toLatex(src)) {
    const line = document.createElement('div'); line.className = 'formula-line';
    const html = f.latex ? katexHtml(f.latex) : null;
    if (html) { line.innerHTML = html; line.setAttribute('aria-label', f.text); } else { line.textContent = f.text; line.classList.add('plain'); }
    box.appendChild(line);
  }
  return box;
}
