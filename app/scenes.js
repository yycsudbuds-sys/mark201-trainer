// Procedural scene library (stylized realism, pure SVG). Each scene has a static layer (blurred by CSS)
// and an ambient layer (mist, motes, flames, speed streaks) that animates without re-rasterizing the blur.
import { h } from './ui.js';
import { svg } from './visuals.js';

const W = 1600; const H = 900;
let uid = 0;
function rnd(seed) { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }
function lin(defs, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  const id = 'g' + (++uid);
  defs.appendChild(svg('linearGradient', { id, x1, y1, x2, y2 }, stops.map(([o, c, a]) => svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }))));
  return `url(#${id})`;
}
function rad(defs, stops, cx = 0.5, cy = 0.5, r = 0.5) {
  const id = 'g' + (++uid);
  defs.appendChild(svg('radialGradient', { id, cx, cy, r }, stops.map(([o, c, a]) => svg('stop', { offset: o, 'stop-color': c, 'stop-opacity': a ?? 1 }))));
  return `url(#${id})`;
}
function layer() { const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' }); const d = svg('defs'); s.appendChild(d); return [s, d]; }
function sky(s, d, stops) { s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: lin(d, stops) })); }
function sun(s, d, x, y, r, c, glow = 3) { s.appendChild(svg('circle', { cx: x, cy: y, r: r * glow, fill: rad(d, [[0, c, 0.55], [0.4, c, 0.18], [1, c, 0]]) })); s.appendChild(svg('circle', { cx: x, cy: y, r, fill: c })); }
/** Ridge: a filled silhouette from a noisy horizon line down to the bottom. */
function ridge(s, y, amp, fill, seed, freq = 1, detail = 0.3) {
  const r = rnd(seed); const pts = [];
  const o1 = r() * 10; const o2 = r() * 10; const o3 = r() * 10;
  for (let x = -60; x <= W + 60; x += 20) {
    const t = x / W;
    const yy = y + Math.sin(t * Math.PI * 2 * freq + o1) * amp + Math.sin(t * Math.PI * 7 + o2) * amp * detail + Math.sin(t * Math.PI * 19 + o3) * amp * detail * 0.35;
    pts.push(`${x} ${yy.toFixed(1)}`);
  }
  s.appendChild(svg('path', { d: `M -60 ${H + 10} L ${pts.join(' L ')} L ${W + 60} ${H + 10} Z`, fill }));
}
function pine(s, x, base, hgt, c) { const w = hgt * 0.42; s.appendChild(svg('path', { d: `M ${x} ${base - hgt} L ${x + w * 0.55} ${base - hgt * 0.55} L ${x + w * 0.25} ${base - hgt * 0.55} L ${x + w} ${base - hgt * 0.2} L ${x + w * 0.45} ${base - hgt * 0.2} L ${x + w * 1.1} ${base} L ${x - w * 1.1} ${base} L ${x - w * 0.45} ${base - hgt * 0.2} L ${x - w} ${base - hgt * 0.2} L ${x - w * 0.25} ${base - hgt * 0.55} L ${x - w * 0.55} ${base - hgt * 0.55} Z`, fill: c })); }
function pines(s, base, count, c, hMin, hMax, seed, x0 = -40, x1 = W + 40) { const r = rnd(seed); for (let i = 0; i < count; i++) { const x = x0 + (x1 - x0) * (i / count) + r() * 30; pine(s, x, base + r() * 20 - 10, hMin + r() * (hMax - hMin), c); } }
function cypress(s, x, base, hgt, c) { s.appendChild(svg('path', { d: `M ${x} ${base - hgt} C ${x + hgt * 0.14} ${base - hgt * 0.7}, ${x + hgt * 0.14} ${base - hgt * 0.25}, ${x + hgt * 0.06} ${base} L ${x - hgt * 0.06} ${base} C ${x - hgt * 0.14} ${base - hgt * 0.25}, ${x - hgt * 0.14} ${base - hgt * 0.7}, ${x} ${base - hgt} Z`, fill: c })); }
function roundTree(s, x, base, r, c, trunk = '#3B2A17') { s.appendChild(svg('rect', { x: x - r * 0.12, y: base - r * 1.3, width: r * 0.24, height: r * 1.3, fill: trunk })); s.appendChild(svg('ellipse', { cx: x, cy: base - r * 1.5, rx: r * 1.15, ry: r * 0.8, fill: c })); s.appendChild(svg('ellipse', { cx: x - r * 0.5, cy: base - r * 1.2, rx: r * 0.7, ry: r * 0.5, fill: c })); s.appendChild(svg('ellipse', { cx: x + r * 0.6, cy: base - r * 1.25, rx: r * 0.75, ry: r * 0.5, fill: c })); }
function palm(s, x, base, hgt, c) { s.appendChild(svg('path', { d: `M ${x} ${base} q ${hgt * 0.08} ${-hgt * 0.5} ${hgt * 0.12} ${-hgt}`, stroke: '#3B2A17', 'stroke-width': hgt * 0.05, fill: 'none' })); const tx = x + hgt * 0.12; const ty = base - hgt; for (let a = 0; a < 7; a++) { const ang = -Math.PI + a * (Math.PI / 6); s.appendChild(svg('path', { d: `M ${tx} ${ty} q ${Math.cos(ang) * hgt * 0.35} ${Math.sin(ang) * hgt * 0.25 - hgt * 0.1} ${Math.cos(ang) * hgt * 0.55} ${Math.sin(ang) * hgt * 0.3 + hgt * 0.1}`, stroke: c, 'stroke-width': hgt * 0.045, fill: 'none', 'stroke-linecap': 'round' })); } }
function temple(s, x, base, w, hgt, c, cols = 6, light = null) {
  s.appendChild(svg('rect', { x: x - w / 2 - w * 0.06, y: base - hgt * 0.08, width: w * 1.12, height: hgt * 0.08, fill: c }));
  s.appendChild(svg('rect', { x: x - w / 2 - w * 0.03, y: base - hgt * 0.14, width: w * 1.06, height: hgt * 0.06, fill: c }));
  for (let i = 0; i < cols; i++) { const cx = x - w / 2 + (w / (cols - 1)) * i; s.appendChild(svg('rect', { x: cx - w * 0.035, y: base - hgt * 0.78, width: w * 0.07, height: hgt * 0.64, fill: light || c })); s.appendChild(svg('rect', { x: cx - w * 0.05, y: base - hgt * 0.8, width: w * 0.1, height: hgt * 0.04, fill: c })); }
  s.appendChild(svg('rect', { x: x - w / 2 - w * 0.04, y: base - hgt * 0.88, width: w * 1.08, height: hgt * 0.1, fill: c }));
  s.appendChild(svg('path', { d: `M ${x - w / 2 - w * 0.06} ${base - hgt * 0.88} L ${x} ${base - hgt * 1.02} L ${x + w / 2 + w * 0.06} ${base - hgt * 0.88} Z`, fill: c }));
}
function aqueduct(s, x0, x1, y, hgt, n, c) { const span = (x1 - x0) / n; s.appendChild(svg('rect', { x: x0, y: y - hgt, width: x1 - x0, height: hgt * 0.22, fill: c })); for (let i = 0; i < n; i++) { const ax = x0 + span * i; s.appendChild(svg('path', { d: `M ${ax} ${y} L ${ax} ${y - hgt * 0.78} L ${ax + span * 0.12} ${y - hgt * 0.78} L ${ax + span * 0.12} ${y - hgt * 0.45} A ${span * 0.38} ${span * 0.38} 0 0 1 ${ax + span * 0.88} ${y - hgt * 0.45} L ${ax + span * 0.88} ${y - hgt * 0.78} L ${ax + span} ${y - hgt * 0.78} L ${ax + span} ${y} Z`, fill: c })); } }
function tower(s, x, base, w, hgt, c) { s.appendChild(svg('rect', { x: x - w / 2, y: base - hgt, width: w, height: hgt, fill: c })); for (let i = 0; i < 4; i++) s.appendChild(svg('rect', { x: x - w / 2 + (w / 4) * i + w * 0.03, y: base - hgt - w * 0.18, width: w * 0.16, height: w * 0.18, fill: c })); }
function ground(s, d, y, c1, c2) { s.appendChild(svg('rect', { x: 0, y, width: W, height: H - y, fill: lin(d, [[0, c1], [1, c2]]) })); }
// ambient helpers
function mist(a, d, y, hgt, c, opacity, dur, rev = false) { const g = svg('g', { class: 'amb-mist', style: `animation-duration:${dur}s;${rev ? 'animation-direction:alternate-reverse;' : ''}` }); g.appendChild(svg('ellipse', { cx: W * 0.3, cy: y, rx: W * 0.55, ry: hgt, fill: rad(d, [[0, c, opacity], [1, c, 0]]) })); g.appendChild(svg('ellipse', { cx: W * 0.85, cy: y + hgt * 0.4, rx: W * 0.5, ry: hgt * 0.8, fill: rad(d, [[0, c, opacity * 0.8], [1, c, 0]]) })); a.appendChild(g); }
function motes(a, n, c, seed, area = [0, 0, W, H]) { const r = rnd(seed); for (let i = 0; i < n; i++) a.appendChild(svg('circle', { cx: area[0] + r() * area[2], cy: area[1] + r() * area[3], r: 1.5 + r() * 2.5, fill: c, class: 'amb-mote', style: `animation-duration:${6 + r() * 8}s;animation-delay:${-r() * 10}s;opacity:${0.3 + r() * 0.5}` })); }
function flame(a, d, x, y, size) { a.appendChild(svg('circle', { cx: x, cy: y - size * 0.4, r: size * 3.2, fill: rad(d, [[0, '#FFB347', 0.5], [0.5, '#E2581E', 0.14], [1, '#E2581E', 0]]), class: 'amb-glow' })); a.appendChild(svg('path', { d: `M ${x} ${y - size * 1.6} C ${x + size * 0.6} ${y - size * 1.1}, ${x + size * 0.5} ${y - size * 0.2}, ${x} ${y} C ${x - size * 0.5} ${y - size * 0.2}, ${x - size * 0.6} ${y - size * 1.1}, ${x} ${y - size * 1.6} Z`, fill: '#FFD27A', class: 'amb-flame', style: `transform-origin:${x}px ${y}px` })); }
function smoke(a, d, x, y, sz) { for (let i = 0; i < 4; i++) a.appendChild(svg('ellipse', { cx: x + (i - 1.5) * sz * 0.3, cy: y, rx: sz * 0.7, ry: sz * 0.5, fill: rad(d, [[0, '#B4A58A', 0.35], [1, '#B4A58A', 0]]), class: 'amb-smoke', style: `animation-duration:${5 + i * 1.3}s;animation-delay:${-i * 1.7}s` })); }
function stars(s, n, seed, maxY = H * 0.5) { const r = rnd(seed); for (let i = 0; i < n; i++) s.appendChild(svg('circle', { cx: r() * W, cy: r() * maxY, r: 0.6 + r() * 1.4, fill: '#FFF6DC', opacity: 0.3 + r() * 0.6 })); }

