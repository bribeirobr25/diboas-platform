# Multi‑Chain Non‑Custodial Platform (Solana‑First) — Research & Handover
_Last updated: 2026-02-12_

## 0) Why this doc exists
You’re building a **non‑custodial, multi‑chain consumer platform** that:
- Creates wallets at account creation (SOL, BTC, ETH L1+L2, SUI; Lightning optional)
- Never touches user funds (no custody, no CEX integration)
- Uses **direct-to-wallet** 3rd‑party on/off‑ramps
- Lets users execute intents like **Send / Buy / Sell / Swap / Bridge / DeFi strategies**
- Abstracts complexity (swap/bridge/approvals) while users **always sign**

This doc consolidates:
- Requirements and architecture decisions
- Fee model components (what fees exist, where they come from)
- On/Off‑ramp and on‑chain cost findings (ranges + what to measure)
- Tokenized assets and compliance gating implications
- Wallet provider research and recommendation
- What to build in‑house (router/state machine/manifest)
- Open risks and “needs deeper research” items

---

## 1) Non‑negotiable requirements (the stuff that breaks the project if ignored)
### 1.1 Custody & money flow
- **Non‑custodial wallets** per user for: **Solana, Bitcoin (L1), Ethereum (L1 + at least one L2), Sui**
- User **signs every on‑chain action**
- **Platform never controls keys** and never holds user funds, even transiently
- On/Off‑ramp executes fiat↔crypto **directly** between user and the ramp provider, delivering to/from user wallet addresses

### 1.2 Product scope (transaction intents)
Users must be able to (where legally allowed):
- Add funds (fiat→USDC on Solana)
- Send stablecoins/tokens to another wallet
- Buy/Sell: BTC, ETH, SOL, SUI
- Swap tokens ↔ stablecoin
- Swap + bridge across chains (hidden under an “intent”)
- Start/Rebalance/Stop DeFi strategies on:
  - **Solana**: Jito staking, Sanctum INF, Jupiter JLP (perps LP)
  - **Arbitrum**: Aave/Compound lending, Sky SSR (USDC yield) *(availability varies by jurisdiction)*
- Buy/Sell tokenized RWAs:
  - Tether Gold (XAUt)
  - Tokenized ETFs / Stocks (jurisdiction‑restricted; geo‑block mandatory)

### 1.3 Compliance posture
- **Geo‑blocking** (plus KYC gating where required), not “UI‑only”
- Auditability of restrictions: reason codes, evidence, and logs
- Tokenized securities: assume **U.S. persons are excluded** unless you have a regulated offering; EU/Brazil often require qualified/pro status depending on product issuer rules.

---

## 2) The Solana‑first routing model (updated 1–9 steps)
This is the “hub-and-spoke” design we converged on (your steps, refined):

1. **Primary hub chain = Solana** for most user actions (cheap transfers/swaps, strong stablecoin UX).
2. **On‑ramp**: fiat→USDC (or USDT if needed) **directly to user’s Solana address**.
3. **User-to-user send (inside platform)**: is a normal **USDC transfer on Solana** to recipient’s Solana address.
4. **Buy assets available on Solana**: execute **swap USDC→asset** (DEX/aggregator) on Solana.
5. **Sell assets on Solana**: **swap asset→USDC** on Solana.
6. **Buy assets NOT available on Solana**:
   - Route depends on asset chain:
     - EVM assets: bridge/transfer to **EVM L2** (prefer L2 like Arbitrum/Base over ETH L1)
     - Sui assets: bridge/transfer to **Sui**
     - Native BTC: **do not assume “bridge” exists**; it’s usually on‑ramp to BTC or atomic swap rails (see open items).
7. **Sell assets held on other chains**: unwind on that chain → move proceeds back to Solana → USDC.
8. **DeFi strategy on Solana**: on‑chain interactions (deposit/withdraw/claim) + optional swaps on Solana.
9. **DeFi strategy on other chains**: move funds from Solana to target chain + protocol interactions + move back on exit.

**Key correction vs early assumptions:**  
“Bridge SOL/EVM → native BTC” is **not a standard bridge flow**. Most cross‑chain bridges do not deliver native BTC L1. Treat native BTC delivery as **(a) on‑ramp directly to BTC** or **(b) atomic‑swap style rails**.

