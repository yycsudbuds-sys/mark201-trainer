// Shared question runner: one question at a time, keyboard first (1–5 answer, Enter advances).
// Presentation: parchment question panel over the scene, carved answer tablets with bronze coin keys,
// a layered feedback panel with wax seals, the +XP coin flying to the XP bar, and the front-line band.
// The study logic (pickNext, pursuits, app.answer) is untouched.
import { h, clear, coinFlight, fmtTime } from '../ui.js';
import { shuffleOptions, ANGLE_LABELS, pickNext, masteryLevel, MASTERY_LABELS } from '../engine.js';
import { conceptCard } from './concept.js';
import { visualFor } from '../visuals.js';
import { attachBand } from '../battlefield.js';
import { richText, icon, CHAPTER_ICON } from '../icons.js';

const REASON_LABEL = { pursuit: 'Pursuit', weak: 'Weak flank', due: 'Due for review', new: 'New ground', review: 'Review', exam: 'Battle', boss: 'Siege', campaign: 'Battle', blitz: 'Skirmish', duel: 'Duel' };
const REASON_ICON = { pursuit: 'standard', weak: 'shieldcrack', due: 'sundial', new: 'pilum', review: 'scroll', exam: 'scutum', boss: 'siegetower', campaign: 'swords', blitz: 'gladius', duel: 'gladius' };

/**
 * createRunner(app, config) -> element with .cleanup()
 * config: { title, subtitle, mode, chapters, concepts, limit, feedback: 'immediate'|'deferred', hearts, timer, perQuestionTimer,
 *   pickOpts, questions, onFinish(summary, reason), onExit(), onAnswer, showLearnOnWrong, pursuit (default true), stopWhen(summary),
 *   introCard(cid) -> bool, band: bool (front-line strip; default on), scene: legacy ('chariot'|'colosseum' => arena, no band),
 *   province: scene kind used to pick the enemy line }
 */
