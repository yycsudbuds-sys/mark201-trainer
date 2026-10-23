// Parchment map of the Roman world: provinces (chapters) with Locked / Unlocked / Conquered states,
// and a provincial campaign trail (topics as castra, boss as the siege of the capital).
import { svg } from './visuals.js';
import { masteryLevel, chapterMastery } from './engine.js';

export const ROMAN = { 1: 'I', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII' };
// chapter -> province (name, label position, territory blob)
export const PROVINCES = {
  1: { name: 'Italia', capital: 'Roma', cx: 432, cy: 338, rx: 52, ry: 70, seed: 3, rot: -35 },
  6: { name: 'Hispania', capital: 'Tarraco', cx: 150, cy: 395, rx: 92, ry: 62, seed: 7, rot: 0 },
  7: { name: 'Gallia', capital: 'Lugdunum', cx: 225, cy: 268, rx: 82, ry: 60, seed: 11, rot: 0 },
  8: { name: 'Britannia', capital: 'Londinium', cx: 168, cy: 138, rx: 50, ry: 66, seed: 5, rot: 0 },
  9: { name: 'Germania', capital: 'Colonia', cx: 395, cy: 190, rx: 92, ry: 62, seed: 13, rot: 0 },
  10: { name: 'Graecia', capital: 'Athenae', cx: 596, cy: 385, rx: 58, ry: 64, seed: 17, rot: 0 },
  11: { name: 'Asia', capital: 'Ephesus', cx: 820, cy: 395, rx: 100, ry: 56, seed: 19, rot: 0 },
  12: { name: 'Aegyptus', capital: 'Alexandria', cx: 735, cy: 540, rx: 92, ry: 42, seed: 23, rot: 0 },
};
export const ISLANDS = PROVINCES; // backwards-compatible alias (campaign.js reads ISLANDS[n].name)
const ORDER = [1, 6, 7, 8, 9, 10, 11, 12];

function rnd(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

export function blobPath(cx, cy, rx, ry, seed, n = 10, rot = 0) {
  const r = rnd(seed); const pts = [];
  const cr = Math.cos(rot * Math.PI / 180); const sr = Math.sin(rot * Math.PI / 180);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2; const k = 0.8 + r() * 0.4;
    const px = Math.cos(a) * rx * k; const py = Math.sin(a) * ry * k;
    pts.push([cx + px * cr - py * sr, cy + px * sr + py * cr]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]; const p1 = pts[i]; const p2 = pts[(i + 1) % n]; const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

// Simplified coastline of Europe, Anatolia and North Africa (viewBox 1000 x 620).
const EUROPE = 'M 57 324 L 100 318 L 140 322 L 177 325 L 215 332 L 262 345 L 240 372 L 211 395 L 190 420 L 150 440 L 117 457 L 90 450 L 57 439 L 48 400 L 46 360 Z '
  + 'M 262 345 L 240 310 L 205 300 L 170 275 L 131 238 L 150 222 L 185 217 L 215 205 L 242 190 L 265 178 L 288 163 L 320 150 L 348 119 L 372 95 L 390 74 L 410 92 L 416 128 L 450 128 L 490 124 L 519 122 L 548 100 L 570 83 L 600 70 L 640 60 L 700 52 L 760 48 L 820 46 L 880 44 L 940 46 L 980 50 L 980 340 L 955 360 L 912 368 L 870 372 L 830 362 L 800 352 L 775 350 L 745 358 L 707 368 L 690 380 L 656 368 L 630 380 L 616 422 L 600 440 L 587 439 L 575 410 L 565 390 L 544 368 L 520 340 L 500 310 L 470 295 L 447 286 L 421 290 L 442 322 L 455 350 L 500 370 L 527 384 L 510 400 L 485 422 L 470 400 L 455 372 L 440 360 L 425 352 L 400 330 L 380 318 L 363 308 L 340 320 L 310 335 L 285 345 Z '
  + 'M 108 92 L 125 70 L 151 55 L 177 74 L 185 110 L 200 140 L 235 160 L 240 170 L 235 188 L 205 198 L 170 205 L 140 210 L 114 206 L 112 185 L 125 172 L 112 150 L 100 125 Z '
  + 'M 40 172 L 60 150 L 84 125 L 108 114 L 110 140 L 108 172 L 90 190 L 60 192 L 42 185 Z '
  + 'M 40 564 L 70 520 L 108 466 L 150 455 L 200 448 L 262 443 L 320 438 L 390 439 L 430 455 L 470 475 L 520 500 L 553 528 L 600 532 L 650 538 L 700 540 L 741 546 L 780 540 L 810 528 L 820 500 L 826 457 L 850 450 L 900 450 L 940 445 L 980 440 L 980 620 L 40 620 Z '
  + 'M 462 433 L 490 428 L 512 440 L 498 460 L 470 462 L 455 448 Z M 352 398 L 372 390 L 382 420 L 368 445 L 348 440 L 340 415 Z M 350 350 L 365 342 L 372 368 L 362 385 L 346 378 Z M 610 470 L 660 462 L 690 470 L 660 482 L 615 482 Z M 835 420 L 870 414 L 885 428 L 860 438 L 836 432 Z';

function parchDefs() {
  return svg('defs', {},
    svg('linearGradient', { id: 'parchGrad', x1: 0, y1: 0, x2: 1, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#E9D7AE' }), svg('stop', { offset: 0.5, 'stop-color': '#DEC894' }), svg('stop', { offset: 1, 'stop-color': '#CDB47C' })),
    svg('linearGradient', { id: 'seaParch', x1: 0, y1: 0, x2: 0, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#D4BE8E' }), svg('stop', { offset: 1, 'stop-color': '#C4AA74' })),
    svg('filter', { id: 'grain', x: 0, y: 0, width: '100%', height: '100%' }, svg('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.8', numOctaves: '3', stitchTiles: 'stitch' }), svg('feColorMatrix', { values: '0 0 0 0 0.25 0 0 0 0 0.18 0 0 0 0 0.08 0 0 0 0.25 0' })),
    svg('pattern', { id: 'crimsonHatch', width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, svg('rect', { width: 8, height: 8, fill: '#8B1E1E', 'fill-opacity': 0.55 }), svg('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: '#5A1313', 'stroke-width': 3 })),
    svg('pattern', { id: 'seaLines', width: 48, height: 14, patternUnits: 'userSpaceOnUse' }, svg('path', { d: 'M 0 7 q 12 -5 24 0 t 24 0', class: 'sea-line' })),
  );
}

export function chapterProgress(app, ch) {
  const topics = ch.topics.length;
  const cleared = ch.topics.filter(t => app.state.campaign.topics[t.id]?.cleared).length;
  const boss = !!app.state.campaign.bosses?.[ch.chapter]?.cleared;
  const m = chapterMastery(app.content, app.state, ch.chapter);
  return { topics, cleared, boss, frac: boss ? 1 : (cleared / topics) * 0.85 + m.score * 0.15, mastery: m };
}

/** Province state: 'conquered' | 'open' | 'locked'. A province opens once the previous one has a standard planted (or it is the first), or if the player forced a march. */
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

/** World map SVG. opts: {onIsland(ch, state), compact} */
export function worldMap(app, opts = {}) {
  const W = 1000; const H = 620;
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'worldmap' + (opts.compact ? ' compact' : ''), role: 'img', 'aria-label': 'Map of the provinces' });
  s.appendChild(parchDefs());
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'sea' }));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#seaLines)', opacity: 0.6 }));
  s.appendChild(svg('path', { d: EUROPE, class: 'coast-glow' }));
  s.appendChild(svg('path', { d: EUROPE, class: 'coast' }));
  ['M 270 350 l 8 -12 l 8 12 M 290 352 l 8 -12 l 8 12 M 310 348 l 8 -12 l 8 12', 'M 410 300 l 7 -11 l 7 11 M 428 304 l 7 -11 l 7 11', 'M 180 335 l 7 -11 l 7 11 M 198 337 l 7 -11 l 7 11 M 216 334 l 7 -11 l 7 11', 'M 300 120 l 7 -11 l 7 11 M 318 124 l 7 -11 l 7 11'].forEach(d => s.appendChild(svg('path', { d, class: 'relief' })));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'parch-grain', filter: 'url(#grain)' }));
  s.appendChild(svg('text', { x: 500, y: 470, class: 'sea-label', 'text-anchor': 'middle' }, 'MARE NOSTRUM'));
  s.appendChild(svg('text', { x: 60, y: 540, class: 'sea-label', 'text-anchor': 'start' }, 'OCEANUS'));
  for (let i = 0; i < ORDER.length - 1; i++) {
    const a = PROVINCES[ORDER[i]]; const b = PROVINCES[ORDER[i + 1]];
    const mx = (a.cx + b.cx) / 2; const my = (a.cy + b.cy) / 2 - 30;
    const chA = app.index.chapter.get(ORDER[i]);
    const done = chA && chapterProgress(app, chA).boss;
    s.appendChild(svg('path', { d: `M ${a.cx} ${a.cy} Q ${mx} ${my} ${b.cx} ${b.cy}`, class: 'route' + (done ? ' done' : ''), fill: 'none' }));
  }
  const next = nextIsland(app);
  for (const num of ORDER) {
    const ch = app.index.chapter.get(num); if (!ch) continue;
    const pv = PROVINCES[num]; const prog = chapterProgress(app, ch); const state = provinceState(app, ch);
    const path = blobPath(pv.cx, pv.cy, pv.rx, pv.ry, pv.seed, 10, pv.rot);
    const clipId = `pclip-${num}`;
    s.querySelector('defs').appendChild(svg('clipPath', { id: clipId }, svg('path', { d: path })));
    const g = svg('g', { class: `province ${state}` + (next === num ? ' next' : ''), tabindex: '0', role: 'button', 'aria-label': `Chapter ${ROMAN[num]}: ${pv.name} (${ch.title}), ${state}, ${Math.round(prog.frac * 100)}% conquered`, style: `--ch:${ch.color}` });
    g.appendChild(svg('path', { d: path, class: 'terr' }));
    if (state !== 'conquered') {
      const fillH = (pv.ry * 2 + 10) * prog.frac;
      g.appendChild(svg('rect', { x: pv.cx - pv.rx - 10, y: pv.cy + pv.ry + 5 - fillH, width: pv.rx * 2 + 20, height: fillH, 'clip-path': `url(#${clipId})`, class: 'conq' }));
    }
    ch.topics.forEach((t, i) => {
      const spread = Math.min(pv.rx * 1.2, 20 * (ch.topics.length - 1));
      const fx = pv.cx - spread / 2 + (ch.topics.length > 1 ? (i / (ch.topics.length - 1)) * spread : 0); const fy = pv.cy - pv.ry * 0.62;
      const cleared = !!app.state.campaign.topics[t.id]?.cleared;
      g.appendChild(svg('g', { class: 'flag' + (cleared ? ' up' : ''), transform: `translate(${fx} ${fy})` }, svg('line', { x1: 0, y1: 0, x2: 0, y2: -14, class: 'pole' }), svg('path', { d: 'M 0 -14 L 10 -11 L 0 -7 Z', class: 'cloth' })));
    });
    g.appendChild(svg('text', { x: pv.cx, y: pv.cy - 10, class: 'prov-num', 'text-anchor': 'middle' }, `Chapter ${ROMAN[num]}`));
    g.appendChild(svg('text', { x: pv.cx, y: pv.cy + 12, class: 'prov-name', 'text-anchor': 'middle' }, pv.name));
    if (!opts.compact) g.appendChild(svg('text', { x: pv.cx, y: pv.cy + 28, class: 'prov-sub', 'text-anchor': 'middle' }, state === 'conquered' ? 'CONQUERED' : state === 'locked' ? 'LOCKED' : `${prog.cleared}/${prog.topics} STANDARDS`));
    if (state === 'conquered') g.appendChild(svg('text', { x: pv.cx + pv.rx * 0.6, y: pv.cy - pv.ry * 0.3, class: 'prov-icon', 'text-anchor': 'middle' }, '🦅'));
    if (state === 'locked') g.appendChild(svg('text', { x: pv.cx + pv.rx * 0.6, y: pv.cy - pv.ry * 0.3, class: 'lock-ico', 'text-anchor': 'middle' }, '🔒'));
    if (next === num && state === 'open') g.appendChild(svg('text', { x: pv.cx - pv.rx * 0.6, y: pv.cy + pv.ry * 0.5, class: 'legion-marker', 'text-anchor': 'middle' }, '⚔️'));
    const go = () => opts.onIsland ? opts.onIsland(ch, state) : app.navigate(`#/campaign/${num}`);
    g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    s.appendChild(g);
  }
  if (!opts.compact) {
    s.appendChild(svg('rect', { x: 560, y: 24, width: 400, height: 54, class: 'cartouche', rx: 2 }));
    s.appendChild(svg('text', { x: 760, y: 50, class: 'map-title', 'text-anchor': 'middle' }, 'IMPERIUM MARKETING'));
    s.appendChild(svg('text', { x: 760, y: 68, class: 'map-subtitle', 'text-anchor': 'middle' }, 'Tabula provinciarum · conquer every province'));
    s.appendChild(svg('g', { transform: 'translate(70 70)' }, svg('circle', { r: 26, class: 'compass' }), svg('circle', { r: 4, class: 'compass' }), svg('path', { d: 'M 0 -26 L 6 0 L 0 26 L -6 0 Z', class: 'compass' }), svg('path', { d: 'M -26 0 L 0 6 L 26 0 L 0 -6 Z', class: 'compass' }), svg('path', { d: 'M 0 -26 L 5 -4 L -5 -4 Z', class: 'compass-n' }), svg('text', { y: -32, class: 'prov-num', 'text-anchor': 'middle', style: 'font-size:11px' }, 'N')));
    s.appendChild(svg('text', { x: 16, y: H - 14, class: 'map-legend' }, 'Gold border: open to attack. Dashed grey: locked until the previous province has a standard planted. Crimson hatch and eagle: conquered.'));
  }
  return s;
}

/** Provincial trail: topics as castra along a road, boss = siege of the capital. opts: {onNode(topic, i), onBoss()} */
export function islandTrail(app, ch, opts = {}) {
  const W = 1000; const H = 420;
  const pv = PROVINCES[ch.chapter] || { seed: ch.chapter, name: ch.title, capital: 'the capital' };
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'trail', role: 'img', 'aria-label': `Province of ${pv.name}`, style: `--ch:${ch.color}` });
  s.appendChild(parchDefs());
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'sea' }));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#seaLines)', opacity: 0.6 }));
  const land = blobPath(W / 2, H / 2 + 10, W * 0.47, H * 0.44, pv.seed + 1, 12);
  const prog = chapterProgress(app, ch);
  s.querySelector('defs').appendChild(svg('clipPath', { id: `tclip-${ch.chapter}` }, svg('path', { d: land })));
  s.appendChild(svg('path', { d: land, class: 'coast-glow' }));
  s.appendChild(svg('path', { d: land, class: 'coast' }));
  const fillH = H * prog.frac;
  s.appendChild(svg('rect', { x: 0, y: H - fillH, width: W, height: fillH, 'clip-path': `url(#tclip-${ch.chapter})`, fill: ch.color, 'fill-opacity': 0.22 }));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'parch-grain', filter: 'url(#grain)' }));
  const n = ch.topics.length + 1;
  const pts = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1); pts.push([150 + t * (W - 300), H / 2 + 10 + Math.sin(t * Math.PI * 2.2 + 0.4) * 45]); }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < n; i++) { const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; d += ` C ${(x0 + x1) / 2} ${y0}, ${(x0 + x1) / 2} ${y1}, ${x1} ${y1}`; }
  s.appendChild(svg('path', { d, class: 'road-edge' }));
  s.appendChild(svg('path', { d, class: 'road' }));
  s.appendChild(svg('text', { x: W / 2, y: 34, class: 'prov-num', 'text-anchor': 'middle', style: 'font-size:12px' }, `Chapter ${ROMAN[ch.chapter] || ch.chapter}`));
  s.appendChild(svg('text', { x: W / 2, y: 60, class: 'prov-name', 'text-anchor': 'middle', style: 'font-size:24px' }, `Provincia ${pv.name}`));
  const clearedCount = prog.cleared;
  ch.topics.forEach((t, i) => {
    const [x, y] = pts[i];
    const cleared = !!app.state.campaign.topics[t.id]?.cleared;
    const solid = t.concepts.filter(cid => masteryLevel(app.state.concepts[cid]) >= 3).length;
    const read = t.concepts.filter(cid => app.state.concepts[cid]?.seen).length;
    const isNext = !cleared && i === ch.topics.findIndex(tt => !app.state.campaign.topics[tt.id]?.cleared);
    const g = svg('g', { class: 'node' + (cleared ? ' cleared' : '') + (isNext ? ' next' : ''), transform: `translate(${x} ${y})`, tabindex: '0', role: 'button', 'aria-label': `Battle ${i + 1}: ${t.title}` });
    g.appendChild(svg('circle', { r: 30, class: 'halo', 'fill-opacity': isNext ? 0.2 : 0 }));
    g.appendChild(svg('rect', { x: -20, y: -20, width: 40, height: 40, rx: 4, class: 'disc' }));
    [[-20, -20], [20, -20], [-20, 20], [20, 20]].forEach(([tx, ty]) => g.appendChild(svg('rect', { x: tx - 5, y: ty - 5, width: 10, height: 10, class: 'camp-tower' })));
    g.appendChild(svg('text', { y: 1, class: 'node-n', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, cleared ? '✓' : ROMAN_SMALL(i + 1)));
    const frac = solid / t.concepts.length; const r = 31; const c = 2 * Math.PI * r;
    g.appendChild(svg('circle', { r, class: 'arc', fill: 'none', 'stroke-width': 4, 'stroke-dasharray': `${c * frac} ${c}`, transform: 'rotate(-90)' }));
    const labelY = i % 2 === 0 ? 56 : -42;
    g.appendChild(svg('text', { y: labelY, class: 'node-label', 'text-anchor': 'middle' }, shortTitle(t.title)));
    g.appendChild(svg('text', { y: labelY + 15, class: 'node-sub', 'text-anchor': 'middle' }, `${read}/${t.concepts.length} scouted · ${solid}/${t.concepts.length} held`));
    const go = () => opts.onNode && opts.onNode(t, i);
    g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    s.appendChild(g);
  });
  const [bx, by] = pts[n - 1];
  const allCleared = clearedCount === ch.topics.length;
  const bg = svg('g', { class: 'node boss' + (prog.boss ? ' cleared' : '') + (allCleared ? ' next' : ' locked'), transform: `translate(${bx} ${by})`, tabindex: '0', role: 'button', 'aria-label': 'Siege of the capital' });
  bg.appendChild(svg('circle', { r: 42, class: 'halo', 'fill-opacity': allCleared && !prog.boss ? 0.2 : 0 }));
  bg.appendChild(svg('circle', { r: 32, class: 'disc' }));
  bg.appendChild(svg('text', { y: 2, class: 'node-n big', 'text-anchor': 'middle', 'dominant-baseline': 'middle', style: 'font-size:24px' }, prog.boss ? '🦅' : allCleared ? '🏛️' : '🔒'));
  const bl = (n - 1) % 2 === 0 ? 62 : -48;
  bg.appendChild(svg('text', { y: bl, class: 'node-label', 'text-anchor': 'middle' }, prog.boss ? `${pv.capital} taken` : `Siege of ${pv.capital}`));
  bg.appendChild(svg('text', { y: bl + 15, class: 'node-sub', 'text-anchor': 'middle' }, allCleared ? '24 questions · 90% to take the city' : 'win every battle first'));
  const goBoss = () => { if (allCleared && opts.onBoss) opts.onBoss(); else app.toast('Win every battle on the road before laying siege to the capital', 'info'); };
  bg.addEventListener('click', goBoss); bg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goBoss(); } });
  s.appendChild(bg);
  return s;
}

function ROMAN_SMALL(n) { return ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][n] || String(n); }
function shortTitle(s) { let t = s.split(':')[0].trim(); if (t.length > 26) t = t.slice(0, 24).replace(/[ ,;]+$/, '') + '…'; return t; }
