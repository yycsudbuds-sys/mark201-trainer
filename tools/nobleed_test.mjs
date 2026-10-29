// No-bleed test (node): every course pack's ids carry the course prefix, every reference stays inside the course,
// no id exists in two packs, and the engine's selection only ever returns questions of the course it was given.
import { readdirSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { pickNext, buildExam, contentIndex, chapterOfConcept, questionsForConcept } from '../app/engine.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const coursesDir = path.join(ROOT, 'app', 'courses');
const packs = [];
for (const id of readdirSync(coursesDir)) {
  const f = path.join(coursesDir, id, 'data.js');
  if (!existsSync(f)) continue;
  const m = await import(pathToFileURL(f).href);
  packs.push({ id, content: m.CONTENT });
}
let fails = 0;
const fail = (msg) => { fails++; console.log('FAIL', msg); };
const allIds = new Map();
for (const { id, content } of packs) {
  const p = id + '-';
  if (content.course !== id) fail(`${id}: content.course is ${content.course}`);
  const concepts = new Set();
  let nq = 0, nc = 0;
  for (const ch of content.chapters) {
    for (const t of ch.topics) { if (!t.id.startsWith(p)) fail(`${id}: topic ${t.id} unprefixed`); for (const c of t.concepts) if (!c.startsWith(p)) fail(`${id}: topic ${t.id} references ${c}`); }
    for (const c of ch.concepts) { nc++; if (!c.id.startsWith(p)) fail(`${id}: concept ${c.id} unprefixed`); concepts.add(c.id); if (allIds.has(c.id) && allIds.get(c.id) !== id) fail(`${c.id} exists in ${allIds.get(c.id)} and ${id}`); allIds.set(c.id, id); }
    for (const q of ch.questions) { nq++; if (!q.id.startsWith(p)) fail(`${id}: question ${q.id} unprefixed`); if (!q.concept.startsWith(p)) fail(`${id}: ${q.id} -> ${q.concept}`); if (allIds.has(q.id) && allIds.get(q.id) !== id) fail(`${q.id} exists twice`); allIds.set(q.id, id); }
    for (const a of ch.activities || []) { if (!a.id.startsWith(p)) fail(`${id}: activity ${a.id} unprefixed`); if (a.concept && !a.concept.startsWith(p)) fail(`${id}: activity ${a.id} -> ${a.concept}`); }
  }
  for (const ch of content.chapters) for (const q of ch.questions) if (!concepts.has(q.concept)) fail(`${id}: ${q.id} points at unknown concept ${q.concept}`);
  // the engine over this content only ever yields this course's ids
  const ix = contentIndex(content);
  if (ix.chapterOf.size < nc) fail(`${id}: index covers ${ix.chapterOf.size} of ${nc} concepts`);
  const sample = content.chapters[0].concepts[0].id;
  if (chapterOfConcept(content, sample) !== content.chapters[0].chapter) fail(`${id}: chapterOfConcept wrong for ${sample}`);
  if (!questionsForConcept(content, sample).length) fail(`${id}: no questions indexed for ${sample}`);
  const state = { xp: 0, concepts: {}, questions: {}, stats: { answered: 0, correct: 0, byAngle: {} }, exams: [] };
  const recent = [], recentQids = [];
  for (let i = 0; i < 60; i++) {
    const pick = pickNext(content, state, { now: Date.now(), recent, recentQids, counter: i, pursuitQueue: [], mode: 'drill' });
    if (!pick) break;
    if (!pick.question.id.startsWith(p) || !pick.cid.startsWith(p)) fail(`${id}: pickNext returned ${pick.question.id}`);
    recent.push(pick.cid); recentQids.push(pick.question.id);
  }
  const exam = buildExam(content, state, { n: 40 });
  for (const q of exam) if (!q.id.startsWith(p)) fail(`${id}: buildExam returned ${q.id}`);
  console.log(`${id}: ${content.chapters.length} chapters, ${nc} concepts, ${nq} questions — ids clean`);
}
if (packs.length === 0) { console.log('no packs found'); process.exit(1); }
console.log(fails ? `${fails} failure(s)` : 'no-bleed test passed');
process.exit(fails ? 1 : 0);
