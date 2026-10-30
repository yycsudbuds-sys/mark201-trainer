// FIN 201 province scenes: the eastern campaign, painted with the same kit as the marketing provinces.
import { KIT } from '../../scenes.js';

const { W, H, svg, rnd, lin, rad, sky, sun, ridge, pines, cypress, roundTree, palm, temple, aqueduct, tower, ground, mist, motes, flame, smoke, stars } = KIT;

export const FIN_SCENES = {
  /** Illyricum: the Adriatic at dusk, limestone cliffs, a harbour tower at Salona. */
  illyricum(s, d, a) {
    sky(s, d, [[0, '#2A2F5E'], [0.45, '#8E5A7A'], [0.75, '#E8A070'], [1, '#F6D6A6']]);
    sun(s, d, 420, 520, 60, '#FFD9A0', 4);
    s.appendChild(svg('rect', { x: 0, y: 560, width: W, height: 340, fill: lin(d, [[0, '#E8A070', 0.8], [0.25, '#4E7E96'], [1, '#17334A']]) }));
    for (let i = 0; i < 18; i++) s.appendChild(svg('path', { d: `M ${i * 95 - 40} ${600 + (i % 3) * 40} q 24 -6 48 0`, stroke: '#F6E7C8', 'stroke-opacity': 0.35, 'stroke-width': 2, fill: 'none' }));
    ridge(s, 470, 60, '#6E6A7A', 101, 0.9); ridge(s, 540, 50, '#5A5E64', 102, 1.3, 0.35);
    s.appendChild(svg('path', { d: 'M 900 900 L 900 620 L 1120 560 L 1600 600 L 1600 900 Z', fill: lin(d, [[0, '#B9B2A5'], [1, '#6E6A5E']]) }));
    tower(s, 1130, 575, 60, 130, '#8E8470'); temple(s, 1380, 600, 180, 110, '#C8BCA4', 6, '#E6DCC8');
    [[960, 640, 150], [1010, 660, 120], [1500, 650, 130]].forEach(([x, b, hgt]) => cypress(s, x, b, hgt, '#1F2A14'));
    s.appendChild(svg('path', { d: 'M 0 900 L 0 760 L 180 720 L 420 760 L 520 900 Z', fill: '#2E3426' }));
    ground(s, d, 880, '#2E3426', '#121810');
    mist(a, d, 600, 60, '#F6D6A6', 0.2, 26); motes(a, 20, '#FFE4B0', 103, [0, 250, W, 500]);
  },
  /** Pannonia: the Danube plain under a grey sky, reeds, a legion camp palisade and its smoke. */
  pannonia(s, d, a) {
    sky(s, d, [[0, '#4E5A6E'], [0.55, '#8E9AA6'], [1, '#C8CCC4']]);
    sun(s, d, 1240, 300, 44, '#E8EEF2', 3);
    ridge(s, 560, 24, '#6E7A6A', 111, 0.6, 0.1);
    s.appendChild(svg('path', { d: 'M 0 700 C 400 660, 700 740, 1000 700 S 1400 660, 1600 700 L 1600 760 C 1300 740, 1000 790, 700 760 S 300 730, 0 770 Z', fill: lin(d, [[0, '#8EA0A6'], [1, '#4E6670']]) }));
    s.appendChild(svg('rect', { x: 180, y: 600, width: 560, height: 60, fill: '#5A4330' })); for (let i = 0; i < 28; i++) s.appendChild(svg('rect', { x: 184 + i * 20, y: 586, width: 12, height: 18, fill: '#5A4330' }));
    tower(s, 200, 600, 46, 100, '#4A3418'); tower(s, 720, 600, 46, 100, '#4A3418');
    for (let i = 0; i < 6; i++) s.appendChild(svg('path', { d: `M ${300 + i * 70} 600 l 22 -34 l 22 34 z`, fill: '#E6D3A8' }));
    pines(s, 590, 14, '#3A4A2E', 50, 90, 112, 900, 1600);
    for (let i = 0; i < 40; i++) s.appendChild(svg('path', { d: `M ${i * 40 + 10} 800 q 6 -40 2 -70`, stroke: '#6E7A3F', 'stroke-width': 3, fill: 'none', opacity: 0.8 }));
    ground(s, d, 790, '#4E5E36', '#1A2414');
    smoke(a, d, 470, 560, 40); mist(a, d, 720, 60, '#DDE4E0', 0.4, 28); mist(a, d, 820, 50, '#DDE4E0', 0.3, 20, true);
  },
  /** Dacia: the Carpathians at dawn, pine slopes, Sarmizegetusa on its crag, the glow of the gold mines. */
  dacia(s, d, a) {
    sky(s, d, [[0, '#1E2A48'], [0.5, '#7E5A6E'], [0.8, '#E6A06A'], [1, '#F6D8A6']]);
    stars(s, 40, 121, H * 0.3);
    sun(s, d, 300, 470, 50, '#FFD9A0', 4);
    ridge(s, 420, 90, '#5E5A7A', 122, 0.8, 0.5); ridge(s, 500, 70, '#4A4E5E', 123, 1.1, 0.4);
    s.appendChild(svg('path', { d: 'M 980 560 L 1060 420 L 1180 440 L 1240 560 Z', fill: '#5A5248' }));
    tower(s, 1100, 440, 50, 90, '#7A6E5A'); tower(s, 1040, 470, 34, 60, '#7A6E5A'); tower(s, 1180, 470, 34, 60, '#7A6E5A');
    s.appendChild(svg('rect', { x: 1030, y: 456, width: 170, height: 14, fill: '#7A6E5A' }));
    ridge(s, 600, 60, '#3E5A3E', 124, 1.0); pines(s, 640, 34, '#1F3A24', 60, 130, 125);
    ridge(s, 720, 50, '#2E4A30', 126, 1.4); pines(s, 760, 40, '#16281A', 50, 110, 127);
    s.appendChild(svg('ellipse', { cx: 560, cy: 800, rx: 120, ry: 26, fill: rad(d, [[0, '#E3C76A', 0.6], [1, '#E3C76A', 0]]) }));
    ground(s, d, 820, '#1E2E1C', '#0A120A');
    flame(a, d, 560, 790, 10); mist(a, d, 560, 80, '#E6A06A', 0.25, 30); motes(a, 26, '#FFE4B0', 128, [300, 500, 600, 320]);
  },
  /** Thracia: the walls of Byzantium above the Bosporus at sunset, triremes in the strait. */
  thracia(s, d, a) {
    sky(s, d, [[0, '#5E2A3E'], [0.45, '#C86A3C'], [0.8, '#F0B06A'], [1, '#F8E1B0']]);
    sun(s, d, 1150, 500, 80, '#FFE0A0', 3.5);
    ridge(s, 540, 30, '#A97A6A', 131, 0.7, 0.2);
    s.appendChild(svg('rect', { x: 0, y: 620, width: W, height: 280, fill: lin(d, [[0, '#F0B06A', 0.7], [0.3, '#3E6E8E'], [1, '#1A3448']]) }));
    s.appendChild(svg('path', { d: 'M 0 900 L 0 640 L 260 600 L 700 580 L 900 620 L 900 900 Z', fill: '#6E5A4A' }));
    s.appendChild(svg('rect', { x: 120, y: 540, width: 700, height: 60, fill: '#8E7A62' })); for (let i = 0; i < 24; i++) s.appendChild(svg('rect', { x: 126 + i * 29, y: 526, width: 16, height: 16, fill: '#8E7A62' }));
    [220, 460, 700].forEach(x => tower(s, x, 540, 56, 120, '#7A6650'));
    temple(s, 560, 530, 160, 100, '#B9A88A', 6, '#D9CDB4');
    [[1000, 700], [1250, 740], [1420, 690]].forEach(([x, y]) => { s.appendChild(svg('path', { d: `M ${x - 40} ${y} q 40 14 80 0 l -10 -10 h -60 z`, fill: '#3B2A17' })); s.appendChild(svg('path', { d: `M ${x} ${y - 10} l 0 -46 l 34 30 z`, fill: '#F0E1BC' })); });
    [[60, 860, 120], [1540, 880, 110]].forEach(([x, b, hgt]) => cypress(s, x, b, hgt, '#1F2A14'));
    ground(s, d, 870, '#3A2A24', '#140E0C');
    mist(a, d, 640, 50, '#FFD9A0', 0.22, 24); motes(a, 22, '#FFE4B0', 132, [0, 200, W, 600]);
  },
  /** Cappadocia: fairy chimneys and rock-cut dwellings in warm stone, a clear high sky. */
  cappadocia(s, d, a) {
    sky(s, d, [[0, '#5A7EA6'], [0.55, '#BCCBD6'], [1, '#F2DCB8']]);
    sun(s, d, 1300, 240, 60, '#FFF4D0', 3);
    ridge(s, 560, 40, '#C9A27A', 141, 0.7, 0.15);
    const r = rnd(142);
    for (let i = 0; i < 14; i++) { const x = 90 + i * 115 + r() * 30; const hgt = 120 + r() * 160; const w = 40 + r() * 30; s.appendChild(svg('path', { d: `M ${x - w} 700 Q ${x - w * 0.6} ${700 - hgt * 0.7} ${x} ${700 - hgt} Q ${x + w * 0.6} ${700 - hgt * 0.7} ${x + w} 700 Z`, fill: lin(d, [[0, '#E6C9A0'], [1, '#A9784C']], 0, 0, 1, 0) })); s.appendChild(svg('path', { d: `M ${x - w * 0.9} ${700 - hgt * 0.72} Q ${x} ${700 - hgt * 1.08} ${x + w * 0.9} ${700 - hgt * 0.72} Z`, fill: '#6E4A30' })); if (i % 2) s.appendChild(svg('rect', { x: x - 7, y: 700 - hgt * 0.4, width: 14, height: 20, rx: 6, fill: '#3B2A17' })); }
    ridge(s, 720, 24, '#B5894E', 143, 1.1, 0.12);
    for (let i = 0; i < 7; i++) roundTree(s, 200 + i * 210, 800 + (i % 2) * 10, 20, '#6E7A3F');
    ground(s, d, 800, '#B5894E', '#4E3418');
    mist(a, d, 680, 40, '#F2DCB8', 0.22, 24); motes(a, 24, '#FFF0C0', 144, [0, 200, W, 600]);
  },
  /** Syria: the Orontes valley at Antioch, colonnaded street and aqueduct, palms, heat haze. */
  syria(s, d, a) {
    sky(s, d, [[0, '#B86A3C'], [0.5, '#E6A567'], [1, '#F6E0B8']]);
    sun(s, d, 640, 380, 120, '#FFE8B0', 3.5);
    ridge(s, 540, 30, '#C58B57', 151, 0.6, 0.1);
    aqueduct(s, 100, 900, 660, 150, 8, '#8A5A34');
    temple(s, 1200, 660, 240, 160, '#B9885A', 8, '#D9B07A');
    for (let i = 0; i < 9; i++) s.appendChild(svg('rect', { x: 980 + i * 26, y: 560, width: 10, height: 100, fill: '#D9B07A' }));
    s.appendChild(svg('path', { d: 'M 0 760 C 300 740, 600 790, 900 760 S 1400 730, 1600 770 L 1600 800 C 1300 780, 1000 820, 700 790 S 300 770, 0 800 Z', fill: lin(d, [[0, '#7EA0A6'], [1, '#3E6670']]) }));
    [[140, 850, 160], [230, 870, 120], [1480, 860, 150], [1380, 880, 110], [820, 850, 100]].forEach(([x, b, hgt]) => palm(s, x, b, hgt, '#4F5E2A'));
    ground(s, d, 850, '#A9663C', '#4A2A14');
    mist(a, d, 700, 70, '#FFD9A0', 0.3, 18); mist(a, d, 800, 50, '#FFE4B0', 0.2, 22, true); motes(a, 28, '#FFE4B0', 152, [0, 200, W, 600]);
  },
};
