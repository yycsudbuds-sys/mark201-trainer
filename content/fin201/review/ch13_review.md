# Chapter 13 review: CML, Sharpe ratio, CAPM and the SML

Reviewed against kb/FIN201_REVIEW_SPEC.md: all 11 concept cards, 5 activities and 13 formulas in `ch13_meta.json`, and
all 215 questions in `ch13_q1.json`, `ch13_q2.json`, `ch13_q3.json`, `ch13_q10.json` to `ch13_q13.json` (the chapter
has 7 question files, not 13). Every numeric answer, step and error-library value was recomputed by hand and by script
(44 numeric/multistep). Sources: L06 s38-59, S7 s14-24, SM 13-13..33 and App A1, TB 13.3-13.8, PRAC q12, REV p3.

No keyed answer was wrong. The fixes are about unlabelled textbook data, wording that is not quite true, references to
option positions, shared givens, tolerances, and answer lengths that give the key away.

## Changes

| id | issue | fix |
|---|---|---|
| meta c13-systematic-unsystematic | Example quoted Table 13.7 σ figures (49/24/20/19%) as fact, not labelled as textbook data | Labelled as the textbook's NYSE study (Table 13.7) and tied it to the lecture's σ_P → σ_M picture |
| meta c13-market-portfolio | Example and trap said the highest-Sharpe candidate is "closest to M". A higher Sharpe ratio does not mean a smaller distance along the frontier | Reworded: best candidate to mix with R_F; M's Sharpe is at least that high |
| q13-017 | Error explain for σ² read "the variance has already been squared"; explanation did not deal with the β red herring | Explain reworded; explanation now shows the arithmetic and why dividing by β (5.84) is wrong |
| q13-020 | Step asked for the Sharpe ratio to 4 decimals (0.4375, tol 0.0005). The 2-decimal entry 0.44 then gives σ = 12.50, outside tolerance | Steps rebuilt: target premium 5.5%, w_M = 78.57%, σ = 12.57%. Same answer; slope mentioned in the solution |
| q13-021 | Explanation said "the last option" | Replaced with the content of that option |
| q13-026 | Said omitting R_F "breaks the units" (it does not) | Each wrong formula now gets its real reason |
| q13-037 | Key said the 0.61 portfolio is "the closest of the three to M" (not implied by Sharpe ratios) | Key now says it offers the steepest CAL of the three; explanation also rejects the proxy distractor |
| q13-055 | Table 13.7 σ-versus-N figures were not on the slides and not labelled | Stem now says "the textbook's classic study of randomly chosen NYSE stocks (Table 13.7)". Figures checked: 49.24, 23.93, 19.69, 19.21 |
| q13-059 | Used the textbook decomposition R = E(R) + m + ε without saying so | Stem now explains the split (expected + systematic surprise + unsystematic surprise). Answer 5.50% unchanged |
| q13-072 | Hyphen minus signs in explanation (-1.50, -0.60, -0.24) | Changed to proper minus signs |
| q13-084 | Weight steps had tolerance ±1 percentage point (6.8% would accept 7.8%) | Tolerance changed to ±0.05 |
| q13-089 | "her own $75,000" for a firm (Orchard Capital) | "its own" |
| q13-403 | Called the 1.57 error "absurd" | "inflates beta to 1.57" |
| q13-419 | Explanation said "the first alternative" | Named the expression R_F + β × (6% − R_F) instead |
| q13-423 | Explanation said "the first alternative … the second" | Named the two expressions instead |
| q13-426, q13-430, q13-526, q13-707, q13-762, q13-764, q13-765 | Keyed option much longer than the distractors (gave the key away) | Shortened the key |
| q13-428, q13-517, q13-606, q13-705, q13-708, q13-763 | Same length problem | Distractors and key rewritten to similar length (same misconceptions) |
| q13-610 | Error label "Ranked by σ instead of β" did not describe the −1.15 computation | Label: "Plugged each σ (as a decimal) into CAPM in place of β" |
| q13-612 | Implied betas need CAPM to hold, but the stem did not say so; key was the longest option | Added "Assume CAPM holds."; key shortened to "its implied β is 1.42 versus 1.08" |
| q13-752 | Numeric question used the same givens as q13-751 (β 1.35, R_F 3.2%, MRP 5.8%) | New givens β 1.40, R_F 3.4%, MRP 5.5% → k = 11.10%, AF 3.6866, NPV −$8,112.82; errors recomputed (8.35%: +26,386.95; 5.5%: +66,596.41; 6.34%: +54,231.81); IRR ≈ 10.42% |
| q13-753 | Answer tolerance $0.01 but step tolerance $0.05 | Answer tolerance set to $0.05 |
| q13-754 | Error "Used the firm's overall beta of 1.00", but the stem gives no firm-wide beta | Relabelled: the market's own 9.0% (β = 1) used as a one-size-fits-all hurdle |
| q13-757 | Explanation said a 9% firm-wide hurdle gives "B and C only", but A's IRR was exactly 9.0% (a tie) | A's IRR changed to 8.5%; key (A and B) and hurdles unchanged |

