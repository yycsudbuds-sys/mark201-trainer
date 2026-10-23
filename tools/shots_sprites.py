"""Drive the battle engine directly: every province's enemy line, testudo, cavalry, the rout, and the siege breach.
Usage: python tools/shots_sprites.py <base> <outdir>"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots_sprites")
os.makedirs(OUT, exist_ok=True)
PROVINCES = ["italia", "hispania", "gallia", "britannia", "germania", "graecia", "asia", "aegyptus", "default"]
MAKE = """async ([prov, mode, needed]) => {
  document.querySelectorAll('.battle-band').forEach(b => b.remove());
  const m = await import('./app/battle.js');
  const b = m.createBattle({ province: prov, mode, needed, motion: true });
  b.style.left = '0'; document.body.appendChild(b); document.body.classList.add('has-band'); b.show(); window.__band = b; return b.enemyName;
}"""
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
    pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.goto(BASE, wait_until="load"); pg.wait_for_timeout(300)
    if pg.locator("input[type=text]").count():
        pg.fill("input[type=text]", "Austin"); pg.click("text=Join the legion"); pg.wait_for_selector(".castra, .hq")
    for prov in PROVINCES:
        name = pg.evaluate(MAKE, [prov, "field", 0]); pg.wait_for_timeout(500)
        pg.evaluate("window.__band.advance(1)"); pg.wait_for_timeout(380)
        pg.locator(".battle-band").screenshot(path=os.path.join(OUT, f"field_{prov}.png"))
        print(prov, "->", name)
    # reactions on one province
    pg.evaluate(MAKE, ["gallia", "field", 0]); pg.wait_for_timeout(400)
    pg.evaluate("window.__band.advance(1); window.__band.advance(2); window.__band.advance(3)"); pg.wait_for_timeout(500)
    pg.locator(".battle-band").screenshot(path=os.path.join(OUT, "react_testudo.png"))
    pg.evaluate("window.__band.advance(5)"); pg.wait_for_timeout(650)
    pg.locator(".battle-band").screenshot(path=os.path.join(OUT, "react_cavalry.png"))
    pg.evaluate("window.__band.setback(); window.__band.plantFlag('a'); window.__band.plantFlag('b')"); pg.wait_for_timeout(450)
    pg.locator(".battle-band").screenshot(path=os.path.join(OUT, "react_setback.png"))
    pg.evaluate("window.__band.clearFlag('a'); window.__band.win()"); pg.wait_for_timeout(1300)
    pg.locator(".battle-band").screenshot(path=os.path.join(OUT, "react_win.png"))
    # the siege
    for prov in ["gallia", "aegyptus"]:
        pg.evaluate(MAKE, [prov, "siege", 10]); pg.wait_for_timeout(500)
        pg.locator(".battle-band").screenshot(path=os.path.join(OUT, f"siege_{prov}_start.png"))
        for i in range(6): pg.evaluate("window.__band.hit()"); pg.wait_for_timeout(260)
        pg.wait_for_timeout(500); pg.evaluate("window.__band.miss(); window.__band.randomTaunt()"); pg.wait_for_timeout(700)
        pg.locator(".battle-band").screenshot(path=os.path.join(OUT, f"siege_{prov}_arrows.png"))
        pg.evaluate("window.__band.breach(); window.__band.surrender()"); pg.wait_for_timeout(900)
        pg.locator(".battle-band").screenshot(path=os.path.join(OUT, f"siege_{prov}_breach1.png"))
        pg.wait_for_timeout(2200)
        pg.locator(".battle-band").screenshot(path=os.path.join(OUT, f"siege_{prov}_breach2.png"))
    # motion off: one still frame, no loop
    pg.evaluate("() => { const a = window.__app; a.state.settings.motion = false; a.applySettings(); }")
    pg.evaluate(MAKE, ["germania", "field", 0]); pg.wait_for_timeout(300)
    pg.evaluate("window.__band.setMotion(false); window.__band.advance(1); window.__band.setback()"); pg.wait_for_timeout(300)
    pg.locator(".battle-band").screenshot(path=os.path.join(OUT, "motion_off.png"))
    pg.evaluate("() => { const a = window.__app; a.state.settings.motion = true; a.applySettings(); }")
    b.close()
print("ERRORS:" if errors else "No console/page errors.")
for e in errors: print(" -", e)
