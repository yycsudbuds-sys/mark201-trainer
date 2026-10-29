// Persistence: one named profile per student (no password) shared across courses and devices.
// The profile holds XP totals, coins, cosmetics and shared settings; each course has its own state (mastery,
// questions, campaign, exams, days). Everything is cached in localStorage and app/sync.js mirrors it to Supabase.
// The old single-course saves (mark201.*) are never touched: they stay as a backup and can be claimed into a profile.
import { SESSION_GAP_MIN } from './engine.js';
import { bindCosmetic } from './cosmetic.js';
import { COURSE_IDS } from './courses/index.js';

export const NS = 'imperium';
export const KEYS = {
  profiles: `${NS}.profiles.v2`,            // profiles used on this device: [{ id, username, lastUsed }]
  active: `${NS}.active.v2`,                // the profile to open next time
  legacy: `${NS}.legacy.v2`,                // { claimed: { legacyProfileId: profileId }, cosmeticsClaimed }
  profile: id => `${NS}.profile.v2.${id}`,
  course: (id, c) => `${NS}.course.v2.${id}.${c}`,
  dirty: id => `${NS}.dirty.v2.${id}`,     // what still has to reach the cloud
};
export const LEGACY_KEYS = { profiles: 'mark201.profiles.v1', active: 'mark201.active.v1', state: id => `mark201.state.v1.${id}`, cosmetic: 'mark201.cosmetic.v1' };
/** Settings that belong to the profile (every course sees the same); anything else (exam date) is per course. */
export const SHARED_SETTINGS = ['theme', 'sound', 'motion', 'briefings', 'dailyGoal'];
export const NAME_RULE = /^[A-Za-z0-9_ ]{3,20}$/;

export function normalizeName(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
export function nameKey(s) { return normalizeName(s).toLowerCase(); }
export function validateName(raw) {
  const n = normalizeName(raw);
  if (n.length < 3) return 'Use at least 3 characters.';
  if (n.length > 20) return 'Use at most 20 characters.';
  if (!NAME_RULE.test(n)) return 'Letters, numbers, spaces and underscores only.';
  return null;
}
export function uuid() { try { return crypto.randomUUID(); } catch { return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16); }); } }

export function freshState(name, course = null) {
  return {
    v: 1,
    course,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    xp: 0,
    concepts: {},
    questions: {},
    activities: {},
    exams: [],
    achievements: {},
    campaign: { topics: {}, bosses: {} },
    plan: {},
    stats: { answered: 0, correct: 0, byAngle: {}, blitzBest: 0, duelBest: 0, bestCombo: 0 },
    session: { id: 1, lastActive: 0, startedAt: 0, answered: 0, correct: 0 },
    sessions: [],
    days: {},
    settings: { theme: 'dark', sound: true, motion: true, briefings: true, dailyGoal: 60 },
  };
}
export function freshProfile(username, id = null) {
  const now = Date.now();
  return {
    id: id || uuid(), username: normalizeName(username), usernameKey: nameKey(username), createdAt: now, updatedAt: now,
    settings: { theme: 'dark', sound: true, motion: true, briefings: true, dailyGoal: 60 },
    cosmetics: {}, coins: 0, courseXp: {}, lastCourse: null, weekKey: '', weekStartXp: 0, xpWeek: 0, streak: 0, lastActive: 0,
  };
}

export function safeGet(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } }
export function safeSet(key, val) { try { if (val === null || val === undefined) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; } }

