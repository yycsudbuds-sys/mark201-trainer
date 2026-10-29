// Core learning engine: mastery model, spaced scheduling, pursuit (re-ask until concrete),
// adaptive question selection, XP. Pure functions over plain state so it is testable in Node.

export const MASTERY_LABELS = ['New', 'Seen', 'Learning', 'Solid', 'Mastered'];
export const ANGLES = ['define', 'identify', 'apply', 'contrast', 'not', 'why', 'calc', 'order'];
export const ANGLE_LABELS = {
  define: 'Definition', identify: 'Spot it in a scenario', apply: 'Apply it', contrast: 'Tell it apart',
  not: 'Exception', why: 'Why / when', calc: 'Calculate', order: 'Sequence',
};
export const BOX_INTERVALS_MIN = [0, 10, 60, 240, 720, 2160];
export const SESSION_GAP_MIN = 45;
export const PURSUIT_NEED = 3;

export const LEVELS = [
  { xp: 0, title: 'Tiro' },
  { xp: 300, title: 'Miles' },
  { xp: 800, title: 'Immunis' },
  { xp: 1500, title: 'Decanus' },
  { xp: 2500, title: 'Optio' },
  { xp: 4000, title: 'Centurio' },
  { xp: 6000, title: 'Primus Pilus' },
  { xp: 8500, title: 'Tribunus' },
  { xp: 11500, title: 'Legatus' },
  { xp: 15000, title: 'Consul' },
  { xp: 20000, title: 'Imperator' },
];

export function levelForXp(xp) {
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].xp) idx = i;
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { index: idx, number: idx + 1, title: cur.title, next, progress: Math.max(0, Math.min(1, progress)) };
}

export function emptyConceptState() {
  return { a: [], seen: 0, box: 0, due: 0, pursuit: null, lastAsk: 0 };
}

// attempt tuple: [t, qid, angle, correct(0/1), sessionId, self(0/1)]
export function conceptSummary(cs) {
  const a = cs ? cs.a : [];
  const total = a.length;
  let correct = 0; let correctHard = 0;
  const anglesHard = new Set(); const anglesAny = new Set();
  const sessions = new Set();
  for (const t of a) {
    if (t[3]) {
      correct++;
      anglesAny.add(t[2]);
      sessions.add(t[4]);
      if (!t[5]) { correctHard++; anglesHard.add(t[2]); }
    }
  }
  const last = a.slice(-3);
  const lastThreeAllCorrect = last.length >= 3 && last.every(t => t[3]);
  const lastTwoAllCorrect = last.length >= 2 && last.slice(-2).every(t => t[3]);
  const lastCorrect = total > 0 && !!a[total - 1][3];
  const wrong = total - correct;
  return { total, correct, wrong, correctHard, anglesHard, anglesAny, sessions: sessions.size, lastThreeAllCorrect, lastTwoAllCorrect, lastCorrect };
}

export function masteryLevel(cs) {
  if (!cs) return 0;
  const s = conceptSummary(cs);
  if (s.total === 0) return cs.seen ? 1 : 0;
  if (s.correctHard >= 4 && s.anglesHard.size >= 3 && s.lastThreeAllCorrect && s.sessions >= 2 && !cs.pursuit) return 4;
  if (s.correct >= 3 && s.anglesAny.size >= 2 && s.lastTwoAllCorrect) return 3;
  if (s.correct >= 1) return 2;
  return 1;
}

// What is still missing for "Mastered" — used to explain progress to the learner.
export function masteryGaps(cs) {
  const s = conceptSummary(cs || emptyConceptState());
  const gaps = [];
  if (s.correctHard < 4) gaps.push(`${4 - s.correctHard} more correct answer${4 - s.correctHard === 1 ? '' : 's'}`);
  if (s.anglesHard.size < 3) gaps.push(`${3 - s.anglesHard.size} more angle${3 - s.anglesHard.size === 1 ? '' : 's'}`);
  if (!s.lastThreeAllCorrect) gaps.push('last 3 in a row correct');
  if (s.sessions < 2) gaps.push('a correct answer in a later session');
  if (cs && cs.pursuit) gaps.push(`clear pursuit (${cs.pursuit.done}/${cs.pursuit.need})`);
  return gaps;
}

