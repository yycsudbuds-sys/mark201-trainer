// The 2.5D parchment map (fallback for the 3D war table, and the compact map on Castra): the same real coastline
// (app/geo/med.json), the same provinces, roads and capitals as the 3D table, HTML labels with the same collision
// rules, a CSS perspective + rotateX zoom when entering a province, and drag / wheel / pinch pan-zoom.
// Also: the provincial road (castra for battles, the capital for the siege) and the progress helpers.
import { svg } from './visuals.js';
import { h } from './ui.js';
import { masteryLevel, chapterMastery } from './engine.js';
import { loadGeo, makeProjection, smoothPath, centroid } from './geo.js';
import { createLabelLayer } from './maplabels.js';

/** The active course's geography: { order, prov, roads, ridges, seaLanes, roman, colors, title, subtitle, seaLabels }. */
const geoOf = app => app.pack.geo;
const EUROPE = '';

export function chapterProgress(app, ch) {
  const topics = ch.topics.length;
  const cleared = ch.topics.filter(t => app.state.campaign.topics[t.id]?.cleared).length;
  const boss = !!app.state.campaign.bosses?.[ch.chapter]?.cleared;
  const m = chapterMastery(app.content, app.state, ch.chapter);
  return { topics, cleared, boss, frac: boss ? 1 : (cleared / topics) * 0.85 + m.score * 0.15, mastery: m };
}
export function provinceState(app, ch) {
  const prog = chapterProgress(app, ch);
  if (prog.boss) return 'conquered';
  const ORDER = app.pack.order;
  const idx = ORDER.indexOf(ch.chapter);
  if (idx <= 0) return 'open';
  if (app.state.campaign.unlocked?.[ch.chapter]) return 'open';
  if (prog.cleared > 0) return 'open';
  const prev = app.index.chapter.get(ORDER[idx - 1]);
  const prevProg = prev ? chapterProgress(app, prev) : { cleared: 1 };
  return prevProg.cleared > 0 || prevProg.boss ? 'open' : 'locked';
}
export function nextIsland(app) {
  for (const num of app.pack.order) { const ch = app.index.chapter.get(num); if (ch && !chapterProgress(app, ch).boss) return num; }
  return null;
}

