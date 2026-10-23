import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rw(rel, pairs):
    p = os.path.join(ROOT, rel); s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        assert old in s, (rel, old[:60])
        s = s.replace(old, new)
    open(p, 'w', encoding='utf-8').write(s)

rw('app/visuals.js', [
    ("const bell = x => Math.exp(-Math.pow((x - 0.5) / 0.19, 2));", "const bell = x => Math.max(0.045, Math.exp(-Math.pow((x - 0.5) / 0.26, 2)));"),
    ("""    s.appendChild(T(x0 + ((a + b) / 2) * W, base + 22, `${pct}%`, { class: 'vt small bold' }));
    s.appendChild(T(x0 + ((a + b) / 2) * W, base + 44, name, { class: 'vt tiny muted' }));""",
     """    const lx = x0 + ((a + b) / 2) * W; const row = (i === 0 || i === 4) ? 1 : 0;
    s.appendChild(T(lx, base + 22 + row * 34, `${pct}%`, { class: 'vt small bold' }));
    s.appendChild(T(lx, base + 40 + row * 34, name, { class: 'vt tiny muted' }));"""),
    ("const w = 760; const hgt = 300; const s = frame(w, hgt);\n  const cats = [['Innovators'", "const w = 760; const hgt = 330; const s = frame(w, hgt);\n  const cats = [['Innovators'"),
    ("s.appendChild(T(w / 2, 290, 'Time →', { class: 'vt tiny muted' }));\n  return wrap(title, h('div', null, s, cap));", "s.appendChild(T(w / 2, 318, 'Time →', { class: 'vt tiny muted' }));\n  return wrap(title, h('div', null, s, cap));"),
])
rw('app/map.js', [
    ("""    ch.topics.forEach((t, i) => {
      const a = -Math.PI / 2 + (i / ch.topics.length) * Math.PI * 2;
      const fx = isl.cx + Math.cos(a) * isl.rx * 0.5; const fy = isl.cy + Math.sin(a) * isl.ry * 0.5 + 10;""",
     """    ch.topics.forEach((t, i) => {
      const spread = Math.min(isl.rx * 1.1, 24 * (ch.topics.length - 1));
      const fx = isl.cx - spread / 2 + (ch.topics.length > 1 ? (i / (ch.topics.length - 1)) * spread : 0); const fy = isl.cy - isl.ry * 0.55;"""),
    ("""    if (next === num && !prog.boss) g.appendChild(svg('circle', { cx: isl.cx, cy: isl.cy - isl.ry - 14, r: 7, class: 'here' }));""",
     """    if (next === num && !prog.boss) g.appendChild(svg('text', { x: isl.cx + isl.rx * 0.55, y: isl.cy + isl.ry * 0.55, class: 'boat', 'text-anchor': 'middle' }, '⛵'));"""),
    ("""    const labelY = y > H / 2 + 20 ? -44 : 56;""", """    const labelY = i % 2 === 0 ? 58 : -46;"""),
    ("""  bg.appendChild(svg('text', { y: by > H / 2 + 20 ? -54 : 62, class: 'node-label', 'text-anchor': 'middle' }, prog.boss ? 'Boss beaten' : 'Boss fight'));
  bg.appendChild(svg('text', { y: by > H / 2 + 20 ? -38 : 78, class: 'node-sub', 'text-anchor': 'middle' }, allCleared ? '24 questions · 90% to clear' : 'clear every level first'));""",
     """  const bl = (n - 1) % 2 === 0 ? 66 : -54;
  bg.appendChild(svg('text', { y: bl, class: 'node-label', 'text-anchor': 'middle' }, prog.boss ? 'Boss beaten' : 'Boss fight'));
  bg.appendChild(svg('text', { y: bl + 16, class: 'node-sub', 'text-anchor': 'middle' }, allCleared ? '24 questions · 90% to clear' : 'clear every level first'));"""),
    ("pts.push([110 + t * (W - 220), H / 2 + 20 + Math.sin(t * Math.PI * 2.2 + 0.4) * 95]);", "pts.push([110 + t * (W - 220), H / 2 + 10 + Math.sin(t * Math.PI * 2.2 + 0.4) * 70]);"),
])
rw('app/game.css', [
    (".here { fill: #FFB84D; animation: pulse 1.2s ease-in-out infinite; }", ".here { fill: #FFB84D; animation: pulse 1.2s ease-in-out infinite; }\n.boat { font-size: 26px; animation: bob 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }"),
])
rw('app/views/runner.js', [
    ("import { conceptCard } from './concept.js';", "import { conceptCard } from './concept.js';\nimport { visualFor } from '../visuals.js';"),
    ("""        (!correct || cfg.showLearnAlways) ? h('details', { class: 'learn-more', open: !correct && cfg.showLearnOnWrong !== false }, h('summary', null, 'Review this concept'), conceptCard(app, q.concept, { compact: true, showMastery: false })) : h('details', { class: 'learn-more' }, h('summary', null, 'Review this concept'), conceptCard(app, q.concept, { compact: true, showMastery: false })),""",
     """        h('details', { class: 'learn-more', open: !correct && cfg.showLearnOnWrong !== false }, h('summary', null, 'Review this concept'), conceptCard(app, q.concept, { compact: true, showMastery: false }), safeVisual(entry)),"""),
    ("export function resultCard(app, title, sum, extra) {", "function safeVisual(entry) { try { return visualFor(entry.concept, entry.chapter); } catch { return null; } }\n\nexport function resultCard(app, title, sum, extra) {"),
])
print('patched')
