// Home: readiness, next action, the Shelf, modes, two-day plan.
import { h, ring, fmtPct, plural } from '../ui.js';
import { readiness, masteryLevel, dueCount } from '../engine.js';
import { shelfMap, nextAction } from './common.js';

const PLAN = [
  { day: 'Today', items: [
    ['Read + checkpoint Ch 1 and Ch 6', 'Campaign → each topic: read the cards (5 min), then clear the checkpoint.'],
    ['Read + checkpoint Ch 7 and Ch 8', 'Ch 8 is table-heavy (PLC, Ansoff, adoption curve). Use Build & Sort after the checkpoint.'],
    ['Break 45+ min, then Smart Drill (30 Q)', 'A gap starts a new session. Mastered requires a correct answer in a later session.'],
    ['Read + checkpoint Ch 9 and Ch 10', 'Pricing has calculations: do every calc question until BEP and markup are automatic.'],
    ['Read + checkpoint Ch 11 and Ch 12', 'Wholesaler types and the advocacy funnel are pure memorization: use the Build activities.'],
    ['Blitz × 3 before bed', 'Fast retrieval of definitions. Then sleep: memory consolidates overnight.'],
  ] },
  { day: 'Tomorrow', items: [
    ['Morning: Smart Drill until no pursuits remain', 'Interleaved across all chapters. Aim for 60+ questions.'],
    ['Midterm simulation #1 (60 Q, timed)', 'Review every miss. Then “Drill my misses”.'],
    ['Beat every chapter boss', '90% or better on each. Bosses still open are your weakest chapters.'],
    ['Afternoon: Flashcards sweep of every concept', 'Grade honestly: Again on anything you hesitated on.'],
    ['Midterm simulation #2 (80 Q)', 'Target 95%+. Anything missed twice gets a Learn-card re-read.'],
    ['Evening: Weak Spot Hunter, then stop', 'Light review only. No all-nighter: sleep beats cramming.'],
  ] },
  { day: 'Exam day', items: [
    ['20-minute Blitz warm-up', 'Wake up retrieval, do not learn new material.'],
    ['Skim the Learn cheat sheet for Ch 8 and Ch 9 tables', 'PLC table, adoption percentages, pricing buckets, BEP formula.'],
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

  const hero = h('section', { class: 'card hero' },
    ring(r.score, { size: 120, stroke: 10, color: r.score >= 0.85 ? 'var(--good)' : 'var(--accent)', label: h('div', { class: 'center' }, h('div', { class: 'big', style: { fontSize: '1.7rem' } }, fmtPct(r.score)), h('div', { class: 'tiny muted' }, 'ready')) }),
    h('div', { class: 'stack' },
      h('div', { class: 'eyebrow' }, exam ? `Midterm ${exam}` : 'Midterm trainer'),
      h('h1', null, `Hey ${st.name}. ${headline(r, counts)}`),
      h('div', { class: 'stats' },
        stat(counts[4], 'mastered', 'var(--good)'), stat(counts[3], 'solid'), stat(counts[2] + counts[1], 'in progress'), stat(counts[0], 'not started', 'var(--muted)'),
        stat(pursuits, 'pursuits open', pursuits ? 'var(--bad)' : undefined), stat(due, 'due now', due ? 'var(--accent)' : undefined), stat(today.answered, 'answered today')),
    ));

  const next = h('section', { class: 'card accent', style: { '--ch': 'var(--accent)' } },
    h('div', { class: 'row between wrap' },
      h('div', null, h('div', { class: 'eyebrow' }, 'Next best move'), h('h2', null, na.title), h('p', { class: 'muted' }, na.desc)),
      h('a', { class: 'btn primary big', href: na.href }, na.cta)));

  const modes = h('section', null,
    h('div', { class: 'page-head' }, h('h2', null, 'Game modes')),
    h('div', { class: 'grid three' },
      modeTile('#/campaign', '🗺️', 'Campaign', 'Chapter by chapter: read, clear checkpoints, beat the boss.', '#2DD4BF', ['8 worlds', 'Learn → prove']),
      modeTile('#/drill', '🎯', 'Smart Drill', 'Adaptive mix across chapters. Misses trigger a pursuit: three different questions until it sticks.', '#FF6B6B', [`${due} due`, `${pursuits} pursuits`]),
      modeTile('#/exam', '📝', 'Midterm Simulator', 'Timed, mixed, exam-weighted. No feedback until the end, then a full debrief.', '#38BDF8', ['20–80 Q', 'Timed']),
      modeTile('#/arcade/blitz', '⚡', 'Blitz', '90 seconds, three lives, combo multiplier. Fast recall of definitions.', '#FFB84D', ['Speed', 'High score']),
      modeTile('#/drill/weak', '🩹', 'Weak Spot Hunter', 'Only concepts below Solid or with an open pursuit. Learn card first, then prove it.', '#F472B6', ['Targeted']),
      modeTile('#/arcade/duel', '⚔️', 'Confusables Duel', 'Only “tell them apart” and “which is NOT” questions, 20 seconds each.', '#A78BFA', ['Discrimination']),
      modeTile('#/arcade/build', '🧩', 'Build & Sort', 'Order the steps, sort into buckets, match the pairs. The tables and processes.', '#A3E635', ['Processes', 'Tables']),
      modeTile('#/arcade/flash', '🃏', 'Flashcards', 'Term ↔ definition recall with honest self-grading that feeds the scheduler.', '#FB923C', ['Recall']),
      modeTile('#/learn', '📖', 'Learn', 'Every concept card with definition, example, confusables and exam trap. Plus cheat sheets.', '#9AA3B8', ['Reading']),
    ));

  const shelf = h('section', null,
    h('div', { class: 'page-head' }, h('div', null, h('h2', null, 'The Shelf'), h('p', null, 'Every concept in the course is a product on its chapter shelf. Fill the shelves. Click a tile to read it.')), h('a', { class: 'btn sm ghost', href: '#/progress' }, 'Full progress →')),
    shelfMap(app));

  const plan = planSection(app);

  return h('div', { class: 'stack', style: { gap: '1.4rem' } }, hero, next, modes, shelf, plan);
}

function headline(r, counts) {
  if (counts[4] + counts[3] + counts[2] === 0) return 'The shelves are empty. Let’s stock them.';
  if (r.score < 0.4) return 'Good start. Keep stocking the shelves.';
  if (r.score < 0.7) return 'Momentum. The weak spots are showing themselves.';
  if (r.score < 0.9) return 'Strong. Now hunt the stragglers and simulate.';
  return 'You are exam-ready. Stay sharp.';
}

function stat(v, k, color) { return h('div', { class: 'stat' }, h('div', { class: 'v', style: color ? { color } : null }, String(v)), h('div', { class: 'k' }, k)); }

function modeTile(href, ico, title, desc, color, chips) {
  return h('a', { class: 'mode-tile', href, style: { '--ch': color } }, h('div', { class: 'ico' }, ico), h('h3', null, title), h('p', null, desc), h('div', { class: 'meta' }, chips.map(c => h('span', { class: 'chip' }, c))));
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
  const days = PLAN.map((d, di) => h('div', { class: 'plan-day' },
    h('h3', null, d.day, h('span', { class: 'small muted' }, ` · ${d.items.filter((_, i) => st.plan[`${di}-${i}`]).length}/${d.items.length}`)),
    d.items.map(([t, desc], i) => {
      const key = `${di}-${i}`;
      const cb = h('input', { type: 'checkbox', checked: !!st.plan[key], onChange: e => { st.plan[key] = e.target.checked ? Date.now() : 0; app.store.save(); row.classList.toggle('done', e.target.checked); } });
      const row = h('label', { class: 'task' + (st.plan[key] ? ' done' : '') }, cb, h('div', null, h('div', { class: 't' }, t), h('div', { class: 'd' }, desc)));
      return row;
    })));
  return h('section', null,
    h('div', { class: 'page-head' }, h('div', null, h('h2', null, 'Two-day plan'), h('p', null, 'Built on what the evidence says works: retrieval practice over rereading, spacing across sessions, interleaving once the basics are in, and sleep.'))),
    h('div', { class: 'grid three' }, days));
}
