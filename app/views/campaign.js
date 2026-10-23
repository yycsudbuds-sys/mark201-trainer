// Campaign: the Marketing Archipelago. World map → island trail → lesson → checkpoint → boss.
import { h, plural } from '../ui.js';
import { masteryLevel, buildExam } from '../engine.js';
import { worldMap, islandTrail, chapterProgress, nextIsland, ISLANDS, provinceState, ROMAN, zoomToProvince } from '../map.js';
import { PROVINCE_SCENE } from '../scenes.js';
import { icon, CHAPTER_ICON } from '../icons.js';
import { getCosmetic } from '../cosmetic.js';
import { warBriefing, triumph } from '../cutscene.js';
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
      h('div', null, h('div', { class: 'eyebrow' }, 'Conquest'), h('h1', null, 'Imperium Marketing'), h('p', null, 'Eight provinces, one per chapter. March on a province, win each battle on its road (study the scrolls, then prove it), and plant the standard. Lay siege to the capital at 90% to conquer the province.')),
      h('div', { class: 'row wrap' }, h('span', { class: 'chip' }, icon('aquila', { size: 14, tone: 'gold' }), `${conquered}/8 provinces conquered`), h('span', { class: 'chip' }, icon('standard', { size: 14, tone: 'crimson' }), `${flags}/${totalFlags} standards planted`))),
    mapFrame,
    nextCh ? h('div', { class: 'quest', style: { '--ch': nextCh.color } },
      h('div', { class: 'quest-ico' }, icon(CHAPTER_ICON[nextCh.chapter] || 'seal', { size: 34, tone: 'gold' })),
      h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Next objective'), h('h3', null, `Chapter ${ROMAN[nextCh.chapter]}: ${ISLANDS[nextCh.chapter].name} · ${nextCh.title}`), h('p', { class: 'small muted' }, nextCh.tag)),
      h('a', { class: 'btn ch big', href: `#/campaign/${nextCh.chapter}` }, 'March ', icon('arrow', { size: 14, tone: 'mono' }))) : h('div', { class: 'quest' }, h('div', { class: 'quest-ico' }, icon('aquila', { size: 34, tone: 'gold' })), h('div', null, h('h3', null, 'Every province is yours, Imperator.'), h('p', { class: 'small muted' }, 'Keep the armoury stocked with field drills and great battles.'))));
  page.cleanup = () => releaseTable(mapFrame);
  return page;
}

function island(app, ch) {
  const isl = ISLANDS[ch.chapter];
  const prog = chapterProgress(app, ch);
  const sheet = h('div', { class: 'level-sheet' });
  const use3d = wantsTable(app);
  const mapFrame = h('div', { class: 'map-frame' + (use3d ? ' map-3d loading' : '') });
  const page = h('div', { class: 'island-page', style: { '--ch': ch.color } },
    h('a', { class: 'back', href: '#/campaign' }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ' Back to the map of provinces'),
    h('div', { class: 'page-head mt-sm' },
      h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ROMAN[ch.chapter]} · Provincia ${isl?.name || ''}`), h('h1', { class: 'row' }, icon(CHAPTER_ICON[ch.chapter] || 'seal', { size: 30, tone: 'gold' }), ch.title), h('p', null, `${ch.topics.length} battles on the road, ${ch.concepts.length} strongholds. ${prog.cleared}/${ch.topics.length} standards planted${prog.boss ? `, ${isl?.capital || 'the capital'} taken.` : '.'}`)),
      h('div', { class: 'row wrap' }, h('a', { class: 'btn ghost', href: `#/learn/${ch.chapter}` }, icon('scroll', { size: 16, tone: 'gold' }), 'Scrolls'), h('a', { class: 'btn ghost', href: `#/drill/chapter/${ch.chapter}` }, icon('gladius', { size: 16, tone: 'gold' }), 'Drill province'))),
    mapFrame, sheet);
  function showSheet(t, i) {
    const cleared = topicCleared(app, t);
    sheet.innerHTML = '';
    sheet.appendChild(h('div', { class: 'sheet-card' },
      h('div', { class: 'row between wrap' },
        h('div', null, h('div', { class: 'eyebrow' }, `Battle ${i + 1}${cleared ? ' · standard planted' : ''}`), h('h2', null, t.title)),
        h('div', { class: 'row wrap' }, t.concepts.map(cid => h('span', { class: `mdot m${masteryLevel(app.state.concepts[cid])}`, title: app.conceptOf(cid).concept.term })))),
      h('p', { class: 'muted' }, t.summary),
      h('div', { class: 'row wrap' }, t.concepts.map(cid => h('a', { class: 'chip', href: `#/learn/${ch.chapter}/${cid}` }, app.conceptOf(cid).concept.term))),
      h('div', { class: 'row wrap mt' },
        h('a', { class: 'btn big', href: `#/campaign/${ch.chapter}/${t.id}/read` }, icon('scroll', { size: 18, tone: 'gold' }), 'Study the scrolls'),
        h('a', { class: 'btn ch big', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, icon('swords', { size: 18, tone: 'gold' }), cleared ? 'Fight again' : 'To battle'),
        h('span', { class: 'small muted' }, 'Scrolls first if the ground is new. The battle is won when every stronghold reaches Solid.'))));
    if (sheet.dataset.user) sheet.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  const onNode = (t, i) => { sheet.dataset.user = '1'; showSheet(t, i); };
  const onBoss = () => { const all = ch.topics.every(t => topicCleared(app, t)); if (all) app.navigate(`#/campaign/${ch.chapter}/boss`); else app.toast('Win every battle on the road before laying siege to the capital', 'info'); };
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
      chapter: ch, title: `Battle · ${t.title}`, exitHref: `#/campaign/${ch.chapter}`, completeLabel: 'To battle',
      onComplete: () => app.navigate(`#/campaign/${ch.chapter}/${t.id}/drill`),
    });
    host.appendChild(deck);
  });
  host.cleanup = () => { host.dead = true; deck && deck.cleanup && deck.cleanup(); };
  return host;
}

