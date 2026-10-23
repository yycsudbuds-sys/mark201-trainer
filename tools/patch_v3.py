import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def rw(rel, pairs):
    p = os.path.join(ROOT, rel); s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        assert old in s, (rel, old[:70])
        s = s.replace(old, new)
    open(p, 'w', encoding='utf-8').write(s)

rw('app/map.js', [
    ("pts.push([110 + t * (W - 220), H / 2 + 10 + Math.sin(t * Math.PI * 2.2 + 0.4) * 70]);", "pts.push([110 + t * (W - 220), H / 2 + 10 + Math.sin(t * Math.PI * 2.2 + 0.4) * 45]);"),
    ("const labelY = i % 2 === 0 ? 58 : -46;", "const labelY = i % 2 === 0 ? 54 : -40;"),
    ("const bl = (n - 1) % 2 === 0 ? 66 : -54;", "const bl = (n - 1) % 2 === 0 ? 62 : -48;"),
])
rw('app/visuals.js', [
    ("""export function funnel(items, { color = '#FB923C', title } = {}) {
  const w = 720; const stepH = 38; const s = frame(w, items.length * stepH + 10);
  items.forEach((it, i) => {
    const txt = String(it).replace(/^\\d+[.)]?\\s*/, '');
    const inset = i * (w * 0.06); const y = 5 + i * stepH;
    s.appendChild(svg('path', { d: `M ${inset} ${y} L ${w - inset} ${y} L ${w - inset - w * 0.06} ${y + stepH - 4} L ${inset + w * 0.06} ${y + stepH - 4} Z`, fill: color, 'fill-opacity': 0.25 + i * 0.1, class: 'pop', style: `animation-delay:${i * 90}ms` }));
    s.appendChild(T(w / 2, y + stepH / 2 - 2, txt, { class: 'vt small bold' }));
  });
  return wrap(title, s, 'Top is widest: many are aware, fewer become advocates.');
}""",
     """export function funnel(items, { color = '#FB923C', title } = {}) {
  const w = 720; const stepH = 42; const s = frame(w, items.length * stepH + 10);
  const cap = h('div', { class: 'vizlabel' }, 'Tap a stage to read what happens there.');
  items.forEach((it, i) => {
    const txt = String(it).replace(/^\\d+[.)]?\\s*/, '');
    const [name, ...rest] = txt.split(':'); const desc = rest.join(':').trim();
    const inset = i * (w * 0.055); const y = 5 + i * stepH;
    const g = svg('g', { class: 'funnel-step', tabindex: '0' },
      svg('path', { d: `M ${inset} ${y} L ${w - inset} ${y} L ${w - inset - w * 0.055} ${y + stepH - 4} L ${inset + w * 0.055} ${y + stepH - 4} Z`, fill: color, 'fill-opacity': 0.22 + i * 0.1, class: 'pop', style: `animation-delay:${i * 90}ms` }),
      T(w / 2, y + stepH / 2 - 2, `${i + 1}. ${name.trim()}`, { class: 'vt small bold' }));
    const show = () => { s.querySelectorAll('.funnel-step').forEach(x => x.classList.remove('on')); g.classList.add('on'); cap.innerHTML = `<b>${name.trim()}</b>${desc ? ' — ' + desc : ''}`; };
    g.addEventListener('click', show); g.addEventListener('mouseenter', show); g.addEventListener('focus', show);
    s.appendChild(g);
  });
  return wrap(title, h('div', null, s, cap), 'Top is widest: many are aware, fewer become advocates.');
}"""),
])
rw('app/game.css', [
    (".map-frame { border-radius: 24px; overflow: hidden; border: 1px solid var(--line); box-shadow: var(--shadow); background: var(--bg-2); }",
     ".map-frame { border-radius: 24px; overflow: hidden; border: 1px solid var(--line); box-shadow: var(--shadow); background: var(--bg-2); }\n@media (max-width: 760px) { .map-frame { overflow-x: auto; -webkit-overflow-scrolling: touch; } .map-frame > svg { min-width: 760px; } .hq-map .worldmap { min-width: 0; } }\n.funnel-step { cursor: pointer; } .funnel-step path { transition: fill-opacity 0.2s; } .funnel-step.on path, .funnel-step:hover path { fill-opacity: 0.85 !important; } .funnel-step:focus-visible { outline: none; }"),
])
print('patched v3')
