# Chapter 11 review: Project analysis and real options

Reviewed against kb/FIN201_REVIEW_SPEC.md: all 12 concept cards, 3 topics, 5 activities and 19 formulas in
`ch11_meta.json`, and all 212 questions in `ch11_q1.json`, `ch11_q2.json`, `ch11_q3.json`, `ch11_q10.json` to
`ch11_q13.json` (the chapter has 7 question files). Every numeric answer, step, error-library value, MC calc option
and concept-card example was recomputed by an independent script and by hand (44 numeric/multistep, 22 MC calc).
Sources: L05C s1-16, SM 11 (CTQ 1-12, Q&P 1-29), TB 11.1-11.5, REV p1-3, course map §1-§5.

No keyed answer in the question files was wrong and no key index changed. The one real error was in a concept card:
the freeway-bridges decision tree reached the opposite decision to the lecture. The other fixes are two
non-misconception distractors, two stems that did not say their values sit at t = 1, explanation figures off by a
few dollars, positional or cross-question references, and keys much longer than their distractors.

## Changes

| id | issue | fix |
|---|---|---|
| meta c11-decision-trees | Freeway example priced "widen after short bridges" at 20 + 40 = 60 (demolish + surface) with no new bridges, so short bridges won (168 vs 192). That leaves the road without bridges and contradicts the lecture's point (slide 13: pay more now to save later, "if yes is trivial...") | Re-derived from slide 15: widening after short bridges = demolish 20 + long bridges 160 + surface 40 = 220 > 150, so do not widen (270 busy, 120 quiet; E = 240). Long: widen for 40 (200 busy, 160 quiet; E = 192). Build long bridges; the 40 premium buys 0.8 × 110 = 88. The slides leave the tree "in class", so the card states the assumption. No question uses these numbers |
| meta c11-npv-breakeven | `given: true`, but the card's formula (EBITDA* = [I0 − PV(DTS)] ÷ [(1 − T) × AF]) is not on the formula sheet. Only its building blocks are (NPV, annuity, perpetuity, PVCCA). Formula f11-npv-be was already `given: false` | `given` set to false |
| meta c11-scenario | "NPV = $-595,050.13" | "−$595,050.13" |
| meta a11-03 | Matched "Option premium" to "like a car insurance policy", but the policy is the option, not the premium | "like the premium on a car insurance policy" |
| q11-414 | Distractor 25,500 (FC ÷ the price change) was not a misconception, and the explanation called it "nonsense" | Replaced with 4,588: cutting 6,000 by the 23.5% rise in the margin, which treats Q_C as linear in the margin. option_checks/option_errors updated and explanation rewritten |
| q11-432 | Distractor "Q_A rises by 625 units" had no derivation | Replaced with "Q_A falls by 4,000 units", a sign slip (thinking extra depreciation helps). Explanation notes why the change is a rise |
| q11-524 | Did not say clearly that 7.6 / 1.8 / 2.9 are values at t = 1 that must be discounted once (the date of the $2.9M sale was implicit) | Stem now says all three values are measured at t = 1 and are discounted once, together with the $1.1M. Answer 1.47 unchanged |
| q11-525 | Same issue for the $9.4M added value and the $3.0M cost | Stem now says these are t = 1 values to discount once. Answer 1.98 unchanged |
| q11-445 | Explanation said OCF* = $343,282 (correct: 1,900,000/5.534819 = 343,281.32) | Corrected. Key 18,665 unchanged |
| q11-446 | Explanation said OCF* = 780,000/3.7845 = $206,110 (correct: /3.784483 = 206,104.79) | Corrected to $206,105. Q_F = 30,965.63, so "None of the above" is still the key |
| q11-528 | Explanation said 96 × 5.7590 = $552.86 (correct: 552.87) | Corrected. Key 4,341 unchanged |
| q11-507 | Option "$-0.12 million" | "−$0.12 million" |
| q11-015, q11-022, q11-041, q11-047, q11-049, q11-052 | Hyphen used as the minus sign before $ | Changed to proper minus signs |
| q11-407 | Explanation said "in the last option" | Named the statement instead |
| q11-510 | Explanation quoted the internal error id 'averaged-before-deciding' | Plain words |
| q11-535 | Explanation relied on numbers from another question ("128 × Q × annuity factor = 1,900,000 was solved") | Gives the inputs ($128 a unit, 12 years, 11%, $1.9M) |
| q11-025, q11-530 | Credited solutions-manual results to "the textbook" / "the text" | "solutions manual" |
| q11-034 | "dividing by the quantity gives $5.48" was ambiguous | "dividing the NPV change by the new quantity gives $5.48" |
| q11-490 | Key carried the car-insurance example and was twice the length of the distractors | Key shortened; example moved into the explanation |
| q11-011, q11-408, q11-410, q11-412, q11-427, q11-429, q11-430, q11-435, q11-447, q11-448, q11-449, q11-453, q11-468, q11-470, q11-471, q11-481, q11-486, q11-489, q11-498, q11-509, q11-511, q11-513, q11-530, q11-532, q11-535, q11-538 | Keyed option much longer than the distractors (1.6 to 2.7 times), which gave the key away | Key shortened, same content |
| q11-059, q11-071, q11-494, q11-512 | Same length problem | Key shortened and the shortest distractors lengthened (same misconceptions) |

