// Enemy commanders for each province's siege: a name, a drawn portrait, taunts on misses and a surrender line.
// Taunts are about the battle only, never about the course content.
import { svg } from './visuals.js';
import { PROVINCE_SCENE } from './scenes.js';

export const COMMANDERS = {
  italia: { name: 'Lucius Sergius Catilina', title: 'rebel senator', look: { skin: '#D9A47C', hair: '#2A1C14', hairStyle: 'short', beard: 'none', head: 'laurel', cloth: '#E8DCC2', trim: '#66023C', band: '#66023C' },
    taunts: ['The Senate will not save you, Roman.', 'Your line wavers. Rome wavers with it.', 'Even your own cohorts doubt you.', 'Hold the standard higher, I can barely see it fall.'], surrender: 'Enough. Rome keeps Rome. Lower the standards.' },
  hispania: { name: 'Viriathus', title: 'Lusitanian chieftain', look: { skin: '#C8956A', hair: '#3A2616', hairStyle: 'wild', beard: 'full', head: 'none', cloth: '#6B4A2A', trim: '#B9B2A5', band: '#6B4A2A', pelt: true },
    taunts: ['These hills have swallowed legions before.', 'Your pila fall short, Roman.', 'The caetrati laugh at your wall of shields.', 'Come closer. Our falcatas are patient.'], surrender: 'The hills are yours today. Take the town, not the people.' },
  gallia: { name: 'Vercingetorix', title: 'king of the Arverni', look: { skin: '#D9B08C', hair: '#8B5A2B', hairStyle: 'long', beard: 'moustache', head: 'torc', cloth: '#2F5A4A', trim: '#D9A441', band: '#2F5A4A' },
    taunts: ['Hear the carnyx? That is Gaul laughing.', 'Your shields crack like winter ice.', 'Alesia holds. Alesia always holds.', 'Another Roman falls. Keep sending them.'], surrender: 'I lay my arms at your feet. Gaul bends, but remembers.' },
  britannia: { name: 'Boudica', title: 'queen of the Iceni', look: { skin: '#E6C8B0', hair: '#B5452A', hairStyle: 'long', beard: 'none', head: 'torc', cloth: '#2E4A7A', trim: '#CFE6F0', band: '#2E4A7A', woad: true, female: true },
    taunts: ['The woad does not wash off, Roman, and neither do we.', 'Your line is thin as mist on the Thames.', 'Chariots! Ride them down!', 'Londinium burned once. It can burn again.'], surrender: 'The island is yours. Do not mistake silence for peace.' },
  germania: { name: 'Arminius', title: 'warlord of the Cherusci', look: { skin: '#D9B08C', hair: '#5A3A1E', hairStyle: 'long', beard: 'full', head: 'none', cloth: '#3A2A1E', trim: '#8A8F99', band: '#3A2A1E', pelt: true },
    taunts: ['Varus, give me back my legions, they said. Give me yours.', 'The forest eats eagles.', 'You march in a line. We do not.', 'Rain and mud and iron. Welcome to Germania.'], surrender: 'The Rhine is yours to the bank. No farther, Roman.' },
  graecia: { name: 'Kleomenes', title: 'Spartan strategos', look: { skin: '#D9A47C', hair: '#2A1C14', hairStyle: 'short', beard: 'full', head: 'corinthian', cloth: '#8A2A1E', trim: '#E8DCC2', band: '#8A2A1E' },
    taunts: ['Come and take them.', 'A phalanx does not break. It bends you.', 'Your pila rattle on bronze.', 'We have fought larger legions and shorter speeches.'], surrender: 'The city yields. Sparta does not kneel, but it steps aside.' },
  asia: { name: 'Mithridates', title: 'king of Pontus', look: { skin: '#C8956A', hair: '#2A1C14', hairStyle: 'short', beard: 'full', head: 'diadem', cloth: '#7A4A1E', trim: '#E3C76A', band: '#7A4A1E' },
    taunts: ['My archers have not yet begun.', 'Cataphracts! Show Rome what iron horses do.', 'Three Roman generals have tried. Three.', 'The sun is in your eyes, legionary. It always is in Asia.'], surrender: 'Ephesus is yours. The East has a long memory, and so do I.' },
  aegyptus: { name: 'Achillas', title: 'Ptolemaic general', look: { skin: '#B07A4A', hair: '#1A1410', hairStyle: 'short', beard: 'none', head: 'nemes', cloth: '#1E6A7A', trim: '#E3C76A', band: '#1E6A7A' },
    taunts: ['The Nile has drowned better armies.', 'Khopesh against gladius. We shall see.', 'Alexandria does not open her gates to shouting.', 'Your testudo bakes in our sun.'], surrender: 'The gates open. Treat the library kindly, Roman.' },
  default: { name: 'the enemy commander', title: 'warlord', look: { skin: '#D9A47C', hair: '#3A2616', hairStyle: 'short', beard: 'full', head: 'none', cloth: '#3A3F47', trim: '#8A8F99', band: '#3A3F47' },
    taunts: ['Your line wavers.', 'Hold, and we will break you.', 'Another one falls.'], surrender: 'The field is yours.' },
};

