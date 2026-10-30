#!/usr/bin/env python3
"""Independent solver for the FIN 201 pack. Run before every deploy.

1. Fixtures: the Python primitives reproduce worked answers from the course sources (solutions manual, seminars).
2. Generators: node tools/gen_dump.mjs emits every generator for many seeds; each one is recomputed here from its
   givens with separately written formulas (answer and every step within tolerance, no error-library value equal
   to the right answer, stems mention their numbers).
3. Static content: every numeric `check` expression in content/fin201/parts is re-evaluated against its answer.
4. Scope: no out-of-scope topics (derivatives, bonds/TVM for their own sake, MACRS, chapters 24-25) in the content.
Usage: python tools/verify_fin201.py [seeds=25]
"""
import glob
import json
import math
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "tools"))
from validate_fin201 import evaluate, within  # noqa: E402

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:  # noqa: BLE001
    pass

fails = []
def fail(msg):
    fails.append(msg); print("FAIL", msg)

# ---------------------------------------------------------------- primitives (written independently of the JS)
def af(r, n): return (1 - (1 + r) ** -n) / r
def npv(r, flows): return sum(cf / (1 + r) ** t for t, cf in enumerate(flows))
def irr(flows, lo=-0.99, hi=1.5):
    a, b = lo, hi; fa = npv(a, flows)
    for _ in range(200):
        m = (a + b) / 2; fm = npv(m, flows)
        if (fa < 0) == (fm < 0): a, fa = m, fm
        else: b = m
    return (a + b) / 2
def pvcca(I0, d, T, k, mult=0.5, S=0.0, N=0):
    first = (1 + 0.5 * k) / (1 + k) if mult == 0.5 else ((1.5 * k + 1) / (1 + k) if mult == 1.5 else 1.0)
    a = I0 * d * T / (k + d) * first
    b = (S * d * T / (k + d)) / (1 + k) ** N if S else 0.0
    return first, a, b, a - b
def cfat(POD, ACB, UCC, T):
    recap = min(ACB, POD) - UCC; gain = max(POD - ACB, 0.0)
    return recap, gain, POD - T * recap - 0.5 * T * gain
def ncdf(x): return 0.5 * (1 + math.erf(x / math.sqrt(2)))
def payback(I0, flows):
    cum = 0.0
    for i, f in enumerate(flows):
        if cum + f >= I0: return i + (I0 - cum) / f, cum, i
        cum += f
    return None, cum, len(flows)

# ---------------------------------------------------------------- 1. fixtures from the sources
def fixtures():
    # SM Ch10 problem 8: PV of CCATS 250,741.95 (no first-year factor), NPV 262,203.50
    _, _, _, pv = pvcca(990000, 0.3, 0.4, 0.15, mult=1.0, S=100000, N=5)
    ok = abs(pv - 250741.95) < 0.05; print(("PASS" if ok else "FAIL"), f"fixture SM 10-8 PVCCATS {pv:.2f} (expected 250,741.95)")
    if not ok: fail("SM 10-8 PVCCATS")
    # (The SM's printed NPV for 10-8, 262,203.50, does not follow from its own printed flows; only the PVCCATS line is used.)
    # Seminar 5: PV of CCA tax shield with AII, 110,000 at 20%, T 40%, k 10%, salvage 17,000 after 6 years = 28,107.72
    _, _, _, pv = pvcca(110000, 0.2, 0.4, 0.1, mult=1.5, S=17000, N=6)
    ok = abs(pv - 28107.72) < 0.05; print(("PASS" if ok else "FAIL"), f"fixture Seminar 5 PVCCA {pv:.2f} (expected 28,107.72)")
    if not ok: fail("Seminar 5 PVCCA")
    # SM Ch8 problem 17: D0 1.90, 24% for 3 years then 6%, R 11% -> P3 76.80, P0 63.30
    D = [1.90 * 1.24 ** t for t in (1, 2, 3)]; P3 = D[2] * 1.06 / (0.11 - 0.06); P0 = sum(d / 1.11 ** (i + 1) for i, d in enumerate(D)) + P3 / 1.11 ** 3
    ok = abs(P3 - 76.80) < 0.01 and abs(P0 - 63.30) < 0.01; print(("PASS" if ok else "FAIL"), f"fixture SM 8-17 P3 {P3:.2f} P0 {P0:.2f} (expected 76.80 / 63.30)")
    if not ok: fail("SM 8-17")
    # SM Ch9 problem 12: crossover rate of the difference flows = 14.83%
    x = irr([0, 10100, 2500, -6000, -11700]) * 100
    ok = abs(x - 14.83) < 0.01; print(("PASS" if ok else "FAIL"), f"fixture SM 9-12 crossover {x:.2f}% (expected 14.83%)")
    if not ok: fail("SM 9-12 crossover")
    # Practice exam q4: ROE 15%, payout 40% -> g = 9%
    ok = abs((1 - 0.4) * 15 - 9) < 1e-9; print(("PASS" if ok else "FAIL"), "fixture PRAC q4 g = 9%")
    # Practice exam q8: 40k at 4% + 60k at 9% -> 7%
    ok = abs(0.4 * 4 + 0.6 * 9 - 7) < 1e-9; print(("PASS" if ok else "FAIL"), "fixture PRAC q8 E[R] = 7%")

