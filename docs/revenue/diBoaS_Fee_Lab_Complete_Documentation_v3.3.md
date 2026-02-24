# diBoaS Fee Lab — Complete Documentation

**Version:** 3.3
**Date:** February 19, 2026
**Author:** Fee Lab Working Session (consolidated across 9 external audits, competitive research, and 10 governance board inputs)
**Status:** Final — Canonical Edition
**Companion Files:** `diboas-fee-lab-v3.3.jsx`, `FEE_LAB_AUDIT_GUIDE_v2.3.md`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [What Is diBoaS](#2-what-is-diboas)
3. [Problems It Solves](#3-problems-it-solves)
4. [Solutions It Brings](#4-solutions-it-brings)
5. [Target Audience](#5-target-audience)
6. [Value Proposition](#6-value-proposition)
7. [Competitive Advantages](#7-competitive-advantages)
8. [Known Weaknesses](#8-known-weaknesses)
9. [Current Revenue Model (Phase 1)](#9-current-revenue-model-phase-1)
10. [Investment Needed & Break-Even](#10-investment-needed--break-even)
11. [Route to Profitability](#11-route-to-profitability)
12. [Fee Lab Deep Dive — How It Works](#12-fee-lab-deep-dive--how-it-works)
13. [Calculation Methodology](#13-calculation-methodology)
14. [Scenario Analysis & Simulations](#14-scenario-analysis--simulations)
15. [Competitive Benchmarking](#15-competitive-benchmarking)
16. [Sensitivity Analysis](#16-sensitivity-analysis)
17. [Feature Revenue Timeline (Phase 2+)](#17-feature-revenue-timeline-phase-2)
18. [Combined Revenue Projection](#18-combined-revenue-projection)
19. [Model Limitations & Disclaimers](#19-model-limitations--disclaimers)

---

## 1. Executive Summary

diBoaS (digital Banking on a Solana) is a OneFi (One Finance) platform that unifies traditional banking, investment management, and decentralized finance (DeFi) in a single non-custodial interface. The platform targets underserved populations — starting with low-middle class users who have a smartphone and savings — and provides access to institutional-grade financial tools with transparent pricing and accessible minimums ($5/€5/R$10).

The Fee Lab is a simulation engine built to answer two questions: **"Is diBoaS fair for users?"** and **"Is diBoaS sustainable as a business?"** It models the platform's entire 9-step transaction lifecycle across 4 user personas, 3 growth scenarios, 60 months of churn-adjusted projections, and a 14-stream feature revenue timeline activating from Month 3 through Month 18.

**Key findings from the Fee Lab simulation:**

The diBoaS fee structure uses three tiers: ramp fees at 0.48% for money entry/exit, execution fees at 0.39% with a $0.25 floor and $25 cap for buy/sell/close operations, and free for internal movements like sends, swaps, bridges, and strategy entry. This structure is 2–5× cheaper than mainstream retail interfaces including Coinbase at 2.0%, MetaMask at 0.875%, and Revolut at 1.49%.

Churn, funded conversion rate, and DCA activation are the three nuclear levers for sustainability — fee optimization is second-order. Phase 2 revenue streams begin at Month 6 with B2B treasury, scaling through subscriptions (Month 9), enterprise analytics (Month 12), creator economy (Month 15), and marketplace (Month 18), diversifying beyond transaction fees.

---

## 2. What Is diBoaS

diBoaS is a non-custodial orchestration interface that lets everyday people access crypto payments and DeFi through a Web2-simple UX, without ever touching their funds, holding their keys, or hiding any fees.

**One-liner:** "diBoaS lets you add money, send it anywhere, grow it through DeFi strategies, and take it back — all with fees under 1% and no banks in the middle."

**Core pillars:**

Banking lets users add, send, and withdraw money globally in real-time with no borders. Investing provides buy/sell crypto and tokenized assets from one screen. DeFi Strategies offers 10 pre-built, risk-labeled, battle-tested yield strategies across 6 protocols (Sky SSR, Jupiter JLP, Jito, Ethena, Morpho, Aave/Compound). Adelaide Intelligence delivers AI-powered market newsletters named after the founder's grandmother, with personalized financial guidance across 5 personas and 4 languages.

**Five non-negotiable principles:**

1. Never retain funds (all assets stay in user's non-custodial wallet)
2. Never touch fiat (on/off-ramps handled by licensed partners)
3. Never access keys (MPC wallet via Privy — platform never sees full key)
4. Never auto-sign (user explicitly approves every transaction)
5. Never hide fees (full breakdown shown before every action)

---

## 3. Problems It Solves

**Information asymmetry:** Institutions know about market-moving events hours or days before retail investors. diBoaS's analytics pipeline (35+ triggers, 11 event classes, regime detection) closes that gap through Adelaide.

**Product fragmentation:** To do what diBoaS offers, a user currently needs 3–5 separate apps — a bank account, a crypto exchange, a DeFi wallet, a portfolio tracker, and a news aggregator. Each has different logins, fee structures, and UX patterns.

**Fee opacity:** Most platforms stack fees invisibly — app fee + router fee + bridge fee + spread markup. Users pay 2–5% without understanding what they paid for. diBoaS shows a 5-tier fee breakdown before every action: platform fee, provider fee, network fee, compliance fee, premium fee.

**DeFi complexity:** Accessing DeFi yields (4–18% APY) requires 15+ manual steps: choosing protocols, managing gas, monitoring health factors, harvesting rewards, rebalancing. diBoaS automates this into "start/stop a strategy" with one signature.

**Custodial lock-in:** Most "easy" platforms (Coinbase, Revolut, Nubank) are custodial — they hold user keys and can freeze funds. Non-custodial alternatives (MetaMask, Phantom) give control but require expertise. diBoaS delivers non-custodial simplicity.

---

## 4. Solutions It Brings

**Unified interface:** Banking + investing + DeFi in one app. Users see "Cash" (aggregated stablecoin balance) and "Portfolio" (all non-stablecoin tokens), never wallets or chains.

**Intent-based routing:** User says "Send $100 to Maria." Backend determines source wallet, destination, cheapest route (via LI.FI), and total fee. User sees one confirmation screen, one signature.

**Goal-driven strategies:** 10 strategies from Safe Harbor (0% crypto, very low risk) to Full Throttle (85%+ crypto, very high risk), each Monte Carlo validated and battle-tested against 5 historical market disasters (Luna crash, FTX collapse, SVB bank run, COVID flash crash, USDC depeg).

**Adelaide AI newsletter:** 52 outputs per run across 6 channels (Website, Telegram, WhatsApp, X, LinkedIn, Substack) in 4 locales (EN, PT-BR, DE, ES), personalized for 5 personas (Ana conservative, Maria balanced, Felipe aggressive, Yield Hunter DeFi-native, B2B Client institutional).

**Exit with Dignity:** No lock-ups, no exit penalties, no withdrawal friction. 0.48% off-ramp fee is disclosed upfront and is lower than most alternatives.

---

## 5. Target Audience

**Primary:** Low-to-middle class individuals with a smartphone and savings who are currently locked out of sophisticated financial tools due to high minimums, complex jargon, or opaque fee structures.

**The Grandmother Test:** Every feature must pass — "Would I be comfortable if my grandmother Adelaide used this, knowing who else has access to the same information?"

**Geographic priority:**

1. **Brazil** — Cultural alignment, WhatsApp distribution, stablecoin focus, underserved market, Pix integration
2. **US/English** — Scale market, DeFi adoption, regulatory complexity accepted
3. **EU (German/Spanish)** — MiCA-compliant framework, SEPA integration

**Minimum investments:** $5 (US), €5 (EU), R$10 (Brazil)

**4 user personas modeled in the Fee Lab:**

| Persona | Profile | % of User Base | Monthly Activity |
|---------|---------|---------------|-----------------|
| 🌱 Small DCA | $50 weekly DCA, barely swaps, no strategies | 35% | $200–300 in volume |
| 📊 Active Investor | $100–300 DCA, regular swaps, some yield | 40% | $1,000–2,000 in volume |
| ⚡ Power User | Heavy DCA, cross-chain, active strategies | 20% | $3,000–5,000 in volume |
| 🐋 Whale | Large positions, infrequent but high-value | 5% | $10,000+ in volume |

---

## 6. Value Proposition

**For B2C users:**

Access to DeFi yields (4–18% APY) without DeFi complexity. Send money globally with fees under 1% (vs bank wire $25–50). Non-custodial control (users own their keys, can export anytime). Transparent fee breakdown before every action. AI-powered market intelligence in plain language (Adelaide). Minimum $5 to start (vs $10,000+ for traditional wealth management).

**For B2B users:**

Treasury management with DeFi yield strategies. Cashflow optimization — invest the 2–5% previously lost to payment gateway fees into emergency funds via automated goal strategies. Aggregated market intelligence (without retail-sensitive data like estate wallet movements). White-label Adelaide for institutional reporting.

---

## 7. Competitive Advantages

### 7.1 Fee advantage vs retail interfaces

Based on competitive research across 18 platforms in US, EU, and Brazil markets (February 2026):

| Platform | Category | Typical Buy Fee | vs diBoaS 0.39% |
|----------|----------|----------------|-----------------|
| Coinbase (retail) | CEX | 2.00% | 5.1× cheaper |
| Revolut | Fintech | 1.49% | 3.8× cheaper |
| MetaMask Swaps | Wallet | 0.875% | 2.2× cheaper |
| Phantom (est.) | Wallet | 0.85% | 2.2× cheaper |
| PayPal crypto | Fintech | 1.50–2.20% | 3.8–5.6× cheaper |
| Nubank crypto | Fintech | 1.19–1.49% (spread) | 3.1–3.8× cheaper |
| Mercado Bitcoin | Exchange (BR) | 0.50–0.70% | 1.3–1.8× cheaper |
| Cash App | Fintech | 1.50–2.50% | 3.8–6.4× cheaper |
| Strike | Bitcoin-only | 0% (BTC DCA only) | They win on BTC |
| Crypto.com | CEX | 0.075% (Advanced) | They win on spot |
| Binance | CEX | 0.10% (spot) | They win on spot |

### 7.2 Non-custodial autopilot positioning

No single platform currently delivers DCA + strategy management + cross-chain + non-custodial in one coherent flow. CEXs have the automation but lock your keys. DeFi wallets give self-custody but require manual babysitting. diBoaS's wedge is the intersection.

### 7.3 Fee hygiene

The routing-enforced "one fee budget" rule prevents accidental fee stacking (app fee + router fee + bridge fee). The budget subtraction formula ensures total platform capture never exceeds the stated execution fee regardless of route complexity. Four of nine steps are completely free (Send, Swap, Bridge, Start Strategy), reducing friction on the actions users perform most frequently inside the app.

### 7.4 Adelaide moat

No competitor offers persona-based, multi-language, compliance-validated market intelligence as a retention tool. Adelaide's 52-output matrix across 6 channels creates a switching cost once users integrate it into their routine.

---

## 8. Known Weaknesses

### 8.1 Cannot beat CEX order-book fees

Binance (0.10%) and Crypto.com Advanced (0.075%) will always be cheaper on raw spot trading. diBoaS does not compete on execution price — it competes on automation, abstraction, and non-custodial convenience.

### 8.2 Floor distortion on small tickets

The $0.25 fee floor means effective rates increase on small DCA purchases. On a $25 DCA, the floor-enforced fee of $0.25 gives an effective rate of 1.00%. On a $50 DCA it's 0.50%, and on a $75 DCA it's 0.33%. The floor breakpoint for 0.39% execution fee is $64.10 — below this, the floor applies. This is mitigated by the Buy Batching feature which groups small DCA buys into larger executions.

### 8.3 Zero-fee DEX interfaces exist

Trust Wallet, Uniswap frontend, and Jupiter charge 0% interface fee. Power users who route directly to DEX aggregators will always pay less on execution. diBoaS's response: "We remove 45 minutes of DeFi babysitting."

### 8.4 Middleware routing margin compression

When transactions route through fee-charging middleware (LI.FI, bridges), diBoaS's capture drops. At 85% direct routes with 25 bps middleware cost, blended capture is approximately 35 bps. If middleware share drifts to 60%, capture drops further. This needs ongoing monitoring. Current middleware bps assumption (25) may be conservative — 2026 bridges trend toward 35–45 bps.

### 8.5 Free steps reduce direct revenue

Four of nine steps are free (Send, Swap, Bridge, Start). While this drives user engagement and reduces friction, it means revenue concentrates on five steps. The fee structure bets that retention and volume benefits of free internal operations outweigh the lost per-transaction revenue.

### 8.6 No track record

New platform with no user history. Trust must be built through transparency, Adelaide quality, and community growth.

---

## 9. Current Revenue Model (Phase 1)

### 9.1 Canonical Fee Structure (Confirmed — CEO, February 2026)

| Step | Action | Fee Rate | Fee Type | Floor/Cap |
|------|--------|----------|----------|-----------|
| 1 | Add (on-ramp) | 0.48% | Ramp | No floor/cap |
| 2 | Send (P2P) | FREE | Free | — |
| 3 | Withdraw (off-ramp) | 0.48% | Ramp | No floor/cap |
| 4 | Buy (DCA/DEX) | 0.39% | Exec | $0.25 floor / $25 cap |
| 5 | Sell (DEX) | 0.39% | Exec | $0.25 floor / $25 cap |
| 6 | Swap (Token→Token) | FREE | Free | — |
| 7 | Bridge (Cross-Chain) | FREE | Free | — |
| 8 | Start Strategy | FREE | Free | — |
| 9 | Stop Strategy | 0.39% | Exec | $0.25 floor / $25 cap |

**Design philosophy:** Charge on money entry/exit (ramp) and buy/sell/close (exec). Make everything inside the platform free — send money, swap tokens, bridge chains, enter strategies. This incentivizes users to keep assets within diBoaS and removes friction from the highest-frequency internal actions.

### 9.2 Fee Mechanics

**Ramp fee (0.48%):** Applied to on-ramp (Step 1: Add) and off-ramp (Step 3: Withdraw). No floor or cap. This is the diBoaS platform fee; on-ramp partner costs (Onramper/Transak) are operational expenses handled separately and not modeled in this simulation.

**Execution fee (0.39%):** Applied to Buy (Step 4), Sell (Step 5), and Stop Strategy (Step 9). Subject to $0.25 floor and $25 cap. When transactions route through fee-charging middleware, the platform fee is reduced by the middleware cost (budget subtraction), ensuring the user never pays more than 0.39% in platform + middleware combined.

**Free steps:** Send (P2P), Swap, Bridge, Start Strategy generate no platform fee revenue. Network gas fees still apply but are minimal on Solana.

**Fee floor ($0.25/tx):** Minimum fee per exec transaction regardless of ticket size. Floor breakpoint: $64.10 (below this, floor applies and effective rate exceeds 0.39%).

**Fee cap ($25/tx):** Maximum fee per exec transaction. Cap breakpoint: $6,410.26 (above this, cap applies and effective rate drops below 0.39%).

### 9.3 Revenue Streams (Phase 1)

1. **Transaction fees:** Primary revenue from the 5 monetized steps (Add, Withdraw, Buy, Sell, Stop)
2. **Yield performance fee:** 10% of earned yield on DeFi strategies
3. **On-ramp fee:** 0.48% platform fee on deposit flows (Onramper partner costs are separate operational expenses, not modeled)

### 9.4 Five-Tier Fee Transparency

Every transaction shows a complete breakdown:

1. **Platform Fee** — diBoaS revenue
2. **Provider Fee** — Pass-through (Stripe, exchange, Onramper)
3. **Network Fee** — Pass-through (gas costs)
4. **Compliance Fee** — Regulatory costs (KYC/AML for large transactions)
5. **Premium Fee** — Subscription features (Phase 2)

---

## 10. Investment Needed & Break-Even

### 10.1 Scenario Results (from Fee Lab simulation)

Results will vary based on the fee structure and feature timeline toggle. The following are indicative ranges produced by the Fee Lab simulation at default parameters:

| Metric | Conservative | Base | Bull |
|--------|-------------|------|------|
| Starting MAU | 800 | 800 | 800 |
| Monthly churn | 12% | 8% | 5% |
| Acquisition growth (MoM) | 10% | 12% | 18% |
| Funded conversion rate | 40% | 55% | 65% |
| Monthly burn | $56,000 | $56,000 | $56,000 |

Note: Break-even month and peak loss depend significantly on whether the feature timeline is enabled. With features enabled, subscription and B2B revenue accelerate profitability materially starting at Month 9.

### 10.2 Fixed Cost Structure

| Category | Monthly Cost | Notes |
|----------|-------------|-------|
| Monthly burn (team, ops) | $56,000 | Core operating expense |
| RPC/Cloud infrastructure | $500 | Fixed |
| Wallet provider (Privy) | $0–$1,500 | Tiered by MAU bracket |
| 0x/routing plan | $0–$1,000 | Free tier initially |
| **Total fixed costs** | ~$57,000–$59,000 | |

### 10.3 Variable Cost Structure

| Category | Unit Cost | Notes |
|----------|----------|-------|
| Wallet signatures | $0.01/sig | Per transaction signature on-chain (cost = freq × sigs × $0.01 per attached user) |

Note: Per-user variable overhead (support, ops, abuse prevention, estimated ~$0.25/user/month) is not modeled in the current simulation. See §19.1 Limitations.

---

## 11. Route to Profitability

The path to profitability depends on three nuclear levers (not fee optimization):

**Lever 1 — Churn reduction:** Moving churn from 8% to 5% dramatically improves the long-term MAU trajectory and pushes break-even significantly earlier. Every 1% reduction in churn is worth more than any fee parameter change.

**Lever 2 — Funded conversion:** Moving funded rate from 55% to 65% directly multiplies all revenue. This is primarily a product/UX challenge — how quickly users deposit their first dollars after signing up.

**Lever 3 — DCA activation:** DCA (Buy) is the highest-frequency, highest-retention step. Users who set up auto-DCA churn at significantly lower rates and generate recurring fee revenue. Ship auto-DCA as the first product feature.

**Why fee optimization is second-order:** The compounding effect of retained users dominates fee margin improvements. The free-step design (Send, Swap, Bridge, Start) deliberately sacrifices per-transaction revenue to maximize engagement and reduce churn.

---

## 12. Fee Lab Deep Dive — How It Works

### 12.1 Architecture

The Fee Lab is a single-file React simulation engine that runs entirely in the browser with no external data dependencies. It consists of three layers:

**Layer 1 — The Verdict (always visible, top of page):**

Two hero cards answering the core questions. Card 1 ("Is diBoaS Fair for Users?") shows 4 persona columns with monthly cost, effective rate, verdict emoji (✅ ≤0.35%, ⚠️ ≤0.50%, 🚨 >0.50%), canonical fee structure summary, and competitor comparison multipliers. Card 2 ("Is diBoaS Sustainable?") shows break-even month, peak cumulative loss, blended RPU, monthly P&L sparkline, feature timeline indicator, and sensitivity ranges.

**Layer 2 — The Knobs (interactive parameter controls):**

Controls for fee floor/cap, direct route share %, middleware fee bps, Buy Batching toggle, feature timeline toggle, 5 growth parameters, and 3 scenario presets. Per-step fee rates are fixed at canonical values (not adjustable) to prevent drift from approved structure.

**Layer 3 — Deep Dives (6 tabs):**

1. **Fairness Lab** — Persona cards with editable transaction patterns, dual-view (user cost vs platform revenue)
2. **Per-Tx Fees** — Revenue breakdown per transaction step including per-step rates and blended middleware column
3. **9-Step Revenue** — Complete lifecycle economics for any selected month with feature revenue breakdown
4. **P&L Chart** — Monthly and cumulative cash flow visualization
5. **Full Table** — Month-by-month financial detail including B2B client count and feature revenue column
6. **Feature Timeline** — 14 revenue streams across 6 milestones with activation details

### 12.2 The 9-Step Transaction Lifecycle

Every funded user's monthly activity is modeled across 9 distinct transaction steps. Each step has a fixed fee rate (per canonical structure), default frequency, average ticket size, and wallet signature count.

| Step | Action | Default Freq | Default Avg | Fee Type | Rate | Sigs |
|------|--------|-------------|-------------|----------|------|------|
| 1 | Add (on-ramp) | 1.2/mo | $350 | Ramp | 0.48% | 0 |
| 2 | Send (P2P) | 0.3/mo | $200 | Free | 0% | 1 |
| 3 | Withdraw (off-ramp) | 0.2/mo | $500 | Ramp | 0.48% | 0 |
| 4 | Buy (DCA) | 4.0/mo | $75 | Exec | 0.39% | 2.5 |
| 5 | Sell | 0.5/mo | $200 | Exec | 0.39% | 2.5 |
| 6 | Swap | 1.2/mo | $300 | Free | 0% | 2.5 |
| 7 | Bridge | 0.4/mo | $400 | Free | 0% | 3 |
| 8 | Start Strategy | 0.4/mo | $500 | Free | 0% | 4 |
| 9 | Stop Strategy | 0.15/mo | $400 | Exec | 0.39% | 3 |

### 12.3 Dual Economics Tracking

The Fee Lab tracks two parallel views for every calculation:

**User Pays:** The full fee the user is charged based on the step's canonical rate. For exec steps, subject to floor/cap.

**Platform Earns:** The blended revenue after middleware routing adjustments. When transactions route through fee-charging middleware, the user still pays the same rate, but diBoaS captures less. The "capture rate" = Platform Earns / User Pays.

---

## 13. Calculation Methodology

### 13.1 Fee Calculation Formula (per transaction)

**Ramp steps (Add, Withdraw):**
```
fee = ticket × 0.0048
```
No floor or cap applied. Simple percentage.

**Exec steps (Buy, Sell, Stop):**
```
fee = clamp(ticket × 0.0039, floor, cap)
```
Where floor = $0.25, cap = $25.00.

**Free steps (Send, Swap, Bridge, Start):**
```
fee = 0
```

### 13.2 Blended Route Revenue

For exec steps, middleware routing reduces platform capture:
```
fullFee = clamp(ticket × (feePct / 100), floor, cap)         — what user pays
mwCapturePct = max(0, feePct - middlewareBps/100)
mwRaw = ticket × (mwCapturePct / 100)
mwFee = min(mwRaw, fullFee)                                   — platform capture (no floor)
blended = directShare × fullFee + (1 - directShare) × mwFee
```

**Key design decision (v3.3):** Platform capture on middleware-routed transactions has **no floor**. The $0.25 floor applies to the user-facing fee only (via `fullFee`). If middleware consumes the entire fee budget (`mwCapturePct → 0`), platform capture on routed transactions drops to $0. This ensures the model does not overstate revenue at high middleware rates.

**Unit convention:** `directShare` in the formula above is a **fraction** (0.85), not a percentage (85). The UI stores 85 (percent) and the engine converts via `ds = directShare / 100`. Similarly, `feePct` is stored as 0.48/0.39 (percentage) and converted via `feePct / 100` for multiplication.

At defaults (85% direct, 25 bps middleware): blended exec capture is approximately 35–36 bps per transaction.

Ramp steps are not affected by middleware routing (ramp partners handle routing separately). Free steps generate no revenue regardless of routing.

### 13.3 DCA Buy Batching

When enabled, for **Buy steps only** where the average ticket is below the floor breakpoint ($64.10 at 0.39%), the system batches multiple small transactions. Batching does not apply to Sell or Stop steps, since their typical ticket sizes are well above the floor breakpoint at default persona values.

Example: 4× weekly $25 DCA → 1× weekly $100 execution. User effective rate drops from 1.00% ($0.25 floor on $25) to 0.39% ($0.39 on $100). Platform captures $0.39 instead of 4× $0.25 = $1.00 (less revenue per batch, but significantly better user perception and retention).

### 13.4 Growth Model

```
MAU_app(t) = MAU_app(t-1) × (1 - churnRate) + newUsers(t)
newUsers(t) = newUsers(t-1) × (1 + acquisitionGrowth)
MAU_funded(t) = MAU_app(t) × fundedRate
```

Churn reduces net growth relative to pure exponential, but the model does not plateau — newUsers itself compounds at the acquisition growth rate, so MAU continues growing as long as new user acquisition outpaces churn losses. At base defaults (8% churn, 12% growth, 800 starting MAU), Month 60 MAU reaches into the hundreds of thousands. This aggressive growth trajectory should be tempered with the understanding that sustained 12% MoM acquisition growth requires significant marketing investment (not modeled as an explicit cost — see Limitations section).

### 13.5 Revenue Calculation (per month)

```
For each step s:
  engaged_users(s) = MAU_funded × attachRate(s)
  step_revenue(s) = engaged_users(s) × frequency(s) × blended_fee(s)

Transaction Revenue = Σ step_revenue(s)
Yield Revenue = strategy_users × (AUM × APY / 12) × performanceFee
Feature Revenue = featureRevenue(month, MAU_app, MAU_funded)
Total Revenue = Transaction Revenue + Yield Revenue + Feature Revenue
```

Feature revenue activates at specific months per the timeline (see Section 17).

### 13.6 Cost Calculation (per month)

```
Fixed Costs = burn + walletTierCost(MAU_app) + infraCost + routingPlanCost

Where walletTierCost:
  MAU ≤ 1,000   → $0 (free tier)
  MAU ≤ 5,000   → $250/mo
  MAU ≤ 25,000  → $500/mo
  MAU > 25,000  → $1,500/mo

Variable Costs = Σ (engaged_users(s) × freq(s) × sigs(s) × sigCost)
  sigCost = $0.01 per signature
  Note: freq × sigs gives total monthly signatures per user per step

Total Cost = Fixed Costs + Variable Costs
Monthly Profit = Total Revenue - Total Cost
Cumulative P&L = running sum of Monthly Profit
```

### 13.7 Break-Even Determination

Break-even month = first month where Monthly Profit ≥ 0. Peak cumulative loss = minimum value of Cumulative P&L across all months (represents total seed capital needed).

### 13.8 Fee-Bearing Actives Calculation

```
feeBearing = MAU_funded × (1 - Π(1 - attachRate(s)) for all monetized steps s)
```

This uses union probability to count unique users who performed at least one fee-bearing action, avoiding double-counting. Only steps with feeType "ramp" or "exec" are included (5 of 9 steps). This assumes independence among step attach rates; in practice, Buy and Sell actions are correlated (users who buy are more likely to sell), so the estimate may slightly overstate unique fee-bearing users.

### 13.9 Revenue Per User (RPU)

```
RPU = Total Revenue / MAU_funded
```

This is the key sustainability metric — revenue per funded user per month (including transaction fees, yield fees, and feature revenue when enabled).

---

## 14. Scenario Analysis & Simulations

### 14.1 Scenario Configurations

| Parameter | Conservative | Base | Bull |
|-----------|-------------|------|------|
| Monthly churn | 12% | 8% | 5% |
| Acquisition growth (MoM) | 10% | 12% | 18% |
| Funded conversion | 40% | 55% | 65% |
| Burn | $56,000 | $56,000 | $56,000 |

### 14.2 Attach Rates by Scenario

| Step | Conservative | Base | Bull |
|------|-------------|------|------|
| Add (on-ramp) | 45% | 60% | 80% |
| Send (P2P) | 10% | 20% | 30% |
| Withdraw (off-ramp) | 5% | 12% | 18% |
| Buy (DCA) | 40% | 65% | 75% |
| Sell | 15% | 30% | 40% |
| Swap | 15% | 35% | 50% |
| Bridge | 5% | 15% | 25% |
| Start Strategy | 8% | 20% | 30% |
| Stop Strategy | 4% | 10% | 15% |

### 14.3 Persona Default Configurations

| Step | 🌱 Small DCA | 📊 Active | ⚡ Power | 🐋 Whale |
|------|-------------|-----------|---------|---------|
| Add freq/avg | 1 / $100 | 1.5 / $350 | 2 / $800 | 1 / $5,000 |
| Send freq/avg | 0.2 / $30 | 0.5 / $200 | 1 / $500 | 0.5 / $3,000 |
| Withdraw freq/avg | 0 / $0 | 0.2 / $400 | 0.5 / $1,000 | 0.5 / $8,000 |
| Buy freq/avg | 4 / $50 | 4 / $100 | 8 / $200 | 2 / $5,000 |
| Sell freq/avg | 0.2 / $80 | 0.5 / $250 | 1 / $500 | 1 / $5,000 |
| Swap freq/avg | 0.3 / $60 | 2 / $300 | 3 / $600 | 1 / $10,000 |
| Bridge freq/avg | 0 / $0 | 0.3 / $300 | 1 / $800 | 0.5 / $5,000 |
| Start freq/avg | 0 / $0 | 0.3 / $500 | 1 / $1,500 | 0.5 / $10,000 |
| Stop freq/avg | 0 / $0 | 0.1 / $400 | 0.3 / $1,000 | 0.2 / $8,000 |
| **Mix %** | **35%** | **40%** | **20%** | **5%** |

---

## 15. Competitive Benchmarking

### 15.1 Rate Comparison by Category

**vs Retail Fintech (non-custodial comparison):**
diBoaS's 0.39% exec fee is 2–5× cheaper than Coinbase (2.0%), Revolut (1.49%), PayPal (1.5–2.2%), and Cash App (1.5–2.5%) for simple crypto buys.

**vs Crypto Wallets:**
diBoaS is cheaper than MetaMask (0.875%) and Phantom (est. 0.85%). The gap is meaningful for frequent users — an Active Investor saving 0.5% per trade on monthly volume of $1,500 keeps $90/year in additional returns.

**vs CEX Order Books:**
Binance (0.10%) and Crypto.com Advanced (0.075%) are cheaper on raw spot execution. diBoaS does not compete on this axis — order-book users are not the target audience.

**vs Bitcoin-Only Platforms:**
Strike offers 0% Bitcoin DCA — cheaper than diBoaS for BTC-only users. River is similar. diBoaS's advantage is multi-asset support and DeFi automation.

**vs Emerging Competitors:**
Backpack (Solana exchange/wallet), Argent (L2 wallet with DeFi on zkSync), and Phantom DCA are adding similar features. However, none currently offer the combined DCA + strategies + cross-chain + non-custodial + personalized intelligence that diBoaS provides.

### 15.2 Note on Benchmark Methodology

Competitor rates use retail/simple-buy interfaces, not professional trading or order-book tiers. Revolut rates are for Standard plan (lower rates available on Metal plan but require monthly subscription). Phantom 0.85% is estimated from third-party documentation and analysis, not from an official Phantom fee schedule — this rate should be treated as approximate and may change. All competitor rates are snapshots as of February 2026 and may have changed since publication; see Audit Guide for sourcing methodology.

---

## 16. Sensitivity Analysis

The Fee Lab tests sensitivity across three primary levers, each shifted ±3% or ±10–15 percentage points from the base value:

### 16.1 Churn Rate (±3%)

Churn is the single most impactful lever. At base scenario (8% churn), reducing to 5% dramatically accelerates break-even. Increasing to 11% significantly delays it or pushes it beyond the 60-month window.

### 16.2 Direct Route Share (±15%)

Moving from 85% to 100% direct routing improves per-transaction margin by eliminating middleware cost on all routes. Moving to 70% direct reduces margin on exec steps by approximately 15%, delaying break-even.

### 16.3 Funded Conversion Rate (±10%)

Higher funded conversion (65%) multiplies all revenue streams proportionally. Lower funded conversion (45%) means more users consuming wallet provider costs without generating revenue.

### 16.4 Key Insight

Churn > funded conversion > route share in terms of break-even sensitivity. Fee parameter changes (floor, cap) are third-order effects compared to these levers.

---

## 17. Feature Revenue Timeline (Phase 2+)

v3 introduces a feature revenue engine that activates 14 revenue streams across 6 milestones. Each stream turns on at a specific month and scales with the user base.

### 17.1 Month 3 — B2B Sends

B2B sends go live. These are free (same as personal sends) — no direct revenue impact, but establishes B2B user engagement as a pipeline for later monetization.

### 17.2 Month 6 — B2B Treasury & Cashflow

**B2B Treasury Management:** Business clients deploy treasury into curated DeFi strategies. Free entry (Start Strategy = free), 0.39% exit fee (Stop Strategy rate). B2B clients modeled at 1.5% of total MAU. Note: this is an optimistic estimate for early months given enterprise sales cycles; a conservative range would be 0.5–1% initially, scaling to 1.5% as product-market fit is validated.

**B2B Cashflow / Goal Strategy:** Businesses invest 2–5% previously lost to payment gateway fees into automated emergency fund strategies. Same fee structure as B2B Treasury (free entry, 0.39% exit).

### 17.3 Month 9 — Subscriptions & USDT/Tron

**Pro Subscription (B2C):** $8.59/mo (€7.99 at ~1.075 EUR/USD). Includes Adelaide Premium (advanced analytics, priority support, additional personas). Conversion: 6% of funded users.

**Pro Subscription (B2B):** $13.99/mo (€12.99 at ~1.075 EUR/USD) per B2B client. Includes business analytics and treasury dashboards.

**USDT/Tron Support:** Expands addressable volume by +12.5% across all existing steps by opening the Tron/USDT ecosystem.

**Adelaide Premium:** Included in Pro subscription — serves as retention driver, not a separate revenue line.

### 17.4 Month 12 — Enterprise Analytics

**Adelaide Enterprise / White-Label:** Tiered pricing — $299/mo Basic, $799/mo Pro, custom Enterprise. Adoption modeled at 5% of B2B client base (70% Basic, 30% Pro).

**Analytics API:** Tiered access — $99/mo Starter, $299/mo Pro, custom Enterprise. Adoption modeled at 8% of B2B client base (70% Starter, 30% Pro).

### 17.5 Month 15 — Creator Economy

**Content Creator Royalties:** Platform takes 12% of monthly subscriber payments to creators. Assumes 3% of Pro subscribers are active creators.

**Content Creator Sponsorships:** Platform takes 12% of sponsorship deals brokered through the platform.

**Influencer Match:** Companies pay $93/mo for a discovery tool matching them with content creators. Adoption modeled at 2% of B2B client base.

### 17.6 Month 18 — Marketplace

**P2P Marketplace:** 1.2% per transaction on goods/services. Adoption: 5% of funded users active, $150 avg monthly volume.

**P2P Startup Investment:** 1.2% per investment deal. Adoption: 0.1% of funded users, $2,000 avg deal size.

**Swap Center:** 0.39% per swap on gift cards, vouchers, and discounts from affiliate companies. Adoption: 8% of funded users, $50 avg swap.

---

## 18. Combined Revenue Projection

With the feature timeline enabled, revenue diversifies away from pure transaction fees over the 60-month projection window:

**Months 1–5:** Transaction fees only. Revenue depends entirely on funded user volume across 5 monetized steps + yield performance fee.

**Months 6–8:** B2B treasury and cashflow add a small but growing revenue stream. B2B engagement established.

**Months 9–11:** Subscriptions provide recurring revenue independent of transaction volume. USDT/Tron expands addressable market. This is the most significant inflection point for revenue diversification.

**Months 12–14:** Enterprise analytics and API access add high-margin B2B recurring revenue that scales with client base rather than individual transaction volume.

**Months 15–17:** Creator economy creates a flywheel — content drives user acquisition, which drives subscription revenue, which attracts more creators.

**Months 18–60:** Full marketplace enables platform economics — diBoaS becomes infrastructure for financial activity, not just a fee collector.

The Feature toggle in the Fee Lab allows comparing projections with and without these streams, showing the pure transaction-fee baseline versus the diversified model.

---

## 19. Model Limitations & Disclaimers

### 19.1 What the Model Does NOT Include

**User acquisition costs (CAC):** Growth is modeled as a free MoM rate. In reality, achieving 12% monthly growth requires marketing spend that is not captured as an explicit cost. If CAC is $30 per funded user, this represents a significant unmodeled expense that would delay break-even.

**Variable infrastructure costs:** Infrastructure is fixed at $500/month regardless of scale. At hundreds of thousands of MAU, RPC nodes, database costs, and monitoring will scale. No per-user or per-transaction infrastructure cost is modeled.

**Per-user variable overhead:** Support, ops, and abuse prevention costs (estimated ~$0.25/user/month at scale) are not modeled. At 10,000 funded users this represents ~$2,500/month in unmodeled costs.

**On-ramp partner costs:** The 0.48% ramp fee represents the diBoaS platform fee. Partner costs from Onramper/Transak are operational expenses handled separately and not modeled in this simulation. If partner costs consume a portion of the 0.48%, actual platform capture on ramp transactions would be lower.

**Regulatory compliance costs:** KYC/AML costs for high-risk transactions ($0.50–$2 per check) are not explicitly modeled. Ongoing legal counsel across three jurisdictions (US, EU, Brazil) represents an unmodeled fixed cost.

**Execution quality:** Slippage, failed transactions, MEV protection, and route reliability are not captured. These affect real-world user experience and retention but are outside the fee economics scope.

**Smart contract risk:** A major DeFi protocol hack could spike churn dramatically. No risk buffer or insurance cost is modeled.

### 19.2 Specific Model Behaviors to Understand

The growth model does not plateau — newUsers compounds indefinitely. The churn-adjusted formula creates a decelerating growth curve but MAU continues climbing as long as acquisition growth exceeds churn. Monitor this against real-world data and consider adding a growth decay or logistic cap if needed.

Feature revenue assumptions are conservative estimates using industry benchmarks. Actual adoption rates for subscriptions, enterprise products, and marketplace will depend on product-market fit that cannot be modeled in advance.

Yield APY is hardcoded at 6% with a 10% performance fee. In a low-yield environment, APY could drop to 3–4%, reducing yield revenue by 33–50%. Yield revenue uses the Start Strategy attach rate as a proxy for active strategy deployments; a dedicated strategy retention model (tracking ongoing AUM vs. one-time activations) is a future refinement.

USDT/Tron volume boost (1.125× from Month 9) represents average ticket size uplift from new payment rails — larger remittances and additional currency corridors — not increased transaction frequency. Signature costs are unaffected by this boost.

### 19.3 Regulatory Considerations

This documentation and the Fee Lab simulation do not constitute investment advice, legal counsel, or regulatory compliance certification. Automated DeFi strategies may be classified as regulated investment services in certain jurisdictions. diBoaS should obtain jurisdiction-specific legal opinions before marketing strategy features in US, EU, and Brazilian markets. MiCA compliance framework is under development; specific certification status should not be inferred from this document.

### 19.4 Version Control

| Document | Version | Last Updated |
|----------|---------|-------------|
| Fee Lab JSX | v3.3 | Feb 19, 2026 |
| Complete Documentation | v3.3 | This file | Feb 19, 2026 |
| Audit Guide | v2.3 | See companion |

Changes from v3.2 → v3.3: P0: Signature cost now includes frequency multiplier (freq × sigs × $0.01). Middleware capture no longer floors at $0.25 — platform take can drop to $0 at high middleware bps. P1: Header version corrected. Ramp narrative clarified (platform fee, not spread). Competitor comparison uses mix-weighted average. Variable overhead moved to §19.1 (not modeled). "Fee Lab v3" wording removed. Line counts removed. b2b_cashflow desc clarified. volumeBoost documented as ticket size uplift. Sensitivity churn clamp aligned (min=0). P2: Independence assumption noted. Competitor snapshot disclaimer. Floor-hit tx count display. Yield proxy note. Sig cost framing. AG TOC reordered.

Changes from v3.1 → v3.2: directShare unit convention clarified in §13.2 (fraction vs percentage). Batching section renamed "DCA Buy Batching" for consistency with UI label.

Changes from v3.0 → v3.1: Fixed §13.2 middleware fee formula (missing /100 divisor), sensitivity now respects showFeatures toggle, DCA batching restricted to Buy steps only, subscription prices normalized from EUR to USD ($8.59/$13.99 at ~1.075 rate), Full Table TxRev column now correctly excludes yieldRev, added YieldRev column to Full Table, Phantom rate labeled as estimated, B2B adoption note added with conservative range (0.5–1%).
