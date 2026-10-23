// Parchment map of the Roman world. Provinces are clipped to the coastline, labels never collide,
// standards progress is a ring of small standards around the capital, roads curve along the land.
// Also: the provincial road (castra for battles, the capital for the siege) and a zoom transition.
import { svg } from './visuals.js';
import { masteryLevel, chapterMastery } from './engine.js';

export const ROMAN = { 1: 'I', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII' };
/** chapter -> province. cx/cy = capital; label = where the two-line label sits; terr = territory polygon (clipped to land). */
export const PROVINCES = {
  1: { name: 'Italia', capital: 'Roma', cx: 452, cy: 330, label: [452, 262], terr: 'M 400 270 L 440 262 L 470 285 L 500 320 L 540 352 L 560 380 L 540 400 L 505 378 L 470 358 L 440 340 L 420 312 L 398 292 Z', road: [[452, 330]] },
  6: { name: 'Hispania', capital: 'Tarraco', cx: 215, cy: 350, label: [150, 395], terr: 'M 60 322 L 100 318 L 140 322 L 177 325 L 215 332 L 258 345 L 240 372 L 211 395 L 190 420 L 150 440 L 117 457 L 90 450 L 57 439 L 48 400 L 46 360 Z' },
  7: { name: 'Gallia', capital: 'Lugdunum', cx: 265, cy: 270, label: [250, 215], terr: 'M 150 222 L 185 217 L 215 205 L 242 190 L 265 178 L 288 163 L 320 150 L 345 160 L 360 200 L 380 240 L 395 268 L 380 318 L 363 308 L 340 320 L 310 335 L 285 345 L 262 345 L 240 310 L 205 300 L 170 275 L 131 238 Z' },
  8: { name: 'Britannia', capital: 'Londinium', cx: 185, cy: 150, label: [160, 95], terr: 'M 108 92 L 125 70 L 151 55 L 177 74 L 185 110 L 200 140 L 235 160 L 240 170 L 235 188 L 205 198 L 170 205 L 140 210 L 114 206 L 112 185 L 125 172 L 112 150 L 100 125 Z' },
  9: { name: 'Germania', capital: 'Colonia', cx: 390, cy: 190, label: [430, 120], terr: 'M 345 160 L 372 95 L 390 74 L 410 92 L 416 128 L 450 128 L 490 124 L 519 122 L 540 150 L 540 200 L 520 240 L 490 262 L 470 285 L 440 262 L 400 270 L 395 268 L 380 240 L 360 200 Z' },
  10: { name: 'Graecia', capital: 'Athenae', cx: 598, cy: 395, label: [600, 300], terr: 'M 540 200 L 580 190 L 620 200 L 660 230 L 690 300 L 656 368 L 630 380 L 616 422 L 600 440 L 587 439 L 575 410 L 565 390 L 544 368 L 520 340 L 500 310 L 490 262 L 520 240 Z' },
  11: { name: 'Asia', capital: 'Ephesus', cx: 790, cy: 330, label: [835, 265], terr: 'M 707 368 L 745 358 L 775 350 L 800 352 L 830 362 L 870 372 L 912 368 L 955 360 L 980 340 L 980 230 L 940 215 L 880 210 L 820 215 L 760 230 L 720 260 L 700 300 L 690 330 Z' },
  12: { name: 'Aegyptus', capital: 'Alexandria', cx: 735, cy: 480, label: [735, 520], terr: 'M 620 470 L 660 462 L 700 466 L 741 470 L 790 470 L 826 457 L 850 450 L 900 450 L 940 445 L 980 440 L 980 560 L 900 555 L 820 560 L 741 546 L 700 540 L 650 538 L 600 532 L 590 500 Z' },
};
export const ISLANDS = PROVINCES;
export const ORDER = [1, 6, 7, 8, 9, 10, 11, 12];
// Roads follow the land between capitals (waypoints keep them off the sea).
const ROADS = {
  '1-6': [[452, 330], [410, 300], [340, 320], [262, 345], [215, 350]],
  '6-7': [[215, 350], [240, 310], [265, 270]],
  '7-8': [[265, 270], [240, 200], [205, 198], [185, 150]],
  '8-9': [[185, 150], [240, 170], [320, 150], [390, 190]],
  '9-10': [[390, 190], [470, 220], [540, 240], [598, 395]],
  '10-11': [[598, 395], [640, 330], [700, 300], [790, 330]],
  '11-12': [[790, 330], [820, 400], [800, 470], [735, 480]],
};

const EUROPE = 'M 57 324 L 100 318 L 140 322 L 177 325 L 215 332 L 262 345 L 240 372 L 211 395 L 190 420 L 150 440 L 117 457 L 90 450 L 57 439 L 48 400 L 46 360 Z '
  + 'M 262 345 L 240 310 L 205 300 L 170 275 L 131 238 L 150 222 L 185 217 L 215 205 L 242 190 L 265 178 L 288 163 L 320 150 L 348 119 L 372 95 L 390 74 L 410 92 L 416 128 L 450 128 L 490 124 L 519 122 L 548 100 L 570 83 L 600 70 L 640 60 L 700 52 L 760 48 L 820 46 L 880 44 L 940 46 L 980 50 L 980 340 L 955 360 L 912 368 L 870 372 L 830 362 L 800 352 L 775 350 L 745 358 L 707 368 L 690 380 L 656 368 L 630 380 L 616 422 L 600 440 L 587 439 L 575 410 L 565 390 L 544 368 L 520 340 L 500 310 L 470 295 L 447 286 L 421 290 L 442 322 L 455 350 L 500 370 L 527 384 L 510 400 L 485 422 L 470 400 L 455 372 L 440 360 L 425 352 L 400 330 L 380 318 L 363 308 L 340 320 L 310 335 L 285 345 Z '
  + 'M 108 92 L 125 70 L 151 55 L 177 74 L 185 110 L 200 140 L 235 160 L 240 170 L 235 188 L 205 198 L 170 205 L 140 210 L 114 206 L 112 185 L 125 172 L 112 150 L 100 125 Z '
  + 'M 40 172 L 60 150 L 84 125 L 108 114 L 110 140 L 108 172 L 90 190 L 60 192 L 42 185 Z '
  + 'M 40 564 L 70 520 L 108 466 L 150 455 L 200 448 L 262 443 L 320 438 L 390 439 L 430 455 L 470 475 L 520 500 L 553 528 L 600 532 L 650 538 L 700 540 L 741 546 L 780 540 L 810 528 L 820 500 L 826 457 L 850 450 L 900 450 L 940 445 L 980 440 L 980 620 L 40 620 Z '
  + 'M 462 433 L 490 428 L 512 440 L 498 460 L 470 462 L 455 448 Z M 352 398 L 372 390 L 382 420 L 368 445 L 348 440 L 340 415 Z M 350 350 L 365 342 L 372 368 L 362 385 L 346 378 Z M 610 470 L 660 462 L 690 470 L 660 482 L 615 482 Z M 835 420 L 870 414 L 885 428 L 860 438 L 836 432 Z';

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
  const idx = ORDER.indexOf(ch.chapter);
  if (idx <= 0) return 'open';
  if (app.state.campaign.unlocked?.[ch.chapter]) return 'open';
  if (prog.cleared > 0) return 'open';
  const prev = app.index.chapter.get(ORDER[idx - 1]);
  const prevProg = prev ? chapterProgress(app, prev) : { cleared: 1 };
  return prevProg.cleared > 0 || prevProg.boss ? 'open' : 'locked';
}
export function nextIsland(app) {
  for (const num of ORDER) { const ch = app.index.chapter.get(num); if (ch && !chapterProgress(app, ch).boss) return num; }
  return null;
}
function roadPath(pts) { let d = `M ${pts[0][0]} ${pts[0][1]}`; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; d += ` Q ${(x0 + x1) / 2 + (y1 - y0) * 0.12} ${(y0 + y1) / 2 - (x1 - x0) * 0.12} ${x1} ${y1}`; } return d; }

