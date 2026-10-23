// Arcade: Blitz (timed), Confusables Duel, Build & Sort (activities), Flashcards.
import { h, shuffle, plural, fmtTime } from '../ui.js';
import { svg } from '../visuals.js';
import { masteryLevel, MASTERY_LABELS } from '../engine.js';
import { chapterPicker } from './common.js';
import { createRunner, resultCard, missesList } from './runner.js';
import { conceptCard, masteryChip, figureEl } from './concept.js';
import { icon } from '../icons.js';
import { setCosmetic } from '../cosmetic.js';
import { dayKeyOf } from '../legion.js';

export function render(app, params) {
  const [sub, arg] = params;
  if (sub === 'blitz') return arg === 'go' ? blitz(app) : blitzConfig(app);
  if (sub === 'duel') return arg === 'go' ? duel(app) : duelConfig(app);
  if (sub === 'build') return arg ? activity(app, arg) : buildList(app);
  if (sub === 'flash') return arg === 'go' ? flash(app) : flashConfig(app);
  return hub(app);
}

function hub(app) {
  const tile = (href, ico, title, desc, color, meta) => h('a', { class: 'mode-tile', href, style: { '--ch': color } }, h('div', { class: 'ico' }, icon(ico, { size: 34, tone: 'gold' })), h('h3', null, title), h('p', null, desc), h('div', { class: 'meta' }, meta.map(m => h('span', { class: 'chip' }, m))));
  const st = app.state.stats;
  const done = Object.values(app.state.activities).filter(a => a.done).length;
  return h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'The Arena'), h('p', null, 'Different contests, same engine underneath: every answer updates mastery and the review schedule.'))),
    h('div', { class: 'grid two' },
      tile('#/arcade/blitz', 'gladius', 'Skirmish', '90 seconds, three lives, combo multiplier. Short questions only. Best for warming up recall.', '#D28C3C', [`Best ${st.blitzBest || 0}`]),
      tile('#/arcade/duel', 'swords', 'Gladiator Duel', 'Only “tell them apart” and “which is NOT” questions, 20 seconds each, 15 rounds, three lives.', '#A98BC9', [`Best ${st.duelBest || 0}/15`]),
      tile('#/arcade/build', 'siegetower', 'Siege Works', 'Order the processes, sort items into buckets, match pairs. The memorization tables as engineering.', '#8FAA5A', [`${done}/${app.content.stats.activities} built`]),
      tile('#/arcade/flash', 'scroll', 'Scrolls', 'Classic recall with honest self-grading. Again / Hard / Good / Easy feed the spacing schedule.', '#B08968', ['Recall'])));
}