export class Store {
  constructor() {
    this.profiles = safeGet(KEYS.profiles) || [];
    this.activeId = safeGet(KEYS.active) || null;
    this.profile = null;
    this.courses = new Map();
    this.course = null;
    this.state = null;
    this.listeners = new Set();
    this._saveTimer = null;
    this.onDirty = null;   // set by the syncer
  }
  hasActive() { return !!this.profile; }
  /** Open the remembered profile from the local cache (no network). */
  loadActive() {
    if (!this.activeId) return false;
    const p = safeGet(KEYS.profile(this.activeId));
    if (!p) return false;
    this._activate(p);
    return true;
  }
  _activate(profile) {
    this.flush();
    this.profile = migrateProfile(profile);
    this.activeId = this.profile.id;
    safeSet(KEYS.active, this.profile.id);
    this.courses = new Map();
    for (const c of COURSE_IDS) { const st = safeGet(KEYS.course(this.profile.id, c)); if (st) this.courses.set(c, migrate(st, this.profile.username, c)); }
    this.rememberDevice(this.profile);
    bindCosmetic({ get: () => this.profile.cosmetics, getCoins: () => this.profile.coins || 0, setCoins: v => { this.profile.coins = Math.max(0, Math.round(v || 0)); }, changed: () => this.save() });
    this.state = null; this.course = null;
    this.emit('profile');
  }
  rememberDevice(profile) {
    const list = this.profiles.filter(p => p.id !== profile.id);
    list.unshift({ id: profile.id, username: profile.username, lastUsed: Date.now() });
    this.profiles = list.slice(0, 12);
    safeSet(KEYS.profiles, this.profiles);
  }
  /** Open a profile that came from login, creation or the cloud, merging with whatever this device already cached. */
  useProfile(profile, courseStates = {}) {
    const localP = safeGet(KEYS.profile(profile.id));
    const merged = localP ? mergeProfile(localP, profile) : migrateProfile(profile);
    safeSet(KEYS.profile(profile.id), merged);
    for (const [c, st] of Object.entries(courseStates || {})) {
      if (!st || typeof st !== 'object') continue;
      const local = safeGet(KEYS.course(profile.id, c));
      safeSet(KEYS.course(profile.id, c), local ? mergeCourseState(local, st) : migrate(st, merged.username, c));
    }
    this._activate(merged);
  }
  /** Replace the cached state of a course (used by sync pulls and legacy claims). */
  setCourseState(courseId, state) {
    this.courses.set(courseId, state);
    if (this.course === courseId) { this.state = state; this._syncSettingsIn(); }
    safeSet(KEYS.course(this.profile.id, courseId), state);
  }
  setCourse(courseId) {
    if (!this.profile) return false;
    this.flush();
    let st = this.courses.get(courseId);
    if (!st) { st = freshState(this.profile.username, courseId); this.courses.set(courseId, st); }
    this.course = courseId; this.state = st;
    this._syncSettingsIn();
    this.profile.lastCourse = courseId;
    this.touchSession();
    this.emit('course');
    return true;
  }
  _syncSettingsIn() { if (!this.state) return; for (const k of SHARED_SETTINGS) if (this.profile.settings[k] !== undefined) this.state.settings[k] = this.profile.settings[k]; this.state.name = this.profile.username; this.state.course = this.course; }
  courseState(courseId) { return this.courses.get(courseId) || null; }
  totalXp() { let s = 0; for (const st of this.courses.values()) s += st.xp || 0; return s; }
  logout() {
    this.flush();
    this.profile = null; this.state = null; this.course = null; this.courses = new Map(); this.activeId = null;
    safeSet(KEYS.active, null);
    bindCosmetic(null);
    this.emit('logout');
  }
  // Sessions: a new session starts after SESSION_GAP_MIN of inactivity.
  touchSession(now) {
    if (!this.state) return 0;
    now = now || Date.now();
    const s = this.state.session;
    if (!s.lastActive || now - s.lastActive > SESSION_GAP_MIN * 60000) {
      if (s.startedAt) this.state.sessions.push({ id: s.id, start: s.startedAt, end: s.lastActive, answered: s.answered, correct: s.correct });
      if (this.state.sessions.length > 60) this.state.sessions.splice(0, this.state.sessions.length - 60);
      s.id = (s.id || 1) + (s.startedAt ? 1 : 0);
      s.startedAt = now; s.answered = 0; s.correct = 0;
    }
    s.lastActive = now;
    const day = dayKey(now);
    const d = this.state.days[day] || (this.state.days[day] = { answered: 0, correct: 0, xp: 0, minutes: 0 });
    this._day = d;
    this.save();
    return s.id;
  }
  recordDaily(correct, xp) {
    const d = this.state.days[dayKey(Date.now())] || (this.state.days[dayKey(Date.now())] = { answered: 0, correct: 0, xp: 0, minutes: 0 });
    d.answered++; if (correct) d.correct++; d.xp += xp;
    const s = this.state.session; s.answered++; if (correct) s.correct++;
  }
  /** Day streak. By default across every course of the profile; { course: id } restricts it to one. */
  streakDays(opts = {}) {
    const states = opts.course ? [this.courses.get(opts.course)].filter(Boolean) : [...this.courses.values()];
    const set = new Set();
    for (const st of states) for (const [k, v] of Object.entries(st.days || {})) if (v.answered > 0) set.add(k);
    if (!set.size) return 0;
    let streak = 0; let cursor = dayKey(Date.now());
    if (!set.has(cursor)) { cursor = dayKey(Date.now() - 86400000); if (!set.has(cursor)) return 0; }
    while (set.has(cursor)) { streak++; const d = new Date(cursor + 'T12:00:00'); d.setDate(d.getDate() - 1); cursor = dayKey(d.getTime()); }
    return streak;
  }
  save() {
    if (!this.profile) return;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.flush(), 150);
  }
  /** Write the profile and the active course to localStorage and flag them for the cloud. */
  flush() {
    clearTimeout(this._saveTimer);
    if (!this.profile) return;
    const now = Date.now();
    if (this.state) { for (const k of SHARED_SETTINGS) this.profile.settings[k] = this.state.settings[k]; this.state.updatedAt = now; }
    const xp = {}; for (const [c, st] of this.courses) xp[c] = st.xp || 0; this.profile.courseXp = xp;
    const total = this.totalXp(); const wk = weekKey(now);
    if (this.profile.weekKey !== wk) { this.profile.weekKey = wk; this.profile.weekStartXp = total; }
    this.profile.xpWeek = Math.max(0, total - (this.profile.weekStartXp || 0));
    this.profile.streak = this.streakDays(); this.profile.lastActive = now; this.profile.updatedAt = now;
    safeSet(KEYS.profile(this.profile.id), this.profile);
    if (this.state && this.course) safeSet(KEYS.course(this.profile.id, this.course), this.state);
    this.markDirty(this.course);
    this.onDirty && this.onDirty();
  }
  markDirty(courseId) {
    if (!this.profile) return;
    const d = safeGet(KEYS.dirty(this.profile.id)) || { profile: false, courses: [] };
    d.profile = true; if (courseId && !d.courses.includes(courseId)) d.courses.push(courseId);
    safeSet(KEYS.dirty(this.profile.id), d);
  }
  dirty() { return (this.profile && safeGet(KEYS.dirty(this.profile.id))) || { profile: false, courses: [] }; }
  clearDirty(done) {
    if (!this.profile) return;
    const d = this.dirty();
    if (done.profile) d.profile = false;
    d.courses = d.courses.filter(c => !done.courses.includes(c));
    safeSet(KEYS.dirty(this.profile.id), (d.profile || d.courses.length) ? d : null);
  }
  exportJSON() {
    this.flush();
    const courses = {}; for (const [c, st] of this.courses) courses[c] = st;
    return JSON.stringify({ type: 'imperium-profile', v: 2, exportedAt: new Date().toISOString(), profile: this.profile, courses }, null, 1);
  }
  /** Import a backup into the open profile. New-style files merge every course; old mark201 files merge into MARK 201. */
  importJSON(text) {
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') throw new Error('Not a backup file.');
    if (data.type === 'imperium-profile' && data.courses) {
      for (const [c, st] of Object.entries(data.courses)) { if (!st || typeof st !== 'object') continue; const cur = this.courses.get(c); this.setCourseState(c, cur ? mergeCourseState(cur, migrate(st, this.profile.username, c)) : migrate(st, this.profile.username, c)); this.markDirty(c); }
      if (data.profile) { const p = mergeProfile(this.profile, migrateProfile(Object.assign({}, data.profile, { id: this.profile.id, username: this.profile.username, usernameKey: this.profile.usernameKey }))); Object.assign(this.profile, p); }
    } else if (data.type === 'mark201-profile' && data.state) {
      const conv = legacyToCourse(data.state, 'mark201');
      const cur = this.courses.get('mark201');
      this.setCourseState('mark201', cur ? mergeCourseState(cur, conv) : conv); this.markDirty('mark201');
    } else throw new Error('Not an Imperium backup file.');
    this.flush(); this.emit('profile');
    return true;
  }
  resetCourse() {
    if (!this.course) return;
    const st = freshState(this.profile.username, this.course);
    this.setCourseState(this.course, st); this.markDirty(this.course);
    this.flush(); this.touchSession(); this.emit('course');
  }
  // ---- legacy single-course saves on this device
  legacyProfiles() {
    const list = safeGet(LEGACY_KEYS.profiles) || [];
    const claimed = (safeGet(KEYS.legacy) || {}).claimed || {};
    return list.map(p => { const st = safeGet(LEGACY_KEYS.state(p.id)); return { id: p.id, name: p.name, createdAt: p.createdAt, xp: st?.xp || 0, answered: st?.stats?.answered || 0, claimed: !!claimed[p.id], exists: !!st }; }).filter(p => p.exists);
  }
  /** Merge an old mark201 save into the open profile's MARK 201 course (and its device cosmetics, once). */
  claimLegacy(legacyId) {
    if (!this.profile) return false;
    const st = safeGet(LEGACY_KEYS.state(legacyId)); if (!st) return false;
    const conv = legacyToCourse(st, 'mark201');
    const cur = this.courses.get('mark201');
    this.setCourseState('mark201', cur ? mergeCourseState(cur, conv) : conv);
    const lg = safeGet(KEYS.legacy) || { claimed: {} };
    if (!lg.cosmeticsClaimed) {
      const cos = safeGet(LEGACY_KEYS.cosmetic) || {}; const pc = this.profile.cosmetics;
      this.profile.coins = Math.max(this.profile.coins || 0, Math.round(cos.denarii || 0));
      pc.owned = [...new Set([...(pc.owned || []), ...(cos.owned || [])])];
      if (cos.equipped && !pc.equipped) pc.equipped = cos.equipped;
      for (const k of ['orders', 'seenAch', 'lastStreak', 'lastBlitzDay']) if (cos[k] !== undefined && pc[k] === undefined) pc[k] = cos[k];
      lg.cosmeticsClaimed = true;
    }
    lg.claimed = lg.claimed || {}; lg.claimed[legacyId] = this.profile.id; safeSet(KEYS.legacy, lg);
    this.markDirty('mark201'); this.flush(); this.emit('profile');
    return true;
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(type) { for (const fn of this.listeners) { try { fn(type); } catch (e) { console.error(e); } } }
}

