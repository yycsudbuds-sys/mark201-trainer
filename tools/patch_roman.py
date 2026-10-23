"""Apply the Roman re-theme across existing modules: fonts, nav/mode copy, level titles, chapter palette,
cutscene triggers, battlefield integration, province lock handling. Content and engine logic untouched."""
import os
import re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def rw(rel, pairs, must=True):
    p = os.path.join(ROOT, rel); s = open(p, encoding='utf-8').read()
    for old, new in pairs:
        if old not in s:
            if must: raise AssertionError((rel, old[:80]))
            continue
        s = s.replace(old, new)
    open(p, 'w', encoding='utf-8').write(s)

# ---- index.html: fonts + theme css ----
rw('index.html', [
    ('family=Bricolage+Grotesque:opsz,wdth,wght@12..96,100,500;12..96,100,700;12..96,100,800&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap',
     'family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Bricolage+Grotesque:opsz,wdth,wght@12..96,100,700&family=JetBrains+Mono:wght@500;700&display=swap'),
    ('<link rel="stylesheet" href="app/game.css">', '<link rel="stylesheet" href="app/game.css">\n  <link rel="stylesheet" href="app/roman.css">'),
    ('<title>MARK 201 Trainer</title>', '<title>MARK 201 · Imperium</title>'),
    ('<meta name="theme-color" content="#121726">', '<meta name="theme-color" content="#15110D">'),
    ('<p>Stocking the shelves…</p>', '<p>Mustering the legions…</p>'),
])
rw('sw.js', [("'./app/game.css',", "'./app/game.css', './app/roman.css', './app/cutscene.js', './app/battlefield.js',")])

# ---- chapter palette and province meta in the bundle ----
rw('tools/build.py', [
    ('''    1: {"color": "#FF6B6B", "short": "Marketing", "emoji": "🧭", "tag": "Why marketing exists"},
    6: {"color": "#FFB84D", "short": "STP", "emoji": "🎯", "tag": "Segment, target, position"},
    7: {"color": "#A3E635", "short": "Products", "emoji": "📦", "tag": "Products, brands, services"},
    8: {"color": "#2DD4BF", "short": "New products", "emoji": "🚀", "tag": "Life cycles and launches"},
    9: {"color": "#38BDF8", "short": "Pricing", "emoji": "🏷️", "tag": "Capture the value"},
    10: {"color": "#A78BFA", "short": "Channels", "emoji": "🚚", "tag": "Channels and supply chains"},
    11: {"color": "#F472B6", "short": "Retail", "emoji": "🛒", "tag": "Retailing and wholesaling"},
    12: {"color": "#FB923C", "short": "IMC", "emoji": "📣", "tag": "Integrated communications"},''',
     '''    1: {"color": "#D4A834", "short": "Marketing", "emoji": "🏛️", "tag": "Why marketing exists", "province": "Italia", "numeral": "I"},
    6: {"color": "#C8683A", "short": "STP", "emoji": "🎯", "tag": "Segment, target, position", "province": "Hispania", "numeral": "VI"},
    7: {"color": "#8FAA5A", "short": "Products", "emoji": "🏺", "tag": "Products, brands, services", "province": "Gallia", "numeral": "VII"},
    8: {"color": "#6FA0B8", "short": "New products", "emoji": "⚔️", "tag": "Life cycles and launches", "province": "Britannia", "numeral": "VIII"},
    9: {"color": "#B08968", "short": "Pricing", "emoji": "🪙", "tag": "Capture the value", "province": "Germania", "numeral": "IX"},
    10: {"color": "#A98BC9", "short": "Channels", "emoji": "⛵", "tag": "Channels and supply chains", "province": "Graecia", "numeral": "X"},
    11: {"color": "#D28C3C", "short": "Retail", "emoji": "🏪", "tag": "Retailing and wholesaling", "province": "Asia", "numeral": "XI"},
    12: {"color": "#4FA3A5", "short": "IMC", "emoji": "📯", "tag": "Integrated communications", "province": "Aegyptus", "numeral": "XII"},'''),
])

# ---- level titles (XP thresholds unchanged) ----
rw('app/engine.js', [
    ("{ xp: 0, title: 'Intern' },", "{ xp: 0, title: 'Tiro' },"),
    ("{ xp: 300, title: 'Marketing Assistant' },", "{ xp: 300, title: 'Miles' },"),
    ("{ xp: 800, title: 'Coordinator' },", "{ xp: 800, title: 'Immunis' },"),
    ("{ xp: 1500, title: 'Brand Associate' },", "{ xp: 1500, title: 'Decanus' },"),
    ("{ xp: 2500, title: 'Brand Manager' },", "{ xp: 2500, title: 'Optio' },"),
    ("{ xp: 4000, title: 'Senior Brand Manager' },", "{ xp: 4000, title: 'Centurio' },"),
    ("{ xp: 6000, title: 'Marketing Director' },", "{ xp: 6000, title: 'Primus Pilus' },"),
    ("{ xp: 8500, title: 'VP Marketing' },", "{ xp: 8500, title: 'Tribunus' },"),
    ("{ xp: 11500, title: 'CMO' },", "{ xp: 11500, title: 'Legatus' },"),
    ("{ xp: 15000, title: 'Marketing Legend' },", "{ xp: 15000, title: 'Consul' },"),
    ("{ xp: 20000, title: 'Kotler Tier' },", "{ xp: 20000, title: 'Imperator' },"),
])

# ---- main.js: nav labels, brand, settings default ----
rw('app/main.js', [
    ("""  ['home', '🏠', 'Home'],
  ['campaign', '🗺️', 'Campaign'],
  ['drill', '🎯', 'Smart Drill'],
  ['exam', '📝', 'Midterm Sim'],
  ['arcade', '🕹️', 'Arcade'],
  ['learn', '📖', 'Lessons'],
  ['progress', '📈', 'Progress'],
  ['settings', '⚙️', 'Settings'],""",
     """  ['home', '🏛️', 'Castra'],
  ['campaign', '🗺️', 'Conquest'],
  ['drill', '⚔️', 'Field Drill'],
  ['exam', '🛡️', 'Great Battle'],
  ['arcade', '🏟️', 'Arena'],
  ['learn', '📜', 'Archives'],
  ['progress', '🦅', 'Senate'],
  ['settings', '⚙️', 'Quartermaster'],"""),
    ("h('div', null, h('div', { class: 'brand-name' }, 'MARK 201'), h('div', { class: 'brand-sub' }, 'Midterm trainer'))", "h('div', null, h('div', { class: 'brand-name' }, 'MARK 201'), h('div', { class: 'brand-sub' }, 'Imperium'))"),
    ("h('span', { class: 'chip', title: 'Exam readiness estimate' }, `Readiness ${Math.round(r.score * 100)}%`),", "h('span', { class: 'chip', title: 'Test readiness estimate' }, `Test Readiness ${Math.round(r.score * 100)}%`),"),
    ("h('h1', null, 'MARK 201 Trainer'),", "h('h1', null, 'MARK 201 · Imperium'),"),
    ("'Chapters 1, 6, 7, 8, 9, 10, 11 and 12. Every concept, drilled from every angle until it is concretely yours.'", "'Eight provinces to conquer: chapters 1, 6, 7, 8, 9, 10, 11 and 12. Every concept, contested from every angle until it is yours.'"),
    ("h('label', null, 'Create your player')", "h('label', null, 'Enlist: your name, legionary')"),
    ("'Start training')", "'Join the legion')"),
    ("toast(`Level up! You are now ${LEVEL_TITLE(lvAfter)}`, 'xp', 3200)", "toast(`Promotion! You are now ${LEVEL_TITLE(lvAfter)}`, 'xp', 3200)"),
])

