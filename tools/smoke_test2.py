import os
import sys
from playwright.sync_api import sync_playwright

BASE = sys.argv[1]
SHOTS = sys.argv[2]
os.makedirs(SHOTS, exist_ok=True)
errors = []


def shot(page, name):
    page.screenshot(path=os.path.join(SHOTS, name + ".png"), full_page=True)


def go(page, h):
    page.goto(BASE + h, wait_until="load")
    page.wait_for_timeout(250)


def answer_n(page, n):
    answered = 0
    for _ in range(n * 3):
        if page.locator(".option:not([disabled])").count() > 0:
            opts = page.locator(".option:not([disabled])")
            opts.nth(0 if answered % 3 != 2 else min(1, opts.count() - 1)).click()
            answered += 1
            page.wait_for_timeout(120)
            cont = page.locator(".runner-foot .btn.primary")
            if cont.count():
                cont.first.click()
                page.wait_for_timeout(120)
        elif page.locator("text=Got it, quiz me").count():
            page.locator("text=Got it, quiz me").first.click()
            page.wait_for_timeout(100)
        else:
            break
        if answered >= n:
            break
    return answered


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(args=["--disable-gpu"])
        ctx = browser.new_context(viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type == "error" else None)
        page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
        go(page, "")
        page.wait_for_selector("input[type=text]")
        page.fill("input[type=text]", "Tester2")
        page.click("text=Join the legion")
        page.wait_for_selector(".hq")
        page.evaluate("(() => { const s = window.__app.state; s.settings.motion = false; window.__app.store.flush(); window.__app.applySettings(); })()")
        for aid, name in [("a07-02", "23_sort"), ("a07-03", "24_match")]:
            go(page, "#/arcade/build/" + aid)
            page.wait_for_selector(".card")
            if aid.endswith("02"):
                guard = 0
                while page.locator(".pool .token").count() and guard < 20:
                    page.locator(".pool .token").first.click()
                    page.locator(".bucket h4").first.click()
                    guard += 1
                page.click("text=Check sorting")
            else:
                lefts = page.locator(".match-grid .col").first.locator(".match-item")
                rights = page.locator(".match-grid .col").nth(1).locator(".match-item")
                for i in range(lefts.count()):
                    lefts.nth(i).click()
                    rights.nth(i).click()
                page.click("text=Check matches")
            page.wait_for_timeout(200)
            shot(page, name)
            print(name, "verdict:", page.locator(".explain .verdict").inner_text())
        go(page, "#/campaign/7/boss")
        page.wait_for_selector(".qcard")
        n = answer_n(page, 24)
        page.wait_for_timeout(300)
        shot(page, "25_boss")
        print("boss answered", n, "result:", page.locator(".score-big").first.inner_text() if page.locator(".score-big").count() else "(none)")
        go(page, "#/drill/weak")
        page.click("text=March out")
        page.wait_for_timeout(300)
        shot(page, "26_weak")
        answer_n(page, 4)
        go(page, "#/home")
        shot(page, "27_home_after")
        go(page, "#/progress")
        shot(page, "28_progress_after")
        go(page, "#/campaign/7")
        shot(page, "31_chapter_after")
        go(page, "#/settings")
        page.click("text=Light")
        page.wait_for_timeout(200)
        go(page, "#/home")
        shot(page, "32_home_light")
        ctx2 = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        m = ctx2.new_page()
        m.on("pageerror", lambda e: errors.append(f"mobile pageerror: {e}"))
        m.goto(BASE + "#/home", wait_until="load")
        m.wait_for_timeout(300)
        if m.locator("input[type=text]").count():
            m.fill("input[type=text]", "Mobile")
            m.click("text=Join the legion")
            m.wait_for_selector(".hq")
        m.screenshot(path=os.path.join(SHOTS, "29_mobile_home.png"), full_page=True)
        m.goto(BASE + "#/drill", wait_until="load")
        m.wait_for_timeout(200)
        m.click("text=March out")
        m.wait_for_selector(".qcard")
        m.screenshot(path=os.path.join(SHOTS, "30_mobile_q.png"), full_page=False)
        print("mobile horizontal overflow:", m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1"))
        browser.close()


try:
    run()
finally:
    print("\nERRORS:" if errors else "\nNo console/page errors.")
    for e in errors:
        print(" -", e)