export function migrate(st, name, course) {
  const base = freshState(name || st.name || 'Player', course || st.course || null);
  const out = Object.assign(base, st);
  out.settings = Object.assign(base.settings, st.settings || {});
  out.stats = Object.assign(base.stats, st.stats || {});
  out.campaign = Object.assign(base.campaign, st.campaign || {});
  out.session = Object.assign(base.session, st.session || {});
  if (course) out.course = course;
  if (name) out.name = name;
  return out;
}
export function migrateProfile(p) {
  const base = freshProfile(p.username || 'Player', p.id);
  const out = Object.assign(base, p);
  out.settings = Object.assign(base.settings, p.settings || {});
  out.cosmetics = p.cosmetics && typeof p.cosmetics === 'object' ? p.cosmetics : {};
  out.courseXp = p.courseXp || {};
  out.usernameKey = nameKey(out.username);
  return out;
}

/** Prefix every id in an old single-course save so it fits the course pack. Returns a new state object. */
export function legacyToCourse(st, course) {
  const p = course + '-'; const px = v => (typeof v === 'string' && v && !v.startsWith(p)) ? p + v : v;
  const mapKeys = obj => { const o = {}; for (const [k, v] of Object.entries(obj || {})) o[px(k)] = v; return o; };
  const out = migrate(JSON.parse(JSON.stringify(st)), st.name, course);
  out.concepts = mapKeys(out.concepts);
  for (const cs of Object.values(out.concepts)) { if (Array.isArray(cs.a)) for (const t of cs.a) if (t && t.length > 1) t[1] = px(t[1]); if (cs.pursuit && cs.pursuit.lastQid) cs.pursuit.lastQid = px(cs.pursuit.lastQid); }
  out.questions = mapKeys(out.questions);
  out.activities = mapKeys(out.activities);
  out.campaign = Object.assign({}, out.campaign, { topics: mapKeys(out.campaign.topics) });
  out.exams = (out.exams || []).map(e => Object.assign({}, e, { misses: (e.misses || []).map(px), log: (e.log || []).map(l => Object.assign({}, l, { qid: px(l.qid) })) }));
  out.updatedAt = out.session?.lastActive || out.createdAt || Date.now();
  return out;
}