export function createRunner(app, cfg) {
  const arena = cfg.band === false || (cfg.scene && cfg.scene !== 'battlefield');
  const state = {
    counter: 0, recent: [], recentQids: [], pursuitQueue: [], combo: 0, hearts: cfg.hearts ?? null,
    answered: 0, correct: 0, xp: 0, log: [], fixedIdx: 0, current: null, timeLeft: cfg.timer || null, qTimeLeft: null, finished: false,
    pursuitsCleared: 0, startedAt: Date.now(), lastLightning: 0,
  };
  const el = h('div', { class: 'runner' + (arena ? ' arena' : ' battle') });
  let timerId = null; let qTimerId = null;
  const headEl = h('div', { class: 'runner-head' });
  const bodyEl = h('div', { class: 'runner-body' });
  el.append(headEl, bodyEl);

  function cleanup() { clearInterval(timerId); clearInterval(qTimerId); document.removeEventListener('keydown', onKey); if (el.battlefield && el.battlefield.destroy) el.battlefield.destroy(); }
  el.cleanup = cleanup;

  function summary() {
    return { answered: state.answered, correct: state.correct, xp: state.xp, log: state.log, durationSec: Math.round((Date.now() - state.startedAt) / 1000), pursuitsCleared: state.pursuitsCleared, hearts: state.hearts, combo: state.combo };
  }
  function finish(reason) {
    if (state.finished) return;
    state.finished = true;
    cleanup();
    cfg.onFinish && cfg.onFinish(summary(), reason);
  }
  function next() {
    if (state.finished) return;
    if (cfg.limit && state.answered >= cfg.limit) return finish('limit');
    if (cfg.stopWhen && cfg.stopWhen(summary())) return finish('goal');
    let pick = null;
    if (cfg.questions) {
      if (state.fixedIdx >= cfg.questions.length) return finish('complete');
      const q = cfg.questions[state.fixedIdx++];
      pick = { question: q, reason: cfg.mode, cid: q.concept };
    } else {
      pick = pickNext(app.content, app.state, {
        ...(cfg.pickOpts || {}), chapters: cfg.chapters || null, concepts: cfg.concepts || null, now: Date.now(),
        recent: state.recent, recentQids: state.recentQids.slice(-30), counter: state.counter, pursuitQueue: cfg.pursuit === false ? [] : state.pursuitQueue, mode: cfg.mode,
      });
      if (!pick) return finish('exhausted');
      if (pick.queueItem) state.pursuitQueue = state.pursuitQueue.filter(p => p !== pick.queueItem);
    }
    state.counter++;
    state.current = pick;
    state.recent.push(pick.cid); if (state.recent.length > 40) state.recent.shift();
    state.recentQids.push(pick.question.id);
    if (cfg.introCard && cfg.introCard(pick.cid)) renderIntro(pick); else renderQuestion(pick);
  }

  // Weak-flank style: show the scroll first, then the question.
  function renderIntro(pick) {
    const entry = app.conceptOf(pick.question.concept);
    renderHead(); clear(bodyEl);
    const go = () => renderQuestion(pick);
    bodyEl.append(
      h('div', { class: 'panel parchment intro-note', style: { '--ch': entry.chapter.color } }, h('div', { class: 'row wrap' }, icon('scroll', { tone: 'crimson' }), h('span', { class: 'eyebrow' }, 'Re-learn first'), h('span', { class: 'small muted' }, 'Read the scroll, then prove it with a question.'))),
      conceptCard(app, pick.question.concept, { showAngles: true }),
      h('div', { class: 'runner-foot' }, h('span', { class: 'small muted' }, 'Enter to continue'), h('button', { class: 'btn primary big', onClick: go }, 'Got it, quiz me ', h('span', { class: 'kbd' }, 'Enter'))));
    currentHandlers = { choose: () => {}, count: 0, done: () => true, next: go };
    setTimeout(() => bodyEl.querySelector('.btn.primary')?.focus({ preventScroll: true }), 30);
  }

  function renderHead() {
    clear(headEl);
    const left = h('div', { class: 'row wrap' }, h('div', null, h('div', { class: 'eyebrow' }, cfg.title || 'Practice'), cfg.subtitle ? h('div', { class: 'small muted' }, cfg.subtitle) : null));
    const right = h('div', { class: 'row wrap' });
    if (state.hearts !== null) right.appendChild(h('span', { class: 'hearts', 'aria-label': `${state.hearts} lives` }, Array.from({ length: cfg.hearts || 0 }, (_, i) => icon(i < state.hearts ? 'scutum' : 'shieldcrack', { size: 18, tone: i < state.hearts ? 'crimson' : 'iron' }))));
    if (state.combo >= 2) right.appendChild(h('span', { class: 'combo' }, icon('flame', { size: 16, tone: 'gold' }), `×${state.combo}`));
    right.appendChild(h('span', { class: 'chip' }, `${state.correct}/${state.answered}${cfg.limit ? ` · ${cfg.limit}` : ''}`));
    if (state.timeLeft !== null) right.appendChild(h('span', { class: 'timer' + (state.timeLeft <= 30 ? ' low' : ''), dataset: { timer: '1' } }, icon('waterclock', { size: 14, tone: 'mono' }), fmtTime(state.timeLeft)));
    if (cfg.perQuestionTimer) right.appendChild(h('span', { class: 'timer', dataset: { qtimer: '1' } }, fmtTime(state.qTimeLeft ?? cfg.perQuestionTimer)));
    right.appendChild(h('button', { class: 'btn sm ghost', onClick: () => { finish('exit'); cfg.onExit && cfg.onExit(summary()); } }, 'End'));
    headEl.append(left, right);
    if (cfg.limit) headEl.appendChild(h('div', { class: 'bar', style: { height: '6px' } }, h('div', { class: 'bar-fill', style: { width: (state.answered / cfg.limit * 100) + '%', background: 'var(--gold-leaf)' } })));
  }

  let currentHandlers = null; let hoverTick = 0;
  function renderQuestion(pick) {
    const q = pick.question;
    const entry = app.conceptOf(q.concept);
    const ch = entry.chapter;
    const { options, answer } = shuffleOptions(q);
    const cs = app.state.concepts[q.concept];
    renderHead(); clear(bodyEl);
    const metas = [h('span', { class: 'chip ch' }, `Ch ${ch.chapter} · ${ch.short}`), h('span', { class: 'chip' }, ANGLE_LABELS[q.angle] || q.angle),
      h('span', { class: 'chip pips', title: `Difficulty ${q.difficulty} of 3` }, Array.from({ length: 3 }, (_, i) => h('span', { class: 'pip' + (i < q.difficulty ? ' on' : '') })))];
    if (q.source === 'official') metas.push(h('span', { class: 'chip warn' }, 'Official practice Q'));
    if (cfg.feedback !== 'deferred' && pick.reason && REASON_LABEL[pick.reason]) metas.push(h('span', { class: 'chip reason' }, icon(REASON_ICON[pick.reason] || 'pilum', { size: 14, tone: 'gold' }), REASON_LABEL[pick.reason]));
    const card = h('div', { class: 'qcard panel parchment', style: { '--ch': ch.color } });
    if (cs && cs.pursuit && cfg.feedback !== 'deferred') {
      card.appendChild(h('div', { class: 'pursuit-banner' }, icon('standard', { size: 18, tone: 'crimson' }), h('span', null, h('b', null, 'Pursuit: '), `prove you know ${entry.concept.term} — ${cs.pursuit.need - cs.pursuit.done} more right in a row`),
        h('span', { class: 'pips' }, Array.from({ length: cs.pursuit.need }, (_, i) => h('span', { class: 'pip' + (i < cs.pursuit.done ? ' on' : '') })))));
    }
    card.appendChild(h('div', { class: 'qhead' }, h('div', { class: 'qicon' }, icon(CHAPTER_ICON[ch.chapter] || 'seal', { size: 28, tone: 'gold' })), h('div', { class: 'qmeta' }, metas)));
    card.appendChild(h('div', { class: 'stem' }, richText(q.stem)));
    const optEls = options.map((o, i) => h('button', { class: 'option tablet', dataset: { i },
      onClick: () => choose(i),
      onPointerenter: () => { const t = performance.now(); if (t - hoverTick > 120) { hoverTick = t; app.sound('tick'); } },
      onPointerdown: () => app.sound('knock') },
      h('span', { class: 'key coin' }, h('span', { class: 'key-n' }, String(i + 1))), h('span', { class: 'opt-text' }, richText(o, { blanks: false })), h('span', { class: 'laurel-mark' }, icon('laurel', { size: 22, tone: 'gold' }))));
    card.appendChild(h('div', { class: 'options' }, optEls));
    bodyEl.appendChild(card);
    const foot = h('div', { class: 'runner-foot' });
    bodyEl.appendChild(foot);
    let done = false;

    function choose(i) {
      if (done) return;
      done = true;
      clearInterval(qTimerId);
      const correct = i === answer;
      if (i >= 0) optEls[i].classList.add('sealed');
      if (cfg.feedback === 'deferred') {
        optEls.forEach((b, j) => { b.disabled = true; b.classList.toggle('picked', j === i); });
        afterAnswer(q, correct, i, options, answer, pick);
        setTimeout(next, 220);
        return;
      }
      optEls.forEach((b, j) => {
        b.disabled = true;
        if (j === answer) b.classList.add('correct');
        else if (j === i) b.classList.add('wrong');
        else b.classList.add('dim');
      });
      const res = afterAnswer(q, correct, i, options, answer, pick);
      card.appendChild(feedbackPanel(app, q, entry, correct, res));
      if (res && res.xp) coinFlight(optEls[answer], res.xp);
      const cont = h('button', { class: 'btn primary big', onClick: next }, 'Advance ', h('span', { class: 'kbd' }, 'Enter'));
      foot.append(h('span', { class: 'small muted' }, 'Keys 1–5 answer · Enter advances'), cont);
      setTimeout(() => cont.focus({ preventScroll: true }), 30);
      if (state.hearts !== null && state.hearts <= 0) setTimeout(() => finish('hearts'), 900);
      if (state.timeLeft !== null && state.timeLeft <= 0) setTimeout(() => finish('time'), 900);
    }
    currentHandlers = { choose, count: options.length, done: () => done, next };
    if (cfg.perQuestionTimer) {
      state.qTimeLeft = cfg.perQuestionTimer;
      clearInterval(qTimerId);
      qTimerId = setInterval(() => {
        state.qTimeLeft -= 1;
        const t = headEl.querySelector('[data-qtimer]'); if (t) { t.textContent = fmtTime(state.qTimeLeft); t.classList.toggle('low', state.qTimeLeft <= 5); }
        if (state.qTimeLeft <= 0) { clearInterval(qTimerId); if (!done) choose(-1); }
      }, 1000);
    }
  }

  function afterAnswer(q, correct, chosenIdx, options, answerIdx, pick) {
    state.answered++;
    if (correct) { state.combo++; state.correct++; } else { state.combo = 0; if (state.hearts !== null) { state.hearts--; app.sound('shieldcrack'); } }
    // Battlefield / arena reactions. Purely visual; never delays the quiz.
    if (el.battlefield) { if (correct) el.battlefield.advance(state.combo); else el.battlefield.setback(); }
    if (app.director) app.director.react(correct ? 'cheer' : 'jeer');
    const res = app.answer(q, correct, { mode: cfg.mode, combo: state.combo });
    state.xp += res.xp;
    if (correct) { app.sound('correct'); if (!arena) app.sound('pila'); if (state.combo >= 2) app.sound('combo', { n: state.combo }); if (state.combo === 3) app.sound('impact'); if (state.combo === 5) app.sound('charge'); }
    else { app.sound('wrong'); if (!arena) app.sound('impact'); }
    for (const ev of res.events) if (ev.type === 'pursuitCleared') { state.pursuitsCleared++; app.state.stats.pursuitsCleared = (app.state.stats.pursuitsCleared || 0) + 1; }
    // Pursuit scheduling (adaptive modes only)
    if (cfg.pursuit !== false && !cfg.questions) {
      const cs = app.state.concepts[q.concept];
      if (cs && cs.pursuit) {
        const gap = correct ? (cs.pursuit.done === 1 ? 4 : 6) : 3;
        if (!state.pursuitQueue.some(p => p.cid === q.concept)) state.pursuitQueue.push({ cid: q.concept, notBefore: state.counter + gap });
        else state.pursuitQueue.forEach(p => { if (p.cid === q.concept) p.notBefore = state.counter + gap; });
      }
    }
    if (el.battlefield && el.battlefield.setPursuits) el.battlefield.setPursuits(state.pursuitQueue.length);
    state.log.push({ qid: q.id, cid: q.concept, correct, chosen: chosenIdx >= 0 ? options[chosenIdx] : null, answer: options[answerIdx], reason: pick.reason, t: Date.now() });
    if (cfg.onAnswer) cfg.onAnswer({ q, correct, summary: summary() });
    return res;
  }

  function onKey(e) {
    if (!currentHandlers) return;
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= currentHandlers.count && !currentHandlers.done()) { e.preventDefault(); currentHandlers.choose(n - 1); }
    else if ((e.key === 'Enter' || e.key === ' ') && currentHandlers.done() && cfg.feedback !== 'deferred') { e.preventDefault(); currentHandlers.next(); }
  }
  document.addEventListener('keydown', onKey);

  if (cfg.timer) {
    timerId = setInterval(() => {
      state.timeLeft -= 1;
      const t = headEl.querySelector('[data-timer]');
      if (t) { t.lastChild.textContent = fmtTime(state.timeLeft); t.classList.toggle('low', state.timeLeft <= 30); }
      if (state.timeLeft <= 60 && app.director && Date.now() - state.lastLightning > 9000) { state.lastLightning = Date.now(); app.director.lightning(); }
      if (state.timeLeft <= 0) { clearInterval(timerId); if (currentHandlers && !currentHandlers.done()) finish('time'); else if (cfg.feedback === 'deferred') finish('time'); }
    }, 1000);
  }

  if (!arena) attachBand(el, { province: cfg.province || 'default' });
  el.start = next;
  el.getSummary = summary;
  const kick = setTimeout(next, 0);
  const prevCleanup = el.cleanup;
  el.cleanup = () => { clearTimeout(kick); prevCleanup(); };
  return el;
}

