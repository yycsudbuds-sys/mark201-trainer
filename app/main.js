// App bootstrap: profile gate, course packs, store + cloud sync, router, shell, shared services.
import { Store, safeGet, safeSet } from './store.js';
import { Syncer } from './sync.js';
import { COURSES, courseMeta, loadPack, packIfLoaded } from './courses/index.js';
import { recordAttempt, levelForXp, readiness, dueCount, LEVELS, masteryLevel } from './engine.js';
import { h, clear, toast, confetti, bar } from './ui.js';
import { checkAchievements } from './achievements.js';
import * as Audio from './audio.js';
import { SceneDirector, sceneForRoute } from './scene-director.js';
import { icon } from './icons.js';
import { getDenarii } from './cosmetic.js';
import { brazier, clepsydra, legionaryAvatar } from './legion.js';
import { ceremony } from './cutscene.js';
import { loginScreen, brandSvg } from './views/login.js';
import * as Dash from './views/dash.js';
import * as Home from './views/home.js';
import * as Campaign from './views/campaign.js';
import * as Drill from './views/drill.js';
import * as Exam from './views/exam.js';
import * as Arcade from './views/arcade.js';
import * as Learn from './views/learn.js';
import * as Progress from './views/progress.js';
import * as Settings from './views/settings.js';

const ROUTES = {
  dash: Dash, legion: { render: Dash.renderProfile },
  home: Home, campaign: Campaign, drill: Drill, exam: Exam, arcade: Arcade, learn: Learn, progress: Progress, settings: Settings,
};
const COURSE_ROUTES = new Set(['home', 'campaign', 'drill', 'exam', 'arcade', 'learn', 'progress', 'settings']);
const NAV = [
  ['dash', 'column', 'Courses', 'The Forum'],
  ['home', 'brazier', 'Home', 'Castra'],
  ['campaign', 'map', 'Campaign', 'Conquest map'],
  ['drill', 'gladius', 'Smart Drill', 'Field Drill'],
  ['exam', 'scutum', 'Midterm Simulation', 'Great Battle'],
  ['arcade', 'swords', 'Arcade', 'Arena'],
  ['learn', 'scroll', 'Learn', 'Lessons & cheat sheets'],
  ['progress', 'aquila', 'Progress', 'Senate report'],
  ['settings', 'gear', 'Settings', 'Quartermaster'],
];
const DEVICE_KEY = 'imperium.device.v2';

function buildIndex(content) {
  const concept = new Map(); const question = new Map(); const topic = new Map(); const chapter = new Map();
  for (const ch of content.chapters) {
    chapter.set(ch.chapter, ch);
    for (const t of ch.topics) topic.set(t.id, { topic: t, chapter: ch });
    for (const c of ch.concepts) concept.set(c.id, { concept: c, chapter: ch, topic: topic.get(c.topic)?.topic || null });
    for (const q of ch.questions) question.set(q.id, { question: q, chapter: ch });
  }
  return { concept, question, topic, chapter };
}

