"""Phase 2 visual probe: field battle reactions, the siege (cracks, taunt, breach) and the Triumph.
Usage: python tools/shots_battle.py <base> <outdir>. Answers correctly by looking the question up in the content bundle."""
import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots_battle")
os.makedirs(OUT, exist_ok=True)
errors = []

FIND_CORRECT = """() => {
  const opts = [...document.querySelectorAll('.option .opt-text')].map(o => o.textContent.trim());
  const a = window.__app;
  for (const ch of a.content.chapters) for (const q of ch.questions) {
    if (q.options.length === opts.length && q.options.every(o => opts.includes(o.trim()))) { return opts.indexOf(q.options[q.answer].trim()) + 1; }
  }
  return 1;
}"""

def setup(pg):
    pg.goto(BASE, wait_until="load"); pg.wait_for_timeout(300)
    if pg.locator("input[type=text]").count():
        pg.fill("input[type=text]", "Austin"); pg.click("text=Join the legion"); pg.wait_for_selector(".hq")
    pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.store.flush(); }")

def answer(pg, correct=True, wait=700):
    pg.wait_for_selector(".option:not([disabled])", timeout=8000)
    k = pg.evaluate(FIND_CORRECT)
    n = pg.locator(".option").count()
    if not correct: k = 1 if k != 1 else 2
    pg.keyboard.press(str(min(n, k))); pg.wait_for_timeout(wait)

with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    for tag, w, hgt in [("1440", 1440, 900), ("1024", 1024, 768), ("390", 390, 844)]:
        ctx = b.new_context(viewport={"width": w, "height": hgt}, device_scale_factor=1)
        pg = ctx.new_page()
        pg.on("console", lambda m, tag=tag: errors.append(f"[{tag}] console: {m.text}") if m.type == "error" else None)
        pg.on("pageerror", lambda e, tag=tag: errors.append(f"[{tag}] pageerror: {e}"))
        setup(pg)
        # field battle: a correct answer (volley), then a wrong one (fall + flag)
        pg.goto(BASE + "#/campaign/1/t01-1/drill", wait_until="load"); pg.wait_for_selector(".qcard", timeout=8000); pg.wait_for_timeout(900)
        pg.screenshot(path=os.path.join(OUT, f"{tag}_field_start.png"))
        answer(pg, True, 350); pg.screenshot(path=os.path.join(OUT, f"{tag}_field_correct.png"))
        pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
        answer(pg, False, 420)
        if pg.locator(".battle-band.inline").count(): pg.locator(".battle-band.inline").first.scroll_into_view_if_needed(); pg.wait_for_timeout(200)
        pg.screenshot(path=os.path.join(OUT, f"{tag}_field_wrong.png"))
        pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
        for i in range(3):
            answer(pg, True, 250); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
        pg.screenshot(path=os.path.join(OUT, f"{tag}_field_streak.png"))
        if tag == "1440":
            # the siege: 24 questions, 90% takes the city
            pg.goto(BASE + "#/campaign/1/boss", wait_until="load"); pg.wait_for_selector(".qcard", timeout=8000); pg.wait_for_timeout(900)
            pg.screenshot(path=os.path.join(OUT, f"{tag}_siege_start.png"))
            answer(pg, True, 500); pg.screenshot(path=os.path.join(OUT, f"{tag}_siege_hit.png")); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
            answer(pg, False, 600); pg.screenshot(path=os.path.join(OUT, f"{tag}_siege_miss.png")); pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
            correct = 1; answered = 2; breached = False; mid = False
            for i in range(30):
                if pg.locator(".score-big").count() or pg.locator(".cutscene.triumph").count(): break
                if pg.locator(".option:not([disabled])").count() == 0: pg.wait_for_timeout(300); continue
                answer(pg, True, 220); answered += 1
                chip = pg.locator(".runner-head .chip").first.inner_text(); correct = int(chip.split("/")[0].strip())
                if correct >= 12 and not mid: mid = True; pg.wait_for_timeout(500); pg.screenshot(path=os.path.join(OUT, f"{tag}_siege_mid.png"))
                if correct >= 22 and not breached: breached = True; pg.wait_for_timeout(1800); pg.screenshot(path=os.path.join(OUT, f"{tag}_siege_breach.png"))
                pg.keyboard.press("Enter"); pg.wait_for_timeout(300)
            print("siege answered", answered, "correct", correct)
            if pg.locator(".cutscene.triumph").count() == 0:
                pg.wait_for_selector(".cutscene.triumph", timeout=8000)
            pg.wait_for_timeout(2500); pg.screenshot(path=os.path.join(OUT, f"{tag}_triumph.png"))
            pg.keyboard.press("Enter"); pg.wait_for_timeout(800); pg.screenshot(path=os.path.join(OUT, f"{tag}_siege_result.png"))
            print("result:", pg.locator(".score-big").first.inner_text() if pg.locator(".score-big").count() else "(none)")
        ctx.close()
    b.close()
print("ERRORS:" if errors else "No console/page errors.")
for e in errors: print(" -", e)