export function nextDue(box, now) {
  const mins = BOX_INTERVALS_MIN[Math.max(0, Math.min(BOX_INTERVALS_MIN.length - 1, box))];
  return now + mins * 60000;
}

export function xpForAnswer(q, correct, combo) {
  if (!correct) return 0;
  let xp = 10 * (q.difficulty || 1);
  if (q.angle === 'contrast' || q.angle === 'apply' || q.angle === 'calc') xp += 5;
  xp += 2 * Math.min(combo, 10);
  return xp;
}

/**
 * Record an answer attempt. Mutates state. Returns a result describing what changed.
 * @param state profile state (see store.js)
 * @param q question object
 * @param correct boolean
 * @param ctx {mode, now, sessionId, self, combo}
 */
export function recordAttempt(state, q, correct, ctx) {
  const now = ctx.now || Date.now();
  const cid = q.concept;
  const cs = state.concepts[cid] || (state.concepts[cid] = emptyConceptState());
  const before = masteryLevel(cs);
  cs.a.push([now, q.id, q.angle, correct ? 1 : 0, ctx.sessionId, ctx.self ? 1 : 0]);
  if (cs.a.length > 40) cs.a.splice(0, cs.a.length - 40);
  cs.seen = 1;
  cs.lastAsk = now;
  const events = [];
  let xp = 0;
  if (correct) {
    if (ctx.self === 'hard') { /* keep box */ cs.due = now + 10 * 60000; }
    else if (ctx.self === 'easy') { cs.box = Math.min(5, cs.box + 2); cs.due = nextDue(cs.box, now); }
    else { cs.box = Math.min(5, cs.box + 1); cs.due = nextDue(cs.box, now); }
    if (cs.pursuit) {
      cs.pursuit.done += 1;
      cs.pursuit.angles.push(q.angle);
      if (cs.pursuit.done >= cs.pursuit.need) {
        cs.pursuit = null;
        events.push({ type: 'pursuitCleared', cid });
        xp += 25;
      } else {
        events.push({ type: 'pursuitProgress', cid, done: cs.pursuit.done, need: cs.pursuit.need });
      }
    }
    xp += ctx.self ? Math.round(xpForAnswer(q, true, 0) / 2) : xpForAnswer(q, true, ctx.combo || 0);
  } else {
    cs.box = 0;
    cs.due = now;
    if (!cs.pursuit) {
      cs.pursuit = { need: PURSUIT_NEED, done: 0, angles: [q.angle], since: now, lastQid: q.id };
      events.push({ type: 'pursuitStarted', cid });
    } else {
      cs.pursuit.done = 0;
      cs.pursuit.angles.push(q.angle);
      cs.pursuit.lastQid = q.id;
      events.push({ type: 'pursuitReset', cid });
    }
  }
  const qs = state.questions[q.id] || (state.questions[q.id] = { seen: 0, c: 0, w: 0, last: 0, lastCorrect: 0 });
  qs.seen += 1; qs.last = now; if (correct) { qs.c += 1; qs.lastCorrect = now; } else qs.w += 1;
  const after = masteryLevel(cs);
  if (after > before) {
    events.push({ type: 'masteryUp', cid, from: before, to: after });
    xp += after === 4 ? 60 : after === 3 ? 30 : 15;
  } else if (after < before) {
    events.push({ type: 'masteryDown', cid, from: before, to: after });
  }
  state.xp += xp;
  state.stats.answered += 1;
  if (correct) state.stats.correct += 1;
  state.stats.byAngle[q.angle] = state.stats.byAngle[q.angle] || { c: 0, w: 0 };
  state.stats.byAngle[q.angle][correct ? 'c' : 'w'] += 1;
  return { before, after, xp, events };
}

export function markSeen(state, cid, now) {
  const cs = state.concepts[cid] || (state.concepts[cid] = emptyConceptState());
  if (!cs.seen) { cs.seen = 1; cs.seenAt = now || Date.now(); return true; }
  return false;
}

// ---------- Selection ----------

function jitter(rng, amt) { return (rng ? rng() : Math.random()) * amt; }

