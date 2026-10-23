"""Probe for the post-Phase-3 fixes: a figure question shows its figure, the trap slide shows its source question,
the province view reads I -> V -> Siege. Usage: python tools/shots_fixes3.py <base> <outdir>"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots_fixes3")
os.makedirs(OUT, exist_ok=True)
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])  # plain headless for the 2D pages; a WebGL browser for the table below
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page(); pg.set_default_timeout(15000)
    pg.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.goto(BASE, wait_until="load"); pg.wait_for_timeout(300)
    if pg.locator("input[type=text]").count():
        pg.fill("input[type=text]", "Austin"); pg.click("text=Join the legion"); pg.wait_for_selector(".hq")
    pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.store.flush(); }")
    # 1. a figure question: drill the PLC stage table concept until a stem mentions Figure 8-3
    pg.goto(BASE + "#/drill/concepts/c08-plc-stage-table,c08-maturity", wait_until="load"); pg.wait_for_timeout(600)
    if pg.locator("text=March out").count(): pg.click("text=March out")
    pg.wait_for_selector(".qcard, .intro-note, .runner", timeout=8000)
    found = False
    for i in range(16):
        if pg.locator(".qfigure").count(): found = True; break
        if pg.locator(".intro-note").count(): pg.keyboard.press("Enter"); pg.wait_for_timeout(300); continue
        if pg.locator(".option:not([disabled])").count(): pg.keyboard.press("1"); pg.wait_for_timeout(250); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
        else: pg.wait_for_timeout(300)
    print("figure panel found:", found, "| label:", pg.locator(".qfigure .eyebrow").first.inner_text() if found else "-")
    pg.screenshot(path=os.path.join(OUT, "figure_question.png"))
    # 2. the trap slide in the Archives for the first concept
    pg.goto(BASE + "#/learn/1/c01-marketing-definition", wait_until="load"); pg.wait_for_selector(".slide", timeout=8000); pg.wait_for_timeout(400)
    for i in range(4):
        if pg.locator(".trap-ref").count(): break
        pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(350)
    print("trap slide shows a source question:", pg.locator(".trap-ref").count() == 1, "| stem:", (pg.locator(".trap-stem").first.inner_text()[:70] if pg.locator(".trap-ref").count() else "-"))
    pg.screenshot(path=os.path.join(OUT, "trap_slide.png"))
    # 3. the province view with a planted standard (simulate progress on battle I), in a WebGL-capable browser
    pg.evaluate("() => { const a = window.__app; const t = a.content.chapters[0].topics[0]; a.state.campaign.topics[t.id] = { cleared: Date.now() }; a.store.flush(); }")
    ctx.close(); b.close()
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.goto(BASE, wait_until="load"); pg.wait_for_timeout(300)
    if pg.locator("input[type=text]").count():
        pg.fill("input[type=text]", "Austin"); pg.click("text=Join the legion"); pg.wait_for_selector(".hq")
    pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; const t = a.content.chapters[0].topics[0]; a.state.campaign.topics[t.id] = { cleared: Date.now() }; a.store.flush(); }")
    pg.goto(BASE + "#/campaign/1", wait_until="load")
    pg.wait_for_selector(".wartable-canvas", timeout=30000); pg.wait_for_timeout(3200)
    print("road strip nodes:", pg.locator(".rs-node").count(), "next:", pg.locator(".rs-node.next .rs-title").first.inner_text() if pg.locator(".rs-node.next").count() else "-")
    print("fort labels:", pg.locator(".mlabel.small").count(), "faded:", pg.locator(".mlabel.faded").count())
    pg.screenshot(path=os.path.join(OUT, "province_3d.png"))
    pg.evaluate("document.querySelector('.map-frame').scrollIntoView()"); pg.wait_for_timeout(300)
    pg.screenshot(path=os.path.join(OUT, "province_3d_map.png"))
    ctx.close(); b.close()
print("ERRORS:" if errors else "No console/page errors.")
for e in errors: print(" -", e)
