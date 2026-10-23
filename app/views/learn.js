// Learn: lesson decks per chapter (free browsing), cheat sheets, and single-concept entry.
import { h } from '../ui.js';
import { masteryLevel, chapterMastery } from '../engine.js';
import { figureEl } from './concept.js';
import { createLesson } from './lesson.js';
import { ISLANDS } from '../map.js';
import { icon, CHAPTER_ICON } from '../icons.js';

export function render(app, params) {
  const [chStr, cid] = params;
  if (!chStr) return list(app);
  const ch = app.index.chapter.get(parseInt(chStr, 10));
  if (!ch) return h('div', { class: 'card' }, 'Unknown chapter. ', h('a', { href: '#/learn' }, 'Back'));
  if (cid === 'sheet') return sheet(app, ch);
  return deck(app, ch, cid);
}

function list(app) {
  return h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'The Archives'), h('p', null, 'Short scrolls, one idea at a time: definition, plain English, a diagram you can poke, what it is confused with, then a quick check. Rereading alone is weak, so every scroll tests you as you go.'))),
    h('div', { class: 'stack' }, app.content.chapters.map(ch => {
      const read = ch.concepts.filter(c => app.state.concepts[c.id]?.seen).length;
      const m = chapterMastery(app.content, app.state, ch.chapter);
      return h('div', { class: 'world', style: { '--ch': ch.color } },
        h('div', { class: 'ico' }, icon(CHAPTER_ICON[ch.chapter] || 'seal', { size: 30, tone: 'gold' })),
        h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.numeral || ch.chapter} · Provincia ${ISLANDS[ch.chapter]?.name || ''}`), h('h3', null, ch.title), h('p', { class: 'small muted' }, `${ch.concepts.length} concepts · ${read} read · ${m.dist[4]} mastered`),
          h('div', { class: 'dots' }, ch.concepts.map(c => h('span', { class: `mdot m${masteryLevel(app.state.concepts[c.id])}` })))),
        h('div', { class: 'row wrap' }, h('a', { class: 'btn sm ch', href: `#/learn/${ch.chapter}` }, icon('scroll', { size: 14, tone: 'gold' }), 'Open scrolls'), h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Tablet')));
    })));
}

