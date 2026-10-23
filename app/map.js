// The Marketing Archipelago: a world map of eight islands (chapters) and per-island topic trails.
import { h } from './ui.js';
import { svg } from './visuals.js';
import { masteryLevel, chapterMastery } from './engine.js';

export const ISLANDS = {
  1: { name: 'Isle of Exchange', cx: 150, cy: 150, rx: 105, ry: 78, seed: 3 },
  6: { name: 'Segment Shoals', cx: 380, cy: 110, rx: 112, ry: 72, seed: 7 },
  7: { name: 'Brand Island', cx: 620, cy: 140, rx: 118, ry: 82, seed: 11 },
  8: { name: 'Launch Atoll', cx: 850, cy: 120, rx: 108, ry: 80, seed: 5 },
  9: { name: 'Price Point', cx: 820, cy: 360, rx: 120, ry: 84, seed: 13 },
  10: { name: 'Channel Straits', cx: 590, cy: 400, rx: 125, ry: 86, seed: 17 },
  11: { name: 'Retail Reef', cx: 350, cy: 380, rx: 118, ry: 82, seed: 19 },
  12: { name: 'Signal Cape', cx: 130, cy: 400, rx: 108, ry: 80, seed: 23 },
};
const ORDER = [1, 6, 7, 8, 9, 10, 11, 12];

function rnd(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

/** Smooth blob path around (cx, cy). Deterministic per seed. */
export function blobPath(cx, cy, rx, ry, seed, n = 10) {
  const r = rnd(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 0.78 + r() * 0.44;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  // Catmull-Rom to cubic bezier
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]; const p1 = pts[i]; const p2 = pts[(i + 1) % n]; const p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

export function chapterProgress(app, ch) {
  const topics = ch.topics.length;
  const cleared = ch.topics.filter(t => app.state.campaign.topics[t.id]?.cleared).length;
  const boss = !!app.state.campaign.bosses?.[ch.chapter]?.cleared;
  const m = chapterMastery(app.content, app.state, ch.chapter);
  return { topics, cleared, boss, frac: boss ? 1 : (cleared / topics) * 0.85 + m.score * 0.15, mastery: m };
}

/** World map SVG. opts: {onIsland(ch), compact} */
export function worldMap(app, opts = {}) {
  const W = 1000; const H = 520;
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'worldmap' + (opts.compact ? ' compact' : ''), role: 'img', 'aria-label': 'Campaign map' });
  const defs = svg('defs');
  s.appendChild(defs);
  // sea texture
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'sea' }));
  for (let i = 0; i < 14; i++) { const r = rnd(100 + i); s.appendChild(svg('path', { d: `M ${r() * W} ${r() * H} q 14 -6 28 0 t 28 0`, class: 'wave', style: `animation-delay:${i * 0.4}s` })); }
  // routes between islands in course order
  for (let i = 0; i < ORDER.length - 1; i++) {
    const a = ISLANDS[ORDER[i]]; const b = ISLANDS[ORDER[i + 1]];
    const mx = (a.cx + b.cx) / 2; const my = (a.cy + b.cy) / 2 - 40;
    const chA = app.index.chapter.get(ORDER[i]);
    const done = chA && chapterProgress(app, chA).boss;
    s.appendChild(svg('path', { d: `M ${a.cx} ${a.cy} Q ${mx} ${my} ${b.cx} ${b.cy}`, class: 'route' + (done ? ' done' : '') }));
  }
  const next = nextIsland(app);
  for (const num of ORDER) {
    const ch = app.index.chapter.get(num); if (!ch) continue;
    const isl = ISLANDS[num]; const prog = chapterProgress(app, ch);
    const clipId = `clip-${num}`;
    const path = blobPath(isl.cx, isl.cy, isl.rx, isl.ry, isl.seed);
    defs.appendChild(svg('clipPath', { id: clipId }, svg('path', { d: path })));
    const g = svg('g', { class: 'island' + (prog.boss ? ' conquered' : '') + (next === num ? ' next' : ''), tabindex: '0', role: 'button', 'aria-label': `${isl.name}: Chapter ${num} ${ch.title}, ${Math.round(prog.frac * 100)}% conquered`, style: `--ch:${ch.color}` });
    g.appendChild(svg('path', { d: path, class: 'land' }));
    // conquest fill: rises from the bottom of the island
    const fillH = (isl.ry * 2 + 10) * prog.frac;
    g.appendChild(svg('rect', { x: isl.cx - isl.rx - 10, y: isl.cy + isl.ry + 5 - fillH, width: isl.rx * 2 + 20, height: fillH, 'clip-path': `url(#${clipId})`, class: 'conquest' }));
    g.appendChild(svg('path', { d: path, class: 'shore' }));
    // topic flags
    ch.topics.forEach((t, i) => {
      const spread = Math.min(isl.rx * 1.1, 24 * (ch.topics.length - 1));
      const fx = isl.cx - spread / 2 + (ch.topics.length > 1 ? (i / (ch.topics.length - 1)) * spread : 0); const fy = isl.cy - isl.ry * 0.55;
      const cleared = !!app.state.campaign.topics[t.id]?.cleared;
      g.appendChild(svg('g', { class: 'flag' + (cleared ? ' up' : ''), transform: `translate(${fx} ${fy})` }, svg('line', { x1: 0, y1: 0, x2: 0, y2: -16, class: 'pole' }), svg('path', { d: 'M 0 -16 L 12 -12 L 0 -8 Z', class: 'cloth' })));
    });
    g.appendChild(svg('text', { x: isl.cx, y: isl.cy - 8, class: 'isl-emoji', 'text-anchor': 'middle' }, prog.boss ? '👑' : ch.emoji));
    g.appendChild(svg('text', { x: isl.cx, y: isl.cy + 22, class: 'isl-name', 'text-anchor': 'middle' }, isl.name));
    g.appendChild(svg('text', { x: isl.cx, y: isl.cy + 40, class: 'isl-sub', 'text-anchor': 'middle' }, `Ch ${num} · ${prog.cleared}/${prog.topics}${prog.boss ? ' · boss beaten' : ''}`));
    if (next === num && !prog.boss) g.appendChild(svg('text', { x: isl.cx + isl.rx * 0.55, y: isl.cy + isl.ry * 0.55, class: 'boat', 'text-anchor': 'middle' }, '⛵'));
    const go = () => opts.onIsland ? opts.onIsland(ch) : app.navigate(`#/campaign/${num}`);
    g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    s.appendChild(g);
  }
  s.appendChild(svg('text', { x: 16, y: H - 14, class: 'map-legend' }, 'Islands fill as you clear their checkpoints. Beat the boss to plant the crown.'));
  return s;
}

