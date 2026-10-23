"""Screenshot the war briefing (Legatus tent) at desktop and phone sizes. Usage: python tools/shots_cutscene.py <base> <outdir>"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots_cutscene")
os.makedirs(OUT, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    for tag, w, hgt in [("1440", 1440, 900), ("390", 390, 844)]:
        ctx = b.new_context(viewport={"width": w, "height": hgt})
        pg = ctx.new_page()
        pg.goto(BASE, wait_until="load"); pg.wait_for_timeout(300)
        if pg.locator("input[type=text]").count():
            pg.fill("input[type=text]", "Austin"); pg.click("text=Join the legion"); pg.wait_for_selector(".castra, .hq")
        pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = true; a.store.flush(); }")
        pg.goto(BASE + "#/campaign/1/t01-1/drill", wait_until="load")
        pg.wait_for_selector(".cutscene.show", timeout=8000); pg.wait_for_timeout(1400)
        pg.screenshot(path=os.path.join(OUT, f"{tag}_briefing.png"))
        pg.keyboard.press("Enter"); pg.wait_for_timeout(300); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(OUT, f"{tag}_briefing_2.png"))
        ctx.close()
    b.close()
print("done")
