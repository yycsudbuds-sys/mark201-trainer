// Campaign: chapters as worlds, topics as levels (read → checkpoint), boss fight per chapter.
import { h, ring, plural } from '../ui.js';
import { masteryLevel, chapterMastery, buildExam, markSeen, MASTERY_LABELS } from '../engine.js';
import { conceptCard, masteryChip } from './concept.js';
import { createRunner, resultCard, missesList } from './runner.js';

export function render(app, params) {
  const [chStr, topicId, action] = params;
  if (!chStr) return worlds(app);
  const chNum = parseInt(chStr, 10);
  const ch = app.index.chapter.get(chNum);
  if (!ch) return h('div', { class: 'card' }, 'Unknown chapter. ', h('a', { href: '#/campaign' }, 'Back'));
  if (topicId === 'boss') return boss(app, ch);
  if (!topicId) return chapterView(app, ch);
  const t = ch.topics.find(x => x.id === topicId);
  if (!t) return h('div', { class: 'card' }, 'Unknown level. ', h('a', { href: `#/campaign/${chNum}` }, 'Back'));
  if (action === 'drill') return checkpoint(app, ch, t);
  return reading(app, ch, t);
}

function topicCleared(app, t) { return !!app.state.campaign.topics[t.id]?.cleared; }
function topicConceptsSolid(app, t) { return t.concepts.every(cid => masteryLevel(app.state.concepts[cid]) >= 3 && !app.state.concepts[cid]?.pursuit); }

function worlds(app) {
  return h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Campaign'), h('p', null, 'Eight worlds, one per chapter. Each level is a topic: read its cards, then clear the checkpoint by getting every concept to Solid. Beat the boss at 90% to finish the chapter.'))),
    h('div', { class: 'stack' }, app.content.chapters.map(ch => {
      const m = chapterMastery(app.content, app.state, ch.chapter);
      const cleared = ch.topics.filter(t => topicCleared(app, t)).length;
      const bossOk = app.state.campaign.bosses?.[ch.chapter]?.cleared;
      return h('a', { class: 'world', href: `#/campaign/${ch.chapter}`, style: { '--ch': ch.color } },
        h('div', { class: 'ico' }, bossOk ? '👑' : ch.emoji),
        h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter} · ${ch.tag}`), h('h3', null, ch.title),
          h('div', { class: 'dots' }, ch.concepts.map(c => h('span', { class: `mdot m${masteryLevel(app.state.concepts[c.id])}` })))),
        h('div', { class: 'row' }, h('span', { class: 'chip' }, `${cleared}/${ch.topics.length} levels`), bossOk ? h('span', { class: 'chip good' }, 'Boss beaten') : null, ring(m.score, { size: 44, stroke: 5, color: ch.color, label: `${Math.round(m.score * 100)}` })));
    })));
}

function chapterView(app, ch) {
  const allCleared = ch.topics.every(t => topicCleared(app, t));
  const bossState = app.state.campaign.bosses?.[ch.chapter];
  const m = chapterMastery(app.content, app.state, ch.chapter);
  return h('div', { style: { '--ch': ch.color } },
    h('a', { class: 'back', href: '#/campaign' }, '← All chapters'),
    h('div', { class: 'page-head mt-sm' },
      h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter} · ${ch.tag}`), h('h1', null, `${ch.emoji} ${ch.title}`),
        h('p', null, `${ch.concepts.length} concepts · ${ch.questions.length} questions. ${m.dist[4]} mastered, ${m.dist[3]} solid.`)),
      h('div', { class: 'row' }, h('a', { class: 'btn ghost', href: `#/learn/${ch.chapter}` }, '📖 Read all'), h('a', { class: 'btn ghost', href: `#/drill/chapter/${ch.chapter}` }, '🎯 Drill chapter'))),
    h('div', { class: 'stack' },
      ch.topics.map((t, i) => {
        const cleared = topicCleared(app, t);
        const solid = t.concepts.filter(cid => masteryLevel(app.state.concepts[cid]) >= 3).length;
        const read = t.concepts.filter(cid => app.state.concepts[cid]?.seen).length;
        return h('div', { class: 'level' + (cleared ? ' cleared' : '') },
          h('div', { class: 'n' }, cleared ? '✓' : String(i + 1)),
          h('div', null, h('h3', null, t.title), h('p', { class: 'small muted' }, t.summary),
            h('div', { class: 'row wrap mt-sm' }, h('span', { class: 'chip' }, `${read}/${t.concepts.length} read`), h('span', { class: cleared ? 'chip good' : 'chip' }, `${solid}/${t.concepts.length} solid`),
              t.concepts.map(cid => h('span', { class: `mdot m${masteryLevel(app.state.concepts[cid])}`, title: app.conceptOf(cid).concept.term })))),
          h('div', { class: 'acts' }, h('a', { class: 'btn sm', href: `#/campaign/${ch.chapter}/${t.id}/read` }, '📖 Read'), h('a', { class: 'btn sm ch', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, cleared ? '🔁 Re-run' : '🎯 Checkpoint')));
      }),
      h('div', { class: 'level boss' + (allCleared ? '' : ' locked') },
        h('div', { class: 'n' }, '👑'),
        h('div', null, h('h3', null, 'Boss fight'), h('p', { class: 'small muted' }, `24 questions across the whole chapter, difficulty weighted up. Need 90% to clear.${bossState?.best !== undefined ? ` Best so far: ${Math.round(bossState.best * 100)}%.` : ''}`),
          !allCleared ? h('p', { class: 'small', style: { color: 'var(--warn)' } }, 'Unlocks when every level above is cleared.') : null),
        h('div', { class: 'acts' }, h('a', { class: 'btn sm primary', href: `#/campaign/${ch.chapter}/boss`, style: allCleared ? null : { pointerEvents: 'none', opacity: 0.6 } }, bossState?.cleared ? '👑 Beaten · fight again' : '⚔️ Fight'))),
    ));
}