# ---- store defaults: briefings on ----
rw('app/store.js', [("settings: { theme: 'dark', sound: true, motion: true, examDate: '2026-10-24T09:00', dailyGoal: 60 },", "settings: { theme: 'dark', sound: true, motion: true, briefings: true, examDate: '2026-10-24T09:00', dailyGoal: 60 },")])

# ---- runner: battlefield behind every quiz, instant feedback hooks ----
rw('app/views/runner.js', [
    ("import { visualFor } from '../visuals.js';", "import { visualFor } from '../visuals.js';\nimport { attachBattlefield } from '../battlefield.js';"),
    ("  el.start = next;\n  el.getSummary = summary;", "  const bf = attachBattlefield(el);\n  el.start = next;\n  el.getSummary = summary;"),
    ("    const res = app.answer(q, correct, { mode: cfg.mode, combo: state.combo });\n    state.xp += res.xp;", "    if (el.battlefield) { if (correct) el.battlefield.advance(); else el.battlefield.setback(); }\n    const res = app.answer(q, correct, { mode: cfg.mode, combo: state.combo });\n    state.xp += res.xp;"),
    ("const REASON_LABEL = { pursuit: '🎯 Pursuit', weak: '🩹 Weak spot', due: '⏰ Due for review', new: '✨ New', review: '🔁 Review', exam: 'Exam', boss: '👑 Boss', campaign: '🗺️ Checkpoint', blitz: '⚡ Blitz', duel: '⚔️ Duel' };",
     "const REASON_LABEL = { pursuit: '🎯 Pursuit', weak: '🩹 Weak flank', due: '⏰ Due for review', new: '✨ New ground', review: '🔁 Review', exam: 'Battle', boss: '🏛️ Siege', campaign: '⚔️ Battle', blitz: '⚡ Skirmish', duel: '🗡️ Duel' };"),
    ("h('div', { class: 'verdict ' + (correct ? 'ok' : 'no') }, correct ? '✓ Correct' : '✗ Not quite',", "h('div', { class: 'verdict ' + (correct ? 'ok' : 'no') }, correct ? '✓ The line holds' : '✗ Ground lost',"),
    ("h('span', { class: 'small muted' }, 'Keys 1–5 answer · Enter continues'), cont);", "h('span', { class: 'small muted' }, 'Keys 1–5 answer · Enter advances'), cont);"),
    ("const cont = h('button', { class: 'btn primary big', onClick: next }, 'Continue ', h('span', { class: 'kbd' }, 'Enter'));", "const cont = h('button', { class: 'btn primary big', onClick: next }, 'Advance ', h('span', { class: 'kbd' }, 'Enter'));"),
])

