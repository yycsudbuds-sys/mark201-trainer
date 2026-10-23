// Campaign: the Marketing Archipelago. World map → island trail → lesson → checkpoint → boss.
import { h, plural } from '../ui.js';
import { masteryLevel, buildExam } from '../engine.js';
import { worldMap, islandTrail, chapterProgress, nextIsland, ISLANDS } from '../map.js';
import { createLesson } from './lesson.js';
import { createRunner, resultCard, missesList } from './runner.js';

export function render(app, params) {
  const [chStr, topicId, action] = params;
  if (!chStr) return world(app);
  const chNum = parseInt(chStr, 10);
  const ch = app.index.chapter.get(chNum);
  if (!ch) return h('div', { class: 'card' }, 'Unknown chapter. ', h('a', { href: '#/campaign' }, 'Back to the map'));
  if (topicId === 'boss') return boss(app, ch);
  if (!topicId) return island(app, ch);
  const t = ch.topics.find(x => x.id === topicId);
  if (!t) return h('div', { class: 'card' }, 'Unknown level. ', h('a', { href: `#/campaign/${chNum}` }, 'Back to the island'));
  if (action === 'drill') return checkpoint(app, ch, t);
  return lesson(app, ch, t);
}

function topicCleared(app, t) { return !!app.state.campaign.topics[t.id]?.cleared; }
function topicConceptsSolid(app, t) { return t.concepts.every(cid => masteryLevel(app.state.concepts[cid]) >= 3 && !app.state.concepts[cid]?.pursuit); }

function world(app) {
  const conquered = app.content.chapters.filter(ch => chapterProgress(app, ch).boss).length;
  const flags = app.content.chapters.reduce((s, ch) => s + ch.topics.filter(t => topicCleared(app, t)).length, 0);
  const totalFlags = app.content.chapters.reduce((s, ch) => s + ch.topics.length, 0);
  const next = nextIsland(app);
  const nextCh = next ? app.index.chapter.get(next) : null;
  return h('div', { class: 'world-page' },
    h('div', { class: 'page-head' },
      h('div', null, h('div', { class: 'eyebrow' }, 'Campaign'), h('h1', null, 'The Marketing Archipelago'), h('p', null, 'Eight islands, one per chapter. Land on an island, walk its trail of levels (read, then prove it), and plant a flag at each. Beat the boss to claim the island.')),
      h('div', { class: 'row wrap' }, h('span', { class: 'chip' }, `🏝️ ${conquered}/8 islands claimed`), h('span', { class: 'chip' }, `🚩 ${flags}/${totalFlags} flags planted`))),
    h('div', { class: 'map-frame' }, worldMap(app)),
    nextCh ? h('div', { class: 'quest', style: { '--ch': nextCh.color } },
      h('div', { class: 'quest-ico' }, nextCh.emoji),
      h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Your next landing'), h('h3', null, `${ISLANDS[nextCh.chapter].name} · Chapter ${nextCh.chapter}: ${nextCh.title}`), h('p', { class: 'small muted' }, nextCh.tag)),
      h('a', { class: 'btn ch big', href: `#/campaign/${nextCh.chapter}` }, 'Set sail →')) : h('div', { class: 'quest' }, h('div', { class: 'quest-ico' }, '👑'), h('div', null, h('h3', null, 'Every island is yours.'), h('p', { class: 'small muted' }, 'Keep the shelves stocked with Smart Drill and simulations.'))));
}

