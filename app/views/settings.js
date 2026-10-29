// Settings: profiles, backup, theme, sound, exam date, reset, how-it-works.
import { h, modal, toast } from '../ui.js';
import { icon } from '../icons.js';
import { getCosmetic, setCosmetic } from '../cosmetic.js';
import { shopView } from '../shop.js';
import { MASTERY_LABELS } from '../engine.js';

export function render(app) {
  const st = app.state; const s = st.settings;
  const sw = (key, label, desc, apply) => {
    const btn = h('button', { class: 'switch' + (s[key] !== false ? ' on' : ''), role: 'switch', 'aria-checked': String(s[key] !== false), 'aria-label': label, onClick: () => { s[key] = s[key] === false; btn.classList.toggle('on', s[key] !== false); btn.setAttribute('aria-checked', String(s[key] !== false)); app.store.save(); apply && apply(); } });
    return h('div', { class: 'toggle' }, h('div', null, h('div', { style: { fontWeight: 700 } }, label), h('div', { class: 'small muted' }, desc)), btn);
  };
  const cosSwitch = (key, label, desc, dflt) => {
    const cos = getCosmetic(); let on = cos[key] === undefined ? dflt : !!cos[key];
    const btn = h('button', { class: 'switch' + (on ? ' on' : ''), role: 'switch', 'aria-checked': String(on), 'aria-label': label, onClick: () => { on = !on; setCosmetic({ [key]: on }); btn.classList.toggle('on', on); btn.setAttribute('aria-checked', String(on)); } });
    return h('div', { class: 'toggle' }, h('div', null, h('div', { style: { fontWeight: 700 } }, label), h('div', { class: 'small muted' }, desc)), btn);
  };
  const dateInput = h('input', { type: 'datetime-local', value: s.examDate || '', onChange: e => { s.examDate = e.target.value; app.store.save(); toast('Exam date saved', 'good'); } });
  const fileInput = h('input', { type: 'file', accept: 'application/json', style: { display: 'none' }, onChange: async e => {
    const f = e.target.files[0]; if (!f) return;
    try { app.store.importJSON(await f.text()); toast('Progress merged into this profile', 'good'); app.navigate('#/settings'); } catch (err) { toast(err.message, 'bad'); }
  } });
  return h('div', { class: 'runner stack', style: { gap: '1.2rem' } },
    h('div', { class: 'page-head' }, h('h1', null, 'Settings')),
    h('div', { class: 'card stack' }, h('h3', null, 'Legionary'),
      h('div', { class: 'row wrap between' },
        h('div', null, h('div', { class: 'eyebrow' }, 'Profile'), h('div', { style: { fontWeight: 700, fontSize: '1.15rem' } }, app.profile.username), h('div', { class: 'small muted' }, 'One name, every device. Type it at the gate on any device to open this camp: XP, coins, gear and every course campaign come with it.')),
        h('div', { class: 'row wrap' }, h('a', { class: 'btn sm', href: '#/dash' }, 'The Forum'), h('button', { class: 'btn sm ghost', onClick: () => modal({ title: 'Switch profile?', body: h('p', null, 'Your progress is saved. The next name typed at the gate opens its own camp.'), actions: [{ label: 'Stay', kind: 'ghost' }, { label: 'Switch profile', kind: 'primary', onClick: () => { app.syncer && app.syncer.flushNow(); app.store.logout(); } }] }) }, 'Switch profile'))),
      h('p', { class: 'tiny muted' }, 'Progress saves to the cloud whenever you are online (the chip in the top bar says Saved, Saving or Offline). Offline sessions catch up the next time you are connected.')),
    shopView(app),
    h('div', { class: 'card stack' }, h('h3', null, 'Exam'),
      h('div', { class: 'field' }, h('label', null, 'Midterm date and time (drives the countdown and plan)'), dateInput)),
    h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'Experience'),
      h('div', { class: 'toggle' }, h('div', null, h('div', { style: { fontWeight: 700 } }, 'Watch'), h('div', { class: 'small muted' }, 'Night camp is easier on the eyes after dark; day march for daylight.')),
        h('div', { class: 'seg' }, h('button', { class: s.theme !== 'light' ? 'on' : '', onClick: e => { s.theme = 'dark'; app.store.save(); app.applySettings(); e.currentTarget.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, 'Night camp'), h('button', { class: s.theme === 'light' ? 'on' : '', onClick: e => { s.theme = 'light'; app.store.save(); app.applySettings(); e.currentTarget.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, 'Day march'))),
      sw('briefings', 'War briefings', 'The Legatus briefs you in his tent before each lesson, checkpoint, boss and drill. Skippable any time.'),
      sw('sound', 'Sound effects', 'Short blips for right, wrong, promotions.'),
      sw('motion', 'Motion and confetti', 'Turn off for a calmer, faster feel.', () => app.applySettings()),
      cosSwitch('wagers', 'Confidence wagers', 'Bet 1, 2 or 3 denarii before answering with Q, W, E. Cosmetic coin only: never touches XP or mastery, and never offered in the Midterm Simulation.', true),
      cosSwitch('warTable3d', 'Campaign map in 3D', 'The war table in three dimensions. Off, or when motion is off, the Campaign uses the painted 2.5D map instead.', true)),
    h('div', { class: 'card stack' }, h('h3', null, 'Backup'),
      h('p', { class: 'small muted' }, 'Progress already follows your name between devices. Export keeps a file backup; Import merges a backup (old or new) into this profile, keeping the higher XP and every unlock.'),
      h('div', { class: 'row wrap' },
        h('button', { class: 'btn', onClick: () => { const blob = new Blob([app.store.exportJSON()], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `imperium-progress-${app.profile.username.replace(/\W+/g, '_')}-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); } }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ' Export progress'),
        h('button', { class: 'btn', onClick: () => fileInput.click() }, icon('arrow', { size: 14, tone: 'mono' }), ' Import progress'), fileInput,
        h('button', { class: 'btn danger', onClick: () => modal({ title: `Reset ${app.pack.title} progress?`, body: h('p', null, `Everything for ${app.profile.username} in ${app.pack.title} is wiped: mastery, XP, history. Other courses, coins and gear stay. Export first if unsure.`), actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Reset this course', kind: 'danger', onClick: () => { app.store.resetCourse(); toast('Progress reset'); app.navigate('#/home'); } }] }) }, `Reset ${app.pack.title} progress`))),
    h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'How mastery works'),
      h('div', { class: 'stack small' },
        h('p', null, 'Every concept moves through five states: ', MASTERY_LABELS.map((m, i) => h('span', { class: 'chip', style: { marginRight: '4px' } }, h('span', { class: `mdot m${i}`, style: { '--ch': 'var(--accent)' } }), m)), '.'),
        h('p', null, h('b', null, 'Solid'), ' needs 3 correct answers from at least 2 different question angles, with the last 2 in a row correct.'),
        h('p', null, h('b', null, 'Mastered'), ' needs 4 correct answers from at least 3 angles (definition, scenario, apply, tell-apart, exception, why, calculate, sequence), the last 3 in a row correct, no open pursuit, and at least one correct answer in a later study session (a 45-minute break starts a new session). That last rule is the research: one correct recall in each of several spaced sessions beats many recalls in one sitting.'),
        h('p', null, h('b', null, 'Pursuit'), ': any wrong answer opens a pursuit. The engine schedules three more questions on that concept, from different angles, spaced a few questions apart. A wrong answer during a pursuit resets it. Clearing one is worth +25 XP.'),
        h('p', null, h('b', null, 'Review timing'), ': each correct answer pushes the concept further out (10 min, then 1 h, 4 h, 12 h, 36 h). Due concepts float to the top of Smart Drill.'),
        h('p', null, h('b', null, 'Readiness'), ' = 60% average mastery + 15% coverage + 25% last two simulation scores.'))),
    h('p', { class: 'tiny faint center' }, `Content v${app.content.version} · ${app.content.stats.questions} questions · ${app.content.stats.concepts} concepts · ${app.content.stats.activities} activities`));
}
