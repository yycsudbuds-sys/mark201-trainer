// Cloud sync: plain fetch calls to the Supabase REST API (PostgREST). No SDK, no auth beyond the public anon key.
// The store flags what changed; the syncer pushes it (debounced, and immediately when the tab hides or closes),
// pulls the latest on login, and exposes the leaderboard queries. Offline is a status, never an error.
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { mergeProfile, mergeCourseState, migrateProfile, nameKey, normalizeName } from './store.js';
import { levelForXp } from './engine.js';

const BASE = SUPABASE_URL.replace(/\/$/, '') + '/rest/v1';
const HEADERS = () => ({ apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' });

export class RestError extends Error {
  constructor(status, body) {
    super((body && (body.message || body.hint)) || `HTTP ${status}`);
    this.status = status; this.body = body || null; this.code = body && body.code;
    this.taken = status === 409 || this.code === '23505';
  }
}
export function configured() { return /^https?:\/\//.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20; }

/** One REST call. Resolves with parsed JSON (or null), rejects with RestError (HTTP) or TypeError (network). */
export async function rest(path, { method = 'GET', body, prefer, keepalive = false } = {}) {
  const headers = HEADERS(); if (prefer) headers.Prefer = prefer;
  const res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), keepalive, cache: 'no-store' });
  if (!res.ok) { let j = null; try { j = await res.json(); } catch { /* no body */ } throw new RestError(res.status, j); }
  if (res.status === 204) return null;
  const t = await res.text(); return t ? JSON.parse(t) : null;
}

// ---- row <-> profile
export function profileToRow(p) {
  const total = Object.values(p.courseXp || {}).reduce((s, x) => s + (x || 0), 0);
  return {
    id: p.id, username: p.username, username_key: nameKey(p.username),
    total_xp: total, level: levelForXp(total).number, coins: Math.max(0, Math.round(p.coins || 0)),
    cosmetics: p.cosmetics || {},
    settings: Object.assign({}, p.settings || {}, { _meta: { lastCourse: p.lastCourse || null, courseXp: p.courseXp || {}, weekStartXp: p.weekStartXp || 0, createdAt: p.createdAt || null, updatedAt: p.updatedAt || null } }),
    xp_week: Math.max(0, Math.round(p.xpWeek || 0)), week_key: p.weekKey || '', streak: p.streak || 0,
    last_active: new Date(p.lastActive || Date.now()).toISOString(), updated_at: new Date(p.updatedAt || Date.now()).toISOString(),
  };
}
export function rowToProfile(r) {
  const meta = (r.settings && r.settings._meta) || {};
  const settings = Object.assign({}, r.settings || {}); delete settings._meta;
  return migrateProfile({
    id: r.id, username: r.username, usernameKey: r.username_key, createdAt: meta.createdAt || Date.parse(r.created_at) || Date.now(), updatedAt: meta.updatedAt || Date.parse(r.updated_at) || 0,
    settings, cosmetics: r.cosmetics || {}, coins: r.coins || 0, courseXp: meta.courseXp || {}, lastCourse: meta.lastCourse || null,
    weekKey: r.week_key || '', weekStartXp: meta.weekStartXp || 0, xpWeek: r.xp_week || 0, streak: r.streak || 0, lastActive: Date.parse(r.last_active) || 0,
  });
}
function courseRow(profileId, courseId, state, derived) {
  const d = derived || state._derived || {};
  return { profile_id: profileId, course_id: courseId, state, xp: state.xp || 0, readiness: Number(d.readiness || 0), mastered_count: d.mastered || 0, total_concepts: d.total || 0, updated_at: new Date(state.updatedAt || Date.now()).toISOString() };
}

