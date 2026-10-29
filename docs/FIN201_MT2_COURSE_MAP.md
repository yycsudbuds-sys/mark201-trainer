# FIN 201 Midterm 2 — course map

Built from the course folder on the Desktop ("Finance Midterm 2"): the outline, the professor's review guide,
the practice examples, the formula and table sheets, lecture decks 04/05A/05B/05C/06, seminars 4-7, the
Ross *Fundamentals of Corporate Finance* text (chapters 8-13) and the 12th Canadian edition solutions manual
for chapters 8-13. Midterm 1 decks (01, 02A-C, 03) were skimmed for notation only. Deck 07 (derivatives) and
seminars 8-10 are out of scope and were ignored.

Source tags used below: `OUT p3` = outline page 3, `REV p3` = review guide page 3, `PRAC q10` = practice
examples question 10, `FS p1` = formula sheet page 1, `L04 s17` = lecture deck 04 slide 17, `S5 s23` =
seminar 5 slide 23, `TB 8.2` = textbook section 8.2, `SM 10-7` = solutions manual chapter 10 problem 7.

## 1. Exam logistics

| item | value | source |
|---|---|---|
| Date | Tuesday 3 November 2026, in the lecture slot (A01 8:00-9:20, A02 11:00-12:20) | OUT p1, p4 |
| Length | 1 hour, 100 marks (the practice set is "about 60% of the length", 60 marks, 35 minutes) | PRAC p1 |
| Format | On paper, closed book. Multiple choice at 4 marks each (A-E, usually with "None of the above") plus short numeric-answer questions with answer boxes, units printed beside the box ("% per annum", "$", "shares"), and space to show work for partial marks | PRAC p1-6, OUT p5 |
| Scope | Chapters 8 to 13 of Ross (not 24-25). Non-cumulative "but finance is a cumulative subject, and the questions may rely on earlier concepts" | OUT p4-5 |
| Aids | A formula sheet is provided (the "common" sheet, Midterm 1 and Midterm 2 sections); financial and scientific calculators allowed, de-programmed; TI BA II Plus recommended. Pencils, pens, transparent water bottle, ONEcard | OUT p5, p8 |
| Weight | 20% of the course grade (half the weight can shift to the final if the final is higher) | OUT p5 |
| Question mix in the sample | 8 MC (32 marks) + 4 numeric problems (28 marks): stocks 24/60, capital budgeting 24/60, risk and return 12/60 | PRAC |
| Recommended problems (12th Cdn ed.) | Ch 8 Q&P 1, 4, 5, 11, 14, 19, 23, 26 · Ch 9 CTQ 2, 6, 7 and Q&P 1, 4, 6, 7, 9, 12, 13, 15, 16, 17 · Ch 10 Q&P 1, 3, 6, 11, 16, 22, 34, 36 · Ch 11 Q&P 3, 4, 20, 23 · Ch 12 Q&P 1, 2, 3, 8, 9, 12 · Ch 13 Q&P 1, 2, 13, 15, 19, 27 | OUT p6 |
| Rounding conventions | Rates as "% per annum" (PA) to 2-4 decimals in worked answers (14.4714 % PA, 3.2274 % PA); dollars to the cent in final answers, intermediate values carried unrounded; years to 1-3 decimals (3.4 years, 3.802 years); formula-sheet notation R (rate per period), N, PMT, k or R for the discount rate, T or T_C for the tax rate, d for the CCA rate | L02A, L04, L05A, FS |

Exam-simulator settings used by the trainer: 60 minutes, 100 marks, 13 MC at 4 marks plus 6 numeric problems
worth 48 marks in 2-6 mark parts, same topic split as the sample (stocks ~35%, capital budgeting ~40%, risk and
return ~25%).

## 2. Topic tree

Chapter numbers follow the professor's schedule (Ross chapters). Each section becomes a siege on the finance
map; each concept has the sources it was built from.

### Chapter 8 — Stocks (equity valuation) `L04`, `S4`, `TB 8`, `SM 8`, `REV p3 §2`

8.1 Returns on a stock
- Holding period return r_E = (P1 + D1)/P0 − 1 = capital gain yield + dividend yield. `L04 s6-8`, `FS p1`, `TB 12.1`, `SM 12-1..3`
- Arithmetic vs geometric average: r_A = ΣR/N, R_G = [Π(1+R)]^(1/N) − 1, R_A ≥ R_G, geometric is "the truth" (compounding). `L04 s10-11`, `FS p1`, `TB 12.5`, `SM 12-12,13`
- Value of a holding after N years and the compound return implied. `L04 s11` (worked: $1,000 at 8%, −3%, 5% → $1,099.98, 3.2274% PA)

8.2 Valuation vocabulary
- Book value, market value, liquidation value. `L04 s13`, `REV p3`, `PRAC q2`
- Market capitalisation, shares outstanding, trailing vs forward P/E, P/B (market-to-book), dividend yield, earnings yield, price/sales; reading a quote screen. `L04 s14-15`, `PRAC q9`, `TB 8.3`, `SM 8-22`
- Debt vs equity (risk, voting, predictability of income, tax treatment of interest vs dividends); primary vs secondary markets; NYSE, NASDAQ, TSX, ECNs; brokers, dealers, bid-ask, order types; preferred stock as a perpetuity. `L04 s3-4`, `REV p3`, `TB 8.2-8.3`, `SM 8-8,21`

8.3 Comparables
- Price = benchmark P/E × EPS (trailing or forward); price/sales for loss-makers; EV/EBITDA with Equity = EV − Debt + Cash; why comparables work (same g, ROE/b, R_E → same P/E). `L04 s18, s32`, `FS p2`, `PRAC q1`, `TB 8.1 "multiples"`, `SM 8-11,12,25-27`

8.4 Dividend discount model
- Constant dividend (perpetuity) P0 = D/R; Gordon growth P0 = D1/(R − g) with D1 = D0(1+g); price at time t grows at g (P_t = P0(1+g)^t). `L04 s19-21`, `S4 s5`, `FS p1`, `TB 8.1`, `SM 8-1,4`
- Components of required return R = D1/P0 + g (dividend yield + capital gain rate); solving for g, D0, P0 or R. `L04 s20`, `FS p1`, `TB 8.1`, `SM 8-2,3,5,6,19,20`
- Growing annuity (finite growth) PV = D1/(R−g) × [1 − ((1+g)/(1+R))^N]. `FS p1`, `S4 s8`

