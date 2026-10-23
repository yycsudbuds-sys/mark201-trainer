// Arcade: Blitz (timed), Confusables Duel, Build & Sort (activities), Flashcards.
import { h, shuffle, plural, fmtTime } from '../ui.js';
import { masteryLevel, MASTERY_LABELS } from '../engine.js';
import { chapterPicker } from './common.js';
import { createRunner, resultCard, missesList } from './runner.js';
import { conceptCard, masteryChip, figureEl } from './concept.js';

export function render(app, params) {
  const [sub, arg] = params;
  if (sub === 'blitz') return arg === 'go' ? blitz(app) : blitzConfig(app);
  if (sub === 'duel') return arg === 'go' ? duel(app) : duelConfig(app);
  if (sub === 'build') return arg ? activity(app, arg) : buildList(app);
  if (sub === 'flash') return arg === 'go' ? flash(app) : flashConfig(app);
  return hub(app);
}

function hub(app) {
  const tile = (href, ico, title, desc, color, meta) => h('a', { class: 'mode-tile', href, style: { '--ch': color } }, h('div', { class: 'ico' }, ico), h('h3', null, title), h('p', null, desc), h('div', { class: 'meta' }, meta.map(m => h('span', { class: 'chip' }, m))));
  const st = app.state.stats;
  const done = Object.values(app.state.activities).filter(a => a.done).length;
  return h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'The Arena'), h('p', null, 'Different contests, same engine underneath: every answer updates mastery and the review schedule.'))),
    h('div', { class: 'grid two' },
      tile('#/arcade/blitz', '⚡', 'Skirmish', '90 seconds, three lives, combo multiplier. Short questions only. Best for warming up recall.', '#D28C3C', [`Best ${st.blitzBest || 0}`]),
      tile('#/arcade/duel', '🗡️', 'Gladiator Duel', 'Only “tell them apart” and “which is NOT” questions, 20 seconds each, 15 rounds, three lives.', '#A98BC9', [`Best ${st.duelBest || 0}/15`]),
      tile('#/arcade/build', '🏗️', 'Siege Works', 'Order the processes, sort items into buckets, match pairs. The memorization tables as engineering.', '#8FAA5A', [`${done}/${app.content.stats.activities} built`]),
      tile('#/arcade/flash', '📜', 'Scrolls', 'Classic recall with honest self-grading. Again / Hard / Good / Easy feed the spacing schedule.', '#B08968', ['Recall'])));
}

// ---------- Blitz ----------
function blitzConfig(app) {
  const selected = new Set(JSON.parse(sessionStorage.getItem('blitzch') || 'null') || app.content.chapters.map(c => c.chapter));
  return h('div', { class: 'runner' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, '⚡ Skirmish'), h('p', null, '90 seconds on the clock, three lives. Every correct answer scores 100 × your combo multiplier (+0.5× every 3 in a row). Wrong answers cost a life and reset the combo.'))),
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
    title: 'Skirmish', subtitle: 'Fast. Short. Three lives.', mode: 'blitz', chapters, feedback: 'immediate', hearts: 3, timer: 90, pursuit: false,
    pickOpts: { difficultyMax: 2, shortOnly: true, excludeMastered: false }, showLearnOnWrong: false,
    onAnswer: ({ correct }) => {
      if (correct) { combo++; const mult = 1 + Math.floor(combo / 3) * 0.5; score += Math.round(100 * mult); scoreEl.children[1].textContent = String(score); scoreEl.children[2].textContent = `multiplier ×${mult.toFixed(1)}`; }
      else { combo = 0; scoreEl.children[2].textContent = 'multiplier ×1.0'; }
    },
    onFinish: (sum, reason) => {
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
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, '🗡️ Gladiator Duel'), h('p', null, 'The exam loves near-miss distractors. This mode serves only “tell them apart” and “which is NOT” questions: 15 rounds, 20 seconds each, three lives.'))),
    h('div', { class: 'card stack' },
      h('div', { class: 'field' }, h('label', null, 'Chapters'), chapterPicker(app, selected)),
      h('div', { class: 'row wrap' }, h('span', { class: 'chip' }, `Best: ${app.state.stats.duelBest || 0}/15`)),
      h('button', { class: 'btn primary big', onClick: () => { if (!selected.size) { app.toast('Pick at least one chapter', 'bad'); return; } sessionStorage.setItem('duelch', JSON.stringify([...selected])); app.navigate('#/arcade/duel/go'); } }, 'Duel!')));
}