---

## 3) Fees: what exists (even if you fetch it dynamically)
Your backend will quote real‑time fees, so you don’t hardcode numbers. Still, your product and finance need to know the fee categories.

### 3.1 On/Off‑ramp fees (fiat↔crypto)
Typical components:
- Provider fee (percent + sometimes fixed)
- Payment rail fee (cards > ACH/SEPA/PIX)
- FX fee (if user funding currency ≠ settlement currency)
- Spread (provider/exchange rate mark‑up)
- Chargeback/failed‑payment risk pricing (mostly on cards)

### 3.2 On‑chain fees
- Network gas / priority fees
- DEX swap fee (pool fee; often 0.01%–0.30%+ depending on venue) + price impact
- Bridge fees (protocol fee + relayer fee + destination gas + slippage buffer)
- Protocol fees (e.g., perps LP, staking, lending interest/borrow rates)
- Optional platform fee (your margin; if you take one)

### 3.3 Where users feel pain
- On‑ramp/off‑ramp spreads and payment method fees dwarf gas on cheap chains.
- Bridging introduces slippage + relayer fees + multi‑step failure states.
- DeFi strategies add “hidden” costs (swap spread, deposit/withdraw fees, oracle/keeper costs on some protocols).

---

## 4) On/Off‑ramp research (US, Brazil, EU with focus on DE/ES)
### 4.1 Rails and practical expectations
- **US**: ACH (cheaper), card (fast but expensive)
- **Brazil**: PIX (usually best), card fallback
- **EU (DE/ES)**: SEPA / SEPA Instant (best), card fallback

### 4.2 Integration pattern you want
- Ramp provider hosts KYC + checkout
- You pass the **user wallet address** (Solana USDC)
- Provider sends crypto **directly** to that address
- You reconcile via webhooks + chain indexer

### 4.3 “Aggregator” option
Consider an aggregator widget (e.g., “one integration → multiple ramps”), so you can route by:
- Country + rail + token + chain support + success rate + fees

*(Fee schedules are provider‑specific and vary by rail, region, and volume; treat everything here as directionally correct, not a contract.)*

---

## 5) On‑chain cost comparisons (macro guidance)
### 5.1 Cost “shape” by chain family
- **Solana**: extremely cheap base tx; user friction comes more from swap spreads than gas.
- **EVM L2s (Arbitrum/Base/OP)**: low gas relative to ETH L1; still meaningful compared to Solana.
- **ETH L1**: expensive and volatile; avoid for retail flows unless absolutely necessary.
- **Bitcoin L1**: fee market depends on mempool; UTXO consolidation matters.
- **Sui**: low base fees; ecosystem/tooling maturity is the bigger constraint.

### 5.2 What to measure in production (recommended)
For each intent, record:
- total fees (USD) + breakdown (ramp / swap / bridge / gas / protocol)
- slippage and price impact
- time-to-finality
- failure rate and recovery path

This becomes the dataset for your “cost‑benefit leaderboard” UX.

---

## 6) Tokenized assets (RWA) realities
### 6.1 Availability is not “just technical”
- Tokenized ETFs/stocks are usually restricted:
  - issuer terms (professional/qualified investors)
  - geo restrictions (often “no U.S. persons”)
  - platform distribution restrictions (KYC token/attestation)
- You already decided: **geo‑block features** where not allowed.

### 6.2 Sui has built‑in compliance primitives (useful if RWAs ever land there)
- Sui supports **regulated coins** with a **deny‑list** mechanism.
- Sui also supports **zkLogin** (OAuth-based wallet primitive) if you want seedless Sui onboarding.

---

## 7) Wallet model options (how non‑custodial “feels” in your app)
### 7.1 Three viable models
1. **External wallet only** (Phantom/MetaMask/etc.)  
   - Lowest responsibility, highest UX friction, worst for mainstream onboarding.
2. **Embedded non‑custodial WaaS** (recommended)  
   - Seedless onboarding, passkeys/biometrics, policy controls, consistent signing UX.
3. **Build wallet infra in‑house**  
   - Maximum control, maximum risk, slowest path, expensive audits forever.