function shortTitle(s) {
  let t = s.split(':')[0].trim();
  if (t.length > 26) t = t.slice(0, 24).replace(/[ ,;]+$/, '') + '…';
  return t;
}

export function nextIsland(app) {
  for (const num of ORDER) { const ch = app.index.chapter.get(num); if (ch && !chapterProgress(app, ch).boss) return num; }
  return null;
}

/** Island trail: topic nodes along a winding path, boss at the end. opts: {onNode(topic), onBoss()} */
export function islandTrail(app, ch, opts = {}) {
  const W = 1000; const H = 420;
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'trail', role: 'img', 'aria-label': `Chapter ${ch.chapter} trail`, style: `--ch:${ch.color}` });
  const isl = ISLANDS[ch.chapter] || { seed: ch.chapter };
  const land = blobPath(W / 2, H / 2 + 10, W * 0.46, H * 0.42, isl.seed + 1, 12);
  const prog = chapterProgress(app, ch);
  const defs = svg('defs', {}, svg('clipPath', { id: `tclip-${ch.chapter}` }, svg('path', { d: land })));
  s.appendChild(defs);
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'sea' }));
  s.appendChild(svg('path', { d: land, class: 'land' }));
  const fillH = H * prog.frac;
  s.appendChild(svg('rect', { x: 0, y: H - fillH, width: W, height: fillH, 'clip-path': `url(#tclip-${ch.chapter})`, class: 'conquest' }));
  s.appendChild(svg('path', { d: land, class: 'shore' }));
  const n = ch.topics.length + 1;
  const pts = [];
  for (let i = 0; i < n; i++) { const t = i / (n - 1); pts.push([150 + t * (W - 300), H / 2 + 10 + Math.sin(t * Math.PI * 2.2 + 0.4) * 45]); }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < n; i++) { const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i]; d += ` C ${(x0 + x1) / 2} ${y0}, ${(x0 + x1) / 2} ${y1}, ${x1} ${y1}`; }
  s.appendChild(svg('path', { d, class: 'trail-path' }));
  const clearedCount = prog.cleared;
  ch.topics.forEach((t, i) => {
    const [x, y] = pts[i];
    const cleared = !!app.state.campaign.topics[t.id]?.cleared;
    const solid = t.concepts.filter(cid => masteryLevel(app.state.concepts[cid]) >= 3).length;
    const read = t.concepts.filter(cid => app.state.concepts[cid]?.seen).length;
    const available = true;
    const isNext = !cleared && i === ch.topics.findIndex(tt => !app.state.campaign.topics[tt.id]?.cleared);
    const g = svg('g', { class: 'node' + (cleared ? ' cleared' : '') + (isNext ? ' next' : '') + (available ? '' : ' locked'), transform: `translate(${x} ${y})`, tabindex: '0', role: 'button', 'aria-label': `Level ${i + 1}: ${t.title}` });
    g.appendChild(svg('circle', { r: 30, class: 'halo' }));
    g.appendChild(svg('circle', { r: 22, class: 'disc' }));
    g.appendChild(svg('text', { y: 1, class: 'node-n', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, cleared ? '✓' : String(i + 1)));
    // mini progress arc for solid concepts
    const frac = solid / t.concepts.length; const r = 26; const c = 2 * Math.PI * r;
    g.appendChild(svg('circle', { r, class: 'arc', 'stroke-dasharray': `${c * frac} ${c}`, transform: 'rotate(-90)' }));
    const labelY = i % 2 === 0 ? 54 : -40;
    g.appendChild(svg('text', { y: labelY, class: 'node-label', 'text-anchor': 'middle' }, shortTitle(t.title)));
    g.appendChild(svg('text', { y: labelY + 16, class: 'node-sub', 'text-anchor': 'middle' }, `${read}/${t.concepts.length} read · ${solid}/${t.concepts.length} solid`));
    const go = () => opts.onNode && opts.onNode(t, i);
    g.addEventListener('click', go); g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    s.appendChild(g);
  });
  // boss
  const [bx, by] = pts[n - 1];
  const allCleared = clearedCount === ch.topics.length;
  const bg = svg('g', { class: 'node boss' + (prog.boss ? ' cleared' : '') + (allCleared ? ' next' : ' locked'), transform: `translate(${bx} ${by})`, tabindex: '0', role: 'button', 'aria-label': 'Boss fight' });
  bg.appendChild(svg('circle', { r: 40, class: 'halo' }));
  bg.appendChild(svg('circle', { r: 30, class: 'disc' }));
  bg.appendChild(svg('text', { y: 2, class: 'node-n big', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, prog.boss ? '👑' : allCleared ? '⚔️' : '🔒'));
  const bl = (n - 1) % 2 === 0 ? 62 : -48;
  bg.appendChild(svg('text', { y: bl, class: 'node-label', 'text-anchor': 'middle' }, prog.boss ? 'Boss beaten' : 'Boss fight'));
  bg.appendChild(svg('text', { y: bl + 16, class: 'node-sub', 'text-anchor': 'middle' }, allCleared ? '24 questions · 90% to clear' : 'clear every level first'));
  const goBoss = () => { if (allCleared && opts.onBoss) opts.onBoss(); else app.toast('Clear every level on the trail first', 'info'); };
  bg.addEventListener('click', goBoss); bg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goBoss(); } });
  s.appendChild(bg);
  return s;
}