/** Layered feedback: verdict + explanation first; wax seals open the trap, contrast, example and mnemonic; the diagram sits beside. */
function feedbackPanel(app, q, entry, correct, res) {
  const c = entry.concept;
  const vis = safeVisual(entry);
  const seals = [
    ['trap', 'Exam trap', c.trap, 'shieldcrack'],
    ['confuse', "Don't confuse it with", c.contrast, 'swords'],
    ['example', 'Example', c.example, 'amphora'],
    ['mnemonic', 'Mnemonic', c.mnemonic, 'tablet'],
  ].filter(x => x[2]);
  const body = h('div', { class: 'seal-body' });
  const sealRow = h('div', { class: 'seals' });
  const open = new Set(correct ? [] : ['trap', 'confuse']);
  const draw = () => {
    clear(body);
    for (const [key, label, text, ico] of seals) if (open.has(key)) body.appendChild(h('div', { class: 'seal-text', dataset: { key } }, h('div', { class: 'eyebrow' }, icon(ico, { size: 14, tone: 'crimson' }), label), h('p', null, text)));
    sealRow.querySelectorAll('.seal').forEach(b => b.classList.toggle('broken', open.has(b.dataset.key)));
  };
  for (const [key, label, , ico] of seals) sealRow.appendChild(h('button', { class: 'seal', type: 'button', dataset: { key }, 'aria-expanded': String(open.has(key)), onClick: e => { const on = open.has(key); if (on) open.delete(key); else { open.add(key); app.sound('seal'); } e.currentTarget.setAttribute('aria-expanded', String(!on)); draw(); } }, h('span', { class: 'seal-wax' }, icon(ico, { size: 16, tone: 'parchment' })), h('span', { class: 'seal-label' }, label)));
  draw();
  return h('div', { class: 'feedback ' + (correct ? 'ok' : 'no') },
    h('div', { class: 'feedback-grid' + (vis ? ' with-vis' : '') },
      h('div', { class: 'feedback-main' },
        h('div', { class: 'verdict ' + (correct ? 'ok' : 'no') }, icon(correct ? 'laurel' : 'shieldcrack', { size: 22, tone: correct ? 'laurel' : 'crimson' }), correct ? 'The line holds' : 'The line breaks', res && res.xp ? h('span', { class: 'xp-gain' }, icon('coin', { size: 16, tone: 'gold' }), `+${res.xp} XP`) : null),
        h('p', { class: 'explanation' }, q.explanation),
        h('p', { class: 'small muted' }, 'Stronghold: ', h('b', null, c.term), ' · now ', MASTERY_LABELS[masteryLevel(app.state.concepts[q.concept])]),
        seals.length ? sealRow : null, body),
      vis ? h('div', { class: 'feedback-vis' }, vis) : null));
}
function safeVisual(entry) { try { return visualFor(entry.concept, entry.chapter); } catch { return null; } }

