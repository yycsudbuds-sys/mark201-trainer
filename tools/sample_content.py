#!/usr/bin/env python3
"""Generate synthetic sample content (for UI testing before real content exists).
Writes tools/sample/ch07.json and tools/sample/ch08.json in the real schema.
Usage: python tools/sample_content.py && python tools/build.py tools/sample
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "tools", "sample")
os.makedirs(OUT, exist_ok=True)
ANGLES = ["define", "identify", "apply", "contrast", "not", "why"]


def chapter(num, title, terms):
    nn = f"{num:02d}"
    topics, concepts, questions, activities = [], [], [], []
    per_topic = 3
    for ti in range(0, len(terms), per_topic):
        tid = f"t{nn}-{ti // per_topic + 1}"
        chunk = terms[ti:ti + per_topic]
        topics.append({"id": tid, "order": ti // per_topic + 1, "title": f"Topic {ti // per_topic + 1}: {chunk[0]}", "summary": f"Sample summary about {', '.join(chunk)}.", "concepts": [f"c{nn}-{slug(t)}" for t in chunk]})
        for t in chunk:
            cid = f"c{nn}-{slug(t)}"
            concepts.append({"id": cid, "topic": tid, "term": t, "definition": f"{t} is the sample definition used for testing the interface layout.", "explain": f"In plain English, {t} means something a beginner can understand in two sentences. This is filler.", "example": f"Example: a Calgary company uses {t} to win customers.", "contrast": f"Do not confuse {t} with its sibling concept; the difference is the focus.", "trap": f"Exam trap: questions about {t} hide the cue word in the second sentence.", "mnemonic": "Sample hook", "figure": {"type": "table", "title": "Sample table", "head": ["Stage", "Objective"], "rows": [["Intro", "Awareness"], ["Growth", "Differentiation"]]} if t.endswith("cycle") else None})
            for i, a in enumerate(ANGLES):
                qid = f"q{nn}-{len(questions) + 1:03d}"
                opts = [f"{t}", f"Distractor A for {t}", f"Distractor B for {t}", f"Distractor C for {t}"]
                questions.append({"id": qid, "concept": cid, "also": [], "type": "tf" if i == 5 else ("fill" if i == 4 else "mc"), "angle": a, "difficulty": (i % 3) + 1,
                                  "stem": (f"Statement about {t}: it is defined as the sample definition." if i == 5 else f"A sample scenario about _____ in Edmonton tests the {a} angle for this concept." if i == 4 else f"[{a}] A sample scenario sentence about an Edmonton firm that tests {t} from the {a} angle. Which concept is illustrated?"),
                                  "options": ["True", "False"] if i == 5 else opts, "answer": 0, "explanation": f"{t} is correct because the scenario matches its definition; the distractors describe neighbouring ideas.", "source": "official" if i == 0 else "generated"})
    activities.append({"id": f"a{nn}-01", "type": "order", "concept": concepts[0]["id"], "title": "Order the steps", "prompt": "Put the sample steps in order.", "items": ["Step one", "Step two", "Step three", "Step four", "Step five"], "explanation": "Because that is the order."})
    activities.append({"id": f"a{nn}-02", "type": "sort", "concept": concepts[1]["id"], "title": "Sort the items", "prompt": "Sort into buckets.", "buckets": ["Bucket A", "Bucket B", "Bucket C"], "items": [{"text": f"Item {i}", "bucket": i % 3} for i in range(9)], "explanation": "Sorted by remainder."})
    activities.append({"id": f"a{nn}-03", "type": "match", "concept": concepts[2]["id"], "title": "Match pairs", "prompt": "Match each term.", "pairs": [{"left": f"Term {i}", "right": f"Definition {i}"} for i in range(5)], "explanation": "Matched."})
    return {"chapter": num, "title": title, "topics": topics, "concepts": concepts, "activities": activities, "questions": questions}


def slug(t):
    return t.lower().replace(" ", "-")


if __name__ == "__main__":
    for num, title, terms in [(7, "Products and Brands", ["Total product", "Convenience product", "Brand equity", "Product line", "Intangibility", "Inventory cycle"]),
                              (8, "New Product Development", ["Product life cycle", "Harvesting", "Line extension", "Market development", "Commercialization", "Early adopters"])]:
        with open(os.path.join(OUT, f"ch{num:02d}.json"), "w", encoding="utf-8") as fh:
            json.dump(chapter(num, title, terms), fh, indent=1)
    print("sample content written to", OUT)
