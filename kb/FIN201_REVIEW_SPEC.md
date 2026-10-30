# FIN 201 review spec — chapter verification pass

You are the fact-checker for one chapter of the FIN 201 Midterm 2 trainer. Different writers produced the questions.
Your job: every question has exactly one defensible correct answer under the professor's conventions, every number
recomputes, nothing is out of scope, and nothing would teach the student the wrong thing. You are the last line of
defence before the student sees it.

## Inputs
- `kb/FIN201_CONTENT_SPEC.md` (schema, rules, inventory, error ids) and `docs/FIN201_MT2_COURSE_MAP.md` (scope,
  notation, archetypes §4, traps). The course map and the professor's materials win over the textbook.
- The chapter's sources listed in the content spec (lecture deck, seminar, solutions manual, textbook, review guide,
  practice exam).
- `content/fin201/parts/chNN_meta.json` and `content/fin201/parts/chNN_q*.json` — the files you edit.

## Procedure
1. Read the course map sections for the chapter, then every concept card in the meta (definition, explain, example,
   contrast, trap, formula, given flag, figure, formulas list). Fix factual errors and wrong given/memorise flags.
2. Read every question in every `chNN_q*.json`. For each decide:
   (a) is the keyed answer right under the professor's conventions (D1 = D0(1+g) when "just paid", half-year rule,
   PVCCA formula with the correct first-year factor and salvage term, CF_AT with the 50% inclusion, PI 1-based,
   ARR on average investment, population vs sample σ as stated, β = cov/σ_M², CAPM with the premium, etc.)?
   (b) could a well-prepared student defend another option? (c) does the stem give every input needed, with units?
   (d) does the explanation match the key and avoid positional references ("option A")? (e) for numeric questions:
   recompute the answer, every step and every error-library value yourself; is the tolerance sensible; is the unit
   right (rates in % when unit is "%"); do the solution lines and keystrokes agree with the numbers?
   (f) is anything out of scope (derivatives pricing, bonds/TVM for their own sake, capital structure, raising
   capital, MACRS, chapters 24-25)? Remove or rewrite it.
   (g) are MC calc distractors genuine misconception numbers (not random)?
3. Fix problems by editing the parts JSON directly: fix keys/values/checks/explanations; add the missing cue to the
   stem; replace a second-correct distractor; rewrite positional references; trim give-away answer lengths. Keep
   official (sample exam) wording. Delete a question only if it is unfixable; the validator's minimums must still pass.
4. Run `python tools/validate_fin201.py NN` (full, not partial) until it prints `OK`, then `python tools/verify_fin201.py 3`
   and make sure the static-content and scope sections pass for your chapter.
5. Write `content/fin201/review/chNN_review.md`: a table of every change (id, issue, fix), borderline items left
   alone with reasoning, and final counts. Keep it factual and short.

## Judgement guide
- Recompute every number; do not trust the writer's arithmetic or the SM's printed figure if it disagrees with its
  own formula (note it in the review).
- "Which is NOT" questions: verify the other options really ARE true.
- True/False statements must be unambiguous as written.
- Two numeric questions on the same archetype should not share identical givens.
- Prefer small edits. Keep the writer's style. Do not run git. Do not edit files of other chapters.
