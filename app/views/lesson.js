// Lesson deck: each concept becomes a short sequence of slides (hook, explain, visual, confusables, quick check).
import { h, clear, floatXp } from '../ui.js';
import { markSeen, masteryLevel, MASTERY_LABELS, shuffleOptions, pickQuestionForConcept, masteryGaps } from '../engine.js';
import { visualFor, hasTableToo, revealTable, glyphFor } from '../visuals.js';
import { conceptCard } from './concept.js';
import { richText, icon } from '../icons.js';

function sentences(text) {
  return String(text || '').split(/(?<=[.!?])\s+(?=[A-Z("'“])/).map(s => s.trim()).filter(Boolean);
}

/**
 * createLesson(app, cids, opts) -> element
 * opts: { chapter, title, onComplete(), onExit(), startAt: 0, quickCheck: true, exitHref }
 */
export function createLesson(app, cids, opts = {}) {
  const chapter = opts.chapter;
  const slides = [];
  for (const cid of cids) {
    const entry = app.conceptOf(cid); if (!entry) continue;
    const c = entry.concept;
    slides.push({ cid, kind: 'hook', c });
    slides.push({ cid, kind: 'explain', c });
    const vis = visualFor(c, entry.chapter);
    if (vis) slides.push({ cid, kind: 'visual', c, vis, table: hasTableToo(c) && !vis.querySelector('table') ? c.figure : null });
    slides.push({ cid, kind: 'confuse', c });
    if (opts.quickCheck !== false) slides.push({ cid, kind: 'check', c });
  }
  let idx = Math.max(0, Math.min(slides.length - 1, opts.startAt || 0));
  const el = h('div', { class: 'lesson', style: { '--ch': chapter?.color || 'var(--accent)' } });
  const top = h('div', { class: 'lesson-top' });
  const stage = h('div', { class: 'lesson-stage' });
  const foot = h('div', { class: 'lesson-foot' });
  const scroll = h('div', { class: 'scroll' }, h('div', { class: 'scroll-roller top', 'aria-hidden': 'true' }), h('div', { class: 'scroll-paper' }, stage), h('div', { class: 'scroll-roller bottom', 'aria-hidden': 'true' }));
  el.append(top, scroll, foot);
  let checkDone = false; let checkEl = null;

  function conceptIndex(i) { const cid = slides[i].cid; return cids.indexOf(cid); }

  function drawTop() {
    clear(top);
    const ci = conceptIndex(idx);
    top.append(
      h('div', { class: 'row between wrap' },
        h('div', null, h('div', { class: 'eyebrow' }, opts.title || 'Lesson'), h('div', { class: 'small muted' }, `Concept ${ci + 1} of ${cids.length} · ${slides[idx].c.term}`)),
        h('div', { class: 'row' }, opts.exitHref ? h('a', { class: 'btn sm ghost', href: opts.exitHref }, 'Exit') : null)),
      h('div', { class: 'lesson-dots' }, cids.map((cid, i) => h('button', { class: 'ldot' + (i === ci ? ' on' : '') + (i < ci ? ' done' : ''), title: app.conceptOf(cid).concept.term, onClick: () => { idx = slides.findIndex(s => s.cid === cid); draw(1); } }))),
      h('div', { class: 'bar', style: { height: '4px' } }, h('div', { class: 'bar-fill', style: { width: ((idx + 1) / slides.length * 100) + '%', background: 'var(--ch)' } })));
  }

  function slideEl(s) {
    const c = s.c; const cs = app.state.concepts[c.id];
    const head = h('div', { class: 'slide-head' }, h('span', { class: 'glyph' }, glyphFor(c)), h('div', null, h('div', { class: 'eyebrow' }, `Ch ${chapter?.chapter ?? ''} · ${kindLabel(s.kind)}`), h('h2', { class: 'slide-title' }, c.term)));
    if (s.kind === 'hook') {
      return h('div', { class: 'slide hook' }, head,
        h('p', { class: 'slide-def' }, c.definition),
        c.mnemonic ? h('div', { class: 'callout seal-callout' }, h('span', { class: 'callout-ico wax' }, icon('tablet', { size: 18, tone: 'parchment' })), h('div', null, h('b', { class: 'seal-title' }, 'Mnemonic'), h('div', null, c.mnemonic))) : null,
        h('div', { class: 'tiny muted mt' }, cs ? `Your status: ${MASTERY_LABELS[masteryLevel(cs)]}${masteryLevel(cs) < 4 && cs.a?.length ? ' · to master: ' + masteryGaps(cs).slice(0, 2).join(', ') : ''}` : 'New to you.'));
    }
    if (s.kind === 'explain') {
      const lines = sentences(c.explain);
      return h('div', { class: 'slide' }, head,
        h('div', { class: 'lines' }, lines.map((l, i) => h('p', { class: 'line', style: { '--i': i } }, l))),
        h('div', { class: 'callout example', style: { '--i': lines.length } }, h('span', { class: 'callout-ico' }, icon('amphora', { size: 20, tone: 'gold' })), h('div', null, h('b', null, 'Example'), h('div', null, c.example))));
    }
    if (s.kind === 'visual') {
      return h('div', { class: 'slide' }, head, h('p', { class: 'small muted' }, 'Interact with the diagram. Say what each part means before you reveal it.'), s.vis, s.table ? revealTable(s.table, { color: chapter?.color }) : null);
    }
    if (s.kind === 'confuse') {
      const entry = app.conceptOf(c.id); const qs = entry ? entry.chapter.questions.filter(q => q.concept === c.id) : [];
      const ref = qs.find(q => q.source === 'official') || qs.find(q => q.angle === 'not' || q.angle === 'contrast') || qs[0];
      return h('div', { class: 'slide' }, head,
        h('div', { class: 'versus' },
          h('div', { class: 'vs-side' }, h('div', { class: 'eyebrow' }, 'Don\'t confuse it with'), h('p', null, c.contrast)),
          h('div', { class: 'vs-badge' }, 'vs'),
          h('div', { class: 'vs-side trap' }, h('div', { class: 'eyebrow' }, 'Exam trap · the wrong answers it tempts you with'), h('p', null, c.trap))),
        ref ? h('div', { class: 'trap-ref' },
          h('div', { class: 'eyebrow' }, icon('tablet', { size: 14, tone: 'crimson' }), ref.source === 'official' ? 'The practice-exam question this trap comes from' : 'A question that sets this trap'),
          h('p', { class: 'trap-stem' }, ref.stem),
          h('ol', { class: 'trap-opts' }, ref.options.map((o, i) => h('li', { class: i === ref.answer ? 'right' : '' }, o, i === ref.answer ? icon('laurel', { size: 14, tone: 'laurel' }) : null))),
          h('p', { class: 'small muted' }, 'The laurel marks the right answer. The others are the phrases the trap warns about. You will meet this question again in battle.')) : null);
    }
    if (s.kind === 'check') {
      checkDone = false;
      const q = pickQuestionForConcept(app.content, app.state, c.id, { difficultyMax: 2, anglesOnly: new Set(['define', 'identify', 'contrast', 'why']), now: Date.now() })
        || pickQuestionForConcept(app.content, app.state, c.id, { now: Date.now() });
      if (!q) { checkDone = true; return h('div', { class: 'slide' }, head, h('p', null, 'No quick-check question available.')); }
      checkEl = miniQuestion(app, q, () => { checkDone = true; drawFoot(); });
      return h('div', { class: 'slide' }, head, h('p', { class: 'small muted' }, 'Quick check. One question, counts toward mastery.'), checkEl);
    }
    return h('div', { class: 'slide' }, head);
  }

  function kindLabel(k) { return { hook: 'Definition', explain: 'In plain English', visual: 'See it', confuse: 'Tell it apart', check: 'Quick check' }[k] || ''; }

  function drawFoot() {
    clear(foot);
    const s = slides[idx];
    const last = idx === slides.length - 1;
    const canNext = s.kind !== 'check' || checkDone;
    foot.append(
      h('button', { class: 'btn ghost', disabled: idx === 0, onClick: () => { idx--; draw(-1); } }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ' Back'),
      h('div', { class: 'small muted center' }, `${idx + 1} / ${slides.length}`),
      last && canNext ? h('button', { class: 'btn primary big', onClick: () => opts.onComplete && opts.onComplete() }, opts.completeLabel || 'Finish lesson', ' ', icon('arrow', { size: 14, tone: 'mono' }))
        : h('button', { class: 'btn primary', disabled: !canNext, onClick: () => { idx++; draw(1); } }, canNext ? ['Next ', icon('arrow', { size: 14, tone: 'mono' })] : 'Answer to continue'));
  }

  function draw(dir = 1) {
    const s = slides[idx];
    markSeen(app.state, s.cid); app.store.save();
    drawTop();
    stage.querySelectorAll('.slide.out-left, .slide.out-right').forEach(x => x.remove());
    const old = stage.querySelector('.slide');
    const next = slideEl(s);
    next.classList.add(dir >= 0 ? 'in-right' : 'in-left');
    if (old) { old.classList.add(dir >= 0 ? 'out-left' : 'out-right'); setTimeout(() => old.remove(), 260); }
    stage.appendChild(next);
    drawFoot();
    requestAnimationFrame(() => next.classList.add('show'));
  }

  const onKey = e => {
    if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
    const s = slides[idx];
    if (e.key === 'ArrowRight' || e.key === 'Enter') { if (s.kind === 'check' && !checkDone) return; if (idx < slides.length - 1) { idx++; draw(1); } else if (opts.onComplete) opts.onComplete(); }
    else if (e.key === 'ArrowLeft') { if (idx > 0) { idx--; draw(-1); } }
    else if (s.kind === 'check' && checkEl && /^[1-5]$/.test(e.key)) { const b = checkEl.querySelectorAll('.option:not([disabled])')[parseInt(e.key, 10) - 1]; if (b) b.click(); }
  };
  document.addEventListener('keydown', onKey);
  // swipe
  let sx = null;
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) < 60) return; const s = slides[idx]; if (dx < 0 && idx < slides.length - 1 && (s.kind !== 'check' || checkDone)) { idx++; draw(1); } else if (dx > 0 && idx > 0) { idx--; draw(-1); } }, { passive: true });
  const prevCleanup = el.cleanup;
  el.cleanup = () => { document.removeEventListener('keydown', onKey); prevCleanup && prevCleanup(); };
  draw(1);
  return el;
}

