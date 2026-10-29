// Smart Drill (adaptive), Weak Spot Hunter, chapter drill, concept-list drill.
import { h } from '../ui.js';
import { icon } from '../icons.js';
import { masteryLevel, dueCount } from '../engine.js';
import { chapterPicker } from './common.js';
import { createRunner, resultCard, missesList } from './runner.js';
import { warBriefing } from '../cutscene.js';

export function render(app, params) {
  const [sub, arg] = params;
  if (sub === 'weak') return config(app, { weak: true });
  if (sub === 'chapter') return start(app, { chapters: new Set([parseInt(arg, 10)]), limit: 30, title: `Chapter ${arg} drill` });
  if (sub === 'concepts') {
    const ids = (arg || '').split(',').filter(Boolean);
    return start(app, { concepts: new Set(ids), limit: Math.max(12, ids.length * 4), title: 'Retake the lost ground', weak: false, pursuitFirst: true });
  }
  if (sub === 'go') return start(app, JSON.parse(sessionStorage.getItem(`drillcfg.${app.course}`) || '{}'), true);
  return config(app, {});
}

function config(app, { weak }) {
  const saved = JSON.parse(sessionStorage.getItem(`drillcfg.${app.course}`) || 'null');
  const selected = new Set(saved && saved.chapterList ? saved.chapterList : app.content.chapters.map(c => c.chapter));
  let goal = saved?.limit ?? 30;
  let mode = weak ? 'weak' : (saved?.mode || 'drill');
  const due = dueCount(app.content, app.state);
  let pursuits = 0; let weakCount = 0;
  for (const ch of app.content.chapters) for (const c of ch.concepts) { const cs = app.state.concepts[c.id]; if (cs?.pursuit) pursuits++; if (cs?.a?.length && masteryLevel(cs) < 3) weakCount++; }
  const goalSeg = h('div', { class: 'seg' }, [15, 30, 60, 0].map(n => h('button', { class: goal === n ? 'on' : '', onClick: e => { goal = n; goalSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, n ? `${n} Q` : 'Endless')));
  const modeSeg = h('div', { class: 'seg' },
    h('button', { class: mode === 'drill' ? 'on' : '', onClick: e => { mode = 'drill'; modeSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, icon('swords', { size: 16, tone: 'mono' }), ' Full field'),
    h('button', { class: mode === 'weak' ? 'on' : '', onClick: e => { mode = 'weak'; modeSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, icon('scutum', { size: 16, tone: 'mono' }), ' Weak flank only'));
  return h('div', { class: 'runner' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, weak ? 'Weak Spot Hunter' : 'Smart Drill'), h('p', null, 'The engine picks the ground: open pursuits first, then concepts due for review, then weak and fresh ones, interleaved across the chapters. Lose one and it is contested three more times from different angles.'))),
    h('div', { class: 'card stack' },
      h('div', { class: 'row wrap' }, h('span', { class: 'chip bad' }, `${pursuits} pursuits open`), h('span', { class: 'chip warn' }, `${due} due for review`), h('span', { class: 'chip' }, `${weakCount} weak`)),
      h('div', { class: 'field' }, h('label', null, 'Chapters'), chapterPicker(app, selected)),
      h('div', { class: 'row wrap' }, h('div', { class: 'field' }, h('label', null, 'Session goal'), goalSeg), h('div', { class: 'field' }, h('label', null, 'Mode'), modeSeg)),
      h('button', { class: 'btn primary big', onClick: () => {
        if (!selected.size) { app.toast('Pick at least one chapter', 'bad'); return; }
        sessionStorage.setItem(`drillcfg.${app.course}`, JSON.stringify({ chapterList: [...selected], limit: goal || null, mode }));
        app.navigate('#/drill/go');
      } }, 'March out'),
      h('p', { class: 'tiny muted' }, 'Keyboard: 1–5 to answer, Enter to continue. Weak-spot mode shows the concept card before the first question of each concept.')));
}

function start(app, cfg, fromSession) {
  const chapters = cfg.chapters || (cfg.chapterList ? new Set(cfg.chapterList) : null);
  const mode = cfg.mode || (cfg.weak ? 'weak' : 'drill');
  const host = h('div');
  const introduced = new Set();
  let runner = null;
  warBriefing(app, { kind: mode === 'weak' ? 'weak' : 'drill', cta: 'Take command' }).then(() => { if (host.dead) return; runner = build(); host.appendChild(runner); });
  host.cleanup = () => { host.dead = true; runner && runner.cleanup && runner.cleanup(); };
  return host;
  function build() { return createRunner(app, {
    title: cfg.title || (mode === 'weak' ? 'Weak Spot Hunter' : 'Smart Drill'), subtitle: chapters && chapters.size < app.content.chapters.length ? `Chapters ${[...chapters].sort((a, b) => a - b).join(', ')}` : 'All chapters, interleaved',
    mode, chapters, concepts: cfg.concepts || null, limit: cfg.limit || null, feedback: 'immediate',
    pickOpts: { excludeMastered: mode !== 'weak' && !cfg.concepts },
    introCard: (mode === 'weak' || cfg.pursuitFirst) ? cid => { if (introduced.has(cid)) return false; introduced.add(cid); return true; } : null,
    onFinish: (sum, reason) => {
      host.innerHTML = '';
      host.append(resultCard(app, reason === 'exhausted' ? 'No ground left to contest right now' : 'Drill complete', sum,
        h('div', { class: 'stack mt' },
          reason === 'exhausted' ? h('p', { class: 'muted' }, 'Everything in this selection is mastered or resting until its next review. Return after a break, or widen the chapter selection.') : null,
          h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
            h('a', { class: 'btn primary', href: fromSession ? '#/drill/go' : location.hash }, 'March again'),
            h('a', { class: 'btn ghost', href: '#/drill' }, 'Change orders'),
            h('a', { class: 'btn ghost', href: '#/home' }, 'Home')))),
      sum.log.some(l => !l.correct) ? h('div', { class: 'mt' }, h('h3', { class: 'mb' }, `Ground lost (${sum.log.filter(l => !l.correct).length})`), missesList(app, sum.log)) : null);
    },
  }); }
}
