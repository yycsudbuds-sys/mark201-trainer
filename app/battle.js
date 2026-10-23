// Cinematic battle and siege: a Canvas 2D sprite system drawn in the front-line band.
// Field battle: three ranks of legionaries with curved scuta, crested galeae and raised pila, a signifer and an
// aquilifer; a province-specific enemy; pila volleys, staggers, falls, testudo, cavalry, pursuit flags, rout.
// Siege: the enemy capital with walls, gate, towers and defenders; ballista bolts and onager stones crack the
// wall; arrows rain on the testudo after a miss; the breach, the storming and the eagle over the city.
// Everything here is cosmetic and driven only by calls from the runner (advance/setback/hit/miss/breach/win).
import { h } from './ui.js';
import { commanderFor, portraitSvg } from './commanders.js';
import { getCosmetic } from './cosmetic.js';

const H = 220;            // logical height of the scene
const GROUND = 200;       // y of the front rank's feet
const RANKS = [[166, 1.0], [186, 1.14], [206, 1.28]];

export const ENEMY = {
  italia: { unit: 'rebel', color: '#5A4A6A', trim: '#C9A227', skin: '#C8956A', name: 'a rival legion' },
  hispania: { unit: 'caetratus', color: '#6B4A2A', trim: '#B9B2A5', skin: '#C8956A', name: 'Iberian caetrati' },
  gallia: { unit: 'gaul', color: '#2F5A4A', trim: '#D9A441', skin: '#D9B08C', name: 'a Gallic warband' },
  britannia: { unit: 'briton', color: '#2E4A7A', trim: '#CFE6F0', skin: '#E6C8B0', name: 'the Britons' },
  germania: { unit: 'german', color: '#3A2A1E', trim: '#8A8F99', skin: '#D9B08C', name: 'a Germanic warband' },
  graecia: { unit: 'hoplite', color: '#8A2A1E', trim: '#E8DCC2', skin: '#D9A47C', name: 'a hoplite phalanx' },
  asia: { unit: 'archer', color: '#7A4A1E', trim: '#E3C76A', skin: '#C8956A', name: 'archers and cataphracts' },
  aegyptus: { unit: 'egyptian', color: '#1E6A7A', trim: '#E3C76A', skin: '#B07A4A', name: 'the Ptolemaic line' },
  default: { unit: 'warrior', color: '#3A3F47', trim: '#8A8F99', skin: '#D9A47C', name: 'the enemy' },
};
const RED = '#8B1E1E', RED_D = '#5E1313', GOLD = '#C9A227', GOLD_L = '#E3C76A', IRON = '#8C8C90', IRON_D = '#4A4A4E', LEATHER = '#3B2A17', SKIN = '#8A5A3C', WOOD = '#5A3F22', WOOD_D = '#2A1C0E';

