// Visual library: interactive, animated diagrams for concepts, plus generic renderers for figure tables/lists.
import { h } from './ui.js';

const NS = 'http://www.w3.org/2000/svg';
export function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.setAttribute('class', v);
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
  }
  return el;
}
const T = (x, y, text, attrs = {}) => svg('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 'vt', ...attrs }, text);
const frame = (w, hgt, cls = '') => svg('svg', { viewBox: `0 0 ${w} ${hgt}`, class: 'viz ' + cls, role: 'img', preserveAspectRatio: 'xMidYMid meet' });
function wrap(title, el, hint) {
  return h('figure', { class: 'vizwrap' }, title ? h('figcaption', { class: 'vizcap' }, title) : null, el, hint ? h('div', { class: 'vizhint' }, hint) : null);
}
const COL = ['#FF6B6B', '#FFB84D', '#A3E635', '#2DD4BF', '#38BDF8', '#A78BFA', '#F472B6', '#FB923C'];

// ---------- Generic: reveal table ----------
export function revealTable(fig, { color = 'var(--ch)', title } = {}) {
  const table = h('table', { class: 'fig reveal' });
  table.appendChild(h('thead', null, h('tr', null, fig.head.map(x => h('th', null, x)))));
  const cells = [];
  table.appendChild(h('tbody', null, fig.rows.map(r => h('tr', null, r.map((x, i) => {
    if (i === 0) return h('td', null, x);
    const td = h('td', { class: 'hid', tabindex: '0', role: 'button', 'aria-label': 'Reveal cell' }, h('span', { class: 'cell-text' }, x));
    const show = () => td.classList.add('shown');
    td.addEventListener('click', show); td.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
    cells.push(td); return td;
  })))));
  const bar = h('div', { class: 'row wrap' },
    h('button', { class: 'btn sm', onClick: () => cells.forEach(c => c.classList.add('shown')) }, 'Reveal all'),
    h('button', { class: 'btn sm ghost', onClick: () => cells.forEach(c => c.classList.remove('shown')) }, 'Hide all'),
    h('span', { class: 'tiny muted' }, 'Say each answer out loud, then tap the cell to check.'));
  return wrap(title || fig.title, h('div', { class: 'stack', style: { '--ch': color } }, h('div', { style: { overflowX: 'auto' } }, table), bar));
}

// ---------- Generic: step flow (process) ----------
export function stepFlow(items, { color = 'var(--ch)', title, caption } = {}) {
  const n = items.length;
  const list = h('ol', { class: 'steps', style: { '--ch': color } });
  items.forEach((it, i) => {
    const txt = String(it).replace(/^\d+[.)]?\s*/, '');
    const li = h('li', { class: 'step', style: { '--i': i }, tabindex: '0' }, h('span', { class: 'step-n' }, String(i + 1)), h('span', { class: 'step-t' }, txt));
    li.addEventListener('click', () => { list.querySelectorAll('.step').forEach(s => s.classList.remove('on')); li.classList.add('on'); });
    list.appendChild(li);
  });
  return wrap(title, list, caption || `${n} steps, in order. Click a step to spotlight it.`);
}

// ---------- Generic: pills (unordered list) ----------
export function pillList(items, { color = 'var(--ch)', title } = {}) {
  return wrap(title, h('div', { class: 'pills', style: { '--ch': color } }, items.map((it, i) => h('span', { class: 'pill', style: { '--i': i } }, String(it)))));
}

// ---------- Generic: continuum ----------
export function continuum(stops, { color = 'var(--ch)', title, left, right } = {}) {
  const w = 720; const hgt = 120; const s = frame(w, hgt);
  const defs = svg('defs', {}, svg('linearGradient', { id: 'cg', x1: 0, x2: 1 }, svg('stop', { offset: '0', 'stop-color': color, 'stop-opacity': 0.25 }), svg('stop', { offset: '1', 'stop-color': color, 'stop-opacity': 1 })));
  s.appendChild(defs);
  s.appendChild(svg('rect', { x: 40, y: 50, width: w - 80, height: 14, rx: 7, fill: 'url(#cg)' }));
  stops.forEach((label, i) => {
    const x = 40 + (w - 80) * (stops.length === 1 ? 0.5 : i / (stops.length - 1));
    s.appendChild(svg('circle', { cx: x, cy: 57, r: 11, fill: 'var(--surface)', stroke: color, 'stroke-width': 3, class: 'pop', style: `animation-delay:${i * 120}ms` }));
    s.appendChild(T(x, 92, label, { class: 'vt small' }));
  });
  if (left) s.appendChild(T(40, 24, left, { class: 'vt tiny muted', 'text-anchor': 'start' }));
  if (right) s.appendChild(T(w - 40, 24, right, { class: 'vt tiny muted', 'text-anchor': 'end' }));
  return wrap(title, s);
}

// ---------- Generic: 2x2 matrix ----------
export function matrix2x2({ rowLabel, colLabel, rows, cols, cells, color = 'var(--ch)', title }) {
  const grid = h('div', { class: 'm22', style: { '--ch': color } },
    h('div', { class: 'm22-corner' }, h('span', { class: 'tiny muted' }, `${rowLabel} ↓ / ${colLabel} →`)),
    cols.map(c => h('div', { class: 'm22-h' }, c)),
    rows.flatMap((r, ri) => [h('div', { class: 'm22-h' }, r), ...cols.map((c, ci) => {
      const cell = cells[ri][ci];
      const el = h('button', { class: 'm22-c', style: { '--i': ri * 2 + ci } }, h('b', null, cell.title), cell.desc ? h('span', { class: 'hid-desc' }, cell.desc) : null);
      el.addEventListener('click', () => el.classList.toggle('open'));
      return el;
    })]));
  return wrap(title, grid, 'Tap a quadrant to see what it means.');
}

