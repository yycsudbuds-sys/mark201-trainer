// Persistence: multiple local profiles in localStorage, sessions, export/import.
import { SESSION_GAP_MIN } from './engine.js';

const KEY_PROFILES = 'mark201.profiles.v1';
const KEY_STATE = id => `mark201.state.v1.${id}`;
const KEY_ACTIVE = 'mark201.active.v1';

export function freshState(name) {
  return {
    v: 1,
    name,
    createdAt: Date.now(),
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
    settings: { theme: 'dark', sound: true, motion: true, examDate: '2026-10-24T09:00', dailyGoal: 60 },
  };
}

function safeGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch { return false; }
}

export class Store {
  constructor() {
    this.profiles = safeGet(KEY_PROFILES) || [];
    this.activeId = safeGet(KEY_ACTIVE);
    this.state = null;
    this.listeners = new Set();
    this._saveTimer = null;
  }
  hasProfiles() { return this.profiles.length > 0; }
  createProfile(name) {
    const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    this.profiles.push({ id, name, createdAt: Date.now() });
    safeSet(KEY_PROFILES, this.profiles);
    safeSet(KEY_STATE(id), freshState(name));
    this.switchProfile(id);
    return id;
  }
  switchProfile(id) {
    const p = this.profiles.find(x => x.id === id);
    if (!p) return false;
    this.flush();
    this.activeId = id;
    safeSet(KEY_ACTIVE, id);
    const st = safeGet(KEY_STATE(id)) || freshState(p.name);
    this.state = migrate(st);
    this.touchSession();
    this.emit('profile');
    return true;
  }
  deleteProfile(id) {
    this.profiles = this.profiles.filter(p => p.id !== id);
    safeSet(KEY_PROFILES, this.profiles);
    try { localStorage.removeItem(KEY_STATE(id)); } catch { /* ignore */ }
    if (this.activeId === id) {
      this.activeId = null; this.state = null; safeSet(KEY_ACTIVE, null);
      if (this.profiles.length) this.switchProfile(this.profiles[0].id);
    }
    this.emit('profile');
  }
  renameProfile(id, name) {
    const p = this.profiles.find(x => x.id === id);
    if (p) { p.name = name; safeSet(KEY_PROFILES, this.profiles); }
    if (this.state && this.activeId === id) { this.state.name = name; this.save(); }
    this.emit('profile');
  }
  loadActive() {
    if (this.activeId && this.profiles.some(p => p.id === this.activeId)) return this.switchProfile(this.activeId);
    if (this.profiles.length) return this.switchProfile(this.profiles[0].id);
    return false;
  }
  // Sessions: a new session starts after SESSION_GAP_MIN of inactivity.
  touchSession(now) {
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
  streakDays() {
    const days = Object.keys(this.state.days).filter(k => this.state.days[k].answered > 0).sort();
    if (!days.length) return 0;
    let streak = 0; let cursor = dayKey(Date.now());
    const set = new Set(days);
    if (!set.has(cursor)) { cursor = dayKey(Date.now() - 86400000); if (!set.has(cursor)) return 0; }
    while (set.has(cursor)) { streak++; const d = new Date(cursor + 'T12:00:00'); d.setDate(d.getDate() - 1); cursor = dayKey(d.getTime()); }
    return streak;
  }
  save() {
    if (!this.state || !this.activeId) return;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.flush(), 150);
  }
  flush() {
    clearTimeout(this._saveTimer);
    if (this.state && this.activeId) safeSet(KEY_STATE(this.activeId), this.state);
  }
  exportJSON() {
    this.flush();
    return JSON.stringify({ type: 'mark201-profile', exportedAt: new Date().toISOString(), profile: this.profiles.find(p => p.id === this.activeId), state: this.state }, null, 1);
  }
  importJSON(text) {
    const data = JSON.parse(text);
    if (!data || data.type !== 'mark201-profile' || !data.state) throw new Error('Not a MARK 201 Trainer backup file.');
    const name = (data.profile && data.profile.name) || data.state.name || 'Imported';
    const id = this.createProfile(name + ' (imported)');
    const st = migrate(data.state); st.name = name + ' (imported)';
    this.state = st; this.flush(); this.emit('profile');
    return id;
  }
  resetActive() {
    const p = this.profiles.find(x => x.id === this.activeId);
    this.state = freshState(p ? p.name : 'Player');
    this.flush(); this.touchSession(); this.emit('profile');
  }
  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(type) { for (const fn of this.listeners) fn(type); }
}

function migrate(st) {
  const base = freshState(st.name || 'Player');
  const out = Object.assign(base, st);
  out.settings = Object.assign(base.settings, st.settings || {});
  out.stats = Object.assign(base.stats, st.stats || {});
  out.campaign = Object.assign(base.campaign, st.campaign || {});
  out.session = Object.assign(base.session, st.session || {});
  return out;
}

export function dayKey(t) {
  const d = new Date(t);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}