/**
 * Pick the next question adaptively.
 * @param content {chapters:[...]} bundled content
 * @param state profile state
 * @param opts {
 *   chapters: Set<number>|null, concepts: Set<string>|null, now, recent: string[] (recent cids, most recent last),
 *   recentQids: string[], counter: number, pursuitQueue: [{cid, notBefore}], mode: 'drill'|'weak'|'campaign'|'exam'|'blitz',
 *   difficultyMax, shortOnly, anglesOnly: Set, rng
 * }
 * @returns {question, reason, cid} | null
 */
export function pickNext(content, state, opts) {
  const now = opts.now || Date.now();
  const rng = opts.rng || Math.random;
  const recent = opts.recent || [];
  const recentQids = new Set(opts.recentQids || []);
  const lastCid = recent[recent.length - 1];
  const lastChapter = lastCid ? chapterOfConcept(content, lastCid) : null;
  const allowed = (cid, ch) => (!opts.chapters || opts.chapters.has(ch)) && (!opts.concepts || opts.concepts.has(cid));

  // 1. Pursuit queue
  if (opts.pursuitQueue && opts.pursuitQueue.length) {
    const ready = opts.pursuitQueue.filter(p => p.notBefore <= opts.counter && p.cid !== lastCid);
    if (ready.length) {
      ready.sort((a, b) => a.notBefore - b.notBefore);
      for (const p of ready) {
        const q = pickQuestionForConcept(content, state, p.cid, { ...opts, recentQids, avoidQid: state.concepts[p.cid]?.pursuit?.lastQid, preferNewAngle: true });
        if (q) return { question: q, reason: 'pursuit', cid: p.cid, queueItem: p };
      }
    }
  }

  // 2. Score concepts
  const candidates = [];
  for (const ch of content.chapters) {
    for (const c of ch.concepts) {
      if (!allowed(c.id, ch.chapter)) continue;
      const cs = state.concepts[c.id];
      const level = masteryLevel(cs);
      if (opts.mode === 'weak' && level >= 3 && !(cs && cs.pursuit)) continue;
      if (opts.excludeMastered && level >= 4 && !(cs && cs.due <= now)) continue;
      let score = 0;
      score += (4 - level) * 1.0;
      if (!cs || cs.a.length === 0) score += opts.mode === 'weak' ? 0.5 : 1.6;
      if (cs && cs.pursuit) score += 2.5;
      if (cs && cs.due && cs.due <= now && level < 4) {
        const overdueH = (now - cs.due) / 3600000;
        score += 1.5 + Math.min(1.5, overdueH / 2);
      } else if (cs && cs.due && cs.due > now && level >= 3) {
        score -= 2.5; // not due yet and already solid: let it rest
      }
      const ri = recent.lastIndexOf(c.id);
      if (ri >= 0) {
        const ago = recent.length - ri; // 1 = last
        if (ago <= 2) score -= 6; else if (ago <= 5) score -= 2.5; else if (ago <= 9) score -= 1;
      }
      if (lastChapter !== null && ch.chapter === lastChapter && opts.interleave !== false) score -= 0.7;
      score += jitter(rng, 0.9);
      candidates.push({ cid: c.id, score, level, cs });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score);
  for (const cand of candidates.slice(0, 12)) {
    const q = pickQuestionForConcept(content, state, cand.cid, { ...opts, recentQids });
    if (q) {
      let reason = 'new';
      if (cand.cs && cand.cs.pursuit) reason = 'pursuit';
      else if (cand.cs && cand.cs.a.length && cand.level <= 2) reason = 'weak';
      else if (cand.cs && cand.cs.due && cand.cs.due <= now && cand.cs.a.length) reason = 'due';
      else if (cand.cs && cand.cs.a.length) reason = 'review';
      return { question: q, reason, cid: cand.cid };
    }
  }
  return null;
}

// One index per content bundle (built lazily, cached by object identity): concept id -> chapter number and
// concept id -> its questions. Ids are opaque strings prefixed with the course id, so nothing is parsed out of them.
const INDEX = new WeakMap();
export function contentIndex(content) {
  let ix = INDEX.get(content);
  if (ix) return ix;
  ix = { chapterOf: new Map(), byConcept: new Map() };
  for (const ch of content.chapters) {
    for (const c of ch.concepts) { ix.chapterOf.set(c.id, ch.chapter); if (!ix.byConcept.has(c.id)) ix.byConcept.set(c.id, []); }
    for (const q of ch.questions) {
      let arr = ix.byConcept.get(q.concept);
      if (!arr) { arr = []; ix.byConcept.set(q.concept, arr); }
      arr.push(q);
      if (!ix.chapterOf.has(q.concept)) ix.chapterOf.set(q.concept, ch.chapter);
    }
  }
  INDEX.set(content, ix);
  return ix;
}

export function chapterOfConcept(content, cid) {
  const ix = contentIndex(content);
  return ix.chapterOf.has(cid) ? ix.chapterOf.get(cid) : null;
}

export function questionsForConcept(content, cid) {
  return contentIndex(content).byConcept.get(cid) || [];
}

export function pickQuestionForConcept(content, state, cid, opts) {
  const now = opts.now || Date.now();
  const rng = opts.rng || Math.random;
  const cs = state.concepts[cid];
  const level = masteryLevel(cs);
  const summary = conceptSummary(cs || emptyConceptState());
  const recentQids = opts.recentQids || new Set();
  let pool = questionsForConcept(content, cid);
  if (opts.anglesOnly) pool = pool.filter(q => opts.anglesOnly.has(q.angle));
  if (opts.difficultyMax) pool = pool.filter(q => q.difficulty <= opts.difficultyMax);
  if (opts.shortOnly) pool = pool.filter(q => q.stem.split(/\s+/).length <= 45 && q.type !== 'fill');
  if (opts.excludeQids) pool = pool.filter(q => !opts.excludeQids.has(q.id));
  if (!pool.length) return null;
  const targetDiff = level <= 1 ? [1, 2] : level === 2 ? [2] : [2, 3];
  const scored = pool.map(q => {
    const qs = state.questions[q.id];
    let s = 0;
    if (!qs) s += 3;
    else {
      if (qs.lastCorrect && now - qs.lastCorrect < 24 * 3600000) s -= 2.5;
      if (qs.w > qs.c) s += 1.2; // struggled with this one before: re-ask later
      if (now - qs.last < 20 * 60000) s -= 3;
    }
    if (recentQids.has(q.id)) s -= 8;
    if (opts.avoidQid && q.id === opts.avoidQid) s -= 6;
    if (!summary.anglesHard.has(q.angle)) s += 2; // a new angle for this concept
    if (opts.preferNewAngle && cs && cs.pursuit && cs.pursuit.angles.includes(q.angle)) s -= 1.5;
    if (targetDiff.includes(q.difficulty)) s += 1;
    if (q.source === 'official') s += 0.4;
    s += jitter(rng, 0.8);
    return { q, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored[0].q;
}

/** Build an exam: n questions spread across chapters, favouring difficulty 2-3 and unseen items. */
export function buildExam(content, state, { n, chapters, rng, now }) {
  rng = rng || Math.random;
  now = now || Date.now();
  const chs = content.chapters.filter(c => !chapters || chapters.has(c.chapter));
  const totalConcepts = chs.reduce((s, c) => s + c.concepts.length, 0);
  const picks = [];
  const used = new Set();
  const usedConcepts = new Map();
  // allocate per chapter proportional to concepts
  let allocated = 0;
  const alloc = chs.map((c, i) => {
    const k = i === chs.length - 1 ? n - allocated : Math.round(n * c.concepts.length / totalConcepts);
    allocated += k;
    return { ch: c, k };
  });
  for (const { ch, k } of alloc) {
    const pool = ch.questions.map(q => {
      const qs = state.questions[q.id];
      let s = 0;
      if (!qs) s += 2.5; else if (qs.lastCorrect && now - qs.lastCorrect < 12 * 3600000) s -= 1.5;
      if (q.difficulty === 1) s -= 1.0; else if (q.difficulty === 3) s += 0.6;
      if (q.angle === 'identify' || q.angle === 'apply') s += 0.6;
      if (q.source === 'official') s += 0.3;
      s += rng() * 1.6;
      return { q, s };
    }).sort((a, b) => b.s - a.s);
    let taken = 0;
    for (const { q } of pool) {
      if (taken >= k) break;
      if (used.has(q.id)) continue;
      const cnt = usedConcepts.get(q.concept) || 0;
      if (cnt >= 2 && pool.length > k * 2) continue; // spread across concepts
      used.add(q.id); usedConcepts.set(q.concept, cnt + 1); picks.push(q); taken++;
    }
  }
  // shuffle
  for (let i = picks.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [picks[i], picks[j]] = [picks[j], picks[i]]; }
  return picks;
}

/** Shuffle options while tracking the correct index. Returns {options, answer, map}. */
export function shuffleOptions(q, rng) {
  rng = rng || Math.random;
  if (q.type === 'tf') return { options: q.options.slice(), answer: q.answer, map: q.options.map((_, i) => i) };
  const idx = q.options.map((_, i) => i);
  // keep "all/none of the above" last if present
  const pinned = idx.filter(i => /\b(all|none) of (the above|these)\b/i.test(q.options[i]));
  const free = idx.filter(i => !pinned.includes(i));
  for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [free[i], free[j]] = [free[j], free[i]]; }
  const map = free.concat(pinned);
  return { options: map.map(i => q.options[i]), answer: map.indexOf(q.answer), map };
}

// ---------- Aggregates ----------

export function chapterMastery(content, state, chapterNum) {
  const ch = content.chapters.find(c => c.chapter === chapterNum);
  if (!ch) return null;
  const dist = [0, 0, 0, 0, 0];
  let sum = 0; let attempted = 0; let pursuits = 0;
  for (const c of ch.concepts) {
    const cs = state.concepts[c.id];
    const lvl = masteryLevel(cs);
    dist[lvl]++;
    sum += [0, 0.15, 0.4, 0.75, 1][lvl];
    if (cs && cs.a.length) attempted++;
    if (cs && cs.pursuit) pursuits++;
  }
  const n = ch.concepts.length || 1;
  return { dist, score: sum / n, attempted, total: n, pursuits };
}

export function readiness(content, state) {
  let sum = 0; let n = 0; let attempted = 0;
  for (const ch of content.chapters) {
    for (const c of ch.concepts) {
      const cs = state.concepts[c.id];
      const lvl = masteryLevel(cs);
      sum += [0, 0.15, 0.4, 0.75, 1][lvl]; n++;
      if (cs && cs.a.length) attempted++;
    }
  }
  const mastery = n ? sum / n : 0;
  const exams = (state.exams || []).slice(-2);
  const examAvg = exams.length ? exams.reduce((s, e) => s + e.score, 0) / exams.length : null;
  const coverage = n ? attempted / n : 0;
  let score = mastery * 0.6 + coverage * 0.15 + (examAvg === null ? mastery * 0.25 : examAvg * 0.25);
  return { score, mastery, coverage, examAvg, concepts: n, attempted };
}

export function weakestConcepts(content, state, limit = 10, chapters = null) {
  const rows = [];
  for (const ch of content.chapters) {
    if (chapters && !chapters.has(ch.chapter)) continue;
    for (const c of ch.concepts) {
      const cs = state.concepts[c.id];
      if (!cs || !cs.a.length) continue;
      const s = conceptSummary(cs);
      const lvl = masteryLevel(cs);
      const acc = s.total ? s.correct / s.total : 0;
      rows.push({ concept: c, chapter: ch, level: lvl, acc, wrong: s.wrong, total: s.total, pursuit: !!cs.pursuit });
    }
  }
  rows.sort((a, b) => (a.level - b.level) || (a.acc - b.acc) || (b.wrong - a.wrong));
  return rows.slice(0, limit);
}

export function dueCount(content, state, now) {
  now = now || Date.now();
  let due = 0;
  for (const ch of content.chapters) for (const c of ch.concepts) {
    const cs = state.concepts[c.id];
    if (cs && cs.a.length && cs.due <= now && masteryLevel(cs) < 4) due++;
  }
  return due;
}