// ---------- Bespoke: concentric total product ----------
export function totalProduct({ color = '#A3E635', title = 'The total product concept' } = {}) {
  const s = frame(720, 360);
  const layers = [
    ['Augmented', 'Warranty, repair, delivery, installation, FAQs, support', 160],
    ['Actual', 'Features, design, brand name, packaging, quality level', 110],
    ['Core', 'The fundamental benefit you are really buying', 58],
  ];
  const cap = h('div', { class: 'vizlabel' }, 'Hover or tap a ring');
  layers.forEach(([name, desc, r], i) => {
    const c = svg('circle', { cx: 250, cy: 180, r, fill: color, 'fill-opacity': 0.12 + i * 0.22, stroke: color, 'stroke-width': 2, class: 'ring-pop', style: `animation-delay:${i * 150}ms`, tabindex: '0' });
    const show = () => { cap.textContent = `${name} product: ${desc}`; };
    c.addEventListener('mouseenter', show); c.addEventListener('click', show); c.addEventListener('focus', show);
    s.appendChild(c);
  });
  s.appendChild(T(250, 180, 'Core', { class: 'vt bold' }));
  s.appendChild(T(250, 100, 'Actual', { class: 'vt' }));
  s.appendChild(T(250, 40, 'Augmented', { class: 'vt' }));
  const notes = [['Core', 'benefit: transportation and leisure'], ['Actual', 'branded bike, frame, 10 speeds, padded seat'], ['Augmented', 'warranty, repair facilities, online FAQs']];
  notes.forEach(([k, v], i) => { s.appendChild(T(560, 110 + i * 50, k, { class: 'vt bold', 'text-anchor': 'start', x: 450 })); s.appendChild(T(450, 132 + i * 50, v, { class: 'vt small muted', 'text-anchor': 'start' })); });
  return wrap(title, h('div', null, s, cap));
}

// ---------- Bespoke: PLC curve ----------
export function plcCurve({ color = '#2DD4BF', title = 'Product life cycle: sales and profit over time', facts } = {}) {
  const w = 760; const hgt = 330; const s = frame(w, hgt);
  const stages = ['Introduction', 'Growth', 'Maturity', 'Decline'];
  const x0 = 60; const x1 = w - 20; const bw = (x1 - x0) / 4;
  const cap = h('div', { class: 'vizlabel' }, 'Tap a stage');
  const data = facts || {
    Introduction: 'Few competitors · objective: awareness · skimming or penetration price · limited distribution · awareness advertising · minimal profit',
    Growth: 'More competitors enter · objective: product differentiation · prices slowly reduced · distribution increased · stress points of difference · profits peak',
    Maturity: 'Many competitors · objective: brand loyalty · frequent price discounts · full distribution · pricing and sales promotion · profits level off',
    Decline: 'Competitors leave · objective: product rationalization · very low prices · distribution reduced · minimal promotion · profits fall',
  };
  stages.forEach((st, i) => {
    const g = svg('g', { class: 'plc-stage', tabindex: '0' },
      svg('rect', { x: x0 + i * bw, y: 20, width: bw, height: 250, fill: color, 'fill-opacity': i % 2 ? 0.05 : 0.1 }),
      T(x0 + i * bw + bw / 2, 300, st, { class: 'vt small' }));
    const show = () => { s.querySelectorAll('.plc-stage').forEach(x => x.classList.remove('on')); g.classList.add('on'); cap.innerHTML = `<b>${st}</b> — ${data[st]}`; };
    g.addEventListener('click', show); g.addEventListener('mouseenter', show); g.addEventListener('focus', show);
    s.appendChild(g);
  });
  // axes
  s.appendChild(svg('line', { x1: x0, y1: 270, x2: x1, y2: 270, stroke: 'var(--line-strong)' }));
  s.appendChild(svg('line', { x1: x0, y1: 20, x2: x0, y2: 270, stroke: 'var(--line-strong)' }));
  s.appendChild(T(30, 145, 'Sales / profit', { class: 'vt tiny muted', transform: 'rotate(-90 30 145)' }));
  s.appendChild(T(w / 2, 322, 'Time', { class: 'vt tiny muted' }));
  // sales curve
  const sales = `M ${x0} 255 C ${x0 + bw * 0.6} 250, ${x0 + bw * 0.9} 200, ${x0 + bw * 1.4} 120 S ${x0 + bw * 2.2} 45, ${x0 + bw * 2.7} 50 S ${x0 + bw * 3.5} 110, ${x1} 190`;
  const profit = `M ${x0} 268 C ${x0 + bw * 0.5} 268, ${x0 + bw * 0.8} 262, ${x0 + bw * 1.1} 240 S ${x0 + bw * 1.9} 120, ${x0 + bw * 2.3} 125 S ${x0 + bw * 3.2} 190, ${x1} 250`;
  s.appendChild(svg('path', { d: sales, fill: 'none', stroke: color, 'stroke-width': 4, class: 'draw' }));
  s.appendChild(svg('path', { d: profit, fill: 'none', stroke: '#FFB84D', 'stroke-width': 3, 'stroke-dasharray': '6 5', class: 'draw delay' }));
  s.appendChild(T(x0 + bw * 2.7, 36, 'Sales', { class: 'vt tiny', fill: color }));
  s.appendChild(T(x0 + bw * 2.3, 110, 'Profit', { class: 'vt tiny', fill: '#FFB84D' }));
  return wrap(title, h('div', null, s, cap), 'Profit peaks in growth and levels off in maturity; sales peak in maturity.');
}

