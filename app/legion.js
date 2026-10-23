// The game layer's building blocks: your customised legionary, the legion parade ground (one soldier per concept),
// the rank ladder, the phalerae (medals on a cuirass), the daily orders, the Vesta brazier and the clepsydra.
// Everything reads existing engine data or the cosmetic store. Nothing here changes what is learned or scored.
import { h } from './ui.js';
import { icon, CHAPTER_ICON } from './icons.js';
import { masteryLevel, chapterMastery, LEVELS, levelForXp } from './engine.js';
import { ACHIEVEMENTS } from './achievements.js';
import { getCosmetic, setCosmetic, getDenarii, addDenarii } from './cosmetic.js';

export const COLORS = { red: '#8B1E1E', white: '#F0E1BC', black: '#1A1410', gold: '#C9A227', purple: '#66023C', green: '#4F6A3F', blue: '#2E4A7A' };
export function equipped() { const c = getCosmetic().equipped || {}; return { crest: c.crest || 'red', emblem: c.emblem || 'wings', cloak: c.cloak || 'red', banner: c.banner || 'spqr', table: c.table || 'oak', name: c.name || '' }; }

/** Your legionary: a bust with the equipped crest, shield emblem and cloak. */
export function legionaryAvatar(size = 40, eq = equipped()) {
  const crest = COLORS[eq.crest] || COLORS.red; const cloak = COLORS[eq.cloak] || COLORS.red;
  const emblem = eq.emblem === 'bolt' ? '<path d="M 36 44 l -5 9 h 4 l -3 8 l 7 -10 h -4 l 3 -7 z" fill="#E3C76A"/>' : eq.emblem === 'boar' ? '<ellipse cx="35" cy="50" rx="6" ry="4" fill="#E3C76A"/><circle cx="40" cy="49" r="2.4" fill="#E3C76A"/>' : eq.emblem === 'eagle' ? '<path d="M 35 44 l -8 5 l 5 -1 l -2 5 l 5 -4 l 5 4 l -2 -5 l 5 1 z" fill="#E3C76A"/>' : '<path d="M 34 47 l -5 -5 M 36 47 l 5 -5 M 33 51 l -6 3 M 37 51 l 6 3" stroke="#E3C76A" stroke-width="1.2" fill="none"/>';
  const w = h('span', { class: 'avatar', 'aria-hidden': 'true' }); w.style.width = size + 'px'; w.style.height = size + 'px';
  w.innerHTML = `<svg viewBox="0 0 64 64" width="${size}" height="${size}">
    <path d="M 10 64 C 12 46 22 40 32 40 C 42 40 52 46 54 64 Z" fill="${cloak}"/>
    <path d="M 20 64 C 21 50 26 44 32 43 C 38 44 43 50 44 64 Z" fill="#8C8C90"/>
    <path d="M 24 50 q 8 4 16 0 M 23 56 q 9 4 18 0" stroke="#3A3A3E" stroke-width="1.6" fill="none"/>
    <rect x="28" y="34" width="8" height="8" fill="#9C6B4A"/>
    <circle cx="32" cy="27" r="9" fill="#D9A47C"/>
    <path d="M 23 26 a 9 9 0 0 1 18 0 v 3 h -18 z" fill="#C9A227" stroke="#3E2D0C" stroke-width="0.8"/>
    <path d="M 22 29 h 20 l 1 3 h -22 z" fill="#8E6B1C"/>
    <path d="M 24 20 q 8 -12 16 0 q -8 -4 -16 0 z" fill="${crest}"/>
    <path d="M 40 29 q 4 -7 7 0 v 7 h -7 z" fill="#C9A227"/>
    <path d="M 26 40 h 16 q 3 0 3 3 v 15 q 0 3 -3 3 h -16 q -3 0 -3 -3 v -15 q 0 -3 3 -3 z" fill="#8B1E1E" stroke="#2A0808" stroke-width="1" transform="translate(-3 2) scale(0.85)"/>
    ${emblem}
  </svg>`;
  return w;
}