const app = {
  store: new Store(),
  syncer: null,
  pack: null, course: null, content: null, index: null,
  get state() { return this.store.state; },
  get profile() { return this.store.profile; },
  currentView: null,
  navigate(hash) { if (location.hash === hash) route(); else location.hash = hash; },
  toast,
  sound(kind, opts) { Audio.play(kind, opts); },
  audio: Audio,
  confetti(opts) { confetti(opts); },
  sessionId() { return this.store.touchSession(); },
  /** Profile XP: every course feeds one rank. */
  xp() { return this.store.totalXp(); },
  chapterColor(num) { return this.index?.chapter.get(num)?.color || 'var(--accent)'; },
  chapterIcon(num) { return this.pack ? this.pack.chapterMeta(num).icon : 'seal'; },
  chapterScene(num) { return this.pack ? this.pack.chapterMeta(num).scene : 'italia'; },
  conceptOf(cid) { return this.index.concept.get(cid); },
  questionOf(qid) { return this.index.question.get(qid); },
  /** Make a course the active one: load its pack, swap content and state. */
  async setCourse(id) {
    const pack = await loadPack(id);
    this.pack = pack; this.course = id; this.content = pack.content; this.index = buildIndex(pack.content);
    this.store.setCourse(id);
    if (!this.state.settings.examDate && pack.exam && pack.exam.date) this.state.settings.examDate = pack.exam.date;
    safeSet(DEVICE_KEY, Object.assign(safeGet(DEVICE_KEY) || {}, { lastCourse: id }));
    this.store.save();
    return pack;
  },
  /** From the Forum: open a course and go to one of its routes. */
  async openCourse(id, href = '#/home') {
    try { await this.setCourse(id); } catch (err) { toast(err.message || 'That course is not open yet', 'info'); return; }
    applySettings(); buildShell();
    this.navigate(href && href !== location.hash ? href : '#/home');
    if (href === location.hash) route();
  },
  /** Record an answer; handles XP, daily stats, achievements, event toasts. */
  answer(q, correct, ctx = {}) {
    const sessionId = this.sessionId();
    const res = recordAttempt(this.state, q, correct, { now: Date.now(), sessionId, combo: ctx.combo || 0, self: ctx.self || false });
    this.store.recordDaily(correct, res.xp);
    if (ctx.combo > (this.state.stats.bestCombo || 0)) this.state.stats.bestCombo = ctx.combo;
    for (const ev of res.events) {
      const name = this.conceptOf(ev.cid)?.concept.term || ev.cid;
      if (ev.type === 'masteryUp' && ev.to === 4) { toast(`Mastered: ${name}`, 'good'); this.sound('promotion'); }
      else if (ev.type === 'masteryUp' && ev.to === 3) toast(`Solid: ${name}`, 'good', 1800);
      else if (ev.type === 'pursuitCleared') { toast(`Pursuit cleared: ${name} (+25 XP)`, 'good'); this.sound('clear'); }
    }
    const lvBefore = levelForXp(this.xp() - res.xp).index;
    const lvAfter = levelForXp(this.xp()).index;
    if (lvAfter > lvBefore) { toast(`Promotion! You are now ${LEVEL_TITLE(lvAfter)}`, 'xp', 3200); this.confetti({ count: 80 }); this.sound('fanfare'); if (this.state.settings.briefings !== false) setTimeout(() => ceremony(this, LEVELS[lvAfter]), 900); }
    const unlocked = checkAchievements(this);
    for (const a of unlocked) { toast(`Honour earned: ${a.title}`, 'xp', 3000); }
    this.store.save();
    renderHeader();
    return res;
  },
  grantXp(amount, why) {
    if (!amount) return;
    const before = levelForXp(this.xp()).index;
    this.state.xp += amount;
    const d = this.store.state.days[Object.keys(this.store.state.days).pop()];
    if (d) d.xp += amount;
    toast(`+${amount} XP ${why ? '· ' + why : ''}`, 'xp', 2200); this.sound('coins');
    const after = levelForXp(this.xp()).index;
    if (after > before) { toast(`Promotion! You are now ${LEVEL_TITLE(after)}`, 'xp', 3200); this.sound('fanfare'); }
    const unlocked = checkAchievements(this);
    for (const a of unlocked) toast(`Honour earned: ${a.title}`, 'xp', 3000);
    this.store.save();
    renderHeader();
  },
};
const LEVEL_TITLE = i => (LEVELS[i] || LEVELS[LEVELS.length - 1]).title;
window.__app = app; // handy for debugging in the console

// ---------- shell ----------
const root = document.getElementById('app');
let shell = null; let mainEl = null; let navEl = null; let bottomEl = null; let headerEl = null;

