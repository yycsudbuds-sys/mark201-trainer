// The Forum: first screen after login. Your legionary and rank, one card per course with readiness, mastery, days to
// the exam and today's orders, the leaderboard, daily orders and the shop. Also the read-only profile page (#/legion/<id>).
import { h, clear, ring, bar, fmtPct, timeAgo, modal } from '../ui.js';
import { icon } from '../icons.js';
import { COURSES, loadPack, packIfLoaded } from '../courses/index.js';
import { readiness, levelForXp, LEVELS, masteryLevel, chapterMastery } from '../engine.js';
import { legionaryAvatar, equipped, equippedFrom, brazier, dailyOrders, rankLadder } from '../legion.js';
import { getDenarii } from '../cosmetic.js';
import { nextAction } from './common.js';
import { ACHIEVEMENTS } from '../achievements.js';

export function render(app) {
  const p = app.profile;
  const total = app.xp(); const lv = levelForXp(total);
  const eq = equipped();
  const hero = h('section', { class: 'dash-hero' },
    h('div', { class: 'dash-you' }, h('div', { class: 'you-avatar' }, legionaryAvatar(120, eq)), eq.name ? h('div', { class: 'tiny muted center' }, eq.name) : null),
    h('div', { class: 'dash-main' },
      h('div', { class: 'eyebrow' }, 'The Forum · your profile'),
      h('h1', null, p.username),
      h('div', { class: 'row wrap dash-rank' },
        h('span', { class: 'level-pill' }, `Lv ${lv.number} · ${lv.title}`),
        h('span', { class: 'chip denarii', dataset: { denarii: '1' } }, icon('coin', { size: 14, tone: 'gold' }), `${getDenarii()}`),
        brazier(app),
        h('span', { class: 'chip sync', dataset: { sync: '1' } }, syncLabel(app.syncer))),
      h('div', { class: 'xpbar wide' }, bar(lv.progress, { color: 'var(--gold-leaf)', height: 8 }), h('span', { class: 'mono small muted' }, lv.next ? `${total} / ${lv.next.xp} XP` : `${total} XP · the ladder is climbed`)),
      h('div', { class: 'row wrap mt-sm' },
        h('a', { class: 'btn sm', href: '#/settings' }, icon('galea', { size: 14, tone: 'gold' }), 'Quartermaster & shop'),
        h('a', { class: 'btn sm ghost', href: `#/legion/${p.id}` }, icon('person', { size: 14, tone: 'mono' }), 'Public profile'),
        h('button', { class: 'btn sm ghost', type: 'button', onClick: () => switchProfile(app) }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), 'Switch profile'))),
    h('div', { class: 'dash-side' }, rankLadder(app, { compact: true })));

  const cards = h('section', { class: 'grid two course-grid' }, COURSES.map(c => courseCard(app, c)));
  const board = leaderboardCard(app);
  const orders = h('div', { class: 'stack' }, dailyOrders(app), h('a', { class: 'card shop-link', href: '#/settings' }, icon('amphora', { size: 28, tone: 'gold' }), h('div', null, h('h3', null, 'The shop'), h('p', { class: 'small muted' }, 'Crests, emblems, cloaks, banners and the war table, for denarii.'))));
  return h('div', { class: 'dash stack', style: { gap: '1.4rem' } }, hero, h('div', { class: 'page-head' }, h('div', null, h('h2', null, 'Your campaigns'), h('p', null, 'One legion, two wars. Each course keeps its own mastery and readiness; XP and coins from both feed one rank.'))), cards, h('section', { class: 'grid two' }, board, orders));
}

function syncLabel(syncer) { const s = syncer ? syncer.status : 'off'; return { idle: 'Saved', saved: 'Saved', pending: 'Saving…', saving: 'Saving…', offline: 'Offline', error: 'Sync error', off: 'Local only' }[s] || s; }

function switchProfile(app) {
  modal({ title: 'Switch profile?', body: h('p', null, 'Your progress is saved. The next name typed at the gate opens its own camp.'), actions: [{ label: 'Stay', kind: 'ghost' }, { label: 'Switch profile', kind: 'primary', onClick: () => { app.syncer && app.syncer.flushNow(); app.store.logout(); } }] });
}

