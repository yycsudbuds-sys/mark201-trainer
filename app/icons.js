// Inline concept icons: tiny vector glyphs placed after key marketing terms in question text.
// Decorative only (aria-hidden); the text itself is never changed.
import { h } from './ui.js';

const P = {
  coin: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.2"/><path d="M12 7.5v1.2M12 15.3v1.2"/>',
  ship: '<path d="M3 15h18l-2.2 4H5.2z"/><path d="M12 15V5"/><path d="M12 5l7 8H12z"/><path d="M12 7l-5 6h5"/>',
  amphora: '<path d="M9 3h6l-1 2.5h-4z"/><path d="M8 5.5c-2 3-2 7 0 10 1.6 2.4 1.6 4 4 4s2.4-1.6 4-4c2-3 2-7 0-10"/><path d="M6.5 8.5c-2 .5-2.5 3 0 3.5M17.5 8.5c2 .5 2.5 3 0 3.5"/>',
  horn: '<path d="M4 10v4h3l8 5V5L7 10z"/><path d="M18 9a4 4 0 010 6"/>',
  seal: '<circle cx="12" cy="10" r="6"/><path d="M8.5 15l-1.5 6 5-2.5 5 2.5-1.5-6"/><path d="M12 7.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2L8.8 9.8l2.2-.3z"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3"/>',
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20.5c1-4.5 4-6.5 7.5-6.5s6.5 2 7.5 6.5"/>',
  stall: '<path d="M3 10l2-5h14l2 5"/><path d="M3 10c0 1.6 1.2 2.6 2.5 2.6S8 11.6 8 10c0 1.6 1.3 2.6 2.6 2.6S13 11.6 13 10c0 1.6 1.3 2.6 2.6 2.6S18.5 11.6 18.5 10c0 1.6 1.2 2.6 2.5 2.6"/><path d="M5 12.6V20h14v-7.4"/><path d="M10 20v-4.5h4V20"/>',
  crate: '<rect x="4" y="7" width="16" height="13" rx="1"/><path d="M4 11h16M9 7v13M15 7v13"/><path d="M8 7l4-3 4 3"/>',
  scroll: '<path d="M7 4h11a2 2 0 012 2v2H9"/><path d="M7 4a2 2 0 00-2 2v12a2 2 0 002 2h11a2 2 0 002-2v-2"/><path d="M9 11h8M9 14.5h6"/>',
  scale: '<path d="M12 3v18M5 21h14"/><path d="M4 9h16"/><path d="M6 9l-3 6a3 3 0 006 0zM18 9l-3 6a3 3 0 006 0z"/>',
  chart: '<path d="M4 20V5M4 20h16"/><path d="M7 16l4-5 3 3 5-7"/>',
  wagon: '<path d="M3 14h13l3-5h2"/><path d="M3 14V8h10v6"/><circle cx="7" cy="17.5" r="2.2"/><circle cx="15" cy="17.5" r="2.2"/>',
  laurel: '<path d="M12 21c-5-2-8-7-7-13 4 1 7 5 7 13zM12 21c5-2 8-7 7-13-4 1-7 5-7 13z"/><path d="M12 21V9"/>',
};
// category -> [regex, icon]. Order matters: first match wins for a position; at most one icon per category per text.
const RULES = [
  ['coin', /\b(price|prices|priced|pricing|cost|costs|discount|discounts|markup|markups|revenue|profit|profits|break-even|penetration pricing|skimming|elastic|inelastic|allowance|allowances)\b/i],
  ['ship', /\b(place|distribution|channel|channels|intermediary|intermediaries|logistics|supply chain|supply chains|transport|transportation|shipping|disintermediation|FOB)\b/i],
  ['amphora', /\b(product|products|good|goods|services?)\b/i],
  ['horn', /\b(promotion|promotions|promotional|advertising|advertisement|ads?|publicity|public relations|IMC|marketing communications?|message|messages|campaign|campaigns|personal selling|sales promotion)\b/i],
  ['seal', /\b(brand|brands|branding|branded|trademark|logo|brand equity|brand loyalty)\b/i],
  ['target', /\b(segment|segments|segmentation|segmenting|target market|target markets|targeting|positioning|repositioning|niche|perceptual map)\b/i],
  ['person', /\b(consumer|consumers|customer|customers|buyer|buyers|shopper|shoppers|user|users|household|households)\b/i],
  ['stall', /\b(retail|retailer|retailers|retailing|store|stores|shop|shops|boutique|outlet|outlets|supermarket|department store)\b/i],
  ['crate', /\b(wholesale|wholesaler|wholesalers|wholesaling|inventory|inventories|warehouse|warehouses|warehousing|stock)\b/i],
  ['scroll', /\b(research|information|data|survey|surveys|analytics|metrics)\b/i],
  ['scale', /\b(value|exchange|exchanges|trade|barter)\b/i],
  ['chart', /\b(market share|growth|sales|forecast|forecasting|demand|life cycle|PLC)\b/i],
  ['wagon', /\b(delivery|deliver|delivered|just-in-time|JIT|cross-docking|order processing)\b/i],
  ['laurel', /\b(mastery|loyalty|advocate|advocacy|award|awards|triumph)\b/i],
];
const MAX_ICONS = 3;

export function icon(name, cls = 'kw-ico') {
  const el = h('span', { class: cls, 'aria-hidden': 'true' });
  el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;
  return el;
}

/**
 * Render text with blanks and concept icons into a DocumentFragment.
 * Icons are appended after the FIRST occurrence of each matched category (max 3 per text).
 */
export function richText(text, { icons = true, blanks = true } = {}) {
  const frag = document.createDocumentFragment();
  const str = String(text || '');
  // find icon insertion points
  const marks = [];
  if (icons) {
    for (const [name, re] of RULES) {
      // never split a hyphenated compound ("brand-loyal"); carry the icon past a possessive ("brand's")
      const guarded = new RegExp(re.source + "(?![-\w])", 'i');
      const m = guarded.exec(str);
      if (m) {
        let at = m.index + m[0].length;
        const tail = str.slice(at, at + 2);
        if (/^['’]s/.test(tail)) at += 2;
        marks.push({ at, name });
      }
      if (marks.length >= MAX_ICONS) break;
    }
    marks.sort((a, b) => a.at - b.at);
  }
  let cursor = 0;
  const pushText = seg => {
    if (!seg) return;
    if (!blanks) { frag.appendChild(document.createTextNode(seg)); return; }
    const parts = seg.split(/(_{3,})/);
    for (const p of parts) { if (!p) continue; if (/^_{3,}$/.test(p)) frag.appendChild(h('span', { class: 'blank', 'aria-label': 'blank' })); else frag.appendChild(document.createTextNode(p)); }
  };
  for (const mk of marks) { pushText(str.slice(cursor, mk.at)); frag.appendChild(icon(mk.name)); cursor = mk.at; }
  pushText(str.slice(cursor));
  return frag;
}
