// Account flows: enter an existing profile by name, or create a new one. No passwords, no e-mail, no recovery.
import { RestError, rowToProfile } from './sync.js';
import { validateName, normalizeName, nameKey, freshProfile, safeGet, KEYS } from './store.js';

/** Open the profile called `raw`. Resolves { ok } or { ok:false, error, notFound?, offline? }. */
export async function enterProfile(store, syncer, raw) {
  const err = validateName(raw); if (err) return { ok: false, error: err };
  const key = nameKey(raw);
  let row = null; let offline = false;
  try { row = await syncer.findProfile(key); } catch (e) { if (e instanceof RestError) return { ok: false, error: 'The profile service answered with an error. Try again in a moment.' }; offline = true; }
  if (row) {
    const p = rowToProfile(row);
    const crows = await syncer.courseRows(p.id).catch(() => []);
    const states = {}; for (const r of crows) if (r.state && typeof r.state === 'object') states[r.course_id] = r.state;
    store.useProfile(p, states);
    return { ok: true };
  }
  if (offline) {
    const local = store.profiles.find(p => nameKey(p.username) === key);
    const cached = local && safeGet(KEYS.profile(local.id));
    if (cached) { store.useProfile(cached); return { ok: true, offline: true }; }
    return { ok: false, offline: true, error: 'You are offline and this name is not saved on this device yet.' };
  }
  return { ok: false, notFound: true, error: 'No profile with that name yet. Create it?' };
}

/** Create the profile called `raw`. Never opens someone else's profile: a taken name is an error. */
export async function createProfile(store, syncer, raw) {
  const err = validateName(raw); if (err) return { ok: false, error: err };
  const profile = freshProfile(normalizeName(raw));
  try {
    const row = await syncer.createProfile(profile);
    store.useProfile(rowToProfile(row));
    return { ok: true };
  } catch (e) {
    if (e instanceof RestError && e.taken) return { ok: false, taken: true, error: 'That name is taken. Pick a different one.' };
    if (e instanceof RestError) return { ok: false, error: `The profile service refused: ${e.message}` };
    return { ok: false, offline: true, error: 'You are offline. Creating a profile needs a connection once; after that it works offline.' };
  }
}