/** World map SVG. opts: {onIsland(ch, state, evt), compact} */
export function worldMap(app, opts = {}) {
  const W = 1000; const H = 620; const P = 'wm' + (++defIds) + '-';
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'worldmap' + (opts.compact ? ' compact' : ''), role: 'img', 'aria-label': 'Map of the provinces' });
  s.appendChild(parchDefs(P));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${P}seaParch)` }));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: `url(#${P}seaLines)`, opacity: 0.55 }));
  s.appendChild(svg('path', { d: EUROPE, class: 'coast-glow' }));
  s.appendChild(svg('path', { d: EUROPE, class: 'coast', filter: `url(#${P}rough)` }));
  // mountain relief (Alps, Pyrenees, Apennines, Taurus, Atlas)
  const relief = svg('g', { class: 'relief-g', 'clip-path': `url(#${P}landClip)` });
  [[300, 280, 7], [160, 330, 5], [470, 320, 4], [860, 300, 5], [300, 470, 6]].forEach(([x0, y0, n]) => { for (let i = 0; i < n; i++) relief.appendChild(svg('path', { d: `M ${x0 + i * 16} ${y0 + (i % 2) * 6} l 7 -11 l 7 11`, class: 'relief' })); });
  s.appendChild(relief);
  // provinces, clipped to the land
  const provs = svg('g', { 'clip-path': `url(#${P}landClip)` });
  s.appendChild(provs);
  // roads in chapter order
  const roads = svg('g', { 'clip-path': `url(#${P}landClip)` });
  for (let i = 0; i < ORDER.length - 1; i++) {
    const key = `${ORDER[i]}-${ORDER[i + 1]}`; const pts = ROADS[key]; if (!pts) continue;
    const chA = app.index.chapter.get(ORDER[i]); const done = chA && chapterProgress(app, chA).boss;
    const next = nextIsland(app) === ORDER[i + 1] && !done;
    roads.appendChild(svg('path', { d: roadPath(pts), class: 'road-edge' + (done ? ' done' : '') }));
    roads.appendChild(svg('path', { d: roadPath(pts), class: 'route' + (done ? ' done' : '') + (next ? ' next' : '') }));
  }
  s.appendChild(roads);
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'parch-grain', filter: `url(#${P}grain)` }));
  s.appendChild(svg('text', { x: 500, y: 455, class: 'sea-label', 'text-anchor': 'middle' }, 'MARE NOSTRUM'));
  s.appendChild(svg('text', { x: 60, y: 545, class: 'sea-label', 'text-anchor': 'start' }, 'OCEANUS'));
  const next = nextIsland(app);
  const labels = svg('g', { class: 'labels' }); s.appendChild(labels);
  for (const num of ORDER) {
    const ch = app.index.chapter.get(num); if (!ch) continue;
    const pv = PROVINCES[num]; const prog = chapterProgress(app, ch); const state = provinceState(app, ch);
    const g = svg('g', { class: `province ${state}` + (next === num ? ' next' : ''), tabindex: '0', role: 'button', 'aria-label': `Chapter ${ROMAN[num]}: ${pv.name} (${ch.title}), ${state}`, style: `--ch:${ch.color}` });
    g.appendChild(svg('path', { d: pv.terr, class: 'terr' }));
    if (state === 'locked') g.appendChild(svg('path', { d: pv.terr, fill: `url(#${P}fog)`, class: 'fog' }));
    if (state === 'conquered') g.appendChild(svg('path', { d: pv.terr, fill: `url(#${P}crimsonHatch)`, class: 'hatch' }));
    // capital with a ring of standards (one per battle, filled when planted)
    const cap = svg('g', { class: 'capital', transform: `translate(${pv.cx} ${pv.cy})` });
    cap.appendChild(svg('circle', { r: 7, class: 'cap-dot' }));
    cap.appendChild(svg('circle', { r: 3, class: 'cap-core' }));
    ch.topics.forEach((t, i) => {
      const a = -Math.PI / 2 + (i / ch.topics.length) * Math.PI * 2; const r = 15;
      const fx = Math.cos(a) * r; const fy = Math.sin(a) * r;
      const up = !!app.state.campaign.topics[t.id]?.cleared;
      cap.appendChild(svg('g', { class: 'std' + (up ? ' up' : ''), transform: `translate(${fx.toFixed(1)} ${fy.toFixed(1)})` }, svg('line', { x1: 0, y1: 3, x2: 0, y2: -6, class: 'std-pole' }), svg('path', { d: 'M 0 -6 l 5 2 l -5 2 z', class: 'std-cloth' })));
    });
    if (state === 'conquered') cap.appendChild(svg('path', { d: 'M 0 -22 l -7 4 l 4.5 -1 l -1.5 5 l 4 -4 l 4 4 l -1.5 -5 l 4.5 1 z', class: 'eagle' }));
    g.appendChild(cap);
    const go = (e) => opts.onIsland ? opts.onIsland(ch, state, e) : app.navigate(`#/campaign/${num}`);
    g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } });
    provs.appendChild(g);
    // label (two lines) + status badge below; placed at pv.label away from the capital
    const [lx, ly] = pv.label;
    const lab = svg('g', { class: `plabel ${state}`, transform: `translate(${lx} ${ly})`, style: `--ch:${ch.color}` });
    lab.appendChild(svg('text', { y: 0, class: 'prov-name', 'text-anchor': 'middle' }, pv.name));
    lab.appendChild(svg('text', { y: 14, class: 'prov-num', 'text-anchor': 'middle' }, `CHAPTER ${ROMAN[num]}`));
    if (!opts.compact) {
      const status = state === 'conquered' ? 'CONQUERED' : state === 'locked' ? 'LOCKED' : `${prog.cleared} / ${prog.topics} STANDARDS`;
      const bw = status.length * 6.2 + 18;
      lab.appendChild(svg('rect', { x: -bw / 2, y: 22, width: bw, height: 16, rx: 3, class: 'pbadge' }));
      lab.appendChild(svg('text', { y: 33.5, class: 'pbadge-t', 'text-anchor': 'middle' }, status));
      if (state === 'locked') lab.appendChild(svg('path', { d: `M ${-bw / 2 - 14} 30 v -4 a 3 3 0 0 1 6 0 v 4 M ${-bw / 2 - 15} 30 h 8 v 6 h -8 z`, class: 'plock' }));
      if (next === num && state === 'open') lab.appendChild(svg('path', { d: `M ${bw / 2 + 8} 34 l 4 -10 l 4 10 M ${bw / 2 + 4} 34 h 16 M ${bw / 2 + 12} 24 v -6`, class: 'plegion' }));
    }
    labels.appendChild(lab);
  }
  // cartouche (hidden on small widths by CSS), compass
  if (!opts.compact) {
    const cart = svg('g', { class: 'cartouche-g' });
    cart.appendChild(svg('rect', { x: 600, y: 18, width: 372, height: 50, class: 'cartouche', rx: 2 }));
    cart.appendChild(svg('text', { x: 786, y: 42, class: 'map-title', 'text-anchor': 'middle' }, 'IMPERIUM MARKETING'));
    cart.appendChild(svg('text', { x: 786, y: 59, class: 'map-subtitle', 'text-anchor': 'middle' }, 'TABULA PROVINCIARUM'));
    s.appendChild(cart);
    s.appendChild(svg('g', { transform: 'translate(70 70)', class: 'compass-g' }, svg('circle', { r: 26, class: 'compass' }), svg('circle', { r: 4, class: 'compass' }), svg('path', { d: 'M 0 -26 L 6 0 L 0 26 L -6 0 Z', class: 'compass' }), svg('path', { d: 'M -26 0 L 0 6 L 26 0 L 0 -6 Z', class: 'compass' }), svg('path', { d: 'M 0 -26 L 5 -4 L -5 -4 Z', class: 'compass-n' }), svg('text', { y: -32, class: 'prov-num', 'text-anchor': 'middle', style: 'font-size:11px' }, 'N')));
    s.appendChild(svg('text', { x: 16, y: H - 14, class: 'map-legend' }, 'Gold rim: open. Grey fog: locked until the previous province has a standard. Crimson and eagle: conquered. Small standards around a capital show battles won.'));
  }
  return s;
}

