"""Phase 4a probe: thumbs for true/false, wax slots for blanks, the wager, the abacus, the arch, the ropes,
bronze tablet quiz mode, the mnemonic seal and page turn. Usage: python tools/shots_phase4a.py <base> <outdir>"""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots_phase4a")
os.makedirs(OUT, exist_ok=True)
errors = []
def shot(pg, name): pg.screenshot(path=os.path.join(OUT, name + ".png"))
def start_drill(pg, concepts):
    pg.goto(BASE + "#/drill/concepts/" + ",".join(concepts), wait_until="load"); pg.wait_for_timeout(500)
    if pg.locator("text=March out").count(): pg.click("text=March out")
    pg.wait_for_selector(".qcard, .intro-note", timeout=8000)
def until(pg, selector, tries=14):
    for _ in range(tries):
        if pg.locator(selector).count(): return True
        if pg.locator(".intro-note").count(): pg.keyboard.press("Enter"); pg.wait_for_timeout(300); continue
        if pg.locator(".option:not([disabled])").count(): pg.keyboard.press("1"); pg.wait_for_timeout(220); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
        else: pg.wait_for_timeout(300)
    return pg.locator(selector).count() > 0

with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    ctx = b.new_context(viewport={"width": 1440, "height": 900}); pg = ctx.new_page(); pg.set_default_timeout(15000)
    pg.on("console", lambda m: errors.append(f"console: {m.text}") if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
    pg.goto(BASE, wait_until="load"); pg.wait_for_timeout(300)
    if pg.locator("input[type=text]").count():
        pg.fill("input[type=text]", "Austin"); pg.click("text=Join the legion"); pg.wait_for_selector(".castra, .hq")
    pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.store.flush(); }")
    ids = pg.evaluate("""() => { const a = window.__app; const out = { tf: [], fill: [], calc: [], order: null, match: null };
      for (const ch of a.content.chapters) { for (const q of ch.questions) { if (q.type === 'tf' && out.tf.length < 2) out.tf.push(q.concept); if (q.type === 'fill' && out.fill.length < 2) out.fill.push(q.concept); if (q.angle === 'calc' && out.calc.length < 2) out.calc.push(q.concept); }
        for (const act of ch.activities) { if (act.type === 'order' && !out.order) out.order = act.id; if (act.type === 'match' && !out.match) out.match = act.id; } }
      return out; }""")
    print("sample ids:", ids)
    # 1. thumbs
    start_drill(pg, ids["tf"]); ok = until(pg, ".option.thumb"); print("thumbs rendered:", ok); shot(pg, "tf_thumbs")
    if ok: pg.keyboard.press("w"); pg.wait_for_timeout(200); print("wager set:", pg.locator(".wager-coin.on").count() == 1); pg.keyboard.press("1"); pg.wait_for_timeout(500); shot(pg, "tf_answered"); print("denarii line:", pg.locator(".dn-gain").count(), pg.locator(".dn-gain").first.inner_text() if pg.locator(".dn-gain").count() else "-")
    # 2. wax slots
    start_drill(pg, ids["fill"]); ok = until(pg, ".wax-slot"); print("wax slots rendered:", ok); shot(pg, "fill_slots")
    if ok: pg.keyboard.press("2"); pg.wait_for_timeout(500); print("slot filled:", pg.locator(".wax-slot.filled").count() > 0, repr(pg.locator(".wax-slot").first.inner_text())); shot(pg, "fill_filled")
    # 3. abacus
    start_drill(pg, ids["calc"]); ok = until(pg, ".abacus"); print("abacus present:", ok)
    if ok: pg.keyboard.press("a"); pg.wait_for_timeout(200); pg.keyboard.type("1200/(40-16)"); pg.wait_for_timeout(200); print("abacus result:", pg.locator(".abacus-out").inner_text()); shot(pg, "calc_abacus")
    # 4. the arch
    pg.goto(BASE + "#/arcade/build/" + ids["order"], wait_until="load"); pg.wait_for_selector(".arch-block", timeout=8000); pg.wait_for_timeout(400); shot(pg, "arch_start")
    pg.evaluate("() => { const a = window.__app; }")
    # put the blocks in the right order by clicking arrows is slow; verify locking via the DOM: set the order then check
    n = pg.locator(".arch-block").count(); print("arch blocks:", n)
    pg.click("text=Check the arch"); pg.wait_for_timeout(700); shot(pg, "arch_checked"); print("arch locked:", pg.locator(".arch.locked").count())
    # 5. the ropes
    pg.goto(BASE + "#/arcade/build/" + ids["match"], wait_until="load"); pg.wait_for_selector(".match-item", timeout=8000); pg.wait_for_timeout(400)
    lefts = pg.locator(".match-grid .col:first-child .match-item"); rights = pg.locator(".match-grid .col:last-child .match-item")
    for i in range(min(3, lefts.count())): lefts.nth(i).click(); pg.wait_for_timeout(120); rights.nth(i).click(); pg.wait_for_timeout(200)
    print("ropes drawn:", pg.locator(".rope:not(.live)").count()); shot(pg, "ropes")
    # 6. bronze tablets
    pg.goto(BASE + "#/learn/8/sheet", wait_until="load"); pg.wait_for_selector(".sheet-figure.bronze", timeout=8000); pg.wait_for_timeout(300)
    btn = pg.locator(".bq-col").first; btn.click(); pg.wait_for_timeout(300); print("hidden cells:", pg.locator("td.cell-hidden").count())
    pg.locator("td.cell-hidden").first.click(); pg.wait_for_timeout(200); print("revealed:", pg.locator("td.revealed").count())
    pg.locator(".sheet-figure.bronze").first.scroll_into_view_if_needed(); pg.wait_for_timeout(200); shot(pg, "bronze_quiz")
    # 7. mnemonic seal + page turn
    pg.goto(BASE + "#/learn/1/c01-marketing-definition", wait_until="load"); pg.wait_for_selector(".slide", timeout=8000); pg.wait_for_timeout(500)
    print("seal callout:", pg.locator(".seal-callout").count()); shot(pg, "lesson_seal")
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(120); shot(pg, "lesson_turn_mid"); pg.wait_for_timeout(500)
    # 8. settings switch present and the denarii chip
    pg.goto(BASE + "#/settings", wait_until="load"); pg.wait_for_timeout(400); print("wager switch:", pg.locator("text=Confidence wagers").count(), "denarii chip:", pg.locator("[data-denarii]").count(), pg.locator("[data-denarii]").inner_text())
    ctx.close(); b.close()
print("ERRORS:" if errors else "No console/page errors.")
for e in errors: print(" -", e)