let defIds = 0;
function parchDefs(prefix) {
  return svg('defs', {},
    svg('linearGradient', { id: prefix + 'parchGrad', x1: 0, y1: 0, x2: 1, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#E9D7AE' }), svg('stop', { offset: 0.5, 'stop-color': '#DEC894' }), svg('stop', { offset: 1, 'stop-color': '#CDB47C' })),
    svg('linearGradient', { id: prefix + 'seaParch', x1: 0, y1: 0, x2: 0, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#CFC1A0' }), svg('stop', { offset: 1, 'stop-color': '#B9A77E' })),
    svg('filter', { id: prefix + 'grain', x: 0, y: 0, width: '100%', height: '100%' }, svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.8', numOctaves: '3', stitchTiles: 'stitch' }), svg('feColorMatrix', { values: '0 0 0 0 0.25 0 0 0 0 0.18 0 0 0 0 0.08 0 0 0 0.25 0' })),
    svg('filter', { id: prefix + 'rough', x: '-5%', y: '-5%', width: '110%', height: '110%' }, svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.02', numOctaves: '2', seed: '3' }), svg('feDisplacementMap', { in: 'SourceGraphic', scale: '6', xChannelSelector: 'R', yChannelSelector: 'G' })),
    svg('pattern', { id: prefix + 'crimsonHatch', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, svg('rect', { width: 8, height: 8, fill: '#8B1E1E', 'fill-opacity': 0.5 }), svg('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: '#5A1313', 'stroke-width': 3 })),
    svg('pattern', { id: prefix + 'fog', width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(30)' }, svg('rect', { width: 14, height: 14, fill: '#8C8070', 'fill-opacity': 0.22 }), svg('line', { x1: 0, y1: 0, x2: 0, y2: 14, stroke: '#6B5F4D', 'stroke-opacity': 0.35, 'stroke-width': 4 })),
    svg('pattern', { id: prefix + 'seaLines', width: 48, height: 14, patternUnits: 'userSpaceOnUse' }, svg('path', { d: 'M 0 7 q 12 -5 24 0 t 24 0', class: 'sea-line' })),
    svg('clipPath', { id: prefix + 'landClip' }, svg('path', { d: EUROPE })),
  );
}
function roadPath(pts) { let d = `M ${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; d += ` Q ${(x0 + x1) / 2 + (y1 - y0) * 0.12} ${(y0 + y1) / 2 - (x1 - x0) * 0.12} ${x1} ${y1}`; } return d; }

/** The 2.5D map. opts: { onIsland(ch, state, evt), compact } -> element (fills itself once the coastline loads). */
export function worldMap(app, opts = {}) {
  const compact = !!opts.compact;
  const wrap = h('div', { class: 'map25' + (compact ? ' compact' : ''), role: compact ? null : 'img', 'aria-label': 'Campaign map' });
  const stage = h('div', { class: 'map25-stage' }); wrap.appendChild(stage);
  const G = geoOf(app); const { prov: PROV, order: ORDER, roads: ROADS, ridges: RIDGES } = G;
  if (!compact) wrap.appendChild(h('div', { class: 'map25-cartouche' }, h('div', { class: 'map-title' }, G.title || 'IMPERIUM'), h('div', { class: 'map-subtitle' }, G.subtitle || 'TABULA PROVINCIARUM')));
  const labels = compact ? null : createLabelLayer(wrap);
  let svgEl = null; let vb = null; let proj = null;
  loadGeo().then(geo => { if (wrap.dead) return; build(geo); }).catch(() => { stage.appendChild(h('div', { class: 'empty' }, 'The map could not be drawn.')); });
  function build(geo) {
    proj = makeProjection(geo.bbox, 1000); const W = 1000, Hh = Math.round(proj.H); const P = (lon, lat) => { const [u, v] = proj.toUV(lon, lat); return [u * W, (1 - v) * Hh]; };
    const Pf = (lon, lat) => P(lon, lat).map(x => Math.round(x * 10) / 10);
    const Pre = 'wm' + (++defIds) + '-';
    const s = svg('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'worldmap' + (compact ? ' compact' : ''), preserveAspectRatio: 'xMidYMid meet' });
    s.appendChild(parchDefs(Pre));
    const landD = geo.polys.map(poly => poly.map(ring => 'M ' + ring.map(p => Pf(p[0], p[1]).join(' ')).join(' L ') + ' Z').join(' ')).join(' ');
    s.querySelector('clipPath path').setAttribute('d', landD); s.querySelector('clipPath').setAttribute('clip-rule', 'evenodd');
    s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: Hh, fill: `url(#${Pre}seaParch)` }));
    s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: Hh, fill: `url(#${Pre}seaLines)`, opacity: 0.55 }));
    s.appendChild(svg('path', { d: landD, class: 'coast-glow', 'fill-rule': 'evenodd' }));
    s.appendChild(svg('path', { d: landD, class: 'coast', 'fill-rule': 'evenodd', filter: `url(#${Pre}rough)` }));
    const inland = svg('g', { 'clip-path': `url(#${Pre}landClip)` }); s.appendChild(inland);
    // relief marks
    const relief = svg('g', { class: 'relief-g' }); for (const r of RIDGES) { const path = smoothPath(r.pts, 40); for (let i = 0; i < path.length; i += 2) { const [x, y] = P(...path[i]); const sz = 6 + r.h * 5; relief.appendChild(svg('path', { d: `M ${x - sz * 0.5} ${y + sz * 0.3} l ${sz * 0.5} ${-sz * 0.65} l ${sz * 0.5} ${sz * 0.65}`, class: 'relief' })); } } inland.appendChild(relief);
    const next = nextIsland(app);
    const provs = svg('g'); inland.appendChild(provs);
    const roads = svg('g'); inland.appendChild(roads);
    for (const rd of ROADS) { const pts = smoothPath(rd.pts, 40).map(p => P(p[0], p[1])); const chA = app.index.chapter.get(rd.from); const done = chA && chapterProgress(app, chA).boss; const isNext = next === rd.to && !done;
      roads.appendChild(svg('path', { d: roadPath(pts), class: 'road-edge' + (done ? ' done' : '') })); roads.appendChild(svg('path', { d: roadPath(pts), class: 'route' + (done ? ' done' : '') + (isNext ? ' next' : '') })); }
    s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: Hh, class: 'parch-grain', filter: `url(#${Pre}grain)` }));
    for (const [label, lon, lat] of (G.seaLabels || [])) { const [mx, my] = P(lon, lat); s.appendChild(svg('text', { x: mx, y: my, class: 'sea-label', 'text-anchor': 'middle' }, label)); }
    const items = [];
    for (const num of ORDER) {
      const ch = app.index.chapter.get(num); if (!ch) continue;
      const pv = PROV[num]; const prog = chapterProgress(app, ch); const state = provinceState(app, ch);
      const g = svg('g', { class: `province ${state}` + (next === num ? ' next' : ''), tabindex: compact ? null : '0', role: compact ? null : 'button', 'aria-label': `Chapter ${num}: ${ch.title}, ${state}`, style: `--ch:${ch.color}` });
      const d = 'M ' + pv.poly.map(p => Pf(p[0], p[1]).join(' ')).join(' L ') + ' Z';
      g.appendChild(svg('path', { d, class: 'terr' }));
      if (state === 'locked') g.appendChild(svg('path', { d, fill: `url(#${Pre}fog)`, class: 'fog' }));
      if (state === 'conquered') g.appendChild(svg('path', { d, fill: `url(#${Pre}crimsonHatch)`, class: 'hatch' }));
      const [cx, cy] = P(pv.cap[0], pv.cap[1]);
      const cap = svg('g', { class: 'capital', transform: `translate(${cx} ${cy})` });
      cap.appendChild(svg('circle', { r: 7, class: 'cap-dot' })); cap.appendChild(svg('circle', { r: 3, class: 'cap-core' }));
      ch.topics.forEach((t, i) => { const a = -Math.PI / 2 + (i / ch.topics.length) * Math.PI * 2; const r = 15; const up = !!app.state.campaign.topics[t.id]?.cleared; cap.appendChild(svg('g', { class: 'std' + (up ? ' up' : ''), transform: `translate(${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)})` }, svg('line', { x1: 0, y1: 3, x2: 0, y2: -6, class: 'std-pole' }), svg('path', { d: 'M 0 -6 l 5 2 l -5 2 z', class: 'std-cloth' }))); });
      if (state === 'conquered') cap.appendChild(svg('path', { d: 'M 0 -22 l -7 4 l 4.5 -1 l -1.5 5 l 4 -4 l 4 4 l -1.5 -5 l 4.5 1 z', class: 'eagle' }));
      g.appendChild(cap);
      if (!compact) { const go = (e) => opts.onIsland ? opts.onIsland(ch, state, e) : app.navigate(`#/campaign/${num}`); g.addEventListener('click', e => { if (dragMoved) return; go(e); }); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } }); }
      else { const [lx, ly] = P(pv.label[0], pv.label[1]); g.appendChild(svg('text', { x: lx, y: ly, class: 'prov-name', 'text-anchor': 'middle' }, `Ch ${num}`)); }
      provs.appendChild(g);
      items.push({ id: 'p' + num, name: `Chapter ${num}`, numeral: ch.short || ch.title, state, next: next === num, priority: next === num ? 3 : state === 'open' ? 2 : 1, pos: P(pv.label[0], pv.label[1]), status: state === 'conquered' ? 'Conquered' : state === 'locked' ? 'Locked' : `${prog.cleared} / ${prog.topics} standards`, ch });
    }
    // legion token on the next province
    if (next) { const pv = PROV[next]; const [tx, ty] = P(pv.cap[0] + 1.6, pv.cap[1] - 0.9); s.appendChild(svg('g', { class: 'legion-token', transform: `translate(${tx} ${ty})` }, svg('line', { x1: 4, y1: 0, x2: 4, y2: -22, class: 'std-pole' }), svg('path', { d: 'M 4 -22 l 10 3 l -10 3 z', class: 'std-cloth' }), svg('circle', { cx: 0, cy: -8, r: 3.2, class: 'tok-head' }), svg('rect', { x: -3, y: -5, width: 6, height: 8, rx: 1.5, class: 'tok-body' }))); }
    if (!compact) { s.appendChild(svg('g', { transform: 'translate(64 64)', class: 'compass-g' }, svg('circle', { r: 26, class: 'compass' }), svg('circle', { r: 4, class: 'compass' }), svg('path', { d: 'M 0 -26 L 6 0 L 0 26 L -6 0 Z', class: 'compass' }), svg('path', { d: 'M -26 0 L 0 6 L 26 0 L 0 -6 Z', class: 'compass' }), svg('path', { d: 'M 0 -26 L 5 -4 L -5 -4 Z', class: 'compass-n' }), svg('text', { y: -32, class: 'prov-num', 'text-anchor': 'middle', style: 'font-size:11px' }, 'N'))); }
    stage.appendChild(s); svgEl = s; vb = { x: 0, y: 0, w: W, h: Hh, W, H: Hh };
    if (labels) { labels.set(items); requestAnimationFrame(place); wrap.addEventListener('click', ev => { const lab = ev.target.closest && ev.target.closest('.mlabel'); if (!lab || dragMoved) return; const it = items.find(i => i.id === lab.dataset.id); if (it) (opts.onIsland ? opts.onIsland(it.ch, it.state, ev) : app.navigate(`#/campaign/${it.ch.chapter}`)); }); }
    if (!compact) panZoom();
  }
  function place() { if (!labels || !svgEl) return; const ctm = svgEl.getScreenCTM(); const r = wrap.getBoundingClientRect(); if (!ctm) return; labels.update(pos => { const x = ctm.a * pos[0] + ctm.c * pos[1] + ctm.e - r.left; const y = ctm.b * pos[0] + ctm.d * pos[1] + ctm.f - r.top; return [x, y, x > -60 && x < r.width + 60 && y > -30 && y < r.height + 30]; }); }
  let dragMoved = false;
  function panZoom() {
    const apply = () => { svgEl.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); place(); };
    const clampVb = () => { vb.w = Math.max(vb.W / 4, Math.min(vb.W, vb.w)); vb.h = vb.w * vb.H / vb.W; vb.x = Math.max(0, Math.min(vb.W - vb.w, vb.x)); vb.y = Math.max(0, Math.min(vb.H - vb.h, vb.y)); };
    const zoomAt = (px, py, factor) => { const r = svgEl.getBoundingClientRect(); const ctm = svgEl.getScreenCTM(); if (!ctm) return; const inv = ctm.inverse(); const sx = inv.a * px + inv.c * py + inv.e, sy = inv.b * px + inv.d * py + inv.f; const nw = vb.w * factor; vb.x = sx - (sx - vb.x) * (nw / vb.w); vb.y = sy - (sy - vb.y) * (nw / vb.w); vb.w = nw; clampVb(); apply(); };
    wrap.addEventListener('wheel', ev => { ev.preventDefault(); zoomAt(ev.clientX, ev.clientY, ev.deltaY > 0 ? 1.12 : 0.89); }, { passive: false });
    const pts = new Map(); let drag = null; let pinch = null;
    wrap.addEventListener('pointerdown', ev => { pts.set(ev.pointerId, [ev.clientX, ev.clientY]); dragMoved = false; if (pts.size === 1) drag = { x: ev.clientX, y: ev.clientY, vx: vb.x, vy: vb.y }; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), w: vb.w, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 }; drag = null; } });
    wrap.addEventListener('pointermove', ev => { if (!pts.has(ev.pointerId)) return; pts.set(ev.pointerId, [ev.clientX, ev.clientY]);
      if (pinch && pts.size === 2) { const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); const f = pinch.w / Math.max(1, vb.w) * (pinch.d / Math.max(10, d)); zoomAt(pinch.cx, pinch.cy, f); pinch.w = vb.w; pinch.d = d; dragMoved = true; return; }
      if (drag) { const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y; if (Math.hypot(dx, dy) > 6) dragMoved = true; if (dragMoved) { const ctm = svgEl.getScreenCTM(); const k = ctm ? 1 / ctm.a : 1; vb.x = drag.vx - dx * k; vb.y = drag.vy - dy * k; clampVb(); apply(); } } });
    const end = ev => { pts.delete(ev.pointerId); if (pts.size < 2) pinch = null; if (pts.size === 0) { drag = null; setTimeout(() => { dragMoved = false; }, 0); } };
    wrap.addEventListener('pointerup', end); wrap.addEventListener('pointercancel', end); wrap.addEventListener('pointerleave', end);
    wrap.addEventListener('dblclick', ev => { ev.preventDefault(); vb.x = 0; vb.y = 0; vb.w = vb.W; vb.h = vb.H; apply(); });
    const ro = new ResizeObserver(() => place()); ro.observe(wrap);
  }
  wrap.zoomTo = (num, motion) => new Promise(resolve => { if (!motion || !svgEl || !proj) { resolve(); return; } const c = centroid(PROV[num].poly); const [u, v] = proj.toUV(c[0], c[1]); stage.style.transformOrigin = `${(u * 100).toFixed(1)}% ${((1 - v) * 100).toFixed(1)}%`; wrap.classList.add('zooming'); if (labels) labels.el.classList.add('hidden'); setTimeout(resolve, 560); });
  return wrap;
}