### 7.2 “Custody theater” trap and how to avoid it
Even with WaaS you can accidentally become “custodial” if:
- your backend can sign without user presence
- policies allow unattended signatures
- recovery is controlled by you alone

Hard rules:
- enforce **user presence** (passkey/biometric/session key) for every signature
- use **policy engines** to restrict destinations/contracts
- ensure users can export/recover without you (recovery kit / key export)

---

## 8) What to build in‑house (this is your moat)
Wallet providers won’t ship your product for you. The core IP is your orchestration.

### 8.1 Intent router / path finder
Input: user intent + constraints (country, allowed assets, risk flags, target chain availability)  
Output: an execution plan that minimizes cost and failure risk:
- choose chain(s) and venue(s)
- pick swap route (DEX aggregator)
- pick bridge route (quote freshness, TTL, liquidity, fill likelihood)
- propose 1‑click “manifest” the user signs

### 8.2 Transaction manifest (what the user signs)
- Human summary (what happens + max fees + slippage cap + what could fail)
- Machine plan (sequence, deadlines, quote IDs, refund addresses)
- Signed per chain (or batched where possible)

### 8.3 State machine (critical for “hidden” multi‑step flows)
A robust workflow engine for:
- swap → bridge → receive → deposit
- retries and timeouts
- partial fills / refunds
- monitoring confirmations per chain
- deterministic UI states (“Pending”, “Needs action”, “Refund available”, etc.)

### 8.4 Observability and safety
- chain watchers + webhooks + idempotent job processing
- fraud signals (geo mismatch, device reputation)
- allowlist of contracts/venues per feature and per jurisdiction

---

## 9) Wallet provider shortlist (the ones that actually match your chain set)
Below are the **credible** options that (based on public docs) cover your target chains in a non‑custodial embedded model.

### 9.1 Turnkey (strong “single provider” candidate)
- Strengths: headless APIs, policy engine, broad chain coverage including Solana, Bitcoin, Sui, EVM
- Best when: you want full UI control and strict signing policies

### 9.2 Dynamic (now part of Fireblocks)
- Strengths: embedded wallets across EVM + Solana (SVM) + Sui + Bitcoin; good “fintech” positioning; major customer references
- Best when: you want fast integration and an SDK-first developer experience

### 9.3 Privy (excellent for Solana + EVM; Tier 2 for others)
- Strengths: production-proven at high scale for Solana/EVM onboarding; progressive disclosure UX
- Constraints: BTC/Sui/Spark are documented as “Tier 2” chains (more custom transaction building)

### 9.4 Web3Auth / MetaMask Embedded Wallets (broad chain coverage; you assemble plumbing)
- Strengths: chain-agnostic key management, social login, MAU-based pricing
- Constraint: for non‑EVM chains, you often pull a private key and plug into chain SDKs yourself (more engineering responsibility)

### 9.5 Fireblocks Wallets‑as‑a‑Service (enterprise-grade)
- Strengths: enterprise security posture, MPC/WaaS, broad ecosystem
- Constraint: pricing/sales motion tends to be enterprise; integration may be heavier than Turnkey/Dynamic.

---

## 10) Why Magic.link is not a top option for *this* project
Magic is reputable for embedded wallets, but based on its public docs:
- Magic documents non‑EVM support for chains like Solana and Bitcoin, **but Sui is not listed** in its supported blockchains docs.
- There is also industry discussion of a **“magic link” class of auth vulnerability** that pushed the ecosystem toward stronger passkey/session key patterns (not “Magic is unsafe”, but it’s a risk category you must account for).

Result: **Magic can be a Solana/EVM onboarding solution**, but it’s hard to justify as your core provider when **Sui is a required chain**.

---

## 11) Recommendation: build vs buy (final call)
**Do not build wallet infrastructure in-house** unless:
- you already have an in-house security/cryptography team,
- budget for recurring audits,
- and time to ship is not a constraint.

Best practical approach:
- **Buy** wallet infra (Turnkey or Dynamic as “single vendor” candidates).
- **Build** your routing/orchestration layer (intent router + manifest + state machine).
- **Buy** ramps (Ramp/MoonPay/Transak/Banxa; optionally aggregator).
- **Buy** bridge liquidity (Across for EVM↔EVM; other routes via dedicated protocols/aggregators).

