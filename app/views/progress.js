// Progress: readiness breakdown, per-chapter mastery, weakest concepts, angle accuracy, history, achievements.
import { h, ring, fmtPct, timeAgo, fmtTime } from '../ui.js';
import { icon } from '../icons.js';
const ACH_ICON = {
  'first': 'gladius',
  'fifty': 'scroll',
  'twofifty': 'column',
  'fivehundred': 'scutum',
  'combo10': 'flame',
  'combo25': 'brazier',
  'pursuit': 'target',
  'pursuit10': 'pilum',
  'solid10': 'column',
  'master10': 'laurel',
  'master50': 'laurel',
  'master100': 'aquila',
  'masterall': 'aquila',
  'boss1': 'galea',
  'bossall': 'standard',
  'exam1': 'tablet',
  'exam90': 'seal',
  'exam100': 'laurel',
  'blitz1500': 'horn',
  'chapterfull': 'book',
  'streak2': 'sundial',
  'reader': 'book',
};
import { readiness, chapterMastery, weakestConcepts, ANGLE_LABELS, MASTERY_LABELS, levelForXp } from '../engine.js';
import { ACHIEVEMENTS } from '../achievements.js';
import { shelfMap } from './common.js';
import { rankLadder, phalerae, legionGround } from '../legion.js';

export function render(app) {
  const st = app.state;
  const r = readiness(app.content, st);
  const total = app.xp(); const lv = levelForXp(total);
  const chapters = app.content.chapters.map(ch => ({ ch, m: chapterMastery(app.content, st, ch.chapter) }));
  const weakest = weakestConcepts(app.content, st, 12);
  const angles = Object.entries(st.stats.byAngle || {}).map(([a, v]) => ({ a, acc: v.c / (v.c + v.w), n: v.c + v.w })).sort((x, y) => x.acc - y.acc);
  const days = Object.entries(st.days).sort().slice(-7);
  const exams = (st.exams || []).slice(-10);

  return h('div', { class: 'stack', style: { gap: '1.3rem' } },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Progress'), h('p', null, 'Test Readiness blends mastery (60%), how much of the course you have touched (15%) and your last two midterm simulations (25%).'))),
    h('div', { class: 'grid three' },
      h('div', { class: 'card row' }, ring(r.score, { size: 84, stroke: 8, color: r.score >= 0.85 ? 'var(--good)' : 'var(--accent)', label: fmtPct(r.score) }), h('div', null, h('div', { class: 'eyebrow' }, 'Test Readiness'), h('div', { class: 'small muted' }, `Mastery ${fmtPct(r.mastery)} · coverage ${fmtPct(r.coverage)}${r.examAvg !== null ? ` · sims ${fmtPct(r.examAvg)}` : ''}`))),
      h('div', { class: 'card' }, h('div', { class: 'eyebrow' }, 'Level'), h('div', { class: 'score-big', style: { fontSize: '1.8rem' } }, `Lv ${lv.number}`), h('div', { class: 'small muted' }, `${lv.title} · ${total} XP across every course${lv.next ? ` · ${lv.next.xp - total} to next` : ''}`)),
      h('div', { class: 'card' }, h('div', { class: 'eyebrow' }, 'Answers'), h('div', { class: 'score-big', style: { fontSize: '1.8rem' } }, String(st.stats.answered)), h('div', { class: 'small muted' }, `${st.stats.answered ? Math.round(st.stats.correct / st.stats.answered * 100) : 0}% accuracy · best combo ${st.stats.bestCombo || 0} · ${st.stats.pursuitsCleared || 0} pursuits cleared`))),
    h('div', { class: 'card' }, h('h2', { class: 'mb' }, 'By chapter'),
      h('div', { class: 'stack' }, chapters.map(({ ch, m }) => h('div', { class: 'row wrap', style: { '--ch': ch.color } },
        h('span', { style: { width: '150px', fontWeight: 700, fontSize: '0.9rem' } }, icon(app.chapterIcon(ch.chapter), { size: 22, tone: 'gold' }), ` Ch ${ch.chapter} ${ch.short}`),
        h('div', { class: 'grow', style: { minWidth: '160px' } }, stackedBar(m.dist, ch.color)),
        h('span', { class: 'mono small muted', style: { width: '190px' } }, icon('laurel', { size: 14, tone: 'gold' }), `${m.dist[4]} `, icon('check', { size: 14, tone: 'mono' }), `${m.dist[3]} ${m.dist[2]} · ${m.pursuits ? m.pursuits + ' ' : ''}`, m.pursuits ? icon('target', { size: 14, tone: 'mono' }) : null, `${m.pursuits ? ' · ' : ''}${Math.round(m.score * 100)}%`),
        h('a', { class: 'btn sm ghost', href: `#/drill/chapter/${ch.chapter}` }, 'Drill')))),
      h('p', { class: 'tiny muted mt-sm' }, icon('laurel', { size: 14, tone: 'gold' }), ' mastered · ', icon('check', { size: 14, tone: 'mono' }), ' solid · learning · ', icon('target', { size: 14, tone: 'mono' }), ' open pursuits')),
    weakSkills(app),
    h('div', { class: 'card' }, h('h2', { class: 'mb' }, 'Cursus honorum'), rankLadder(app)),
    h('div', null, h('div', { class: 'page-head' }, h('h2', null, 'Your legion')), legionGround(app)),
    h('div', { class: 'grid two' },
      h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'Weakest concepts'),
        weakest.length ? h('div', { class: 'list' }, weakest.map(w => h('div', { class: 'li', style: { '--ch': w.chapter.color } },
          h('span', { class: `mdot m${w.level}` }), h('div', { class: 'grow' }, h('div', { class: 't' }, w.concept.term), h('div', { class: 's' }, `Ch ${w.chapter.chapter} · ${MASTERY_LABELS[w.level]} · ${Math.round(w.acc * 100)}% of ${w.total}${w.pursuit ? ' · ' : ''}`, w.pursuit ? icon('target', { size: 14, tone: 'mono' }) : null)),
          h('a', { class: 'btn sm', href: `#/drill/concepts/${w.concept.id}` }, 'Drill')))) : h('div', { class: 'empty' }, 'Answer some questions and your weak spots will show up here.'),
        weakest.length ? h('a', { class: 'btn primary block mt', href: `#/drill/concepts/${weakest.map(w => w.concept.id).join(',')}` }, 'Drill all of these') : null),
      h('div', { class: 'stack' },
        h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'Accuracy by question angle'),
          angles.length ? h('div', { class: 'stack' }, angles.map(a => h('div', { class: 'bar-row' }, h('span', { class: 'bar-label' }, ANGLE_LABELS[a.a] || a.a), h('div', { class: 'row' }, h('div', { class: 'bar', style: { height: '10px' } }, h('div', { class: 'bar-fill', style: { width: (a.acc * 100) + '%', background: a.acc >= 0.85 ? 'var(--good)' : a.acc >= 0.7 ? 'var(--accent)' : 'var(--bad)' } })), h('span', { class: 'mono small', style: { width: '70px', textAlign: 'right' } }, `${Math.round(a.acc * 100)}% · ${a.n}`))))) : h('p', { class: 'muted small' }, 'No data yet.')),
        h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'Last 7 days'),
          days.length ? h('div', null, h('div', { class: 'spark', style: { '--ch': 'var(--accent)' } }, days.map(([d, v]) => h('span', { title: `${d}: ${v.answered} answered, ${v.xp} XP`, style: { height: Math.max(6, Math.min(100, v.answered / Math.max(1, Math.max(...days.map(x => x[1].answered))) * 100)) + '%' } }))), h('div', { class: 'row between tiny muted mt-sm' }, h('span', null, days[0][0]), h('span', null, days[days.length - 1][0]))) : h('p', { class: 'muted small' }, 'No study days yet.')),
        h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'Midterm simulations'),
          exams.length ? h('div', { class: 'list' }, exams.slice().reverse().map(e => h('div', { class: 'li' }, h('b', { style: { color: e.score >= 0.9 ? 'var(--good)' : e.score >= 0.7 ? 'var(--accent)' : 'var(--bad)' } }, `${Math.round(e.score * 100)}%`), h('span', { class: 's' }, `${e.correct}/${e.n} · ${fmtTime(e.durationSec)} · ${timeAgo(e.t)}`)))) : h('p', { class: 'muted small' }, 'Run a midterm simulation to see history here.')))),
    h('div', null, h('div', { class: 'page-head' }, h('h2', null, `Phalerae · ${Object.keys(st.achievements).length}/${ACHIEVEMENTS.length}`)), phalerae(app)));
}