/** Zoom the 2.5D map toward a province (CSS perspective + rotateX), then resolve. Instant when motion is off. */
export function zoomToProvince(frameEl, num, { motion = true } = {}) {
  const m = frameEl.querySelector && frameEl.querySelector('.map25');
  if (m && m.zoomTo) return m.zoomTo(num, motion);
  return Promise.resolve();
}

/** Provincial road: battles as castra, the capital as a walled city. opts: {onNode(topic, i), onBoss()} */
export function islandTrail(app, ch, opts = {}) {
  const W = 1000; const H = 440; const P = 'tr' + (++defIds) + '-';
  const pv = app.pack.geo.prov[ch.chapter] || { name: ch.title, capital: 'the capital' };
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'trail', role: 'img', 'aria-label': `Chapter ${ch.chapter} road`, style: `--ch:${ch.color}` });
  s.appendChild(parchDefs(P));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${P}seaParch)` }));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${P}seaLines)`, opacity: 0.55 }));
  // land: a wide province shape with a rough coast
  const land = `M 30 ${H - 40} C 40 160, 140 90, 300 70 C 460 50, 620 40, 780 70 C 900 95, 980 160, 975 ${H - 60} L 975 ${H} L 30 ${H} Z`;
  const prog = chapterProgress(app, ch);
  s.appendChild(svg('path', { d: land, class: 'coast-glow' }));
  s.appendChild(svg('path', { d: land, class: 'coast', filter: `url(#${P}rough)` }));
  s.appendChild(svg('clipPath', { id: P + 'land' }, svg('path', { d: land })));
  s.appendChild(svg('rect', { x: 0, y: H - H * prog.frac, width: W, height: H * prog.frac, 'clip-path': `url(#${P}land)`, fill: ch.color, 'fill-opacity': 0.18 }));
  [[200, 200, 5], [560, 150, 6], [820, 220, 4]].forEach(([x0, y0, n]) => { for (let i = 0; i < n; i++) s.appendChild(svg('path', { d: `M ${x0 + i * 16} ${y0 + (i % 2) * 6} l 7 -11 l 7 11`, class: 'relief' })); });
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'parch-grain', filter: `url(#${P}grain)` }));
  const n = ch.topics.length + 1;
  const pts = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1); pts.push([120 + t * (W - 240), 235 + Math.sin(t * Math.PI * 1.9 + 0.3) * 48]); }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < n; i++) { const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; d += ` C ${(x0 + x1) / 2} ${y0}, ${(x0 + x1) / 2} ${y1}, ${x1} ${y1}`; }
  s.appendChild(svg('path', { d, class: 'road-edge' })); s.appendChild(svg('path', { d, class: 'road' }));
  const clearedCount = prog.cleared;
  ch.topics.forEach((t, i) => {
    const [x, y] = pts[i];
    const cleared = !!app.state.campaign.topics[t.id]?.cleared;
    const solid = t.concepts.filter(cid => masteryLevel(app.state.concepts[cid]) >= 3).length;
    const read = t.concepts.filter(cid => app.state.concepts[cid]?.seen).length;
    const isNext = !cleared && i === ch.topics.findIndex(tt => !app.state.campaign.topics[tt.id]?.cleared);
    const g = svg('g', { class: 'node' + (cleared ? ' cleared' : '') + (isNext ? ' next' : ''), transform: `translate(${x} ${y})`, tabindex: '0', role: 'button', 'aria-label': `Battle ${i + 1}: ${t.title}` });
    g.appendChild(svg('circle', { r: 34, class: 'halo', 'fill-opacity': isNext ? 0.18 : 0 }));
    // castrum: palisade square, four towers, gate, tents inside
    g.appendChild(svg('rect', { x: -22, y: -18, width: 44, height: 36, rx: 3, class: 'castrum' }));
    [[-22, -18], [18, -18], [-22, 14], [18, 14]].forEach(([tx, ty]) => g.appendChild(svg('rect', { x: tx - 2, y: ty - 2, width: 8, height: 8, class: 'tower' })));
    g.appendChild(svg('path', { d: 'M -5 18 v -6 a 5 5 0 0 1 10 0 v 6 z', class: 'gate' }));
    g.appendChild(svg('path', { d: 'M -14 6 l 6 -9 l 6 9 z M -2 2 l 6 -9 l 6 9 z M 4 10 l 5 -7 l 5 7 z', class: 'tents' }));
    if (cleared) g.appendChild(svg('g', { class: 'std up', transform: 'translate(0 -22)' }, svg('line', { x1: 0, y1: 8, x2: 0, y2: -10, class: 'std-pole' }), svg('path', { d: 'M 0 -10 l 9 3 l -9 3 z', class: 'std-cloth' })));
    g.appendChild(svg('text', { y: -26, class: 'node-n', 'text-anchor': 'middle' }, cleared ? '' : ROMAN_SMALL(i + 1)));
    const frac = solid / t.concepts.length; const r = 38; const c = 2 * Math.PI * r;
    g.appendChild(svg('circle', { r, class: 'arc', fill: 'none', 'stroke-width': 3, 'stroke-dasharray': `${c * frac} ${c}`, transform: 'rotate(-90)' }));
    // full two-line label, alternating above/below so neighbours never collide
    const below = i % 2 === 0;
    const lines = wrapTitle(t.title, 24);
    const ly = below ? 54 : -(50 + (lines.length - 1) * 15);
    const label = svg('text', { y: ly, class: 'node-label', 'text-anchor': 'middle' });
    lines.forEach((ln, k) => label.appendChild(svg('tspan', { x: 0, dy: k === 0 ? 0 : 15 }, ln)));
    g.appendChild(label);
    g.appendChild(svg('text', { y: ly + lines.length * 15 + 1, class: 'node-sub', 'text-anchor': 'middle' }, `${read}/${t.concepts.length} scouted · ${solid}/${t.concepts.length} held`));
    const go = () => opts.onNode && opts.onNode(t, i);
    g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    s.appendChild(g);
  });
  // the capital: walled city
  const [bx, by] = pts[n - 1];
  const allCleared = clearedCount === ch.topics.length;
  const bg = svg('g', { class: 'node boss' + (prog.boss ? ' cleared' : '') + (allCleared ? ' next' : ' locked'), transform: `translate(${bx} ${by})`, tabindex: '0', role: 'button', 'aria-label': `Siege of ${pv.capital}` });
  bg.appendChild(svg('circle', { r: 46, class: 'halo', 'fill-opacity': allCleared && !prog.boss ? 0.18 : 0 }));
  bg.appendChild(svg('path', { d: 'M -30 20 v -22 h 6 v -6 h 6 v 6 h 8 v -6 h 6 v 6 h 8 v -6 h 6 v 6 h 6 v -6 h 6 v 6 h 6 v 22 z', class: 'wall' }));
  bg.appendChild(svg('path', { d: 'M -6 20 v -10 a 6 6 0 0 1 12 0 v 10 z', class: 'gate' }));
  bg.appendChild(svg('path', { d: 'M -14 -8 l 14 -14 l 14 14 z M -12 -8 h 24 v 10 h -24 z', class: 'temple' }));
  [[-10, 0], [-4, 0], [2, 0], [8, 0]].forEach(([x]) => bg.appendChild(svg('rect', { x, y: -6, width: 2.4, height: 8, class: 'col' })));
  if (prog.boss) bg.appendChild(svg('path', { d: 'M 0 -34 l -8 5 l 5 -1 l -2 6 l 5 -5 l 5 5 l -2 -6 l 5 1 z', class: 'eagle' }));
  else bg.appendChild(svg('text', { y: -28, class: 'node-n', 'text-anchor': 'middle' }, allCleared ? '' : ''));
  if (!allCleared && !prog.boss) bg.appendChild(svg('path', { d: 'M -5 -24 v -4 a 5 5 0 0 1 10 0 v 4 M -7 -24 h 14 v 9 h -14 z', class: 'plock' }));
  const bl = (n - 1) % 2 === 0 ? 56 : -58;
  bg.appendChild(svg('text', { y: bl, class: 'node-label', 'text-anchor': 'middle' }, prog.boss ? 'Chapter boss cleared' : `Chapter ${ch.chapter} boss`));
  bg.appendChild(svg('text', { y: bl + 15, class: 'node-sub', 'text-anchor': 'middle' }, allCleared ? `${app.pack.boss.n} questions · ${Math.round(app.pack.boss.pass * 100)}% clears it` : 'pass every checkpoint first'));
  const goBoss = () => { if (allCleared && opts.onBoss) opts.onBoss(); else app.toast('Pass every checkpoint quiz in this chapter before the chapter boss', 'info'); };
  bg.addEventListener('click', goBoss); bg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goBoss(); } });
  s.appendChild(bg);
  return s;
}

function ROMAN_SMALL(n) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n); }
function wrapTitle(s, max) {
  const words = String(s).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) lines.push(cur);
  if (lines.length > 3) { const head = lines.slice(0, 2); head.push(lines.slice(2).join(' ')); return head; }
  return lines;
}
export function blobPath() { return ''; }
