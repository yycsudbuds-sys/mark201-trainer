"""Wire the stylized-realism layer: scenes behind lessons/modes, scroll container, rich question text, shields."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rw(rel, pairs, must=True):
    p = os.path.join(ROOT, rel); s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        if old not in s:
            if must: raise AssertionError((rel, old[:90]))
            continue
        s = s.replace(old, new)
    open(p, 'w', encoding='utf-8').write(s)

rw('index.html', [
    ('<link rel="stylesheet" href="app/roman.css">', '<link rel="stylesheet" href="app/roman.css">\n  <link rel="stylesheet" href="app/fidelity.css">'),
])
rw('sw.js', [("'./app/roman.css',", "'./app/roman.css', './app/fidelity.css', './app/scenes.js', './app/icons.js',")])

# ---- runner: rich text, scene per mode ----
rw('app/views/runner.js', [
    ("import { attachBattlefield } from '../battlefield.js';", "import { attachBattlefield } from '../battlefield.js';\nimport { attachScene } from '../scenes.js';\nimport { richText } from '../icons.js';"),
    ("    card.appendChild(h('div', { class: 'stem', html: stemHtml(q) }));\n    const optEls = options.map((o, i) => h('button', { class: 'option', dataset: { i }, onClick: () => choose(i) }, h('span', { class: 'key' }, String(i + 1)), h('span', null, o)));",
     "    card.appendChild(h('div', { class: 'stem' }, richText(q.stem)));\n    const optEls = options.map((o, i) => h('button', { class: 'option', dataset: { i }, onClick: () => choose(i) }, h('span', { class: 'key' }, h('span', { class: 'key-n' }, String(i + 1))), h('span', { class: 'opt-text' }, richText(o, { blanks: false }))));"),
    ("  const bf = attachBattlefield(el);", "  const sceneKind = cfg.scene || 'battlefield';\n  const bf = sceneKind === 'battlefield' ? attachBattlefield(el) : attachScene(el, sceneKind, { blur: sceneKind === 'chariot' ? 7 : 5, tint: 0.5 });\n  if (sceneKind !== 'battlefield') { el.battlefield = { advance: () => bf.cheer(), setback: () => bf.jeer() }; }"),
])

# ---- lesson: scroll + province scene + rich mini question ----
rw('app/views/lesson.js', [
    ("import { conceptCard } from './concept.js';", "import { conceptCard } from './concept.js';\nimport { attachScene, PROVINCE_SCENE } from '../scenes.js';\nimport { richText } from '../icons.js';"),
    ("  const stage = h('div', { class: 'lesson-stage' });\n  const foot = h('div', { class: 'lesson-foot' });\n  el.append(top, stage, foot);",
     "  const stage = h('div', { class: 'lesson-stage' });\n  const foot = h('div', { class: 'lesson-foot' });\n  const scroll = h('div', { class: 'scroll' }, h('div', { class: 'scroll-roller top', 'aria-hidden': 'true' }), h('div', { class: 'scroll-paper' }, stage), h('div', { class: 'scroll-roller bottom', 'aria-hidden': 'true' }));\n  el.append(top, scroll, foot);\n  if (chapter && PROVINCE_SCENE[chapter.chapter]) attachScene(el, PROVINCE_SCENE[chapter.chapter], { blur: 10, tint: 0.42 });"),
    ("  el.cleanup = () => document.removeEventListener('keydown', onKey);\n  draw(1);\n  return el;", "  const prevCleanup = el.cleanup;\n  el.cleanup = () => { document.removeEventListener('keydown', onKey); prevCleanup && prevCleanup(); };\n  draw(1);\n  return el;"),
    ("  const stem = h('div', { class: 'stem', html: q.stem.replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])).replace(/_{3,}/g, '<span class=\"blank\"></span>') });",
     "  const stem = h('div', { class: 'stem' }, richText(q.stem));"),
    ("  const opts = options.map((o, i) => h('button', { class: 'option', onClick: () => pick(i) }, h('span', { class: 'key' }, String(i + 1)), h('span', null, o)));",
     "  const opts = options.map((o, i) => h('button', { class: 'option', onClick: () => pick(i) }, h('span', { class: 'key' }, h('span', { class: 'key-n' }, String(i + 1))), h('span', { class: 'opt-text' }, richText(o, { blanks: false }))));"),
])

# ---- arcade: mode scenes ----
rw('app/views/arcade.js', [
    ("import { conceptCard, masteryChip, figureEl } from './concept.js';", "import { conceptCard, masteryChip, figureEl } from './concept.js';\nimport { attachScene } from '../scenes.js';"),
    ("title: 'Skirmish', subtitle: 'Fast. Short. Three lives.', mode: 'blitz',", "title: 'Skirmish', subtitle: 'Fast. Short. Three lives.', mode: 'blitz', scene: 'chariot',"),
    ("title: 'Gladiator Duel', subtitle: '15 rounds · 20 s each · 3 lives', mode: 'duel',", "title: 'Gladiator Duel', subtitle: '15 rounds · 20 s each · 3 lives', mode: 'duel', scene: 'colosseum',"),
    ("  const host = h('div', { class: 'runner' });\n  if (!deck.length) { host.appendChild(h('div', { class: 'empty' }, 'No cards match this deck. ', h('a', { href: '#/arcade/flash' }, 'Change the filter'))); return host; }",
     "  const host = h('div', { class: 'runner flash-host' });\n  if (!deck.length) { host.appendChild(h('div', { class: 'empty' }, 'No cards match this deck. ', h('a', { href: '#/arcade/flash' }, 'Change the filter'))); return host; }\n  attachScene(host, 'library', { blur: 6, tint: 0.4 });"),
    ("  document.addEventListener('keydown', onKey);\n  host.cleanup = () => document.removeEventListener('keydown', onKey);\n  return host;\n}", "  document.addEventListener('keydown', onKey);\n  const prevCleanup = host.cleanup;\n  host.cleanup = () => { document.removeEventListener('keydown', onKey); prevCleanup && prevCleanup(); };\n  return host;\n}"),
])
print('fidelity wiring applied')