// ---------- Blitz ----------
function blitzConfig(app) {
  const selected = new Set(JSON.parse(sessionStorage.getItem('blitzch') || 'null') || app.content.chapters.map(c => c.chapter));
  return h('div', { class: 'runner' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', { class: 'row' }, icon('gladius', { size: 28, tone: 'gold' }), 'Skirmish'), h('p', null, '90 seconds on the clock, three lives. Every correct answer scores 100 × your combo multiplier (+0.5× every 3 in a row). Wrong answers cost a life and reset the combo.'))),
    h('div', { class: 'card stack' },
      h('div', { class: 'field' }, h('label', null, 'Chapters'), chapterPicker(app, selected)),
      h('div', { class: 'row wrap' }, h('span', { class: 'chip' }, `Best score: ${app.state.stats.blitzBest || 0}`)),
      h('button', { class: 'btn primary big', onClick: () => { if (!selected.size) { app.toast('Pick at least one chapter', 'bad'); return; } sessionStorage.setItem('blitzch', JSON.stringify([...selected])); app.navigate('#/arcade/blitz/go'); } }, 'Go!')));
}

function blitz(app) {
  const chapters = new Set(JSON.parse(sessionStorage.getItem('blitzch') || 'null') || app.content.chapters.map(c => c.chapter));
  const host = h('div', { style: { '--ch': '#FFB84D' } });
  let score = 0; let combo = 0;
  const scoreEl = h('div', { class: 'card center tight mb' }, h('div', { class: 'eyebrow' }, 'Score'), h('div', { class: 'score-big mono', style: { fontSize: '2.2rem' } }, '0'), h('div', { class: 'small muted' }, 'multiplier ×1.0'));
  host.appendChild(scoreEl);
  const runner = createRunner(app, {
    title: 'Skirmish', subtitle: 'Fast. Short. Three lives.', mode: 'blitz', scene: 'chariot', chapters, feedback: 'immediate', hearts: 3, timer: 90, pursuit: false,
    pickOpts: { difficultyMax: 2, shortOnly: true, excludeMastered: false }, showLearnOnWrong: false,
    onAnswer: ({ correct }) => {
      if (correct) { combo++; const mult = 1 + Math.floor(combo / 3) * 0.5; score += Math.round(100 * mult); scoreEl.children[1].textContent = String(score); scoreEl.children[2].textContent = `multiplier ×${mult.toFixed(1)}`; }
      else { combo = 0; scoreEl.children[2].textContent = 'multiplier ×1.0'; }
    },
    onFinish: (sum, reason) => {
      setCosmetic({ lastBlitzDay: dayKeyOf() });
      const best = app.state.stats.blitzBest || 0;
      if (score > best) { app.state.stats.blitzBest = score; app.toast('New skirmish record!', 'xp'); app.confetti({ count: 120, colors: ['#8B1E1E', '#C9A227', '#E3C76A'] }); }
      app.grantXp(Math.round(score / 20), 'skirmish');
      app.store.save();
      host.innerHTML = '';
      host.append(resultCard(app, reason === 'hearts' ? 'Out of lives' : reason === 'time' ? 'Time!' : 'Blitz over', sum,
        h('div', { class: 'stack mt' }, h('div', { class: 'score-big mono', style: { fontSize: '2.4rem', color: 'var(--accent)' } }, `${score} pts`), h('p', { class: 'muted' }, score > best ? 'New personal best.' : `Best: ${Math.max(best, score)}`),
          h('div', { class: 'row wrap', style: { justifyContent: 'center' } }, h('a', { class: 'btn primary', href: '#/arcade/blitz/go' }, 'Again'), h('a', { class: 'btn ghost', href: '#/arcade' }, 'Arcade')))),
      sum.log.some(l => !l.correct) ? h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Misses'), missesList(app, sum.log)) : null);
    },
  });
  // auto-advance quickly in blitz: after answer, continue after short delay
  runner.addEventListener('click', e => { if (e.target.closest('.option')) setTimeout(() => { const btn = runner.querySelector('.runner-foot .btn.primary'); if (btn) btn.click(); }, 900); }, true);
  host.appendChild(runner);
  host.cleanup = () => runner.cleanup && runner.cleanup();
  return host;
}

// ---------- Duel ----------
function duelConfig(app) {
  const selected = new Set(JSON.parse(sessionStorage.getItem('duelch') || 'null') || app.content.chapters.map(c => c.chapter));
  return h('div', { class: 'runner' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', { class: 'row' }, icon('swords', { size: 28, tone: 'gold' }), 'Gladiator Duel'), h('p', null, 'The exam loves near-miss distractors. This mode serves only “tell them apart” and “which is NOT” questions: 15 rounds, 20 seconds each, three lives.'))),
    h('div', { class: 'card stack' },
      h('div', { class: 'field' }, h('label', null, 'Chapters'), chapterPicker(app, selected)),
      h('div', { class: 'row wrap' }, h('span', { class: 'chip' }, `Best: ${app.state.stats.duelBest || 0}/15`)),
      h('button', { class: 'btn primary big', onClick: () => { if (!selected.size) { app.toast('Pick at least one chapter', 'bad'); return; } sessionStorage.setItem('duelch', JSON.stringify([...selected])); app.navigate('#/arcade/duel/go'); } }, 'Duel!')));
}

function duel(app) {
  const chapters = new Set(JSON.parse(sessionStorage.getItem('duelch') || 'null') || app.content.chapters.map(c => c.chapter));
  const host = h('div', { style: { '--ch': '#A78BFA' } });
  let favour = 6; let lastT = Date.now();
  const favourEl = h('div', { class: 'favour' }, h('span', { class: 'eyebrow' }, icon('hand', { size: 14, tone: 'gold' }), 'Crowd favour'), h('span', { class: 'favour-track' }, h('span', { class: 'favour-fill', style: { width: (favour / 20 * 100) + '%' } })), h('span', { class: 'small muted favour-txt' }, 'The crowd waits'));
  host.appendChild(favourEl);
  const runner = createRunner(app, {
    title: 'Gladiator Duel', subtitle: '15 rounds · 20 s each · 3 lives', mode: 'duel', scene: 'colosseum', chapters, feedback: 'immediate', hearts: 3, limit: 15, perQuestionTimer: 20, pursuit: true,
    pickOpts: { anglesOnly: new Set(['contrast', 'not']), excludeMastered: false },
    onAnswer: ({ correct }) => { const dt = Date.now() - lastT; lastT = Date.now(); favour = Math.max(0, Math.min(20, favour + (correct ? (dt < 8000 ? 2 : 1) : -2))); favourEl.querySelector('.favour-fill').style.width = (favour / 20 * 100) + '%'; favourEl.querySelector('.favour-txt').textContent = favour >= 14 ? 'The crowd roars' : favour >= 8 ? 'The crowd is with you' : 'The crowd murmurs'; if (correct && dt < 8000) app.sound('cries'); },
    onFinish: (sum, reason) => {
      const up = favour >= 10; setTimeout(() => app.sound('thumbs', { up }), 400);
      if (sum.correct > (app.state.stats.duelBest || 0)) { app.state.stats.duelBest = sum.correct; app.toast('New Duel best!', 'xp'); }
      app.grantXp(sum.correct * 8, 'duel');
      app.store.save();
      host.innerHTML = '';
      host.append(h('div', { class: 'verdict-box ' + (up ? 'up' : 'down') }, h('div', { class: 'emperor-thumb' }), h('div', null, h('div', { class: 'eyebrow' }, 'The emperor decides'), h('h3', null, up ? 'Pollice verso: live, gladiator' : 'Pollice verso: the crowd was not moved'), h('p', { class: 'small muted' }, `Crowd favour ${favour}/20. Fast, correct answers win the crowd.`))),
        resultCard(app, reason === 'hearts' ? 'Defeated' : 'Duel over', sum,
        h('div', { class: 'row wrap mt', style: { justifyContent: 'center' } }, h('a', { class: 'btn primary', href: '#/arcade/duel/go' }, 'Rematch'), h('a', { class: 'btn ghost', href: '#/arcade' }, 'Arcade'))),
      sum.log.some(l => !l.correct) ? h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Misses'), missesList(app, sum.log)) : null);
    },
  });
  host.appendChild(runner);
  host.cleanup = () => runner.cleanup && runner.cleanup();
  return host;
}

// ---------- Build & Sort ----------
function buildList(app) {
  const TYPE = { order: ['column', 'Order'], sort: ['crate', 'Sort'], match: ['hand', 'Match'] };
  return h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('h1', { class: 'row' }, icon('siegetower', { size: 28, tone: 'gold' }), 'Siege Works'), h('p', null, 'The processes and tables the exam expects you to reproduce. A perfect build counts as a correct “sequence” answer for the concept.'))),
    h('div', { class: 'stack' }, app.content.chapters.map(ch => h('div', { class: 'card', style: { '--ch': ch.color } },
      h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter}`), h('h3', { class: 'mb' }, ch.title),
      h('div', { class: 'list' }, ch.activities.map(a => {
        const rec = app.state.activities[a.id];
        return h('a', { class: 'li', href: `#/arcade/build/${a.id}`, style: { textDecoration: 'none', color: 'inherit' } },
          h('span', { class: 'chip ch' }, icon(TYPE[a.type][0], { size: 14, tone: 'gold' }), TYPE[a.type][1]), h('div', { class: 'grow' }, h('div', { class: 't' }, a.title), h('div', { class: 's' }, app.conceptOf(a.concept)?.concept.term)),
          rec?.done ? h('span', { class: 'chip good' }, icon('laurel', { size: 14, tone: 'laurel' }), rec.best === 1 ? 'perfect' : Math.round(rec.best * 100) + '%') : rec?.best !== undefined ? h('span', { class: 'chip warn' }, `${Math.round(rec.best * 100)}%`) : h('span', { class: 'chip' }, 'New'));
      }))))));
}

