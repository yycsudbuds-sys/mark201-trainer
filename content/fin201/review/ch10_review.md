# Chapter 10 review: Capital budgeting, cash flows

Reviewed against `kb/FIN201_REVIEW_SPEC.md`. Scope: all 21 concept cards, 7 topics, 6 activities and 18 formulas in
`ch10_meta.json`, and all 343 questions in `ch10_q1.json` to `ch10_q5.json` and `ch10_q10.json` to `ch10_q14.json`
(the chapter has 10 question files: q1-q5 from one writer, q10-q14 from the other). Sources: L05B s1-31, S5 s14-27,
S6 s1-19, SM 10 (CTQ 1-7, Q&P 1-52, App A1; Canadian CCA, MACRS ignored), PRAC q6 and q11, REV p1-3, the formula sheet,
and the course map (§1, §2 Ch 10, §3 rows 11, 21-26, 39, §4 A13-A19, §5).

I recomputed every numeric answer, step, error-library value, MC calc option and concept-card example with an
independent script (PVCCA with each first-year factor and salvage term, CCA schedules, CF_AT with min(ACB, POD) − UCC
and the 50% inclusion, OCF in all four forms, NWC flows, EAC, bid price, Fisher). All 80 numeric/multistep keys were
right and none changed. Every MC calc key was right. The problems were mostly about the pool-open convention, plus
four questions with two defensible answers, three duplicate questions, one out-of-scope question, positional
references and give-away key lengths.

## The pool-open convention

The course sources subtract the PVCCA salvage term whenever the asset is sold for S_N in year N, whether or not the
class stays open: S6 tractor (sold for 100 at year 10) and Dickerson (net salvage 8,000), SM 10-8, 10-14, 10-36. The
term is dropped only when the asset is not sold or S_N = 0. With an open pool the proceeds are received untaxed (L05B
s22: "We would also still need to consider the PV of any capital gains tax"). When the class closes, the sale is
settled by CF_AT (SM 10-11, PRAC q11c, L05B s23-26).

Before this review, the c10-pvcca card's trap said to drop the term "when the pool stays open". The c10-pool-open-closed
card did not say what happens to the term when the pool closes. All cards now teach the reading above. Stems now say
whether the asset is sold and whether the class closes.

One limit, stated on the c10-pool-open-closed card: never add a CF_AT recapture or terminal-loss tax on top of a
formula that already subtracts the salvage term. The formula already counts the UCC − POD gap as continuing CCA, so
adding CF_AT counts it twice. Example (q10-455/456): $60,000 machine, d = 30%, half-year, sold for $20,000 at year 3,
T = 30%, k = 10%.

| treatment | PV of tax effects |
|---|---|
| Open pool, formula | $9,505.45 |
| Closed pool, exact (schedule + CF_AT) | $9,786.63 |
| Formula + CF_AT refund (double count) | 9,505.45 + 1,124.72 = $10,630.17, wrong |

No question uses the double-count form. The NPV questions that use the formula all say "pool open". The disposal
questions say "closing the class" and use CF_AT.

## Changes