// ---------- Bespoke: adoption bell ----------
export function adoptionCurve({ color = '#2DD4BF', title = 'The adoption curve' } = {}) {
  const w = 760; const hgt = 330; const s = frame(w, hgt);
  const cats = [['Innovators', 2.5, 'venturesome; higher educated; use multiple information sources'], ['Early adopters', 13.5, 'leaders in social settings; slightly above average education'], ['Early majority', 34, 'deliberate; many informal social contacts'], ['Late majority', 34, 'skeptical; below average social status'], ['Laggards', 16, 'fear of debt; neighbours and friends are information sources']];
  const x0 = 40; const W = w - 80; const base = 230;
  const bell = x => Math.max(0.045, Math.exp(-Math.pow((x - 0.5) / 0.26, 2)));
  const cap = h('div', { class: 'vizlabel' }, 'Tap a segment');
  let acc = 0;
  cats.forEach(([name, pct, desc], i) => {
    const a = acc / 100; acc += pct; const b = acc / 100;
    let d = `M ${x0 + a * W} ${base}`;
    for (let k = 0; k <= 20; k++) { const t = a + (b - a) * k / 20; d += ` L ${x0 + t * W} ${base - bell(t) * 190}`; }
    d += ` L ${x0 + b * W} ${base} Z`;
    const p = svg('path', { d, fill: COL[(i + 3) % COL.length], 'fill-opacity': 0.75, stroke: 'var(--bg)', 'stroke-width': 2, class: 'pop', style: `animation-delay:${i * 100}ms`, tabindex: '0' });
    const show = () => { cap.innerHTML = `<b>${name} · ${pct}%</b> — ${desc}`; };
    p.addEventListener('mouseenter', show); p.addEventListener('click', show); p.addEventListener('focus', show);
    s.appendChild(p);
    const lx = x0 + ((a + b) / 2) * W; const row = (i === 0 || i === 4) ? 1 : 0;
    s.appendChild(T(lx, base + 22 + row * 34, `${pct}%`, { class: 'vt small bold' }));
    s.appendChild(T(lx, base + 40 + row * 34, name, { class: 'vt tiny muted' }));
  });
  s.appendChild(svg('line', { x1: x0, y1: base, x2: x0 + W, y2: base, stroke: 'var(--line-strong)' }));
  s.appendChild(T(w / 2, 318, 'Time →', { class: 'vt tiny muted' }));
  return wrap(title, h('div', null, s, cap));
}

// ---------- Bespoke: break-even (interactive) ----------
export function breakEven({ color = '#38BDF8', title = 'Break-even analysis (drag the price)' } = {}) {
  const FC = 32000; const UVC = 40; let P = 120;
  const w = 720; const hgt = 320; const s = frame(w, hgt);
  const x0 = 60; const y0 = 270; const W = w - 100; const H = 230; const Qmax = 1200; const Ymax = 160000;
  const sx = q => x0 + q / Qmax * W; const sy = v => y0 - Math.min(v, Ymax) / Ymax * H;
  s.appendChild(svg('line', { x1: x0, y1: y0, x2: x0 + W, y2: y0, stroke: 'var(--line-strong)' }));
  s.appendChild(svg('line', { x1: x0, y1: y0 - H, x2: x0, y2: y0, stroke: 'var(--line-strong)' }));
  s.appendChild(T(w / 2, 300, 'Quantity of units sold', { class: 'vt tiny muted' }));
  s.appendChild(T(22, 150, 'Dollars', { class: 'vt tiny muted', transform: 'rotate(-90 22 150)' }));
  const fcLine = svg('line', { x1: x0, y1: sy(FC), x2: x0 + W, y2: sy(FC), stroke: 'var(--muted)', 'stroke-dasharray': '4 4' });
  const tcLine = svg('line', { x1: x0, y1: sy(FC), x2: sx(Qmax), y2: sy(FC + UVC * Qmax), stroke: '#FB7185', 'stroke-width': 3 });
  const trLine = svg('line', { x1: x0, y1: y0, x2: sx(Qmax), y2: sy(P * Qmax), stroke: color, 'stroke-width': 3 });
  const bep = svg('circle', { cx: 0, cy: 0, r: 7, fill: '#FFB84D', stroke: 'var(--bg)', 'stroke-width': 2 });
  const bepT = T(0, 0, '', { class: 'vt small bold' });
  s.append(fcLine, tcLine, trLine, bep, bepT, T(x0 + W - 40, sy(FC) - 10, 'Fixed cost', { class: 'vt tiny muted' }), T(x0 + W - 50, sy(FC + UVC * Qmax) - 12, 'Total cost', { class: 'vt tiny', fill: '#FB7185' }));
  const trLabel = T(0, 0, 'Total revenue', { class: 'vt tiny', fill: color });
  s.appendChild(trLabel);
  const readout = h('div', { class: 'vizlabel mono' });
  const slider = h('input', { type: 'range', min: '60', max: '200', step: '5', value: String(P), 'aria-label': 'Unit price' });
  function update() {
    P = parseInt(slider.value, 10);
    const q = FC / (P - UVC);
    trLine.setAttribute('y2', sy(P * Qmax));
    const qx = sx(Math.min(q, Qmax)); const qy = sy(P * Math.min(q, Qmax));
    bep.setAttribute('cx', qx); bep.setAttribute('cy', qy); bepT.setAttribute('x', qx + 10); bepT.setAttribute('y', qy - 16); bepT.textContent = `BEP ${Math.round(q)} units`;
    const lx = sx(900); trLabel.setAttribute('x', lx); trLabel.setAttribute('y', sy(P * 900) - 12);
    readout.innerHTML = `BEP = Fixed cost ÷ (Price − Unit variable cost) = $${FC.toLocaleString()} ÷ ($${P} − $${UVC}) = <b>${Math.round(q)} units</b>`;
  }
  slider.addEventListener('input', update); update();
  const priceLbl = h('span', { class: 'mono small' }, h('b', null, `$${P}`));
  slider.addEventListener('input', () => { priceLbl.firstChild.textContent = `$${slider.value}`; });
  return wrap(title, h('div', { class: 'stack' }, s, h('div', { class: 'row' }, h('span', { class: 'tiny muted' }, 'Unit price'), slider, priceLbl), readout), 'Raise the price and the break-even quantity falls; the fixed cost line never moves.');
}

// ---------- Bespoke: markup two ways ----------
export function markupBar({ color = '#38BDF8', title = 'Markup: percent of price vs percent of cost' } = {}) {
  const price = 75; const cost = 60; const mk = price - cost;
  const bar = h('div', { class: 'mkbar', style: { '--ch': color } },
    h('div', { class: 'mk-cost', style: { width: (cost / price * 100) + '%' } }, `Cost $${cost}`),
    h('div', { class: 'mk-mk', style: { width: (mk / price * 100) + '%' } }, `Markup $${mk}`));
  const out = h('div', { class: 'vizlabel' });
  let mode = 'price';
  const seg = h('div', { class: 'seg' }, h('button', { class: 'on', onClick: e => { mode = 'price'; toggle(e); } }, 'as % of selling price'), h('button', { onClick: e => { mode = 'cost'; toggle(e); } }, 'as % of cost'));
  function toggle(e) { seg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); draw(); }
  function draw() {
    out.innerHTML = mode === 'price'
      ? `Base = selling price (100%). Markup = $${mk} ÷ $${price} = <b>20%</b>. Retailers and wholesalers usually talk this way (Figure 9-3).`
      : `Base = cost (100%). Markup = $${mk} ÷ $${cost} = <b>25%</b>. Manufacturers usually talk this way. Same $15, different percentage.`;
  }
  draw();
  return wrap(title, h('div', { class: 'stack' }, bar, seg, out));
}

