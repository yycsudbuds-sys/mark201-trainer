# Chapter 12 review: Risk, return and diversification

Reviewed against `kb/FIN201_REVIEW_SPEC.md`: all 13 concept cards, 5 activities and 13 formulas in `ch12_meta.json`, and all 237 questions in `ch12_q1`–`q4`, `q10`–`q12`. Sources checked: L06 s1-37 and 46-59, S7 s1-13, SM 12 and SM 13-1..12, TB 12 (Tables 12.2-12.3, Figure 12.10), TB 13.5 (Table 13.7), PRAC q7 and q8, and REV. I recomputed every numeric answer, step and error-library value. All normal-table values are standard N(z): 0.6915, 0.7257, 0.7734, 0.8413, 0.8944 and N(0.08) = 0.5319.

## Changes

| id | issue | fix |
|---|---|---|
| meta c12-risk-aversion-premium, a12-01, q12-014, q12-015, q12-026 | `verify_fin201.py`'s scope regex `risk[- ]neutral` is meant for derivatives pricing, but it also matches the professor's own L06 s8 term, so verify failed on 4 ch12 items | Reworded to "neutral toward risk". The figure title and q12-026 now name the three attitudes (averse, neutral, seeking) |
| a12-01 item 1 | "Moves money from T-bills into stocks only if the expected return is higher" also fits an investor who is neutral toward risk | "Wants a higher expected return before taking on a more volatile investment" (risk averse) |
| q12-014 | "only if … clearly higher than 3%" also fits a neutral investor | "beats 3% by enough to pay him for the extra risk" |
| q12-047 | The TF statement was ambiguous: the method is right but the data are not (the probabilities add to 0.9) | Restated as "… gives a valid expected return" (False); explanation tightened |
| q12-051 | Same givens as q12-069 (Athabasca Tech, same four states), so one numeric question contained the other | New data (Peace Arch Software: 0.10/0.40/0.35/0.15; 36/15/2/−24%). E[R] = 6.70%; errors 7.25 and 13.90 |
| q12-067 | Error `n-minus-1-with-probs`: the check applied "/2" only to the last term (8.54) | `sqrt(variance/2)` = 6.89 |
| q12-069 | Same bug, with "/3" on the last term only (12.39) | `sqrt(variance/3)` = 8.89 |
| q12-083 to q12-088 | The TI keystroke "2nd [STAT] until 1-V" is not how the calculator works | "2nd [STAT], then 2nd [SET] until 1-V shows" |
| q12-084 | Last month's returns, but the answer was asked "in % per annum" | "in %" |
| q12-031, 034, 036, 081, 097; meta c12-normal-distribution (example and figure) | The US 1926-2016 textbook figures were not labelled as such | Added "(U.S. data in the textbook)" or "U.S. … 1926-2016" |
| q12-414 (official) | The explanation called 7.0% "the correct choice", which reads oddly in a numeric format | "the keyed answer on the sample exam" |
| q12-447 | The covariance in the solution was given only in %² | Also shown in decimals (−0.006675) |
| q12-470 | The covariance step was entered in %² (−23) | Now entered in decimals (−0.0023), with matching solution line; keystroke notes LIN mode |
| q12-471 | Error value 0.001 is a rounded version of 0.00104 | 0.00104 |
| q12-473 | Error value 0.0001 is a rounded version of 0.000075 | 0.000075 |
| q12-511 | The explanation used the N-stock average-covariance argument (not in the course); the keyed option was the longest by far | Explanation rewritten in course terms (systematic floor near σ_M); option trimmed |
| q12-514, q12-517 | Built on σ_P² = σ²[1/N + (1 − 1/N)ρ], which is not in the course materials | Deleted. The concept keeps 21 questions, 10 angles and 4 calc questions; it has no archetype, so no numeric minimum applies |
| q12-004, 011, 029, 031, 406, 423, 453, 454, 460, 477, 478, 481, 497, 503, 504 | The keyed option was much longer than every distractor, which gives the answer away | Trimmed the key, or lengthened or paralleled the distractors (q12-478: all four options are now "ρ = 1 …; ρ = 0 …; ρ = −1 …") |

## Borderline, left alone

- **Ids in the brief.** The brief named q12-513 and q12-516 as the N-stock-formula items. The formula is actually in q12-514 and q12-517, which were removed. q12-513 (48% → 26.4%, 45% removed) and q12-516 (ratio of reductions) use only given σ's and are in scope.
- **q12-414 (PRAC q8)** is multiple choice on the sample exam. It is kept as a multistep question with the verbatim stem so it gets steps and an error library. The key, 7.0%, matches the exam.
- **Risk-free mixes and borrowing** (q12-419, 420, 430, 437, 443, 444) come from the second lecture (L06 s38-40). They are kept because map §3 #32 and archetype A25 put σ_P = w σ with a risk-free asset in Chapter 12.
- **q12-007** uses R = D1/P0 + g to show cost of equity. This is a Ch 8 formula used as a tool, which the scope rules allow.
- **q12-454** (N vs N − 1 cancels in ρ) is subtle but correct.
- **q12-468** has a `pct-decimal-mix` error value of −9494.5. It looks absurd, but it is genuinely what that units slip produces.
- **Option-length scan.** q12-404, 458, 476, 505 and similar were flagged, but their options are parallel terms or formulas. No change.
- **Given/memorise flags** are kept as the map's §3 has them:
  - Given: E[R_P], σ_P, historical μ/σ (population and sample), Fisher.
  - Memorise: E[R] and σ² from states, cov/ρ, z-score, risk premium.
- **SM 13-9a** prints "0.01308 or 13.08%". The decimal is a typo (0.1308); the SM figure is not used verbatim anywhere.
- **Wording in the trainer vs the lecture.** The trainer now says "neutral toward risk" where the lecture says "risk neutral". If `verify_fin201.py`'s scope regex is narrowed (for example to `risk[- ]neutral (pricing|valuation|probabilit)`), the professor's exact wording can go back.

## Final counts

- 235 questions (237 − 2): 144 mc, 17 tf, 8 fill, 19 numeric, 47 multistep (66 numeric/multistep); 2 official (PRAC q7 → q12-496, PRAC q8 → q12-414).
- Difficulty mix 25 / 52 / 21 %. 5 activities and 13 formulas are unchanged in number.
- Per concept (questions / numeric / MC calc):

| concept | questions | numeric | MC calc |
|---|---|---|---|
| required-return-cost-of-capital | 12 | 2 | 0 |
| risk-aversion-premium | 15 | 4 | 2 |
| history-lessons | 13 | 3 | 1 |
| expected-return-states | 17 | 8 | 2 |
| variance-states | 17 | 7 | 2 |
| historical-sd | 17 | 7 | 2 |
| normal-distribution | 14 | 5 | 2 |
| risk-return-diagram | 14 | 0 | 2 |
| portfolio-weights-return | 21 | 6 | 4 |
| portfolio-sd | 26 | 10 | 4 |
| covariance-correlation | 27 | 7 | 3 |
| diversification-benefit | 21 | 4 | 2 |
| diversification-limit | 21 | 3 | 1 |

- `python tools/validate_fin201.py 12`: OK.
- `python tools/verify_fin201.py 3`: the static check passes (378 numeric questions recomputed) and there are no ch12 scope hits. The only remaining failure is ch08 q08-604.