function activity(app, aid) {
  let act = null; let ch = null;
  for (const c of app.content.chapters) { const a = c.activities.find(x => x.id === aid); if (a) { act = a; ch = c; break; } }
  if (!act) return h('div', { class: 'card' }, 'Unknown activity. ', h('a', { href: '#/arcade/build' }, 'Back'));
  const host = h('div', { class: 'runner', style: { '--ch': ch.color } },
    h('a', { class: 'back', href: '#/arcade/build' }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ' Siege Works'),
    h('div', { class: 'page-head mt-sm' }, h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter} · ${app.conceptOf(act.concept)?.concept.term}`), h('h2', null, act.title), h('p', null, act.prompt))));
  const body = h('div', { class: 'card' });
  host.appendChild(body);
  const finish = (fraction, detailEl) => {
    const perfect = fraction >= 0.999;
    const rec = app.state.activities[aid] || (app.state.activities[aid] = {});
    rec.best = Math.max(rec.best || 0, fraction); rec.tries = (rec.tries || 0) + 1; if (perfect) rec.done = Date.now();
    const q = { id: aid, concept: act.concept, angle: 'order', difficulty: 2, type: 'activity' };
    const res = app.answer(q, perfect, { mode: 'build', combo: 0 });
    if (perfect) { app.sound('horn'); app.confetti({ count: 70, colors: ['#8B1E1E', '#C9A227', '#E3C76A', '#EADBC0'] }); } else { app.sound('crumble'); }
    app.store.save();
    body.appendChild(h('div', { class: 'explain' },
      h('div', { class: 'verdict ' + (perfect ? 'ok' : 'no') }, icon(perfect ? 'laurel' : 'shieldcrack', { size: 20, tone: perfect ? 'laurel' : 'crimson' }), perfect ? `Perfect${res.xp ? ` · +${res.xp} XP` : ''}` : `${Math.round(fraction * 100)}% — not yet`),
      h('p', null, act.explanation),
      detailEl || null,
      h('div', { class: 'row wrap mt' }, h('a', { class: 'btn primary', href: `#/arcade/build/${aid}` }, perfect ? 'Do it again' : 'Try again'), h('a', { class: 'btn ghost', href: '#/arcade/build' }, 'All activities'),
        nextActivity(app, ch, act))));
    body.querySelectorAll('button').forEach(b => { if (!b.closest('.explain')) b.disabled = true; });
  };
  if (act.type === 'order') orderGame(app, act, body, finish);
  else if (act.type === 'sort') sortGame(app, act, body, finish);
  else matchGame(app, act, body, finish);
  return host;
}

