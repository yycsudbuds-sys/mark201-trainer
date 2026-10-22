// Learn: chapter reading pages (full concept cards), cheat sheets, and single-concept view.
import { h } from '../ui.js';
import { masteryLevel, markSeen, chapterMastery } from '../engine.js';
import { conceptCard, figureEl } from './concept.js';

export function render(app, params) {
  const [chStr, cid] = params;
  if (!chStr) return list(app);
  const ch = app.index.chapter.get(parseInt(chStr, 10));
  if (!ch) return h('div', { class: 'card' }, 'Unknown chapter. ', h('a', { href: '#/learn' }, 'Back'));
  if (cid === 'sheet') return sheet(app, ch);
  if (cid) return single(app, ch, cid);
  return chapter(app, ch);
}

function list(app) {
  return h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Learn'), h('p', null, 'Read before you drill: each card gives the definition, a plain-English explanation, an example, what it is confused with, and the exam trap. Then test yourself immediately, because reading alone does not stick.'))),
    h('div', { class: 'stack' }, app.content.chapters.map(ch => {
      const read = ch.concepts.filter(c => app.state.concepts[c.id]?.seen).length;
      const m = chapterMastery(app.content, app.state, ch.chapter);
      return h('div', { class: 'world', style: { '--ch': ch.color } },
        h('div', { class: 'ico' }, ch.emoji),
        h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter} · ${ch.tag}`), h('h3', null, ch.title), h('p', { class: 'small muted' }, `${ch.concepts.length} concepts · ${read} read · ${m.dist[4]} mastered`)),
        h('div', { class: 'row wrap' }, h('a', { class: 'btn sm', href: `#/learn/${ch.chapter}` }, '📖 Read'), h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Cheat sheet')));
    })));
}

function chapter(app, ch) {
  const host = h('div', { style: { '--ch': ch.color } },
    h('a', { class: 'back', href: '#/learn' }, '← All chapters'),
    h('div', { class: 'page-head mt-sm' },
      h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter} · ${ch.tag}`), h('h1', null, `${ch.emoji} ${ch.title}`), h('p', null, `${ch.topics.length} topics, ${ch.concepts.length} concepts. Cards are marked “seen” as you scroll past them.`)),
      h('div', { class: 'row wrap' }, h('a', { class: 'btn ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Cheat sheet'), h('a', { class: 'btn ch', href: `#/campaign/${ch.chapter}` }, '🎯 Campaign'))),
    h('div', { class: 'card tight mb' }, h('div', { class: 'row wrap' }, h('span', { class: 'small muted' }, 'Jump to:'), ch.topics.map(t => h('a', { class: 'chip', href: `#t-${t.id}`, onClick: e => { e.preventDefault(); document.getElementById('t-' + t.id)?.scrollIntoView({ behavior: 'smooth' }); } }, t.title)))),
  );
  const cards = [];
  for (const t of ch.topics) {
    host.appendChild(h('section', { id: 't-' + t.id, class: 'mt' },
      h('div', { class: 'page-head' }, h('div', null, h('h2', null, t.title), h('p', null, t.summary)), h('a', { class: 'btn sm ch', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, 'Quiz me on this')),
      h('div', { class: 'stack' }, t.concepts.map(cid => { const el = conceptCard(app, cid, { showAngles: true, actions: [h('a', { class: 'btn sm', href: `#/drill/concepts/${cid}` }, '🎯 Drill this concept')] }); el.dataset.cid = cid; cards.push(el); return el; }))));
  }
  const io = new IntersectionObserver(entries => {
    let changed = false;
    for (const e of entries) if (e.isIntersecting) { if (markSeen(app.state, e.target.dataset.cid)) changed = true; io.unobserve(e.target); }
    if (changed) app.store.save();
  }, { threshold: 0.4 });
  cards.forEach(c => io.observe(c));
  host.cleanup = () => io.disconnect();
  return host;
}

function sheet(app, ch) {
  return h('div', { style: { '--ch': ch.color } },
    h('a', { class: 'back', href: `#/learn/${ch.chapter}` }, `← Chapter ${ch.chapter} cards`),
    h('div', { class: 'page-head mt-sm' }, h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter} · cheat sheet`), h('h1', null, ch.title), h('p', null, 'Every term with its one-line definition, plus the must-memorize tables. Skim this the morning of the exam.'))),
    h('div', { class: 'stack' }, ch.topics.map(t => h('div', { class: 'card' }, h('h3', { class: 'mb' }, t.title),
      h('div', { class: 'stack', style: { gap: '0.4rem' } }, t.concepts.map(cid => { const c = app.conceptOf(cid).concept; return h('div', { class: 'small' }, h('span', { class: `mdot m${masteryLevel(app.state.concepts[cid])}`, style: { marginRight: '6px' } }), h('b', null, c.term, ': '), c.definition, c.mnemonic ? h('span', { class: 'muted' }, ` 💡 ${c.mnemonic}`) : null); })),
      t.concepts.map(cid => figureEl(app.conceptOf(cid).concept.figure))))));
}

function single(app, ch, cid) {
  const entry = app.conceptOf(cid);
  if (!entry) return h('div', { class: 'card' }, 'Unknown concept.');
  markSeen(app.state, cid); app.store.save();
  const qs = ch.questions.filter(q => q.concept === cid);
  return h('div', { class: 'runner', style: { '--ch': ch.color } },
    h('a', { class: 'back', href: `#/learn/${ch.chapter}` }, `← Chapter ${ch.chapter}`),
    h('div', { class: 'mt-sm' }, conceptCard(app, cid, { showAngles: true, actions: [h('a', { class: 'btn primary', href: `#/drill/concepts/${cid}` }, `🎯 Drill this (${qs.length} questions)`), h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${entry.topic?.id}/read` }, 'Read the topic')] })),
    h('div', { class: 'card mt' }, h('h3', null, 'Also in this topic'), h('div', { class: 'row wrap mt-sm' }, (entry.topic?.concepts || []).filter(x => x !== cid).map(x => h('a', { class: 'chip', href: `#/learn/${ch.chapter}/${x}` }, h('span', { class: `mdot m${masteryLevel(app.state.concepts[x])}` }), app.conceptOf(x).concept.term)))));
}
