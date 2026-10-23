// Midterm simulator: timed, deferred feedback, exam-weighted; full debrief.
import { h, fmtTime, timeAgo } from '../ui.js';
import { icon } from '../icons.js';
import { buildExam } from '../engine.js';
import { chapterPicker } from './common.js';
import { createRunner } from './runner.js';
import { warBriefing } from '../cutscene.js';

export function render(app, params) {
  const [sub] = params;
  if (sub === 'go') return run(app, JSON.parse(sessionStorage.getItem('examcfg') || '{}'));
  if (sub === 'result') return result(app, JSON.parse(sessionStorage.getItem('examresult') || 'null'));
  return config(app);
}

function config(app) {
  const saved = JSON.parse(sessionStorage.getItem('examcfg') || 'null');
  const selected = new Set(saved?.chapterList || app.content.chapters.map(c => c.chapter));
  let n = saved?.n || 40; let per = saved?.per ?? 75;
  const nSeg = h('div', { class: 'seg' }, [20, 40, 60, 80].map(k => h('button', { class: n === k ? 'on' : '', onClick: e => { n = k; nSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, `${k} Q`)));
  const tSeg = h('div', { class: 'seg' }, [[60, '60 s / Q'], [75, '75 s / Q'], [90, '90 s / Q'], [0, 'Untimed']].map(([k, l]) => h('button', { class: per === k ? 'on' : '', onClick: e => { per = k; tSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, l)));
  const history = (app.state.exams || []).slice().reverse();
  return h('div', { class: 'runner' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'The Great Battle'), h('p', null, 'Exam conditions: questions mixed across every province and weighted like the real test, no word from the Legatus until the field is cleared, a clock. Every miss becomes a pursuit in Field Drill.'))),
    h('div', { class: 'card stack' },
      h('div', { class: 'field' }, h('label', null, 'Chapters'), chapterPicker(app, selected)),
      h('div', { class: 'row wrap' }, h('div', { class: 'field' }, h('label', null, 'Questions'), nSeg), h('div', { class: 'field' }, h('label', null, 'Pace'), tSeg)),
      h('button', { class: 'btn primary big', onClick: () => {
        if (!selected.size) { app.toast('Pick at least one chapter', 'bad'); return; }
        sessionStorage.setItem('examcfg', JSON.stringify({ chapterList: [...selected], n, per }));
        app.navigate('#/exam/go');
      } }, 'Give battle'),
      h('p', { class: 'tiny muted' }, 'Tip: the real midterm is mostly scenario questions. The simulator over-weights those and leans on difficulty 2–3.')),
    history.length ? h('div', { class: 'mt' }, h('h2', { class: 'mb' }, 'History'), h('div', { class: 'list' }, history.slice(0, 12).map(e => h('div', { class: 'li' },
      h('div', { class: 'score-big', style: { fontSize: '1.4rem', color: e.score >= 0.9 ? 'var(--good)' : e.score >= 0.7 ? 'var(--accent)' : 'var(--bad)' } }, `${Math.round(e.score * 100)}%`),
      h('div', { class: 'grow' }, h('div', { class: 't' }, `${e.correct}/${e.n} · ${fmtTime(e.durationSec)}`), h('div', { class: 's' }, `${timeAgo(e.t)} · chapters ${e.chapters.join(', ')}`)),
      e.misses?.length ? h('a', { class: 'btn sm', href: `#/drill/concepts/${[...new Set(e.misses.map(m => app.questionOf(m)?.question.concept).filter(Boolean))].join(',')}` }, 'Drill misses') : null)))) : null);
}

function run(app, cfg) {
  const chapters = new Set(cfg.chapterList || app.content.chapters.map(c => c.chapter));
  const n = cfg.n || 40;
  const questions = buildExam(app.content, app.state, { n, chapters });
  if (questions.length < n) app.toast(`Only ${questions.length} questions available for this selection`, 'info');
  const host = h('div');
  let runner = null;
  warBriefing(app, { kind: 'exam', cta: 'Give battle' }).then(() => { if (host.dead) return; runner = build(); host.appendChild(runner); });
  host.cleanup = () => { host.dead = true; runner && runner.cleanup && runner.cleanup(); };
  return host;
  function build() { return createRunner(app, {
    title: 'The Great Battle', subtitle: `${questions.length} questions · ${cfg.per ? fmtTime(cfg.per * questions.length) + ' total' : 'untimed'} · no feedback until the end`,
    mode: 'exam', questions, feedback: 'deferred', limit: questions.length, timer: cfg.per ? cfg.per * questions.length : null, pursuit: false,
    onFinish: (sum, reason) => {
      const byChapter = {};
      for (const l of sum.log) { const ch = app.conceptOf(l.cid).chapter.chapter; byChapter[ch] = byChapter[ch] || { c: 0, n: 0 }; byChapter[ch].n++; if (l.correct) byChapter[ch].c++; }
      const rec = { t: Date.now(), n: questions.length, answered: sum.answered, correct: sum.correct, score: sum.answered ? sum.correct / questions.length : 0, durationSec: sum.durationSec, byChapter, chapters: [...chapters].sort((a, b) => a - b), misses: sum.log.filter(l => !l.correct).map(l => l.qid), log: sum.log.map(l => ({ qid: l.qid, correct: l.correct, chosen: l.chosen, answer: l.answer })), reason };
      app.state.exams.push(rec); if (app.state.exams.length > 30) app.state.exams.shift();
      app.grantXp(100 + Math.round(rec.score * 200), 'simulation complete');
      if (rec.score >= 0.9) app.confetti({ count: 200 });
      app.store.save();
      sessionStorage.setItem('examresult', JSON.stringify(rec));
      app.navigate('#/exam/result');
    },
    onExit: () => {},
  }); }
}

function result(app, rec) {
  if (!rec) return h('div', { class: 'card' }, 'No result to show. ', h('a', { href: '#/exam' }, 'Start a simulation'));
  const pct = Math.round(rec.score * 100);
  const chRows = Object.entries(rec.byChapter).sort((a, b) => a[0] - b[0]).map(([chn, v]) => {
    const ch = app.index.chapter.get(parseInt(chn, 10));
    return h('div', { class: 'bar-row' }, h('span', { class: 'bar-label' }, `Ch ${chn} ${ch?.short || ''}`), h('div', { class: 'row' }, h('div', { class: 'bar', style: { height: '10px' } }, h('div', { class: 'bar-fill', style: { width: (v.c / v.n * 100) + '%', background: ch?.color || 'var(--accent)' } })), h('span', { class: 'mono small', style: { width: '48px', textAlign: 'right' } }, `${v.c}/${v.n}`)));
  });
  const missConcepts = [...new Set(rec.misses.map(m => app.questionOf(m)?.question.concept).filter(Boolean))];
  let filter = 'wrong';
  const list = h('div', { class: 'list' });
  const drawList = () => {
    list.innerHTML = '';
    const items = rec.log.filter(l => filter === 'all' || !l.correct);
    if (!items.length) list.appendChild(h('div', { class: 'empty' }, 'No ground lost. A triumph.'));
    for (const l of items) {
      const q = app.questionOf(l.qid)?.question; if (!q) continue; const c = app.conceptOf(q.concept);
      list.appendChild(h('div', { class: 'review-item ' + (l.correct ? 'right' : 'wrong') },
        h('div', { class: 'row wrap small' }, h('span', { class: 'chip ch', style: { '--ch': c.chapter.color } }, `Ch ${c.chapter.chapter}`), h('b', null, c.concept.term), h('span', { class: 'muted' }, l.correct ? icon('check', { size: 14, tone: 'laurel' }) : icon('cross', { size: 14, tone: 'crimson' }))),
        h('p', null, q.stem),
        !l.correct ? h('div', { class: 'opt chosen' }, l.chosen === null ? '(no answer)' : `You chose: ${l.chosen}`) : null,
        h('div', { class: 'opt correct' }, `Answer: ${l.answer}`),
        h('p', { class: 'small muted' }, q.explanation)));
    }
  };
  drawList();
  const seg = h('div', { class: 'seg' }, h('button', { class: 'on', onClick: e => { filter = 'wrong'; seg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); drawList(); } }, `Ground lost (${rec.misses.length})`), h('button', { onClick: e => { filter = 'all'; seg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); drawList(); } }, 'All questions'));
  return h('div', { class: 'runner stack', style: { gap: '1.2rem' } },
    h('div', { class: 'card center' },
      h('div', { class: 'eyebrow' }, rec.reason === 'time' ? 'The sun set on the field' : 'The field is cleared'),
      h('div', { class: 'score-big', style: { color: pct >= 90 ? 'var(--good)' : pct >= 70 ? 'var(--accent)' : 'var(--bad)' } }, `${pct}%`),
      h('p', { class: 'muted' }, `${rec.correct} of ${rec.n} · ${fmtTime(rec.durationSec)}${rec.answered < rec.n ? ` · ${rec.n - rec.answered} unanswered` : ''}`),
      h('p', null, verdict(pct)),
      h('div', { class: 'row wrap mt', style: { justifyContent: 'center' } },
        missConcepts.length ? h('a', { class: 'btn primary big', href: `#/drill/concepts/${missConcepts.join(',')}` }, icon('swords', { size: 16, tone: 'mono' }), ` Retake ${missConcepts.length} lost stronghold${missConcepts.length === 1 ? '' : 's'}`) : null,
        h('a', { class: 'btn', href: '#/exam' }, 'Another battle'), h('a', { class: 'btn ghost', href: '#/home' }, 'Castra'))),
    h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'By province'), h('div', { class: 'stack' }, chRows)),
    h('div', null, h('div', { class: 'page-head' }, h('h2', null, 'Debrief'), seg), list));
}

function verdict(p) {
  if (p >= 95) return 'That is a perfect-score pace. Keep every pursuit closed and you are there.';
  if (p >= 90) return 'A-range. The misses below are exactly the concepts between you and 100%.';
  if (p >= 80) return 'Strong base. Drill the misses now, while the context is fresh, then re-simulate in a few hours.';
  if (p >= 65) return 'The chapters with low bars above need a Campaign re-run before the next simulation.';
  return 'Go back to Campaign for the weakest chapters: read, then checkpoint. Simulations work best once the basics are Solid.';
}