function nextActivity(app, ch, act) {
  const all = app.content.chapters.flatMap(c => c.activities);
  const i = all.indexOf(act);
  const n = all[i + 1];
  return n ? h('a', { class: 'btn ghost', href: `#/arcade/build/${n.id}` }, `Next: ${n.title} `, icon('arrow', { size: 14, tone: 'mono' })) : null;
}

function orderGame(app, act, body, finish) {
  // Stone blocks you drag to build an arch, first to last from left to right. Arrows and the keyboard still work.
  const correct = act.items;
  let cur = shuffle(correct);
  if (cur.join('|') === correct.join('|')) cur = cur.reverse();
  const n = cur.length;
  const arch = h('div', { class: 'arch' }); arch.style.setProperty('--n', String(n));
  let dragFrom = -1;
  const draw = () => {
    arch.innerHTML = '';
    cur.forEach((item, i) => {
      const block = h('div', { class: 'arch-block', dataset: { i }, tabindex: '0', role: 'listitem', 'aria-label': `Position ${i + 1}: ${item}` },
        h('span', { class: 'ab-idx' }, String(i + 1)), h('span', { class: 'ab-text' }, item),
        h('span', { class: 'ab-mv' }, h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move earlier', disabled: i === 0, onClick: e => { e.stopPropagation(); app.sound('knock'); [cur[i - 1], cur[i]] = [cur[i], cur[i - 1]]; draw(); } }, icon('arrow', { size: 12, tone: 'gold', cls: 'flip' })), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Move later', disabled: i === n - 1, onClick: e => { e.stopPropagation(); app.sound('knock'); [cur[i + 1], cur[i]] = [cur[i], cur[i + 1]]; draw(); } }, icon('arrow', { size: 12, tone: 'gold' }))));
      block.addEventListener('pointerdown', ev => {
        if (ev.target.closest('button')) return;
        const start = { x: ev.clientX, y: ev.clientY }; let ghost = null; let moved = false; let over = null;
        const onMove = e => { const dx = e.clientX - start.x, dy = e.clientY - start.y; if (!moved && Math.hypot(dx, dy) < 6) return; if (!moved) { moved = true; try { block.setPointerCapture(e.pointerId); } catch { /* ignore */ } ghost = block.cloneNode(true); ghost.classList.add('drag-ghost', 'arch-ghost'); const r = block.getBoundingClientRect(); ghost.style.width = r.width + 'px'; ghost.style.left = r.left + 'px'; ghost.style.top = r.top + 'px'; ghost.style.transform = ''; document.body.appendChild(ghost); block.classList.add('lifted'); app.sound('rustle'); dragFrom = i; }
          ghost.style.transform = `translate(${dx}px, ${dy}px)`; const el = document.elementFromPoint(e.clientX, e.clientY); const b = el && el.closest('.arch-block:not(.lifted)'); if (b !== over) { over && over.classList.remove('over'); over = b; over && over.classList.add('over'); } e.preventDefault(); };
        const onUp = e => { block.removeEventListener('pointermove', onMove); block.removeEventListener('pointerup', onUp); block.removeEventListener('pointercancel', onUp); if (!moved) return; ghost && ghost.remove(); block.classList.remove('lifted');
          const el = document.elementFromPoint(e.clientX, e.clientY); const b = el && el.closest('.arch-block'); if (b && Number(b.dataset.i) !== i) { const j = Number(b.dataset.i); const [item2] = cur.splice(i, 1); cur.splice(j, 0, item2); app.sound('crumble'); } over && over.classList.remove('over'); dragFrom = -1; draw(); };
        block.addEventListener('pointermove', onMove); block.addEventListener('pointerup', onUp); block.addEventListener('pointercancel', onUp);
      });
      arch.appendChild(block);
    });
    arch.appendChild(h('div', { class: 'keystone', 'aria-hidden': 'true' }, icon('laurel', { size: 18, tone: 'gold' })));
  };
  draw();
  body.append(h('p', { class: 'small muted' }, 'Drag the stone blocks into order, first to last, left to right (or use the arrows). When the order is right the keystone drops in.'), arch,
    h('button', { class: 'btn primary big mt', onClick: () => {
      let ok = 0;
      [...arch.querySelectorAll('.arch-block')].forEach((blk, i) => { const good = cur[i] === correct[i]; if (good) ok++; blk.classList.add(good ? 'ok' : 'bad'); });
      if (ok === correct.length) { arch.classList.add('locked'); app.sound('impact'); setTimeout(() => app.sound('horn'), 350); }
      finish(ok / correct.length, ok < correct.length ? h('div', { class: 'mt-sm' }, h('b', { class: 'small' }, 'Correct order:'), h('ol', { class: 'fig' }, correct.map(x => h('li', null, x)))) : null);
    } }, 'Check the arch'));
}

