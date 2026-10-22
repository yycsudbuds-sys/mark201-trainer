// App bootstrap: content index, store, router, shell, shared services.
import { CONTENT } from './data.js';
import { Store } from './store.js';
import { recordAttempt, levelForXp, readiness, dueCount, LEVELS } from './engine.js';
import { h, clear, toast, sound, confetti, bar } from './ui.js';
import { checkAchievements } from './achievements.js';
import * as Home from './views/home.js';
import * as Campaign from './views/campaign.js';
import * as Drill from './views/drill.js';
import * as Exam from './views/exam.js';
import * as Arcade from './views/arcade.js';
import * as Learn from './views/learn.js';
import * as Progress from './views/progress.js';
import * as Settings from './views/settings.js';

const ROUTES = {
  home: Home, campaign: Campaign, drill: Drill, exam: Exam, arcade: Arcade, learn: Learn, progress: Progress, settings: Settings,
};
const NAV = [
  ['home', '🏠', 'Home'],
  ['campaign', '🗺️', 'Campaign'],
  ['drill', '🎯', 'Smart Drill'],
  ['exam', '📝', 'Midterm Sim'],
  ['arcade', '🕹️', 'Arcade'],
  ['learn', '📖', 'Learn'],
  ['progress', '📈', 'Progress'],
  ['settings', '⚙️', 'Settings'],
];

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
  content: CONTENT,
  store: new Store(),
  index: buildIndex(CONTENT),
  get state() { return this.store.state; },
  currentView: null,
  navigate(hash) { if (location.hash === hash) route(); else location.hash = hash; },
  toast,
  sound(kind) { sound(kind, this.state?.settings?.sound !== false); },
  confetti(opts) { confetti(opts); },
  sessionId() { return this.store.touchSession(); },
  chapterColor(num) { return this.index.chapter.get(num)?.color || 'var(--accent)'; },
  conceptOf(cid) { return this.index.concept.get(cid); },
  questionOf(qid) { return this.index.question.get(qid); },
  /** Record an answer; handles XP, daily stats, achievements, event toasts. */
  answer(q, correct, ctx = {}) {
    const sessionId = this.sessionId();
    const res = recordAttempt(this.state, q, correct, { now: Date.now(), sessionId, combo: ctx.combo || 0, self: ctx.self || false });
    this.store.recordDaily(correct, res.xp);
    if (ctx.combo > (this.state.stats.bestCombo || 0)) this.state.stats.bestCombo = ctx.combo;
    for (const ev of res.events) {
      const name = this.conceptOf(ev.cid)?.concept.term || ev.cid;
      if (ev.type === 'masteryUp' && ev.to === 4) { toast(`★ Mastered: ${name}`, 'good'); this.sound('level'); }
      else if (ev.type === 'masteryUp' && ev.to === 3) toast(`Solid: ${name}`, 'good', 1800);
      else if (ev.type === 'pursuitCleared') { toast(`Pursuit cleared: ${name} (+25 XP)`, 'good'); this.sound('clear'); }
    }
    const lvBefore = levelForXp(this.state.xp - res.xp).index;
    const lvAfter = levelForXp(this.state.xp).index;
    if (lvAfter > lvBefore) { toast(`Level up! You are now ${LEVEL_TITLE(lvAfter)}`, 'xp', 3200); this.confetti({ count: 80 }); this.sound('level'); }
    const unlocked = checkAchievements(this);
    for (const a of unlocked) { toast(`🏆 ${a.title}`, 'xp', 3000); }
    this.store.save();
    renderHeader();
    return res;
  },
  grantXp(amount, why) {
    if (!amount) return;
    this.state.xp += amount;
    const d = this.store.state.days[Object.keys(this.store.state.days).pop()];
    if (d) d.xp += amount;
    toast(`+${amount} XP ${why ? '· ' + why : ''}`, 'xp', 2200);
    const unlocked = checkAchievements(this);
    for (const a of unlocked) toast(`🏆 ${a.title}`, 'xp', 3000);
    this.store.save();
    renderHeader();
  },
};
const LEVEL_TITLE = i => (LEVELS[i] || LEVELS[LEVELS.length - 1]).title;
window.__app = app; // handy for debugging in the console

// ---------- shell ----------
const root = document.getElementById('app');
let shell = null; let mainEl = null; let navEl = null; let bottomEl = null; let headerEl = null;

