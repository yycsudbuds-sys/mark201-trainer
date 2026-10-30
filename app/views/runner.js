// Shared question runner: one question at a time, keyboard first (1–5 answer, Enter advances).
// Presentation: parchment question panel over the scene, carved answer tablets with bronze coin keys,
// a layered feedback panel with wax seals, the +XP coin flying to the XP bar, and the front-line band.
// The study logic (pickNext, pursuits, app.answer) is untouched.
import { h, clear, coinFlight, fmtTime } from '../ui.js';
import { shuffleOptions, ANGLE_LABELS, pickNext, masteryLevel, MASTERY_LABELS } from '../engine.js';
import { conceptCard, figureEl } from './concept.js';
import { visualFor } from '../visuals.js';
import { attachBattle } from '../battle.js';
import { richText, icon } from '../icons.js';
import { getCosmetic, getDenarii, addDenarii } from '../cosmetic.js';
import { vignetteFor } from '../vignettes.js';

const REASON_LABEL = { pursuit: 'Pursuit', weak: 'Weak spot', due: 'Due for review', new: 'New ground', review: 'Review', exam: 'Midterm', boss: 'Chapter boss', campaign: 'Checkpoint', blitz: 'Blitz', duel: 'Duel' };
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
  const inlineBand = !arena && window.matchMedia('(max-height: 700px), (max-width: 640px)').matches;
  const state = {
    counter: 0, recent: [], recentQids: [], pursuitQueue: [], combo: 0, hearts: cfg.hearts ?? null,
    answered: 0, correct: 0, xp: 0, log: [], fixedIdx: 0, current: null, timeLeft: cfg.timer || null, qTimeLeft: null, finished: false,
    pursuitsCleared: 0, startedAt: Date.now(), lastLightning: 0, furyMark: 0,
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
    const won = reason === 'goal' || (cfg.siege && state.correct >= cfg.siege.needed);
    if (cfg.feedback === 'deferred' && state.correct) addDenarii(state.correct, 'great battle');
    if (won && el.battlefield && !el.battlefield.inline) { el.battlefield.win(); el.battlefield.deferDestroy(2800); if (!cfg.siege) { app.sound('rout'); setTimeout(() => app.sound('horn'), 500); } }
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
    if (pick.question.type === 'gen') { const made = app.pack && app.pack.generate ? app.pack.generate(pick.question) : null; if (!made) return finish('exhausted'); pick.question = made; }
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
    if (cfg.feedback !== 'deferred') { const fury = Math.min(8, state.combo - state.furyMark); right.appendChild(h('span', { class: 'fury' + (fury >= 8 ? ' ready' : ''), title: fury >= 8 ? "Imperator's Favor: the next correct answer pays double denarii" : `Fury ${fury}/8: eight in a row earns the Imperator's Favor` }, h('span', { class: 'fury-track' }, h('span', { class: 'fury-fill', style: { width: (fury / 8 * 100) + '%' } })), fury >= 8 ? icon('aquila', { size: 14, tone: 'gold' }) : null)); }
    right.appendChild(h('span', { class: 'chip' }, `${state.correct}/${state.answered}${cfg.limit ? ` · ${cfg.limit}` : ''}`));
    if (state.timeLeft !== null) right.appendChild(h('span', { class: 'timer' + (state.timeLeft <= 30 ? ' low' : ''), dataset: { timer: '1' } }, icon('waterclock', { size: 14, tone: 'mono' }), fmtTime(state.timeLeft)));
    if (cfg.perQuestionTimer) right.appendChild(h('span', { class: 'timer', dataset: { qtimer: '1' } }, fmtTime(state.qTimeLeft ?? cfg.perQuestionTimer)));
    right.appendChild(h('button', { class: 'btn sm ghost', onClick: () => { finish('exit'); cfg.onExit && cfg.onExit(summary()); } }, 'End'));
    headEl.append(left, right);
    if (cfg.siege) headEl.appendChild(wallBar());
    else if (cfg.limit) headEl.appendChild(h('div', { class: 'bar', style: { height: '6px' } }, h('div', { class: 'bar-fill', style: { width: (state.answered / cfg.limit * 100) + '%', background: 'var(--gold-leaf)' } })));
  }
  /** Siege: the wall integrity bar replaces the plain progress bar. */
  function wallBar() {
    const integ = el.battlefield && el.battlefield.integrity ? el.battlefield.integrity() : Math.max(0, 1 - state.correct / (cfg.siege.needed || 1));
    return h('div', { class: 'wall-bar', title: `Wall integrity ${Math.round(integ * 100)}% · ${state.answered}/${cfg.limit} questions` },
      h('span', { class: 'wall-label' }, icon('gate', { size: 14, tone: 'gold' }), 'Wall'),
      h('div', { class: 'wall-track' }, h('div', { class: 'wall-fill', style: { width: (integ * 100) + '%' } })),
      h('span', { class: 'wall-pct' }, `${Math.round(integ * 100)}%`),
      h('span', { class: 'small muted' }, `${state.answered}/${cfg.limit}`));
  }

  let currentHandlers = null; let hoverTick = 0;
  /** A new question starts at the top of its scroll container (never scrolls mid-answer). */
  function scrollToTop() {
    requestAnimationFrame(() => {
      const sc = el.closest('.main');
      if (sc && getComputedStyle(sc).overflowY === 'auto') { if (sc.scrollTop > 0) sc.scrollTop = 0; }
      else if (headEl.getBoundingClientRect().top < 0) window.scrollTo({ top: 0 });
    });
  }
  function renderQuestion(pick) {
    const q = pick.question;
    if (q.type === 'numeric' || q.type === 'multistep') return renderNumeric(pick);
    const entry = app.conceptOf(q.concept);
    const ch = entry.chapter;
    const { options, answer } = shuffleOptions(q);
    const cs = app.state.concepts[q.concept];
    renderHead(); clear(bodyEl);
    scrollToTop();
    const metas = [h('span', { class: 'chip ch' }, `Ch ${ch.chapter} · ${ch.short}`), h('span', { class: 'chip' }, ANGLE_LABELS[q.angle] || q.angle),
      h('span', { class: 'chip pips', title: `Difficulty ${q.difficulty} of 3` }, Array.from({ length: 3 }, (_, i) => h('span', { class: 'pip' + (i < q.difficulty ? ' on' : '') })))];
    if (q.source === 'official') metas.push(h('span', { class: 'chip warn' }, 'Official practice Q'));
    if (cfg.feedback !== 'deferred' && pick.reason && REASON_LABEL[pick.reason]) metas.push(h('span', { class: 'chip reason' }, icon(REASON_ICON[pick.reason] || 'pilum', { size: 14, tone: 'gold' }), REASON_LABEL[pick.reason]));
    const card = h('div', { class: 'qcard panel parchment', style: { '--ch': ch.color } });
    if (cs && cs.pursuit && cfg.feedback !== 'deferred') {
      card.appendChild(h('div', { class: 'pursuit-banner' }, icon('standard', { size: 18, tone: 'crimson' }), h('span', null, h('b', null, 'Pursuit: '), `prove you know ${entry.concept.term} — ${cs.pursuit.need - cs.pursuit.done} more right in a row`),
        h('span', { class: 'pips' }, Array.from({ length: cs.pursuit.need }, (_, i) => h('span', { class: 'pip' + (i < cs.pursuit.done ? ' on' : '') })))));
    }
    card.appendChild(h('div', { class: 'qhead' }, h('div', { class: 'qicon' }, icon(app.chapterIcon(ch.chapter), { size: 28, tone: 'gold' })), h('div', { class: 'qmeta' }, metas)));
    const stemEl = h('div', { class: 'stem' }, richText(q.stem));
    stemEl.querySelectorAll('.blank').forEach(b => { b.classList.add('wax-slot'); b.setAttribute('aria-label', 'blank: press a number or drag an answer here'); });
    const isFill = q.type === 'fill' || stemEl.querySelector('.wax-slot');
    const vig = (q.angle === 'identify' || q.angle === 'apply') && !isFill ? vignetteFor(ch.chapter) : null;
    card.appendChild(vig ? h('div', { class: 'stem-row' }, stemEl, h('div', { class: 'vignette', 'aria-hidden': 'true' }, vig)) : stemEl);
    if (q.angle === 'calc') card.appendChild(abacusDrawer(app));
    const fig = figureForQuestion(app, q, entry);
    if (fig) {
      const body = h('div', { class: 'qfigure-body' }, fig.el);
      if (cfg.feedback === 'deferred') { // the real exam will not show it: keep it one tap away
        const btn = h('button', { class: 'btn sm ghost', type: 'button', onClick: () => { body.classList.toggle('open'); btn.textContent = body.classList.contains('open') ? 'Hide the figure' : 'Show the figure'; } }, 'Show the figure');
        card.appendChild(h('div', { class: 'qfigure' }, h('div', { class: 'row between wrap' }, h('div', { class: 'eyebrow' }, icon('scroll', { size: 14, tone: 'gold' }), fig.label || 'Reference'), btn), body));
      } else card.appendChild(h('div', { class: 'qfigure' }, h('div', { class: 'eyebrow' }, icon('scroll', { size: 14, tone: 'gold' }), fig.label || 'Reference'), body.classList.add('open') || body));
    }
    const isTF = q.type === 'tf' && options.length === 2;
    const optEls = options.map((o, i) => isTF
      ? h('button', { class: 'option thumb ' + (/^true$/i.test(o) ? 'up' : 'down'), dataset: { i }, onClick: () => choose(i), onPointerenter: () => { const t = performance.now(); if (t - hoverTick > 120) { hoverTick = t; app.sound('tick'); } }, onPointerdown: () => app.sound('knock') },
        h('span', { class: 'key coin' }, h('span', { class: 'key-n' }, String(i + 1))), thumbSvg(/^true$/i.test(o)), h('span', { class: 'opt-text' }, o), h('span', { class: 'thumb-sub' }, /^true$/i.test(o) ? 'Pollice verso up' : 'Pollice verso down'), h('span', { class: 'laurel-mark' }, icon('laurel', { size: 22, tone: 'gold' })))
      : h('button', { class: 'option tablet' + (isFill ? ' draggable' : ''), dataset: { i },
        onClick: () => { if (dragMovedIdx === i) { dragMovedIdx = -1; return; } choose(i); },
        onPointerenter: () => { const t = performance.now(); if (t - hoverTick > 120) { hoverTick = t; app.sound('tick'); } },
        onPointerdown: ev => { app.sound('knock'); if (isFill) startSlotDrag(ev, i); } },
        h('span', { class: 'key coin' }, h('span', { class: 'key-n' }, String(i + 1))), h('span', { class: 'opt-text' }, richText(o, { blanks: false })), h('span', { class: 'laurel-mark' }, icon('laurel', { size: 22, tone: 'gold' }))));
    let dragMovedIdx = -1;
    function startSlotDrag(ev, i) {
      const tok = optEls[i]; const start = { x: ev.clientX, y: ev.clientY }; let ghost = null; let moved = false;
      const onMove = e => { const dx = e.clientX - start.x, dy = e.clientY - start.y; if (!moved && Math.hypot(dx, dy) < 8) return; if (!moved) { moved = true; try { tok.setPointerCapture(e.pointerId); } catch { /* ignore */ } ghost = h('div', { class: 'slot-ghost' }, options[i]); document.body.appendChild(ghost); app.sound('rustle'); stemEl.classList.add('slot-target'); } ghost.style.transform = `translate(${e.clientX + 12}px, ${e.clientY - 18}px)`; e.preventDefault(); };
      const onUp = e => { tok.removeEventListener('pointermove', onMove); tok.removeEventListener('pointerup', onUp); tok.removeEventListener('pointercancel', onUp); if (!moved) return; dragMovedIdx = i; ghost && ghost.remove(); stemEl.classList.remove('slot-target'); const under = document.elementFromPoint(e.clientX, e.clientY); if (under && under.closest && under.closest('.stem')) choose(i); };
      tok.addEventListener('pointermove', onMove); tok.addEventListener('pointerup', onUp); tok.addEventListener('pointercancel', onUp);
    }
    // the confidence wager: cosmetic denarii only, keys Q W E, never in deferred (exam) mode
    const wagerOn = cfg.feedback !== 'deferred' && getCosmetic().wagers !== false;
    let wager = 0; let wagerEl = null;
    if (wagerOn) {
      wagerEl = h('div', { class: 'wager' }, h('span', { class: 'wager-label' }, icon('coin', { size: 14, tone: 'gold' }), 'Wager'),
        [1, 2, 3].map((n, k) => h('button', { class: 'wager-coin', type: 'button', dataset: { n }, title: `Bet ${n} denari${n === 1 ? 'us' : 'i'} (${'QWE'[k]})`, onClick: () => setWager(n) }, h('span', { class: 'wager-key' }, 'QWE'[k]), h('b', null, String(n)))),
        h('span', { class: 'small muted wager-bal' }, `${getDenarii()} denarii`));
      card.appendChild(wagerEl);
    }
    function setWager(n) { if (done) return; wager = wager === n ? 0 : n; wagerEl.querySelectorAll('.wager-coin').forEach(b => b.classList.toggle('on', Number(b.dataset.n) === wager)); app.sound('coin'); }
    if (el.battlefield && el.battlefield.inline) card.appendChild(el.battlefield); // short screens: the battle is a strip above the answers
    card.appendChild(h('div', { class: 'options' + (isTF ? ' thumbs' : '') }, optEls));
    if (cs && cs.pursuit && cfg.feedback !== 'deferred' && el.battlefield && el.battlefield.plantFlag) el.battlefield.plantFlag(q.concept);
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
      if (isFill && i >= 0) { const parts = String(options[i]).split(/\s*;\s*|\s+\/\s+/); stemEl.querySelectorAll('.wax-slot').forEach((slot, k) => { slot.textContent = parts[Math.min(k, parts.length - 1)]; slot.classList.add('filled'); }); app.sound('stylus'); }
      if (isTF) { card.classList.add(correct ? 'crowd-cheer' : 'crowd-boo'); app.sound('thumbs', { up: correct }); }
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
      let dn = correct ? 1 : 0; if (wager) dn += correct ? wager : -wager;
      let favor = false;
      if (correct && state.combo - 1 - state.furyMark >= 8) { favor = true; dn = Math.max(2, dn * 2); state.furyMark = state.combo; app.sound('fanfare'); const fx = h('div', { class: 'favor' }, icon('aquila', { size: 42, tone: 'gold' }), h('div', null, h('div', { class: 'favor-title' }, "Imperator's Favor"), h('div', { class: 'small' }, 'Double denarii for eight in a row'))); document.body.appendChild(fx); setTimeout(() => fx.remove(), 2200); }
      if (!correct) state.furyMark = 0;
      if (dn !== 0) { const bal = getDenarii(); dn = Math.max(dn, -bal); addDenarii(dn, wager ? 'wager' : 'answer'); if (dn > 0) app.sound('coins'); }
      if (wagerEl) wagerEl.classList.add('settled');
      if (cfg.siege) { const old = headEl.querySelector('.wall-bar'); if (old) old.replaceWith(wallBar()); }
      card.appendChild(feedbackPanel(app, q, entry, correct, res, dn, wager));
      if (res && res.xp) coinFlight(optEls[answer], res.xp);
      const cont = h('button', { class: 'btn primary big', onClick: next }, 'Advance ', h('span', { class: 'kbd' }, 'Enter'));
      foot.append(h('span', { class: 'small muted' }, 'Keys 1–5 answer · Enter advances'), cont);
      setTimeout(() => cont.focus({ preventScroll: true }), 30);
      if (state.hearts !== null && state.hearts <= 0) setTimeout(() => finish('hearts'), 900);
      if (state.timeLeft !== null && state.timeLeft <= 0) setTimeout(() => finish('time'), 900);
    }
    currentHandlers = { choose, count: options.length, done: () => done, next, setWager: wagerOn ? setWager : null };
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

  /** Typed answers: one box with a unit (numeric), or one box per intermediate step (multistep). A wrong one-shot
   *  answer is diagnosed against the question's error library and can be broken into steps; every step shows the
   *  professor's working. Exam mode records the typed value and moves on. */
  function renderNumeric(pick) {
    const q = pick.question;
    const entry = app.conceptOf(q.concept);
    const ch = entry.chapter;
    const cs = app.state.concepts[q.concept];
    renderHead(); clear(bodyEl);
    scrollToTop();
    const stepMode0 = q.type === 'multistep';
    const metas = [h('span', { class: 'chip ch' }, `Ch ${ch.chapter} · ${ch.short}`), h('span', { class: 'chip' }, stepMode0 ? 'Step by step' : 'Typed answer'),
      h('span', { class: 'chip pips', title: `Difficulty ${q.difficulty} of 3` }, Array.from({ length: 3 }, (_, i) => h('span', { class: 'pip' + (i < q.difficulty ? ' on' : '') })))];
    if (q.source === 'official') metas.push(h('span', { class: 'chip warn' }, 'Official practice Q'));
    if (cfg.feedback !== 'deferred' && pick.reason && REASON_LABEL[pick.reason]) metas.push(h('span', { class: 'chip reason' }, icon(REASON_ICON[pick.reason] || 'pilum', { size: 14, tone: 'gold' }), REASON_LABEL[pick.reason]));
    const card = h('div', { class: 'qcard panel parchment numeric', style: { '--ch': ch.color } });
    if (cs && cs.pursuit && cfg.feedback !== 'deferred') card.appendChild(h('div', { class: 'pursuit-banner' }, icon('standard', { size: 18, tone: 'crimson' }), h('span', null, h('b', null, 'Pursuit: '), `prove you know ${entry.concept.term} — ${cs.pursuit.need - cs.pursuit.done} more right in a row`), h('span', { class: 'pips' }, Array.from({ length: cs.pursuit.need }, (_, i) => h('span', { class: 'pip' + (i < cs.pursuit.done ? ' on' : '') })))));
    card.appendChild(h('div', { class: 'qhead' }, h('div', { class: 'qicon' }, icon(app.chapterIcon(ch.chapter), { size: 28, tone: 'gold' })), h('div', { class: 'qmeta' }, metas)));
    card.appendChild(h('div', { class: 'stem' }, richText(q.stem, { blanks: false })));
    card.appendChild(abacusDrawer(app));
    const fig = figureForQuestion(app, q, entry);
    if (fig) card.appendChild(h('div', { class: 'qfigure' }, h('div', { class: 'eyebrow' }, icon('scroll', { size: 14, tone: 'gold' }), fig.label || 'Reference'), h('div', { class: 'qfigure-body open' }, fig.el)));
    if (el.battlefield && el.battlefield.inline) card.appendChild(el.battlefield);
    if (cs && cs.pursuit && cfg.feedback !== 'deferred' && el.battlefield && el.battlefield.plantFlag) el.battlefield.plantFlag(q.concept);
    const work = h('div', { class: 'numeric-work' }); card.appendChild(work);
    bodyEl.appendChild(card);
    const foot = h('div', { class: 'runner-foot' }); bodyEl.appendChild(foot);
    let done = false; let recorded = false; let stepMode = stepMode0; let stepIdx = 0; const stepResults = [];
    const steps = Array.isArray(q.steps) ? q.steps : [];

    function box(unit, tol, onSubmit, placeholder) {
      const input = h('input', { type: 'text', class: 'num-in', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', placeholder: placeholder || (unit === '$' ? 'e.g. 1,234.56' : unit === '%' ? 'e.g. 12.5' : 'number'), 'aria-label': 'Your answer' });
      const btn = h('button', { class: 'btn primary', type: 'button', onClick: () => onSubmit(input.value) }, 'Answer ', h('span', { class: 'kbd' }, 'Enter'));
      input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); onSubmit(input.value); } });
      const row = h('div', { class: 'num-row' }, unit === '$' ? h('span', { class: 'num-unit' }, '$') : null, input, unit && unit !== '$' ? h('span', { class: 'num-unit' }, unitLabel(unit)) : null, btn);
      const hint = h('div', { class: 'tiny muted num-hint' }, `Accepted within ${tolText(tol, unit)}. Commas, $ and % are fine.`);
      setTimeout(() => input.focus({ preventScroll: true }), 30);
      return { row, hint, input };
    }
    function oneShot() {
      clear(work);
      const b = box(q.unit, q.tolerance, submitFinal);
      work.append(h('div', { class: 'eyebrow' }, icon('tablet', { size: 13, tone: 'gold' }), 'Your answer'), b.row, b.hint);
      currentHandlers = { choose: () => {}, count: 0, done: () => done, next, setWager: null };
    }
    function submitFinal(raw) {
      if (done) return;
      const v = parseNumber(raw); if (v === null) { app.sound('wrong'); work.querySelector('.num-in')?.classList.add('shake'); setTimeout(() => work.querySelector('.num-in')?.classList.remove('shake'), 400); return; }
      done = true;
      const val = coerceUnit(v, q.answer, q.unit);
      const correct = within(val, q.answer, q.tolerance);
      const typed = { chosen: fmtNum(val, q.unit), answer: fmtNum(q.answer, q.unit) };
      if (cfg.feedback === 'deferred') { afterAnswer(q, correct, -1, [], -1, pick, typed); recorded = true; work.querySelectorAll('input,button').forEach(x => { x.disabled = true; }); setTimeout(next, 220); return; }
      const res = afterAnswer(q, correct, -1, [], -1, pick, typed); recorded = true;
      let dn = correct ? 1 : 0; if (correct && state.combo - 1 - state.furyMark >= 8) { dn = 2; state.furyMark = state.combo; app.sound('fanfare'); } if (!correct) state.furyMark = 0;
      if (dn) { addDenarii(dn, 'answer'); app.sound('coins'); }
      if (cfg.siege) { const old = headEl.querySelector('.wall-bar'); if (old) old.replaceWith(wallBar()); }
      const diag = correct ? null : diagnose(q, val);
      if (diag) logCalcError(app, diag, q);
      work.querySelectorAll('input,button').forEach(x => { x.disabled = true; });
      card.appendChild(numericFeedback(app, q, entry, correct, res, { typed: val, diag, dn }));
      if (res && res.xp) coinFlight(work, res.xp);
      const cont = h('button', { class: 'btn primary big', onClick: next }, 'Advance ', h('span', { class: 'kbd' }, 'Enter'));
      if (!correct && steps.length >= 2) foot.appendChild(h('button', { class: 'btn', type: 'button', onClick: () => { foot.innerHTML = ''; card.querySelector('.feedback')?.remove(); stepMode = true; stepIdx = 0; done = false; renderSteps(true); } }, icon('scroll', { size: 14, tone: 'gold' }), ' Break it into steps'));
      foot.append(h('span', { class: 'small muted' }, 'Enter advances'), cont);
      setTimeout(() => cont.focus({ preventScroll: true }), 30);
      if (state.hearts !== null && state.hearts <= 0) setTimeout(() => finish('hearts'), 900);
      if (state.timeLeft !== null && state.timeLeft <= 0) setTimeout(() => finish('time'), 900);
    }
    function renderSteps(remedial) {
      clear(work);
      const list = h('ol', { class: 'num-steps' });
      steps.forEach((st, i) => {
        const li = h('li', { class: 'num-step' + (i < stepIdx ? (stepResults[i] ? ' ok' : ' no') : i === stepIdx ? ' now' : ' ahead') });
        li.append(h('div', { class: 'num-step-label' }, h('span', { class: 'num-step-n' }, String(i + 1)), st.label, st.unit ? h('span', { class: 'tiny muted' }, ` (${unitLabel(st.unit)})`) : null));
        if (i < stepIdx) li.append(h('div', { class: 'num-step-val' }, stepResults[i] ? icon('check', { size: 14, tone: 'laurel' }) : icon('cross', { size: 14, tone: 'crimson' }), ` ${fmtNum(st.value, st.unit || '')}${stepResults[i] ? '' : ` (you entered ${fmtNum(stepResults.typed[i], st.unit || '')})`}`));
        if (i === stepIdx) { const b = box(st.unit || '', st.tolerance, raw => submitStep(raw, remedial), 'this step'); li.append(b.row, b.hint); }
        list.appendChild(li);
      });
      work.append(h('div', { class: 'eyebrow' }, icon('tablet', { size: 13, tone: 'gold' }), remedial ? 'Again, step by step' : 'Enter each step'), list);
      currentHandlers = { choose: () => {}, count: 0, done: () => done, next, setWager: null };
    }
    function submitStep(raw, remedial) {
      if (done) return;
      const st = steps[stepIdx]; const v = parseNumber(raw); if (v === null) { app.sound('wrong'); return; }
      const val = coerceUnit(v, st.value, st.unit || ''); const ok = within(val, st.value, st.tolerance || { rel: 0.005, abs: 0.01 });
      stepResults.typed = stepResults.typed || []; stepResults.typed[stepIdx] = val; stepResults[stepIdx] = ok;
      app.sound(ok ? 'correct' : 'wrong'); stepIdx++;
      if (stepIdx < steps.length) { renderSteps(remedial); return; }
      done = true;
      const allOk = stepResults.every(Boolean); const firstWrong = stepResults.findIndex(x => !x);
      renderSteps(remedial);
      work.querySelectorAll('input,button').forEach(x => { x.disabled = true; });
      let res = null;
      if (!recorded) {
        const typed = { chosen: fmtNum(stepResults.typed[steps.length - 1], steps[steps.length - 1].unit || q.unit), answer: fmtNum(q.answer, q.unit) };
        if (cfg.feedback === 'deferred') { afterAnswer(q, allOk, -1, [], -1, pick, typed); recorded = true; setTimeout(next, 220); return; }
        res = afterAnswer(q, allOk, -1, [], -1, pick, typed); recorded = true;
        if (allOk) { addDenarii(1, 'answer'); app.sound('coins'); } else state.furyMark = 0;
        if (cfg.siege) { const old = headEl.querySelector('.wall-bar'); if (old) old.replaceWith(wallBar()); }
      }
      const diag = allOk ? null : { id: 'step-' + (firstWrong + 1), label: `First wrong step: ${steps[firstWrong].label}`, explain: `Expected ${fmtNum(steps[firstWrong].value, steps[firstWrong].unit || '')}, you entered ${fmtNum(stepResults.typed[firstWrong], steps[firstWrong].unit || '')}. Everything after it inherits the slip.` };
      if (diag && !remedial) logCalcError(app, { id: 'step-' + (firstWrong + 1) + '-' + (steps[firstWrong].label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40), label: diag.label }, q);
      card.appendChild(numericFeedback(app, q, entry, allOk, res, { typed: stepResults.typed[steps.length - 1], diag, dn: allOk && !recorded ? 1 : 0, stepped: true, remedial }));
      if (res && res.xp) coinFlight(work, res.xp);
      const cont = h('button', { class: 'btn primary big', onClick: next }, 'Advance ', h('span', { class: 'kbd' }, 'Enter'));
      foot.innerHTML = ''; foot.append(h('span', { class: 'small muted' }, 'Enter advances'), cont);
      setTimeout(() => cont.focus({ preventScroll: true }), 30);
      if (state.hearts !== null && state.hearts <= 0) setTimeout(() => finish('hearts'), 900);
      if (state.timeLeft !== null && state.timeLeft <= 0) setTimeout(() => finish('time'), 900);
    }
    if (stepMode && steps.length >= 2) renderSteps(false); else oneShot();
    if (cfg.perQuestionTimer) {
      state.qTimeLeft = cfg.perQuestionTimer; clearInterval(qTimerId);
      qTimerId = setInterval(() => { state.qTimeLeft -= 1; const t = headEl.querySelector('[data-qtimer]'); if (t) { t.textContent = fmtTime(state.qTimeLeft); t.classList.toggle('low', state.qTimeLeft <= 5); } if (state.qTimeLeft <= 0) { clearInterval(qTimerId); if (!done) submitFinal('0'); } }, 1000);
    }
  }

  function afterAnswer(q, correct, chosenIdx, options, answerIdx, pick, typed = null) {
    state.answered++;
    if (correct) { state.combo++; state.correct++; } else { state.combo = 0; if (state.hearts !== null) { state.hearts--; app.sound('shieldcrack'); } }
    // Battlefield / arena reactions. Purely visual; never delays the quiz.
    const reveal = cfg.feedback !== 'deferred'; // the Great Battle gives nothing away until the end
    if (el.battlefield && !reveal) el.battlefield.advance(0);
    else if (el.battlefield) {
      if (cfg.siege) {
        if (correct) { el.battlefield.hit(); app.sound('ballista'); setTimeout(() => app.sound('impact'), 420); if (state.correct >= cfg.siege.needed && !state.breached) { state.breached = true; el.battlefield.breach(); el.battlefield.surrender(); app.sound('gate'); setTimeout(() => app.sound('crumble'), 350); setTimeout(() => app.sound('charge'), 1000); setTimeout(() => app.sound('fanfare'), 2000); } }
        else { el.battlefield.miss(); el.battlefield.randomTaunt(); setTimeout(() => app.sound('pila'), 250); }
      } else if (correct) el.battlefield.advance(state.combo); else el.battlefield.setback();
    }
    if (app.director) app.director.react(correct ? 'cheer' : 'jeer');
    const res = app.answer(q, correct, { mode: cfg.mode, combo: state.combo });
    state.xp += res.xp;
    if (!reveal) { app.sound('knock'); app.sound('pila'); }
    else if (correct) { app.sound('correct'); if (!arena && !cfg.siege) app.sound('pila'); if (state.combo >= 2) app.sound('combo', { n: state.combo }); if (state.combo === 3 && !cfg.siege) app.sound('impact'); if (state.combo === 5 && !cfg.siege) app.sound('charge'); }
    else { app.sound('wrong'); if (!arena && !cfg.siege) app.sound('shieldcrack'); }
    for (const ev of res.events) {
      if (ev.type === 'pursuitCleared') { state.pursuitsCleared++; app.state.stats.pursuitsCleared = (app.state.stats.pursuitsCleared || 0) + 1; if (cfg.feedback !== 'deferred') addDenarii(5, 'pursuit'); }
      if (reveal && el.battlefield && el.battlefield.plantFlag) { if (ev.type === 'pursuitStarted') el.battlefield.plantFlag(ev.cid); else if (ev.type === 'pursuitCleared') el.battlefield.clearFlag(ev.cid); }
    }
    // Pursuit scheduling (adaptive modes only)
    if (cfg.pursuit !== false && !cfg.questions) {
      const cs = app.state.concepts[q.concept];
      if (cs && cs.pursuit) {
        const gap = correct ? (cs.pursuit.done === 1 ? 4 : 6) : 3;
        if (!state.pursuitQueue.some(p => p.cid === q.concept)) state.pursuitQueue.push({ cid: q.concept, notBefore: state.counter + gap });
        else state.pursuitQueue.forEach(p => { if (p.cid === q.concept) p.notBefore = state.counter + gap; });
      }
    }
    state.log.push({ qid: q.id, cid: q.concept, correct, chosen: typed ? typed.chosen : (chosenIdx >= 0 ? options[chosenIdx] : null), answer: typed ? typed.answer : options[answerIdx], reason: pick.reason, t: Date.now(), seed: q.seed || undefined });
    if (cfg.onAnswer) cfg.onAnswer({ q, correct, summary: summary() });
    return res;
  }

  function onKey(e) {
    if (!currentHandlers) return;
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= currentHandlers.count && !currentHandlers.done()) { e.preventDefault(); currentHandlers.choose(n - 1); }
    else if (currentHandlers.setWager && /^[qweQWE]$/.test(e.key) && !currentHandlers.done()) { e.preventDefault(); currentHandlers.setWager('qwe'.indexOf(e.key.toLowerCase()) + 1); }
    else if (/^[aA]$/.test(e.key) && !e.ctrlKey && !e.metaKey) { const d = el.querySelector('.abacus'); if (d) { e.preventDefault(); d.classList.toggle('open'); if (d.classList.contains('open')) { d.querySelector('input')?.focus(); app.sound('rustle'); } } }
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

  if (!arena) attachBattle(el, { province: cfg.province || 'default', mode: cfg.siege ? 'siege' : 'field', needed: cfg.siege ? cfg.siege.needed : 0, motion: app.state.settings.motion !== false && !window.matchMedia('(prefers-reduced-motion: reduce)').matches, inline: inlineBand });
  el.start = next;
  el.getSummary = summary;
  el.getCurrent = () => state.current; // tests and the console peek at the live question
  const kick = setTimeout(next, 0);
  const prevCleanup = el.cleanup;
  el.cleanup = () => { clearTimeout(kick); prevCleanup(); };
  return el;
}

