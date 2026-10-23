// Imperium icon set: one hand-drawn inline SVG family. Same 1.6 stroke, bronze fill, light from top-left.
// icon(name, { size, cls, tone }) -> <span class="ico"> containing an SVG. richText() renders stems with blanks.
import { h } from './ui.js';

// Paths are drawn on a 24x24 grid. "f" = filled shapes (bronze), "s" = stroked lines, "hl" = highlight (light edge).
const ICONS = {
  aquila: { f: 'M12 3l1.5 3.5L18 5l-2 4 5 1-4.5 2.5L19 18l-5-2.5L12 21l-2-5.5L5 18l2.5-5.5L3 10l5-1-2-4 4.5 1.5z', s: 'M12 9v6', hl: 'M12 3l1.5 3.5L18 5' },
  laurel: { f: 'M12 21c-5.2-1.8-8.2-6.6-7.4-12.6 3.4.8 6 3.6 7 7.6M12 21c5.2-1.8 8.2-6.6 7.4-12.6-3.4.8-6 3.6-7 7.6', s: 'M12 21V9M6 14c1.2-.2 2.4.2 3.2 1M18 14c-1.2-.2-2.4.2-3.2 1M7 10c1 0 2 .6 2.6 1.4M17 10c-1 0-2 .6-2.6 1.4', hl: 'M5 8.6c2.2.4 4 1.8 5.2 3.8' },
  gladius: { f: 'M11 3h2l1 11h-4z', s: 'M8 14h8M12 14v5M10 19h4M12 19v2', hl: 'M11.6 4v9' },
  scutum: { f: 'M6 4h12v11c0 3.5-2.6 5.6-6 7-3.4-1.4-6-3.5-6-7z', s: 'M12 4v18M6 10h12M12 8l-2.2 2.2M12 8l2.2 2.2M12 14l-2.2 2.2M12 14l2.2 2.2', hl: 'M7 5h4v5' },
  pilum: { f: 'M12 2l1.8 4.5h-3.6z', s: 'M12 6.5V22M10.2 9h3.6', hl: 'M12 2l1.8 4.5' },
  galea: { f: 'M5 13a7 7 0 0114 0v2H5zM9 15h6v4l-3 2-3-2z', s: 'M5 15h14M9 15v4M15 15v4M7 10c2-5 8-5 10 0', hl: 'M8 11c1-2.6 3-3.8 4-3.8' },
  scroll: { f: 'M6 5h12a2 2 0 012 2v9H6z', s: 'M6 5a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-1H6zM9 9h8M9 12.5h6', hl: 'M7 6h10' },
  tablet: { f: 'M4 4h16v16H4z', s: 'M7 7h10v10H7zM9 10h6M9 13h4M19 2l3 3-2 2-3-3z', hl: 'M5 5h14' },
  amphora: { f: 'M9 3h6l-.8 2.4H9.8zM8.2 6h7.6c1.8 3 1.8 6.6 0 9.6-1.3 2.2-1.3 4.4-3.8 4.4s-2.5-2.2-3.8-4.4c-1.8-3-1.8-6.6 0-9.6z', s: 'M7 8.5c-2 .5-2.6 3 0 3.6M17 8.5c2 .5 2.6 3 0 3.6M12 20v2', hl: 'M9.5 7c-1 2-1 5 0 7' },
  column: { f: 'M8 7h8v11H8z', s: 'M5 4h14v3H5zM6 18h12v2H6zM10 7v11M14 7v11M4 22h16', hl: 'M8 8h2v9' },
  coin: { f: 'M12 3a9 9 0 100 18 9 9 0 000-18z', s: 'M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM12 6v1.5M12 16.5V18M6 12h1.5M16.5 12H18', hl: 'M6.5 9.5a6.5 6.5 0 015-4.5' },
  ballista: { f: 'M4 17l16-6-1 4z', s: 'M4 17h16M8 17v4M16 17v4M6 21h12M4 9l5 2M20 5l-11 6M9 11l-1 6', hl: 'M4 9l5 2' },
  siegetower: { f: 'M7 6h10v15H7z', s: 'M7 6l2-3h6l2 3M9 10h6M9 14h6M6 21h12M3 21l4-3M21 21l-4-3', hl: 'M8 7h3v13' },
  standard: { f: 'M8 5h8v5H8zM10 12h4v3h-4z', s: 'M12 2v20M6 5h12M10 22h4', hl: 'M8 5h4v2' },
  trireme: { f: 'M3 15h18l-2.5 4H5.5z', s: 'M12 15V4M12 4l6 8H12M12 6l-4 6h4M6 12l-2 3M8 11.5l-1 3.5', hl: 'M4 15h8' },
  brazier: { f: 'M6 11h12l-1.5 5h-9z', s: 'M12 3c2 2 3 4 1.5 6M12 3c-2 2-3 4-1.5 6M9 9c1.5 1 4.5 1 6 0M8 16l-2 5M16 16l2 5M12 16v5', hl: 'M7 12h3' },
  sundial: { f: 'M3 15a9 9 0 0118 0z', s: 'M3 15h18M12 15V5M12 5l5 5M7 13l1-2.5M17 13l-1-2.5M12 18v3M9 21h6', hl: 'M4 14a8 8 0 014-5' },
  temple: { f: 'M3 9l9-5 9 5zM5 10h14v2H5z', s: 'M7 12v7M11 12v7M13 12v7M17 12v7M4 19h16v2H4z', hl: 'M5 8.5l7-3.9' },
  swords: { f: 'M4 4l2 0 9 9-2 2zM20 4l-2 0-9 9 2 2z', s: 'M13 13l4 4M11 13l-4 4M15 17l-2 2M9 17l2 2M17 17l2 2M7 17l-2 2', hl: 'M5 5l8 8' },
  lock: { f: 'M6 11h12v9H6z', s: 'M8 11V8a4 4 0 018 0v3M12 14v3', hl: 'M7 12h3' },
  shieldcrack: { f: 'M6 4h12v11c0 3.5-2.6 5.6-6 7-3.4-1.4-6-3.5-6-7z', s: 'M12 4l-1.5 5 3 2.5-2.5 4 2 3.5', hl: 'M7 5h4v4' },
  horn: { f: 'M4 10v4h3l8 5V5L7 10z', s: 'M18 9a4 4 0 010 6M20 7a7 7 0 010 10', hl: 'M5 11h2' },
  flame: { f: 'M12 2c1 4 5 5 5 10a5 5 0 01-10 0c0-3 2-4 2-6 1 1 2 2 2 4 1-2 1-5 1-8z', s: 'M12 22v-2', hl: 'M9.5 11c0 1.5-.5 2-.5 3.5' },
  waterclock: { f: 'M7 3h10l-1 6-4 3-4-3zM7 21h10l-1-6-4-3-4 3z', s: 'M6 3h12M6 21h12M12 12v2', hl: 'M8 4h3l-.5 4' },
  map: { f: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z', s: 'M9 4v14M15 6v14M5 10c3-1 5 1 8 0 2-.7 3 0 5-1', hl: 'M4 7l4-1.4' },
  target: { f: 'M12 3a9 9 0 100 18 9 9 0 000-18z', s: 'M12 7a5 5 0 100 10 5 5 0 000-10zM12 11a1 1 0 100 2 1 1 0 000-2zM12 3v3M12 18v3M3 12h3M18 12h3', hl: 'M6.5 9.5a6.5 6.5 0 015-4.5' },
  eye: { f: 'M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z', s: 'M12 9a3 3 0 100 6 3 3 0 000-6z', hl: 'M4 11c2-2.4 4.6-3.8 7-4' },
  arrow: { f: '', s: 'M4 12h14M13 7l5 5-5 5', hl: '' },
  check: { f: '', s: 'M5 12.5l4.5 4.5L19 7', hl: '' },
  cross: { f: '', s: 'M6 6l12 12M18 6L6 18', hl: '' },
  gear: { f: 'M12 2l2 2.5 3-.6.6 3L20 9l-1 3 1 3-2.4 2.1-.6 3-3-.6L12 22l-2-2.5-3 .6-.6-3L4 15l1-3-1-3 2.4-2.1.6-3 3 .6z', s: 'M12 9a3 3 0 100 6 3 3 0 000-6z', hl: 'M12 2l2 2.5' },
  person: { f: 'M12 3a4 4 0 100 8 4 4 0 000-8zM4 21c1-4.5 4-6.5 8-6.5s7 2 8 6.5z', s: '', hl: 'M9 5a3 3 0 013-1' },
  hourglass: { f: 'M6 3h12l-2 7-4 2-4-2zM6 21h12l-2-7-4-2-4 2z', s: 'M5 3h14M5 21h14', hl: 'M7 4h4' },
  stall: { f: 'M3 10l2-5h14l2 5z', s: 'M5 12.6V20h14v-7.4M10 20v-4.5h4V20M3 10c0 1.6 1.2 2.6 2.5 2.6S8 11.6 8 10c0 1.6 1.3 2.6 2.6 2.6S13 11.6 13 10c0 1.6 1.3 2.6 2.6 2.6S18.5 11.6 18.5 10c0 1.6 1.2 2.6 2.5 2.6', hl: 'M5 6h5' },
  crate: { f: 'M4 7h16v13H4z', s: 'M4 11h16M9 7v13M15 7v13M8 7l4-3 4 3', hl: 'M5 8h3' },
  wagon: { f: 'M3 8h10v6H3z', s: 'M13 14h3l3-5h2M7 17.5a2.2 2.2 0 100 .01M15 17.5a2.2 2.2 0 100 .01M3 14h16', hl: 'M4 9h4' },
  scale: { f: 'M3 15l3-6 3 6zM15 15l3-6 3 6z', s: 'M12 3v18M5 21h14M4 9h16M3 15a3 3 0 006 0M15 15a3 3 0 006 0', hl: 'M12 3v2' },
  chart: { f: '', s: 'M4 20V5M4 20h16M7 16l4-5 3 3 5-7', hl: '' },
  seal: { f: 'M12 3a7 7 0 100 14 7 7 0 000-14z', s: 'M8.5 15l-1.5 6 5-2.5 5 2.5-1.5-6M12 6.5l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2L8.8 8.8l2.2-.3z', hl: 'M7 8a5 5 0 014-3.5' },
  book: { f: 'M4 4h7v16H4zM13 4h7v16h-7z', s: 'M11 4v16M13 4v16M6 8h3M15 8h3M6 11h3M15 11h3', hl: 'M5 5h5' },
  gate: { f: 'M4 21V9a8 8 0 0116 0v12z', s: 'M12 9v12M8 21v-7M16 21v-7M4 13h16', hl: 'M6 10a6 6 0 013-5' },
  hand: { f: 'M8 12V5a1.5 1.5 0 013 0v6M11 11V4a1.5 1.5 0 013 0v7M14 11V5a1.5 1.5 0 013 0v8M17 13v-2a1.5 1.5 0 013 0v4c0 4-3 7-7 7s-6-2-7.5-5L4 14a1.5 1.5 0 012.6-1.5L8 14', s: '', hl: 'M9 6v5' },
};

/**
 * Build an icon element. tone: 'bronze' (default), 'gold', 'ink', 'parchment', 'crimson', 'laurel', 'iron', 'mono'.
 */
export function icon(name, { size = 20, cls = '', tone = 'bronze', title = null } = {}) {
  const def = ICONS[name] || ICONS.seal;
  const wrap = h('span', { class: `ico ico-${name} tone-${tone} ${cls}`.trim(), 'aria-hidden': title ? null : 'true', role: title ? 'img' : null, 'aria-label': title, style: { '--ico-size': size + 'px' } });
  wrap.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke-linecap="round" stroke-linejoin="round">`
    + (def.f ? `<path class="ico-f" d="${def.f}"/>` : '')
    + (def.s ? `<path class="ico-s" d="${def.s}" stroke-width="1.6"/>` : '')
    + (def.hl ? `<path class="ico-hl" d="${def.hl}" stroke-width="1"/>` : '')
    + `</svg>`;
  return wrap;
}
export const ICON_NAMES = Object.keys(ICONS);

/** Chapter -> icon name (used instead of the old emoji metadata). */
export const CHAPTER_ICON = { 1: 'temple', 6: 'target', 7: 'amphora', 8: 'pilum', 9: 'coin', 10: 'trireme', 11: 'stall', 12: 'horn' };

/**
 * Render stem text with wax-tablet blanks. Keyword glyphs were removed: they mislabelled words
 * ("good deed" is not a product) and distracted during exam practice.
 */
export function richText(text, { blanks = true } = {}) {
  const frag = document.createDocumentFragment();
  const str = String(text || '');
  if (!blanks) { frag.appendChild(document.createTextNode(str)); return frag; }
  for (const p of str.split(/(_{3,})/)) {
    if (!p) continue;
    if (/^_{3,}$/.test(p)) frag.appendChild(h('span', { class: 'blank', 'aria-label': 'blank' }));
    else frag.appendChild(document.createTextNode(p));
  }
  return frag;
}