function courseCard(app, c) {
  const card = h('div', { class: 'card course-card', style: { '--ch': c.color } });
  const draw = (pack) => {
    clear(card);
    const st = app.store.courseState(c.id);
    const head = h('div', { class: 'row between wrap' }, h('div', null, h('div', { class: 'eyebrow' }, c.name), h('h3', null, c.title), h('div', { class: 'small muted' }, c.sub)));
    if (!c.ready || !pack) {
      card.append(head, h('div', { class: 'course-soon' }, icon(pack === null && c.ready ? 'hourglass' : 'lock', { size: 20, tone: 'bronze' }), pack === null && c.ready ? 'Loading…' : 'Opens soon. The legion is still mapping this province.'));
      return;
    }
    const content = pack.content;
    const r = st ? readiness(content, st) : { score: 0, mastery: 0, coverage: 0, concepts: content.stats.concepts, attempted: 0 };
    let mastered = 0; if (st) for (const ch of content.chapters) for (const k of ch.concepts) if (masteryLevel(st.concepts[k.id]) >= 4) mastered++;
    const examIso = (st && st.settings && st.settings.examDate) || pack.exam.date;
    const days = examIso ? Math.ceil((new Date(examIso).getTime() - Date.now()) / 86400000) : null;
    const lastDay = st ? Object.entries(st.days || {}).filter(([, v]) => v.answered > 0).map(([k]) => k).sort().pop() : null;
    const na = st ? nextAction(app, { content, state: st, pack }) : { title: `Start with Chapter ${pack.order[0]}`, desc: `Read the first lesson cards, then pass the checkpoint quiz.`, href: `#/campaign/${pack.order[0]}`, cta: 'Begin' };
    card.append(head,
      h('div', { class: 'course-stats' },
        ring(r.score, { size: 84, stroke: 9, color: r.score >= 0.85 ? 'var(--good)' : 'var(--gold-leaf)', label: h('div', { class: 'center' }, h('div', { class: 'big' }, fmtPct(r.score)), h('div', { class: 'tiny muted' }, 'ready')) }),
        h('div', { class: 'course-nums' },
          stat(`${Math.round(r.mastery * 100)}%`, 'mastery'), stat(`${mastered}/${content.stats.concepts}`, 'mastered'),
          stat(days === null ? '—' : days < 0 ? 'past' : String(days), days === 1 ? 'day to exam' : 'days to exam', days !== null && days >= 0 && days <= 3 ? 'var(--bad)' : undefined),
          stat(lastDay ? relDay(lastDay) : 'never', 'last studied'))),
      h('div', { class: 'course-plan' }, h('div', { class: 'eyebrow' }, icon('tablet', { size: 13, tone: 'crimson' }), "Today's orders"), h('div', null, h('b', null, na.title), h('span', { class: 'small muted' }, ' · ', na.desc))),
      h('div', { class: 'row wrap' }, h('button', { class: 'btn ch big', type: 'button', onClick: () => app.openCourse(c.id, na.href) }, st && st.stats.answered ? 'Continue ' : 'Begin ', icon('arrow', { size: 14, tone: 'mono' })), h('button', { class: 'btn ghost', type: 'button', onClick: () => app.openCourse(c.id, '#/home') }, 'Camp')));
  };
  if (!c.ready) draw(undefined);
  else { const loaded = packIfLoaded(c.id); if (loaded) draw(loaded); else { draw(null); loadPack(c.id).then(draw).catch(() => draw(undefined)); } }
  return card;
}
function stat(v, k, color) { return h('div', { class: 'stat' }, h('div', { class: 'v', style: color ? { color } : null }, String(v)), h('div', { class: 'k' }, k)); }
function relDay(key) { const today = new Date(); const d = new Date(key + 'T12:00:00'); const diff = Math.round((today.setHours(12, 0, 0, 0) - d.getTime()) / 86400000); return diff <= 0 ? 'today' : diff === 1 ? 'yesterday' : `${diff} d ago`; }

function leaderboardCard(app) {
  const tabs = [['overall', 'Total XP'], ['week', 'This week']].concat(COURSES.filter(c => c.ready).map(c => [`readiness:${c.id}`, `${c.title} readiness`]));
  let cur = 'overall';
  const seg = h('div', { class: 'seg wrap' });
  const body = h('div', { class: 'board-body' });
  const card = h('div', { class: 'card stack board' }, h('div', { class: 'row between wrap' }, h('div', null, h('h3', null, 'Leaderboard'), h('p', { class: 'small muted' }, 'Every legionary in the Imperium. Tap a name for their public profile.')), seg), body);
  const drawTabs = () => { clear(seg); for (const [k, label] of tabs) seg.appendChild(h('button', { class: k === cur ? 'on' : '', type: 'button', onClick: () => { cur = k; drawTabs(); load(); } }, label)); };
  async function load() {
    clear(body); body.appendChild(h('div', { class: 'empty' }, 'Reading the rolls…'));
    if (!app.syncer || app.syncer.status === 'off') { clear(body); body.appendChild(h('div', { class: 'empty' }, 'The leaderboard needs the profile service.')); return; }
    try {
      const [kind, courseId] = cur.split(':');
      const rows = await app.syncer.leaderboard(kind, courseId || null, 50);
      clear(body);
      if (!rows.length) { body.appendChild(h('div', { class: 'empty' }, 'No legionaries on the rolls yet.')); return; }
      const list = h('ol', { class: 'board-list' });
      rows.forEach((r, i) => {
        const prof = kind === 'readiness' ? (r.profiles || {}) : r; const id = kind === 'readiness' ? r.profile_id : r.id;
        const me = app.profile && id === app.profile.id;
        const value = kind === 'readiness' ? `${Math.round((r.readiness || 0) * 100)}%` : kind === 'week' ? `${r.xp_week || 0} XP` : `${r.total_xp || 0} XP`;
        const sub = kind === 'readiness' ? `${r.mastered_count || 0}/${r.total_concepts || 0} mastered` : `Lv ${prof.level || 1} · ${(LEVELS[Math.max(0, (prof.level || 1) - 1)] || LEVELS[0]).title}${r.streak ? ` · ${r.streak} day streak` : ''}`;
        list.appendChild(h('li', { class: 'board-row' + (me ? ' me' : '') },
          h('span', { class: 'board-rank' }, i < 3 ? icon('laurel', { size: 16, tone: 'gold' }) : String(i + 1)),
          legionaryAvatar(30, equippedFrom(prof.cosmetics || {})),
          h('a', { class: 'grow board-name', href: `#/legion/${id}` }, h('span', { class: 't' }, prof.username || '—', me ? h('span', { class: 'badge', style: { marginLeft: '6px' } }, 'you') : null), h('span', { class: 's' }, sub)),
          h('span', { class: 'board-val mono' }, value)));
      });
      body.appendChild(list);
    } catch (err) { clear(body); body.appendChild(h('div', { class: 'empty' }, 'The rolls could not be read right now.')); }
  }
  drawTabs(); load();
  return card;
}

