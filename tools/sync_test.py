"""Profiles and sync, end to end in two browser contexts: create, enter with different casing, progress on both,
offline catch-up with a merge (nobody loses XP), legacy save claim with id prefixing, export/import round trips.
Usage: python tools/sync_test.py [base]"""
import json
import os
import sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from testlib import gate_create, gate_enter, to_camp, calm, wait_saved, cloud_profile, cloud_courses, cleanup, test_name, key_of

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
results = []
def check(name, ok, detail=""):
    results.append(ok); print(("PASS " if ok else "FAIL ") + name + (" — " + str(detail) if detail else ""))

def drill(page, n):
    page.goto(BASE + "#/drill", wait_until="load"); page.wait_for_timeout(250); page.click("text=March out"); page.wait_for_selector(".qcard", timeout=15000)
    for _ in range(n):
        page.wait_for_selector(".option:not([disabled])", timeout=8000); page.keyboard.press("1"); page.wait_for_timeout(150); page.keyboard.press("Enter"); page.wait_for_timeout(150)
    page.evaluate("window.__app.store.flush()")

name = test_name("sync"); legacy_name = test_name("legacy"); errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    A = b.new_context(viewport={"width": 1280, "height": 900}); a = A.new_page()
    a.on("pageerror", lambda e: errors.append("A " + str(e))); a.on("console", lambda m: errors.append("A console " + m.text) if m.type == "error" and "ERR_INTERNET_DISCONNECTED" not in m.text else None)  # the offline leg makes fetch fail on purpose
    gate_create(a, BASE, name); to_camp(a, BASE); calm(a)
    drill(a, 6); wait_saved(a)
    xa1 = a.evaluate("window.__app.xp()"); cp = cloud_profile(name)
    check("device A: progress reaches the cloud", cp is not None and cp["total_xp"] == xa1 and xa1 > 0, (xa1, cp and cp["total_xp"]))
    # device B enters with different casing and spacing
    B = b.new_context(viewport={"width": 1280, "height": 900}); bb = B.new_page()
    bb.on("pageerror", lambda e: errors.append("B " + str(e)))
    gate_enter(bb, BASE, "  " + name.upper() + "  "); bb.wait_for_timeout(500)
    check("device B: same profile by case-insensitive name", bb.evaluate("window.__app.profile.username") == name and bb.evaluate("window.__app.xp()") == xa1, bb.evaluate("[window.__app.profile.username, window.__app.xp()]"))
    to_camp(bb, BASE); calm(bb); drill(bb, 6); wait_saved(bb)
    xb = bb.evaluate("window.__app.xp()")
    check("device B: XP grew and saved", xb > xa1 and cloud_profile(name)["total_xp"] == xb, (xa1, xb))
    # device A goes offline, keeps studying, comes back: both devices' work must survive
    A.set_offline(True)
    drill(a, 6); a.wait_for_timeout(2500)
    st = a.evaluate("window.__app.syncer.status"); dirty = a.evaluate("window.__app.syncer.hasDirty()")
    check("device A offline: status offline, work queued", st == "offline" and dirty, (st, dirty))
    xa_off = a.evaluate("window.__app.xp()")
    A.set_offline(False); a.evaluate("window.dispatchEvent(new Event('online'))")
    wait_saved(a, 30000)
    xa2 = a.evaluate("window.__app.xp()"); cp2 = cloud_profile(name)
    check("device A back online: merged, cloud XP >= both devices' work", xa2 >= max(xa_off, xb) and cp2["total_xp"] == xa2, (xa_off, xb, xa2, cp2["total_xp"]))
    bb.reload(wait_until="load"); bb.wait_for_selector(".xpbar", timeout=20000); bb.wait_for_timeout(2500)
    check("device B after reload sees the merged total", bb.evaluate("window.__app.xp()") == xa2, (bb.evaluate("window.__app.xp()"), xa2))
    rows = cloud_courses(cp2["id"])
    check("course_progress row carries readiness and totals", rows and rows[0]["course_id"] == "mark201" and rows[0]["total_concepts"] == 230 and rows[0]["xp"] == xa2, rows)
    # export / import round trip (new format), then an old-format file
    snap = a.evaluate("() => { const s = window.__app.state; return [window.__app.xp(), Object.keys(s.concepts).length, JSON.stringify(s.stats)]; }")
    exported = a.evaluate("window.__app.store.exportJSON()")
    imp = a.evaluate("(t) => { window.__app.store.importJSON(t); const s = window.__app.state; return [window.__app.xp(), Object.keys(s.concepts).length, JSON.stringify(s.stats)]; }", exported)
    check("export then import of the same profile changes nothing", imp == snap, (snap, imp))
    legacy_file = json.dumps({"type": "mark201-profile", "state": {"name": "Old", "xp": 5000, "concepts": {"c01-marketing": {"a": [[1, "q01-001", "define", 1, 1, 0]], "seen": 1, "box": 1, "due": 0, "pursuit": None, "lastAsk": 1}}, "questions": {"q01-001": {"seen": 1, "c": 1, "w": 0, "last": 1, "lastCorrect": 1}}, "stats": {"answered": 1, "correct": 1, "byAngle": {}}, "campaign": {"topics": {"t01-1": {"cleared": 5}}, "bosses": {}}}})
    imp2 = a.evaluate("(t) => { window.__app.store.importJSON(t); const s = window.__app.state; return [s.xp, !!s.concepts['mark201-c01-marketing'], !!s.questions['mark201-q01-001'], !!s.campaign.topics['mark201-t01-1'], Object.keys(s.concepts).some(k => !k.startsWith('mark201-'))]; }", legacy_file)
    check("old-format import merges with prefixed ids and keeps the higher XP", imp2[0] == 5000 and imp2[1] and imp2[2] and imp2[3] and not imp2[4], imp2)
    # legacy save on a fresh device: claim it into a new profile
    C = b.new_context(viewport={"width": 1280, "height": 900}); c = C.new_page()
    c.on("pageerror", lambda e: errors.append("C " + str(e)))
    c.goto(BASE, wait_until="load"); c.wait_for_selector(".login input[type=text]")
    c.evaluate("""() => { localStorage.setItem('mark201.profiles.v1', JSON.stringify([{ id: 'pLegacy', name: 'Austin', createdAt: 1700000000000 }])); localStorage.setItem('mark201.active.v1', JSON.stringify('pLegacy'));
      localStorage.setItem('mark201.state.v1.pLegacy', JSON.stringify({ v: 1, name: 'Austin', createdAt: 1700000000000, xp: 777, concepts: { 'c07-product': { a: [[1, 'q07-001', 'define', 1, 1, 0]], seen: 1, box: 1, due: 0, pursuit: null, lastAsk: 1 } }, questions: { 'q07-001': { seen: 1, c: 1, w: 0, last: 1, lastCorrect: 1 } }, activities: {}, exams: [], achievements: { first: 1 }, campaign: { topics: { 't07-1': { cleared: 9 } }, bosses: {} }, plan: {}, stats: { answered: 1, correct: 1, byAngle: {} }, session: { id: 1, lastActive: 0, startedAt: 0, answered: 0, correct: 0 }, sessions: [], days: {}, settings: { theme: 'light', sound: true, motion: true, briefings: true } }));
      localStorage.setItem('mark201.cosmetic.v1', JSON.stringify({ denarii: 50, owned: ['crest:gold'], equipped: { crest: 'gold' } })); }""")
    c.reload(wait_until="load"); c.wait_for_selector(".login-legacy", timeout=15000)
    check("legacy save is offered at the gate", c.locator(".login-legacy .li").count() == 1 and "777 XP" in c.locator(".login-legacy").inner_text())
    c.click("text=Bring this progress into a profile"); c.fill(".login input[type=text]", legacy_name); c.click("text=Create profile"); c.wait_for_selector(".dash-hero", timeout=30000); c.wait_for_timeout(600)
    got = c.evaluate("() => { const a = window.__app; const s = a.store.courseState('mark201'); return [a.xp(), !!s.concepts['mark201-c07-product'], !!s.campaign.topics['mark201-t07-1'], a.profile.coins, (a.profile.cosmetics.owned || []).includes('crest:gold'), a.profile.cosmetics.equipped && a.profile.cosmetics.equipped.crest, !!localStorage.getItem('mark201.state.v1.pLegacy'), Object.keys(s.concepts).every(k => k.startsWith('mark201-'))]; }")
    check("claimed legacy save: XP, prefixed ids, coins and gear carried; old keys kept", got == [777, True, True, 50, True, "gold", True, True], got)
    to_camp(c, BASE); c.wait_for_timeout(300)
    check("claimed profile's camp shows the legacy XP in the header", "777" in c.locator(".xpbar").inner_text())
    wait_saved(c, 20000)
    cpl = cloud_profile(legacy_name)
    check("claimed progress reached the cloud", cpl is not None and cpl["total_xp"] == 777 and cpl["coins"] == 50, cpl and (cpl["total_xp"], cpl["coins"]))
    # phone width: gate and Forum have no horizontal overflow
    M = b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2); m = M.new_page()
    m.on("pageerror", lambda e: errors.append("M " + str(e)))
    m.goto(BASE, wait_until="load"); m.wait_for_selector(".login input[type=text]")
    ov1 = m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
    m.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "p1_mobile_gate.png"), full_page=True)
    gate_enter(m, BASE, name); m.wait_for_timeout(800)
    ov2 = m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
    m.screenshot(path=os.path.join(os.path.dirname(__file__), "shots", "p1_mobile_dash.png"), full_page=True)
    check("phone width: no horizontal overflow on the gate or the Forum", not ov1 and not ov2, (ov1, ov2))
    b.close()
print("cleanup:", cleanup(name, legacy_name))
print("ERRORS:" if errors else "no console/page errors"); [print(" -", e[:300]) for e in errors]
print(f"\n{sum(results)}/{len(results)} checks passed")
sys.exit(0 if all(results) and not errors else 1)
