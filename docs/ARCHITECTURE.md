# MARK 201 Imperium — architecture notes (as found, 2026-10-29)

Written before the FIN 201 expansion. Everything below describes the app as it existed at commit
`67ef1da` ("Plain-English names first, chapters instead of Latin provinces"). The second half lists every
bug found while reading and playing it, with root causes.

## 1. Shape of the site

Static GitHub Pages site, plain ES modules, no build step for the JavaScript. The only generated file is
`app/data.js` (the content bundle). `index.html` loads five stylesheets and `app/main.js`; `sw.js` is a
network-first service worker whose cache name is stamped by `tools/build.py` with a hash of every app file.

```
index.html, sw.js, publish.ps1        shell, service worker, one-command publish
app/main.js                           bootstrap: content index, Store, hash router, header, settings
app/engine.js                         pure learning engine (mastery, spacing, pursuit, picker, exam builder, XP, readiness)
app/store.js                          localStorage profiles + sessions + export/import
app/achievements.js                   honours (each pays 50 XP when unlocked)
app/ui.js                             h() DOM helper, toasts, coin flight, confetti, modal, ring/bar
app/cosmetic.js  app/shop.js  app/legion.js   denarii, shop, avatar, parade ground, rank ladder, daily orders, brazier, clepsydra
app/views/*.js                        home (Castra), campaign, drill, exam, arcade, learn, lesson, progress, settings, runner, concept, common
app/map.js app/geo.js app/geo/med.json app/maplabels.js app/wartable.js   2.5D parchment map and 3D Three.js war table (same geography)
app/scenes.js app/scene-director.js app/battle.js app/commanders.js app/cutscene.js app/vignettes.js app/visuals.js app/icons.js app/audio.js
content/parts/chNN_*.json -> tools/validate.py -> content/chNN.json -> tools/build.py -> app/data.js
```

Routes are hash based (`#/home`, `#/campaign/7/t07-2/drill`, `#/drill/go`, `#/exam/go`, `#/arcade/blitz/go`,
`#/learn/8/c08-plc-stages`, `#/progress`, `#/settings`). `main.js` keeps one `app` object (`window.__app`)
with `content`, `store`, `index` (Maps by concept/question/topic/chapter), `answer()`, `grantXp()`,
`navigate()`, `toast`, `sound`, `director`.

## 2. Content pipeline

- Source of truth: `content/parts/chNN_meta.json` (topics, concepts, activities) and `chNN_q*.json`
  (arrays of questions, max 40 each). Schema in `kb/CONTENT_SPEC.md`; verification procedure in
  `kb/REVIEW_SPEC.md`; per-chapter ground truth in `kb/inventory_chNN.md` (the raw slide extracts are
  gitignored).
- `tools/validate.py NN` enforces the schema (ids `cNN-slug`, `tNN-k`, `aNN-kk`, `qNN-kkk`; angles; 5+
  questions per concept over 4+ angles including `identify` and one of `contrast`/`not`; 110+ questions
  per chapter; 10 official questions) and merges the parts into `content/chNN.json`.
- `tools/build.py` adds chapter meta (colour, short name, Latin province, numeral), bundles every chapter
  into `app/data.js` as `export const CONTENT = {chapters:[...], stats:{questions, concepts, activities}, version}`
  and rewrites `const VERSION` in `sw.js`.
- Question object: `{id, concept, also[], type: mc|tf|fill, angle, difficulty 1-3, stem, options[], answer (index),
  explanation, source: official|generated}`. Concept: `{id, topic, term, definition, explain, example, contrast,
  trap, mnemonic, figure}`. Activities: `order | sort | match`.
- Lessons are not separate content: `views/lesson.js` turns each concept's fields into six slides (hook,
  recall, explain line-by-line, visual, tell-apart, quick check). The "Learn slides cover too much" complaint is
  therefore a renderer issue, not a data issue: every slide dumps the full definition/explain/example/contrast/
  trap text plus a bespoke diagram, so one concept is a long scroll of prose.

Counts at this commit: 8 chapters, 230 concepts, 1,308 questions, 47 activities.

## 3. Engine and data flow