const SCENES = {
  italia(s, d, a) {
    sky(s, d, [[0, '#2B3A66'], [0.45, '#C98B5E'], [0.75, '#F2C27E'], [1, '#F8E1B0']]);
    sun(s, d, 1180, 470, 70, '#FFD98A', 4);
    ridge(s, 520, 30, '#9A7A8A', 11, 1.2); ridge(s, 585, 40, '#7D6A5E', 12, 0.9);
    temple(s, 1120, 600, 220, 150, '#4A3A30', 6, '#5E4A3C');
    ridge(s, 650, 45, '#6E7A3F', 13, 0.8); ridge(s, 735, 40, '#4E5E2E', 14, 1.1);
    [[180, 760, 200], [250, 790, 150], [1400, 770, 190], [1470, 800, 140], [700, 820, 120]].forEach(([x, b, hgt]) => cypress(s, x, b, hgt, '#1F2A14'));
    [[480, 800, 50], [980, 820, 46]].forEach(([x, b, r]) => { s.appendChild(svg('rect', { x: x - 4, y: b - r * 2.2, width: 8, height: r * 2.2, fill: '#2A1C0E' })); s.appendChild(svg('ellipse', { cx: x, cy: b - r * 2.3, rx: r * 1.9, ry: r * 0.75, fill: '#243318' })); });
    ridge(s, 830, 30, '#2A3418', 15, 1.4); ground(s, d, 860, '#2A3418', '#141A0C');
    mist(a, d, 640, 60, '#F2C27E', 0.22, 26); motes(a, 24, '#FFE9B0', 3, [0, 300, W, 500]);
  },
  hispania(s, d, a) {
    sky(s, d, [[0, '#E7B36A'], [0.5, '#F3D08E'], [1, '#F8E7BE']]);
    sun(s, d, 400, 300, 90, '#FFF0B8', 4);
    ridge(s, 540, 30, '#C98B5E', 21, 0.7, 0.15); ridge(s, 600, 26, '#A9663C', 22, 1.1, 0.12);
    aqueduct(s, 300, 1500, 700, 180, 10, '#6B4A2E');
    ridge(s, 700, 22, '#8A5A34', 23, 1.3, 0.2);
    for (let i = 0; i < 9; i++) roundTree(s, 120 + i * 180 + (i % 2) * 40, 820 + (i % 3) * 14, 26 + (i % 3) * 6, '#5E6A2E');
    ground(s, d, 830, '#8C5A33', '#3A2412');
    mist(a, d, 700, 40, '#FFE4B0', 0.18, 20); motes(a, 30, '#FFE4B0', 5, [0, 200, W, 600]);
  },
  gallia(s, d, a) {
    sky(s, d, [[0, '#0E1A2E'], [0.5, '#24485E'], [1, '#5E8A8A']]);
    stars(s, 50, 31, H * 0.35);
    sun(s, d, 1250, 240, 36, '#E8F0F8', 3);
    ridge(s, 480, 40, '#3A5A68', 32, 1.0); pines(s, 520, 70, '#2E4E5C', 60, 120, 33);
    ridge(s, 600, 35, '#24404A', 34, 1.3); pines(s, 640, 55, '#1C3640', 90, 170, 35);
    s.appendChild(svg('path', { d: `M 0 760 C 400 740, 700 790, 1000 770 S 1500 740, 1600 760 L 1600 900 L 0 900 Z`, fill: lin(d, [[0, '#6FA0B8', 0.55], [1, '#24404A', 0.2]]) }));
    pines(s, 790, 36, '#0F2028', 150, 260, 36, -40, 700); pines(s, 800, 30, '#0F2028', 140, 240, 37, 900, W + 40);
    ground(s, d, 840, '#0F2028', '#06100F');
    mist(a, d, 610, 70, '#9FC4D4', 0.3, 28); mist(a, d, 740, 50, '#9FC4D4', 0.22, 22, true); motes(a, 18, '#CFE6F0', 7, [0, 200, W, 600]);
  },
  britannia(s, d, a) {
    sky(s, d, [[0, '#5B6A72'], [0.55, '#9AA8AA'], [1, '#C8CFC6']]);
    ridge(s, 500, 50, '#7C9480', 41, 0.8); ridge(s, 580, 45, '#5F7F5E', 42, 1.1);
    s.appendChild(svg('rect', { x: 560, y: 560, width: 520, height: 34, fill: '#4A4E46' })); for (let i = 0; i < 13; i++) s.appendChild(svg('rect', { x: 566 + i * 40, y: 548, width: 22, height: 14, fill: '#4A4E46' }));
    tower(s, 1080, 594, 70, 120, '#3E423B');
    ridge(s, 660, 50, '#3F6A3E', 43, 0.9); ridge(s, 760, 40, '#2E5230', 44, 1.4);
    [[300, 800], [340, 806], [380, 802], [420, 808]].forEach(([x, b], i) => s.appendChild(svg('rect', { x, y: b - 90 - i * 6, width: 22, height: 90 + i * 6, fill: '#2B2E28', rx: 3 })));
    ground(s, d, 830, '#2E5230', '#101C10');
    mist(a, d, 560, 90, '#DDE4E0', 0.45, 24); mist(a, d, 700, 70, '#DDE4E0', 0.4, 30, true); mist(a, d, 830, 60, '#DDE4E0', 0.35, 18);
  },
  germania(s, d, a) {
    sky(s, d, [[0, '#0A0F18'], [0.6, '#22303E'], [1, '#4A5A62']]);
    stars(s, 70, 51, H * 0.45); sun(s, d, 320, 190, 44, '#E6ECF4', 3);
    ridge(s, 470, 45, '#2E3E48', 52, 1.1); pines(s, 500, 80, '#243440', 50, 110, 53);
    s.appendChild(svg('path', { d: `M 0 720 C 300 700, 600 760, 900 730 S 1400 700, 1600 740 L 1600 900 L 0 900 Z`, fill: lin(d, [[0, '#6A8898', 0.5], [1, '#1A2630', 0.3]]) }));
    for (let i = 0; i < 22; i++) s.appendChild(svg('rect', { x: 880 + i * 18, y: 650 - (i % 2) * 6, width: 12, height: 80, fill: '#2A1E14' }));
    tower(s, 1300, 730, 60, 150, '#1E160F');
    pines(s, 790, 34, '#0A1418', 170, 280, 54, -40, 760); pines(s, 800, 20, '#0A1418', 120, 200, 55, 1380, W + 40);
    ground(s, d, 840, '#0A1418', '#04080A');
    mist(a, d, 690, 60, '#A8BCC8', 0.32, 26); mist(a, d, 800, 50, '#A8BCC8', 0.25, 20, true);
  },
  graecia(s, d, a) {
    sky(s, d, [[0, '#1F5FA8'], [0.6, '#6FB2E6'], [1, '#CFE8F8']]);
    sun(s, d, 1300, 180, 60, '#FFF8E0', 4);
    s.appendChild(svg('rect', { x: 0, y: 560, width: W, height: 340, fill: lin(d, [[0, '#2E7FBF'], [1, '#124C7E']]) }));
    for (let i = 0; i < 40; i++) s.appendChild(svg('rect', { x: (i * 97) % W, y: 570 + (i * 37) % 300, width: 40 + (i % 5) * 20, height: 2, fill: '#CFE8F8', opacity: 0.35 }));
    ridge(s, 520, 30, '#9BB08A', 61, 0.7, 0.1);
    s.appendChild(svg('path', { d: 'M 300 600 Q 600 400 900 600 Z', fill: '#A98F6A' }));
    temple(s, 600, 470, 300, 190, '#E8DCC2', 8, '#F6EEDA');
    [[1050, 600, 40, 36], [1120, 606, 36, 30], [1180, 600, 44, 40]].forEach(([x, y, w, hgt]) => { s.appendChild(svg('rect', { x, y: y - hgt, width: w, height: hgt, fill: '#F4F1E8' })); s.appendChild(svg('circle', { cx: x + w / 2, cy: y - hgt, r: w / 2, fill: '#2E6FA8' })); });
    for (let i = 0; i < 7; i++) roundTree(s, 120 + i * 140, 760 + (i % 2) * 30, 22, '#6E7C4A', '#5A4530');
    ground(s, d, 800, '#A98F6A', '#4A3B24');
    motes(a, 20, '#FFFFFF', 9, [0, 100, W, 500]);
  },
  asia(s, d, a) {
    sky(s, d, [[0, '#C86A3C'], [0.5, '#E6A567'], [1, '#F6D8A6']]);
    sun(s, d, 800, 420, 110, '#FFE4A8', 3.5);
    ridge(s, 560, 20, '#B5774A', 71, 0.6, 0.1);
    const r = rnd(72); for (let i = 0; i < 26; i++) { const x = 80 + i * 58; const hgt = 60 + r() * 120; s.appendChild(svg('rect', { x, y: 640 - hgt, width: 40, height: hgt, fill: '#6B3E2A' })); if (i % 3 === 0) s.appendChild(svg('path', { d: `M ${x - 6} ${640 - hgt} A 26 26 0 0 1 ${x + 46} ${640 - hgt} Z`, fill: '#8B1E1E' })); if (i % 4 === 1) s.appendChild(svg('rect', { x: x + 14, y: 600 - hgt - 50, width: 12, height: 50, fill: '#6B3E2A' })); }
    s.appendChild(svg('rect', { x: 0, y: 630, width: W, height: 40, fill: '#5A3222' })); for (let i = 0; i < 40; i++) s.appendChild(svg('rect', { x: i * 40 + 6, y: 618, width: 24, height: 12, fill: '#5A3222' }));
    ridge(s, 720, 30, '#C58B57', 73, 0.9, 0.15); ridge(s, 800, 26, '#A9663C', 74, 1.3, 0.12);
    [[220, 840, 120], [1380, 850, 130], [1460, 835, 100]].forEach(([x, b, hgt]) => palm(s, x, b, hgt, '#4F5E2A'));
    ground(s, d, 840, '#A9663C', '#4A2A14');
    mist(a, d, 660, 50, '#FFD9A0', 0.25, 22); motes(a, 26, '#FFE4B0', 11, [0, 200, W, 600]);
  },
  aegyptus(s, d, a) {
    sky(s, d, [[0, '#4A2E5E'], [0.5, '#C86A3C'], [0.8, '#F0B06A'], [1, '#F8D9A6']]);
    sun(s, d, 500, 560, 95, '#FFE0A0', 3.5);
    s.appendChild(svg('path', { d: 'M 1180 640 L 1400 640 L 1290 420 Z', fill: lin(d, [[0, '#E0B678'], [1, '#8A5A34']], 0, 0, 1, 0) }));
    s.appendChild(svg('path', { d: 'M 1290 420 L 1400 640 L 1330 640 Z', fill: '#6B4324' }));
    s.appendChild(svg('path', { d: 'M 980 640 L 1140 640 L 1060 490 Z', fill: lin(d, [[0, '#D8AC70'], [1, '#7E5230']], 0, 0, 1, 0) }));
    s.appendChild(svg('path', { d: 'M 1060 490 L 1140 640 L 1090 640 Z', fill: '#5E3C20' }));
    ridge(s, 650, 14, '#D8A868', 81, 0.6, 0.1);
    s.appendChild(svg('path', { d: 'M 0 720 C 300 700, 600 760, 900 730 S 1400 700, 1600 740 L 1600 900 L 0 900 Z', fill: lin(d, [[0, '#E6A567', 0.9], [0.4, '#3E6E8E'], [1, '#1A3448']]) }));
    s.appendChild(svg('path', { d: 'M 700 730 L 760 640 L 770 730 Z', fill: '#F6EAD0' })); s.appendChild(svg('rect', { x: 690, y: 728, width: 100, height: 10, rx: 4, fill: '#3B2A17' }));
    [[160, 850, 150], [240, 870, 110], [1480, 860, 140], [1400, 880, 100]].forEach(([x, b, hgt]) => palm(s, x, b, hgt, '#2F4A22'));
    ground(s, d, 850, '#2A3A28', '#0E1A12');
    mist(a, d, 700, 40, '#FFD9A0', 0.2, 24); motes(a, 20, '#FFE4B0', 13, [0, 200, W, 600]);
  },
  library(s, d, a) {
    s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: lin(d, [[0, '#120C08'], [0.5, '#2A1C12'], [1, '#0E0906']]) }));
    s.appendChild(svg('path', { d: `M 0 ${H} L 0 300 Q ${W / 2} 40 ${W} 300 L ${W} ${H} Z`, fill: '#1A110B' }));
    // shelves
    const r = rnd(91);
    for (let col = 0; col < 7; col++) {
      const x = 120 + col * 200; const wCol = 160;
      s.appendChild(svg('rect', { x: x - 10, y: 220, width: wCol + 20, height: 560, fill: '#2E1F14' }));
      for (let row = 0; row < 6; row++) {
        const y = 250 + row * 90;
        s.appendChild(svg('rect', { x, y: y + 64, width: wCol, height: 10, fill: '#5A3F22' }));
        let sx = x + 6;
        while (sx < x + wCol - 10) { const rad_ = 10 + r() * 7; const parch = ['#E6D3A8', '#D9C08C', '#CDB47C', '#B89A68'][Math.floor(r() * 4)]; s.appendChild(svg('circle', { cx: sx + rad_, cy: y + 64 - rad_, r: rad_, fill: parch })); s.appendChild(svg('circle', { cx: sx + rad_, cy: y + 64 - rad_, r: rad_ * 0.35, fill: '#8B6B3A' })); if (r() < 0.25) s.appendChild(svg('rect', { x: sx + rad_ * 0.4, y: y + 64 - rad_ * 1.7, width: rad_ * 1.2, height: rad_ * 0.4, fill: '#8B1E1E' })); sx += rad_ * 2 + 3; }
      }
    }
    // columns
    [60, W - 100].forEach(x => { s.appendChild(svg('rect', { x, y: 120, width: 44, height: 700, fill: lin(d, [[0, '#4A3A2A'], [0.5, '#6B5540'], [1, '#2E2218']], 0, 0, 1, 0) })); s.appendChild(svg('rect', { x: x - 10, y: 110, width: 64, height: 22, fill: '#5A4634' })); });
    // table with scrolls and candles
    s.appendChild(svg('rect', { x: 300, y: 780, width: 1000, height: 30, fill: '#3B2A17' })); s.appendChild(svg('rect', { x: 320, y: 810, width: 960, height: 90, fill: '#2A1C0E' }));
    s.appendChild(svg('rect', { x: 560, y: 760, width: 220, height: 24, rx: 10, fill: '#E6D3A8' })); s.appendChild(svg('rect', { x: 860, y: 764, width: 180, height: 20, rx: 9, fill: '#D9C08C' }));
    [[480, 775], [1120, 775], [800, 700]].forEach(([x, y]) => { s.appendChild(svg('rect', { x: x - 8, y: y - 60, width: 16, height: 60, fill: '#F1E4C4' })); s.appendChild(svg('rect', { x: x - 20, y: y - 2, width: 40, height: 10, fill: '#8B6B3A' })); });
    s.appendChild(svg('rect', { x: 0, y: 820, width: W, height: 80, fill: lin(d, [[0, '#1A110B', 0], [1, '#3B2A17', 0.6]]) }));
    [[480, 715, 18], [1120, 715, 18], [800, 640, 18]].forEach(([x, y, sz]) => flame(a, d, x, y, sz));
    motes(a, 36, '#FFE4B0', 93, [0, 200, W, 600]);
  },
  colosseum(s, d, a) {
    sky(s, d, [[0, '#F0C890'], [0.5, '#E6A567'], [1, '#C8784A']]);
    sun(s, d, 1300, 160, 70, '#FFF0C0', 4);
    // velarium awning stripes
    for (let i = 0; i < 24; i++) s.appendChild(svg('path', { d: `M ${W / 2} -200 L ${-200 + i * 85} 300 L ${-200 + (i + 1) * 85} 300 Z`, fill: i % 2 ? '#C98B5E' : '#F3D9B0', opacity: 0.55 }));
    // tiers with crowd
    const r = rnd(101);
    for (let t = 0; t < 4; t++) {
      const y = 300 + t * 70; const hgt = 70;
      s.appendChild(svg('path', { d: `M -100 ${y + hgt} Q ${W / 2} ${y + hgt - 60 - t * 10} ${W + 100} ${y + hgt} L ${W + 100} ${y + hgt + 8} Q ${W / 2} ${y + hgt - 52 - t * 10} -100 ${y + hgt + 8} Z`, fill: '#E8DCC2' }));
      s.appendChild(svg('path', { d: `M -100 ${y + hgt} Q ${W / 2} ${y + hgt - 60 - t * 10} ${W + 100} ${y + hgt} L ${W + 100} ${y} Q ${W / 2} ${y - 60 - t * 10} -100 ${y} Z`, fill: t % 2 ? '#B9956A' : '#A8845C' }));
      for (let i = 0; i < 90; i++) { const x = -60 + i * 19 + r() * 8; const tx = x / W; const yy = y + hgt - 18 - (60 + t * 10) * (1 - Math.pow((tx - 0.5) * 2, 2)) + r() * 10; s.appendChild(svg('circle', { cx: x, cy: yy, r: 6 + r() * 3, fill: ['#2A1C14', '#3B2A17', '#4A2E1C', '#1A1410'][Math.floor(r() * 4)] })); s.appendChild(svg('rect', { x: x - 8, y: yy + 4, width: 16, height: 14, rx: 4, fill: ['#8B1E1E', '#E6D3A8', '#4F5E2A', '#2A1C14', '#C9A227'][Math.floor(r() * 5)] })); }
    }
    // podium wall and arches
    s.appendChild(svg('rect', { x: 0, y: 580, width: W, height: 70, fill: '#CDB47C' }));
    for (let i = 0; i < 16; i++) s.appendChild(svg('path', { d: `M ${i * 100 + 20} 650 L ${i * 100 + 20} 610 A 30 30 0 0 1 ${i * 100 + 80} 610 L ${i * 100 + 80} 650 Z`, fill: '#3B2A17' }));
    // arena sand
    s.appendChild(svg('rect', { x: 0, y: 650, width: W, height: 250, fill: lin(d, [[0, '#E6CB92'], [1, '#B8925A']]) }));
    s.appendChild(svg('ellipse', { cx: W / 2, cy: 900, rx: 900, ry: 120, fill: '#A9814E', opacity: 0.5 }));
    [[200, 600, 14], [1400, 600, 14]].forEach(([x, y, sz]) => flame(a, d, x, y, sz));
    mist(a, d, 760, 50, '#F3D9B0', 0.35, 14); mist(a, d, 840, 40, '#E6CB92', 0.4, 10, true); motes(a, 40, '#FFE4B0', 103, [0, 500, W, 400]);
  },
  chariot(s, d, a) {
    sky(s, d, [[0, '#E9C27E'], [0.5, '#F3D9A8'], [1, '#D8A868']]);
    sun(s, d, 280, 170, 60, '#FFF4D0', 4);
    // far stands (blurred by CSS) and spina
    s.appendChild(svg('rect', { x: 0, y: 330, width: W, height: 120, fill: '#B9956A' })); for (let i = 0; i < 40; i++) s.appendChild(svg('rect', { x: i * 42, y: 340 + (i % 3) * 20, width: 30, height: 100, fill: ['#8B1E1E', '#E6D3A8', '#4F5E2A', '#2A1C14'][i % 4], opacity: 0.6 }));
    s.appendChild(svg('rect', { x: 0, y: 430, width: W, height: 30, fill: '#E8DCC2' }));
    s.appendChild(svg('rect', { x: 500, y: 470, width: 600, height: 40, fill: '#CDB47C' })); s.appendChild(svg('path', { d: 'M 790 470 L 800 300 L 810 470 Z', fill: '#C98B5E' })); s.appendChild(svg('path', { d: 'M 788 300 L 800 280 L 812 300 Z', fill: '#C9A227' }));
    for (let i = 0; i < 5; i++) s.appendChild(svg('ellipse', { cx: 600 + i * 100, cy: 462, rx: 18, ry: 8, fill: '#3B2A17' }));
    // track in perspective
    s.appendChild(svg('path', { d: `M -200 ${H} L 600 510 L 1000 510 L ${W + 200} ${H} Z`, fill: lin(d, [[0, '#D9B27A'], [1, '#B07E4A']]) }));
    for (let i = 1; i < 6; i++) { const t = i / 6; s.appendChild(svg('path', { d: `M ${600 + 400 * t * 0} 510 L ${-200 + (W + 400) * t} ${H}`, stroke: '#F6EAD0', 'stroke-width': 3, opacity: 0.5 })); }
    s.appendChild(svg('path', { d: `M 800 510 L 800 ${H}`, stroke: '#F6EAD0', 'stroke-width': 4, opacity: 0.6 }));
    // chariot silhouette ahead
    s.appendChild(svg('ellipse', { cx: 980, cy: 700, rx: 70, ry: 16, fill: '#3B2A17', opacity: 0.4 }));
    s.appendChild(svg('path', { d: 'M 930 690 L 940 640 L 1010 640 L 1020 690 Z', fill: '#8B1E1E' })); s.appendChild(svg('circle', { cx: 940, cy: 692, r: 20, fill: '#3B2A17' })); s.appendChild(svg('circle', { cx: 1010, cy: 692, r: 20, fill: '#3B2A17' }));
    [[1060, 650], [1110, 645], [1160, 652]].forEach(([x, y]) => { s.appendChild(svg('path', { d: `M ${x} ${y + 40} L ${x + 10} ${y - 10} L ${x + 50} ${y - 20} L ${x + 60} ${y + 40} Z`, fill: '#4A2E1C' })); s.appendChild(svg('circle', { cx: x + 52, cy: y - 24, r: 10, fill: '#4A2E1C' })); });
    // speed streaks + dust
    const r = rnd(111);
    for (let i = 0; i < 46; i++) a.appendChild(svg('line', { x1: 0, y1: 520 + r() * 380, x2: 120 + r() * 300, y2: 0, class: 'amb-streak', stroke: '#FFF4D0', 'stroke-width': 1 + r() * 3, style: `animation-duration:${0.5 + r() * 0.7}s;animation-delay:${-r() * 2}s;opacity:${0.25 + r() * 0.45}`, transform: `translate(0 0)` }));
    mist(a, d, 820, 60, '#E6CB92', 0.5, 6); mist(a, d, 880, 50, '#D9B27A', 0.5, 4, true); motes(a, 40, '#FFE4B0', 113, [0, 500, W, 400]);
  },
  // ---------- mode scenes ----------
  camp(s, d, a) {
    sky(s, d, [[0, '#1A1830'], [0.45, '#5A3A4A'], [0.72, '#C8784A'], [1, '#E6A567']]);
    stars(s, 40, 201, H * 0.4);
    ridge(s, 520, 30, '#3A2E3A', 202, 1.1); ridge(s, 580, 36, '#2E2630', 203, 0.8);
    for (let i = 0; i < 80; i++) s.appendChild(svg('path', { d: `M ${i * 20 + 4} 600 l 0 -46 l 6 -8 l 6 8 l 0 46 z`, fill: i % 2 ? '#3B2A17' : '#4A3418' }));
    [[300, 600], [1300, 600]].forEach(([x, y]) => { s.appendChild(svg('line', { x1: x, y1: y, x2: x, y2: y - 180, stroke: '#C9A227', 'stroke-width': 5 })); s.appendChild(svg('rect', { x: x - 26, y: y - 176, width: 52, height: 34, fill: '#8B1E1E', stroke: '#C9A227', 'stroke-width': 2 })); s.appendChild(svg('path', { d: `M ${x} ${y - 200} l -14 10 l 9 -2 l -3 10 l 8 -8 l 8 8 l -3 -10 l 9 2 z`, fill: '#E3C76A' })); });
    ground(s, d, 600, '#4A3A26', '#1A120C');
    const rows = [[640, 0.6, 14], [700, 0.8, 11], [790, 1.05, 8]];
    const r = rnd(204);
    rows.forEach(([base, sc, n]) => { for (let i = 0; i < n; i++) { const x = 60 + i * (W / n) + r() * 30; const w = 110 * sc; const hgt = 80 * sc; s.appendChild(svg('path', { d: `M ${x} ${base} L ${x + w / 2} ${base - hgt} L ${x + w} ${base} Z`, fill: sc > 1 ? '#B9A27A' : '#A08B66' })); s.appendChild(svg('path', { d: `M ${x + w / 2} ${base - hgt} L ${x + w * 0.5 + w * 0.42} ${base} L ${x + w} ${base} Z`, fill: '#6B5A3E', opacity: 0.55 })); s.appendChild(svg('path', { d: `M ${x + w * 0.42} ${base} L ${x + w * 0.5} ${base - hgt * 0.5} L ${x + w * 0.58} ${base} Z`, fill: '#2A1C0E' })); } });
    [[420, 860, 20], [980, 850, 22], [1350, 870, 16]].forEach(([x, y, sz]) => { s.appendChild(svg('ellipse', { cx: x, cy: y + 4, rx: sz * 1.6, ry: sz * 0.5, fill: '#2A1C0E' })); for (let k = 0; k < 4; k++) s.appendChild(svg('line', { x1: x - sz + k * 10, y1: y + 2, x2: x + sz - k * 10, y2: y - 4, stroke: '#3B2A17', 'stroke-width': 5, 'stroke-linecap': 'round' })); flame(a, d, x, y - 2, sz); smoke(a, d, x, y - sz * 2, sz * 1.4); });
    motes(a, 30, '#FFB347', 205, [0, 500, W, 400]);
  },
  training(s, d, a) {
    sky(s, d, [[0, '#7FA3B8'], [0.6, '#D9C9A6'], [1, '#E6D3A8']]);
    sun(s, d, 1250, 160, 70, '#FFF4D0', 3.5);
    ridge(s, 520, 24, '#9A8F70', 211, 0.9, 0.15);
    for (let i = 0; i < 30; i++) s.appendChild(svg('path', { d: `M ${i * 56} 560 l 0 -40 l 8 -4 l 8 4 l 0 40 z`, fill: '#5A3F22' }));
    ground(s, d, 560, '#B8925A', '#5A4028');
    [[300, 1], [560, 0.9], [820, 1.05], [1100, 0.95], [1380, 1]].forEach(([x, sc]) => {
      s.appendChild(svg('rect', { x: x - 10 * sc, y: 640 - 200 * sc, width: 20 * sc, height: 230 * sc, fill: '#4A3418' }));
      s.appendChild(svg('ellipse', { cx: x, cy: 640 - 150 * sc, rx: 44 * sc, ry: 50 * sc, fill: '#D9B27A', stroke: '#8B6B3A', 'stroke-width': 3 }));
      s.appendChild(svg('ellipse', { cx: x, cy: 640 - 150 * sc, rx: 26 * sc, ry: 30 * sc, fill: 'none', stroke: '#8B1E1E', 'stroke-width': 3 }));
      s.appendChild(svg('ellipse', { cx: x, cy: 640 - 150 * sc, rx: 9 * sc, ry: 10 * sc, fill: '#8B1E1E' }));
      for (let k = 0; k < 5; k++) s.appendChild(svg('line', { x1: x - 30 * sc + k * 15 * sc, y1: 640 - 110 * sc, x2: x - 36 * sc + k * 18 * sc, y2: 640 - 60 * sc, stroke: '#C9A227', 'stroke-width': 1.5 }));
      s.appendChild(svg('ellipse', { cx: x + 20, cy: 680 * sc + 180 * (1 - sc), rx: 70 * sc, ry: 14 * sc, fill: '#3A2A1A', opacity: 0.35 }));
    });
    s.appendChild(svg('rect', { x: 60, y: 600, width: 180, height: 10, fill: '#4A3418' })); for (let k = 0; k < 7; k++) s.appendChild(svg('rect', { x: 70 + k * 24, y: 540, width: 6, height: 120, fill: '#8B6B3A' }));
    mist(a, d, 820, 50, '#E6D3A8', 0.4, 12); motes(a, 40, '#FFF4D0', 212, [0, 200, W, 600]);
  },
  stormplain(s, d, a) {
    sky(s, d, [[0, '#0E1118'], [0.4, '#2A3140'], [0.75, '#5A5A62'], [1, '#8A8370']]);
    for (let i = 0; i < 6; i++) ridge(s, 120 + i * 60, 40, i % 2 ? '#1E2430' : '#262D3A', 221 + i, 0.6 + i * 0.1, 0.25);
    ridge(s, 560, 20, '#4A4A3A', 228, 0.8, 0.12);
    ground(s, d, 580, '#5A5A42', '#1C1C14');
    const r = rnd(229);
    for (let i = 0; i < 120; i++) { const x = 60 + r() * 600; const y = 600 + r() * 40; s.appendChild(svg('rect', { x, y, width: 4, height: 9, fill: '#5A1313' })); if (i % 9 === 0) s.appendChild(svg('line', { x1: x + 2, y1: y, x2: x + 2, y2: y - 22, stroke: '#C9A227', 'stroke-width': 1.2 })); }
    for (let i = 0; i < 120; i++) { const x = 940 + r() * 600; const y = 600 + r() * 40; s.appendChild(svg('rect', { x, y, width: 4, height: 9, fill: '#2A2E36' })); if (i % 9 === 0) s.appendChild(svg('line', { x1: x + 2, y1: y, x2: x + 2, y2: y - 22, stroke: '#8A8F99', 'stroke-width': 1.2 })); }
    s.appendChild(svg('path', { d: 'M 1120 60 l -40 120 l 30 -10 l -50 150 l 70 -110 l -30 8 z', fill: '#E6ECF4', class: 'bolt' }));
    mist(a, d, 640, 60, '#8A8F99', 0.3, 16); motes(a, 24, '#CFD6E0', 230, [0, 300, W, 500]);
    for (let i = 0; i < 40; i++) { const rx = r() * W; a.appendChild(svg('line', { x1: rx, y1: 0, x2: rx - 6, y2: 24, class: 'amb-rain', stroke: '#CFD6E0', 'stroke-width': 1, style: `animation-duration:${0.7 + r() * 0.5}s;animation-delay:${-r() * 2}s;opacity:${0.1 + r() * 0.25}` })); }
  },
  arenafloor(s, d, a) {
    sky(s, d, [[0, '#E6B97A'], [1, '#D9A86A']]);
    const r = rnd(241);
    for (let t = 0; t < 3; t++) { const y = 120 + t * 90; s.appendChild(svg('rect', { x: 0, y, width: W, height: 90, fill: t % 2 ? '#B9956A' : '#A8845C' })); for (let i = 0; i < 70; i++) { const x = i * 24 + r() * 10; s.appendChild(svg('circle', { cx: x, cy: y + 40 + r() * 20, r: 7, fill: '#2A1C14' })); s.appendChild(svg('rect', { x: x - 9, y: y + 48 + r() * 10, width: 18, height: 20, rx: 5, fill: ['#8B1E1E', '#E6D3A8', '#4F5E2A', '#2A1C14', '#C9A227'][Math.floor(r() * 5)] })); } }
    s.appendChild(svg('rect', { x: 640, y: 150, width: 320, height: 240, fill: '#6B1E2A' })); s.appendChild(svg('path', { d: 'M 630 150 h 340 l -20 -40 h -300 z', fill: '#8B1E1E' })); [660, 940].forEach(x => s.appendChild(svg('rect', { x: x - 10, y: 150, width: 20, height: 240, fill: '#E8DCC2' })));
    s.appendChild(svg('circle', { cx: 800, cy: 270, r: 22, fill: '#8A5A3C' })); s.appendChild(svg('path', { d: 'M 760 390 c 0 -60 20 -90 40 -90 s 40 30 40 90 z', fill: '#66023C' })); s.appendChild(svg('path', { d: 'M 778 258 q 22 -20 44 0', stroke: '#C9A227', 'stroke-width': 4, fill: 'none' }));
    s.appendChild(svg('rect', { x: 0, y: 390, width: W, height: 70, fill: '#CDB47C' })); for (let i = 0; i < 16; i++) s.appendChild(svg('rect', { x: i * 100 + 30, y: 400, width: 40, height: 50, fill: '#3B2A17' }));
    s.appendChild(svg('rect', { x: 0, y: 460, width: W, height: 440, fill: lin(d, [[0, '#E6CB92'], [1, '#B8925A']]) }));
    const glad = (x, flip) => { const g = svg('g', { transform: `translate(${x} 700) scale(${flip ? -1 : 1} 1)` }); g.appendChild(svg('ellipse', { cx: 0, cy: 150, rx: 70, ry: 14, fill: '#8A6A3C', opacity: 0.5 })); g.appendChild(svg('circle', { cx: 0, cy: -40, r: 22, fill: '#1A1410' })); g.appendChild(svg('path', { d: 'M -22 -50 q 22 -30 44 0 l 6 20 h -56 z', fill: '#1A1410' })); g.appendChild(svg('path', { d: 'M -28 -16 l 56 0 l -10 110 h -36 z', fill: '#1A1410' })); g.appendChild(svg('path', { d: 'M 24 -10 l 90 -60 l 8 8 l -86 70 z', fill: '#1A1410' })); g.appendChild(svg('path', { d: 'M -70 -40 a 42 42 0 0 1 0 84 l -14 0 a 42 42 0 0 1 0 -84 z', fill: '#1A1410' })); g.appendChild(svg('path', { d: 'M -20 94 l -10 56 h 18 l 6 -56 z M 8 94 l 10 56 h 18 l -6 -56 z', fill: '#1A1410' })); return g; };
    s.appendChild(glad(520, false)); s.appendChild(glad(1080, true));
    mist(a, d, 820, 50, '#F3D9B0', 0.4, 10); motes(a, 50, '#FFE4B0', 242, [0, 400, W, 500]);
  },
  yard(s, d, a) {
    sky(s, d, [[0, '#9FB4C4'], [0.6, '#D9C9A6'], [1, '#E6D3A8']]);
    sun(s, d, 300, 140, 60, '#FFF4D0', 3);
    ridge(s, 520, 24, '#8C8070', 251, 0.8, 0.15);
    ground(s, d, 580, '#B8A27A', '#5A4A30');
    const scaf = svg('g', {}); for (let i = 0; i < 6; i++) scaf.appendChild(svg('rect', { x: 120 + i * 60, y: 200, width: 8, height: 400, fill: '#6B4B2A' })); for (let j = 0; j < 5; j++) scaf.appendChild(svg('rect', { x: 110, y: 230 + j * 80, width: 330, height: 8, fill: '#5A3F22' })); for (let j = 0; j < 4; j++) scaf.appendChild(svg('line', { x1: 120, y1: 238 + j * 80, x2: 440, y2: 310 + j * 80, stroke: '#4A3418', 'stroke-width': 4 })); s.appendChild(scaf);
    s.appendChild(svg('rect', { x: 700, y: 520, width: 360, height: 30, fill: '#5A3F22' })); s.appendChild(svg('rect', { x: 740, y: 400, width: 40, height: 130, fill: '#6B4B2A' })); s.appendChild(svg('rect', { x: 980, y: 400, width: 40, height: 130, fill: '#6B4B2A' })); s.appendChild(svg('rect', { x: 740, y: 400, width: 280, height: 24, fill: '#5A3F22' })); s.appendChild(svg('path', { d: 'M 760 412 l -120 -80 M 1000 412 l 120 -80', stroke: '#4A3418', 'stroke-width': 10 })); s.appendChild(svg('path', { d: 'M 640 332 L 1120 332', stroke: '#B9B2A5', 'stroke-width': 3 })); s.appendChild(svg('rect', { x: 820, y: 440, width: 120, height: 60, fill: '#8B6B3A' }));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3 - (i % 2); j++) s.appendChild(svg('rect', { x: 1180 + i * 70 - j * 10, y: 700 - j * 60, width: 66, height: 56, fill: ['#D9CDB4', '#CDBF9F', '#C4B390'][(i + j) % 3], stroke: '#8C8070', 'stroke-width': 2 }));
    s.appendChild(svg('path', { d: 'M 1420 760 L 1480 300 L 1540 760', stroke: '#5A3F22', 'stroke-width': 12, fill: 'none' })); s.appendChild(svg('line', { x1: 1480, y1: 300, x2: 1340, y2: 560, stroke: '#2A1C0E', 'stroke-width': 3 })); s.appendChild(svg('rect', { x: 1314, y: 560, width: 52, height: 46, fill: '#CDBF9F', stroke: '#8C8070', 'stroke-width': 2 })); s.appendChild(svg('circle', { cx: 1480, cy: 300, r: 14, fill: '#4A3418' }));
    s.appendChild(svg('ellipse', { cx: 880, cy: 760, rx: 300, ry: 20, fill: '#5A4A30', opacity: 0.4 }));
    mist(a, d, 800, 50, '#E6D3A8', 0.35, 14); motes(a, 40, '#FFF4D0', 252, [0, 200, W, 600]);
  },
  study(s, d, a) {
    s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: lin(d, [[0, '#120C08'], [0.5, '#2A1C12'], [1, '#0E0906']]) }));
    s.appendChild(svg('rect', { x: 1080, y: 120, width: 300, height: 360, fill: lin(d, [[0, '#0E1A2E'], [1, '#24485E']]) })); s.appendChild(svg('path', { d: 'M 1060 120 h 340 v 380 h -340 z M 1230 120 v 380 M 1060 300 h 340', fill: 'none', stroke: '#3B2A17', 'stroke-width': 12 })); s.appendChild(svg('circle', { cx: 1310, cy: 200, r: 30, fill: '#E6ECF4', opacity: 0.9 }));
    s.appendChild(svg('rect', { x: 120, y: 140, width: 760, height: 16, fill: '#5A3F22' })); for (let i = 0; i < 18; i++) { s.appendChild(svg('circle', { cx: 150 + i * 40, cy: 124, r: 14, fill: ['#E6D3A8', '#D9C08C', '#CDB47C'][i % 3] })); s.appendChild(svg('circle', { cx: 150 + i * 40, cy: 124, r: 5, fill: '#8B6B3A' })); }
    s.appendChild(svg('rect', { x: 120, y: 300, width: 760, height: 16, fill: '#5A3F22' })); for (let i = 0; i < 9; i++) s.appendChild(svg('rect', { x: 150 + i * 80, y: 220, width: 60, height: 80, fill: ['#8B1E1E', '#4F5E2A', '#2E4A7A'][i % 3] }));
    s.appendChild(svg('rect', { x: 200, y: 640, width: 1200, height: 40, fill: '#5A3F22' })); s.appendChild(svg('rect', { x: 240, y: 680, width: 40, height: 220, fill: '#3B2A17' })); s.appendChild(svg('rect', { x: 1320, y: 680, width: 40, height: 220, fill: '#3B2A17' }));
    s.appendChild(svg('rect', { x: 420, y: 610, width: 420, height: 34, rx: 14, fill: '#E6D3A8' })); s.appendChild(svg('rect', { x: 470, y: 560, width: 320, height: 60, fill: '#F0E1BC' })); for (let i = 0; i < 5; i++) s.appendChild(svg('line', { x1: 490, y1: 575 + i * 10, x2: 760 - (i % 2) * 60, y2: 575 + i * 10, stroke: '#8B6B3A', 'stroke-width': 1.5 }));
    s.appendChild(svg('rect', { x: 900, y: 620, width: 200, height: 24, rx: 10, fill: '#D9C08C' }));
    s.appendChild(svg('path', { d: 'M 1000 600 q 30 -20 70 0 l -10 14 h -50 z', fill: '#B48C5E' })); s.appendChild(svg('rect', { x: 1030, y: 580, width: 10, height: 20, fill: '#8C6B4A' }));
    flame(a, d, 1072, 596, 14);
    s.appendChild(svg('rect', { x: 0, y: 700, width: W, height: 200, fill: lin(d, [[0, '#1A110B', 0], [1, '#3B2A17', 0.5]]) }));
    motes(a, 24, '#FFE4B0', 262, [200, 200, 1200, 500]);
  },
  curia(s, d, a) {
    s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: lin(d, [[0, '#1A1510'], [0.5, '#3A322A'], [1, '#1A1510']]) }));
    for (let i = 0; i < 8; i++) s.appendChild(svg('rect', { x: 100 + i * 180, y: 40, width: 140, height: 90, fill: 'none', stroke: '#5A4634', 'stroke-width': 6 }));
    for (let i = 0; i < 7; i++) { const x = 80 + i * 240; s.appendChild(svg('rect', { x: x - 26, y: 150, width: 52, height: 420, fill: lin(d, [[0, '#B9B0A2'], [0.5, '#ECE6DA'], [1, '#8E867A']], 0, 0, 1, 0) })); s.appendChild(svg('rect', { x: x - 38, y: 140, width: 76, height: 22, fill: '#CDC4B4' })); s.appendChild(svg('rect', { x: x - 36, y: 570, width: 72, height: 18, fill: '#CDC4B4' })); }
    for (let t = 0; t < 4; t++) { const y = 470 + t * 55; const inset = 120 + t * 60; s.appendChild(svg('path', { d: `M ${inset} ${y} L 620 ${y - 10} L 620 ${y + 30} L ${inset} ${y + 40} Z`, fill: t % 2 ? '#ECE6DA' : '#D9D1C2' })); s.appendChild(svg('path', { d: `M ${W - inset} ${y} L 980 ${y - 10} L 980 ${y + 30} L ${W - inset} ${y + 40} Z`, fill: t % 2 ? '#ECE6DA' : '#D9D1C2' })); }
    s.appendChild(svg('rect', { x: 640, y: 560, width: 320, height: 40, fill: '#CDC4B4' })); s.appendChild(svg('rect', { x: 680, y: 530, width: 240, height: 30, fill: '#D9D1C2' })); s.appendChild(svg('rect', { x: 770, y: 450, width: 60, height: 90, fill: '#66023C' })); s.appendChild(svg('rect', { x: 760, y: 440, width: 80, height: 14, fill: '#C9A227' }));
    s.appendChild(svg('path', { d: `M 0 600 L ${W} 600 L ${W} ${H} L 0 ${H} Z`, fill: lin(d, [[0, '#8E867A'], [1, '#3A322A']]) }));
    for (let i = 0; i < 12; i++) s.appendChild(svg('path', { d: `M ${i * 140 - 100} ${H} L ${i * 140 + 60} 600 L ${i * 140 + 80} 600 L ${i * 140 - 60} ${H} Z`, fill: '#ECE6DA', opacity: 0.12 }));
    [[200, 560], [1400, 560]].forEach(([x, y]) => { s.appendChild(svg('rect', { x: x - 4, y: y - 80, width: 8, height: 90, fill: '#4A3418' })); flame(a, d, x, y - 84, 16); });
    motes(a, 24, '#FFE4B0', 271, [0, 200, W, 500]);
  },
  armoury(s, d, a) {
    s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: lin(d, [[0, '#1E0E0C'], [0.5, '#4A1A16'], [1, '#1A0A08']]) }));
    for (let i = 0; i < 14; i++) s.appendChild(svg('rect', { x: i * 120, y: 0, width: 60, height: H, fill: '#000', opacity: 0.12 }));
    s.appendChild(svg('path', { d: `M 0 ${H} L 0 320 Q ${W / 2} 40 ${W} 320 L ${W} ${H} Z`, fill: '#3A1410' }));
    s.appendChild(svg('rect', { x: 100, y: 250, width: 640, height: 14, fill: '#5A3F22' }));
    for (let i = 0; i < 7; i++) { const x = 120 + i * 90; s.appendChild(svg('path', { d: `M ${x} 270 h 60 q 6 0 6 6 v 84 q 0 6 -6 6 h -60 q -6 0 -6 -6 v -84 q 0 -6 6 -6 z`, fill: i % 2 ? '#8B1E1E' : '#731818', stroke: '#C9A227', 'stroke-width': 2 })); s.appendChild(svg('circle', { cx: x + 30, cy: 318, r: 8, fill: '#C9A227' })); }
    s.appendChild(svg('rect', { x: 860, y: 250, width: 600, height: 14, fill: '#5A3F22' }));
    for (let i = 0; i < 6; i++) { const x = 900 + i * 100; s.appendChild(svg('path', { d: `M ${x - 24} 318 a 24 24 0 0 1 48 0 v 12 h -48 z`, fill: '#C9A227', stroke: '#3E2D0C', 'stroke-width': 1.5 })); s.appendChild(svg('path', { d: `M ${x - 20} 300 q 20 -30 40 0 q -20 -10 -40 0 z`, fill: '#8B1E1E' })); s.appendChild(svg('rect', { x: x - 30, y: 330, width: 60, height: 10, fill: '#8E6B1C' })); }
    for (let i = 0; i < 9; i++) s.appendChild(svg('line', { x1: 1200 + i * 10, y1: 860, x2: 1230 + i * 6, y2: 560, stroke: '#B9B2A5', 'stroke-width': 3 }));
    s.appendChild(svg('rect', { x: 200, y: 720, width: 300, height: 140, rx: 8, fill: '#5A3F22', stroke: '#C9A227', 'stroke-width': 3 })); s.appendChild(svg('rect', { x: 330, y: 770, width: 40, height: 50, fill: '#C9A227' }));
    ground(s, d, 860, '#3A2A1A', '#120A08');
    [[640, 700, 16], [1000, 700, 16]].forEach(([x, y, sz]) => { s.appendChild(svg('rect', { x: x - 4, y: y - 90, width: 8, height: 100, fill: '#4A3418' })); flame(a, d, x, y - 94, sz); });
    motes(a, 20, '#FFB347', 281, [0, 300, W, 500]);
  },
  wartable(s, d, a) {
    s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, fill: lin(d, [[0, '#2A1C0E'], [1, '#120A06']]) }));
    for (let i = 0; i < 20; i++) s.appendChild(svg('rect', { x: 0, y: i * 46, width: W, height: 22, fill: '#000', opacity: 0.08 }));
    s.appendChild(svg('rect', { x: 120, y: 90, width: 1360, height: 720, rx: 10, fill: '#5A3F22', stroke: '#2A1C0E', 'stroke-width': 10 }));
    s.appendChild(svg('rect', { x: 160, y: 130, width: 1280, height: 640, fill: lin(d, [[0, '#E9D7AE'], [1, '#CDB47C']]) }));
    s.appendChild(svg('path', { d: 'M 300 500 Q 500 300 760 360 T 1240 320 L 1300 700 L 260 720 Z', fill: '#D9C08C', stroke: '#6B5636', 'stroke-width': 3 }));
    for (let i = 0; i < 40; i++) s.appendChild(svg('path', { d: `M ${200 + (i * 97) % 1200} ${160 + (i * 61) % 580} q 10 -4 20 0`, stroke: '#6B5636', 'stroke-opacity': 0.3, fill: 'none' }));
    [[520, 420, '#8B1E1E'], [860, 380, '#8B1E1E'], [1060, 520, '#3A3F47'], [700, 600, '#3A3F47']].forEach(([x, y, c]) => { s.appendChild(svg('rect', { x: x - 14, y: y - 10, width: 28, height: 20, fill: c })); s.appendChild(svg('line', { x1: x, y1: y - 10, x2: x, y2: y - 36, stroke: '#C9A227', 'stroke-width': 3 })); });
    [[200, 150], [1400, 150], [200, 760], [1400, 760]].forEach(([x, y]) => { s.appendChild(svg('rect', { x: x - 10, y: y - 40, width: 20, height: 40, fill: '#F1E4C4' })); flame(a, d, x, y - 42, 14); });
    motes(a, 16, '#FFE4B0', 291, [120, 90, 1360, 720]);
  },
};