function island(app, ch) {
  const isl = ISLANDS[ch.chapter];
  const prog = chapterProgress(app, ch);
  const sheet = h('div', { class: 'level-sheet' });
  const page = h('div', { class: 'island-page', style: { '--ch': ch.color } },
    h('a', { class: 'back', href: '#/campaign' }, '← Back to the archipelago'),
    h('div', { class: 'page-head mt-sm' },
      h('div', null, h('div', { class: 'eyebrow' }, `${isl?.name || 'Island'} · Chapter ${ch.chapter}`), h('h1', null, `${ch.emoji} ${ch.title}`), h('p', null, `${ch.topics.length} levels on the trail, ${ch.concepts.length} concepts. ${prog.cleared}/${ch.topics.length} flags planted${prog.boss ? ', boss beaten.' : '.'}`)),
      h('div', { class: 'row wrap' }, h('a', { class: 'btn ghost', href: `#/learn/${ch.chapter}` }, '📖 Lessons'), h('a', { class: 'btn ghost', href: `#/drill/chapter/${ch.chapter}` }, '🎯 Drill island'))),
    h('div', { class: 'map-frame' }, islandTrail(app, ch, {
      onNode: (t, i) => showSheet(t, i),
      onBoss: () => app.navigate(`#/campaign/${ch.chapter}/boss`),
    })),
    sheet);
  function showSheet(t, i) {
    const cleared = topicCleared(app, t);
    sheet.innerHTML = '';
    sheet.appendChild(h('div', { class: 'sheet-card' },
      h('div', { class: 'row between wrap' },
        h('div', null, h('div', { class: 'eyebrow' }, `Level ${i + 1}${cleared ? ' · flag planted' : ''}`), h('h2', null, t.title)),
        h('div', { class: 'row wrap' }, t.concepts.map(cid => h('span', { class: `mdot m${masteryLevel(app.state.concepts[cid])}`, title: app.conceptOf(cid).concept.term })))),
      h('p', { class: 'muted' }, t.summary),
      h('div', { class: 'row wrap' }, t.concepts.map(cid => h('a', { class: 'chip', href: `#/learn/${ch.chapter}/${cid}` }, app.conceptOf(cid).concept.term))),
      h('div', { class: 'row wrap mt' },
        h('a', { class: 'btn big', href: `#/campaign/${ch.chapter}/${t.id}/read` }, '📖 Lesson'),
        h('a', { class: 'btn ch big', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, cleared ? '🔁 Re-run checkpoint' : '🎯 Checkpoint'),
        h('span', { class: 'small muted' }, 'Lesson first if the concepts are new. The checkpoint clears when every concept reaches Solid.'))));
    sheet.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  // auto-open the next level's sheet
  const nextTopic = ch.topics.find(t => !topicCleared(app, t)) || ch.topics[ch.topics.length - 1];
  showSheet(nextTopic, ch.topics.indexOf(nextTopic));
  return page;
}

function lesson(app, ch, t) {
  const host = h('div', { style: { '--ch': ch.color } });
  const deck = createLesson(app, t.concepts, {
    chapter: ch, title: `Level · ${t.title}`, exitHref: `#/campaign/${ch.chapter}`, completeLabel: '🎯 Start the checkpoint',
    onComplete: () => app.navigate(`#/campaign/${ch.chapter}/${t.id}/drill`),
  });
  host.appendChild(deck);
  host.cleanup = () => deck.cleanup && deck.cleanup();
  return host;
}

function checkpoint(app, ch, t) {
  const concepts = new Set(t.concepts);
  const limit = Math.max(12, t.concepts.length * 4);
  const host = h('div', { style: { '--ch': ch.color } });
  const runner = createRunner(app, {
    title: `Checkpoint · ${t.title}`, subtitle: `${ISLANDS[ch.chapter]?.name || 'Chapter ' + ch.chapter}. Every concept to Solid plants the flag.`, mode: 'campaign',
    concepts, limit, feedback: 'immediate', pickOpts: { interleave: false },
    stopWhen: s => s.answered >= t.concepts.length * 2 && topicConceptsSolid(app, t),
    onFinish: (sum, reason) => {
      const cleared = topicConceptsSolid(app, t);
      const rec = app.state.campaign.topics[t.id] || (app.state.campaign.topics[t.id] = {});
      let first = false;
      if (cleared && !rec.cleared) { rec.cleared = Date.now(); first = true; app.grantXp(100, 'flag planted'); app.confetti(); app.sound('clear'); }
      else if (cleared) rec.lastCleared = Date.now();
      app.store.save();
      host.innerHTML = '';
      const pending = t.concepts.filter(cid => masteryLevel(app.state.concepts[cid]) < 3 || app.state.concepts[cid]?.pursuit);
      if (cleared) host.appendChild(claimOverlay(ch, t, first));
      host.appendChild(resultCard(app, cleared ? '🚩 Flag planted' : reason === 'exit' ? 'Checkpoint ended' : 'Not yet', sum,
        h('div', { class: 'stack mt' },
          cleared ? h('p', null, `Every concept in “${t.title}” is at least Solid.${first ? ' +100 XP.' : ''} Mastered needs a later session, so these will come back in Smart Drill.`)
            : h('div', null, h('p', null, `${plural(pending.length, 'concept')} still below Solid or in pursuit:`), h('div', { class: 'row wrap', style: { justifyContent: 'center' } }, pending.map(cid => h('span', { class: 'chip warn' }, app.conceptOf(cid).concept.term)))),
          h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
            cleared ? h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}` }, 'Back to the island') : h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, 'Keep going'),
            h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${t.id}/read` }, 'Re-read the lesson'),
            nextTopicLink(app, ch, t)))));
      if (sum.log.some(l => !l.correct)) host.appendChild(h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Your misses'), missesList(app, sum.log)));
    },
  });
  host.appendChild(runner);
  host.cleanup = () => runner.cleanup && runner.cleanup();
  return host;
}

