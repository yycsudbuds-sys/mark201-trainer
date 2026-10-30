// Campaign: the Marketing Archipelago. World map → island trail → lesson → checkpoint → boss.
import { h, plural } from '../ui.js';
import { masteryLevel, buildExam } from '../engine.js';
import { worldMap, islandTrail, chapterProgress, nextIsland, provinceState, zoomToProvince } from '../map.js';
import { icon } from '../icons.js';
import { getCosmetic, addDenarii } from '../cosmetic.js';
import { warBriefing, triumph } from '../cutscene.js';
import { createLesson } from './lesson.js';
import { createRunner, resultCard, missesList } from './runner.js';

export function render(app, params) {
  const [chStr, topicId, action] = params;
  if (!chStr) return world(app);
  const chNum = parseInt(chStr, 10);
  const ch = app.index.chapter.get(chNum);
  if (!ch) return h('div', { class: 'card' }, 'Unknown chapter. ', h('a', { href: '#/campaign' }, 'Back to the map'));
  if (topicId === 'boss') return boss(app, ch, action === 'retry');
  if (!topicId) return island(app, ch);
  const t = ch.topics.find(x => x.id === topicId || x.id === `${app.course}-${topicId}`);
  if (!t) return h('div', { class: 'card' }, 'Unknown level. ', h('a', { href: `#/campaign/${chNum}` }, 'Back to the island'));
  if (action === 'drill') return checkpoint(app, ch, t);
  return lesson(app, ch, t);
}

