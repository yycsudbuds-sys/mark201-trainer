"""Naming + lesson probe: nav labels, campaign map labels, every lesson slide kind, the concept map.
Usage: python tools/shots_names.py <base> <outdir>"""
import os, sys
from playwright.sync_api import sync_playwright
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots_names")
os.makedirs(OUT, exist_ok=True)
errors = []
def shot(pg, name, full=False): pg.screenshot(path=os.path.join(OUT, name + ".png"), full_page=full)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page(); pg.set_default_timeout(15000)
    pg.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.goto(BASE, wait_until="load"); pg.wait_for_timeout(300)
    if pg.locator("input[type=text]").count():
        pg.fill("input[type=text]", "Austin"); pg.click("text=Join the legion"); pg.wait_for_selector(".castra, .hq")
    pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.store.flush(); }")
    pg.wait_for_timeout(400); shot(pg, "home")
    print("nav mains:", pg.locator(".nav-main").all_inner_texts())
    print("nav subs:", pg.locator(".nav-sub").all_inner_texts())
    print("shield titles:", pg.locator(".cart h3").all_inner_texts())
    # campaign (2.5D map so labels are DOM)
    pg.evaluate("() => { const a = window.__app; const k='mark201.cosmetic.v1'; const c = JSON.parse(localStorage.getItem(k)||'{}'); c.warTable3d=false; localStorage.setItem(k, JSON.stringify(c)); }")
    pg.goto(BASE + "#/campaign", wait_until="load"); pg.wait_for_timeout(1200); shot(pg, "campaign")
    print("map labels:", [t.replace("\n", " | ") for t in pg.locator(".map-label").all_inner_texts()][:10])
    pg.goto(BASE + "#/campaign/1", wait_until="load"); pg.wait_for_timeout(1000); shot(pg, "campaign_ch1")
    print("road strip:", [t.replace("\n", " | ") for t in pg.locator(".rs-node").all_inner_texts()][:6])
    # lesson slides for one concept
    pg.goto(BASE + "#/campaign/1/t01-1/read", wait_until="load"); pg.wait_for_selector(".slide", timeout=8000); pg.wait_for_timeout(500)
    print("hook art:", pg.locator(".hook-art svg").count()); shot(pg, "lesson_1_hook")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(450); shot(pg, "lesson_2_recall")
    pg.keyboard.press(" "); pg.wait_for_timeout(300); print("recall revealed:", pg.locator(".recall-answer").count()); shot(pg, "lesson_2_recall_revealed")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(450); shot(pg, "lesson_3_explain")
    for _ in range(6): pg.keyboard.press(" "); pg.wait_for_timeout(120)
    print("explain lines shown:", pg.locator(".lines .line.shown").count(), "/", pg.locator(".lines .line").count(), "example visible:", pg.locator(".callout.example:not(.hidden-line)").count()); shot(pg, "lesson_3_explain_all")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(450); print("visual kinds:", "cmap" if pg.locator(".cmap").count() else "table" if pg.locator("table").count() else "flow" if pg.locator(".flow").count() else "bespoke"); shot(pg, "lesson_4_visual")
    if pg.locator(".cmap-stone").count():
        for i in range(pg.locator(".cmap-stone").count()): pg.locator(".cmap-stone").nth(i).click(); pg.wait_for_timeout(120)
        print("cmap complete:", pg.locator(".cmap.complete").count()); shot(pg, "lesson_4_cmap_done")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(450); shot(pg, "lesson_5_confuse")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(450); shot(pg, "lesson_6_check")
    pg.keyboard.press("1"); pg.wait_for_timeout(500); print("foot after answer:", pg.locator(".lesson-foot").inner_text().replace("\n", " | "))
    # find which visual kinds occur across all concepts (ch 1 and 9) via the DOM
    kinds = pg.evaluate("""async () => { const a = window.__app; const { visualFor } = await import('./app/visuals.js'); const out = {bespoke:0, table:0, list:0, cmap:0};
      for (const ch of a.content.chapters) for (const c of ch.concepts) { let v=null; try { v = visualFor(c, ch); } catch {} if (v) out.bespoke++; else if (c.figure && c.figure.type==='table' && c.figure.rows?.length) out.table++; else if (c.figure && c.figure.type==='list' && c.figure.items?.length) out.list++; else out.cmap++; } return out; }""")
    print("visual coverage across 230 concepts:", kinds)
    # mobile check of the lesson + nav
    ctx2 = b.new_context(viewport={"width": 390, "height": 844}); pm = ctx2.new_page()
    pm.on("pageerror", lambda e: errors.append(f"pageerror(m): {e}"))
    pm.goto(BASE, wait_until="load"); pm.wait_for_timeout(300)
    if pm.locator("input[type=text]").count(): pm.fill("input[type=text]", "Austin"); pm.click("text=Join the legion"); pm.wait_for_selector(".castra, .hq")
    pm.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.store.flush(); }")
    pm.goto(BASE + "#/campaign/1/t01-1/read", wait_until="load"); pm.wait_for_selector(".slide"); pm.wait_for_timeout(500); shot(pm, "m_lesson_hook")
    pm.keyboard.press("ArrowRight"); pm.wait_for_timeout(300); pm.keyboard.press("ArrowRight"); pm.wait_for_timeout(300); pm.keyboard.press("ArrowRight"); pm.wait_for_timeout(500); shot(pm, "m_lesson_visual")
    pm.goto(BASE + "#/home", wait_until="load"); pm.wait_for_timeout(500); print("bottom nav:", pm.locator(".bottom-nav a, .tabbar a").all_inner_texts()); shot(pm, "m_home")
    ctx.close(); ctx2.close(); b.close()
print("ERRORS:" if errors else "No console/page errors.")
for e in errors: print(" -", e)