// ---- merge rules (the same on every device and in sync): nobody loses XP, coins, unlocks or mastery.
const newer = (a, b, key) => ((b && b[key]) || 0) > ((a && a[key]) || 0) ? b : a;
function unionObj(a, b, pick) { const o = Object.assign({}, a || {}); for (const [k, v] of Object.entries(b || {})) o[k] = k in o ? pick(o[k], v) : v; return o; }
const minTs = (x, y) => (x && y) ? Math.min(x, y) : (x || y);
export function mergeCourseState(a, b) {
  if (!a) return b; if (!b) return a;
  const out = migrate(JSON.parse(JSON.stringify(newer(a, b, 'updatedAt'))), a.name || b.name, a.course || b.course);
  out.createdAt = minTs(a.createdAt, b.createdAt) || out.createdAt;
  out.xp = Math.max(a.xp || 0, b.xp || 0);
  out.concepts = unionObj(a.concepts, b.concepts, (x, y) => ((y.lastAsk || 0) > (x.lastAsk || 0) || (!x.lastAsk && (y.a || []).length > (x.a || []).length)) ? y : x);
  out.questions = unionObj(a.questions, b.questions, (x, y) => ((y.last || 0) > (x.last || 0)) ? y : x);
  out.activities = unionObj(a.activities, b.activities, (x, y) => (x.done || y.done) ? Object.assign({}, x, y, { done: minTs(x.done, y.done) || x.done || y.done }) : Object.assign({}, x, y));
  out.achievements = unionObj(a.achievements, b.achievements, (x, y) => minTs(x, y));
  const has = (x, y, k) => (x && x[k] !== undefined) || (y && y[k] !== undefined);
  out.campaign = {
    topics: unionObj(a.campaign?.topics, b.campaign?.topics, (x, y) => Object.assign({}, x, y, has(x, y, 'cleared') ? { cleared: minTs(x.cleared, y.cleared) || 0 } : {})),
    bosses: unionObj(a.campaign?.bosses, b.campaign?.bosses, (x, y) => Object.assign({}, x, y, has(x, y, 'cleared') ? { cleared: minTs(x.cleared, y.cleared) || 0 } : {}, has(x, y, 'best') ? { best: Math.max(x.best || 0, y.best || 0) } : {})),
  };
  if (a.campaign?.unlocked || b.campaign?.unlocked) out.campaign.unlocked = unionObj(a.campaign?.unlocked, b.campaign?.unlocked, (x, y) => minTs(x, y));
  out.plan = unionObj(a.plan, b.plan, (x, y) => x || y);
  const sa = a.stats || {}, sb = b.stats || {};
  out.stats = Object.assign({}, (sb.answered || 0) > (sa.answered || 0) ? sb : sa);
  for (const k of ['bestCombo', 'pursuitsCleared', 'blitzBest', 'duelBest']) if (has(sa, sb, k)) out.stats[k] = Math.max(sa[k] || 0, sb[k] || 0);
  const exams = new Map(); for (const e of [...(a.exams || []), ...(b.exams || [])]) exams.set(e.t, e);
  out.exams = [...exams.values()].sort((x, y) => x.t - y.t).slice(-30);
  const sess = new Map(); for (const s of [...(a.sessions || []), ...(b.sessions || [])]) sess.set(s.start, s);
  out.sessions = [...sess.values()].sort((x, y) => x.start - y.start).slice(-60);
  out.session = newer(a.session, b.session, 'lastActive') || out.session;
  out.days = unionObj(a.days, b.days, (x, y) => ({ answered: Math.max(x.answered || 0, y.answered || 0), correct: Math.max(x.correct || 0, y.correct || 0), xp: Math.max(x.xp || 0, y.xp || 0), minutes: Math.max(x.minutes || 0, y.minutes || 0) }));
  out.settings = Object.assign({}, a.settings || {}, b.settings || {}, (newer(a, b, 'updatedAt').settings || {}));
  out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0) || Date.now();
  out._remote = [a._remote || '', b._remote || ''].sort().pop() || undefined;
  if (out._remote === undefined) delete out._remote;
  if (a._derived || b._derived) out._derived = (newer(a, b, 'updatedAt'))._derived || a._derived || b._derived;
  return out;
}
export function mergeProfile(a, b) {
  if (!a) return migrateProfile(b); if (!b) return migrateProfile(a);
  const n = newer(a, b, 'updatedAt'); const o = n === a ? b : a;
  const out = migrateProfile(JSON.parse(JSON.stringify(n)));
  out.createdAt = minTs(a.createdAt, b.createdAt) || out.createdAt;
  out.coins = Math.max(a.coins || 0, b.coins || 0);
  const ca = a.cosmetics || {}, cb = b.cosmetics || {}, cn = n.cosmetics || {}, co = o.cosmetics || {};
  out.cosmetics = Object.assign({}, co, cn, {
    owned: [...new Set([...(ca.owned || []), ...(cb.owned || [])])],
    equipped: Object.assign({}, co.equipped || {}, cn.equipped || {}),
    seenAch: [...new Set([...(ca.seenAch || []), ...(cb.seenAch || [])])],
    lastStreak: Math.max(ca.lastStreak || 0, cb.lastStreak || 0),
    lastBlitzDay: [ca.lastBlitzDay || '', cb.lastBlitzDay || ''].sort().pop() || undefined,
    orders: (ca.orders && cb.orders) ? (ca.orders.day > cb.orders.day ? ca.orders : cb.orders.day > ca.orders.day ? cb.orders : Object.assign({}, cb.orders, { claimed: [...new Set([...(ca.orders.claimed || []), ...(cb.orders.claimed || [])])] })) : (ca.orders || cb.orders),
  });
  if (out.cosmetics.lastBlitzDay === undefined) delete out.cosmetics.lastBlitzDay;
  out.settings = Object.assign({}, o.settings || {}, n.settings || {});
  out.courseXp = unionObj(a.courseXp, b.courseXp, (x, y) => Math.max(x || 0, y || 0));
  out.weekStartXp = (a.weekKey === b.weekKey) ? Math.min(a.weekStartXp ?? Infinity, b.weekStartXp ?? Infinity) : n.weekStartXp;
  if (!Number.isFinite(out.weekStartXp)) out.weekStartXp = 0;
  out.streak = Math.max(a.streak || 0, b.streak || 0);
  out.lastActive = Math.max(a.lastActive || 0, b.lastActive || 0);
  out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0);
  out._remote = [a._remote || '', b._remote || ''].sort().pop() || undefined;
  if (out._remote === undefined) delete out._remote;
  return out;
}

export function dayKey(t) {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
/** ISO week key, e.g. 2026-W44 (Monday start). */
export function weekKey(t = Date.now()) {
  const d = new Date(t); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const w1 = new Date(d.getFullYear(), 0, 4);
  const wk = 1 + Math.round(((d - w1) / 86400000 - 3 + ((w1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(wk).padStart(2, '0')}`;
}