function lockedPrompt(app, ch) {
  const pv = ISLANDS[ch.chapter];
  const idx = [1, 6, 7, 8, 9, 10, 11, 12].indexOf(ch.chapter);
  const prev = app.index.chapter.get([1, 6, 7, 8, 9, 10, 11, 12][idx - 1]);
  import('../ui.js').then(({ modal }) => modal({
    title: `${pv.name} is locked`,
    body: h('div', { class: 'stack' }, h('p', null, `The road to ${pv.name} opens once a standard is planted in ${ISLANDS[prev.chapter].name} (Chapter ${ROMAN[prev.chapter]}: ${prev.title}).`), h('p', { class: 'small muted' }, 'A forced march skips the road. Allowed, but the Legatus advises conquering in order.')),
    actions: [{ label: 'Return', kind: 'ghost' }, { label: `Go to ${ISLANDS[prev.chapter].name}`, onClick: () => app.navigate(`#/campaign/${prev.chapter}`) }, { label: 'Forced march', kind: 'primary', onClick: () => { app.state.campaign.unlocked = app.state.campaign.unlocked || {}; app.state.campaign.unlocked[ch.chapter] = Date.now(); app.store.save(); app.navigate(`#/campaign/${ch.chapter}`); } }],
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
    title: `Battle · ${t.title}`, subtitle: `Provincia ${ISLANDS[ch.chapter]?.name || ch.chapter}. Every stronghold to Solid plants the standard.`, mode: 'campaign',
    concepts, limit, feedback: 'immediate', pickOpts: { interleave: false }, province: PROVINCE_SCENE[ch.chapter],
    stopWhen: s => s.answered >= t.concepts.length * 2 && topicConceptsSolid(app, t),
    onFinish: (sum, reason) => {
      const cleared = topicConceptsSolid(app, t);
      const rec = app.state.campaign.topics[t.id] || (app.state.campaign.topics[t.id] = {});
      let first = false;
      if (cleared && !rec.cleared) { rec.cleared = Date.now(); first = true; app.grantXp(100, 'standard planted'); app.confetti({ colors: ['#8B1E1E', '#C9A227', '#E3C76A', '#EADBC0'] }); app.sound('horn'); }
      else if (cleared) rec.lastCleared = Date.now();
      app.store.save();
      host.innerHTML = '';
      const pending = t.concepts.filter(cid => masteryLevel(app.state.concepts[cid]) < 3 || app.state.concepts[cid]?.pursuit);
      if (cleared) host.appendChild(claimOverlay(ch, t, first));
      host.appendChild(resultCard(app, cleared ? 'Standard planted' : reason === 'exit' ? 'Battle broken off' : 'The field is not yet ours', sum,
        h('div', { class: 'stack mt' },
          cleared ? h('p', null, `Every stronghold in “${t.title}” is at least Solid.${first ? ' +100 XP.' : ''} Mastered needs a later session, so this ground will be contested again in Field Drill.`)
            : h('div', null, h('p', null, `${plural(pending.length, 'stronghold')} still below Solid or under pursuit:`), h('div', { class: 'row wrap', style: { justifyContent: 'center' } }, pending.map(cid => h('span', { class: 'chip warn' }, app.conceptOf(cid).concept.term)))),
          h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
            cleared ? h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}` }, 'Back to the province') : h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, 'Press the attack'),
            h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${t.id}/read` }, 'Re-read the scrolls'),
            nextTopicLink(app, ch, t)))));
      if (sum.log.some(l => !l.correct)) host.appendChild(h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Ground lost'), missesList(app, sum.log)));
    },
  }); }
}