# ---- campaign: cutscenes, province locks, copy ----
rw('app/views/campaign.js', [
    ("import { worldMap, islandTrail, chapterProgress, nextIsland, ISLANDS } from '../map.js';", "import { worldMap, islandTrail, chapterProgress, nextIsland, ISLANDS, provinceState, ROMAN } from '../map.js';\nimport { warBriefing } from '../cutscene.js';"),
    ("h('div', null, h('div', { class: 'eyebrow' }, 'Campaign'), h('h1', null, 'The Marketing Archipelago'), h('p', null, 'Eight islands, one per chapter. Land on an island, walk its trail of levels (read, then prove it), and plant a flag at each. Beat the boss to claim the island.')),",
     "h('div', null, h('div', { class: 'eyebrow' }, 'Conquest'), h('h1', null, 'Imperium Marketing'), h('p', null, 'Eight provinces, one per chapter. March on a province, win each battle on its road (study the scrolls, then prove it), and plant the standard. Lay siege to the capital at 90% to conquer the province.')),"),
    ("h('div', { class: 'row wrap' }, h('span', { class: 'chip' }, `🏝️ ${conquered}/8 islands claimed`), h('span', { class: 'chip' }, `🚩 ${flags}/${totalFlags} flags planted`))),",
     "h('div', { class: 'row wrap' }, h('span', { class: 'chip' }, `🦅 ${conquered}/8 provinces conquered`), h('span', { class: 'chip' }, `🚩 ${flags}/${totalFlags} standards planted`))),"),
    ("h('div', { class: 'map-frame' }, worldMap(app)),\n    nextCh ?", "h('div', { class: 'map-frame' }, worldMap(app, { onIsland: (ch, state) => { if (state === 'locked') lockedPrompt(app, ch); else app.navigate(`#/campaign/${ch.chapter}`); } })),\n    nextCh ?"),
    ("h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Your next landing'), h('h3', null, `${ISLANDS[nextCh.chapter].name} · Chapter ${nextCh.chapter}: ${nextCh.title}`), h('p', { class: 'small muted' }, nextCh.tag)),\n      h('a', { class: 'btn ch big', href: `#/campaign/${nextCh.chapter}` }, 'Set sail →')) : h('div', { class: 'quest' }, h('div', { class: 'quest-ico' }, '👑'), h('div', null, h('h3', null, 'Every island is yours.'), h('p', { class: 'small muted' }, 'Keep the shelves stocked with Smart Drill and simulations.'))));",
     "h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, 'Next objective'), h('h3', null, `Chapter ${ROMAN[nextCh.chapter]}: ${ISLANDS[nextCh.chapter].name} · ${nextCh.title}`), h('p', { class: 'small muted' }, nextCh.tag)),\n      h('a', { class: 'btn ch big', href: `#/campaign/${nextCh.chapter}` }, 'March →')) : h('div', { class: 'quest' }, h('div', { class: 'quest-ico' }, '🦅'), h('div', null, h('h3', null, 'Every province is yours, Imperator.'), h('p', { class: 'small muted' }, 'Keep the armoury stocked with field drills and great battles.'))));"),
    ("h('a', { class: 'back', href: '#/campaign' }, '← Back to the archipelago'),", "h('a', { class: 'back', href: '#/campaign' }, '← Back to the map of provinces'),"),
    ("h('div', null, h('div', { class: 'eyebrow' }, `${isl?.name || 'Island'} · Chapter ${ch.chapter}`), h('h1', null, `${ch.emoji} ${ch.title}`), h('p', null, `${ch.topics.length} levels on the trail, ${ch.concepts.length} concepts. ${prog.cleared}/${ch.topics.length} flags planted${prog.boss ? ', boss beaten.' : '.'}`)),\n      h('div', { class: 'row wrap' }, h('a', { class: 'btn ghost', href: `#/learn/${ch.chapter}` }, '📖 Lessons'), h('a', { class: 'btn ghost', href: `#/drill/chapter/${ch.chapter}` }, '🎯 Drill island'))),",
     "h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ROMAN[ch.chapter]} · Provincia ${isl?.name || ''}`), h('h1', null, `${ch.emoji} ${ch.title}`), h('p', null, `${ch.topics.length} battles on the road, ${ch.concepts.length} strongholds. ${prog.cleared}/${ch.topics.length} standards planted${prog.boss ? `, ${isl?.capital || 'the capital'} taken.` : '.'}`)),\n      h('div', { class: 'row wrap' }, h('a', { class: 'btn ghost', href: `#/learn/${ch.chapter}` }, '📜 Scrolls'), h('a', { class: 'btn ghost', href: `#/drill/chapter/${ch.chapter}` }, '⚔️ Drill province'))),"),
    ("h('div', null, h('div', { class: 'eyebrow' }, `Level ${i + 1}${cleared ? ' · flag planted' : ''}`), h('h2', null, t.title)),", "h('div', null, h('div', { class: 'eyebrow' }, `Battle ${i + 1}${cleared ? ' · standard planted' : ''}`), h('h2', null, t.title)),"),
    ("h('a', { class: 'btn big', href: `#/campaign/${ch.chapter}/${t.id}/read` }, '📖 Lesson'),\n        h('a', { class: 'btn ch big', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, cleared ? '🔁 Re-run checkpoint' : '🎯 Checkpoint'),\n        h('span', { class: 'small muted' }, 'Lesson first if the concepts are new. The checkpoint clears when every concept reaches Solid.'))));",
     "h('a', { class: 'btn big', href: `#/campaign/${ch.chapter}/${t.id}/read` }, '📜 Study the scrolls'),\n        h('a', { class: 'btn ch big', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, cleared ? '🔁 Fight again' : '⚔️ To battle'),\n        h('span', { class: 'small muted' }, 'Scrolls first if the ground is new. The battle is won when every stronghold reaches Solid.'))));"),
    ("""function lesson(app, ch, t) {
  const host = h('div', { style: { '--ch': ch.color } });
  const deck = createLesson(app, t.concepts, {
    chapter: ch, title: `Level · ${t.title}`, exitHref: `#/campaign/${ch.chapter}`, completeLabel: '🎯 Start the checkpoint',
    onComplete: () => app.navigate(`#/campaign/${ch.chapter}/${t.id}/drill`),
  });
  host.appendChild(deck);
  host.cleanup = () => deck.cleanup && deck.cleanup();
  return host;
}""",
     """function lesson(app, ch, t) {
  const host = h('div', { style: { '--ch': ch.color } });
  let deck = null;
  warBriefing(app, { kind: 'lesson', chapter: ch, topic: t, objectives: t.concepts.slice(0, 5).map(cid => app.conceptOf(cid).concept.term), cta: 'Open the scrolls' }).then(() => {
    if (host.dead) return;
    deck = createLesson(app, t.concepts, {
      chapter: ch, title: `Battle · ${t.title}`, exitHref: `#/campaign/${ch.chapter}`, completeLabel: '⚔️ To battle',
      onComplete: () => app.navigate(`#/campaign/${ch.chapter}/${t.id}/drill`),
    });
    host.appendChild(deck);
  });
  host.cleanup = () => { host.dead = true; deck && deck.cleanup && deck.cleanup(); };
  return host;
}

function lockedPrompt(app, ch) {
  const pv = ISLANDS[ch.chapter];
  const idx = [1, 6, 7, 8, 9, 10, 11, 12].indexOf(ch.chapter);
  const prev = app.index.chapter.get([1, 6, 7, 8, 9, 10, 11, 12][idx - 1]);
  import('../ui.js').then(({ modal }) => modal({
    title: `${pv.name} is locked`,
    body: h('div', { class: 'stack' }, h('p', null, `The road to ${pv.name} opens once a standard is planted in ${ISLANDS[prev.chapter].name} (Chapter ${ROMAN[prev.chapter]}: ${prev.title}).`), h('p', { class: 'small muted' }, 'A forced march skips the road. Allowed, but the Legatus advises conquering in order.')),
    actions: [{ label: 'Return', kind: 'ghost' }, { label: `Go to ${ISLANDS[prev.chapter].name}`, onClick: () => app.navigate(`#/campaign/${prev.chapter}`) }, { label: 'Forced march', kind: 'primary', onClick: () => { app.state.campaign.unlocked = app.state.campaign.unlocked || {}; app.state.campaign.unlocked[ch.chapter] = Date.now(); app.store.save(); app.navigate(`#/campaign/${ch.chapter}`); } }],
  }));
}"""),
    ("""function checkpoint(app, ch, t) {
  const concepts = new Set(t.concepts);
  const limit = Math.max(12, t.concepts.length * 4);
  const host = h('div', { style: { '--ch': ch.color } });
  const runner = createRunner(app, {""",
     """function checkpoint(app, ch, t) {
  const concepts = new Set(t.concepts);
  const limit = Math.max(12, t.concepts.length * 4);
  const host = h('div', { style: { '--ch': ch.color } });
  let runner = null;
  warBriefing(app, { kind: 'checkpoint', chapter: ch, topic: t, objectives: t.concepts.slice(0, 5).map(cid => app.conceptOf(cid).concept.term), cta: 'Take command' }).then(() => { if (host.dead) return; runner = buildCheckpoint(); host.appendChild(runner); });
  host.cleanup = () => { host.dead = true; runner && runner.cleanup && runner.cleanup(); };
  return host;
  function buildCheckpoint() { return createRunner(app, {"""),
    ("    title: `Checkpoint · ${t.title}`, subtitle: `${ISLANDS[ch.chapter]?.name || 'Chapter ' + ch.chapter}. Every concept to Solid plants the flag.`, mode: 'campaign',",
     "    title: `Battle · ${t.title}`, subtitle: `Provincia ${ISLANDS[ch.chapter]?.name || ch.chapter}. Every stronghold to Solid plants the standard.`, mode: 'campaign',"),
    ("      if (cleared && !rec.cleared) { rec.cleared = Date.now(); first = true; app.grantXp(100, 'flag planted'); app.confetti(); app.sound('clear'); }", "      if (cleared && !rec.cleared) { rec.cleared = Date.now(); first = true; app.grantXp(100, 'standard planted'); app.confetti({ colors: ['#8B1E1E', '#C9A227', '#E3C76A', '#EADBC0'] }); app.sound('clear'); }"),
    ("      host.appendChild(resultCard(app, cleared ? '🚩 Flag planted' : reason === 'exit' ? 'Checkpoint ended' : 'Not yet', sum,", "      host.appendChild(resultCard(app, cleared ? '🚩 Standard planted' : reason === 'exit' ? 'Battle broken off' : 'The field is not yet ours', sum,"),
    ("          cleared ? h('p', null, `Every concept in “${t.title}” is at least Solid.${first ? ' +100 XP.' : ''} Mastered needs a later session, so these will come back in Smart Drill.`)", "          cleared ? h('p', null, `Every stronghold in “${t.title}” is at least Solid.${first ? ' +100 XP.' : ''} Mastered needs a later session, so this ground will be contested again in Field Drill.`)"),
    ("            : h('div', null, h('p', null, `${plural(pending.length, 'concept')} still below Solid or in pursuit:`),", "            : h('div', null, h('p', null, `${plural(pending.length, 'stronghold')} still below Solid or under pursuit:`),"),
    ("            cleared ? h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}` }, 'Back to the island') : h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, 'Keep going'),\n            h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${t.id}/read` }, 'Re-read the lesson'),",
     "            cleared ? h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}` }, 'Back to the province') : h('a', { class: 'btn primary', href: `#/campaign/${ch.chapter}/${t.id}/drill` }, 'Press the attack'),\n            h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${t.id}/read` }, 'Re-read the scrolls'),"),
    ("""      if (sum.log.some(l => !l.correct)) host.appendChild(h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Your misses'), missesList(app, sum.log)));
    },
  });
  host.appendChild(runner);
  host.cleanup = () => runner.cleanup && runner.cleanup();
  return host;
}""",
     """      if (sum.log.some(l => !l.correct)) host.appendChild(h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Ground lost'), missesList(app, sum.log)));
    },
  }); }
}"""),
    ("    h('div', { class: 'claim-text' }, h('div', { class: 'eyebrow' }, first ? 'Territory claimed' : 'Territory held'), h('h2', null, t.title), h('p', { class: 'small muted' }, `${ISLANDS[ch.chapter]?.name || ch.title}`)));", "    h('div', { class: 'claim-text' }, h('div', { class: 'eyebrow' }, first ? 'Standard planted' : 'Ground held'), h('h2', null, t.title), h('p', { class: 'small muted' }, `Provincia ${ISLANDS[ch.chapter]?.name || ch.title}`)));"),
    ("  if (i < ch.topics.length - 1) { const n = ch.topics[i + 1]; return h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${n.id}/read` }, `Next level: ${n.title} →`); }\n  return h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/boss` }, 'Boss fight →');", "  if (i < ch.topics.length - 1) { const n = ch.topics[i + 1]; return h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/${n.id}/read` }, `Next battle: ${n.title} →`); }\n  return h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}/boss` }, 'Lay siege →');"),
    ("""function boss(app, ch) {
  const n = 24;
  const questions = buildExam(app.content, app.state, { n, chapters: new Set([ch.chapter]) });
  const host = h('div', { style: { '--ch': ch.color } });
  const runner = createRunner(app, {
    title: `Boss · ${ISLANDS[ch.chapter]?.name || 'Chapter ' + ch.chapter}`, subtitle: `${ch.title}. ${n} questions, 90% to claim the island.`, mode: 'boss', questions, feedback: 'immediate', limit: n, pursuit: false, hearts: null,""",
     """function boss(app, ch) {
  const n = 24;
  const questions = buildExam(app.content, app.state, { n, chapters: new Set([ch.chapter]) });
  const host = h('div', { style: { '--ch': ch.color } });
  let runner = null;
  warBriefing(app, { kind: 'boss', chapter: ch, cta: 'Begin the siege' }).then(() => { if (host.dead) return; runner = buildBoss(); host.appendChild(runner); });
  host.cleanup = () => { host.dead = true; runner && runner.cleanup && runner.cleanup(); };
  return host;
  function buildBoss() { return createRunner(app, {
    title: `Siege of ${ISLANDS[ch.chapter]?.capital || 'the capital'}`, subtitle: `Provincia ${ISLANDS[ch.chapter]?.name || ch.chapter} · ${ch.title}. ${n} questions, 90% to take the city.`, mode: 'boss', questions, feedback: 'immediate', limit: n, pursuit: false, hearts: null,"""),
    ("      if (won && !rec.cleared) { rec.cleared = Date.now(); app.grantXp(300, 'island claimed'); app.confetti({ count: 220 }); app.sound('level'); }\n      else if (won) { app.grantXp(100, 'boss beaten again'); app.confetti(); }",
     "      if (won && !rec.cleared) { rec.cleared = Date.now(); app.grantXp(300, 'province conquered'); app.confetti({ count: 220, colors: ['#8B1E1E', '#C9A227', '#E3C76A', '#EADBC0'] }); app.sound('level'); }\n      else if (won) { app.grantXp(100, 'the city holds for Rome'); app.confetti({ colors: ['#8B1E1E', '#C9A227', '#E3C76A'] }); }"),
    ("      if (won) host.appendChild(h('div', { class: 'claim crown', style: { '--ch': ch.color } }, h('div', { class: 'claim-crown' }, '👑'), h('div', { class: 'claim-text' }, h('div', { class: 'eyebrow' }, 'Island claimed'), h('h2', null, ISLANDS[ch.chapter]?.name || ch.title), h('p', { class: 'small muted' }, `${sum.correct}/${n}. Chapter ${ch.chapter} is yours.`))));",
     "      if (won) host.appendChild(h('div', { class: 'claim crown', style: { '--ch': ch.color } }, h('div', { class: 'claim-crown' }, '🦅'), h('div', { class: 'claim-text' }, h('div', { class: 'eyebrow' }, 'Province conquered'), h('h2', null, `${ISLANDS[ch.chapter]?.name || ch.title} is Roman`), h('p', { class: 'small muted' }, `${sum.correct}/${n}. Chapter ${ROMAN[ch.chapter]} is yours.`))));"),
    ("      host.appendChild(resultCard(app, won ? 'Boss beaten' : complete ? 'Boss survived' : 'Fight ended', sum,", "      host.appendChild(resultCard(app, won ? 'The city has fallen' : complete ? 'The walls held' : 'Siege lifted', sum,"),
    ("            h('a', { class: 'btn primary', href: won ? '#/campaign' : `#/campaign/${ch.chapter}/boss` }, won ? 'Back to the archipelago' : 'Fight again'),", "            h('a', { class: 'btn primary', href: won ? '#/campaign' : `#/campaign/${ch.chapter}/boss` }, won ? 'Back to the map' : 'Renew the siege'),"),
    ("            h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}` }, 'Back to the island')))));\n      host.appendChild(h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Review'), missesList(app, sum.log)));\n    },\n  });\n  host.appendChild(runner);\n  host.cleanup = () => runner.cleanup && runner.cleanup();\n  return host;\n}",
     "            h('a', { class: 'btn ghost', href: `#/campaign/${ch.chapter}` }, 'Back to the province')))));\n      host.appendChild(h('div', { class: 'mt' }, h('h3', { class: 'mb' }, 'Review'), missesList(app, sum.log)));\n    },\n  }); }\n}"),
    ("          won ? null : complete ? h('p', null, `You need 90% (${Math.ceil(n * 0.9)}/${n}). Drill the misses below, then come back.`) : h('p', { class: 'muted' }, 'Finish all questions to record a score.'),", "          won ? null : complete ? h('p', null, `You need 90% (${Math.ceil(n * 0.9)}/${n}) to take the city. Drill the ground lost below, then renew the siege.`) : h('p', { class: 'muted' }, 'Finish every question to record the siege.'),"),
])