function duel(app) {
  const chapters = new Set(JSON.parse(sessionStorage.getItem('duelch') || 'null') || app.content.chapters.map(c => c.chapter));
  const host = h('div', { style: { '--ch': '#A78BFA' } });
  const runner = createRunner(app, {
    title: 'Gladiator Duel', subtitle: '15 rounds · 20 s each · 3 lives', mode: 'duel', chapters, feedback: 'immediate', hearts: 3, limit: 15, perQuestionTimer: 20, pursuit: true,
    pickOpts: { anglesOnly: new Set(['contrast', 'not']), excludeMastered: false },
    onFinish: (sum, reason) => {
      if (sum.correct > (app.state.stats.duelBest || 0)) { app.state.stats.duelBest = sum.correct; app.toast('New Duel best!', 'xp'); }
      app.grantXp(sum.correct * 8, 'duel');
      app.store.save();
      host.innerHTML = '';
      host.append(resultCard(app, reason === 'hearts' ? 'Defeated' : 'Duel over', sum,
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
  const TYPE = { order: '🔢 Order', sort: '🗂️ Sort', match: '🔗 Match' };
  return h('div', null,
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, '🏗️ Siege Works'), h('p', null, 'The processes and tables the exam expects you to reproduce. A perfect build counts as a correct “sequence” answer for the concept.'))),
    h('div', { class: 'stack' }, app.content.chapters.map(ch => h('div', { class: 'card', style: { '--ch': ch.color } },
      h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter}`), h('h3', { class: 'mb' }, ch.title),
      h('div', { class: 'list' }, ch.activities.map(a => {
        const rec = app.state.activities[a.id];
        return h('a', { class: 'li', href: `#/arcade/build/${a.id}`, style: { textDecoration: 'none', color: 'inherit' } },
          h('span', { class: 'chip ch' }, TYPE[a.type]), h('div', { class: 'grow' }, h('div', { class: 't' }, a.title), h('div', { class: 's' }, app.conceptOf(a.concept)?.concept.term)),
          rec?.done ? h('span', { class: 'chip good' }, `✓ ${rec.best === 1 ? 'perfect' : Math.round(rec.best * 100) + '%'}`) : rec?.best !== undefined ? h('span', { class: 'chip warn' }, `${Math.round(rec.best * 100)}%`) : h('span', { class: 'chip' }, 'New'));
      }))))));
}