// ---- the war table is one scene shared by #/campaign and #/campaign/N so the camera moves between them ----
let tableP = null; let tableFailed = false;
function wantsTable(app) { if (tableFailed) return false; try { return getCosmetic().warTable3d !== false && app.state.settings.motion !== false && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !(navigator.deviceMemory && navigator.deviceMemory < 2) && !(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2); } catch { return false; } }
function getTable(app, initialProvince) {
  if (!tableP) tableP = import('../wartable.js').then(m => { if (!m.webglOk()) throw new Error('no webgl'); return m.createWarTable(app, { initialProvince, onProvince: (ch, state) => { if (state === 'locked') { lockedPrompt(app, ch); return; } app.sound('horn'); app.navigate(`#/campaign/${ch.chapter}`); }, onFort: (t, i) => { app.sound('knock'); tableHooks.onFort && tableHooks.onFort(t, i); }, onBoss: () => { tableHooks.onBoss && tableHooks.onBoss(); } }); }).catch(err => { console.warn('war table unavailable, using the 2.5D map', err); tableFailed = true; tableP = null; throw err; });
  return tableP;
}
const tableHooks = { onFort: null, onBoss: null };
function releaseTable(host) { host.dead = true; const next = location.hash; if (/^#\/campaign(\/\d+)?$/.test(next)) return; if (tableP) tableP.then(t => t.unmount()).catch(() => {}); }

function topicCleared(app, t) { return !!app.state.campaign.topics[t.id]?.cleared; }
function topicConceptsSolid(app, t) { return t.concepts.every(cid => masteryLevel(app.state.concepts[cid]) >= 3 && !app.state.concepts[cid]?.pursuit); }

function world(app) {
  const conquered = app.content.chapters.filter(ch => chapterProgress(app, ch).boss).length;
  const flags = app.content.chapters.reduce((s, ch) => s + ch.topics.filter(t => topicCleared(app, t)).length, 0);
  const totalFlags = app.content.chapters.reduce((s, ch) => s + ch.topics.length, 0);
  const next = nextIsland(app);
  const nextCh = next ? app.index.chapter.get(next) : null;
  const use3d = wantsTable(app);
  const mapFrame = h('div', { class: 'map-frame' + (use3d ? ' map-3d loading' : '') });
  const motion = app.state.settings.motion !== false && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fallback = () => { if (mapFrame.dead) return; mapFrame.classList.remove('map-3d', 'loading'); mapFrame.appendChild(worldMap(app, { onIsland: (ch, state) => {
    if (state === 'locked') { lockedPrompt(app, ch); return; }
    app.sound('horn');
    zoomToProvince(mapFrame, ch.chapter, { motion }).then(() => app.navigate(`#/campaign/${ch.chapter}`));
  } })); };
  if (use3d) getTable(app).then(t => { if (mapFrame.dead) return; t.mount(mapFrame); mapFrame.classList.remove('loading'); t.showOverview({ instant: t.mode === 'overview' }); }).catch(fallback);
  else fallback();
  const page = h('div', { class: 'world-page' },
    h('div', { class: 'page-head' },
      h('div', null, h('div', { class: 'eyebrow' }, 'Campaign · Conquest map'), h('h1', null, 'Campaign'), h('p', null, `${app.pack.copy.chapters} Open a chapter, work through its topics (read the lesson, then pass the checkpoint quiz) and plant a standard for each. Clear the chapter boss (${app.pack.boss.n} questions, ${Math.round(app.pack.boss.pass * 100)}%) to conquer it.`)),
      h('div', { class: 'row wrap' }, h('span', { class: 'chip' }, icon('aquila', { size: 14, tone: 'gold' }), `${conquered}/${app.content.chapters.length} chapters cleared`), h('span', { class: 'chip' }, icon('standard', { size: 14, tone: 'crimson' }), `${flags}/${totalFlags} standards planted`))),
    mapFrame,
    nextCh ? h('div', { class: 'quest', style: { '--ch': nextCh.color } },
      h('div', { class: 'quest-ico' }, icon(app.chapterIcon(nextCh.chapter), { size: 34, tone: 'gold' })),
      h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Next objective'), h('h3', null, `Chapter ${nextCh.chapter} · ${nextCh.title}`), h('p', { class: 'small muted' }, nextCh.tag)),
      h('a', { class: 'btn ch big', href: `#/campaign/${nextCh.chapter}` }, `Open Chapter ${nextCh.chapter} `, icon('arrow', { size: 14, tone: 'mono' }))) : h('div', { class: 'quest' }, h('div', { class: 'quest-ico' }, icon('aquila', { size: 34, tone: 'gold' })), h('div', null, h('h3', null, 'Every chapter is cleared, Imperator.'), h('p', { class: 'small muted' }, 'Keep sharp with Smart Drill and midterm simulations.'))));
  page.cleanup = () => releaseTable(mapFrame);
  return page;
}

function island(app, ch) {
  const prog = chapterProgress(app, ch);
  const sheet = h('div', { class: 'level-sheet' });
  const use3d = wantsTable(app);
  const mapFrame = h('div', { class: 'map-frame' + (use3d ? ' map-3d loading' : '') });
  const RS = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  const allCleared = ch.topics.every(t => topicCleared(app, t));
  const nextIdx = ch.topics.findIndex(t => !topicCleared(app, t));
  const strip = h('div', { class: 'road-strip', role: 'list', 'aria-label': 'The topics of this chapter, in order' },
    ch.topics.map((t, i) => { const cleared = topicCleared(app, t); return h('button', { class: 'rs-node' + (cleared ? ' done' : '') + (i === nextIdx ? ' next' : ''), type: 'button', role: 'listitem', title: t.title, onClick: () => { app.sound('knock'); sheet.dataset.user = '1'; showSheet(t, i); } },
      h('span', { class: 'rs-top' }, h('span', { class: 'rs-num' }, RS[i + 1]), icon(cleared ? 'standard' : 'gate', { size: 15, tone: cleared ? 'crimson' : 'bronze' })), h('span', { class: 'rs-title' }, t.title), h('span', { class: 'rs-state' }, cleared ? 'Standard planted' : i === nextIdx ? 'Up next' : 'Ahead')); }),
    h('button', { class: 'rs-node siege' + (prog.boss ? ' done' : allCleared ? ' next' : ' locked'), type: 'button', role: 'listitem', onClick: () => onBoss() },
      h('span', { class: 'rs-top' }, icon('siegetower', { size: 16, tone: 'gold' })), h('span', { class: 'rs-title' }, 'Chapter boss'), h('span', { class: 'rs-state' }, prog.boss ? 'City taken' : allCleared ? `Lay siege · ${Math.round(app.pack.boss.pass * 100)}% takes the city` : 'Pass every checkpoint first')));
  const page = h('div', { class: 'island-page', style: { '--ch': ch.color } },
    h('a', { class: 'back', href: '#/campaign' }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ' Back to the campaign map'),
    h('div', { class: 'page-head mt-sm' },
      h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter} · campaign`), h('h1', { class: 'row' }, icon(app.chapterIcon(ch.chapter), { size: 30, tone: 'gold' }), ch.title), h('p', null, `${ch.topics.length} topics, ${ch.concepts.length} concepts. ${prog.cleared}/${ch.topics.length} checkpoints passed${prog.boss ? ', chapter boss cleared.' : '.'}`)),
      h('div', { class: 'row wrap' }, h('a', { class: 'btn ghost', href: `#/learn/${ch.chapter}` }, icon('scroll', { size: 16, tone: 'gold' }), 'Lessons'), h('a', { class: 'btn ghost', href: `#/drill/chapter/${ch.chapter}` }, icon('gladius', { size: 16, tone: 'gold' }), 'Drill this chapter'))),
    strip, mapFrame, sheet);
  function showSheet(t, i) {
    const cleared = topicCleared(app, t);
    sheet.innerHTML = '';
    sheet.appendChild(h('div', { class: 'sheet-card' },
      h('div', { class: 'row between wrap' },
        h('div', null, h('div', { class: 'eyebrow' }, `Topic ${i + 1}${cleared ? ' · checkpoint passed' : ''}`), h('h2', null, t.title)),
        h('div', { class: 'row wrap' }, t.concepts.map(cid => h('span', { class: `mdot m${masteryLevel(app.state.concepts[cid])}`, title: app.conceptOf(cid).concept.term })))),
      h('p', { class: 'muted' }, t.summary),
      h('div', { class: 'row wrap' }, t.concepts.map(cid => h('a', { class: 'chip', href: `#/learn/${ch.chapter}/${cid}` }, app.conceptOf(cid).concept.term))),
      h('div', { class: 'row wrap mt' },
        h('a', { class: 'btn big', href: `#/campaign/${ch.chapter}/${t.id}/read` }, icon('scroll', { size: 18, tone: 'gold' }), 'Read the lesson'),
        h('a', { class: 'btn ch big', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, icon('swords', { size: 18, tone: 'gold' }), cleared ? 'Quiz again' : 'Checkpoint quiz'),
        h('span', { class: 'small muted' }, 'Lesson first if the topic is new. The checkpoint is passed when every concept reaches Solid.'))));
    if (sheet.dataset.user) sheet.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  const onNode = (t, i) => { sheet.dataset.user = '1'; showSheet(t, i); };
  const onBoss = () => { const all = ch.topics.every(t => topicCleared(app, t)); if (all) app.navigate(`#/campaign/${ch.chapter}/boss`); else app.toast('Pass every checkpoint quiz in this chapter before the chapter boss', 'info'); };
  const fallback = () => { if (mapFrame.dead) return; mapFrame.classList.remove('map-3d', 'loading'); mapFrame.appendChild(islandTrail(app, ch, { onNode: (t, i) => { app.sound('knock'); onNode(t, i); }, onBoss })); };
  if (use3d) { tableHooks.onFort = onNode; tableHooks.onBoss = onBoss; getTable(app, ch.chapter).then(t => { if (mapFrame.dead) return; const fresh = t.mode === 'overview' && !t.el.isConnected; t.mount(mapFrame); mapFrame.classList.remove('loading'); t.showProvince(ch.chapter, { instant: fresh }); }).catch(fallback); }
  else fallback();
  const nextTopic = ch.topics.find(t => !topicCleared(app, t)) || ch.topics[ch.topics.length - 1];
  showSheet(nextTopic, ch.topics.indexOf(nextTopic));
  page.cleanup = () => releaseTable(mapFrame);
  return page;
}

function lesson(app, ch, t) {
  const host = h('div', { style: { '--ch': ch.color } });
  let deck = null;
  warBriefing(app, { kind: 'lesson', chapter: ch, topic: t, objectives: t.concepts.slice(0, 5).map(cid => app.conceptOf(cid).concept.term), cta: 'Open the scrolls' }).then(() => {
    if (host.dead) return;
    deck = createLesson(app, t.concepts, {
      chapter: ch, title: `Lesson · ${t.title}`, exitHref: `#/campaign/${ch.chapter}`, completeLabel: 'Checkpoint quiz',
      onComplete: () => app.navigate(`#/campaign/${ch.chapter}/${t.id}/drill`),
    });
    host.appendChild(deck);
  });
  host.cleanup = () => { host.dead = true; deck && deck.cleanup && deck.cleanup(); };
  return host;
}

function lockedPrompt(app, ch) {
  const order = app.pack.order;
  const idx = order.indexOf(ch.chapter);
  const prev = app.index.chapter.get(order[idx - 1]);
  if (!prev) { app.navigate(`#/campaign/${ch.chapter}`); return; }
  import('../ui.js').then(({ modal }) => modal({
    title: `Chapter ${ch.chapter} is locked`,
    body: h('div', { class: 'stack' }, h('p', null, `Chapter ${ch.chapter} opens once you pass a checkpoint in Chapter ${prev.chapter} (${prev.title}).`), h('p', { class: 'small muted' }, 'A forced march skips ahead. Allowed, but the chapters build on each other.')),
    actions: [{ label: 'Return', kind: 'ghost' }, { label: `Go to Chapter ${prev.chapter}`, onClick: () => app.navigate(`#/campaign/${prev.chapter}`) }, { label: 'Forced march', kind: 'primary', onClick: () => { app.state.campaign.unlocked = app.state.campaign.unlocked || {}; app.state.campaign.unlocked[ch.chapter] = Date.now(); app.store.save(); app.navigate(`#/campaign/${ch.chapter}`); } }],
  }));
}

function checkpoint(app, ch, t) {
  const concepts = new Set(t.concepts);
  const limit = Math.max(12, t.concepts.length * 4);
  const host = h('div', { style: { '--ch': ch.color } });
  let runner = null;
  warBriefing(app, { kind: 'checkpoint', chapter: ch, topic: t, objectives: t.concepts.slice(0, 5).map(cid => app.conceptOf(cid).concept.term), cta: 'Take command' }).then(() => { if (host.dead) return; runner = buildCheckpoint(); host.appendChild(runner); });
  host.cleanup = () => { host.dead = true; runner && runner.cleanup && runner.cleanup(); };
  return host;
  function buildCheckpoint() { return createRunner(app, {
    title: `Checkpoint · ${t.title}`, subtitle: `Chapter ${ch.chapter}. Every concept to Solid passes the checkpoint and plants the standard.`, mode: 'campaign',
    concepts, limit, feedback: 'immediate', pickOpts: { interleave: false }, province: app.chapterScene(ch.chapter),
    stopWhen: s => s.answered >= t.concepts.length * 2 && topicConceptsSolid(app, t),
    onFinish: (sum, reason) => {
      const cleared = topicConceptsSolid(app, t);
      const rec = app.state.campaign.topics[t.id] || (app.state.campaign.topics[t.id] = {});
      let first = false;
      if (cleared && !rec.cleared) { rec.cleared = Date.now(); first = true; app.grantXp(100, 'standard planted'); addDenarii(20, 'standard'); app.confetti({ colors: ['#8B1E1E', '#C9A227', '#E3C76A', '#EADBC0'] }); app.sound('horn'); }
      else if (cleared) rec.lastCleared = Date.now();
      app.store.save();
      host.innerHTML = '';
      const pending = t.concepts.filter(cid => masteryLevel(app.state.concepts[cid]) < 3 || app.state.concepts[cid]?.pursuit);
      if (cleared) host.appendChild(claimOverlay(ch, t, first));
      host.appendChild(resultCard(app, cleared ? 'Checkpoint passed · standard planted' : reason === 'exit' ? 'Checkpoint stopped' : 'Checkpoint not yet passed', sum,
        h('div', { class: 'stack mt' },
          cleared ? h('p', null, `Every concept in “${t.title}” is at least Solid.${first ? ' +100 XP.' : ''} Mastered needs a later session, so Smart Drill will ask about this topic again.`)
            : h('div', null, h('p', null, `${plural(pending.length, 'concept')} still below Solid or under pursuit:`), h('div', { class: 'row wrap', style: { justifyContent: 'center' } }, pending.map(cid => h('span', { class: 'chip warn' }, app.conceptOf(cid).concept.term)))),
          h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
            cleared ? h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}` }, 'Back to the chapter') : h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, 'Try the checkpoint again'),
            h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${t.id}/read` }, 'Re-read the lesson'),
            nextTopicLink(app, ch, t)))));
      if (sum.log.some(l => !l.correct)) host.appendChild(h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Ground lost'), missesList(app, sum.log)));
    },
  }); }
}

function claimOverlay(ch, t, first) {
  const el = h('div', { class: 'claim', style: { '--ch': ch.color } },
    h('div', { class: 'claim-flag' }, h('span', { class: 'claim-pole' }), h('span', { class: 'claim-cloth' })),
    h('div', { class: 'claim-text' }, h('div', { class: 'eyebrow' }, first ? 'Checkpoint passed · standard planted' : 'Checkpoint held'), h('h2', null, t.title), h('p', { class: 'small muted' }, `Chapter ${ch.chapter} · ${ch.title}`)));
  return el;
}

function nextTopicLink(app, ch, t) {
  const i = ch.topics.indexOf(t);
  if (i < ch.topics.length - 1) { const n = ch.topics[i + 1]; return h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${n.id}/read` }, `Next topic: ${n.title} `, icon('arrow', { size: 14, tone: 'mono' })); }
  return h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/boss` }, 'Chapter boss ', icon('arrow', { size: 14, tone: 'mono' }));
}

