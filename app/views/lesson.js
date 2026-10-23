// Lesson deck: each concept becomes a short sequence of slides you work through, not read through:
// hook (definition with an illustration and the mnemonic), recall (say it before you see it), explain
// (reveal one line at a time), visual (a bespoke diagram, or an interactive table / step flow / concept map
// built from the concept's own data, so every concept has one), tell-it-apart, quick check.
import { h, clear, floatXp } from '../ui.js';
import { markSeen, masteryLevel, MASTERY_LABELS, shuffleOptions, pickQuestionForConcept, masteryGaps } from '../engine.js';
import { visualFor, hasTableToo, revealTable, stepFlow, glyphFor, svg } from '../visuals.js';
import { conceptCard } from './concept.js';
import { richText, icon } from '../icons.js';
import { vignetteFor } from '../vignettes.js';

function sentences(text) {
  return String(text || '').split(/(?<=[.!?])\s+(?=[A-Z("'“])/).map(s => s.trim()).filter(Boolean);
}

export const SLIDES_PER_CONCEPT = 6;

/**
 * createLesson(app, cids, opts) -> element
 * opts: { chapter, title, onComplete(), onExit(), startAt: 0, quickCheck: true, exitHref, completeLabel }
 */
export function createLesson(app, cids, opts = {}) {
  const chapter = opts.chapter;
  const slides = [];
  for (const cid of cids) {
    const entry = app.conceptOf(cid); if (!entry) continue;
    const c = entry.concept;
    slides.push({ cid, kind: 'hook', c });
    slides.push({ cid, kind: 'recall', c });
    slides.push({ cid, kind: 'explain', c });
    slides.push({ cid, kind: 'visual', c });
    slides.push({ cid, kind: 'confuse', c });
    if (opts.quickCheck !== false) slides.push({ cid, kind: 'check', c });
  }
  const PER = opts.quickCheck !== false ? 6 : 5;
  let idx = Math.max(0, Math.min(slides.length - 1, opts.startAt || 0));
  const el = h('div', { class: 'lesson', style: { '--ch': chapter?.color || 'var(--accent)' } });
  const top = h('div', { class: 'lesson-top' });
  const stage = h('div', { class: 'lesson-stage' });
  const foot = h('div', { class: 'lesson-foot' });
  const scroll = h('div', { class: 'scroll' }, h('div', { class: 'scroll-roller top', 'aria-hidden': 'true' }), h('div', { class: 'scroll-paper' }, stage), h('div', { class: 'scroll-roller bottom', 'aria-hidden': 'true' }));
  el.append(top, scroll, foot);
  let checkDone = false; let checkEl = null; let revealNext = null;

  function conceptIndex(i) { const cid = slides[i].cid; return cids.indexOf(cid); }

  function drawTop() {
    clear(top);
    const ci = conceptIndex(idx);
    top.append(
      h('div', { class: 'row between wrap' },
        h('div', null, h('div', { class: 'eyebrow' }, opts.title || 'Lesson'), h('div', { class: 'small muted' }, `Concept ${ci + 1} of ${cids.length} · ${slides[idx].c.term}`)),
        h('div', { class: 'row' }, opts.exitHref ? h('a', { class: 'btn sm ghost', href: opts.exitHref }, 'Exit') : null)),
      h('div', { class: 'lesson-dots' }, cids.map((cid, i) => h('button', { class: 'ldot' + (i === ci ? ' on' : '') + (i < ci ? ' done' : ''), title: app.conceptOf(cid).concept.term, onClick: () => { idx = i * PER; draw(i > ci ? 1 : -1); } }))),
      h('div', { class: 'bar', style: { height: '4px' } }, h('div', { class: 'bar-fill', style: { width: ((idx + 1) / slides.length * 100) + '%', background: 'var(--ch)' } })));
  }

  function slideEl(s) {
    const c = s.c; const cs = app.state.concepts[c.id];
    const head = h('div', { class: 'slide-head' }, h('span', { class: 'glyph' }, glyphFor(c)), h('div', null, h('div', { class: 'eyebrow' }, `Ch ${chapter?.chapter ?? ''} · ${kindLabel(s.kind)}`), h('h2', { class: 'slide-title' }, c.term)));
    revealNext = null;
    if (s.kind === 'hook') {
      const vig = safeVignette(chapter?.chapter);
      return h('div', { class: 'slide hook' }, head,
        h('div', { class: 'hook-row' + (vig ? '' : ' no-art') },
          h('div', null, h('p', { class: 'slide-def' }, c.definition),
            c.mnemonic ? h('div', { class: 'callout seal-callout' }, h('span', { class: 'callout-ico wax' }, icon('tablet', { size: 18, tone: 'parchment' })), h('div', null, h('b', { class: 'seal-title' }, 'Mnemonic'), h('div', null, c.mnemonic))) : null),
          vig ? h('div', { class: 'hook-art', 'aria-hidden': 'true' }, vig) : null),
        h('div', { class: 'tiny muted mt' }, cs ? `Your status: ${MASTERY_LABELS[masteryLevel(cs)]}${masteryLevel(cs) < 4 && cs.a?.length ? ' · to master: ' + masteryGaps(cs).slice(0, 2).join(', ') : ''}` : 'New to you.'));
    }
    if (s.kind === 'recall') {
      // Say the definition before you see it. The self-mark is cosmetic: nothing is recorded.
      const marks = h('div', { class: 'row wrap recall-marks' }, h('span', { class: 'small muted' }, 'Did you have it?'),
        h('button', { class: 'btn sm', type: 'button', onClick: () => { marks.replaceChildren(h('span', { class: 'chip good' }, icon('laurel', { size: 12, tone: 'laurel' }), 'Nailed it')); app.sound('correct'); } }, 'Yes'),
        h('button', { class: 'btn sm ghost', type: 'button', onClick: () => { marks.replaceChildren(h('span', { class: 'chip warn' }, 'Read it twice, then watch for the quick check')); app.sound('knock'); } }, 'Not yet'));
      const ans = h('div', { class: 'recall-answer' }, h('p', { class: 'slide-def' }, c.definition), marks);
      const btn = h('button', { class: 'btn primary big recall-btn', type: 'button', onClick: () => { if (!btn.isConnected) return; btn.replaceWith(ans); app.sound('unroll'); revealNext = null; } }, icon('eye', { size: 16, tone: 'mono' }), ' Reveal the definition ', h('span', { class: 'kbd' }, 'Space'));
      revealNext = () => btn.click();
      return h('div', { class: 'slide recall' }, head,
        h('div', { class: 'recall-card' }, h('div', { class: 'eyebrow' }, 'Active recall'), h('p', { class: 'recall-prompt' }, `In your own words: what is ${c.term}?`), h('p', { class: 'small muted' }, 'Say it out loud or in your head, then reveal and compare. Retrieving before reading is the most effective minute in the lesson.'), btn));
    }
    if (s.kind === 'explain') {
      const lines = sentences(c.explain); let shown = 1;
      const lineEls = lines.map((l, i) => h('p', { class: 'line' + (i === 0 ? ' shown' : '') }, l));
      const ex = h('div', { class: 'callout example hidden-line' }, h('span', { class: 'callout-ico' }, icon('amphora', { size: 20, tone: 'gold' })), h('div', null, h('b', null, 'Example'), h('div', null, c.example)));
      const more = h('button', { class: 'btn sm reveal-line', type: 'button', onClick: () => step() });
      const label = () => { if (shown < lines.length) more.replaceChildren(`Next line ${shown + 1} / ${lines.length} `, h('span', { class: 'kbd' }, 'Space')); else more.replaceChildren('Show the example ', h('span', { class: 'kbd' }, 'Space')); };
      const step = () => {
        if (shown < lines.length) { lineEls[shown].classList.add('shown'); shown++; label(); app.sound('rustle'); }
        else if (ex.classList.contains('hidden-line')) { ex.classList.remove('hidden-line'); more.remove(); app.sound('seal'); revealNext = null; }
      };
      label();
      revealNext = () => step();
      return h('div', { class: 'slide' }, head, h('p', { class: 'small muted' }, 'One idea at a time. Guess what the next line says before you reveal it.'), h('div', { class: 'lines' }, lineEls), ex, more);
    }
    if (s.kind === 'visual') {
      const vis = safeVisual(c);
      if (vis) return h('div', { class: 'slide' }, head, h('p', { class: 'small muted' }, 'Work the diagram: say what each part means before you reveal or tap it.'), vis, hasTableToo(c) && !vis.querySelector('table') ? revealTable(c.figure, { color: chapter?.color }) : null);
      if (c.figure && c.figure.type === 'table' && c.figure.rows?.length) return h('div', { class: 'slide' }, head, h('p', { class: 'small muted' }, 'The table the exam expects you to know. Cells start hidden: say the answer, then tap to check.'), revealTable(c.figure, { color: chapter?.color }));
      if (c.figure && c.figure.type === 'list' && c.figure.items?.length) return h('div', { class: 'slide' }, head, h('p', { class: 'small muted' }, 'Tap each step to spotlight it. Say what comes next before you move on.'), stepFlow(c.figure.items, { color: chapter?.color, title: c.figure.title }));
      return h('div', { class: 'slide' }, head, h('p', { class: 'small muted' }, 'The concept map. Tap each stone to turn it over, and say what you expect before it turns.'), conceptMap(app, c, chapter));
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
          h('p', { class: 'small muted' }, 'The laurel marks the right answer. The others are the phrases the trap warns about. You will meet this question again in the quiz.')) : null);
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
  function safeVisual(c) { try { return visualFor(c, chapter); } catch { return null; } }
  function safeVignette(n) { try { return n ? vignetteFor(n) : null; } catch { return null; } }

  function kindLabel(k) { return { hook: 'Definition', recall: 'Recall it', explain: 'In plain English', visual: 'See it', confuse: 'Tell it apart', check: 'Quick check' }[k] || ''; }

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
    if (e.key === ' ' && revealNext) { e.preventDefault(); revealNext(); return; }
    if (e.key === 'ArrowRight' || e.key === 'Enter') { if (s.kind === 'check' && !checkDone) return; if (idx < slides.length - 1) { idx++; draw(1); } else if (opts.onComplete) opts.onComplete(); }
    else if (e.key === 'ArrowLeft') { if (idx > 0) { idx--; draw(-1); } }
    else if (s.kind === 'check' && checkEl && /^[1-5]$/.test(e.key)) { const b = checkEl.querySelectorAll('.option:not([disabled])')[parseInt(e.key, 10) - 1]; if (b) b.click(); }
  };
  document.addEventListener('keydown', onKey);
  // swipe
  let sx = null;
  stage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) < 60) return; const s = slides[idx]; if (dx < 0 && idx < slides.length - 1 && (s.kind !== 'check' || checkDone)) { idx++; draw(1); } else if (dx > 0 && idx > 0) { idx--; draw(-1); } });
  const prevCleanup = el.cleanup;
  el.cleanup = () => { document.removeEventListener('keydown', onKey); prevCleanup && prevCleanup(); };
  draw(1);
  return el;
}