/** Layered feedback: verdict + explanation first; wax seals open the trap, contrast, example and mnemonic; the diagram sits beside. */
function feedbackPanel(app, q, entry, correct, res, dn = 0, wager = 0) {
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
        h('div', { class: 'verdict ' + (correct ? 'ok' : 'no') }, icon(correct ? 'laurel' : 'shieldcrack', { size: 22, tone: correct ? 'laurel' : 'crimson' }), correct ? 'The line holds' : 'The line breaks', res && res.xp ? h('span', { class: 'xp-gain' }, icon('coin', { size: 16, tone: 'gold' }), `+${res.xp} XP`) : null, dn ? h('span', { class: 'dn-gain ' + (dn > 0 ? 'win' : 'loss') }, `${dn > 0 ? '+' : ''}${dn} denari${Math.abs(dn) === 1 ? 'us' : 'i'}${wager ? ' · wager' : ''}`) : null),
        h('p', { class: 'explanation' }, q.explanation),
        h('p', { class: 'small muted' }, 'Stronghold: ', h('b', null, c.term), ' · now ', MASTERY_LABELS[masteryLevel(app.state.concepts[q.concept])]),
        seals.length ? sealRow : null, body),
      vis ? h('div', { class: 'feedback-vis' }, vis) : null));
}
// ---- typed answers: parsing, tolerance, diagnosis, worked solutions
export function parseNumber(raw) {
  let t = String(raw ?? '').trim().replace(/[\s,$]/g, '').replace(/[−–]/g, '-').replace(/%|x$|×$/gi, '').replace(/years?$/i, '').replace(/shares?$/i, '');
  if (/^\(.*\)$/.test(t)) t = '-' + t.slice(1, -1);
  if (!t || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(t)) return null;
  const v = Number(t); return Number.isFinite(v) ? v : null;
}
/** Rates typed as decimals (0.125 for 12.5%) are accepted when the answer is clearly a percentage. */
export function coerceUnit(v, answer, unit) { if (unit === '%' && Math.abs(v) < 1 && Math.abs(answer) >= 1 && Math.abs(v * 100 - answer) < Math.abs(v - answer)) return v * 100; return v; }
export function within(v, target, tol) { tol = tol || {}; const a = tol.abs, r = tol.rel; if (a === undefined && r === undefined) return Math.abs(v - target) <= 0.01 + 1e-9; return (a !== undefined && Math.abs(v - target) <= a + 1e-9) || (r !== undefined && Math.abs(v - target) <= Math.abs(target) * r + 1e-9); }
export function tolText(tol, unit) { tol = tol || { abs: 0.01 }; const parts = []; if (tol.abs !== undefined) parts.push('±' + fmtNum(tol.abs, unit)); if (tol.rel !== undefined) parts.push('±' + (tol.rel * 100).toFixed(1) + '% of the answer'); return parts.join(' or '); }
export function unitLabel(unit) { return { '$': '$', '%': '% per annum', years: 'years', shares: 'shares', x: '×', '': '' }[unit] ?? unit; }
export function fmtNum(v, unit) {
  if (v === null || v === undefined || !Number.isFinite(v)) return '—';
  const neg = v < 0; const a = Math.abs(v);
  if (unit === '$') return (neg ? '−$' : '$') + a.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (unit === '%') return (neg ? '−' : '') + (Math.round(a * 100) / 100).toLocaleString('en-CA', { maximumFractionDigits: 2 }) + '%';
  if (unit === 'years') return (neg ? '−' : '') + (Math.round(a * 100) / 100) + ' years';
  if (unit === 'shares') return (neg ? '−' : '') + Math.round(a).toLocaleString('en-CA') + ' shares';
  if (unit === 'x') return (neg ? '−' : '') + (Math.round(a * 100) / 100) + '×';
  return (neg ? '−' : '') + (Math.round(a * 10000) / 10000).toLocaleString('en-CA', { maximumFractionDigits: 4 });
}
/** Match a wrong answer against the question's error library (loose tolerance: 1% or the question's own). */
export function diagnose(q, val) {
  for (const e of q.errors || []) { const tol = { abs: Math.max((q.tolerance && q.tolerance.abs) || 0, Math.abs(e.value) * 0.004 + 0.005), rel: 0.01 }; if (within(val, e.value, tol)) return e; }
  if (q.unit === '%' && within(val * 100, q.answer, q.tolerance)) return { id: 'units', label: 'Answered as a decimal instead of a percentage', explain: 'The box wants a percentage: 12.5, not 0.125.' };
  if (q.unit === '%' && within(val / 100, q.answer, q.tolerance)) return { id: 'units', label: 'Percentage entered 100× too large', explain: 'Check the units on the answer box.' };
  if (within(-val, q.answer, q.tolerance)) return { id: 'sign-cf0', label: 'Sign reversed', explain: 'Right size, wrong sign. Check which way the cash flows.' };
  return null;
}
/** Weak-skill log: how often each classic error was made, and on which concepts (shown on the Progress page). */
export function logCalcError(app, diag, q) {
  const st = app.state.stats; st.calcErrors = st.calcErrors || {}; st.calcErrors[diag.id] = (st.calcErrors[diag.id] || 0) + 1;
  st.calcErrorConcepts = st.calcErrorConcepts || {}; const by = st.calcErrorConcepts[diag.id] || (st.calcErrorConcepts[diag.id] = {}); by[q.concept] = (by[q.concept] || 0) + 1;
  st.calcErrorLabels = st.calcErrorLabels || {}; st.calcErrorLabels[diag.id] = diag.label;
  app.store.save();
}
function numericFeedback(app, q, entry, correct, res, { typed, diag, dn = 0, stepped = false, remedial = false } = {}) {
  const c = entry.concept;
  const seals = [
    ['keys', 'Calculator keystrokes', (q.keystrokes || []).length ? h('ul', { class: 'keys' }, q.keystrokes.map(k => h('li', null, k))) : null, 'tablet'],
    ['errors', 'Classic mistakes', (q.errors || []).length ? h('ul', { class: 'errlib' }, q.errors.map(e => h('li', { class: diag && diag.id === e.id ? 'hit' : '' }, h('b', null, e.label), ` → ${fmtNum(e.value, q.unit)}. `, e.explain))) : null, 'shieldcrack'],
    ['trap', 'Exam trap', c.trap ? h('p', null, c.trap) : null, 'swords'],
    ['confuse', "Don't confuse it with", c.contrast ? h('p', null, c.contrast) : null, 'amphora'],
  ].filter(x => x[2]);
  const open = new Set(correct ? [] : ['errors']);
  const body = h('div', { class: 'seal-body' }); const sealRow = h('div', { class: 'seals' });
  const draw = () => { clear(body); for (const [key, label, node, ico] of seals) if (open.has(key)) body.appendChild(h('div', { class: 'seal-text', dataset: { key } }, h('div', { class: 'eyebrow' }, icon(ico, { size: 14, tone: 'crimson' }), label), node)); sealRow.querySelectorAll('.seal').forEach(b => b.classList.toggle('broken', open.has(b.dataset.key))); };
  for (const [key, label, , ico] of seals) sealRow.appendChild(h('button', { class: 'seal', type: 'button', dataset: { key }, 'aria-expanded': String(open.has(key)), onClick: e => { const on = open.has(key); if (on) open.delete(key); else { open.add(key); app.sound('seal'); } e.currentTarget.setAttribute('aria-expanded', String(!on)); draw(); } }, h('span', { class: 'seal-wax' }, icon(ico, { size: 16, tone: 'parchment' })), h('span', { class: 'seal-label' }, label)));
  draw();
  const verdictText = correct ? (remedial ? 'Now it holds' : 'The line holds') : 'The line breaks';
  return h('div', { class: 'feedback ' + (correct ? 'ok' : 'no') },
    h('div', { class: 'feedback-main' },
      h('div', { class: 'verdict ' + (correct ? 'ok' : 'no') }, icon(correct ? 'laurel' : 'shieldcrack', { size: 22, tone: correct ? 'laurel' : 'crimson' }), verdictText, res && res.xp ? h('span', { class: 'xp-gain' }, icon('coin', { size: 16, tone: 'gold' }), `+${res.xp} XP`) : null, dn ? h('span', { class: 'dn-gain win' }, `+${dn} denari${dn === 1 ? 'us' : 'i'}`) : null),
      h('div', { class: 'num-compare' }, h('span', { class: 'num-you' + (correct ? ' ok' : ' no') }, 'You: ', h('b', null, fmtNum(typed, q.unit))), h('span', { class: 'num-right' }, 'Answer: ', h('b', null, fmtNum(q.answer, q.unit)), h('span', { class: 'tiny muted' }, ` (${tolText(q.tolerance, q.unit)})`))),
      diag ? h('div', { class: 'diagnosis' }, icon('target', { size: 16, tone: 'crimson' }), h('div', null, h('b', null, diag.label), h('div', { class: 'small' }, diag.explain))) : null,
      h('div', { class: 'worked' }, h('div', { class: 'eyebrow' }, icon('scroll', { size: 14, tone: 'gold' }), 'Worked solution'), h('ol', { class: 'worked-lines' }, (q.solution || [q.explanation]).map(line => h('li', null, line)))),
      h('p', { class: 'small muted' }, 'Stronghold: ', h('b', null, c.term), ' · now ', MASTERY_LABELS[masteryLevel(app.state.concepts[q.concept])]),
      seals.length ? sealRow : null, body));
}
/** The emperor's thumb, up or down. */
function thumbSvg(up) {
  const w = h('span', { class: 'thumb-ico', 'aria-hidden': 'true' });
  w.innerHTML = `<svg viewBox="0 0 64 64" width="56" height="56"${up ? '' : ' style="transform:scaleY(-1)"'}><path d="M 14 30 h 10 v 24 h -10 z" fill="#E6D3A8" stroke="#3B2A17" stroke-width="2"/><path d="M 24 32 c 2 -8 6 -12 10 -22 c 2 -4 8 -3 8 3 c 0 6 -3 10 -4 14 h 12 c 4 0 6 4 4 7 c 2 2 2 6 -1 7 c 2 3 0 7 -3 7 c 1 4 -2 6 -5 6 h -21 z" fill="#E6D3A8" stroke="#3B2A17" stroke-width="2" stroke-linejoin="round"/></svg>`;
  return w;
}
/** A small abacus scratchpad for calculation questions: arithmetic only, never leaves the page. */
function abacusDrawer(app) {
  const input = h('input', { type: 'text', class: 'abacus-in', placeholder: 'e.g. 1200 / (40 - 16)', 'aria-label': 'Abacus: type a calculation', autocomplete: 'off' });
  const out = h('div', { class: 'abacus-out' }, '=');
  const hist = h('div', { class: 'abacus-hist' });
  const calc = () => { const expr = input.value.replace(/[×x]/g, '*').replace(/÷/g, '/').replace(/%/g, '/100').replace(/,/g, ''); if (!/^[\d\s.+\-*/()]*$/.test(expr) || !expr.trim()) { out.textContent = '='; return; } try { const v = Function('"use strict"; return (' + expr + ')')(); out.textContent = Number.isFinite(v) ? '= ' + (Math.round(v * 10000) / 10000).toLocaleString() : '= ?'; } catch { out.textContent = '= ?'; } };
  input.addEventListener('input', calc);
  input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); if (out.textContent !== '=') { hist.prepend(h('div', { class: 'abacus-line' }, input.value, ' ', out.textContent)); app.sound('stylus'); } } if (e.key === 'Escape') { drawer.classList.remove('open'); input.blur(); } });
  const keys = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '-', '0', '.', '%', '+', '(', ')', 'C'];
  const pad = h('div', { class: 'abacus-pad' }, keys.map(k => h('button', { type: 'button', class: 'abacus-key' + (k === 'C' ? ' clear' : ''), onClick: () => { if (k === 'C') input.value = ''; else input.value += k; calc(); input.focus(); app.sound('tick'); } }, k)));
  const drawer = h('div', { class: 'abacus' },
    h('button', { class: 'abacus-btn btn sm ghost', type: 'button', onClick: () => { drawer.classList.toggle('open'); if (drawer.classList.contains('open')) { input.focus(); app.sound('rustle'); } } }, icon('scale', { size: 14, tone: 'gold' }), 'Abacus ', h('span', { class: 'kbd' }, 'A')),
    h('div', { class: 'abacus-body' }, h('div', { class: 'row' }, input, out), pad, hist, h('p', { class: 'tiny muted' }, 'Scratch arithmetic only. Answer with the number keys as usual.')));
  return drawer;
}
function safeVisual(entry) { try { return visualFor(entry.concept, entry.chapter); } catch { return null; } }
/** The figure, table or diagram a stem refers to ("Figure 8-3", "the break-even chart"), looked up in the chapter. */
function figureForQuestion(app, q, entry) {
  const stem = String(q.stem || ''); const ch = entry.chapter;
  const m = stem.match(/figure\s*(\d+)\s*[-\u2013]\s*(\d+)/i);
  if (m) { const key = `${m[1]}-${m[2]}`; const c = ch.concepts.find(x => x.figure && x.figure.title && String(x.figure.title).replace(/\u2013/g, '-').includes(key)); if (c) return { el: figureEl(c.figure), label: c.figure.title }; }
  if (!/\b(figure|exhibit|diagram|chart|graph|table|perceptual map|shown in the chapter)\b/i.test(stem)) return null;
  if (entry.concept.figure) return { el: figureEl(entry.concept.figure), label: entry.concept.figure.title || 'From the chapter' };
  const vis = safeVisual(entry); if (vis) return { el: vis, label: 'The diagram' };
  return null;
}

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