8.5 Non-constant growth
- Timeline: supernormal/no-dividend years, horizon price P_T = D_{T+1}/(R − g2) one period before the first constant-growth dividend, discount everything back. `TB 8.1 Fig 8.1`, `S4 s6-13`, `SM 8-13..18, 23, 24, 32`
- Two-stage formula (growing annuity + horizon). `FS p1`, `TB 8.1`, `SM 8-17,23`
- Solving backwards: find g2 from a given horizon price, find D1 from a given P0. `S4 s9-13`, `SM 8-18`

8.6 Where growth comes from
- Plowback b = (EPS − DPS)/EPS, payout 1 − b, g = b × ROE, ROE on start-of-year book equity. `L04 s23-28`, `FS p1`, `PRAC q4`
- Forward P/E = (1 − b)/(R − g): high g, low R, high payout → higher P/E; growth vs income stocks and life cycle. `L04 s29-31`, `REV p3`, `TB 8 minicase`
- NPVGO: P0 = EPS1/R + NPVGO; negative NPVGO means growth destroys value or the stock is undervalued; P/E = 1/R + NPVGO/EPS. `L04 s33-34`, `FS p1`, `S4 s14-21`
- Growth implied by trailing vs forward multiples (EPS1/EPS0 = trailing P/E ÷ forward P/E). `PRAC q9b`

8.7 Free cash flow valuation
- Income statement to cash flow: EBITDA → EBIT → EBT → NPAT; FCF = EBIT(1−T) + D&A − CAPEX − ΔWC (discount at the firm rate → EV); FCFE = NPAT + D&A − CAPEX − ΔWC + ΔDebt (→ equity); FCFE = FCF − (1−T)Interest + ΔDebt; Equity = EV − Debt + Cash. `L04 s37-43`, `FS p2`, `REV p3`
- Working capital = cash + inventory + receivables − payables = current assets − current liabilities; which changes are positive ΔWC. `L04 s39`, `FS p2`, `PRAC q6`, `REV p3`
- When to use comparables vs DDM vs FCFF vs FCFE. `REV p3`

8.8 Market efficiency
- Weak, semi-strong, strong forms and the information each prices in; weak and semi-strong are desirable, strong is not (insider trading). `L04 s45-50`, `TB 12.6`, `SM 12-5,6,10`
- Inefficiencies and how to profit: momentum (weak-form inefficiency), price responses to announcements (efficient, delayed, overreaction). `L04 s47-50`, `PRAC q3`, `TB 12.6 Fig 12.14`
- Noise trading and behaviour: health/tax selling, disposition effect, overconfidence, sentiment. `L04 s51`, `REV p2`

### Chapter 9 — Capital budgeting: decision rules `L05A`, `S5`, `TB 9`, `SM 9`, `REV p3 §3`

9.1 Accounting rates of return
- ROC = average annual profit after tax ÷ average investment ((I0 + book value at end)/2); ROE, ROA variants; relative rule; pros/cons (accruals, no TVM, single-year averages, no absolute decision). `L05A s6-9`, `PRAC q10a`, `TB 9.4`, `SM 9-6`

9.2 Payback and discounted payback
- Cumulative cash flow table, fractional year = remaining ÷ next year's flow; discounted version; rules, pros/cons; discounted payback < life ⇒ NPV > 0. `L05A s10-13`, `TB 9.2-9.3`, `SM 9-1..5, CTQ 1-4`

9.3 Net present value
- NPV = CF0 + PV; rule; "change in shareholder wealth"; the four-step sequence (cash flows, discount rate, equalise lives, decide). `L05A s15-19`, `FS p2`, `S5 s3-4`, `TB 9.1`, `SM 9-8,9,11,18,21`

9.4 Internal rate of return
- IRR makes NPV = 0 (YTM idea); rule IRR > R for conventional flows; NPV profile; number of IRRs ≤ sign changes; unconventional flows (maintenance years, incremental projects); financing-type flows; no real IRR. `L05A s20-26`, `S5 s7-13`, `TB 9.5`, `SM 9-7,10,14,20,22,23`
- Mutually exclusive ranking conflict (scale and timing), crossover rate = IRR of the difference, incremental IRR of "A minus B". `L05A s34`, `TB 9.5`, `SM 9-12,13,17`
- MIRR (discounting, reinvestment, combination). `TB 9.5`, `SM 9 App A1-A3` (low weight: not in the lecture)

9.5 Profitability index
- PI = PV of inflows ÷ PV of outflows (1-based) vs NPV/outlay (0-based); PI > 1; same accept/reject as NPV, different ranking; use for capital rationing. `L05A s27-33`, `FS p2`, `PRAC q5`, `TB 9.6`, `SM 9-15,16,17`

9.6 Project relationships and rationing
- Independent, dependent, mutually exclusive (timing, replacement); capital rationing = rejecting positive-NPV projects for lack of funds, soft vs hard, rank by PI. `L05A s32-35`, `PRAC q5`, `TB 11.6`, `REV p3`

9.7 Unequal lives
- Constant chain of replacement (NPV to infinity), lowest common multiple, equivalent annual value/annuity/benefit/cost; rate at which two options are equal. `L05A s36-37`, `TB 10.6`, `S6 s11-14`, `SM 10-27..31, 44, 45`

### Chapter 10 — Capital budgeting: cash flows `L05B`, `S5 s14-27`, `S6`, `TB 10`, `SM 10`, `REV p3 §3`

10.1 Relevant cash flows
- Incremental cash flows and the stand-alone principle; sunk costs and allocated costs (×0); opportunity costs at today's value; side effects (erosion, spill-overs); financing costs excluded; after-tax, when they occur. `L05B s10-11`, `S5 s14`, `TB 10.1-10.2`, `SM 10-1,2,10,18,19,20`, `PRAC q11b`
- Five tax categories: ×0, ×1 (CAPEX, ΔWC), ×(1−T) (revenue, expenses), ×T (CCA tax shield), other (salvage with recapture and capital gains). `L05B s10-14`, `REV p3`, `PRAC q11`

10.2 Operating cash flow
- OCF = EBIT + D − Tax = EBIT(1−T) + D = NI + D (bottom-up) = S − C − Tax (top-down) = (S − C)(1−T) + T×D (tax shield). `S5 s15-16`, `TB 10.5`, `SM 10-4,5,13,25,26`

10.3 Net working capital
- Project NWC invested up front or as % of sales, changes each year, recovered at the end; positive change = cash outflow. `L05B s12`, `S6 s2-5`, `TB 10.3-10.4`, `SM 10-12,35`, `PRAC q6`

