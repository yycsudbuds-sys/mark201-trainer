// Learn: lesson decks per chapter (free browsing), cheat sheets, and single-concept entry.
import { h } from '../ui.js';
import { masteryLevel, chapterMastery } from '../engine.js';
import { figureEl } from './concept.js';
import { createLesson } from './lesson.js';
import { icon } from '../icons.js';

export function render(app, params) {
  const [chStr, cid] = params;
  if (!chStr) return list(app);
  if (chStr === 'vault') return vault(app);
  const ch = app.index.chapter.get(parseInt(chStr, 10));
  if (!ch) return h('div', { class: 'card' }, 'Unknown chapter. ', h('a', { href: '#/learn' }, 'Back'));
  if (cid === 'sheet') return sheet(app, ch);
  return deck(app, ch, cid);
}

function list(app) {
  return h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Learn'), h('p', null, app.pack && app.pack.learn === 'cards' ? 'One short card per concept: definition, formula, a worked example, what it is confused with and the exam trap, then a quick check. The Formula Vault mirrors the exam sheet.' : 'Lessons, one idea at a time: definition, plain English, a diagram you can poke, what it is confused with, then a quick check. Rereading alone is weak, so every scroll tests you as you go.')),
      app.pack && app.pack.vault ? h('a', { class: 'btn primary', href: '#/learn/vault' }, icon('tablet', { size: 16, tone: 'mono' }), 'Formula Vault') : null),
    h('div', { class: 'stack' }, app.content.chapters.map(ch => {
      const read = ch.concepts.filter(c => app.state.concepts[c.id]?.seen).length;
      const m = chapterMastery(app.content, app.state, ch.chapter);
      return h('div', { class: 'world', style: { '--ch': ch.color } },
        h('div', { class: 'ico' }, icon(app.chapterIcon(ch.chapter), { size: 30, tone: 'gold' })),
        h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter}`), h('h3', null, ch.title), h('p', { class: 'small muted' }, `${ch.concepts.length} concepts · ${read} read · ${m.dist[4]} mastered`),
          h('div', { class: 'dots' }, ch.concepts.map(c => h('span', { class: `mdot m${masteryLevel(app.state.concepts[c.id])}` })))),
        h('div', { class: 'row wrap' }, h('a', { class: 'btn sm ch', href: `#/learn/${ch.chapter}` }, icon('scroll', { size: 14, tone: 'gold' }), 'Open the lessons'), h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Cheat sheet')));
    })));
}