/**
 * Zoom the map frame toward a province, then resolve. Honours motion-off (instant).
 */
export function zoomToProvince(frameEl, num, { motion = true } = {}) {
  return new Promise(resolve => {
    const pv = PROVINCES[num]; const svgEl = frameEl.querySelector('svg.worldmap');
    if (!motion || !pv || !svgEl) { resolve(); return; }
    const ox = (pv.cx / 1000) * 100; const oy = (pv.cy / 620) * 100;
    svgEl.style.transformOrigin = `${ox}% ${oy}%`;
    svgEl.classList.add('zooming');
    frameEl.classList.add('zooming');
    setTimeout(resolve, 520);
  });
}

/** Provincial road: battles as castra, the capital as a walled city. opts: {onNode(topic, i), onBoss()} */
export function islandTrail(app, ch, opts = {}) {
  const W = 1000; const H = 440; const P = 'tr' + (++defIds) + '-';
  const pv = PROVINCES[ch.chapter] || { name: ch.title, capital: 'the capital' };
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'trail', role: 'img', 'aria-label': `Province of ${pv.name}`, style: `--ch:${ch.color}` });
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
  bg.appendChild(svg('text', { y: bl, class: 'node-label', 'text-anchor': 'middle' }, prog.boss ? `${pv.capital} taken` : `Siege of ${pv.capital}`));
  bg.appendChild(svg('text', { y: bl + 15, class: 'node-sub', 'text-anchor': 'middle' }, allCleared ? '24 questions · 90% takes the city' : 'win every battle first'));
  const goBoss = () => { if (allCleared && opts.onBoss) opts.onBoss(); else app.toast('Win every battle on the road before laying siege to the capital', 'info'); };
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