# ---------------------------------------------------------------- 2. solvers, one per generator: givens -> (answer, [steps])
def S(**kw): return kw
SOLVERS = {}
def solver(name):
    def deco(fn): SOLVERS[name] = fn; return fn
    return deco

@solver("hpr_return")
def _(g):
    h = (g["P1"] + g["D1"]) / g["P0"] - 1; cg = (g["P1"] - g["P0"]) / g["P0"]; dy = g["D1"] / g["P0"]
    return h * 100, [cg * 100, dy * 100, h * 100]
@solver("geo_average")
def _(g):
    prod = 1.0
    for x in g["rets"]: prod *= 1 + x / 100
    geo = prod ** (1 / 3) - 1; return geo * 100, [prod, geo * 100]
@solver("compound_value")
def _(g):
    prod = 1.0
    for x in g["rets"]: prod *= 1 + x / 100
    return g["V0"] * prod, [prod, g["V0"] * prod]
@solver("constant_dividend")
def _(g): v = g["D"] / (g["R"] / 100); return v, [v]
@solver("gordon_price")
def _(g): d1 = g["D0"] * (1 + g["g"] / 100); p = d1 / ((g["R"] - g["g"]) / 100); return p, [d1, p]
@solver("gordon_return")
def _(g): d1 = g["D0"] * (1 + g["g"] / 100); dy = d1 / g["P0"]; return dy * 100 + g["g"], [d1, dy * 100, dy * 100 + g["g"]]
@solver("growing_annuity")
def _(g):
    gp, rp = g["g"] / 100, g["R"] / 100; ratio = ((1 + gp) / (1 + rp)) ** g["N"]; pv = g["D1"] / (rp - gp) * (1 - ratio); return pv, [ratio, pv]
@solver("two_stage")
def _(g):
    rp = g["R"] / 100; divs = []; d = g["D0"]
    for _t in range(g["N"]): d *= 1 + g["g1"] / 100; divs.append(d)
    dn1 = divs[-1] * (1 + g["g2"] / 100); pn = dn1 / (rp - g["g2"] / 100)
    pvd = sum(x / (1 + rp) ** (i + 1) for i, x in enumerate(divs)); pvp = pn / (1 + rp) ** g["N"]
    return pvd + pvp, [divs[-1], dn1, pn, pvd, pvp, pvd + pvp]
