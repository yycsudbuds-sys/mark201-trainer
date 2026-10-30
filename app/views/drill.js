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
  if (sub === 'go') return start(app, loadCfg(app) || {}, true);
  return config(app, {});
}

/** The remembered drill setup for this course on this device (chapters, topics, filter, goal). */
function loadCfg(app) { try { return JSON.parse(localStorage.getItem(`imperium.drillcfg.${app.course}`) || sessionStorage.getItem(`drillcfg.${app.course}`) || 'null'); } catch { return null; } }
function saveCfg(app, cfg) { try { localStorage.setItem(`imperium.drillcfg.${app.course}`, JSON.stringify(cfg)); sessionStorage.setItem(`drillcfg.${app.course}`, JSON.stringify(cfg)); } catch { /* ignore */ } }

function config(app, { weak }) {
  const saved = loadCfg(app);
  const selected = new Set(saved && saved.chapterList ? saved.chapterList : app.content.chapters.map(c => c.chapter));
  const topics = new Set(saved && saved.topicList ? saved.topicList : []); // empty = every topic of the chosen chapters
  let goal = saved?.limit ?? 30;
  let mode = weak ? 'weak' : (saved?.mode || 'drill');
  const due = dueCount(app.content, app.state);
  const now = Date.now();
  /** Concepts in the current selection, split by status. */
  const tally = () => {
    const out = { all: 0, unknown: 0, weak: 0, pursuits: 0, questions: 0 };
    for (const ch of app.content.chapters) {
      if (!selected.has(ch.chapter)) continue;
      for (const t of ch.topics) {
        if (topics.size && !topics.has(t.id)) continue;
        for (const cid of t.concepts) {
          const cs = app.state.concepts[cid]; out.all++;
          if (!cs || !cs.a?.length) out.unknown++;
          else if (masteryLevel(cs) < 3 || cs.pursuit) out.weak++;
          if (cs?.pursuit) out.pursuits++;
          if (mode === 'unknown' && cs && cs.a?.length) continue;
          if (mode === 'weak' && cs && masteryLevel(cs) >= 3 && !cs.pursuit) continue;
          out.questions += ch.questions.filter(q => q.concept === cid).length;
        }
      }
    }
    return out;
  };
  const countEl = h('div', { class: 'row wrap drill-count' });
  const drawCount = () => {
    const t = tally(); const n = mode === 'unknown' ? t.unknown : mode === 'weak' ? t.weak : t.all;
    countEl.replaceChildren(h('span', { class: 'chip' + (n ? '' : ' bad') }, `${n} concept${n === 1 ? '' : 's'} match`), h('span', { class: 'chip' }, `${t.questions} questions`), h('span', { class: 'chip bad' }, `${t.pursuits} pursuits open`), h('span', { class: 'chip warn' }, `${due} due for review`), h('span', { class: 'chip' }, `${t.unknown} unknown · ${t.weak} weak`));
    goBtn.disabled = !n;
  };
  const goalSeg = h('div', { class: 'seg' }, [15, 30, 60, 0].map(n => h('button', { class: goal === n ? 'on' : '', onClick: e => { goal = n; goalSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, n ? `${n} Q` : 'Endless')));
  const modeBtn = (key, ico, label, title) => h('button', { class: mode === key ? 'on' : '', title, onClick: e => { mode = key; modeSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); drawCount(); } }, icon(ico, { size: 16, tone: 'mono' }), ' ' + label);
  const modeSeg = h('div', { class: 'seg' },
    modeBtn('unknown', 'pilum', 'Unknown', 'Concepts you have never answered'),
    modeBtn('weak', 'scutum', 'Weak', 'Below Solid, or under pursuit'),
    modeBtn('drill', 'swords', 'All', 'Everything, interleaved; the engine picks'));
  // topic filter: chips per topic of the selected chapters
  const topicBox = h('div', { class: 'topic-picker' });
  const drawTopics = () => {
    topicBox.innerHTML = '';
    for (const ch of app.content.chapters) {
      if (!selected.has(ch.chapter)) continue;
      const row = h('div', { class: 'topic-row' }, h('span', { class: 'tiny muted' }, `Ch ${ch.chapter}`));
      for (const t of ch.topics) row.appendChild(h('button', { class: 'chip' + (topics.has(t.id) ? ' ch' : ''), type: 'button', style: { '--ch': ch.color }, onClick: e => { if (topics.has(t.id)) topics.delete(t.id); else topics.add(t.id); e.currentTarget.classList.toggle('ch', topics.has(t.id)); drawCount(); } }, t.title));
      topicBox.appendChild(row);
    }
    for (const tid of [...topics]) if (![...selected].some(n => app.index.chapter.get(n)?.topics.some(t => t.id === tid))) topics.delete(tid);
  };
  const goBtn = h('button', { class: 'btn primary big', onClick: () => {
    if (!selected.size) { app.toast('Pick at least one chapter', 'bad'); return; }
    const concepts = topics.size ? [...topics].flatMap(tid => app.index.topic.get(tid)?.topic.concepts || []) : null;
    saveCfg(app, { chapterList: [...selected], topicList: [...topics], limit: goal || null, mode, concepts });
    app.navigate('#/drill/go');
  } }, 'March out');
  drawTopics(); drawCount();
  return h('div', { class: 'runner' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, weak ? 'Weak Spot Hunter' : 'Smart Drill'), h('p', null, 'The engine picks the ground: open pursuits first, then concepts due for review, then weak and fresh ones, interleaved across the chapters. Lose one and it is contested three more times from different angles.'))),
    h('div', { class: 'card stack' },
      countEl,
      h('div', { class: 'field' }, h('label', null, 'Chapters'), chapterPicker(app, selected, () => { drawTopics(); drawCount(); })),
      h('div', { class: 'field' }, h('label', null, 'Topics (none selected = all)'), topicBox),
      h('div', { class: 'row wrap' }, h('div', { class: 'field' }, h('label', null, 'Which concepts'), modeSeg), h('div', { class: 'field' }, h('label', null, 'Session goal'), goalSeg)),
      goBtn,
      h('p', { class: 'tiny muted' }, 'Keyboard: 1–5 to answer, Enter to continue; typed answers accept $, commas and %. Unknown and Weak show the concept card before the first question of each concept. Your choices are remembered.')));
}

