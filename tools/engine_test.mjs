import { recordAttempt, masteryLevel, pickNext, buildExam, shuffleOptions, conceptSummary, masteryGaps } from '../app/engine.js';

// synthetic content: 2 chapters, 3 concepts each, 6 questions per concept across angles
const angles = ['define','identify','apply','contrast','not','why'];
const content = { chapters: [] };
for (const chn of [7, 8]) {
  const nn = String(chn).padStart(2,'0');
  const ch = { chapter: chn, title: 'T'+chn, concepts: [], questions: [], topics: [], activities: [] };
  for (let c = 0; c < 3; c++) {
    const cid = `c${nn}-k${c}`;
    ch.concepts.push({ id: cid, term: cid });
    angles.forEach((a, i) => ch.questions.push({ id: `q${nn}-${c}${i}`, concept: cid, angle: a, type: 'mc', difficulty: (i%3)+1, stem: 'stem '+cid+' '+a, options: ['a','b','c','d'], answer: 1, explanation: 'x', source: 'generated' }));
  }
  content.chapters.push(ch);
}
const state = { xp: 0, concepts: {}, questions: {}, stats: { answered: 0, correct: 0, byAngle: {} }, exams: [] };
let now = 1000000;
const q = content.chapters[0].questions[0];
let r = recordAttempt(state, q, true, { now, sessionId: 1, combo: 0 });
console.log('after 1 correct level', r.after, 'xp', r.xp);
r = recordAttempt(state, content.chapters[0].questions[1], true, { now: now+1000, sessionId: 1, combo: 1 });
r = recordAttempt(state, content.chapters[0].questions[2], true, { now: now+2000, sessionId: 1, combo: 2 });
console.log('after 3 correct 3 angles same session level', masteryLevel(state.concepts['c07-k0']), 'gaps', masteryGaps(state.concepts['c07-k0']));
r = recordAttempt(state, content.chapters[0].questions[3], true, { now: now+3000, sessionId: 2, combo: 3 });
console.log('after 4th correct in session 2 ->', masteryLevel(state.concepts['c07-k0']), r.events);
r = recordAttempt(state, content.chapters[0].questions[4], false, { now: now+4000, sessionId: 2, combo: 0 });
console.log('after wrong ->', masteryLevel(state.concepts['c07-k0']), r.events, 'pursuit', state.concepts['c07-k0'].pursuit);
for (let i=0;i<3;i++) r = recordAttempt(state, content.chapters[0].questions[i], true, { now: now+5000+i, sessionId: 2, combo: i });
console.log('after 3 pursuit corrects ->', masteryLevel(state.concepts['c07-k0']), r.events, 'pursuit', state.concepts['c07-k0'].pursuit);

// picker interleaving
const recent = []; const recentQids = [];
const seen = {};
for (let i = 0; i < 12; i++) {
  const pick = pickNext(content, state, { now: now+100000+i*1000, recent, recentQids, counter: i, pursuitQueue: [], mode: 'drill' });
  recent.push(pick.cid); recentQids.push(pick.question.id);
  seen[pick.cid] = (seen[pick.cid]||0)+1;
  process.stdout.write(pick.cid + ':' + pick.reason + ' ');
}
console.log('\ninterleave distribution', seen);
// pursuit queue test
const pq = [{ cid: 'c08-k2', notBefore: 3 }];
const p3 = pickNext(content, state, { now, recent: ['c07-k0'], recentQids: [], counter: 3, pursuitQueue: pq, mode: 'drill' });
console.log('pursuit pick', p3.cid, p3.reason);
const exam = buildExam(content, state, { n: 10, chapters: null });
console.log('exam size', exam.length, 'chapters', exam.map(x=>x.id.slice(1,3)).join(','));
console.log('shuffle', shuffleOptions({ type:'mc', options:['a','b','c','All of the above'], answer: 3 }));
console.log('state xp', state.xp, 'stats', state.stats);
