"""Pre-commit checklist (PLAN.md): saved state shape and localStorage keys unchanged, export/import round trip,
keyboard-only battle including the briefing, sound off really silent, motion off really still, first-load timing
and payload, and frame rate on the battle and map screens. Usage: python tools/checklist.py <base>"""
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
EXPECTED_SHAPE = ['achievements', 'activities', 'campaign', 'concepts', 'createdAt', 'days', 'exams', 'name', 'plan', 'questions', 'session', 'sessions', 'settings', 'stats', 'v', 'xp']
results = []
def check(name, ok, detail=""):
    results.append((name, ok, detail)); print(("PASS " if ok else "FAIL ") + name + (" — " + detail if detail else ""))

with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"])
    ctx = b.new_context(viewport={"width": 1280, "height": 800})
    pg = ctx.new_page()
    errors = []
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    # first load: timing and payload (local server, so bytes matter more than ms)
    pg.goto(BASE + "#/home", wait_until="load"); pg.wait_for_timeout(300)
    nav = pg.evaluate("""() => { const n = performance.getEntriesByType('navigation')[0]; const res = performance.getEntriesByType('resource');
      const size = r => r.encodedBodySize || r.transferSize || 0;
      return { loadMs: n ? Math.round(n.loadEventEnd - n.startTime) : null, dclMs: n ? Math.round(n.domContentLoadedEventEnd - n.startTime) : null,
        kb: Math.round(res.reduce((s, r) => s + size(r), 0) / 1024), files: res.length, biggest: res.map(r => [r.name.split('/').pop().split('?')[0], Math.round(size(r) / 1024) + 'kB']).sort((a, c) => parseInt(c[1]) - parseInt(a[1])).slice(0, 6) }; }""")
    print("first load:", nav)
    check("home load under 1.5 s locally", (nav["loadMs"] or 9999) < 1500, f"{nav['loadMs']} ms, {nav['kb']} kB over {nav['files']} files")
    if pg.locator("input[type=text]").count():
        pg.fill("input[type=text]", "Austin"); pg.click("text=Join the legion"); pg.wait_for_selector(".hq")
    # keyboard-only battle, briefing included
    pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = true; a.store.flush(); }")
    pg.goto(BASE + "#/campaign/1/t01-1/drill", wait_until="load")
    pg.wait_for_selector(".cutscene.show", timeout=8000); pg.wait_for_timeout(300)
    for _ in range(8):
        if pg.locator(".qcard").count(): break
        pg.keyboard.press("Enter"); pg.wait_for_timeout(400)
    check("briefing advances with Enter only", pg.locator(".qcard").count() > 0)
    answered = 0
    for i in range(40):
        if pg.locator(".score-big").count(): break
        pg.wait_for_selector(".option:not([disabled])", timeout=6000)
        n = pg.locator(".option").count()
        pg.keyboard.press(str(1 + (i % n))); pg.wait_for_timeout(220)
        if i == 0: check("feedback panel appears after a key answer", pg.locator(".feedback").count() == 1)
        pg.keyboard.press("Enter"); pg.wait_for_timeout(260); answered += 1
    check("keyboard-only battle runs to the result", pg.locator(".score-big").count() > 0, f"answered {answered}")
    pg.evaluate("() => { const a = window.__app; a.state.settings.briefings = false; a.store.flush(); }")
    # saved state shape and storage keys
    shape = pg.evaluate("Object.keys(window.__app.state).sort()")
    check("state shape unchanged", shape == EXPECTED_SHAPE, ", ".join(shape))
    keys = pg.evaluate("Object.keys(localStorage).sort()")
    ok_keys = "mark201.profiles.v1" in keys and "mark201.active.v1" in keys and any(k.startswith("mark201.state.v1.") for k in keys) and all(k.startswith("mark201.") for k in keys)
    check("localStorage keys as specified (+ mark201.cosmetic.v1 only)", ok_keys and all(k in ("mark201.profiles.v1", "mark201.active.v1", "mark201.cosmetic.v1") or k.startswith("mark201.state.v1.") for k in keys), ", ".join(keys))
    # export / import round trip
    snap = pg.evaluate("() => { const a = window.__app; return { xp: a.state.xp, concepts: JSON.stringify(a.state.concepts), stats: JSON.stringify(a.state.stats), campaign: JSON.stringify(a.state.campaign) }; }")
    exported = pg.evaluate("window.__app.store.exportJSON()")
    imp = pg.evaluate("(txt) => { const a = window.__app; a.store.importJSON(txt); return { xp: a.state.xp, concepts: JSON.stringify(a.state.concepts), stats: JSON.stringify(a.state.stats), campaign: JSON.stringify(a.state.campaign), name: a.state.name }; }", exported)
    check("export then import round-trips XP, mastery, pursuits, campaign", all(imp[k] == snap[k] for k in ("xp", "concepts", "stats", "campaign")), f"xp {snap['xp']} → {imp['xp']} as {imp['name']!r}")
    pg.reload(wait_until="load"); pg.wait_for_timeout(500)
    check("reload shows the same XP in the header", pg.evaluate("window.__app.state.xp") == imp["xp"] and str(imp["xp"]) in (pg.evaluate("document.querySelector('.xpbar').innerText") or ""), pg.evaluate("document.querySelector('.xpbar').innerText").replace("\n", " "))
    # sound off: no audio nodes, no ambience
    pg.evaluate("() => { const a = window.__app; a.state.settings.sound = false; a.state.settings.briefings = false; a.applySettings(); a.store.flush(); }")
    pg.evaluate("() => { window.__nodes = 0; const P = (window.AudioContext || window.webkitAudioContext).prototype; for (const k of ['createOscillator', 'createBufferSource']) { const o = P[k]; P[k] = function () { window.__nodes++; return o.apply(this, arguments); }; } }")
    pg.goto(BASE + "#/drill", wait_until="load"); pg.wait_for_timeout(300)
    pg.click("text=March out"); pg.wait_for_selector(".qcard")
    for _ in range(3):
        pg.keyboard.press("1"); pg.wait_for_timeout(250); pg.keyboard.press("Enter"); pg.wait_for_timeout(250)
    nodes = pg.evaluate("window.__nodes"); amb = pg.evaluate("window.__app.audio.currentAmbience()")
    check("sound off creates no audio nodes and no ambience", nodes == 0 and not amb, f"nodes {nodes}, ambience {amb!r}")
    # motion off: still stage, no confetti, no running animations outside toasts
    pg.evaluate("() => { const a = window.__app; a.state.settings.motion = false; a.applySettings(); a.store.flush(); }")
    pg.wait_for_timeout(200)
    still = pg.evaluate("document.querySelector('.scene-stage').classList.contains('still') && document.documentElement.dataset.motion === 'off'")
    pg.evaluate("window.__app.grantXp(50, 'checklist')"); pg.wait_for_timeout(150)
    conf = pg.evaluate("document.querySelectorAll('canvas.confetti').length")
    running = pg.evaluate("document.getAnimations().filter(a => a.playState === 'running' && !(a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.toasts'))).map(a => (a.animationName || a.transitionProperty || '?') + '@' + (a.effect.target.className && a.effect.target.className.baseVal !== undefined ? a.effect.target.className.baseVal : a.effect.target.className)).slice(0, 10)")
    check("motion off: stage still, no confetti, no running animations", bool(still) and conf == 0 and len(running) == 0, f"still={still} confetti={conf} running={running}")
    pg.evaluate("() => { const a = window.__app; a.state.settings.motion = true; a.state.settings.sound = true; a.applySettings(); a.store.flush(); }")
    # frame rate (software rendering here, so real machines do better)
    def fps(route, sel):
        pg.goto(BASE + route, wait_until="load"); pg.wait_for_timeout(300); pg.wait_for_selector(sel, timeout=8000); pg.wait_for_timeout(400)
        return pg.evaluate("() => new Promise(res => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(Math.round(n / 2)); })(); })")
    f_battle = fps("#/campaign/1/t01-1/drill", ".qcard"); f_map = fps("#/campaign", ".map-frame")
    print(f"fps (headless, no GPU): battle {f_battle}, map {f_map}")
    check("no console or page errors", not errors, "; ".join(errors[:3]))
    b.close()
fails = [r for r in results if not r[1]]
print(f"\n{len(results) - len(fails)}/{len(results)} checks passed")
sys.exit(1 if fails else 0)
