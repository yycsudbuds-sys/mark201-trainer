// FIN 201 number generators: one per calculation archetype (docs/FIN201_MT2_COURSE_MAP.md §4). Each generator takes
// a seeded random source and returns a complete numeric question: stem, givens, answer, steps, worked solution,
// calculator keystrokes and the error library (the number each classic mistake produces). tools/verify_fin201.py
// recomputes every one of them with an independent Python solver from the same givens.
// Pure JS, no DOM: node can import this file.

export function rng(seed) { let a = (seed >>> 0) || 1; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const ri = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const rs = (r, a, b, step) => Math.round((a + Math.floor(r() * ((b - a) / step + 1)) * step) * 1e6) / 1e6;
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const R2 = x => Math.round(x * 100) / 100;
const R4 = x => Math.round(x * 10000) / 10000;
const money = x => (x < 0 ? '−$' : '$') + Math.abs(x).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money0 = x => (x < 0 ? '−$' : '$') + Math.abs(Math.round(x)).toLocaleString('en-CA');
const pct = x => `${R2(x)}%`;
const FIRMS = ['Northgate Rail', 'Bow Valley Foods', 'Prairie Sky Energy', 'Maple Ridge Lumber', 'Kootenay Brewing', 'Tidewater Shipping', 'Red Deer Robotics', 'Laurentian Textiles', 'Fundy Fisheries', 'Yukon Minerals', 'Saskatoon Seed Co.', 'Harbourfront Hotels', 'Chinook Logistics', 'Capilano Software', 'Avalon Steel'];
const firm = r => pick(r, FIRMS);
export const AF = (R, N) => (1 - Math.pow(1 + R, -N)) / R;           // annuity factor
export function npv(R, flows) { return flows.reduce((s, cf, t) => s + cf / Math.pow(1 + R, t), 0); }
export function irr(flows, lo = -0.99, hi = 1.5) { let a = lo, b = hi; let fa = npv(a, flows); for (let i = 0; i < 200; i++) { const m = (a + b) / 2; const fm = npv(m, flows); if ((fa < 0) === (fm < 0)) { a = m; fa = fm; } else b = m; } return (a + b) / 2; }
export function pvcca(I0, d, T, k, { mult = 0.5, S = 0, N = 0 } = {}) { const first = mult === 0.5 ? (1 + 0.5 * k) / (1 + k) : mult === 1.5 ? (1.5 * k + 1) / (1 + k) : 1; const a = (I0 * d * T) / (k + d) * first; const b = S ? (S * d * T) / (k + d) / Math.pow(1 + k, N) : 0; return { first, a, b, pv: a - b }; }
export function cfat(POD, ACB, UCC, T) { const recap = Math.min(ACB, POD) - UCC; const gain = Math.max(POD - ACB, 0); return { recap, gain, cf: POD - T * recap - 0.5 * T * gain }; }
const normCdf = x => { const t = 1 / (1 + 0.2316419 * Math.abs(x)); const d = 0.3989423 * Math.exp(-x * x / 2); let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x >= 0 ? 1 - p : p; };
const tol$ = { abs: 0.05 }, tolPct = { abs: 0.05 }, tolRatio = { abs: 0.01 }, tolYears = { abs: 0.02 };
const step = (label, value, unit = '$', tolerance = null) => ({ label, value: R4(value), unit, tolerance: tolerance || (unit === '$' ? { abs: Math.max(0.05, Math.abs(value) * 0.001) } : unit === '%' ? tolPct : tolRatio) });
const err = (id, label, value, explain) => ({ id, label, value: R4(value), explain });

export const GENERATORS = {
  // ---- Chapter 8: stocks
  hpr_return: { concept: 'c08-hpr', difficulty: 1, make(r) {
    const P0 = rs(r, 18, 95, 0.5), D1 = rs(r, 0.4, 3.2, 0.1), P1 = R2(P0 * (1 + rs(r, -0.18, 0.3, 0.01)));
    const hpr = (P1 + D1) / P0 - 1, cg = (P1 - P0) / P0, dy = D1 / P0;
    return { stem: `You bought ${firm(r)} at ${money(P0)} a year ago. It paid a dividend of ${money(D1)} during the year and now trades at ${money(P1)}. What was your holding period return, in % per annum?`,
      givens: { P0, P1, D1 }, answer: R2(hpr * 100), unit: '%', tolerance: tolPct,
      steps: [step('Capital gain yield (P1 − P0)/P0', cg * 100, '%'), step('Dividend yield D1/P0', dy * 100, '%'), step('Holding period return', hpr * 100, '%')],
      solution: [`r_E = (P1 + D1)/P0 − 1 = (${P1} + ${D1})/${P0} − 1 = ${R4(hpr)}`, `= capital gain yield ${pct(cg * 100)} + dividend yield ${pct(dy * 100)} = ${pct(hpr * 100)} PA`],
      keystrokes: [`${P1} + ${D1} = ÷ ${P0} = − 1 = × 100`],
      errors: [err('div-by-p1', 'Dividend divided by the ending price', ((P1 - P0) / P0 + D1 / P1) * 100, 'The dividend yield uses today\'s price P0, not P1.'), err('forgot-minus-one', 'Forgot the −1', ((P1 + D1) / P0) * 100, '(P1 + D1)/P0 is a wealth ratio; subtract 1 for the return.'), err('omitted-dividend', 'Ignored the dividend', cg * 100, 'The holding period return includes the dividend.')] }; } },
  geo_average: { concept: 'c08-arith-vs-geo', difficulty: 2, make(r) {
    const rets = [rs(r, -12, 28, 1), rs(r, -12, 28, 1), rs(r, -12, 28, 1)];
    const prod = rets.reduce((p, x) => p * (1 + x / 100), 1); const geo = Math.pow(prod, 1 / 3) - 1; const arith = rets.reduce((s, x) => s + x, 0) / 3;
    return { stem: `${firm(r)} returned ${rets.map(x => pct(x)).join(', ')} in three successive years. What was the geometric (compound) average return, in % per annum?`,
      givens: { rets }, answer: R2(geo * 100), unit: '%', tolerance: tolPct,
      steps: [step('Product of (1 + R) factors', prod, '', { abs: 0.001 }), step('Geometric average', geo * 100, '%')],
      solution: [`R_G = [(1+R1)(1+R2)(1+R3)]^(1/3) − 1 = [${rets.map(x => (1 + x / 100).toFixed(2)).join(' × ')}]^(1/3) − 1`, `= ${prod.toFixed(4)}^(1/3) − 1 = ${pct(geo * 100)} PA (arithmetic average ${pct(arith)} is higher)`],
      keystrokes: [`${rets.map(x => (1 + x / 100).toFixed(2)).join(' × ')} = y^x 3 1/x = − 1 = × 100`],
      errors: [err('arith-for-geo', 'Arithmetic average instead of geometric', arith, 'The arithmetic mean ignores compounding; geometric is the return actually earned.'), err('geo-no-root', 'Forgot the N-th root', (prod - 1) * 100, 'The product is the total growth; take the cube root for the per-year rate.'), err('forgot-minus-one', 'Forgot the −1', Math.pow(prod, 1 / 3) * 100, 'The N-th root gives 1 + R_G.')] }; } },
  compound_value: { concept: 'c08-compound-value', difficulty: 2, make(r) {
    const V0 = rs(r, 1000, 20000, 500); const rets = [rs(r, -10, 25, 1), rs(r, -10, 25, 1), rs(r, -10, 25, 1)];
    const prod = rets.reduce((p, x) => p * (1 + x / 100), 1); const V = V0 * prod; const geo = Math.pow(prod, 1 / 3) - 1;
    return { stem: `${money0(V0)} is invested in ${firm(r)} for three years with returns of ${rets.map(x => pct(x)).join(', ')}. What is the holding worth at the end of year 3?`,
      givens: { V0, rets }, answer: R2(V), unit: '$', tolerance: tol$,
      steps: [step('Growth factor Π(1 + R)', prod, '', { abs: 0.001 }), step('Ending value V0 × Π(1 + R)', V)],
      solution: [`V3 = V0 × (1+R1)(1+R2)(1+R3) = ${money0(V0)} × ${rets.map(x => (1 + x / 100).toFixed(2)).join(' × ')} = ${money(V)}`, `Equivalent compound return ${pct(geo * 100)} PA`],
      keystrokes: [`${V0} × ${rets.map(x => (1 + x / 100).toFixed(2)).join(' × ')} =`],
      errors: [err('arith-for-geo', 'Used the arithmetic average for three years', V0 * Math.pow(1 + rets.reduce((s, x) => s + x, 0) / 300, 3), 'Averaging then compounding overstates the ending value; multiply the actual factors.'), err('arithmetic', 'Added the returns instead of compounding', V0 * (1 + rets.reduce((s, x) => s + x, 0) / 100), 'Returns compound: multiply the (1 + R) factors.')] }; } },
  constant_dividend: { concept: 'c08-constant-dividend', difficulty: 1, make(r) {
    const D = rs(r, 1, 6, 0.25), R = rs(r, 5, 12, 0.5);
    return { stem: `${firm(r)} preferred shares pay a fixed dividend of ${money(D)} per year forever. Investors require ${pct(R)} per annum. What is one share worth?`,
      givens: { D, R }, answer: R2(D / (R / 100)), unit: '$', tolerance: tol$, steps: [step('P0 = D/R', D / (R / 100))],
      solution: [`A constant dividend is a perpetuity: P0 = D/R = ${D}/${R / 100} = ${money(D / (R / 100))}`], keystrokes: [`${D} ÷ ${R / 100} =`],
      errors: [err('r-plus-g', 'Multiplied instead of dividing', D * R, 'Price = dividend divided by the rate.'), err('units', 'Rate not converted to a decimal', D / R, 'Divide by 0.0' + R + ', not by ' + R + '.')] }; } },
  gordon_price: { concept: 'c08-gordon-growth', difficulty: 2, make(r) {
    const D0 = rs(r, 0.8, 4, 0.05), g = rs(r, 2, 6, 0.5), R = rs(r, g + 4, 14, 0.5); const D1 = D0 * (1 + g / 100); const P0 = D1 / ((R - g) / 100);
    return { stem: `${firm(r)} just paid a dividend of ${money(D0)} per share. Dividends are expected to grow at ${pct(g)} per year indefinitely and investors require ${pct(R)} per annum. What is the share price today?`,
      givens: { D0, g, R }, answer: R2(P0), unit: '$', tolerance: tol$,
      steps: [step('Next dividend D1 = D0(1 + g)', D1), step('Price P0 = D1/(R − g)', P0)],
      solution: [`D1 = D0(1 + g) = ${D0} × ${(1 + g / 100).toFixed(3)} = ${R4(D1)}`, `P0 = D1/(R − g) = ${R4(D1)}/(${R / 100} − ${g / 100}) = ${money(P0)}`],
      keystrokes: [`${D0} × ${(1 + g / 100).toFixed(3)} = ÷ (${R / 100} − ${g / 100}) =`],
      errors: [err('d0-for-d1', 'Used D0 instead of D1', D0 / ((R - g) / 100), 'The dividend was just paid; the model needs next year\'s dividend D1 = D0(1 + g).'), err('grew-twice', 'Grew the dividend twice', D1 * (1 + g / 100) / ((R - g) / 100), 'One step of growth from D0 gives D1.'), err('r-plus-g', 'Added g to R in the denominator', D1 / ((R + g) / 100), 'The denominator is R minus g.')] }; } },
  gordon_return: { concept: 'c08-required-return-components', difficulty: 2, make(r) {
    const D0 = rs(r, 0.8, 4, 0.05), g = rs(r, 2, 7, 0.5), P0 = rs(r, 20, 90, 0.5); const D1 = D0 * (1 + g / 100); const dy = D1 / P0; const Rr = dy * 100 + g;
    return { stem: `${firm(r)} trades at ${money(P0)}. It just paid a dividend of ${money(D0)} and dividends grow at ${pct(g)} per year. What return do investors require, in % per annum?`,
      givens: { D0, g, P0 }, answer: R2(Rr), unit: '%', tolerance: tolPct,
      steps: [step('D1 = D0(1 + g)', D1), step('Dividend yield D1/P0', dy * 100, '%'), step('R = D1/P0 + g', Rr, '%')],
      solution: [`D1 = ${D0} × ${(1 + g / 100).toFixed(3)} = ${R4(D1)}`, `R = D1/P0 + g = ${R4(D1)}/${P0} + ${g / 100} = ${pct(dy * 100)} + ${pct(g)} = ${pct(Rr)} PA`],
      keystrokes: [`${D0} × ${(1 + g / 100).toFixed(3)} = ÷ ${P0} = + ${g / 100} = × 100`],
      errors: [err('d0-for-d1', 'Used D0 for the dividend yield', (D0 / P0) * 100 + g, 'Use next year\'s dividend D1.'), err('forgot-minus-one', 'Forgot to add g', dy * 100, 'Required return = dividend yield + capital gain rate g.')] }; } },
  growing_annuity: { concept: 'c08-growing-annuity', difficulty: 3, make(r) {
    const D1 = rs(r, 1, 4, 0.1), g = rs(r, 3, 12, 1), R = g + rs(r, 3, 8, 0.5), N = ri(r, 4, 10); const gp = g / 100, Rp = R / 100; const pv = D1 / (Rp - gp) * (1 - Math.pow((1 + gp) / (1 + Rp), N));
    return { stem: `${firm(r)} will pay ${money(D1)} next year, growing at ${pct(g)} per year for ${N} years in total and nothing afterwards. At ${pct(R)} per annum, what are these dividends worth today?`,
      givens: { D1, g, R, N }, answer: R2(pv), unit: '$', tolerance: tol$,
      steps: [step('Growth ratio ((1+g)/(1+R))^N', Math.pow((1 + gp) / (1 + Rp), N), '', { abs: 0.0005 }), step('PV = D1/(R − g) × [1 − ratio]', pv)],
      solution: [`PV = D1/(R − g) × [1 − ((1+g)/(1+R))^N] = ${D1}/(${Rp} − ${gp}) × [1 − (${(1 + gp).toFixed(2)}/${(1 + Rp).toFixed(3)})^${N}]`, `= ${R4(D1 / (Rp - gp))} × ${R4(1 - Math.pow((1 + gp) / (1 + Rp), N))} = ${money(pv)}`],
      keystrokes: [`(${(1 + gp).toFixed(2)} ÷ ${(1 + Rp).toFixed(3)}) y^x ${N} = ± + 1 = × ${D1} ÷ (${Rp} − ${gp}) =`],
      errors: [err('horizon-off-by-one', 'Treated it as a growing perpetuity', D1 / (Rp - gp), 'The dividends stop after N years; apply the [1 − ratio^N] factor.'), err('wrong-n-annuity', 'Used an ordinary annuity factor', D1 * AF(Rp, N), 'The payments grow at g; use the growing annuity.')] }; } },
  two_stage: { concept: 'c08-two-stage', difficulty: 3, multistep: true, make(r) {
    const D0 = rs(r, 1, 3, 0.05), g1 = rs(r, 12, 30, 1), N = ri(r, 2, 4), g2 = rs(r, 2, 5, 0.5), R = rs(r, 9, 14, 0.5); const Rp = R / 100;
    const divs = []; let d = D0; for (let t = 1; t <= N; t++) { d = d * (1 + g1 / 100); divs.push(d); }
    const DN1 = divs[N - 1] * (1 + g2 / 100); const PN = DN1 / (Rp - g2 / 100);
    const pvD = divs.reduce((s, x, i) => s + x / Math.pow(1 + Rp, i + 1), 0); const pvP = PN / Math.pow(1 + Rp, N); const P0 = pvD + pvP;
    return { stem: `${firm(r)} just paid ${money(D0)}. Dividends will grow at ${pct(g1)} per year for the next ${N} years, then at ${pct(g2)} per year forever. Investors require ${pct(R)} per annum. What is the share worth today?`,
      givens: { D0, g1, N, g2, R }, answer: R2(P0), unit: '$', tolerance: { abs: 0.1 },
      steps: [step(`Last fast-growth dividend D${N}`, divs[N - 1]), step(`First constant-growth dividend D${N + 1} = D${N}(1 + g2)`, DN1), step(`Horizon price P${N} = D${N + 1}/(R − g2)`, PN), step(`PV of dividends D1…D${N}`, pvD), step(`PV of P${N}`, pvP), step('P0 = total', P0)],
      solution: [`Dividends: ${divs.map((x, i) => `D${i + 1} = ${R4(x)}`).join(', ')}`, `D${N + 1} = D${N}(1 + g2) = ${R4(DN1)}; P${N} = D${N + 1}/(R − g2) = ${R4(DN1)}/(${Rp} − ${g2 / 100}) = ${money(PN)}`, `P0 = Σ D_t/(1+R)^t + P${N}/(1+R)^${N} = ${money(pvD)} + ${money(pvP)} = ${money(P0)}`],
      keystrokes: [`CF worksheet: CF0 = 0, C01 = ${R2(divs[0])}, …, C0${N} = ${R2(divs[N - 1] + PN)} (last dividend plus P${N}), NPV I = ${R}, CPT`],
      errors: [err('horizon-off-by-one', `Discounted P${N} by ${N + 1} years`, pvD + PN / Math.pow(1 + Rp, N + 1), `P${N} sits at year ${N}, one period before D${N + 1}.`), err('horizon-wrong-g', `Grew D${N} by g1 to get D${N + 1}`, pvD + (divs[N - 1] * (1 + g1 / 100) / (Rp - g2 / 100)) / Math.pow(1 + Rp, N), 'The first constant-growth dividend grows at g2.'), err('omitted-dividend', 'Forgot the fast-growth dividends', pvP, 'Add the PV of every explicit dividend.')] }; } },
  solve_g: { concept: 'c08-solve-backwards', difficulty: 3, make(r) {
    const D1 = rs(r, 1, 4, 0.1), R = rs(r, 8, 14, 0.5), g = rs(r, 2, 6, 0.5); const P0 = R2(D1 / ((R - g) / 100)); const gSolved = (R / 100 - D1 / P0) * 100;
    return { stem: `${firm(r)} trades at ${money(P0)} and will pay ${money(D1)} next year. Investors require ${pct(R)} per annum. What constant growth rate is the market pricing in, in % per annum?`,
      givens: { D1, R, P0 }, answer: R2(gSolved), unit: '%', tolerance: tolPct,
      steps: [step('Dividend yield D1/P0', (D1 / P0) * 100, '%'), step('g = R − D1/P0', gSolved, '%')],
      solution: [`P0 = D1/(R − g) ⇒ g = R − D1/P0 = ${R / 100} − ${D1}/${P0} = ${R4(gSolved / 100)} = ${pct(gSolved)} PA`], keystrokes: [`${D1} ÷ ${P0} = ± + ${R / 100} = × 100`],
      errors: [err('g-as-r', 'Returned the dividend yield', (D1 / P0) * 100, 'Growth is the required return minus the dividend yield.'), err('d0-for-d1', 'Grew D1 again before dividing', (R / 100 - D1 * (1 + gSolved / 100) / P0) * 100, 'D1 is already next year\'s dividend.')] }; } },
  plowback_growth: { concept: 'c08-plowback-growth', difficulty: 2, make(r) {
    const EPS = rs(r, 2, 8, 0.1), payout = rs(r, 20, 60, 5), ROE = rs(r, 8, 20, 0.5); const b = 1 - payout / 100; const g = b * ROE;
    return { stem: `${firm(r)} earns ${money(EPS)} per share, pays out ${pct(payout)} of earnings as dividends and earns a return on equity of ${pct(ROE)}. What growth rate should you expect, in % per annum?`,
      givens: { EPS, payout, ROE }, answer: R2(g), unit: '%', tolerance: tolPct,
      steps: [step('Plowback b = 1 − payout', b, '', { abs: 0.005 }), step('g = b × ROE', g, '%')],
      solution: [`b = 1 − payout = 1 − ${payout / 100} = ${b.toFixed(2)}`, `g = b × ROE = ${b.toFixed(2)} × ${ROE / 100} = ${pct(g)} PA`], keystrokes: [`1 − ${payout / 100} = × ${ROE} =`],
      errors: [err('payout-as-plowback', 'Used the payout ratio as b', (payout / 100) * ROE, 'b is the fraction retained: 1 − payout.'), err('units', 'Returned b × ROE as a fraction of EPS', b * EPS, 'g = b × ROE; EPS does not enter.')] }; } },
  forward_pe: { concept: 'c08-forward-pe', difficulty: 2, make(r) {
    const b = rs(r, 0.3, 0.7, 0.05), ROE = rs(r, 8, 16, 0.5), R = rs(r, 9, 14, 0.5); const g = b * ROE; const pe = (1 - b) / ((R - g) / 100);
    return { stem: `${firm(r)} retains ${pct(b * 100)} of its earnings, earns ${pct(ROE)} on equity and investors require ${pct(R)} per annum. What forward P/E ratio does the Gordon model imply?`,
      givens: { b, ROE, R }, answer: R2(pe), unit: 'x', tolerance: tolRatio,
      steps: [step('g = b × ROE', g, '%'), step('Forward P/E = (1 − b)/(R − g)', pe, 'x')],
      solution: [`g = b × ROE = ${b} × ${ROE / 100} = ${pct(g)}`, `P/E = (1 − b)/(R − g) = ${(1 - b).toFixed(2)}/(${R / 100} − ${(g / 100).toFixed(4)}) = ${R2(pe)}x`], keystrokes: [`1 − ${b} = ÷ (${R / 100} − ${(g / 100).toFixed(4)}) =`],
      errors: [err('payout-as-plowback', 'Used b in the numerator', b / ((R - g) / 100), 'The numerator is the payout 1 − b.'), err('g-as-r', 'Divided by R only', (1 - b) / (R / 100), 'Growth reduces the denominator: R − g.')] }; } },
  npvgo: { concept: 'c08-npvgo', difficulty: 2, make(r) {
    const EPS0 = rs(r, 2, 6, 0.1), g = rs(r, 3, 10, 0.5), R = rs(r, 9, 14, 0.5), P0 = rs(r, 30, 90, 0.5); const EPS1 = EPS0 * (1 + g / 100); const noGrowth = EPS1 / (R / 100); const v = P0 - noGrowth;
    return { stem: `${firm(r)} trades at ${money(P0)}. Earnings were ${money(EPS0)} per share this year and are expected to grow ${pct(g)} next year. Investors require ${pct(R)} per annum. What is the net present value of growth opportunities (NPVGO) per share?`,
      givens: { EPS0, g, R, P0 }, answer: R2(v), unit: '$', tolerance: tol$,
      steps: [step('EPS1 = EPS0(1 + g)', EPS1), step('No-growth value EPS1/R', noGrowth), step('NPVGO = P0 − EPS1/R', v)],
      solution: [`EPS1 = ${EPS0} × ${(1 + g / 100).toFixed(3)} = ${R4(EPS1)}`, `No-growth value = EPS1/R = ${R4(EPS1)}/${R / 100} = ${money(noGrowth)}`, `NPVGO = P0 − EPS1/R = ${money(P0)} − ${money(noGrowth)} = ${money(v)}${v < 0 ? ' (growth is destroying value, or the stock is undervalued)' : ''}`],
      keystrokes: [`${EPS0} × ${(1 + g / 100).toFixed(3)} = ÷ ${R / 100} = ± + ${P0} =`],
      errors: [err('eps0-for-eps1', 'Used EPS0 instead of EPS1', P0 - EPS0 / (R / 100), 'The no-growth value uses next year\'s earnings EPS1.'), err('sign-cf0', 'Subtracted in the wrong order', noGrowth - P0, 'NPVGO = price minus the no-growth value.')] }; } },
  quote_screen: { concept: 'c08-quote-screen', difficulty: 2, make(r) {
    const price = rs(r, 15, 120, 0.25), pe = rs(r, 9, 28, 0.5), shares = rs(r, 20, 400, 5); const eps = price / pe; const ni = eps * shares; const cap = price * shares;
    return { stem: `A quote screen shows ${firm(r)} at ${money(price)} with a trailing P/E of ${pe} and ${shares} million shares outstanding. What was last year's net income, in $ millions?`,
      givens: { price, pe, shares }, answer: R2(ni), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('EPS = price ÷ P/E', eps), step('Net income = EPS × shares ($ millions)', ni, '$', { abs: 0.5 })],
      solution: [`EPS = P/(P/E) = ${price}/${pe} = ${R4(eps)}`, `Net income = EPS × shares = ${R4(eps)} × ${shares}M = $${R2(ni)}M (market cap ${money0(cap)}M)`], keystrokes: [`${price} ÷ ${pe} = × ${shares} =`],
      errors: [err('trailing-forward-mix', 'Returned the market capitalisation', cap, 'Market cap is price × shares; net income needs EPS first.'), err('arithmetic', 'Multiplied price by P/E', price * pe * shares, 'EPS is price divided by the P/E.')] }; } },
  implied_growth: { concept: 'c08-implied-growth', difficulty: 2, make(r) {
    const trailing = rs(r, 12, 30, 0.1), g = rs(r, 2, 15, 0.5); const forward = R2(trailing / (1 + g / 100)); const gi = (trailing / forward - 1) * 100;
    return { stem: `${firm(r)} shows a trailing P/E of ${trailing} and a forward P/E of ${forward}. What earnings growth over the coming year is the market expecting, in %?`,
      givens: { trailing, forward }, answer: R2(gi), unit: '%', tolerance: { abs: 0.1 },
      steps: [step('EPS1/EPS0 = trailing P/E ÷ forward P/E', trailing / forward, '', { abs: 0.002 }), step('Implied growth = ratio − 1', gi, '%', { abs: 0.1 })],
      solution: [`Same price, two earnings figures: P/EPS0 = ${trailing} and P/EPS1 = ${forward} ⇒ EPS1/EPS0 = ${trailing}/${forward} = ${R4(trailing / forward)}`, `Implied growth = ${R4(trailing / forward)} − 1 = ${pct(gi)}`], keystrokes: [`${trailing} ÷ ${forward} = − 1 = × 100`],
      errors: [err('trailing-forward-mix', 'Divided forward by trailing', (forward / trailing - 1) * 100, 'Growth = trailing ÷ forward − 1 (earnings rise, so the forward multiple is lower).'), err('forgot-minus-one', 'Reported the ratio itself', trailing / forward, 'Subtract 1 to get the growth rate.')] }; } },
  pe_comparables: { concept: 'c08-pe-comparables', difficulty: 2, make(r) {
    const eps0 = rs(r, 1.5, 6, 0.1), g = rs(r, 3, 12, 0.5), pe = rs(r, 10, 24, 0.5), t = ri(r, 2, 5); const epsT = eps0 * Math.pow(1 + g / 100, t); const price = pe * epsT;
    return { stem: `${firm(r)} earned ${money(eps0)} per share this year. Earnings grow at ${pct(g)} per year and comparable firms trade at ${pe} times earnings. What price do you forecast for the stock in ${t} years?`,
      givens: { eps0, g, pe, t }, answer: R2(price), unit: '$', tolerance: tol$,
      steps: [step(`EPS in year ${t} = EPS0(1 + g)^${t}`, epsT), step('Price = P/E × EPS', price)],
      solution: [`EPS_${t} = ${eps0} × ${(1 + g / 100).toFixed(3)}^${t} = ${R4(epsT)}`, `P_${t} = P/E × EPS_${t} = ${pe} × ${R4(epsT)} = ${money(price)}`], keystrokes: [`${(1 + g / 100).toFixed(3)} y^x ${t} = × ${eps0} × ${pe} =`],
      errors: [err('eps0-for-eps1', 'Applied the multiple to today\'s EPS', pe * eps0, `The question asks for the price in ${t} years: grow the earnings first.`), err('horizon-off-by-one', `Grew EPS ${t - 1} years`, pe * eps0 * Math.pow(1 + g / 100, t - 1), `Grow for the full ${t} years.`)] }; } },
  ev_multiple: { concept: 'c08-ev-multiples', difficulty: 3, make(r) {
    const ebitda = rs(r, 40, 400, 5), mult = rs(r, 5, 12, 0.5), debt = rs(r, 20, 300, 5), cash = rs(r, 5, 80, 5), shares = rs(r, 10, 100, 1); const ev = ebitda * mult; const eq = ev - debt + cash; const ps = eq / shares;
    return { stem: `${firm(r)} has EBITDA of $${ebitda}M, debt of $${debt}M, cash of $${cash}M and ${shares}M shares. Comparable firms trade at ${mult}× EV/EBITDA. What is the implied price per share?`,
      givens: { ebitda, mult, debt, cash, shares }, answer: R2(ps), unit: '$', tolerance: tol$,
      steps: [step('EV = multiple × EBITDA ($M)', ev, '$', { abs: 0.5 }), step('Equity = EV − Debt + Cash ($M)', eq, '$', { abs: 0.5 }), step('Price = Equity ÷ shares', ps)],
      solution: [`EV = ${mult} × ${ebitda} = $${R2(ev)}M`, `Equity = EV − Debt + Cash = ${R2(ev)} − ${debt} + ${cash} = $${R2(eq)}M`, `Price = ${R2(eq)}/${shares} = ${money(ps)}`], keystrokes: [`${ebitda} × ${mult} − ${debt} + ${cash} = ÷ ${shares} =`],
      errors: [err('missing-delta-debt', 'Forgot net debt (EV ÷ shares)', ev / shares, 'An EV multiple values the whole firm; subtract debt and add cash to reach equity.'), err('sign-cf0', 'Added debt and subtracted cash', (ev + debt - cash) / shares, 'Equity = EV − Debt + Cash.')] }; } },
  fcf: { concept: 'c08-fcf-ev', difficulty: 2, multistep: true, make(r) {
    const ebitda = rs(r, 200, 900, 10), da = rs(r, 40, 150, 5), T = rs(r, 25, 30, 1), capex = rs(r, 50, 200, 5), dwc = rs(r, -20, 40, 5); const ebit = ebitda - da; const fcf = ebit * (1 - T / 100) + da - capex - dwc;
    return { stem: `${firm(r)} reports EBITDA of $${ebitda}k, depreciation and amortisation of $${da}k, capital expenditure of $${capex}k and a change in working capital of ${dwc < 0 ? '−' : ''}$${Math.abs(dwc)}k. The tax rate is ${pct(T)}. What is free cash flow (FCF), in $ thousands?`,
      givens: { ebitda, da, T, capex, dwc }, answer: R2(fcf), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('EBIT = EBITDA − D&A', ebit, '$', { abs: 0.5 }), step('EBIT × (1 − T)', ebit * (1 - T / 100), '$', { abs: 0.5 }), step('FCF = EBIT(1 − T) + D&A − CAPEX − ΔWC', fcf, '$', { abs: 0.5 })],
      solution: [`EBIT = ${ebitda} − ${da} = ${ebit}`, `FCF = EBIT(1 − T) + D&A − CAPEX − ΔWC = ${ebit} × ${(1 - T / 100).toFixed(2)} + ${da} − ${capex} − (${dwc}) = $${R2(fcf)}k`], keystrokes: [`${ebit} × ${(1 - T / 100).toFixed(2)} + ${da} − ${capex} − ${dwc} =`],
      errors: [err('npat-in-fcf', 'Taxed EBITDA instead of EBIT', ebitda * (1 - T / 100) + da - capex - dwc, 'Tax applies to EBIT; D&A is added back after tax.'), err('interest-in-fcf', 'Forgot to add back D&A', ebit * (1 - T / 100) - capex - dwc, 'D&A is a non-cash expense: add it back.'), err('sign-cf0', 'Added ΔWC', ebit * (1 - T / 100) + da - capex + dwc, 'An increase in working capital uses cash: subtract it.')] }; } },
  fcfe: { concept: 'c08-fcfe', difficulty: 2, make(r) {
    const npat = rs(r, 100, 600, 10), da = rs(r, 40, 150, 5), capex = rs(r, 50, 200, 5), dwc = rs(r, -20, 40, 5), ddebt = rs(r, -60, 80, 10); const v = npat + da - capex - dwc + ddebt;
    return { stem: `${firm(r)} earned net profit after tax of $${npat}k with D&A of $${da}k, capital expenditure of $${capex}k, a change in working capital of ${dwc < 0 ? '−' : ''}$${Math.abs(dwc)}k and net ${ddebt < 0 ? 'repayment' : 'borrowing'} of $${Math.abs(ddebt)}k. What is free cash flow to equity (FCFE), in $ thousands?`,
      givens: { npat, da, capex, dwc, ddebt }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('NPAT + D&A − CAPEX − ΔWC', npat + da - capex - dwc, '$', { abs: 0.5 }), step('+ ΔDebt = FCFE', v, '$', { abs: 0.5 })],
      solution: [`FCFE = NPAT + D&A − CAPEX − ΔWC + ΔDebt = ${npat} + ${da} − ${capex} − (${dwc}) + (${ddebt}) = $${R2(v)}k`], keystrokes: [`${npat} + ${da} − ${capex} − ${dwc} + ${ddebt} =`],
      errors: [err('missing-delta-debt', 'Forgot the change in debt', npat + da - capex - dwc, 'FCFE includes net borrowing: cash from lenders is available to equity.'), err('sign-cf0', 'Reversed the sign of ΔDebt', npat + da - capex - dwc - ddebt, 'Net borrowing adds cash; repayment removes it.')] }; } },
  delta_wc: { concept: 'c08-working-capital', difficulty: 1, make(r) {
    const dInv = rs(r, -30, 60, 5), dRec = rs(r, -30, 60, 5), dPay = rs(r, -30, 60, 5), dCash = rs(r, -20, 30, 5); const v = dCash + dInv + dRec - dPay;
    return { stem: `During the year ${firm(r)}'s inventory changed by ${dInv}, receivables by ${dRec}, payables by ${dPay} and cash by ${dCash} (all $ thousands, increases positive). What is the change in working capital, in $ thousands?`,
      givens: { dInv, dRec, dPay, dCash }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 }, steps: [step('ΔWC = ΔCash + ΔInventory + ΔReceivables − ΔPayables', v, '$', { abs: 0.5 })],
      solution: [`WC = Cash + Inventory + Receivables − Payables ⇒ ΔWC = ${dCash} + ${dInv} + ${dRec} − (${dPay}) = ${v}`, v > 0 ? 'A positive ΔWC is a cash outflow.' : 'A negative ΔWC frees cash.'], keystrokes: [`${dCash} + ${dInv} + ${dRec} − ${dPay} =`],
      errors: [err('sign-cf0', 'Added the payables change', dCash + dInv + dRec + dPay, 'Payables are a current liability: an increase reduces working capital.'), err('omitted-dividend', 'Left out cash', dInv + dRec - dPay, 'The professor\'s definition includes cash.')] }; } },
  // ---- Chapter 9: decision rules
  arr: { concept: 'c09-arr', difficulty: 2, make(r) {
    const I0 = rs(r, 200, 900, 10), res = rs(r, 0, 120, 10), profits = [rs(r, 20, 120, 5), rs(r, 20, 120, 5), rs(r, 20, 120, 5), rs(r, 20, 120, 5)]; const avgP = profits.reduce((s, x) => s + x, 0) / 4; const avgI = (I0 + res) / 2; const v = avgP / avgI * 100;
    return { stem: `A ${firm(r)} plant costs $${I0}k and will have a book value of $${res}k after four years. Profits after tax are forecast at ${profits.map(x => '$' + x + 'k').join(', ')}. What is the accounting rate of return (average profit over average investment), in %?`,
      givens: { I0, res, profits }, answer: R2(v), unit: '%', tolerance: tolPct,
      steps: [step('Average annual profit', avgP, '$', { abs: 0.5 }), step('Average investment (I0 + book value)/2', avgI, '$', { abs: 0.5 }), step('ARR = average profit ÷ average investment', v, '%')],
      solution: [`Average profit = (${profits.join(' + ')})/4 = ${R2(avgP)}`, `Average investment = (${I0} + ${res})/2 = ${avgI}`, `ARR = ${R2(avgP)}/${avgI} = ${pct(v)}`], keystrokes: [`(${profits.join(' + ')}) ÷ 4 = ÷ ((${I0} + ${res}) ÷ 2) = × 100`],
      errors: [err('arr-divide-i0', 'Divided by the initial investment', avgP / I0 * 100, 'ARR uses the average investment (I0 + residual)/2.'), err('arr-cash-not-profit', 'Used total profit over four years', avgP * 4 / avgI * 100, 'Average the yearly profits first.')] }; } },
  payback: { concept: 'c09-payback', difficulty: 2, make(r) {
    const I0 = rs(r, 300, 900, 10); const flows = [rs(r, 80, 260, 10), rs(r, 80, 260, 10), rs(r, 80, 260, 10), rs(r, 80, 260, 10), rs(r, 80, 260, 10)];
    let cum = 0, yrs = 0, pb = null; for (let i = 0; i < flows.length; i++) { if (cum + flows[i] >= I0) { pb = i + (I0 - cum) / flows[i]; break; } cum += flows[i]; yrs++; }
    if (pb === null) { flows[4] = I0; cum = flows.slice(0, 4).reduce((s, x) => s + x, 0); pb = 4 + (I0 - cum) / flows[4]; yrs = 4; }
    return { stem: `${firm(r)} invests $${I0}k today and expects cash flows of ${flows.map(x => '$' + x + 'k').join(', ')} over the next five years. What is the payback period, in years?`,
      givens: { I0, flows }, answer: R2(pb), unit: 'years', tolerance: tolYears,
      steps: [step(`Cumulative cash flow after year ${yrs}`, cum, '$', { abs: 0.5 }), step(`Fraction of year ${yrs + 1} = remaining ÷ year ${yrs + 1} flow`, pb - yrs, 'years', tolYears), step('Payback period', pb, 'years', tolYears)],
      solution: [`Cumulative after year ${yrs}: ${cum}; remaining ${I0 - cum}`, `Payback = ${yrs} + ${I0 - cum}/${flows[yrs]} = ${R2(pb)} years`], keystrokes: [`${I0} − ${cum} = ÷ ${flows[yrs]} = + ${yrs} =`],
      errors: [err('payback-after-recovery', 'Counted the recovery year in full', yrs + 1, 'Use the fraction of the year in which the outlay is recovered.'), err('divided-by-n', 'Divided the outlay by the average flow', I0 / (flows.reduce((s, x) => s + x, 0) / 5), 'Payback uses the cumulative flows year by year, not an average.')] }; } },
  discounted_payback: { concept: 'c09-discounted-payback', difficulty: 3, make(r) {
    const I0 = rs(r, 300, 700, 10), R = rs(r, 6, 12, 1); const flows = [rs(r, 120, 260, 10), rs(r, 120, 260, 10), rs(r, 120, 260, 10), rs(r, 120, 260, 10), rs(r, 120, 260, 10)];
    const pvs = flows.map((x, i) => x / Math.pow(1 + R / 100, i + 1)); let cum = 0, yrs = 0, pb = null;
    for (let i = 0; i < pvs.length; i++) { if (cum + pvs[i] >= I0) { pb = i + (I0 - cum) / pvs[i]; break; } cum += pvs[i]; yrs++; }
    if (pb === null) { pb = 5 + (I0 - cum) / pvs[4]; yrs = 5; }
    return { stem: `${firm(r)} invests $${I0}k today and expects ${flows.map(x => '$' + x + 'k').join(', ')} over five years. At ${pct(R)} per annum, what is the discounted payback period, in years?`,
      givens: { I0, R, flows }, answer: R2(pb), unit: 'years', tolerance: tolYears,
      steps: [step('PV of year 1 flow', pvs[0], '$', { abs: 0.5 }), step(`Cumulative PV after year ${Math.min(yrs, 5)}`, cum, '$', { abs: 1 }), step('Discounted payback', pb, 'years', tolYears)],
      solution: [`PVs: ${pvs.map((x, i) => `year ${i + 1} ${R2(x)}`).join(', ')}`, `Cumulative PV after year ${Math.min(yrs, 5)}: ${R2(cum)}; payback = ${yrs} + ${R2(I0 - cum)}/${R2(pvs[Math.min(yrs, 4)])} = ${R2(pb)} years`], keystrokes: [`${flows[0]} ÷ 1.${String(R).padStart(2, '0')} = … (each year), accumulate`],
      errors: [err('payback-after-recovery', 'Ordinary (undiscounted) payback', (() => { let c = 0; for (let i = 0; i < flows.length; i++) { if (c + flows[i] >= I0) return i + (I0 - c) / flows[i]; c += flows[i]; } return 6; })(), 'Discount each flow before accumulating.'), err('cf0-as-period-1', 'Discounted year 1 by two periods', (() => { const p = flows.map((x, i) => x / Math.pow(1 + R / 100, i + 2)); let c = 0; for (let i = 0; i < p.length; i++) { if (c + p[i] >= I0) return i + (I0 - c) / p[i]; c += p[i]; } return 6; })(), 'The first cash flow arrives one period from now.')] }; } },
  npv_list: { concept: 'c09-npv-rule', difficulty: 2, make(r) {
    const I0 = rs(r, 200, 800, 10), R = rs(r, 6, 14, 0.5); const flows = [rs(r, 60, 300, 10), rs(r, 60, 300, 10), rs(r, 60, 300, 10), rs(r, 60, 300, 10)]; const pv = npv(R / 100, [0, ...flows]); const v = pv - I0;
    return { stem: `${firm(r)} can invest $${I0}k today for cash flows of ${flows.map(x => '$' + x + 'k').join(', ')} at the end of each of the next four years. The required return is ${pct(R)} per annum. What is the NPV, in $ thousands?`,
      givens: { I0, R, flows }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('PV of the inflows', pv, '$', { abs: 0.5 }), step('NPV = CF0 + PV', v, '$', { abs: 0.5 })],
      solution: [`PV = ${flows.map((x, i) => `${x}/${(1 + R / 100).toFixed(3)}^${i + 1}`).join(' + ')} = ${R2(pv)}`, `NPV = −${I0} + ${R2(pv)} = ${R2(v)} ⇒ ${v > 0 ? 'accept' : 'reject'}`], keystrokes: [`CF0 = −${I0}, C01 = ${flows[0]}, C02 = ${flows[1]}, C03 = ${flows[2]}, C04 = ${flows[3]}, NPV I = ${R}, CPT`],
      errors: [err('sign-cf0', 'Forgot the outlay (PV only)', pv, 'NPV = CF0 + PV; the outlay is negative.'), err('cf0-as-period-1', 'Discounted the outlay one period', pv - I0 / (1 + R / 100), 'CF0 is today: it is not discounted.'), err('arithmetic', 'Undiscounted sum minus outlay', flows.reduce((s, x) => s + x, 0) - I0, 'Discount each flow.')] }; } },
  irr_list: { concept: 'c09-irr-rule', difficulty: 3, make(r) {
    const I0 = rs(r, 200, 600, 10); const flows = [rs(r, 70, 250, 10), rs(r, 70, 250, 10), rs(r, 70, 250, 10), rs(r, 70, 250, 10)]; const all = [-I0, ...flows]; const v = irr(all) * 100; const R = rs(r, 6, 14, 0.5);
    return { stem: `${firm(r)} can invest $${I0}k today for cash flows of ${flows.map(x => '$' + x + 'k').join(', ')} over four years. What is the project's IRR, in % per annum? (The required return is ${pct(R)}.)`,
      givens: { I0, flows, R }, answer: R2(v), unit: '%', tolerance: { abs: 0.1 },
      steps: [step('NPV at the required return', npv(R / 100, all), '$', { abs: 0.5 }), step('IRR (rate where NPV = 0)', v, '%', { abs: 0.1 })],
      solution: [`IRR solves −${I0} + Σ CF_t/(1 + IRR)^t = 0 ⇒ IRR = ${pct(v)} PA (check: NPV at ${pct(v)} ≈ 0)`, `${v > R ? 'IRR > required return: accept' : 'IRR < required return: reject'}`], keystrokes: [`CF0 = −${I0}, C01 = ${flows[0]}, C02 = ${flows[1]}, C03 = ${flows[2]}, C04 = ${flows[3]}, IRR CPT`],
      errors: [err('arr-cash-not-profit', 'Average flow over the outlay', (flows.reduce((s, x) => s + x, 0) / 4) / I0 * 100, 'That is an accounting-style ratio, not the discount rate that zeroes the NPV.'), err('irr-direction', 'Total return over four years', (flows.reduce((s, x) => s + x, 0) / I0 - 1) * 100, 'IRR is a per-year rate found by trial or the CF worksheet.')] }; } },
  pi: { concept: 'c09-pi', difficulty: 2, make(r) {
    const I0 = rs(r, 200, 800, 10), R = rs(r, 6, 14, 0.5); const flows = [rs(r, 60, 300, 10), rs(r, 60, 300, 10), rs(r, 60, 300, 10)]; const pv = npv(R / 100, [0, ...flows]); const v = pv / I0;
    return { stem: `${firm(r)} invests $${I0}k for cash flows of ${flows.map(x => '$' + x + 'k').join(', ')} over three years at ${pct(R)} per annum. What is the profitability index?`,
      givens: { I0, R, flows }, answer: R2(v), unit: 'x', tolerance: tolRatio,
      steps: [step('PV of inflows', pv, '$', { abs: 0.5 }), step('PI = PV inflows ÷ PV outflows', v, 'x')],
      solution: [`PV inflows = ${R2(pv)}; PI = ${R2(pv)}/${I0} = ${R2(v)} ⇒ ${v > 1 ? 'accept (PI > 1)' : 'reject (PI < 1)'}`], keystrokes: [`CF0 = 0, C01…C03, NPV I = ${R}, CPT, ÷ ${I0} =`],
      errors: [err('pi-zero-based', 'NPV ÷ outlay (0-based index)', (pv - I0) / I0, 'The professor\'s PI is PV of inflows over PV of outflows; the 0-based version is this minus 1.'), err('arithmetic', 'Undiscounted inflows over outlay', flows.reduce((s, x) => s + x, 0) / I0, 'Discount the inflows first.')] }; } },
  npv_profile: { concept: 'c09-npv-profile', difficulty: 2, make(r) {
    const I0 = rs(r, 200, 600, 10), R1 = rs(r, 4, 9, 1), R2v = R1 + rs(r, 5, 10, 1); const flows = [rs(r, 60, 250, 10), rs(r, 60, 250, 10), rs(r, 60, 250, 10), rs(r, 60, 250, 10)]; const all = [-I0, ...flows]; const n1 = npv(R1 / 100, all), n2 = npv(R2v / 100, all);
    return { stem: `${firm(r)} invests $${I0}k for cash flows of ${flows.map(x => '$' + x + 'k').join(', ')} over four years. Its NPV at ${pct(R1)} is $${R2(n1)}k. What is the NPV at ${pct(R2v)}, in $ thousands (a point on the NPV profile)?`,
      givens: { I0, R2v, flows }, answer: R2(n2), unit: '$', tolerance: { abs: 0.5 },
      steps: [step(`PV of inflows at ${pct(R2v)}`, n2 + I0, '$', { abs: 0.5 }), step('NPV', n2, '$', { abs: 0.5 })],
      solution: [`NPV(${R2v}%) = −${I0} + Σ CF_t/(1.${String(R2v).padStart(2, '0')})^t = ${R2(n2)}`, 'A higher rate lowers the NPV: the profile slopes down and crosses zero at the IRR.'], keystrokes: [`CF worksheet, NPV I = ${R2v}, CPT`],
      errors: [err('irr-direction', 'Used the first rate', n1, 'Recompute at the new rate.'), err('sign-cf0', 'Forgot the outlay', n2 + I0, 'NPV includes CF0.')] }; } },
  crossover: { concept: 'c09-crossover', difficulty: 3, multistep: true, make(r) {
    const I0 = rs(r, 300, 600, 10); const A = [rs(r, 200, 320, 10), rs(r, 150, 250, 10), rs(r, 60, 150, 10)]; const B = [rs(r, 40, 120, 10), rs(r, 150, 250, 10), rs(r, 260, 420, 10)];
    const diff = [0, A[0] - B[0], A[1] - B[1], A[2] - B[2]]; const x = irr(diff, -0.9, 2) * 100; const Rr = rs(r, 5, 12, 1); const nA = npv(Rr / 100, [-I0, ...A]), nB = npv(Rr / 100, [-I0, ...B]);
    return { stem: `Projects A and B at ${firm(r)} each cost $${I0}k. A pays ${A.map(x => '$' + x + 'k').join(', ')}; B pays ${B.map(x => '$' + x + 'k').join(', ')} over three years. At what discount rate do the two NPVs cross (the crossover rate), in % per annum?`,
      givens: { I0, A, B }, answer: R2(x), unit: '%', tolerance: { abs: 0.1 },
      steps: [step('Year-1 incremental flow (A − B)', diff[1], '$', { abs: 0.5 }), step('Year-3 incremental flow (A − B)', diff[3], '$', { abs: 0.5 }), step('Crossover = IRR of the (A − B) flows', x, '%', { abs: 0.1 })],
      solution: [`A − B: year 0 ${0}, year 1 ${diff[1]}, year 2 ${diff[2]}, year 3 ${diff[3]}`, `IRR of these flows = ${pct(x)} PA; below it the later-paying project (B) has the higher NPV, above it A does (at ${pct(Rr)}: NPV_A ${R2(nA)}, NPV_B ${R2(nB)})`], keystrokes: [`CF0 = 0, C01 = ${diff[1]}, C02 = ${diff[2]}, C03 = ${diff[3]}, IRR CPT`],
      errors: [err('picked-higher-irr', 'Returned the IRR of project A', irr([-I0, ...A]) * 100, 'The crossover is the IRR of the difference in cash flows, not of one project.'), err('irr-direction', 'Returned the IRR of project B', irr([-I0, ...B]) * 100, 'Subtract the cash flows year by year first.')] }; } },
  npv_pair: { concept: 'c09-ranking-conflict', difficulty: 2, make(r) {
    const R = rs(r, 6, 12, 1); const IA = rs(r, 100, 300, 10), IB = IA * 3; const A = [IA * 0.5, IA * 0.5, IA * 0.5].map(x => R2(x)); const B = [IB * 0.42, IB * 0.42, IB * 0.42].map(x => R2(x)); const nA = npv(R / 100, [-IA, ...A]), nB = npv(R / 100, [-IB, ...B]);
    return { stem: `${firm(r)} must choose one project. A costs $${IA}k and pays $${A[0]}k a year for three years; B costs $${IB}k and pays $${B[0]}k a year for three years. At ${pct(R)}, by how much does the NPV of the better project exceed the other, in $ thousands?`,
      givens: { R, IA, IB, A, B }, answer: R2(Math.abs(nA - nB)), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('NPV of A', nA, '$', { abs: 0.5 }), step('NPV of B', nB, '$', { abs: 0.5 }), step('Difference', Math.abs(nA - nB), '$', { abs: 0.5 })],
      solution: [`NPV_A = −${IA} + ${A[0]} × AF(${R}%, 3) = ${R2(nA)}; NPV_B = −${IB} + ${B[0]} × AF = ${R2(nB)}`, `Choose ${nA > nB ? 'A' : 'B'} (higher NPV, even if the other has the higher IRR or PI): difference ${R2(Math.abs(nA - nB))}`], keystrokes: [`AF = (1 − 1.${String(R).padStart(2, '0')}^−3) ÷ ${R / 100}; NPV = payment × AF − cost`],
      errors: [err('picked-higher-irr', 'Compared IRRs (returned A\'s IRR)', irr([-IA, ...A]) * 100, 'Mutually exclusive projects: rank by NPV, not IRR or PI.'), err('sign-cf0', 'Compared PVs without the outlays', Math.abs((nA + IA) - (nB + IB)), 'Subtract each project\'s outlay.')] }; } },
  eav: { concept: 'c09-eav', difficulty: 3, make(r) {
    const R = rs(r, 6, 12, 1), NA = ri(r, 3, 5), NB = NA + ri(r, 2, 4); const costA = rs(r, 100, 300, 10), costB = costA * (1 + rs(r, 0.3, 0.9, 0.1)); const opA = rs(r, 20, 60, 5), opB = rs(r, 10, 40, 5);
    const pvA = costA + opA * AF(R / 100, NA), pvB = costB + opB * AF(R / 100, NB); const eA = pvA / AF(R / 100, NA), eB = pvB / AF(R / 100, NB);
    return { stem: `${firm(r)} compares machine A (cost $${costA}k, $${opA}k a year to run, ${NA}-year life) with machine B (cost $${R2(costB)}k, $${opB}k a year, ${NB}-year life). At ${pct(R)}, what is the equivalent annual cost of machine A, in $ thousands?`,
      givens: { R, NA, NB, costA, costB, opA, opB }, answer: R2(eA), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('PV of A\'s costs', pvA, '$', { abs: 0.5 }), step(`Annuity factor (${R}%, ${NA})`, AF(R / 100, NA), '', { abs: 0.002 }), step('EAC_A = PV ÷ annuity factor', eA, '$', { abs: 0.5 })],
      solution: [`PV_A = ${costA} + ${opA} × AF(${R}%, ${NA}) = ${R2(pvA)}`, `EAC_A = ${R2(pvA)}/${R4(AF(R / 100, NA))} = ${R2(eA)} per year (B: ${R2(eB)}) ⇒ choose ${eA < eB ? 'A' : 'B'}`], keystrokes: [`AF: 1 − 1.${String(R).padStart(2, '0')} y^x ${NA} ± = ÷ ${R / 100} =; PV ÷ AF`],
      errors: [err('raw-npv-unequal-lives', 'Compared raw PVs (returned PV_A)', pvA, 'Different lives: convert each PV into an equivalent annual amount.'), err('wrong-n-annuity', `Used B's life (${NB} years) for A`, pvA / AF(R / 100, NB), 'Each machine is annualised over its own life.'), err('divided-by-n', 'Divided the PV by the number of years', pvA / NA, 'Divide by the annuity factor, not by N.')] }; } },
  ccr: { concept: 'c09-ccr-lcm', difficulty: 3, make(r) {
    const R = rs(r, 6, 12, 1), N = ri(r, 3, 6), v = rs(r, 20, 120, 5); const f = Math.pow(1 + R / 100, N); const inf = v * f / (f - 1);
    return { stem: `A ${firm(r)} project has an NPV of $${v}k over its ${N}-year life and will be replaced identically forever. At ${pct(R)}, what is the NPV of the infinite chain of replacements, in $ thousands?`,
      givens: { R, N, v }, answer: R2(inf), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('(1+R)^N', f, '', { abs: 0.002 }), step('NPV∞ = NPV × (1+R)^N/((1+R)^N − 1)', inf, '$', { abs: 0.5 })],
      solution: [`NPV∞ = NPV × (1+R)^N/((1+R)^N − 1) = ${v} × ${R4(f)}/(${R4(f)} − 1) = ${R2(inf)}`, `(= EAV/R with EAV = NPV ÷ AF = ${R2(v / AF(R / 100, N))})`], keystrokes: [`1.${String(R).padStart(2, '0')} y^x ${N} = ÷ (that − 1) × ${v} =`],
      errors: [err('raw-npv-unequal-lives', 'Returned the single-cycle NPV', v, 'The chain repeats the NPV every N years.'), err('wrong-n-annuity', 'Returned the EAV instead of the perpetuity', v / AF(R / 100, N), 'EAV is the annual amount; the chain\'s value is EAV/R.')] }; } },
  // ---- Chapter 10: cash flows
  ocf: { concept: 'c10-ocf', difficulty: 2, make(r) {
    const S = rs(r, 400, 1200, 10), C = rs(r, 150, 600, 10), D = rs(r, 40, 150, 5), T = rs(r, 25, 30, 1); const ebit = S - C - D; const v = ebit * (1 - T / 100) + D;
    return { stem: `A ${firm(r)} project has sales of $${S}k, cash costs of $${C}k and CCA of $${D}k this year. The tax rate is ${pct(T)}. What is the operating cash flow, in $ thousands?`,
      givens: { S, C, D, T }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('EBIT = S − C − D', ebit, '$', { abs: 0.5 }), step('OCF = EBIT(1 − T) + D', v, '$', { abs: 0.5 })],
      solution: [`EBIT = ${S} − ${C} − ${D} = ${ebit}`, `OCF = EBIT(1 − T) + D = ${ebit} × ${(1 - T / 100).toFixed(2)} + ${D} = ${R2(v)} (= (S − C)(1 − T) + T·D)`], keystrokes: [`${ebit} × ${(1 - T / 100).toFixed(2)} + ${D} =`],
      errors: [err('forgot-times-t', 'Forgot to add back CCA', ebit * (1 - T / 100), 'CCA is non-cash: add it back after tax (or use the tax-shield form).'), err('taxed-capex', 'Ignored the tax shield: (S − C)(1 − T)', (S - C) * (1 - T / 100), 'CCA shields T × D of tax.'), err('interest-in-fcf', 'Taxed sales minus costs minus CCA without adding CCA back', (S - C - D) * (1 - T / 100) - D, 'Add CCA back, do not subtract it twice.')] }; } },
  nwc_change: { concept: 'c10-nwc', difficulty: 2, make(r) {
    const pctS = rs(r, 8, 20, 1), S1 = rs(r, 400, 900, 10), S2 = S1 + rs(r, 50, 300, 10); const nwc1 = S1 * pctS / 100, nwc2 = S2 * pctS / 100; const d = nwc2 - nwc1;
    return { stem: `${firm(r)} keeps net working capital at ${pct(pctS)} of next year's sales. Sales are $${S1}k in year 1 and $${S2}k in year 2. What is the cash flow from the change in NWC at the end of year 1, in $ thousands (outflow negative)?`,
      givens: { pctS, S1, S2 }, answer: R2(-d), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('NWC needed for year 2 sales', nwc2, '$', { abs: 0.5 }), step('ΔNWC = NWC2 − NWC1', d, '$', { abs: 0.5 }), step('Cash flow = −ΔNWC', -d, '$', { abs: 0.5 })],
      solution: [`NWC1 = ${pctS}% × ${S1} = ${R2(nwc1)}; NWC2 = ${pctS}% × ${S2} = ${R2(nwc2)}`, `ΔNWC = ${R2(d)} (an increase) ⇒ cash flow −${R2(d)}; it is recovered when the project ends`], keystrokes: [`${S2} − ${S1} = × ${pctS / 100} = ±`],
      errors: [err('taxed-nwc', 'Taxed the working capital change', -d * (1 - 0.27), 'Working capital is a ×1 item: no tax.'), err('sign-cf0', 'Treated the increase as an inflow', d, 'More working capital ties up cash.'), err('forgot-nwc-recovery', 'Used the whole NWC level', -nwc2, 'Only the change in NWC is a cash flow each year.')] }; } },
  five_categories: { concept: 'c10-five-categories', difficulty: 2, make(r) {
    const rev = rs(r, 200, 600, 10), exp = rs(r, 50, 200, 10), T = rs(r, 25, 30, 1); const v = (rev - exp) * (1 - T / 100);
    return { stem: `A ${firm(r)} project adds $${rev}k of revenue and $${exp}k of cash operating costs each year. The tax rate is ${pct(T)}. Ignoring CCA, what is the after-tax operating cash flow each year, in $ thousands?`,
      givens: { rev, exp, T }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('Pre-tax net revenue', rev - exp, '$', { abs: 0.5 }), step('× (1 − T)', v, '$', { abs: 0.5 })],
      solution: [`Revenue and expenses are ×(1 − T) items: (${rev} − ${exp}) × ${(1 - T / 100).toFixed(2)} = ${R2(v)}`], keystrokes: [`${rev} − ${exp} = × ${(1 - T / 100).toFixed(2)} =`],
      errors: [err('forgot-untax', 'Forgot the tax', rev - exp, 'Operating items are taxed at T.'), err('forgot-times-t', 'Multiplied by T instead of (1 − T)', (rev - exp) * T / 100, '×T is the tax shield on CCA; revenue keeps (1 − T).')] }; } },
  initial_outlay: { concept: 'c10-incremental', difficulty: 2, make(r) {
    const capex = rs(r, 300, 900, 10), nwc = rs(r, 20, 90, 5), land = rs(r, 50, 200, 10), study = rs(r, 10, 60, 5); const v = capex + nwc + land;
    return { stem: `${firm(r)} plans a plant: equipment $${capex}k, working capital $${nwc}k, built on land it owns that could be sold today for $${land}k, after a feasibility study that already cost $${study}k. What is the relevant year-0 cash outflow, in $ thousands?`,
      givens: { capex, nwc, land, study }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('CAPEX + NWC', capex + nwc, '$', { abs: 0.5 }), step('+ opportunity cost of the land', v, '$', { abs: 0.5 })],
      solution: [`Relevant: equipment ${capex} + working capital ${nwc} + land at today's value ${land} = ${v}`, `Not relevant: the feasibility study (sunk, ×0)`], keystrokes: [`${capex} + ${nwc} + ${land} =`],
      errors: [err('counted-sunk', 'Included the feasibility study', v + study, 'Sunk costs are gone whether or not the project proceeds.'), err('taxed-capex', 'Left out the land', capex + nwc, 'Land you could sell has an opportunity cost.')] }; } },
  cca_schedule: { concept: 'c10-cca-schedule', difficulty: 2, multistep: true, make(r) {
    const I0 = rs(r, 100, 800, 10), d = pick(r, [20, 30, 25, 10]), T = rs(r, 25, 30, 1); const cca1 = 0.5 * d / 100 * I0; const ucc1 = I0 - cca1; const cca2 = d / 100 * ucc1; const ucc2 = ucc1 - cca2; const dts2 = cca2 * T / 100;
    return { stem: `${firm(r)} buys a Class asset for $${I0}k with a CCA rate of ${pct(d)} (half-year rule applies). The tax rate is ${pct(T)}. What is the CCA tax shield in year 2, in $ thousands?`,
      givens: { I0, d, T }, answer: R2(dts2), unit: '$', tolerance: { abs: 0.05 },
      steps: [step('CCA year 1 = 0.5 × d × I0', cca1, '$', { abs: 0.05 }), step('UCC end of year 1', ucc1, '$', { abs: 0.05 }), step('CCA year 2 = d × UCC1', cca2, '$', { abs: 0.05 }), step('Tax shield year 2 = CCA2 × T', dts2, '$', { abs: 0.05 })],
      solution: [`CCA1 = 0.5 × ${d / 100} × ${I0} = ${R2(cca1)}; UCC1 = ${I0} − ${R2(cca1)} = ${R2(ucc1)}`, `CCA2 = ${d / 100} × ${R2(ucc1)} = ${R2(cca2)}; DTS2 = ${R2(cca2)} × ${T / 100} = ${R2(dts2)} (UCC2 = ${R2(ucc2)})`], keystrokes: [`${I0} × ${d / 100} × 0.5 = (CCA1); ${I0} − CCA1 = × ${d / 100} = × ${T / 100} =`],
      errors: [err('missing-half-year', 'No half-year rule in year 1', (d / 100) * (I0 - d / 100 * I0) * T / 100, 'Year 1 CCA is only half of d × I0.'), err('half-year-every-year', 'Halved year 2 as well', 0.5 * cca2 * T / 100, 'The half-year rule applies to the first year only.'), err('straight-line-cca', 'Applied d to the original cost', d / 100 * I0 * T / 100, 'CCA is declining balance: d × the remaining UCC.'), err('forgot-times-t', 'Reported the CCA, not the shield', cca2, 'The tax shield is CCA × T.')] }; } },
  half_year: { concept: 'c10-half-year-aii', difficulty: 1, make(r) {
    const I0 = rs(r, 100, 800, 10), d = pick(r, [20, 30, 25]); const regime = pick(r, ['half', 'aii']); const m = regime === 'half' ? 0.5 : 1.5; const v = m * d / 100 * I0;
    return { stem: `${firm(r)} buys a $${I0}k asset with a CCA rate of ${pct(d)}. ${regime === 'half' ? 'The half-year rule applies.' : 'The Accelerated Investment Incentive applies (1.5 × the normal first-year CCA).'} What is the CCA deduction in year 1, in $ thousands?`,
      givens: { I0, d, m }, answer: R2(v), unit: '$', tolerance: { abs: 0.05 }, steps: [step('CCA1 = m × d × I0', v, '$', { abs: 0.05 })],
      solution: [`CCA1 = ${m} × ${d / 100} × ${I0} = ${R2(v)}`], keystrokes: [`${I0} × ${d / 100} × ${m} =`],
      errors: [err('wrong-first-year-factor', `Used ${regime === 'half' ? '1.5' : '0.5'} instead of ${m}`, (regime === 'half' ? 1.5 : 0.5) * d / 100 * I0, 'Half-year rule = 0.5; AII = 1.5; 100% expensing = the whole cost.'), err('missing-half-year', 'Full d × I0', d / 100 * I0, 'The first year has a special multiplier.')] }; } },
  dts: { concept: 'c10-dts', difficulty: 1, make(r) {
    const cca = rs(r, 20, 200, 5), T = rs(r, 25, 30, 1); const v = cca * T / 100;
    return { stem: `${firm(r)} claims $${cca}k of CCA this year and pays tax at ${pct(T)}. By how much does the CCA reduce the tax bill (the depreciation tax shield), in $ thousands?`,
      givens: { cca, T }, answer: R2(v), unit: '$', tolerance: { abs: 0.05 }, steps: [step('DTS = CCA × T', v, '$', { abs: 0.05 })],
      solution: [`DTS = CCA × T_C = ${cca} × ${T / 100} = ${R2(v)}`], keystrokes: [`${cca} × ${T / 100} =`],
      errors: [err('forgot-untax', 'Used (1 − T)', cca * (1 - T / 100), 'The shield is the tax saved: CCA × T.'), err('forgot-times-t', 'Reported the CCA itself', cca, 'Only the tax saved is cash.')] }; } },
  pvcca: { concept: 'c10-pvcca', difficulty: 3, multistep: true, make(r) {
    const I0 = rs(r, 100, 900, 10), d = pick(r, [20, 30, 25]), T = rs(r, 25, 30, 1), k = rs(r, 7, 14, 0.5), N = ri(r, 4, 8), S = rs(r, 10, 150, 5); const regime = pick(r, [0.5, 1.5, 1]); const res = pvcca(I0, d / 100, T / 100, k / 100, { mult: regime, S, N });
    const label = regime === 0.5 ? 'the half-year rule' : regime === 1.5 ? 'the Accelerated Investment Incentive (1.5×)' : '100% first-year CCA (no half-year adjustment)';
    return { stem: `${firm(r)} buys a $${I0}k asset (CCA rate ${pct(d)}, ${label}) and will sell it for $${S}k after ${N} years, closing the class. Tax rate ${pct(T)}, discount rate ${pct(k)}. What is the present value of the CCA tax shield, in $ thousands?`,
      givens: { I0, d, T, k, N, S, regime }, answer: R2(res.pv), unit: '$', tolerance: { abs: 0.1 },
      steps: [step('Perpetuity term I0·d·T/(k + d)', (I0 * d / 100 * T / 100) / (k / 100 + d / 100), '$', { abs: 0.1 }), step('First-year factor', res.first, '', { abs: 0.001 }), step('Salvage term S·d·T/(k + d) ÷ (1+k)^N', res.b, '$', { abs: 0.1 }), step('PV_CCA = first term × factor − salvage term', res.pv, '$', { abs: 0.1 })],
      solution: [`PV_CCA = (I0 d T)/(k + d) × ${regime === 0.5 ? '(1 + 0.5k)/(1 + k)' : regime === 1.5 ? '(1.5k + 1)/(1 + k)' : '1'} − (S_N d T)/(k + d) × 1/(1 + k)^N`, `= ${R2(res.a)} − ${R2(res.b)} = ${R2(res.pv)}`], keystrokes: [`${I0} × ${d / 100} × ${T / 100} ÷ (${k / 100} + ${d / 100}) × factor − ${S} × ${d / 100} × ${T / 100} ÷ (${k / 100} + ${d / 100}) ÷ 1.${String(k).padStart(2, '0')}^${N}`],
      errors: [err('wrong-first-year-factor', 'Wrong first-year factor', pvcca(I0, d / 100, T / 100, k / 100, { mult: regime === 0.5 ? 1.5 : 0.5, S, N }).pv, 'Match the factor to the regime: 0.5 (half-year), 1.5 (AII) or 1 (100%).'), err('dropped-salvage-term', 'Ignored the salvage term', res.a, 'Selling the asset removes future tax shields: subtract the discounted salvage term.'), err('salvage-not-discounted', 'Salvage term not discounted', res.a - (S * d / 100 * T / 100) / (k / 100 + d / 100), `The salvage term is divided by (1 + k)^${N}.`), err('k-minus-d', 'Used k − d in the denominator', (I0 * d / 100 * T / 100) / Math.abs(k / 100 - d / 100) * res.first - (S * d / 100 * T / 100) / Math.abs(k / 100 - d / 100) / Math.pow(1 + k / 100, N), 'The CCA shield shrinks at rate d: the denominator is k + d.')] }; } },
  pool_open: { concept: 'c10-pool-open-closed', difficulty: 3, make(r) {
    const I0 = rs(r, 100, 900, 10), d = pick(r, [20, 30]), T = rs(r, 25, 30, 1), k = rs(r, 7, 14, 0.5), N = ri(r, 4, 8), S = rs(r, 10, 150, 5); const open = pvcca(I0, d / 100, T / 100, k / 100, { mult: 0.5 }); const closed = pvcca(I0, d / 100, T / 100, k / 100, { mult: 0.5, S, N });
    return { stem: `${firm(r)} buys a $${I0}k asset (CCA ${pct(d)}, half-year rule, tax ${pct(T)}, discount rate ${pct(k)}). It will sell the asset for $${S}k after ${N} years but other assets remain in the class, so the pool stays open. What is the PV of the CCA tax shield, in $ thousands?`,
      givens: { I0, d, T, k, N, S }, answer: R2(open.pv), unit: '$', tolerance: { abs: 0.1 }, steps: [step('PV_CCA with the pool open (no salvage term)', open.pv, '$', { abs: 0.1 })],
      solution: [`Pool stays open ⇒ the salvage keeps shrinking the pool but the shield continues: PV_CCA = (I0 d T)/(k + d) × (1 + 0.5k)/(1 + k) = ${R2(open.pv)}`, `(If the class closed you would subtract ${R2(closed.b)}, giving ${R2(closed.pv)}.)`], keystrokes: [`${I0} × ${d / 100} × ${T / 100} ÷ (${k / 100} + ${d / 100}) × (1 + 0.5 × ${k / 100}) ÷ (1 + ${k / 100}) =`],
      errors: [err('kept-salvage-term', 'Subtracted the salvage term', closed.pv, 'With the pool open there is no terminal loss or recapture: no salvage term.'), err('missing-half-year', 'No first-year factor', (I0 * d / 100 * T / 100) / (k / 100 + d / 100), 'Apply the half-year factor (1 + 0.5k)/(1 + k).')] }; } },
  cfat: { concept: 'c10-capital-gain-cfat', difficulty: 3, multistep: true, make(r) {
    const ACB = rs(r, 100, 600, 10), T = rs(r, 25, 30, 1); const UCC = R2(ACB * rs(r, 0.3, 0.7, 0.05)); const kind = pick(r, ['loss', 'recap', 'gain']); const POD = kind === 'loss' ? R2(UCC * rs(r, 0.5, 0.9, 0.05)) : kind === 'recap' ? R2(UCC + (ACB - UCC) * rs(r, 0.3, 0.9, 0.05)) : R2(ACB * rs(r, 1.1, 1.5, 0.05)); const res = cfat(POD, ACB, UCC, T / 100);
    return { stem: `${firm(r)} sells an asset that cost $${ACB}k and has undepreciated capital cost of $${UCC}k for $${POD}k, closing the asset class. The tax rate is ${pct(T)}. What is the after-tax cash flow from the sale, in $ thousands?`,
      givens: { ACB, UCC, POD, T }, answer: R2(res.cf), unit: '$', tolerance: { abs: 0.05 },
      steps: [step('Recapture (or terminal loss if negative) = min(ACB, POD) − UCC', res.recap, '$', { abs: 0.05 }), step('Capital gain = max(POD − ACB, 0)', res.gain, '$', { abs: 0.05 }), step('CF_AT = POD − T × recapture − 0.5 × T × gain', res.cf, '$', { abs: 0.05 })],
      solution: [`min(ACB, POD) − UCC = ${Math.min(ACB, POD)} − ${UCC} = ${R2(res.recap)} ${res.recap < 0 ? '(terminal loss: a tax saving)' : '(recapture: taxed in full)'}`, `Capital gain = max(${POD} − ${ACB}, 0) = ${R2(res.gain)}, half taxable`, `CF_AT = ${POD} − ${T / 100} × ${R2(res.recap)} − 0.5 × ${T / 100} × ${R2(res.gain)} = ${R2(res.cf)}`], keystrokes: [`${POD} − ${T / 100} × ${R2(res.recap)} − 0.5 × ${T / 100} × ${R2(res.gain)} =`],
      errors: [err('recapture-full-pod', 'Taxed all of POD − UCC at the full rate', POD - T / 100 * (POD - UCC), 'Only the part up to the original cost is recapture; the gain above cost is half taxed.'), err('forgot-half-gain', 'Taxed the whole capital gain', POD - T / 100 * res.recap - T / 100 * res.gain, 'Only 50% of a capital gain is taxable.'), err('pod-minus-acb', 'Used POD − ACB as recapture', POD - T / 100 * (POD - ACB), 'Recapture compares proceeds with UCC, capped at ACB.'), err('terminal-loss-sign', 'Terminal loss treated as a tax bill', POD - T / 100 * Math.abs(res.recap) - 0.5 * T / 100 * res.gain, 'A terminal loss saves tax (positive cash).')] }; } },
  recapture: { concept: 'c10-recapture-terminal-loss', difficulty: 2, make(r) {
    const ACB = rs(r, 100, 600, 10), T = rs(r, 25, 30, 1); const UCC = R2(ACB * rs(r, 0.3, 0.7, 0.05)); const POD = R2(UCC + (ACB - UCC) * rs(r, 0.2, 0.95, 0.05)); const recap = POD - UCC; const tax = recap * T / 100;
    return { stem: `${firm(r)} sells an asset (original cost $${ACB}k, UCC $${UCC}k) for $${POD}k, closing the class. Tax rate ${pct(T)}. How much tax is due on the recaptured CCA, in $ thousands?`,
      givens: { ACB, UCC, POD, T }, answer: R2(tax), unit: '$', tolerance: { abs: 0.05 },
      steps: [step('Recapture = POD − UCC (POD ≤ ACB)', recap, '$', { abs: 0.05 }), step('Tax = recapture × T', tax, '$', { abs: 0.05 })],
      solution: [`POD is between UCC and ACB: recapture = ${POD} − ${UCC} = ${R2(recap)}; tax = ${R2(recap)} × ${T / 100} = ${R2(tax)}`], keystrokes: [`${POD} − ${UCC} = × ${T / 100} =`],
      errors: [err('pod-minus-acb', 'Used POD − ACB', (POD - ACB) * T / 100, 'Recapture is measured against UCC.'), err('forgot-half-gain', 'Taxed only half', 0.5 * tax, 'Recapture is fully taxable; only capital gains get the 50% inclusion.')] }; } },
  project_npv: { concept: 'c10-expansion-npv', difficulty: 3, multistep: true, make(r) {
    const capex = rs(r, 300, 800, 10), nwc = rs(r, 20, 80, 5), S = rs(r, 250, 600, 10), C = rs(r, 80, 250, 10), T = rs(r, 25, 30, 1), d = pick(r, [20, 30]), k = rs(r, 8, 14, 0.5), N = ri(r, 4, 6), salv = rs(r, 20, 120, 5);
    const op = (S - C) * (1 - T / 100); const af = AF(k / 100, N); const pvOp = op * af; const shield = pvcca(capex, d / 100, T / 100, k / 100, { mult: 0.5, S: salv, N }); const pvTerm = (salv + nwc) / Math.pow(1 + k / 100, N); const v = -capex - nwc + pvOp + shield.pv + pvTerm;
    return { stem: `${firm(r)} considers a ${N}-year expansion: equipment $${capex}k (CCA ${pct(d)}, half-year rule, sold for $${salv}k at the end, closing the class), working capital $${nwc}k up front and recovered at the end, sales $${S}k and cash costs $${C}k a year. Tax ${pct(T)}, discount rate ${pct(k)}. What is the NPV, in $ thousands?`,
      givens: { capex, nwc, S, C, T, d, k, N, salv }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('Year-0 outlay (CAPEX + NWC)', -(capex + nwc), '$', { abs: 0.5 }), step('Annual after-tax operating flow (S − C)(1 − T)', op, '$', { abs: 0.5 }), step('PV of operating flows', pvOp, '$', { abs: 0.5 }), step('PV of CCA tax shield', shield.pv, '$', { abs: 0.5 }), step('PV of salvage + NWC recovery', pvTerm, '$', { abs: 0.5 }), step('NPV', v, '$', { abs: 0.5 })],
      solution: [`CF0 = −${capex} − ${nwc} = ${-(capex + nwc)}`, `Operating: (${S} − ${C}) × ${(1 - T / 100).toFixed(2)} = ${R2(op)} per year; PV = ${R2(op)} × AF(${k}%, ${N}) = ${R2(pvOp)}`, `PV_CCA = ${R2(shield.a)} − ${R2(shield.b)} = ${R2(shield.pv)}`, `Terminal: (${salv} + ${nwc})/(1.${String(k).replace('.', '')})^${N} = ${R2(pvTerm)}`, `NPV = ${R2(v)} ⇒ ${v > 0 ? 'accept' : 'reject'}`], keystrokes: [`AF = (1 − 1.${String(k).padStart(2, '0')}^−${N}) ÷ ${k / 100}; op × AF + PV_CCA + terminal − outlay`],
      errors: [err('forgot-nwc-recovery', 'Forgot to recover working capital', v - nwc / Math.pow(1 + k / 100, N), 'Working capital comes back at the end of the project.'), err('missing-cca-shield', 'Left out the CCA tax shield', v - shield.pv, 'The CCA shield is a cash saving worth its PV.'), err('taxed-capex', 'Taxed the equipment outlay', v + capex * T / 100, 'CAPEX is a ×1 item.'), err('dropped-salvage-term', 'Kept the full perpetuity shield (no salvage adjustment)', v + shield.b, 'Selling the asset and closing the class removes future shields.')] }; } },
  replacement_npv: { concept: 'c10-replacement-npv', difficulty: 3, multistep: true, make(r) {
    const newCost = rs(r, 300, 700, 10), oldSalv = rs(r, 40, 150, 10), savings = rs(r, 80, 200, 10), T = rs(r, 25, 30, 1), d = pick(r, [20, 30]), k = rs(r, 8, 14, 0.5), N = ri(r, 4, 6);
    const net = newCost - oldSalv; const op = savings * (1 - T / 100); const pvOp = op * AF(k / 100, N); const shield = pvcca(net, d / 100, T / 100, k / 100, { mult: 0.5 }); const v = -net + pvOp + shield.pv;
    return { stem: `${firm(r)} can replace a machine with a new one costing $${newCost}k; the old one sells today for $${oldSalv}k (same CCA class, ${pct(d)}, pool stays open, half-year rule on the net addition). The new machine saves $${savings}k a year before tax for ${N} years with no salvage. Tax ${pct(T)}, discount rate ${pct(k)}. What is the NPV of replacing, in $ thousands?`,
      givens: { newCost, oldSalv, savings, T, d, k, N }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('Net acquisition cost = new − old salvage', net, '$', { abs: 0.5 }), step('After-tax savings per year', op, '$', { abs: 0.5 }), step('PV of savings', pvOp, '$', { abs: 0.5 }), step('PV of CCA shield on the net addition', shield.pv, '$', { abs: 0.5 }), step('NPV', v, '$', { abs: 0.5 })],
      solution: [`Net addition to the class = ${newCost} − ${oldSalv} = ${net}`, `After-tax savings = ${savings} × ${(1 - T / 100).toFixed(2)} = ${R2(op)}; PV = ${R2(pvOp)}`, `PV_CCA = (${net} × ${d / 100} × ${T / 100})/(${k / 100} + ${d / 100}) × (1 + 0.5k)/(1 + k) = ${R2(shield.pv)}`, `NPV = −${net} + ${R2(pvOp)} + ${R2(shield.pv)} = ${R2(v)}`], keystrokes: [`savings × (1 − T) × AF + shield − net`],
      errors: [err('missing-cca-shield', 'Shield on the gross cost of the new machine', -net + pvOp + pvcca(newCost, d / 100, T / 100, k / 100, { mult: 0.5 }).pv, 'Buying and selling in the same class: the shield applies to the net addition.'), err('forgot-untax', 'Savings not taxed', -net + savings * AF(k / 100, N) + shield.pv, 'Cost savings are taxable income: ×(1 − T).'), err('sign-cf0', 'Ignored the old machine\'s salvage', -newCost + pvOp + shield.pv, 'The salvage received today reduces the outlay.')] }; } },
  bid_price: { concept: 'c10-bid-price', difficulty: 3, multistep: true, make(r) {
    const I0 = rs(r, 200, 600, 10), nwc = rs(r, 10, 60, 5), salv = rs(r, 20, 100, 5), d = pick(r, [20, 30]), T = rs(r, 25, 30, 1), k = rs(r, 8, 14, 0.5), N = ri(r, 3, 5), qty = rs(r, 1000, 5000, 100), cost = rs(r, 20, 80, 1);
    const shield = pvcca(I0, d / 100, T / 100, k / 100, { mult: 0.5, S: salv, N }); const pvTerm = (salv + nwc) / Math.pow(1 + k / 100, N); const known = -I0 - nwc + shield.pv + pvTerm; const af = AF(k / 100, N); const annuity = -known / af; const pretax = annuity / (1 - T / 100); const price = (pretax + qty * cost) / qty;
    return { stem: `${firm(r)} bids on a ${N}-year contract to supply ${qty.toLocaleString()} units a year at a cost of $${cost} each. Equipment costs $${I0}k (CCA ${pct(d)}, half-year rule, salvage $${salv}k, class closes), working capital $${nwc}k is needed up front and recovered at the end. Tax ${pct(T)}, required return ${pct(k)}. What is the lowest price per unit at which NPV = 0 (figures in $ thousands except the price)?`,
      givens: { I0, nwc, salv, d, T, k, N, qty, cost }, answer: R2(price), unit: '$', tolerance: { abs: 0.05 },
      steps: [step('PV of the known pieces (outlay, NWC, shield, terminal)', known, '$', { abs: 0.5 }), step('Required after-tax annual flow = −known ÷ AF', annuity, '$', { abs: 0.5 }), step('Pre-tax net revenue = annuity ÷ (1 − T)', pretax, '$', { abs: 0.5 }), step('Price = (pre-tax net revenue + total cost) ÷ quantity', price, '$', { abs: 0.05 })],
      solution: [`Known PV = −${I0} − ${nwc} + PV_CCA ${R2(shield.pv)} + terminal ${R2(pvTerm)} = ${R2(known)}`, `Annual after-tax flow needed = ${R2(-known)}/AF(${k}%, ${N}) = ${R2(annuity)}; pre-tax = ${R2(annuity)}/${(1 - T / 100).toFixed(2)} = ${R2(pretax)}`, `Price = (${R2(pretax)}k + ${qty} × $${cost})/${qty} = $${R2(price)}`], keystrokes: [`−known ÷ AF ÷ (1 − T) = ; × 1000 + qty × cost = ÷ qty`],
      errors: [err('forgot-untax', 'Forgot to un-tax the annuity', (annuity + qty * cost / 1000) * 1000 / qty, 'The required cash flow is after tax; divide by (1 − T) to get the pre-tax margin.'), err('divided-by-n', 'Divided the known PV by N instead of the annuity factor', ((-known / N) / (1 - T / 100) * 1000 + qty * cost) / qty, 'Spread a PV over years with the annuity factor.'), err('missing-cca-shield', 'Left out the CCA shield', ((-(known - shield.pv) / af) / (1 - T / 100) * 1000 + qty * cost) / qty, 'The tax shield lowers the price you need.')] }; } },
  required_savings: { concept: 'c10-cost-cutting', difficulty: 3, make(r) {
    const I0 = rs(r, 200, 600, 10), d = pick(r, [20, 30]), T = rs(r, 25, 30, 1), k = rs(r, 8, 14, 0.5), N = ri(r, 4, 6), salv = rs(r, 0, 80, 10); const shield = pvcca(I0, d / 100, T / 100, k / 100, { mult: 0.5, S: salv, N }); const pvS = salv / Math.pow(1 + k / 100, N); const known = -I0 + shield.pv + pvS; const af = AF(k / 100, N); const v = (-known / af) / (1 - T / 100);
    return { stem: `${firm(r)} can buy a $${I0}k system (CCA ${pct(d)}, half-year rule, salvage $${salv}k after ${N} years, class closes) that cuts operating costs. Tax ${pct(T)}, discount rate ${pct(k)}. What annual pre-tax cost saving makes the NPV zero, in $ thousands?`,
      givens: { I0, d, T, k, N, salv }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('PV of outlay, shield and salvage', known, '$', { abs: 0.5 }), step('After-tax saving needed per year', -known / af, '$', { abs: 0.5 }), step('Pre-tax saving = ÷ (1 − T)', v, '$', { abs: 0.5 })],
      solution: [`Known PV = −${I0} + ${R2(shield.pv)} + ${R2(pvS)} = ${R2(known)}`, `After-tax saving = ${R2(-known)}/AF(${k}%, ${N}) = ${R2(-known / af)}; pre-tax = ÷ ${(1 - T / 100).toFixed(2)} = ${R2(v)}`], keystrokes: [`−known ÷ AF ÷ (1 − T) =`],
      errors: [err('forgot-untax', 'Reported the after-tax saving', -known / af, 'Savings are taxable: divide by (1 − T).'), err('missing-cca-shield', 'Ignored the CCA shield', (I0 - pvS) / af / (1 - T / 100), 'The shield covers part of the cost.')] }; } },
  eac_taxes: { concept: 'c10-eac-taxes', difficulty: 3, make(r) {
    const I0 = rs(r, 200, 600, 10), op = rs(r, 30, 100, 5), T = rs(r, 25, 30, 1), d = pick(r, [20, 30]), k = rs(r, 8, 14, 0.5), N = ri(r, 4, 7), salv = rs(r, 10, 80, 5); const shield = pvcca(I0, d / 100, T / 100, k / 100, { mult: 0.5, S: salv, N }); const af = AF(k / 100, N); const pvCost = I0 + op * (1 - T / 100) * af - shield.pv - salv / Math.pow(1 + k / 100, N); const v = pvCost / af;
    return { stem: `A ${firm(r)} machine costs $${I0}k, runs for ${N} years at $${op}k a year before tax and sells for $${salv}k at the end (CCA ${pct(d)}, half-year rule, class closes). Tax ${pct(T)}, discount rate ${pct(k)}. What is its equivalent annual cost after tax, in $ thousands?`,
      givens: { I0, op, T, d, k, N, salv }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('PV of after-tax operating costs', op * (1 - T / 100) * af, '$', { abs: 0.5 }), step('PV of CCA shield', shield.pv, '$', { abs: 0.5 }), step('PV of all costs (net of shield and salvage)', pvCost, '$', { abs: 0.5 }), step('EAC = PV ÷ annuity factor', v, '$', { abs: 0.5 })],
      solution: [`PV costs = ${I0} + ${op} × ${(1 - T / 100).toFixed(2)} × AF − PV_CCA ${R2(shield.pv)} − salvage PV ${R2(salv / Math.pow(1 + k / 100, N))} = ${R2(pvCost)}`, `EAC = ${R2(pvCost)}/${R4(af)} = ${R2(v)} per year`], keystrokes: [`PV ÷ AF`],
      errors: [err('missing-cca-shield', 'Ignored the CCA shield', (pvCost + shield.pv) / af, 'The shield reduces the cost of owning the machine.'), err('forgot-untax', 'Operating costs not taxed', (pvCost + op * T / 100 * af) / af, 'After-tax operating cost is op × (1 − T).'), err('divided-by-n', 'Divided by N', pvCost / N, 'Use the annuity factor.')] }; } },
  fisher: { concept: 'c10-nominal-real', difficulty: 1, make(r) {
    const nom = rs(r, 6, 14, 0.5), inf = rs(r, 1, 5, 0.5); const real = ((1 + nom / 100) / (1 + inf / 100) - 1) * 100;
    return { stem: `${firm(r)} discounts nominal cash flows at ${pct(nom)} per annum. Inflation is ${pct(inf)}. What real discount rate should it use for real (constant-dollar) cash flows, in % per annum?`,
      givens: { nom, inf }, answer: R2(real), unit: '%', tolerance: tolPct, steps: [step('1 + R_real = (1 + R_nom)/(1 + R_inf)', 1 + real / 100, '', { abs: 0.0005 }), step('Real rate', real, '%')],
      solution: [`(1 + R_nom) = (1 + R_inf)(1 + R_real) ⇒ R_real = ${(1 + nom / 100).toFixed(3)}/${(1 + inf / 100).toFixed(3)} − 1 = ${pct(real)} PA`], keystrokes: [`${(1 + nom / 100).toFixed(3)} ÷ ${(1 + inf / 100).toFixed(3)} = − 1 = × 100`],
      errors: [err('nominal-real-mix', 'Subtracted the inflation rate', nom - inf, 'The Fisher relation is multiplicative; subtraction is only an approximation.'), err('forgot-minus-one', 'Reported the ratio', (1 + nom / 100) / (1 + inf / 100), 'Subtract 1.')] }; } },
  // ---- Chapter 11
  sensitivity: { concept: 'c11-sensitivity', difficulty: 3, make(r) {
    const I0 = rs(r, 200, 500, 10), Q = rs(r, 2000, 6000, 100), P = rs(r, 40, 90, 1), v = rs(r, 15, 40, 1), FC = rs(r, 20, 80, 5), T = rs(r, 25, 30, 1), N = ri(r, 4, 6), k = rs(r, 8, 14, 0.5), dP = rs(r, 2, 6, 1);
    const ocf = p => ((p - v) * Q / 1000 - FC) * (1 - T / 100); const af = AF(k / 100, N); const base = -I0 + ocf(P) * af; const up = -I0 + ocf(P + dP) * af; const slope = (up - base) / dP;
    return { stem: `A ${firm(r)} project (no CCA for simplicity): outlay $${I0}k, ${Q.toLocaleString()} units a year at $${P} with variable cost $${v} and fixed costs $${FC}k, ${N} years, tax ${pct(T)}, discount rate ${pct(k)}. By how much does the NPV change for each $1 increase in price (the sensitivity of NPV to price), in $ thousands?`,
      givens: { I0, Q, P, v, FC, T, N, k, dP }, answer: R2(slope), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('Base-case OCF', ocf(P), '$', { abs: 0.5 }), step('Base-case NPV', base, '$', { abs: 0.5 }), step(`NPV at price $${P + dP}`, up, '$', { abs: 0.5 }), step('ΔNPV/Δprice', slope, '$', { abs: 0.5 })],
      solution: [`OCF = [(P − v)Q − FC](1 − T): base ${R2(ocf(P))}, at P + ${dP}: ${R2(ocf(P + dP))}`, `NPV = −I0 + OCF × AF(${k}%, ${N}): base ${R2(base)}, new ${R2(up)}`, `Sensitivity = (${R2(up)} − ${R2(base)})/${dP} = ${R2(slope)} per $1 of price`], keystrokes: [`ΔOCF = Q × (1 − T) × 1 ÷ 1000; × AF`],
      errors: [err('forgot-untax', 'Ignored tax on the extra revenue', Q / 1000 * af, 'Extra revenue is taxed.'), err('divided-by-n', 'Used N instead of the annuity factor', Q / 1000 * (1 - T / 100) * N, 'Discount the yearly change with the annuity factor.')] }; } },
  scenario: { concept: 'c11-scenario', difficulty: 3, make(r) {
    const I0 = rs(r, 200, 500, 10), Q = rs(r, 2000, 6000, 100), P = rs(r, 40, 90, 1), v = rs(r, 15, 40, 1), FC = rs(r, 20, 80, 5), T = rs(r, 25, 30, 1), N = ri(r, 4, 6), k = rs(r, 8, 14, 0.5), pc = rs(r, 5, 15, 5);
    const ocf = (q, p, vv, fc) => ((p - vv) * q / 1000 - fc) * (1 - T / 100); const af = AF(k / 100, N); const m = pc / 100; const worst = -I0 + ocf(Q * (1 - m), P * (1 - m), v * (1 + m), FC * (1 + m)) * af; const best = -I0 + ocf(Q * (1 + m), P * (1 + m), v * (1 - m), FC * (1 - m)) * af;
    return { stem: `A ${firm(r)} project (no CCA): outlay $${I0}k, ${Q.toLocaleString()} units at $${P}, variable cost $${v}, fixed costs $${FC}k, ${N} years, tax ${pct(T)}, discount rate ${pct(k)}. In the worst case every input moves ${pct(pc)} against you. What is the worst-case NPV, in $ thousands?`,
      givens: { I0, Q, P, v, FC, T, N, k, pc }, answer: R2(worst), unit: '$', tolerance: { abs: 0.5 },
      steps: [step('Worst-case OCF', ocf(Q * (1 - m), P * (1 - m), v * (1 + m), FC * (1 + m)), '$', { abs: 0.5 }), step('Worst-case NPV', worst, '$', { abs: 0.5 })],
      solution: [`Worst case: Q ${R2(Q * (1 - m))}, P ${R2(P * (1 - m))}, v ${R2(v * (1 + m))}, FC ${R2(FC * (1 + m))}`, `OCF = ${R2(ocf(Q * (1 - m), P * (1 - m), v * (1 + m), FC * (1 + m)))}; NPV = −${I0} + OCF × AF = ${R2(worst)} (best case ${R2(best)})`], keystrokes: [`OCF × AF − I0`],
      errors: [err('scenario-direction', 'Moved costs down in the worst case', -I0 + ocf(Q * (1 - m), P * (1 - m), v * (1 - m), FC * (1 - m)) * af, 'In the worst case costs rise while price and volume fall.'), err('profit-not-npv-breakeven', 'Returned the base-case NPV', -I0 + ocf(Q, P, v, FC) * af, 'The scenario changes every input together.')] }; } },
  npv_breakeven: { concept: 'c11-npv-breakeven', difficulty: 3, make(r) {
    const I0 = rs(r, 200, 500, 10), P = rs(r, 40, 90, 1), v = rs(r, 15, 40, 1), FC = rs(r, 20, 80, 5), T = rs(r, 25, 30, 1), N = ri(r, 4, 6), k = rs(r, 8, 14, 0.5); const af = AF(k / 100, N); const ocfStar = I0 / af; const Qf = (FC * 1000 + ocfStar * 1000 / (1 - T / 100)) / (P - v);
    return { stem: `A ${firm(r)} project (no CCA): outlay $${I0}k, price $${P}, variable cost $${v}, fixed costs $${FC}k a year, ${N} years, tax ${pct(T)}, discount rate ${pct(k)}. How many units a year make the NPV exactly zero (the NPV break-even quantity)?`,
      givens: { I0, P, v, FC, T, N, k }, answer: Math.round(Qf), unit: '', tolerance: { abs: 2 },
      steps: [step('OCF* = I0 ÷ annuity factor', ocfStar, '$', { abs: 0.5 }), step('Pre-tax operating profit needed = OCF*/(1 − T)', ocfStar / (1 - T / 100), '$', { abs: 0.5 }), step('Q = (FC + that) ÷ (P − v)', Qf, '', { abs: 2 })],
      solution: [`OCF* = ${I0}/AF(${k}%, ${N}) = ${R2(ocfStar)}k per year`, `(P − v)Q − FC = OCF*/(1 − T) ⇒ Q = (${FC} + ${R2(ocfStar / (1 - T / 100))}) × 1000/(${P} − ${v}) = ${Math.round(Qf)} units`], keystrokes: [`${I0} ÷ AF ÷ (1 − T) + ${FC} = × 1000 ÷ (${P} − ${v})`],
      errors: [err('profit-not-npv-breakeven', 'Accounting break-even (zero profit, no return on the outlay)', FC * 1000 / (P - v), 'NPV break-even must also earn back the outlay with interest: add OCF*.'), err('forgot-untax', 'Did not un-tax OCF*', (FC * 1000 + ocfStar * 1000) / (P - v), 'Operating profit is taxed: divide OCF* by (1 − T).'), err('divided-by-n', 'OCF* = I0/N', (FC * 1000 + I0 / N * 1000 / (1 - T / 100)) / (P - v), 'Use the annuity factor, not N.')] }; } },
  breakeven: { concept: 'c11-financial-breakeven', difficulty: 3, multistep: true, make(r) {
    const P = rs(r, 30, 80, 1), v = rs(r, 10, 40, 1), FC = rs(r, 50, 200, 10), D = rs(r, 20, 80, 5), I0 = rs(r, 200, 600, 10), N = ri(r, 4, 6), k = rs(r, 8, 14, 0.5); const cm = P - v; const Qc = FC * 1000 / cm, Qa = (FC + D) * 1000 / cm; const ocfStar = I0 / AF(k / 100, N); const Qf = (FC + ocfStar) * 1000 / cm;
    return { stem: `A ${firm(r)} product sells for $${P} with variable cost $${v}; fixed costs are $${FC}k a year and depreciation $${D}k. The $${I0}k outlay must earn ${pct(k)} over ${N} years (ignore taxes). What is the financial break-even quantity, in units per year?`,
      givens: { P, v, FC, D, I0, N, k }, answer: Math.round(Qf), unit: '', tolerance: { abs: 2 },
      steps: [step('Cash break-even FC/(P − v)', Qc, '', { abs: 2 }), step('Accounting break-even (FC + D)/(P − v)', Qa, '', { abs: 2 }), step('OCF* = I0 ÷ annuity factor', ocfStar, '$', { abs: 0.5 }), step('Financial break-even (FC + OCF*)/(P − v)', Qf, '', { abs: 2 })],
      solution: [`Contribution margin = ${P} − ${v} = ${cm}`, `Q_C = ${FC}k/${cm} = ${Math.round(Qc)}; Q_A = (${FC} + ${D})k/${cm} = ${Math.round(Qa)}`, `OCF* = ${I0}/AF(${k}%, ${N}) = ${R2(ocfStar)}k; Q_F = (${FC} + ${R2(ocfStar)})k/${cm} = ${Math.round(Qf)} (cash < accounting < financial)`], keystrokes: [`${I0} ÷ AF + ${FC} = × 1000 ÷ ${cm}`],
      errors: [err('ocf-in-accounting-breakeven', 'Accounting break-even reported', Qa, 'Financial break-even replaces D with OCF*, the cash flow that earns the required return.'), err('d-in-cash-breakeven', 'Added D as well as OCF*', (FC + D + ocfStar) * 1000 / cm, 'OCF* already covers the investment; D is not added again.'), err('divided-by-n', 'OCF* = I0/N', (FC + I0 / N) * 1000 / cm, 'Use the annuity factor.')] }; } },
  dol: { concept: 'c11-dol', difficulty: 2, make(r) {
    const FC = rs(r, 50, 300, 10), ocf = rs(r, 80, 400, 10), dq = rs(r, 5, 20, 5); const dol = 1 + FC / ocf; const dOCF = dol * dq;
    return { stem: `${firm(r)} has fixed costs of $${FC}k and operating cash flow of $${ocf}k. If sales volume rises ${pct(dq)}, by what percentage does OCF rise?`,
      givens: { FC, ocf, dq }, answer: R2(dOCF), unit: '%', tolerance: tolPct, steps: [step('DOL = 1 + FC/OCF', dol, 'x', { abs: 0.01 }), step('%ΔOCF = DOL × %ΔQ', dOCF, '%')],
      solution: [`DOL = 1 + FC/OCF = 1 + ${FC}/${ocf} = ${R2(dol)}`, `%ΔOCF = ${R2(dol)} × ${pct(dq)} = ${pct(dOCF)}`], keystrokes: [`${FC} ÷ ${ocf} + 1 = × ${dq} =`],
      errors: [err('fc-plus-d-dol', 'DOL = FC/OCF (forgot the 1)', FC / ocf * dq, 'DOL = 1 + FC/OCF.'), err('arithmetic', 'Returned the DOL', dol, 'Multiply the DOL by the volume change.')] }; } },
  decision_tree: { concept: 'c11-decision-trees', difficulty: 3, make(r) {
    const p = rs(r, 0.3, 0.7, 0.05), good = rs(r, 200, 600, 10), bad = rs(r, -200, 50, 10), cost = rs(r, 50, 200, 10); const ev = p * good + (1 - p) * bad; const v = ev - cost;
    return { stem: `${firm(r)} can spend $${cost}k today on a test market. With probability ${p} the market is strong and the follow-on project has an NPV of $${good}k (already in today's dollars); otherwise the NPV is ${bad < 0 ? '−' : ''}$${Math.abs(bad)}k. What is the NPV of going ahead with the test, in $ thousands?`,
      givens: { p, good, bad, cost }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 }, steps: [step('Expected NPV of the follow-on project', ev, '$', { abs: 0.5 }), step('Less the cost of the test today', v, '$', { abs: 0.5 })],
      solution: [`E[NPV] = ${p} × ${good} + ${(1 - p).toFixed(2)} × (${bad}) = ${R2(ev)}`, `NPV of testing = ${R2(ev)} − ${cost} = ${R2(v)} ⇒ ${v > 0 ? 'test' : 'do not test'}`], keystrokes: [`${p} × ${good} + ${(1 - p).toFixed(2)} × ${bad} − ${cost} =`],
      errors: [err('averaged-before-deciding', 'Took the bad branch as zero (abandon) without being told you could', p * good - cost, 'Only abandon if the question grants that option; here the bad outcome is realised.'), err('discounted-twice', 'Discounted the NPVs again', ev / 1.1 - cost, 'The branch NPVs are already present values.')] }; } },
  abandonment: { concept: 'c11-abandonment-expansion', difficulty: 3, make(r) {
    const p = rs(r, 0.3, 0.7, 0.05), good = rs(r, 200, 600, 10), bad = rs(r, -300, -50, 10), salvage = rs(r, 0, 80, 10), cost = rs(r, 50, 200, 10); const noOpt = p * good + (1 - p) * bad - cost; const withOpt = p * good + (1 - p) * Math.max(bad, salvage) - cost; const v = withOpt - noOpt;
    return { stem: `${firm(r)}'s project costs $${cost}k today. With probability ${p} it is worth $${good}k (PV); otherwise it is worth ${bad < 0 ? '−' : ''}$${Math.abs(bad)}k, but the firm could then abandon it and salvage $${salvage}k instead. What is the value of the option to abandon, in $ thousands?`,
      givens: { p, good, bad, salvage, cost }, answer: R2(v), unit: '$', tolerance: { abs: 0.5 }, steps: [step('NPV without the option', noOpt, '$', { abs: 0.5 }), step('NPV with the option (take the better of continue vs abandon)', withOpt, '$', { abs: 0.5 }), step('Option value = difference', v, '$', { abs: 0.5 })],
      solution: [`Without: ${p} × ${good} + ${(1 - p).toFixed(2)} × (${bad}) − ${cost} = ${R2(noOpt)}`, `With: in the bad state choose max(${bad}, ${salvage}) = ${Math.max(bad, salvage)} ⇒ NPV = ${R2(withOpt)}`, `Option to abandon is worth ${R2(withOpt)} − (${R2(noOpt)}) = ${R2(v)}`], keystrokes: [`(1 − p) × (salvage − bad)`],
      errors: [err('averaged-before-deciding', 'Valued the option as salvage itself', salvage, 'The option is worth the probability-weighted improvement, not the salvage value.'), err('discounted-twice', 'Forgot the probability weight', salvage - bad, 'Only the bad state (probability 1 − p) uses the option.')] }; } },
  // ---- Chapter 12
  states_er: { concept: 'c12-expected-return-states', difficulty: 2, make(r) {
    const p = [rs(r, 0.2, 0.4, 0.05), 0, 0]; p[1] = rs(r, 0.3, 0.5, 0.05); p[2] = R2(1 - p[0] - p[1]); const Rr = [rs(r, 15, 40, 1), rs(r, 5, 14, 1), rs(r, -25, 2, 1)]; const E = p[0] * Rr[0] + p[1] * Rr[1] + p[2] * Rr[2];
    return { stem: `${firm(r)} returns ${pct(Rr[0])} in a boom (probability ${p[0]}), ${pct(Rr[1])} in normal times (probability ${p[1]}) and ${pct(Rr[2])} in a recession (probability ${p[2]}). What is the expected return, in %?`,
      givens: { p, R: Rr }, answer: R2(E), unit: '%', tolerance: tolPct, steps: [step('E[R] = Σ p_i R_i', E, '%')],
      solution: [`E[R] = ${p[0]} × ${Rr[0]} + ${p[1]} × ${Rr[1]} + ${p[2]} × (${Rr[2]}) = ${pct(E)}`], keystrokes: [`${p[0]} × ${Rr[0]} + ${p[1]} × ${Rr[1]} + ${p[2]} × ${Rr[2]} =`],
      errors: [err('n-minus-1-with-probs', 'Simple average of the three returns', (Rr[0] + Rr[1] + Rr[2]) / 3, 'With probabilities, weight each return by its probability.'), err('weights-not-one', 'Dropped the recession state', p[0] * Rr[0] + p[1] * Rr[1], 'Every state counts, including the negative one.')] }; } },
  states_sd: { concept: 'c12-variance-states', difficulty: 3, multistep: true, make(r) {
    const p = [rs(r, 0.2, 0.4, 0.05), 0, 0]; p[1] = rs(r, 0.3, 0.5, 0.05); p[2] = R2(1 - p[0] - p[1]); const Rr = [rs(r, 15, 40, 1), rs(r, 5, 14, 1), rs(r, -25, 2, 1)]; const E = p[0] * Rr[0] + p[1] * Rr[1] + p[2] * Rr[2]; const varr = p[0] * (Rr[0] - E) ** 2 + p[1] * (Rr[1] - E) ** 2 + p[2] * (Rr[2] - E) ** 2; const sd = Math.sqrt(varr);
    return { stem: `${firm(r)} returns ${pct(Rr[0])} with probability ${p[0]}, ${pct(Rr[1])} with probability ${p[1]} and ${pct(Rr[2])} with probability ${p[2]}. What is the standard deviation of its return, in %?`,
      givens: { p, R: Rr }, answer: R2(sd), unit: '%', tolerance: tolPct, steps: [step('E[R]', E, '%'), step('Variance σ² = Σ p (R − E[R])²', varr, '', { abs: 0.5 }), step('σ = √variance', sd, '%')],
      solution: [`E[R] = ${pct(E)}`, `σ² = ${p[0]}(${Rr[0]} − ${R2(E)})² + ${p[1]}(${Rr[1]} − ${R2(E)})² + ${p[2]}(${Rr[2]} − ${R2(E)})² = ${R2(varr)}`, `σ = √${R2(varr)} = ${pct(sd)}`], keystrokes: [`each (R − E) x² × p, sum, √`],
      errors: [err('no-square-root', 'Reported the variance', varr, 'Standard deviation is the square root of the variance.'), err('n-minus-1-with-probs', 'Divided by N − 1 as if historical', Math.sqrt(((Rr[0] - E) ** 2 + (Rr[1] - E) ** 2 + (Rr[2] - E) ** 2) / 2), 'With probabilities there is no N − 1: weight each squared deviation by p.')] }; } },
  hist_sd: { concept: 'c12-historical-sd', difficulty: 2, multistep: true, make(r) {
    const rets = [rs(r, -15, 30, 1), rs(r, -15, 30, 1), rs(r, -15, 30, 1), rs(r, -15, 30, 1), rs(r, -15, 30, 1)]; const mean = rets.reduce((s, x) => s + x, 0) / 5; const ss = rets.reduce((s, x) => s + (x - mean) ** 2, 0); const sd = Math.sqrt(ss / 4);
    return { stem: `${firm(r)} returned ${rets.map(x => pct(x)).join(', ')} over the last five years (a sample). What is the sample standard deviation of its returns, in %?`,
      givens: { rets }, answer: R2(sd), unit: '%', tolerance: tolPct, steps: [step('Mean return', mean, '%'), step('Sum of squared deviations', ss, '', { abs: 0.5 }), step('σ = √(SS/(N − 1))', sd, '%')],
      solution: [`Mean = ${pct(mean)}; SS = ${R2(ss)}`, `Sample σ = √(${R2(ss)}/4) = ${pct(sd)} (population version would divide by 5: ${pct(Math.sqrt(ss / 5))})`], keystrokes: [`STAT: 1-V, enter the five returns, Sx`],
      errors: [err('n-with-sample', 'Divided by N instead of N − 1', Math.sqrt(ss / 5), 'A sample of years uses N − 1.'), err('no-square-root', 'Reported the variance', ss / 4, 'Take the square root.')] }; } },
  risk_premium: { concept: 'c12-risk-aversion-premium', difficulty: 1, make(r) {
    const stocks = [rs(r, -10, 30, 1), rs(r, -10, 30, 1), rs(r, -10, 30, 1), rs(r, -10, 30, 1)]; const bills = [rs(r, 1, 5, 0.5), rs(r, 1, 5, 0.5), rs(r, 1, 5, 0.5), rs(r, 1, 5, 0.5)]; const ms = stocks.reduce((s, x) => s + x, 0) / 4, mb = bills.reduce((s, x) => s + x, 0) / 4;
    return { stem: `Over four years large-cap stocks returned ${stocks.map(x => pct(x)).join(', ')} while T-bills returned ${bills.map(x => pct(x)).join(', ')}. What was the average risk premium on stocks, in % per annum?`,
      givens: { stocks, bills }, answer: R2(ms - mb), unit: '%', tolerance: tolPct, steps: [step('Average stock return', ms, '%'), step('Average T-bill return', mb, '%'), step('Risk premium = difference', ms - mb, '%')],
      solution: [`Average stocks ${pct(ms)}; average bills ${pct(mb)}; risk premium = ${pct(ms - mb)} PA`], keystrokes: [`(Σ stocks ÷ 4) − (Σ bills ÷ 4)`],
      errors: [err('arith-for-geo', 'Subtracted only the last year\'s T-bill rate', ms - bills[3], 'Use the average risk-free rate over the same years.'), err('forgot-minus-rf', 'Reported the stock average', ms, 'The premium is the excess over the risk-free return.')] }; } },
  normal_prob: { concept: 'c12-normal-distribution', difficulty: 2, make(r) {
    const mean = rs(r, 6, 14, 0.5), sd = rs(r, 12, 30, 1); const z = (0 - mean) / sd; const p = normCdf(z) * 100;
    return { stem: `${firm(r)}'s annual return is normally distributed with mean ${pct(mean)} and standard deviation ${pct(sd)}. What is the probability of a negative return in a given year, in %?`,
      givens: { mean, sd }, answer: R2(p), unit: '%', tolerance: { abs: 0.6 }, steps: [step('z = (0 − mean)/σ', z, '', { abs: 0.01 }), step('P(R < 0) = N(z)', p, '%', { abs: 0.6 })],
      solution: [`z = (0 − ${mean})/${sd} = ${R2(z)}`, `P(R < 0) = N(${R2(z)}) = 1 − N(${R2(-z)}) = ${pct(p)} (from the normal table)`], keystrokes: [`(0 − ${mean}) ÷ ${sd} =; table`],
      errors: [err('alpha-sign', 'Read N(+z) instead of N(−z)', (1 - normCdf(z)) * 100, 'A negative z sits in the left tail: N(z) = 1 − N(|z|).'), err('units', 'Confused one σ with the probability', 31.73 / 2, 'Use the actual z-score, not the one-sigma rule.')] }; } },
  two_asset_return: { concept: 'c12-portfolio-weights-return', difficulty: 1, make(r) {
    const a = rs(r, 20, 80, 5), b = rs(r, 20, 80, 5); const ra = rs(r, 3, 8, 0.5), rb = rs(r, 7, 14, 0.5); const wa = a / (a + b); const v = wa * ra + (1 - wa) * rb;
    return { stem: `You invest $${a}k in a term deposit paying ${pct(ra)} and $${b}k in a diversified stock fund expected to return ${pct(rb)}. What is the expected return on your portfolio, in % per annum?`,
      givens: { a, b, ra, rb }, answer: R2(v), unit: '%', tolerance: tolPct, steps: [step('Weight in the deposit = a/(a + b)', wa, '', { abs: 0.002 }), step('E[R_P] = Σ w E[R]', v, '%')],
      solution: [`w_deposit = ${a}/${a + b} = ${R4(wa)}; w_stocks = ${R4(1 - wa)}`, `E[R_P] = ${R4(wa)} × ${ra} + ${R4(1 - wa)} × ${rb} = ${pct(v)} PA`], keystrokes: [`${a} ÷ ${a + b} = × ${ra} + (${b} ÷ ${a + b}) × ${rb} =`],
      errors: [err('weights-not-one', 'Simple average of the two returns', (ra + rb) / 2, 'Weight by dollars invested.'), err('units', 'Weighted by the wrong amounts', (1 - wa) * ra + wa * rb, 'Match each weight to its own asset.')] }; } },
  two_asset_sd: { concept: 'c12-portfolio-sd', difficulty: 3, multistep: true, make(r) {
    const wa = rs(r, 0.3, 0.7, 0.05), sa = rs(r, 10, 30, 1), sb = rs(r, 15, 40, 1), rho = rs(r, -0.5, 0.8, 0.1); const wb = R2(1 - wa); const varr = wa ** 2 * sa ** 2 + wb ** 2 * sb ** 2 + 2 * rho * wa * sa * wb * sb; const sd = Math.sqrt(varr);
    return { stem: `A portfolio holds ${pct(wa * 100)} in ${firm(r)} (σ = ${pct(sa)}) and ${pct(wb * 100)} in a second stock (σ = ${pct(sb)}). The correlation between them is ${rho}. What is the portfolio standard deviation, in %?`,
      givens: { wa, wb, sa, sb, rho }, answer: R2(sd), unit: '%', tolerance: tolPct, steps: [step('w_A²σ_A²', wa ** 2 * sa ** 2, '', { abs: 0.5 }), step('w_B²σ_B²', wb ** 2 * sb ** 2, '', { abs: 0.5 }), step('2ρ w_A σ_A w_B σ_B', 2 * rho * wa * sa * wb * sb, '', { abs: 0.5 }), step('σ_P = √(sum)', sd, '%')],
      solution: [`σ_P² = ${wa}² × ${sa}² + ${wb}² × ${sb}² + 2 × ${rho} × ${wa} × ${sa} × ${wb} × ${sb} = ${R2(varr)}`, `σ_P = √${R2(varr)} = ${pct(sd)}`], keystrokes: [`${wa} x² × ${sa} x² + ${wb} x² × ${sb} x² + 2 × ${rho} × ${wa} × ${sa} × ${wb} × ${sb} = √`],
      errors: [err('no-square-root', 'Reported the variance', varr, 'Take the square root.'), err('no-correlation', 'Weighted average of the σs (ρ = 1 shortcut)', wa * sa + wb * sb, 'Only with ρ = 1 is σ_P the weighted average; here ρ < 1 so diversification lowers it.'), err('rho-one-shortcut', 'Dropped the covariance term', Math.sqrt(wa ** 2 * sa ** 2 + wb ** 2 * sb ** 2), 'Include 2ρ w_A σ_A w_B σ_B (that is the ρ = 0 case).')] }; } },
  cov_corr: { concept: 'c12-covariance-correlation', difficulty: 3, multistep: true, make(r) {
    const p = [0.3, 0.4, 0.3]; const A = [rs(r, 15, 35, 1), rs(r, 5, 14, 1), rs(r, -20, 0, 1)]; const M = [rs(r, 12, 25, 1), rs(r, 4, 10, 1), rs(r, -15, 0, 1)]; const EA = p.reduce((s, x, i) => s + x * A[i], 0), EM = p.reduce((s, x, i) => s + x * M[i], 0); const cov = p.reduce((s, x, i) => s + x * (A[i] - EA) * (M[i] - EM), 0); const sA = Math.sqrt(p.reduce((s, x, i) => s + x * (A[i] - EA) ** 2, 0)), sM = Math.sqrt(p.reduce((s, x, i) => s + x * (M[i] - EM) ** 2, 0)); const rho = cov / (sA * sM);
    return { stem: `Three equally likely-weighted states (probabilities 0.3, 0.4, 0.3) give ${firm(r)} returns of ${A.map(x => pct(x)).join(', ')} and market returns of ${M.map(x => pct(x)).join(', ')}. What is the correlation between the stock and the market?`,
      givens: { p, A, M }, answer: R2(rho), unit: '', tolerance: tolRatio, steps: [step('E[R_A]', EA, '%'), step('E[R_M]', EM, '%'), step('Covariance Σ p (R_A − E_A)(R_M − E_M)', cov, '', { abs: 0.5 }), step('σ_A', sA, '%'), step('σ_M', sM, '%'), step('ρ = cov/(σ_A σ_M)', rho, '', tolRatio)],
      solution: [`E_A = ${R2(EA)}, E_M = ${R2(EM)}`, `cov = ${R2(cov)} (in %²); σ_A = ${R2(sA)}, σ_M = ${R2(sM)}`, `ρ = ${R2(cov)}/(${R2(sA)} × ${R2(sM)}) = ${R2(rho)}; β would be cov/σ_M² = ${R2(cov / sM ** 2)}`], keystrokes: [`cov ÷ (σ_A × σ_M)`],
      errors: [err('beta-sigma-m', 'Divided the covariance by σ_M² (that is beta)', cov / sM ** 2, 'Correlation divides by σ_A × σ_M; beta divides by σ_M².'), err('cov-as-rho', 'Reported the covariance', cov, 'Scale the covariance by both standard deviations.')] }; } },
  // ---- Chapter 13
  beta_rho: { concept: 'c13-beta', difficulty: 2, make(r) {
    const rho = rs(r, 0.2, 0.9, 0.05), si = rs(r, 15, 45, 1), sm = rs(r, 12, 25, 1); const beta = rho * si / sm;
    return { stem: `${firm(r)} has a return standard deviation of ${pct(si)} and a correlation of ${rho} with the market, whose standard deviation is ${pct(sm)}. What is the stock's beta?`,
      givens: { rho, si, sm }, answer: R2(beta), unit: '', tolerance: tolRatio, steps: [step('β = ρ σ_i/σ_M', beta, '', tolRatio)],
      solution: [`β = ρ_iM σ_i/σ_M = ${rho} × ${si}/${sm} = ${R2(beta)} (equivalently cov/σ_M² with cov = ρ σ_i σ_M = ${R2(rho * si * sm)})`], keystrokes: [`${rho} × ${si} ÷ ${sm} =`],
      errors: [err('beta-sigma-i', 'Inverted the ratio σ_M/σ_i', rho * sm / si, 'Beta scales the stock\'s σ by the market\'s, not the reverse.'), err('beta-sigma-m', 'Divided the covariance by σ_M, not σ_M²', rho * si, 'cov/σ_M leaves a stray σ_M; divide by the variance.')] }; } },
  portfolio_beta: { concept: 'c13-portfolio-beta', difficulty: 2, make(r) {
    const amounts = [rs(r, 10, 60, 5), rs(r, 10, 60, 5), rs(r, 10, 60, 5)]; const betas = [rs(r, 0.5, 1.8, 0.05), rs(r, 0.5, 1.8, 0.05), rs(r, 0.5, 1.8, 0.05)]; const rf = rs(r, 0, 40, 5); const total = amounts.reduce((s, x) => s + x, 0) + rf; const bp = amounts.reduce((s, x, i) => s + x / total * betas[i], 0);
    return { stem: `You hold $${amounts[0]}k, $${amounts[1]}k and $${amounts[2]}k in three stocks with betas ${betas.join(', ')}${rf ? ` plus $${rf}k in T-bills` : ''}. What is your portfolio beta?`,
      givens: { amounts, betas, rf }, answer: R2(bp), unit: '', tolerance: tolRatio, steps: [step('Total invested (including T-bills)', total, '$', { abs: 0.5 }), step('β_P = Σ w_i β_i', bp, '', tolRatio)],
      solution: [`Weights: ${amounts.map((x, i) => `${R4(x / total)} (β ${betas[i]})`).join(', ')}${rf ? `, T-bills ${R4(rf / total)} (β 0)` : ''}`, `β_P = ${amounts.map((x, i) => `${R4(x / total)} × ${betas[i]}`).join(' + ')} = ${R2(bp)}`], keystrokes: [`each amount ÷ ${total} × β, sum`],
      errors: [err('forgot-rf-weight', 'Ignored the T-bill money in the weights', amounts.reduce((s, x, i) => s + x / (total - rf) * betas[i], 0), 'The risk-free holding has β = 0 but still counts in the total.'), err('weights-not-one', 'Simple average of the betas', betas.reduce((s, x) => s + x, 0) / 3, 'Weight by dollars.')] }; } },
  target_beta: { concept: 'c13-portfolio-beta', difficulty: 3, make(r) {
    const bs = rs(r, 1.1, 2.0, 0.05), target = rs(r, 0.5, 1.6, 0.05); const w = target / bs;
    return { stem: `You want a portfolio with beta ${target} using ${firm(r)} (beta ${bs}) and T-bills. What fraction of your money goes into the stock (over 100% means borrowing at the risk-free rate)?`,
      givens: { bs, target }, answer: R2(w * 100), unit: '%', tolerance: tolPct, steps: [step('w_stock = β_target/β_stock', w * 100, '%')],
      solution: [`β_P = w β_s + (1 − w) × 0 = ${target} ⇒ w = ${target}/${bs} = ${R2(w * 100)}%${w > 1 ? ' (borrow ' + R2((w - 1) * 100) + '% at R_F)' : ''}`], keystrokes: [`${target} ÷ ${bs} = × 100`],
      errors: [err('forgot-rf-weight', 'Weight in T-bills reported', (1 - w) * 100, 'The question asks for the stock weight.'), err('beta-sigma-i', 'Inverted the ratio', bs / target * 100, 'w = target ÷ stock beta.')] }; } },
  capm: { concept: 'c13-capm', difficulty: 2, make(r) {
    const rf = rs(r, 2, 5, 0.25), beta = rs(r, 0.5, 1.8, 0.05), mrp = rs(r, 4, 8, 0.25); const style = pick(r, ['mrp', 'rm']); const rm = rf + mrp; const v = rf + beta * mrp;
    return { stem: `The risk-free rate is ${pct(rf)} and ${style === 'mrp' ? `the market risk premium is ${pct(mrp)}` : `the expected market return is ${pct(rm)}`}. ${firm(r)} has a beta of ${beta}. What return does the CAPM require, in % per annum?`,
      givens: { rf, beta, mrp, style }, answer: R2(v), unit: '%', tolerance: tolPct, steps: [step('Market risk premium E[R_M] − R_F', mrp, '%'), step('E[R] = R_F + β (E[R_M] − R_F)', v, '%')],
      solution: [`E[R_i] = R_F + β_i (E[R_M] − R_F) = ${rf} + ${beta} × ${mrp} = ${pct(v)} PA`], keystrokes: [`${beta} × ${mrp} + ${rf} =`],
      errors: [err('mrp-as-market', style === 'mrp' ? 'Treated the premium as the market return' : 'Treated the market return as the premium', style === 'mrp' ? rf + beta * (mrp - rf) : rf + beta * rm, 'The premium is E[R_M] − R_F; do not subtract R_F twice or forget to subtract it.'), err('forgot-minus-rf', 'Forgot to add R_F', beta * mrp, 'CAPM starts from the risk-free rate.')] }; } },
  sml_alpha: { concept: 'c13-sml-alpha', difficulty: 2, make(r) {
    const rf = rs(r, 2, 5, 0.25), beta = rs(r, 0.6, 1.6, 0.05), mrp = rs(r, 4, 8, 0.25), exp = rs(r, 6, 16, 0.25); const req = rf + beta * mrp; const alpha = exp - req;
    return { stem: `${firm(r)} (beta ${beta}) is expected to return ${pct(exp)}. The risk-free rate is ${pct(rf)} and the market risk premium ${pct(mrp)}. What is the stock's alpha (expected return minus the SML return), in %?`,
      givens: { rf, beta, mrp, exp }, answer: R2(alpha), unit: '%', tolerance: tolPct, steps: [step('SML (CAPM) return', req, '%'), step('α = expected − required', alpha, '%')],
      solution: [`Required = ${rf} + ${beta} × ${mrp} = ${pct(req)}`, `α = ${exp} − ${R2(req)} = ${pct(alpha)} ⇒ ${alpha > 0 ? 'above the SML: undervalued, buy' : alpha < 0 ? 'below the SML: overvalued, sell' : 'on the SML: fairly priced'}`], keystrokes: [`${exp} − (${rf} + ${beta} × ${mrp}) =`],
      errors: [err('alpha-sign', 'Required minus expected', -alpha, 'Alpha is expected minus required; positive means undervalued.'), err('mrp-as-market', 'Used the premium as the market return', exp - (rf + beta * (mrp - rf)), 'The premium already has R_F removed.')] }; } },
  solve_rf: { concept: 'c13-sml-alpha', difficulty: 3, make(r) {
    const rf = rs(r, 2, 5, 0.25), mrp = rs(r, 4, 8, 0.25), b1 = rs(r, 0.6, 1.0, 0.05), b2 = rs(r, 1.2, 1.8, 0.05); const r1 = R2(rf + b1 * mrp), r2 = R2(rf + b2 * mrp); const slope = (r2 - r1) / (b2 - b1); const rfS = r1 - b1 * slope;
    return { stem: `Two fairly priced stocks: A has beta ${b1} and expected return ${pct(r1)}; B has beta ${b2} and expected return ${pct(r2)}. What risk-free rate is implied by the SML, in %?`,
      givens: { b1, b2, r1, r2 }, answer: R2(rfS), unit: '%', tolerance: { abs: 0.1 }, steps: [step('SML slope (market risk premium) = ΔE[R]/Δβ', slope, '%', { abs: 0.1 }), step('R_F = E[R_A] − β_A × slope', rfS, '%', { abs: 0.1 })],
      solution: [`Slope = (${r2} − ${r1})/(${b2} − ${b1}) = ${pct(slope)} = market risk premium`, `R_F = ${r1} − ${b1} × ${R2(slope)} = ${pct(rfS)}`], keystrokes: [`(${r2} − ${r1}) ÷ (${b2} − ${b1}) = × ${b1} = ± + ${r1} =`],
      errors: [err('beta-sigma-i', 'Reported the slope', slope, 'The slope is the premium; extend the line to β = 0 for R_F.'), err('forgot-minus-rf', 'Reward-to-risk of A alone', r1 / b1, 'Reward-to-risk uses E[R] − R_F, which is what you are solving for.')] }; } },
  project_hurdle: { concept: 'c13-cost-of-capital-link', difficulty: 2, make(r) {
    const rf = rs(r, 2, 5, 0.25), beta = rs(r, 0.7, 1.8, 0.05), mrp = rs(r, 4, 8, 0.25), irrv = rs(r, 6, 16, 0.25); const req = rf + beta * mrp;
    return { stem: `A ${firm(r)} project has an IRR of ${pct(irrv)} and the same systematic risk as a stock with beta ${beta}. The risk-free rate is ${pct(rf)} and the market risk premium ${pct(mrp)}. What minimum return (hurdle rate) must the project beat, in %?`,
      givens: { rf, beta, mrp, irrv }, answer: R2(req), unit: '%', tolerance: tolPct, steps: [step('Hurdle = R_F + β (E[R_M] − R_F)', req, '%')],
      solution: [`Hurdle = ${rf} + ${beta} × ${mrp} = ${pct(req)}; IRR ${pct(irrv)} ⇒ ${irrv > req ? 'accept' : 'reject'}`], keystrokes: [`${beta} × ${mrp} + ${rf} =`],
      errors: [err('mrp-as-market', 'Premium treated as the market return', rf + beta * (mrp - rf), 'The premium is already in excess of R_F.'), err('sharpe-with-beta', 'Compared the IRR with the market return', rf + mrp, 'The hurdle depends on the project\'s own beta.')] }; } },
  sharpe: { concept: 'c13-sharpe-cml', difficulty: 1, make(r) {
    const er = rs(r, 7, 15, 0.5), rf = rs(r, 2, 5, 0.25), sd = rs(r, 10, 30, 1); const v = (er - rf) / sd;
    return { stem: `Portfolio P has expected return ${pct(er)} and standard deviation ${pct(sd)}; the risk-free rate is ${pct(rf)}. What is its Sharpe ratio?`,
      givens: { er, rf, sd }, answer: R2(v), unit: '', tolerance: tolRatio, steps: [step('Sharpe = (E[R_P] − R_F)/σ_P', v, '', tolRatio)],
      solution: [`Sharpe = (${er} − ${rf})/${sd} = ${R2(v)} (the slope of the CAL through P)`], keystrokes: [`(${er} − ${rf}) ÷ ${sd} =`],
      errors: [err('forgot-minus-rf', 'Did not subtract R_F', er / sd, 'The Sharpe ratio uses the excess return.'), err('sharpe-with-beta', 'Divided by 1 (a beta) instead of σ', er - rf, 'Sharpe uses total risk σ, not β.')] }; } },
  cal_mix: { concept: 'c13-risk-free-cal', difficulty: 2, make(r) {
    const er = rs(r, 8, 14, 0.5), rf = rs(r, 2, 5, 0.25), sd = rs(r, 15, 30, 1), w = rs(r, 0.4, 1.4, 0.1); const E = w * er + (1 - w) * rf; const s = w * sd;
    return { stem: `You put ${pct(w * 100)} of your money in portfolio P (expected return ${pct(er)}, σ ${pct(sd)}) and the rest in T-bills at ${pct(rf)}${w > 1 ? ' (borrowing at the risk-free rate)' : ''}. What is the standard deviation of your position, in %?`,
      givens: { er, rf, sd, w }, answer: R2(s), unit: '%', tolerance: tolPct, steps: [step('E[R] = w E[R_P] + (1 − w) R_F', E, '%'), step('σ = w σ_P', s, '%')],
      solution: [`E[R] = ${w} × ${er} + ${R2(1 - w)} × ${rf} = ${pct(E)}`, `σ = ${w} × ${sd} = ${pct(s)} (the risk-free asset has σ = 0 and zero correlation: the CAL is a straight line)`], keystrokes: [`${w} × ${sd} =`],
      errors: [err('no-square-root', 'Applied the two-asset formula with ρ = 0 and σ_F = 0 but reported variance', (w * sd) ** 2, 'σ = w σ_P; take the root.'), err('weights-not-one', 'Reported the expected return', E, 'The question asks for σ.')] }; } },
};