// ---------- Bespoke: elasticity ----------
export function elasticityDemo({ color = '#38BDF8', title = 'Price elasticity: what happens to total revenue?' } = {}) {
  let elastic = true; let cut = 10;
  const out = h('div', { class: 'vizlabel' });
  const seg = h('div', { class: 'seg' }, h('button', { class: 'on', onClick: e => { elastic = true; sel(e); } }, 'Elastic demand (e = 2.0)'), h('button', { onClick: e => { elastic = false; sel(e); } }, 'Inelastic demand (e = 0.5)'));
  function sel(e) { seg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); draw(); }
  const slider = h('input', { type: 'range', min: '-30', max: '30', step: '5', value: '-10', 'aria-label': 'Price change' });
  slider.addEventListener('input', () => { cut = -parseInt(slider.value, 10); draw(); });
  const bars = h('div', { class: 'elbars', style: { '--ch': color } });
  function draw() {
    const e = elastic ? 2.0 : 0.5; const dp = -cut / 100; const dq = -e * dp;
    const p0 = 100; const q0 = 100; const p1 = p0 * (1 + dp); const q1 = q0 * (1 + dq);
    const tr0 = p0 * q0; const tr1 = p1 * q1;
    bars.innerHTML = '';
    [['Before', tr0], ['After', tr1]].forEach(([k, v]) => bars.appendChild(h('div', { class: 'elbar' }, h('div', { class: 'elfill', style: { height: Math.max(6, v / 150) + 'px', background: v >= tr0 ? 'var(--good)' : '#FB7185' } }), h('span', { class: 'tiny' }, `${k}: $${Math.round(v).toLocaleString()}`))));
    out.innerHTML = `Price ${dp < 0 ? 'cut' : 'raised'} ${Math.abs(Math.round(dp * 100))}% → quantity ${dq > 0 ? 'up' : 'down'} ${Math.abs(Math.round(dq * 100))}%. Total revenue <b>${tr1 > tr0 ? 'rises' : tr1 < tr0 ? 'falls' : 'is unchanged'}</b>. ${elastic ? 'Elastic: buyers react strongly, so lower prices pay off.' : 'Inelastic: buyers barely react, so higher prices pay off.'}`;
  }
  draw();
  return wrap(title, h('div', { class: 'stack' }, seg, h('div', { class: 'row' }, h('span', { class: 'tiny muted' }, 'Price change'), slider), bars, out));
}

// ---------- Bespoke: channel flow rows ----------
export function channelFlows(rows, { color = '#A78BFA', title } = {}) {
  const w = 760; const rowH = 64; const s = frame(w, rows.length * rowH + 10);
  rows.forEach((row, ri) => {
    const nodes = row.nodes; const y = 32 + ri * rowH; const gap = (w - 40) / 5;
    const xs = nodes.map((_, i) => 20 + gap * (i + 0.5) + (5 - nodes.length) * gap / 2 * 0 );
    // distribute evenly across full width regardless of count
    const span = w - 40; const step = span / nodes.length;
    nodes.forEach((n, i) => {
      const x = 20 + step * i + step / 2;
      s.appendChild(svg('rect', { x: x - step / 2 + 8, y: y - 20, width: step - 16, height: 40, rx: 10, fill: color, 'fill-opacity': i === 0 || i === nodes.length - 1 ? 0.9 : 0.35, class: 'pop', style: `animation-delay:${(ri * 5 + i) * 70}ms` }));
      s.appendChild(T(x, y, n, { class: 'vt small' + (i === 0 || i === nodes.length - 1 ? ' bold' : '') }));
      if (i < nodes.length - 1) s.appendChild(svg('line', { x1: x + step / 2 - 8, y1: y, x2: x + step / 2 + 8, y2: y, stroke: color, 'stroke-width': 3, 'stroke-dasharray': '4 4', class: 'flow' }));
    });
    if (row.label) s.appendChild(T(w - 8, y - 26, row.label, { class: 'vt tiny muted', 'text-anchor': 'end' }));
    void xs;
  });
  return wrap(title, s, 'Darker boxes are the ends of the channel; dashed lines show the direction of the flow.');
}

// ---------- Bespoke: contact math ----------
export function contactMath({ color = '#A78BFA', title = 'How one intermediary cuts the number of contacts' } = {}) {
  const w = 760; const hgt = 260; const s = frame(w, hgt);
  const P = ['LG', 'Toshiba', 'Sharp', 'Samsung']; const B = ['Lynne', 'Troy', 'Todd', 'Diane'];
  const left = (x0) => P.map((p, i) => ({ x: x0, y: 40 + i * 60, p }));
  const right = (x0) => B.map((b, i) => ({ x: x0, y: 40 + i * 60, b }));
  // no intermediary
  const L1 = left(60); const R1 = right(300);
  L1.forEach((a, i) => R1.forEach((b, j) => s.appendChild(svg('line', { x1: a.x + 30, y1: a.y, x2: b.x - 30, y2: b.y, stroke: color, 'stroke-opacity': 0.55, class: 'draw', style: `animation-delay:${(i * 4 + j) * 40}ms` }))));
  L1.forEach(a => s.appendChild(T(a.x, a.y, a.p, { class: 'vt small' }))); R1.forEach(b => s.appendChild(T(b.x, b.y, b.b, { class: 'vt small' })));
  s.appendChild(T(180, 245, '4 × 4 = 16 contacts', { class: 'vt small bold' }));
  // with intermediary
  const L2 = left(460); const R2 = right(700); const mid = { x: 580, y: 130 };
  s.appendChild(svg('rect', { x: mid.x - 36, y: mid.y - 18, width: 72, height: 36, rx: 9, fill: color, class: 'pop' }));
  s.appendChild(T(mid.x, mid.y, 'Best Buy', { class: 'vt small bold' }));
  L2.forEach((a, i) => s.appendChild(svg('line', { x1: a.x + 30, y1: a.y, x2: mid.x - 36, y2: mid.y, stroke: color, class: 'draw', style: `animation-delay:${700 + i * 60}ms` })));
  R2.forEach((b, i) => s.appendChild(svg('line', { x1: mid.x + 36, y1: mid.y, x2: b.x - 30, y2: b.y, stroke: color, class: 'draw', style: `animation-delay:${950 + i * 60}ms` })));
  L2.forEach(a => s.appendChild(T(a.x, a.y, a.p, { class: 'vt small' }))); R2.forEach(b => s.appendChild(T(b.x, b.y, b.b, { class: 'vt small' })));
  s.appendChild(T(580, 245, '4 + 4 = 8 contacts', { class: 'vt small bold' }));
  return wrap(title, s);
}