function sortGame(app, act, body, finish) {
  const items = shuffle(act.items.map((it, i) => ({ ...it, i })));
  const placed = new Map(); // item index -> bucket
  let selected = null;
  const pool = h('div', { class: 'pool' });
  const buckets = h('div', { class: 'buckets' });
  const makeToken = (it, inBucket) => {
    const tok = h('button', { class: 'token block' + (selected === it.i ? ' sel' : ''), type: 'button', dataset: { i: it.i }, 'aria-label': `${it.text}. ${inBucket ? 'Tap to send back.' : 'Drag to a cart, or tap then tap a cart.'}` }, h('span', { class: 'block-face' }, it.text));
    // tap flow
    tok.addEventListener('click', e => {
      if (tok.dataset.dragged) { delete tok.dataset.dragged; return; }
      if (inBucket) { if (selected !== null) return; e.stopPropagation(); placed.delete(it.i); app.sound('knock'); draw(); return; }
      selected = selected === it.i ? null : it.i; app.sound('tick'); draw();
    });
    // pointer drag flow (mouse, touch, pen)
    tok.addEventListener('pointerdown', e => {
      if (e.button !== undefined && e.button !== 0) return;
      const start = { x: e.clientX, y: e.clientY }; let ghost = null; let moved = false; let over = null;
      const onMove = ev => {
        const dx = ev.clientX - start.x; const dy = ev.clientY - start.y;
        if (!moved && Math.hypot(dx, dy) < 6) return;
        if (!moved) { moved = true; tok.setPointerCapture(ev.pointerId); ghost = tok.cloneNode(true); ghost.classList.add('drag-ghost'); const r = tok.getBoundingClientRect(); ghost.style.width = r.width + 'px'; ghost.style.left = r.left + 'px'; ghost.style.top = r.top + 'px'; document.body.appendChild(ghost); tok.classList.add('lifted'); app.sound('rustle'); }
        ghost.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-6, Math.min(6, dx / 30))}deg)`;
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const b = el && el.closest('.bucket');
        if (b !== over) { over && over.classList.remove('over'); over = b; over && over.classList.add('over'); if (over) app.sound('tick'); }
        ev.preventDefault();
      };
      const onUp = ev => {
        tok.removeEventListener('pointermove', onMove); tok.removeEventListener('pointerup', onUp); tok.removeEventListener('pointercancel', onUp);
        if (!moved) return;
        tok.dataset.dragged = '1';
        ghost && ghost.remove(); tok.classList.remove('lifted');
        const el = document.elementFromPoint(ev.clientX, ev.clientY); const b = el && el.closest('.bucket');
        if (b) { placed.set(it.i, Number(b.dataset.bi)); selected = null; app.sound('crumble'); } else if (inBucket) { placed.delete(it.i); app.sound('knock'); }
        over && over.classList.remove('over');
        draw();
      };
      tok.addEventListener('pointermove', onMove); tok.addEventListener('pointerup', onUp); tok.addEventListener('pointercancel', onUp);
    });
    return tok;
  };
  const draw = () => {
    pool.innerHTML = ''; buckets.innerHTML = '';
    for (const it of items) if (!placed.has(it.i)) pool.appendChild(makeToken(it, false));
    if (!pool.children.length) pool.appendChild(h('span', { class: 'small muted' }, 'Every block is loaded. Check your sorting.'));
    act.buckets.forEach((b, bi) => {
      const bucket = h('div', { class: 'bucket cart' + (selected !== null ? ' target' : ''), role: 'button', tabindex: '0', dataset: { bi }, onClick: () => { if (selected !== null) { placed.set(selected, bi); selected = null; app.sound('crumble'); draw(); } }, onKeydown: e => { if ((e.key === 'Enter' || e.key === ' ') && selected !== null) { e.preventDefault(); placed.set(selected, bi); selected = null; draw(); } } },
        h('h4', null, icon('wagon', { size: 18, tone: 'gold' }), b), h('div', { class: 'items' }, items.filter(it => placed.get(it.i) === bi).map(it => makeToken(it, true))), h('div', { class: 'cart-wheels', 'aria-hidden': 'true' }));
      buckets.appendChild(bucket);
    });
  };
  draw();
  body.append(h('p', { class: 'small muted' }, 'Drag each stone block into the right cart. On a keyboard or by tap: pick a block, then pick its cart. Tap a loaded block to send it back.'), pool, buckets,
    h('button', { class: 'btn primary big mt', onClick: () => {
      if (placed.size < items.length) { app.toast('Load every block first', 'bad'); return; }
      let ok = 0;
      for (const it of items) { const good = placed.get(it.i) === it.bucket; if (good) ok++; const tok = buckets.querySelector(`.token[data-i="${it.i}"]`); if (tok) tok.classList.add(good ? 'ok' : 'bad'); }
      finish(ok / items.length, ok < items.length ? h('div', { class: 'mt-sm' }, h('b', { class: 'small' }, 'Correct carts:'), h('ul', { class: 'fig' }, act.buckets.map((b, bi) => h('li', null, h('b', null, b + ': '), act.items.filter(x => x.bucket === bi).map(x => x.text).join(', '))))) : null);
    } }, 'Check the carts'));
}

function matchGame(app, act, body, finish) {
  // String a rope between pairs, like rigging a ballista: tap a term then its match, or drag from left to right.
  const lefts = act.pairs.map((p, i) => ({ text: p.left, i }));
  const rights = shuffle(act.pairs.map((p, i) => ({ text: p.right, i })));
  const pairs = new Map(); // left i -> right i
  let selLeft = null;
  const grid = h('div', { class: 'match-grid ropes' });
  const ropeLayer = svg('svg', { class: 'rope-layer', 'aria-hidden': 'true' });
  const liveRope = svg('path', { class: 'rope live', d: '' }); ropeLayer.appendChild(liveRope);
  const letters = 'ABCDEFGHIJ';
  const wrap = h('div', { class: 'ropes-wrap' }, ropeLayer, grid);
  const ropeD = (x1, y1, x2, y2) => { const sag = Math.min(40, Math.abs(x2 - x1) * 0.12); return `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag} ${x2} ${y2}`; };
  const anchors = () => { const r = wrap.getBoundingClientRect(); const L = [...grid.querySelectorAll('.col:first-child .match-item')].map(e => { const b = e.getBoundingClientRect(); return [b.right - r.left, b.top + b.height / 2 - r.top]; }); const R = [...grid.querySelectorAll('.col:last-child .match-item')].map(e => { const b = e.getBoundingClientRect(); return [b.left - r.left, b.top + b.height / 2 - r.top]; }); return { L, R }; };
  const drawRopes = () => { ropeLayer.querySelectorAll('.rope:not(.live)').forEach(x => x.remove()); const r = wrap.getBoundingClientRect(); ropeLayer.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`); ropeLayer.setAttribute('width', r.width); ropeLayer.setAttribute('height', r.height); const { L, R } = anchors(); for (const [li, ri] of pairs) { const a = L[lefts.findIndex(l => l.i === li)], b = R[rights.findIndex(x => x.i === ri)]; if (a && b) ropeLayer.appendChild(svg('path', { class: 'rope', d: ropeD(a[0], a[1], b[0], b[1]) })); } };
  const draw = () => {
    grid.innerHTML = '';
    const lcol = h('div', { class: 'col' }); const rcol = h('div', { class: 'col' });
    for (const l of lefts) { const r = pairs.get(l.i); const item = h('button', { class: 'match-item' + (selLeft === l.i ? ' sel' : '') + (r !== undefined ? ' paired' : ''), type: 'button', onClick: () => { if (dragging) return; selLeft = selLeft === l.i ? null : l.i; app.sound('tick'); draw(); } }, h('span', { class: 'knot' }), r !== undefined ? h('span', { class: 'tag' }, letters[rights.findIndex(x => x.i === r)]) : null, l.text);
      item.addEventListener('pointerdown', ev => startRope(ev, l.i, item)); lcol.appendChild(item); }
    rights.forEach((r, ri) => { const taken = [...pairs.values()].includes(r.i); rcol.appendChild(h('button', { class: 'match-item right' + (taken ? ' paired' : ''), type: 'button', dataset: { ri: r.i }, onClick: () => { if (selLeft === null) return; tie(selLeft, r.i); selLeft = null; draw(); } }, h('span', { class: 'tag' }, letters[ri]), r.text, h('span', { class: 'knot' }))); });
    grid.append(lcol, rcol);
    requestAnimationFrame(drawRopes);
  };
  const tie = (li, ri) => { for (const [k, v] of pairs) if (v === ri) pairs.delete(k); pairs.set(li, ri); app.sound('seal'); };
  let dragging = false;
  function startRope(ev, li, item) {
    const start = { x: ev.clientX, y: ev.clientY }; let moved = false;
    const onMove = e => { const dx = e.clientX - start.x, dy = e.clientY - start.y; if (!moved && Math.hypot(dx, dy) < 8) return; if (!moved) { moved = true; dragging = true; try { item.setPointerCapture(e.pointerId); } catch { /* ignore */ } item.classList.add('sel'); app.sound('rustle'); }
      const r = wrap.getBoundingClientRect(); const { L } = anchors(); const a = L[lefts.findIndex(l => l.i === li)]; liveRope.setAttribute('d', ropeD(a[0], a[1], e.clientX - r.left, e.clientY - r.top)); e.preventDefault(); };
    const onUp = e => { item.removeEventListener('pointermove', onMove); item.removeEventListener('pointerup', onUp); item.removeEventListener('pointercancel', onUp); if (!moved) return; liveRope.setAttribute('d', ''); const el = document.elementFromPoint(e.clientX, e.clientY); const t = el && el.closest('.match-item.right'); if (t) { tie(li, Number(t.dataset.ri)); selLeft = null; } setTimeout(() => { dragging = false; }, 0); draw(); };
    item.addEventListener('pointermove', onMove); item.addEventListener('pointerup', onUp); item.addEventListener('pointercancel', onUp);
  }
  draw();
  const ro = new ResizeObserver(() => drawRopes()); ro.observe(wrap);
  body.append(h('p', { class: 'small muted' }, 'Tap a term on the left, then its match on the right, or drag a rope from a term to its match.'), wrap,
    h('button', { class: 'btn primary big mt', onClick: () => {
      if (pairs.size < lefts.length) { app.toast('Match every item first', 'bad'); return; }
      let ok = 0;
      const lcol = grid.querySelector('.col');
      lefts.forEach((l, idx) => { const good = pairs.get(l.i) === l.i; if (good) ok++; lcol.children[idx].classList.add(good ? 'ok' : 'bad'); });
      ropeLayer.querySelectorAll('.rope:not(.live)').forEach((p, k) => { const li = [...pairs.keys()][k]; p.classList.add(pairs.get(li) === li ? 'ok' : 'bad'); });
      finish(ok / lefts.length, ok < lefts.length ? h('div', { class: 'mt-sm' }, h('b', { class: 'small' }, 'Correct pairs:'), h('ul', { class: 'fig' }, act.pairs.map(p => h('li', null, h('b', null, p.left + ' → '), p.right)))) : null);
    } }, 'Check the rigging'));
}