export function resultCard(app, title, sum, extra) {
  const pct = sum.answered ? sum.correct / sum.answered : 0;
  return h('div', { class: 'panel stone center result' },
    h('div', { class: 'eyebrow' }, title),
    h('div', { class: 'score-big', style: { color: pct >= 0.9 ? 'var(--good)' : pct >= 0.7 ? 'var(--gold-leaf)' : 'var(--bad)' } }, `${Math.round(pct * 100)}%`),
    h('p', { class: 'muted' }, `${sum.correct} of ${sum.answered} correct · ${fmtTime(sum.durationSec)} · +${sum.xp} XP${sum.pursuitsCleared ? ` · ${sum.pursuitsCleared} pursuit${sum.pursuitsCleared === 1 ? '' : 's'} cleared` : ''}`),
    extra || null);
}

export function missesList(app, log) {
  const misses = log.filter(l => !l.correct);
  if (!misses.length) return h('div', { class: 'empty' }, 'No ground lost. A clean field.');
  return h('div', { class: 'list' }, misses.map(l => {
    const q = app.questionOf(l.qid).question; const c = app.conceptOf(l.cid);
    return h('div', { class: 'review-item wrong' },
      h('div', { class: 'row wrap small' }, h('span', { class: 'chip ch', style: { '--ch': c.chapter.color } }, `Ch ${c.chapter.chapter}`), h('b', null, c.concept.term)),
      h('p', { class: 'small' }, q.stem),
      h('div', { class: 'opt chosen' }, l.chosen === null ? '(no answer)' : `You chose: ${l.chosen}`),
      h('div', { class: 'opt correct' }, `Answer: ${l.answer}`),
      h('p', { class: 'small muted' }, q.explanation));
  }));
}
