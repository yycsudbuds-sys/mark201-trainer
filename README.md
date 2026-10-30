# Imperium · MARK 201 and FIN 201

A Roman-conquest-themed, adaptive exam trainer with two course campaigns: **MARK 201** (Introduction to Marketing midterm, Chapters 1, 6–12 of *Marketing: The Core*) and **FIN 201 Midterm 2** (Ross *Fundamentals of Corporate Finance* Chapters 8–13: stocks, capital budgeting, project analysis, risk and return, CAPM). Static site on GitHub Pages; one username (no password) carries XP, coins, gear and every course campaign across devices through a small Supabase profile database.

**Live:** https://yycsudbuds-sys.github.io/mark201-trainer/

## The two courses

- **The Forum** (first screen after the gate): one card per course with readiness, mastery, days to the exam and today's orders; a leaderboard (total XP, XP this week, readiness per course); daily orders; the shop.
- **MARK 201**: 230 concepts, 1,308 questions, 47 activities, eight provinces from Italia to Aegyptus. Works exactly as before the expansion.
- **FIN 201 Midterm 2**: 104 concepts, ~1,700 questions of which ~380 are typed-answer (numeric and step-by-step) plus 71 seeded number generators, one card per concept, a Formula Vault (given vs memorise), six provinces of the eastern campaign (Illyricum to Syria). Typed answers accept $, commas and %, are graded within a stated tolerance, diagnose classic mistakes from an error library, can be broken into steps, and show the professor's worked solution and TI BA II Plus keystrokes. Diagnosed errors become "Weak skills" on the Progress page.
- Both courses: drill filters (Unknown / Weak / All, chapters, topics), siege retry on missed concepts only, cloud profiles.
- Content pipeline and verification: `kb/FIN201_CONTENT_SPEC.md`, `tools/validate_fin201.py`, `tools/verify_fin201.py` (independent solver recomputes every answer and generator), `docs/FIN201_MT2_COURSE_MAP.md`.

## What it does

- **230 concepts, ~1,300 questions, 47 activities**, written from the course slides and the instructor's posted practice questions. Every concept is tested from several angles: definition, scenario, apply, tell-apart, exception, why/when, calculate, sequence.
- **Mastery model.** A concept is *Solid* after 3 correct answers from 2+ angles with the last 2 in a row right. It is *Mastered* only after 4 correct answers from 3+ angles, the last 3 in a row, no open pursuit, and at least one correct answer in a later study session (45+ minutes apart). That spacing rule comes from the successive-relearning research: one correct recall in each of several spaced sessions beats many recalls in one sitting.
- **Pursuit.** Any wrong answer opens a pursuit: the engine schedules three more questions on that concept from different angles, a few questions apart. A miss during a pursuit resets it.
- **Spaced review.** Each correct answer pushes a concept further out (10 min, 1 h, 4 h, 12 h, 36 h). Due concepts float to the top of Smart Drill.
- **Conquest campaign.** A parchment map of the Roman world: eight provinces (chapters, labelled “Chapter I · Italia” through “Chapter XII · Aegyptus”) with explicit Locked / Open / Conquered states. Each province has a road of battles (topics); a battle is a slide lesson (definition, plain English, interactive diagram, confusables, quick check) followed by a checkpoint. Standards plant as checkpoints clear, and a 90% siege of the capital conquers the province. Locked provinces can be force-marched if you insist.
- **War briefings.** Before every lesson, battle, siege, field drill and great battle, a Legatus briefs you in a torch-lit tent (flickering torches, sweeping shadows, typewriter dialogue, skippable, toggle in the Quartermaster). The briefing is generated from the real topic: its concepts, the ones you have faltered on, and the confusables to watch.
- **Stylized-realism art layer.** A procedural SVG scene library (`app/scenes.js`) draws eight province landscapes (Britannia's misted hills, Gallia's night pines, Graecia's marble temple over the Aegean, Aegyptus at dusk, and so on) plus a candle-lit library, a Colosseum with crowd silhouettes and dust, and a chariot track with speed streaks. Scenes are heavily blurred static layers with a separate ambient layer for mist, motes, flames and streaks. Lessons read on a parchment scroll with wooden rollers and torn edges, over the current province. Flashcards sit in the library, the Gladiator Duel in the Colosseum, Skirmish on the race track, and everything else on the battlefield.
- **Organic UI.** Ribbon-banner primary buttons, chipped stone secondary buttons, bronze plaque chips, wax-seal toasts, parchment modals, iron-trimmed wooden shields for the mode picker, chipped-tablet question cards behind dark glass, and iron answer buttons whose wax-seal numerals glow on hover and crack when wrong. Key marketing terms in questions carry tiny vector icons (coin for price, ship for distribution, amphora for product, horn for promotion, seal for brand, target for segmentation).
- **Living battlefield.** Every quiz runs over an animated battlefield behind a dark glass panel. A correct answer advances the legion and raises the vexillum; a wrong one locks the shield wall and gives ground. It is pure CSS transform work, so it never pauses or delays the quiz.
- **Lessons are slides, not walls of text.** Every concept is chunked into short slides with ~20 bespoke interactive diagrams (PLC curve, adoption bell, break-even with a price slider, markup two ways, elasticity demo, channel flows, contact math, communication process, push/pull, funnel, matrices, continuums) plus tap-to-reveal tables for every memorization figure.
- **Modes:** Conquest (above), Field Drill (adaptive, interleaved), Weak Flank, the Great Battle (timed midterm simulation, deferred feedback, debrief, retake lost ground), Skirmish (blitz), Gladiator Duel (confusables), Siege Works (order / sort / match), Scrolls (flashcards), Archives (lessons + tablets), Senate (progress: Test Readiness, the Armoury, weakest strongholds, angle accuracy, honours).
- **What the theme did not touch:** the XP progression and level thresholds, the Test Readiness formula, the mastery/pursuit/spacing engine, and every lesson, question, answer and explanation.
- **Multiple players.** Progress lives in `localStorage`, so each browser is independent. Several people can share one computer via profiles. Export/import for backups.
- Works offline after the first load (service worker).

## Study method behind the design

Practice testing and distributed practice are the two techniques with the strongest evidence (Dunlosky et al., 2013). Interleaving helps once the basics are in, which is why the Campaign is blocked by topic and Smart Drill is interleaved across chapters. Rereading alone is weak, so every Learn card is followed immediately by retrieval. Sleep matters; the two-day plan on the home page says so.

## Project layout

```
index.html, sw.js        app shell and service worker
app/                     ES modules: engine, store (profiles) + sync (Supabase), account, views, game layer
app/courses/<id>/        course packs: pack.js (geography, scenes, commanders, exam settings), data.js (generated bundle)
app/config.js            Supabase URL + public anon key
content/, content/fin201 chapter content (parts = source of truth, chNN.json = merged, review = verification logs)
kb/                      ground-truth sources and the content/review specs
docs/                    ARCHITECTURE.md, FIN201_MT2_COURSE_MAP.md
tools/                   validate*.py, build*.py, verify_fin201.py, test suites (see docs/ARCHITECTURE.md §9)
```

## Develop

```
python tools/validate.py 07      # validate + merge one chapter's parts
python tools/build.py            # bundle content -> app/data.js
python -m http.server 8791       # then open http://127.0.0.1:8791/
python tools/smoke_test.py http://127.0.0.1:8791/ tools/shots   # Playwright smoke test
```

No build step is required for the site itself; it is plain HTML, CSS and JavaScript modules.