/** Your Legion: a soldier for every concept, in cohorts per chapter. Click a soldier to open its scroll. */
export function legionGround(app, { chapters = null, onSoldier = null } = {}) {
  const now = Date.now(); const wrap = h('div', { class: 'legion' });
  let totals = [0, 0, 0, 0, 0];
  for (const ch of app.content.chapters) {
    if (chapters && !chapters.has(ch.chapter)) continue;
    const m = chapterMastery(app.content, app.state, ch.chapter);
    const ranks = h('div', { class: 'ranks' });
    for (const c of ch.concepts) {
      const cs = app.state.concepts[c.id]; const lvl = masteryLevel(cs); totals[lvl]++;
      const pursuit = !!(cs && cs.pursuit); const due = !!(cs && cs.a?.length && cs.due <= now && lvl < 4);
      const state = ['Unforged recruit', 'Seen', 'Learning', 'Solid', 'Mastered'][lvl] + (pursuit ? ' · wounded (pursuit open)' : '') + (due ? ' · due for review' : '');
      const b = h('button', { class: `soldier m${lvl}${pursuit ? ' wounded' : ''}${due ? ' due' : ''}`, type: 'button', title: `${c.term}: ${state}`, 'aria-label': `${c.term}: ${state}`, onClick: () => onSoldier ? onSoldier(c, ch) : app.navigate(`#/learn/${ch.chapter}/${c.id}`) });
      b.innerHTML = soldierSvg(lvl, pursuit, due, ch.color);
      ranks.appendChild(b);
    }
    wrap.appendChild(h('div', { class: 'cohort', style: { '--ch': ch.color } },
      h('div', { class: 'cohort-head' }, h('a', { class: 'cohort-title', href: `#/campaign/${ch.chapter}` }, h('span', { class: 'num' }, `COH ${String(ch.chapter).padStart(2, '0')}`), icon(CHAPTER_ICON[ch.chapter] || 'seal', { size: 18, tone: 'gold' }), ch.title),
        h('span', { class: 'small muted' }, icon('standard', { size: 13, tone: 'gold' }), `${m.dist[4]} `, icon('scutum', { size: 13, tone: 'mono' }), `${m.dist[3]} · ${Math.round(m.score * 100)}%`)),
      ranks));
  }
  wrap.appendChild(h('div', { class: 'legion-legend' },
    legendItem(soldierSvg(0, false, false, '#B4A58A'), 'Recruit'), legendItem(soldierSvg(2, false, false, '#B4A58A'), 'Learning'), legendItem(soldierSvg(3, false, false, '#B4A58A'), 'Solid'), legendItem(soldierSvg(4, false, false, '#B4A58A'), 'Mastered'), legendItem(soldierSvg(2, true, false, '#B4A58A'), 'Wounded (pursuit)'), legendItem(soldierSvg(3, false, true, '#B4A58A'), 'Due for review')));
  wrap.totals = totals;
  return wrap;
}
function legendItem(svgStr, label) { const s = h('span', { class: 'soldier small' }); s.innerHTML = svgStr; return h('span', { class: 'row' }, s, label); }
function soldierSvg(lvl, wounded, due, color) {
  const armour = lvl >= 3; const tunic = lvl >= 2 ? '#E6D3A8' : '#B4A58A'; const ghost = lvl === 0;
  const arm = due ? '<path d="M 17 16 l 5 -9" stroke="#8A5A3C" stroke-width="2.2" stroke-linecap="round"/><circle cx="22.5" cy="6.5" r="1.8" fill="#8A5A3C"/>' : '';
  const lean = wounded ? ' transform="rotate(8 12 40)"' : '';
  return `<svg viewBox="0 0 26 42" width="26" height="42"${ghost ? ' opacity="0.42"' : ''}><g${lean}>
    <path d="M 8 42 h 4 v -10 h -4 z M 14 42 h 4 v -10 h -4 z" fill="#3B2A17"/>
    <path d="M 7 32 l 1.5 -16 h 9 l 1.5 16 z" fill="${armour ? '#8C8C90' : tunic}" stroke="${ghost ? '#8C8070' : '#2E2114'}" stroke-width="0.7"${ghost ? ' stroke-dasharray="2 1.5"' : ''}/>
    ${armour ? '<path d="M 8.5 20 h 9 M 8.3 23 h 9.4 M 8 26 h 10" stroke="#3A3A3E" stroke-width="1" fill="none"/>' : ''}
    ${wounded ? '<path d="M 8 24 l 10 -3" stroke="#8B1E1E" stroke-width="2.2"/>' : ''}
    <circle cx="13" cy="11" r="4.2" fill="${ghost ? '#B4A58A' : '#8A5A3C'}"/>
    ${armour ? '<path d="M 8.8 10.5 a 4.2 4.2 0 0 1 8.4 0 v 1.6 h -8.4 z" fill="#C9A227"/><path d="M 9.5 7.5 q 3.5 -5 7 0 q -3.5 -1.5 -7 0 z" fill="#8B1E1E"/>' : ''}
    ${lvl === 4 ? `<line x1="22" y1="40" x2="22" y2="4" stroke="#C9A227" stroke-width="1.6"/><path d="M 22 4 l 5 2 l -5 2 z" fill="${color}"/><circle cx="22" cy="12" r="1.6" fill="#C9A227"/>` : ''}
    ${lvl >= 2 && lvl < 4 ? `<rect x="3" y="18" width="6" height="11" rx="1.5" fill="${armour ? '#8B1E1E' : '#6B4B2A'}" stroke="#2A0808" stroke-width="0.6"/>` : ''}
    ${arm}
  </g></svg>`;
}