function buildShell() {
  clear(root);
  const title = app.pack ? app.pack.title : 'Imperium';
  const sub = app.pack ? 'Imperium' : 'Study campaigns';
  navEl = h('nav', { class: 'nav', 'aria-label': 'Main' },
    h('a', { class: 'brand', href: '#/dash' },
      h('div', { class: 'brand-mark', html: brandSvg() }),
      h('div', null, h('div', { class: 'brand-name' }, title), h('div', { class: 'brand-sub' }, sub))),
    NAV.map(([key, ico, label, roman]) => h('a', { class: 'nav-link', href: '#/' + key, dataset: { route: key } }, h('span', { class: 'ico' }, icon(ico, { size: 20, tone: 'gold' })), h('span', { class: 'nav-text' }, h('span', { class: 'nav-main' }, label), h('span', { class: 'nav-sub' }, roman)), key === 'drill' ? h('span', { class: 'badge quiet', dataset: { due: '1' } }, '') : null)),
    h('div', { class: 'nav-foot small muted' }, h('div', { dataset: { profileName: '1' } }), h('div', { class: 'tiny faint' }, app.content ? `${app.content.stats.questions} questions · ${app.content.stats.concepts} concepts` : '')),
  );
  headerEl = h('div', { class: 'topbar' });
  mainEl = h('main', { class: 'main', id: 'main' }, headerEl, h('div', { class: 'view' }));
  bottomEl = h('nav', { class: 'bottom-nav', 'aria-label': 'Main' },
    NAV.filter(([k]) => ['dash', 'home', 'campaign', 'drill', 'exam', 'progress'].includes(k)).map(([key, ico, label]) =>
      h('a', { href: '#/' + key, dataset: { route: key } }, h('span', { class: 'ico' }, icon(ico, { size: 22, tone: 'gold' })), label === 'Midterm Simulation' ? 'Midterm' : label === 'Smart Drill' ? 'Drill' : label)));
  shell = h('div', { class: 'shell' }, navEl, mainEl, bottomEl);
  root.appendChild(shell);
}

export function renderHeader() {
  if (!headerEl || !app.state || !app.profile) return;
  clear(headerEl);
  const st = app.state;
  const total = app.xp();
  const lv = levelForXp(total);
  const r = readiness(app.content, st);
  headerEl.appendChild(h('div', { class: 'row wrap' },
    h('div', { class: 'xpbar' },
      h('span', { class: 'level-pill' }, `Lv ${lv.number} · ${lv.title}`),
      bar(lv.progress, { color: 'var(--accent)', height: 6 }),
      h('span', { class: 'mono small muted' }, lv.next ? `${total} / ${lv.next.xp} XP` : `${total} XP`)),
    brazier(app), clepsydra(app),
    h('span', { class: 'chip', title: `${app.pack.title} test readiness estimate` }, icon('scutum', { size: 14, tone: 'gold' }), `${app.pack.title} Readiness ${Math.round(r.score * 100)}%`),
    h('span', { class: 'chip denarii', title: 'Denarii: cosmetic coin from answers, pursuits and wagers', dataset: { denarii: '1' } }, icon('coin', { size: 14, tone: 'gold' }), `${getDenarii()}`),
    h('span', { class: 'chip sync ' + (app.syncer ? app.syncer.status : 'off'), dataset: { sync: '1' }, title: 'Cloud save status' }, syncLabel()),
  ));
  headerEl.appendChild(h('div', { class: 'row' },
    volumeControl(),
    h('a', { class: 'btn sm ghost you', href: '#/dash', title: 'Your profile and courses' }, legionaryAvatar(26), app.profile.username),
  ));
  const due = dueCount(app.content, st);
  navEl.querySelectorAll('[data-due]').forEach(b => { b.textContent = due ? `${due} due` : ''; b.classList.toggle('hidden', !due); });
  navEl.querySelectorAll('[data-profile-name]').forEach(el => { el.textContent = app.profile.username; });
}
function syncLabel() { const s = app.syncer ? app.syncer.status : 'off'; return { idle: 'Saved', saved: 'Saved', pending: 'Saving…', saving: 'Saving…', offline: 'Offline', error: 'Sync error', off: 'Local only' }[s] || s; }
function renderSyncChips() { const s = app.syncer ? app.syncer.status : 'off'; document.querySelectorAll('[data-sync]').forEach(c => { c.textContent = syncLabel(); c.className = 'chip sync ' + s; }); }