10.4 CCA, UCC and the tax shield
- Declining balance: CCA_t = d × UCC_{t−1}; UCC rolls forward; half-year rule (0.5 × d × I0 in year 1) vs Accelerated Investment Incentive (1.5×) vs 100%; DTS = CCA × T_C; CCA classes and rates. `L05B s6-8, 15`, `S5 s19-20, 25-26`, `SM 10-11,13,14`
- PV of the CCA tax shield: (I0 d T_C)/(k + d) × {1 or (1 + 0.5k)/(1+k) or (1.5k + 1)/(1+k)} − (S_N d T_C)/(k + d) × 1/(1+k)^N; derivation from the growing perpetuity with g = −d. `L05B s15-17, 22`, `FS p2`, `S5 s21-23`, `S6 s6,10`, `SM 10-7,8,9,14..16,21..24`
- Net acquisitions rule when buying and selling in the same class; net salvage. `S5 s26`, `S6 s8,19`

10.5 Disposal of depreciable assets (Canada)
- ACB, POD, UCC; recapture of CCA (POD above UCC up to ACB), terminal loss (POD below UCC, tax saving), capital gain above ACB taxed at 50%; CFAT = POD − T×[min(ACB, POD) − UCC] − 0.5×T×max(POD − ACB, 0); after-tax salvage when the asset class stays open vs closes. `L05B s18-25`, `FS p2`, `PRAC q11c`, `SM 10-11`
- Cross-check: total tax saved = T × (cost − proceeds). `L05B s25`

10.6 Assembling an NPV
- Expansion project (Seminar 6 tractor plant): revenue and costs ×(1−T), CAPEX, land opportunity cost, feasibility study sunk, ΔNWC as % of sales, salvage, PVCCA with AII. `S6 s2-6`
- Replacement project (Dickerson, Simple Replacement): net acquisition cost, net salvage, incremental savings, NWC as % of sales. `S6 s7-10, 16-19`, `SM 10-36,37,51`
- Cost-cutting and required savings (solve for the saving that makes NPV = 0). `TB 10.6`, `SM 10-21,22,23,34,48`
- Bid price / break-even revenue: set NPV = 0, back out after-tax net revenue, then price. `TB 10.6`, `SM 10-24,33,43,50,52`
- Clean Air Industries: comparing three alternatives by incremental NPV; opportunity cost of land in and out. `L05B s27-31`
- Three choices and timing of sale; NPV at year 5 of selling vs holding (lost tax shield as opportunity cost). `L05B s26`

10.7 EAC with taxes, nominal vs real
- EAC/EAV = PV of costs ÷ annuity factor, including PVCCA and salvage. `S6 s11-14`, `SM 10-28..31,38,41,42,45`
- Nominal flows at nominal rates, real flows at real rates; (1+R_nom) = (1+R_inf)(1+R_real). `FS p1`, `SM 10 App A1`, `SM 10-40`

### Chapter 11 — Project analysis and real options `L05C`, `TB 11`, `SM 11`, `REV p3 §3`

11.1 Forecasting risk and what-if analysis
- Forecasting risk and sources of value. `TB 11.1`, `SM 11 CTQ 1`
- Sensitivity: one input at a time, 2N+1 runs, ΔNPV/Δinput, which variable matters most. `L05C s4`, `TB 11.2`, `SM 11-4,5,17,19,27`
- Scenario: several inputs together, best/base/worst, not linear because of fixed costs. `L05C s5`, `TB 11.2`, `SM 11-3,6,19,26`
- Simulation: random inputs from distributions, look at the output distribution not just the expected value. `L05C s6`, `TB 11.2`
- NPV break-even: how far an input can move before NPV crosses zero (finance), vs profit break-even (accounting); worked plant example (DTS annuity + perpetuity → EBITDA ≥ $114,277.18). `L05C s7-9`, `SM 11-27`, `REV p3`

11.2 Break-even points and operating leverage
- Cash break-even Q_C = FC/(P − v); accounting Q_A = (FC + D)/(P − v); financial Q_F = (FC + OCF*)/(P − v) with OCF* = I0 ÷ annuity factor (with taxes: Q = {FC + (OCF − T D)/(1 − T)}/(P − v)); ordering cash < accounting < financial; what each implies for IRR/payback/NPV. `TB 11.3-11.4`, `SM 11-1,7..10,16,24,28`
- Degree of operating leverage DOL = 1 + FC/OCF; %ΔOCF = DOL × %ΔQ; DOL at accounting break-even = 1 + FC/D; high fixed costs = high forecasting risk. `TB 11.5`, `SM 11-5,11..15,18,25,29`

11.3 Real (managerial) options
- Option = right not obligation, premium, financial vs real; expansion, abandonment, timing, production flexibility; decision trees with probabilities and NPVs already discounted (freeway bridges example); abandonment value raises NPV; value of the option to expand = probability-weighted gain discounted. `L05C s10-16`, `TB 11.6 (US ed. covers in Ch 11)`, `SM 11-20,21`, `SM 10-46`, `REV p1-2`

### Chapter 12 — Risk, return and diversification `L06 first class`, `S7 s1-13`, `TB 12`, `TB 13.1-13.5`, `SM 12`, `SM 13`, `REV p3 §4`

12.1 Risk and reward
- Investor/borrower link: E[R] is the required return and the cost of capital. `L06 s3, s45`
- Risk aversion (averse, neutral, seeking), compensation, risk premium = excess return = E[R] − R_F (equity risk premium example 8% − 2%). `L06 s8-9`, `TB 12.3`, `SM 12-7,9`
- Lessons from history: stocks beat bonds beat bills, small > large, reward for bearing risk, greater reward ⇒ greater risk; real vs nominal via Fisher. `TB 12.2-12.4`, `SM 12-4,5,9,10,14`

12.2 Measuring return and risk
- HPR again; expected return from states E[R] = Σ p_i R_i; variance σ² = Σ p_i (R_i − E[R])². `L06 s11`, `S7 s4`, `TB 13.1`, `SM 13-5,6,7`
- Historical: mean, population vs sample standard deviation (÷N vs ÷(N−1)) and when each applies. `L06 s13`, `FS p2`, `TB 12.4`, `SM 12-6,7,8,11`
- Normal distribution: 68/95/99 ranges, probability of a loss via z. `TB 12.4`, `SM 12-15,16`, table sheet p2
- Risk-return diagram (σ on x, E[R] on y), domination, efficient frontier for single stocks. `L06 s14-17`, `REV p3`

