#!/usr/bin/env python3
"""Cross-chapter QA over merged content/ch*.json. Usage: python tools/qa.py [--sample N] [--seed S]"""
import glob
import json
import os
import random
import re
import sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
sample_n = int(args[args.index("--sample") + 1]) if "--sample" in args else 0
seed = int(args[args.index("--seed") + 1]) if "--seed" in args else 7
random.seed(seed)

chapters = []
for f in sorted(glob.glob(os.path.join(ROOT, "content", "ch*.json"))):
    with open(f, encoding="utf-8") as fh:
        chapters.append(json.load(fh))

ids = Counter()
stems = defaultdict(list)
flags = defaultdict(list)
pos = Counter()
longest = 0
mc_total = 0
aota = 0
per_chapter = {}
for ch in chapters:
    n = ch["chapter"]
    qd = Counter(); ang = Counter()
    for c in ch["concepts"]:
        ids[c["id"]] += 1
    for a in ch["activities"]:
        ids[a["id"]] += 1
    for q in ch["questions"]:
        ids[q["id"]] += 1
        key = re.sub(r"\W+", " ", q["stem"].lower()).strip()[:120]
        stems[key].append(q["id"])
        qd[q["difficulty"]] += 1; ang[q["angle"]] += 1
        opts = q["options"]
        if q["type"] != "tf":
            mc_total += 1
            pos[q["answer"]] += 1
            lens = [len(o) for o in opts]
            if lens[q["answer"]] == max(lens) and lens[q["answer"]] > 1.35 * sorted(lens)[-2]:
                longest += 1
                flags["answer_much_longer"].append(q["id"])
            if any(re.search(r"\b(all|none) of (the above|these)", o, re.I) for o in opts):
                aota += 1
        text = q["stem"] + " " + q["explanation"] + " ".join(opts)
        if re.search(r"\(XX\)|\bXX\b", text):
            flags["xx_marker"].append(q["id"])
        if re.search(r"https?://|www\.", text):
            flags["url"].append(q["id"])
        if re.search(r"\b(option|choice|answer)\s+[A-Ea-e]\b|\bthe (first|second|third|fourth|last) (option|choice)\b", q["explanation"], re.I):
            flags["position_reference"].append(q["id"])
        if q["type"] == "tf" and q["stem"].strip().endswith("?"):
            flags["tf_question_mark"].append(q["id"])
        if q["type"] == "fill" and "____" not in q["stem"]:
            flags["fill_no_blank"].append(q["id"])
        if len(q["stem"].split()) > 95:
            flags["long_stem"].append(q["id"])
        if any(len(o.split()) > 28 for o in opts):
            flags["long_option"].append(q["id"])
        # correct option text appearing verbatim in stem (giveaway)
        ans = opts[q["answer"]].lower()
        if q["type"] != "tf" and len(ans) > 6 and ans in q["stem"].lower() and q["angle"] not in ("why", "apply", "not", "calc", "order"):
            flags["answer_in_stem"].append(q["id"])
        if not q["explanation"].rstrip().endswith((".", ")", "!", "?")):
            flags["explanation_no_period"].append(q["id"])
    per_chapter[n] = {"title": ch["title"], "concepts": len(ch["concepts"]), "questions": len(ch["questions"]), "activities": len(ch["activities"]),
                      "official": sum(1 for q in ch["questions"] if q["source"] == "official"), "diff": dict(sorted(qd.items())), "angles": dict(sorted(ang.items())),
                      "figures": sum(1 for c in ch["concepts"] if c.get("figure"))}

print("=== Per chapter ===")
for n, v in per_chapter.items():
    print(f"Ch {n:>2} {v['title'][:40]:<40} concepts={v['concepts']:>2} questions={v['questions']:>3} official={v['official']} activities={v['activities']} figures={v['figures']:>2} diff={v['diff']}")
    print(f"       angles={v['angles']}")
tq = sum(v["questions"] for v in per_chapter.values()); tc = sum(v["concepts"] for v in per_chapter.values()); ta = sum(v["activities"] for v in per_chapter.values())
print(f"TOTAL concepts={tc} questions={tq} activities={ta}")
print("\n=== Global checks ===")
dups = [k for k, v in ids.items() if v > 1]
print("duplicate ids:", dups or "none")
dstems = {k: v for k, v in stems.items() if len(v) > 1}
print("duplicate stems:", len(dstems), list(dstems.values())[:5])
print("answer position distribution (mc/fill):", dict(sorted(pos.items())), "of", mc_total)
print(f"answer much longer than runner-up: {longest} ({longest * 100 // max(1, mc_total)}%)")
print("all/none of the above:", aota)
for k, v in flags.items():
    print(f"flag {k}: {len(v)} e.g. {v[:8]}")

if sample_n:
    print("\n=== Random sample ===")
    for ch in chapters:
        qs = [q for q in ch["questions"] if q["source"] != "official"]
        for q in random.sample(qs, min(sample_n, len(qs))):
            c = next(x for x in ch["concepts"] if x["id"] == q["concept"])
            print(f"\n[{q['id']}] ({q['type']}/{q['angle']}/d{q['difficulty']}) concept={c['term']}")
            print("  Q:", q["stem"])
            for i, o in enumerate(q["options"]):
                print(f"   {'*' if i == q['answer'] else ' '} {o}")
            print("  E:", q["explanation"])