/** A concept map built from the concept's own data: the term in the middle, stones around it you turn over. */
function conceptMap(app, c, chapter) {
  const stones = [
    ['Definition', c.definition, 'scroll'], ['Example', c.example, 'amphora'], ["Don't confuse with", c.contrast, 'swords'], ['Exam trap', c.trap, 'shieldcrack'], ['Mnemonic', c.mnemonic, 'tablet'],
  ].filter(x => x[1]);
  const n = stones.length; const RX = 40; const RY = 36;
  const detail = h('div', { class: 'cmap-detail' }, h('p', { class: 'small muted' }, 'Tap a stone. Before it turns, say what you expect to find on it.'));
  const map = h('div', { class: 'cmap radial' });
  map.style.setProperty('--ch', chapter?.color || 'var(--accent)');
  const wires = svg('svg', { class: 'cmap-wires', viewBox: '0 0 100 100', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  map.appendChild(wires);
  map.appendChild(h('div', { class: 'cmap-hub' }, h('span', { class: 'glyph' }, glyphFor(c)), h('span', { class: 'cmap-term' }, c.term)));
  stones.forEach(([label, text, ico], i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2; const px = 50 + Math.cos(a) * RX; const py = 50 + Math.sin(a) * RY;
    const wire = svg('line', { class: 'cmap-wire', x1: 50, y1: 50, x2: px.toFixed(2), y2: py.toFixed(2) }); wires.appendChild(wire);
    const b = h('button', { class: 'cmap-stone', type: 'button' }, icon(ico, { size: 18, tone: 'gold' }), h('span', null, label));
    b.style.left = px.toFixed(2) + '%'; b.style.top = py.toFixed(2) + '%';
    b.addEventListener('click', () => {
      map.querySelectorAll('.cmap-stone').forEach(x => x.classList.remove('on')); b.classList.add('on', 'turned'); wire.classList.add('lit');
      detail.replaceChildren(h('div', { class: 'eyebrow' }, icon(ico, { size: 14, tone: 'crimson' }), label), h('p', null, text));
      app.sound('knock');
      if (map.querySelectorAll('.cmap-stone.turned').length === n && !map.classList.contains('complete')) { map.classList.add('complete'); app.sound('horn'); }
    });
    map.appendChild(b);
  });
  return h('div', { class: 'cmap-wrap' }, map, detail);
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
