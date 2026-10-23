# Imperium UI rebuild — plan

Engine, content, state shape and routes are frozen. Everything below is presentation, motion, sound and the cosmetic game layer. Each phase ships green on `main` with a tag.

## Phase 0 — foundations (tag `ui-phase-0`)
- `app/css/tokens.css`: the Imperium art bible as CSS custom properties (materials, light, shape, motion, type). Legacy variables keep their values so nothing shifts yet.
- Four stylesheets merged into `app/css/{tokens,base,components,scenes,modes}.css` with cascade order preserved (styles → game → roman → fidelity within each layer). Behaviour-neutral.
- `app/icons.js`: one hand-drawn inline SVG set (aquila, laurel, gladius, scutum, pilum, galea, scroll, tablet, amphora, column, coin, ballista, siege tower, standard, trireme, brazier, sundial, temple, crossed swords, lock, shield crack and friends). Same stroke, bronze fill, top-left light.
- `app/audio.js`: WebAudio synthesis engine with a sample manifest (drop CC0 files into `app/audio/` later, synthesis is the fallback), master volume + mute persisted under `mark201.cosmetic.v1`, unlock on first gesture, per-scene ambience, all gated by the Sound toggle.
- Fonts: only Cinzel + EB Garamond.

## Phase 1 — section 3 fixes, panels, tablets, seals, scenes, sound (tag `ui-phase-1`)
- World map: provinces clipped to the coastline, two-line labels with a separate status badge, standards ring instead of ticks, curved roads over land, responsive cartouche, zoom transition into a province.
- Province view: drawn castra, full battle names, no collisions, no ghost label.
- Battle: front line always visible in a reserved band, silhouette legion, +XP coin flight above the card, toasts moved off the answers, tablet answer cards, feedback seals with no page jump, keyword glyphs removed (one concept icon in the header).
- SceneDirector: one persistent crossfading layer with a scene for every route; pauses when hidden; still image when motion is off; day/night variants.
- Siege Works copy/drag mismatch fixed; stone blocks and carts. Archives tablet unrolled into sections. Emojis replaced by icons. Legatus redrawn. All sounds wired, volume + mute in the top bar.

## Phase 2 — cinematic battle and siege (tag `ui-phase-2`)
- Canvas sprite battlefield with provincial enemies, pila volleys, testudo at 3, cavalry at 5, pursuit flags, wall-integrity siege with ballista, named commanders with taunts, triumph.

## Phase 3 — 3D war table (tag `ui-phase-3`)
- Lazy-loaded Three.js table with real coastlines, relief, sea shader, roads, forts, CSS2D labels with collision pass, camera dolly on province select; 2.5D SVG fallback.

## Phase 4 — interactive question types, game layer, Castra (tags `ui-phase-4a/4b/4c`)
- Tablets/thumb/wax slots/arch/carts/rope/abacus; vignettes; denarii, rank ceremony, legion parade ground, daily orders, flame, clepsydra, fury, medals, triumph, crowd favour, battle report; Castra rebuild.

## Pre-commit checklist (every phase)
a. No console errors on any route. b. Saved progress loads unchanged. c. A full battle plays start to finish by keyboard. d. Export/Import round-trip. e. Sound off and motion off are honoured. f. Nothing overlaps or truncates at 1440×900, 1024×768, 390×844. g. ~60 fps on battle and map. h. Home first paint under ~1.5 s.