If you want to minimize vendor sprawl: **Turnkey** is the cleanest “one provider” story across SOL + BTC + EVM + Sui (per public chain support docs).

---

## 12) Open questions / pending deeper research (still worth validating with vendors)
Even after research, these items should be validated with sales/solutions engineering before contracts:
- “User presence” enforcement semantics (passkeys/session keys) per provider
- Recovery flow guarantees (user export, disaster recovery)
- Exact pricing at your projected MAU + signatures (providers often negotiate)
- On/Off‑ramp support matrix: USDC on Solana via ACH/SEPA/PIX + refunds/chargebacks
- **Native BTC delivery** path without CEX: identify the production‑grade approach (direct on‑ramp to BTC vs atomic‑swap rails)

---

## 13) Useful external feedback we incorporated (condensed)
### 13.1 “User Journey Savings Matrix” idea
A good way to communicate “why Solana‑first matters” internally:
- Define a baseline journey (worst reasonable route) vs optimized route
- Compare total costs per country (US/BR/DE/ES) and per ticket size ($100/$1k/$10k)
- Roll up into 4 canonical journeys: Send / Native Crypto / RWA / DeFi

### 13.2 Key engineering warnings that are valid
- Avoid “custody theater” by never allowing unattended server-side signing.
- Treat BTC as its own subsystem: UTXO management, PSBT pipeline, fee estimation, consolidation.
- Don’t promise “bridge to native BTC” unless you’ve verified the rail.

### 13.3 Sui-specific insights that are genuinely useful
- zkLogin can reduce seed phrase friction (Sui‑only)
- regulated coin + deny-list primitives are strong compliance tools if you ever tokenize RWAs on Sui

---

## Appendix A — Pointers (primary sources used)
_(These are the key references used to validate chain support, pricing, and protocol behavior. Not exhaustive.)_

### Wallet providers
- Turnkey: supported networks + docs: https://docs.turnkey.com/ and network docs pages (Bitcoin/Solana/Sui)
- Turnkey pricing: https://www.turnkey.com/pricing
- Privy: chain tiers (Tier 2 list includes Bitcoin, Sui, Spark): https://docs.privy.io/
- Dynamic: embedded wallets features + supported chains (EVM/SVM/Sui/Bitcoin): https://www.dynamic.xyz/features/embedded-wallets
- Web3Auth: supported chains + pricing: https://web3auth.io/ and https://web3auth.io/pricing.html
- Fireblocks WaaS overview: https://www.fireblocks.com/what-is-mpc

### Magic.link (support scope and security context)
- Magic supported blockchains / non‑EVM docs (Sui not listed): https://docs.magic.link/
- Magic link vulnerability discussion (industry): https://www.dfns.co/article/the-magic-link-vulnerability

### Bridges / routing protocols
- Across docs (fee quoting + “quote timestamp within 10 minutes”): https://docs.across.to/
- deBridge DLN supported chains list (no Bitcoin L1): https://docs.debridge.finance/

### Lightning / Spark
- Lightspark Spark overview: https://spark.money/ and Lightspark docs pages
- Spark unilateral exit / recovery kit: https://www.lightspark.com/

### Sui compliance primitives
- Regulated coins + deny list: https://docs.sui.io/
- zkLogin: https://docs.sui.io/concepts/cryptography/zklogin

---

## Appendix B — Decision checklist (wallet provider selection)
Use this checklist in vendor calls (yes/no + evidence):
- Chains: SOL, BTC L1, EVM L1+L2, Sui supported *natively* at your required level
- Enforces user presence for every signature (passkeys/session keys)
- Policy engine (allowlist contracts, per‑country gating, spend limits)
- Key export / recovery that doesn’t require your platform
- SDK maturity + docs quality + example apps
- Observability: webhooks, signing receipts, audit logs
- Pricing transparency at 1k/10k/100k users + expected signature volume
- Compliance posture: GDPR readiness, SOC2/ISO, data residency options if needed
- Contracting: can you start without entity? (usually no for enterprise plans)