@solver("solve_g")
def _(g): dy = g["D1"] / g["P0"]; gg = (g["R"] / 100 - dy) * 100; return gg, [dy * 100, gg]
@solver("plowback_growth")
def _(g): b = 1 - g["payout"] / 100; return b * g["ROE"], [b, b * g["ROE"]]
@solver("forward_pe")
def _(g): gr = g["b"] * g["ROE"]; pe = (1 - g["b"]) / ((g["R"] - gr) / 100); return pe, [gr, pe]
@solver("npvgo")
def _(g): e1 = g["EPS0"] * (1 + g["g"] / 100); ng = e1 / (g["R"] / 100); return g["P0"] - ng, [e1, ng, g["P0"] - ng]
@solver("quote_screen")
def _(g): eps = g["price"] / g["pe"]; return eps * g["shares"], [eps, eps * g["shares"]]
@solver("implied_growth")
def _(g): ratio = g["trailing"] / g["forward"]; return (ratio - 1) * 100, [ratio, (ratio - 1) * 100]
@solver("pe_comparables")
def _(g): e = g["eps0"] * (1 + g["g"] / 100) ** g["t"]; return g["pe"] * e, [e, g["pe"] * e]
@solver("ev_multiple")
def _(g): ev = g["ebitda"] * g["mult"]; eq = ev - g["debt"] + g["cash"]; return eq / g["shares"], [ev, eq, eq / g["shares"]]
@solver("fcf")
def _(g): ebit = g["ebitda"] - g["da"]; at = ebit * (1 - g["T"] / 100); f = at + g["da"] - g["capex"] - g["dwc"]; return f, [ebit, at, f]
@solver("fcfe")
def _(g): part = g["npat"] + g["da"] - g["capex"] - g["dwc"]; return part + g["ddebt"], [part, part + g["ddebt"]]
@solver("delta_wc")
def _(g): v = g["dCash"] + g["dInv"] + g["dRec"] - g["dPay"]; return v, [v]
@solver("arr")
def _(g): ap = sum(g["profits"]) / len(g["profits"]); ai = (g["I0"] + g["res"]) / 2; return ap / ai * 100, [ap, ai, ap / ai * 100]
@solver("payback")
def _(g):
    pb, cum, yrs = payback(g["I0"], g["flows"]); return pb, [cum, pb - yrs, pb]
@solver("discounted_payback")
def _(g):
    r = g["R"] / 100; pvs = [f / (1 + r) ** (i + 1) for i, f in enumerate(g["flows"])]
    pb, cum, yrs = payback(g["I0"], pvs)
    if pb is None: pb = 5 + (g["I0"] - cum) / pvs[4]
    return pb, [pvs[0], cum, pb]
@solver("npv_list")
def _(g): pv = npv(g["R"] / 100, [0] + g["flows"]); return pv - g["I0"], [pv, pv - g["I0"]]
@solver("irr_list")
def _(g): fl = [-g["I0"]] + g["flows"]; return irr(fl) * 100, [npv(g["R"] / 100, fl), irr(fl) * 100]
@solver("pi")
def _(g): pv = npv(g["R"] / 100, [0] + g["flows"]); return pv / g["I0"], [pv, pv / g["I0"]]
@solver("npv_profile")
def _(g): n2 = npv(g["R2v"] / 100, [-g["I0"]] + g["flows"]); return n2, [n2 + g["I0"], n2]
@solver("crossover")
def _(g):
    diff = [0] + [a - b for a, b in zip(g["A"], g["B"])]; x = irr(diff, -0.9, 2) * 100; return x, [diff[1], diff[3], x]
@solver("npv_pair")
def _(g):
    r = g["R"] / 100; na = npv(r, [-g["IA"]] + g["A"]); nb = npv(r, [-g["IB"]] + g["B"]); return abs(na - nb), [na, nb, abs(na - nb)]
@solver("eav")
def _(g):
    r = g["R"] / 100; pva = g["costA"] + g["opA"] * af(r, g["NA"]); e = pva / af(r, g["NA"]); return e, [pva, af(r, g["NA"]), e]