function deck(app, ch, startCid) {
  const cids = ch.topics.flatMap(t => t.concepts);
  const host = h('div', { class: 'learn-layout', style: { '--ch': ch.color } });
  const side = h('aside', { class: 'learn-side' },
    h('a', { class: 'back', href: '#/learn' }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ' All chapters'),
    h('div', { class: 'eyebrow mt-sm' }, `Chapter ${ch.chapter}`), h('h3', null, ch.title),
    h('div', { class: 'row wrap mt-sm mb' }, h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Cheat sheet'), h('a', { class: 'btn sm ghost', href: `#/campaign/${ch.chapter}` }, 'Campaign')),
    h('div', { class: 'learn-toc' }, ch.topics.map(t => h('div', null, h('div', { class: 'tiny muted', style: { margin: '0.6rem 0 0.2rem' } }, t.title), t.concepts.map(cid => h('a', { class: 'toc-item' + (cid === startCid ? ' on' : ''), href: `#/learn/${ch.chapter}/${cid}` }, h('span', { class: `mdot m${masteryLevel(app.state.concepts[cid])}` }), app.conceptOf(cid).concept.term))))));
  // start index: 5 slides per concept at most; compute by rebuilding lesson with startAt from concept index
  let startAt = 0;
  const per = app.pack && app.pack.learn === 'cards' ? 1 : 5; // slides per concept when quick checks are off
  if (startCid) {
    const i = cids.indexOf(startCid);
    if (i > 0) startAt = i * per;
  }
  const lesson = createLesson(app, cids, { chapter: ch, title: `Lesson · ${ch.title}`, quickCheck: false, startAt, exitHref: '#/learn', completeLabel: 'Drill this chapter', onComplete: () => app.navigate(`#/drill/chapter/${ch.chapter}`) });
  host.append(side, h('div', { class: 'learn-main' }, lesson));
  host.cleanup = () => lesson.cleanup && lesson.cleanup();
  return host;
}


function sheet(app, ch) {
  // The tablet as an unrolled scroll: one section per battle, a sticky table of contents, tables kept beside their terms.
  const sections = ch.topics.map((t, i) => ({ t, id: `sheet-${t.id}`, n: i + 1 }));
  const toc = h('nav', { class: 'sheet-toc', 'aria-label': 'Sections' },
    h('div', { class: 'eyebrow' }, 'On this tablet'),
    sections.map(sec => h('a', { class: 'toc-item', href: `#${sec.id}`, onClick: e => { e.preventDefault(); const el = page.querySelector('#' + sec.id); if (el) { el.scrollIntoView({ behavior: app.state.settings.motion === false ? 'auto' : 'smooth', block: 'start' }); } app.sound('tick'); } },
      h('span', { class: 'toc-n' }, ROMANS[sec.n] || sec.n), h('span', null, sec.t.title))),
    h('div', { class: 'row wrap mt' }, h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}` }, icon('scroll', { size: 14, tone: 'gold' }), 'Lessons'), h('a', { class: 'btn sm ch', href: `#/drill/chapter/${ch.chapter}` }, icon('gladius', { size: 14, tone: 'gold' }), 'Drill')));
  const page = h('div', { class: 'sheet-page', style: { '--ch': ch.color } },
    h('a', { class: 'back', href: `#/learn/${ch.chapter}` }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ` Chapter ${ch.numeral || ch.chapter} scrolls`),
    h('div', { class: 'page-head mt-sm' }, h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.numeral || ch.chapter} · cheat sheet`), h('h1', { class: 'row' }, icon(app.chapterIcon(ch.chapter), { size: 30, tone: 'gold' }), ch.title), h('p', null, 'Every term with its one-line definition, plus the must-memorize tables. Read this the morning of the exam.'))),
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
const ROMANS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];

/** The Formula Vault: every formula of the course, grouped by chapter, marked Given (on the exam sheet) or Memorise,
 *  with when-to-use and the trap, and a quick drill of the concepts behind it. */
function vault(app) {
  const chapters = app.content.chapters.filter(ch => (ch.formulas || []).length);
  let filter = 'all';
  const list = h('div', { class: 'stack vault-list' });
  const draw = () => {
    list.innerHTML = '';
    for (const ch of chapters) {
      const rows = (ch.formulas || []).filter(f => filter === 'all' || (filter === 'given' ? f.given : !f.given));
      if (!rows.length) continue;
      list.appendChild(h('div', { class: 'card stack', style: { '--ch': ch.color } },
        h('div', { class: 'row between wrap' }, h('div', { class: 'row' }, icon(app.chapterIcon(ch.chapter), { size: 22, tone: 'gold' }), h('h3', null, `Chapter ${ch.chapter} · ${ch.short || ch.title}`)), h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}` }, 'Cards')),
        h('div', { class: 'vault-rows' }, rows.map(f => {
          const mastered = f.concepts.length ? f.concepts.filter(cid => masteryLevel(app.state.concepts[cid]) >= 3).length : 0;
          return h('div', { class: 'vault-row' },
            h('div', { class: 'vault-main' }, h('div', { class: 'row wrap' }, h('b', null, f.name), h('span', { class: 'chip ' + (f.given ? 'good' : 'warn') }, f.given ? 'Given on the sheet' : 'Memorise')), h('div', { class: 'formula-text' }, f.formula), h('div', { class: 'small muted' }, h('b', null, 'Use when: '), f.when), h('div', { class: 'small muted' }, h('b', null, 'Trap: '), f.trap)),
            h('div', { class: 'vault-side' }, f.concepts.length ? h('div', { class: 'tiny muted' }, `${mastered}/${f.concepts.length} concepts solid`) : null, f.concepts.length ? h('a', { class: 'btn sm', href: `#/drill/concepts/${f.concepts.join(',')}` }, icon('gladius', { size: 13, tone: 'gold' }), ' Quick drill') : null));
        }))));
    }
    if (!list.children.length) list.appendChild(h('div', { class: 'empty' }, 'No formulas in this view yet.'));
  };
  const seg = h('div', { class: 'seg' }, [['all', 'All'], ['given', 'Given on the sheet'], ['memo', 'Must memorise']].map(([k, label]) => h('button', { class: k === filter ? 'on' : '', type: 'button', onClick: e => { filter = k; seg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); draw(); } }, label)));
  draw();
  const total = chapters.reduce((s, ch) => s + ch.formulas.length, 0); const given = chapters.reduce((s, ch) => s + ch.formulas.filter(f => f.given).length, 0);
  return h('div', { class: 'stack vault', style: { gap: '1.2rem' } },
    h('a', { class: 'back', href: '#/learn' }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ' Learn'),
    h('div', { class: 'page-head' }, h('div', null, h('div', { class: 'eyebrow' }, 'Formula Vault'), h('h1', null, 'Every formula, sorted by whether you get it on the sheet'), h('p', null, `${given} of ${total} formulas are printed on the exam sheet; the rest you carry in. Each one links to a quick drill of the concepts that use it.`)), seg),
    list);
}
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
