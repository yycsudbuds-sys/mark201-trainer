// The Quartermaster's shop: cosmetics only, paid in denarii. Nothing here affects XP, mastery or the schedule.
import { h } from './ui.js';
import { icon } from './icons.js';
import { getCosmetic, setCosmetic, getDenarii, addDenarii } from './cosmetic.js';
import { legionaryAvatar, equipped, COLORS } from './legion.js';

export const SHOP = [
  { cat: 'crest', title: 'Helmet crest', items: [['red', 'Crimson', 0], ['white', 'White horsehair', 40], ['black', 'Black horsehair', 40], ['gold', 'Gilded', 90]] },
  { cat: 'emblem', title: 'Shield emblem', items: [['wings', 'Wings and bolts', 0], ['bolt', 'Jupiter\'s bolt', 40], ['boar', 'The boar', 60], ['eagle', 'The eagle', 90]] },
  { cat: 'cloak', title: 'Cloak', items: [['red', 'Soldier\'s red', 0], ['green', 'Forest green', 40], ['white', 'Bleached wool', 40], ['purple', 'Tyrian purple', 120]] },
  { cat: 'banner', title: 'Legion banner', items: [['spqr', 'SPQR', 0], ['legio', 'LEGIO with numeral', 60], ['aquila', 'The eagle banner', 100]] },
  { cat: 'table', title: 'War table skin', items: [['oak', 'Oak', 0], ['walnut', 'Dark walnut', 120], ['marble', 'Carrara marble top', 200]] },
];
export const LEGION_NAME_PRICE = 25;

export function shopView(app) {
  const wrap = h('div', { class: 'card stack shop' });
  function draw() {
    wrap.innerHTML = '';
    const cos = getCosmetic(); const owned = new Set(cos.owned || []); const eq = equipped();
    wrap.appendChild(h('div', { class: 'row between wrap' }, h('div', null, h('h3', null, 'The shop'), h('p', { class: 'small muted' }, 'Spend denarii on your legionary and your legion. Cosmetic only: nothing here changes what is learned or scored.')),
      h('div', { class: 'shop-avatar' }, legionaryAvatar(96, eq), h('span', { class: 'chip denarii' }, icon('coin', { size: 14, tone: 'gold' }), `${getDenarii()} denarii`))));
    for (const group of SHOP) {
      const row = h('div', { class: 'shop-row' });
      for (const [id, name, price] of group.items) {
        const key = `${group.cat}:${id}`; const isOwned = price === 0 || owned.has(key); const isOn = eq[group.cat] === id;
        const swatch = h('span', { class: 'swatch', style: { background: COLORS[id] || (group.cat === 'table' ? { oak: '#6B4B2A', walnut: '#3B2A17', marble: '#ECE6DA' }[id] : '#8C6B4A') } });
        row.appendChild(h('button', { class: 'shop-item' + (isOn ? ' on' : '') + (isOwned ? ' owned' : ''), type: 'button', onClick: () => {
          if (!isOwned) { if (getDenarii() < price) { app.toast(`You need ${price - getDenarii()} more denarii`, 'bad'); app.sound('wrong'); return; } addDenarii(-price, 'shop'); owned.add(key); setCosmetic({ owned: [...owned] }); app.sound('coins'); }
          const e = Object.assign({}, cos.equipped || {}, { [group.cat]: id }); setCosmetic({ equipped: e }); app.sound('seal'); app.renderHeader && app.renderHeader(); draw();
        } }, swatch, h('span', { class: 'shop-name' }, name), h('span', { class: 'shop-price' }, isOn ? 'Equipped' : isOwned ? 'Owned' : [icon('coin', { size: 12, tone: 'gold' }), ` ${price}`])));
      }
      wrap.appendChild(h('div', { class: 'field' }, h('label', null, group.title), row));
    }
    const nameIn = h('input', { type: 'text', value: eq.name, placeholder: 'e.g. Legio IX Hispana', maxlength: '28' });
    wrap.appendChild(h('div', { class: 'field' }, h('label', null, `Legion name · ${LEGION_NAME_PRICE} denarii to change`), h('div', { class: 'row wrap' }, nameIn, h('button', { class: 'btn', type: 'button', onClick: () => {
      const v = nameIn.value.trim(); if (!v || v === eq.name) return; if (getDenarii() < LEGION_NAME_PRICE) { app.toast(`You need ${LEGION_NAME_PRICE - getDenarii()} more denarii`, 'bad'); return; }
      addDenarii(-LEGION_NAME_PRICE, 'name'); setCosmetic({ equipped: Object.assign({}, getCosmetic().equipped || {}, { name: v }) }); app.toast(`The legion marches as ${v}`, 'good'); app.sound('horn'); draw();
    } }, 'Name the legion'))));
  }
  draw();
  return wrap;
}