## Checked and left alone

- **Taxed break-even formula.** q11-083, q11-087, q11-089, q11-406, q11-426, q11-443, the c11-financial-breakeven card
  and f11-qf-tax use Q = {FC + (OCF − T·D)/(1 − T)}/(P − v). SM 11-24b (and SM 11-28's Q_F) print
  [FC + (OCF − T·D)]/(P − v) without the ÷(1 − T). That contradicts the SM's own derivation in 11-24a and its 11-28
  cash break-even. The professor's form (course map row 27) is algebraically right and is kept. The SM's form is the
  `forgot-untax` error value (q11-089: 13,614 units; q11-443: 9,511.86 units).
- **q11-446 "None of the above" is the key.** Recomputed Q_F = 30,965.63. The three listed figures are AF × I0
  (269,730), the accounting Q (24,348) and the cash Q (13,043), so none is correct. This is the chapter's only NOTA
  (spec: at most 4, and it must sometimes be correct).
- **q11-524 and q11-525 discount once.** Both are now explicit that the values are at t = 1. q11-503, q11-505,
  q11-523 and q11-526 state that their values are present values (no discounting), which matches L05C s15-16.
- **Abandonment threshold (q11-522, q11-528).** Following SM 11-20, the remaining years are valued as an annuity at
  the end of year 1 (N = remaining years). The SM's own example uses PVIFA(14%, 15) for 16 − 1.
- **Extra keys option_checks / option_errors** on MC calc questions are left in. They were re-evaluated, all match
  the printed options, and q11-414's were updated.
- **Shared base cases.** Boreal (q11-028/029/030/032/033), Okotoks (q11-047/050) and the warehouse (q11-502/508/513)
  share base inputs, but each asks for a different unknown or scenario. Okotoks and Boreal also anchor the concept
  cards, so they were left.
- **q11-030 error `equal-dollar-slopes` = 0.** This is a conceptual error with a real numeric value (no difference).
  Left.
- **DOL with taxes.** SM 11-25 and 11-29 derive DOL = 1 + [FC(1 − T) − T·D]/OCF. The course uses 1 + FC/OCF, and
  every DOL question either ignores taxes or gives the DOL. The c11-dol trap says so.
- **Cash break-even payback.** SM 11-16b says the payback "is negative". The cards and q11-408 follow TB Table 11.1
  ("never"), the cleaner statement.
- **Fill items q11-401, q11-485, q11-499** keep their longer keys, because the options are single terms.
- **q11-469.** "Break-even quantities tend to be higher" is treated as a true consequence of high fixed costs, which
  leaves the key (OCF becomes more stable) as the only false statement.
- **Scope.** Real-option questions name option types only (call-like / put-like in q11-487). There is no option
  pricing, capital structure or MACRS.
- **Outside this review's files.** `app/courses/fin201/data.js` still holds the old freeway example until the pack
  is rebuilt. The ch11 generators in `generators.js` were not reviewed here.

## Final counts

- Meta: 12 concepts (weights and archetypes unchanged), 3 topics, 5 activities, 19 formulas. Four meta items edited.
- Questions: 212, with none deleted or added: 44 numeric/multistep, 22 MC calc, 0 official. 49 questions edited
  (4 substantive, 11 explanation/number fixes, 6 minus-sign fixes, 28 answer-length fixes, some overlapping).
- Angles: apply 15, calc 66, contrast 16, define 26, formula 13, identify 21, interpret 14, not 12, order 5, why 24.
  Difficulty 1/2/3 = 25% / 50% / 24%. Key positions 0/1/2/3 = 35/35/37/42.
- `python tools/validate_fin201.py 11` prints OK. `python tools/verify_fin201.py 3` has no ch11 failures: the static
  numeric pass covers all ch11 checks. The only failure in the run is the ch08 scope hit q08-604, which is outside
  this chapter.
