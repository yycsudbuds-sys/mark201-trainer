// Small illustrated vignettes for scenario questions, chosen by chapter. They set a scene (a forum, a crowd,
// a stall, a workshop, scales, a harbour, a market, a herald) without hinting at the answer.
import { svg } from './visuals.js';

const W = 220, H = 130;
const INK = '#3B2A17', SKIN = '#8A5A3C', STONE = '#D9CDB4', STONE_D = '#B9AD94', WOOD = '#6B4B2A', RED = '#8B1E1E', GOLD = '#C9A227', CREAM = '#E6D3A8';
function base(id) {
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'vignette-svg', 'aria-hidden': 'true' });
  s.appendChild(svg('defs', {}, svg('linearGradient', { id: 'vg' + id, x1: 0, y1: 0, x2: 0, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#F0E1BC' }), svg('stop', { offset: 1, 'stop-color': '#CDB47C' }))));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, rx: 8, fill: `url(#vg${id})` }));
  s.appendChild(svg('rect', { x: 0, y: 96, width: W, height: 34, fill: '#B9A27A', opacity: 0.8 }));
  return s;
}
function person(s, x, y, tunic = CREAM, sc = 1, arm = null) {
  const g = svg('g', { transform: `translate(${x} ${y}) scale(${sc})` });
  g.appendChild(svg('path', { d: 'M -7 0 h 5 v -12 h -5 z M 2 0 h 5 v -12 h -5 z', fill: INK }));
  g.appendChild(svg('path', { d: 'M -8 -12 l 2 -22 h 12 l 2 22 z', fill: tunic, stroke: INK, 'stroke-width': 0.8 }));
  g.appendChild(svg('circle', { cx: 0, cy: -39, r: 5, fill: SKIN }));
  if (arm) g.appendChild(svg('path', { d: arm, stroke: SKIN, 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }));
  s.appendChild(g); return g;
}
function column(s, x, y, hgt) { s.appendChild(svg('rect', { x: x - 5, y: y - hgt, width: 10, height: hgt, fill: STONE, stroke: STONE_D })); s.appendChild(svg('rect', { x: x - 8, y: y - hgt - 4, width: 16, height: 5, fill: STONE })); s.appendChild(svg('rect', { x: x - 7, y: y - 3, width: 14, height: 4, fill: STONE })); }
function amphora(s, x, y, c = '#B5623A', sc = 1) { s.appendChild(svg('path', { d: `M ${x - 6 * sc} ${y - 30 * sc} q 0 -6 6 -6 q 6 0 6 6 q 8 10 4 24 q -2 6 -10 6 q -8 0 -10 -6 q -4 -14 4 -24 z`, fill: c, stroke: INK, 'stroke-width': 0.8 })); }

const SCENES = {
  1: s => { // the forum: columns, a speaker on a rostrum, a small crowd
    [40, 70, 100, 130, 160, 190].forEach(x => column(s, x, 96, 56));
    s.appendChild(svg('rect', { x: 30, y: 36, width: 170, height: 6, fill: STONE }));
    s.appendChild(svg('rect', { x: 80, y: 84, width: 60, height: 12, fill: STONE_D }));
    person(s, 110, 84, RED, 0.9, 'M 6 -30 l 12 -8');
    [36, 56, 160, 182].forEach((x, i) => person(s, x, 102, [CREAM, '#4F6A3F', '#2E4A7A', CREAM][i], 0.8));
  },
  6: s => { // a crowd of many kinds: segments
    const cols = [CREAM, '#4F6A3F', '#2E4A7A', RED, '#66023C', '#7A4A1E', CREAM, '#1E6A7A'];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) person(s, 22 + i * 26 + r * 12, 84 + r * 18, cols[(i + r) % cols.length], 0.72 + r * 0.14);
  },
  7: s => { // a stall of goods: amphorae, bolts of cloth, a sign
    s.appendChild(svg('rect', { x: 30, y: 60, width: 160, height: 10, fill: WOOD })); s.appendChild(svg('rect', { x: 36, y: 70, width: 6, height: 26, fill: WOOD })); s.appendChild(svg('rect', { x: 178, y: 70, width: 6, height: 26, fill: WOOD }));
    s.appendChild(svg('path', { d: 'M 24 60 l 12 -22 h 148 l 12 22 z', fill: RED })); for (let i = 0; i < 6; i++) s.appendChild(svg('rect', { x: 36 + i * 28, y: 38, width: 14, height: 22, fill: CREAM, opacity: 0.85 }));
    amphora(s, 60, 96, '#B5623A', 0.9); amphora(s, 84, 96, '#8A2A1E', 0.9); amphora(s, 108, 96, '#B5623A', 0.9);
    s.appendChild(svg('rect', { x: 128, y: 78, width: 44, height: 18, fill: '#2E4A7A' })); s.appendChild(svg('rect', { x: 130, y: 74, width: 44, height: 18, fill: '#4F6A3F' }));
    person(s, 200, 100, CREAM, 0.85);
  },
  8: s => { // a workshop: anvil, cart of new wares, a craftsman
    s.appendChild(svg('rect', { x: 20, y: 40, width: 90, height: 56, fill: STONE_D })); s.appendChild(svg('path', { d: 'M 14 40 l 51 -24 l 51 24 z', fill: '#B5623A' }));
    s.appendChild(svg('rect', { x: 34, y: 72, width: 30, height: 10, fill: '#3A3F47' })); s.appendChild(svg('rect', { x: 44, y: 82, width: 10, height: 14, fill: '#3A3F47' }));
    person(s, 86, 96, '#6B4B2A', 0.9, 'M -4 -30 l -14 -10');
    s.appendChild(svg('rect', { x: 130, y: 70, width: 60, height: 22, fill: WOOD })); s.appendChild(svg('circle', { cx: 142, cy: 96, r: 8, fill: INK })); s.appendChild(svg('circle', { cx: 178, cy: 96, r: 8, fill: INK }));
    [[136, 62, GOLD], [152, 58, '#1E6A7A'], [168, 62, RED]].forEach(([x, y, c]) => s.appendChild(svg('rect', { x, y, width: 14, height: 12, fill: c, stroke: INK, 'stroke-width': 0.6 })));
    s.appendChild(svg('path', { d: 'M 150 50 l 2 -8 l 2 8 M 146 46 l 10 0', stroke: GOLD, 'stroke-width': 1.5 }));
  },
  9: s => { // scales and coins
    s.appendChild(svg('rect', { x: 106, y: 40, width: 8, height: 56, fill: WOOD })); s.appendChild(svg('rect', { x: 50, y: 40, width: 120, height: 5, fill: WOOD }));
    s.appendChild(svg('path', { d: 'M 60 45 l 0 24 M 160 45 l 0 18', stroke: INK, 'stroke-width': 1.2 }));
    s.appendChild(svg('path', { d: 'M 40 69 q 20 14 40 0', fill: '#8E6B1C', stroke: INK })); s.appendChild(svg('path', { d: 'M 140 63 q 20 14 40 0', fill: '#8E6B1C', stroke: INK }));
    for (let i = 0; i < 5; i++) s.appendChild(svg('circle', { cx: 50 + i * 5, cy: 68 - (i % 2) * 3, r: 4, fill: GOLD, stroke: '#6B4B12', 'stroke-width': 0.6 }));
    for (let i = 0; i < 7; i++) s.appendChild(svg('circle', { cx: 30 + i * 12, cy: 92, r: 5, fill: GOLD, stroke: '#6B4B12', 'stroke-width': 0.6 }));
    person(s, 196, 100, '#66023C', 0.85);
  },
  10: s => { // a harbour: ship, crates, a wagon
    s.appendChild(svg('rect', { x: 0, y: 74, width: W, height: 24, fill: '#7E9EA3' }));
    s.appendChild(svg('path', { d: 'M 30 78 l 10 10 h 70 l 12 -10 z', fill: WOOD })); s.appendChild(svg('rect', { x: 74, y: 40, width: 3, height: 40, fill: WOOD })); s.appendChild(svg('path', { d: 'M 77 42 l 30 20 l -30 10 z', fill: CREAM, stroke: INK, 'stroke-width': 0.6 }));
    [[140, 82], [156, 82], [148, 68]].forEach(([x, y]) => s.appendChild(svg('rect', { x, y, width: 14, height: 14, fill: '#9A7448', stroke: INK, 'stroke-width': 0.6 })));
    s.appendChild(svg('rect', { x: 176, y: 78, width: 36, height: 14, fill: WOOD })); s.appendChild(svg('circle', { cx: 184, cy: 96, r: 6, fill: INK })); s.appendChild(svg('circle', { cx: 206, cy: 96, r: 6, fill: INK }));
    person(s, 128, 100, CREAM, 0.8, 'M 6 -30 l 10 6');
  },
  11: s => { // a market street: two stalls with awnings and shoppers
    [[20, RED], [120, '#4F6A3F']].forEach(([x, c]) => { s.appendChild(svg('path', { d: `M ${x} 56 l 10 -20 h 70 l 10 20 z`, fill: c })); for (let i = 0; i < 4; i++) s.appendChild(svg('rect', { x: x + 6 + i * 20, y: 36, width: 10, height: 20, fill: CREAM, opacity: 0.8 })); s.appendChild(svg('rect', { x: x + 6, y: 70, width: 78, height: 8, fill: WOOD })); s.appendChild(svg('rect', { x: x + 8, y: 78, width: 5, height: 18, fill: WOOD })); s.appendChild(svg('rect', { x: x + 77, y: 78, width: 5, height: 18, fill: WOOD })); });
    amphora(s, 40, 70, '#B5623A', 0.7); s.appendChild(svg('rect', { x: 56, y: 60, width: 20, height: 10, fill: '#2E4A7A' })); s.appendChild(svg('circle', { cx: 150, cy: 64, r: 6, fill: '#B5452A' })); s.appendChild(svg('circle', { cx: 164, cy: 64, r: 6, fill: '#C9A227' }));
    person(s, 108, 100, CREAM, 0.85); person(s, 196, 100, '#2E4A7A', 0.85);
  },
  12: s => { // a herald with a horn and a banner before a crowd
    s.appendChild(svg('rect', { x: 150, y: 20, width: 4, height: 76, fill: GOLD })); s.appendChild(svg('path', { d: 'M 154 22 l 40 8 l -40 10 z', fill: RED, stroke: GOLD }));
    person(s, 130, 96, RED, 1, 'M 4 -30 l 16 -10'); s.appendChild(svg('path', { d: 'M 146 134 l 0 0', fill: 'none' }));
    s.appendChild(svg('path', { d: 'M 148 64 q 20 -14 36 -4 q -10 4 -16 2', fill: GOLD, stroke: '#6B4B12', 'stroke-width': 0.8, transform: 'translate(-6 -6)' }));
    [24, 46, 68, 90].forEach((x, i) => person(s, x, 102, [CREAM, '#4F6A3F', '#2E4A7A', '#7A4A1E'][i], 0.78));
  },
};
let n = 0;
/** A vignette element for a chapter (or null). */
export function vignetteFor(chapter) {
  const fn = SCENES[chapter]; if (!fn) return null;
  const s = base(++n); fn(s); return s;
}