function brandSvg() {
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="40" width="44" height="6" rx="2" fill="currentColor"/><rect x="13" y="22" width="10" height="18" rx="2" fill="#FF6B6B"/><rect x="27" y="16" width="10" height="24" rx="2" fill="#38BDF8"/><rect x="41" y="26" width="10" height="14" rx="2" fill="#A3E635"/></svg>`;
}

function buildShell() {
  clear(root);
  navEl = h('nav', { class: 'nav', 'aria-label': 'Main' },
    h('a', { class: 'brand', href: '#/home' },
      h('div', { class: 'brand-mark', html: brandSvg() }),
      h('div', null, h('div', { class: 'brand-name' }, 'MARK 201'), h('div', { class: 'brand-sub' }, 'Midterm trainer'))),
    NAV.map(([key, ico, label]) => h('a', { class: 'nav-link', href: '#/' + key, dataset: { route: key } }, h('span', { class: 'ico' }, ico), label, key === 'drill' ? h('span', { class: 'badge quiet', dataset: { due: '1' } }, '') : null)),
    h('div', { class: 'nav-foot small muted' }, h('div', { dataset: { profileName: '1' } }), h('div', { class: 'tiny faint' }, `${app.content.stats.questions} questions · ${app.content.stats.concepts} concepts`)),
  );
  headerEl = h('div', { class: 'topbar' });
  mainEl = h('main', { class: 'main', id: 'main' }, headerEl, h('div', { class: 'view' }));
  bottomEl = h('nav', { class: 'bottom-nav', 'aria-label': 'Main' },
    NAV.filter(([k]) => ['home', 'campaign', 'drill', 'exam', 'arcade', 'progress'].includes(k)).map(([key, ico, label]) =>
      h('a', { href: '#/' + key, dataset: { route: key } }, h('span', { class: 'ico' }, ico), label)));
  shell = h('div', { class: 'shell' }, navEl, mainEl, bottomEl);
  root.appendChild(shell);
}

export function renderHeader() {
  if (!headerEl || !app.state) return;
  clear(headerEl);
  const st = app.state;
  const lv = levelForXp(st.xp);
  const r = readiness(app.content, st);
  const streak = app.store.streakDays();
  headerEl.appendChild(h('div', { class: 'row wrap' },
    h('div', { class: 'xpbar' },
      h('span', { class: 'level-pill' }, `Lv ${lv.number} · ${lv.title}`),
      bar(lv.progress, { color: 'var(--accent)', height: 6 }),
      h('span', { class: 'mono small muted' }, lv.next ? `${st.xp} / ${lv.next.xp} XP` : `${st.xp} XP`)),
    h('span', { class: 'chip' }, `🔥 ${streak} day${streak === 1 ? '' : 's'}`),
    h('span', { class: 'chip', title: 'Exam readiness estimate' }, `Readiness ${Math.round(r.score * 100)}%`),
  ));
  headerEl.appendChild(h('div', { class: 'row' },
    h('a', { class: 'btn sm ghost', href: '#/settings' }, '👤 ', st.name),
  ));
  const due = dueCount(app.content, st);
  navEl.querySelectorAll('[data-due]').forEach(b => { b.textContent = due ? `${due} due` : ''; b.classList.toggle('hidden', !due); });
  navEl.querySelectorAll('[data-profile-name]').forEach(el => { el.textContent = st.name; });
}

function setActive(routeKey) {
  document.querySelectorAll('[data-route]').forEach(a => a.classList.toggle('active', a.dataset.route === routeKey));
}

function parseHash() {
  const raw = (location.hash || '#/home').replace(/^#\/?/, '');
  const parts = raw.split('/').map(decodeURIComponent);
  return { key: parts[0] || 'home', params: parts.slice(1) };
}

function route() {
  if (!app.state) return;
  const { key, params } = parseHash();
  const mod = ROUTES[key] || Home;
  const viewHost = mainEl.querySelector('.view');
  if (app.currentView && app.currentView.cleanup) { try { app.currentView.cleanup(); } catch { /* ignore */ } }
  clear(viewHost);
  let el;
  try {
    el = mod.render(app, params);
  } catch (err) {
    console.error(err);
    el = h('div', { class: 'card' }, h('h2', null, 'Something went wrong'), h('p', { class: 'muted' }, String(err && err.message || err)), h('a', { class: 'btn mt', href: '#/home' }, 'Back home'));
  }
  app.currentView = el;
  viewHost.appendChild(el);
  setActive(key);
  renderHeader();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function applySettings() {
  const s = app.state.settings;
  document.documentElement.dataset.theme = s.theme || 'dark';
  document.documentElement.dataset.motion = s.motion === false ? 'off' : 'on';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', s.theme === 'light' ? '#EEF1F7' : '#121726');
}
app.applySettings = applySettings;

function welcome() {
  clear(root);
  const input = h('input', { type: 'text', placeholder: 'Your name (e.g. Austin)', maxlength: '24', autofocus: true });
  const start = () => {
    const name = (input.value || '').trim() || 'Player';
    app.store.createProfile(name);
    boot();
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') start(); });
  root.appendChild(h('div', { class: 'boot' },
    h('div', { class: 'brand-mark', style: { width: '64px', height: '64px', margin: '0 auto' }, html: brandSvg() }),
    h('h1', null, 'MARK 201 Trainer'),
    h('p', { class: 'muted', style: { maxWidth: '44ch' } }, 'Chapters 1, 6, 7, 8, 9, 10, 11 and 12. Every concept, drilled from every angle until it is concretely yours.'),
    h('div', { class: 'card', style: { width: 'min(380px, 92vw)', textAlign: 'left' } },
      h('div', { class: 'field' }, h('label', null, 'Create your player'), input),
      h('button', { class: 'btn primary block mt', onClick: start }, 'Start training'),
      h('p', { class: 'tiny faint mt-sm' }, 'Progress is saved in this browser only. Friends using the link get their own separate progress.')),
  ));
  setTimeout(() => input.focus(), 50);
}

function boot() {
  if (!app.store.loadActive()) { welcome(); return; }
  applySettings();
  buildShell();
  app.store.on(type => { if (type === 'profile') { applySettings(); route(); } });
  window.addEventListener('hashchange', route);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && app.state) { app.store.touchSession(); renderHeader(); } });
  window.addEventListener('beforeunload', () => app.store.flush());
  if (!location.hash) location.hash = '#/home';
  route();
}

boot();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
