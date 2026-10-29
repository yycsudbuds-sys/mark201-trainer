// Castra: the camp. Your legionary, rank, flame and water clock; one call to action; the shields on the palisade;
// a peek at the war table; your legion on the parade ground; the campaign plan as a marching route.
import { h, ring, fmtPct } from '../ui.js';
import { icon } from '../icons.js';
import { readiness, masteryLevel, dueCount, levelForXp } from '../engine.js';
import { nextAction } from './common.js';
import { worldMap, chapterProgress } from '../map.js';
import { legionaryAvatar, legionGround, rankLadder, dailyOrders, brazier, clepsydra, equipped } from '../legion.js';

// The study plan (marching route) comes from the course pack.

export function render(app) {
  const st = app.state;
  const r = readiness(app.content, st);
  const counts = [0, 0, 0, 0, 0]; let pursuits = 0;
  for (const ch of app.content.chapters) for (const c of ch.concepts) { const cs = st.concepts[c.id]; counts[masteryLevel(cs)]++; if (cs && cs.pursuit) pursuits++; }
  const due = dueCount(app.content, st);
  const today = st.days[Object.keys(st.days).sort().pop()] || { answered: 0, correct: 0 };
  const na = nextAction(app);
  const lv = levelForXp(app.xp());
  const islands = app.content.chapters.filter(ch => chapterProgress(app, ch).boss).length;
  const eq = equipped();
  const clock = clepsydra(app);

  const hero = h('section', { class: 'castra' },
    h('div', { class: 'castra-fire', 'aria-hidden': 'true' }),
    h('div', { class: 'castra-you' },
      h('div', { class: 'you-avatar' }, legionaryAvatar(132, eq)),
      h('div', { class: 'you-rank' }, h('div', { class: 'eyebrow' }, `Lv ${lv.number} · ${lv.title}`), h('div', { class: 'you-name' }, st.name), eq.name ? h('div', { class: 'small muted' }, eq.name) : null,
        h('div', { class: 'row wrap mt-sm' }, brazier(app), clock, h('a', { class: 'chip', href: '#/settings' }, icon('galea', { size: 14, tone: 'gold' }), 'Outfit')))),
    h('div', { class: 'castra-main' },
      h('div', { class: 'eyebrow' }, 'Home · the camp (Castra)'),
      h('h1', null, `Ave, ${st.name}.`),
      h('p', { class: 'muted' }, headline(r, counts, app)),
      h('div', { class: 'row wrap castra-stats' },
        h('div', { class: 'hq-ring' }, ring(r.score, { size: 112, stroke: 10, color: r.score >= 0.85 ? 'var(--good)' : 'var(--gold-leaf)', label: h('div', { class: 'center' }, h('div', { class: 'big', style: { fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 800 } }, fmtPct(r.score)), h('div', { class: 'tiny muted' }, 'readiness')) })),
        h('div', { class: 'hq-stats' },
          stat(counts[4], 'mastered', 'var(--good)'), stat(counts[3], 'solid'), stat(islands, 'chapters cleared'),
          stat(pursuits, 'pursuits open', pursuits ? 'var(--bad)' : undefined), stat(due, 'due now', due ? 'var(--gold-leaf-light)' : undefined), stat(today.answered, 'answered today'))),
      h('a', { class: 'btn primary big castra-cta', href: na.href }, na.cta),
      h('p', { class: 'small muted' }, h('b', null, na.title), ' · ', na.desc),
      rankLadder(app, { compact: true })),
    h('div', { class: 'castra-side' },
      h('a', { class: 'peek', href: '#/campaign', 'aria-label': 'Open the war table' }, h('div', { class: 'peek-tilt' }, worldMap(app, { compact: true })), h('span', { class: 'peek-label' }, icon('map', { size: 14, tone: 'gold' }), 'Campaign map')),
      dailyOrders(app)));

  const modes = h('section', { class: 'palisade-wrap' },
    h('div', { class: 'page-head' }, h('div', null, h('h2', null, 'Study modes'), h('p', null, 'Shields on the palisade. Different ways to practise, one engine: every answer feeds the same mastery model and review schedule.'))),
    h('div', { class: 'palisade' }),
    h('div', { class: 'cartridges' },
      cart('#/campaign', icon('map', { size: 28, tone: 'gold' }), 'Campaign', 'Chapter by chapter: lesson, checkpoint quiz, chapter boss.', '#C9A227', `${islands}/${app.content.chapters.length} chapters`),
      cart('#/drill', icon('swords', { size: 28, tone: 'gold' }), 'Smart Drill', 'Adaptive mix of every chapter. Misses trigger a pursuit.', '#8B1E1E', `${due} due · ${pursuits} pursuits`),
      cart('#/exam', icon('scutum', { size: 28, tone: 'gold' }), 'Midterm Simulation', 'Timed, mixed, no feedback until the debrief.', '#6FA0B8', '20–80 Q'),
      cart('#/arcade/blitz', icon('gladius', { size: 28, tone: 'gold' }), 'Blitz', '90 s, three lives, combos.', '#D28C3C', `best ${st.stats.blitzBest || 0}`),
      cart('#/drill/weak', icon('scutum', { size: 28, tone: 'gold' }), 'Weak Spot Hunter', 'Only concepts below Solid.', '#C8683A', 'reinforce'),
      cart('#/arcade/duel', icon('gladius', { size: 28, tone: 'gold' }), 'Confusables Duel', 'Tell-apart and NOT questions.', '#A98BC9', `best ${st.stats.duelBest || 0}/15`),
      cart('#/arcade/build', icon('siegetower', { size: 28, tone: 'gold' }), 'Build & Sort', 'Order, sort and match the tables.', '#8FAA5A', `${Object.values(st.activities).filter(a => a.done).length}/${app.content.stats.activities}`),
      cart('#/arcade/flash', icon('scroll', { size: 28, tone: 'gold' }), 'Flashcards', 'Recall with honest grading.', '#B08968', 'recall'),
      cart('#/learn', icon('temple', { size: 28, tone: 'gold' }), 'Learn', 'Lessons, diagrams and cheat sheets.', '#B4A58A', 'study'),
    ));

  const ground = legionGround(app);
  const legion = h('section', null,
    h('div', { class: 'page-head' }, h('div', null, h('h2', null, eq.name ? `Your legion · ${eq.name}` : 'Your legion'), h('p', null, `${app.content.stats.concepts} soldiers, one per stronghold, in ${app.pack.copy.cohorts}. Recruits are ghosts, the learning wear tunics, the solid wear armour, the mastered carry gold standards. Wounded soldiers have a pursuit open; a raised hand is due for review. Click a soldier to open its scroll.`)), h('a', { class: 'btn sm ghost', href: '#/progress' }, 'Progress report ', icon('arrow', { size: 14, tone: 'mono' }))),
    ground);

  const plan = planSection(app);
  return h('div', { class: 'stack', style: { gap: '1.6rem' } }, hero, modes, legion, plan);
}

