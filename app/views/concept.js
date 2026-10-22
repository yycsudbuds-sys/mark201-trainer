// Concept card component (the "reading" unit) and small mastery widgets.
import { h } from '../ui.js';
import { masteryLevel, MASTERY_LABELS, masteryGaps, conceptSummary, ANGLE_LABELS } from '../engine.js';

export function masteryChip(app, cid) {
  const cs = app.state.concepts[cid];
  const lvl = masteryLevel(cs);
  const cls = lvl >= 3 ? 'good' : lvl === 2 ? 'warn' : '';
  return h('span', { class: `chip ${cls}`, title: masteryGaps(cs).join(' · ') || 'Mastered' }, h('span', { class: `mdot m${lvl}` }), MASTERY_LABELS[lvl]);
}

export function figureEl(fig) {
  if (!fig) return null;
  if (fig.type === 'table') {
    return h('div', null, fig.title ? h('div', { class: 'eyebrow mt-sm' }, fig.title) : null,
      h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'fig' },
        h('thead', null, h('tr', null, fig.head.map(x => h('th', null, x)))),
        h('tbody', null, fig.rows.map(r => h('tr', null, r.map(x => h('td', null, x))))))));
  }
  if (fig.type === 'list') {
    return h('div', null, fig.title ? h('div', { class: 'eyebrow mt-sm' }, fig.title) : null, h('ul', { class: 'fig' }, fig.items.map(x => h('li', null, x))));
  }
  return null;
}

/**
 * Full concept card.
 * opts: { compact: bool, showMastery: bool, actions: [el] }
 */
export function conceptCard(app, cid, opts = {}) {
  const entry = app.conceptOf(cid);
  if (!entry) return h('div', { class: 'card' }, 'Unknown concept');
  const { concept: c, chapter: ch } = entry;
  const cs = app.state.concepts[cid];
  const el = h('article', { class: 'concept', style: { '--ch': ch.color } },
    opts.showMastery !== false ? h('div', { class: 'mstate' }, masteryChip(app, cid)) : null,
    h('div', { class: 'eyebrow' }, `Ch ${ch.chapter} · ${ch.short}`),
    h('h3', null, c.term),
    h('p', { class: 'def' }, c.definition),
    opts.compact ? null : h('div', { class: 'sec' }, h('b', null, 'In plain English'), c.explain),
    h('div', { class: 'sec' }, h('b', null, 'Example'), c.example),
    h('div', { class: 'sec contrast' }, h('b', null, "Don't confuse it with"), c.contrast),
    h('div', { class: 'sec trap' }, h('b', null, 'Exam trap'), c.trap),
    c.mnemonic ? h('div', { class: 'sec mnemonic' }, '💡 ', c.mnemonic) : null,
    opts.compact ? null : figureEl(c.figure),
    opts.showAngles && cs ? anglesStrip(cs) : null,
    opts.actions ? h('div', { class: 'row wrap mt' }, opts.actions) : null,
  );
  return el;
}

export function anglesStrip(cs) {
  const s = conceptSummary(cs);
  const angles = Object.keys(ANGLE_LABELS);
  const lvl = masteryLevel(cs);
  const gaps = masteryGaps(cs);
  return h('div', { class: 'stack mt-sm', style: { gap: '0.25rem' } },
    h('div', { class: 'row wrap' },
      h('span', { class: 'tiny muted' }, s.total ? `Angles cleared (${s.correct}/${s.total} correct):` : 'Not tested yet.'),
      angles.map(a => s.anglesAny.has(a) ? h('span', { class: 'chip good', style: { fontSize: '0.68rem' } }, ANGLE_LABELS[a]) : null)),
    lvl < 4 && s.total ? h('div', { class: 'tiny muted' }, 'To master: ', gaps.join(' · ')) : null);
}

export function chapterStyle(ch) { return { '--ch': ch.color }; }