`app.answer(q, correct, ctx)` is the single write path for an answer. It calls `recordAttempt` in
`engine.js`, which:

- appends an attempt tuple `[t, qid, angle, correct, sessionId, self]` to `state.concepts[cid].a` (kept to
  the last 40), marks the concept seen, and moves the spacing box: correct → box+1 (box+2 for flashcard "easy",
  unchanged for "hard"), wrong → box 0. Due time comes from `BOX_INTERVALS_MIN = [0,10,60,240,720,2160]` minutes.
- opens or resets a pursuit on a miss (`{need:3, done, angles, since, lastQid}`), advances it on a hit, clears it
  at 3 and pays +25 XP.
- updates `state.questions[qid]` seen/correct/wrong/last timestamps and `state.stats` (answered, correct,
  byAngle).
- recomputes mastery before and after and pays 15/30/60 XP for reaching Learning/Solid/Mastered.

Mastery (`masteryLevel`): 0 New, 1 Seen, 2 Learning (any correct), 3 Solid (3 correct from 2+ angles, last 2
right), 4 Mastered (4 non-self correct from 3+ angles, last 3 right, no pursuit, correct answers in 2+
sessions). Sessions roll after 45 minutes of inactivity (`store.touchSession`).

XP per answer: `10 × difficulty`, +5 for contrast/apply/calc, +2 per combo step up to 10. Flashcard
self-grades pay half. Bonuses: standard planted 100, boss cleared 300 (100 on repeat), exam 100 + 200 × score,
blitz score/20, duel 8 per correct, each achievement 50.

Picker (`pickNext`): pursuit queue first (items become ready after a gap of 3-6 questions), then scores every
allowed concept: + (4 − level), +1.6 unseen, +2.5 pursuit, +1.5..3 overdue, −2.5 resting-and-solid, recency
penalties, −0.7 same chapter as last (interleave), jitter. Within a concept `pickQuestionForConcept` prefers
unseen questions, new angles, target difficulty, official source, and avoids the last 30 qids.

Readiness = 60% mean mastery (levels weighted 0/.15/.4/.75/1) + 15% coverage + 25% last-two-exam average
(or mastery again when no exam). Chapter mastery uses the same weights.

Exam builder allocates `n` questions across chapters in proportion to concept counts, favouring unseen,
difficulty 2-3, identify/apply angles, at most 2 per concept, then shuffles.

## 4. Game layer

- Level: `LEVELS` in `engine.js`, 11 fixed rungs from 0 to 20,000 XP (Tiro → Imperator). `levelForXp` is used
  by the header, Castra, progress page and the promotion ceremony.
- Denarii (coins): cosmetic currency in `localStorage` key `mark201.cosmetic.v1` (not in the profile state!).
  +1 per correct answer, wagers ±1..3, +5 pursuit, +20 standard, +50 conquest, Imperator's Favor doubles after
  8 in a row, daily orders 10-20, deferred-mode exams pay 1 per correct at the end.
- Shop (`shop.js`): five categories (crest, emblem, cloak, banner, table) with 3-4 items each plus a paid
  legion name. Owned items and `equipped` live in the cosmetic key.
- Avatar: `legion.js legionaryAvatar(size, eq)` draws the bust (crest colour, cloak colour, shield emblem).
  Used on Castra, the top-bar profile button and the shop preview only.
- Battlefield: `battle.js` canvas sprites. Legionaries are drawn by `legionary(ctx, o)` with optional crest
  and cloak colours; the "hero" unit is one soldier in the ranks drawn at 1.12× scale.
- War table: `wartable.js` (Three.js from jsDelivr, lazy) and `map.js` (2.5D SVG fallback). Both read
  `geo.js` PROV polygons (lon/lat) clipped to the Natural Earth coastline in `app/geo/med.json`
  (bbox lon −11..43, lat 24..59). Scenes per province in `scenes.js` (`PROVINCE_SCENE`), enemy commanders in
  `commanders.js`, enemy lines in `battle.js ENEMY`.
- Achievements: 22 honours, rendered as phalerae on a cuirass.

## 5. Saved state (localStorage) and profiles

Profiles are local only. There is no server. Keys:

| key | content |
|---|---|
| `mark201.profiles.v1` | `[{id, name, createdAt}]` list for this browser |
| `mark201.active.v1` | id of the active profile |
| `mark201.state.v1.<id>` | the full state object below |
| `mark201.cosmetic.v1` | denarii, owned, equipped, orders, wagers flag, warTable3d flag, audio volume/mute, seenAch, lastStreak, lastBlitzDay |

State shape (`store.freshState`): `v, name, createdAt, xp, concepts{cid: {a, seen, box, due, pursuit, lastAsk}},
questions{qid: {seen,c,w,last,lastCorrect}}, activities, exams[], achievements{id: t}, campaign{topics, bosses,
unlocked}, plan, stats{answered, correct, byAngle, blitzBest, duelBest, bestCombo, pursuitsCleared}, session,
sessions[], days{YYYY-MM-DD: {answered, correct, xp, minutes}}, settings{theme, sound, motion, briefings, examDate,
dailyGoal}`.

Consequences:
- Every browser (and every device) has its own, independent list of profiles, so "two saves named Austin" are
  two different browsers or two entries in one browser's list (names are not unique; `createProfile` never
  checks). The cosmetic key is shared by every profile on a device, so denarii and gear are per device, not
  per player.
- Export/Import (`settings`) moves one profile's state as JSON; import always creates a new "(imported)"
  profile. It does not carry denarii or gear.

## 6. Tests and tooling

`tools/engine_test.mjs` (node) exercises mastery/pursuit/picker/exam; `tools/smoke_test.py` (Playwright) visits
every route and plays every mode; `tools/checklist.py` runs the PLAN.md pre-commit checklist (state shape,
keyboard-only battle, export round trip, sound/motion off, fps); `tools/prod_check.py` checks the live site;
`tools/qa.py` cross-checks content. On 2026-10-29 the smoke test passes with no console errors and the engine
test prints the expected transitions. New in this pass: `tools/contrast_audit.py` (see bug 4).

## 7. Bugs found, with root causes

1. **Equipped gear never shows on the soldier in battles** (reported). Three causes in `battle.js`:
   - `createBattle` copies only `crest` and `cloak` from the cosmetic store into a module-level `HERO`
     object; the shield emblem is never drawn on the hero at all, and the default red cloak maps to `null`
     (no cloak drawn), so a player who owns the default crest and cloak sees nothing different.
   - The sprite cache (`sprite()` → `cache` Map, module scope) keys sprites by `name|pixelRatio|flip` only.
     The hero sprite is cached under `hero` the first time any battle renders, so gear bought later in the
     same page life never repaints until a full reload; and after a reload a stale cached sprite is impossible,
     but the cache still ignores the colours, so switching gear between battles without reloading shows the
     old gear.
   - The hero is a single soldier in the middle rank at 1.12× scale with no highlight, so even when the
     colours are right nothing marks it as "you". There is no shared avatar renderer: Castra and the top bar
     use `legionaryAvatar`, battles use the canvas `legionary()`, sieges use the same ranks, the Arena and the
     progress page show no avatar.
2. **Buying the marble war table changes nothing** (reported). `wartable.js` builds the table top from a
   hard-coded oak gradient canvas (`woodCanvas`, `#5A3F22 → #6B4B2A → #4A3418`) and `map.js`/`scenes.js`
   never read `equipped().table`. The shop sells `table:walnut` and `table:marble` and stores them under
   `equipped.table`, but no renderer consumes that value. Root cause: the shop was written against a
   cosmetic key that the scene and table code were never wired to.
3. **Max level after half the course** (reported). `LEVELS` tops out at 20,000 XP. A typical correct answer
   pays 10-25 XP, each concept pays 15+30+60 on the way to Mastered, each standard 100, each boss 300, each
   exam 100-300, each honour 50. Mastering half of 230 concepts with normal play is roughly 115 × 105 +
   ~700 answers × 15 + 20 standards × 100 + 4 bosses × 300 + a few exams ≈ 26,000 XP, so the cap lands at about
   half the course. The curve is also fixed, so a second course would hit the cap even sooner.