@solver("ccr")
def _(g): f = (1 + g["R"] / 100) ** g["N"]; v = g["v"] * f / (f - 1); return v, [f, v]
@solver("ocf")
def _(g): ebit = g["S"] - g["C"] - g["D"]; o = ebit * (1 - g["T"] / 100) + g["D"]; return o, [ebit, o]
@solver("nwc_change")
def _(g): n1 = g["S1"] * g["pctS"] / 100; n2 = g["S2"] * g["pctS"] / 100; return -(n2 - n1), [n2, n2 - n1, -(n2 - n1)]
@solver("five_categories")
def _(g): pre = g["rev"] - g["exp"]; return pre * (1 - g["T"] / 100), [pre, pre * (1 - g["T"] / 100)]
@solver("initial_outlay")
def _(g): return g["capex"] + g["nwc"] + g["land"], [g["capex"] + g["nwc"], g["capex"] + g["nwc"] + g["land"]]
@solver("cca_schedule")
def _(g):
    d = g["d"] / 100; c1 = 0.5 * d * g["I0"]; u1 = g["I0"] - c1; c2 = d * u1; return c2 * g["T"] / 100, [c1, u1, c2, c2 * g["T"] / 100]
@solver("half_year")
def _(g): v = g["m"] * g["d"] / 100 * g["I0"]; return v, [v]
@solver("dts")
def _(g): v = g["cca"] * g["T"] / 100; return v, [v]
@solver("pvcca")
def _(g):
    first, a, b, pv = pvcca(g["I0"], g["d"] / 100, g["T"] / 100, g["k"] / 100, mult=g["regime"], S=g["S"], N=g["N"])
    return pv, [g["I0"] * g["d"] / 100 * g["T"] / 100 / (g["k"] / 100 + g["d"] / 100), first, b, pv]
@solver("pool_open")
def _(g): _f, _a, _b, pv = pvcca(g["I0"], g["d"] / 100, g["T"] / 100, g["k"] / 100, mult=0.5); return pv, [pv]
@solver("cfat")
def _(g): recap, gain, cf = cfat(g["POD"], g["ACB"], g["UCC"], g["T"] / 100); return cf, [recap, gain, cf]
@solver("recapture")
def _(g): recap = g["POD"] - g["UCC"]; return recap * g["T"] / 100, [recap, recap * g["T"] / 100]
@solver("project_npv")
def _(g):
    k = g["k"] / 100; op = (g["S"] - g["C"]) * (1 - g["T"] / 100); pvop = op * af(k, g["N"])
    _f, _a, _b, sh = pvcca(g["capex"], g["d"] / 100, g["T"] / 100, k, mult=0.5, S=g["salv"], N=g["N"]); term = (g["salv"] + g["nwc"]) / (1 + k) ** g["N"]
    v = -g["capex"] - g["nwc"] + pvop + sh + term; return v, [-(g["capex"] + g["nwc"]), op, pvop, sh, term, v]
@solver("replacement_npv")
def _(g):
    k = g["k"] / 100; net = g["newCost"] - g["oldSalv"]; op = g["savings"] * (1 - g["T"] / 100); pvop = op * af(k, g["N"])
    _f, _a, _b, sh = pvcca(net, g["d"] / 100, g["T"] / 100, k, mult=0.5); v = -net + pvop + sh; return v, [net, op, pvop, sh, v]
@solver("bid_price")
def _(g):
    k = g["k"] / 100; _f, _a, _b, sh = pvcca(g["I0"], g["d"] / 100, g["T"] / 100, k, mult=0.5, S=g["salv"], N=g["N"]); term = (g["salv"] + g["nwc"]) / (1 + k) ** g["N"]
    known = -g["I0"] - g["nwc"] + sh + term; ann = -known / af(k, g["N"]); pre = ann / (1 - g["T"] / 100); price = (pre + g["qty"] * g["cost"]) / g["qty"]
    return price, [known, ann, pre, price]
@solver("required_savings")
def _(g):
    k = g["k"] / 100; _f, _a, _b, sh = pvcca(g["I0"], g["d"] / 100, g["T"] / 100, k, mult=0.5, S=g["salv"], N=g["N"]); pvs = g["salv"] / (1 + k) ** g["N"]
    known = -g["I0"] + sh + pvs; at = -known / af(k, g["N"]); return at / (1 - g["T"] / 100), [known, at, at / (1 - g["T"] / 100)]