/** Compact single question with immediate feedback. */
export function miniQuestion(app, q, onDone) {
  const { options, answer } = shuffleOptions(q);
  const box = h('div', { class: 'mini-q' });
  const stem = h('div', { class: 'stem' }, richText(q.stem));
  let done = false;
  const opts = options.map((o, i) => h('button', { class: 'option', onClick: () => pick(i) }, h('span', { class: 'key' }, h('span', { class: 'key-n' }, String(i + 1))), h('span', { class: 'opt-text' }, richText(o, { blanks: false }))));
  box.append(stem, h('div', { class: 'options' }, opts));
  function pick(i) {
    if (done) return; done = true;
    const correct = i === answer;
    opts.forEach((b, j) => { b.disabled = true; if (j === answer) b.classList.add('correct'); else if (j === i) b.classList.add('wrong'); else b.classList.add('dim'); });
    const res = app.answer(q, correct, { mode: 'lesson', combo: 0 });
    app.sound(correct ? 'correct' : 'wrong');
    if (res.xp) floatXp(opts[answer], `+${res.xp} XP`);
    box.appendChild(h('div', { class: 'explain' }, h('div', { class: 'verdict ' + (correct ? 'ok' : 'no') }, icon(correct ? 'laurel' : 'shieldcrack', { size: 18, tone: correct ? 'laurel' : 'crimson' }), correct ? 'Correct' : 'Not quite'), h('p', null, q.explanation)));
    onDone && onDone(correct);
  }
  return box;
}
