"""FIN 201 probe: Forum -> FIN 201 -> cards, vault, map, drill with typed answers (right, wrong + diagnosis, steps),
siege fail -> retake the breach. Usage: python tools/probe_fin201.py [base]"""
import os, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from testlib import gate_create, calm, cleanup, test_name

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
SHOTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shots")
errors = []; results = []
def check(name, ok, detail=""):
    results.append(ok); print(("PASS " if ok else "FAIL ") + name + (" — " + str(detail) if detail else ""))
def shot(pg, name): pg.screenshot(path=os.path.join(SHOTS, name + ".png"), full_page=True)

name = test_name("fin")
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"]); ctx = b.new_context(viewport={"width": 1280, "height": 900}); pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None); pg.on("pageerror", lambda e: errors.append(str(e)))
    gate_create(pg, BASE, name); pg.wait_for_timeout(800)
    shot(pg, "f1_forum")
    cards = pg.locator(".course-card")
    check("Forum shows both course cards with Begin buttons", cards.count() == 2 and pg.locator(".course-card button.btn.ch").count() == 2)
    cards.nth(1).locator("button.btn.ch").click(); pg.wait_for_timeout(1500)
    check("FIN 201 opens on its first chapter", pg.evaluate("window.__app.course") == "fin201" and pg.evaluate("location.hash").startswith("#/campaign/"), pg.evaluate("location.hash"))
    calm(pg)
    pg.goto(BASE + "#/campaign", wait_until="load"); pg.wait_for_timeout(1500); shot(pg, "f2_campaign")
    check("finance map has one province per bundled chapter", pg.locator(".province").count() == pg.evaluate("window.__app.content.chapters.length"), pg.locator(".province").count())
    pg.goto(BASE + "#/learn", wait_until="load"); pg.wait_for_timeout(300); shot(pg, "f3_learn")
    check("Learn offers the Formula Vault", pg.locator("text=Formula Vault").count() >= 1)
    pg.goto(BASE + "#/learn/vault", wait_until="load"); pg.wait_for_timeout(300); shot(pg, "f4_vault")
    check("Vault lists formulas with Given/Memorise badges", pg.locator(".vault-row").count() > 10 and pg.locator(".vault-row .chip.good").count() > 0 and pg.locator(".vault-row .chip.warn").count() > 0, pg.locator(".vault-row").count())
    first = pg.evaluate("window.__app.content.chapters[0].chapter")
    pg.goto(BASE + f"#/learn/{first}", wait_until="load"); pg.wait_for_timeout(400); shot(pg, "f5_cards")
    check("finance lesson is one card per concept", pg.locator(".slide.card-slide").count() == 1 and "concept card" in pg.locator(".slide-head").inner_text().lower())
    pg.keyboard.press("ArrowRight"); pg.wait_for_timeout(300)
    check("ArrowRight moves to the next concept card", pg.locator(".slide.card-slide").count() == 1 and "2 of" in pg.locator(".lesson-top").inner_text())
    # drill: Unknown filter, typed answers
    pg.goto(BASE + "#/drill", wait_until="load"); pg.wait_for_timeout(300)
    pg.locator(".seg button", has_text="Unknown").click(); pg.wait_for_timeout(100)
    cnt = pg.locator(".drill-count").inner_text()
    check("drill filter shows the match count", ("concepts match" in cnt.lower()) and ("questions" in cnt.lower()), cnt.replace(chr(10), " "))
    shot(pg, "f6_drill_cfg")
    pg.click("text=March out"); pg.wait_for_selector(".qcard, .intro-note", timeout=15000)
    seen_numeric = 0; seen_mc = 0; diag_shot = False; steps_shot = False
    for i in range(14):
        pg.wait_for_selector(".qcard, .intro-note", timeout=15000)
        if pg.locator("text=Got it, quiz me").count(): pg.locator("text=Got it, quiz me").first.click(); pg.wait_for_timeout(150); pg.wait_for_selector(".qcard", timeout=15000)
        if pg.locator(".num-in").count():
            seen_numeric += 1
            cur = pg.evaluate("(() => { const r = document.querySelector('.runner'); const c = r && r.getCurrent && r.getCurrent(); return c ? { answer: c.question.answer, unit: c.question.unit, type: c.question.type, steps: (c.question.steps || []).map(s => s.value), errs: (c.question.errors || []).map(e => e.value) } : null; })()")
            if cur["type"] == "multistep" and pg.locator(".num-steps").count():
                for sv in cur["steps"]:
                    pg.wait_for_selector(".num-step.now .num-in", timeout=5000); pg.fill(".num-step.now .num-in", str(sv)); pg.keyboard.press("Enter"); pg.wait_for_timeout(150)
                ok = pg.locator(".feedback.ok").count() == 1
                check(f"multistep question graded correct when every step is right (Q{i+1})", ok)
                if not steps_shot: shot(pg, "f7_multistep"); steps_shot = True
            elif seen_numeric == 1 and cur["errs"]:
                pg.fill(".num-in", str(cur["errs"][0])); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
                has_diag = pg.locator(".diagnosis").count() == 1
                check("a classic-error answer is diagnosed", has_diag, pg.locator(".diagnosis").inner_text()[:80] if has_diag else "no diagnosis")
                if pg.locator("text=Break it into steps").count():
                    pg.click("text=Break it into steps"); pg.wait_for_timeout(200)
                    check("wrong one-shot answer can be broken into steps", pg.locator(".num-steps").count() == 1)
                    for sv in cur["steps"]:
                        pg.wait_for_selector(".num-step.now .num-in", timeout=5000); pg.fill(".num-step.now .num-in", str(sv)); pg.keyboard.press("Enter"); pg.wait_for_timeout(150)
                if not diag_shot: shot(pg, "f8_diagnosis"); diag_shot = True
            else:
                val = cur["answer"]; txt = ("$" + format(val, ",.2f")) if cur["unit"] == "$" else (str(val) + "%" if cur["unit"] == "%" else str(val))
                pg.fill(".num-in", txt); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
                check(f"typed right answer with $/% formatting is accepted (Q{i+1})", pg.locator(".feedback.ok").count() == 1, txt)
        else:
            seen_mc += 1; pg.keyboard.press("1"); pg.wait_for_timeout(150)
        pg.wait_for_timeout(100); pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
        if pg.locator(".score-big").count(): break
    check("drill mixed typed and multiple-choice questions", seen_numeric >= 1 and seen_mc >= 1, f"numeric {seen_numeric}, mc {seen_mc}")
    errs = pg.evaluate("window.__app.state.stats.calcErrors || {}")
    if diag_shot: check("diagnosed error types are logged on the profile", len(errs) >= 1, errs)
    else: print("SKIP diagnosed-error log check (no numeric question with an error library came up this run)")
    # siege fail -> retake the breach
    pg.evaluate(f"(() => {{ const a = window.__app; const ch = a.index.chapter.get({first}); for (const t of ch.topics) a.state.campaign.topics[t.id] = {{ cleared: Date.now() }}; a.store.flush(); }})()")
    pg.goto(BASE + f"#/campaign/{first}/boss", wait_until="load"); pg.wait_for_selector(".qcard", timeout=15000)
    n_full = pg.evaluate("parseInt(document.querySelector('.wall-bar .small')?.textContent.split('/')[1]) || 0")
    for i in range(40):
        if pg.locator(".score-big").count(): break
        pg.wait_for_selector(".qcard", timeout=15000)
        if pg.locator(".num-in").count(): pg.fill(".num-in", "0"); pg.keyboard.press("Enter")
        elif pg.locator(".num-step.now .num-in").count(): pg.fill(".num-step.now .num-in", "0"); pg.keyboard.press("Enter")
        else: pg.keyboard.press("1")
        pg.wait_for_timeout(150); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    pg.wait_for_selector(".score-big", timeout=15000)
    check("failed siege offers Retake the breach", pg.locator("a:has-text('Retake the breach')").count() == 1)
    shot(pg, "f9_siege_fail")
    pg.locator("a:has-text('Retake the breach')").click(); pg.wait_for_selector(".qcard, .intro-note", timeout=15000); pg.wait_for_timeout(300)
    sub = pg.locator(".runner-head .small.muted").first.inner_text()
    n_retry = pg.evaluate("parseInt(document.querySelector('.wall-bar .small')?.textContent.split('/')[1]) || 0")
    check("the breach is shorter than the full siege and names the lost ground", "ground you lost" in sub and 3 <= n_retry <= n_full, f"{n_retry} vs {n_full}")
    # phone width on a typed question
    M = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2); m = M.new_page(); m.on("pageerror", lambda e: errors.append("M " + str(e)))
    from testlib import gate_enter
    gate_enter(m, BASE, name); m.wait_for_timeout(500); m.goto(BASE + "#/drill", wait_until="load"); m.wait_for_timeout(300); m.click("text=March out"); m.wait_for_selector(".qcard", timeout=15000)
    for _ in range(6):
        if m.locator(".num-in").count(): break
        m.keyboard.press("1"); m.wait_for_timeout(150); m.keyboard.press("Enter"); m.wait_for_timeout(200)
    ov = m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
    m.screenshot(path=os.path.join(SHOTS, "f10_mobile_numeric.png"), full_page=False)
    check("phone width: no horizontal overflow on a typed question", not ov)
    b.close()
print("cleanup:", cleanup(name))
print("ERRORS:" if errors else "no console/page errors"); [print(" -", e[:300]) for e in errors]
print(f"\n{sum(results)}/{len(results)} checks passed"); sys.exit(0 if all(results) and not errors else 1)