export class Syncer {
  /** opts.derive(courseId, state) -> { readiness, mastered, total } | null (needs the course pack). */
  constructor(store, opts = {}) {
    this.store = store; this.derive = opts.derive || null;
    this.status = configured() ? 'idle' : 'off'; this.detail = null; this.listeners = new Set();
    this.timer = null; this.inflight = null; this.again = false;
    this.online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    window.addEventListener('online', () => { this.online = true; this.flushNow(); });
    window.addEventListener('offline', () => { this.online = false; this.set('offline'); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.flushNow({ keepalive: true }); });
    window.addEventListener('pagehide', () => this.flushNow({ keepalive: true }));
    setInterval(() => { if (this.store.profile && this.hasDirty() && !this.inflight) this.flushNow(); }, 30000);
    store.onDirty = () => this.schedule();
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  set(status, detail = null) { this.status = status; this.detail = detail; for (const fn of this.listeners) { try { fn(status, detail); } catch { /* ignore */ } } }
  hasDirty() { const d = this.store.dirty(); return !!(d.profile || (d.courses && d.courses.length)); }
  schedule() { if (!configured()) return; clearTimeout(this.timer); if (this.status !== 'saving') this.set('pending'); this.timer = setTimeout(() => this.flushNow(), 1500); }
  /** Push everything flagged dirty. Safe to call often; concurrent calls coalesce. */
  flushNow({ keepalive = false } = {}) {
    clearTimeout(this.timer);
    if (!configured() || !this.store.profile) return Promise.resolve(false);
    const d = this.store.dirty();
    if (!d.profile && !d.courses.length) { if (this.status !== 'offline') this.set('saved'); return Promise.resolve(true); }
    if (this.inflight) { this.again = true; return this.inflight; }
    this.set('saving');
    const st = this.store; const pid = st.profile.id;
    const run = (async () => {
      try {
        // Another device may have written since we last looked: merge its rows in before writing ours.
        if (!keepalive) await this.absorbNewer(pid, d.courses);
        if (!st.profile || st.profile.id !== pid) return false;
        const prow = profileToRow(st.profile);
        await rest('/profiles?on_conflict=id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: prow, keepalive });
        st.profile._remote = prow.updated_at;
        for (const c of d.courses) {
          const state = st.courseState(c); if (!state) continue;
          const derived = this.derive ? this.derive(c, state) : null;
          if (derived) state._derived = derived;
          const row = courseRow(pid, c, state, derived);
          await rest('/course_progress?on_conflict=profile_id,course_id', { method: 'POST', prefer: 'resolution=merge-duplicates,return=minimal', body: row, keepalive });
          state._remote = row.updated_at;
        }
        if (st.profile && st.profile.id === pid) st.clearDirty(d);
        this.set('saved');
        return true;
      } catch (err) {
        this.set(err instanceof RestError ? 'error' : 'offline', err);
        return false;
      } finally {
        this.inflight = null;
        if (this.again) { this.again = false; this.flushNow(); }
      }
    })();
    this.inflight = run;
    return run;
  }
  /** Merge in any cloud row that is newer than the version this device last saw (cheap: timestamps first). */
  async absorbNewer(pid, courseIds) {
    const st = this.store;
    const [prow, crows] = await Promise.all([rest(`/profiles?id=eq.${pid}&select=updated_at`), rest(`/course_progress?profile_id=eq.${pid}&select=course_id,updated_at`)]);
    if (!st.profile || st.profile.id !== pid) return;
    const seen = st.profile._remote || '';
    if (prow && prow[0] && prow[0].updated_at > seen && (seen || Date.parse(prow[0].updated_at) > (st.profile.updatedAt || 0))) {
      const full = await rest(`/profiles?id=eq.${pid}&select=*`);
      if (full && full[0] && st.profile && st.profile.id === pid) { Object.assign(st.profile, mergeProfile(st.profile, rowToProfile(full[0]))); st.profile._remote = full[0].updated_at; }
    }
    for (const r of crows || []) {
      const local = st.courseState(r.course_id); const localSeen = (local && local._remote) || '';
      const stale = r.updated_at > localSeen && (localSeen || Date.parse(r.updated_at) > ((local && local.updatedAt) || 0));
      if (!stale) continue;
      const full = await rest(`/course_progress?profile_id=eq.${pid}&course_id=eq.${encodeURIComponent(r.course_id)}&select=state,updated_at`);
      if (!full || !full[0] || !full[0].state || !st.profile || st.profile.id !== pid) continue;
      const merged = local ? mergeCourseState(local, full[0].state) : full[0].state;
      merged._remote = full[0].updated_at;
      st.setCourseState(r.course_id, merged);
      if (!courseIds.includes(r.course_id)) courseIds.push(r.course_id);
    }
  }
  /** Pull the open profile and its courses from the cloud and merge them in. Resolves true when anything changed. */
  async pull() {
    const st = this.store; if (!configured() || !st.profile) return false;
    const pid = st.profile.id;
    try {
      const [rows, crows] = await Promise.all([rest(`/profiles?id=eq.${pid}&select=*`), rest(`/course_progress?profile_id=eq.${pid}&select=*`)]);
      if (!st.profile || st.profile.id !== pid) return false;
      const before = JSON.stringify([st.profile, [...st.courses.values()].map(s => s.updatedAt)]);
      if (rows && rows[0]) { Object.assign(st.profile, mergeProfile(st.profile, rowToProfile(rows[0]))); st.profile._remote = rows[0].updated_at; }
      for (const r of crows || []) { if (!r.state || typeof r.state !== 'object') continue; const local = st.courseState(r.course_id); const merged = local ? mergeCourseState(local, r.state) : r.state; merged._remote = r.updated_at; st.setCourseState(r.course_id, merged); }
      st.flush();
      const changed = before !== JSON.stringify([st.profile, [...st.courses.values()].map(s => s.updatedAt)]);
      if (this.status === 'offline' || this.status === 'idle') this.set('saved');
      return changed;
    } catch (err) { this.set(err instanceof RestError ? 'error' : 'offline', err); return false; }
  }
  async findProfile(name) { const rows = await rest(`/profiles?username_key=eq.${encodeURIComponent(nameKey(name))}&select=*`); return rows && rows[0] ? rows[0] : null; }
  async createProfile(profile) {
    const row = profileToRow(Object.assign({}, profile, { username: normalizeName(profile.username) }));
    const rows = await rest('/profiles', { method: 'POST', prefer: 'return=representation', body: row });
    return rows && rows[0] ? rows[0] : row;
  }
  async courseRows(profileId) { return (await rest(`/course_progress?profile_id=eq.${profileId}&select=*`)) || []; }
  async profileById(id) { const rows = await rest(`/profiles?id=eq.${encodeURIComponent(id)}&select=*`); return rows && rows[0] ? rows[0] : null; }
  /** Leaderboards. kind: 'overall' | 'week' | 'readiness' (with courseId). */
  async leaderboard(kind, courseId = null, limit = 50) {
    if (kind === 'readiness' && courseId) return (await rest(`/course_progress?course_id=eq.${encodeURIComponent(courseId)}&select=profile_id,readiness,mastered_count,total_concepts,xp,updated_at,profiles(username,level,total_xp,cosmetics)&order=readiness.desc,xp.desc&limit=${limit}`)) || [];
    if (kind === 'week') return (await rest(`/profiles?select=id,username,level,total_xp,xp_week,week_key,streak,cosmetics&order=xp_week.desc,total_xp.desc&limit=${limit}`)) || [];
    return (await rest(`/profiles?select=id,username,level,total_xp,xp_week,week_key,streak,cosmetics&order=total_xp.desc&limit=${limit}`)) || [];
  }
}
