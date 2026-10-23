import sys
from playwright.sync_api import sync_playwright
BASE = "https://yycsudbuds-sys.github.io/mark201-trainer/"
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"]); ctx = b.new_context(viewport={"width": 1280, "height": 900}); pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE, wait_until="load"); pg.wait_for_selector("input[type=text]", timeout=20000)
    pg.fill("input[type=text]", "Prod"); pg.click("text=Join the legion"); pg.wait_for_selector(".castra, .hq"); pg.evaluate("(() => { const s = window.__app.state; s.settings.briefings = false; window.__app.store.flush(); })()")
    print("content version:", pg.evaluate("window.__app.content.version"), "questions:", pg.evaluate("window.__app.content.stats.questions"))
    pg.wait_for_timeout(1500)
    print("service worker:", pg.evaluate("navigator.serviceWorker.getRegistration().then(r => r ? (r.active ? 'active' : 'installing') : 'none')"))
    fonts = pg.evaluate("document.fonts.check('700 16px Cinzel') && document.fonts.check('400 16px \"EB Garamond\"')")
    print("display/body fonts loaded:", fonts)
    pg.goto(BASE + "#/drill", wait_until="load"); pg.click("text=March out"); pg.wait_for_selector(".qcard")
    for i in range(5):
        pg.locator(".option:not([disabled])").first.click(); pg.wait_for_timeout(150)
        pg.locator(".runner-foot .btn.primary").first.click(); pg.wait_for_timeout(150)
    print("answered 5 in prod drill; xp:", pg.evaluate("window.__app.state.xp"))
    # light theme via settings UI
    pg.goto(BASE + "#/settings", wait_until="load"); pg.wait_for_timeout(200)
    pg.locator(".seg button", has_text="Day march").first.click(); pg.wait_for_timeout(300)
    print("theme attr:", pg.evaluate("document.documentElement.dataset.theme"), "bg:", pg.evaluate("getComputedStyle(document.body).backgroundColor"))
    pg.goto(BASE + "#/home", wait_until="load"); pg.wait_for_timeout(300)
    pg.screenshot(path=sys.argv[1] + "/prod_light_home.png", full_page=False)
    # offline test: block network and reload
    ctx.set_offline(True)
    try:
        pg.reload(wait_until="load"); pg.wait_for_timeout(800)
        print("offline reload ok, hero present:", pg.locator(".castra, .hq").count() > 0)
    except Exception as e:
        print("offline reload failed:", str(e)[:120])
    ctx.set_offline(False)
    b.close()
print("ERRORS:", errors if errors else "none")
