"""Screenshot the key routes at 1440x900, 1024x768 and 390x844. Usage: python tools/shots_sizes.py <base> <outdir> [label]
Also reports console/page errors and horizontal overflow per size."""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots_sizes")
LABEL = sys.argv[3] if len(sys.argv) > 3 else ""
os.makedirs(OUT, exist_ok=True)
ROUTES = [("home", "#/home"), ("campaign", "#/campaign"), ("province", "#/campaign/1"), ("lesson", "#/campaign/1/t01-1/read"), ("battle", "#/campaign/1/t01-1/drill"),
          ("drill", "#/drill"), ("exam", "#/exam"), ("arcade", "#/arcade"), ("build", "#/arcade/build"), ("learn", "#/learn"), ("sheet", "#/learn/9/sheet"), ("progress", "#/progress"), ("settings", "#/settings")]
SIZES = [("1440", 1440, 900), ("1024", 1024, 768), ("390", 390, 844)]
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    for tag, w, hgt in SIZES:
        ctx = b.new_context(viewport={"width": w, "height": hgt}, device_scale_factor=1)
        pg = ctx.new_page()
        pg.on("console", lambda m, tag=tag: errors.append(f"[{tag}] console: {m.text}") if m.type == "error" else None)
        pg.on("pageerror", lambda e, tag=tag: errors.append(f"[{tag}] pageerror: {e}"))
        pg.goto(BASE, wait_until="load")
        pg.wait_for_timeout(300)
        if pg.locator("input[type=text]").count():
            pg.fill("input[type=text]", "Austin")
            pg.click("text=Join the legion")
            pg.wait_for_selector(".hq")
        pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.store.flush(); }")
        for name, route in ROUTES:
            pg.goto(BASE + route, wait_until="load")
            pg.wait_for_timeout(700 if name in ("lesson", "battle", "campaign", "province") else 350)
            if name == "battle":
                pg.wait_for_selector(".qcard", timeout=8000)
                pg.wait_for_timeout(400)
            pg.screenshot(path=os.path.join(OUT, f"{LABEL}{tag}_{name}.png"), full_page=(name not in ("battle", "lesson")))
            ov = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
            if ov:
                errors.append(f"[{tag}] horizontal overflow on {name}")
        ctx.close()
    b.close()
print("ERRORS:" if errors else "No console/page errors, no horizontal overflow.")
for e in errors:
    print(" -", e)
