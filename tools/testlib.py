"""Shared helpers for the Playwright tests: the profile gate, cloud REST access and cleanup of throwaway profiles.
Test profiles are always named "zztest ..." so the database policy lets the anon key delete them again."""
import json
import os
import random
import sys
import urllib.parse
import urllib.request

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def config():
    cfg = open(os.path.join(ROOT, "app", "config.js"), encoding="utf-8").read()
    url = cfg.split("SUPABASE_URL = '")[1].split("'")[0]
    key = cfg.split("SUPABASE_ANON_KEY = '")[1].split("'")[0]
    return url, key


def rest(path, method="GET", body=None, prefer="return=representation"):
    url, key = config()
    headers = {"apikey": key, "Authorization": "Bearer " + key, "Content-Type": "application/json", "Prefer": prefer}
    req = urllib.request.Request(url + "/rest/v1" + path, method=method, headers=headers, data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req, timeout=25) as r:
            t = r.read().decode()
            return r.status, (json.loads(t) if t else None)
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode())
        except Exception:
            return e.code, None


def test_name(tag="t"):
    return f"zztest {tag} {random.randint(1000, 9999)}"


def key_of(name):
    return " ".join(name.split()).strip().lower()


def cloud_profile(name):
    code, rows = rest(f"/profiles?username_key=eq.{urllib.parse.quote(key_of(name))}&select=*")
    return rows[0] if code == 200 and rows else None


def cloud_courses(profile_id):
    code, rows = rest(f"/course_progress?profile_id=eq.{profile_id}&select=course_id,xp,readiness,mastered_count,total_concepts,updated_at")
    return rows if code == 200 else []


def cleanup(*names):
    out = []
    for n in names:
        code, rows = rest(f"/profiles?username_key=eq.{urllib.parse.quote(key_of(n))}", method="DELETE")
        out.append((n, code, len(rows or []) if isinstance(rows, list) else rows))
    return out


def gate_create(page, base, name):
    """Create a fresh profile at the gate and land on the Forum."""
    page.goto(base, wait_until="load")
    page.wait_for_selector(".login input[type=text]", timeout=20000)
    page.fill(".login input[type=text]", name)
    page.click("text=Create profile")
    page.wait_for_selector(".dash-hero", timeout=30000)


def gate_enter(page, base, name):
    """Enter an existing profile at the gate (Enter key) and land on the Forum."""
    page.goto(base, wait_until="load")
    page.wait_for_selector(".login input[type=text]", timeout=20000)
    page.fill(".login input[type=text]", name)
    page.keyboard.press("Enter")
    page.wait_for_selector(".dash-hero", timeout=30000)


def to_camp(page, base):
    page.goto(base + "#/home", wait_until="load")
    page.wait_for_selector(".castra, .hq", timeout=20000)


def calm(page):
    page.evaluate("(() => { const s = window.__app.state; s.settings.briefings = false; s.settings.motion = false; window.__app.store.flush(); window.__app.applySettings(); })()")


def wait_saved(page, timeout_ms=15000):
    page.wait_for_function("() => window.__app.syncer && window.__app.syncer.status === 'saved' && !window.__app.syncer.hasDirty()", timeout=timeout_ms)


def purge_all_test_profiles():
    code, rows = rest("/profiles?username_key=like.zztest*", method="DELETE")
    return code, (len(rows) if isinstance(rows, list) else rows)
