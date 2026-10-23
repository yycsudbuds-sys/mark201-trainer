// The front-line band: a fixed strip along the bottom of battle screens where the clash always stays visible.
// Silhouette legion (curved scuta with wings and bolts, crested galeae, pila, signifer, aquilifer) against a
// provincial enemy line. Reactions are CSS-driven so they never delay the quiz.
import { svg } from './visuals.js';

const ENEMY = {
  italia: { shield: 'scutum', color: '#5A4A6A', trim: '#C9A227', name: 'rebel legion' },
  hispania: { shield: 'caetra', color: '#6B4A2A', trim: '#B9B2A5', name: 'Iberian caetrati' },
  gallia: { shield: 'oval', color: '#2F5A4A', trim: '#D9A441', name: 'Gallic warband' },
  britannia: { shield: 'oval', color: '#2E4A7A', trim: '#CFE6F0', name: 'Britons' },
  germania: { shield: 'round', color: '#3A2A1E', trim: '#8A8F99', name: 'Germanic warband' },
  graecia: { shield: 'hoplon', color: '#8A2A1E', trim: '#E8DCC2', name: 'hoplite phalanx' },
  asia: { shield: 'round', color: '#7A4A1E', trim: '#E3C76A', name: 'archers and cataphracts' },
  aegyptus: { shield: 'tall', color: '#1E6A7A', trim: '#E3C76A', name: 'Ptolemaic line' },
  default: { shield: 'round', color: '#3A3F47', trim: '#8A8F99', name: 'enemy' },
};

function scutum(g, x, y, w, hgt, fill, emblem = true) {
  g.appendChild(svg('path', { d: `M ${x} ${y + 4} Q ${x} ${y} ${x + 4} ${y} L ${x + w - 4} ${y} Q ${x + w} ${y} ${x + w} ${y + 4} L ${x + w} ${y + hgt - 4} Q ${x + w} ${y + hgt} ${x + w - 4} ${y + hgt} L ${x + 4} ${y + hgt} Q ${x} ${y + hgt} ${x} ${y + hgt - 4} Z`, fill, stroke: '#2A0808', 'stroke-width': 1.2 }));
  g.appendChild(svg('path', { d: `M ${x + w * 0.5} ${y} L ${x + w * 0.5} ${y + hgt}`, stroke: 'rgba(255,220,180,0.18)', 'stroke-width': 1 }));
  if (emblem) {
    // wings and lightning bolts
    g.appendChild(svg('path', { d: `M ${x + w * 0.5} ${y + hgt * 0.5} m -1 -4 l -5 -5 m 6 5 l 5 -5 m -6 7 l -6 3 m 7 -3 l 6 3`, stroke: '#E3C76A', 'stroke-width': 1.1, fill: 'none' }));
    g.appendChild(svg('path', { d: `M ${x + w * 0.22} ${y + hgt * 0.25} l 3 4 l -2 1 l 3 5 M ${x + w * 0.78} ${y + hgt * 0.25} l -3 4 l 2 1 l -3 5`, stroke: '#E3C76A', 'stroke-width': 1.1, fill: 'none' }));
  }
  g.appendChild(svg('circle', { cx: x + w / 2, cy: y + hgt / 2, r: 3.2, fill: '#C9A227', stroke: '#6B4B12', 'stroke-width': 0.8 }));
}
function enemyShield(g, kind, x, y, w, hgt, fill, trim) {
  if (kind === 'oval') g.appendChild(svg('ellipse', { cx: x + w / 2, cy: y + hgt / 2, rx: w / 2, ry: hgt / 2, fill, stroke: trim, 'stroke-width': 1.2 }));
  else if (kind === 'round' || kind === 'hoplon' || kind === 'caetra') { const r = kind === 'caetra' ? w * 0.42 : w * 0.62; g.appendChild(svg('circle', { cx: x + w / 2, cy: y + hgt * 0.45, r, fill, stroke: trim, 'stroke-width': 1.4 })); if (kind === 'hoplon') g.appendChild(svg('path', { d: `M ${x + w / 2 - 6} ${y + hgt * 0.45 - 4} l 6 -6 l 6 6 l -6 10 z`, fill: trim })); }
  else if (kind === 'tall') g.appendChild(svg('path', { d: `M ${x} ${y + hgt} L ${x} ${y + 8} Q ${x + w / 2} ${y - 4} ${x + w} ${y + 8} L ${x + w} ${y + hgt} Z`, fill, stroke: trim, 'stroke-width': 1.2 }));
  else scutum(g, x, y, w, hgt, fill, false);
}
function helmet(g, x, y, crest = true, color = '#C9A227') {
  g.appendChild(svg('path', { d: `M ${x - 7} ${y + 6} a 7 7 0 0 1 14 0 v 3 h -14 z`, fill: color, stroke: '#3E2D0C', 'stroke-width': 0.8 }));
  g.appendChild(svg('path', { d: `M ${x - 8} ${y + 9} h 16 l 1 3 h -18 z`, fill: '#8E6B1C' }));
  if (crest) g.appendChild(svg('path', { d: `M ${x - 6} ${y + 2} q 6 -9 12 0 q -6 -3 -12 0 z`, fill: '#8B1E1E' }));
}
function pilum(g, x, y1, y2) { g.appendChild(svg('line', { x1: x, y1, x2: x, y2, stroke: '#B9B2A5', 'stroke-width': 1.3 })); g.appendChild(svg('path', { d: `M ${x} ${y1 - 7} l 2 7 h -4 z`, fill: '#D9D4C8' })); }
function head(g, x, y, skin = '#8A5A3C') { g.appendChild(svg('circle', { cx: x, cy: y, r: 5.2, fill: skin })); }

