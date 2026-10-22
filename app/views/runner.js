// Shared question runner: renders questions one at a time, handles answering, feedback,
// keyboard shortcuts, combo/hearts/timer, and the pursuit queue for adaptive modes.
import { h, clear, floatXp, fmtTime, escapeHtml } from '../ui.js';
import { shuffleOptions, ANGLE_LABELS, pickNext, masteryLevel, MASTERY_LABELS } from '../engine.js';
import { conceptCard } from './concept.js';

const REASON_LABEL = { pursuit: '🎯 Pursuit', weak: '🩹 Weak spot', due: '⏰ Due for review', new: '✨ New', review: '🔁 Review', exam: 'Exam', boss: '👑 Boss', campaign: '🗺️ Checkpoint', blitz: '⚡ Blitz', duel: '⚔️ Duel' };

/**
 * createRunner(app, config) -> element with .cleanup()
 * config: {
 *   title, subtitle, mode, chapters: Set|null, concepts: Set|null, limit: number|null,
 *   feedback: 'immediate'|'deferred', hearts: number|null, timer: seconds|null, perQuestionTimer: seconds|null,
 *   pickOpts: {...pickNext opts}, questions: [fixed list] | null,
 *   onFinish(summary), onExit(), showLearnOnWrong: bool, pursuit: bool (default true), stopWhen(summary) -> bool
 * }
 */