function deck(app, ch, startCid) {
  const cids = ch.topics.flatMap(t => t.concepts);
  const host = h('div', { class: 'learn-layout', style: { '--ch': ch.color } });
  const side = h('aside', { class: 'learn-side' },
    h('a', { class: 'back', href: '#/learn' }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ' All provinces'),
    h('div', { class: 'eyebrow mt-sm' }, `Chapter ${ch.chapter}`), h('h3', null, ch.title),
    h('div', { class: 'row wrap mt-sm mb' }, h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Tablet'), h('a', { class: 'btn sm ghost', href: `#/campaign/${ch.chapter}` }, 'Province')),
    h('div', { class: 'learn-toc' }, ch.topics.map(t => h('div', null, h('div', { class: 'tiny muted', style: { margin: '0.6rem 0 0.2rem' } }, t.title), t.concepts.map(cid => h('a', { class: 'toc-item' + (cid === startCid ? ' on' : ''), href: `#/learn/${ch.chapter}/${cid}` }, h('span', { class: `mdot m${masteryLevel(app.state.concepts[cid])}` }), app.conceptOf(cid).concept.term))))));
  // start index: 5 slides per concept at most; compute by rebuilding lesson with startAt from concept index
  let startAt = 0;
  if (startCid) {
    const i = cids.indexOf(startCid);
    if (i > 0) {
      // slides per concept vary (visual slide optional) so count precisely
      let count = 0;
      for (let k = 0; k < i; k++) { const c = app.conceptOf(cids[k]).concept; count += 3 + (hasVisual(app, c, ch) ? 1 : 0); }
      startAt = count;
    }
  }
  const lesson = createLesson(app, cids, { chapter: ch, title: `Archives · ${ch.title}`, quickCheck: false, startAt, exitHref: '#/learn', completeLabel: 'Drill this province', onComplete: () => app.navigate(`#/drill/chapter/${ch.chapter}`) });
  host.append(side, h('div', { class: 'learn-main' }, lesson));
  host.cleanup = () => lesson.cleanup && lesson.cleanup();
  return host;
}

import { visualFor } from '../visuals.js';
function hasVisual(app, c, ch) { try { return !!visualFor(c, ch); } catch { return false; } }

function sheet(app, ch) {
  // The tablet as an unrolled scroll: one section per battle, a sticky table of contents, tables kept beside their terms.
  const sections = ch.topics.map((t, i) => ({ t, id: `sheet-${t.id}`, n: i + 1 }));
  const toc = h('nav', { class: 'sheet-toc', 'aria-label': 'Sections' },
    h('div', { class: 'eyebrow' }, 'On this tablet'),
    sections.map(sec => h('a', { class: 'toc-item', href: `#${sec.id}`, onClick: e => { e.preventDefault(); const el = page.querySelector('#' + sec.id); if (el) { el.scrollIntoView({ behavior: app.state.settings.motion === false ? 'auto' : 'smooth', block: 'start' }); } app.sound('tick'); } },
      h('span', { class: 'toc-n' }, ROMANS[sec.n] || sec.n), h('span', null, sec.t.title))),
    h('div', { class: 'row wrap mt' }, h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}` }, icon('scroll', { size: 14, tone: 'gold' }), 'Scrolls'), h('a', { class: 'btn sm ch', href: `#/drill/chapter/${ch.chapter}` }, icon('gladius', { size: 14, tone: 'gold' }), 'Drill')));
  const page = h('div', { class: 'sheet-page', style: { '--ch': ch.color } },
    h('a', { class: 'back', href: `#/learn/${ch.chapter}` }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ` Chapter ${ch.numeral || ch.chapter} scrolls`),
    h('div', { class: 'page-head mt-sm' }, h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.numeral || ch.chapter} · the tablet`), h('h1', { class: 'row' }, icon(CHAPTER_ICON[ch.chapter] || 'seal', { size: 30, tone: 'gold' }), ch.title), h('p', null, 'Every term with its one-line definition, plus the must-memorize tables. Read this the morning of the battle.'))),
    h('div', { class: 'sheet-layout' }, toc,
      h('div', { class: 'sheet-scroll' },
        h('div', { class: 'scroll-roller top', 'aria-hidden': 'true' }),
        h('div', { class: 'sheet-paper' }, sections.map(sec => {
          const t = sec.t;
          return h('section', { class: 'sheet-section', id: sec.id },
            h('div', { class: 'sheet-section-head' }, h('span', { class: 'sheet-n' }, ROMANS[sec.n] || sec.n), h('h3', null, t.title), h('span', { class: 'small muted' }, `${t.concepts.length} terms`)),
            h('dl', { class: 'sheet-terms' }, t.concepts.map(cid => {
              const c = app.conceptOf(cid).concept;
              return h('div', { class: 'sheet-term' },
                h('dt', null, h('span', { class: `mdot m${masteryLevel(app.state.concepts[cid])}` }), h('a', { href: `#/learn/${ch.chapter}/${cid}` }, c.term)),
                h('dd', null, c.definition, c.mnemonic ? h('span', { class: 'sheet-mn' }, icon('tablet', { size: 13, tone: 'bronze' }), c.mnemonic) : null));
            })),
            t.concepts.map(cid => { const fig = app.conceptOf(cid).concept.figure; const f = figureEl(fig); return f ? bronzeTablet(app, fig, f) : null; }));
        })),
        h('div', { class: 'scroll-roller bottom', 'aria-hidden': 'true' }))));
  return page;
}
const ROMANS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
/** A must-memorize table as an engraved bronze tablet with a quiz mode: hide one column, reveal cells on tap. */
function bronzeTablet(app, fig, figureNode) {
  const wrap = h('div', { class: 'sheet-figure bronze' }, figureNode);
  const table = figureNode.querySelector && figureNode.querySelector('table.fig');
  if (!table || !fig.head) return wrap;
  let hidden = -1;
  const apply = () => { table.querySelectorAll('tbody tr').forEach(tr => { [...tr.children].forEach((td, ci) => { td.classList.toggle('cell-hidden', ci === hidden && !td.classList.contains('revealed')); if (ci !== hidden) td.classList.remove('revealed'); }); }); bar.querySelectorAll('.bq-col').forEach(b => b.classList.toggle('on', Number(b.dataset.ci) === hidden)); };
  table.addEventListener('click', e => { const td = e.target.closest('td'); if (td && td.classList.contains('cell-hidden')) { td.classList.add('revealed'); td.classList.remove('cell-hidden'); app.sound('seal'); } });
  const bar = h('div', { class: 'bronze-quiz' }, h('span', { class: 'eyebrow' }, icon('eye', { size: 13, tone: 'bronze' }), 'Quiz yourself · hide'),
    fig.head.map((hd, ci) => ci === 0 ? null : h('button', { class: 'bq-col', type: 'button', dataset: { ci }, onClick: () => { hidden = hidden === ci ? -1 : ci; app.sound('tick'); apply(); } }, hd)),
    h('span', { class: 'tiny muted' }, 'tap a hidden cell to reveal it'));
  wrap.prepend(bar);
  return wrap;
}