12.3 Two-stock portfolios
- Weights sum to 1; E[R_P] = Σ w_k E[R_k] (linear). `L06 s21-22`, `FS p2`, `PRAC q8`, `SM 13-1..4,8`
- σ_P = √(w_A²σ_A² + w_B²σ_B² + 2ρ_AB w_A σ_A w_B σ_B); correlation matrix view. `L06 s23-24`, `FS p2`, `S7 s11-13`, `SM 13-11,12`
- Covariance and correlation: cov = Σ p (R_A − E)(R_B − E), ρ = cov/(σ_A σ_B), −1 ≤ ρ ≤ 1, scatter shapes, same industry/country ⇒ high ρ. `L06 s25-30`, `S7 s5-10`
- Diversification benefit whenever ρ < 1; shapes of the feasible curve for ρ = 1, 0, −1; some weights are inefficient; many stocks → efficient frontier left of every stock. `L06 s18-19, 31-37`, `SM 13-11`
- Portfolio σ falls at a decreasing rate as N grows, toward σ_M (systematic). `L06 s46-47`, `PRAC q7`, `TB 13.5`

### Chapter 13 — CML, Sharpe ratio, CAPM and the SML `L06 second class`, `S7 s14-24`, `TB 13.6-13.8`, `SM 13`, `REV p3 §4`

13.1 Adding the risk-free asset
- R_F with σ = 0; mixing P and R_F gives a straight capital allocation line; borrowing (w_F < 0); why the CAL is straight. `L06 s38-40`, `SM 13-19,20`
- Sharpe ratio = tan φ = (E[R_P] − R_F)/σ_P; comparing CALs; the best CAL is tangent to the frontier = capital market line; the market portfolio M and the index proxy (S&P 500, SPDR). `L06 s41-44`, `FS p2`, `REV p3`, `SM 13 App A1`

13.2 Systematic risk and beta
- Company-specific = diversifiable = unsystematic vs market = non-diversifiable = systematic; total risk = systematic + unsystematic; diversification removes only the first. `L06 s46-49`, `S7 s22`, `TB 13.4-13.5`, `SM 13 CTQ 1,3,4,6`
- Beta: β = cov(R_i, R_M)/σ_M² = ρ σ_i/σ_M; slope of the regression of stock returns on market returns; β = 1 market, 0 T-bills, 0-1 defensive, >1 aggressive, <0 rare; not bounded like ρ; providers differ. `L06 s50-54`, `S7 s14-16`, `SM 13-32`, `REV p3`
- Portfolio beta = Σ w_i β_i, including a risk-free weight; building a portfolio with a target beta. `S7 s19-20`, `SM 13-13,14,19,20,26,27`

13.3 CAPM and the SML
- E[R_i] − R_F = β_i (E[R_M] − R_F) → E[R_i] = R_F + β_i (E[R_M] − R_F); three parts (time value, market risk premium, amount of systematic risk). `L06 s54-55`, `FS p2`, `PRAC q12`, `S7 s17-18`, `SM 13-15..18`
- SML: expected return vs β, slope = market risk premium; alpha above/below; undervalued (above) vs overvalued (below); reward-to-risk ratio equal for all assets; solving for R_F or E[R_M] from two assets. `L06 s56-57`, `S7 s23-24`, `TB 13.7`, `SM 13-21,22,24,29,30`
- σ ≠ β: total risk vs systematic risk; which stock is "riskier" to a diversified investor. `L06 s58`, `SM 13-28,33`
- How to build a portfolio: first stock low σ, next few low ρ, additions to a diversified portfolio low β with positive α. `L06 s59`, `REV p3`
- Link to cost of capital: a project must beat the SML return for its beta (preview of Ch 14). `TB 13.8`

## 3. Formulas (professor's notation)

G = printed on the exam formula sheet. M = must be memorised (or derived on the spot).

