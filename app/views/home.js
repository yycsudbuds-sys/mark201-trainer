// Home (HQ): map hero, next quest, mode cartridges, the Shelf, two-day plan.
import { h, ring, fmtPct } from '../ui.js';
import { readiness, masteryLevel, dueCount } from '../engine.js';
import { shelfMap, nextAction } from './common.js';
import { worldMap, chapterProgress } from '../map.js';

const PLAN = [
  { day: 'Today', items: [
    ['Campaign: Ch 1 and Ch 6 islands', 'Each level: lesson slides (5 min), then clear the checkpoint.'],
    ['Campaign: Ch 7 and Ch 8 islands', 'Ch 8 is table-heavy (PLC, Ansoff, adoption curve). Use Build & Sort after the checkpoint.'],
    ['Break 45+ min, then Smart Drill (30 Q)', 'A gap starts a new session. Mastered requires a correct answer in a later session.'],
    ['Campaign: Ch 9 and Ch 10 islands', 'Pricing has calculations: do every calc question until BEP and markup are automatic.'],
    ['Campaign: Ch 11 and Ch 12 islands', 'Wholesaler types and the advocacy funnel are pure memorization: use the Build activities.'],
    ['Blitz × 3 before bed', 'Fast retrieval of definitions. Then sleep: memory consolidates overnight.'],
  ] },
  { day: 'Tomorrow', items: [
    ['Morning: Smart Drill until no pursuits remain', 'Interleaved across all chapters. Aim for 60+ questions.'],
    ['Midterm simulation #1 (60 Q, timed)', 'Review every miss. Then “Drill my misses”.'],
    ['Beat every island boss', '90% or better on each. Bosses still open are your weakest chapters.'],
    ['Afternoon: Flashcards sweep of every concept', 'Grade honestly: Again on anything you hesitated on.'],
    ['Midterm simulation #2 (80 Q)', 'Target 95%+. Anything missed twice gets a lesson re-read.'],
    ['Evening: Weak Spot Hunter, then stop', 'Light review only. No all-nighter: sleep beats cramming.'],
  ] },
  { day: 'Exam day', items: [
    ['20-minute Blitz warm-up', 'Wake up retrieval, do not learn new material.'],
    ['Skim the cheat sheets for Ch 8 and Ch 9', 'PLC table, adoption percentages, pricing buckets, BEP formula.'],
  ] },
];

export function render(app) {
  const st = app.state;
  const r = readiness(app.content, st);
  const counts = [0, 0, 0, 0, 0]; let pursuits = 0;
  for (const ch of app.content.chapters) for (const c of ch.concepts) { const cs = st.concepts[c.id]; counts[masteryLevel(cs)]++; if (cs && cs.pursuit) pursuits++; }
  const due = dueCount(app.content, st);
  const today = st.days[Object.keys(st.days).sort().pop()] || { answered: 0, correct: 0 };
  const na = nextAction(app);
  const exam = examCountdown(st.settings.examDate);
  const islands = app.content.chapters.filter(ch => chapterProgress(app, ch).boss).length;

  const hero = h('section', { class: 'hq' },
    h('div', { class: 'hq-side' },
      h('div', { class: 'eyebrow' }, exam ? `The midterm ${exam} · Castra` : 'Castra'),
      h('h1', null, `Ave, ${st.name}.`),
      h('p', { class: 'muted' }, headline(r, counts)),
      h('div', { class: 'hq-ring' }, ring(r.score, { size: 132, stroke: 11, color: r.score >= 0.85 ? 'var(--good)' : 'var(--accent)', label: h('div', { class: 'center' }, h('div', { class: 'big', style: { fontSize: '1.9rem', fontFamily: 'var(--font-display)', fontWeight: 800 } }, fmtPct(r.score)), h('div', { class: 'tiny muted' }, 'test readiness')) })),
      h('div', { class: 'hq-stats' },
        stat(counts[4], 'mastered', 'var(--good)'), stat(counts[3], 'solid'), stat(islands, 'provinces conquered'),
        stat(pursuits, 'pursuits open', pursuits ? 'var(--bad)' : undefined), stat(due, 'due now', due ? 'var(--accent)' : undefined), stat(today.answered, 'answered today')),
      h('a', { class: 'btn primary big', href: na.href }, na.cta),
      h('p', { class: 'small muted' }, h('b', null, na.title), ' · ', na.desc)),
    h('div', { class: 'hq-map' }, h('a', { class: 'map-link', href: '#/campaign', 'aria-label': 'Open the map of provinces' }, worldMap(app, { compact: true }))));

  const modes = h('section', null,
    h('div', { class: 'page-head' }, h('div', null, h('h2', null, 'Orders of the day'), h('p', null, 'Different engagements, one engine: every answer feeds the same mastery model and review schedule.'))),
    h('div', { class: 'cartridges' },
      cart('#/campaign', '🗺️', 'Conquest', 'Provinces, roads, standards, sieges.', '#C9A227', `${islands}/8 conquered`),
      cart('#/drill', '⚔️', 'Field Drill', 'Adaptive mix. Misses trigger a pursuit.', '#8B1E1E', `${due} due · ${pursuits} pursuits`),
      cart('#/exam', '🛡️', 'Great Battle', 'Timed, mixed, debriefed.', '#6FA0B8', '20–80 Q'),
      cart('#/arcade/blitz', '⚡', 'Skirmish', '90 s, three lives, combos.', '#D28C3C', `best ${st.stats.blitzBest || 0}`),
      cart('#/drill/weak', '🛡️', 'Weak Flank', 'Only what is below Solid.', '#C8683A', 'reinforce'),
      cart('#/arcade/duel', '🗡️', 'Gladiator Duel', 'Tell-apart and NOT questions.', '#A98BC9', '20 s each'),
      cart('#/arcade/build', '🏗️', 'Siege Works', 'Order, sort, match the tables.', '#8FAA5A', `${Object.values(st.activities).filter(a => a.done).length}/${app.content.stats.activities}`),
      cart('#/arcade/flash', '📜', 'Scrolls', 'Recall with honest grading.', '#B08968', 'recall'),
      cart('#/learn', '🏛️', 'Archives', 'Slides and diagrams, one idea at a time.', '#B4A58A', 'study'),
    ));

  const shelf = h('section', null,
    h('div', { class: 'page-head' }, h('div', null, h('h2', null, 'The Armoury'), h('p', null, 'Every concept is a weapon on its province rack. Forge them all. Click a piece to open its scroll.')), h('a', { class: 'btn sm ghost', href: '#/progress' }, 'Senate report →')),
    shelfMap(app));

  const plan = planSection(app);
  return h('div', { class: 'stack', style: { gap: '1.6rem' } }, hero, modes, shelf, plan);
}