function start(app, cfg, fromSession) {
  const chapters = cfg.chapters || (cfg.chapterList ? new Set(cfg.chapterList) : null);
  const mode = cfg.mode || (cfg.weak ? 'weak' : 'drill');
  if (!cfg.concepts && Array.isArray(cfg.conceptsList)) cfg.concepts = new Set(cfg.conceptsList);
  if (Array.isArray(cfg.concepts)) cfg.concepts = new Set(cfg.concepts);
  const host = h('div');
  const introduced = new Set();
  let runner = null;
  warBriefing(app, { kind: mode === 'weak' ? 'weak' : 'drill', cta: 'Take command' }).then(() => { if (host.dead) return; runner = build(); host.appendChild(runner); });
  host.cleanup = () => { host.dead = true; runner && runner.cleanup && runner.cleanup(); };
  return host;
  function build() { return createRunner(app, {
    title: cfg.title || (mode === 'weak' ? 'Weak Spot Hunter' : mode === 'unknown' ? 'Fresh ground' : 'Smart Drill'), subtitle: (chapters && chapters.size < app.content.chapters.length ? `Chapters ${[...chapters].sort((a, b) => a - b).join(', ')}` : 'All chapters, interleaved') + (mode === 'unknown' ? ' · unknown concepts only' : mode === 'weak' ? ' · weak concepts only' : ''),
    mode, chapters, concepts: cfg.concepts || null, limit: cfg.limit || null, feedback: 'immediate',
    pickOpts: { excludeMastered: mode === 'drill' && !cfg.concepts },
    introCard: (mode === 'weak' || mode === 'unknown' || cfg.pursuitFirst) ? cid => { if (introduced.has(cid)) return false; introduced.add(cid); return true; } : null,
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