| # | formula | G/M | use when | traps |
|---|---|---|---|---|
| 1 | r_E = (P1 + D1)/P0 − 1 = (P1 − P0)/P0 + D1/P0 | G | one-period stock return; splits into capital gain yield + dividend yield | dividend yield uses D1 over P0 (today's price), not P1 |
| 2 | r_A = (R1 + … + R_N)/N | G | average year return; forecasting next year | arithmetic ≥ geometric; use for "typical year" |
| 3 | R_G = [(1+R1)…(1+R_N)]^(1/N) − 1 | G | compound return actually earned; ending value = PV(1+R_G)^N | convert % to decimals before multiplying; geometric ≈ arithmetic − σ²/2 |
| 4 | PV = D1/(R − g) | G | Gordon growth; price one period before the first dividend in the formula | D1 = D0(1+g) when "just paid"; needs g < R; price at t uses D_{t+1} |
| 5 | PV = D1/(R−g) × [1 − ((1+g)/(1+R))^N] | G | growing annuity for a finite high-growth phase (two-stage) | first term uses g1 (can exceed R); add the discounted horizon price |
| 6 | R = D1/PV + g | G (MT1 block) | required return from price; dividend yield + capital gain yield | use next dividend; g is also the capital gain yield |
| 7 | g = b × ROE, b = (EPS − DPS)/EPS | G | growth from plowback; payout = 1 − b | ROE on start-of-year equity; if given payout use b = 1 − payout |
| 8 | P0 = EPS1/R + NPVGO | G | value of growth opportunities; rearrange for NPVGO; P/E = 1/R + NPVGO/EPS1 | EPS1 = next year's EPS, not EPS0 |
| 9 | Forward P/E = (1 − b)/(R − g) | M | why high growth/low risk/high payout mean high P/E; comparables logic | derived from P0 = (1−b)EPS1/(R−g) |
| 10 | P = benchmark P/E × EPS; P = P/S × sales per share | M | comparables; target price = P/E × EPS_{t+1} | trailing vs forward EPS must match the multiple |
| 11 | WC = Cash + Invent. + Receivables − Payables | G | ΔWC in FCF and project cash flows | payables increase reduces WC; inventory increase is a positive ΔWC (outflow) |
| 12 | FCF = EBIT(1−T) + D&A − CAPEX − ΔWC | G | value the whole firm → EV | NPAT excludes interest; do not subtract interest in FCF |
| 13 | FCFE = NPAT + D&A − CAPEX − ΔWC + ΔDebt | G | value equity directly | ΔDebt = net borrowing adds cash |
| 14 | Equity = EV − Debt + Cash | G | from EV multiples or FCF valuation to equity | sign of cash |
| 15 | PV = Σ CF_i/(1+R)^i, NPV = CF0 + PV | G | every DCF decision | CF0 is negative; Excel's NPV() is a PV() |
| 16 | PI = PV inflows / PV outflows | G | bang for the buck, rationing | 1-based vs 0-based (NPV/outlay); same decision, different ranking |
| 17 | IRR: NPV(IRR) = 0 | M (concept) | return the project earns; accept if IRR > R for conventional flows | multiple IRRs with sign changes; financing-type flows reverse the rule |
| 18 | Crossover = IRR of (A − B) cash flows | M | where NPV rankings switch | subtract year by year including CF0 |
| 19 | Payback = years before + remaining/next flow; discounted version uses PV'd flows | M | quick screens | ignores flows after cutoff |
| 20 | ARR = ROC = avg profit after tax / avg investment, avg investment = (I0 + book value at end)/2 | M | accounting screen | profit, not cash; no TVM |
| 21 | EAV (EAA/EAB/EAC) = NPV ÷ annuity factor(R, N) | M | unequal lives with replacement | annuity factor = (1 − (1+R)^−N)/R from the sheet; sign (cost is negative) |
| 22 | CCR (NPV to infinity) = NPV × (1+R)^N/((1+R)^N − 1) = EAV/R | M | same comparison, infinite horizon | consistent with EAV ranking; LCM method must repeat NPV at each replacement |
| 23 | OCF = EBIT + D − Tax = (S − C)(1−T) + T·D = NI + D = S − C − Tax | M | yearly project cash flow before CAPEX and ΔWC | pick one approach; interest never appears |
| 24 | CCA_1 = m·d·I0 (m = 0.5, 1.0 or 1.5), CCA_t = d·UCC_{t−1}, UCC_t = UCC_{t−1} − CCA_t; DTS_t = CCA_t × T_C | M | year-by-year schedule, UCC before sale | half-year rule only in year 1; the multiplier is on d·I0, not on later years |
| 25 | PV_CCA = (I0 d T_C)/(k+d) × {1, (1+0.5k)/(1+k), (1.5k+1)/(1+k)} − (S_N d T_C)/(k+d) × 1/(1+k)^N | G | lump the whole tax shield into one PV | choose the right first-year factor; subtract the salvage term discounted N years; S_N is the sale price, not UCC; omit the last term if the pool stays open |
| 26 | CF_AT = POD − T×[min(ACB, POD) − UCC] − 50%×T×max(POD − ACB, 0) | G | after-tax cash from selling a depreciated asset | min(ACB, POD) − UCC can be negative (terminal loss = tax refund); capital gain only above ACB and only half taxed |
| 27 | Q_C = FC/(P − v); Q_A = (FC + D)/(P − v); Q_F = (FC + OCF*)/(P − v), OCF* = I0/annuity factor | M | break-even sales levels | with taxes Q_F = {FC + (OCF* − T·D)/(1−T)}/(P−v); order cash < accounting < financial |
| 28 | DOL = 1 + FC/OCF; %ΔOCF = DOL × %ΔQ | M | sensitivity of OCF to volume | DOL changes with Q; at accounting break-even OCF = D |
| 29 | E[R] = μ = (1/N)ΣR_i; σ = √((1/N)Σ(R_i − μ)²) or √((1/(N−1))Σ(R_i − μ)²) | G | population (all stocks in the portfolio) vs sample (five years of one stock) | which denominator; exam questions state which or "sample" |
| 30 | E[R] = Σ p_i R_i; σ² = Σ p_i (R_i − E[R])² | M | states of the economy | probabilities must sum to 1; no N−1 when probabilities are given |
| 31 | E[R_P] = Σ w_k E[R_k] | G | any portfolio, any number of assets | weights by dollar value |
| 32 | σ_P = √(w_A²σ_A² + w_B²σ_B² + 2ρ_AB w_A σ_A w_B σ_B) | G | two risky assets; with a risk-free asset σ_P = w_P σ_P | forgetting the square root; using ρ where cov is given (cov = ρσσ); σ in decimals or % consistently |
| 33 | cov(A,B) = Σ p (R_A − E_A)(R_B − E_B); ρ = cov/(σ_A σ_B) | M | correlation from data | sample version divides by N−1 |
| 34 | Sharpe = tan φ = (E[R_P] − R_F)/σ_P | G | compare CALs; the best CAL is the CML | uses σ, not β |
| 35 | β_i = cov(R_i, R_M)/σ_M² = ρ_iM σ_i/σ_M | M | systematic risk from data; regression slope | denominator is the market variance, not σ_M; β not bounded by ±1 |
| 36 | β_P = Σ w_i β_i (β_F = 0, β_M = 1) | M | target-beta portfolios | weights must sum to 1 including the risk-free weight |
| 37 | E[R_x] = R_f + β_x (E[R_M] − R_f) | G | CAPM / SML | market risk premium vs market return; solve for β, R_f or E[R_M] |
| 38 | Reward-to-risk (E[R_i] − R_f)/β_i equal for all assets; SML slope = E[R_M] − R_f | M | mispricing (alpha), two-asset solves | above SML = undervalued (price rises) |
| 39 | (1 + R_nom) = (1 + R_inf)(1 + R_real) | G (MT1 block) | real returns, real vs nominal discounting | never mix nominal flows with real rates |
| 40 | Annuity, perpetuity, growing perpetuity, EAR/APR | G (MT1 block) | inside every multi-year problem | annuity factor for EAV; perpetuity for no-growth stocks and PVCCA |

Table sheet: annuity factor table and cumulative normal table (use N(x) = 1 − N(−x) for negatives).

## 4. Problem archetypes

Each archetype lists the steps the trainer checks one by one and the errors it diagnoses.

A1 **Holding period and compound return** (`L04 s6-11`, `SM 12-1..3, 12, 13`): (1) r = (P1 + D1)/P0 − 1 per year; (2) multiply (1+R) factors for the ending value; (3) N-th root for R_G; (4) arithmetic mean for comparison. Errors: dividing dividend by P1; averaging instead of compounding; forgetting −1; using N wrong.

A2 **Gordon growth price / required return / dividend yield** (`L04 s21`, `SM 8-1..6, 19, 20`): (1) D1 = D0(1+g) if "just paid"; (2) P0 = D1/(R−g); (3) yield = D1/P0; (4) P_t = P0(1+g)^t. Errors: using D0 instead of D1 (or D1(1+g) when D1 was given); R and g as percentages mixed with decimals; negative g sign; computing P_t with D_t instead of D_{t+1}.

A3 **Non-constant growth valuation** (`S4 s6-13`, `TB 8.1`, `SM 8-13..18, 23, 24, 32`): (1) list the explicit dividends; (2) find the first constant-growth dividend and its date T+1; (3) horizon price P_T = D_{T+1}/(R − g2); (4) discount the dividends and P_T; (5) sum. Errors: horizon price placed one year off (the most common mistake per `TB 8.1`); growing D_T by g1 instead of g2 for D_{T+1}; discounting P_T by T+1 periods; omitting a dividend; using the growing-annuity term with g2.

A4 **Growth from plowback and P/E** (`L04 s23-28`, `PRAC q4`, `SM 8-29`): (1) b = (EPS−DPS)/EPS or 1 − payout; (2) g = b × ROE; (3) D1 = DPS(1+g) or EPS1(1−b); (4) P0 = D1/(R−g); (5) P/E = (1−b)/(R−g). Errors: using payout as b; growing EPS twice; ROE on end-of-year equity; textbook sustainable growth ROE·b/(1−ROE·b) (not the professor's).

A5 **NPVGO** (`L04 s33-34`, `S4 s14-21`): (1) no-growth value EPS1/R; (2) NPVGO = P0 − EPS1/R; (3) interpret sign. Errors: EPS0 in place of EPS1; subtracting in the wrong order.

A6 **Quote-screen reading** (`PRAC q9`, `SM 8-22`): shares = market cap ÷ price; EPS = price ÷ P/E; net income = EPS × shares; dividend = yield × price; implied growth = trailing P/E ÷ forward P/E − 1. Errors: forward vs trailing mix-ups; using bid or ask instead of last.

A7 **Comparables** (`PRAC q1`, `SM 8-11, 12, 25..27`): price = multiple × metric; target price in t years = P/E × EPS_t with EPS_t = EPS0(1+g)^t; EV multiple → equity via Equity = EV − Debt + Cash. Errors: EBITDA multiple applied to equity; forgetting net debt.

A8 **FCF/FCFE and EV** (`L04 s37-43`, Perfect Pizzas): (1) EBIT = EBITDA − D&A; (2) FCF = EBIT(1−T) + D&A − CAPEX − ΔWC; (3) EV = FCF/R (perpetuity) or growing; (4) FCFE = NPAT + D&A − CAPEX − ΔWC + ΔDebt; (5) Equity = FCFE/R; check Equity = EV − Debt + Cash. Errors: subtracting interest in FCF; using NPAT in FCF; adding CAPEX; dropping ΔDebt from FCFE; discounting FCFE at the firm rate.

A9 **ARR and payback** (`L05A s7, s10-11`, `PRAC q10a`, `SM 9-1..6`): ARR = average profit ÷ (I0 + residual)/2; payback from the cumulative table with fractional year. Errors: dividing by I0 instead of the average; using cash flow instead of profit (or the reverse); payback counted after the recovery year; "never" when flows never sum to I0.

A10 **NPV / IRR / PI of a cash-flow list** (`S5 s2-13`, `SM 9-7..11, 15`): discount each flow, sum, add CF0; IRR by calculator CF worksheet; PI = PV/|CF0|. Errors: sign of CF0; counting CF0 as period 1; IRR vs required return comparison direction; PI of 0.98 called "accept".

A11 **Mutually exclusive projects and crossover** (`L05A s34`, `SM 9-12, 13, 17`): NPV each at R, IRR each, difference flows, IRR of difference = crossover, state the ranges. Errors: picking the higher IRR; wrong subtraction order (fine, same rate) but then mis-stating which project wins below/above; PI ranking on different scale.

A12 **Multiple / no IRR** (`L05A s22-24`, `S5 s10-13`, `SM 9-14, 20, 22, 23`): count sign changes; NPV at R decides; financing-type flows reverse the IRR rule. Errors: trusting the calculator's single IRR; accepting because "both IRRs exceed R".

A13 **Unequal lives** (`L05A s37`, `S6 s11-14`, `SM 10-27..31, 44, 45`): (1) PV of costs (after-tax, with PVCCA and salvage) per option; (2) EAC = PV ÷ annuity factor(R, N); or CCR = NPV(1+R)^N/((1+R)^N − 1); or LCM chain; (3) choose the lower cost / higher benefit; (4) optional: rate where equal. Errors: comparing raw NPVs; annuity factor with the wrong N; forgetting that the chain repeats the full NPV at each replacement; sign confusion.

A14 **Five-category after-tax cash flows** (`L05B s10-14`, `PRAC q11`): revenue ×(1−T); expense ×(1−T) as a saving; CAPEX ×1; ΔWC ×1 and reversed later; sunk ×0; CCA ×T; disposal via CF_AT. Errors: taxing CAPEX; taxing ΔWC; counting a sunk study; forgetting NWC recovery.

A15 **Disposal with recapture, terminal loss and capital gain** (`L05B s19-25`, `PRAC q11c`, `SM 10-11`): (1) UCC at sale (schedule or given); (2) recapture = min(ACB, POD) − UCC (negative = terminal loss); (3) capital gain = max(POD − ACB, 0), half taxed; (4) CF_AT = POD − T×recapture − 0.5×T×gain. Errors: taxing the whole POD − UCC at full rate when POD > ACB; forgetting the 50% inclusion; refund sign on a terminal loss; using POD − ACB as recapture.

A16 **CCA schedule and DTS** (`L05B s7-8, 23-25`, `S5 s19-20`, `SM 10-11, 13`): year 1 CCA = m·d·I0; later CCA = d·UCC; DTS = CCA × T; UCC after N years. Errors: applying 0.5 or 1.5 in every year; applying d to the original cost every year (straight line); forgetting to multiply by T.

A17 **PV of the CCA tax shield** (`L05B s16-17, 22`, `S5 s21-23`, `S6 s6, 10`, `SM 10-7..9, 14..16, 21..24`): (1) perpetuity I0 d T/(k + d); (2) first-year factor (1 or (1+0.5k)/(1+k) or (1.5k+1)/(1+k)); (3) salvage term S_N d T/(k+d) discounted N years; (4) subtract. Errors: k + d vs k − d; no first-year factor or the wrong one (0.5 vs 1.5 regime); salvage term not discounted; using UCC instead of S_N; dropping the salvage term when the asset is sold; keeping it when the pool stays open.

A18 **Full project NPV** (`S6 s2-6, 7-10, 16-19`, `L05B s27-31`, `SM 10-7, 8, 14..16, 21, 35, 36, 49`): CF0 = −CAPEX − NWC0 − opportunity cost; yearly (S − C)(1−T); ΔNWC each year; terminal: salvage, NWC recovery, land back; plus PVCCA; NPV. Errors: any of A14-A17 plus discounting the PVCCA again; recovering NWC twice; net acquisition rule ignored in a replacement; counting interest.

A19 **Bid price / required savings / break-even revenue** (`TB 10.6`, `SM 10-23, 24, 33, 43, 48, 50, 52`): (1) PV of the known pieces (CAPEX, NWC, salvage, PVCCA); (2) required annuity = −known PV ÷ annuity factor; (3) un-tax: ÷(1−T); (4) add costs, divide by quantity. Errors: forgetting ÷(1−T); dividing by N instead of the annuity factor; leaving out the CCA shield.

A20 **Sensitivity, scenario and NPV break-even** (`L05C s4-9`, `SM 11-4..6, 17, 19, 26, 27`): base NPV; change one input, recompute, ΔNPV/Δx; best/worst by moving every input the unfavourable way; NPV break-even solves NPV = 0 for one input. Errors: moving costs the wrong direction in the best case; treating scenario changes as linear; profit break-even instead of NPV.

A21 **Break-even quantities and DOL** (`SM 11-1, 7..15, 24, 28, 29`): contribution margin P − v; Q_C, Q_A, Q_F; OCF* = I0/annuity factor; DOL = 1 + FC/OCF; %ΔOCF. Errors: adding D to the cash break-even; using OCF instead of D in Q_A; DOL with FC as (FC + D).

A22 **Real options / decision trees** (`L05C s11-16`, `SM 11-20, 21`, `SM 10-46`): expected value of each branch = Σ p × NPV; choose the max at each decision node; compare today's choices; abandon when continuation value < salvage. Errors: averaging before deciding at a later node; forgetting to subtract the extra up-front cost; discounting NPVs already in present value.

A23 **Expected return and SD from states** (`S7 s4`, `SM 13-5..7, 9, 10, 25, 28, 33`): E[R] = Σ p R; σ² = Σ p (R − E)²; portfolio: compute the portfolio return per state first, then E and σ. Errors: dividing by N−1; using weighted individual σ's for the portfolio (ignoring correlation); % vs decimal squares.

A24 **Historical mean / SD / risk premium** (`SM 12-6..9, 11, 14`): mean; sample variance ÷(N−1) (or population ÷N when told); SD; risk premium = mean − mean T-bill; real via Fisher. Errors: denominator; squaring percentages wrong; subtracting the latest T-bill instead of the average.

A25 **Two-asset portfolio return and SD** (`L06 s21-24, 31`, `S7 s11-13`, `PRAC q8`, `SM 13-11, 12`): weights from dollars; E[R_P] linear; σ_P with 2ρσσww; with a risk-free asset σ_P = w σ. Errors: missing square root; using cov as ρ; ρ = 1 shortcut applied when ρ < 1; weights not summing to 1.

A26 **Covariance, correlation and beta from data** (`S7 s5-6, 14-18`, `SM 13-32`): cov = Σ p (R_i − E_i)(R_M − E_M); ρ = cov/(σ_i σ_M); β = cov/σ_M² = ρ σ_i/σ_M. Errors: dividing by σ_M instead of σ_M²; ρ > 1 (units mix); β with σ_i in the denominator.

A27 **CAPM** (`PRAC q12`, `S7 s17`, `SM 13-15..18, 21, 22, 29`): E[R] = R_f + β(E[R_M] − R_f); rearrange for β, R_f, E[R_M]; market risk premium vs market return; two-asset solve for R_f via equal reward-to-risk. Errors: using the MRP as E[R_M] (or the reverse); β(E[R_M]) + R_f without subtracting R_f; alpha sign.

A28 **Portfolio beta and target-beta construction** (`S7 s19-20`, `SM 13-13, 14, 19, 20, 24, 26, 27`): β_P = Σ w β; solve for the missing weight; risk-free weight = 1 − others (may be negative = borrowing). Errors: forgetting the risk-free asset's zero beta and its weight; dollar vs weight mix.

A29 **Sharpe ratio / CAL / CML** (`L06 s38-44`, `SM 13-31, App A1`): Sharpe = (E[R_P] − R_F)/σ_P; mixing with R_F: E = w_P E[R_P] + (1−w_P)R_F, σ = w_P σ_P; the CML gives E[R_A] − R_f = (σ_A/σ_M)(E[R_M] − R_f) for efficient portfolios. Errors: Sharpe with β; CML applied to an inefficient single stock.

## 5. Conceptual themes the professor tests in words

From the review guide (REV p3) and the practice MCs: explain four differences between debt and equity;
book vs market vs liquidation value and typical P/E and P/B ranges; when to use comparables, DDM, FCFF or
FCFE; how to estimate growth from accounting figures; why young firms plow back more; the three forms of
efficiency, which we want (weak, semi-strong) and which we do not (strong); how an inefficiency makes money
(momentum, delayed reaction); the five decision rules and what is good and bad about each; why NPV is the rule
that serves shareholders; when rationing is needed and why PI then ranks best; the five tax categories of cash
flows with examples; examples of a positive change in working capital (inventory up, receivables up, payables
down, cash up); why the CCA shield is a "shield"; when and why to use sensitivity, scenario and simulation,
and how NPV break-even differs from them; how risk and return are measured and drawn; how the efficient
frontier arises; how the market portfolio is found (tangent CAL); the two risk measures (σ and β); how σ, ρ
and β guide stock selection at each stage of building a portfolio; why providers publish different betas
(index, window, frequency, adjustments). Plus the terminology list on REV p1-2 (every term gets a definition
card in Learn mode).

## 6. Coverage matrix

Recommended problems (12th Canadian edition) and review-guide prompts mapped to the concepts above.

| source | concept(s) |
|---|---|
| Ch 8 Q&P 1 (price today, in 3 and 15 years) | 8.4 Gordon, price grows at g |
| Ch 8 Q&P 4 (price from D1, g, R) | 8.4 Gordon |
| Ch 8 Q&P 5 (R from yields) | 8.4 components of R |
| Ch 8 Q&P 11 (P = P/E × EPS) | 8.3 comparables |
| Ch 8 Q&P 14 (zero dividends then growth) | 8.5 non-constant |
| Ch 8 Q&P 19 (negative growth) | 8.4 Gordon with g < 0 |
| Ch 8 Q&P 23 (two-stage) | 8.5 two-stage |
| Ch 8 Q&P 26 (average P/E target price) | 8.3 comparables |
| Ch 9 CTQ 2, 6, 7 | 9.3 NPV, 9.4 IRR, 9.2/9.5 implications of positive NPV |
| Ch 9 Q&P 1, 4 (payback, discounted payback) | 9.2 |
| Ch 9 Q&P 6 (AAR) | 9.1 |
| Ch 9 Q&P 7, 9 (IRR, NPV at two rates, indifference) | 9.3, 9.4 |
| Ch 9 Q&P 12, 13 (NPV vs IRR, crossover, profiles) | 9.4 ranking, crossover |
| Ch 9 Q&P 15, 16 (PI, PI vs NPV) | 9.5 |
| Ch 9 Q&P 17 (all criteria on two projects) | 9.1-9.5 |
| Ch 10 Q&P 1 (relevant year-0 flows) | 10.1 sunk/opportunity |
| Ch 10 Q&P 3 (pro forma net income) | 10.2 |
| Ch 10 Q&P 6 (EBIT with CCA) | 10.2 |
| Ch 10 Q&P 11 (UCC after 5 years, terminal loss, after-tax salvage) | 10.4, 10.5 |
| Ch 10 Q&P 16 (NPV with PVCCA, NWC) | 10.6 expansion |
| Ch 10 Q&P 22 (IRR of a cost-cutting system with PVCCA) | 10.6 cost-cutting |
| Ch 10 Q&P 34 (press with inventory additions) | 10.6 cost-cutting, 10.3 NWC |
| Ch 10 Q&P 36 (replace an excavator) | 10.6 replacement |
| Ch 11 Q&P 3 (best/worst scenario table) | 11.1 scenario |
| Ch 11 Q&P 4 (sensitivity of NPV to price) | 11.1 sensitivity |
| Ch 11 Q&P 20 (abandonment value) | 11.3 real options |
| Ch 11 Q&P 23 (break-even planes, perpetuity/annuity) | 11.1 NPV break-even |
| Ch 12 Q&P 1, 2, 3 (return, yields, loss case) | 8.1 / 12.2 HPR |
| Ch 12 Q&P 8 (1970-75 averages, SDs, risk premium) | 12.1, 12.2 |
| Ch 12 Q&P 9 (average, variance, SD) | 12.2 |
| Ch 12 Q&P 12 (arithmetic vs geometric) | 8.1 averages |
| Ch 13 Q&P 1, 2 (weights, portfolio return) | 12.3 |
| Ch 13 Q&P 13 (portfolio beta) | 13.2 |
| Ch 13 Q&P 15 (CAPM) | 13.3 |
| Ch 13 Q&P 19 (stock + risk-free: return, beta, weights) | 13.1, 13.2 |
| Ch 13 Q&P 27 (two assets → R_f and E[R_M]) | 13.3 SML solve |
| REV §2 stocks prompts | 8.2, 8.3, 8.6, 8.7, 8.8 |
| REV §3 capital budgeting prompts | 9.1-9.6, 10.1, 10.3, 10.4, 11.1 |
| REV §4 risk and return prompts | 12.1-12.3, 13.1-13.3 |
| PRAC q1-q12 | 8.3, 8.2, 8.8, 8.6, 9.6, 10.3, 12.3, 12.3, 8.2/8.6, 9.1+9.3, 10.1+10.5, 13.3 |
| L04 worked examples (XYZ three-year, growing dividend, growing firm, Perfect Pizzas) | 8.1, 8.4, 8.6, 8.7 |
| L05A worked examples (ARR plant, payback 3.4 years, unequal lives −11.5238M vs −10.8571M, 26.27%) | 9.1, 9.2, 9.7 |
| L05B worked examples (CCA $7,500 asset sold year 5, NPV at year 5 of selling, Clean Air) | 10.4, 10.5, 10.6 |
| L05C worked examples (NPV break-even plant, freeway bridges) | 11.1, 11.3 |
| S5, S6 worked examples (165k project, CCA shield 28,107.72, tractor plant 37.66, Dickerson −2,075, Civil/Chevalier EAC, simple replacement 47,867.15) | 9.3-9.5, 10.4-10.7 |
| S7 worked examples (assets A-E, cov/ρ/β of B, portfolio 75/25, twice-the-market beta) | 12.2, 12.3, 13.2, 13.3 |

Every concept in §2 appears in at least one row above; nothing in the outline's chapter list is unmapped.

## 7. Exam weight per concept group

Weights combine the outline's time allocation (Ch 8: one week; Ch 9 + 10.7: one week; Ch 10, 11, 12, 13: one
lecture each), the review guide's emphasis (the terminology list is ~45% capital-budgeting terms, ~30% stocks,
~25% risk and return) and the sample exam's mark split (40/40/20). Used by the trainer to size question
volume, default drill order and the exam simulator.

