# diBoaS V1 Blueprint — Final Specification

**Version:** 1.2 Final  
**Last Updated:** January 2026  
**Status:** Ready for Development  
**Audience:** Technical Team

---

## Table of Contents

1. [Product Definition](#1-product-definition)
2. [Architecture](#2-architecture)
3. [Markets](#3-markets)
4. [Chains](#4-chains)
5. [Wallet System](#5-wallet-system)
6. [V1 Features](#6-v1-features)
7. [Transaction Receipt Specification](#7-transaction-receipt-specification)
8. [Address Book & Anti-Phishing](#8-address-book--anti-phishing)
9. [Transaction State Machine](#9-transaction-state-machine)
10. [US User Acknowledgment Screens](#10-us-user-acknowledgment-screens)
11. [Kill Switches](#11-kill-switches)
12. [Rate Limiting & Abuse Controls](#12-rate-limiting--abuse-controls)
13. [Support & Disputes](#13-support--disputes)
14. [Data Privacy & GDPR](#14-data-privacy--gdpr)
15. [Tech Stack](#15-tech-stack)
16. [User Flows](#16-user-flows)
17. [Build Timeline](#17-build-timeline)
18. [Monitoring & Operations](#18-monitoring--operations)
19. [Corporate Structure](#19-corporate-structure)
20. [Revenue Model](#20-revenue-model)
21. [Decentralization Roadmap](#21-decentralization-roadmap)
22. [V2+ Deferred Features](#22-v2-deferred-features)
23. [Success Criteria](#23-success-criteria)
24. [Risk Register](#24-risk-register)
25. [Appendices](#appendices)

---

## 1. Product Definition

### 1.1 What It Is

A **non-custodial orchestration interface** that connects users to crypto payments through a Web2-simple UX.

### 1.2 What It Is Not

- Not a bank
- Not a broker
- Not a custodian
- Not a DeFi protocol
- Not an investment adviser
- Not a money transmitter (by design)

### 1.3 Core Principles (Non-Negotiable)

| Principle | Implementation | Verification |
|-----------|----------------|--------------|
| **Never retain funds** | All assets stay in user's non-custodial wallet | Audit wallet flows |
| **Never touch fiat** | On/off-ramps handled by licensed partners | No fiat APIs in codebase |
| **Never access keys** | MPC wallet via Privy — platform never sees full key | Key architecture review |
| **Never auto-sign** | User explicitly approves every transaction | UX review all flows |
| **Never hide fees** | Full breakdown shown before every action | Receipt spec compliance |

**Critical:** Violation of any principle converts the platform into a regulated financial service requiring licensing.

### 1.4 V1 Scope Statement

**V1 is payments-first.** The platform enables:
- Deposit (fiat → crypto via partner)
- Send/receive (on-chain transfers)
- Withdraw (crypto → fiat via partner)

**V1 does NOT include:**
- DeFi yield strategies
- RWA (Real World Assets)
- Trading/swaps as a primary feature
- B2B treasury management

---

## 2. Architecture

### 2.1 Layer Model

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
│   Email/Social Login → "Cash" + "Portfolio" Dashboard           │
│                     [BUILD: Custom UI]                          │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATION LAYER                        │
│   Quote Engine → Fee Calculator → Route Optimizer → Simulator   │
│                     [BUILD: Custom Logic]                       │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                          │
│   Privy (Wallets) | Onramper (Ramps) | LI.FI (Routing)         │
│                     [INTEGRATE: Partner SDKs]                   │
└─────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BLOCKCHAIN LAYER                           │
│                    Arbitrum | Solana                            │
│                     [CONNECT: RPC/APIs]                         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Build vs Integrate Matrix

| Component | Approach | Tool/Method |
|-----------|----------|-------------|
| Frontend UI | Build | Next.js + React |
| Auth/Wallet | Integrate | Privy SDK |
| Quote Engine | Build | Custom logic using LI.FI quotes |
| Fee Calculator | Build | Custom aggregation |
| Route Optimizer | Integrate + Build | LI.FI SDK + custom selection logic |
| Transaction Simulator | Integrate | Tenderly API |
| On/Off-Ramp | Integrate | Onramper widget |
| Blockchain Data | Integrate | Alchemy API |
| Price Feeds | Integrate | CoinGecko API |

### 2.3 Orchestration Responsibilities (V1)

The orchestration layer is deterministic "plumbing," not a decision-maker. It must remain transparent, auditable, and user-controlled.

**Routing Policy (V1):**
- Same-chain routes are always preferred when possible
- Cross-chain routes are offered only when the user has enabled **Cross-chain routing** in Settings (default: OFF)
- For **USDC** transfers between chains that support Circle's CCTP, prefer **CCTP burn/mint** routes over liquidity bridges when cost/time is comparable (lower trust assumptions)
- If CCTP is unavailable or degraded, fall back to an allowlisted bridge route (with explicit bridge risk + waiting states)
- Never auto-adjust slippage upward without explicit user action

**Fee Policy (V1):**
- Every fee must be itemized as a separate line item (network, bridge, swap, paymaster convenience fee, on/off-ramp fees where applicable)
- Quotes must include an expiry timer; expired quotes require refresh before signing

**Observability Policy (V1):**
- Every route has a typed result (success, delayed, failed) and a human-readable reason code
- Bridge operations must expose intermediate states (e.g., `BRIDGE_WAITING`) and estimated times

---

## 3. Markets

### 3.1 Launch Markets Summary

| Market | Status | Risk Assessment |
|--------|--------|-----------------|
| **EU** | ✅ Launch | Manageable, uncertain — MiCA interpretation evolving |
| **Brazil** | ✅ Launch | Low–medium, evolving — BCB framework implementing |
| **US** | ⚠️ Launch (calculated risk) | Medium–high — mitigations reduce but don't eliminate risk |
| **UK** | 🚫 Geo-blocked | Too high — criminal liability for financial promotions |

**Note:** Risk labels are qualitative. Treat them as living assessments tied to concrete triggers (see Section 18 and Section 24).

### 3.2 EU Requirements

**Regulatory Context:**
- MiCA (Markets in Crypto-Assets) fully effective mid-2024
- Non-custodial interface exemption exists but interpretation unclear
- ESMA guidance evolving

**V1 Requirements:**
- [ ] Terms of Service (English + local languages as needed)
- [ ] GDPR compliance / Data Protection Impact Assessment
- [ ] Cookie consent implementation
- [ ] Data Processing Agreements with all vendors
- [ ] EU corporate structure recommended (not required for V1)

**Monitoring:**
- Track ESMA guidance on "fully decentralized" interpretation
- Monitor enforcement actions against similar platforms
- Prepare CASP application materials as contingency

### 3.3 Brazil Requirements

**Regulatory Context:**
- Law 14,478/2022 (Virtual Asset Law)
- BCB Resolutions 519-521 effective **February 2, 2026**
- VASP authorization framework being implemented
- Enhanced AML/CFT controls including self-hosted wallet identification

**V1 Requirements:**
- [ ] PT-BR Terms of Service
- [ ] PT-BR ToS must explicitly name the licensed partner processing PIX
- [ ] User acknowledgment of Brazilian tax obligations (IN RFB 1888)
- [ ] On-ramp partners verified as BCB-authorized

**Brazil Ops Checklist (Compliance Evidence):**
- [ ] Store partner compliance proof: provider name + authorization evidence
- [ ] Date-stamped screenshots/docs/contracts
- [ ] Refresh quarterly
- [ ] Maintain in dedicated compliance folder

**Brazil Reporting & Deadlines (Partner Risk):**
- Track BCB reporting cadence starting **May 2026** (partners may be required to report by the 5th business day)
- Track SPSAV/VASP transition deadlines (commonly reported as **Oct 30, 2026**) as a partner continuity risk; require written partner plan

**Compliance Passthrough (Partner Integration):**
- Store and forward partner-issued reference IDs (e.g., on-ramp KYC session ID, transaction ID)
- Forward to off-ramp partner when required by their compliance
- **Do NOT store raw KYC data** — only partner reference IDs + timestamps
- This enables Travel Rule compliance without becoming a KYC processor

**Monitoring:**
- Track BCB enforcement posture
- Monitor VASP registration requirements
- Maintain relationship with local legal counsel

### 3.4 US Requirements

**Regulatory Context:**
- FinCEN 2019 guidance: software providers exempt from MSB registration
- DOJ April 2025 memo signaled deprioritization of certain "regulation by prosecution" approaches (policy can change)
- State-by-state variation (avoid NY BitLicense)
- SEC closed Uniswap investigation (Feb 2025) — positive precedent

**V1 Requirements:**
- [ ] EU-based corporate structure (reduces US jurisdictional hooks)
- [ ] No US subsidiary, bank accounts, or employees
- [ ] Optional: soft geo-fence high-risk states (e.g., NY) for V1 via config toggles
- [ ] US-specific Terms of Service addendum
- [ ] Three acknowledgment screens before first transaction (see Section 10)
- [ ] Arbitration clause and class action waiver
- [ ] Forum selection (EU governing law)

**Mitigation Strategy:**
- Kill switch ready to geo-block US within 24 hours if enforcement action
- Maintain audit-grade logs for route decisions
- Document compliance posture

**Monitoring:**
- Track enforcement actions against DeFi frontends
- Monitor state money transmitter guidance changes
- Watch for federal stablecoin legislation

### 3.5 UK Status

**Status:** Geo-blocked (do not serve)

**Reason:** Financial promotions regime (FSMA s.21) creates **criminal liability** (not civil) for marketing crypto services to UK consumers without FCA authorization.

**Monitoring:**
- Track FCA "cryptoasset gateway" timeline (opens as early as September 2026)
- Monitor POATRs (Property (Digital Assets etc) Act regulations, in force Jan 2026)
- Re-evaluate UK market entry for V2+ if regulatory clarity improves
- Would require FCA-authorized partner for any UK exposure

### 3.6 Geo-Blocking Implementation

**Mandatory Blocks:**
- United Kingdom (GB)
- OFAC sanctioned countries: Iran (IR), Cuba (CU), North Korea (KP), Syria (SY)
- Sanctioned regions: Crimea, Donetsk, Luhansk

**Implementation:**
- Use Vercel Edge geolocation (built-in)
- Reference official OFAC SDN list — do NOT self-maintain country lists
- Implement VPN detection as best-effort friction (not guaranteed protection)
- Show clear message explaining geographic restriction
- Log blocked access attempts (IP, country, timestamp)

**Block Message Template:**
```
This service is not available in your region.

For regulatory reasons, [Platform Name] cannot serve users in [Country].
This may change in the future as regulations evolve.
```

---

## 4. Chains

### 4.1 V1 Chain Support

| Chain | Status | Tier | User Promise |
|-------|--------|------|--------------|
| **Arbitrum** | ✅ V1 | Tier 1 | One confirmation in most cases |
| **Solana** | ✅ V1 | Tier 2 | Fast & Simple (1-2 signatures) |

**V1 = Two chains only.** Prove the core flow works before expanding.

### 4.2 Tier Definitions

**Tier 1: Full Abstraction (Arbitrum)**
- ERC-4337 smart account support
- Circle Paymaster for USDC gas (user pays ~10% markup, shown as line item)
- Batched transactions where possible
- One confirmation in most cases
- **Caveat:** Occasionally two confirmations if paymaster unavailable or route requires
- **Caveat:** Cross-chain routes may add waiting states; user still signs once but settlement time varies

**Tier 2: Low-Friction Native (Solana)**
- Native speed and low fees (~$0.001-0.01)
- Usually 1-2 signatures depending on flow
- No standardized ERC-4337-style batching; limited bundling may be available depending on wallets/SDKs
- Priority fees for reliability
- Sub-second finality

### 4.3 Chain Configuration

All chain parameters and token addresses must live in configuration files, not hardcoded in code or documentation.

**Config Files (Examples):**
- `config/chains.json` (RPC endpoints, chain IDs, explorers, native token symbols)
- `config/tokens.json` (stablecoin contract addresses/mints by chain, decimals, symbols)
- `config/routes.json` (enabled routes/bridges, per-market allowlists)
- `config/features.json` (kill switches, geoblocks, feature flags)

**V1 Defaults:**
- Chains enabled: Arbitrum, Solana
- Primary stablecoin: USDC
- Secondary stablecoin: USDT (not default for routing; conversion is explicit)

**Important:** Token addresses and RPC endpoints change (upgrades, migrations, provider swaps). Treat config as the source of truth and log all config changes (Section 11, Section 18).

---

## 5. Wallet System

### 5.1 Wallet Abstraction

Users see "accounts," not wallets or chains.

| View | What User Sees | Data Source |
|------|----------------|-------------|
| **Cash** | Single balance in €/$/R$ | USDC + USDT aggregated across all chain wallets |
| **Portfolio** | Asset list + total fiat value | All non-stablecoin tokens across all chain wallets |

**Design Principle:** Chains appear as small badges/metadata, not primary navigation. Users think in terms of money, not infrastructure.

### 5.2 Wallet Creation (Lazy)

**V1 Wallet Creation:**

| Event | Action |
|-------|--------|
| User signs up | Create EVM (Arbitrum) wallet only |
| User first interacts with Solana | Create Solana wallet on-demand |

"First interaction" triggers:
- User clicks "Receive on Solana"
- User selects Solana as deposit destination
- User receives Solana-based assets

**Note:** BTC, SUI, TRON wallet creation logic is deferred to V2. Do not implement in V1.

### 5.3 Stablecoin Policy

| Stablecoin | V1 Status | Treatment |
|------------|-----------|-----------|
| **USDC** | Primary | Default for all flows, preferred routing |
| **USDT** | Supported | Shown in Cash balance |
| **Others** | Not in V1 | DAI, PYUSD, etc. deferred to V2 |

**USDT Handling:**
- Display USDT in Cash balance
- When user sends and only has USDT, offer conversion to USDC
- **Conversion must be explicit step in receipt:**
  - "Includes swap: USDT → USDC"
  - "Estimated slippage: X%"
  - "Swap fee: $X.XX"
- User must acknowledge conversion before proceeding

**Display Rule:** Always show chain + issuer in detail views:
- ✅ "USDC (Arbitrum)"
- ✅ "USDT (Solana)"
- ❌ "USDC" (ambiguous)

### 5.4 Key Export (Mandatory)

Users must be able to export their private keys at any time.

**Implementation:**
- Settings → Security → Export Keys
- Require re-authentication before export
- Show warning about security implications
- Provide keys in standard format (hex for EVM, base58 for Solana)
- Log export event (for support purposes)

**Rationale:** Without export capability, you are a custodian regardless of architecture. Key export is a non-negotiable crypto principle.

### 5.5 Account Recovery

**Primary:** Privy account recovery (email/social re-authentication)

**Secondary Options (V1.5):**
- Passkey backup
- Device re-binding flow
- Social recovery (future)

---

## 6. V1 Features

### 6.1 Core Features (Must Ship)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Onboarding** | Email/social login via Privy, wallet created automatically, no seed phrase shown | P0 |
| **Passkeys/WebAuthn** | For login and signing where supported, fallback to OTP | P0 |
| **Dashboard** | Cash + Portfolio views, fiat conversion, chain badges | P0 |
| **Deposit** | On-ramp via Onramper widget (PIX/SEPA/ACH) | P0 |
| **Send** | Enter recipient + amount → see full receipt → confirm & sign | P0 |
| **Cross-chain routing (opt-in)** | Allow cross-chain routes for sends (default OFF); same-chain routing always available | P0 |
| **Receive** | QR code + address display, chain-specific | P0 |
| **Withdraw** | Off-ramp via Onramper widget | P0 |
| **Address Book** | Usernames, contacts, saved addresses with anti-phishing | P0 |
| **Transaction History** | Full state machine with human-readable status | P0 |
| **Fee Transparency** | Complete breakdown before every action | P0 |
| **Error Handling** | Human-readable failures, retry paths | P0 |
| **Slippage Protection** | Default settings, user-adjustable, warnings | P0 |

**Cross-chain Default:** Cross-chain routing is **OFF by default** in V1. Users must explicitly enable it in Settings. When OFF, the app will only propose same-chain routes.

### 6.2 Safety Features (Must Ship)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Transaction Preview** | What leaves, what arrives, contracts touched | P0 |
| **Pre-sign Simulation** | Tenderly check, disable confirm if likely to fail | P0 |
| **Scam Warnings** | New address alerts, suspicious token flags | P0 |
| **Kill Switches** | Config-based disable for route/bridge/chain/token/jurisdiction | P0 |
| **Rate/Slippage Display** | Exchange rate, max slippage, price impact on every swap | P0 |
| **Quote Expiry** | Countdown timer on all quotes (15-30 seconds) | P0 |
| **Rate Limiting** | Abuse prevention on all user actions | P0 |

### 6.3 Compliance Features (Must Ship)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Geo-blocking** | UK + sanctioned countries blocked | P0 |
| **US Acknowledgments** | 3 screens before first transaction | P0 |
| **Terms of Service** | EU, US, Brazil versions | P0 |
| **Bridge Warnings** | Disclosure of cross-chain risks | P0 |
| **Compliance Passthrough** | Partner reference ID forwarding | P1 |

### 6.4 B2B Minimum (Should Ship)

| Feature | Description | Priority |
|---------|-------------|----------|
| **Payment Requests** | Generate shareable link/QR | P1 |
| **Invoice Metadata** | Optional: amount, memo, expiry | P2 |
| **Webhooks** | "Paid" status notification | P2 |

### 6.5 NOT in V1 (Explicit Exclusions)

| Feature | Reason | Timeline |
|---------|--------|----------|
| DeFi yield strategies | Regulatory complexity, scope creep | V2 |
| RWA access | Securities law implications | V3+ |
| BTC/SUI/TRON support | Different wallet infrastructure | V2 |
| UK market | Criminal liability | TBD |
| Multi-sig B2B treasury | Complexity | V2 |
| Advanced trading | Not payments-first | V3+ |
| NFT features | Scope creep | V2+ |
| Social features | Scope creep | V2+ |
| Risk labels on yield | No yield features in V1 | V2 |

---

## 7. Transaction Receipt Specification

### 7.1 Receipt Principles

Every transaction must show a complete receipt before user signature. The receipt is the primary trust mechanism.

**Requirements:**
- All fees itemized separately
- No hidden charges
- Clear indication of what user sends vs. what recipient receives
- Time-bound quotes with visible countdown

### 7.2 Standard Send Receipt (Same-Chain)

```
┌─────────────────────────────────────────────────┐
│              TRANSACTION DETAILS                │
├─────────────────────────────────────────────────┤
│                                                 │
│  You send:          $50.00 USDC                 │
│  From:              Arbitrum                    │
│                                                 │
│  Recipient:         @maria_costa                │
│  To:                Arbitrum                    │
│  Address:           0x7a3B...9f2D               │
│                                                 │
├─────────────────────────────────────────────────┤
│  FEES                                           │
│  Network fee:                        -$0.08     │
├─────────────────────────────────────────────────┤
│  They receive:                       $49.92     │
│                                                 │
│  ⏱️ Quote valid for: 0:15                       │
│                                                 │
│         [Cancel]    [Confirm & Sign]            │
└─────────────────────────────────────────────────┘
```

### 7.3 Cross-Chain Send Receipt (With Bridge)

```
┌─────────────────────────────────────────────────┐
│              TRANSACTION DETAILS                │
├─────────────────────────────────────────────────┤
│                                                 │
│  You send:          $50.00 USDC                 │
│  From:              Arbitrum                    │
│                                                 │
│  Recipient:         @pedro_silva                │
│  To:                Solana                      │
│  Address:           7xKX...m4Qp                 │
│                                                 │
├─────────────────────────────────────────────────┤
│  CONVERSION                                     │
│  Exchange rate:     1 USDC = 1.0002 USDC        │
│  Price impact:      <0.01%                      │
│  Max slippage:      0.5%                        │
│                                                 │
├─────────────────────────────────────────────────┤
│  FEES                                           │
│  Network fee:                        -$0.08     │
│  Bridge fee (CCTP):                  -$0.25     │
│  Total fees:                         -$0.33     │
│                                                 │
├─────────────────────────────────────────────────┤
│  They receive:                      ~$49.67     │
│  Estimated time:     2-5 minutes                │
│                                                 │
│  ⚠️ This transaction uses a bridge to move      │
│     funds between chains. Bridge transactions   │
│     take longer and carry smart contract risk.  │
│                                                 │
│  ⏱️ Quote valid for: 0:30                       │
│                                                 │
│  ▼ Route details                                │
│                                                 │
│         [Cancel]    [Confirm & Sign]            │
└─────────────────────────────────────────────────┘
```

### 7.4 Receipt with USDT→USDC Conversion

```
┌─────────────────────────────────────────────────┐
│              TRANSACTION DETAILS                │
├─────────────────────────────────────────────────┤
│                                                 │
│  You send:          $50.00 (from USDT balance)  │
│  From:              Arbitrum                    │
│                                                 │
│  Recipient:         @maria_costa                │
│  To:                Arbitrum                    │
│                                                 │
├─────────────────────────────────────────────────┤
│  CONVERSION (Required)                          │
│  Swap:              USDT → USDC                 │
│  Rate:              1 USDT = 0.9998 USDC        │
│  Slippage:          0.02%                       │
│  Swap fee:                           -$0.05     │
│                                                 │
├─────────────────────────────────────────────────┤
│  FEES                                           │
│  Network fee:                        -$0.08     │
│  Total fees:                         -$0.13     │
│                                                 │
├─────────────────────────────────────────────────┤
│  They receive:                      ~$49.86     │
│                                                 │
│  ⏱️ Quote valid for: 0:15                       │
│                                                 │
│         [Cancel]    [Confirm & Sign]            │
└─────────────────────────────────────────────────┘
```

### 7.5 Receipt with Circle Paymaster (USDC Gas)

When using Circle Paymaster for gas payment:

```
┌─────────────────────────────────────────────────┐
│  FEES                                           │
│  Network fee (base):                 -$0.07     │
│  Paymaster convenience fee (~10%):   -$0.01     │
│  Total gas (paid in USDC):           -$0.08     │
└─────────────────────────────────────────────────┘
```

**Rule:** Paymaster markup must be a **named line item**, not hidden in "network fee."

### 7.6 Route Details (Expandable)

When user clicks "Route details":

```
┌─────────────────────────────────────────────────┐
│  ROUTE DETAILS                                  │
├─────────────────────────────────────────────────┤
│                                                 │
│  Route provider:    LI.FI                       │
│  Bridge:            CCTP (Circle)               │
│  Path:              Arbitrum USDC → CCTP        │
│                     → Solana USDC               │
│                                                 │
│  Execution bounds:                              │
│  • Best case:       $49.70 received             │
│  • Worst case:      $49.45 received (0.5% slip) │
│                                                 │
│  Why this route:                                │
│  "Lowest total fees among available routes      │
│   with acceptable liquidity and reliability."   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 7.7 Receipt Requirements Checklist

Every receipt must include:

- [ ] Amount sent (with token symbol and chain)
- [ ] Recipient identifier (username or truncated address)
- [ ] Destination chain
- [ ] Exchange rate (if any conversion/swap)
- [ ] Price impact percentage (if any swap)
- [ ] Max slippage setting
- [ ] Network fee (itemized)
- [ ] Bridge fee (itemized, if cross-chain)
- [ ] Swap fee (itemized, if conversion)
- [ ] Paymaster fee (itemized, if using USDC gas)
- [ ] Total fees
- [ ] Final amount received (with ~ if variable)
- [ ] Estimated time (if not instant)
- [ ] Quote expiry countdown
- [ ] Risk warnings (if bridge, new recipient, or high slippage)
- [ ] Route details (expandable)

---

## 8. Address Book & Anti-Phishing

### 8.1 New Recipient Verification Flow

First send to ANY new recipient requires full-screen verification:

```
┌─────────────────────────────────────────────────┐
│  ⚠️  NEW RECIPIENT — PLEASE VERIFY              │
├─────────────────────────────────────────────────┤
│                                                 │
│  You're sending to an address you haven't       │
│  used before. Please verify carefully.          │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  Sending to:    @maria_costa            │   │
│  │  Address:       0x7a3B...9f2D           │   │
│  │  Chain:         Arbitrum                │   │
│  │  Amount:        $50.00 USDC             │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ⚠️  Crypto transactions are IRREVERSIBLE       │
│                                                 │
│  If you send to the wrong address, your funds   │
│  cannot be recovered. Please double-check:      │
│                                                 │
│  • Is this the correct person/address?          │
│  • Is this the correct chain?                   │
│  • Is the amount correct?                       │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ □ I have verified this is the correct   │   │
│  │   recipient and understand this         │   │
│  │   transaction cannot be reversed        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│        [Cancel]    [Continue to Confirm]        │
└─────────────────────────────────────────────────┘
```

### 8.2 Anti-Phishing Rules

| Rule | Implementation | Trigger |
|------|----------------|---------|
| **Similar username warning** | Levenshtein distance check | Alert if new recipient resembles existing contact (maria vs mariaa vs mar1a) |
| **New address highlight** | Yellow badge | First-time addresses in address book |
| **Trusted contact designation** | Green checkmark | After 3+ successful sends, option to mark as "Trusted" |
| **Address format validation** | Regex + checksum | Verify address matches expected format for selected chain |
| **Checksum verification** | EIP-55 | For EVM addresses, verify mixed-case checksum |
| **Known scam address check** | External database | Check against known scam addresses (optional V1.5) |

### 8.3 Address Book Features

**Core Features:**
- Save contacts with custom display names
- Multiple addresses per contact (one per chain)
- Recent recipients list (last 10)
- Search by name or address fragment
- Edit/delete contacts

**Security Features:**
- New contact requires confirmation
- Editing address requires re-confirmation
- Delete requires confirmation
- Export contacts (backup)
- Import contacts (with verification)

### 8.4 Similar Username Detection

```javascript
// Trigger warning if:
// - Levenshtein distance <= 2 from existing contact
// - Contains common substitutions (o→0, i→1, l→1)
// - Matches existing contact with added/removed characters

// Examples that should trigger warnings:
// "maria" vs "mariaa" (added character)
// "maria" vs "mar1a" (substitution)
// "maria" vs "marla" (typo)
```

---

## 9. Transaction State Machine

### 9.1 State Diagram

```
                    ┌──────────┐
                    │ CREATED  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
              ┌─────┤SIMULATING├─────┐
              │     └────┬─────┘     │
              │          │           │
     ┌────────▼────────┐ │  ┌────────▼────────┐
     │SIMULATION_FAILED│ │  │   (continue)    │
     └────────┬────────┘ │  └─────────────────┘
              │          │
              │     ┌────▼─────────────┐
              │     │AWAITING_SIGNATURE│
              │     └────┬──────┬──────┘
              │          │      │
              │          │  ┌───▼──────────────┐
              │          │  │SIGNATURE_TIMEOUT │
              │          │  └───┬──────────────┘
              │          │      │
              │     ┌────▼─────┐│
              │     │  SIGNED  ││
              │     └────┬─────┘│
              │          │      │
              │     ┌────▼─────┐│
              │     │SUBMITTED │◄┘
              │     └────┬─────┘
              │          │
     ┌────────▼────────┐ │
     │SUBMISSION_FAILED│ │
     └────────┬────────┘ │
              │          │
              │     ┌────▼─────┐
              │     │ PENDING  │
              │     └────┬─────┘
              │          │
              │     ┌────▼──────────┐
              │     │BRIDGE_WAITING │ (if cross-chain)
              │     └────┬──────────┘
              │          │
              │     ┌────▼─────┐
              │     │CONFIRMING│
              │     └────┬─────┘
              │          │
     ┌────────▼────────┐ │
     │EXECUTION_FAILED │ │
     └────────┬────────┘ │
              │          │
              │     ┌────▼─────┐
              │     │CONFIRMED │
              │     └────┬─────┘
              │          │
              │     ┌────▼─────┐
              └────►│ COMPLETE │
                    └──────────┘
```

### 9.2 State Descriptions

| State | Description | User Action Available |
|-------|-------------|----------------------|
| `CREATED` | Transaction initialized | Cancel |
| `SIMULATING` | Running Tenderly simulation | Wait |
| `SIMULATION_FAILED` | Simulation predicted failure | Retry with different params, Cancel |
| `AWAITING_SIGNATURE` | Waiting for user signature | Sign, Cancel |
| `SIGNATURE_TIMEOUT` | User didn't sign in time | Retry, Cancel |
| `SIGNED` | User signed, preparing submission | Wait |
| `SUBMITTED` | Sent to blockchain | Wait |
| `SUBMISSION_FAILED` | Failed to submit | Retry, Cancel |
| `PENDING` | Awaiting confirmation | Wait |
| `BRIDGE_WAITING` | Cross-chain: awaiting bridge | Wait |
| `CONFIRMING` | Transaction in block, awaiting finality | Wait |
| `EXECUTION_FAILED` | Transaction reverted | Retry, Contact Support |
| `CONFIRMED` | Transaction confirmed | View Details |
| `COMPLETE` | Fully complete | View Details |

### 9.3 Human-Readable Error Messages

| Error Type | Technical Cause | User Message |
|------------|-----------------|--------------|
| **Slippage exceeded** | Price moved beyond tolerance | "Price changed by X% while processing. This exceeded your slippage tolerance of Y%. [Retry with updated quote]" |
| **Insufficient funds** | Balance < amount + fees | "You need $X.XX more to complete this transaction. Your balance: $Y.YY. Required: $Z.ZZ (including fees). [Add funds] [Reduce amount]" |
| **Insufficient gas** | No native token for gas and paymaster unavailable | "This transaction requires ETH for gas fees. USDC gas payment is temporarily unavailable. You need ~$X.XX in ETH. [Buy ETH]" |
| **Bridge congestion** | High bridge queue | "The bridge is experiencing high traffic. Your transaction is queued. Estimated wait: ~X minutes. Your funds are safe and will arrive once the bridge processes your transaction." |
| **Bridge timeout** | Bridge took too long | "Your bridge transaction is taking longer than expected. This sometimes happens during high traffic. Status: [View on bridge explorer]. If not resolved in 2 hours, [Contact support]." |
| **Simulation failed** | Transaction would revert | "Our simulation indicates this transaction would fail. Common causes: insufficient balance, contract restrictions, or network issues. [Try smaller amount] [Try different route] [Contact support]" |
| **Paymaster unavailable** | Circle Paymaster down | "USDC gas payment is temporarily unavailable. You can complete this transaction using ETH for gas instead. Required: ~$X.XX in ETH. [Continue with ETH] [Cancel]" |
| **Rate limit** | Too many requests | "You've made several transactions recently. Please wait X seconds before trying again. This helps protect your account." |
| **Network congestion** | Chain overloaded | "The network is congested. Transaction fees are higher than usual. Current estimate: $X.XX (normally ~$Y.YY). [Proceed anyway] [Wait and retry later]" |
| **Invalid address** | Malformed address | "The recipient address appears to be invalid. Please check for typos or extra characters. [Edit address]" |
| **Wrong chain** | Address format mismatch | "This address looks like a [Solana] address, but you selected [Arbitrum]. Sending to the wrong chain could result in lost funds. [Switch to Solana] [Edit address]" |

### 9.4 Status Display Requirements

Every pending/completed transaction shows:
- Current state with visual progress indicator
- Elapsed time since initiated
- Estimated remaining time (if applicable)
- Transaction hash with clickable explorer link
- Retry button (if failed and retryable)
- "Need help?" button → Support flow
- Details expandable (full receipt, route info)

---

## 10. US User Acknowledgment Screens

### 10.1 Overview

Before first transaction, US users must acknowledge three screens. These cannot be skipped and require explicit checkbox confirmation.

**Detection:** User identified as US-based via:
1. IP geolocation (primary)
2. Self-declaration during signup (if IP inconclusive)

### 10.2 Screen 1: Regulatory Disclosure

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPORTANT INFORMATION                        │
│                    For Users in the United States               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Platform Name] provides software tools for interacting        │
│  with blockchain networks. Please read carefully:               │
│                                                                 │
│  • This platform is not registered as a broker-dealer,          │
│    national securities exchange, or investment adviser with     │
│    the U.S. Securities and Exchange Commission (SEC).           │
│                                                                 │
│  • This platform does not provide regulated brokerage or        │
│    investment advisory services.                                │
│                                                                 │
│  • This platform is not a bank. Funds are not FDIC/NCUA-insured.│
│                                                                 │
│  [ ] I understand                                               │
│  [Continue]                                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Note:** Wording avoids absolute claims like "not registered with FinCEN" which could become false if registration is later obtained.

### 10.3 Screen 2: No Investment Advice

```
┌─────────────────────────────────────────────────────────────────┐
│                    NO INVESTMENT ADVICE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Platform Name] does not provide investment, financial,        │
│  tax, or legal advice of any kind.                              │
│                                                                 │
│  • Any information displayed about protocols, tokens,           │
│    exchange rates, or market conditions is for                  │
│    informational purposes only.                                 │
│                                                                 │
│  • This information should not be relied upon for making        │
│    financial decisions.                                         │
│                                                                 │
│  • We do not recommend any particular transaction, token,       │
│    protocol, or strategy.                                       │
│                                                                 │
│  • You are solely responsible for:                              │
│    - Your own research and due diligence                        │
│    - Evaluating the risks of any transaction                    │
│    - Understanding the tax implications in your jurisdiction    │
│    - Making your own financial decisions                        │
│                                                                 │
│  • Consider consulting with qualified financial, tax, and       │
│    legal professionals before making significant transactions.  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ □ I understand that this platform does not provide      │   │
│  │   financial advice, and I am responsible for my own     │   │
│  │   investment decisions                                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                         [Continue]                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.4 Screen 3: Self-Custody Confirmation

```
┌─────────────────────────────────────────────────────────────────┐
│                    SELF-CUSTODY WALLET                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You are using a self-custody wallet. This means:               │
│                                                                 │
│  ✓ You control your own wallet and private keys                 │
│  ✓ Only you can authorize transactions                          │
│  ✓ Only you can access your funds                               │
│                                                                 │
│  ⚠️ IMPORTANT: If you lose access to your account,              │
│     we CANNOT recover your funds.                               │
│                                                                 │
│  Unlike a bank, there is no customer service that can           │
│  reverse transactions or restore access to lost funds.          │
│  Blockchain transactions are permanent and irreversible.        │
│                                                                 │
│  We strongly recommend:                                         │
│  • Setting up account recovery options in Settings              │
│  • Keeping your login credentials secure and private            │
│  • Exporting and safely storing your private keys               │
│  • Never sharing your keys or recovery phrases with anyone      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ □ I understand that I control my own wallet, and if I   │   │
│  │   lose access, my funds cannot be recovered by          │   │
│  │   [Platform Name] or anyone else                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                    [Start Using Platform]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.5 Implementation Notes

- Store acknowledgment timestamp and version for each user
- If ToS/acknowledgments are updated, re-prompt users
- Log acknowledgments for compliance records
- Non-US users skip these screens (but see regional ToS at signup)

---

## 11. Kill Switches

### 11.1 Purpose

Kill switches function as **security + compliance + operational** controls. They enable rapid response to:
- Security incidents (bridge hacks, exploits)
- Regulatory developments (enforcement actions, new guidance)
- Partner issues (downtime, compliance failures)
- Operational problems (high failure rates, congestion)

### 11.2 Scope Levels

| Level | Examples | Use Case |
|-------|----------|----------|
| **Route** | `arbitrum_to_solana`, `solana_to_arbitrum` | Disable specific cross-chain paths |
| **Bridge** | `cctp`, `wormhole`, `stargate`, `across` | Disable if bridge compromised |
| **Chain** | `arbitrum`, `solana` | Disable entire chain if needed |
| **Token** | `0x...` (specific address) | Disable if token flagged/malicious |
| **Feature** | `cross_chain`, `off_ramp`, `on_ramp` | Disable feature category |
| **Jurisdiction** | `US`, `BR`, `GB`, `NY` | Geo-block region or state |
| **Provider** | `onramper`, `lifi`, `tenderly` | Disable specific integration |

### 11.3 Configuration Schema

```json
{
  "version": "1.0",
  "last_updated": "2026-01-15T14:30:00Z",
  "updated_by": "admin@diboaS.com",
  "change_reason": "Routine update",
  
  "routes": {
    "arbitrum_to_solana": { 
      "enabled": true,
      "disabled_reason": null,
      "disabled_at": null
    },
    "solana_to_arbitrum": { 
      "enabled": true,
      "disabled_reason": null,
      "disabled_at": null
    }
  },
  
  "bridges": {
    "cctp": { 
      "enabled": true,
      "preferred": true,
      "health_check_url": "https://status.circle.com",
      "auto_disable_on_incident": true
    },
    "wormhole": { 
      "enabled": true,
      "preferred": false,
      "health_check_url": "https://status.wormhole.com",
      "auto_disable_on_incident": true
    }
  },
  
  "chains": {
    "arbitrum": { "enabled": true },
    "solana": { "enabled": true },
    "ethereum": { "enabled": false, "disabled_reason": "Not in V1 scope" }
  },
  
  "tokens": {
    "blocked": [],
    "auto_block_on_scam_report": true
  },
  
  "features": {
    "cross_chain": { "enabled": true, "default_user_setting": false },
    "on_ramp": { "enabled": true },
    "off_ramp": { "enabled": true },
    "usdc_gas": { "enabled": true }
  },
  
  "geo_block": {
    "enabled": true,
    "blocked_countries": ["GB", "IR", "CU", "KP", "SY"],
    "blocked_regions": ["Crimea", "Donetsk", "Luhansk"],
    "soft_blocked_states": ["NY"],
    "vpn_detection": true
  },
  
  "providers": {
    "onramper": { "enabled": true },
    "lifi": { "enabled": true },
    "tenderly": { "enabled": true },
    "circle_paymaster": { "enabled": true }
  }
}
```

### 11.4 Operational Requirements

| Requirement | Specification |
|-------------|---------------|
| **Change latency** | <5 minutes from config change to production effect |
| **No redeploy** | Changes via config file or admin panel, not code deployment |
| **Response time target** | <1 hour to disable any component after decision |
| **Logging** | All changes logged with timestamp, user, and reason |
| **Alerting** | Team notified immediately when any kill switch activated |
| **Audit trail** | Immutable log of all changes (for compliance evidence) |

### 11.5 Two-Person Rule (When Team > 1)

When team size exceeds one operator:
- Production kill switch changes require approval from second team member
- Exception: Emergency disables can be single-person with mandatory post-hoc review within 24 hours
- Signed change logs (at minimum, authenticated admin actions)

### 11.6 Kill Switch Triggers

| Scenario | Action | Response Time |
|----------|--------|---------------|
| Bridge hack reported | Disable that bridge | <1 hour |
| Regulatory enforcement in jurisdiction | Geo-block that jurisdiction | <4 hours |
| Partner (Onramper) goes down | Disable on/off-ramp feature | <1 hour |
| Chain experiencing issues | Disable that chain | <1 hour |
| Malicious token detected | Add to blocked tokens | <30 minutes |
| Route failure rate >10% | Disable that route | <1 hour |
| Security vulnerability disclosed | Assess and disable if needed | <2 hours |

---

## 12. Rate Limiting & Abuse Controls

### 12.1 Purpose

Prevent abuse including: spam payments, brute-force username enumeration, bot-driven deposits, and velocity-based fraud.

### 12.2 Rate Limits by Action

| Action | Limit | Window | Scope |
|--------|-------|--------|-------|
| **Login attempts** | 5 | 15 minutes | Per email |
| **OTP requests** | 3 | 10 minutes | Per email |
| **Send transactions** | 20 | 1 hour | Per account |
| **Address book additions** | 10 | 1 hour | Per account |
| **Quote requests** | 60 | 1 minute | Per account |
| **On-ramp initiations** | 5 | 1 hour | Per account |
| **Off-ramp initiations** | 5 | 1 hour | Per account |
| **API requests (general)** | 100 | 1 minute | Per account |

### 12.3 Velocity Checks

| Check | Threshold | Action |
|-------|-----------|--------|
| **Daily send volume** | >$10,000 | Require additional confirmation |
| **Single transaction size** | >$5,000 | Require additional confirmation |
| **New device + large transaction** | >$1,000 | Require email verification |
| **Multiple recipients in short time** | >5 unique in 10 min | Temporary cooldown |
| **Rapid address book changes** | >3 in 5 min | Temporary cooldown |

### 12.4 Bot Detection

**Signup:**
- CAPTCHA after 2 failed attempts
- Device fingerprinting
- Behavioral analysis (typing speed, mouse movement)

**Transaction:**
- Session validation
- Request timing analysis
- Abnormal pattern detection

### 12.5 Response to Violations

| Severity | Response |
|----------|----------|
| **Soft limit hit** | Show warning, allow retry after cooldown |
| **Hard limit hit** | Block action, require wait period |
| **Pattern abuse detected** | Temporary account suspension, manual review |
| **Confirmed malicious** | Permanent block, report to security team |

---

## 13. Support & Disputes

### 13.1 Support Entry Points

| Entry Point | Location | Purpose |
|-------------|----------|---------|
| **Help button** | Dashboard header | General assistance |
| **Transaction help** | Transaction detail view | Transaction-specific issues |
| **Stuck transaction** | Transaction status (pending >10 min) | Troubleshooting |
| **Error screen help** | All error messages | Context-specific assistance |
| **Settings > Help** | Settings menu | FAQ, contact, documentation |

### 13.2 Support Tiers

**Tier 1: Self-Service**
- FAQ / Knowledge base
- Transaction status explanations
- Common error resolutions
- "Why did this happen?" explanations

**Tier 2: Ticket System**
- Email-based support
- Ticket tracking
- Response SLA: 24-48 hours
- Escalation path defined

**Tier 3: Escalation (Partner Issues)**
- On-ramp/off-ramp failures → Onramper support contact
- Bridge issues → Bridge-specific support
- Wallet issues → Privy support
- Clear handoff documentation for users

### 13.3 "Transaction Stuck?" Flow

```
┌─────────────────────────────────────────────────┐
│  YOUR TRANSACTION IS TAKING LONGER THAN USUAL   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Status: PENDING (15 minutes)                   │
│                                                 │
│  This can happen due to:                        │
│  • Network congestion                           │
│  • Bridge processing delays                     │
│  • High transaction volume                      │
│                                                 │
│  Your funds are safe. Here's what you can do:   │
│                                                 │
│  [Check transaction on explorer]                │
│  [View bridge status]                           │
│  [Troubleshooting guide]                        │
│  [Contact support]                              │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 13.4 Dispute Categories

| Category | Owner | Resolution Path |
|----------|-------|-----------------|
| Missing deposit (fiat) | Onramper partner | Escalate to partner with reference ID |
| Missing deposit (crypto) | Self-service | Check explorer, verify address |
| Failed withdrawal | Onramper partner | Escalate to partner |
| Wrong amount received | Internal | Review transaction, identify discrepancy |
| Bridge stuck | Bridge operator | Provide bridge explorer link, escalate if >24h |
| Unauthorized transaction | Security | Immediate account freeze, investigation |

---

## 14. Data Privacy & GDPR

### 14.1 Data Minimization Principles

| Data Type | Collect? | Store? | Rationale |
|-----------|----------|--------|-----------|
| Email | Yes | Yes | Account identification |
| Wallet addresses | Yes | Yes | Transaction functionality |
| Transaction history | Yes | Yes | User feature, support |
| IP address | Yes | Temporary (30 days) | Geo-blocking, abuse prevention |
| KYC data | No | No | Handled by partners only |
| Full addresses | Only if user saves | Encrypted | Address book feature |
| Device fingerprint | Yes | Hashed only | Abuse prevention |

### 14.2 Data Retention Policy

| Data Type | Retention Period | Deletion Method |
|-----------|------------------|-----------------|
| Account data | Until account deletion + 30 days | Soft delete → hard delete |
| Transaction logs | Up to 7 years where required for legal/compliance purposes; otherwise minimize | Archived, then deleted |
| IP logs | 30 days | Auto-purge |
| Support tickets | 3 years | Anonymization |
| Analytics | 2 years | Aggregated, anonymized |
| Audit logs | Up to 7 years where required for security/compliance; otherwise minimize | Immutable archive |

### 14.3 Data Processing Agreements (DPAs)

**Required with all vendors:**

| Vendor | Data Shared | DPA Required |
|--------|-------------|--------------|
| Privy | Email, wallet addresses, device info | Yes |
| Onramper | Transaction amounts, wallet addresses | Yes |
| LI.FI | Wallet addresses, transaction data | Yes |
| Tenderly | Transaction simulation data | Yes |
| Alchemy | Wallet addresses (public blockchain data) | Yes |
| Vercel | IP addresses, request logs | Yes |

### 14.4 User Rights (GDPR)

| Right | Implementation |
|-------|----------------|
| **Access** | Settings > Privacy > Download my data |
| **Rectification** | Settings > Profile > Edit |
| **Erasure** | Settings > Account > Delete account |
| **Portability** | Export in standard JSON format |
| **Object** | Opt-out of non-essential processing |

### 14.5 Cookie Policy

| Cookie Type | Purpose | Consent Required |
|-------------|---------|------------------|
| Essential | Authentication, security | No |
| Functional | Preferences, settings | No |
| Analytics | Usage understanding | Yes |
| Marketing | None used | N/A |

---

## 15. Tech Stack

### 15.1 Core Stack

| Component | Tool | Purpose | Free Tier Limits |
|-----------|------|---------|------------------|
| **Frontend** | Next.js on Vercel | UI, SSR | 100GB bandwidth |
| **Auth + Wallet** | Privy | MPC wallets, social login | Transaction-based |
| **Blockchain Data** | Alchemy | RPC, indexing | 30M compute units/mo |
| **Price Feeds** | CoinGecko | Fiat conversion | 30 calls/min |
| **On/Off-Ramp** | Onramper | Fiat rails | Revenue share |
| **Routing** | LI.FI | DEX/bridge aggregation | Free SDK |
| **Simulation** | Tenderly | Pre-sign checks | Tenderly Units quota |
| **Gas Abstraction** | Circle Paymaster | USDC gas on Arbitrum | ~10% markup |

### 15.2 Vendor Notes

**Privy:**
- Acquired by Stripe (June 2025)
- Expect stronger reliability and payments integration
- Pricing and terms may change — budget conservatively
- Does NOT provide regulatory protection
- Passkeys/WebAuthn support included

**Onramper:**
- Aggregates 30+ on-ramp providers
- Revenue share model (no upfront cost)
- Verify Brazil partners are BCB-authorized
- Request partner identity documentation for compliance

**LI.FI:**
- Aggregates DEXs and bridges
- Supports Arbitrum + Solana (and more)
- Free SDK with optional revenue share
- Monitor bridge health via their status page
- CCTP integration available for USDC

**Circle Paymaster:**
- USDC gas payment on Arbitrum/Base
- ~10% markup on gas (must show as line item)
- Permissionless integration
- Have ETH gas fallback ready

### 15.3 Infrastructure Costs

| Stage | Monthly Cost | User Count |
|-------|--------------|------------|
| **Launch** | ~$0-50 | <500 users |
| **Early Growth** | ~$50-200 | 500-2,000 users |
| **Growth** | ~$200-500 | 2,000-10,000 users |
| **Scale** | ~$500+ | 10,000+ users |

### 15.4 Upgrade Triggers

| Trigger | Upgrade | Est. Cost |
|---------|---------|-----------|
| >30M compute units | Alchemy Growth | $49/mo |
| High Privy usage | Privy paid tier | Variable |
| >100GB bandwidth | Vercel Pro | $20/mo |
| Need legal entity | Wyoming DAO LLC | ~$500 one-time |
| EU compliance push | CASP application | €20k-100k |

---

## 16. User Flows

### 16.1 Onboarding Flow

```
Step 1: User clicks "Get Started"
Step 2: Enters email or clicks "Continue with Google"
Step 3: Verifies via OTP or OAuth
Step 4: [Backend: Privy creates EVM/Arbitrum wallet]
Step 5: User lands on dashboard showing "Cash: $0 | Portfolio: $0"
Step 6: Prompt displayed: "Add money to get started"

Duration: ~30 seconds
User actions: 3 clicks
Seed phrases shown: 0
```

### 16.2 First Deposit Flow (Brazil/PIX)

```
Step 1: User clicks "Add Money"
Step 2: User enters amount (e.g., R$500)
Step 3: Onramper widget opens
Step 4: User selects PIX
Step 5: [First time only] User completes KYC with Onramper partner
Step 6: User scans PIX QR code in bank app
Step 7: User confirms payment in bank app
Step 8: [~1-2 minutes] Funds arrive in wallet
Step 9: Dashboard updates: "Cash: R$485" (after on-ramp fee)

Duration: ~3 minutes (first time with KYC), ~1 minute (returning)
User actions: 5-7 clicks
```

### 16.3 Same-Chain Send Flow

```
Step 1: User clicks "Send"
Step 2: User selects or enters recipient
Step 3: User enters amount (e.g., $50)
Step 4: [Backend: Calculate fees, prepare transaction]
Step 5: Receipt displayed with full breakdown
Step 6: User clicks "Confirm & Sign"
Step 7: Privy signature popup appears
Step 8: User approves signature
Step 9: Transaction submitted
Step 10: Status: Pending → Confirmed
Step 11: Recipient has funds (~5 seconds)

Duration: ~30 seconds
User actions: 4 clicks + 1 signature
```

### 16.4 Cross-Chain Send Flow (When Enabled)

```
Step 1: User clicks "Send"
Step 2: User selects recipient on different chain
Step 3: User enters amount
Step 4: [Backend: LI.FI calculates route, CCTP preferred for USDC]
Step 5: Receipt displayed with:
        - Exchange rate
        - Slippage
        - Network + bridge fees
        - Estimated time (2-5 min)
        - Bridge warning
Step 6: User clicks "Confirm & Sign"
Step 7: User approves signature
Step 8: Transaction submitted
Step 9: Status: Pending → Bridge Waiting → Confirmed
Step 10: Recipient has funds (~2-5 minutes)

Duration: ~3-5 minutes total
User actions: 4 clicks + 1-2 signatures
```

### 16.5 Withdraw Flow (EU/SEPA)

```
Step 1: User clicks "Withdraw"
Step 2: User selects amount (e.g., €200)
Step 3: Onramper off-ramp widget opens
Step 4: User enters or selects saved IBAN
Step 5: User confirms withdrawal
Step 6: [Partner processes off-ramp]
Step 7: €195 arrives via SEPA (1-2 business days)

Duration: ~2 minutes (user side)
User actions: 4-5 clicks
```

---

## 17. Build Timeline

### 17.1 Solo Developer Schedule

| Week | Focus | Key Deliverables |
|------|-------|------------------|
| **1-2** | Foundation | Next.js setup, Privy integration, wallet creation, passkeys |
| **3-4** | Dashboard | Cash + Portfolio views, Alchemy indexing, fiat conversion |
| **5-6** | On-ramp | Onramper widget, deposit flow (PIX/SEPA/ACH) |
| **7-8** | Send/Receive | LI.FI routing, CCTP integration, quote engine, receipt UI, address book |
| **9-10** | Off-ramp + Safety | Withdrawal, Tenderly simulation, error handling, state machine |
| **11-12** | Compliance | Geo-blocking, US screens, ToS, rate limiting |
| **13-14** | Operations | Kill switches, support flows, monitoring, security review |
| **15-16** | Launch Prep | Testing, mainnet deployment, documentation |

**Total: ~16 weeks / 4 months**

### 17.2 Milestones

| Milestone | Week | Success Criteria |
|-----------|------|------------------|
| **Alpha** | 6 | Deposit via on-ramp, see balance on testnet |
| **Beta** | 10 | Deposit, send, withdraw working on testnet |
| **RC1** | 14 | All features complete, compliance layer done |
| **Security Review** | 15 | Internal/peer review complete |
| **Launch** | 16 | Mainnet deployment, monitoring active |

### 17.3 Launch Checklist

**Features:**
- [ ] All P0 features functional on mainnet
- [ ] All P1 features functional or explicitly deferred
- [ ] Cross-chain routing default OFF, toggle in Settings

**Compliance:**
- [ ] Geo-blocking verified working (UK, sanctioned countries)
- [ ] US acknowledgment screens implemented
- [ ] Terms of Service for EU, US, Brazil complete
- [ ] Privacy policy published
- [ ] Cookie consent implemented

**Safety:**
- [ ] Kill switches tested (all levels)
- [ ] Rate limiting active
- [ ] Error handling covers all known cases
- [ ] Transaction state machine complete
- [ ] Anti-phishing rules active

**Operations:**
- [ ] Monitoring dashboards configured
- [ ] Alerting rules set up
- [ ] Support flows documented
- [ ] Runbooks for common incidents
- [ ] Partner escalation paths documented

**Security:**
- [ ] Security review completed
- [ ] No critical/high vulnerabilities open
- [ ] Key export tested
- [ ] Account recovery tested

---

## 18. Monitoring & Operations

### 18.1 Monitoring Cadences

**Real-Time (Automated):**
- Transaction failure rate by route
- Partner API health (Onramper, LI.FI, Privy)
- Bridge status feeds (CCTP, Wormhole)
- Error rate spikes
- Geographic access patterns

**Daily (Automated + Review):**
- Quote success rate
- Average transaction time by route
- Support ticket volume
- New user signups
- Active user count

**Weekly (Manual Review):**
- Transaction volume trends
- Revenue (if applicable)
- User feedback themes
- Partner performance
- Security scan results

**Monthly (Strategic Review):**
- Regulatory news in target markets
- Competitor analysis
- Feature request prioritization
- Cost optimization
- **ESMA Q&As / guidance updates** relevant to non-custodial interfaces and stablecoins
- **Brazil: BCB reporting cadence** (starts May 2026) + partner readiness evidence refresh
- **Brazil: track SPSAV/VASP transition deadlines** and partner authorization status (partner continuity risk)
- **UK: monitor POATRs** (in force Jan 2026) and FCA "cryptoasset gateway" developments (even while geo-blocked)
- **US: watch state-level money transmission guidance changes** (high-risk states gating as needed)
- Compliance attestation refresh (Brazil)

### 18.2 Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Transaction failure rate | >3% | >5% |
| API latency (p99) | >2s | >5s |
| Error rate | >1% | >3% |
| Partner uptime | <99.5% | <99% |
| Quote success rate | <95% | <90% |

### 18.3 Incident Response

| Severity | Definition | Response Time | Owner |
|----------|------------|---------------|-------|
| **P0 - Critical** | Platform down, active exploit | <15 min | On-call |
| **P1 - High** | Major feature broken, data at risk | <1 hour | On-call |
| **P2 - Medium** | Feature degraded, workaround exists | <4 hours | Team |
| **P3 - Low** | Minor issue, cosmetic | <24 hours | Team |

### 18.4 Runbook Index

| Incident | Runbook |
|----------|---------|
| Bridge hack reported | `runbooks/bridge-incident.md` |
| Partner API down | `runbooks/partner-outage.md` |
| High failure rate | `runbooks/failure-investigation.md` |
| Regulatory inquiry | `runbooks/regulatory-response.md` |
| Security vulnerability | `runbooks/security-incident.md` |
| User funds stuck | `runbooks/stuck-funds.md` |

---

## 19. Corporate Structure

### 19.1 Options

| Option | Description | Cost | Liability Protection | Best For |
|--------|-------------|------|----------------------|----------|
| **A: No Entity** | Operate individually | $0 | None | Build/test only |
| **B: Wyoming DAO LLC** | US DAO-specific structure | ~$500/yr | Limited liability | V1 launch |
| **C: EU Entity** | Malta/Lithuania company | €5k-20k+ | Full corporate | Scaling |

### 19.2 Recommendation

**Phase 1 (Build/Test):** Option A - No entity needed during development

**Phase 2 (Launch):** Option B - Wyoming DAO LLC
- File when: First real users or any revenue
- Cost: ~$500 (filing + registered agent)
- Benefits: Limited liability, DAO recognition
- Requirements: Corporate Transparency Act compliance

**Phase 3 (Scale):** Option C - EU Entity
- Consider when: Revenue justifies cost, EU compliance push
- Options: Malta, Lithuania (fastest CASP path)
- Cost: €5,000-20,000+ setup

---

## 20. Revenue Model

### 20.1 Phase 1: Validation (Zero Revenue)

- Focus on users and product-market fit
- Small affiliate revenue from on-ramp partners (if any)
- Duration: Until PMF demonstrated

### 20.2 Phase 2: Sustainability (Optional Fee)

```
Network fee:       $0.08
Platform fee:      $0.10 (optional)
───────────────────────
Total:             $0.18

[ ] Support [Platform Name] (adds $0.10)
[✓] Don't add platform fee
```

- User controls whether to pay platform fee
- Transparent and optional
- **Default: unchecked (opt-in model)**
- Optional one-time setting: "Enable support fee by default" (explicit user choice in Settings)

### 20.3 Phase 3: Premium Features

| Feature | Target User | Pricing Model |
|---------|-------------|---------------|
| Advanced analytics | Power users | Subscription |
| Priority routing | High-volume | Per-transaction |
| Higher limits | Business | Subscription |
| API access | Developers | Usage-based |
| White-label | Partners | License fee |

---

## 21. Decentralization Roadmap

### 21.1 V1: Centralized Operation

- Centralized frontend (Vercel)
- Platform operates interface
- Code is open-source (transparency)
- Single point of control

### 21.2 V2: Progressive Decentralization

- IPFS-hosted frontend as parallel access point
- Open-source routing/selection logic
- Community can fork and deploy
- Multiple access points (redundancy)
- Consider DAO governance for key decisions

### 21.3 V3: Protocol Status

- DAO governance for protocol parameters
- On-chain routing logic where feasible
- Multiple independent frontends
- Platform becomes one contributor among many
- True censorship resistance achieved

**Principle:** Decentralization is a destination, not a launch feature. Ship working product first.

---

## 22. V2+ Deferred Features

### 22.1 V2 Scope (6-12 months post-launch)

| Feature | Description | Dependencies |
|---------|-------------|--------------|
| **DeFi Strategies** | Curated yield opportunities | Aave, Yearn integration |
| **Ethereum Mainnet** | Direct ETH support | Gas cost UX |
| **Base** | Coinbase ecosystem | Chain integration |
| **Bitcoin** | BTC support | Wallet infrastructure |
| **SUI** | SUI support | Wallet infrastructure |
| **B2B Treasury** | Multi-sig, approvals | Team features |
| **NFT Display** | View owned NFTs | Portfolio enhancement |

### 22.2 V3+ Scope (12-24 months)

| Feature | Description | Dependencies |
|---------|-------------|--------------|
| **RWA Access** | Real World Assets | Securities compliance |
| **TRON** | TRON support | Demand validation |
| **UK Market** | Serve UK users | FCA partner or regime change |
| **Advanced Trading** | Limit orders, etc. | Regulatory clarity |
| **Social Features** | Follow, share | Product direction |

### 22.3 V2 Wallet Creation (Reference)

For V2 implementation:

| Event | Action |
|-------|--------|
| User first interacts with BTC | Create BTC wallet on-demand |
| User first interacts with SUI | Create SUI wallet on-demand |
| User first interacts with TRON | Create TRON wallet on-demand |

**Note:** Do not implement in V1. This is reference for V2 planning.

---

## 23. Success Criteria

### 23.1 Launch Gate Criteria

All must be true before mainnet deployment:

**Functional:**
- [ ] All P0 features working on mainnet
- [ ] Transaction success rate >95% on testnet
- [ ] <3% error rate in final testing
- [ ] All user flows tested end-to-end

**Compliance:**
- [ ] Geo-blocking verified (UK + sanctioned)
- [ ] US acknowledgments implemented
- [ ] ToS for all markets published
- [ ] Privacy policy published
- [ ] DPAs signed with all vendors

**Safety:**
- [ ] Kill switches tested (all levels)
- [ ] Rate limiting active
- [ ] Abuse detection functional
- [ ] Security review completed
- [ ] No critical vulnerabilities open

**Operations:**
- [ ] Monitoring configured
- [ ] Alerting functional
- [ ] Support flows ready
- [ ] Runbooks documented
- [ ] Partner escalation paths confirmed

### 23.2 V1 Success Metrics (90-Day)

| Metric | Target | Warning | Failure |
|--------|--------|---------|---------|
| **Transaction success rate** | >97% | <95% | <90% |
| **Onboarding completion** | >80% | <70% | <60% |
| **Time to first transaction** | <5 min | >10 min | >15 min |
| **Support tickets per 100 users** | <5 | >10 | >15 |
| **User retention (30-day)** | >40% | <30% | <20% |
| **NPS** | >30 | <20 | <0 |

### 23.3 Business Metrics (If Tracking Revenue)

| Metric | Target | Notes |
|--------|--------|-------|
| Monthly Active Users | 1,000 | By month 3 |
| Transaction Volume | $100,000 | By month 3 |
| Revenue (if fee active) | $1,000 | By month 3 |
| CAC | <$10 | Per acquired user |
| LTV | >$50 | Per retained user |

---

## 24. Risk Register

### 24.1 Risk Matrix

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| **Regulatory enforcement (US)** | Medium | High | EU structure, kill switches, disclaimers | Legal |
| **Regulatory enforcement (EU)** | Low-Medium | High | Monitor ESMA, prepare CASP materials | Legal |
| **Regulatory enforcement (Brazil)** | Low | Medium | Licensed partners, compliant ToS | Legal |
| **Bridge hack** | Medium | High | Kill switches, CCTP preference, monitoring | Ops |
| **Partner failure (Privy)** | Low | Critical | Key export, recovery docs, backup plan | Tech |
| **Partner failure (Onramper)** | Low | High | Alternative ramp identified | Tech |
| **Smart contract exploit** | Low | Critical | Use audited protocols only, no custom contracts | Tech |
| **Key compromise (user)** | Medium | Medium | Recovery options, security education | Product |
| **Scaling costs exceed revenue** | Medium | Medium | Revenue model, cost monitoring | Finance |
| **Competition** | High | Medium | Focus on UX, speed to market | Product |
| **Brazil partner not BCB-ready** | Medium | High | Require written partner transition plan, quarterly refresh | Ops |

### 24.2 Contingency Plans

| Scenario | Immediate Action | Recovery Plan |
|----------|------------------|---------------|
| **US enforcement action** | Geo-block US within 24h | Legal review, assess re-entry |
| **Bridge major hack** | Disable all bridges | Assess exposure, communicate to users |
| **Privy goes down** | Display maintenance page | Activate backup auth (if prepared) |
| **Onramper fails** | Disable on/off-ramp | Direct integration with backup provider |
| **Critical security bug** | Take platform offline | Fix, audit, staged re-launch |
| **Brazil partner loses authorization** | Disable Brazil on-ramp | Switch to backup partner or geo-block BR |

---

## Appendices

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Non-custodial** | User controls their own private keys; platform cannot access funds |
| **MPC** | Multi-Party Computation — cryptographic key splitting technique |
| **On-ramp** | Service converting fiat currency to cryptocurrency |
| **Off-ramp** | Service converting cryptocurrency to fiat currency |
| **Bridge** | Protocol for transferring assets between blockchains |
| **CCTP** | Circle Cross-Chain Transfer Protocol — native USDC bridge via burn/mint |
| **Paymaster** | ERC-4337 component that pays gas fees for users |
| **ERC-4337** | Account abstraction standard for smart contract wallets |
| **CASP** | Crypto-Asset Service Provider (EU MiCA license category) |
| **Kill switch** | Configuration-based feature disable capability |
| **Slippage** | Difference between expected and actual swap price |
| **TVL** | Total Value Locked — measure of assets in a protocol |
| **OFAC** | Office of Foreign Assets Control (US sanctions administrator) |
| **POATRs** | Property (Digital Assets etc) Act regulations (UK, Jan 2026) |
| **SPSAV** | Prestadores de Serviços de Ativos Virtuais (Brazil VASP category) |

### Appendix B: External Dependencies

| Dependency | Type | Criticality | Fallback |
|------------|------|-------------|----------|
| Privy | Auth + Wallet | Critical | Web3Auth, Dynamic (requires rebuild) |
| Onramper | Fiat rails | Critical | Direct MoonPay/Transak |
| LI.FI | Routing | High | Direct 1inch + bridge integration |
| Circle CCTP | Cross-chain USDC | High | Wormhole, Stargate (higher trust assumptions) |
| Alchemy | Blockchain data | High | Infura, QuickNode |
| Tenderly | Simulation | Medium | In-house simulation |
| CoinGecko | Prices | Medium | CoinMarketCap, on-chain oracles |
| Vercel | Hosting | Medium | Netlify, AWS |
| Circle Paymaster | Gas abstraction | Low | Native gas (degraded UX) |

### Appendix C: Config File Templates

**chains.json (example structure):**
```json
{
  "arbitrum": {
    "chainId": 42161,
    "name": "Arbitrum One",
    "rpcUrl": "https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY",
    "explorerUrl": "https://arbiscan.io",
    "nativeToken": "ETH"
  },
  "solana": {
    "cluster": "mainnet-beta",
    "name": "Solana",
    "rpcUrl": "https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY",
    "explorerUrl": "https://solscan.io",
    "nativeToken": "SOL"
  }
}
```

**tokens.json (example structure):**
```json
{
  "arbitrum": {
    "USDC": {
      "address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      "decimals": 6,
      "symbol": "USDC"
    },
    "USDT": {
      "address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      "decimals": 6,
      "symbol": "USDT"
    }
  },
  "solana": {
    "USDC": {
      "mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      "decimals": 6,
      "symbol": "USDC"
    }
  }
}
```

### Appendix D: Reference Links

**Regulatory:**
- [MiCA Regulation (EUR-Lex)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32023R1114)
- [FinCEN 2019 Guidance](https://www.fincen.gov/sites/default/files/2019-05/FinCEN%20Guidance%20CVC%20FINAL%20508.pdf)
- [Brazil BCB Virtual Assets](https://www.bcb.gov.br/en/pressdetail/2639/nota)
- [FCA Crypto Promotions](https://www.fca.org.uk/firms/cryptoasset-financial-promotions)

**Technical:**
- [Privy Documentation](https://docs.privy.io/)
- [LI.FI Documentation](https://docs.li.fi/)
- [Onramper Documentation](https://docs.onramper.com/)
- [Circle CCTP](https://developers.circle.com/stablecoins/docs/cctp-getting-started)
- [Circle Paymaster](https://developers.circle.com/paymaster)
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)

### Appendix E: Document Control

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | Jan 2026 | Initial draft | — |
| 0.5 | Jan 2026 | Incorporated feedback rounds 1-3 | — |
| 0.8 | Jan 2026 | Applied 7 corrections (receipts, anti-phishing, etc.) | — |
| 0.9 | Jan 2026 | Applied 4 additions (Brazil, Privy, lazy wallets) | — |
| 1.0 | Jan 2026 | Final review, ready for development | — |
| 1.1 | Jan 2026 | Applied 12 additions (support, rate limiting, GDPR, etc.) | — |
| 1.2 | Jan 2026 | Added: orchestration policy, CCTP preference, cross-chain opt-in default, config files, Brazil deadlines, US FDIC disclaimer, opt-in platform fee, regulatory monitoring specifics | — |

---

**End of Specification**

*This document is ready for handoff to the technical team. It is deliberately comprehensive and boring because boring ships.*
