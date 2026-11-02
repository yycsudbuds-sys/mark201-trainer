// The midterm simulator follows the pack's exam format: chapter weights and the typed-answer share.
// Usage: node tools/exam_format_test.mjs
import { buildExam } from '../app/engine.js';
import { CONTENT } from '../app/courses/fin201/data.js';
import { GENERATORS, generatorQuestions } from '../app/courses/fin201/generators.js';

// mirror pack.js: generator questions join the chapter pools
const byChapter = new Map(CONTENT.chapters.map(ch => [ch.chapter, ch]));
const conceptChapter = new Map(); for (const ch of CONTENT.chapters) for (const c of ch.concepts) conceptChapter.set(c.id, ch.chapter);
for (const gq of generatorQuestions('fin201')) { const ch = byChapter.get(conceptChapter.get(gq.concept)); if (ch) ch.questions.push(gq); }

const format = { minutes: 60, marks: 100, mc: 13, mcMarks: 4, numeric: 6, numericMarks: 48, weights: { 8: 0.35, 9: 0.14, 10: 0.18, 11: 0.08, 12: 0.12, 13: 0.13 } };
const state = { questions: {}, concepts: {} };
let seed = 7; const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
let fails = 0;
const check = (name, ok, detail) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' — ' + detail : '')); if (!ok) fails++; };
const isNumeric = q => q.type === 'numeric' || q.type === 'multistep';

for (const n of [19, 30, 10]) {
  const qs = buildExam(CONTENT, state, { n, chapters: new Set([8, 9, 10, 11, 12, 13]), rng, format });
  const numeric = qs.filter(isNumeric).length;
  const want = Math.round(n * 6 / 19);
  const perCh = {}; for (const q of qs) { const ch = conceptChapter.get(q.concept); perCh[ch] = (perCh[ch] || 0) + 1; }
  check(`${n} Q paper has ${n} distinct questions`, qs.length === n && new Set(qs.map(q => q.id)).size === n, qs.length);
  check(`${n} Q paper carries the real numeric share (${want})`, Math.abs(numeric - want) <= 1, `numeric ${numeric}`);
  const ch8 = perCh[8] || 0, ch11 = perCh[11] || 0;
  check(`${n} Q paper weights stocks (35%) above project analysis (8%)`, ch8 >= Math.round(n * 0.3) && ch11 <= Math.round(n * 0.15), JSON.stringify(perCh));
}
// a single-chapter paper still works and the weights renormalise
const one = buildExam(CONTENT, state, { n: 10, chapters: new Set([11]), rng, format });
check('single-chapter paper fills from that chapter', one.length === 10 && one.every(q => conceptChapter.get(q.concept) === 11), one.length);
// without a format: unchanged behaviour (proportional to concepts, any type)
const plain = buildExam(CONTENT, state, { n: 19, chapters: new Set([8, 9, 10, 11, 12, 13]), rng });
check('no format: still 19 distinct questions', plain.length === 19 && new Set(plain.map(q => q.id)).size === 19);
console.log(fails ? `${fails} check(s) failed` : 'exam format test passed');
process.exit(fails ? 1 : 0);