| group | weight | why |
|---|---|---|
| 8.4-8.6 DDM, non-constant growth, plowback growth, NPVGO | 14% | two sample MCs plus the stock numeric question; every review prompt in §2 touches it |
| 8.1-8.3, 8.7 returns, vocabulary, comparables, FCF | 12% | three sample MCs (comparables, liquidation value, quote screen) |
| 8.8 market efficiency | 5% | one sample MC, four review prompts |
| 9.1-9.5 decision rules (ARR, payback, NPV, IRR, PI) | 14% | sample numeric Q10; "five rules, what is good and bad about each" |
| 9.6-9.7 rationing, project relationships, unequal lives | 6% | sample MC on rationing; EAV worked in lecture and seminar |
| 10.1-10.3 relevant flows, five categories, OCF, NWC | 10% | sample MC (NWC) and numeric Q11 (a, b) |
| 10.4-10.5 CCA, PVCCA, disposal | 12% | numeric Q11(c); the densest part of the terminology list (ACB, POD, UCC, CCR, DTS, AII, half-year) |
| 10.6-10.7 full NPV assembly, EAC with taxes | 6% | seminar 6 entirely; long numeric questions |
| 11.1 sensitivity/scenario/simulation/NPV break-even | 5% | two review prompts |
| 11.2 break-even quantities, DOL | 2% | textbook only; recommended problems touch it lightly |
| 11.3 real options | 3% | lecture 05C second half; terminology list |
| 12.1-12.2 risk premiums, measuring risk and return, diagrams, frontier | 5% | review prompts; sample MC on diversification |
| 12.3 two-stock portfolios, correlation, diversification | 5% | sample MC Q8; seminar 7 |
| 13.1 CAL, Sharpe, CML, market portfolio | 3% | review prompts "how do we find the market portfolio" |
| 13.2-13.3 systematic risk, beta, CAPM, SML | 8% | sample Q12; "two measures of risk", "different betas" |

Totals: stocks 31%, capital budgeting 48% (including project analysis), risk and return 21%.
