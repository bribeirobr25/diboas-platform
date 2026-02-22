# diBoaS Fee Lab — Audit Guide v2.3

**Purpose:** Machine-readable cross-reference between the Fee Lab JSX implementation (v3.3) and the Complete Documentation (v3.3). Designed for independent verification by AI auditors, human analysts, or automated test harnesses.

**Companion Files:** `diboas-fee-lab-v3.3.jsx`, `diBoaS_Fee_Lab_Complete_Documentation_v3.3.md`

**Date:** February 19, 2026

---

## Table of Contents

A. [Data Dictionary](#a-data-dictionary)
B. [Canonical Fee Structure](#b-canonical-fee-structure)
C. [Step Configuration Reference](#c-step-configuration-reference)
D. [Persona Input Tables](#d-persona-input-tables)
E. [Scenario Configurations](#e-scenario-configurations)
F. [Feature Timeline Reference](#f-feature-timeline-reference)
G. [Formula Verification Reference](#g-formula-verification-reference)
H. [Test Cases](#h-test-cases)
I. [Known Discrepancies](#i-known-discrepancies)
J. [Audit Checklist](#j-audit-checklist)
K. [Stable Identifiers (JSX Search Keys)](#k-stable-identifiers-jsx-search-keys)
L. [Version Control](#l-version-control)

---

## A. Data Dictionary

**Conventions:**
- **Rounding:** All MAU, funded users, attached users, B2B client counts, and subscriber counts are integer-rounded with `Math.round()`. Test case results use exact values where possible and note rounding when it applies.
- **Percentage parameters:** UI state variables store percentages as integers (e.g., `directShare = 85`, `fundedPct = 55`). Engine functions expect fractions where noted — the conversion `/ 100` happens at call sites. The Data Dictionary below marks which form each function expects.
- **Currency:** All monetary values are in USD. Subscription prices are EUR-equivalent at ~1.075 rate (€7.99 → $8.59, €12.99 → $13.99).
- **Fee rates:** `feePct` values (0.48, 0.39) are stored as percentages and converted via `feePct / 100` in calculations. This guide uses "%" suffix consistently (e.g., "0.48%") to indicate percentage form.

### A.1 Fee Parameters

| MD Reference | JSX Location | Variable | Default | Range | Description |
|-------------|-------------|----------|---------|-------|-------------|
| §9.1, §13.1 | `const STEPS = [` array, per step | feePct | 0.48% or 0.39% or 0% | Fixed | Per-step fee rate (canonical, not adjustable). JSX stores as bare number; converted via `/ 100` |
| §9.2 | `const [feeFloor, setFeeFloor] = useState(0.25)` | feeFloor | 0.25 | 0–1.00 | Minimum fee per exec transaction ($) |
| §9.2 | `const [feeCap, setFeeCap] = useState(25)` | feeCap | 25 | 5–100 | Maximum fee per exec transaction ($) |
| §13.2 | `const [directShare, setDirectShare] = useState(85)` | directShare (UI) | 85 | 50–100 | % of exec transactions routed directly. **UI stores as percent; engine converts: `ds = directShare / 100`** |
| §13.2 | `const [middlewareBps, setMiddlewareBps] = useState(25)` | middlewareBps | 25 | 0–50 | Middleware partner fee in basis points |
| §13.3 | `const [batchingEnabled, setBatchingEnabled] = useState(false)` | batchingEnabled | false | bool | Buy Batching toggle (Buy step only) |

### A.2 Growth & Burn Parameters

| MD Reference | JSX Location | Variable | Default | Range | Description |
|-------------|-------------|----------|---------|-------|-------------|
| §10.2 | `const [burn, setBurn] = useState(56000)` | burn | 56000 | 25K–150K | Monthly fixed burn ($) |
| §14.1 | `const [growth, setGrowth] = useState(12)` | growth | 12 | 5–35 | Monthly acquisition growth rate (%) |
| §14.1 | `const [churn, setChurn] = useState(8)` | churn | 8 | 0–20 | Monthly churn rate (%) |
| §14.1 | `const [startMAU, setStartMAU] = useState(800)` | startMAU | 800 | 100–10K | Starting MAU (month 1) |
| §14.1 | `const [fundedPct, setFundedPct] = useState(55)` | fundedPct | 55 | 20–80 | App-to-funded conversion rate (%) |

### A.3 Fixed Constants (not adjustable via UI)

| MD Reference | JSX Location | Variable | Value | Description |
|-------------|-------------|----------|-------|-------------|
| §10.3 | `const sC = 0.01` | sC | 0.01 | All-in infrastructure/signing cost proxy per signature (not literal Solana base fee). Conservative estimate covering base fee, priority fees, and RPC costs. Monthly cost per attached user = freq × sigs × sC. |
| §10.2 | `iB = 500` | iB | 500 | Monthly infrastructure base cost ($) |
| — | `stratAUM = 1500` | stratAUM | 1500 | Average AUM per strategy user ($) |
| §19.2 | `yAPY = 6` | yAPY | 6 | Assumed yield APY (%) |
| §9.3 | `yPerf = 10` | yPerf | 10 | Performance fee on yield (%) |

### A.4 Wallet Tier Cost Schedule

| MAU Bracket | Monthly Cost | JSX Location |
|-------------|-------------|-------------|
| ≤ 1,000 | $0 | `function walletTierCost(mauApp)` |
| 1,001 – 5,000 | $250 | `if (mauApp <= 5000) return 250` |
| 5,001 – 25,000 | $500 | `if (mauApp <= 25000) return 500` |
| > 25,000 | $1,500 | `return 1500` |

### A.5 Feature Timeline Toggle

| MD Reference | JSX Location | Variable | Default | Description |
|-------------|-------------|----------|---------|-------------|
| §17 | `const [showFeatures, setShowFeatures] = useState(true)` | showFeatures | true | Feature revenue timeline toggle |

---

## B. Canonical Fee Structure

**Source of truth:** CEO confirmation, February 2026. JSX STEPS array.

| Step | Key | feeType | feePct | Floor | Cap | Notes |
|------|-----|---------|--------|-------|-----|-------|
| 1. Add | add | ramp | 0.48% | None | None | On-ramp, revenue-shared with partner |
| 2. Send | send | free | 0% | — | — | P2P transfer, zero platform fee |
| 3. Withdraw | withdraw | ramp | 0.48% | None | None | Off-ramp, revenue-shared with partner |
| 4. Buy | buy | exec | 0.39% | $0.25 | $25 | DCA/DEX purchase |
| 5. Sell | sell | exec | 0.39% | $0.25 | $25 | DEX sell |
| 6. Swap | swap | free | 0% | — | — | Token-to-token, zero platform fee |
| 7. Bridge | bridge | free | 0% | — | — | Cross-chain, zero platform fee |
| 8. Start | start | free | 0% | — | — | Enter DeFi strategy, zero fee |
| 9. Stop | stop | exec | 0.39% | $0.25 | $25 | Exit DeFi strategy |

**Three fee tiers:**
- Ramp (0.48%): Money entry/exit — Add, Withdraw
- Exec (0.39%): Buy/sell/close — Buy, Sell, Stop
- Free (0%): Internal operations — Send, Swap, Bridge, Start

---

## C. Step Configuration Reference

Complete step defaults as defined in JSX `const STEPS = [` array:

| # | Key | Freq | Avg ($) | Sigs | feeType | feePct (%) | Cat |
|---|-----|------|---------|------|---------|--------|-----|
| 1 | add | 1.2 | 350 | 0 | ramp | 0.48% | Banking |
| 2 | send | 0.3 | 200 | 1 | free | 0% | Banking |
| 3 | withdraw | 0.2 | 500 | 0 | ramp | 0.48% | Banking |
| 4 | buy | 4.0 | 75 | 2.5 | exec | 0.39% | Investing |
| 5 | sell | 0.5 | 200 | 2.5 | exec | 0.39% | Investing |
| 6 | swap | 1.2 | 300 | 2.5 | free | 0% | DeFi |
| 7 | bridge | 0.4 | 400 | 3 | free | 0% | DeFi |
| 8 | start | 0.4 | 500 | 4 | free | 0% | Yield |
| 9 | stop | 0.15 | 400 | 3 | exec | 0.39% | Yield |

Note: JSX stores feePct as bare number (e.g., `0.48`); code converts via `feePct / 100` in calculations.

---

## D. Persona Input Tables

### D.1 🌱 Small DCA (35% mix)

| Step | Freq | Avg ($) |
|------|------|---------|
| Add | 1.0 | 100 |
| Send | 0.2 | 30 |
| Withdraw | 0 | 0 |
| Buy | 4.0 | 50 |
| Sell | 0.2 | 80 |
| Swap | 0.3 | 60 |
| Bridge | 0 | 0 |
| Start | 0 | 0 |
| Stop | 0 | 0 |

### D.2 📊 Active Investor (40% mix)

| Step | Freq | Avg ($) |
|------|------|---------|
| Add | 1.5 | 350 |
| Send | 0.5 | 200 |
| Withdraw | 0.2 | 400 |
| Buy | 4.0 | 100 |
| Sell | 0.5 | 250 |
| Swap | 2.0 | 300 |
| Bridge | 0.3 | 300 |
| Start | 0.3 | 500 |
| Stop | 0.1 | 400 |

### D.3 ⚡ Power User (20% mix)

| Step | Freq | Avg ($) |
|------|------|---------|
| Add | 2.0 | 800 |
| Send | 1.0 | 500 |
| Withdraw | 0.5 | 1,000 |
| Buy | 8.0 | 200 |
| Sell | 1.0 | 500 |
| Swap | 3.0 | 600 |
| Bridge | 1.0 | 800 |
| Start | 1.0 | 1,500 |
| Stop | 0.3 | 1,000 |

### D.4 🐋 Whale (5% mix)

| Step | Freq | Avg ($) |
|------|------|---------|
| Add | 1.0 | 5,000 |
| Send | 0.5 | 3,000 |
| Withdraw | 0.5 | 8,000 |
| Buy | 2.0 | 5,000 |
| Sell | 1.0 | 5,000 |
| Swap | 1.0 | 10,000 |
| Bridge | 0.5 | 5,000 |
| Start | 0.5 | 10,000 |
| Stop | 0.2 | 8,000 |

---

## E. Scenario Configurations

| Parameter | Conservative | Base | Bull |
|-----------|-------------|------|------|
| Churn | 12% | 8% | 5% |
| Growth | 10% | 12% | 18% |
| Funded % | 40% | 55% | 65% |
| Label color | #f87171 | #fbbf24 | #4ade80 |

### Attach Rates by Scenario

| Step | Conservative | Base | Bull |
|------|-------------|------|------|
| add | 45% | 60% | 80% |
| send | 10% | 20% | 30% |
| withdraw | 5% | 12% | 18% |
| buy | 40% | 65% | 75% |
| sell | 15% | 30% | 40% |
| swap | 15% | 35% | 50% |
| bridge | 5% | 15% | 25% |
| start | 8% | 20% | 30% |
| stop | 4% | 10% | 15% |

---

## F. Feature Timeline Reference

14 revenue streams across 6 milestones:

| Month | ID | Label | Revenue Mechanism | Adoption Model |
|-------|-----|-------|-------------------|----------------|
| 3 | b2b_sends | B2B Sends | Free (engagement) | — |
| 6 | b2b_treasury | B2B Treasury | Free entry, 0.39% exit | 1.5% of MAU × 10% exit/mo × $2K avg |
| 6 | b2b_cashflow | B2B Cashflow | *(capability, not separate revenue)* | No incremental revenue beyond shared B2B exit-fee model. Listed in FEATURE_TIMELINE for product completeness; `featureRevenue()` has no separate cashflow block. |
| 9 | usdt_tron | USDT/Tron | +12.5% volume boost | Multiplier on all step volumes |
| 9 | pro_b2c | Pro Sub (B2C) | $8.59/mo (€7.99 equiv.) | 6% of funded users |
| 9 | pro_b2b | Pro Sub (B2B) | $13.99/mo (€12.99 equiv.) | Per B2B client |
| 12 | adelaide_enterprise | Adelaide Enterprise | $299/$799/custom | 5% of B2B clients (70/30 Basic/Pro) |
| 12 | analytics_api | Analytics API | $99/$299/custom | 8% of B2B clients (70/30 Starter/Pro) |
| 15 | creator_royalties | Creator Royalties | 12% of sub payments | 3% of Pro subs are creators |
| 15 | creator_sponsorship | Creator Sponsorships | 12% of deals | 2 deals/creator × $200 avg |
| 15 | influencer_match | Influencer Match | $93/mo | 2% of B2B clients |
| 18 | p2p_marketplace | P2P Marketplace | 1.2% per tx | 5% of funded × $150 avg |
| 18 | p2p_startup | P2P Startup Invest | 1.2% per deal | 0.1% of funded × $2K avg |
| 18 | swap_center | Swap Center | 0.39% per swap | 8% of funded × $50 avg |

**B2B client model:** B2B clients = Math.round(mauApp × 0.015) — 1.5% of total MAU.

---

## G. Formula Verification Reference

### G.1 calcFee (per transaction)

JSX: `function calcFee(avg, feeType, feePct, feeFloor, feeCap, directShare = 1, middlewareBps = 25)`

⚠️ **Unit note:** `directShare` in this function is a **fraction** (0.85), not the UI percentage (85). The conversion happens at the call site: `const ds = directShare / 100` (JSX line ~251). All formulas below use the fraction form.

```
Input: avg, feeType, feePct, feeFloor, feeCap, directShare (fraction, 0–1), middlewareBps
If feeType === "free": return { full: 0, blended: 0 }
If feeType === "ramp": full = avg × (feePct / 100); return { full, blended: full }
If feeType === "exec":
  raw = avg × (feePct / 100)
  fullFee = clamp(raw, feeFloor, feeCap)              ← user-facing fee (floor/cap apply)
  mwCapturePct = max(0, feePct - (middlewareBps / 100))
  mwRaw = avg × (mwCapturePct / 100)
  mwFee = min(mwRaw, fullFee)                          ← platform capture (NO floor, capped at fullFee)
  blended = directShare × fullFee + (1 - directShare) × mwFee
  return { full: fullFee, blended }
```

**v3.3 change:** Middleware capture (`mwFee`) no longer uses `clamp(mwRaw, feeFloor, feeCap)`. Floor/cap are user-facing constraints only. Platform capture on routed transactions can drop to $0 when `mwCapturePct = 0`. This prevents revenue overstatement at high middleware rates.

**Verification:** At UI default `directShare = 85`:
- Engine receives: `ds = 85 / 100 = 0.85`
- `blended = 0.85 × fullFee + 0.15 × mwFee` ✅
- If someone passes 85 instead of 0.85: `blended = 85 × fullFee` ❌ (off by ~100×)

### G.2 batchedFee (DCA Buy batching)

```
Input: freq, avg, feePct, feeFloor, feeCap
Only applies when step key === "buy"
floorBreak = feeFloor / (feePct / 100) = 0.25 / 0.0039 = $64.10
If avg >= floorBreak or freq === 0: return unchanged
batchSize = ceil(floorBreak / avg)
return { batchedFreq: freq / batchSize, batchedAvg: avg × batchSize }
```

### G.3 walletTierCost

```
Input: mauApp
If mauApp <= 1000: return 0
If mauApp <= 5000: return 250
If mauApp <= 25000: return 500
return 1500
```

### G.4 Growth model

```
Month 1: mauApp = startMAU; newUsers = startMAU × (growth / 100)
Month t>1: mauApp = prev × (1 - churn/100) + newUsers; newUsers = prev_newUsers × (1 + growth/100)
mauFunded = mauApp × (fundedPct / 100)
```

### G.5 featureRevenue

```
Input: month, mauApp, mauFunded
b2bClients = round(mauApp × 0.015)
volumeBoost = month >= 9 ? 1.125 : 1.0
M6+: b2bExitVol = b2bClients × 0.10 × 2000; rev += b2bExitVol × 0.0039
M9+: proSubs = round(mauFunded × 0.06); rev += proSubs × 8.59 + b2bClients × 13.99
M12+: entClients = max(2, round(b2bClients × 0.05)); rev += basic×299 + pro×799
       apiClients = max(3, round(b2bClients × 0.08)); rev += starter×99 + pro×299
M15+: Creator royalties + sponsorships + influencer match
M18+: Marketplace + startup deals + swap center
```

### G.6 Union probability (fee-bearing actives)

```
feeBearing = mauFunded × (1 - Π(1 - attachRate(s)) for s where feeType ≠ "free")
```

Only 5 of 9 steps are fee-bearing (Add, Withdraw, Buy, Sell, Stop).

### G.7 Sensitivity simulation

JSX: `// ========== SENSITIVITY ==========` section, `useMemo` block

```
For each variant: run full simulation with modified parameter
All variants inherit the current showFeatures state (v3.1 fix)

churnLow:  max(0, churn - 3)  (UI: 8% → 5%; clamped at 0%)
churnHigh: churn + 3        (UI: 8% → 11%)
dsLow:     directShare - 0.15  (UI: 85% → 70%, engine: 0.85 → 0.70)
dsHigh:    directShare + 0.15  (UI: 85% → 100%, engine: 0.85 → 1.00)
fundedLow: fundedPct - 10   (UI: 55% → 45%)
fundedHigh: fundedPct + 10  (UI: 55% → 65%)
```

⚠️ **Unit note:** `dsLow`/`dsHigh` operate on the **fraction** form (0.85 ± 0.15), not the UI percentage (85 ± 15). Both representations produce the same result because `ds = directShare / 100` and `0.15 = 15 / 100`, but the code operates in fraction space.

**v3.1 fix:** `runSim()` now accepts and respects the `showFeatures` parameter. When Features are toggled OFF, sensitivity analysis correctly excludes feature revenue from break-even calculations. The `showFeatures` state is included in the sensitivity `useMemo` dependency array.

---

## H. Test Cases

### H.1 Fee Calculation Tests

**FEE-01: Ramp fee on $350 Add**
Input: avg=350, feeType="ramp", feePct=0.48
Expected: full=$1.68, blended=$1.68 (ramp unaffected by middleware)

**FEE-02: Exec fee on $200 Sell**
Input: avg=200, feeType="exec", feePct=0.39, floor=0.25, cap=25
Expected: raw=0.78, full=$0.78 (between floor and cap)

**FEE-03: Floor hit on $50 Buy**
Input: avg=50, feeType="exec", feePct=0.39, floor=0.25
Expected: raw=0.195, full=$0.25 (floor applies), effective=0.50%

**FEE-04: Cap hit on $10,000 Buy**
Input: avg=10000, feeType="exec", feePct=0.39, cap=25
Expected: raw=39.00, full=$25.00 (cap applies), effective=0.25%

**FEE-05: Free step**
Input: feeType="free" (Send, Swap, Bridge, Start)
Expected: full=$0.00, blended=$0.00

**FEE-06: Blended route on $200 Sell (85% direct, 25 bps MW)**
Input: avg=200, feePct=0.39, directShare=0.85 (fraction; UI value 85%), middlewareBps=25
mwCapturePct = 0.39 - 0.25 = 0.14
mwRaw = 200 × 0.0014 = $0.28
mwFee = min(0.28, 0.78) = $0.28
blended = 0.85 × 0.78 + 0.15 × 0.28 = 0.663 + 0.042 = $0.705

**FEE-06b: Edge case — MW consumes full budget (50 bps MW on $50 Buy)**
Input: avg=50, feePct=0.39, directShare=0.85, middlewareBps=50
fullFee = clamp(50 × 0.0039, 0.25, 25) = clamp(0.195, 0.25, 25) = $0.25 (floor hit)
mwCapturePct = max(0, 0.39 - 0.50) = 0
mwRaw = 50 × 0 = $0.00
mwFee = min(0.00, 0.25) = $0.00 ← v3.3: capture drops to $0 (previously was $0.25)
blended = 0.85 × 0.25 + 0.15 × 0.00 = $0.2125
Note: User still pays $0.25 (fullFee), but platform only captures $0.2125 blended.

**FEE-07: Ramp on $8,000 Withdraw**
Input: avg=8000, feeType="ramp", feePct=0.48
Expected: full=$38.40 (no cap on ramp)

### H.2 Batching Tests (Buy step only)

**BATCH-01: Small DCA $50 buy with batching**
Input: key="buy", freq=4, avg=50, feePct=0.39, floor=0.25
floorBreak = 0.25 / 0.0039 = $64.10
batchSize = ceil(64.10 / 50) = 2
Result: batchedFreq=2, batchedAvg=$100
Fee per batched tx: clamp(100 × 0.0039, 0.25, 25) = $0.39
Monthly: 2 × $0.39 = $0.78 (vs unbatched: 4 × $0.25 = $1.00)

**BATCH-02: $100 buy — no batching needed**
Input: key="buy", freq=4, avg=100, feePct=0.39, floor=0.25
$100 > $64.10 → no batching applies
Fee: clamp(100 × 0.0039, 0.25, 25) = $0.39

**BATCH-03: Sell $50 with batching ON — no batching applied**
Input: key="sell", freq=0.5, avg=50, feePct=0.39, floor=0.25
Batching toggle is ON but key !== "buy" → batching does NOT apply
Fee: clamp(50 × 0.0039, 0.25, 25) = clamp(0.195, 0.25, 25) = $0.25 (floor hit)

### H.3 Wallet Tier Tests

**TIER-01:** MAU=500 → $0
**TIER-02:** MAU=1,000 → $0
**TIER-03:** MAU=1,001 → $250
**TIER-04:** MAU=5,000 → $250
**TIER-05:** MAU=5,001 → $500
**TIER-06:** MAU=25,000 → $500
**TIER-07:** MAU=25,001 → $1,500

### H.4 Feature Revenue Tests

**FEAT-01: Month 5 — no features**
Month=5 → featureRevenue returns rev=0, volumeBoost=1.0

**FEAT-02: Month 9 — subscriptions active**
Month=9, mauApp=5000, mauFunded=2750
b2bClients = round(5000 × 0.015) = 75
proSubs = round(2750 × 0.06) = 165
rev includes: 165 × 8.59 + 75 × 13.99 + b2b treasury exit fees
volumeBoost = 1.125

**FEAT-03: Month 6 — B2B treasury**
Month=6, mauApp=3000
b2bClients = round(3000 × 0.015) = 45
b2bExitVol = 45 × 0.10 × 2000 = $9,000
rev = 9000 × 0.0039 = $35.10

### H.5 Growth Model Tests

**GROWTH-01: Month 1**
mauApp = 800, newUsers = 800 × 0.12 = 96

**GROWTH-02: Month 2**
mauApp = 800 × 0.92 + 96 = 736 + 96 = 832
newUsers = 96 × 1.12 = 107.52 → 108

**GROWTH-03: Verify no plateau**
At Month 60 with base defaults, MAU should be in the hundreds of thousands (not 12–15K). The growth model compounds newUsers at the acquisition rate.

### H.6 Persona Aggregate Tests

**PERS-01: Small DCA monthly cost**
Per-step breakdown (Small DCA persona defaults):
- Add: 1 × $100 × 0.0048 = $0.48 (ramp, no floor/cap)
- Send: 0.2 freq → free → $0.00
- Withdraw: 0 freq → $0.00
- Buy: 4 × clamp($50 × 0.0039, $0.25, $25) = 4 × clamp($0.195, $0.25, $25) = 4 × $0.25 = $1.00 (floor hit)
- Sell: 0.2 × clamp($80 × 0.0039, $0.25, $25) = 0.2 × clamp($0.312, $0.25, $25) = 0.2 × $0.312 = $0.0624
- Swap: 0.3 freq → free → $0.00
- Bridge: 0 freq → $0.00
- Start: 0 freq → $0.00
- Stop: 0 freq → $0.00
Total user fee: $0.48 + $0.00 + $0.00 + $1.00 + $0.062 + $0.00 + ... = **≈ $1.54/mo**
Effective rate: $1.54 / total volume ≈ 0.58% (floor-driven on small Buy tickets)
Note: UI display uses `fd()` ($X.XX format) so $0.0624 renders as $0.06.

---

## I. Known Discrepancies

### I.1 Resolved (from v2 → v3 → v3.1)

| # | Issue | Resolution |
|---|-------|------------|
| 1 | Fee schedule mismatch (v2 MD 0.75%/0.12% vs JSX 0.50%/0.30%) | New canonical rates: 0.48% ramp, 0.39% exec, free. All files aligned. |
| 2 | Step defaults mismatch (v2 MD 2-10× higher than JSX) | MD v3 Section 12.2 now matches JSX STEPS array exactly. |
| 3 | Growth model "plateau" claim (MD said 12-15K, actual 387K) | MD v3 Section 13.4 honestly describes non-plateau behavior. |
| 4 | Wallet tier brackets wrong (v2 MD: Free ≤2500, Tier 3 ≤15K) | MD v3 Section 13.6: Free ≤1000, Tier 3 ≤25K. Matches JSX. |
| 5 | Send sigs 3 → 1 | MD v3 Section 12.2: sigs=1. Matches JSX. |
| 6 | Bull growth 20% → 18% | MD v3 Section 14.1: Bull growth=18%. Matches JSX. |
| 7 | Sensitivity ±5% → ±3% churn | MD v3 Section 16.1: ±3%. Matches JSX. |
| 8 | MW formula (subtraction before vs after clamp) | MD v3 Section 13.2: formula matches JSX (mwCapturePct then clamp). |
| 9 | **MD1 §13.2 mwFee missing /100** (v3.0→v3.1) | Fixed: `clamp(ticket × (mwCapturePct/100), floor, cap)`. Now matches JSX and Audit Guide. |
| 10 | **Sensitivity ignoring showFeatures** (v3.0→v3.1) | Fixed: `runSim()` accepts `showFeatures` param. Sensitivity passes current state and includes in deps. |
| 11 | **EUR/USD mixing in subscriptions** (v3.0→v3.1) | Fixed: All prices now USD ($8.59 B2C, $13.99 B2B). EUR-equivalent noted in descriptions. |
| 12 | **TxRev column included yieldRev** (v3.0→v3.1) | Fixed: Full Table now shows separate TxRev, Yield, and FeatRev columns. |
| 13 | **Batching applied to all exec steps** (v3.0→v3.1) | Fixed: Batching now restricted to `key === "buy"` only. Toggle renamed "Buy Batching". |
| 14 | **Phantom rate unattributed** (v3.0→v3.1) | Fixed: Labeled "(est.)" in JSX, MD, and Audit Guide. Source noted as third-party analysis. |
| 15 | **directShare unit ambiguity** (v3.1→v3.2) | Fixed: A.1 now marks UI vs engine form. G.1 adds unit warning box. G.7 shows both UI% and fraction. FEE-06 annotated. |
| 16 | **"Buy Batching" UI label not updated** (v3.1→v3.2) | Fixed: JSX button now reads "Buy Batching". Help text updated. AG I.1 #13 now accurate. |
| 17 | **b2b_cashflow listed as separate revenue stream** (v3.1→v3.2) | Fixed: Feature timeline row now says "(capability, not separate revenue)" with explicit note. |
| 18 | **Rounding convention undocumented** (v3.1→v3.2) | Fixed: Data Dictionary preamble now states all user/client counts use Math.round(). |
| 19 | **feePct notation inconsistent** (v3.1→v3.2) | Fixed: All feePct values now use "%" suffix. Step Config table header clarified. |
| 20 | **JSX locations vague ("State: X")** (v3.1→v3.2) | Fixed: Data Dictionary now uses `useState()` search keys. G.1, G.7 include JSX function signatures. |
| 21 | **PERS-01 missing zero-fee steps** (v3.1→v3.2) | Fixed: All 9 steps now listed explicitly including Withdraw=0, Bridge=0, etc. |
| 22 | **Signature cost missing frequency multiplier** (v3.2→v3.3) | Fixed: `sigCostPerUser = defaultFreq × sigs × sC` in both runSim and main sim. MD §13.6 and AG checklist updated. |
| 23 | **Middleware capture floored at $0.25** (v3.2→v3.3) | Fixed: `mwFee = min(mwRaw, fullFee)` — no floor on platform capture. FEE-06b edge case test added. |
| 24 | **Header version string said v3.1** (v3.2→v3.3) | Fixed: Header, footer, and source comment all say v3.3. |
| 25 | **Ramp fee "spread" narrative contradicted full-capture code** (v3.2→v3.3) | Fixed: MD §9.2 now says "platform fee; partner costs not modeled." Added to §19.1 limitations. |
| 26 | **Competitor multiplier used unweighted average** (v3.2→v3.3) | Fixed: Now uses mix-weighted effective rate (pctOfBase weights). |
| 27 | **Variable overhead $0.25/user listed but not modeled** (v3.2→v3.3) | Fixed: Removed from §10.3, added to §19.1 as "not modeled." |
| 28 | **Sensitivity churn clamp min=1 vs docs min=0** (v3.2→v3.3) | Fixed: Code now uses `Math.max(0, churn - 3)`. AG G.7 updated. |
| 29 | **b2b_cashflow JSX desc implied incremental revenue** (v3.2→v3.3) | Fixed: JSX desc now says "included in B2B Treasury model." |

### I.2 Remaining / By Design

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Fixed infrastructure ($500/mo at scale) | By design | Model limitation, documented in §19.1 |
| 2 | No CAC modeled | By design | Model limitation, documented in §19.1 |
| 3 | Yield APY hardcoded at 6% | By design | Not a slider yet — documented in §19.2 |
| 4 | Feature revenue adoption rates are estimates | By design | Conservative assumptions, documented in §19.2 |
| 5 | B2B Treasury AUM ($2K avg) is placeholder | By design | Will be refined with actual B2B data |

---

## J. Audit Checklist

### J.1 Fee Mechanics (10 items)

- [ ] Ramp steps (Add, Withdraw) use feePct=0.48, no floor/cap
- [ ] Exec steps (Buy, Sell, Stop) use feePct=0.39 with $0.25 floor, $25 cap
- [ ] Free steps (Send, Swap, Bridge, Start) return fee=0 always
- [ ] Floor applies when raw < $0.25 (exec only)
- [ ] Cap applies when raw > $25.00 (exec only)
- [ ] Blended route reduces platform capture but not user fee (exec only)
- [ ] Middleware subtraction: mwCapturePct = feePct - (middlewareBps/100)
- [ ] Middleware capture: mwFee = min(mwRaw, fullFee) — NO floor on platform capture (v3.3)
- [ ] Ramp steps unaffected by middleware routing
- [ ] Batching only applies to Buy step (key === "buy") below floor breakpoint
- [ ] Fee type displayed correctly per step in UI ("FREE", "0.48%", "0.39%")

### J.2 Growth Model (5 items)

- [ ] Month 1 MAU = startMAU (no churn applied)
- [ ] newUsers compounds at growth rate each month
- [ ] Churn applied to previous MAU, not to newUsers
- [ ] fundedPct applied to mauApp to get mauFunded
- [ ] No artificial plateau or growth cap exists

### J.3 Projection (7 items)

- [ ] walletTierCost uses correct brackets (1K/5K/25K thresholds)
- [ ] Signature cost = $0.01 × freq × sigs × attached_users per step (v3.3: includes frequency)
- [ ] Break-even = first month with positive monthly profit
- [ ] Peak loss = minimum cumulative P&L value
- [ ] Feature revenue only appears when showFeatures=true
- [ ] Volume boost (1.125×) only applies from Month 9+
- [ ] Sensitivity simulations respect showFeatures toggle (pass to runSim, include in deps)

### J.4 Feature Timeline (6 items)

- [ ] No feature revenue before Month 3
- [ ] B2B Treasury exit fee uses 0.39% (same as Stop Strategy)
- [ ] Pro subscriptions activate at Month 9 ($8.59 B2C, $13.99 B2B — EUR-equiv.)
- [ ] Adelaide Enterprise activates at Month 12
- [ ] Creator Economy activates at Month 15
- [ ] Marketplace activates at Month 18

### J.5 Documentation Alignment (5 items)

- [ ] MD §9.1 fee table matches JSX STEPS array rates
- [ ] MD §12.2 step defaults match JSX STEPS freq/avg/sigs
- [ ] MD §13.6 wallet tiers match JSX walletTierCost
- [ ] MD §14.1 scenario parameters match JSX SCENARIOS
- [ ] MD §17 feature timeline matches JSX FEATURE_TIMELINE

### J.6 UI/Display (6 items)

- [ ] Verdict thresholds: ✅ ≤0.35%, ⚠️ ≤0.50%, 🚨 >0.50%
- [ ] Competitor multipliers calculate correctly (competitor rate / avg diBoaS rate)
- [ ] Phantom labeled "(est.)" in competitor display
- [ ] Sensitivity shows ±3% churn, ±15% directShare, ±10% funded
- [ ] Feature timeline tab shows all 6 milestones
- [ ] Full table has separate TxRev, Yield, and FeatRev columns

---

## K. Stable Identifiers (JSX Search Keys)

For machine-parseable auditing, use these stable search strings to locate key code sections:

| Component | Search Key | Purpose |
|-----------|-----------|---------|
| Fee engine | `function calcFee(` | Core fee calculation |
| Batching | `function batchedFee(` | DCA Buy batching logic |
| Wallet tiers | `function walletTierCost(` | Privy cost schedule |
| Feature revenue | `function featureRevenue(` | 14-stream revenue calculator |
| Simulation | `function runSim(` | Break-even/sensitivity engine |
| Main component | `export default function App()` | React root |
| Persona calc | `// ========== PERSONA CALCULATIONS` | Persona fee breakdown |
| Projection sim | `// ========== PROJECTION SIMULATION` | Monthly P&L simulation |
| Sensitivity | `// ========== SENSITIVITY` | Sensitivity analysis block |
| Step config | `const STEPS = [` | 9-step canonical configuration |
| Feature timeline | `const FEATURE_TIMELINE = [` | 14 revenue stream definitions |
| Scenarios | `const SCENARIOS = {` | Conservative/Base/Bull presets |
| Personas | `const DEFAULT_PERSONAS = [` | 4 user archetypes |
| Competitors | `const COMPETITORS = {` | Benchmark rate data |

Note: Line numbers may shift between versions. Search keys are stable across v3.x releases.

---

## L. Version Control

| File | Version | Date | Changes from Previous |
|------|---------|------|----------------------|
| diboas-fee-lab-v3.3.jsx | 3.3 | Feb 19, 2026 | P0: sig cost × freq, MW capture no-floor. P1: header v3.3, weighted competitor avg, churn clamp min=0, b2b_cashflow desc, floorHitTxCount display. |
| diBoaS_Fee_Lab_Complete_Documentation_v3.3.md | 3.3 | Feb 19, 2026 | P0: sig cost formula fixed (§13.6), MW capture formula updated (§13.2). P1: ramp narrative, variable overhead moved to §19.1, volume boost semantics, "Fee Lab v3" wording, line counts removed. P2: independence note, competitor snapshot, yield proxy note. |
| FEE_LAB_AUDIT_GUIDE_v2.3.md | 2.3 | Feb 19, 2026 | P0: G.1 calcFee updated (no-floor capture), FEE-06b edge case added, sig cost formula in checklist. P1: churn clamp in G.7, sig cost framing in A.3. P2: TOC reordered (J, K, L). 8 new resolved discrepancies (items 22-29). |

### Authority Statement

In the event of a conflict between narrative documentation and code, the JSX implementation is the authoritative representation of the platform's economics. The canonical fee structure (Section B of this guide) is the authoritative source for fee rates, confirmed by the CEO. Both the JSX and MD must conform to these canonical rates.
