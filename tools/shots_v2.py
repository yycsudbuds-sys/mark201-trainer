import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
SH = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots_v2")
os.makedirs(SH, exist_ok=True)
errs = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    ctx = b.new_context(viewport={"width": 1280, "height": 900})
    pg = ctx.new_page()
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto(BASE, wait_until="load")
    pg.wait_for_selector("input[type=text]")
    pg.fill("input[type=text]", "Austin")
    pg.click("text=Start training")
    pg.wait_for_selector(".hq")
    pg.evaluate("""() => { const a = window.__app; const st = a.state; const ch1 = a.index.chapter.get(1); ch1.topics.forEach(t => st.campaign.topics[t.id] = {cleared: Date.now()}); st.campaign.bosses[1] = {cleared: Date.now(), best: 0.95}; const ch6 = a.index.chapter.get(6); st.campaign.topics[ch6.topics[0].id] = {cleared: Date.now()}; st.campaign.topics[ch6.topics[1].id] = {cleared: Date.now()}; a.store.flush(); }""")
    shots = [
        ("#/campaign", "world2", 1200, []),
        ("#/campaign/6", "island6", 1000, []),
        ("#/learn/8/c08-adoption-curve", "learn_adopt2", 1500, ["ArrowRight", "ArrowRight"]),
        ("#/learn/7/c07-core-product", "learn_total", 1200, ["ArrowRight", "ArrowRight"]),
        ("#/learn/10/c10-intermediary-value", "learn_contacts", 2200, ["ArrowRight", "ArrowRight"]),
        ("#/learn/12/c12-advocacy-funnel", "learn_funnel", 1500, ["ArrowRight", "ArrowRight"]),
        ("#/learn/9/c09-elasticity", "learn_elastic", 1500, ["ArrowRight", "ArrowRight"]),
        ("#/learn/8/c08-ansoff", "learn_ansoff", 1500, ["ArrowRight", "ArrowRight"]),
    ]
    for route, name, wait, keys in shots:
        pg.goto(BASE + route, wait_until="load")
        pg.wait_for_timeout(500)
        for k in keys:
            pg.keyboard.press(k)
            pg.wait_for_timeout(300)
        pg.wait_for_timeout(wait)
        pg.screenshot(path=os.path.join(SH, name + ".png"), full_page=False)
    m = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2).new_page()
    m.on("pageerror", lambda e: errs.append("mobile " + str(e)))
    m.goto(BASE + "#/campaign/8", wait_until="load")
    m.wait_for_timeout(300)
    if m.locator("input[type=text]").count():
        m.fill("input[type=text]", "M")
        m.click("text=Start training")
        m.wait_for_timeout(300)
        m.goto(BASE + "#/campaign/8", wait_until="load")
        m.wait_for_timeout(800)
    m.screenshot(path=os.path.join(SH, "m_island.png"), full_page=True)
    m.goto(BASE + "#/campaign/8/t08-1/read", wait_until="load")
    m.wait_for_timeout(700)
    m.keyboard.press("ArrowRight")
    m.wait_for_timeout(800)
    m.screenshot(path=os.path.join(SH, "m_lesson.png"), full_page=True)
    print("mobile overflow:", m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"))
    b.close()
print("ERRORS:", errs or "none")