@solver("eac_taxes")
def _(g):
    k = g["k"] / 100; a = af(k, g["N"]); _f, _a, _b, sh = pvcca(g["I0"], g["d"] / 100, g["T"] / 100, k, mult=0.5, S=g["salv"], N=g["N"])
    pvop = g["op"] * (1 - g["T"] / 100) * a; pvc = g["I0"] + pvop - sh - g["salv"] / (1 + k) ** g["N"]; return pvc / a, [pvop, sh, pvc, pvc / a]
@solver("fisher")
def _(g): ratio = (1 + g["nom"] / 100) / (1 + g["inf"] / 100); return (ratio - 1) * 100, [ratio, (ratio - 1) * 100]
def _ocf(Q, P, v, FC, T): return ((P - v) * Q / 1000 - FC) * (1 - T / 100)
@solver("sensitivity")
def _(g):
    a = af(g["k"] / 100, g["N"]); base = -g["I0"] + _ocf(g["Q"], g["P"], g["v"], g["FC"], g["T"]) * a; up = -g["I0"] + _ocf(g["Q"], g["P"] + g["dP"], g["v"], g["FC"], g["T"]) * a
    return (up - base) / g["dP"], [_ocf(g["Q"], g["P"], g["v"], g["FC"], g["T"]), base, up, (up - base) / g["dP"]]
@solver("scenario")
def _(g):
    m = g["pc"] / 100; a = af(g["k"] / 100, g["N"]); o = _ocf(g["Q"] * (1 - m), g["P"] * (1 - m), g["v"] * (1 + m), g["FC"] * (1 + m), g["T"]); return -g["I0"] + o * a, [o, -g["I0"] + o * a]
@solver("npv_breakeven")
def _(g):
    o = g["I0"] / af(g["k"] / 100, g["N"]); pre = o / (1 - g["T"] / 100); q = (g["FC"] * 1000 + pre * 1000) / (g["P"] - g["v"]); return round(q), [o, pre, q]
@solver("breakeven")
def _(g):
    cm = g["P"] - g["v"]; qc = g["FC"] * 1000 / cm; qa = (g["FC"] + g["D"]) * 1000 / cm; o = g["I0"] / af(g["k"] / 100, g["N"]); qf = (g["FC"] + o) * 1000 / cm; return round(qf), [qc, qa, o, qf]
@solver("dol")
def _(g): d = 1 + g["FC"] / g["ocf"]; return d * g["dq"], [d, d * g["dq"]]
@solver("decision_tree")
def _(g): ev = g["p"] * g["good"] + (1 - g["p"]) * g["bad"]; return ev - g["cost"], [ev, ev - g["cost"]]
@solver("abandonment")
def _(g):
    no = g["p"] * g["good"] + (1 - g["p"]) * g["bad"] - g["cost"]; w = g["p"] * g["good"] + (1 - g["p"]) * max(g["bad"], g["salvage"]) - g["cost"]; return w - no, [no, w, w - no]
@solver("states_er")
def _(g): e = sum(p * r for p, r in zip(g["p"], g["R"])); return e, [e]
@solver("states_sd")
def _(g):
    e = sum(p * r for p, r in zip(g["p"], g["R"])); var = sum(p * (r - e) ** 2 for p, r in zip(g["p"], g["R"])); return math.sqrt(var), [e, var, math.sqrt(var)]
@solver("hist_sd")
def _(g):
    m = sum(g["rets"]) / 5; ss = sum((x - m) ** 2 for x in g["rets"]); return math.sqrt(ss / 4), [m, ss, math.sqrt(ss / 4)]