// ---------- Bespoke: communication process ----------
export function commProcess({ color = '#FB923C', title = 'The communication process' } = {}) {
  const w = 760; const hgt = 230; const s = frame(w, hgt);
  const boxes = [['Source', 'sender', 80], ['Encoding', 'ideas → symbols', 230], ['Message', 'via a channel', 380], ['Decoding', 'symbols → meaning', 530], ['Receiver', 'consumer', 680]];
  boxes.forEach(([a, b, x], i) => {
    s.appendChild(svg('rect', { x: x - 62, y: 60, width: 124, height: 56, rx: 12, fill: color, 'fill-opacity': i === 0 || i === 4 ? 0.9 : 0.3, class: 'pop', style: `animation-delay:${i * 120}ms` }));
    s.appendChild(T(x, 80, a, { class: 'vt small bold' })); s.appendChild(T(x, 100, b, { class: 'vt tiny' }));
    if (i < 4) s.appendChild(svg('line', { x1: x + 62, y1: 88, x2: boxes[i + 1][2] - 62, y2: 88, stroke: color, 'stroke-width': 3, 'stroke-dasharray': '4 4', class: 'flow' }));
  });
  s.appendChild(svg('path', { d: 'M 680 118 C 680 190, 80 190, 80 118', fill: 'none', stroke: 'var(--muted)', 'stroke-width': 2, 'stroke-dasharray': '3 5', class: 'draw delay' }));
  s.appendChild(T(380, 170, 'Feedback (response)', { class: 'vt tiny muted' }));
  s.appendChild(T(380, 30, '⚡ Noise distorts the message anywhere along the way', { class: 'vt tiny', fill: '#FB7185' }));
  s.appendChild(T(380, 215, 'Field of experience: the shared understanding sender and receiver need to encode and decode the same way', { class: 'vt tiny muted' }));
  return wrap(title, s);
}

// ---------- Bespoke: push vs pull ----------
export function pushPull({ color = '#FB923C', title = 'Push vs pull strategies' } = {}) {
  const w = 760; const hgt = 220; const s = frame(w, hgt);
  const nodes = [['Producer', 110], ['Wholesalers / retailers', 380], ['Consumers', 650]];
  nodes.forEach(([n, x], i) => { s.appendChild(svg('rect', { x: x - 90, y: 85, width: 180, height: 50, rx: 12, fill: color, 'fill-opacity': 0.25 })); s.appendChild(T(x, 110, n, { class: 'vt small bold' })); });
  s.appendChild(svg('path', { d: 'M 200 70 C 300 20, 460 20, 560 70', fill: 'none', stroke: color, 'stroke-width': 4, class: 'draw', 'marker-end': 'url(#arr)' }));
  s.appendChild(T(380, 22, 'PUSH: personal selling, trade promotion, incentives → channel stocks and sells it', { class: 'vt tiny' }));
  s.appendChild(svg('path', { d: 'M 560 150 C 460 200, 300 200, 200 150', fill: 'none', stroke: '#38BDF8', 'stroke-width': 4, class: 'draw delay' }));
  s.appendChild(T(380, 200, 'PULL: advertising, consumer promotion, publicity → consumers ask the channel for it', { class: 'vt tiny' }));
  return wrap(title, s, 'Most programs use both, working together.');
}

// ---------- Bespoke: funnel ----------
export function funnel(items, { color = '#FB923C', title } = {}) {
  const w = 720; const stepH = 42; const s = frame(w, items.length * stepH + 10);
  const cap = h('div', { class: 'vizlabel' }, 'Tap a stage to read what happens there.');
  items.forEach((it, i) => {
    const txt = String(it).replace(/^\d+[.)]?\s*/, '');
    const [name, ...rest] = txt.split(':'); const desc = rest.join(':').trim();
    const inset = i * (w * 0.055); const y = 5 + i * stepH;
    const g = svg('g', { class: 'funnel-step', tabindex: '0' },
      svg('path', { d: `M ${inset} ${y} L ${w - inset} ${y} L ${w - inset - w * 0.055} ${y + stepH - 4} L ${inset + w * 0.055} ${y + stepH - 4} Z`, fill: color, 'fill-opacity': 0.22 + i * 0.1, class: 'pop', style: `animation-delay:${i * 90}ms` }),
      T(w / 2, y + stepH / 2 - 2, `${i + 1}. ${name.trim()}`, { class: 'vt small bold' }));
    const show = () => { s.querySelectorAll('.funnel-step').forEach(x => x.classList.remove('on')); g.classList.add('on'); cap.innerHTML = `<b>${name.trim()}</b>${desc ? ' — ' + desc : ''}`; };
    g.addEventListener('click', show); g.addEventListener('mouseenter', show); g.addEventListener('focus', show);
    s.appendChild(g);
  });
  return wrap(title, h('div', null, s, cap), 'Top is widest: many are aware, fewer become advocates.');
}

