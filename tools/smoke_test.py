#!/usr/bin/env python3
"""Playwright smoke test for the trainer. Usage: python tools/smoke_test.py [base_url] [shots_dir]
Visits every route, exercises each game mode, and reports console/page errors."""
import os
import sys
import time
from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8791/"
SHOTS = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(__file__), "shots")
os.makedirs(SHOTS, exist_ok=True)
errors = []


def shot(page, name):
    page.screenshot(path=os.path.join(SHOTS, name + ".png"), full_page=True)


def go(page, hash_):
    page.goto(BASE + hash_, wait_until="load")
    page.wait_for_timeout(250)


def answer_n(page, n, correct_first=True):
    """Answer n questions in an immediate-feedback runner by clicking option 1 then Continue."""
    answered = 0
    for _ in range(n * 3):
        if page.locator(".option:not([disabled])").count() > 0:
            opts = page.locator(".option:not([disabled])")
            # pick alternately to generate some wrongs
            idx = 0 if (answered % 3 != 2 or not correct_first) else min(1, opts.count() - 1)
            opts.nth(idx).click()
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


with sync_playwright() as p:
    browser = p.chromium.launch(args=["--disable-gpu"])
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    page.on("console", lambda m: errors.append(f"console.{m.type}: {m.text}") if m.type in ("error",) else None)
    page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))

    go(page, "")
    page.wait_for_selector("input[type=text]")
    page.fill("input[type=text]", "Tester")
    page.click("text=Start training")
    page.wait_for_selector(".hq")
    shot(page, "01_home")

    for route, name in [("#/campaign", "02_campaign"), ("#/campaign/7", "03_chapter"), ("#/learn", "04_learn"), ("#/learn/7", "05_learn_ch"), ("#/learn/7/sheet", "06_sheet"), ("#/progress", "07_progress"), ("#/settings", "08_settings"), ("#/arcade", "09_arcade"), ("#/exam", "10_exam_cfg"), ("#/drill", "11_drill_cfg"), ("#/arcade/build", "12_build")]:
        go(page, route)
        shot(page, name)

    # Campaign reading + checkpoint
    go(page, "#/campaign/7/t07-1/read")
    shot(page, "13_reading")
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(100)
    go(page, "#/campaign/7/t07-1/drill")
    n = answer_n(page, 14)
    page.wait_for_timeout(300)
    shot(page, "14_checkpoint_result")
    print("checkpoint answered", n, "result text:", page.locator(".score-big").first.inner_text() if page.locator(".score-big").count() else "(running)")

    # Smart drill
    go(page, "#/drill")
    page.click("text=Start drilling")
    page.wait_for_selector(".qcard")
    shot(page, "15_drill_q")
    n = answer_n(page, 10)
    print("drill answered", n)
    shot(page, "16_drill_mid")

    # Exam
    go(page, "#/exam")
    page.click("text=20 Q")
    page.click("text=Start simulation")
    page.wait_for_selector(".qcard")
    shot(page, "17_exam_q")
    for _ in range(25):
        if page.locator(".option:not([disabled])").count() == 0:
            break
        page.locator(".option:not([disabled])").first.click()
        page.wait_for_timeout(250)
    page.wait_for_selector(".score-big", timeout=5000)
    shot(page, "18_exam_result")
    print("exam result:", page.locator(".score-big").first.inner_text())

    # Blitz
    go(page, "#/arcade/blitz")
    page.click("text=Go!")
    page.wait_for_selector(".qcard")
    for _ in range(6):
        if page.locator(".option:not([disabled])").count() == 0:
            break
        page.locator(".option:not([disabled])").first.click()
        page.wait_for_timeout(1100)
    shot(page, "19_blitz")

    # Duel
    go(page, "#/arcade/duel")
    page.click("text=Duel!")
    page.wait_for_selector(".qcard")
    answer_n(page, 3)
    shot(page, "20_duel")

    # Flashcards
    go(page, "#/arcade/flash")
    page.click("text=Start deck")
    page.wait_for_selector(".flash")
    page.keyboard.press(" ")
    page.wait_for_timeout(600)
    shot(page, "21_flash_back")
    page.keyboard.press("3")
    page.wait_for_timeout(200)

    # Build activities
    import json as _json
    _acts = {}
    for _ch in _json.load(open(os.path.join(os.path.dirname(__file__), "..", "content", "ch07.json"), encoding="utf-8"))["activities"]:
        _acts.setdefault(_ch["type"], _ch["id"])
    for kind, name in [("order", "22_order"), ("sort", "23_sort"), ("match", "24_match")]:
        aid = _acts.get(kind)
        if not aid:
            continue
        go(page, "#/arcade/build/" + aid)
        page.wait_for_selector(".card")
        if kind == "order":
            page.click("text=Check order")
        elif kind == "sort":
            guard = 0
            while page.locator(".pool .token").count() and guard < 30:
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

    # Boss
    go(page, "#/campaign/7/boss")
    page.wait_for_selector(".qcard")
    answer_n(page, 24)
    page.wait_for_timeout(300)
    shot(page, "25_boss")

    # weak hunter
    go(page, "#/drill/weak")
    page.click("text=Start drilling")
    page.wait_for_timeout(300)
    shot(page, "26_weak")
    answer_n(page, 4)

    go(page, "#/home")
    shot(page, "27_home_after")
    go(page, "#/progress")
    shot(page, "28_progress_after")

    # mobile viewport
    ctx2 = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
    m = ctx2.new_page()
    m.on("pageerror", lambda e: errors.append(f"mobile pageerror: {e}"))
    m.goto(BASE + "#/home", wait_until="load")
    m.wait_for_timeout(300)
    if m.locator("input[type=text]").count():
        m.fill("input[type=text]", "Mobile")
        m.click("text=Start training")
        m.wait_for_selector(".hq")
    m.screenshot(path=os.path.join(SHOTS, "29_mobile_home.png"), full_page=True)
    m.goto(BASE + "#/drill", wait_until="load")
    m.wait_for_timeout(200)
    m.click("text=Start drilling")
    m.wait_for_selector(".qcard")
    m.screenshot(path=os.path.join(SHOTS, "30_mobile_q.png"), full_page=False)
    # horizontal overflow check
    overflow = m.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
    print("mobile horizontal overflow:", overflow)

    browser.close()

print("\nERRORS:" if errors else "\nNo console/page errors.")
for e in errors:
    print(" -", e)
sys.exit(1 if errors else 0)