# ---- drill / exam: briefings before the fight, copy ----
rw('app/views/drill.js', [
    ("import { createRunner, resultCard, missesList } from './runner.js';", "import { createRunner, resultCard, missesList } from './runner.js';\nimport { warBriefing } from '../cutscene.js';"),
    ("h('div', { class: 'page-head' }, h('div', null, h('h1', null, weak ? 'Weak Spot Hunter' : 'Smart Drill'), h('p', null, 'The engine picks what you most need: open pursuits first, then concepts due for review, then weak and new ones, interleaved across chapters. Miss one and it comes back three times from different angles.'))),",
     "h('div', { class: 'page-head' }, h('div', null, h('h1', null, weak ? 'Reinforce the Weak Flank' : 'Field Drill'), h('p', null, 'The engine picks the ground: open pursuits first, then strongholds due for review, then weak and fresh ones, interleaved across the provinces. Lose one and it is contested three more times from different angles.'))),"),
    ("h('button', { class: 'btn primary big', onClick: () => {\n        if (!selected.size) { app.toast('Pick at least one chapter', 'bad'); return; }\n        sessionStorage.setItem('drillcfg', JSON.stringify({ chapterList: [...selected], limit: goal || null, mode }));\n        app.navigate('#/drill/go');\n      } }, 'Start drilling'),",
     "h('button', { class: 'btn primary big', onClick: () => {\n        if (!selected.size) { app.toast('Pick at least one province', 'bad'); return; }\n        sessionStorage.setItem('drillcfg', JSON.stringify({ chapterList: [...selected], limit: goal || null, mode }));\n        app.navigate('#/drill/go');\n      } }, 'March out'),"),
    ("h('button', { class: mode === 'drill' ? 'on' : '', onClick: e => { mode = 'drill'; modeSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, '🎯 Smart mix'),\n    h('button', { class: mode === 'weak' ? 'on' : '', onClick: e => { mode = 'weak'; modeSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, '🩹 Weak spots only'));",
     "h('button', { class: mode === 'drill' ? 'on' : '', onClick: e => { mode = 'drill'; modeSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, '⚔️ Full field'),\n    h('button', { class: mode === 'weak' ? 'on' : '', onClick: e => { mode = 'weak'; modeSeg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); } }, '🛡️ Weak flank only'));"),
    ("""  const host = h('div');
  const introduced = new Set();
  const runner = createRunner(app, {
    title: cfg.title || (mode === 'weak' ? 'Weak Spot Hunter' : 'Smart Drill'), subtitle: chapters && chapters.size < app.content.chapters.length ? `Chapters ${[...chapters].sort((a, b) => a - b).join(', ')}` : 'All chapters, interleaved',""",
     """  const host = h('div');
  const introduced = new Set();
  let runner = null;
  warBriefing(app, { kind: mode === 'weak' ? 'weak' : 'drill', cta: 'Take command' }).then(() => { if (host.dead) return; runner = build(); host.appendChild(runner); });
  host.cleanup = () => { host.dead = true; runner && runner.cleanup && runner.cleanup(); };
  return host;
  function build() { return createRunner(app, {
    title: cfg.title || (mode === 'weak' ? 'Reinforce the Weak Flank' : 'Field Drill'), subtitle: chapters && chapters.size < app.content.chapters.length ? `Provinces ${[...chapters].sort((a, b) => a - b).join(', ')}` : 'All provinces, interleaved',"""),
    ("""      host.append(resultCard(app, reason === 'exhausted' ? 'Nothing left to ask right now' : 'Drill complete', sum,
        h('div', { class: 'stack mt' },
          reason === 'exhausted' ? h('p', { class: 'muted' }, 'Everything in this selection is mastered or resting until its next review. Come back after a break, or widen the chapter selection.') : null,
          h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
            h('a', { class: 'btn primary', href: fromSession ? '#/drill/go' : location.hash }, 'Go again'),
            h('a', { class: 'btn ghost', href: '#/drill' }, 'Change settings'),
            h('a', { class: 'btn ghost', href: '#/home' }, 'Home')))),
      sum.log.some(l => !l.correct) ? h('div', { class: 'mt' }, h('h3', { class: 'mb' }, `Misses (${sum.log.filter(l => !l.correct).length})`), missesList(app, sum.log)) : null);
    },
  });
  host.appendChild(runner);
  host.cleanup = () => runner.cleanup && runner.cleanup();
  return host;
}""",
     """      host.append(resultCard(app, reason === 'exhausted' ? 'No ground left to contest right now' : 'Drill complete', sum,
        h('div', { class: 'stack mt' },
          reason === 'exhausted' ? h('p', { class: 'muted' }, 'Everything in this selection is mastered or resting until its next review. Return after a break, or widen the provinces.') : null,
          h('div', { class: 'row wrap', style: { justifyContent: 'center' } },
            h('a', { class: 'btn primary', href: fromSession ? '#/drill/go' : location.hash }, 'March again'),
            h('a', { class: 'btn ghost', href: '#/drill' }, 'Change orders'),
            h('a', { class: 'btn ghost', href: '#/home' }, 'Castra')))),
      sum.log.some(l => !l.correct) ? h('div', { class: 'mt' }, h('h3', { class: 'mb' }, `Ground lost (${sum.log.filter(l => !l.correct).length})`), missesList(app, sum.log)) : null);
    },
  }); }
}"""),
    ("if (sub === 'chapter') return start(app, { chapters: new Set([parseInt(arg, 10)]), limit: 30, title: `Chapter ${arg} drill` });", "if (sub === 'chapter') return start(app, { chapters: new Set([parseInt(arg, 10)]), limit: 30, title: `Province drill · Chapter ${arg}` });"),
    ("return start(app, { concepts: new Set(ids), limit: Math.max(12, ids.length * 4), title: 'Drill my misses', weak: false, pursuitFirst: true });", "return start(app, { concepts: new Set(ids), limit: Math.max(12, ids.length * 4), title: 'Retake the lost ground', weak: false, pursuitFirst: true });"),
])
rw('app/views/exam.js', [
    ("import { createRunner } from './runner.js';", "import { createRunner } from './runner.js';\nimport { warBriefing } from '../cutscene.js';"),
    ("h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Midterm Simulator'), h('p', null, 'Exam conditions: questions mixed across chapters and weighted like the real test, no feedback until you finish, a clock. Every miss becomes a pursuit in Smart Drill.'))),",
     "h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'The Great Battle'), h('p', null, 'Exam conditions: questions mixed across every province and weighted like the real test, no word from the Legatus until the field is cleared, a clock. Every miss becomes a pursuit in Field Drill.'))),"),
    ("      } }, 'Start simulation'),", "      } }, 'Give battle'),"),
    ("""  const host = h('div');
  const runner = createRunner(app, {
    title: 'Midterm simulation', subtitle: `${questions.length} questions · ${cfg.per ? fmtTime(cfg.per * questions.length) + ' total' : 'untimed'} · no feedback until the end`,""",
     """  const host = h('div');
  let runner = null;
  warBriefing(app, { kind: 'exam', cta: 'Give battle' }).then(() => { if (host.dead) return; runner = build(); host.appendChild(runner); });
  host.cleanup = () => { host.dead = true; runner && runner.cleanup && runner.cleanup(); };
  return host;
  function build() { return createRunner(app, {
    title: 'The Great Battle', subtitle: `${questions.length} questions · ${cfg.per ? fmtTime(cfg.per * questions.length) + ' total' : 'untimed'} · no feedback until the end`,"""),
    ("""    onExit: () => {},
  });
  host.appendChild(runner);
  host.cleanup = () => runner.cleanup && runner.cleanup();
  return host;
}

function result(app, rec) {""",
     """    onExit: () => {},
  }); }
}

function result(app, rec) {"""),
    ("h('div', { class: 'eyebrow' }, rec.reason === 'time' ? 'Time expired' : 'Simulation complete'),", "h('div', { class: 'eyebrow' }, rec.reason === 'time' ? 'The sun set on the field' : 'The field is cleared'),"),
    ("missConcepts.length ? h('a', { class: 'btn primary big', href: `#/drill/concepts/${missConcepts.join(',')}` }, `🎯 Drill my ${missConcepts.length} missed concept${missConcepts.length === 1 ? '' : 's'}`) : null,\n        h('a', { class: 'btn', href: '#/exam' }, 'New simulation'), h('a', { class: 'btn ghost', href: '#/home' }, 'Home'))),",
     "missConcepts.length ? h('a', { class: 'btn primary big', href: `#/drill/concepts/${missConcepts.join(',')}` }, `⚔️ Retake ${missConcepts.length} lost stronghold${missConcepts.length === 1 ? '' : 's'}`) : null,\n        h('a', { class: 'btn', href: '#/exam' }, 'Another battle'), h('a', { class: 'btn ghost', href: '#/home' }, 'Castra'))),"),
    ("h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'By chapter'), h('div', { class: 'stack' }, chRows)),", "h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'By province'), h('div', { class: 'stack' }, chRows)),"),
    ("h('button', { class: 'on', onClick: e => { filter = 'wrong'; seg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); drawList(); } }, `Misses (${rec.misses.length})`)", "h('button', { class: 'on', onClick: e => { filter = 'wrong'; seg.querySelectorAll('button').forEach(b => b.classList.remove('on')); e.currentTarget.classList.add('on'); drawList(); } }, `Ground lost (${rec.misses.length})`)"),
    ("if (!items.length) list.appendChild(h('div', { class: 'empty' }, 'No misses. Clean sheet!'));", "if (!items.length) list.appendChild(h('div', { class: 'empty' }, 'No ground lost. A triumph.'));"),
])