| id | issue | fix |
|---|---|---|
| meta c10-pvcca | Trap said "keeping it when the pool stays open" is an error, and contrast said to omit the term "when the asset is not sold and the pool stays open". Both contradict S6/SM. Explain said "the disposal tax is separate" (with the formula only a capital-gains tax remains, L05B s22) | Definition, explain, contrast and trap now say: subtract the term whenever sold, even if other assets remain; omit only if never sold or S_N = 0; proceeds untaxed with an open pool; capital gain above ACB taxed separately |
| meta c10-pool-open-closed | Did not say what happens to the salvage term in either case or how a closed pool fits with the formula. Definition did not mention that a gain above ACB is still taxed | Rewritten as above. Example now has numbers (closed class: CF_AT = 4,000 + 0.30 × 5,000 = $5,500). Trap names "dropping the term because the pool stays open" and the double count. Formula lists both cases |
| meta c10-expansion-npv | Did not say how a sold asset is treated | Definition: add S_N (untaxed with an open class) and subtract the salvage term. Example: tractor "sold for $100M at year 10 (salvage term subtracted)". Trap adds the pool-open error |
| meta c10-replacement-npv | Net salvage treatment not stated | Same class stays open; net salvage untaxed; its term subtracted (adds when negative) |
| meta c10-cost-cutting, c10-eac-taxes | Salvage term not stated | Cost-cutting example: "scrapped with no salvage, so no salvage term"; trap adds the salvage term. EAC: sold cars subtract the salvage term (S6 Civil/Chevalier re-verified: −$5,815 and −$6,473) |
| meta c10-timing-of-sale | Lost shield d × UCC × T/(k + d) is right only when the sale closes the class | Definition, trap and formula give both cases (open pool: POD − d × POD × T/(k + d), as in q10-555). Example notes that the slide prints $403.27. 0.38 × 0.30 × 1,414.875/0.40 = 403.24, and 2,397.65 − 403.24 = 1,994.41, the slide's own NPV, so 403.27 is a typo |
| meta c10-dts | "The DTS shrinks every year" is false under the half-year rule (year 2 > year 1) | Qualified: "after the first-year adjustment (under the half-year rule year 2 is the largest)" |
| meta c10-recapture-terminal-loss figure, t10-5 summary | Disposal cases presented without the closed-class condition | Title/summary say "when the class closes"; summary adds that an open-pool sale is not taxed at once |
| meta f10-pvcca, f10-timing | Same convention issues | Trap: subtract the term even if the pool stays open. Timing formula shows both cases |
| q10-143 | Distractor "rises by 10 percentage points of CCA" is also true (ΔDTS = 0.10 × CCA) | Replaced with "rises by 10% (× 1.10)". Explanation notes that 10 points is not 10% |
| q10-106, q10-138 | "Which is NOT correct": the option meant to be true ("CCA/DTS falls each year") is false in year 2 under the half-year rule, so two options were defensible | Qualified to "After year 1, …" and "From year 2 on, …" |
| q10-110 | Fill stem said CCA "falls each year" (same flaw) | "After year 1, declining-balance CCA falls each year because …" |
| q10-105 | Key said accounting depreciation "matters only through tax". It does not affect cash taxes at all | "accounting depreciation does not change the cash flows" |
| q10-430, q10-431 | MC calc with the same givens and answer as multistep q10-433 ($427,000) and numeric q10-434 ($70,642.50) | New numbers: Haida Ferries (POD 610,000, ACB 480,000, UCC 205,000, T 28%) gives $514,800; Kamloops Quarry (118,000 / 96,000 / 37,400, 32%) gives $95,728. Distractors recomputed from the same four errors |
| q10-591 | MC calc identical to multistep q10-594 ($34,790.17) | New numbers ($12,000 real, 2% inflation, 8% nominal, 5 years) give $50,710.56. Distractors are real flows at the nominal rate, 8% − 2% as the real rate, nominal flows at the real rate, and no discounting |
| q10-583 | Contrasted APR vs EAR ("nominal versus effective"), which is Midterm 1 TVM for its own sake | Rewritten as an in-scope contrast of real versus nominal cash flows |
| q10-571 | Distractor $3,577.81 was 4 × the answer, not a misconception | Replaced with $1,629.27 (both CCA shields left out). Explanation names every distractor |
| q10-491 | Explanation named three errors for four distractors. $51,166.81 was traced to a CCA shield on the gross $120,000 / $15,000 | Explanation names each distractor |
| q10-153, q10-160, q10-163, q10-165 | Stems tied the no-salvage-term case to "the pool stays open" | Reworded so the trigger is "never sold" |
| q10-161, q10-162, q10-164, q10-166, q10-167 | PVCCA-with-sale stems did not say whether the class stays open | "Other assets remain in the class" added (the formula is then exact) |
| q10-178, q10-179, q10-492 | Replacement stems: "would be worth" (no sale stated) or class status missing | Sale of the new machine and the open class stated |
| q10-541, q10-551 | The lost shield on UCC holds only when the sale closes the class | "last asset in its CCA class" / "closing the class" added |
| q10-456 | Stem said "from the previous question" (questions are shown in adaptive order) | Self-contained wording |
| q10-066, q10-102, q10-160, q10-401 | Positional references ("the last option", "the first two options", "the half-deduction option") | Each distractor named by content |
| q10-048, 070, 072, 086, 139, 143, 154, 159, 409, 410, 424, 447, 464, 466, 467, 468, 484, 486, 488, 502, 525, 526, 527, 544, 546, 547, 548, 561, 563, 565, 585, 586 | Key 1.75-5× the mean distractor length, or the only option without "Because", which gives the answer away | Keys trimmed and/or distractors lengthened in parallel form. No meaning or key position changed. No key is now ≥ 1.75× the distractor mean |