function headline(r, counts) {
  if (counts[4] + counts[3] + counts[2] === 0) return 'The provinces are unconquered and the armoury is empty. March on Italia.';
  if (r.score < 0.4) return 'A good start. Keep planting standards.';
  if (r.score < 0.7) return 'Momentum. The weak flanks are showing themselves.';
  if (r.score < 0.9) return 'Strong. Hunt the stragglers and give battle.';
  return 'The legions are ready. Stay sharp.';
}
function stat(v, k, color) { return h('div', { class: 'stat' }, h('div', { class: 'v', style: color ? { color } : null }, String(v)), h('div', { class: 'k' }, k)); }
function cart(href, ico, title, desc, color, meta) {
  return h('a', { class: 'cart', href, style: { '--ch': color } }, h('div', { class: 'cart-top' }, h('span', { class: 'cart-ico' }, ico), h('span', { class: 'cart-meta' }, meta)), h('h3', null, title), h('p', null, desc), h('div', { class: 'cart-ridge' }));
}
function examCountdown(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime(); if (isNaN(t)) return null;
  const d = t - Date.now();
  if (d < 0) return 'has passed';
  const hrs = Math.floor(d / 3600000);
  if (hrs < 36) return `in ${hrs} h`;
  return `in ${Math.round(hrs / 24)} days`;
}
function planSection(app) {
  const st = app.state;
  const done = PLAN.reduce((s, d, di) => s + d.items.filter((_, i) => st.plan[`${di}-${i}`]).length, 0);
  const total = PLAN.reduce((s, d) => s + d.items.length, 0);
  const days = PLAN.map((d, di) => h('div', { class: 'plan-day' },
    h('h3', null, d.day, h('span', { class: 'small muted' }, ` · ${d.items.filter((_, i) => st.plan[`${di}-${i}`]).length}/${d.items.length}`)),
    d.items.map(([t, desc], i) => {
      const key = `${di}-${i}`;
      const cb = h('input', { type: 'checkbox', checked: !!st.plan[key], onChange: e => { st.plan[key] = e.target.checked ? Date.now() : 0; app.store.save(); row.classList.toggle('done', e.target.checked); } });
      const row = h('label', { class: 'task' + (st.plan[key] ? ' done' : '') }, cb, h('div', null, h('div', { class: 't' }, t), h('div', { class: 'd' }, desc)));
      return row;
    })));
  return h('details', { class: 'plan', open: done < total && done > 0 ? true : null },
    h('summary', null, h('h2', null, 'Campaign plan'), h('span', { class: 'chip' }, `${done}/${total} done`), h('span', { class: 'small muted' }, 'Retrieval over rereading, spacing across sessions, interleaving once the basics are in, and sleep.')),
    h('div', { class: 'grid three mt' }, days));
}