export function createRunner(app, cfg) {
  const state = {
    counter: 0, recent: [], recentQids: [], pursuitQueue: [], combo: 0, hearts: cfg.hearts ?? null,
    answered: 0, correct: 0, xp: 0, log: [], fixedIdx: 0, current: null, timeLeft: cfg.timer || null, qTimeLeft: null, finished: false,
    pursuitsCleared: 0, startedAt: Date.now(),
  };
  const el = h('div', { class: 'runner' });
  let timerId = null; let qTimerId = null;
  const headEl = h('div', { class: 'runner-head' });
  const bodyEl = h('div');
  el.append(headEl, bodyEl);

  function cleanup() { clearInterval(timerId); clearInterval(qTimerId); document.removeEventListener('keydown', onKey); }
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

  // Weak-spot style: show the concept card first, then the question.
  function renderIntro(pick) {
    const entry = app.conceptOf(pick.question.concept);
    renderHead();
    clear(bodyEl);
    const go = () => renderQuestion(pick);
    bodyEl.append(
      h('div', { class: 'card tight mb', style: { '--ch': entry.chapter.color } }, h('div', { class: 'row wrap' }, h('span', { class: 'chip ch' }, 'Re-learn first'), h('span', { class: 'small muted' }, 'Read the card, then prove it with a question.'))),
      conceptCard(app, pick.question.concept, { showAngles: true }),
      h('div', { class: 'runner-foot' }, h('span', { class: 'small muted' }, 'Enter to continue'), h('button', { class: 'btn primary big', onClick: go }, 'Got it, quiz me ', h('span', { class: 'kbd' }, 'Enter'))));
    currentHandlers = { choose: () => {}, count: 0, done: () => true, next: go };
    setTimeout(() => bodyEl.querySelector('.btn.primary')?.focus(), 30);
  }

  function renderHead() {
    clear(headEl);
    const left = h('div', { class: 'row wrap' },
      h('div', null, h('div', { class: 'eyebrow' }, cfg.title || 'Practice'), cfg.subtitle ? h('div', { class: 'small muted' }, cfg.subtitle) : null));
    const right = h('div', { class: 'row wrap' });
    if (state.hearts !== null) right.appendChild(h('span', { class: 'hearts', 'aria-label': `${state.hearts} lives` }, '❤️'.repeat(Math.max(0, state.hearts)) + '🖤'.repeat(Math.max(0, (cfg.hearts || 0) - state.hearts))));
    if (state.combo >= 2) right.appendChild(h('span', { class: 'combo' }, `×${state.combo} combo`));
    right.appendChild(h('span', { class: 'chip' }, `${state.correct}/${state.answered}${cfg.limit ? ` · ${cfg.limit}` : ''}`));
    if (state.timeLeft !== null) right.appendChild(h('span', { class: 'timer' + (state.timeLeft <= 30 ? ' low' : ''), dataset: { timer: '1' } }, fmtTime(state.timeLeft)));
    if (cfg.perQuestionTimer) right.appendChild(h('span', { class: 'timer', dataset: { qtimer: '1' } }, fmtTime(state.qTimeLeft ?? cfg.perQuestionTimer)));
    right.appendChild(h('button', { class: 'btn sm ghost', onClick: () => { finish('exit'); cfg.onExit && cfg.onExit(summary()); } }, 'End'));
    headEl.append(left, right);
    if (cfg.limit) headEl.appendChild(h('div', { class: 'bar', style: { height: '6px' } }, h('div', { class: 'bar-fill', style: { width: (state.answered / cfg.limit * 100) + '%', background: 'var(--accent)' } })));
  }

  function stemHtml(q) {
    let s = escapeHtml(q.stem);
    s = s.replace(/_{3,}/g, '<span class="blank" aria-label="blank"></span>');
    return s;
  }

  let currentHandlers = null;
  function renderQuestion(pick) {
    const q = pick.question;
    const entry = app.conceptOf(q.concept);
    const ch = entry.chapter;
    const { options, answer } = shuffleOptions(q);
    const cs = app.state.concepts[q.concept];
    renderHead();
    clear(bodyEl);
    const metas = [h('span', { class: 'chip ch' }, `Ch ${ch.chapter} · ${ch.short}`), h('span', { class: 'chip' }, ANGLE_LABELS[q.angle] || q.angle), h('span', { class: 'chip' }, '●'.repeat(q.difficulty) + '○'.repeat(3 - q.difficulty))];
    if (q.source === 'official') metas.push(h('span', { class: 'chip warn' }, 'Official practice Q'));
    if (cfg.feedback !== 'deferred' && pick.reason && REASON_LABEL[pick.reason]) metas.push(h('span', { class: 'chip', style: { marginLeft: 'auto' } }, REASON_LABEL[pick.reason]));
    const card = h('div', { class: 'qcard', style: { '--ch': ch.color } });
    if (cs && cs.pursuit && cfg.feedback !== 'deferred') {
      card.appendChild(h('div', { class: 'pursuit-banner' }, '🎯 ', h('span', null, h('b', null, 'Pursuit: '), `prove you know ${entry.concept.term} — ${cs.pursuit.need - cs.pursuit.done} more right in a row`),
        h('span', { class: 'pips' }, Array.from({ length: cs.pursuit.need }, (_, i) => h('span', { class: 'pip' + (i < cs.pursuit.done ? ' on' : '') })))));
    }
    card.appendChild(h('div', { class: 'qmeta' }, metas));
    card.appendChild(h('div', { class: 'stem', html: stemHtml(q) }));
    const optEls = options.map((o, i) => h('button', { class: 'option', dataset: { i }, onClick: () => choose(i) }, h('span', { class: 'key' }, String(i + 1)), h('span', null, o)));
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
      if (cfg.feedback === 'deferred') {
        optEls.forEach((b, j) => { b.disabled = true; b.classList.toggle('picked', j === i); });
        afterAnswer(q, correct, i, options, answer, pick);
        setTimeout(next, 180);
        return;
      }
      optEls.forEach((b, j) => {
        b.disabled = true;
        if (j === answer) b.classList.add('correct');
        else if (j === i) b.classList.add('wrong');
        else b.classList.add('dim');
      });
      const res = afterAnswer(q, correct, i, options, answer, pick);
      const expl = h('div', { class: 'explain' },
        h('div', { class: 'verdict ' + (correct ? 'ok' : 'no') }, correct ? '✓ Correct' : '✗ Not quite', res && res.xp ? h('span', { class: 'mono small', style: { marginLeft: 'auto', color: 'var(--accent)' } }, `+${res.xp} XP`) : null),
        h('p', null, q.explanation),
        h('p', { class: 'small muted' }, 'Concept: ', h('b', null, entry.concept.term), ' · now ', MASTERY_LABELS[masteryLevel(app.state.concepts[q.concept])]),
        (!correct || cfg.showLearnAlways) ? h('details', { class: 'learn-more', open: !correct && cfg.showLearnOnWrong !== false }, h('summary', null, 'Review this concept'), conceptCard(app, q.concept, { compact: true, showMastery: false })) : h('details', { class: 'learn-more' }, h('summary', null, 'Review this concept'), conceptCard(app, q.concept, { compact: true, showMastery: false })),
      );
      card.appendChild(expl);
      if (res && res.xp) floatXp(optEls[answer], `+${res.xp} XP`);
      const cont = h('button', { class: 'btn primary big', onClick: next }, 'Continue ', h('span', { class: 'kbd' }, 'Enter'));
      foot.append(h('span', { class: 'small muted' }, 'Keys 1–5 answer · Enter continues'), cont);
      setTimeout(() => cont.focus(), 30);
      if (state.hearts !== null && state.hearts <= 0) { setTimeout(() => finish('hearts'), 900); }
      if (state.timeLeft !== null && state.timeLeft <= 0) { setTimeout(() => finish('time'), 900); }
      expl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    if (correct) { state.combo++; state.correct++; } else { state.combo = 0; if (state.hearts !== null) { state.hearts--; app.sound('heart'); } }
    const res = app.answer(q, correct, { mode: cfg.mode, combo: state.combo });
    state.xp += res.xp;
    if (correct) app.sound('correct'); else app.sound('wrong');
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
      if (t) { t.textContent = fmtTime(state.timeLeft); t.classList.toggle('low', state.timeLeft <= 30); }
      if (state.timeLeft <= 0) { clearInterval(timerId); if (currentHandlers && !currentHandlers.done()) finish('time'); else if (cfg.feedback === 'deferred') finish('time'); }
    }, 1000);
  }

  el.start = next;
  el.getSummary = summary;
  const kick = setTimeout(next, 0);
  const prevCleanup = el.cleanup;
  el.cleanup = () => { clearTimeout(kick); prevCleanup(); };
  return el;
}

export function resultCard(app, title, sum, extra) {
  const pct = sum.answered ? sum.correct / sum.answered : 0;
  return h('div', { class: 'card center' },
    h('div', { class: 'eyebrow' }, title),
    h('div', { class: 'score-big', style: { color: pct >= 0.9 ? 'var(--good)' : pct >= 0.7 ? 'var(--accent)' : 'var(--bad)' } }, `${Math.round(pct * 100)}%`),
    h('p', { class: 'muted' }, `${sum.correct} of ${sum.answered} correct · ${fmtTime(sum.durationSec)} · +${sum.xp} XP${sum.pursuitsCleared ? ` · ${sum.pursuitsCleared} pursuit${sum.pursuitsCleared === 1 ? '' : 's'} cleared` : ''}`),
    extra || null);
}

export function missesList(app, log) {
  const misses = log.filter(l => !l.correct);
  if (!misses.length) return h('div', { class: 'empty' }, 'No misses. Clean sheet.');
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
