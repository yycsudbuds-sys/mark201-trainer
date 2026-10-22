// Achievement definitions and checker.
import { masteryLevel, chapterMastery } from './engine.js';

export const ACHIEVEMENTS = [
  { id: 'first', ico: '🟢', title: 'First blood', desc: 'Answer your first question correctly.', test: a => a.state.stats.correct >= 1 },
  { id: 'fifty', ico: '🎒', title: 'Warmed up', desc: 'Answer 50 questions.', test: a => a.state.stats.answered >= 50 },
  { id: 'twofifty', ico: '🏋️', title: 'Grinder', desc: 'Answer 250 questions.', test: a => a.state.stats.answered >= 250 },
  { id: 'fivehundred', ico: '🦾', title: 'Iron memory', desc: 'Answer 500 questions.', test: a => a.state.stats.answered >= 500 },
  { id: 'combo10', ico: '🔥', title: 'On a roll', desc: 'Hit a 10-answer combo.', test: a => (a.state.stats.bestCombo || 0) >= 10 },
  { id: 'combo25', ico: '☄️', title: 'Unstoppable', desc: 'Hit a 25-answer combo.', test: a => (a.state.stats.bestCombo || 0) >= 25 },
  { id: 'pursuit', ico: '🎯', title: 'Hunted down', desc: 'Clear your first pursuit (3 in a row after a miss).', test: a => a.state.stats.pursuitsCleared >= 1 },
  { id: 'pursuit10', ico: '🏹', title: 'Relentless', desc: 'Clear 10 pursuits.', test: a => a.state.stats.pursuitsCleared >= 10 },
  { id: 'solid10', ico: '🧱', title: 'Foundations', desc: 'Get 10 concepts to Solid or better.', test: a => countLevel(a, 3) >= 10 },
  { id: 'master10', ico: '⭐', title: 'Ten stars', desc: 'Master 10 concepts.', test: a => countLevel(a, 4) >= 10 },
  { id: 'master50', ico: '🌟', title: 'Fifty stars', desc: 'Master 50 concepts.', test: a => countLevel(a, 4) >= 50 },
  { id: 'master100', ico: '💫', title: 'Constellation', desc: 'Master 100 concepts.', test: a => countLevel(a, 4) >= 100 },
  { id: 'masterall', ico: '👑', title: 'Perfect score energy', desc: 'Master every concept in the course.', test: a => countLevel(a, 4) >= a.content.stats.concepts },
  { id: 'boss1', ico: '🥇', title: 'Boss slayer', desc: 'Clear your first chapter boss.', test: a => Object.values(a.state.campaign.bosses || {}).some(b => b.cleared) },
  { id: 'bossall', ico: '🏆', title: 'Campaign complete', desc: 'Clear every chapter boss.', test: a => a.content.chapters.every(ch => a.state.campaign.bosses?.[ch.chapter]?.cleared) },
  { id: 'exam1', ico: '📝', title: 'Dress rehearsal', desc: 'Finish a midterm simulation.', test: a => (a.state.exams || []).length >= 1 },
  { id: 'exam90', ico: '🎓', title: 'A-range', desc: 'Score 90%+ on a 40+ question simulation.', test: a => (a.state.exams || []).some(e => e.n >= 40 && e.score >= 0.9) },
  { id: 'exam100', ico: '💯', title: 'Flawless', desc: 'Score 100% on a 40+ question simulation.', test: a => (a.state.exams || []).some(e => e.n >= 40 && e.score >= 0.999) },
  { id: 'blitz1500', ico: '⚡', title: 'Speed demon', desc: 'Score 1,500+ in Blitz.', test: a => (a.state.stats.blitzBest || 0) >= 1500 },
  { id: 'chapterfull', ico: '📚', title: 'Shelf stocked', desc: 'Get every concept in one chapter to Solid or better.', test: a => a.content.chapters.some(ch => { const m = chapterMastery(a.content, a.state, ch.chapter); return m && (m.dist[3] + m.dist[4]) === m.total; }) },
  { id: 'streak2', ico: '📅', title: 'Two-day plan', desc: 'Study on two consecutive days.', test: a => a.store.streakDays() >= 2 },
  { id: 'reader', ico: '📖', title: 'Did the reading', desc: 'Read every concept card in a chapter.', test: a => a.content.chapters.some(ch => ch.concepts.every(c => a.state.concepts[c.id]?.seen)) },
];

function countLevel(a, min) {
  let n = 0;
  for (const ch of a.content.chapters) for (const c of ch.concepts) if (masteryLevel(a.state.concepts[c.id]) >= min) n++;
  return n;
}

export function checkAchievements(app) {
  const st = app.state;
  st.stats.pursuitsCleared = st.stats.pursuitsCleared || 0;
  const unlocked = [];
  for (const a of ACHIEVEMENTS) {
    if (st.achievements[a.id]) continue;
    let ok = false;
    try { ok = a.test(app); } catch { ok = false; }
    if (ok) { st.achievements[a.id] = Date.now(); st.xp += 50; unlocked.push(a); }
  }
  return unlocked;
}