// ---------- Bespoke: four Ps ----------
export function fourPs({ color = '#FF6B6B', title = 'The marketing mix around the target market' } = {}) {
  const w = 520; const hgt = 300; const s = frame(w, hgt);
  const ps = [['Product', 130, 80, 'a good, service or idea'], ['Price', 390, 80, 'what is exchanged'], ['Place', 130, 220, 'getting it to the consumer'], ['Promotion', 390, 220, 'communication with buyers']];
  ps.forEach(([n, x, y, d], i) => { s.appendChild(svg('rect', { x: x - 95, y: y - 32, width: 190, height: 64, rx: 14, fill: color, 'fill-opacity': 0.25, class: 'pop', style: `animation-delay:${i * 100}ms` })); s.appendChild(T(x, y - 8, n, { class: 'vt small bold' })); s.appendChild(T(x, y + 14, d, { class: 'vt tiny muted' })); });
  s.appendChild(svg('circle', { cx: 260, cy: 150, r: 46, fill: color, class: 'pop', style: 'animation-delay:450ms' }));
  s.appendChild(T(260, 143, 'Target', { class: 'vt small bold' })); s.appendChild(T(260, 161, 'market', { class: 'vt small bold' }));
  s.appendChild(T(260, 285, 'Controllable 4 Ps inside; uncontrollable environmental forces outside', { class: 'vt tiny muted' }));
  return wrap(title, s);
}

// ---------- Bespoke: perceptual map (interactive reposition) ----------
export function perceptualMap({ color = '#FFB84D', title = 'Perceptual map (tap "Reposition")' } = {}) {
  const w = 560; const hgt = 360; const s = frame(w, hgt);
  s.appendChild(svg('line', { x1: 280, y1: 20, x2: 280, y2: 320, stroke: 'var(--line-strong)' }));
  s.appendChild(svg('line', { x1: 40, y1: 170, x2: 520, y2: 170, stroke: 'var(--line-strong)' }));
  s.appendChild(T(280, 12, 'More nutritious', { class: 'vt tiny muted' })); s.appendChild(T(280, 335, 'Less nutritious', { class: 'vt tiny muted' }));
  s.appendChild(T(50, 170, 'Less sweet', { class: 'vt tiny muted', 'text-anchor': 'start', y: 160 })); s.appendChild(T(515, 160, 'Sweeter', { class: 'vt tiny muted', 'text-anchor': 'end' }));
  const pts = [['Skinny latte', 200, 70], ['Fruit drinks', 400, 95], ['Coffee', 170, 190], ['Sugared soft drinks', 440, 280]];
  pts.forEach(([n, x, y], i) => { s.appendChild(svg('circle', { cx: x, cy: y, r: 9, fill: i === 2 ? color : 'var(--muted)', class: 'pop', style: `animation-delay:${i * 100}ms`, id: i === 2 ? 'pm-coffee' : null })); s.appendChild(T(x, y - 18, n, { class: 'vt tiny', id: i === 2 ? 'pm-coffee-t' : null })); });
  const btn = h('button', { class: 'btn sm', onClick: () => { const c = s.querySelector('#pm-coffee'); const t = s.querySelector('#pm-coffee-t'); const moved = c.getAttribute('cy') === '110'; c.setAttribute('cy', moved ? 190 : 110); c.setAttribute('cx', moved ? 170 : 230); t.setAttribute('y', moved ? 172 : 92); t.setAttribute('x', moved ? 170 : 230); t.textContent = moved ? 'Coffee' : 'Coffee (repositioned: "healthier, a little sweeter")'; } }, 'Reposition coffee');
  return wrap(title, h('div', { class: 'stack' }, s, h('div', { class: 'row' }, btn, h('span', { class: 'tiny muted' }, 'Repositioning moves the brand in consumers\' minds. To claim "healthier", compare only with drinks lower on the nutrition axis.'))));
}

// ---------- Bespoke: supply chain vs marketing channel ----------
export function supplyChain({ color = '#A78BFA', title = 'Supply chain vs marketing channel (Figure 10-9)' } = {}) {
  const w = 760; const hgt = 230; const s = frame(w, hgt);
  const nodes = [['Suppliers', 120], ['Producer', 380], ['Consumers', 640]];
  nodes.forEach(([n, x], i) => { s.appendChild(svg('rect', { x: x - 80, y: 95, width: 160, height: 50, rx: 12, fill: color, 'fill-opacity': 0.3, class: 'pop', style: `animation-delay:${i * 120}ms` })); s.appendChild(T(x, 120, n, { class: 'vt small bold' })); if (i < 2) s.appendChild(svg('line', { x1: x + 80, y1: 120, x2: nodes[i + 1][1] - 80, y2: 120, stroke: color, 'stroke-width': 3, 'stroke-dasharray': '4 4', class: 'flow' })); });
  s.appendChild(svg('path', { d: 'M 40 60 L 460 60', stroke: '#38BDF8', 'stroke-width': 3 })); s.appendChild(T(250, 42, 'Supplier network: raw materials and parts flow to the producer', { class: 'vt tiny' }));
  s.appendChild(svg('path', { d: 'M 300 185 L 720 185', stroke: '#FFB84D', 'stroke-width': 3 })); s.appendChild(T(510, 205, 'Marketing channel: finished products flow to consumers', { class: 'vt tiny' }));
  s.appendChild(T(380, 15, 'Supply chain management integrates information and logistics across ALL of it', { class: 'vt tiny muted' }));
  return wrap(title, s);
}

