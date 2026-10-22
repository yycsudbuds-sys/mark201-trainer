#!/usr/bin/env python3
"""Validate and merge chapter content parts.

Usage: python tools/validate.py NN   (NN = two-digit chapter, e.g. 07)
Merges content/parts/chNN_meta.json + content/parts/chNN_q*.json into content/chNN.json
and reports schema/coverage errors. Exit code 1 on errors.
"""
import glob
import json
import os
import re
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ANGLES = {"define", "identify", "apply", "contrast", "not", "why", "calc", "order"}
TYPES = {"mc", "tf", "fill"}
ACT_TYPES = {"order", "sort", "match"}


def load(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def main(nn):
    errors, warnings = [], []
    parts = os.path.join(ROOT, "content", "parts")
    meta_path = os.path.join(parts, f"ch{nn}_meta.json")
    if not os.path.exists(meta_path):
        print(f"ERROR: missing {meta_path}")
        return 1
    try:
        meta = load(meta_path)
    except Exception as e:  # noqa: BLE001
        print(f"ERROR: meta JSON invalid: {e}")
        return 1
    qfiles = sorted(glob.glob(os.path.join(parts, f"ch{nn}_q*.json")),
                    key=lambda p: int(re.search(r"_q(\d+)\.json$", p).group(1)))
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

    for key in ("chapter", "title", "topics", "concepts", "activities"):
        if key not in meta:
            errors.append(f"meta missing key '{key}'")
    if errors:
        for e in errors:
            print("ERROR:", e)
        return 1

    chap = meta["chapter"]
    cids = {}
    for c in meta["concepts"]:
        for k in ("id", "topic", "term", "definition", "explain", "example", "contrast", "trap", "mnemonic"):
            if k not in c:
                errors.append(f"concept {c.get('id','?')} missing '{k}'")
        cid = c.get("id", "")
        if not re.fullmatch(rf"c{nn}-[a-z0-9-]+", cid):
            errors.append(f"bad concept id '{cid}' (expected c{nn}-slug)")
        if cid in cids:
            errors.append(f"duplicate concept id {cid}")
        cids[cid] = c
        for k in ("definition", "explain", "example", "contrast", "trap"):
            if isinstance(c.get(k), str) and len(c[k].strip()) < 15:
                warnings.append(f"concept {cid}: '{k}' is very short")
        fig = c.get("figure")
        if fig is not None:
            if fig.get("type") not in ("table", "list"):
                errors.append(f"concept {cid}: figure.type must be table|list")
            if fig.get("type") == "table" and (not isinstance(fig.get("rows"), list) or not isinstance(fig.get("head"), list)):
                errors.append(f"concept {cid}: table figure needs head[] and rows[]")
            if fig.get("type") == "list" and not isinstance(fig.get("items"), list):
                errors.append(f"concept {cid}: list figure needs items[]")

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
        for cid in t.get("concepts", []):
            covered[cid] += 1
            if cid not in cids:
                errors.append(f"topic {tid} references unknown concept {cid}")
    for cid, c in cids.items():
        if covered[cid] != 1:
            errors.append(f"concept {cid} appears in {covered[cid]} topics (must be exactly 1)")
        if c.get("topic") not in tids:
            errors.append(f"concept {cid} has unknown topic {c.get('topic')}")
    if not 3 <= len(meta["topics"]) <= 6:
        warnings.append(f"{len(meta['topics'])} topics (expected 3-6)")
    if not 18 <= len(cids) <= 32:
        warnings.append(f"{len(cids)} concepts (expected 18-30)")

    aids = set()
    for a in meta["activities"]:
        aid = a.get("id", "?")
        if aid in aids:
            errors.append(f"duplicate activity id {aid}")
        aids.add(aid)
        if a.get("type") not in ACT_TYPES:
            errors.append(f"activity {aid}: bad type {a.get('type')}")
        if a.get("concept") not in cids:
            errors.append(f"activity {aid}: unknown concept {a.get('concept')}")
        for k in ("title", "prompt", "explanation"):
            if not a.get(k):
                errors.append(f"activity {aid}: missing {k}")
        if a.get("type") == "order":
            if not isinstance(a.get("items"), list) or len(a["items"]) < 3:
                errors.append(f"activity {aid}: order needs >=3 items")
        if a.get("type") == "sort":
            b = a.get("buckets", [])
            if not 2 <= len(b) <= 4:
                errors.append(f"activity {aid}: sort needs 2-4 buckets")
            items = a.get("items", [])
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
    if not 3 <= len(meta["activities"]) <= 8:
        warnings.append(f"{len(meta['activities'])} activities (expected 3-6)")

    qids = set()
    per_concept = defaultdict(list)
    stems = Counter()
    official = 0
    aota = 0
    diff = Counter()
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
        if q.get("type") not in TYPES:
            errors.append(f"{qid}: bad type {q.get('type')}")
        if q.get("angle") not in ANGLES:
            errors.append(f"{qid}: bad angle {q.get('angle')}")
        if q.get("difficulty") not in (1, 2, 3):
            errors.append(f"{qid}: difficulty must be 1|2|3")
        diff[q.get("difficulty")] += 1
        if q.get("source") not in ("official", "generated"):
            errors.append(f"{qid}: source must be official|generated")
        if q.get("source") == "official":
            official += 1
        stem = q.get("stem", "")
        if not isinstance(stem, str) or len(stem.strip()) < 15:
            errors.append(f"{qid}: stem too short")
        if len(stem.split()) > 120:
            warnings.append(f"{qid}: stem is long ({len(stem.split())} words)")
        stems[re.sub(r"\W+", " ", stem.lower()).strip()] += 1
        opts = q.get("options")
        if not isinstance(opts, list):
            errors.append(f"{qid}: options must be a list")
            continue
        if q.get("type") == "tf":
            if opts != ["True", "False"]:
                errors.append(f"{qid}: tf options must be ['True','False']")
        elif not 3 <= len(opts) <= 5:
            errors.append(f"{qid}: {len(opts)} options (expected 4-5)")
        if q.get("type") == "fill" and "_____" not in stem and "____" not in stem:
            errors.append(f"{qid}: fill stem must contain _____")
        ans = q.get("answer")
        if not isinstance(ans, int) or not 0 <= ans < len(opts):
            errors.append(f"{qid}: answer index out of range")
        lowered = [str(o).strip().lower() for o in opts]
        if len(set(lowered)) != len(lowered):
            errors.append(f"{qid}: duplicate options")
        if any("all of the above" in o or "none of the above" in o or "none of these" in o for o in lowered):
            aota += 1
        expl = q.get("explanation", "")
        if not isinstance(expl, str) or len(expl.strip()) < 25:
            errors.append(f"{qid}: explanation too short")
        per_concept[q.get("concept")].append(q)

    for s, n in stems.items():
        if n > 1:
            errors.append(f"duplicate stem x{n}: {s[:70]}...")
    for cid in cids:
        qs = per_concept.get(cid, [])
        angles = {q.get("angle") for q in qs}
        if len(qs) < 5:
            errors.append(f"concept {cid}: only {len(qs)} questions (need >=5)")
        if len(angles) < 4:
            errors.append(f"concept {cid}: only {len(angles)} angles {sorted(angles)} (need >=4)")
        if "identify" not in angles:
            errors.append(f"concept {cid}: needs an 'identify' question")
        if not ({"contrast", "not"} & angles):
            errors.append(f"concept {cid}: needs a 'contrast' or 'not' question")
    if len(questions) < 110:
        errors.append(f"only {len(questions)} questions (need >=110)")
    if official < 10:
        errors.append(f"only {official} official questions (need 10)")
    if aota > 3:
        warnings.append(f"{aota} questions use all/none of the above (max 3)")
    total = sum(diff.values()) or 1
    print(f"Chapter {chap}: {len(cids)} concepts, {len(meta['topics'])} topics, {len(questions)} questions "
          f"({official} official), {len(meta['activities'])} activities; difficulty mix "
          f"1:{diff[1]*100//total}% 2:{diff[2]*100//total}% 3:{diff[3]*100//total}%")
    angle_tot = Counter(q.get("angle") for q in questions)
    print("Angles:", dict(sorted(angle_tot.items())))
    for w in warnings:
        print("WARN:", w)
    for e in errors:
        print("ERROR:", e)
    if errors:
        print(f"FAILED with {len(errors)} errors")
        return 1
    merged = {
        "chapter": chap,
        "title": meta["title"],
        "topics": sorted(meta["topics"], key=lambda t: t["order"]),
        "concepts": meta["concepts"],
        "activities": meta["activities"],
        "questions": questions,
    }
    out = os.path.join(ROOT, "content", f"ch{nn}.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(merged, fh, ensure_ascii=False, indent=1)
    print(f"OK -> {os.path.relpath(out, ROOT)}")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2 or not re.fullmatch(r"\d{2}", sys.argv[1]):
        print(__doc__)
        sys.exit(2)
    sys.exit(main(sys.argv[1]))
