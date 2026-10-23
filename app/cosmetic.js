// Cosmetic-only state under its own key (mark201.cosmetic.v1). The app must work when this key is missing.
// Never store anything the engine or the saved profile depends on here.
const KEY = 'mark201.cosmetic.v1';
export function getCosmetic() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } }
export function setCosmetic(patch) { try { const c = getCosmetic(); Object.assign(c, patch); localStorage.setItem(KEY, JSON.stringify(c)); return c; } catch { return patch; } }

/** Denarii: a cosmetic currency. Earned from correct answers, cleared pursuits, planted standards and wagers. */
export function getDenarii() { const c = getCosmetic(); return Math.max(0, Math.round(c.denarii || 0)); }
export function addDenarii(n, why = '') {
  const before = getDenarii(); const after = Math.max(0, before + Math.round(n || 0));
  if (after === before) return after;
  setCosmetic({ denarii: after });
  try { window.dispatchEvent(new CustomEvent('denarii', { detail: { before, after, delta: after - before, why } })); } catch { /* ignore */ }
  return after;
}