function activity(app, aid) {
  let act = null; let ch = null;
  for (const c of app.content.chapters) { const a = c.activities.find(x => x.id === aid); if (a) { act = a; ch = c; break; } }
  if (!act) return h('div', { class: 'card' }, 'Unknown activity. ', h('a', { href: '#/arcade/build' }, 'Back'));
  const host = h('div', { class: 'runner', style: { '--ch': ch.color } },
    h('a', { class: 'back', href: '#/arcade/build' }, '← Build & Sort'),
    h('div', { class: 'page-head mt-sm' }, h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter} · ${app.conceptOf(act.concept)?.concept.term}`), h('h2', null, act.title), h('p', null, act.prompt))));
  const body = h('div', { class: 'card' });
  host.appendChild(body);
  const finish = (fraction, detailEl) => {
    const perfect = fraction >= 0.999;
    const rec = app.state.activities[aid] || (app.state.activities[aid] = {});
    rec.best = Math.max(rec.best || 0, fraction); rec.tries = (rec.tries || 0) + 1; if (perfect) rec.done = Date.now();
    const q = { id: aid, concept: act.concept, angle: 'order', difficulty: 2, type: 'activity' };
    const res = app.answer(q, perfect, { mode: 'build', combo: 0 });
    if (perfect) { app.sound('clear'); app.confetti({ count: 70 }); } else app.sound('wrong');
    app.store.save();
    body.appendChild(h('div', { class: 'explain' },
      h('div', { class: 'verdict ' + (perfect ? 'ok' : 'no') }, perfect ? `✓ Perfect${res.xp ? ` · +${res.xp} XP` : ''}` : `${Math.round(fraction * 100)}% — not yet`),
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
  return n ? h('a', { class: 'btn ghost', href: `#/arcade/build/${n.id}` }, `Next: ${n.title} →`) : null;
}

function orderGame(app, act, body, finish) {
  const correct = act.items;
  let cur = shuffle(correct);
  if (cur.join('|') === correct.join('|')) cur = cur.reverse();
  const list = h('div', { class: 'order-list' });
  const draw = () => {
    list.innerHTML = '';
    cur.forEach((item, i) => list.appendChild(h('div', { class: 'order-item' },
      h('span', { class: 'idx' }, String(i + 1)), h('span', null, item),
      h('span', { class: 'mv' }, h('button', { class: 'icon-btn', 'aria-label': 'Move up', disabled: i === 0, onClick: () => { [cur[i - 1], cur[i]] = [cur[i], cur[i - 1]]; draw(); } }, '↑'), h('button', { class: 'icon-btn', 'aria-label': 'Move down', disabled: i === cur.length - 1, onClick: () => { [cur[i + 1], cur[i]] = [cur[i], cur[i + 1]]; draw(); } }, '↓')))));
  };
  draw();
  body.append(h('p', { class: 'small muted' }, 'Use the arrows to arrange the items from first to last, then check.'), list,
    h('button', { class: 'btn primary big mt', onClick: () => {
      let ok = 0;
      [...list.children].forEach((row, i) => { const good = cur[i] === correct[i]; if (good) ok++; row.classList.add(good ? 'ok' : 'bad'); });
      finish(ok / correct.length, ok < correct.length ? h('div', { class: 'mt-sm' }, h('b', { class: 'small' }, 'Correct order:'), h('ol', { class: 'fig' }, correct.map(x => h('li', null, x)))) : null);
    } }, 'Check order'));
}

function sortGame(app, act, body, finish) {
  const items = shuffle(act.items.map((it, i) => ({ ...it, i })));
  const placed = new Map(); // item index -> bucket
  let selected = null;
  const pool = h('div', { class: 'pool' });
  const buckets = h('div', { class: 'buckets' });
  const draw = () => {
    pool.innerHTML = ''; buckets.innerHTML = '';
    for (const it of items) if (!placed.has(it.i)) pool.appendChild(h('button', { class: 'token' + (selected === it.i ? ' sel' : ''), onClick: () => { selected = selected === it.i ? null : it.i; draw(); } }, it.text));
    if (!pool.children.length) pool.appendChild(h('span', { class: 'small muted' }, 'All items placed. Check your sorting.'));
    act.buckets.forEach((b, bi) => {
      const bucket = h('div', { class: 'bucket' + (selected !== null ? ' target' : ''), role: 'button', tabindex: '0', onClick: () => { if (selected !== null) { placed.set(selected, bi); selected = null; draw(); } } },
        h('h4', null, b), h('div', { class: 'items' }, items.filter(it => placed.get(it.i) === bi).map(it => h('button', { class: 'token', dataset: { i: it.i }, onClick: e => { if (selected !== null) return; e.stopPropagation(); placed.delete(it.i); draw(); } }, it.text))));
      buckets.appendChild(bucket);
    });
  };
  draw();
  body.append(h('p', { class: 'small muted' }, 'Tap an item, then tap its bucket. Tap a placed item to send it back.'), pool, buckets,
    h('button', { class: 'btn primary big mt', onClick: () => {
      if (placed.size < items.length) { app.toast('Place every item first', 'bad'); return; }
      let ok = 0;
      for (const it of items) { const good = placed.get(it.i) === it.bucket; if (good) ok++; const tok = buckets.querySelector(`.token[data-i="${it.i}"]`); if (tok) tok.classList.add(good ? 'ok' : 'bad'); }
      finish(ok / items.length, ok < items.length ? h('div', { class: 'mt-sm' }, h('b', { class: 'small' }, 'Correct buckets:'), h('ul', { class: 'fig' }, act.buckets.map((b, bi) => h('li', null, h('b', null, b + ': '), act.items.filter(x => x.bucket === bi).map(x => x.text).join(', '))))) : null);
    } }, 'Check sorting'));
}

function matchGame(app, act, body, finish) {
  const lefts = act.pairs.map((p, i) => ({ text: p.left, i }));
  const rights = shuffle(act.pairs.map((p, i) => ({ text: p.right, i })));
  const pairs = new Map(); // left i -> right i
  let selLeft = null;
  const grid = h('div', { class: 'match-grid' });
  const letters = 'ABCDEFGHIJ';
  const draw = () => {
    grid.innerHTML = '';
    const lcol = h('div', { class: 'col' }); const rcol = h('div', { class: 'col' });
    for (const l of lefts) { const r = pairs.get(l.i); lcol.appendChild(h('button', { class: 'match-item' + (selLeft === l.i ? ' sel' : '') + (r !== undefined ? ' paired' : ''), onClick: () => { selLeft = selLeft === l.i ? null : l.i; draw(); } }, r !== undefined ? h('span', { class: 'tag' }, letters[rights.findIndex(x => x.i === r)]) : null, l.text)); }
    rights.forEach((r, ri) => { const taken = [...pairs.values()].includes(r.i); rcol.appendChild(h('button', { class: 'match-item' + (taken ? ' paired' : ''), onClick: () => { if (selLeft === null) return; for (const [k, v] of pairs) if (v === r.i) pairs.delete(k); pairs.set(selLeft, r.i); selLeft = null; draw(); } }, h('span', { class: 'tag' }, letters[ri]), r.text)); });
    grid.append(lcol, rcol);
  };
  draw();
  body.append(h('p', { class: 'small muted' }, 'Tap a term on the left, then its match on the right.'), grid,
    h('button', { class: 'btn primary big mt', onClick: () => {
      if (pairs.size < lefts.length) { app.toast('Match every item first', 'bad'); return; }
      let ok = 0;
      const lcol = grid.querySelector('.col');
      lefts.forEach((l, idx) => { const good = pairs.get(l.i) === l.i; if (good) ok++; lcol.children[idx].classList.add(good ? 'ok' : 'bad'); });
      finish(ok / lefts.length, ok < lefts.length ? h('div', { class: 'mt-sm' }, h('b', { class: 'small' }, 'Correct pairs:'), h('ul', { class: 'fig' }, act.pairs.map(p => h('li', null, h('b', null, p.left + ' → '), p.right)))) : null);
    } }, 'Check matches'));
}

// ---------- Flashcards ----------
function flashConfig(app) {
  const saved = JSON.parse(sessionStorage.getItem('flashcfg') || 'null');
  const selected = new Set(saved?.chapterList || app.content.chapters.map(c => c.chapter));
  let filter = saved?.filter || 'all'; let side = saved?.side || 'term';
  const fSeg = h('div', { class: 'seg' }, [['all', 'All'], ['weak', 'Below Solid'], ['due', 'Due / pursuit']].map(([k, l]) => h('button', { class: filter === k ? 'on' : '', onClick: e => { filter = k; fSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, l)));
  const sSeg = h('div', { class: 'seg' }, [['term', 'Show term → recall definition'], ['def', 'Show definition → recall term']].map(([k, l]) => h('button', { class: side === k ? 'on' : '', onClick: e => { side = k; sSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, l)));
  return h('div', { class: 'runner' },
    h('div', { class: 'page-head' }, h('div', null, h('h1', null, '📜 Scrolls'), h('p', null, 'Say the answer out loud before you flip. Grade honestly: “Again” schedules it soon, “Easy” pushes it far out. Self-grades can take a concept to Solid, but Mastered needs real questions.'))),
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
  const host = h('div', { class: 'runner' });
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
      h('div', { class: 'flash-face', onClick: () => card.classList.add('flipped') }, front, h('p', { class: 'tiny muted' }, 'Tap or press Space to flip')),
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
  host.cleanup = () => document.removeEventListener('keydown', onKey);
  return host;
}