function claimOverlay(ch, t, first) {
  const el = h('div', { class: 'claim', style: { '--ch': ch.color } },
    h('div', { class: 'claim-flag' }, h('span', { class: 'claim-pole' }), h('span', { class: 'claim-cloth' })),
    h('div', { class: 'claim-text' }, h('div', { class: 'eyebrow' }, first ? 'Standard planted' : 'Ground held'), h('h2', null, t.title), h('p', { class: 'small muted' }, `Provincia ${ISLANDS[ch.chapter]?.name || ch.title}`)));
  return el;
}

function nextTopicLink(app, ch, t) {
  const i = ch.topics.indexOf(t);
  if (i < ch.topics.length - 1) { const n = ch.topics[i + 1]; return h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${n.id}/read` }, `Next battle: ${n.title} `, icon('arrow', { size: 14, tone: 'mono' })); }
  return h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/boss` }, 'Lay siege ', icon('arrow', { size: 14, tone: 'mono' }));
}

function boss(app, ch) {
  const n = 24;
  const questions = buildExam(app.content, app.state, { n, chapters: new Set([ch.chapter]) });
  const host = h('div', { style: { '--ch': ch.color } });
  let runner = null;
  warBriefing(app, { kind: 'boss', chapter: ch, cta: 'Begin the siege' }).then(() => { if (host.dead) return; runner = buildBoss(); host.appendChild(runner); });
  host.cleanup = () => { host.dead = true; runner && runner.cleanup && runner.cleanup(); };
  return host;
  function buildBoss() { return createRunner(app, {
    title: `Siege of ${ISLANDS[ch.chapter]?.capital || 'the capital'}`, subtitle: `Provincia ${ISLANDS[ch.chapter]?.name || ch.chapter} · ${ch.title}. ${n} questions, 90% to take the city.`, mode: 'boss', questions, feedback: 'immediate', limit: n, pursuit: false, hearts: null, province: PROVINCE_SCENE[ch.chapter], siege: { needed: Math.ceil(n * 0.9) },
    onFinish: (sum, reason) => {
      const score = sum.answered ? sum.correct / sum.answered : 0;
      const complete = sum.answered >= n;
      const rec = app.state.campaign.bosses[ch.chapter] || (app.state.campaign.bosses[ch.chapter] = {});
      if (complete) rec.best = Math.max(rec.best || 0, score);
      const won = complete && score >= 0.9;
      const first = won && !rec.cleared;
      if (won && !rec.cleared) { rec.cleared = Date.now(); app.grantXp(300, 'province conquered'); }
      else if (won) { app.grantXp(100, 'the city holds for Rome'); }
      app.store.save();
      const show = () => {
        if (host.dead) return;
        host.innerHTML = '';
        if (won) { app.confetti({ count: first ? 220 : 120, colors: ['#8B1E1E', '#C9A227', '#E3C76A', '#EADBC0'] }); host.appendChild(h('div', { class: 'claim crown', style: { '--ch': ch.color } }, h('div', { class: 'claim-crown' }, icon('aquila', { size: 48, tone: 'gold' })), h('div', { class: 'claim-text' }, h('div', { class: 'eyebrow' }, 'Province conquered'), h('h2', null, `${ISLANDS[ch.chapter]?.name || ch.title} is Roman`), h('p', { class: 'small muted' }, `${sum.correct}/${n}. Chapter ${ROMAN[ch.chapter]} is yours.`)))); }
        host.appendChild(resultCard(app, won ? 'The city has fallen' : complete ? 'The walls held' : 'Siege lifted', sum,
          h('div', { class: 'stack mt' },
            won ? null : complete ? h('p', null, `You need 90% (${Math.ceil(n * 0.9)}/${n}) to take the city. Drill the ground lost below, then renew the siege.`) : h('p', { class: 'muted' }, 'Finish every question to record the siege.'),
            h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
              h('a', { class: 'btn primary', href: won ? '#/campaign' : `#/campaign/${ch.chapter}/boss` }, won ? 'Back to the map' : 'Renew the siege'),
              sum.log.some(l => !l.correct) ? h('a', { class: 'btn', href: `#/drill/concepts/${[...new Set(sum.log.filter(l => !l.correct).map(l => l.cid))].join(',')}` }, icon('target', { size: 16, tone: 'gold' }), 'Drill my misses') : null,
              h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}` }, 'Back to the province')))));
        host.appendChild(h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Review'), missesList(app, sum.log)));
      };
      if (won) { setTimeout(() => { if (!host.dead) triumph(app, { chapter: ch, score: sum.correct, n, first }).then(show); }, 1400); host.innerHTML = ''; host.appendChild(h('div', { class: 'panel stone center result' }, h('div', { class: 'eyebrow' }, 'The gate is breached'), h('p', { class: 'muted' }, 'The legion storms the city…'))); }
      else show();
    },
  }); }
}