export const PROVINCE_SCENE = { 1: 'italia', 6: 'hispania', 7: 'gallia', 8: 'britannia', 9: 'germania', 10: 'graecia', 11: 'asia', 12: 'aegyptus' };

/** Build a scene element: .scene-bg > .scene-static(svg) + .scene-ambient(svg) + .scene-tint. */
export function sceneFor(kind, { blur = 8, tint = 0.45 } = {}) {
  const fn = SCENES[kind] || SCENES.italia;
  const [stat, d1] = layer(); const [amb, d2] = layer();
  // ambient defs live on the ambient layer; scenes add to d1 for static and need a defs for ambient gradients
  const dAmb = d2;
  fn(stat, d1, amb, dAmb);
  // move any gradient defs the scene created for ambient use (they were created on d1; duplicate references are fine since both svgs share the document)
  const el = h('div', { class: 'scene-bg scene-' + kind, 'aria-hidden': 'true', style: { '--scene-blur': blur + 'px', '--scene-tint': tint } },
    h('div', { class: 'scene-static' }, stat), h('div', { class: 'scene-ambient' }, amb), h('div', { class: 'scene-tint' }));
  el.show = () => requestAnimationFrame(() => el.classList.add('on'));
  el.destroy = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 500); };
  el.cheer = () => { el.classList.remove('cheer', 'jeer'); void el.offsetWidth; el.classList.add('cheer'); };
  el.jeer = () => { el.classList.remove('cheer', 'jeer'); void el.offsetWidth; el.classList.add('jeer'); };
  return el;
}

/** Mount a scene behind an element; returns the scene. Cleans itself up through el.cleanup chaining. */
export function attachScene(hostEl, kind, opts) {
  const sc = sceneFor(kind, opts);
  document.body.appendChild(sc);
  sc.show();
  const prev = hostEl.cleanup;
  hostEl.cleanup = () => { sc.destroy(); prev && prev(); };
  hostEl.scene = sc;
  return sc;
}
