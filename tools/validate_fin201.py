#!/usr/bin/env python3
"""Validate and merge FIN 201 chapter content parts (kb/FIN201_CONTENT_SPEC.md).

Usage: python tools/validate_fin201.py NN   (NN = 08..13)
Merges content/fin201/parts/chNN_meta.json + chNN_q*.json into content/fin201/chNN.json, checks schema,
coverage, and recomputes every numeric `check` expression. Exit code 1 on errors.
"""
import glob
import json
import math
import os
import re
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANGLES = {"define", "identify", "apply", "contrast", "not", "why", "calc", "order", "interpret", "formula"}
TYPES = {"mc", "tf", "fill", "numeric", "multistep"}
ACT_TYPES = {"order", "sort", "match"}
UNITS = {"$", "%", "years", "shares", "x", ""}
MIN_PER_CHAPTER = {"08": 330, "09": 220, "10": 260, "11": 150, "12": 160, "13": 140}
CHECK_RE = re.compile(r"^[0-9eE+\-*/().,\s]*(?:sqrt|ln|exp|max|min|abs|pow|[0-9eE+\-*/().,\s])*$")
SAFE = {"sqrt": math.sqrt, "ln": math.log, "exp": math.exp, "max": max, "min": min, "abs": abs, "pow": pow}

INVENTORY = {
    "08": {"t08-1": ["c08-hpr", "c08-arith-vs-geo", "c08-compound-value"], "t08-2": ["c08-book-market-liquidation", "c08-quote-screen", "c08-debt-vs-equity", "c08-markets-trading", "c08-preferred-stock"], "t08-3": ["c08-pe-comparables", "c08-ev-multiples", "c08-why-comparables"], "t08-4": ["c08-constant-dividend", "c08-gordon-growth", "c08-required-return-components", "c08-growing-annuity"], "t08-5": ["c08-nonconstant-timeline", "c08-two-stage", "c08-solve-backwards"], "t08-6": ["c08-plowback-growth", "c08-forward-pe", "c08-npvgo", "c08-implied-growth"], "t08-7": ["c08-fcf-ev", "c08-fcfe", "c08-working-capital", "c08-which-model"], "t08-8": ["c08-efficiency-forms", "c08-inefficiency-profit", "c08-noise-behaviour"]},
    "09": {"t09-1": ["c09-arr"], "t09-2": ["c09-payback", "c09-discounted-payback"], "t09-3": ["c09-npv-rule", "c09-npv-steps"], "t09-4": ["c09-irr-rule", "c09-npv-profile", "c09-multiple-irr", "c09-financing-flows", "c09-ranking-conflict", "c09-crossover", "c09-mirr"], "t09-5": ["c09-pi", "c09-pi-vs-npv"], "t09-6": ["c09-project-relationships", "c09-capital-rationing"], "t09-7": ["c09-eav", "c09-ccr-lcm"]},
    "10": {"t10-1": ["c10-incremental", "c10-sunk-opportunity", "c10-side-effects-financing", "c10-five-categories"], "t10-2": ["c10-ocf"], "t10-3": ["c10-nwc"], "t10-4": ["c10-cca-schedule", "c10-half-year-aii", "c10-dts", "c10-pvcca", "c10-net-acquisitions"], "t10-5": ["c10-recapture-terminal-loss", "c10-capital-gain-cfat", "c10-pool-open-closed"], "t10-6": ["c10-expansion-npv", "c10-replacement-npv", "c10-cost-cutting", "c10-bid-price", "c10-timing-of-sale"], "t10-7": ["c10-eac-taxes", "c10-nominal-real"]},
    "11": {"t11-1": ["c11-forecasting-risk", "c11-sensitivity", "c11-scenario", "c11-simulation", "c11-npv-breakeven"], "t11-2": ["c11-cash-breakeven", "c11-accounting-breakeven", "c11-financial-breakeven", "c11-dol"], "t11-3": ["c11-real-options", "c11-decision-trees", "c11-abandonment-expansion"]},
    "12": {"t12-1": ["c12-required-return-cost-of-capital", "c12-risk-aversion-premium", "c12-history-lessons"], "t12-2": ["c12-expected-return-states", "c12-variance-states", "c12-historical-sd", "c12-normal-distribution", "c12-risk-return-diagram"], "t12-3": ["c12-portfolio-weights-return", "c12-portfolio-sd", "c12-covariance-correlation", "c12-diversification-benefit", "c12-diversification-limit"]},
    "13": {"t13-1": ["c13-risk-free-cal", "c13-sharpe-cml", "c13-market-portfolio"], "t13-2": ["c13-systematic-unsystematic", "c13-beta", "c13-portfolio-beta"], "t13-3": ["c13-capm", "c13-sml-alpha", "c13-sigma-vs-beta", "c13-portfolio-building", "c13-cost-of-capital-link"]},
}