4. **Unreadable text in the answer insight panel and elsewhere** (reported). `tools/contrast_audit.py`
   screenshots key routes in both themes and estimates each text element's contrast from the rendered pixels.
   Result: 384 of 1,766 text elements fail WCAG AA 4.5:1. The worst, all in the feedback/insight area under an
   answered question:
   - dimmed non-chosen answer tablets (`.option.dim .opt-text`, 2.9:1 in Night camp): parchment ink at reduced
     opacity on an iron tablet;
   - seal labels (`.seal-label`, 2.4-2.6:1): `--vellum-ink-soft` (#6E5A3E) on the dark wax seal;
   - the wager balance and "Wager" label (1.5-2.2:1): muted parchment ink over the parchment card;
   - "Stronghold: … now Learning" and the trap/example eyebrows (3.4-4.1:1): `--vellum-ink-soft` and
     `--pompeian` on parchment;
   - the +XP seal (3.3:1): `--gold-leaf-dark` on parchment.
   Across the app the systematic causes are: (a) `--muted` (#B4A58A dark / #6E5A3E light) used for body copy
   at 12-17 px on surfaces it was never checked against; (b) the compact rank ladder's "ahead" rungs at 7 px in
   `#8C8070` (1.0-2.6:1); (c) 2.5D map labels for locked provinces (`#6E5A3E` on parchment, 1.9-2.4:1);
   (d) Day march (light) mode: the `.cart-meta` chips (1.4:1), the castra stats keys, all `.eyebrow` labels and
   every `.small.muted` line sit on light parchment with the dark theme's muted colour, and the page `h1`s only
   reach 1.6-2.7:1 because the light theme keeps the dark-mode text shadow/engraving; (e) the question stem and
   "True/False" thumb labels in Day march (1.1-1.2:1) because the stem keeps parchment-coloured text while the
   light-theme card background is also parchment. Full report: `tools/shots/contrast/report.json`.
5. **Profile names are not unique and cosmetics are per device** (found). See §5. Two profiles named Austin
   can coexist in one browser; denarii/gear belong to whichever profile is active on that device.
6. **Learn slides are walls of text** (reported). Root cause in §2: each concept yields six slides, each
   rendering the full field text (definition, 2-4 sentence explain, example, contrast, trap) plus a diagram or
   concept map, and the "explain" slide adds a line-by-line reveal. For 230 concepts that is ~1,400 slides.
7. **Siege retry repeats the whole set** (reported). `campaign.js boss()` always rebuilds a fresh 24-question
   exam with `buildExam` regardless of the previous attempt; the result card links "Drill my misses" to a
   separate drill, but the boss itself has no partial retry.
8. **Drill filters are coarse** (reported). `views/drill.js` offers chapters, a question count and
   Full field / Weak flank only. There is no Unknown filter, no topic filter, and no count of matching
   questions. The Weak definition (`level < 3 || pursuit`) ignores recent misses on Solid concepts.
9. **Content is single-course by construction** (found). `engine.chapterOfConcept` parses the chapter number
   out of the concept id with `/^c(\d\d)-/`; `geo.js ORDER = [1,6,7,8,9,10,11,12]`, `PROVINCE_SCENE`,
   `CHAPTER_ICON`, `COMMANDERS`, `ENEMY`, `build.py CHAPTER_META` and the nav copy ("Eight chapters") all
   hard-code the marketing chapters. `content.stats.concepts` drives the "master every concept" honour and the
   readiness denominator, so adding a second course to the same bundle would dilute marketing readiness.
10. **Legacy denarii leak across profiles** (found). Because `mark201.cosmetic.v1` is not keyed by profile,
    creating a second profile on the same device starts it with the first profile's coins and gear.
11. **Index fonts** (minor). `index.html` still points the favicon and theme colour at the pre-Roman palette.

## 8. What the FIN 201 expansion must preserve

Marketing content (`content/parts`), question ids and the engine semantics are frozen. State migration must be
additive: every existing `mark201.state.v1.*` key must load unchanged into the per-course state, and denarii,
owned items and equipped gear must carry into the profile. The keyboard flow (1-5 answer, Enter advances), the
settings toggles (sound, motion, briefings, night/day) and the art bible (`app/css/tokens.css`) stay.
