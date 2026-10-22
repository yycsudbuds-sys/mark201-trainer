# MARK 201 Trainer — Content Spec for chapter question writers

You are writing the study content for ONE chapter of an adaptive, game-like exam trainer for a University of Alberta MARK 201 (Intro Marketing) midterm. The learner has zero prior knowledge, two days to study, and wants hard, varied, test-bank-style questions that test every concept from every angle. Correctness is non-negotiable: every answer must be defensible from the chapter's ground-truth files.

## Inputs (read ALL of them first)
- `kb/inventory_chNN.md` — ground truth: slide content, textbook definitions, official practice questions with answers, traps. THIS IS AUTHORITATIVE. If anything you remember from the textbook conflicts with it, follow the inventory (it reflects the instructor's course).
- `kb/MARK_201_ChNN_2026.txt` — raw slide text.
- `kb/Extra_Chapter_N_Questions.txt` — the instructor's official practice questions (with answers marked `(XX)` or stated in the explanation).

## Output files (write these, nothing else)
- `content/parts/chNN_meta.json` — object with keys: `chapter`, `title`, `topics`, `concepts`, `activities`.
- `content/parts/chNN_q1.json`, `chNN_q2.json`, `chNN_q3.json`, ... — each a JSON ARRAY of at most 40 question objects. Use as many files as needed.
- Then run `python tools/validate.py NN` from the project root and FIX every reported error (re-run until it prints `OK`). NN is two digits (01, 06, 07, 08, 09, 10, 11, 12).

Write valid JSON only (no comments, no trailing commas). Use straight quotes inside JSON strings (escape as needed). Canadian spelling (behaviour, colour, centre) to match the course.

## Schema

### meta
```json
{
  "chapter": 7,
  "title": "Products and Brands",
  "topics": [
    {"id": "t07-1", "order": 1, "title": "What a product really is", "summary": "2-4 plain-English sentences that orient a total beginner.", "concepts": ["c07-product", "c07-total-product"]}
  ],
  "concepts": [
    {
      "id": "c07-total-product",
      "topic": "t07-1",
      "term": "Total product concept",
      "definition": "Textbook-precise definition in 1-2 sentences.",
      "explain": "Plain-English explanation in 2-4 sentences: what it means, how to think about it, why it matters.",
      "example": "One concrete example (Canadian brands preferred).",
      "contrast": "What it is commonly confused with and exactly how to tell them apart.",
      "trap": "How exam questions try to trick you on this concept (specific cue words to watch for).",
      "mnemonic": "Short memory hook, or empty string.",
      "figure": null
    }
  ],
  "activities": [
    {"id": "a07-01", "type": "order", "concept": "c07-xyz", "title": "Order the steps", "prompt": "Put the ... in the correct order.", "items": ["first", "second", "third"], "explanation": "Why this order."},
    {"id": "a07-02", "type": "sort", "concept": "c07-xyz", "title": "Sort into buckets", "prompt": "Drag each item to its category.", "buckets": ["Bucket A", "Bucket B"], "items": [{"text": "item", "bucket": 0}], "explanation": "..."},
    {"id": "a07-03", "type": "match", "concept": "c07-xyz", "title": "Match term to example", "prompt": "Match each term with its example.", "pairs": [{"left": "Term", "right": "Example or definition"}], "explanation": "..."}
  ]
}
```
- `figure` is optional: for the handful of MUST-MEMORIZE tables/lists in the inventory (e.g., PLC stage table, Ansoff matrix, adoption curve percentages, pricing approach buckets, intermediary functions, wholesaler types, advocacy funnel, 6 IMC steps) supply `{"type": "table", "title": "...", "head": ["col1", "col2"], "rows": [["...", "..."]]}` or `{"type": "list", "title": "...", "items": ["..."]}`. Otherwise `null`.
- IDs: concepts `cNN-slug` (lowercase, hyphens), topics `tNN-k`, activities `aNN-kk`, questions `qNN-kkk` (zero-padded, unique across the chapter).
- Topics: 3-6 per chapter, in teaching order, covering every concept exactly once.
- Concepts: 18-30 per chapter. Cover EVERY term/idea in the inventory's "Core terms", "Slide-emphasized points", and the concepts tested by the official practice questions. Each definable term the exam could name gets its own concept, but group trivially small sub-items into a parent concept (e.g., the four discount types can be one concept "Discounts" with a figure list, but POP vs POD should be one concept with a contrast).

### questions
```json
{
  "id": "q07-001",
  "concept": "c07-total-product",
  "also": [],
  "type": "mc",
  "angle": "identify",
  "difficulty": 2,
  "stem": "Full question text. Scenario questions: 2-4 sentences, realistic Canadian business, invented company names.",
  "options": ["...", "...", "...", "..."],
  "answer": 1,
  "explanation": "Why the answer is right (cite the rule/definition) AND why the most tempting distractor is wrong. 1-3 sentences.",
  "source": "generated"
}
```
- `type`: `mc` (4 options; 5 allowed when it mirrors an official question), `tf` (options exactly `["True", "False"]`; stem is a statement; explanation must state the corrected statement if false), `fill` (stem contains `_____`; options are 4 candidate terms).
- `angle` (the "angle" the concept is tested from):
  - `define` — definition -> term, or term -> definition.
  - `identify` — a scenario/example -> name the concept (the dominant test-bank style).
  - `apply` — given a situation, what should the marketer do / what outcome follows / which strategy fits.
  - `contrast` — distinguish the concept from its confusable sibling(s) (both appear as options).
  - `not` — "which is NOT…", exception, or "all EXCEPT".
  - `why` — purpose, rationale, consequence, or condition under which it works.
  - `calc` — a numeric calculation (pricing chapter mostly: BEP, markup, target profit, price equation, elasticity direction).
  - `order` — sequence/position questions ("what comes immediately after…", "the third step is…").
- `difficulty`: 1 = recall, 2 = typical test-bank scenario, 3 = subtle discrimination/multi-step. Mix roughly 25% / 50% / 25%.
- `source`: `official` for the instructor's practice questions (include ALL of them verbatim, lightly cleaned: remove `(XX)` markers, keep wording and options, keep the stated correct answer, write a proper explanation). Everything else `generated`.

## Coverage requirements (validator enforces)
- Every concept has >= 5 questions in which it is the primary `concept`, spanning >= 4 distinct angles, including at least one `identify` and at least one of `contrast`/`not`.
- Chapter total >= 110 questions (more is better; aim 120-150 for big chapters like 8, 9, 10, 11).
- All 10 official practice questions present with `source: "official"`.
- 3-6 activities, each referencing an existing concept; `order` items must be in the TRUE order; `sort` buckets 2-4 with 6-12 items; `match` 4-8 pairs.

## Quality rules (non-negotiable)
1. Exactly one defensible correct answer per question. Re-read the inventory before finalizing each answer. No trick questions that hinge on wording ambiguity.
2. Distractors are REAL terms/concepts from this chapter (or adjacent chapters) that a half-prepared student would pick — never nonsense words, never obviously silly options. Mirror the official questions' style.
3. Vary where the correct answer sits (the app shuffles, but keep it varied anyway). Options similar in length and grammatical form. No "All of the above"/"None of the above" except in at most 3 questions per chapter.
4. Scenario stems must contain the cues needed to decide, and must not accidentally match two concepts. Invent company names; use Canadian context (Calgary, Edmonton, Loblaws, Canadian Tire, Tim Hortons, Shoppers Drug Mart, WestJet, Lululemon, etc.).
5. Explanations teach: state the rule, then why the top distractor fails. Never just "This is the definition."
6. Cover the figures/tables cell by cell where the inventory says MEMORIZE (e.g., ask about each PLC stage × each row; each adopter category's percentage and descriptor; each pricing approach's bucket; each intermediary function; each wholesaler subtype).
7. Include "why"/condition questions (e.g., when skimming works; why segment; why intermediaries reduce transactions) and "apply" questions (what should the firm do).
8. Numbers in `calc` questions must compute exactly; show the arithmetic in the explanation.
9. Do not copy copyrighted textbook prose beyond short definitions. Do not include URLs.
10. Keep stems under ~90 words; options under ~25 words each.

## Workflow
1. Read the three input files for your chapter completely.
2. Write `chNN_meta.json` (topics, concepts with ALL fields filled thoughtfully, activities).
3. Write questions in batches of <= 40 per file. Track angle coverage per concept as you go.
4. Run `python tools/validate.py NN`; fix errors; re-run until `OK`.
5. Report: concept count, question count, any inventory items you deliberately merged or omitted (should be none).