@solver("risk_premium")
def _(g): ms = sum(g["stocks"]) / 4; mb = sum(g["bills"]) / 4; return ms - mb, [ms, mb, ms - mb]
@solver("normal_prob")
def _(g): z = -g["mean"] / g["sd"]; return ncdf(z) * 100, [z, ncdf(z) * 100]
@solver("two_asset_return")
def _(g): wa = g["a"] / (g["a"] + g["b"]); return wa * g["ra"] + (1 - wa) * g["rb"], [wa, wa * g["ra"] + (1 - wa) * g["rb"]]
@solver("two_asset_sd")
def _(g):
    t1 = g["wa"] ** 2 * g["sa"] ** 2; t2 = g["wb"] ** 2 * g["sb"] ** 2; t3 = 2 * g["rho"] * g["wa"] * g["sa"] * g["wb"] * g["sb"]; return math.sqrt(t1 + t2 + t3), [t1, t2, t3, math.sqrt(t1 + t2 + t3)]
@solver("cov_corr")
def _(g):
    p, A, M = g["p"], g["A"], g["M"]; ea = sum(x * y for x, y in zip(p, A)); em = sum(x * y for x, y in zip(p, M))
    cov = sum(x * (a - ea) * (m - em) for x, a, m in zip(p, A, M)); sa = math.sqrt(sum(x * (a - ea) ** 2 for x, a in zip(p, A))); sm = math.sqrt(sum(x * (m - em) ** 2 for x, m in zip(p, M)))
    return cov / (sa * sm), [ea, em, cov, sa, sm, cov / (sa * sm)]
@solver("beta_rho")
def _(g): b = g["rho"] * g["si"] / g["sm"]; return b, [b]
@solver("portfolio_beta")
def _(g): tot = sum(g["amounts"]) + g["rf"]; b = sum(a / tot * be for a, be in zip(g["amounts"], g["betas"])); return b, [tot, b]
@solver("target_beta")
def _(g): w = g["target"] / g["bs"] * 100; return w, [w]
@solver("capm")
def _(g): v = g["rf"] + g["beta"] * g["mrp"]; return v, [g["mrp"], v]
@solver("sml_alpha")
def _(g): req = g["rf"] + g["beta"] * g["mrp"]; return g["exp"] - req, [req, g["exp"] - req]
@solver("solve_rf")
def _(g): slope = (g["r2"] - g["r1"]) / (g["b2"] - g["b1"]); return g["r1"] - g["b1"] * slope, [slope, g["r1"] - g["b1"] * slope]
@solver("project_hurdle")
def _(g): v = g["rf"] + g["beta"] * g["mrp"]; return v, [v]
@solver("sharpe")
def _(g): v = (g["er"] - g["rf"]) / g["sd"]; return v, [v]
@solver("cal_mix")
def _(g): e = g["w"] * g["er"] + (1 - g["w"]) * g["rf"]; return g["w"] * g["sd"], [e, g["w"] * g["sd"]]


def generators(seeds):
    out = subprocess.run(["node", os.path.join(ROOT, "tools", "gen_dump.mjs"), str(seeds)], capture_output=True, text=True, encoding="utf-8", check=True).stdout
    dump = json.loads(out)
    total = 0
    for name, items in dump.items():
        if name not in SOLVERS:
            fail(f"generator {name} has no Python solver"); continue
        bad = 0
        for it in items:
            total += 1
            try:
                ans, steps = SOLVERS[name](it["givens"])
            except Exception as e:  # noqa: BLE001
                fail(f"{name} seed {it['seed']}: solver crashed: {e}"); bad += 1; continue
            if not within(ans, it["answer"], it["tolerance"]):
                fail(f"{name} seed {it['seed']}: JS answer {it['answer']} vs Python {ans:.4f}"); bad += 1
            if len(steps) != len(it["steps"]):
                fail(f"{name} seed {it['seed']}: {len(it['steps'])} JS steps vs {len(steps)} Python steps"); bad += 1
            else:
                for i, (s, js) in enumerate(zip(steps, it["steps"])):
                    if not within(s, js["value"], js.get("tolerance") or {"rel": 0.002, "abs": 0.01}):
                        fail(f"{name} seed {it['seed']}: step {i+1} '{js['label']}' JS {js['value']} vs Python {s:.4f}"); bad += 1
            for er in it["errors"]:
                lim = max((it["tolerance"] or {}).get("abs", 0) or 0, abs(it["answer"]) * ((it["tolerance"] or {}).get("rel", 0) or 0), abs(it["answer"]) * 0.004 + 0.005)
                if abs(er["value"] - it["answer"]) <= lim + 1e-9:
                    fail(f"{name} seed {it['seed']}: error '{er['id']}' value {er['value']} equals the answer"); bad += 1
            if not it["stem"] or len(it["stem"]) < 40 or it["solutionLines"] < 1 or it["keystrokes"] < 1:
                fail(f"{name} seed {it['seed']}: stem/solution/keystrokes missing"); bad += 1
            if not math.isfinite(it["answer"]):
                fail(f"{name} seed {it['seed']}: non-finite answer"); bad += 1
        print(("PASS" if not bad else "FAIL"), f"generator {name}: {len(items)} seeds, concept {items[0]['concept']}")
    print(f"generators: {len(dump)} generators x {seeds} seeds = {total} questions recomputed")
    return dump


