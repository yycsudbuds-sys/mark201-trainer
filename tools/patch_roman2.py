import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rw(rel, pairs):
    p = os.path.join(ROOT, rel); s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        assert old in s, (rel, old[:70])
        s = s.replace(old, new)
    open(p, 'w', encoding='utf-8').write(s)

rw('app/roman.css', [
    (".runner { position: relative; z-index: 1; }\n.battlefield { position: fixed; z-index: 0; inset: 0 0 0 var(--nav-w); overflow: hidden; pointer-events: none; opacity: 0; transition: opacity 0.8s; }",
     ".shell { position: relative; z-index: 1; }\n.runner { position: relative; z-index: 1; }\n.battlefield { position: fixed; z-index: 0; inset: 0 0 0 var(--nav-w); overflow: hidden; pointer-events: none; opacity: 0; transition: opacity 0.45s; }"),
    (".map-title { font-size: 26px;", ".map-title { font-size: 21px;"),
    (".legatus { position: absolute; left: 50%; bottom: 30%; transform: translateX(-50%); width: 300px; height: 320px; filter: drop-shadow(0 20px 30px rgba(0,0,0,0.8)); animation: breathe 4s ease-in-out infinite; }\n@keyframes breathe { 0%, 100% { transform: translateX(-50%) translateY(0); } 50% { transform: translateX(-50%) translateY(-4px); } }",
     ".legatus { position: absolute; left: 4%; bottom: 4%; width: 340px; height: 380px; filter: drop-shadow(0 24px 30px rgba(0,0,0,0.85)); animation: breathe 4s ease-in-out infinite; }\n@keyframes breathe { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }"),
    (".briefing { position: absolute; left: 50%; bottom: 3%; transform: translateX(-50%); width: min(92%, 860px);", ".briefing { position: absolute; right: 3%; bottom: 5%; width: min(62%, 720px);"),
    ("@media (max-width: 700px) { .legatus { width: 210px; height: 230px; bottom: 38%; } .brief-text { font-size: 1.05rem; } .standard { display: none; } .torch .glow { width: 320px; height: 320px; } }",
     "@media (max-width: 900px) { .legatus { left: 50%; transform: translateX(-50%); width: 230px; height: 250px; bottom: auto; top: 4%; animation: none; } .briefing { right: auto; left: 50%; transform: translateX(-50%); width: 94%; bottom: 3%; } .brief-text { font-size: 1.05rem; min-height: 3.2em; } .standard { display: none; } .torch .glow { width: 320px; height: 320px; } }"),
    (".tent-table { position: absolute; left: 50%; bottom: 10%; width: 70%;", ".tent-table { position: absolute; left: 42%; bottom: 10%; width: 70%;"),
    (".tent-map { position: absolute; left: 50%; bottom: 14%; width: 48%;", ".tent-map { position: absolute; left: 42%; bottom: 14%; width: 48%;"),
])

