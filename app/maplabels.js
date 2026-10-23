// HTML labels for the war table and the 2.5D map: province name on one line, chapter numeral on the next,
// a status badge pinned below (never on top), and a collision pass that pushes or fades overlapping labels.
import { h } from './ui.js';
import { icon } from './icons.js';

/**
 * createLabelLayer(host) -> { set(items), update(project), clear(), destroy(), el }
 * items: [{ id, name, numeral, status, state ('locked'|'open'|'conquered'), next, priority, pos (any, passed to project) }]
 * project(pos) -> [x, y, visible] in host pixels.
 */
export function createLabelLayer(host) {
  const el = h('div', { class: 'mlabels', 'aria-hidden': 'true' });
  host.appendChild(el);
  let items = []; let nodes = new Map();
  function set(list) {
    items = list.slice().sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const keep = new Set(items.map(i => i.id));
    for (const [id, n] of nodes) if (!keep.has(id)) { n.remove(); nodes.delete(id); }
    for (const it of items) {
      let n = nodes.get(it.id);
      if (!n) { n = h('div', { class: 'mlabel', dataset: { id: it.id } }, h('div', { class: 'ml-name' }), h('div', { class: 'ml-num' }), h('div', { class: 'ml-badge' })); el.appendChild(n); nodes.set(it.id, n); }
      n.className = `mlabel ${it.state || ''}${it.next ? ' next' : ''}${it.small ? ' small' : ''}${it.numFirst ? ' numfirst' : ''}`;
      n.querySelector('.ml-name').textContent = it.name;
      n.querySelector('.ml-num').textContent = it.numeral || '';
      const badge = n.querySelector('.ml-badge'); badge.replaceChildren();
      if (it.status) { if (it.state === 'locked') badge.appendChild(icon('lock', { size: 11, tone: 'parchment' })); if (it.state === 'conquered') badge.appendChild(icon('aquila', { size: 11, tone: 'gold' })); if (it.next && it.state === 'open') badge.appendChild(icon('standard', { size: 11, tone: 'gold' })); badge.appendChild(document.createTextNode(it.status)); badge.style.display = ''; } else badge.style.display = 'none';
    }
  }
  /** Position every label, then resolve overlaps: higher priority wins; the loser is pushed down, then faded. */
  function update(project) {
    const placed = [];
    for (const it of items) {
      const n = nodes.get(it.id); if (!n) continue;
      const [x, y, visible] = project(it.pos);
      if (!visible) { n.classList.add('hidden'); continue; }
      n.classList.remove('hidden');
      const w = n.offsetWidth || 120, hh = n.offsetHeight || 44;
      let left = x - w / 2, top = y - hh / 2 + (it.dy || 0);
      let rect = { l: left, t: top, r: left + w, b: top + hh };
      let faded = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        const hit = placed.find(p => !(rect.r < p.l - 6 || rect.l > p.r + 6 || rect.b < p.t - 4 || rect.t > p.b + 4));
        if (!hit) break;
        if (attempt < 2) { const dy = hit.b + 6 - rect.t; top += dy; rect = { l: left, t: top, r: left + w, b: top + hh }; }
        else faded = true;
      }
      n.classList.toggle('faded', faded);
      if (!faded) placed.push(rect);
      n.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    }
  }
  function clear() { for (const n of nodes.values()) n.remove(); nodes.clear(); items = []; }
  function destroy() { clear(); el.remove(); }
  return { el, set, update, clear, destroy };
}