/**
 * createBand({ province }) -> element (.battle-band) with advance(), setback(), streak(n), win(), setPursuits(n)
 */
export function createBand({ province = 'default' } = {}) {
  const en = ENEMY[province] || ENEMY.default;
  const W = 1400; const H = 220;
  const root = document.createElement('div'); root.className = 'battle-band'; root.setAttribute('aria-hidden', 'true');
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMax slice' });
  // ground band with dust haze
  s.appendChild(svg('defs', {}, svg('linearGradient', { id: 'bbGround', x1: 0, y1: 0, x2: 0, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#4A3A26', 'stop-opacity': 0 }), svg('stop', { offset: 0.4, 'stop-color': '#3A2C1C', 'stop-opacity': 0.85 }), svg('stop', { offset: 1, 'stop-color': '#160F09' })),
    svg('radialGradient', { id: 'bbDust', cx: 0.5, cy: 1, r: 0.7 }, svg('stop', { offset: 0, 'stop-color': '#CDBA92', 'stop-opacity': 0.35 }), svg('stop', { offset: 1, 'stop-color': '#CDBA92', 'stop-opacity': 0 }))));
  s.appendChild(svg('rect', { x: 0, y: 60, width: W, height: H - 60, fill: 'url(#bbGround)' }));
  s.appendChild(svg('ellipse', { cx: W / 2, cy: H, rx: 420, ry: 90, fill: 'url(#bbDust)', class: 'bb-haze' }));

  // ---- legion (left): three ranks, back to front ----
  const legion = svg('g', { class: 'bb-legion' });
  const ranks = [[150, 0.78, 11], [172, 0.9, 11], [196, 1, 12]];
  ranks.forEach(([base, scale, n], r) => {
    for (let i = 0; i < n; i++) {
      const x = 40 + i * 42 - r * 16; const y = base;
      const g = svg('g', { class: 'bb-unit', style: `transform-origin:${x + 14}px ${y}px; animation-delay:${(i * 0.13 + r * 0.2).toFixed(2)}s` });
      head(g, x + 14, y - 30 * scale);
      helmet(g, x + 14, y - 38 * scale, true);
      g.appendChild(svg('rect', { x: x + 8, y: y - 26 * scale, width: 12, height: 22 * scale, rx: 3, fill: '#8B1E1E' }));
      pilum(g, x + 24, y - 60 * scale, y);
      scutum(g, x, y - 24 * scale, 28, 36 * scale, r === 2 ? '#8B1E1E' : '#731818');
      g.appendChild(svg('rect', { x: x + 6, y, width: 5, height: 10, fill: '#3B2A17' })); g.appendChild(svg('rect', { x: x + 16, y, width: 5, height: 10, fill: '#3B2A17' }));
      legion.appendChild(g);
    }
  });
  // signifer and aquilifer at the front
  const sig = svg('g', { class: 'bb-unit bb-signifer', style: 'transform-origin:520px 196px' });
  sig.appendChild(svg('line', { x1: 522, y1: 196, x2: 522, y2: 70, stroke: '#C9A227', 'stroke-width': 3 }));
  sig.appendChild(svg('rect', { x: 506, y: 78, width: 32, height: 22, fill: '#8B1E1E', stroke: '#C9A227', 'stroke-width': 1.5 }));
  sig.appendChild(svg('text', { x: 522, y: 94, 'text-anchor': 'middle', 'font-size': 10, fill: '#E3C76A', 'font-family': 'Cinzel, serif', 'font-weight': 700 }, 'SPQR'));
  [104, 118, 132].forEach(y => sig.appendChild(svg('circle', { cx: 522, cy: y, r: 6, fill: '#C9A227', stroke: '#6B4B12' })));
  head(sig, 508, 170); helmet(sig, 508, 162, false, '#8E6B1C'); sig.appendChild(svg('ellipse', { cx: 508, cy: 158, rx: 11, ry: 7, fill: '#B5623A' }));
  sig.appendChild(svg('rect', { x: 500, y: 176, width: 16, height: 22, rx: 4, fill: '#6B4B12' }));
  legion.appendChild(sig);
  const aq = svg('g', { class: 'bb-unit bb-aquilifer', style: 'transform-origin:560px 196px' });
  aq.appendChild(svg('line', { x1: 562, y1: 196, x2: 562, y2: 60, stroke: '#C9A227', 'stroke-width': 3 }));
  aq.appendChild(svg('path', { d: 'M 562 58 l -14 8 l 9 -2 l -3 10 l 8 -8 l 8 8 l -3 -10 l 9 2 z', fill: '#E3C76A', stroke: '#6B4B12', 'stroke-width': 1 }));
  aq.appendChild(svg('rect', { x: 548, y: 72, width: 28, height: 14, fill: '#C9A227' }));
  head(aq, 548, 170); helmet(aq, 548, 162, false, '#8E6B1C'); aq.appendChild(svg('ellipse', { cx: 548, cy: 158, rx: 11, ry: 7, fill: '#E3C76A' }));
  aq.appendChild(svg('rect', { x: 540, y: 176, width: 16, height: 22, rx: 4, fill: '#6B4B12' }));
  legion.appendChild(aq);
  // pila volley (hidden until a correct answer)
  const volley = svg('g', { class: 'bb-volley' });
  for (let i = 0; i < 7; i++) volley.appendChild(svg('line', { x1: 560 + i * 18, y1: 150 - i * 4, x2: 575 + i * 18, y2: 135 - i * 4, stroke: '#D9D4C8', 'stroke-width': 1.6, style: `animation-delay:${i * 0.03}s` }));
  s.appendChild(legion); s.appendChild(volley);

  // ---- enemy (right) ----
  const enemy = svg('g', { class: 'bb-enemy' });
  const eranks = [[150, 0.78, 9], [172, 0.9, 9], [196, 1, 10]];
  eranks.forEach(([base, scale, n], r) => {
    for (let i = 0; i < n; i++) {
      const x = W - 70 - i * 44 + r * 14; const y = base;
      const g = svg('g', { class: 'bb-unit bb-foe', style: `transform-origin:${x + 14}px ${y}px; animation-delay:${(i * 0.11 + r * 0.17).toFixed(2)}s` });
      head(g, x + 14, y - 30 * scale, '#9A6A4A');
      if (province === 'graecia' || province === 'italia') helmet(g, x + 14, y - 38 * scale, province === 'graecia', province === 'graecia' ? '#B9B2A5' : '#8E6B1C');
      else g.appendChild(svg('path', { d: `M ${x + 8} ${y - 32 * scale} q 6 -8 12 0 l 2 6 h -16 z`, fill: '#3B2A17' }));
      g.appendChild(svg('rect', { x: x + 8, y: y - 26 * scale, width: 12, height: 22 * scale, rx: 3, fill: en.color }));
      g.appendChild(svg('line', { x1: x + 4, y1: y - 58 * scale, x2: x + 4, y2: y, stroke: '#8A8F99', 'stroke-width': 1.3 }));
      enemyShield(g, en.shield, x, y - 24 * scale, 28, 36 * scale, en.color, en.trim);
      g.appendChild(svg('rect', { x: x + 6, y, width: 5, height: 10, fill: '#2A1C14' })); g.appendChild(svg('rect', { x: x + 16, y, width: 5, height: 10, fill: '#2A1C14' }));
      enemy.appendChild(g);
    }
  });
  s.appendChild(enemy);
  // pursuit flags (enemy standards planted in the field)
  const flags = svg('g', { class: 'bb-flags' }); s.appendChild(flags);
  // cavalry sweep (streak 5)
  const cav = svg('g', { class: 'bb-cavalry' });
  for (let i = 0; i < 4; i++) { const x = i * 90; cav.appendChild(svg('path', { d: `M ${x} 190 l 10 -14 l 26 -4 l 14 -16 l 8 2 l -4 10 l 14 6 l 6 -12 l 4 0 l -2 20 l -6 8 l -22 2 l -8 -6 l -14 4 l -8 10 z`, fill: '#1A1410' })); cav.appendChild(svg('circle', { cx: x + 36, cy: 160, r: 5, fill: '#1A1410' })); cav.appendChild(svg('rect', { x: x + 30, y: 164, width: 10, height: 12, rx: 3, fill: '#8B1E1E' })); cav.appendChild(svg('line', { x1: x + 44, y1: 150, x2: x + 60, y2: 132, stroke: '#D9D4C8', 'stroke-width': 1.5 })); }
  s.appendChild(cav);
  // red vignette flash
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'bb-flash' }));
  root.appendChild(s);

  let adv = 0;
  function pulse(cls) { root.classList.remove('adv', 'setback', 'testudo', 'charge', 'win'); void root.offsetWidth; root.classList.add(cls); }
  const apply = () => { root.style.setProperty('--adv', `${adv * 22}px`); root.style.setProperty('--ret', `${adv * 8}px`); };
  root.advance = (streak = 0) => { adv = Math.min(adv + 1, 12); apply(); pulse(streak >= 5 ? 'charge' : streak >= 3 ? 'testudo' : 'adv'); };
  root.setback = () => { adv = Math.max(adv - 1, 0); apply(); pulse('setback'); };
  root.win = () => { pulse('win'); };
  root.setPursuits = n => {
    flags.innerHTML = '';
    for (let i = 0; i < Math.min(n, 6); i++) { const x = 700 + i * 46; flags.appendChild(svg('g', { class: 'bb-flag', style: `animation-delay:${i * 0.1}s` }, svg('line', { x1: x, y1: 198, x2: x, y2: 150, stroke: '#3A3F47', 'stroke-width': 2 }), svg('path', { d: `M ${x} 150 l 18 6 l -18 6 z`, fill: en.color, stroke: en.trim, 'stroke-width': 0.8 }))); }
  };
  root.show = () => requestAnimationFrame(() => root.classList.add('on'));
  root.destroy = () => { root.classList.remove('on'); document.body.classList.remove('has-band'); setTimeout(() => root.remove(), 500); };
  root.enemyName = en.name;
  return root;
}

/** Mount the band for a runner. Returns the band; chained into runnerEl.cleanup. */
export function attachBand(runnerEl, { province } = {}) {
  const band = createBand({ province });
  document.body.appendChild(band);
  document.body.classList.add('has-band');
  band.show();
  const prev = runnerEl.cleanup;
  runnerEl.cleanup = () => { band.destroy(); prev && prev(); };
  runnerEl.battlefield = band;
  return band;
}
// Backwards-compatible name used by older code paths.
export const attachBattlefield = attachBand;