function claimOverlay(ch, t, first) {
  const el = h('div', { class: 'claim', style: { '--ch': ch.color } },
    h('div', { class: 'claim-flag' }, h('span', { class: 'claim-pole' }), h('span', { class: 'claim-cloth' })),
    h('div', { class: 'claim-text' }, h('div', { class: 'eyebrow' }, first ? 'Territory claimed' : 'Territory held'), h('h2', null, t.title), h('p', { class: 'small muted' }, `${ISLANDS[ch.chapter]?.name || ch.title}`)));
  return el;
}

function nextTopicLink(app, ch, t) {
  const i = ch.topics.indexOf(t);
  if (i < ch.topics.length - 1) { const n = ch.topics[i + 1]; return h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${n.id}/read` }, `Next level: ${n.title} →`); }
  return h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/boss` }, 'Boss fight →');
}

function boss(app, ch) {
  const n = 24;
  const questions = buildExam(app.content, app.state, { n, chapters: new Set([ch.chapter]) });
  const host = h('div', { style: { '--ch': ch.color } });
  const runner = createRunner(app, {
    title: `Boss · ${ISLANDS[ch.chapter]?.name || 'Chapter ' + ch.chapter}`, subtitle: `${ch.title}. ${n} questions, 90% to claim the island.`, mode: 'boss', questions, feedback: 'immediate', limit: n, pursuit: false, hearts: null,
    onFinish: (sum, reason) => {
      const score = sum.answered ? sum.correct / sum.answered : 0;
      const complete = sum.answered >= n;
      const rec = app.state.campaign.bosses[ch.chapter] || (app.state.campaign.bosses[ch.chapter] = {});
      if (complete) rec.best = Math.max(rec.best || 0, score);
      const won = complete && score >= 0.9;
      if (won && !rec.cleared) { rec.cleared = Date.now(); app.grantXp(300, 'island claimed'); app.confetti({ count: 220 }); app.sound('level'); }
      else if (won) { app.grantXp(100, 'boss beaten again'); app.confetti(); }
      app.store.save();
      host.innerHTML = '';
      if (won) host.appendChild(h('div', { class: 'claim crown', style: { '--ch': ch.color } }, h('div', { class: 'claim-crown' }, '👑'), h('div', { class: 'claim-text' }, h('div', { class: 'eyebrow' }, 'Island claimed'), h('h2', null, ISLANDS[ch.chapter]?.name || ch.title), h('p', { class: 'small muted' }, `${sum.correct}/${n}. Chapter ${ch.chapter} is yours.`))));
      host.appendChild(resultCard(app, won ? 'Boss beaten' : complete ? 'Boss survived' : 'Fight ended', sum,
        h('div', { class: 'stack mt' },
          won ? null : complete ? h('p', null, `You need 90% (${Math.ceil(n * 0.9)}/${n}). Drill the misses below, then come back.`) : h('p', { class: 'muted' }, 'Finish all questions to record a score.'),
          h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
            h('a', { class: 'btn primary', href: won ? '#/campaign' : `#/campaign/${ch.chapter}/boss` }, won ? 'Back to the archipelago' : 'Fight again'),
            sum.log.some(l => !l.correct) ? h('a', { class: 'btn', href: `#/drill/concepts/${[...new Set(sum.log.filter(l => !l.correct).map(l => l.cid))].join(',')}` }, '🎯 Drill my misses') : null,
            h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}` }, 'Back to the island')))));
      host.appendChild(h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Review'), missesList(app, sum.log)));
    },
  });
  host.appendChild(runner);
  host.cleanup = () => runner.cleanup && runner.cleanup();
  return host;
}
