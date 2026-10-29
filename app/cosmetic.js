// Cosmetic state. Two homes:
//  - the profile (synced across devices): denarii, owned items, equipped gear, daily orders, seen medals, streak marks;
//  - this device (mark201.cosmetic.v1): audio volume and mute, the 3D table and wager switches.
// Call sites keep using getCosmetic / setCosmetic / getDenarii / addDenarii; the store binds the profile at login.
// Before a profile is bound (login screen, tests) everything falls back to the device key, as it always did.
const KEY = 'mark201.cosmetic.v1';
const PROFILE_KEYS = new Set(['denarii', 'owned', 'equipped', 'orders', 'seenAch', 'lastStreak', 'lastBlitzDay']);
let bound = null; // { get(): cosmetics object, getCoins(), setCoins(n), changed() }

function readDev() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } }
function writeDev(patch) { try { const c = readDev(); Object.assign(c, patch); localStorage.setItem(KEY, JSON.stringify(c)); return c; } catch { return patch; } }

/** Bind (or unbind with null) the active profile's cosmetics. */
export function bindCosmetic(binding) { bound = binding || null; }
export function isBound() { return !!bound; }

export function getCosmetic() {
  const dev = readDev();
  if (!bound) return dev;
  const prof = bound.get() || {};
  const out = Object.assign({}, dev);
  for (const k of PROFILE_KEYS) { if (k === 'denarii') out.denarii = bound.getCoins(); else if (prof[k] !== undefined) out[k] = prof[k]; else delete out[k]; }
  return out;
}
export function setCosmetic(patch) {
  const dev = {}; const prof = {};
  for (const [k, v] of Object.entries(patch || {})) ((PROFILE_KEYS.has(k) && bound) ? prof : dev)[k] = v;
  if (Object.keys(dev).length) writeDev(dev);
  if (bound && Object.keys(prof).length) {
    if ('denarii' in prof) { bound.setCoins(prof.denarii); delete prof.denarii; }
    Object.assign(bound.get(), prof);
    bound.changed();
  }
  return getCosmetic();
}

/** Denarii: a cosmetic currency. Earned from correct answers, cleared pursuits, planted standards and wagers. */
export function getDenarii() { return Math.max(0, Math.round(bound ? bound.getCoins() : (readDev().denarii || 0))); }
export function addDenarii(n, why = '') {
  const before = getDenarii(); const after = Math.max(0, before + Math.round(n || 0));
  if (after === before) return after;
  setCosmetic({ denarii: after });
  try { window.dispatchEvent(new CustomEvent('denarii', { detail: { before, after, delta: after - before, why } })); } catch { /* ignore */ }
  return after;
}
