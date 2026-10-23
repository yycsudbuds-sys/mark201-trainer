# Chapter 9 (Pricing): review

Reviewer pass against `kb/inventory_ch09.md`. All 168 questions, 31 concept cards and 6 activities were read. Every keyed answer agrees with the inventory, and no keys were changed.

## Calculation check (recomputed in Python)
I recomputed all 22 `calc` questions plus the questions that contain numbers (q09-026, 052, 059, 065, 118) and the card examples (dishwasher $610, Charlie Tuna $61.52, frame BEP 400, bakery profit $44,000, elasticity 2.5, Figure 9-3 20%/25%, 2/10 net 30 = $4,900, 12% ROI = $60,000). Every keyed number is exact, and every distractor that an explanation describes matches the error it is said to come from (for example 30/10/5 on $200 = $119.70, and simply adding the discounts gives $110). I found one wrong explanation (q09-106) and made two explanations clearer (q09-114, q09-120). Details are in the table.

## Changes
| Question / card | Issue | Change |
|---|---|---|
| q09-106 | The explanation said 66.7% "converts the other way". Converting a 50% markup on cost the other way gives 100%, not 66.7%; 66.7% is cost as a share of price. | Rewrote the explanation: 66.7% = $100 / $150, cost as a share of price, not a markup. 50.0% keeps cost as the base. |
| q09-114 (official) | 1,292,000 / 21,000 = 61.5238. The rounding was not stated. | Explanation only: added "= $1,292,000 / 21,000 = $61.52 (rounded to the cent)". Stem, options and key are unchanged. |
| q09-120 | "$60.00 adds 20% to COST" did not show where the $50 unit cost comes from. | Explanation now shows $100,000 / 2,000 = $50 average unit cost, x 1.2 = $60, profit $20,000 = 16.7% of sales. |
| q09-165 | The correct option was much longer than the others (a giveaway). The explanation said "the other three options". | Made the three price-fixing distractors longer and the key shorter (same meaning). The explanation now names the cement makers, airlines and gas stations. |
| q09-162 | Only the key carried a parenthetical "(resale price maintenance)", which gave it away. | The key now reads "vertical price fixing". The explanation still teaches resale price maintenance. |
| q09-083 | Key was 115 characters; the distractors were 37 to 53. | Shortened the key ("demand curve bends backward: a lower price signals less status") and made the distractors longer. |
| q09-078 | The key listed three conditions; the distractors were short fragments. | Made the distractors longer (skimming, prestige and yield-management condition sets). The explanation now also covers the status-symbol (prestige) distractor. |
| q09-043 | Key was 131 characters; the distractors were 51 to 77. | Shortened the key and made the distractors longer, with no change in meaning. |
| q09-026, q09-033, q09-093, q09-100, q09-122, q09-137, q09-138 | The correct option was clearly longer than every distractor. | Made the distractors longer so the options are a similar length. Keys and meaning are unchanged. |
| Card c09-final-price-steps | The slides place dynamic pricing (Uber surge) under the Step 3 special adjustments. The card left it out of Step 3. | Added dynamic pricing to the Step 3 definition and figure. Added a sentence explaining that the slides put dynamic pricing in Step 3, while the textbook calls it a form of flexible pricing, and that the one-price vs flexible-price policy choice is still Step 2. |
| Card c09-one-flexible | Same slide placement issue. | Explain text now notes that the slides show dynamic pricing among the Step 3 adjustments. |
| Card c09-yield-management | The inventory uses rideshare/Uber both as a yield-management example and as the dynamic-pricing example, so students could confuse the two. | Trap now separates the cues: "adjusting prices in real time based on demand" (Uber surge) means dynamic pricing; a fixed number of seats or rooms sold over time means yield management. |

## Confusable sets checked (no change needed)
- Yield management vs flexible/dynamic pricing. No question offers both as defensible answers. q09-099 limits "flexible" to buyer-based pricing, and all its distractors are buyer-based. q09-147 and q09-148 (dynamic pricing) have no yield-management option. q09-094, q09-097 and q09-100 have no flexible or dynamic option.
- Skimming vs penetration vs prestige vs above-market: q09-020, 072-086 and 125 each have exactly one fitting option.
- Standard markup vs cost-plus vs target profit vs target return: q09-102, 107, 109-123 are clean.
- Loss leader vs penetration vs below-market vs predatory: q09-079, 126, 129-133 and 168 are clean.
- FOB origin vs uniform delivered: q09-156 to q09-160 are clean.
- Price fixing vs discrimination vs predatory vs deceptive: q09-146, 161-168 are clean.
- The remaining sets are also clean: objectives vs constraints, one-price vs flexible, the four discount types, and the Figure 9-2 buckets (including activities a09-01 and a09-02, which match 7-2-3-3).

## Borderline, left alone
- Many explanations say "the other three" or "the others" (for example q09-005, 010, 074, 079, 094, 099, 107, 126, 130). This does not refer to a position: it means every option except the key, so it still works when options are shuffled. I left it.
- q09-159: the key "single-zone (postage-stamp) pricing" is somewhat longer than the distractors. "Postage-stamp" is the course synonym and helps learning, so I kept it.
- q09-147: the stem already says "dynamic pricing", which makes it easy. The answer is still correct and only one option fits, so I left it.
- c09-geographic figure: it lists the seller as paying freight under basing-point pricing. This is a simplification of how basing-point pricing works, but it matches the inventory's grouping of basing-point under uniform delivered pricing (seller pays), so I left it.
- Official questions (q09-001, 007, 032, 072, 073, 102, 114, 144, 149, 156): wording, options and keys are untouched, and all agree with the inventory. Distractors such as "price lining" and "$48.09" are the instructor's.

## Final counts
`python tools/validate.py 09` prints OK. 31 concepts, 6 topics, 168 questions (10 official), 6 activities. Difficulty mix 1:25% 2:47% 3:26%. Angles: identify 42, contrast 28, define 23, calc 22, not 20, why 17, apply 11, order 5. Changed: 16 questions (no key changes, none deleted or added) and 3 concept cards.
