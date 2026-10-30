# Chapter 9 review: Capital budgeting, decision rules

Reviewed against `kb/FIN201_REVIEW_SPEC.md`. Scope: all 18 concept cards, 7 topics, 6 activities and 9 formulas in
`ch09_meta.json`, and all 278 questions in `ch09_q1.json` to `ch09_q4.json` and `ch09_q10.json` to `ch09_q14.json`
(the chapter has 9 question files). Sources: L05A s1-37, S5 s1-13, S6 s11-14, SM 9 (CTQ 1-15, Q&P 1-23, App A1-A3),
SM 10-27..31, 44, 45, TB 9, PRAC q5 and q10, REV p1-3, and the course map (§1, §2 Ch 9, §3 rows 15-22, §4 A9-A13, §5).

I recomputed every numeric answer, step, error-library value, MC calc option and concept-card example with an
independent script. IRRs and crossover rates were found by bisection, and the NPV at each stated rate was checked to
be about 0. All 56 numeric/multistep answers were correct, and no numeric key changed. One MC key index changed
(q09-051, see below). The one factual error was in a concept card (the MIRR example's IRR). The other fixes are
positional references, a T/F statement that needed a qualifier, solution lines whose rounded factors did not give the
stated product, a chain-mode keystroke, two weak distractors or errors, and keyed options much longer than their
distractors.

## Changes

| id | issue | fix |
|---|---|---|
| meta c09-mirr | Example gave the IRR of −1,000 / +600 / +700 as 18.89%. The root is x = 0.841171, so IRR = 18.88% (same as q09-426) | 18.88% |
| meta c09-pi-vs-npv | `given: true`, but the card's formula (PI = 1 + NPV/outlay; 0-based NPV/outlay) is not on the formula sheet. Only PI = PV inflows / PV outflows is (that stays given on c09-pi and f09-pi) | `given: false` |
| q09-040 | Explanation said "Only the first statement … is false" (positional) | Names the statement instead |
| q09-052 | "The second option describes the IRR, the third the ARR and the fourth the PI" (positional) | Says which definition is which rule |
| q09-058 | "The first alternative … the third … the fourth" (positional) | Describes each wrong expression by its content |
| q09-470 | "The first is positive … the second is above 1" | "NPV is positive … PI is above 1" |
| q09-436 | Explanation ended "the rules disagree only on the first side". The key was 2.1× the length of the distractors | Explanation says "only below the crossover". Key trimmed and distractors lengthened |
| q09-471 | T/F "PI 1.15 means NPV = 15% of the initial outlay" is true only with a single outlay at t = 0. With a later outflow, NPV = 0.15 × PV of all outflows | Stem now says it is a conventional project (one outlay at time 0). Key True unchanged |
| q09-514 | Explanation called PI "per dollar of NPV" | "present value per dollar invested" |
| q09-544 | Explanation showed −272,865.07 / 0.09 = −$3,031,834.13, but that division gives −3,031,834.11. The option uses the unrounded EAV | Explanation shows both figures and says why they differ |
| q09-046 (official) | Solution said 215,000 × 4.9676 = 1,068,042.55 (that product is 1,068,034.00, off by $8.55) and 960,000/2.4760 = 387,727.90 | Factors shown as 4.967640 and 2.475963, so each line reproduces its result |
| q09-441, q09-490, q09-505, q09-536 | Solution lines used 5-dp annuity factors, so the stated products were $0.06-$0.55 off the keyed answers, which have a 0.05 tolerance | Factors shown to 6 dp (2.624316, 2.531295, 2.486852, 4.230538) |
| q09-032 | Keystroke "24,800 ÷ 1.13 y^x 3" raises the quotient to the 3rd power in the BA II Plus default chain mode | "24,800 ÷ 1.13^3", computing 1.13 y^x 3 first |
| q09-051 | The chapter's only "None of the above" (official q09-507) is never the key. The spec says it must sometimes be correct | Correct value $1,071.01 replaced by the misconception value $973.65 (outlay treated as year 1). Added "None of the above" as the key (5 options, A-E). Explanation rewritten |
| q09-521 | Distractor $3,000 combined two errors (wrong N and no discounting) | Replaced with $54,000, the plain no-discounting figure (204,000 − 150,000) |
| q09-491 | Error "PI × outlay for Large, PI − 1 for Small" (141,000) was a contrived mix of formulas, not a real misconception | Removed. Two errors remain (pv-for-npv, subtracted-wrong-order) |
| q09-477 | Error "dropped the year-4 inflow" was tagged `wrong-n-annuity`, but no annuity factor is involved | Id changed to `dropped-final-flow` (as in q09-108) |
| q09-069, q09-501 | Options named projects by list position ("Only the first", "The first two") | Options now name the NPVs (for example "The +$120,000 and +$45,000 projects only") |
| q09-026, q09-113, q09-404, q09-446, q09-448, q09-464, q09-482, q09-483, q09-487, q09-500, q09-511, q09-513, q09-527, q09-528, q09-545, q09-546, q09-547, q09-554 | The keyed option was 1.75-4× the length of the distractors, which gives the answer away | Trimmed the key and/or lengthened the distractors in parallel form. No meaning or key position changed. In q09-464 the key is now just "PV of cash inflows ÷ PV of cash outflows" (the explanation still gives 1 + NPV/outlay) |

## Checked and confirmed (no change)

- **Official items.** q09-001 is sample Q10(a): 215,000 / [(1,200,000 + 960,000)/2] = 19.91%. q09-046 is Q10(b):
  −1,200,000 + 215,000 × 4.967640 + 960,000/1.12^8 = +$255,770.45. q09-507 is sample Q5, kept verbatim (key A).
- **ARR.** All ARR items divide average profit after tax by (I0 + ending book value)/2. Payback fractions are
  remaining ÷ the recovery year's flow, and discounted payback uses PV in both the numerator and the denominator.
  PI is 1-based, and PI numerics are answered to 2 decimals.
- **IRRs** were recomputed by bisection, and NPV at each keyed rate is about 0 (to the cent):
  - IRRs: 16.81, 13.51, 18.26, 15.30, 14.77, 6.33, 10.92, 14.36, 7.32 and 16.80 (MIRR, discounting approach).
  - Two-root cases: 12/35 (q09-106) and 8.32/40.35 (q09-109). q09-108 has no real IRR (NPV is at most −$100,000).
  - Crossovers: 13.2445% (E − L), 13.0825% (A − B), 9.7010% (L − S), 17.3913% (one-period L − S), and 11.03% on the card.
- **Financing-type flows.** In q09-401 to q09-414 the rule is reversed (accept if IRR < R), and the NPV signs agree.
- **EAV/CCR/LCM.** Program A: EAV −272,865.07, CCR −3,031,834.13, LCM chain −1,224,050.50. Program B: EAV
  −260,736.14, CCR −2,897,068.22, LCM chain −1,169,641.10 = EAV × AF(9%, 6). The L05A card example gives
  −11.5238M / −10.8571M, with equal annual cost at 26.27%.
- **MC calc distractors** are all error-library or misconception numbers (no CF0, CF0 as period 1, wrong N, no
  discounting, 0-based or inverted PI, average of the IRRs, L + S, raw NPV, and so on).
- **Scope.** There are no out-of-scope topics (no bonds for their own sake, no capital structure, no MACRS). MIRR has
  12 questions, which is fine for a low-weight concept.

## Borderline, left alone

- **q09-046 reading of sample Q10(b).** The added sentence makes the stem treat $215,000 as the annual cash flow and
  the $0.96M residual as a year-8 cash inflow. I judge this the most defensible reading, for three reasons:
  - L05A treats an "after tax income stream" as the cash flows in its payback example (s10-11), and "earn $200k after
    tax per year" in its ARR example (s7).
  - The paper gives no depreciation method, so adding depreciation back needs an unstated straight-line assumption.
  - "There is no tax" removes any tax-shield effect, so the figures are meant to be used as given.

  The add-back reading (CF = 245,000, NPV $404,799.64) stays in the error library with its explanation. The stem
  keeps the explicit sentence.
- **Ids in the brief.** The brief named q09-471 and q09-475 as the PV-of-all-outflows PI items. The items with a
  later outflow are q09-475 (1.31) and q09-479 (1.10). Both follow the formula sheet's PI = PV inflows / PV outflows,
  and the "netted" alternative is a distractor or error. q09-471 is the T/F fixed above.
- **q09-104 (T/F, True).** "Conventional flows cross the axis exactly once, at the IRR." When the inflows sum to less
  than the outlay, the crossing is at a negative rate. That case is outside the course's use, and one sign change
  means one IRR.
- **Remaining 5-dp annuity factors.** In q09-411, 478, 489, 519-521 and 535, products shown with a 5-dp factor are
  off by under $0.25. They are left as display rounding: the results are computed unrounded, and the keystrokes use
  the TVM/CF worksheet.
- **Tolerances.** Payback items use abs 0.05 years rather than 0.01. That accepts the professor's 1-decimal style
  (3.4 years), and no error value falls within it. q09-046 uses abs $1.00 on a $255,770 NPV.
- **Shared givens.** Moraine, quarry, Northwind, Cedar Creek, Hartwell, Prairie Seeds and Bow River each appear in
  more than one question. Each question asks for a different quantity (a different rate, a step versus the final
  answer, or MC versus numeric), so none duplicates another.
- **q09-505** has two errors with the id `depends-ignored`. They are the same mistake seen from the two projects.
- **Source slips, not used in any question:**
  - SM 10-45 prints the annuity factor as 4.1141 in one place and 4.11141 in another.
  - SM 9-1 says "during the third year" where it means the fourth.

## Final counts

- 278 questions (3 official: q09-001, q09-046, q09-507), 56 numeric/multistep, 18 concepts, 7 topics, 6 activities,
  9 formulas. Difficulty 22/56/21%.
- Edits: 38 questions and 2 meta fields. No question was deleted. One key index changed (q09-051, now "None of the
  above"). No numeric answer changed.
- "None of the above" appears in 2 MC questions: it is the key in q09-051 and a distractor in q09-507.
- `python tools/validate_fin201.py 09` prints OK. `python tools/verify_fin201.py 3` passes the static-content and
  scope checks for ch09. Its only failure is ch08 q08-604, which belongs to another chapter.
