#!/usr/bin/env python3
"""Contrast audit: screenshots key routes in both themes and estimates the contrast ratio of every visible text
element from the rendered pixels (max vs min luminance inside the element's box, an upper bound on the real
text/background contrast, so anything reported under 4.5:1 is a genuine failure).
Usage: python tools/contrast_audit.py [base_url] [out_dir]"""
import json, os, sys
from playwright.sync_api import sync_playwright
from PIL import Image

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots", "contrast")
os.makedirs(OUT, exist_ok=True)

def lum(rgb):
    def ch(c):
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb[:3]
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)

def ratio(l1, l2):
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)

JS_COLLECT = """() => {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let n;
  while ((n = walker.nextNode())) {
    const t = (n.textContent || '').trim(); if (t.length < 2) continue;
    const el = n.parentElement; if (!el || seen.has(el)) continue;
    if (el.closest('.scene-stage, .battle-band, canvas, script, style, .toasts, svg')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) < 0.5) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
    seen.add(el);
    const path = [];
    let p = el;
    for (let i = 0; i < 4 && p && p !== document.body; i++) { path.unshift(p.tagName.toLowerCase() + (p.className && typeof p.className === 'string' ? '.' + p.className.trim().split(/\s+/).slice(0, 3).join('.') : '')); p = p.parentElement; }
    out.push({ text: t.slice(0, 60), x: r.left, y: r.top, w: r.width, h: r.height, color: cs.color, size: parseFloat(cs.fontSize), weight: cs.fontWeight, path: path.join(' > ') });
  }
  return out;
}"""

def audit_page(pg, label, results):
    pg.wait_for_timeout(350)
    items = pg.evaluate(JS_COLLECT)
    shot = os.path.join(OUT, label + ".png")
    pg.screenshot(path=shot, full_page=False)
    im = Image.open(shot).convert("RGB")
    W, H = im.size
    for it in items:
        x0, y0 = max(0, int(it["x"])), max(0, int(it["y"]))
        x1, y1 = min(W, int(it["x"] + it["w"])), min(H, int(it["y"] + it["h"]))
        if x1 - x0 < 3 or y1 - y0 < 3: continue
        box = im.crop((x0, y0, x1, y1))
        px = list(box.getdata())
        if len(px) > 20000:
            px = px[::max(1, len(px) // 20000)]
        lums = sorted(lum(p) for p in px)
        if not lums: continue
        # ignore the extreme 0.5% to drop stray pixels (icons, borders)
        k = max(0, int(len(lums) * 0.005))
        lo, hi = lums[k], lums[-1 - k]
        r = ratio(hi, lo)
        large = it["size"] >= 24 or (it["size"] >= 18.66 and int(it["weight"] if it["weight"].isdigit() else 400) >= 700)
        need = 3.0 if large else 4.5
        results.append({"page": label, "ratio": round(r, 2), "need": need, "ok": r >= need, "text": it["text"], "path": it["path"], "color": it["color"], "size": it["size"]})

with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    ctx = b.new_context(viewport={"width": 1280, "height": 2600})
    pg = ctx.new_page()
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from testlib import gate_create, cleanup, test_name
    NAME = test_name("audit")
    gate_create(pg, BASE, NAME); pg.wait_for_timeout(400)
    pg.goto(BASE + "#/home", wait_until="load"); pg.wait_for_selector(".castra, .hq", timeout=15000)
    pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.state.settings.motion = false; a.store.flush(); a.applySettings(); }")
    results = []
    for theme in ["dark", "light"]:
        pg.evaluate(f"() => {{ const a = window.__app; a.state.settings.theme = '{theme}'; a.store.flush(); a.applySettings(); }}")
        for route, name in [("#/home", "home"), ("#/campaign", "campaign"), ("#/learn", "learn"), ("#/progress", "progress"), ("#/settings", "settings"), ("#/arcade", "arcade"), ("#/exam", "exam"), ("#/drill", "drill")]:
            pg.goto(BASE + route, wait_until="load"); pg.wait_for_timeout(500)
            audit_page(pg, f"{theme}_{name}", results)
        # a drill question answered (feedback panel + insight table)
        pg.goto(BASE + "#/drill", wait_until="load"); pg.wait_for_timeout(300)
        pg.click("text=March out"); pg.wait_for_selector(".qcard", timeout=10000); pg.wait_for_timeout(300)
        audit_page(pg, f"{theme}_question", results)
        pg.keyboard.press("2"); pg.wait_for_timeout(500)
        audit_page(pg, f"{theme}_feedback", results)
        # open every seal so the insight text is on screen
        for s in pg.locator(".seal").all():
            try: s.click(); pg.wait_for_timeout(80)
            except Exception: pass
        audit_page(pg, f"{theme}_feedback_seals", results)
        # a lesson slide with a table
        pg.goto(BASE + "#/learn/8/mark201-c08-plc-stages", wait_until="load"); pg.wait_for_timeout(500)
        for _ in range(3): pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(250)
        audit_page(pg, f"{theme}_lesson_visual", results)
        pg.goto(BASE + "#/dash", wait_until="load"); pg.wait_for_timeout(700); audit_page(pg, f"{theme}_forum", results)
        pg.evaluate("window.__app.openCourse('fin201', '#/home')"); pg.wait_for_timeout(1500)
        pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.state.settings.motion = false; a.store.flush(); a.applySettings(); }")
        pg.goto(BASE + "#/learn/vault", wait_until="load"); pg.wait_for_timeout(500); audit_page(pg, f"{theme}_fin_vault", results)
        first = pg.evaluate("window.__app.content.chapters[0].chapter")
        pg.goto(BASE + f"#/learn/{first}", wait_until="load"); pg.wait_for_timeout(500); audit_page(pg, f"{theme}_fin_card", results)
        pg.goto(BASE + "#/drill", wait_until="load"); pg.wait_for_timeout(300); audit_page(pg, f"{theme}_fin_drill_cfg", results)
        pg.click("text=March out"); pg.wait_for_selector(".qcard, .intro-note", timeout=15000)
        for _ in range(12):
            if pg.locator(".num-in").count(): break
            if pg.locator("text=Got it, quiz me").count(): pg.locator("text=Got it, quiz me").first.click(); pg.wait_for_timeout(150); continue
            pg.keyboard.press("1"); pg.wait_for_timeout(120); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
        audit_page(pg, f"{theme}_fin_numeric", results)
        if pg.locator(".num-in").count():
            pg.fill(".num-in", "1"); pg.keyboard.press("Enter"); pg.wait_for_timeout(300); audit_page(pg, f"{theme}_fin_numeric_feedback", results)
        pg.evaluate("window.__app.openCourse('mark201', '#/home')"); pg.wait_for_timeout(1200)
        pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.state.settings.motion = false; a.store.flush(); a.applySettings(); }")
    b.close()
fails = [r for r in results if not r["ok"]]
with open(os.path.join(OUT, "report.json"), "w", encoding="utf-8") as fh: json.dump(results, fh, indent=1)
print("cleanup:", cleanup(NAME))
print(f"{len(results)} text elements checked, {len(fails)} below AA")
by = {}
for f in fails: by.setdefault(f["page"], []).append(f)
for page, fs in by.items():
    print(f"\n== {page}: {len(fs)} failures")
    for f in sorted(fs, key=lambda x: x["ratio"])[:25]:
        print(f"  {f['ratio']:5.2f} (need {f['need']}) {f['color']:>22} {f['size']:>4}px  {f['path'][-70:]}  '{f['text'][:40]}'")