/** The rank ladder: the existing levels shown as a Roman cursus honorum. */
export function rankLadder(app, { compact = false } = {}) {
  const lv = levelForXp(app.state.xp);
  const el = h('div', { class: 'ladder' + (compact ? ' compact' : '') });
  LEVELS.forEach((L, i) => {
    const state = i < lv.index ? 'done' : i === lv.index ? 'now' : 'ahead';
    el.appendChild(h('div', { class: 'rung ' + state, title: `${L.title} · ${L.xp} XP` }, h('span', { class: 'rung-dot' }, state === 'done' ? icon('laurel', { size: 10, tone: 'gold' }) : state === 'now' ? icon('galea', { size: 12, tone: 'gold' }) : null), h('span', { class: 'rung-name' }, L.title), compact ? null : h('span', { class: 'rung-xp' }, `${L.xp}`)));
  });
  if (!compact) el.appendChild(h('div', { class: 'ladder-next small muted' }, lv.next ? `${lv.next.xp - app.state.xp} XP to ${lv.next.title}` : 'Imperator. The ladder is climbed.'));
  return el;
}

/** Medals: the achievements as phalerae on a cuirass. New ones since the last visit pop and ring. */
export function phalerae(app) {
  const st = app.state; const cos = getCosmetic(); const seen = new Set(cos.seenAch || []);
  const unlocked = Object.keys(st.achievements || {});
  const fresh = unlocked.filter(id => !seen.has(id));
  const wrap = h('div', { class: 'cuirass' }, h('div', { class: 'cuirass-shape', 'aria-hidden': 'true' }));
  const grid = h('div', { class: 'phalerae' });
  ACHIEVEMENTS.forEach((a, i) => {
    const on = !!st.achievements[a.id];
    const d = h('div', { class: 'phalera' + (on ? ' on' : '') + (fresh.includes(a.id) ? ' fresh' : ''), style: { '--d': (i % 5) * 80 + 'ms' }, title: `${a.title}: ${a.desc}${on ? '' : ' (locked)'}`, tabindex: '0' },
      h('span', { class: 'ph-disc' }, icon(ACH_ICONS[a.id] || 'laurel', { size: 22, tone: on ? 'gold' : 'iron' })), h('span', { class: 'ph-name' }, a.title));
    grid.appendChild(d);
  });
  wrap.appendChild(grid);
  wrap.appendChild(h('p', { class: 'small muted center' }, `${unlocked.length} of ${ACHIEVEMENTS.length} phalerae earned. Hover a medal for its deed.`));
  if (fresh.length) { setTimeout(() => { app.sound && app.sound('promotion'); }, 300); setCosmetic({ seenAch: unlocked }); }
  return wrap;
}
const ACH_ICONS = { first: 'gladius', fifty: 'scroll', twofifty: 'column', fivehundred: 'scutum', combo10: 'flame', combo25: 'brazier', pursuit: 'target', pursuit10: 'pilum', solid10: 'column', master10: 'laurel', master50: 'laurel', master100: 'aquila', masterall: 'aquila', boss1: 'galea', bossall: 'standard', exam1: 'tablet', exam90: 'seal', exam100: 'laurel', blitz1500: 'horn', chapterfull: 'book', streak2: 'sundial', reader: 'book' };

