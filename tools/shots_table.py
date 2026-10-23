"""Phase 3 probe: the 3D war table (headless WebGL via SwiftShader) and the 2.5D fallback.
Usage: python tools/shots_table.py <base> <outdir>"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots_table")
os.makedirs(OUT, exist_ok=True)
errors = []

def setup(pg, cosmetic=None):
    pg.goto(BASE, wait_until="load"); pg.wait_for_timeout(300)
    if pg.locator("input[type=text]").count():
        pg.fill("input[type=text]", "Austin"); pg.click("text=Join the legion"); pg.wait_for_selector(".hq")
    pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.store.flush(); }")
    if cosmetic is not None:
        pg.evaluate("(c) => localStorage.setItem('mark201.cosmetic.v1', JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('mark201.cosmetic.v1') || '{}'), c)))", cosmetic)

with sync_playwright() as p:
    b = p.chromium.launch(args=["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    for tag, w, hgt in [("1440", 1440, 900), ("390", 390, 844)]:
        ctx = b.new_context(viewport={"width": w, "height": hgt}, device_scale_factor=1)
        pg = ctx.new_page()
        pg.on("console", lambda m, tag=tag: errors.append(f"[{tag}] console: {m.text}") if m.type == "error" else None)
        pg.on("pageerror", lambda e, tag=tag: errors.append(f"[{tag}] pageerror: {e}"))
        setup(pg)
        pg.goto(BASE + "#/campaign", wait_until="load")
        try:
            pg.wait_for_selector(".wartable-canvas", timeout=30000); pg.wait_for_timeout(2500)
            print(tag, "3D table mounted; labels:", pg.locator(".mlabel").count(), "mode:", pg.evaluate("document.querySelector('.map-frame').classList.contains('loading') ? 'loading' : 'ready'"))
            pg.screenshot(path=os.path.join(OUT, f"{tag}_overview.png"))
            # hover Italia (its label), then click it
            lab = pg.locator(".mlabel[data-id='p1']")
            if lab.count(): lab.hover(); pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(OUT, f"{tag}_hover.png")); lab.click()
            pg.wait_for_timeout(700); pg.screenshot(path=os.path.join(OUT, f"{tag}_dolly_mid.png"))
            pg.wait_for_timeout(1800); pg.screenshot(path=os.path.join(OUT, f"{tag}_province.png"))
            print(tag, "province url:", pg.evaluate("location.hash"), "fort labels:", pg.locator(".mlabel.small").count())
            f = pg.locator(".mlabel[data-id='f1']")
            if f.count(): f.click(); pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(OUT, f"{tag}_fort_card.png")); print(tag, "card title:", pg.locator(".sheet-card h2").first.inner_text())
            pg.go_back(); pg.wait_for_timeout(1600); pg.screenshot(path=os.path.join(OUT, f"{tag}_back.png"))
            print(tag, "after back:", pg.evaluate("location.hash"), "mode:", pg.evaluate("document.querySelector('.wartable') ? 'mounted' : 'gone'"))
            fps = pg.evaluate("() => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(Math.round(n / 2)); })(); })")
            print(tag, "fps (swiftshader):", fps)
        except Exception as e:
            print(tag, "3D failed:", str(e)[:200]); pg.screenshot(path=os.path.join(OUT, f"{tag}_3d_failed.png"))
        ctx.close()
    b.close()
    # the 2.5D fallback (toggle off), in a plain headless browser
    b = p.chromium.launch(args=["--disable-gpu"])
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page(); pg.set_default_timeout(15000)
    pg.on("console", lambda m: errors.append(f"[fallback] console: {m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"[fallback] pageerror: {e}"))
    setup(pg, {"warTable3d": False})
    pg.goto(BASE + "#/campaign", wait_until="load"); pg.wait_for_selector(".map25 .worldmap", timeout=15000); pg.wait_for_timeout(800)
    print("fallback labels:", pg.locator(".mlabel").count())
    pg.screenshot(path=os.path.join(OUT, "fallback_overview.png"))
    pg.locator(".mlabel[data-id='p1']").click(); pg.wait_for_timeout(250)
    try: pg.screenshot(path=os.path.join(OUT, "fallback_zooming.png"), timeout=8000)
    except Exception as e: print("zooming shot skipped:", str(e)[:80])
    pg.wait_for_timeout(1200); print("fallback province:", pg.evaluate("location.hash"))
    try: pg.screenshot(path=os.path.join(OUT, "fallback_province.png"), timeout=15000)
    except Exception as e: print("province shot skipped:", str(e)[:80])
    pg.goto(BASE + "#/home", wait_until="load"); pg.wait_for_timeout(1200); pg.screenshot(path=os.path.join(OUT, "fallback_home.png"))
    ctx.close(); b.close()
print("ERRORS:" if errors else "No console/page errors.")
for e in errors: print(" -", e)