/** Master volume: a bronze mute button and a short slider. Writes the device cosmetic key only. */
function volumeControl() {
  const soundOn = app.state?.settings?.sound !== false;
  const muted = Audio.isMuted() || !soundOn;
  const btn = h('button', { class: 'vol-btn' + (muted ? ' muted' : ''), type: 'button', title: soundOn ? (Audio.isMuted() ? 'Unmute' : 'Mute') : 'Sound effects are off in the Quartermaster', 'aria-label': 'Mute', 'aria-pressed': String(muted), disabled: !soundOn },
    icon(muted ? 'cross' : 'horn', { size: 16, tone: muted ? 'iron' : 'gold' }));
  const slider = h('input', { type: 'range', class: 'vol-range', min: '0', max: '100', step: '5', value: String(Math.round(Audio.getVolume() * 100)), 'aria-label': 'Master volume', disabled: !soundOn });
  btn.addEventListener('click', () => { const m = Audio.toggleMuted(); btn.classList.toggle('muted', m); btn.setAttribute('aria-pressed', String(m)); btn.replaceChildren(icon(m ? 'cross' : 'horn', { size: 16, tone: m ? 'iron' : 'gold' })); if (!m) Audio.play('tick'); });
  let t = 0;
  slider.addEventListener('input', () => { Audio.setVolume(Number(slider.value) / 100); if (Audio.isMuted()) { Audio.setMuted(false); btn.classList.remove('muted'); btn.replaceChildren(icon('horn', { size: 16, tone: 'gold' })); } const now = performance.now(); if (now - t > 150) { t = now; Audio.play('tick'); } });
  return h('div', { class: 'vol' + (soundOn ? '' : ' off') }, btn, slider);
}