// ---------- Bespoke: value equation ----------
export function valueEquation({ color = '#38BDF8', title = 'Value = perceived benefits ÷ price' } = {}) {
  let b = 5; let p = 5;
  const out = h('div', { class: 'vizlabel' });
  const bS = h('input', { type: 'range', min: '1', max: '10', value: '5', 'aria-label': 'Benefits' }); const pS = h('input', { type: 'range', min: '1', max: '10', value: '5', 'aria-label': 'Price' });
  const gauge = h('div', { class: 'bar', style: { height: '14px' } }, h('div', { class: 'bar-fill', style: { width: '50%', background: color } }));
  function draw() { b = +bS.value; p = +pS.value; const v = b / p; gauge.firstChild.style.width = Math.min(100, v * 50) + '%'; out.innerHTML = `Value index <b>${v.toFixed(2)}</b>. ${v > 1.2 ? 'Raising benefits or lowering price raises value: that is value pricing.' : v < 0.8 ? 'Low value: either cut price or add benefits.' : 'Balanced. Note: a very low price can also signal low quality.'}`; }
  bS.addEventListener('input', draw); pS.addEventListener('input', draw); draw();
  return wrap(title, h('div', { class: 'stack' }, h('div', { class: 'row' }, h('span', { class: 'tiny muted', style: { width: '70px' } }, 'Benefits'), bS), h('div', { class: 'row' }, h('span', { class: 'tiny muted', style: { width: '70px' } }, 'Price'), pS), gauge, out));
}

// ---------- Bespoke: four I's ----------
export function fourIs({ color = '#A3E635', title = 'The four I\'s of services' } = {}) {
  const items = [['👻', 'Intangibility', 'cannot be seen or touched before purchase → show tangible cues, testimonials'], ['🎲', 'Inconsistency', 'quality varies with the people delivering it → train, standardize'], ['🤝', 'Inseparability', 'produced and consumed at the same time, provider present → manage the encounter'], ['⏳', 'Inventory', 'cannot be stored; idle production capacity is costly → smooth demand with pricing, reservations']];
  return wrap(title, h('div', { class: 'grid four', style: { '--ch': color } }, items.map(([e, n, d], i) => h('div', { class: 'icard', style: { '--i': i } }, h('div', { class: 'icard-e' }, e), h('b', null, n), h('span', { class: 'small muted' }, d)))));
}

// ---------- Bespoke: wheel of retailing ----------
export function wheel({ color = '#F472B6', title = 'The wheel of retailing' } = {}) {
  const w = 520; const hgt = 320; const s = frame(w, hgt);
  const steps = [['Enter low: low status, low margin, low price', 260, 50], ['Add services, upgrade facilities', 440, 160], ['Prices and status rise', 260, 270], ['Gap opens below → new low-price entrant', 80, 160]];
  s.appendChild(svg('circle', { cx: 260, cy: 160, r: 95, fill: 'none', stroke: color, 'stroke-width': 3, 'stroke-dasharray': '8 6', class: 'spin' }));
  steps.forEach(([t, x, y], i) => { s.appendChild(svg('circle', { cx: x, cy: y, r: 16, fill: color, class: 'pop', style: `animation-delay:${i * 150}ms` })); s.appendChild(T(x, y, String(i + 1), { class: 'vt small bold' })); s.appendChild(T(x, y + (y > 160 ? 34 : y < 160 ? -30 : 34), t, { class: 'vt tiny', 'text-anchor': x > 400 ? 'end' : x < 120 ? 'start' : 'middle', x: x > 400 ? x + 70 : x < 120 ? x - 70 : x })); });
  return wrap(title, s, 'A cycle: today\'s discounter becomes tomorrow\'s department store, leaving room at the bottom.');
}

// ---------- Mapping ----------
const PROCESS_KEYS = /step|process|funnel|sequence|stages|chain|order|cycle/i;

/**
 * Return the best visual for a concept, or null.
 * ctx: {concept, chapter}
 */