// ---------------------------------------------------------------- sprite painters (origin: feet centre, y up is negative)
function P(ctx, fill, d) { ctx.fillStyle = fill; ctx.beginPath(); d(ctx); ctx.fill(); }
function legs(ctx, c = LEATHER, spread = 5) { P(ctx, c, x => { x.rect(-spread - 3, -14, 5, 14); x.rect(spread - 2, -14, 5, 14); }); }
function body(ctx, c, w = 13, hgt = 24, y = -14) { P(ctx, c, x => x.roundRect(-w / 2, y - hgt, w, hgt, 3)); }
function headAt(ctx, skin, y = -44, r = 5.2) { P(ctx, skin, x => x.arc(0, y, r, 0, Math.PI * 2)); }
function galea(ctx, y = -44, crest = true, color = GOLD) {
  P(ctx, color, x => { x.arc(0, y - 1, 6.5, Math.PI, 0); x.lineTo(6.5, y + 3); x.lineTo(-6.5, y + 3); });
  P(ctx, '#8E6B1C', x => x.rect(-8, y + 2, 16, 2.4));
  P(ctx, color, x => x.rect(-7.5, y - 1, 2.5, 7)); P(ctx, color, x => x.rect(5, y - 1, 2.5, 7)); // cheek guards
  if (crest) P(ctx, RED, x => { x.moveTo(-6, y - 5); x.quadraticCurveTo(0, y - 16, 6, y - 5); x.quadraticCurveTo(0, y - 8, -6, y - 5); });
}
function scutum(ctx, x0, y0, w, hgt, fill, emblem = true) {
  // curved rectangle with a lighter spine, painted wings and lightning bolts, a bronze boss
  ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(x0, y0, w, hgt, 3); ctx.fill();
  ctx.strokeStyle = '#2A0808'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(255,220,180,0.14)'; ctx.fillRect(x0 + w * 0.45, y0 + 1, w * 0.12, hgt - 2);
  if (emblem) {
    ctx.strokeStyle = GOLD_L; ctx.lineWidth = 1; ctx.beginPath();
    const cx = x0 + w / 2, cy = y0 + hgt / 2;
    ctx.moveTo(cx - 2, cy - 5); ctx.lineTo(cx - 7, cy - 10); ctx.moveTo(cx + 2, cy - 5); ctx.lineTo(cx + 7, cy - 10);
    ctx.moveTo(cx - 2, cy + 3); ctx.lineTo(cx - 8, cy + 6); ctx.moveTo(cx + 2, cy + 3); ctx.lineTo(cx + 8, cy + 6);
    ctx.moveTo(x0 + w * 0.22, y0 + hgt * 0.22); ctx.lineTo(x0 + w * 0.3, y0 + hgt * 0.32); ctx.lineTo(x0 + w * 0.24, y0 + hgt * 0.35); ctx.lineTo(x0 + w * 0.32, y0 + hgt * 0.47);
    ctx.moveTo(x0 + w * 0.78, y0 + hgt * 0.22); ctx.lineTo(x0 + w * 0.7, y0 + hgt * 0.32); ctx.lineTo(x0 + w * 0.76, y0 + hgt * 0.35); ctx.lineTo(x0 + w * 0.68, y0 + hgt * 0.47);
    ctx.stroke();
  }
  P(ctx, GOLD, x => x.arc(x0 + w / 2, y0 + hgt / 2, 3.2, 0, Math.PI * 2));
  ctx.strokeStyle = '#6B4B12'; ctx.lineWidth = 0.8; ctx.stroke();
}
function spear(ctx, x, y1, y2, tip = '#D9D4C8', w = 1.3) { ctx.strokeStyle = '#B9B2A5'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke(); P(ctx, tip, c => { c.moveTo(x, y1 - 7); c.lineTo(x + 2, y1); c.lineTo(x - 2, y1); }); }
function legionary(ctx, o = {}) {
  const tunic = o.tunic || RED;
  legs(ctx); if (o.cloak) P(ctx, o.cloak, x => { x.moveTo(-9, -36); x.lineTo(-14, -6); x.lineTo(-2, -10); x.lineTo(-4, -36); }); body(ctx, tunic); // lorica segments
  ctx.strokeStyle = IRON; ctx.lineWidth = 1.2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-6, -34 + i * 4); ctx.lineTo(6, -34 + i * 4); ctx.stroke(); }
  headAt(ctx, o.skin || SKIN); galea(ctx, -44, true, GOLD); if (o.crest) P(ctx, o.crest, x => { x.moveTo(-6, -49); x.quadraticCurveTo(0, -60, 6, -49); x.quadraticCurveTo(0, -52, -6, -49); });
  if (o.testudo) { // shield held flat overhead
    scutum(ctx, -16, -60, 32, 10, o.shield || RED, false);
  } else {
    if (o.pilum !== false) spear(ctx, 10, -66, -8);
    scutum(ctx, -15, -40, 26, 36, o.shield || RED);
  }
}
function signifer(ctx) {
  legs(ctx); body(ctx, '#6B4B12'); headAt(ctx, SKIN); galea(ctx, -44, false, '#8E6B1C');
  P(ctx, '#B5623A', x => x.ellipse(0, -48, 11, 6, 0, 0, Math.PI * 2)); // wolf pelt
  ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(12, -118); ctx.stroke();
  P(ctx, RED, x => x.rect(-3, -112, 30, 20)); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.strokeRect(-3, -112, 30, 20);
  ctx.fillStyle = GOLD_L; ctx.font = 'bold 9px Cinzel, serif'; ctx.textAlign = 'center'; ctx.fillText('SPQR', 12, -98);
  [-86, -74, -62].forEach(y => { P(ctx, GOLD, x => x.arc(12, y, 5.5, 0, Math.PI * 2)); ctx.strokeStyle = '#6B4B12'; ctx.lineWidth = 1; ctx.stroke(); });
}
function aquilifer(ctx) {
  legs(ctx); body(ctx, '#6B4B12'); headAt(ctx, SKIN); galea(ctx, -44, false, '#8E6B1C');
  P(ctx, GOLD_L, x => x.ellipse(0, -48, 11, 6, 0, 0, Math.PI * 2)); // lion pelt
  ctx.strokeStyle = GOLD; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(12, -126); ctx.stroke();
  P(ctx, GOLD, x => x.rect(-2, -112, 28, 12));
  eagle(ctx, 12, -128, 1);
}
function eagle(ctx, x, y, s = 1) { P(ctx, GOLD_L, c => { c.moveTo(x, y - 4 * s); c.lineTo(x - 16 * s, y + 4 * s); c.lineTo(x - 7 * s, y + 2 * s); c.lineTo(x - 10 * s, y + 12 * s); c.lineTo(x, y + 4 * s); c.lineTo(x + 10 * s, y + 12 * s); c.lineTo(x + 7 * s, y + 2 * s); c.lineTo(x + 16 * s, y + 4 * s); }); ctx.strokeStyle = '#6B4B12'; ctx.lineWidth = 0.8; ctx.stroke(); }
function cavalry(ctx) {
  // horse at full gallop, rider with lance and flying cloak, facing right
  P(ctx, '#1A1410', x => { x.moveTo(-30, -2); x.lineTo(-22, -22); x.lineTo(-10, -26); x.lineTo(10, -26); x.lineTo(24, -30); x.lineTo(34, -40); x.lineTo(40, -38); x.lineTo(36, -26); x.lineTo(44, -22); x.lineTo(30, -18); x.lineTo(24, -8); x.lineTo(30, 0); x.lineTo(22, 0); x.lineTo(16, -10); x.lineTo(0, -8); x.lineTo(-10, 0); x.lineTo(-18, 0); x.lineTo(-20, -10); x.lineTo(-34, 0); });
  P(ctx, '#2A1C14', x => x.rect(-24, -42, 4, 16)); // tail-ish mane
  P(ctx, RED, x => { x.moveTo(2, -30); x.lineTo(-26, -44); x.lineTo(-20, -34); x.lineTo(-30, -30); x.lineTo(0, -24); }); // cloak
  body(ctx, RED, 11, 20, -30); headAt(ctx, SKIN, -58, 4.8); galea(ctx, -58, true);
  spear(ctx, 8, -76, -26); scutum(ctx, -10, -50, 16, 22, RED, false);
}
// enemies face left: paint them facing right and flip when blitting
function warriorBase(ctx, en, o = {}) { legs(ctx, '#2A1C14'); body(ctx, o.tunic || en.color, 13, 24); headAt(ctx, en.skin); }
function roundShield(ctx, x, y, r, fill, trim, boss = true) { P(ctx, fill, c => c.arc(x, y, r, 0, Math.PI * 2)); ctx.strokeStyle = trim; ctx.lineWidth = 1.6; ctx.stroke(); if (boss) P(ctx, trim, c => c.arc(x, y, 2.6, 0, Math.PI * 2)); }
function ovalShield(ctx, x, y, rx, ry, fill, trim) { P(ctx, fill, c => c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)); ctx.strokeStyle = trim; ctx.lineWidth = 1.4; ctx.stroke(); P(ctx, trim, c => c.rect(x - 1.2, y - ry * 0.7, 2.4, ry * 1.4)); }
const ENEMY_PAINT = {
  gaul(ctx, en, v) { warriorBase(ctx, en, { tunic: '#9A7A5A' }); P(ctx, '#8B5A2B', x => { x.moveTo(-7, -46); x.quadraticCurveTo(0, -58, 7, -46); x.lineTo(8, -36); x.lineTo(-8, -36); }); P(ctx, '#8B5A2B', x => x.rect(-6, -41, 12, 2.2)); // moustache
    if (v === 1) { ctx.strokeStyle = GOLD; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(10, -30); ctx.lineTo(10, -96); ctx.stroke(); P(ctx, GOLD, x => { x.moveTo(10, -96); x.quadraticCurveTo(10, -112, 24, -108); x.lineTo(22, -102); x.lineTo(14, -100); }); } else spear(ctx, 12, -62, -10, '#D9D4C8');
    ovalShield(ctx, -6, -24, 9, 20, en.color, en.trim); },
  briton(ctx, en, v) {
    if (v === 1) { // chariot: cart, pony, warrior
      P(ctx, '#3A2A1E', x => { x.moveTo(-38, -6); x.lineTo(-30, -24); x.lineTo(-10, -26); x.lineTo(2, -30); x.lineTo(14, -38); x.lineTo(20, -36); x.lineTo(16, -24); x.lineTo(24, -20); x.lineTo(10, -16); x.lineTo(6, 0); x.lineTo(0, 0); x.lineTo(-4, -8); x.lineTo(-18, -8); x.lineTo(-24, 0); x.lineTo(-30, 0); });
      P(ctx, WOOD, x => x.rect(-70, -26, 36, 16)); P(ctx, WOOD_D, x => x.arc(-52, -4, 9, 0, Math.PI * 2)); P(ctx, '#6B4B2A', x => x.arc(-52, -4, 3, 0, Math.PI * 2)); ctx.strokeStyle = WOOD_D; ctx.lineWidth = 1.2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-52, -4); ctx.lineTo(-52 + Math.cos(i) * 9, -4 + Math.sin(i) * 9); ctx.stroke(); }
      ctx.save(); ctx.translate(-52, -24); body(ctx, '#2E4A7A', 12, 20, -2); headAt(ctx, en.skin, -30, 4.8); P(ctx, en.skin, x => x.rect(-5, -36, 10, 3)); ctx.strokeStyle = '#2E4A7A'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-4, -31); ctx.lineTo(3, -27); ctx.stroke(); spear(ctx, 8, -52, -6); ctx.restore();
    } else { warriorBase(ctx, en, { tunic: en.skin }); ctx.strokeStyle = '#2E4A7A'; ctx.lineWidth = 1.6; [[-4, -34, 4, -30], [-5, -26, 5, -22], [-3, -46, 3, -43]].forEach(([a, b, c, d]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); }); // woad
      P(ctx, '#B5452A', x => { x.moveTo(-6, -46); x.quadraticCurveTo(0, -60, 6, -46); x.lineTo(7, -38); x.lineTo(-7, -38); }); spear(ctx, 12, -64, -10); ovalShield(ctx, -6, -24, 8, 18, en.color, en.trim); } },
  german(ctx, en) { warriorBase(ctx, en, { tunic: '#6B5A3E' }); P(ctx, '#5A3A1E', x => { x.moveTo(-7, -46); x.quadraticCurveTo(0, -58, 7, -46); x.lineTo(8, -34); x.lineTo(-8, -34); }); P(ctx, '#5A3A1E', x => { x.moveTo(-5, -40); x.lineTo(5, -40); x.lineTo(3, -32); x.lineTo(-3, -32); }); // beard
    P(ctx, '#4A3A2A', x => { x.moveTo(-8, -38); x.lineTo(8, -38); x.lineTo(10, -14); x.lineTo(-10, -14); }); // fur cloak
    spear(ctx, 12, -66, -8); roundShield(ctx, -6, -24, 11, en.color, en.trim); },
  hoplite(ctx, en) { warriorBase(ctx, en, { tunic: '#C8A878' }); P(ctx, IRON, x => x.rect(-7, -38, 14, 22)); // cuirass
    P(ctx, '#8E6B1C', x => { x.arc(0, -45, 7, Math.PI, 0); x.lineTo(7, -36); x.lineTo(3, -36); x.lineTo(2, -40); x.lineTo(-2, -40); x.lineTo(-3, -36); x.lineTo(-7, -36); }); // corinthian
    P(ctx, RED, x => { x.moveTo(-7, -50); x.quadraticCurveTo(0, -62, 7, -50); x.quadraticCurveTo(0, -54, -7, -50); });
    ctx.strokeStyle = '#B9B2A5'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-14, -30); ctx.lineTo(30, -36); ctx.stroke(); P(ctx, '#D9D4C8', x => { x.moveTo(30, -36); x.lineTo(38, -37); x.lineTo(30, -39); }); // levelled spear
    roundShield(ctx, -2, -26, 14, en.color, en.trim, false); P(ctx, en.trim, x => { x.moveTo(-2, -34); x.lineTo(-8, -20); x.lineTo(-5, -20); x.lineTo(-2, -28); x.lineTo(1, -20); x.lineTo(4, -20); }); },
  archer(ctx, en, v) {
    if (v === 1) { // cataphract: armoured horse and rider with lance
      P(ctx, '#3A3F47', x => { x.moveTo(-30, -2); x.lineTo(-24, -24); x.lineTo(-10, -28); x.lineTo(12, -28); x.lineTo(26, -32); x.lineTo(36, -42); x.lineTo(42, -40); x.lineTo(38, -28); x.lineTo(46, -24); x.lineTo(32, -20); x.lineTo(26, -8); x.lineTo(30, 0); x.lineTo(22, 0); x.lineTo(16, -10); x.lineTo(0, -8); x.lineTo(-10, 0); x.lineTo(-18, 0); x.lineTo(-20, -10); x.lineTo(-34, 0); });
      ctx.strokeStyle = IRON; ctx.lineWidth = 1; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-22 + i * 10, -26); ctx.lineTo(-22 + i * 10, -12); ctx.stroke(); }
      body(ctx, IRON, 11, 20, -30); headAt(ctx, IRON, -58, 5); P(ctx, '#7A4A1E', x => { x.moveTo(-5, -62); x.lineTo(0, -72); x.lineTo(5, -62); });
      ctx.strokeStyle = '#B9B2A5'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-10, -40); ctx.lineTo(44, -56); ctx.stroke();
    } else { warriorBase(ctx, en, { tunic: '#C8A070' }); P(ctx, '#7A4A1E', x => { x.moveTo(-6, -46); x.lineTo(0, -60); x.lineTo(6, -46); }); // pointed cap
      ctx.strokeStyle = WOOD; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(10, -50); ctx.quadraticCurveTo(22, -34, 10, -18); ctx.stroke(); ctx.strokeStyle = '#D9D4C8'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(10, -50); ctx.lineTo(2, -34); ctx.lineTo(10, -18); ctx.stroke();
      ctx.strokeStyle = '#B9B2A5'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(2, -34); ctx.lineTo(24, -36); ctx.stroke(); } },
  egyptian(ctx, en, v) {
    if (v === 1) { // chariot
      P(ctx, '#2A1C14', x => { x.moveTo(-38, -6); x.lineTo(-30, -24); x.lineTo(-10, -26); x.lineTo(2, -30); x.lineTo(14, -38); x.lineTo(20, -36); x.lineTo(16, -24); x.lineTo(24, -20); x.lineTo(10, -16); x.lineTo(6, 0); x.lineTo(0, 0); x.lineTo(-4, -8); x.lineTo(-18, -8); x.lineTo(-24, 0); x.lineTo(-30, 0); });
      P(ctx, GOLD, x => { x.moveTo(-70, -10); x.lineTo(-68, -30); x.lineTo(-36, -30); x.lineTo(-34, -10); }); P(ctx, WOOD_D, x => x.arc(-52, -4, 9, 0, Math.PI * 2)); P(ctx, GOLD, x => x.arc(-52, -4, 3, 0, Math.PI * 2));
      ctx.save(); ctx.translate(-52, -28); body(ctx, '#E8DCC2', 12, 20, -2); headAt(ctx, en.skin, -30, 4.8); P(ctx, en.color, x => { x.moveTo(-7, -34); x.lineTo(0, -37); x.lineTo(7, -34); x.lineTo(8, -22); x.lineTo(-8, -22); }); ctx.strokeStyle = '#D9D4C8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(8, -30); ctx.quadraticCurveTo(22, -40, 16, -50); ctx.stroke(); ctx.restore();
    } else { warriorBase(ctx, en, { tunic: '#E8DCC2' }); P(ctx, en.color, x => { x.moveTo(-7, -48); x.lineTo(0, -52); x.lineTo(7, -48); x.lineTo(9, -34); x.lineTo(-9, -34); }); ctx.strokeStyle = GOLD; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-8, -42); ctx.lineTo(8, -42); ctx.stroke();
      ctx.strokeStyle = '#D9D4C8'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(10, -30); ctx.quadraticCurveTo(26, -40, 20, -54); ctx.stroke(); // khopesh
      P(ctx, en.color, x => { x.moveTo(-14, -8); x.lineTo(-14, -36); x.quadraticCurveTo(-6, -46, 2, -36); x.lineTo(2, -8); }); ctx.strokeStyle = en.trim; ctx.lineWidth = 1.2; ctx.stroke(); } },
  caetratus(ctx, en) { warriorBase(ctx, en, { tunic: '#D9CDB4' }); P(ctx, '#2A1C14', x => { x.moveTo(-6, -46); x.quadraticCurveTo(0, -56, 6, -46); x.lineTo(7, -40); x.lineTo(-7, -40); }); ctx.strokeStyle = RED; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-6, -43); ctx.lineTo(6, -43); ctx.stroke(); // headband
    P(ctx, '#6B4A2A', x => { x.moveTo(-7, -38); x.lineTo(7, -38); x.lineTo(9, -18); x.lineTo(-9, -18); }); ctx.strokeStyle = '#D9D4C8'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(10, -28); ctx.quadraticCurveTo(24, -34, 22, -50); ctx.stroke(); // falcata
    roundShield(ctx, -8, -24, 7, en.color, en.trim); },
  rebel(ctx, en) { legionary(ctx, { tunic: '#4A3A5A', shield: en.color, skin: en.skin }); },
  warrior(ctx, en) { warriorBase(ctx, en); spear(ctx, 12, -64, -8); roundShield(ctx, -6, -24, 11, en.color, en.trim); },
};

