# Imperium — FIN 201 Midterm 2 content spec (for chapter writers and reviewers)

You are writing study content for ONE chapter of an adaptive, game-like exam trainer. The student is in
University of Alberta FIN 201 (Keith Godfrey), Midterm 2 on 3 November 2026, Ross *Fundamentals of Corporate
Finance* chapters 8–13. The exam is 1 hour, 100 marks: multiple choice at 4 marks (A–E, usually with "None of
the above") plus numeric-answer questions with answer boxes and units ("% per annum", "$", "years", "shares").
A formula sheet is provided (see `docs/FIN201_MT2_COURSE_MAP.md` §3 for what is on it). TI BA II Plus.

Correctness is non-negotiable. Every answer must be defensible from the course sources. Every number must be
recomputable: numeric questions carry a `check` expression that an independent solver evaluates.

## Inputs (read what your chapter needs; the course map first)
- `docs/FIN201_MT2_COURSE_MAP.md` — THE authority on scope, notation, rounding, archetypes (§4) and traps.
  Section numbers 8.1 … 13.3 in the map are your topics. Follow the professor where the textbook differs
  (e.g. g = b × ROE on start-of-year equity, Canadian CCA with the half-year rule, PV of CCA tax shield formula).
- `kb/fin201/textbook_chNN.txt` — Ross chapter text (US 12e: ignore MACRS/IRS; Canadian tax comes from the SM and lectures).
- `kb/fin201/RossFCF12ce_SM_ChNN_*.txt` — 12th Canadian edition solutions manual: the recommended problems and
  their worked answers (use their numbers to anchor difficulty and to write original look-alikes; never copy a problem verbatim).
- Lecture decks `kb/fin201/FIN_201_KG_04_Stocks.txt` (Ch 8), `..._05A_...` (Ch 9), `..._05B_...` (Ch 10),
  `..._05C_...` (Ch 11), `..._06_Risk_Return_Diversification.txt` (Ch 12–13); seminars `Seminar_4_Equity.txt`
  (Ch 8), `Seminar_5_...` and `Seminar_6_...` (Ch 9–10), `Seminar_7_Risk_and_Return.txt` (Ch 12–13).
- `kb/fin201/FIN_201_KG_Review_for_Second_Midterm_Exam.txt` (the professor's review prompts and terminology list)
  and `kb/fin201/mid_2_practice_examples.txt` (the sample exam; its 12 questions become `source: "official"`
  questions in the chapter they belong to, see the map §6 last rows).
- Out of scope, never ask: derivatives/options pricing (deck 07, seminars 8–10), capital structure, raising
  capital, bonds and TVM for their own sake (Midterm 1), chapters 24–25. TVM may appear only as a tool inside a chapter 8–13 question.

## Output files (write these, nothing else)
- `content/fin201/parts/chNN_meta.json` — object: `chapter`, `title`, `topics`, `concepts`, `activities`, `formulas`.
- `content/fin201/parts/chNN_q1.json`, `chNN_q2.json`, … — each a JSON ARRAY of at most 40 questions.
- Run `python tools/validate_fin201.py NN` from the project root and FIX every error until it prints `OK`
  (it also evaluates every `check` expression and compares it with `answer`).

Valid JSON only (no comments, no trailing commas). Straight quotes. Canadian spelling. NN is 08…13.
Chapter numbers, topic ids and concept ids are FIXED by the inventory at the end of this file: use them exactly.

## Schema

### meta
```json
{
  "chapter": 8,
  "title": "Stocks: equity valuation",
  "topics": [
    {"id": "t08-1", "order": 1, "title": "Returns on a stock", "summary": "2-4 plain sentences orienting a beginner.", "concepts": ["c08-hpr", "c08-arith-vs-geo", "c08-compound-value"]}
  ],
  "concepts": [
    {
      "id": "c08-gordon-growth",
      "topic": "t08-4",
      "term": "Gordon growth model",
      "definition": "Precise 1-2 sentence definition in the professor's notation (P0 = D1/(R − g)).",
      "explain": "Plain English, 2-4 sentences: what it means, when it applies, why it matters on the exam.",
      "example": "One worked mini-example with real numbers and the final answer (e.g. D0 = $2.00, g = 4%, R = 11% → D1 = 2.08, P0 = 2.08/0.07 = $29.71).",
      "contrast": "What it is confused with and exactly how to tell them apart (D0 vs D1; price at time t uses D_{t+1}).",
      "trap": "How the exam tricks you on this concept: cue words, sign conventions, timing.",
      "mnemonic": "Short memory hook or empty string.",
      "formula": "P0 = D1/(R − g); D1 = D0(1 + g)",
      "given": true,
      "archetypes": ["A2"],
      "weight": 3,
      "figure": null
    }
  ],
  "activities": [ ... same order / sort / match shapes as kb/CONTENT_SPEC.md, 3-6 per chapter ... ],
  "formulas": [
    {"id": "f08-gordon", "name": "Gordon growth price", "formula": "P0 = D1/(R − g)", "given": true, "concepts": ["c08-gordon-growth"], "when": "one sentence: when to use it", "trap": "one sentence"}
  ]
}
```
- `formula` (string or ""), `given` (true if printed on the exam formula sheet, false if it must be memorised),
  `archetypes` (list of map §4 ids like "A2", or []), `weight` (1 = minor, 2 = normal, 3 = heavily tested; follow
  map §7) are REQUIRED on every concept. `figure` as in the marketing spec (table/list) or null.
- `formulas`: every formula the chapter uses (map §3), each pointing at its concept(s). The app's Formula
  Vault lists them with Given / Memorise badges and a drill button.

### questions — common fields
```json
{"id": "q08-001", "concept": "c08-gordon-growth", "also": [], "type": "mc", "angle": "identify", "difficulty": 2,
 "stem": "...", "options": ["...", "...", "...", "..."], "answer": 1,
 "explanation": "Why right, why the tempting distractor is wrong.", "source": "generated", "ref": "SM 8-4"}
```
- `type`: `mc` (4–5 options), `tf` (`["True","False"]`), `fill` (stem has `_____`, 4 candidate terms),
  `numeric` (see below), `multistep` (see below).
- `angle`: `define`, `identify` (scenario → name the concept), `apply` (what to do / what follows),
  `contrast`, `not`, `why`, `calc` (any numeric computation, MC or numeric), `order`, plus two finance angles:
  `interpret` (a computed result is given; what does it mean / what decision follows — e.g. negative NPVGO,
  PI = 0.96, IRR < R with financing-type flows, stock above the SML), `formula` (formula drill: which formula,
  which variable, what a symbol means, what happens to the output when an input moves).
- `difficulty`: 1 recall, 2 typical exam, 3 multi-step or subtle. Mix about 25/50/25.
- `source`: `official` only for the 12 sample-exam questions (verbatim, cleaned); else `generated`.
- `ref`: short source tag you built it from (`SM 9-12`, `L04 s21`, `TB 10.5`, `S6 s8`, `REV p3`, `PRAC q4`). Required.
- MC distractors are MISCONCEPTION answers: the number you get with the classic error (D0 instead of D1,
  no half-year rule, dividing by σ_M instead of σ_M², forgetting ÷(1−T), arithmetic instead of geometric…) or
  the real confusable term. Never nonsense. "None of the above" allowed in at most 4 MC per chapter and it
  must sometimes be correct (the professor does that).

### numeric
```json
{"id": "q08-040", "concept": "c08-gordon-growth", "also": [], "type": "numeric", "angle": "calc", "difficulty": 2,
 "stem": "Northgate Rail just paid a dividend of $2.10 per share. Dividends grow at 4% per year and investors require 11% per annum. What is the share price today?",
 "answer": 31.20, "unit": "$", "tolerance": {"abs": 0.05},
 "check": "2.10*1.04/(0.11-0.04)",
 "steps": [
   {"label": "Next dividend D1", "value": 2.184, "check": "2.10*1.04", "unit": "$", "tolerance": {"abs": 0.005}},
   {"label": "Price P0 = D1/(R − g)", "value": 31.20, "check": "2.10*1.04/(0.11-0.04)", "unit": "$", "tolerance": {"abs": 0.05}}
 ],
 "solution": ["D1 = D0(1 + g) = 2.10 × 1.04 = 2.184", "P0 = D1/(R − g) = 2.184/(0.11 − 0.04) = 2.184/0.07 = $31.20"],
 "keystrokes": ["2.10 × 1.04 = 2.184", "÷ (0.11 − 0.04) = 31.20"],
 "errors": [
   {"id": "d0-for-d1", "label": "Used D0 instead of D1", "value": 30.00, "check": "2.10/(0.11-0.04)", "explain": "The dividend was just paid; the model needs next year's dividend D1 = D0(1 + g)."},
   {"id": "grew-twice", "label": "Grew the dividend twice", "value": 32.45, "check": "2.10*1.04*1.04/(0.11-0.04)", "explain": "D1 is one step of growth from D0, not two."},
   {"id": "r-plus-g", "label": "Added g to R", "value": 14.56, "check": "2.10*1.04/(0.11+0.04)", "explain": "The denominator is R minus g."}
 ],
 "explanation": "Gordon growth with the dividend just paid: grow it once, then divide by R − g.", "source": "generated", "ref": "SM 8-1"}
```
- `answer` is the number the student types (dollars to the cent, rates in PERCENT when `unit` is "%", years to
  2 decimals, shares as integers, ratios/multiples to 2 decimals). `unit` ∈ `$`, `%`, `years`, `shares`, `x`, `` (plain number).
- `check` is a plain arithmetic expression (numbers, + − * / ** ( ), and the functions `sqrt`, `ln`, `exp`,
  `max`, `min`, `abs`) that evaluates to `answer` in the same unit (so a rate in % needs `*100` in the check).
  The validator evaluates it and fails if it is outside `tolerance` of `answer`.
- `tolerance`: `{"abs": x}` and/or `{"rel": r}`; use abs 0.01–0.05 for dollars, 0.01–0.05 for percent, 0.01
  for years and ratios. The app shows the tolerance ("within $0.05").
- `steps`: the intermediate values in order, each with its own `check` (REQUIRED for anything with two or more
  computational steps; a single-step question may have one step). `multistep` questions are the same object with
  `"type": "multistep"`: the student enters every step; `numeric` asks for the final answer and only falls back to
  the steps after a wrong answer.
- `solution`: the full worked solution as lines (formula → numbers → result), in the professor's notation and rounding.
- `keystrokes`: TI BA II Plus keystrokes (plain arithmetic, or the CF/NPV/IRR worksheet: "CF0 = −165000, C01 = 63120, F01 = 1 …, NPV I = 12, CPT").
- `errors`: the ERROR LIBRARY for this question: 2–5 classic mistakes with the number each one produces and a
  one-sentence explanation. Error ids are shared across the course (see list below) so the app can track a
  student's weak skills. Every `errors[].value` must have a `check` too.

Shared error ids (use these; add a new kebab-case id only when none fits):
`d0-for-d1`, `grew-twice`, `r-plus-g`, `g-as-r`, `horizon-off-by-one`, `horizon-wrong-g`, `omitted-dividend`,
`payout-as-plowback`, `roe-end-equity`, `eps0-for-eps1`, `trailing-forward-mix`, `interest-in-fcf`,
`npat-in-fcf`, `missing-delta-debt`, `arith-for-geo`, `geo-no-root`, `forgot-minus-one`, `div-by-p1`,
`sign-cf0`, `cf0-as-period-1`, `irr-direction`, `picked-higher-irr`, `pi-zero-based`, `payback-after-recovery`,
`arr-divide-i0`, `arr-cash-not-profit`, `raw-npv-unequal-lives`, `wrong-n-annuity`, `taxed-capex`,
`taxed-nwc`, `counted-sunk`, `forgot-nwc-recovery`, `missing-half-year`, `half-year-every-year`,
`straight-line-cca`, `forgot-times-t`, `k-minus-d`, `wrong-first-year-factor`, `salvage-not-discounted`,
`ucc-for-salvage`, `dropped-salvage-term`, `kept-salvage-term`, `recapture-full-pod`, `forgot-half-gain`,
`terminal-loss-sign`, `pod-minus-acb`, `forgot-untax`, `divided-by-n`, `missing-cca-shield`, `scenario-direction`,
`profit-not-npv-breakeven`, `d-in-cash-breakeven`, `ocf-in-accounting-breakeven`, `fc-plus-d-dol`,
`averaged-before-deciding`, `discounted-twice`, `n-minus-1-with-probs`, `n-with-sample`, `no-correlation`,
`pct-decimal-mix`, `no-square-root`, `cov-as-rho`, `rho-one-shortcut`, `weights-not-one`, `beta-sigma-m`,
`beta-sigma-i`, `mrp-as-market`, `forgot-minus-rf`, `alpha-sign`, `forgot-rf-weight`, `sharpe-with-beta`,
`cml-on-single-stock`, `nominal-real-mix`, `arithmetic`, `early-rounding`, `annual-periodic`, `units`.

### Volume and coverage (the validator enforces)
- Every concept: at least 12 questions where it is the primary `concept`, spanning at least 5 angles,
  including `identify`, one of `contrast`/`not`, one `why` or `interpret`, and, for every concept whose
  `archetypes` list is non-empty, at least 3 `numeric`/`multistep` questions and at least 2 MC `calc`
  questions whose distractors are error-library numbers.
- Chapter totals: Ch 8 ≥ 330, Ch 9 ≥ 220, Ch 10 ≥ 260, Ch 11 ≥ 150, Ch 12 ≥ 160, Ch 13 ≥ 140 questions.
  Weight-3 concepts should get ~1.5× the questions of weight-1 concepts.
- All sample-exam questions that belong to the chapter present as `source: "official"` (map §6: q1→8.3, q2→8.2,
  q3→8.8, q4→8.6, q9→8.2/8.6, q5→9.6, q10→9.1+9.3, q6→10.3, q11→10.1+10.5, q7→12.3, q8→12.3, q12→13.3).
  Numeric sample questions become `numeric` questions with full steps/solution/errors.
- 3–6 activities per chapter (order: the steps of an archetype, e.g. non-constant growth; sort: five tax
  categories, given vs memorised formulas, systematic vs unsystematic events; match: term ↔ formula or symbol ↔ meaning).

### Quality rules (non-negotiable)
1. One defensible correct answer. Recompute every number. Carry intermediate values unrounded; round only the
   displayed result the way the professor does (rates to 2–4 decimals in %, dollars to the cent, years to 2–3 decimals).
2. Professor's notation and conventions: R for the discount rate, g growth, b plowback, D1 next dividend,
   T or T_C tax rate, d CCA rate, k discount rate in the PVCCA formula, UCC/ACB/POD, half-year rule unless the
   question says AII (1.5×) or 100%; "just paid" means D0, "will pay next year" means D1; "% per annum".
3. Stems: realistic Canadian firms (invented names), numbers that produce clean but not trivially round
   answers, every input the student needs and nothing misleading. ≤ 90 words. State the unit the student answers in.
4. Explanations teach: name the rule, show the arithmetic, and say why the top distractor fails (never positional
   references like "option A").
5. Conceptual questions test the professor's words (map §5): forms of efficiency and which we want, when to use
   comparables vs DDM vs FCFF vs FCFE, five decision rules and their pros/cons, five tax categories, positive ΔNWC
   examples, why the CCA shield is a shield, sensitivity vs scenario vs simulation vs NPV break-even, σ vs β,
   how σ/ρ/β guide portfolio building, why betas differ between providers.
6. No copyrighted prose beyond short definitions. No URLs. Numbers in `tf` statements must be exact.
7. Vary where the right answer sits. Options similar in length and form.

## Concept inventory (FIXED ids; terms may be refined but every id must exist)

Ch 08 (6 topics would be too few: use t08-1 … t08-8 exactly as below)
- t08-1 Returns on a stock: `c08-hpr`, `c08-arith-vs-geo`, `c08-compound-value`
- t08-2 Valuation vocabulary: `c08-book-market-liquidation`, `c08-quote-screen`, `c08-debt-vs-equity`, `c08-markets-trading`, `c08-preferred-stock`
- t08-3 Comparables: `c08-pe-comparables`, `c08-ev-multiples`, `c08-why-comparables`
- t08-4 Dividend discount model: `c08-constant-dividend`, `c08-gordon-growth`, `c08-required-return-components`, `c08-growing-annuity`
- t08-5 Non-constant growth: `c08-nonconstant-timeline`, `c08-two-stage`, `c08-solve-backwards`
- t08-6 Where growth comes from: `c08-plowback-growth`, `c08-forward-pe`, `c08-npvgo`, `c08-implied-growth`
- t08-7 Free cash flow valuation: `c08-fcf-ev`, `c08-fcfe`, `c08-working-capital`, `c08-which-model`
- t08-8 Market efficiency: `c08-efficiency-forms`, `c08-inefficiency-profit`, `c08-noise-behaviour`

Ch 09
- t09-1 Accounting rate of return: `c09-arr`
- t09-2 Payback: `c09-payback`, `c09-discounted-payback`
- t09-3 Net present value: `c09-npv-rule`, `c09-npv-steps`
- t09-4 Internal rate of return: `c09-irr-rule`, `c09-npv-profile`, `c09-multiple-irr`, `c09-financing-flows`, `c09-ranking-conflict`, `c09-crossover`, `c09-mirr`
- t09-5 Profitability index: `c09-pi`, `c09-pi-vs-npv`
- t09-6 Project relationships and rationing: `c09-project-relationships`, `c09-capital-rationing`
- t09-7 Unequal lives: `c09-eav`, `c09-ccr-lcm`

Ch 10
- t10-1 Relevant cash flows: `c10-incremental`, `c10-sunk-opportunity`, `c10-side-effects-financing`, `c10-five-categories`
- t10-2 Operating cash flow: `c10-ocf`
- t10-3 Net working capital: `c10-nwc`
- t10-4 CCA and the tax shield: `c10-cca-schedule`, `c10-half-year-aii`, `c10-dts`, `c10-pvcca`, `c10-net-acquisitions`
- t10-5 Disposal of assets: `c10-recapture-terminal-loss`, `c10-capital-gain-cfat`, `c10-pool-open-closed`
- t10-6 Assembling an NPV: `c10-expansion-npv`, `c10-replacement-npv`, `c10-cost-cutting`, `c10-bid-price`, `c10-timing-of-sale`
- t10-7 EAC with taxes, nominal vs real: `c10-eac-taxes`, `c10-nominal-real`

Ch 11
- t11-1 Forecasting risk and what-if: `c11-forecasting-risk`, `c11-sensitivity`, `c11-scenario`, `c11-simulation`, `c11-npv-breakeven`
- t11-2 Break-even and leverage: `c11-cash-breakeven`, `c11-accounting-breakeven`, `c11-financial-breakeven`, `c11-dol`
- t11-3 Real options: `c11-real-options`, `c11-decision-trees`, `c11-abandonment-expansion`

Ch 12
- t12-1 Risk and reward: `c12-required-return-cost-of-capital`, `c12-risk-aversion-premium`, `c12-history-lessons`
- t12-2 Measuring return and risk: `c12-expected-return-states`, `c12-variance-states`, `c12-historical-sd`, `c12-normal-distribution`, `c12-risk-return-diagram`
- t12-3 Two-stock portfolios: `c12-portfolio-weights-return`, `c12-portfolio-sd`, `c12-covariance-correlation`, `c12-diversification-benefit`, `c12-diversification-limit`

Ch 13
- t13-1 Adding the risk-free asset: `c13-risk-free-cal`, `c13-sharpe-cml`, `c13-market-portfolio`
- t13-2 Systematic risk and beta: `c13-systematic-unsystematic`, `c13-beta`, `c13-portfolio-beta`
- t13-3 CAPM and the SML: `c13-capm`, `c13-sml-alpha`, `c13-sigma-vs-beta`, `c13-portfolio-building`, `c13-cost-of-capital-link`

Archetype tags per concept (from the map §4; a concept with any tag needs numeric questions):
A1 → c08-hpr, c08-arith-vs-geo, c08-compound-value · A2 → c08-constant-dividend, c08-gordon-growth,
c08-required-return-components, c08-growing-annuity · A3 → c08-nonconstant-timeline, c08-two-stage,
c08-solve-backwards · A4 → c08-plowback-growth, c08-forward-pe · A5 → c08-npvgo · A6 → c08-quote-screen,
c08-implied-growth · A7 → c08-pe-comparables, c08-ev-multiples · A8 → c08-fcf-ev, c08-fcfe, c08-working-capital ·
A9 → c09-arr, c09-payback, c09-discounted-payback · A10 → c09-npv-rule, c09-irr-rule, c09-pi ·
A11 → c09-ranking-conflict, c09-crossover, c09-pi-vs-npv · A12 → c09-multiple-irr, c09-financing-flows, c09-npv-profile ·
A13 → c09-eav, c09-ccr-lcm, c10-eac-taxes · A14 → c10-five-categories, c10-incremental, c10-sunk-opportunity, c10-ocf, c10-nwc ·
A15 → c10-recapture-terminal-loss, c10-capital-gain-cfat, c10-pool-open-closed · A16 → c10-cca-schedule, c10-half-year-aii, c10-dts ·
A17 → c10-pvcca, c10-net-acquisitions · A18 → c10-expansion-npv, c10-replacement-npv, c10-timing-of-sale ·
A19 → c10-cost-cutting, c10-bid-price · A20 → c11-sensitivity, c11-scenario, c11-npv-breakeven ·
A21 → c11-cash-breakeven, c11-accounting-breakeven, c11-financial-breakeven, c11-dol · A22 → c11-decision-trees, c11-abandonment-expansion ·
A23 → c12-expected-return-states, c12-variance-states · A24 → c12-historical-sd, c12-risk-aversion-premium, c12-normal-distribution ·
A25 → c12-portfolio-weights-return, c12-portfolio-sd · A26 → c12-covariance-correlation, c13-beta ·
A27 → c13-capm, c13-sml-alpha, c13-cost-of-capital-link · A28 → c13-portfolio-beta · A29 → c13-risk-free-cal, c13-sharpe-cml ·
A10/A13 also → c10-nominal-real (nominal vs real discounting). Concepts not listed have `"archetypes": []`.