// ---------- Flashcards ----------
function flashConfig(app) {
  const saved = JSON.parse(sessionStorage.getItem('flashcfg') || 'null');
  const selected = new Set(saved?.chapterList || app.content.chapters.map(c => c.chapter));
  let filter = saved?.filter || 'all'; let side = saved?.side || 'term';
  const fSeg = h('div', { class: 'seg' }, [['all', 'All'], ['weak', 'Below Solid'], ['due', 'Due / pursuit']].map(([k, l]) => h('button', { class: filter === k ? 'on' : '', onClick: e => { filter = k; fSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, l)));
  const sSeg = h('div', { class: 'seg' }, [['term', 'Show term → recall definition'], ['def', 'Show definition → recall term']].map(([k, l]) => h('button', { class: side === k ? 'on' : '', onClick: e => { side = k; sSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, l)));
  return h('div', { class: 'runner' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', { class: 'row' }, icon('scroll', { size: 28, tone: 'gold' }), 'Scrolls'), h('p', null, 'Say the answer out loud before you flip. Grade honestly: “Again” schedules it soon, “Easy” pushes it far out. Self-grades can take a concept to Solid, but Mastered needs real questions.'))),
    h('div', { class: 'card stack' },
      h('div', { class: 'field' }, h('label', null, 'Chapters'), chapterPicker(app, selected)),
      h('div', { class: 'field' }, h('label', null, 'Deck'), fSeg), h('div', { class: 'field' }, h('label', null, 'Direction'), sSeg),
      h('button', { class: 'btn primary big', onClick: () => { if (!selected.size) { app.toast('Pick at least one chapter', 'bad'); return; } sessionStorage.setItem('flashcfg', JSON.stringify({ chapterList: [...selected], filter, side })); app.navigate('#/arcade/flash/go'); } }, 'Start deck')));
}

function flash(app) {
  const cfg = JSON.parse(sessionStorage.getItem('flashcfg') || '{}');
  const chapters = new Set(cfg.chapterList || app.content.chapters.map(c => c.chapter));
  const now = Date.now();
  let deck = [];
  for (const ch of app.content.chapters) {
    if (!chapters.has(ch.chapter)) continue;
    for (const c of ch.concepts) {
      const cs = app.state.concepts[c.id]; const lvl = masteryLevel(cs);
      if (cfg.filter === 'weak' && lvl >= 3) continue;
      if (cfg.filter === 'due' && !(cs && ((cs.a?.length && cs.due <= now) || cs.pursuit))) continue;
      deck.push({ c, ch });
    }
  }
  deck = shuffle(deck);
  const host = h('div', { class: 'runner flash-host' });
  if (!deck.length) { host.appendChild(h('div', { class: 'empty' }, 'No cards match this deck. ', h('a', { href: '#/arcade/flash' }, 'Change the filter'))); return host; }
  let idx = 0; let graded = { again: 0, hard: 0, good: 0, easy: 0 };
  const head = h('div', { class: 'runner-head' });
  const cardHost = h('div');
  host.append(head, cardHost);
  const draw = () => {
    head.innerHTML = '';
    head.append(h('div', null, h('div', { class: 'eyebrow' }, 'Scrolls'), h('div', { class: 'small muted' }, `${idx + 1} / ${deck.length}`)), h('div', { class: 'row' }, h('span', { class: 'chip' }, `again ${graded.again} · hard ${graded.hard} · good ${graded.good} · easy ${graded.easy}`), h('a', { class: 'btn sm ghost', href: '#/arcade/flash' }, 'End')));
    head.appendChild(h('div', { class: 'bar', style: { height: '6px' } }, h('div', { class: 'bar-fill', style: { width: (idx / deck.length * 100) + '%', background: 'var(--accent)' } })));
    cardHost.innerHTML = '';
    if (idx >= deck.length) {
      cardHost.appendChild(h('div', { class: 'card center' }, h('h2', null, 'Deck complete'), h('p', { class: 'muted' }, `${deck.length} cards. ${graded.again} marked Again will come back soon.`),
        h('div', { class: 'row wrap mt', style: { justifyContent: 'center' } }, h('a', { class: 'btn primary', href: '#/arcade/flash/go' }, 'Shuffle and repeat'), h('a', { class: 'btn ghost', href: '#/arcade/flash' }, 'New deck'), h('a', { class: 'btn ghost', href: '#/home' }, 'Home'))));
      return;
    }
    const { c, ch } = deck[idx];
    const front = cfg.side === 'def' ? h('div', null, h('div', { class: 'eyebrow' }, `Ch ${ch.chapter} · which term?`), h('p', { class: 'def', style: { fontSize: '1.15rem' } }, c.definition)) : h('div', null, h('div', { class: 'eyebrow' }, `Ch ${ch.chapter} · define it`), h('div', { class: 'term' }, c.term));
    const card = h('div', { class: 'flash', style: { '--ch': ch.color } }, h('div', { class: 'flash-inner' },
      h('div', { class: 'flash-face', onClick: () => { app.sound('unroll'); card.classList.add('flipped'); } }, front, h('p', { class: 'tiny muted' }, 'Tap or press Space to flip')),
      h('div', { class: 'flash-face back', onClick: () => card.classList.remove('flipped') }, conceptCard(app, c.id, { compact: true, showMastery: true }))));
    const grade = (g) => {
      graded[g]++;
      const q = { id: 'fc-' + c.id, concept: c.id, angle: 'define', difficulty: 1, type: 'flash' };
      if (g === 'again') app.answer(q, false, { mode: 'flash', self: true });
      else app.answer(q, true, { mode: 'flash', self: g === 'good' ? true : g });
      idx++; draw();
    };
    const grades = h('div', { class: 'flash-grade' },
      h('button', { class: 'btn danger', onClick: () => grade('again') }, 'Again', h('small', null, 'blanked · 1')),
      h('button', { class: 'btn', onClick: () => grade('hard') }, 'Hard', h('small', null, 'hesitated · 2')),
      h('button', { class: 'btn', onClick: () => grade('good') }, 'Good', h('small', null, 'got it · 3')),
      h('button', { class: 'btn primary', onClick: () => grade('easy') }, 'Easy', h('small', null, 'instant · 4')));
    cardHost.append(card, grades);
  };
  draw();
  const onKey = e => {
    if (idx >= deck.length) return;
    const card = cardHost.querySelector('.flash');
    if (e.key === ' ') { e.preventDefault(); card && card.classList.toggle('flipped'); }
    const k = parseInt(e.key, 10);
    if (k >= 1 && k <= 4) { const btns = cardHost.querySelectorAll('.flash-grade .btn'); btns[k - 1] && btns[k - 1].click(); }
  };
  document.addEventListener('keydown', onKey);
  const prevCleanup = host.cleanup;
  host.cleanup = () => { document.removeEventListener('keydown', onKey); prevCleanup && prevCleanup(); };
  return host;
}