p = os.path.join(ROOT, 'app/cutscene.js'); s = open(p, encoding='utf-8').read()
start = s.index('function legatusSvg() {'); end = s.index('function roman(n)')
new = r'''function legatusSvg() {
  const s = svg('svg', { viewBox: '0 0 340 380', 'aria-hidden': 'true' });
  s.appendChild(svg('defs', {},
    svg('linearGradient', { id: 'cloak', x1: 0, y1: 0, x2: 1, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#7A1A17' }), svg('stop', { offset: 0.5, 'stop-color': '#4E0F0F' }), svg('stop', { offset: 1, 'stop-color': '#2A0808' })),
    svg('linearGradient', { id: 'helm', x1: 0, y1: 0, x2: 1, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#D8B85A' }), svg('stop', { offset: 0.45, 'stop-color': '#8E6B1C' }), svg('stop', { offset: 1, 'stop-color': '#3E2D0C' })),
    svg('linearGradient', { id: 'skin', x1: 0, y1: 0, x2: 1, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#B98762' }), svg('stop', { offset: 0.6, 'stop-color': '#7E5438' }), svg('stop', { offset: 1, 'stop-color': '#4A2E1C' })),
    svg('linearGradient', { id: 'armor', x1: 0, y1: 0, x2: 1, y2: 1 }, svg('stop', { offset: 0, 'stop-color': '#9A8E74' }), svg('stop', { offset: 0.5, 'stop-color': '#5C5244' }), svg('stop', { offset: 1, 'stop-color': '#2E2820' })),
    svg('radialGradient', { id: 'rim', cx: 0.2, cy: 0.3, r: 0.9 }, svg('stop', { offset: 0, 'stop-color': '#FFB347', 'stop-opacity': 0.35 }), svg('stop', { offset: 1, 'stop-color': '#000', 'stop-opacity': 0 }))));
  s.appendChild(svg('path', { d: 'M 20 380 C 30 270, 90 236, 170 232 C 250 236, 310 270, 320 380 Z', fill: 'url(#cloak)' }));
  s.appendChild(svg('path', { d: 'M 20 380 C 40 300, 80 260, 120 250 L 110 380 Z', fill: '#000', opacity: 0.35 }));
  s.appendChild(svg('path', { d: 'M 100 380 C 98 300, 118 250, 170 246 C 222 250, 242 300, 240 380 Z', fill: 'url(#armor)', stroke: '#1A1410', 'stroke-width': 2 }));
  s.appendChild(svg('path', { d: 'M 135 290 q 35 22 70 0 M 128 318 q 42 22 84 0', fill: 'none', stroke: '#1A1410', 'stroke-width': 3, opacity: 0.8 }));
  s.appendChild(svg('circle', { cx: 170, cy: 268, r: 9, fill: '#C9A227', stroke: '#3E2D0C', 'stroke-width': 2 }));
  s.appendChild(svg('path', { d: 'M 150 262 L 190 262', stroke: '#C9A227', 'stroke-width': 3 }));
  s.appendChild(svg('path', { d: 'M 150 200 L 190 200 L 196 250 L 144 250 Z', fill: 'url(#skin)' }));
  s.appendChild(svg('path', { d: 'M 150 200 L 190 200 L 186 226 L 154 226 Z', fill: '#000', opacity: 0.35 }));
  s.appendChild(svg('path', { d: 'M 122 150 C 118 90, 222 90, 218 150 C 218 190, 200 222, 170 226 C 140 222, 122 190, 122 150 Z', fill: 'url(#skin)' }));
  s.appendChild(svg('path', { d: 'M 132 148 q 38 -14 76 0 l 0 10 q -38 -6 -76 0 z', fill: '#2A1409', opacity: 0.55 }));
  s.appendChild(svg('path', { d: 'M 138 160 q 12 -8 24 0 q -12 6 -24 0 z', fill: '#120A06' }));
  s.appendChild(svg('path', { d: 'M 178 160 q 12 -8 24 0 q -12 6 -24 0 z', fill: '#120A06' }));
  s.appendChild(svg('path', { d: 'M 170 162 L 160 196 L 180 196 Z', fill: '#5A3521', opacity: 0.8 }));
  s.appendChild(svg('path', { d: 'M 152 206 q 18 4 36 0', fill: 'none', stroke: '#3A1F12', 'stroke-width': 3, 'stroke-linecap': 'round' }));
  s.appendChild(svg('path', { d: 'M 128 178 C 140 226, 200 226, 212 178 L 212 196 C 200 236, 140 236, 128 196 Z', fill: '#2A1409', opacity: 0.45 }));
  s.appendChild(svg('path', { d: 'M 112 150 C 108 66, 232 66, 228 150 L 228 136 C 228 96, 112 96, 112 136 Z', fill: 'url(#helm)', stroke: '#1A1410', 'stroke-width': 2 }));
  s.appendChild(svg('path', { d: 'M 108 138 L 232 138 L 236 154 L 104 154 Z', fill: 'url(#helm)', stroke: '#1A1410', 'stroke-width': 1.5 }));
  s.appendChild(svg('path', { d: 'M 112 150 C 104 176, 112 206, 134 214 L 142 162 Z', fill: 'url(#helm)', stroke: '#1A1410', 'stroke-width': 1.5 }));
  s.appendChild(svg('path', { d: 'M 228 150 C 236 176, 228 206, 206 214 L 198 162 Z', fill: 'url(#helm)', stroke: '#1A1410', 'stroke-width': 1.5 }));
  s.appendChild(svg('path', { d: 'M 100 150 L 240 150 L 250 166 L 90 166 Z', fill: '#3E2D0C', opacity: 0.6 }));
  s.appendChild(svg('path', { d: 'M 104 104 C 112 40, 228 40, 236 104 C 220 86, 120 86, 104 104 Z', fill: '#8B1E1E', stroke: '#3A0C0C', 'stroke-width': 2 }));
  for (let i = 0; i < 16; i++) { const x = 108 + i * 8; const hgt = 28 + Math.sin(i / 15 * Math.PI) * 26; s.appendChild(svg('line', { x1: x, y1: 100 - Math.sin(i / 15 * Math.PI) * 18, x2: x + 2, y2: 100 - Math.sin(i / 15 * Math.PI) * 18 - hgt, stroke: i % 3 === 0 ? '#C0392B' : '#8B1E1E', 'stroke-width': 4, 'stroke-linecap': 'round' })); }
  s.appendChild(svg('rect', { x: 0, y: 0, width: 340, height: 380, fill: 'url(#rim)', style: 'mix-blend-mode:screen' }));
  return s;
}

'''
s = s[:start] + new + s[end:]
open(p, 'w', encoding='utf-8').write(s)
print('patched roman2')