// ---------------------------------------------------------------- sprite cache
const cache = new Map();
function sprite(key, painter, px, w = 110, hgt = 140, ox = 55, oy = 136, flip = false) {
  const k = `${key}|${px.toFixed(2)}|${flip ? 'f' : ''}`;
  let c = cache.get(k); if (c) return c;
  const cv = document.createElement('canvas'); cv.width = Math.ceil(w * px); cv.height = Math.ceil(hgt * px);
  const ctx = cv.getContext('2d'); ctx.scale(px, px); ctx.translate(ox, oy); if (flip) ctx.scale(-1, 1);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  painter(ctx);
  c = { cv, ox, oy, w, hgt }; cache.set(k, c); return c;
}

// ---------------------------------------------------------------- the battle
const HERO_COLORS = { red: '#8B1E1E', white: '#F0E1BC', black: '#1A1410', gold: '#C9A227', purple: '#66023C', green: '#4F6A3F' };
let HERO = { crest: '#8B1E1E', cloak: null };
export function createBattle({ province = 'default', mode = 'field', needed = 0, motion = true, chapter = null } = {}) {
  try { const eq = getCosmetic().equipped || {}; HERO = { crest: HERO_COLORS[eq.crest] || '#8B1E1E', cloak: eq.cloak && eq.cloak !== 'red' ? HERO_COLORS[eq.cloak] : null }; } catch { HERO = { crest: '#8B1E1E', cloak: null }; }
  const en = ENEMY[province] || ENEMY.default;
  const cmd = mode === 'siege' ? commanderFor(province) : null;
  const root = h('div', { class: 'battle-band canvas' + (mode === 'siege' ? ' siege' : ''), 'aria-hidden': 'true' });
  const canvas = h('canvas', { class: 'battle-canvas' });
  root.appendChild(canvas);
  let hud = null, tauntEl = null, tauntTimer = 0;
  if (cmd) {
    tauntEl = h('div', { class: 'taunt' });
    hud = h('div', { class: 'siege-hud' }, h('div', { class: 'cmd-portrait' }, portraitSvg(cmd, 64)), h('div', { class: 'cmd-text' }, h('div', { class: 'cmd-name' }, cmd.name), h('div', { class: 'cmd-title' }, cmd.title)));
    root.appendChild(hud); root.appendChild(tauntEl);
  }
  const ctx = canvas.getContext('2d');
  const S = { motion, dpr: Math.min(2, window.devicePixelRatio || 1), scale: 1, LW: 1400, cssW: 0, cssH: 0, t: 0, last: 0, raf: 0, visible: false, dead: false,
    adv: 0, legX: 0, legTarget: 0, enX: 0, enTarget: 0, surge: 0, shake: 0, shakeT: 0, red: 0, testudoUntil: 0, units: [], riders: [], flags: [], parts: [], projs: [], standard: null, rout: false,
    cracks: [], hits: 0, breach: null, eagle: null, duckUntil: 0, ballistaRecoil: 0, storm: false, rnd: mulberry(7) };
  const siege = mode === 'siege';

  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = () => S.rnd();

  // ---- layout
  function layout() {
    const r = root.getBoundingClientRect();
    S.cssW = Math.max(200, r.width); S.cssH = Math.max(48, r.height);
    S.scale = S.cssH / H; S.LW = S.cssW / S.scale;
    canvas.width = Math.round(S.cssW * S.dpr); canvas.height = Math.round(S.cssH * S.dpr);
    canvas.style.width = S.cssW + 'px'; canvas.style.height = S.cssH + 'px';
    placeUnits();
  }
  function placeUnits() {
    const LW = S.LW; const units = [];
    const legN = Math.max(3, Math.min(10, Math.floor((LW * 0.36) / 50)));
    const enN = siege ? 0 : Math.max(3, Math.min(9, Math.floor((LW * 0.34) / 52)));
    RANKS.forEach(([y, sc], r) => {
      for (let i = 0; i < legN; i++) units.push({ side: 'leg', type: 'legionary', x: 56 + i * 50 - r * 18, y, sc, rank: r, ph: R() * 6.28, fall: 0, dx: 0, alpha: 1, v: 0 });
      for (let i = 0; i < enN; i++) units.push({ side: 'en', type: en.unit, variant: (i % 4 === 1 && r === 2) ? 1 : 0, x: LW - 66 - i * 52 + r * 16, y, sc, rank: r, ph: R() * 6.28, fall: 0, dx: 0, alpha: 1, v: 0 });
    });
    const lead = units.find(u => u.side === 'leg' && u.rank === 2); if (lead) lead.hero = true;
    const fx = 56 + legN * 50 + 10;
    units.push({ side: 'leg', type: 'signifer', x: fx, y: 204, sc: 1.2, rank: 2, ph: 1, fall: 0, dx: 0, alpha: 1 });
    units.push({ side: 'leg', type: 'aquilifer', x: fx + 46, y: 204, sc: 1.2, rank: 2, ph: 2, fall: 0, dx: 0, alpha: 1 });
    // keep fallen state across resizes is not needed; reset
    S.units = units; S.front = fx + 60;
    if (siege) {
      S.wall = { x0: LW * 0.56, top: 96, gateX: LW * 0.56 + (LW - LW * 0.56) * 0.42, gateW: 56 };
      S.defenders = []; for (let i = 0; i < Math.max(3, Math.min(7, Math.floor((LW - S.wall.x0 - 60) / 52))); i++) S.defenders.push({ x: S.wall.x0 + 36 + i * 52, ph: R() * 6.28 });
      S.ballista = { x: Math.min(S.front + 140, S.wall.x0 - 80), y: 204 }; S.onager = { x: Math.min(S.front + 70, S.wall.x0 - 150), y: 204 };
    }
  }
  const ro = new ResizeObserver(() => { if (!S.dead) { layout(); render(); } });
  ro.observe(root);

  // ---- helpers
  const px = () => S.scale * S.dpr;
  function blit(key, painter, x, y, sc, flip = false, rot = 0, alpha = 1) {
    const sp = sprite(key, painter, px() * sc, 160, 150, 80, 146, flip);
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); if (rot) ctx.rotate(rot);
    ctx.drawImage(sp.cv, -sp.ox * sc, -sp.oy * sc, sp.w * sc, sp.hgt * sc); ctx.restore();
  }
  function spawn(n, fn) { for (let i = 0; i < n; i++) S.parts.push(fn(i)); }
  const dust = (x, y, n = 6, big = 1) => spawn(n, () => ({ kind: 'dust', x: x + (R() - 0.5) * 20, y, vx: (R() - 0.5) * 40, vy: -20 - R() * 30, life: 0, ttl: 0.9 + R() * 0.6, r: (3 + R() * 5) * big, c: '205,186,146' }));
  const sparks = (x, y, n = 12) => spawn(n, () => ({ kind: 'spark', x, y, vx: (R() - 0.5) * 260, vy: -60 - R() * 220, life: 0, ttl: 0.35 + R() * 0.3, r: 1.2 + R() * 1.6, c: '255,214,110' }));
  const debris = (x, y, n = 8, c = '90,63,34') => spawn(n, () => ({ kind: 'debris', x, y, vx: (R() - 0.5) * 220, vy: -80 - R() * 200, life: 0, ttl: 0.9 + R() * 0.6, r: 2 + R() * 3.5, rot: R() * 6, vr: (R() - 0.5) * 12, c }));
  const smoke = (x, y) => S.parts.push({ kind: 'smoke', x: x + (R() - 0.5) * 6, y, vx: (R() - 0.5) * 14 + 8, vy: -24 - R() * 14, life: 0, ttl: 2.2 + R() * 1.4, r: 4 + R() * 4, c: '120,110,100' });
  function shake(a) { S.shake = Math.max(S.shake, a); S.shakeT = 0; }

  // ---- public reactions (field)
  function frontEnemy() { return S.units.filter(u => u.side === 'en' && u.rank === 2 && !u.fall && !u.rout); }
  root.advance = (streak = 0) => {
    S.adv = Math.min(S.adv + 1, 12); S.legTarget = S.adv * 22; S.enTarget = S.adv * 8;
    const fx = S.front + S.legX; const tx = siege ? (S.wall.x0 + 10) : (S.LW - 60 - S.enX);
    for (let i = 0; i < 7; i++) S.projs.push({ kind: 'pilum', x: fx - 160 + i * 22, y: 140 - i * 3, vx: (tx - fx) / 0.62, vy: -210 - i * 6, len: 26, t: 0, onHit: () => { sparks(tx - 10 + R() * 20, 150 + R() * 30, 5); } });
    const front = frontEnemy(); front.forEach((u, i) => { if (R() < 0.7) { u.stagger = 0.001; u.staggerSeed = R(); } });
    S.units.filter(u => u.side === 'leg').forEach(u => { u.step = 0.001; });
    dust(fx - 40, 200, 10);
    if (streak >= 3) { S.testudoUntil = S.t + 1.6; }
    if (streak >= 5) { S.riders = []; for (let i = 0; i < 4; i++) S.riders.push({ x: -220 - i * 90, y: 200 - (i % 2) * 6, v: 760 + i * 40, ph: R() * 6 }); }
    kick();
  };
  root.setback = () => {
    S.adv = Math.max(S.adv - 1, 0); S.legTarget = S.adv * 22; S.enTarget = S.adv * 8;
    S.surge = 1; S.red = 1; shake(6);
    const cands = S.units.filter(u => u.side === 'leg' && u.type === 'legionary' && u.rank === 2 && !u.fall);
    if (cands.length) { const u = cands[Math.floor(R() * cands.length)]; u.fall = 0.001; }
    debris(S.front + S.legX + 10, 180, 6, '70,70,78');
    dust(S.front + S.legX, 200, 8);
    kick();
  };
  root.plantFlag = (cid) => { if (S.flags.some(f => f.cid === cid && !f.down)) return; S.flags.push({ cid, t: 0, down: null }); kick(); };
  root.clearFlag = (cid) => { const f = S.flags.find(x => x.cid === cid && !x.down) || S.flags.find(x => !x.down); if (f) { f.down = 0.001; sparks(flagX(S.flags.indexOf(f)), 160, 8); kick(); } };
  root.setPursuits = (n) => { const live = S.flags.filter(f => !f.down); while (live.length < n) { const f = { cid: 'p' + live.length, t: 0, down: null }; S.flags.push(f); live.push(f); } while (live.length > n) { live.pop().down = 0.001; } kick(); };
  root.win = () => { S.rout = true; S.standard = { t: 0 }; S.units.filter(u => u.side === 'en').forEach(u => { u.rout = true; u.v = 200 + R() * 160; }); S.flags.forEach(f => { if (!f.down) f.down = 0.001; }); sparks(S.front + S.legX + 60, 120, 30); kick(); };
  // ---- public reactions (siege)
  root.hit = () => {
    if (!siege) return root.advance(0);
    S.hits++; const w = S.wall; const cx = w.x0 + 30 + R() * (S.LW - w.x0 - 60); const cy = w.top + 10 + R() * 70;
    const useBolt = S.hits % 2 === 1;
    const from = useBolt ? { x: S.ballista.x + 30, y: 152 } : { x: S.onager.x + 10, y: 150 };
    const dt = useBolt ? 0.42 : 0.9;
    S.projs.push({ kind: useBolt ? 'bolt' : 'stone', x: from.x, y: from.y, vx: (cx - from.x) / dt, vy: useBolt ? -40 : -(cy - from.y) / dt - 0.5 * 700 * dt, g: useBolt ? 100 : 700, len: 40, t: 0, tx: cx, onHit: () => { addCrack(cx, cy); debris(cx, cy, 14, '180,170,150'); dust(cx, cy + 20, 6); shake(5); S.duckUntil = S.t + 1.2; } });
    if (useBolt) S.ballistaRecoil = 1;
    S.units.filter(u => u.side === 'leg').forEach(u => { u.step = 0.001; });
    S.adv = Math.min(S.adv + 1, 10); S.legTarget = S.adv * 10;
    kick();
  };
  root.miss = () => {
    if (!siege) return root.setback();
    S.red = 1; shake(4); S.testudoUntil = S.t + 1.4;
    const w = S.wall;
    for (let i = 0; i < 14; i++) { const sx = w.x0 + 20 + R() * (S.LW - w.x0 - 40); const tx = 40 + R() * (S.front + 40); const dt = 0.8 + R() * 0.3; S.projs.push({ kind: 'arrow', x: sx, y: w.top - 10, vx: (tx - sx) / dt, vy: -(200 - (w.top - 10)) / dt - 0.5 * 600 * dt, g: 600, len: 14, t: 0, delay: R() * 0.25, onHit: (p) => dust(p.x, 200, 2, 0.6) }); }
    kick();
  };
  root.breach = () => {
    if (!siege || S.breach) return;
    S.breach = { t: 0 }; shake(10); S.storm = true;
    const w = S.wall; debris(w.gateX, 170, 24, '120,100,80'); debris(w.gateX, 130, 26, '180,170,150'); dust(w.gateX, 200, 20, 1.6);
    S.units.filter(u => u.side === 'leg').forEach((u, i) => { u.storm = true; u.v = 120 + R() * 80 + u.rank * 20; });
    setTimeout(() => { if (!S.dead) { S.eagle = { t: 0 }; sparks(w.gateX, 80, 30); kick(); } }, 1600);
    kick();
  };
  root.integrity = () => needed ? Math.max(0, 1 - S.hits / needed) : 1;
  root.taunt = (text, kind = 'taunt') => { if (!tauntEl) return; tauntEl.textContent = text; tauntEl.className = 'taunt show ' + kind; clearTimeout(tauntTimer); tauntTimer = setTimeout(() => tauntEl.classList.remove('show'), kind === 'surrender' ? 6000 : 3200); };
  root.randomTaunt = () => { if (cmd) root.taunt(cmd.taunts[Math.floor(R() * cmd.taunts.length)]); };
  root.surrender = () => { if (cmd) root.taunt(cmd.surrender, 'surrender'); };
  root.commander = cmd; root.enemyName = en.name;
  root.setMotion = (m) => { S.motion = m; if (m) kick(); else { step(6); render(); } };

  function flagX(i) { return S.front + 60 + S.legX + 40 + i * 34; }
  function addCrack(x, y) { const pts = [[x, y]]; let cx = x, cy = y; const n = 3 + Math.floor(R() * 4); for (let i = 0; i < n; i++) { cx += (R() - 0.3) * 24; cy += 8 + R() * 16; pts.push([cx, Math.min(cy, 198)]); } S.cracks.push({ pts, t: 0 }); }

  // ---- simulation
  function step(dt) {
    if (siege && !S.wall) layout(); // the first frame can land before the ResizeObserver has laid the siege out
    S.t += dt;
    S.legX += (S.legTarget - S.legX) * Math.min(1, dt * 4);
    S.enX += (S.enTarget - S.enX) * Math.min(1, dt * 4);
    if (S.surge > 0) S.surge = Math.max(0, S.surge - dt * 1.6);
    if (S.red > 0) S.red = Math.max(0, S.red - dt * 1.8);
    if (S.shake > 0) { S.shakeT += dt; S.shake = Math.max(0, S.shake - dt * 18); }
    if (S.ballistaRecoil > 0) S.ballistaRecoil = Math.max(0, S.ballistaRecoil - dt * 2.2);
    for (const u of S.units) {
      if (u.fall) { u.fall += dt; if (u.fall > 2.6) { u.fall = 0; u.alpha = 0.2; } }
      if (u.alpha < 1 && !u.fall) u.alpha = Math.min(1, u.alpha + dt * 0.8);
      if (u.stagger) { u.stagger += dt; if (u.stagger > 0.6) u.stagger = 0; }
      if (u.step) { u.step += dt; if (u.step > 0.5) u.step = 0; }
      if (u.rout) { u.x += u.v * dt; u.v += 40 * dt; }
      if (u.storm) { u.x += u.v * dt; if (u.x > S.wall.gateX + 30) { u.alpha = Math.max(0, u.alpha - dt * 2.5); } }
    }
    S.riders = S.riders.filter(r => r.x < S.LW + 260); for (const r of S.riders) { r.x += r.v * dt; if (R() < 0.5) dust(r.x - 20, 200, 1, 1.3); }
    for (const f of S.flags) { if (f.down) f.down += dt; else f.t += dt; }
    S.flags = S.flags.filter(f => !(f.down && f.down > 1.4));
    if (S.standard) S.standard.t += dt;
    if (S.breach) S.breach.t += dt;
    if (S.eagle) S.eagle.t += dt;
    for (const c of S.cracks) c.t += dt;
    // projectiles
    const live = [];
    for (const p of S.projs) {
      if (p.delay) { p.delay -= dt; if (p.delay > 0) { live.push(p); continue; } }
      p.t += dt; const g = p.g ?? 620; p.x += p.vx * dt; p.vy += g * dt; p.y += p.vy * dt;
      const hit = p.kind === 'arrow' ? p.y >= 196 : p.kind === 'pilum' ? (p.vx > 0 ? p.x >= (siege ? S.wall.x0 + 8 : S.LW - 70 - S.enX) : p.x <= S.front + 40) : p.x >= p.tx;
      if (hit || p.t > 3) { p.onHit && p.onHit(p); } else live.push(p);
    }
    S.projs = live;
    // particles
    const keep = [];
    for (const q of S.parts) {
      q.life += dt; if (q.life > q.ttl) continue;
      if (q.kind === 'dust') { q.vx *= 0.96; q.vy *= 0.94; q.r += dt * 6; }
      else if (q.kind === 'spark') { q.vy += 500 * dt; }
      else if (q.kind === 'debris') { q.vy += 700 * dt; q.rot += q.vr * dt; if (q.y > 200) { q.y = 200; q.vy *= -0.3; q.vx *= 0.6; } }
      else if (q.kind === 'smoke') { q.r += dt * 5; q.vx += 2 * dt; }
      q.x += q.vx * dt; q.y += q.vy * dt; keep.push(q);
    }
    S.parts = keep;
    if (siege && R() < dt * 4) smoke(S.wall ? S.wall.x0 - 30 : 300, 112);
    if (!siege && R() < dt * 3) smoke(26, 150);
  }

  // ---- drawing
  function render() {
    if (siege && !S.wall) layout();
    const LW = S.LW; ctx.setTransform(S.dpr * S.scale, 0, 0, S.dpr * S.scale, 0, 0);
    ctx.clearRect(0, 0, LW, H);
    let sx = 0, sy = 0; if (S.shake > 0) { sx = (R() - 0.5) * S.shake; sy = (R() - 0.5) * S.shake * 0.6; }
    ctx.save(); ctx.translate(sx, sy);
    // ground
    const g = ctx.createLinearGradient(0, 110, 0, H); g.addColorStop(0, 'rgba(74,58,38,0)'); g.addColorStop(0.45, 'rgba(58,44,28,0.85)'); g.addColorStop(1, '#160F09');
    ctx.fillStyle = g; ctx.fillRect(-20, 110, LW + 40, H - 110);
    const hz = ctx.createRadialGradient(LW / 2, H, 10, LW / 2, H, LW * 0.5); hz.addColorStop(0, 'rgba(205,186,146,0.28)'); hz.addColorStop(1, 'rgba(205,186,146,0)'); ctx.fillStyle = hz; ctx.fillRect(0, 100, LW, H - 100);
    if (siege) drawCity();
    else drawBrazier(26, 200);
    // pursuit flags (midground)
    S.flags.forEach((f, i) => drawFlag(flagX(i), f));
    // siege engines
    if (siege) { drawOnager(S.onager.x, S.onager.y); drawBallista(S.ballista.x, S.ballista.y, S.ballistaRecoil); }
    // units by rank (back to front), both sides interleaved for depth
    const testudo = S.t < S.testudoUntil;
    for (let r = 0; r < 3; r++) {
      for (const u of S.units) {
        if (u.rank !== r || u.alpha <= 0) continue;
        const bob = Math.sin(S.t * 4 + u.ph) * 1.2;
        let x = u.x, y = u.y + bob, rot = 0, alpha = u.alpha;
        if (u.side === 'leg') { x += S.legX - (u.step ? Math.sin(u.step / 0.5 * Math.PI) * 10 : 0) * 0; if (u.step) x += Math.sin(u.step / 0.5 * Math.PI) * 8; }
        else { x += S.enX - S.surge * 34 * Math.sin(Math.PI * Math.min(1, S.surge)); if (u.stagger) { x += Math.sin(u.stagger / 0.6 * Math.PI) * 18; rot = -Math.sin(u.stagger / 0.6 * Math.PI) * 0.25; } }
        if (u.fall) { const k = Math.min(1, u.fall * 2.4); rot = (u.side === 'leg' ? -1 : 1) * k * 1.35; y += k * 6; if (u.fall > 2.0) alpha *= Math.max(0, 1 - (u.fall - 2.0) / 0.6); }
        if (u.rout) rot = Math.sin(S.t * 18 + u.ph) * 0.12;
        const flip = u.side === 'en';
        if (u.type === 'legionary') { if (u.hero) blit(testudo ? 'hero-t' : 'hero', c => legionary(c, { testudo, crest: HERO.crest, cloak: HERO.cloak }), x, y, u.sc * 1.12, false, rot, alpha); else blit(testudo ? 'leg-t' : 'leg', c => legionary(c, { testudo }), x, y, u.sc, false, rot, alpha); }
        else if (u.type === 'signifer') blit('sig', signifer, x, y, u.sc, false, rot, alpha);
        else if (u.type === 'aquilifer') blit('aq', aquilifer, x, y, u.sc, false, rot, alpha);
        else blit(u.type + (u.variant || 0), c => ENEMY_PAINT[u.type](c, en, u.variant || 0), x, y, u.sc, flip, rot, alpha);
      }
    }
    // riders
    for (const r of S.riders) blit('cav', cavalry, r.x, r.y + Math.sin(S.t * 14 + r.ph) * 3, 1, false, 0, 1);
    // projectiles
    for (const p of S.projs) {
      if (p.delay && p.delay > 0) continue;
      const ang = Math.atan2(p.vy, p.vx);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
      if (p.kind === 'stone') { ctx.fillStyle = '#8E867A'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#3A322A'; ctx.lineWidth = 1; ctx.stroke(); }
      else { ctx.strokeStyle = p.kind === 'bolt' ? '#D9D4C8' : p.kind === 'arrow' ? '#C8B898' : '#EDE6D6'; ctx.lineWidth = p.kind === 'bolt' ? 2.6 : p.kind === 'pilum' ? 2.2 : 1.4; ctx.beginPath(); ctx.moveTo(-p.len, 0); ctx.lineTo(0, 0); ctx.stroke(); ctx.fillStyle = '#EDE6D6'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-6, -2.2); ctx.lineTo(-6, 2.2); ctx.fill(); }
      ctx.restore();
    }
    // standard raised on victory
    if (S.standard) drawStandard(S.front + S.legX + 70, 200, S.standard.t);
    if (S.eagle) drawEagleRaised(S.wall.gateX, S.eagle.t);
    // particles
    for (const q of S.parts) {
      const k = 1 - q.life / q.ttl;
      if (q.kind === 'dust') { ctx.fillStyle = `rgba(${q.c},${0.28 * k})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill(); }
      else if (q.kind === 'smoke') { ctx.fillStyle = `rgba(${q.c},${0.22 * k})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill(); }
      else if (q.kind === 'spark') { ctx.fillStyle = `rgba(${q.c},${k})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill(); }
      else if (q.kind === 'debris') { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.fillStyle = `rgba(${q.c},${Math.min(1, k * 2)})`; ctx.fillRect(-q.r, -q.r * 0.6, q.r * 2, q.r * 1.2); ctx.restore(); }
    }
    ctx.restore();
    // red vignette pulse
    if (S.red > 0) { const v = ctx.createRadialGradient(LW / 2, H * 0.6, LW * 0.1, LW / 2, H * 0.6, LW * 0.6); v.addColorStop(0, 'rgba(139,30,30,0)'); v.addColorStop(1, `rgba(139,30,30,${0.55 * S.red})`); ctx.fillStyle = v; ctx.fillRect(0, 0, LW, H); }
  }
  function drawBrazier(x, y) {
    ctx.fillStyle = IRON_D; ctx.fillRect(x - 3, y - 48, 6, 48); ctx.fillStyle = '#2B2B2E'; ctx.beginPath(); ctx.ellipse(x, y - 50, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    const fl = ctx.createRadialGradient(x, y - 60, 2, x, y - 60, 22); fl.addColorStop(0, 'rgba(255,241,176,0.9)'); fl.addColorStop(0.4, 'rgba(255,179,71,0.6)'); fl.addColorStop(1, 'rgba(226,88,30,0)'); ctx.fillStyle = fl; ctx.beginPath(); ctx.arc(x, y - 58 + Math.sin(S.t * 9) * 1.5, 18, 0, Math.PI * 2); ctx.fill();
  }
  function drawFlag(x, f) {
    const up = f.down ? 1 : Math.min(1, f.t / 0.45); const spring = up < 1 ? Math.sin(up * Math.PI / 2) * (1 + 0.15 * Math.sin(up * Math.PI)) : 1;
    let rot = 0, alpha = 1; if (f.down) { rot = Math.min(1, f.down / 0.5) * 1.45; alpha = f.down > 0.8 ? Math.max(0, 1 - (f.down - 0.8) / 0.6) : 1; }
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, 198); ctx.rotate(rot); ctx.scale(1, spring);
    ctx.strokeStyle = '#3A3F47'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -52); ctx.stroke();
    const w = Math.sin(S.t * 6 + x) * 2;
    ctx.fillStyle = en.color; ctx.beginPath(); ctx.moveTo(0, -52); ctx.lineTo(22 + w, -46); ctx.lineTo(0, -38); ctx.fill(); ctx.strokeStyle = en.trim; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  function drawStandard(x, y, t) {
    const k = Math.min(1, t / 1.1); const hgt = 118 * (1 - Math.pow(1 - k, 3));
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - hgt); ctx.stroke();
    if (hgt > 40) { const w = Math.sin(t * 7) * 3; ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(x, y - hgt + 6); ctx.lineTo(x + 40 + w, y - hgt + 10); ctx.lineTo(x + 40 - w, y - hgt + 34); ctx.lineTo(x, y - hgt + 30); ctx.fill(); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.stroke(); eagle(ctx, x, y - hgt - 6, 1.1); }
  }
  function drawCity() {
    const w = S.wall; const LW = S.LW; const x0 = w.x0; const top = w.top;
    // glow of the city beyond the wall
    const glow = ctx.createLinearGradient(0, 40, 0, top); glow.addColorStop(0, 'rgba(255,179,71,0)'); glow.addColorStop(1, 'rgba(255,179,71,0.12)'); ctx.fillStyle = glow; ctx.fillRect(x0, 40, LW - x0 + 40, top - 40);
    const broken = S.breach ? Math.min(1, S.breach.t / 1.2) : 0;
    // wall body with stone courses
    ctx.fillStyle = '#9A8F7C'; ctx.fillRect(x0, top, LW - x0 + 40, 200 - top);
    ctx.strokeStyle = 'rgba(40,30,20,0.35)'; ctx.lineWidth = 1;
    for (let y = top + 12; y < 200; y += 12) { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(LW + 40, y); ctx.stroke(); }
    for (let y = top, row = 0; y < 200; y += 12, row++) for (let x = x0 + (row % 2) * 14; x < LW + 40; x += 28) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 12); ctx.stroke(); }
    const sh = ctx.createLinearGradient(0, top, 0, 200); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = sh; ctx.fillRect(x0, top, LW - x0 + 40, 200 - top);
    // crenellations
    ctx.fillStyle = '#A89D8A'; for (let x = x0; x < LW + 40; x += 24) ctx.fillRect(x, top - 12, 14, 12);
    // towers
    [[x0 - 18, 48], [LW - 70, 44]].forEach(([tx, ty], i) => { ctx.fillStyle = '#8E8370'; ctx.fillRect(tx, ty, 54, 200 - ty); ctx.fillStyle = '#A89D8A'; for (let x = tx - 4; x < tx + 58; x += 16) ctx.fillRect(x, ty - 12, 10, 12); ctx.fillStyle = '#2A1C14'; ctx.fillRect(tx + 22, ty + 20, 10, 16);
      // banner: enemy colour, then SPQR after the breach
      const bx = tx + 27, by = ty - 36; if (!(i === 1 && !(S.eagle && S.eagle.t > 0.6))) { ctx.strokeStyle = WOOD_D; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, ty - 10); ctx.stroke(); }
      const won = S.eagle && S.eagle.t > 0.6; const fw = Math.sin(S.t * 5 + i) * 2;
      if (i === 1 && !won) return;
      ctx.fillStyle = won ? RED : en.color; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 26 + fw, by + 6); ctx.lineTo(bx, by + 18); ctx.fill(); ctx.strokeStyle = won ? GOLD : en.trim; ctx.lineWidth = 1; ctx.stroke(); });
    // gate (arch and doors)
    const gx = w.gateX, gw = w.gateW;
    ctx.fillStyle = '#1A1410'; ctx.beginPath(); ctx.moveTo(gx - gw / 2, 200); ctx.lineTo(gx - gw / 2, 140); ctx.quadraticCurveTo(gx, 112, gx + gw / 2, 140); ctx.lineTo(gx + gw / 2, 200); ctx.fill();
    ctx.strokeStyle = '#6B5F4D'; ctx.lineWidth = 4; ctx.stroke();
    const door = (side) => { ctx.save(); ctx.translate(gx + side * gw / 2, 200); const open = broken * 1.6; ctx.rotate(side * open * (side < 0 ? -1 : 1) * -1); ctx.fillStyle = WOOD; ctx.fillRect(side < 0 ? 0 : -gw / 2 + 2, -58, gw / 2 - 2, 58); ctx.strokeStyle = IRON_D; ctx.lineWidth = 2; [-48, -30, -12].forEach(y => { ctx.beginPath(); ctx.moveTo(side < 0 ? 0 : -gw / 2 + 2, y); ctx.lineTo(side < 0 ? gw / 2 - 2 : 0, y); ctx.stroke(); }); ctx.restore(); };
    if (broken < 1) { ctx.save(); ctx.globalAlpha = 1 - broken * 0.6; door(-1); door(1); ctx.restore(); }
    // cracks
    for (const c of S.cracks) { const k = Math.min(1, c.t / 0.4); const n = Math.max(1, Math.round(k * (c.pts.length - 1))); ctx.strokeStyle = 'rgba(30,22,14,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c.pts[0][0], c.pts[0][1]); for (let i = 1; i <= n; i++) ctx.lineTo(c.pts[i][0], c.pts[i][1]); ctx.stroke(); ctx.strokeStyle = 'rgba(255,240,220,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.pts[0][0] + 1.5, c.pts[0][1] + 1); for (let i = 1; i <= n; i++) ctx.lineTo(c.pts[i][0] + 1.5, c.pts[i][1] + 1); ctx.stroke(); }
    // breach: the gate section collapses into rubble
    if (S.breach) { const k = Math.min(1, S.breach.t / 1.4); ctx.fillStyle = '#1A1410'; ctx.fillRect(gx - 70 * k, top - 14, 140 * k, 200 - top + 14); ctx.fillStyle = '#7A7060'; ctx.beginPath(); ctx.ellipse(gx, 200, 80 * k, 22 * k, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#9A8F7C'; for (let i = 0; i < 9; i++) ctx.fillRect(gx - 60 + i * 14, 190 - (i % 3) * 7 * k, 12, 8); }
    // defenders on the rampart
    const duck = S.t < S.duckUntil ? 10 : 0;
    for (const d of S.defenders) { const bob = Math.sin(S.t * 3 + d.ph) * 1.2 + duck; ctx.save(); ctx.beginPath(); ctx.rect(d.x - 20, 0, 40, top - 12); ctx.clip(); blit(en.unit + 'd', c => ENEMY_PAINT[en.unit](c, en, 0), d.x, top - 12 + 34 + bob, 0.78, true, 0, S.rout ? 0 : 1); ctx.restore(); }
  }
  function drawBallista(x, y, recoil) {
    ctx.fillStyle = WOOD; ctx.fillRect(x - 24, y - 12, 48, 8); ctx.fillRect(x - 20, y - 4, 6, 4); ctx.fillRect(x + 14, y - 4, 6, 4);
    ctx.fillStyle = '#6B4B2A'; ctx.fillRect(x - 6, y - 50, 10, 40); ctx.fillStyle = WOOD; ctx.fillRect(x - 30 + recoil * 8, y - 44, 70, 7);
    ctx.strokeStyle = WOOD_D; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x - 24, y - 40); ctx.lineTo(x - 40, y - 62); ctx.moveTo(x - 24, y - 40); ctx.lineTo(x - 40, y - 18); ctx.stroke();
    ctx.strokeStyle = '#B9B2A5'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - 40, y - 62); ctx.lineTo(x - 6 - recoil * 14, y - 40); ctx.lineTo(x - 40, y - 18); ctx.stroke();
  }
  function drawOnager(x, y) {
    ctx.fillStyle = WOOD; ctx.fillRect(x - 26, y - 10, 52, 8); ctx.fillStyle = '#6B4B2A'; ctx.fillRect(x - 22, y - 30, 8, 22); ctx.fillRect(x + 14, y - 30, 8, 22); ctx.fillRect(x - 24, y - 32, 48, 5);
    ctx.strokeStyle = WOOD_D; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y - 28); ctx.lineTo(x + 10, y - 70); ctx.stroke(); ctx.fillStyle = '#8E867A'; ctx.beginPath(); ctx.arc(x + 12, y - 72, 5, 0, Math.PI * 2); ctx.fill();
  }
  function drawEagleRaised(x, t) {
    const k = Math.min(1, t / 1.2); const hgt = 150 * (1 - Math.pow(1 - k, 3));
    ctx.strokeStyle = GOLD; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x, 200 - hgt); ctx.stroke();
    if (hgt > 60) { ctx.fillStyle = RED; ctx.fillRect(x - 16, 200 - hgt + 10, 32, 16); ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.strokeRect(x - 16, 200 - hgt + 10, 32, 16); eagle(ctx, x, 200 - hgt - 8, 1.5); }
  }

  // ---- loop
  function frame(now) {
    S.raf = 0; if (S.dead) return;
    const dt = Math.min(0.05, (now - (S.last || now)) / 1000); S.last = now;
    step(dt); render();
    if (S.motion && S.visible && !document.hidden) S.raf = requestAnimationFrame(frame);
  }
  function kick() { if (S.dead) return; if (!S.motion) { step(6); render(); return; } if (!S.raf && S.visible && !document.hidden) { S.last = 0; S.raf = requestAnimationFrame(frame); } }
  const onVis = () => { if (!document.hidden) kick(); };
  document.addEventListener('visibilitychange', onVis);
  root.show = () => { S.visible = true; requestAnimationFrame(() => { root.classList.add('on'); layout(); kick(); }); };
  root.destroy = () => { S.dead = true; S.visible = false; if (S.raf) cancelAnimationFrame(S.raf); ro.disconnect(); document.removeEventListener('visibilitychange', onVis); root.classList.remove('on'); document.body.classList.remove('has-band'); setTimeout(() => root.remove(), 500); };
  root.deferDestroy = (ms) => { const d = root.destroy; root.destroy = () => setTimeout(d, ms); };
  return root;
}

/** Mount the battle for a runner. inline: true puts the strip inside the card on short screens. */
export function attachBattle(runnerEl, { province, mode = 'field', needed = 0, motion = true, inline = false } = {}) {
  const band = createBattle({ province, mode, needed, motion });
  if (inline) { band.classList.add('inline'); band.inline = true; }
  else { document.body.appendChild(band); document.body.classList.add('has-band'); }
  band.show();
  const prev = runnerEl.cleanup;
  runnerEl.cleanup = () => { band.destroy(); prev && prev(); };
  runnerEl.battlefield = band;
  return band;
}
