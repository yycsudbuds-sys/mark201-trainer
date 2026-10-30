// FIN 201 Midterm 2 course pack: the eastern campaign. Six provinces from the Adriatic to Antioch, one per chapter
// (8 Illyricum, 9 Pannonia, 10 Dacia, 11 Thracia, 12 Cappadocia, 13 Syria). Content in data.js (tools/build_fin201.py).
import { CONTENT } from './data.js';
import { RIDGES } from '../../geo.js';
import { registerScenes } from '../../scenes.js';
import { registerCommanders } from '../../commanders.js';
import { registerEnemies } from '../../battle.js';
import { FIN_SCENES } from './scenes.js';
import { GENERATORS, generate, generatorQuestions } from './generators.js';

const ALL_ORDER = [8, 9, 10, 11, 12, 13];
/** Chapters present in the bundle, in campaign order (a partial build still gives a working map). */
export const ORDER = ALL_ORDER.filter(n => CONTENT.chapters.some(c => c.chapter === n));
export const ROMAN = { 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII', 13: 'XIII' };
const META = {
  8: { icon: 'chart', scene: 'illyricum' },
  9: { icon: 'scale', scene: 'pannonia' },
  10: { icon: 'crate', scene: 'dacia' },
  11: { icon: 'eye', scene: 'thracia' },
  12: { icon: 'hourglass', scene: 'cappadocia' },
  13: { icon: 'ballista', scene: 'syria' },
};
const COLORS = { 8: '#2E6F8E', 9: '#8A2A1E', 10: '#B5623A', 11: '#4F6A3F', 12: '#7A4A1E', 13: '#2F8F8A' };

/** chapter -> province (lon/lat). poly: territory; cap: capital; label: label anchor; road: battle road gate -> capital. */
export const PROV = {
  8: { key: 'illyricum', name: 'Chapter 8', latin: 'Illyricum', capital: 'Salona', cap: [16.48, 43.52], label: [17.4, 44.6],
    poly: [[13.5, 46.6], [16.0, 46.9], [19.0, 45.9], [19.5, 44.3], [19.6, 42.5], [18.6, 42.3], [16.5, 43.3], [15.1, 44.3], [13.9, 45.2]],
    road: [[14.2, 45.2], [15.3, 45.6], [16.6, 45.2], [17.9, 44.6], [18.6, 43.6], [17.4, 43.1], [16.48, 43.52]] },
  9: { key: 'pannonia', name: 'Chapter 9', latin: 'Pannonia', capital: 'Carnuntum', cap: [16.86, 48.11], label: [17.6, 46.9],
    poly: [[13.8, 47.6], [16.1, 48.8], [17.5, 48.9], [19.5, 48.2], [20.5, 46.4], [19.0, 45.9], [16.0, 46.9], [14.5, 46.7]],
    road: [[19.9, 46.4], [19.1, 47.2], [18.2, 47.6], [17.3, 47.1], [16.4, 47.5], [16.0, 48.0], [16.86, 48.11]] },
  10: { key: 'dacia', name: 'Chapter 10', latin: 'Dacia', capital: 'Sarmizegetusa', cap: [22.78, 45.52], label: [25.0, 46.2],
    poly: [[20.5, 46.4], [22.5, 48.2], [26.0, 48.3], [28.2, 46.5], [27.0, 44.2], [24.0, 43.8], [22.4, 44.4], [20.8, 45.7]],
    road: [[27.4, 45.2], [26.3, 46.0], [25.2, 46.6], [24.1, 46.1], [23.6, 45.3], [22.3, 45.0], [22.78, 45.52]] },
  11: { key: 'thracia', name: 'Chapter 11', latin: 'Thracia', capital: 'Byzantium', cap: [28.98, 41.01], label: [25.6, 42.4],
    poly: [[22.4, 44.4], [24.0, 43.8], [27.0, 44.2], [28.6, 43.7], [28.1, 42.0], [29.2, 41.2], [26.6, 40.6], [25.5, 40.9], [24.0, 41.4], [22.6, 41.3], [22.5, 43.0]],
    road: [[22.9, 42.6], [24.2, 42.9], [25.6, 42.3], [26.6, 42.9], [27.6, 42.3], [28.3, 41.6], [28.98, 41.01]] },
  12: { key: 'cappadocia', name: 'Chapter 12', latin: 'Cappadocia', capital: 'Caesarea', cap: [35.48, 38.72], label: [34.6, 40.3],
    poly: [[31.5, 41.8], [36.0, 42.0], [39.0, 41.1], [40.0, 39.5], [38.0, 37.8], [36.6, 37.2], [34.0, 37.0], [32.0, 37.5], [31.0, 39.0]],
    road: [[32.2, 40.4], [33.4, 39.6], [34.0, 40.6], [35.4, 40.3], [36.6, 39.6], [36.2, 38.8], [35.48, 38.72]] },
  13: { key: 'syria', name: 'Chapter 13', latin: 'Syria', capital: 'Antiochia', cap: [36.16, 36.2], label: [38.2, 34.4],
    poly: [[36.0, 36.8], [38.0, 37.2], [40.0, 37.3], [42.3, 37.3], [42.3, 35.5], [41.0, 34.0], [39.0, 32.5], [36.5, 31.5], [35.6, 31.8], [35.3, 33.5], [35.7, 35.0], [36.0, 36.2]],
    road: [[40.9, 36.5], [39.6, 35.6], [38.3, 34.9], [37.3, 35.5], [36.6, 34.8], [35.9, 35.6], [36.16, 36.2]] },
};
/** Roads between capitals in chapter order (overland, Salona to Antioch). */
export const ROADS = [
  { from: 8, to: 9, pts: [[16.48, 43.52], [16.9, 44.4], [16.4, 45.5], [15.9, 46.4], [16.3, 47.3], [16.86, 48.11]] },
  { from: 9, to: 10, pts: [[16.86, 48.11], [18.0, 47.6], [19.1, 47.0], [20.3, 46.1], [21.2, 45.8], [22.78, 45.52]] },
  { from: 10, to: 11, pts: [[22.78, 45.52], [23.4, 44.6], [24.2, 43.7], [25.6, 43.0], [26.8, 42.2], [28.98, 41.01]] },
  { from: 11, to: 12, pts: [[28.98, 41.01], [30.2, 40.6], [31.6, 39.9], [33.0, 39.6], [34.4, 39.3], [35.48, 38.72]] },
  { from: 12, to: 13, pts: [[35.48, 38.72], [35.6, 37.8], [35.3, 37.1], [35.9, 36.7], [36.16, 36.2]] },
];
export const SEA_LANES = [
  [[16.2, 42.4], [18.0, 41.6], [19.6, 40.6], [17.6, 41.2]],
  [[26.2, 40.0], [27.8, 40.4], [28.9, 40.9], [27.4, 40.7]],
  [[33.6, 35.2], [34.8, 35.6], [35.6, 36.0], [34.6, 36.3]],
  [[21.2, 36.4], [23.2, 35.6], [25.0, 35.2], [23.4, 36.1]],
];
export const CHAPTER_COLOR = COLORS;

const COMMANDERS = {
  illyricum: { name: 'Bato', title: 'chieftain of the Daesitiates', look: { skin: '#D9B08C', hair: '#3A2616', hairStyle: 'wild', beard: 'full', head: 'none', cloth: '#4A5A6E', trim: '#B9B2A5', band: '#4A5A6E', pelt: true },
    taunts: ['Rome sends wolves; we send them back as pelts.', 'These cliffs have no road for your siege towers.', 'Your tribute counts for nothing in the hills.', 'Count your standards again, legionary.'], surrender: 'The coast is yours. We will remember the price.' },
  pannonia: { name: 'Pinnes', title: 'warlord of the Breuci', look: { skin: '#D9B08C', hair: '#5A3A1E', hairStyle: 'long', beard: 'moustache', head: 'torc', cloth: '#3A4A3E', trim: '#D9A441', band: '#3A4A3E' },
    taunts: ['The marsh swallows legions whole.', 'Your eagles sink in Pannonian mud.', 'We have burned your supply wagons twice.', 'The Danube is wide, Roman, and we hold the fords.'], surrender: 'The river crossings are yours. Keep your word on the treaty.' },
  dacia: { name: 'Decebalus', title: 'king of Dacia', look: { skin: '#D9A47C', hair: '#2A1C14', hairStyle: 'long', beard: 'full', head: 'diadem', cloth: '#6B4A2A', trim: '#E3C76A', band: '#6B4A2A' },
    taunts: ['Our falxes split shields like firewood.', 'Sarmizegetusa stands on rock and on gold. You will get neither.', 'The mountains fight beside us.', 'Trajan himself needed two wars. Are you Trajan?'], surrender: 'The citadel falls. The gold is yours; the mountains are still ours.' },
  thracia: { name: 'Spartacus', title: 'Thracian gladiator-general', look: { skin: '#C8956A', hair: '#2A1C14', hairStyle: 'short', beard: 'full', head: 'none', cloth: '#8A2A1E', trim: '#8C8C90', band: '#8A2A1E' },
    taunts: ['I have broken legions with slaves. What are you?', 'Your line is thinner than the strait.', 'Every soldier you lose fights for me tomorrow.', 'The walls of Byzantium laugh at your ladders.'], surrender: 'The city yields. Treat its people better than Rome treated me.' },
  cappadocia: { name: 'Ariarathes', title: 'king of Cappadocia', look: { skin: '#D9A47C', hair: '#2A1C14', hairStyle: 'short', beard: 'full', head: 'diadem', cloth: '#7A4A1E', trim: '#E3C76A', band: '#7A4A1E' },
    taunts: ['Our horse archers do not stand still to be counted.', 'The rock itself hides my men.', 'You march across a plateau with no shade and no water.', 'Pontus and Armenia both failed here. So will you.'], surrender: 'Caesarea opens its gates. The plateau is yours to garrison.' },
  syria: { name: 'Zenobia', title: 'queen of Palmyra', look: { skin: '#C8956A', hair: '#1A1410', hairStyle: 'long', beard: 'none', head: 'diadem', cloth: '#2F8F8A', trim: '#E3C76A', band: '#2F8F8A', female: true },
    taunts: ['The desert has swallowed greater armies than yours.', 'My cataphracts have not yet charged.', 'Antioch has fed empires. It will not feed you.', 'Aurelian needed a whole army. Bring yours.'], surrender: 'Antioch is yours. The East bends, but it does not break.' },
};
const ENEMIES = {
  illyricum: { unit: 'warrior', color: '#4A5A6E', trim: '#B9B2A5', skin: '#D9B08C', name: 'the Illyrian hillmen' },
  pannonia: { unit: 'german', color: '#3A4A3E', trim: '#D9A441', skin: '#D9B08C', name: 'the Pannonian warband' },
  dacia: { unit: 'gaul', color: '#6B4A2A', trim: '#E3C76A', skin: '#D9A47C', name: 'Dacian falxmen' },
  thracia: { unit: 'caetratus', color: '#8A2A1E', trim: '#8C8C90', skin: '#C8956A', name: 'Thracian peltasts' },
  cappadocia: { unit: 'archer', color: '#7A4A1E', trim: '#E3C76A', skin: '#D9A47C', name: 'Cappadocian horse archers' },
  syria: { unit: 'archer', color: '#2F8F8A', trim: '#E3C76A', skin: '#C8956A', name: 'the Palmyrene cataphracts' },
};
// Generator questions join the chapter pools (three entries per generator, materialised with a fresh seed each pick).
if (!CONTENT._generatorsAdded) {
  const byChapter = new Map(CONTENT.chapters.map(ch => [ch.chapter, ch]));
  const conceptChapter = new Map(); for (const ch of CONTENT.chapters) for (const c of ch.concepts) conceptChapter.set(c.id, ch.chapter);
  for (const gq of generatorQuestions('fin201')) { const ch = byChapter.get(conceptChapter.get(gq.concept)); if (ch) ch.questions.push(gq); }
  CONTENT._generatorsAdded = true;
}
registerScenes(FIN_SCENES);
registerCommanders(COMMANDERS);
registerEnemies(ENEMIES);

const PLAN = [
  { day: 'Today', items: [
    ['Campaign: Chapter 8 (stocks)', 'Read each lesson card, pass the checkpoint. Gordon growth, non-constant growth and plowback growth are the exam’s favourites.'],
    ['Formula Vault: Chapter 8 and 9 formulas', 'Say which are given and which you must memorise. Drill each one once.'],
    ['Campaign: Chapter 9 (decision rules)', 'NPV, IRR, PI, payback, ARR: know the rule, the pros and the cons of each. Do the crossover drill.'],
    ['Smart Drill 30 Q (Unknown first)', 'Interleaved across what you have touched. Every miss opens a pursuit.'],
  ] },
  { day: 'Tomorrow', items: [
    ['Campaign: Chapter 10 (cash flows, CCA, salvage)', 'The heaviest numeric chapter: five tax categories, OCF, NWC, CCA schedule, PV of the tax shield, CF_AT on disposal.'],
    ['Campaign: Chapter 11 (what-ifs and real options)', 'Sensitivity vs scenario vs simulation vs NPV break-even; decision trees with the value of the option.'],
    ['Midterm 2 Simulation #1', 'Real format: MC plus numeric boxes, timed. Review every miss; drill the error types it diagnosed.'],
  ] },
  { day: 'Exam eve', items: [
    ['Campaign: Chapters 12 and 13 (risk, return, CAPM)', 'σ from states and history, two-asset σ_P, covariance and β, CAPM and the SML.'],
    ['Weak Spot Hunter until no pursuits remain', 'Then one more simulation. Target 90%+.'],
    ['Formula Vault pass, then sleep', 'Memorise the M formulas (OCF forms, CCA schedule, break-evens, DOL, β, reward-to-risk). No all-nighter.'],
  ] },
  { day: 'Exam day', items: [
    ['15-minute Blitz warm-up', 'Definitions and formula drills only. Calculator ready, de-programmed.'],
    ['Skim the Formula Vault', 'Given formulas you will see on the sheet; memorised ones you must carry in.'],
  ] },
];

export const PACK = {
  id: 'fin201',
  title: 'FIN 201',
  name: 'Imperium',
  sub: 'Midterm 2 · Chapters 8–13',
  content: CONTENT,
  order: ORDER,
  chapterMeta(num) { const m = META[num] || {}; return { icon: m.icon || 'seal', scene: m.scene || 'illyricum', roman: ROMAN[num] || String(num) }; },
  geo: { order: ORDER, prov: PROV, roads: ROADS, seaLanes: SEA_LANES, ridges: RIDGES, roman: ROMAN, colors: COLORS, title: 'IMPERIUM FINANCE', subtitle: 'EXPEDITIO ORIENTALIS', seaLabels: [['MARE ADRIATICUM', 16.5, 41.4], ['PONTUS EUXINUS', 33.5, 43.2], ['MARE INTERNUM', 27.0, 34.2]] },
  exam: { date: '2026-11-03T08:00', title: 'Midterm 2 Simulation', sizes: [10, 19, 30], defaultN: 19, paces: [[150, '2.5 min / Q'], [190, '3 min / Q'], [240, '4 min / Q'], [0, 'Untimed']], defaultPer: 190, tip: 'The real paper: about 13 multiple-choice at 4 marks plus 6 numeric answer boxes, 60 minutes, formula sheet provided. The simulator mixes both and weights stocks ~35%, capital budgeting ~40%, risk and return ~25%.', format: { minutes: 60, marks: 100, mc: 13, mcMarks: 4, numeric: 6, numericMarks: 48, weights: { 8: 0.35, 9: 0.14, 10: 0.18, 11: 0.08, 12: 0.12, 13: 0.13 } } },
  boss: { n: 20, pass: 0.85 },
  copy: {
    chapters: 'Six chapters, one province each: the eastern campaign from Salona to Antioch.',
    cohorts: 'six cohorts',
    welcome: 'Six chapters to conquer: stocks, decision rules, cash flows, project analysis, risk and return, and the CAPM.',
  },
  plan: PLAN,
  learn: 'cards',          // one short card per concept instead of the six-slide lesson
  vault: true,             // Formula Vault page
  generators: GENERATORS,
  generate,
  legacy: { exportType: null },
};