function stackedBar(dist, color) {
  const total = dist.reduce((a, b) => a + b, 0) || 1;
  const seg = (n, bg, op) => h('div', { style: { width: (n / total * 100) + '%', background: bg, opacity: op, height: '100%' } });
  return h('div', { class: 'bar', style: { height: '12px', display: 'flex' } },
    seg(dist[4], color, 1), seg(dist[3], color, 0.65), seg(dist[2], color, 0.35), seg(dist[1], 'var(--surface-3)', 1));
}


/** Weak skills: the calculation errors the trainer has diagnosed on typed answers, most frequent first. */
function weakSkills(app) {
  const st = app.state; const errs = Object.entries(st.stats.calcErrors || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (!errs.length) return null;
  const labels = st.stats.calcErrorLabels || {}; const byC = st.stats.calcErrorConcepts || {};
  return h('div', { class: 'card' }, h('h2', { class: 'mb' }, 'Weak skills'), h('p', { class: 'small muted' }, 'Classic calculation errors the trainer recognised in your typed answers. Drill the concepts where each one bit you.'),
    h('div', { class: 'list' }, errs.map(([id, n]) => { const cids = Object.entries(byC[id] || {}).sort((a, b) => b[1] - a[1]).map(([cid]) => cid).filter(cid => app.conceptOf(cid)); return h('div', { class: 'li' },
      h('span', { class: 'chip bad' }, `×${n}`), h('div', { class: 'grow' }, h('div', { class: 't' }, labels[id] || id.replace(/-/g, ' ')), h('div', { class: 's' }, cids.slice(0, 3).map(cid => app.conceptOf(cid).concept.term).join(' · ') || id)),
      cids.length ? h('a', { class: 'btn sm', href: `#/drill/concepts/${cids.slice(0, 4).join(',')}` }, 'Drill') : null); })));
}