# ---- home: castra copy ----
rw('app/views/home.js', [
    ("h('div', { class: 'eyebrow' }, exam ? `Midterm ${exam}` : 'Midterm trainer'),\n      h('h1', null, `Hey ${st.name}.`),", "h('div', { class: 'eyebrow' }, exam ? `The midterm ${exam} · Castra` : 'Castra'),\n      h('h1', null, `Ave, ${st.name}.`),"),
    ("h('div', { class: 'tiny muted' }, 'exam ready')) })),", "h('div', { class: 'tiny muted' }, 'test readiness')) })),"),
    ("stat(counts[4], 'mastered', 'var(--good)'), stat(counts[3], 'solid'), stat(islands, 'islands claimed'),", "stat(counts[4], 'mastered', 'var(--good)'), stat(counts[3], 'solid'), stat(islands, 'provinces conquered'),"),
    ("h('a', { class: 'map-link', href: '#/campaign', 'aria-label': 'Open the campaign map' }, worldMap(app, { compact: true }))));", "h('a', { class: 'map-link', href: '#/campaign', 'aria-label': 'Open the map of provinces' }, worldMap(app, { compact: true }))));"),
    ("h('div', { class: 'page-head' }, h('div', null, h('h2', null, 'Pick a cartridge'), h('p', null, 'Different games, one engine: every answer feeds the same mastery model and review schedule.'))),", "h('div', { class: 'page-head' }, h('div', null, h('h2', null, 'Orders of the day'), h('p', null, 'Different engagements, one engine: every answer feeds the same mastery model and review schedule.'))),"),
    ("      cart('#/campaign', '🗺️', 'Campaign', 'Islands, trails, flags, bosses.', '#2DD4BF', `${islands}/8 claimed`),\n      cart('#/drill', '🎯', 'Smart Drill', 'Adaptive mix. Misses trigger a pursuit.', '#FF6B6B', `${due} due · ${pursuits} pursuits`),\n      cart('#/exam', '📝', 'Midterm Sim', 'Timed, mixed, debriefed.', '#38BDF8', '20–80 Q'),\n      cart('#/arcade/blitz', '⚡', 'Blitz', '90 s, three lives, combos.', '#FFB84D', `best ${st.stats.blitzBest || 0}`),\n      cart('#/drill/weak', '🩹', 'Weak Spots', 'Only what is below Solid.', '#F472B6', 'targeted'),\n      cart('#/arcade/duel', '⚔️', 'Duel', 'Tell-apart and NOT questions.', '#A78BFA', '20 s each'),\n      cart('#/arcade/build', '🧩', 'Build & Sort', 'Order, sort, match the tables.', '#A3E635', `${Object.values(st.activities).filter(a => a.done).length}/${app.content.stats.activities}`),\n      cart('#/arcade/flash', '🃏', 'Flashcards', 'Recall with honest grading.', '#FB923C', 'recall'),\n      cart('#/learn', '📖', 'Lessons', 'Slides and diagrams, one idea at a time.', '#9AA3B8', 'read'),",
     "      cart('#/campaign', '🗺️', 'Conquest', 'Provinces, roads, standards, sieges.', '#C9A227', `${islands}/8 conquered`),\n      cart('#/drill', '⚔️', 'Field Drill', 'Adaptive mix. Misses trigger a pursuit.', '#8B1E1E', `${due} due · ${pursuits} pursuits`),\n      cart('#/exam', '🛡️', 'Great Battle', 'Timed, mixed, debriefed.', '#6FA0B8', '20–80 Q'),\n      cart('#/arcade/blitz', '⚡', 'Skirmish', '90 s, three lives, combos.', '#D28C3C', `best ${st.stats.blitzBest || 0}`),\n      cart('#/drill/weak', '🛡️', 'Weak Flank', 'Only what is below Solid.', '#C8683A', 'reinforce'),\n      cart('#/arcade/duel', '🗡️', 'Gladiator Duel', 'Tell-apart and NOT questions.', '#A98BC9', '20 s each'),\n      cart('#/arcade/build', '🏗️', 'Siege Works', 'Order, sort, match the tables.', '#8FAA5A', `${Object.values(st.activities).filter(a => a.done).length}/${app.content.stats.activities}`),\n      cart('#/arcade/flash', '📜', 'Scrolls', 'Recall with honest grading.', '#B08968', 'recall'),\n      cart('#/learn', '🏛️', 'Archives', 'Slides and diagrams, one idea at a time.', '#B4A58A', 'study'),"),
    ("h('div', { class: 'page-head' }, h('div', null, h('h2', null, 'The Shelf'), h('p', null, 'Every concept is a product on its chapter shelf. Fill the shelves. Click a tile to open its lesson.')), h('a', { class: 'btn sm ghost', href: '#/progress' }, 'Full progress →')),", "h('div', { class: 'page-head' }, h('div', null, h('h2', null, 'The Armoury'), h('p', null, 'Every concept is a weapon on its province rack. Forge them all. Click a piece to open its scroll.')), h('a', { class: 'btn sm ghost', href: '#/progress' }, 'Senate report →')),"),
    ("  if (counts[4] + counts[3] + counts[2] === 0) return 'The archipelago is unexplored and the shelves are empty. Land on the first island.';\n  if (r.score < 0.4) return 'Good start. Keep planting flags.';\n  if (r.score < 0.7) return 'Momentum. The weak spots are showing themselves.';\n  if (r.score < 0.9) return 'Strong. Hunt the stragglers and run simulations.';\n  return 'You are exam-ready. Stay sharp.';",
     "  if (counts[4] + counts[3] + counts[2] === 0) return 'The provinces are unconquered and the armoury is empty. March on Italia.';\n  if (r.score < 0.4) return 'A good start. Keep planting standards.';\n  if (r.score < 0.7) return 'Momentum. The weak flanks are showing themselves.';\n  if (r.score < 0.9) return 'Strong. Hunt the stragglers and give battle.';\n  return 'The legions are ready. Stay sharp.';"),
    ("h('summary', null, h('h2', null, 'Two-day plan'), h('span', { class: 'chip' }, `${done}/${total} done`),", "h('summary', null, h('h2', null, 'Campaign plan'), h('span', { class: 'chip' }, `${done}/${total} done`),"),
])