## Checked and confirmed (no change)

- Sample Q11(c) (q10-060, official): min(590,000, 197,000) − 155,566.41 = 41,433.59 recapture, no gain;
  CF_AT = 197,000 − 0.30 × 41,433.59 = **$184,569.92**. Q11(a) $70,000, Q11(b) $0, Q6 (q10-084) inventory increases.
  Wording is verbatim.
- Lecture CCA example ($7,500, d = 30%, AII, T = 38%): CCA 3,375 (slide prints 3,375.50, but the DTS of 1,282.50
  matches 3,375), 1,237.50, 866.25, 606.375; UCC 1,414.875; recapture tax 602.35; cross-check T × (7,500 − 3,000) = 1,710.
- S5 PVCCA $28,107.72, S6 tractor $37.66M (14.29 + 28.49 − 5.12), Dickerson −$2,075.34, Simple Replacement $47,867.15,
  SM 10-24 bid price figures: all reproduced.
- The half-year, AII and 100% factors are correct everywhere. Assets already depreciating use factor 1 (q10-122, 160,
  163, 167). Net acquisitions use min(original cost, POD) (q10-177, 178, 179, 180). Negative net salvage adds to
  PVCCA (q10-179, 495).
- Sale-timing conventions ("after claiming year-N CCA") are explicit in q10-414 to 418, 455, 552, 553 and kept. The
  lecture example instead sells during year 5 with no CCA that year. Both conventions are stated where used.
- Follow-on questions that share givens but ask for a different quantity were kept: q10-433/438, q10-472/477,
  q10-532/535/536, q10-572/573 (and q10-569 quotes their EACs).
- New error ids outside the shared list (ignored-erosion, pretax-not-aftertax, historic-cost-for-opportunity, acb-not-min
  and others) are kebab-case and descriptive. Kept, as the spec allows.
- q10-404 (terminal loss only when the class empties) is true. The cards say an open pool "generally" has no recapture,
  since recapture can arise if a pool's UCC turns negative (not tested).
- "None of the above" appears once (q10-182) and is the key there.

## Outside this chapter's files (not edited, needs the owner)

- `docs/FIN201_MT2_COURSE_MAP.md` contradicts the convention in two places. §3 row 25's trap says "omit the last term
  if the pool stays open". §4 A17's error list includes "keeping it when the pool stays open".
- `app/courses/fin201/generators.js` has three problems:
  - `pool_open` drops the salvage term for an asset sold from an open pool. Its error `kept-salvage-term` marks the
    course answer as wrong. `tools/verify_fin201.py` has a matching `pool_open` solver.
  - `pvcca`, `project_npv`, `bid_price` and `required_savings` say "closing the class" but use the formula with
    untaxed proceeds. They should say other assets remain in the class.
  - `replacement_npv` has no salvage at all, which is consistent but untested.

## Final counts

| item | count |
|---|---|
| Concepts / topics / activities / formulas | 21 / 7 / 6 / 18 |
| Questions | 343 (4 official): 217 MC, 27 T/F, 19 fill, 34 numeric, 46 multistep |
| Difficulty 1 / 2 / 3 | 20% / 53% / 25% |
| Questions changed | 60 (none deleted). Concept cards changed: 9, plus 1 topic summary and 2 formula entries |
| Numeric keys changed | 0 |
| `python tools/validate_fin201.py 10` | OK |
| `python tools/verify_fin201.py 3` | ALL CHECKS PASSED (static numeric and scope sections clean for ch10) |
