"""Phase 4b/4c probe: Castra, the shop, the Senate (ladder + phalerae), the battle report scroll, the duel verdict,
the fury meter and the Imperator's Favor, the promotion ceremony. Usage: python tools/shots_phase4b.py <base> <outdir>"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots_phase4b")
os.makedirs(OUT, exist_ok=True)
errors = []
FIND_CORRECT = """() => { const opts = [...document.querySelectorAll('.option .opt-text')].map(o => o.textContent.trim()); const a = window.__app;
  for (const ch of a.content.chapters) for (const q of ch.questions) { if (q.options.length === opts.length && q.options.every(o => opts.includes(o.trim()))) return opts.indexOf(q.options[q.answer].trim()) + 1; } return 1; }"""
def shot(pg, name): pg.screenshot(path=os.path.join(OUT, name + ".png"))
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page(); pg.set_default_timeout(15000)
    pg.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.goto(BASE, wait_until="load"); pg.wait_for_timeout(300)
    if pg.locator("input[type=text]").count():
        pg.fill("input[type=text]", "Austin"); pg.click("text=Join the legion"); pg.wait_for_selector(".hq, .castra")
    pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.state.settings.examDate = new Date(Date.now() + 20 * 3600000).toISOString().slice(0, 16); a.store.flush(); }")
    pg.evaluate("localStorage.setItem('mark201.cosmetic.v1', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('mark201.cosmetic.v1') || '{}'), { denarii: 150 })))")
    # 1. Castra
    pg.goto(BASE + "#/home", wait_until="load"); pg.wait_for_timeout(1200)
    print("castra:", pg.locator(".castra").count(), "orders:", pg.locator(".order").count(), "soldiers:", pg.locator(".soldier").count(), "waypoints:", pg.locator(".waypoint").count(), "clepsydra:", pg.locator(".clepsydra").count(), pg.locator(".clepsydra").first.inner_text() if pg.locator(".clepsydra").count() else "")
    shot(pg, "castra")
    pg.evaluate("document.querySelectorAll('.scene-stage').forEach(s => s.style.visibility = 'hidden')"); pg.screenshot(path=os.path.join(OUT, "castra_full.png"), full_page=True); pg.evaluate("document.querySelectorAll('.scene-stage').forEach(s => s.style.visibility = '')")
    # 2. the shop: buy a white crest, equip it
    pg.goto(BASE + "#/settings", wait_until="load"); pg.wait_for_timeout(500)
    items = pg.locator(".shop-item"); print("shop items:", items.count())
    pg.locator(".shop-item", has_text="White horsehair").first.click(); pg.wait_for_timeout(300)
    print("equipped white:", pg.locator(".shop-item.on", has_text="White horsehair").count(), "denarii now:", pg.locator("[data-denarii]").first.inner_text())
    pg.locator(".shop").first.scroll_into_view_if_needed(); shot(pg, "shop")
    # 3. the Senate
    pg.goto(BASE + "#/progress", wait_until="load"); pg.wait_for_timeout(800)
    print("ladder rungs:", pg.locator(".rung").count(), "phalerae:", pg.locator(".phalera").count(), "on:", pg.locator(".phalera.on").count())
    pg.locator(".cuirass").first.scroll_into_view_if_needed(); pg.wait_for_timeout(300); shot(pg, "senate_phalerae")
    pg.locator(".ladder").first.scroll_into_view_if_needed(); shot(pg, "senate_ladder")
    # 4. fury: eight correct in a row in a drill
    pg.goto(BASE + "#/drill", wait_until="load"); pg.wait_for_timeout(300); pg.click("text=March out"); pg.wait_for_selector(".qcard")
    favor = False
    for i in range(10):
        pg.wait_for_selector(".option:not([disabled])", timeout=8000); k = pg.evaluate(FIND_CORRECT); pg.keyboard.press(str(k)); pg.wait_for_timeout(300)
        if pg.locator(".favor").count(): favor = True; shot(pg, "favor"); break
        pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
    print("imperator's favor fired:", favor, "fury el:", pg.locator(".fury").count())
    # 5. the battle report after a 20 Q exam
    pg.goto(BASE + "#/exam", wait_until="load"); pg.wait_for_timeout(300); pg.click("text=20 Q"); pg.click("text=Give battle"); pg.wait_for_selector(".qcard")
    for i in range(24):
        if pg.locator(".option:not([disabled])").count() == 0: pg.wait_for_timeout(400); continue
        if not pg.locator(".qcard").count(): break
        k = pg.evaluate(FIND_CORRECT) if i % 3 else 1; pg.keyboard.press(str(k)); pg.wait_for_timeout(350)
    pg.wait_for_selector(".report", timeout=15000); pg.wait_for_timeout(500)
    print("casualty rows:", pg.locator(".casualty").count(), "broke:", pg.locator(".casualty.broke").count()); shot(pg, "battle_report")
    # 6. the duel verdict
    pg.goto(BASE + "#/arcade/duel", wait_until="load"); pg.wait_for_timeout(300); pg.click("text=Duel!"); pg.wait_for_selector(".qcard")
    for i in range(20):
        if pg.locator(".verdict-box").count(): break
        if pg.locator(".option:not([disabled])").count(): k = pg.evaluate(FIND_CORRECT); pg.keyboard.press(str(k)); pg.wait_for_timeout(250); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
        else: pg.wait_for_timeout(300)
    print("duel verdict:", pg.locator(".verdict-box").count(), pg.locator(".verdict-box h3").first.inner_text() if pg.locator(".verdict-box").count() else "-"); shot(pg, "duel_verdict")
    # 7. the ceremony
    pg.goto(BASE + "#/home", wait_until="load"); pg.wait_for_timeout(400)
    pg.evaluate("() => import('./app/cutscene.js').then(m => m.ceremony(window.__app, { title: 'Miles', xp: 300 }))"); pg.wait_for_timeout(1600)
    print("ceremony:", pg.locator(".cutscene.ceremony.show").count()); shot(pg, "ceremony"); pg.keyboard.press("Enter")
    ctx.close(); b.close()
print("ERRORS:" if errors else "No console/page errors.")
for e in errors: print(" -", e)