# ---- arcade / learn / progress / settings copy ----
rw('app/views/arcade.js', [
    ("h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Arcade'), h('p', null, 'Different games, same engine underneath: every answer updates mastery and the review schedule.'))),", "h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'The Arena'), h('p', null, 'Different contests, same engine underneath: every answer updates mastery and the review schedule.'))),"),
    ("tile('#/arcade/blitz', '⚡', 'Blitz', '90 seconds, three lives, combo multiplier. Short questions only. Best for warming up recall.', '#FFB84D', [`Best ${st.blitzBest || 0}`]),", "tile('#/arcade/blitz', '⚡', 'Skirmish', '90 seconds, three lives, combo multiplier. Short questions only. Best for warming up recall.', '#D28C3C', [`Best ${st.blitzBest || 0}`]),"),
    ("tile('#/arcade/duel', '⚔️', 'Confusables Duel', 'Only “tell them apart” and “which is NOT” questions, 20 seconds each, 15 rounds, three lives.', '#A78BFA', [`Best ${st.duelBest || 0}/15`]),", "tile('#/arcade/duel', '🗡️', 'Gladiator Duel', 'Only “tell them apart” and “which is NOT” questions, 20 seconds each, 15 rounds, three lives.', '#A98BC9', [`Best ${st.duelBest || 0}/15`]),"),
    ("tile('#/arcade/build', '🧩', 'Build & Sort', 'Order the processes, sort items into buckets, match pairs. The memorization tables as puzzles.', '#A3E635', [`${done}/${app.content.stats.activities} done`]),", "tile('#/arcade/build', '🏗️', 'Siege Works', 'Order the processes, sort items into buckets, match pairs. The memorization tables as engineering.', '#8FAA5A', [`${done}/${app.content.stats.activities} built`]),"),
    ("tile('#/arcade/flash', '🃏', 'Flashcards', 'Classic recall with honest self-grading. Again / Hard / Good / Easy feed the spacing schedule.', '#FB923C', ['Recall'])));", "tile('#/arcade/flash', '📜', 'Scrolls', 'Classic recall with honest self-grading. Again / Hard / Good / Easy feed the spacing schedule.', '#B08968', ['Recall'])));"),
    ("h('div', { class: 'page-head' }, h('div', null, h('h1', null, '⚡ Blitz'),", "h('div', { class: 'page-head' }, h('div', null, h('h1', null, '⚡ Skirmish'),"),
    ("title: 'Blitz', subtitle: 'Fast. Short. Three lives.', mode: 'blitz',", "title: 'Skirmish', subtitle: 'Fast. Short. Three lives.', mode: 'blitz',"),
    ("if (score > best) { app.state.stats.blitzBest = score; app.toast('New Blitz high score!', 'xp'); app.confetti({ count: 120 }); }\n      app.grantXp(Math.round(score / 20), 'blitz');", "if (score > best) { app.state.stats.blitzBest = score; app.toast('New skirmish record!', 'xp'); app.confetti({ count: 120, colors: ['#8B1E1E', '#C9A227', '#E3C76A'] }); }\n      app.grantXp(Math.round(score / 20), 'skirmish');"),
    ("h('div', { class: 'page-head' }, h('div', null, h('h1', null, '⚔️ Confusables Duel'),", "h('div', { class: 'page-head' }, h('div', null, h('h1', null, '🗡️ Gladiator Duel'),"),
    ("title: 'Confusables Duel', subtitle: '15 rounds · 20 s each · 3 lives', mode: 'duel',", "title: 'Gladiator Duel', subtitle: '15 rounds · 20 s each · 3 lives', mode: 'duel',"),
    ("h('div', { class: 'page-head' }, h('div', null, h('h1', null, '🧩 Build & Sort'), h('p', null, 'The processes and tables the exam expects you to reproduce. A perfect run counts as a correct “sequence” answer for the concept.'))),", "h('div', { class: 'page-head' }, h('div', null, h('h1', null, '🏗️ Siege Works'), h('p', null, 'The processes and tables the exam expects you to reproduce. A perfect build counts as a correct “sequence” answer for the concept.'))),"),
    ("h('div', { class: 'page-head' }, h('div', null, h('h1', null, '🃏 Flashcards'),", "h('div', { class: 'page-head' }, h('div', null, h('h1', null, '📜 Scrolls'),"),
    ("head.append(h('div', null, h('div', { class: 'eyebrow' }, 'Flashcards'),", "head.append(h('div', null, h('div', { class: 'eyebrow' }, 'Scrolls'),"),
], must=False)
rw('app/views/learn.js', [
    ("h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Lessons'), h('p', null, 'Short slides, one idea at a time: definition, plain English, a diagram you can poke, what it is confused with, then a quick check. Rereading alone is weak, so every lesson tests you as you go.'))),", "h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'The Archives'), h('p', null, 'Short scrolls, one idea at a time: definition, plain English, a diagram you can poke, what it is confused with, then a quick check. Rereading alone is weak, so every scroll tests you as you go.'))),"),
    ("h('div', null, h('div', { class: 'eyebrow' }, `${ISLANDS[ch.chapter]?.name || ''} · Chapter ${ch.chapter}`), h('h3', null, ch.title),", "h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.numeral || ch.chapter} · Provincia ${ISLANDS[ch.chapter]?.name || ''}`), h('h3', null, ch.title),"),
    ("h('div', { class: 'row wrap' }, h('a', { class: 'btn sm ch', href: `#/learn/${ch.chapter}` }, '📖 Open lessons'), h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Cheat sheet')));", "h('div', { class: 'row wrap' }, h('a', { class: 'btn sm ch', href: `#/learn/${ch.chapter}` }, '📜 Open scrolls'), h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Tablet')));"),
    ("h('a', { class: 'back', href: '#/learn' }, '← All chapters'),", "h('a', { class: 'back', href: '#/learn' }, '← All provinces'),"),
    ("h('div', { class: 'row wrap mt-sm mb' }, h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Cheat sheet'), h('a', { class: 'btn sm ghost', href: `#/campaign/${ch.chapter}` }, 'Island')),", "h('div', { class: 'row wrap mt-sm mb' }, h('a', { class: 'btn sm ghost', href: `#/learn/${ch.chapter}/sheet` }, 'Tablet'), h('a', { class: 'btn sm ghost', href: `#/campaign/${ch.chapter}` }, 'Province')),"),
    ("const lesson = createLesson(app, cids, { chapter: ch, title: `Lessons · ${ch.title}`, quickCheck: false, startAt, exitHref: '#/learn', completeLabel: '🎯 Drill this chapter', onComplete: () => app.navigate(`#/drill/chapter/${ch.chapter}`) });", "const lesson = createLesson(app, cids, { chapter: ch, title: `Archives · ${ch.title}`, quickCheck: false, startAt, exitHref: '#/learn', completeLabel: '⚔️ Drill this province', onComplete: () => app.navigate(`#/drill/chapter/${ch.chapter}`) });"),
    ("h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.chapter} · cheat sheet`), h('h1', null, ch.title), h('p', null, 'Every term with its one-line definition, plus the must-memorize tables. Skim this the morning of the exam.'))),", "h('div', null, h('div', { class: 'eyebrow' }, `Chapter ${ch.numeral || ch.chapter} · the tablet`), h('h1', null, ch.title), h('p', null, 'Every term with its one-line definition, plus the must-memorize tables. Read this the morning of the battle.'))),"),
    ("h('a', { class: 'back', href: `#/learn/${ch.chapter}` }, `← Chapter ${ch.chapter} lessons`),", "h('a', { class: 'back', href: `#/learn/${ch.chapter}` }, `← Chapter ${ch.numeral || ch.chapter} scrolls`),"),
], must=False)
rw('app/views/progress.js', [
    ("h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Progress'), h('p', null, 'Readiness blends mastery (60%), how much of the course you have touched (15%) and your last two simulations (25%).'))),", "h('div', { class: 'page-head' }, h('div', null, h('h1', null, 'Report to the Senate'), h('p', null, 'Test Readiness blends mastery (60%), how much of the course you have touched (15%) and your last two great battles (25%).'))),"),
    ("h('div', { class: 'eyebrow' }, 'Readiness'),", "h('div', { class: 'eyebrow' }, 'Test Readiness'),"),
    ("h('div', { class: 'card' }, h('h2', { class: 'mb' }, 'By chapter'),", "h('div', { class: 'card' }, h('h2', { class: 'mb' }, 'By province'),"),
    ("h('div', null, h('div', { class: 'page-head' }, h('h2', null, 'The Shelf')), shelfMap(app)),", "h('div', null, h('div', { class: 'page-head' }, h('h2', null, 'The Armoury')), shelfMap(app)),"),
    ("h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'Weakest concepts'),", "h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'Weakest strongholds'),"),
    ("h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'Simulations'),", "h('div', { class: 'card' }, h('h3', { class: 'mb' }, 'Great battles'),"),
    ("h('div', null, h('div', { class: 'page-head' }, h('h2', null, `Achievements · ${Object.keys(st.achievements).length}/${ACHIEVEMENTS.length}`)),", "h('div', null, h('div', { class: 'page-head' }, h('h2', null, `Honours · ${Object.keys(st.achievements).length}/${ACHIEVEMENTS.length}`)),"),
], must=False)
rw('app/views/settings.js', [
    ("h('div', { class: 'page-head' }, h('h1', null, 'Settings')),", "h('div', { class: 'page-head' }, h('h1', null, 'Quartermaster')),"),
    ("h('div', { class: 'card stack' }, h('h3', null, 'Player'),", "h('div', { class: 'card stack' }, h('h3', null, 'Legionary'),"),
    ("      sw('sound', 'Sound effects', 'Short blips for right, wrong, level-ups.'),", "      sw('briefings', 'War briefings', 'The Legatus briefs you in his tent before each lesson, battle, siege and drill. Skippable any time.'),\n      sw('sound', 'Sound effects', 'Short blips for right, wrong, promotions.'),"),
    ("h('div', { class: 'toggle' }, h('div', null, h('div', { style: { fontWeight: 700 } }, 'Theme'), h('div', { class: 'small muted' }, 'Dark is easier at night; light for daytime.')),", "h('div', { class: 'toggle' }, h('div', null, h('div', { style: { fontWeight: 700 } }, 'Watch'), h('div', { class: 'small muted' }, 'Night camp is easier on the eyes after dark; day march for daylight.')),"),
    ("} }, 'Dark'), h('button',", "} }, 'Night camp'), h('button',"),
    ("} }, 'Light'))),", "} }, 'Day march'))),"),
], must=False)
rw('app/views/common.js', [
    ("h('span', { class: 'row' }, h('span', { class: 'tile m0', style: { '--ch': 'var(--muted)' } }), 'Not started'),", "h('span', { class: 'row' }, h('span', { class: 'tile m0', style: { '--ch': 'var(--muted)' } }), 'Unforged'),"),
    ("if (started === 0) return { title: 'Start the Campaign', desc: 'Read Chapter 1 cards, then clear its checkpoints. Reading first, then immediate retrieval, is the fastest way in.', href: '#/campaign/1', cta: 'Open Chapter 1' };", "if (started === 0) return { title: 'March on Italia', desc: 'Study the Chapter I scrolls, then win its battles. Reading first, then immediate retrieval, is the fastest way in.', href: '#/campaign/1', cta: 'Begin the conquest' };"),
    ("if (pursuits >= 4) return { title: `${pursuits} pursuits are open`, desc: 'You missed these recently. Smart Drill will keep re-asking them from new angles until they stick.', href: '#/drill', cta: 'Run Smart Drill' };", "if (pursuits >= 4) return { title: `${pursuits} pursuits are open`, desc: 'Ground lost recently. Field Drill will contest it from new angles until it holds.', href: '#/drill', cta: 'Field Drill' };"),
    ("if (due >= 8) return { title: `${due} concepts are due for review`, desc: 'Spaced review is where memory becomes durable. A 20-question drill clears most of these.', href: '#/drill', cta: 'Review now' };", "if (due >= 8) return { title: `${due} strongholds are due for review`, desc: 'Spaced review is where memory becomes durable. A 20-question drill clears most of these.', href: '#/drill', cta: 'Review now' };"),
    ("if (unfinished && r.score < 0.75) return { title: `Continue Chapter ${unfinished.chapter}`, desc: `${unfinished.title}: finish its checkpoints and beat the boss.`, href: `#/campaign/${unfinished.chapter}`, cta: 'Continue campaign' };", "if (unfinished && r.score < 0.75) return { title: `Continue in ${unfinished.province || 'the province'} (Chapter ${unfinished.numeral || unfinished.chapter})`, desc: `${unfinished.title}: win its battles and take the capital.`, href: `#/campaign/${unfinished.chapter}`, cta: 'Continue the conquest' };"),
    ("if (!exams.length || (Date.now() - exams[exams.length - 1].t) > 3 * 3600000) return { title: 'Run a midterm simulation', desc: 'Timed, mixed, no feedback until the end. Your misses feed straight back into Smart Drill.', href: '#/exam', cta: 'Start simulation' };", "if (!exams.length || (Date.now() - exams[exams.length - 1].t) > 3 * 3600000) return { title: 'Give battle', desc: 'Timed, mixed, no feedback until the end. Your misses feed straight back into Field Drill.', href: '#/exam', cta: 'The Great Battle' };"),
    ("return { title: 'Hunt your weak spots', desc: 'Everything below Solid, plus anything you have missed. Then rest: a later session is required for Mastered.', href: '#/drill/weak', cta: 'Weak Spot Hunter' };", "return { title: 'Reinforce the weak flank', desc: 'Everything below Solid, plus anything you have missed. Then rest: a later session is required for Mastered.', href: '#/drill/weak', cta: 'Weak Flank' };"),
    ("h('span', { class: 'small muted mono' }, `${m.dist[4]}★ ${m.dist[3]}▮ · ${Math.round(m.score * 100)}%`)),", "h('span', { class: 'small muted mono' }, `${m.dist[4]}★ ${m.dist[3]}▮ · ${Math.round(m.score * 100)}%`)),"),
], must=False)
print('roman patch applied')
