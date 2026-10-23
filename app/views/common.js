// Shared view pieces: chapter picker, the Shelf mastery map, next-action logic.
import { h } from '../ui.js';
import { icon, CHAPTER_ICON } from '../icons.js';
import { masteryLevel, chapterMastery, dueCount, readiness } from '../engine.js';

export function chapterPicker(app, selected, onChange) {
  const el = h('div', { class: 'chapter-picker', role: 'group', 'aria-label': 'Chapters' });
  const render = () => {
    el.innerHTML = '';
    const all = selected.size === app.content.chapters.length;
    el.appendChild(h('button', { class: all ? 'on' : '', style: { '--ch': 'var(--accent)' }, onClick: () => { if (all) selected.clear(); else app.content.chapters.forEach(c => selected.add(c.chapter)); render(); onChange && onChange(selected); } }, all ? 'All chapters' : 'Select all'));
    for (const ch of app.content.chapters) {
      el.appendChild(h('button', { class: selected.has(ch.chapter) ? 'on' : '', style: { '--ch': ch.color }, onClick: () => { if (selected.has(ch.chapter)) selected.delete(ch.chapter); else selected.add(ch.chapter); render(); onChange && onChange(selected); } }, icon(CHAPTER_ICON[ch.chapter] || 'seal', { size: 22, tone: 'gold' }), ` Ch ${ch.chapter}`));
    }
  };
  render();
  return el;
}

let tipEl = null;
function showTip(target, html) {
  if (!tipEl) { tipEl = h('div', { class: 'tip' }); document.body.appendChild(tipEl); }
  tipEl.innerHTML = html; tipEl.style.display = 'block';
  const r = target.getBoundingClientRect();
  const w = tipEl.offsetWidth;
  let x = r.left + r.width / 2 - w / 2; x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
  tipEl.style.left = x + 'px'; tipEl.style.top = (r.top - tipEl.offsetHeight - 8) + 'px';
}
function hideTip() { if (tipEl) tipEl.style.display = 'none'; }

/** The Shelf: every concept as a product tile on its chapter's shelf. */
export function shelfMap(app, { chapters = null, onTile = null, legend = true } = {}) {
  const now = Date.now();
  const wrap = h('div', { class: 'shelf-wrap' });
  for (const ch of app.content.chapters) {
    if (chapters && !chapters.has(ch.chapter)) continue;
    const m = chapterMastery(app.content, app.state, ch.chapter);
    const items = h('div', { class: 'shelf-items' });
    for (const c of ch.concepts) {
      const cs = app.state.concepts[c.id];
      const lvl = masteryLevel(cs);
      const cls = ['tile', `m${lvl}`, cs && cs.pursuit ? 'pursuit' : '', cs && cs.a?.length && cs.due <= now && lvl < 4 ? 'due' : ''].join(' ');
      const t = h('button', { class: cls, 'aria-label': `${c.term}: ${['new', 'seen', 'learning', 'solid', 'mastered'][lvl]}`,
        onClick: () => onTile ? onTile(c, ch) : app.navigate(`#/learn/${ch.chapter}/${c.id}`),
        onMouseenter: e => showTip(e.currentTarget, `<b>${c.term}</b>${['Not started', 'Seen', 'Learning', 'Solid', 'Mastered'][lvl]}${cs && cs.pursuit ? ' · <span class="ico-inline">' + icon('target', { size: 12, tone: 'mono' }).outerHTML + '</span> pursuit open' : ''}${cs && cs.a?.length ? ` · ${cs.a.filter(a => a[3]).length}/${cs.a.length} correct` : ''}`),
        onMouseleave: hideTip, onBlur: hideTip });
      items.appendChild(t);
    }
    wrap.appendChild(h('div', { class: 'shelf', style: { '--ch': ch.color } },
      h('div', { class: 'shelf-head' },
        h('a', { class: 'shelf-title', href: `#/campaign/${ch.chapter}`, style: { color: 'inherit', textDecoration: 'none' } }, h('span', { class: 'num' }, `CH ${String(ch.chapter).padStart(2, '0')}`), icon(CHAPTER_ICON[ch.chapter] || 'seal', { size: 22, tone: 'gold' }), ` ${ch.title}`),
        h('span', { class: 'small muted mono' }, icon('laurel', { size: 14, tone: 'gold' }), `${m.dist[4]} `, icon('check', { size: 14, tone: 'mono' }), `${m.dist[3]} · ${Math.round(m.score * 100)}%`)),
      items, h('div', { class: 'shelf-board' })));
  }
  if (legend) {
    wrap.appendChild(h('div', { class: 'shelf-legend' },
      h('span', { class: 'row' }, h('span', { class: 'tile m0', style: { '--ch': 'var(--muted)' } }), 'Unforged'),
      h('span', { class: 'row' }, h('span', { class: 'tile m2', style: { '--ch': 'var(--accent)' } }), 'Learning'),
      h('span', { class: 'row' }, h('span', { class: 'tile m3', style: { '--ch': 'var(--accent)' } }), 'Solid'),
      h('span', { class: 'row' }, h('span', { class: 'tile m4', style: { '--ch': 'var(--accent)' } }), 'Mastered'),
      h('span', { class: 'row' }, h('span', { class: 'tile m2 pursuit', style: { '--ch': 'var(--accent)' } }), 'Pursuit open'),
      h('span', { class: 'row' }, h('span', { class: 'tile m3 due', style: { '--ch': 'var(--accent)' } }), 'Due for review'),
    ));
  }
  return wrap;
}

/** Decide what the learner should do next. */
export function nextAction(app) {
  const st = app.state; const now = Date.now();
  let pursuits = 0; let started = 0; let total = 0;
  for (const ch of app.content.chapters) for (const c of ch.concepts) { total++; const cs = st.concepts[c.id]; if (cs && cs.a?.length) started++; if (cs && cs.pursuit) pursuits++; }
  const due = dueCount(app.content, st, now);
  const r = readiness(app.content, st);
  // find first chapter whose campaign is incomplete
  const unfinished = app.content.chapters.find(ch => !st.campaign.bosses?.[ch.chapter]?.cleared);
  if (started === 0) return { title: 'Start with Chapter 1', desc: 'Read the Chapter 1 lessons, then pass its checkpoint quizzes. Reading first, then immediate retrieval, is the fastest way in.', href: '#/campaign/1', cta: 'Start the campaign' };
  if (pursuits >= 4) return { title: `${pursuits} pursuits are open`, desc: 'Concepts you missed recently. Smart Drill asks about them from new angles until they hold.', href: '#/drill', cta: 'Smart Drill' };
  if (due >= 8) return { title: `${due} concepts are due for review`, desc: 'Spaced review is where memory becomes durable. A 20-question drill clears most of these.', href: '#/drill', cta: 'Review now' };
  if (unfinished && r.score < 0.75) return { title: `Continue Chapter ${unfinished.chapter}`, desc: `${unfinished.title}: pass its checkpoints and clear the chapter boss.`, href: `#/campaign/${unfinished.chapter}`, cta: 'Continue the conquest' };
  const exams = st.exams || [];
  if (!exams.length || (Date.now() - exams[exams.length - 1].t) > 3 * 3600000) return { title: 'Run a midterm simulation', desc: 'Timed, mixed, no feedback until the end. Your misses feed straight back into Smart Drill.', href: '#/exam', cta: 'Midterm Simulation' };
  return { title: 'Hunt the weak spots', desc: 'Everything below Solid, plus anything you have missed. Then rest: a later session is required for Mastered.', href: '#/drill/weak', cta: 'Weak Spot Hunter' };
}