def load(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def evaluate(expr):
    """Evaluate a plain arithmetic check expression. Raises on anything that is not arithmetic."""
    if not isinstance(expr, str) or not expr.strip():
        raise ValueError("empty check")
    e = expr.replace("^", "**").replace("×", "*").replace("÷", "/").replace("−", "-").replace(",", "")
    if not re.fullmatch(r"[0-9eE+\-*/().\s]*(?:(?:sqrt|ln|exp|max|min|abs|pow)\s*\(|[0-9eE+\-*/().\s,])*", e):
        raise ValueError(f"check has unexpected tokens: {expr}")
    return float(eval(e, {"__builtins__": {}}, SAFE))  # noqa: S307 (restricted names, validated characters)


def within(value, target, tol):
    tol = tol or {}
    a = tol.get("abs"); r = tol.get("rel")
    if a is None and r is None:
        a = 0.01
    ok = False
    if a is not None and abs(value - target) <= a + 1e-9:
        ok = True
    if r is not None and abs(value - target) <= abs(target) * r + 1e-9:
        ok = True
    return ok


def main(nn, partial=False):
    """partial=True: schema and arithmetic checks only (no volume/coverage minimums); a missing meta is
    replaced by the fixed inventory so question writers can validate before the meta exists."""
    errors, warnings = [], []
    parts = os.path.join(ROOT, "content", "fin201", "parts")
    meta_path = os.path.join(parts, f"ch{nn}_meta.json")
    if not os.path.exists(meta_path):
        if not partial:
            print(f"ERROR: missing {meta_path}")
            return 1
        inv0 = INVENTORY.get(nn, {})
        meta = {"chapter": int(nn), "title": f"Chapter {int(nn)}", "topics": [{"id": t, "order": i + 1, "title": t, "summary": "pending", "concepts": c} for i, (t, c) in enumerate(inv0.items())],
                "concepts": [{"id": c, "topic": t, "term": c, "definition": "pending", "explain": "pending", "example": "pending", "contrast": "pending", "trap": "pending", "mnemonic": "", "formula": "", "given": False, "archetypes": [], "weight": 2, "figure": None} for t, cs in inv0.items() for c in cs],
                "activities": [], "formulas": [{"id": "pending", "name": "pending", "formula": "", "given": True, "concepts": [], "when": "", "trap": ""}]}
        print("(partial) meta not written yet: validating questions against the fixed inventory")
    else:
        try:
            meta = load(meta_path)
        except Exception as e:  # noqa: BLE001
            print(f"ERROR: meta JSON invalid: {e}")
            return 1
    qfiles = sorted(glob.glob(os.path.join(parts, f"ch{nn}_q*.json")), key=lambda p: int(re.search(r"_q(\d+)\.json$", p).group(1)))
    questions = []
    for qf in qfiles:
        try:
            arr = load(qf)
        except Exception as e:  # noqa: BLE001
            errors.append(f"{os.path.basename(qf)}: invalid JSON: {e}")
            continue
        if not isinstance(arr, list):
            errors.append(f"{os.path.basename(qf)}: must be a JSON array")
            continue
        if len(arr) > 40:
            warnings.append(f"{os.path.basename(qf)}: {len(arr)} questions (>40)")
        questions.extend(arr)
    for key in ("chapter", "title", "topics", "concepts", "activities", "formulas"):
        if key not in meta:
            errors.append(f"meta missing key '{key}'")
    if errors:
        for e in errors:
            print("ERROR:", e)
        return 1

    chap = meta["chapter"]
    inv = INVENTORY.get(nn, {})
    cids = {}
    for c in meta["concepts"]:
        cid = c.get("id", "?")
        for k in ("id", "topic", "term", "definition", "explain", "example", "contrast", "trap", "mnemonic", "formula", "given", "archetypes", "weight"):
            if k not in c:
                errors.append(f"concept {cid} missing '{k}'")
        if not re.fullmatch(rf"c{nn}-[a-z0-9-]+", cid):
            errors.append(f"bad concept id '{cid}'")
        if cid in cids:
            errors.append(f"duplicate concept id {cid}")
        cids[cid] = c
        if not isinstance(c.get("archetypes"), list):
            errors.append(f"concept {cid}: archetypes must be a list")
        if c.get("weight") not in (1, 2, 3):
            errors.append(f"concept {cid}: weight must be 1|2|3")
        if not isinstance(c.get("given"), bool):
            errors.append(f"concept {cid}: given must be true|false")
        for k in ("definition", "explain", "example", "contrast", "trap"):
            if isinstance(c.get(k), str) and len(c[k].strip()) < 15 and c.get(k) != "pending":
                warnings.append(f"concept {cid}: '{k}' is very short")
        fig = c.get("figure")
        if fig is not None:
            if fig.get("type") not in ("table", "list"):
                errors.append(f"concept {cid}: figure.type must be table|list")
            if fig.get("type") == "table" and (not isinstance(fig.get("rows"), list) or not isinstance(fig.get("head"), list)):
                errors.append(f"concept {cid}: table figure needs head[] and rows[]")
            if fig.get("type") == "list" and not isinstance(fig.get("items"), list):
                errors.append(f"concept {cid}: list figure needs items[]")
    # the fixed inventory
    for tid, want in inv.items():
        for cid in want:
            if cid not in cids:
                errors.append(f"inventory concept {cid} (topic {tid}) is missing")
    tids = {}
    covered = Counter()
    for t in meta["topics"]:
        for k in ("id", "order", "title", "summary", "concepts"):
            if k not in t:
                errors.append(f"topic {t.get('id','?')} missing '{k}'")
        tid = t.get("id", "")
        if tid in tids:
            errors.append(f"duplicate topic id {tid}")
        tids[tid] = t
        if inv and tid not in inv:
            errors.append(f"topic {tid} is not in the fixed inventory")
        for cid in t.get("concepts", []):
            covered[cid] += 1
            if cid not in cids:
                errors.append(f"topic {tid} references unknown concept {cid}")
            if inv and tid in inv and cid not in inv[tid]:
                errors.append(f"concept {cid} is filed under {tid} but the inventory puts it elsewhere")
    for tid in inv:
        if tid not in tids:
            errors.append(f"inventory topic {tid} is missing")
    for cid, c in cids.items():
        if covered[cid] != 1:
            errors.append(f"concept {cid} appears in {covered[cid]} topics (must be exactly 1)")
        if c.get("topic") not in tids:
            errors.append(f"concept {cid} has unknown topic {c.get('topic')}")
    aids = set()
    for a in meta["activities"]:
        aid = a.get("id", "?")
        if aid in aids:
            errors.append(f"duplicate activity id {aid}")
        aids.add(aid)
        if not re.fullmatch(rf"a{nn}-\d{{2}}", aid):
            errors.append(f"bad activity id {aid}")
        if a.get("type") not in ACT_TYPES:
            errors.append(f"activity {aid}: bad type {a.get('type')}")
        if a.get("concept") not in cids:
            errors.append(f"activity {aid}: unknown concept {a.get('concept')}")
        for k in ("title", "prompt", "explanation"):
            if not a.get(k):
                errors.append(f"activity {aid}: missing {k}")
        if a.get("type") == "order" and (not isinstance(a.get("items"), list) or len(a["items"]) < 3):
            errors.append(f"activity {aid}: order needs >=3 items")
        if a.get("type") == "sort":
            b = a.get("buckets", []); items = a.get("items", [])
            if not 2 <= len(b) <= 4:
                errors.append(f"activity {aid}: sort needs 2-4 buckets")
            if not 6 <= len(items) <= 14:
                errors.append(f"activity {aid}: sort needs 6-14 items (has {len(items)})")
            for it in items:
                if not isinstance(it, dict) or not isinstance(it.get("bucket"), int) or not 0 <= it["bucket"] < len(b):
                    errors.append(f"activity {aid}: bad sort item {it}")
        if a.get("type") == "match":
            pairs = a.get("pairs", [])
            if not 4 <= len(pairs) <= 10:
                errors.append(f"activity {aid}: match needs 4-10 pairs (has {len(pairs)})")
            for p in pairs:
                if not isinstance(p, dict) or not p.get("left") or not p.get("right"):
                    errors.append(f"activity {aid}: bad pair {p}")
    if not 3 <= len(meta["activities"]) <= 8 and not partial:
        warnings.append(f"{len(meta['activities'])} activities (expected 3-6)")
    fids = set()
    for f in meta["formulas"]:
        fid = f.get("id", "?")
        if fid in fids:
            errors.append(f"duplicate formula id {fid}")
        fids.add(fid)
        for k in ("name", "formula", "given", "concepts", "when", "trap"):
            if k not in f:
                errors.append(f"formula {fid} missing '{k}'")
        for cid in f.get("concepts", []):
            if cid not in cids:
                errors.append(f"formula {fid}: unknown concept {cid}")
    if not meta["formulas"] and not partial:
        errors.append("formulas list is empty")

    qids = set()
    per_concept = defaultdict(list)
    stems = Counter()
    official = 0
    aota = 0
    diff = Counter()
    numeric_total = 0
    for q in questions:
        qid = q.get("id", "?")
        if not re.fullmatch(rf"q{nn}-\d{{3,4}}", qid):
            errors.append(f"bad question id '{qid}' (expected q{nn}-###)")
        if qid in qids:
            errors.append(f"duplicate question id {qid}")
        qids.add(qid)
        if q.get("concept") not in cids:
            errors.append(f"{qid}: unknown concept {q.get('concept')}")
        for a in q.get("also", []) or []:
            if a not in cids:
                errors.append(f"{qid}: unknown 'also' concept {a}")
        qtype = q.get("type")
        if qtype not in TYPES:
            errors.append(f"{qid}: bad type {qtype}")
        if q.get("angle") not in ANGLES:
            errors.append(f"{qid}: bad angle {q.get('angle')}")
        if q.get("difficulty") not in (1, 2, 3):
            errors.append(f"{qid}: difficulty must be 1|2|3")
        diff[q.get("difficulty")] += 1
        if q.get("source") not in ("official", "generated"):
            errors.append(f"{qid}: source must be official|generated")
        if q.get("source") == "official":
            official += 1
        if not q.get("ref"):
            errors.append(f"{qid}: missing ref")
        stem = q.get("stem", "")
        if not isinstance(stem, str) or len(stem.strip()) < 15:
            errors.append(f"{qid}: stem too short")
        if len(stem.split()) > 130:
            warnings.append(f"{qid}: stem is long ({len(stem.split())} words)")
        stems[re.sub(r"\W+", " ", stem.lower()).strip()] += 1
        expl = q.get("explanation", "")
        if not isinstance(expl, str) or len(expl.strip()) < 25:
            errors.append(f"{qid}: explanation too short")
        if qtype in ("numeric", "multistep"):
            numeric_total += 1
            if q.get("angle") != "calc":
                errors.append(f"{qid}: numeric questions must have angle calc")
            ans = q.get("answer")
            if not isinstance(ans, (int, float)):
                errors.append(f"{qid}: numeric answer must be a number")
                continue
            if q.get("unit") not in UNITS:
                errors.append(f"{qid}: unit must be one of {sorted(UNITS)}")
            tol = q.get("tolerance")
            if not isinstance(tol, dict) or not ({"abs", "rel"} & set(tol)):
                errors.append(f"{qid}: tolerance must be {{abs}} and/or {{rel}}")
            try:
                v = evaluate(q.get("check"))
                if not within(v, ans, tol if isinstance(tol, dict) else None):
                    errors.append(f"{qid}: check evaluates to {v:.6g} but answer is {ans}")
            except Exception as e:  # noqa: BLE001
                errors.append(f"{qid}: check failed: {e}")
            steps = q.get("steps")
            if not isinstance(steps, list) or (qtype == "multistep" and len(steps) < 2):
                errors.append(f"{qid}: steps must be a list (>=2 for multistep)")
            for i, s in enumerate(steps or []):
                if not isinstance(s, dict) or not s.get("label") or not isinstance(s.get("value"), (int, float)):
                    errors.append(f"{qid}: step {i+1} needs label and numeric value")
                    continue
                try:
                    v = evaluate(s.get("check"))
                    if not within(v, s["value"], s.get("tolerance") or {"rel": 0.002, "abs": 0.01}):
                        errors.append(f"{qid}: step {i+1} check evaluates to {v:.6g} but value is {s['value']}")
                except Exception as e:  # noqa: BLE001
                    errors.append(f"{qid}: step {i+1} check failed: {e}")
            if not isinstance(q.get("solution"), list) or len(q.get("solution") or []) < 1:
                errors.append(f"{qid}: solution lines required")
            if not isinstance(q.get("keystrokes"), list):
                errors.append(f"{qid}: keystrokes list required (may be short)")
            errs = q.get("errors")
            if not isinstance(errs, list) or len(errs) < 2:
                errors.append(f"{qid}: errors library needs >=2 entries")
            for i, er in enumerate(errs or []):
                if not isinstance(er, dict) or not er.get("id") or not er.get("label") or not er.get("explain") or not isinstance(er.get("value"), (int, float)):
                    errors.append(f"{qid}: error {i+1} needs id, label, value, explain")
                    continue
                if not re.fullmatch(r"[a-z0-9-]+", er["id"]):
                    errors.append(f"{qid}: error id {er['id']} must be kebab-case")
                try:
                    v = evaluate(er.get("check"))
                    if not within(v, er["value"], er.get("tolerance") or {"rel": 0.002, "abs": 0.01}):
                        errors.append(f"{qid}: error '{er['id']}' check evaluates to {v:.6g} but value is {er['value']}")
                except Exception as e:  # noqa: BLE001
                    errors.append(f"{qid}: error '{er.get('id')}' check failed: {e}")
                if within(er["value"], ans, tol if isinstance(tol, dict) else None):
                    errors.append(f"{qid}: error '{er['id']}' value equals the right answer")
        else:
            opts = q.get("options")
            if not isinstance(opts, list):
                errors.append(f"{qid}: options must be a list")
                continue
            if qtype == "tf":
                if opts != ["True", "False"]:
                    errors.append(f"{qid}: tf options must be ['True','False']")
            elif not 3 <= len(opts) <= 5:
                errors.append(f"{qid}: {len(opts)} options (expected 4-5)")
            if qtype == "fill" and "____" not in stem:
                errors.append(f"{qid}: fill stem must contain _____")
            ans = q.get("answer")
            if not isinstance(ans, int) or not 0 <= ans < len(opts):
                errors.append(f"{qid}: answer index out of range")
            lowered = [str(o).strip().lower() for o in opts]
            if len(set(lowered)) != len(lowered):
                errors.append(f"{qid}: duplicate options")
            if any("none of the above" in o or "all of the above" in o or "none of these" in o for o in lowered):
                aota += 1
        per_concept[q.get("concept")].append(q)

    for s, n in stems.items():
        if n > 1:
            errors.append(f"duplicate stem x{n}: {s[:70]}...")
    for cid, c in cids.items():
        qs = per_concept.get(cid, [])
        angles = {q.get("angle") for q in qs}
        numeric = [q for q in qs if q.get("type") in ("numeric", "multistep")]
        mc_calc = [q for q in qs if q.get("type") in ("mc", "fill") and q.get("angle") == "calc"]
        if partial:
            if qs:
                print(f"  {cid}: {len(qs)} questions, angles {sorted(angles)}, numeric {len(numeric)}, mc-calc {len(mc_calc)}")
            continue
        if len(qs) < 12:
            errors.append(f"concept {cid}: only {len(qs)} questions (need >=12)")
        if len(angles) < 5:
            errors.append(f"concept {cid}: only {len(angles)} angles {sorted(angles)} (need >=5)")
        if "identify" not in angles:
            errors.append(f"concept {cid}: needs an 'identify' question")
        if not ({"contrast", "not"} & angles):
            errors.append(f"concept {cid}: needs a 'contrast' or 'not' question")
        if not ({"why", "interpret"} & angles):
            errors.append(f"concept {cid}: needs a 'why' or 'interpret' question")
        if c.get("archetypes"):
            if len(numeric) < 3:
                errors.append(f"concept {cid}: has archetypes {c['archetypes']} but only {len(numeric)} numeric/multistep questions (need >=3)")
            if len(mc_calc) < 2:
                errors.append(f"concept {cid}: needs >=2 MC calc questions with error-library distractors (has {len(mc_calc)})")
    need = MIN_PER_CHAPTER.get(nn, 150)
    if len(questions) < need and not partial:
        errors.append(f"only {len(questions)} questions (need >={need})")
    if aota > 4:
        warnings.append(f"{aota} questions use none/all of the above (max 4)")
    total = sum(diff.values()) or 1
    print(f"Chapter {chap}: {len(cids)} concepts, {len(meta['topics'])} topics, {len(questions)} questions ({official} official, {numeric_total} numeric), {len(meta['activities'])} activities, {len(meta['formulas'])} formulas; difficulty 1:{diff[1]*100//total}% 2:{diff[2]*100//total}% 3:{diff[3]*100//total}%")
    print("Angles:", dict(sorted(Counter(q.get("angle") for q in questions).items())))
    for w in warnings:
        print("WARN:", w)
    for e in errors:
        print("ERROR:", e)
    if errors:
        print(f"FAILED with {len(errors)} errors")
        return 1
    if partial:
        print("OK (partial: schema and arithmetic only)")
        return 0
    merged = {"chapter": chap, "title": meta["title"], "topics": sorted(meta["topics"], key=lambda t: t["order"]), "concepts": meta["concepts"], "activities": meta["activities"], "formulas": meta["formulas"], "questions": questions}
    out = os.path.join(ROOT, "content", "fin201", f"ch{nn}.json")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(merged, fh, ensure_ascii=False, indent=1)
    print(f"OK -> {os.path.relpath(out, ROOT)}")
    return 0


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) != 1 or not re.fullmatch(r"\d{2}", args[0]):
        print(__doc__)
        sys.exit(2)
    sys.exit(main(args[0], partial="--partial" in sys.argv))