/** Daily Orders: three small quests computed from existing stats, with a denarii reward each. */
export function dayKeyOf(t = Date.now()) { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function ordersState(app) {
  const today = dayKeyOf(); let o = getCosmetic().orders;
  if (!o || o.day !== today) { o = { day: today, base: { pursuits: app.state.stats.pursuitsCleared || 0 }, claimed: [] }; setCosmetic({ orders: o }); }
  return o;
}
export function dailyOrders(app) {
  const st = app.state; const o = ordersState(app); const today = o.day; const day = st.days[today] || { answered: 0, correct: 0 };
  const dayStart = new Date(today + 'T00:00:00').getTime();
  const planted = app.content.chapters.reduce((s, ch) => s + ch.topics.filter(t => (st.campaign.topics[t.id]?.cleared || 0) >= dayStart).length, 0);
  const odd = Number(today.slice(-2)) % 2 === 1;
  const quests = [
    { id: 'answer25', title: 'Answer 25 questions', have: day.answered, need: 25, reward: 15, ico: 'gladius' },
    { id: 'pursuit1', title: 'Clear a pursuit', have: Math.max(0, (st.stats.pursuitsCleared || 0) - (o.base.pursuits || 0)), need: 1, reward: 10, ico: 'target' },
    odd ? { id: 'standard1', title: 'Plant a standard', have: planted, need: 1, reward: 20, ico: 'standard' } : { id: 'skirmish1', title: 'Finish a Skirmish', have: getCosmetic().lastBlitzDay === today ? 1 : 0, need: 1, reward: 10, ico: 'horn' },
  ];
  const el = h('div', { class: 'orders' }, h('div', { class: 'orders-head' }, h('div', { class: 'eyebrow' }, icon('tablet', { size: 14, tone: 'crimson' }), 'Daily orders'), h('span', { class: 'small muted' }, 'reset at midnight')));
  for (const q of quests) {
    const done = q.have >= q.need; const claimed = o.claimed.includes(q.id);
    const row = h('div', { class: 'order' + (done ? ' done' : '') + (claimed ? ' claimed' : '') },
      icon(q.ico, { size: 18, tone: done ? 'gold' : 'bronze' }), h('div', { class: 'grow' }, h('div', { class: 'order-title' }, q.title), h('div', { class: 'bar', style: { height: '5px' } }, h('div', { class: 'bar-fill', style: { width: Math.min(100, q.have / q.need * 100) + '%', background: 'var(--gold-leaf)' } })), h('div', { class: 'tiny muted' }, `${Math.min(q.have, q.need)} / ${q.need}`)),
      claimed ? h('span', { class: 'chip good' }, icon('check', { size: 12, tone: 'laurel' }), 'Claimed') : done ? h('button', { class: 'btn sm primary', type: 'button', onClick: () => { o.claimed.push(q.id); setCosmetic({ orders: o }); addDenarii(q.reward, 'orders'); app.sound('coins'); row.replaceWith(dailyOrders(app).querySelectorAll('.order')[quests.indexOf(q)]); } }, `Claim ${q.reward}`) : h('span', { class: 'chip' }, icon('coin', { size: 12, tone: 'gold' }), String(q.reward)));
    el.appendChild(row);
  }
  return el;
}

/** The Eternal Flame: the day streak as a Vesta brazier that burns bigger each day. */
export function brazier(app) {
  const streak = app.store.streakDays(); const cos = getCosmetic();
  const el = h('span', { class: 'brazier chip', title: `${streak} day streak. Study every day to keep the flame of Vesta burning.`, style: { '--flame': String(Math.min(2.2, 0.7 + streak * 0.18)) } },
    h('span', { class: 'braz-bowl', 'aria-hidden': 'true' }, h('span', { class: 'braz-flame' })), `${streak} day${streak === 1 ? '' : 's'}`);
  if ((cos.lastStreak || 0) < streak) { setCosmetic({ lastStreak: streak }); if (streak > 1) { el.classList.add('grow'); setTimeout(() => app.sound && app.sound('flame'), 400); } }
  else if (streak < (cos.lastStreak || 0)) setCosmetic({ lastStreak: streak });
  return el;
}

/** The clepsydra: a water clock counting down to the midterm. Red in the last 24 hours. */
export function clepsydra(app) {
  const iso = app.state.settings.examDate; if (!iso) return null;
  const t = new Date(iso).getTime(); if (isNaN(t)) return null;
  const el = h('a', { class: 'clepsydra chip', href: '#/settings', title: 'Time to the midterm (set in the Quartermaster)' }, h('span', { class: 'clep-glass', 'aria-hidden': 'true' }, h('span', { class: 'clep-water' })), h('span', { class: 'clep-text' }));
  const tick = () => { const d = t - Date.now(); const txt = el.querySelector('.clep-text'); const water = el.querySelector('.clep-water'); if (!txt) return;
    if (d <= 0) { txt.textContent = 'Battle day'; el.classList.add('urgent'); water.style.height = '0%'; return; }
    const hrs = d / 3600000; txt.textContent = hrs >= 48 ? `${Math.floor(hrs / 24)} d ${Math.floor(hrs % 24)} h` : hrs >= 1 ? `${Math.floor(hrs)} h ${Math.floor((d % 3600000) / 60000)} m` : `${Math.floor(d / 60000)} min`;
    el.classList.toggle('urgent', hrs < 24); water.style.height = Math.max(4, Math.min(100, hrs / 72 * 100)) + '%'; };
  tick(); const id = setInterval(() => { if (!el.isConnected) { clearInterval(id); return; } tick(); }, 30000);
  return el;
}
