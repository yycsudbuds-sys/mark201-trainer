// Dynamic battlefield behind the quiz. Correct -> the legion advances and the banner rises.
// Wrong -> the shield wall locks and gives ground. Pure CSS transforms: no delay to gameplay.
import { svg } from './visuals.js';

export function createBattlefield() {
  const W = 1200; const H = 700;
  const root = document.createElement('div');
  root.className = 'battlefield';
  root.setAttribute('aria-hidden', 'true');
  const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMax slice' });
  s.appendChild(svg('defs', {},
    svg('linearGradient', { id: 'bfSky', x1: 0, y1: 0, x2: 0, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#0A0806' }), svg('stop', { offset: 0.55, 'stop-color': '#2A1510' }), svg('stop', { offset: 1, 'stop-color': '#6B2A14' })),
    svg('radialGradient', { id: 'bfHaze', cx: 0.5, cy: 0.9, r: 0.8 }, svg('stop', { offset: 0, 'stop-color': '#E2581E', 'stop-opacity': 0.45 }), svg('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0 })),
    svg('linearGradient', { id: 'bfGround', x1: 0, y1: 0, x2: 0, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#3A2A1A' }), svg('stop', { offset: 1, 'stop-color': '#130D08' }))));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'bf-sky' }));
  s.appendChild(svg('rect', { x: -100, y: 0, width: W + 200, height: H, class: 'bf-haze' }));
  // far hills and a burning town silhouette
  s.appendChild(svg('path', { d: `M 0 430 Q 150 380 300 420 T 600 410 T 900 425 T ${W} 405 L ${W} ${H} L 0 ${H} Z`, class: 'bf-hills2' }));
  s.appendChild(svg('path', { d: `M 0 470 Q 200 440 400 465 T 800 455 T ${W} 468 L ${W} ${H} L 0 ${H} Z`, class: 'bf-hills' }));
  [[640, 440], [700, 436], [760, 446]].forEach(([x, y]) => { s.appendChild(svg('rect', { x: x - 14, y: y - 26, width: 28, height: 30, fill: '#120C08' })); s.appendChild(svg('ellipse', { cx: x, cy: y - 34, rx: 14, ry: 18, fill: '#FF9A3C', opacity: 0.55, class: 'bf-torch' })); });
  s.appendChild(svg('rect', { x: 0, y: 500, width: W, height: H - 500, class: 'bf-ground' }));
  // enemy line (right)
  const enemy = svg('g', { class: 'bf-enemy' });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) {
    const x = 760 + i * 44 + r * 14; const y = 560 + r * 34;
    enemy.appendChild(svg('rect', { x, y, width: 26, height: 40, rx: 4, class: 'bf-shield' }));
    enemy.appendChild(svg('line', { x1: x + 13, y1: y - 30, x2: x + 13, y2: y, class: 'bf-pilum' }));
  }
  s.appendChild(enemy);
  // Roman legion (left): three ranks of scuta with pila, standards and the eagle
  const legion = svg('g', { class: 'bf-legion' });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 10; i++) {
    const x = 120 + i * 44 - r * 14; const y = 560 + r * 34;
    legion.appendChild(svg('line', { x1: x + 13, y1: y - 46, x2: x + 13, y2: y, class: 'bf-pilum' }));
    legion.appendChild(svg('rect', { x, y, width: 28, height: 44, rx: 5, class: 'bf-shield' }));
    legion.appendChild(svg('circle', { cx: x + 14, cy: y + 22, r: 3.2, class: 'bf-boss' }));
  }
  // standards
  [[200, 620], [380, 626]].forEach(([x, y]) => { legion.appendChild(svg('line', { x1: x, y1: y, x2: x, y2: y - 150, class: 'bf-standard' })); legion.appendChild(svg('rect', { x: x - 16, y: y - 148, width: 32, height: 20, fill: '#8B1E1E', stroke: '#C9A227' })); legion.appendChild(svg('circle', { cx: x, cy: y - 158, r: 7, class: 'bf-eagle' })); });
  // the banner (vexillum) that rises on a correct answer
  legion.appendChild(svg('line', { x1: 300, y1: 640, x2: 300, y2: 430, class: 'bf-standard' }));
  legion.appendChild(svg('path', { d: 'M 300 432 L 300 470 L 360 470 L 360 432 Z', class: 'bf-banner' }));
  legion.appendChild(svg('path', { d: 'M 290 426 L 300 414 L 310 426 Z', class: 'bf-eagle' }));
  s.appendChild(legion);
  // dust puff and red flash overlay
  s.appendChild(svg('ellipse', { cx: 560, cy: 650, rx: 90, ry: 18, class: 'bf-dust' }));
  s.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, class: 'bf-flash' }));
  root.appendChild(s);
  let adv = 0;
  function pulse(cls) {
    root.classList.remove('adv', 'setback'); void root.offsetWidth; // restart animations instantly
    root.classList.add(cls);
  }
  root.advance = () => { adv = Math.min(adv + 1, 10); root.style.setProperty('--adv', `${adv * 28}px`); root.style.setProperty('--ret', `${adv * 10}px`); pulse('adv'); };
  root.setback = () => { adv = Math.max(adv - 1, 0); root.style.setProperty('--adv', `${adv * 28}px`); root.style.setProperty('--ret', `${adv * 10}px`); pulse('setback'); };
  root.show = () => requestAnimationFrame(() => root.classList.add('on'));
  root.destroy = () => { root.classList.remove('on'); setTimeout(() => root.remove(), 600); };
  return root;
}

/** Mount a battlefield behind a runner element; returns the battlefield. */
export function attachBattlefield(runnerEl) {
  const bf = createBattlefield();
  document.body.appendChild(bf);
  bf.show();
  const prevCleanup = runnerEl.cleanup;
  runnerEl.cleanup = () => { bf.destroy(); prevCleanup && prevCleanup(); };
  runnerEl.battlefield = bf;
  return bf;
}