/** A course pack adds its own enemy commanders here (scene kind -> commander). */
export function registerCommanders(map) { Object.assign(COMMANDERS, map); }

export function commanderFor(chapterOrKind) {
  const kind = typeof chapterOrKind === 'number' ? PROVINCE_SCENE[chapterOrKind] : chapterOrKind;
  return COMMANDERS[kind] || COMMANDERS.default;
}

let uid = 0;
/** A shaded bust in the same style as the Legatus, parameterised per commander. */
export function portraitSvg(cmd, size = 96) {
  const L = cmd.look; const id = 'cmd' + (++uid);
  const s = svg('svg', { viewBox: '0 0 120 130', width: size, height: size * 130 / 120, 'aria-hidden': 'true' });
  const grad = (gid, stops, x1 = 0, y1 = 0, x2 = 1, y2 = 1) => svg('linearGradient', { id: gid, x1, y1, x2, y2 }, stops.map(([o, c]) => svg('stop', { offset: o, 'stop-color': c })));
  s.appendChild(svg('defs', {}, grad(id + 'skin', [[0, L.skin], [0.6, shade(L.skin, -0.25)], [1, shade(L.skin, -0.5)]]), grad(id + 'cloth', [[0, shade(L.cloth, 0.15)], [0.5, L.cloth], [1, shade(L.cloth, -0.5)]]), grad(id + 'hair', [[0, shade(L.hair, 0.2)], [1, shade(L.hair, -0.4)]]),
    svg('radialGradient', { id: id + 'rim', cx: 0.15, cy: 0.2, r: 0.9 }, svg('stop', { offset: 0, 'stop-color': '#FFB347', 'stop-opacity': 0.4 }), svg('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0 }))));
  // shoulders / cloak
  s.appendChild(svg('path', { d: 'M 4 130 C 8 96, 30 82, 60 80 C 90 82, 112 96, 116 130 Z', fill: `url(#${id}cloth)` }));
  if (L.pelt) { for (let i = 0; i < 14; i++) s.appendChild(svg('path', { d: `M ${8 + i * 8} 130 l 3 -16 l 3 16 z`, fill: shade(L.cloth, 0.35), opacity: 0.8 })); }
  s.appendChild(svg('path', { d: 'M 4 130 C 10 104, 28 90, 48 84 L 44 130 Z', fill: '#000', opacity: 0.35 }));
  // neck
  s.appendChild(svg('path', { d: 'M 50 64 L 70 64 L 73 84 L 47 84 Z', fill: `url(#${id}skin)` }));
  s.appendChild(svg('path', { d: 'M 50 64 L 70 64 L 69 74 L 51 74 Z', fill: '#000', opacity: 0.35 }));
  if (L.head === 'torc') s.appendChild(svg('path', { d: 'M 42 82 a 18 10 0 0 0 36 0', fill: 'none', stroke: '#C9A227', 'stroke-width': 3.5 }));
  // hair behind the head
  if (L.hairStyle === 'long') s.appendChild(svg('path', { d: 'M 34 50 C 30 78, 36 92, 44 96 L 76 96 C 84 92, 90 78, 86 50 Z', fill: `url(#${id}hair)` }));
  if (L.hairStyle === 'wild') s.appendChild(svg('path', { d: 'M 32 46 C 24 70, 34 92, 44 92 L 76 92 C 88 90, 96 68, 88 44 L 80 56 L 72 40 L 60 48 L 48 40 L 40 56 Z', fill: `url(#${id}hair)` }));
  // head
  s.appendChild(svg('path', { d: 'M 40 40 C 38 18, 82 18, 80 40 C 80 56, 74 70, 60 72 C 46 70, 40 56, 40 40 Z', fill: `url(#${id}skin)` }));
  s.appendChild(svg('path', { d: 'M 80 40 C 80 56, 74 70, 60 72 L 60 38 Z', fill: '#000', opacity: 0.28 }));
  if (L.woad) { s.appendChild(svg('path', { d: 'M 44 48 q 8 -4 14 2 M 62 56 q 8 -6 14 0', fill: 'none', stroke: '#2E4A7A', 'stroke-width': 2, opacity: 0.8 })); }
  // features
  s.appendChild(svg('path', { d: 'M 46 44 q 7 -5 14 0 q -7 4 -14 0 z M 60 44 q 7 -5 14 0 q -7 4 -14 0 z', fill: '#1A1206' }));
  s.appendChild(svg('path', { d: 'M 46 40 q 7 -4 13 -1 M 61 39 q 7 -3 13 1', fill: 'none', stroke: shade(L.hair, -0.2), 'stroke-width': 2 }));
  s.appendChild(svg('path', { d: 'M 60 44 L 56 58 L 64 58 Z', fill: shade(L.skin, -0.35), opacity: 0.8 }));
  if (L.beard === 'full') s.appendChild(svg('path', { d: 'M 42 52 C 44 76, 76 76, 78 52 C 74 64, 46 64, 42 52 Z', fill: `url(#${id}hair)` }));
  else if (L.beard === 'moustache') s.appendChild(svg('path', { d: 'M 48 60 q 12 -6 24 0 q -4 6 -12 3 q -8 3 -12 -3 z', fill: `url(#${id}hair)` }));
  else s.appendChild(svg('path', { d: 'M 52 63 q 8 3 16 0', fill: 'none', stroke: shade(L.skin, -0.5), 'stroke-width': 1.8, 'stroke-linecap': 'round' }));
  // hair on top / headgear
  if (L.hairStyle !== 'none' && L.head !== 'corinthian' && L.head !== 'nemes') s.appendChild(svg('path', { d: L.hairStyle === 'short' ? 'M 38 38 C 40 16, 80 16, 82 38 C 76 28, 44 28, 38 38 Z' : 'M 36 40 C 36 12, 84 12, 84 40 C 80 24, 40 24, 36 40 Z', fill: `url(#${id}hair)` }));
  if (L.head === 'laurel') { for (let i = 0; i < 9; i++) { const a = -0.3 - i * 0.12; s.appendChild(svg('ellipse', { cx: 60 + Math.cos(Math.PI + a * 2.4) * 24, cy: 34 + Math.sin(Math.PI + a * 2.4) * 10, rx: 4, ry: 2, fill: '#C9A227', transform: `rotate(${a * 60} ${60 + Math.cos(Math.PI + a * 2.4) * 24} ${34 + Math.sin(Math.PI + a * 2.4) * 10})` })); s.appendChild(svg('ellipse', { cx: 60 - Math.cos(Math.PI + a * 2.4) * 24, cy: 34 + Math.sin(Math.PI + a * 2.4) * 10, rx: 4, ry: 2, fill: '#C9A227', transform: `rotate(${-a * 60} ${60 - Math.cos(Math.PI + a * 2.4) * 24} ${34 + Math.sin(Math.PI + a * 2.4) * 10})` })); } }
  if (L.head === 'diadem') s.appendChild(svg('path', { d: 'M 40 36 q 20 -8 40 0', fill: 'none', stroke: '#E3C76A', 'stroke-width': 3 }));
  if (L.head === 'corinthian') { s.appendChild(svg('path', { d: 'M 36 46 C 34 10, 86 10, 84 46 L 80 70 L 70 70 L 66 48 L 54 48 L 50 70 L 40 70 Z', fill: '#8E6B1C', stroke: '#3E2D0C', 'stroke-width': 1.5 })); s.appendChild(svg('path', { d: 'M 38 24 C 46 2, 74 2, 82 24 C 72 12, 48 12, 38 24 Z', fill: '#8B1E1E' })); for (let i = 0; i < 10; i++) s.appendChild(svg('line', { x1: 42 + i * 4, y1: 22 - Math.sin(i / 9 * Math.PI) * 6, x2: 42 + i * 4, y2: 8 - Math.sin(i / 9 * Math.PI) * 10, stroke: '#C0392B', 'stroke-width': 2.4 })); s.appendChild(svg('path', { d: 'M 48 44 q 5 -4 10 0 M 62 44 q 5 -4 10 0', fill: 'none', stroke: '#1A1206', 'stroke-width': 2 })); }
  if (L.head === 'nemes') { s.appendChild(svg('path', { d: 'M 34 36 C 36 12, 84 12, 86 36 L 92 84 L 76 70 L 72 46 L 48 46 L 44 70 L 28 84 Z', fill: '#1E6A7A' })); for (let i = 0; i < 6; i++) s.appendChild(svg('path', { d: `M ${30 + i * 2} ${44 + i * 7} L ${92 - i * 2} ${44 + i * 7}`, stroke: '#E3C76A', 'stroke-width': 2, opacity: 0.8, fill: 'none' })); s.appendChild(svg('path', { d: 'M 56 16 l 4 -8 l 4 8 z', fill: '#E3C76A' })); }
  s.appendChild(svg('rect', { x: 0, y: 0, width: 120, height: 130, fill: `url(#${id}rim)`, style: 'mix-blend-mode:screen' }));
  return s;
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
}
