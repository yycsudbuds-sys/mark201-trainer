"""Quick Phase 1 probe: gate -> create profile -> Forum -> MARK 201 camp -> drill -> cloud row exists -> cleanup.
Usage: python tools/probe_phase1.py [base]"""
import sys, json, time, random, urllib.request, urllib.parse, os
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = open(os.path.join(ROOT, "app", "config.js"), encoding="utf-8").read()
URL = cfg.split("SUPABASE_URL = '")[1].split("'")[0]
KEY = cfg.split("SUPABASE_ANON_KEY = '")[1].split("'")[0]
H = {"apikey": KEY, "Authorization": "Bearer " + KEY, "Content-Type": "application/json"}

def rest(path, method="GET", body=None):
    req = urllib.request.Request(URL + "/rest/v1" + path, method=method, headers=dict(H, Prefer="return=representation"), data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=20) as r: t = r.read().decode(); return json.loads(t) if t else None
    except urllib.error.HTTPError as e: return {"error": e.code, "body": e.read().decode()[:300]}

name = f"zztest {random.randint(1000, 9999)}"
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(args=["--disable-gpu"]); ctx = b.new_context(viewport={"width": 1280, "height": 900}); pg = ctx.new_page()
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.goto(BASE, wait_until="load"); pg.wait_for_selector(".login input[type=text]", timeout=15000)
    print("gate shown")
    pg.fill(".login input[type=text]", name); pg.click("text=Create profile")
    pg.wait_for_selector(".dash-hero", timeout=20000); print("forum shown as", pg.locator(".dash-hero h1").inner_text())
    pg.wait_for_timeout(800)
    print("course cards:", pg.locator(".course-card h3").all_inner_texts())
    pg.screenshot(path=os.path.join(ROOT, "tools", "shots", "p1_dash.png"), full_page=True)
    pg.locator(".course-card").first.locator("button.btn.ch").click()
    pg.wait_for_timeout(1500); print("after Begin, hash:", pg.evaluate("location.hash"), "island page:", pg.locator(".island-page").count())
    pg.goto(BASE + "#/home", wait_until="load"); pg.wait_for_selector(".castra", timeout=15000); print("camp shown; hash", pg.evaluate("location.hash"))
    pg.evaluate("(() => { const s = window.__app.state; s.settings.briefings = false; s.settings.motion = false; window.__app.store.flush(); window.__app.applySettings(); })()")
    pg.screenshot(path=os.path.join(ROOT, "tools", "shots", "p1_home.png"), full_page=True)
    pg.goto(BASE + "#/drill", wait_until="load"); pg.wait_for_timeout(300); pg.click("text=March out"); pg.wait_for_selector(".qcard")
    for i in range(6):
        pg.wait_for_selector(".option:not([disabled])", timeout=6000); pg.keyboard.press("1"); pg.wait_for_timeout(200); pg.keyboard.press("Enter"); pg.wait_for_timeout(200)
    xp = pg.evaluate("window.__app.state.xp"); print("xp after 6 answers:", xp, "profile total:", pg.evaluate("window.__app.xp()"))
    pg.wait_for_timeout(2500)
    print("sync status:", pg.evaluate("window.__app.syncer.status"))
    rows = rest(f"/profiles?username_key=eq.{urllib.parse.quote(name.lower())}&select=id,username,total_xp,level,coins")
    print("cloud profile:", rows)
    pid = rows[0]["id"] if rows and isinstance(rows, list) and rows else None
    cp = rest(f"/course_progress?profile_id=eq.{pid}&select=course_id,xp,readiness,mastered_count,total_concepts") if pid else None
    print("cloud course rows:", cp)
    # second context: enter the same name, expect the XP to be there
    ctx2 = b.new_context(viewport={"width": 1280, "height": 900}); pg2 = ctx2.new_page()
    pg2.on("pageerror", lambda e: errors.append("ctx2 " + str(e)))
    pg2.goto(BASE, wait_until="load"); pg2.wait_for_selector(".login input[type=text]")
    pg2.fill(".login input[type=text]", "  " + name.upper() + "  "); pg2.keyboard.press("Enter")
    pg2.wait_for_selector(".dash-hero", timeout=20000); pg2.wait_for_timeout(500)
    print("ctx2 total xp:", pg2.evaluate("window.__app.xp()"), "name:", pg2.evaluate("window.__app.profile.username"))
    # taken name on create
    ctx3 = b.new_context(); pg3 = ctx3.new_page(); pg3.goto(BASE, wait_until="load"); pg3.wait_for_selector(".login input[type=text]")
    pg3.fill(".login input[type=text]", name.lower()); pg3.click("text=Create profile"); pg3.wait_for_timeout(2500)
    print("create with taken name ->", pg3.locator(".login-msg").inner_text())
    pg.goto(BASE + "#/progress", wait_until="load"); pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(ROOT, "tools", "shots", "p1_progress.png"), full_page=True)
    pg.goto(BASE + "#/settings", wait_until="load"); pg.wait_for_timeout(400); pg.screenshot(path=os.path.join(ROOT, "tools", "shots", "p1_settings.png"), full_page=True)
    pg.goto(BASE + "#/campaign", wait_until="load"); pg.wait_for_timeout(1500); pg.screenshot(path=os.path.join(ROOT, "tools", "shots", "p1_campaign.png"), full_page=True)
    pg.goto(BASE + "#/campaign/7", wait_until="load"); pg.wait_for_timeout(1200); pg.screenshot(path=os.path.join(ROOT, "tools", "shots", "p1_campaign7.png"), full_page=True)
    print("campaign/7 topics shown:", pg.locator(".rs-node").count())
    b.close()
# cleanup
if pid:
    print("cleanup:", rest(f"/profiles?id=eq.{pid}", method="DELETE"))
print("ERRORS:" if errors else "no console/page errors"); [print(" -", e[:300]) for e in errors]
sys.exit(1 if errors else 0)
