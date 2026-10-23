// Learn: lesson decks per chapter (free browsing), cheat sheets, and single-concept entry.
import { h } from '../ui.js';
import { masteryLevel, chapterMastery } from '../engine.js';
import { figureEl } from './concept.js';
import { createLesson } from './lesson.js';
import { ISLANDS } from '../map.js';

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
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Lessons'), h('p', null, 'Short slides, one idea at a time: definition, plain English, a diagram you can poke, what it is confused with, then a quick check. Rereading alone is weak, so every lesson tests you as you go.'))),
    h('div', { class: 'stack' }, app.content.chapters.map(ch => {
      const read = ch.concepts.filter(c => app.state.concepts[c.id]?.seen).length;
      const m = chapterMastery(app.content, app.state, ch.chapter);
      return h('div', { class: 'world', style: { '--ch': ch.color } },
        h('div', { class: 'ico' }, ch.emoji),
        h('div', null, h('div', { class: 'eyebrow' }, `${ISLANDS[ch.chapter]?.name || ''} · Chapter ${ch.chapter}`), h('h3', null, ch.title), h('p', { class: 'small muted' }, `${ch.concepts.length} concepts · ${read} read · ${m.dist[4]} mastered`),
          h('div', { class: 'dots' }, ch.concepts.map(c => h('span', { class: `mdot m${masteryLevel(app.state.concepts[c.id])}` })))),
        h('div', { class: 'row wrap' }, h('a', { class: 'btn sm ch', href: `#/learn/${ch.chapter}` }, '📖 Open lessons'), h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Cheat sheet')));
    })));
}

function deck(app, ch, startCid) {
  const cids = ch.topics.flatMap(t => t.concepts);
  const host = h('div', { class: 'learn-layout', style: { '--ch': ch.color } });
  const side = h('aside', { class: 'learn-side' },
    h('a', { class: 'back', href: '#/learn' }, '← All chapters'),
    h('div', { class: 'eyebrow mt-sm' }, `Chapter ${ch.chapter}`), h('h3', null, ch.title),
    h('div', { class: 'row wrap mt-sm mb' }, h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Cheat sheet'), h('a', { class: 'btn sm ghost', href: `#/campaign/${ch.chapter}` }, 'Island')),
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
  const lesson = createLesson(app, cids, { chapter: ch, title: `Lessons · ${ch.title}`, quickCheck: false, startAt, exitHref: '#/learn', completeLabel: '🎯 Drill this chapter', onComplete: () => app.navigate(`#/drill/chapter/${ch.chapter}`) });
  host.append(side, h('div', { class: 'learn-main' }, lesson));
  host.cleanup = () => lesson.cleanup && lesson.cleanup();
  return host;
}

import { visualFor } from '../visuals.js';
function hasVisual(app, c, ch) { try { return !!visualFor(c, ch); } catch { return false; } }

function sheet(app, ch) {
  return h('div', { style: { '--ch': ch.color } },
    h('a', { class: 'back', href: `#/learn/${ch.chapter}` }, `← Chapter ${ch.chapter} lessons`),
    h('div', { class: 'page-head mt-sm' }, h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter} · cheat sheet`), h('h1', null, ch.title), h('p', null, 'Every term with its one-line definition, plus the must-memorize tables. Skim this the morning of the exam.'))),
    h('div', { class: 'stack' }, ch.topics.map(t => h('div', { class: 'card' }, h('h3', { class: 'mb' }, t.title),
      h('div', { class: 'stack', style: { gap: '0.45rem' } }, t.concepts.map(cid => { const c = app.conceptOf(cid).concept; return h('div', { class: 'small' }, h('span', { class: `mdot m${masteryLevel(app.state.concepts[cid])}`, style: { marginRight: '6px' } }), h('b', null, c.term, ': '), c.definition, c.mnemonic ? h('span', { class: 'muted' }, ` 💡 ${c.mnemonic}`) : null); })),
      t.concepts.map(cid => figureEl(app.conceptOf(cid).concept.figure))))));
}