export function visualFor(concept, chapter) {
  const color = chapter.color; const id = concept.id;
  const B = {
    'c01-marketing-mix': () => fourPs({ color }),
    'c01-marketing-process': () => stepFlow(concept.figure.items, { color, title: 'The marketing process (Figure 1-2)' }),
    'c06-continuum': () => continuum(['Mass marketing', 'Segment marketing', 'Niche marketing', 'Individualized marketing'], { color, title: 'Approaches to segmentation', left: 'Broad target market', right: 'Narrow' }),
    'c06-perceptual-map': () => perceptualMap({ color }),
    'c06-repositioning': () => perceptualMap({ color, title: 'Repositioning on a perceptual map' }),
    'c06-six-step-process': () => stepFlow(concept.figure.items, { color, title: 'Six steps for segmenting a market (Figure 6-3)' }),
    'c06-market-product-grid': () => matrix2x2({ rowLabel: 'Market segments', colLabel: 'Products', rows: ['Students', 'Families'], cols: ['Compact car', 'Minivan'], cells: [[{ title: 'Large', desc: 'estimated market size: students want compact cars' }, { title: 'Small', desc: 'few students buy minivans' }], [{ title: 'Medium', desc: 'some families buy a compact second car' }, { title: 'Large', desc: 'families are the minivan market' }]], color, title: 'A market-product grid (example)' }),
    'c07-core-product': () => totalProduct({ color }),
    'c07-actual-product': () => totalProduct({ color, title: 'The actual product is the middle ring' }),
    'c07-augmented-product': () => totalProduct({ color, title: 'The augmented product is the outer ring' }),
    'c07-intangibility': () => fourIs({ color }),
    'c07-inconsistency': () => fourIs({ color }),
    'c07-inseparability': () => fourIs({ color }),
    'c07-inventory': () => fourIs({ color }),
    'c08-plc': () => plcCurve({ color }),
    'c08-plc-stage-table': () => plcCurve({ color, title: 'Tap each stage, then test yourself on the table below' }),
    'c08-introduction': () => plcCurve({ color, title: 'Introduction: few competitors, awareness, minimal profit' }),
    'c08-growth': () => plcCurve({ color, title: 'Growth: competitors enter, differentiation, profits peak' }),
    'c08-maturity': () => plcCurve({ color, title: 'Maturity: many competitors, brand loyalty, profits level off' }),
    'c08-decline': () => plcCurve({ color, title: 'Decline: competitors leave, rationalization, profits fall' }),
    'c08-adoption-curve': () => adoptionCurve({ color }),
    'c08-ansoff': () => matrix2x2({ rowLabel: 'Markets', colLabel: 'Products', rows: ['Current market', 'New market'], cols: ['Current product', 'New product'], cells: [[{ title: 'Market penetration', desc: 'make current products appeal to current customers (more usage, loyalty)' }, { title: 'Product development', desc: 'reach current customers with a new product' }], [{ title: 'Market development', desc: 'reach new customers (a new segment or country) with a current product' }, { title: 'Diversification', desc: 'new customers with a new product: riskiest' }]], color, title: 'Strategic approaches to growth (Figure 8-8)' }),
    'c08-npd-process': () => stepFlow(concept.figure.items, { color, title: 'The new product development process (Figure 8-9)' }),
    'c09-value-pricing': () => valueEquation({ color }),
    'c09-break-even': () => breakEven({ color }),
    'c09-elasticity': () => elasticityDemo({ color }),
    'c09-markup': () => markupBar({ color }),
    'c09-final-price-steps': () => stepFlow(concept.figure.items, { color, title: 'Four steps in setting a final price' }),
    'c10-intermediary-value': () => contactMath({ color }),
    'c10-consumer-channels': () => channelFlows([{ nodes: ['Producer', 'Consumer'], label: 'A · direct' }, { nodes: ['Producer', 'Retailer', 'Consumer'], label: 'B · large retailers' }, { nodes: ['Producer', 'Wholesaler', 'Retailer', 'Consumer'], label: 'C · most common for low-cost items' }, { nodes: ['Producer', 'Agent', 'Wholesaler', 'Retailer', 'Consumer'], label: 'D' }], { color, title: 'Consumer (B2C) channel structures' }),
    'c10-business-channels': () => channelFlows([{ nodes: ['Producer', 'Industrial user'], label: 'A · direct' }, { nodes: ['Producer', 'Industrial distributor', 'Industrial user'], label: 'B' }, { nodes: ['Producer', 'Agent', 'Industrial user'], label: 'C' }, { nodes: ['Producer', 'Agent', 'Industrial distributor', 'Industrial user'], label: 'D' }], { color, title: 'Business (B2B) channel structures' }),
    'c10-direct-indirect': () => channelFlows([{ nodes: ['Producer', 'Consumer'], label: 'Direct: no intermediaries' }, { nodes: ['Producer', 'Wholesaler', 'Retailer', 'Consumer'], label: 'Indirect: intermediaries perform channel functions' }], { color, title: 'Direct vs indirect channels' }),
    'c10-global-channels': () => stepFlow(concept.figure.items, { color, title: 'Channels of distribution in global marketing (Figure 10-7)' }),
    'c10-coverage-intensity': () => continuum(['Intensive · convenience goods', 'Selective · shopping goods', 'Exclusive · specialty goods'], { color, title: 'Target market coverage', left: 'As many outlets as possible', right: 'One outlet per area' }),
    'c10-scm': () => supplyChain({ color }),
    'c10-logistics': () => supplyChain({ color, title: 'Logistics moves goods through the whole chain' }),
    'c11-level-of-service': () => continuum(['Self-service', 'Limited-service', 'Full-service'], { color, title: 'Level of service', left: 'Customer does the work', right: 'Store does the work' }),
    'c11-positioning-matrix': () => matrix2x2({ rowLabel: 'Value added', colLabel: 'Breadth of product line', rows: ['High value added', 'Low value added'], cols: ['Broad line', 'Narrow line'], cells: [[{ title: 'Department stores', desc: 'broad line, high service and prestige (Holt Renfrew, Hudson\'s Bay)' }, { title: 'Specialty / luxury', desc: 'narrow line, high value added (Tiffany)' }], [{ title: 'Discount / warehouse', desc: 'broad line, low value added (Walmart, Costco)' }, { title: 'Narrow discounters', desc: 'narrow line, low value added (Dollarama-style)' }]], color, title: 'Retail positioning matrix' }),
    'c11-wheel-of-retailing': () => wheel({ color }),
    'c11-retail-life-cycle': () => stepFlow(concept.figure.items, { color, title: 'Retail life cycle' }),
    'c12-communication-process': () => commProcess({ color }),
    'c12-feedback-noise-experience': () => commProcess({ color, title: 'Feedback, noise and field of experience' }),
    'c12-push-pull': () => pushPull({ color }),
    'c12-advocacy-funnel': () => funnel(concept.figure.items, { color, title: 'The customer advocacy funnel (Figure 12-1)' }),
    'c12-imc-steps': () => stepFlow(concept.figure.items, { color, title: 'Steps in the marketing communications process (Figure 12-3)' }),
    'c08-plc-extension': () => pillList(concept.figure.items, { color, title: 'Four ways to extend a product life cycle' }),
  };
  if (B[id]) { try { return B[id](); } catch (e) { console.warn('visual failed', id, e); } }
  const fig = concept.figure;
  if (fig && fig.type === 'table') return revealTable(fig, { color });
  if (fig && fig.type === 'list') return PROCESS_KEYS.test(concept.term + ' ' + (fig.title || '')) ? stepFlow(fig.items, { color, title: fig.title }) : pillList(fig.items, { color, title: fig.title });
  return null;
}

/** True when the concept has a bespoke visual AND a figure table that is worth showing separately. */
export function hasTableToo(concept) {
  return !!(concept.figure && concept.figure.type === 'table');
}

// ---------- Glyph per concept ----------
const GLYPHS = [
  [/price|pricing|cost|markup|discount|break-even|elasticity|revenue|value/i, '🏷️'], [/brand/i, '®️'], [/segment|target|persona|niche|demograph|psychograph|behaviour/i, '🎯'],
  [/position|perceptual|usp|parity|difference/i, '📍'], [/channel|intermediar|wholesal|distribut|logistic|supply|warehous|transport|inventory/i, '🚚'],
  [/retail|store|shopper|merchandise|location|online/i, '🛒'], [/communicat|promotion|advertis|imc|media|public|selling|push|pull|funnel|storytell/i, '📣'],
  [/product life|plc|introduction|growth|maturity|decline|adoption|innovation|new product|npd|commercializ|test market|prototype|screening|idea/i, '🚀'],
  [/product|package|service|intangib|inconsist|inseparab/i, '📦'], [/exchange|need|want|market|utility|ethic|csr|societal|orientation|concept|crm|relationship|experience/i, '🧭'],
];
export function glyphFor(concept) {
  for (const [re, g] of GLYPHS) if (re.test(concept.term)) return g;
  return '✨';
}