def static_content():
    files = sorted(glob.glob(os.path.join(ROOT, "content", "fin201", "parts", "ch*_q*.json")))
    n = 0; bad = 0
    for f in files:
        try:
            arr = json.load(open(f, encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            fail(f"{os.path.basename(f)}: invalid JSON ({e})"); continue
        for q in arr:
            if q.get("type") not in ("numeric", "multistep"): continue
            n += 1
            try:
                v = evaluate(q.get("check"))
                if not within(v, q["answer"], q.get("tolerance")): fail(f"{q['id']}: check {v:.6g} vs answer {q['answer']}"); bad += 1
                for i, s in enumerate(q.get("steps") or []):
                    sv = evaluate(s.get("check"))
                    if not within(sv, s["value"], s.get("tolerance") or {"rel": 0.002, "abs": 0.01}): fail(f"{q['id']} step {i+1}: {sv:.6g} vs {s['value']}"); bad += 1
                for er in q.get("errors") or []:
                    ev = evaluate(er.get("check"))
                    if not within(ev, er["value"], er.get("tolerance") or {"rel": 0.002, "abs": 0.01}): fail(f"{q['id']} error {er.get('id')}: {ev:.6g} vs {er['value']}"); bad += 1
            except Exception as e:  # noqa: BLE001
                fail(f"{q.get('id')}: {e}"); bad += 1
    print(("PASS" if not bad else "FAIL"), f"static numeric questions: {n} recomputed across {len(files)} files")


# Derivatives pricing, bonds for their own sake, capital structure, raising capital and the US tax system are out of
# scope. Words like "hedge", "swap" or "put option" can appear legitimately in real-options prose, so the list is narrow.
SCOPE_TERMS = [r"black[- ]scholes", r"strike price", r"MACRS", r"convexity", r"modified duration", r"WACC", r"chapter 2[45]", r"binomial", r"futures contract", r"forward contract", r"capital structure", r"M&M", r"Modigliani", r"IPO", r"underwrit", r"bond price"]
def scope():
    files = sorted(glob.glob(os.path.join(ROOT, "content", "fin201", "parts", "*.json")))
    hits = 0
    for f in files:
        try:
            data = json.load(open(f, encoding="utf-8"))
        except Exception:  # noqa: BLE001
            continue
        items = data if isinstance(data, list) else [data]
        for it in items:
            text = json.dumps(it, ensure_ascii=False)
            for term in SCOPE_TERMS:
                m = re.search(term, text, re.I)
                if m:
                    hits += 1; fail(f"scope: {os.path.basename(f)} {it.get('id', 'meta')} mentions '{m.group(0)}'")
    print(("PASS" if not hits else "FAIL"), f"scope scan: {len(files)} files, {hits} out-of-scope mentions")


if __name__ == "__main__":
    seeds = int(sys.argv[1]) if len(sys.argv) > 1 else 25
    fixtures(); generators(seeds); static_content(); scope()
    print(f"\n{'ALL CHECKS PASSED' if not fails else str(len(fails)) + ' FAILURE(S)'}")
    sys.exit(1 if fails else 0)