## Checked and left alone

- **q13-401 (PRAC q12):** verbatim sample-exam wording kept. 4.5 + 0.8 × (10 − 4.5) = 8.9%. Errors 12.5 / 4.4 / 8.0 checked.
- **q13-609:** β = 0.35 × 38/16 = 0.83125, so E[R] = 8.4875%, keyed as 8.49 with tolerance ±0.01. Rounding β to 0.83 gives 8.48, which is still accepted. The solution line points this out.
- **q13-711:** the exact difference is 5.6152, keyed as 5.62. Using the rounded σ's (28.85 − 23.24) gives 5.61, which is inside the ±0.01 tolerance. The solution line points this out.
- **q13-069:** the regression intercept is called α, following S7 s14 (R = α + βR_M + ε). This is not the CAPM alpha used elsewhere, but the meta card already contrasts the two.
- **q13-411/q13-412** share givens (β 0.85, 3.5%, 6%) on purpose: one gives the premium and the other the market return. Both are MC, so the rule against shared numeric givens does not apply.
- **q13-505/q13-755** both ask for a break-even β with R_F 3.0% and MRP 6.5%, but the expected returns differ (10.4% and 10.1%), so the givens are not identical.
- **q13-073/q13-618** overlap (β vs ρ bounds), but each sits under a different concept with a different focus.
- **Formula flags:** `given` matches map §3: CAPM, Sharpe ratio and the CAL mix (from the printed E[R_P]/σ_P formulas) are given; β, portfolio β, CML, alpha and reward-to-risk must be memorised.
- **"None of the above":** no chapter 13 MC uses it. The spec allows up to 4, so this is within the rules. No option was added, to avoid creating a second defensible answer.
- **Market risk premium vs market return:** checked the wording in every CAPM, SML and project stem. Each one says clearly which of the two it gives, and every distractor uses the matching mrp-as-market or forgot-minus-rf error.
- **Alpha sign:** expected minus SML return everywhere; positive means above the SML and undervalued.
- **Units:** returns are in %, betas and Sharpe ratios are plain numbers to 2 decimals. Covariance and variance steps are in decimals and labelled as such.
- **MC calc distractors:** all 23 MC calc questions use misconception numbers, and each one was recomputed.

## Final counts

- 11 concepts, 3 topics, 5 activities, 13 formulas.
- 215 questions: 1 official, 44 numeric/multistep. Difficulty 22% / 53% / 23%.
- Angles: apply 16, calc 67, contrast 20, define 18, formula 17, identify 27, interpret 16, not 11, order 4, why 19.
- Questions edited: 32. Meta fields edited: 3. Deleted: 0.
- `python tools/validate_fin201.py 13`: OK.
- `python tools/verify_fin201.py 3`: every chapter 13 generator passes and the static numeric check passes. The 9 scope failures are all in other chapters (ch08, ch09, ch12) and were there before this review.