/** Read-only public profile: #/legion/<profile id>. */
export function renderProfile(app, params) {
  const id = params[0];
  const host = h('div', { class: 'stack', style: { gap: '1.2rem' } }, h('a', { class: 'back', href: '#/dash' }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ' Back to the Forum'), h('div', { class: 'empty' }, 'Reading the rolls…'));
  if (!id || !app.syncer) { host.lastChild.textContent = 'No such legionary.'; return host; }
  (async () => {
    try {
      const [row, crows] = await Promise.all([app.syncer.profileById(id), app.syncer.courseRows(id)]);
      if (!row) { host.lastChild.textContent = 'No such legionary.'; return; }
      const total = row.total_xp || 0; const lv = levelForXp(total); const eq = equippedFrom(row.cosmetics || {});
      const panels = [];
      for (const c of COURSES) {
        const cr = (crows || []).find(x => x.course_id === c.id); if (!cr) continue;
        const st = cr.state || {};
        const ach = Object.keys(st.achievements || {}).length;
        const panel = h('div', { class: 'card stack', style: { '--ch': c.color } }, h('div', { class: 'row between wrap' }, h('div', null, h('div', { class: 'eyebrow' }, c.name), h('h3', null, c.title)), h('span', { class: 'chip' }, `${Math.round((cr.readiness || 0) * 100)}% ready`)),
          h('div', { class: 'row wrap' }, stat(`${cr.mastered_count || 0}/${cr.total_concepts || 0}`, 'mastered'), stat(String(cr.xp || 0), 'XP'), stat(`${ach}/${ACHIEVEMENTS.length}`, 'honours'), stat(String(st.stats?.answered || 0), 'answers')),
          h('div', { class: 'by-chapter' }));
        panels.push(panel);
        if (c.ready) loadPack(c.id).then(pack => { const box = panel.querySelector('.by-chapter'); for (const ch of pack.content.chapters) { const m = chapterMastery(pack.content, st, ch.chapter); if (!m) continue; box.appendChild(h('div', { class: 'row wrap' }, h('span', { class: 'small', style: { width: '150px', fontWeight: 700 } }, `Ch ${ch.chapter} ${ch.short || ''}`), h('div', { class: 'grow', style: { minWidth: '140px' } }, bar(m.score, { color: ch.color, height: 8 })), h('span', { class: 'mono tiny muted' }, `${m.dist[4]} mastered · ${Math.round(m.score * 100)}%`))); } }).catch(() => {});
      }
      clear(host);
      host.append(h('a', { class: 'back', href: '#/dash' }, icon('arrow', { size: 14, tone: 'mono', cls: 'flip' }), ' Back to the Forum'),
        h('section', { class: 'dash-hero' }, h('div', { class: 'dash-you' }, h('div', { class: 'you-avatar' }, legionaryAvatar(120, eq)), eq.name ? h('div', { class: 'tiny muted center' }, eq.name) : null),
          h('div', { class: 'dash-main' }, h('div', { class: 'eyebrow' }, 'Legionary · public record'), h('h1', null, row.username), h('div', { class: 'row wrap dash-rank' }, h('span', { class: 'level-pill' }, `Lv ${lv.number} · ${lv.title}`), h('span', { class: 'chip' }, icon('flame', { size: 13, tone: 'gold' }), `${row.streak || 0} day streak`), h('span', { class: 'chip' }, `${row.xp_week || 0} XP this week`), h('span', { class: 'chip' }, `on the rolls since ${new Date(row.created_at).toLocaleDateString()}`)),
            h('div', { class: 'xpbar wide' }, bar(lv.progress, { color: 'var(--gold-leaf)', height: 8 }), h('span', { class: 'mono small muted' }, `${total} XP`))),
          h('div', { class: 'dash-side' })),
        panels.length ? h('div', { class: 'grid two' }, panels) : h('div', { class: 'empty' }, 'No campaigns recorded yet.'));
    } catch (err) { console.error(err); host.lastChild.textContent = 'The record could not be read right now.'; }
  })();
  return host;
}