function nearAnswer(v, target, tol) { tol = tol || {}; const a = tol.abs, r = tol.rel; const d = Math.abs(v - target); const lim = Math.max(a !== undefined ? a : 0, r !== undefined ? Math.abs(target) * r : 0, Math.abs(target) * 0.004 + 0.005); return d <= lim + 1e-9; }
/** Build a concrete question from a generator reference. q = { id, concept, generator, ... }; seed any integer. */
export function generate(q, seed = Math.floor(Math.random() * 1e9)) {
  const g = GENERATORS[q.generator];
  if (!g) return null;
  const made = g.make(rng(seed));
  // an error-library entry that happens to coincide with the right answer for this seed does not apply: drop it
  made.errors = (made.errors || []).filter(e => Number.isFinite(e.value) && !nearAnswer(e.value, made.answer, made.tolerance));
  const type = g.multistep && made.steps && made.steps.length >= 2 ? 'multistep' : 'numeric';
  return Object.assign({ id: q.id, concept: q.concept, also: [], angle: 'calc', difficulty: g.difficulty, source: 'generated', ref: 'generator ' + q.generator, explanation: made.solution[0] }, q, made, { type: q.oneShot ? 'numeric' : type, seed, generated: true, generator: q.generator });
}
/** Synthetic question entries (3 per generator) so the engine's pools and exams include the generators. */
export function generatorQuestions(course = 'fin201') {
  const out = [];
  for (const [name, g] of Object.entries(GENERATORS)) for (let k = 1; k <= 3; k++) out.push({ id: `${course}-g-${name}-${k}`, concept: `${course}-${g.concept}`, also: [], type: 'gen', generator: name, angle: 'calc', difficulty: g.difficulty, stem: `[${name} generator]`, options: [], answer: 0, explanation: '', source: 'generated', oneShot: k === 3 && g.multistep ? true : false });
  return out;
}