function boss(app, ch, retry = false) {
  const full = app.pack.boss.n; const pass = app.pack.boss.pass; const pct = Math.round(pass * 100);
  const rec0 = app.state.campaign.bosses[ch.chapter] || {};
  // The breach: after a failed siege, retake only the ground you lost (missed concepts plus anything below Solid), at least 3 questions.
  const weakSet = retry ? new Set([...(rec0.lastMisses || []), ...ch.concepts.filter(c => masteryLevel(app.state.concepts[c.id]) < 3 || app.state.concepts[c.id]?.pursuit).map(c => c.id)]) : null;
  const n = retry ? Math.max(3, Math.min(full, weakSet.size * 2)) : full;
  const questions = retry && weakSet.size ? buildExam(app.content, app.state, { n, chapters: new Set([ch.chapter]), concepts: weakSet }) : buildExam(app.content, app.state, { n: full, chapters: new Set([ch.chapter]) });
  const isRetry = !!(retry && weakSet && weakSet.size > 0); const qn = questions.length;
  const host = h('div', { style: { '--ch': ch.color } });
  let runner = null;
  warBriefing(app, { kind: 'boss', chapter: ch, cta: 'Begin the siege' }).then(() => { if (host.dead) return; runner = buildBoss(); host.appendChild(runner); });
  host.cleanup = () => { host.dead = true; runner && runner.cleanup && runner.cleanup(); };
  return host;
  function buildBoss() { return createRunner(app, {
    title: isRetry ? `Chapter ${ch.chapter} boss · the breach` : `Chapter ${ch.chapter} boss`, subtitle: isRetry ? `${ch.title}. Only the ground you lost: ${qn} questions on ${weakSet.size} concept${weakSet.size === 1 ? '' : 's'}, ${pct}% retakes the city.` : `${ch.title}. ${qn} questions from the whole chapter, ${pct}% to clear it (the siege of ${app.pack.geo.prov[ch.chapter]?.capital || 'the capital'}).`, mode: 'boss', questions, feedback: 'immediate', limit: qn, pursuit: false, hearts: null, province: app.chapterScene(ch.chapter), siege: { needed: Math.ceil(qn * pass) },
    onFinish: (sum, reason) => {
      const score = sum.answered ? sum.correct / sum.answered : 0;
      const complete = sum.answered >= qn;
      const rec = app.state.campaign.bosses[ch.chapter] || (app.state.campaign.bosses[ch.chapter] = {});
      if (complete && !isRetry) rec.best = Math.max(rec.best || 0, score);
      const won = complete && score >= pass;
      if (complete && !won) rec.lastMisses = [...new Set(sum.log.filter(l => !l.correct).map(l => l.cid))];
      if (won) delete rec.lastMisses;
      const first = won && !rec.cleared;
      if (won && !rec.cleared) { rec.cleared = Date.now(); app.grantXp(300, 'province conquered'); addDenarii(50, 'conquest'); }
      else if (won) { app.grantXp(100, 'the city holds for Rome'); }
      app.store.save();
      const show = () => {
        if (host.dead) return;
        host.innerHTML = '';
        if (won) { app.confetti({ count: first ? 220 : 120, colors: ['#8B1E1E', '#C9A227', '#E3C76A', '#EADBC0'] }); host.appendChild(h('div', { class: 'claim crown', style: { '--ch': ch.color } }, h('div', { class: 'claim-crown' }, icon('aquila', { size: 48, tone: 'gold' })), h('div', { class: 'claim-text' }, h('div', { class: 'eyebrow' }, isRetry ? 'The breach is taken' : 'Chapter boss cleared'), h('h2', null, `Chapter ${ch.chapter} conquered`), h('p', { class: 'small muted' }, `${sum.correct}/${qn}. ${ch.title} is yours.`)))); }
        host.appendChild(resultCard(app, won ? 'Chapter boss cleared' : complete ? 'Not yet · the walls held' : 'Boss attempt stopped', sum,
          h('div', { class: 'stack mt' },
            won ? null : complete ? h('p', null, `You need ${pct}% (${Math.ceil(qn * pass)}/${qn}) to clear the chapter boss. Retake the breach: a shorter siege on just the concepts you missed or hold weakly. Passing it takes the city.`) : h('p', { class: 'muted' }, 'Finish every question to record the attempt.'),
            h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
              won ? h('a', { class: 'btn primary', href: '#/campaign' }, 'Back to the campaign map') : complete ? h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}/boss/retry` }, icon('siegetower', { size: 16, tone: 'mono' }), ' Retake the breach') : h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}/boss` }, 'Try the boss again'),
              !won && complete ? h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/boss` }, 'Full siege again') : null,
              sum.log.some(l => !l.correct) ? h('a', { class: 'btn', href: `#/drill/concepts/${[...new Set(sum.log.filter(l => !l.correct).map(l => l.cid))].join(',')}` }, icon('target', { size: 16, tone: 'gold' }), 'Drill my misses') : null,
              h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}` }, 'Back to the chapter')))));
        host.appendChild(h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Review the misses'), missesList(app, sum.log)));
      };
      if (won) { setTimeout(() => { if (!host.dead) triumph(app, { chapter: ch, score: sum.correct, n: qn, first }).then(show); }, 1400); host.innerHTML = ''; host.appendChild(h('div', { class: 'panel stone center result' }, h('div', { class: 'eyebrow' }, 'The gate is breached'), h('p', { class: 'muted' }, 'The legion storms the city…'))); }
      else show();
    },
  }); }
}
