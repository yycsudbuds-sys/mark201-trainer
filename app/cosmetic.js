// Cosmetic-only state under its own key (mark201.cosmetic.v1). The app must work when this key is missing.
// Never store anything the engine or the saved profile depends on here.
const KEY = 'mark201.cosmetic.v1';
export function getCosmetic() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { return {}; } }
export function setCosmetic(patch) { try { const c = getCosmetic(); Object.assign(c, patch); localStorage.setItem(KEY, JSON.stringify(c)); return c; } catch { return patch; } }