function setActive(routeKey) {
  document.querySelectorAll('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === routeKey));
}

function parseHash() {
  const raw = (location.hash || '#/dash').replace(/^#\/?/, '');
  const parts = raw.split('/').map(decodeURIComponent);
  return { key: parts[0] || 'dash', params: parts.slice(1) };
}
const CALM = new Set(['dash', 'legion', 'home', 'progress', 'learn', 'settings']);
function isCalmRoute() { return CALM.has(parseHash().key) && !/\/(drill|boss|go)\b/.test(location.hash); }

let routing = false;
function route() {
  if (!app.profile) { showLogin(); return; }
  if (!shell) buildShell();
  const { key, params } = parseHash();
  if (!ROUTES[key]) { location.hash = '#/dash'; return; }
  if (!app.pack) { // a course is always active, so every view can read app.state
    if (routing) return; routing = true;
    const want = courseMeta(app.profile.lastCourse)?.ready ? app.profile.lastCourse : 'mark201';
    app.setCourse(want).then(() => { routing = false; applySettings(); buildShell(); route(); }).catch(err => { routing = false; console.error(err); });
    return;
  }
  const viewHost = mainEl.querySelector('.view');
  if (app.director) { try { const sc = sceneForRoute(key, params, app.pack); app.director.setScene(sc.kind, sc); } catch { /* scene is cosmetic */ } }
  if (app.currentView && app.currentView.cleanup) { try { app.currentView.cleanup(); } catch { /* ignore */ } }
  clear(viewHost);
  let el;
  try {
    el = ROUTES[key].render(app, params);
  } catch (err) {
    console.error(err);
    el = h('div', { class: 'card' }, h('h2', null, 'Something went wrong'), h('p', { class: 'muted' }, String(err && err.message || err)), h('a', { class: 'btn mt', href: '#/dash' }, 'Back to the Forum'));
  }
  app.currentView = el;
  viewHost.appendChild(el);
  setActive(key);
  renderHeader();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function applySettings() {
  const s = app.state ? app.state.settings : (app.profile ? app.profile.settings : { theme: 'dark', motion: true });
  document.documentElement.dataset.theme = s.theme || 'dark';
  document.documentElement.dataset.motion = s.motion === false ? 'off' : 'on';
  if (s.motion === false) document.querySelectorAll('canvas.confetti').forEach(c => c.remove()); // motion off also ends any confetti mid-flight
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', s.theme === 'light' ? '#EEF1F7' : '#121726');
  if (app.director) { app.director.refreshTheme(); if (s.sound === false) Audio.ambience(null); else { try { const { key, params } = parseHash(); const sc = sceneForRoute(ROUTES[key] ? key : 'dash', params, app.pack); Audio.ambience(sc.amb || null); } catch { /* cosmetic */ } } }
}
app.applySettings = applySettings;
app.renderHeader = renderHeader;

// ---------- the gate ----------
function showLogin() {
  shell = null; mainEl = null; navEl = null; headerEl = null; bottomEl = null;
  if (app.currentView && app.currentView.cleanup) { try { app.currentView.cleanup(); } catch { /* ignore */ } }
  app.currentView = null; app.pack = null; app.course = null; app.content = null; app.index = null;
  clear(root);
  applySettings();
  if (app.director) { try { app.director.setScene('camp', { amb: 'camp', tint: 0.55, blur: 4 }); } catch { /* cosmetic */ } }
  root.appendChild(loginScreen(app, { onEntered: () => enter({ pull: false }) }));
}

/** A profile is open: pick its last course, build the shell and go to the Forum (or the deep link). */
async function enter({ pull }) {
  const remembered = app.profile.lastCourse || (safeGet(DEVICE_KEY) || {}).lastCourse || 'mark201';
  const want = courseMeta(remembered)?.ready ? remembered : 'mark201';
  try { await app.setCourse(want); } catch (err) { console.error(err); toast('The course pack failed to load. Reload the page.', 'bad'); return; }
  applySettings();
  buildShell();
  const { key } = parseHash();
  if (!location.hash || !ROUTES[key] || (!pull && key !== 'dash')) { if (location.hash === '#/dash') route(); else location.hash = '#/dash'; }
  else route();
  if (pull && app.syncer) app.syncer.pull().then(changed => { if (changed && app.profile) { applySettings(); renderHeader(); if (isCalmRoute()) route(); } });
}

function boot() {
  Audio.initAudio(() => app.state?.settings?.sound !== false);
  app.director = new SceneDirector({ getTheme: () => (app.state?.settings?.theme || app.profile?.settings?.theme || 'dark'), getMotion: () => (app.state ? app.state.settings.motion !== false : app.profile ? app.profile.settings.motion !== false : true), audio: Audio });
  app.syncer = new Syncer(app.store, { derive: (courseId, state) => { const pack = packIfLoaded(courseId); if (!pack) return null; const r = readiness(pack.content, state); let mastered = 0; for (const ch of pack.content.chapters) for (const c of ch.concepts) if (masteryLevel(state.concepts[c.id]) >= 4) mastered++; return { readiness: Math.round(r.score * 1000) / 1000, mastered, total: pack.content.stats.concepts }; } });
  app.syncer.on(renderSyncChips);
  app.store.on(type => {
    if (type === 'logout') { showLogin(); return; }
    if (type === 'profile' && shell && app.pack) { applySettings(); renderHeader(); }
  });
  window.addEventListener('hashchange', route);
  window.addEventListener('denarii', e => { document.querySelectorAll('[data-denarii]').forEach(c => { c.lastChild.textContent = String(e.detail.after); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && app.state) { app.store.touchSession(); renderHeader(); } });
  window.addEventListener('beforeunload', () => { app.store.flush(); app.syncer && app.syncer.flushNow({ keepalive: true }); });
  if (!app.store.loadActive()) { showLogin(); return; }
  enter({ pull: true });
}

boot();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