function headline(r, counts, app) {
  if (counts[4] + counts[3] + counts[2] === 0) return `No chapter is cleared yet and the legion is raw recruits. Start with Chapter ${app.pack.order[0]}.`;
  if (r.score < 0.4) return 'A good start. Keep planting standards.';
  if (r.score < 0.7) return 'Momentum. The weak flanks are showing themselves.';
  if (r.score < 0.9) return 'Strong. Hunt the stragglers and give battle.';
  return 'The legions are ready. Stay sharp.';
}
function stat(v, k, color) { return h('div', { class: 'stat' }, h('div', { class: 'v', style: color ? { color } : null }, String(v)), h('div', { class: 'k' }, k)); }
function cart(href, ico, title, desc, color, meta) {
  return h('a', { class: 'cart', href, style: { '--ch': color } }, h('div', { class: 'cart-top' }, h('span', { class: 'cart-ico' }, ico), h('span', { class: 'cart-meta' }, meta)), h('h3', null, title), h('p', null, desc), h('div', { class: 'cart-ridge' }));
}
function planSection(app) {
  const st = app.state; const PLAN = app.pack.plan || [];
  const done = PLAN.reduce((s, d, di) => s + d.items.filter((_, i) => st.plan[`${di}-${i}`]).length, 0);
  const total = PLAN.reduce((s, d) => s + d.items.length, 0);
  let n = 0;
  const route = h('ol', { class: 'march-route' });
  PLAN.forEach((d, di) => {
    route.appendChild(h('li', { class: 'march-day' }, h('span', { class: 'eyebrow' }, d.day), h('span', { class: 'small muted' }, `${d.items.filter((_, i) => st.plan[`${di}-${i}`]).length}/${d.items.length}`)));
    d.items.forEach(([t, desc], i) => {
      const key = `${di}-${i}`; n++;
      const cb = h('input', { type: 'checkbox', checked: !!st.plan[key], onChange: e => { st.plan[key] = e.target.checked ? Date.now() : 0; app.store.save(); row.classList.toggle('done', e.target.checked); } });
      const row = h('li', { class: 'waypoint' + (st.plan[key] ? ' done' : '') }, h('label', { class: 'task' }, h('span', { class: 'wp-castrum' }, icon(st.plan[key] ? 'standard' : 'gate', { size: 14, tone: st.plan[key] ? 'crimson' : 'bronze' }), h('span', { class: 'wp-n' }, String(n))), cb, h('div', null, h('div', { class: 't' }, t), h('div', { class: 'd' }, desc))));
      route.appendChild(row);
    });
  });
  return h('details', { class: 'plan', open: done < total && done > 0 ? true : null },
    h('summary', null, h('h2', null, 'Study plan · marching route'), h('span', { class: 'chip' }, `${done}/${total} waypoints`), h('span', { class: 'small muted' }, 'Retrieval over rereading, spacing across sessions, interleaving once the basics are in, and sleep.')),
    route);
}