function reading(app, ch, t) {
  let idx = 0;
  const host = h('div', { class: 'carousel' });
  const wrap = h('div', { style: { '--ch': ch.color }, class: 'runner' },
    h('a', { class: 'back', href: `#/campaign/${ch.chapter}` }, `← Chapter ${ch.chapter}`),
    h('div', { class: 'page-head mt-sm' }, h('div', null, h('div', { class: 'eyebrow' }, `Level · ${t.title}`), h('h2', null, 'Read, then prove it'), h('p', null, t.summary))),
    host);
  const draw = () => {
    host.innerHTML = '';
    const cid = t.concepts[idx];
    markSeen(app.state, cid); app.store.save();
    host.appendChild(conceptCard(app, cid, { showAngles: true }));
    const last = idx === t.concepts.length - 1;
    host.appendChild(h('div', { class: 'carousel-nav' },
      h('button', { class: 'btn ghost', disabled: idx === 0, onClick: () => { idx--; draw(); } }, '← Previous'),
      h('div', { class: 'dots-nav' }, t.concepts.map((_, i) => h('span', { class: i === idx ? 'on' : '' }))),
      last ? h('a', { class: 'btn ch big', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, '🎯 Start checkpoint') : h('button', { class: 'btn primary', onClick: () => { idx++; draw(); } }, `Next (${idx + 1}/${t.concepts.length}) →`)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  draw();
  const onKey = e => { if (e.key === 'ArrowRight' && idx < t.concepts.length - 1) { idx++; draw(); } else if (e.key === 'ArrowLeft' && idx > 0) { idx--; draw(); } };
  document.addEventListener('keydown', onKey);
  wrap.cleanup = () => document.removeEventListener('keydown', onKey);
  return wrap;
}

function checkpoint(app, ch, t) {
  const concepts = new Set(t.concepts);
  const limit = Math.max(12, t.concepts.length * 4);
  const host = h('div', { style: { '--ch': ch.color } });
  const runner = createRunner(app, {
    title: `Checkpoint · ${t.title}`, subtitle: `Chapter ${ch.chapter}. Every concept to Solid clears the level.`, mode: 'campaign',
    concepts, limit, feedback: 'immediate', pickOpts: { interleave: false },
    stopWhen: s => s.answered >= t.concepts.length * 2 && topicConceptsSolid(app, t),
    onFinish: (sum, reason) => {
      const cleared = topicConceptsSolid(app, t);
      const rec = app.state.campaign.topics[t.id] || (app.state.campaign.topics[t.id] = {});
      let bonus = 0;
      if (cleared && !rec.cleared) { rec.cleared = Date.now(); bonus = 100; app.grantXp(100, 'level cleared'); app.confetti(); app.sound('clear'); }
      else if (cleared) rec.lastCleared = Date.now();
      app.store.save();
      host.innerHTML = '';
      const pending = t.concepts.filter(cid => masteryLevel(app.state.concepts[cid]) < 3 || app.state.concepts[cid]?.pursuit);
      host.append(
        resultCard(app, cleared ? 'Level cleared' : reason === 'exit' ? 'Checkpoint ended' : 'Not yet', sum,
          h('div', { class: 'stack mt' },
            cleared ? h('p', null, `Every concept in “${t.title}” is at least Solid.${bonus ? ' +100 XP bonus.' : ''} Mastered needs a later session, so this topic will reappear in Smart Drill.`)
              : h('div', null, h('p', null, `${plural(pending.length, 'concept')} still below Solid or in pursuit:`), h('div', { class: 'row wrap', style: { justifyContent: 'center' } }, pending.map(cid => h('span', { class: 'chip warn' }, app.conceptOf(cid).concept.term)))),
            h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
              cleared ? h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}` }, 'Back to chapter') : h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, 'Keep going'),
              h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${t.id}/read` }, 'Re-read cards'),
              nextTopicLink(app, ch, t)))),
        sum.log.some(l => !l.correct) ? h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Your misses'), missesList(app, sum.log)) : null);
    },
    onExit: () => {},
  });
  host.appendChild(runner);
  host.cleanup = () => runner.cleanup && runner.cleanup();
  return host;
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
    title: `Boss · Chapter ${ch.chapter}`, subtitle: `${ch.title}. ${n} questions, 90% to clear.`, mode: 'boss', questions, feedback: 'immediate', limit: n, pursuit: false, hearts: null,
    onFinish: (sum, reason) => {
      const score = sum.answered ? sum.correct / sum.answered : 0;
      const complete = sum.answered >= n;
      const rec = app.state.campaign.bosses[ch.chapter] || (app.state.campaign.bosses[ch.chapter] = {});
      if (complete) rec.best = Math.max(rec.best || 0, score);
      const won = complete && score >= 0.9;
      if (won && !rec.cleared) { rec.cleared = Date.now(); app.grantXp(300, 'boss beaten'); app.confetti({ count: 220 }); app.sound('level'); }
      else if (won) { app.grantXp(100, 'boss beaten again'); app.confetti(); }
      app.store.save();
      host.innerHTML = '';
      host.append(resultCard(app, won ? '👑 Boss beaten' : complete ? 'Boss survived' : 'Fight ended', sum,
        h('div', { class: 'stack mt' },
          won ? h('p', null, `Chapter ${ch.chapter} cleared. ${sum.correct}/${n} is boss-level.`) : complete ? h('p', null, `You need 90% (${Math.ceil(n * 0.9)}/${n}). Drill the misses below, then come back.`) : h('p', { class: 'muted' }, 'Finish all questions to record a score.'),
          h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
            h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}/boss` }, 'Fight again'),
            sum.log.some(l => !l.correct) ? h('a', { class: 'btn', href: `#/drill/concepts/${[...new Set(sum.log.filter(l => !l.correct).map(l => l.cid))].join(',')}` }, '🎯 Drill my misses') : null,
            h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}` }, 'Back to chapter')))),
      h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Review'), missesList(app, sum.log)));
    },
  });
  host.appendChild(runner);
  host.cleanup = () => runner.cleanup && runner.cleanup();
  return host;
}
