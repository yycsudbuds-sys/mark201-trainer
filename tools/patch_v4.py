import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rw(rel, pairs):
    p = os.path.join(ROOT, rel); s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        assert old in s, (rel, old[:70])
        s = s.replace(old, new)
    open(p, 'w', encoding='utf-8').write(s)

rw('app/map.js', [
    ("pts.push([110 + t * (W - 220), H / 2 + 10 + Math.sin(t * Math.PI * 2.2 + 0.4) * 45]);", "pts.push([150 + t * (W - 300), H / 2 + 10 + Math.sin(t * Math.PI * 2.2 + 0.4) * 45]);"),
    ("g.appendChild(svg('text', { y: labelY, class: 'node-label', 'text-anchor': 'middle' }, t.title.length > 34 ? t.title.slice(0, 32) + '…' : t.title));",
     "g.appendChild(svg('text', { y: labelY, class: 'node-label', 'text-anchor': 'middle' }, shortTitle(t.title)));"),
    ("export function nextIsland(app) {", """function shortTitle(s) {
  let t = s.split(':')[0].trim();
  if (t.length > 26) t = t.slice(0, 24).replace(/[ ,;]+$/, '') + '…';
  return t;
}

export function nextIsland(app) {"""),
])
rw('app/game.css', [
    (".node-label { font-family: var(--font-display); font-weight: 700; font-size: 14px;", ".node-label { font-family: var(--font-display); font-weight: 700; font-size: 13px;"),
])
rw('README.md', [
    ("- **Modes:** Campaign (read, then clear checkpoints, then beat a 90% boss per chapter),", "- **Campaign as a world.** The Marketing Archipelago: eight islands (chapters) connected by routes. Each island has a trail of levels (topics); a level is a slide lesson (definition, plain English, interactive diagram, confusables, quick check) followed by a checkpoint. Flags plant as checkpoints clear, islands fill with colour, and a 90% boss claims the island.\n- **Lessons are slides, not walls of text.** Every concept is chunked into short slides with ~20 bespoke interactive diagrams (PLC curve, adoption bell, break-even with a price slider, markup two ways, elasticity demo, channel flows, contact math, communication process, push/pull, funnel, matrices, continuums) plus tap-to-reveal tables for every memorization figure.\n- **Modes:** Campaign (above),"),
])
print('patched v4')
