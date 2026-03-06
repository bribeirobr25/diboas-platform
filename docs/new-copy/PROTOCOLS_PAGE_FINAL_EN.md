# diBoaS Protocols Page — FINAL Copy (EN)

## Document Status

| Field | Value |
|-------|-------|
| Version | v1.3 — Copywriter fixes applied |
| Language | English (EN) |
| Date | February 28, 2026 |
| Based On | Current implementation (protocolsData.ts, en/protocols.json) |
| Status | Rewritten with diBoaS voice, compliance patterns from B2C + Strategies pages |
| Pending | CEO sign-off (Balancer confirmation) |
| Related | STRATEGIES_PAGE_FINAL_EN.md (cross-references protocols) |
| Fee Lab | v3.3 (no fees on this page, but consistent language) |

## Implementation Notes for CTO / Claude Code

This document contains the complete English copy for the Protocols page (`/[locale]/protocols`). It replaces the current `en/protocols.json` i18n content and updates `protocolsData.ts` descriptions.

### What Changed from Current Implementation

| Area | Before | After |
|------|--------|-------|
| Hero | Generic "Where Your Money Works" | Emotional hook tied to transparency promise |
| Intro | Two bland paragraphs | Three-part narrative with Adelaide voice |
| Protocol descriptions | Technical summaries | "What this means for your money" framing |
| Selection criteria | Flat checklist | Narrative with explained reasoning |
| FAQ | 3 items (thin) | 8 items (addresses real user concerns) |
| Footer | Two lines, no legal | Full compliance footer matching B2C/Strategies |
| TVL section | Bare number | Contextualized with source + freshness |
| Missing sections | No risk framing, no CTA | Added risk context, Waitlist CTA, cross-links |

### Global Rules

- NO em-dash characters. Use commas, periods, colons, or line breaks.
- NO emojis in body copy.
- All CTAs are buttons unless noted otherwise.
- All micro-disclosures use small/muted text styling.
- Transition hooks styled as subtle lead-in text between sections.
- Adelaide Filter is RELAXED for this page. Technical terms (DeFi, protocol, TVL, staking, stablecoin) are expected and necessary. But descriptions should still prioritize clarity over jargon.
- Protocol descriptions should answer: "What does this mean for my money?"

### Section Flow

| # | Section | Type |
|---|---------|------|
| 1 | Hero | Static |
| 2 | Why This Page Exists | Static (3 paragraphs + callout) |
| 3 | Protocol Grid | Card grid by category (7 categories, 26 protocols) |
| 4 | How We Choose | Narrative with criteria |
| 5 | Combined TVL | Stats highlight |
| 6 | What This Page Is Not | Risk/limitation framing |
| 7 | FAQ | Accordion (8 items) |
| 8 | Waitlist / CTA | Email capture |
| 9 | Footer | Legal disclosures + data sources |

---

## SECTION 1: HERO

**H1:**

```
Where Your Money Works
```

**Subtitle:**

```
Every system. Every name. Nothing hidden.
```

**Trust line (smaller text):**

```
26 protocols. 7 categories. Full transparency about every system your money touches.
```

### Notes

- Clean, confident. No "trust" language in the subtitle (CLO concern: implied endorsement).
- "Nothing hidden" echoes the B2C transparency promise without overselling.
- The numbers (26, 7) give immediate context.

---

**Transition:**

```
Here's why we built this page.
```

---

## SECTION 2: WHY THIS PAGE EXISTS

**H2:**

```
Why This Page Exists
```

**Body:**

```
Ask your bank where your savings go. They won't tell you.

We will. Every system listed on this page is one your money may touch when you use a diBoaS strategy. We publish the names, the track records, the security audits, and the things that went wrong. Because you should know.

Every protocol on this page earned its spot. We checked how long it has been running, who audited the code, how it handled problems, and whether real people actually trust it with real money. If it did not pass, it is not here.

We list 26 protocols here. Our strategies currently use 6 of them. The rest are protocols we have researched and approved, and they may be included in future strategies as we expand.
```

**Callout box (amber background, left border):**

```
Important: Being listed here does not mean zero risk. It means we did our homework and we are being honest about what we found. Every system on this page carries technical risk, market risk, and the possibility of loss.
```

`[CLO FLAG: RESOLVED (P1-1). Replaced "would not put our own money" with "does not meet our standards." Removes suitability implication, maintains trust signal.]`

### Notes

- First line ("Ask your bank...") is the hook. Short, punchy, creates contrast.
- Second paragraph is the transparency promise.
- Third paragraph is the due diligence explanation.
- Callout box is the honest limitation. Matches the pattern from Strategies page intro.
- No use of "trust" as a verb directed at diBoaS. We show the work. The reader decides.

---

## SECTION 3: PROTOCOL GRID

**H2:**

```
The 26 Protocols
```

**Sub-heading:**

```
Organized by what they do. Click any card for details.
```

**TVL freshness note (micro-text below sub-heading):**

```
All TVL figures are approximate, sourced from DeFiLlama, and current as of February 2026. Values fluctuate daily.
```

### Category Structure

Each category gets:
- Category title (H3)
- Category description (one sentence explaining what this type of protocol does for the user)
- Grid of protocol cards (2-3 columns desktop, 1 column mobile)

---

### Category 1: Lending

**Title:** Lending Protocols

**Description:**

```
You deposit assets. Borrowers pay interest to use them. You earn the interest.
```

---

#### Protocol Card: Aave V3

**Name:** Aave V3

**Description:**

```
The largest lending system in decentralized finance. You deposit assets, earn interest from borrowers, and can withdraw anytime. Used by institutions and individuals across 18 blockchains.
```

**Details:**

| Founded | 2017 (V3: 2022) |
| Total Value Locked | ~$35 billion |
| Blockchains | Ethereum, Arbitrum, Polygon, + 15 more |
| Security Audits | 30+ independent audits |
| Regulatory / Track Record | SEC closed its 4-year investigation without charges (December 2025). Source: SEC closure letter shared by Aave founder; reported by Yahoo Finance, CoinDesk, Unchained. |

**Links:** Website: aave.com | X: @AaveAave

**Used in diBoaS strategies:** Safe Harbor, Goal Keeper, Patient Builder, Steady Compounder, Yield Maximizer

`[CLO FLAG: RESOLVED (P0-1a). SEC Aave investigation closure verified. December 16, 2025. Multiple credible sources confirm.]`

---

#### Protocol Card: Compound V3

**Name:** Compound V3

**Description:**

```
One of the oldest lending systems in DeFi. You earn interest by providing assets that others borrow. Simple, battle-tested, and running since 2018.
```

**Details:**

| Founded | 2018 (V3: 2022) |
| Total Value Locked | ~$2 billion |
| Blockchains | Ethereum, Arbitrum, Base, Polygon |
| Security Audits | 4+ independent audits |
| Regulatory / Track Record | Fully decentralized. No specific licenses required. |

**Links:** Website: compound.finance | X: @compoundfinance

**Used in diBoaS strategies:** Safe Harbor, Goal Keeper, Patient Builder, Steady Compounder, Yield Maximizer

---

#### Protocol Card: Kamino

**Name:** Kamino

**Description:**

```
Solana's all-in-one lending and liquidity platform. Combines lending, automated liquidity management, and leverage in a single system. You earn interest by lending assets to borrowers, similar to Aave and Compound.
```

**Details:**

| Founded | 2022 |
| Total Value Locked | ~$2.5 billion |
| Blockchains | Solana |
| Security Audits | Multiple audits by OtterSec |
| Regulatory / Track Record | Decentralized protocol. No major incidents. |

**Links:** Website: kamino.finance | X: @KaminoFinance

---

#### Protocol Card: Morpho

**Name:** Morpho

**Description:**

```
Matches lenders directly with borrowers for better rates than traditional lending pools. Coinbase integrated Morpho on Base for bitcoin-backed USDC loans (January 2025), originating over $1.2 billion in loans by late 2025.
```

**Details:**

| Founded | 2022 |
| Total Value Locked | ~$7 billion |
| Blockchains | Ethereum, Base, Arbitrum |
| Security Audits | 23+ independent audits |
| Regulatory / Track Record | Integrated by Coinbase (Jan 2025) and Crypto.com (Oct 2025) for DeFi-backed lending. Source: Coinbase blog, morpho.org/stories/coinbase, DL News. |

**Links:** Website: morpho.org | X: @MorphoLabs

`[CLO FLAG: RESOLVED (P1-3a). Coinbase/Morpho partnership verified via Coinbase blog (Jan 16, 2025), CoinDesk, Cointelegraph, morpho.org case study. $1.2B loan origination confirmed.]`

---

#### Protocol Card: Spark Protocol

**Name:** Spark Protocol

**Description:**

```
Lending system built on Aave's proven code, connected to Sky/MakerDAO's deep liquidity. Benefits from the longest operating history in DeFi (since 2014).
```

**Details:**

| Founded | 2023 |
| Total Value Locked | ~$4 billion |
| Blockchains | Ethereum, Base, Arbitrum |
| Security Audits | 7+ independent audits |
| Regulatory / Track Record | Benefits from MakerDAO's 10+ year compliance track record |

**Links:** Website: spark.fi | X: @sparkdotfi

---

#### Protocol Card: Fluid

**Name:** Fluid

**Description:**

```
Next-generation lending that combines features from multiple established systems. Very low liquidation penalties for borrowers. You earn interest from borrowers, similar to other lending protocols.
```

**Details:**

| Founded | 2024 |
| Total Value Locked | ~$2 billion |
| Blockchains | Ethereum, Arbitrum, Base |
| Security Audits | 3+ independent audits |
| Regulatory / Track Record | Built by the Instadapp team (6+ years building DeFi infrastructure) |

**Exception note (micro-text below card):**

```
Exception to our 1-year minimum: Fluid launched in 2024 but is built by the Instadapp team, which has 6+ years of DeFi infrastructure experience.
```

**Links:** Website: fluid.io | X: @0xFluid

`[CLO FLAG: RESOLVED (P1-2). Added explicit exception micro-text to card per CLO audit requirement. Selection criteria Section 4 already covers "We make exceptions for protocols built by teams with long track records, but we note it clearly."]`

---

### Category 2: Staking

**Title:** Staking Protocols

**Description:**

```
You help secure a blockchain network. The network pays you rewards for doing so.
```

---

#### Protocol Card: Lido Finance

**Name:** Lido Finance

**Description:**

```
Stake your ETH and receive a token (stETH) you can use elsewhere while still earning staking rewards. The largest staking service in crypto.
```

**Details:**

| Founded | 2020 |
| Total Value Locked | ~$27 billion |
| Blockchains | Ethereum, Polygon |
| Security Audits | 20+ independent audits |
| Regulatory / Track Record | SEC Division of Corporation Finance staff statement (August 5, 2025): liquid staking receipt tokens including stETH are not securities under the Securities Act of 1933 or Exchange Act of 1934. Part of SEC Chairman Atkins' "Project Crypto" initiative. Source: SEC.gov staff statement; reported by CoinDesk, Decrypt, CCN. |

**Links:** Website: lido.fi | X: @LidoFinance

`[CLO FLAG: RESOLVED (P0-1b). SEC liquid staking guidance verified. August 5, 2025 staff statement explicitly covers stETH. Multiple credible sources confirm.]`

---

#### Protocol Card: Rocket Pool

**Name:** Rocket Pool

**Description:**

```
Decentralized Ethereum staking. You can stake with as little as 0.01 ETH. No centralized operator controls the network.
```

**Details:**

| Founded | 2016 (mainnet 2021) |
| Total Value Locked | ~$2 billion |
| Blockchains | Ethereum |
| Security Audits | 5+ independent audits |
| Regulatory / Track Record | SEC Division of Corporation Finance staff statement (August 5, 2025): liquid staking receipt tokens including rETH are not securities. Same guidance covering Lido stETH and Jito JitoSOL. Source: SEC.gov staff statement. |

**Links:** Website: rocketpool.net | X: @Rocket_Pool

`[CLO FLAG: RESOLVED (P0-1c). SEC liquid staking guidance verified. August 5, 2025. Explicitly covers rETH.]`

---

#### Protocol Card: Jito

**Name:** Jito

**Description:**

```
Solana liquid staking that earns both standard staking rewards and additional MEV (trading arbitrage) rewards. Used in diBoaS growth strategies.
```

**Details:**

| Founded | 2022 |
| Total Value Locked | ~$2.8 billion |
| Blockchains | Solana |
| Security Audits | Multiple audits by Certora, OtterSec |
| Regulatory / Track Record | SEC Division of Corporation Finance staff statement (August 2025): liquid staking receipt tokens including JitoSOL are not securities. Source: SEC.gov staff statement; reported by CoinDesk, CCN, Blockchain Magazine. |

**Links:** Website: jito.network | X: @jikitonetwork

**Used in diBoaS strategies:** Full Throttle

`[CLO FLAG: RESOLVED (P0-1d). SEC liquid staking guidance verified. August 5, 2025. Original draft said "March 2025" which was INCORRECT. Corrected to August 2025. JitoSOL explicitly covered in the same staff statement as stETH and rETH.]`

---

#### Protocol Card: Marinade Finance

**Name:** Marinade Finance

**Description:**

```
Solana staking spread across 100+ validators for better decentralization and rewards. One of the few DeFi protocols with institutional-grade compliance certification.
```

**Details:**

| Founded | 2021 |
| Total Value Locked | ~$550 million |
| Blockchains | Solana |
| Security Audits | 5+ independent audits |
| Regulatory / Track Record | SOC 2 Type I and II certified. Institutional-grade compliance. |

**Badge:** ✓ (green success indicator)

**Links:** Website: marinade.finance | X: @MarinadeFinance

---

#### Protocol Card: Sanctum (INF)

**Name:** Sanctum (INF)

**Description:**

```
Unified liquidity layer for all Solana staking tokens. Lets you swap instantly between different staked assets without waiting for unstaking periods.
```

**Details:**

| Founded | 2021 |
| Total Value Locked | ~$1.7 billion |
| Blockchains | Solana |
| Security Audits | Audited by Accretion |
| Regulatory / Track Record | Singapore-based. Powers staking for Binance and Bybit. |

**Links:** Website: sanctum.so | X: @sanctumso

**Used in diBoaS strategies:** Stable Growth, Steady Progress, Balanced Builder, Wealth Accelerator, Full Throttle

---

#### Protocol Card: EigenLayer

**Name:** EigenLayer

**Description:**

```
Restaking: use your already-staked ETH to support other services built on Ethereum and earn extra rewards on top of your base staking yield. You earn staking rewards plus bonus rewards from the services you help secure.
```

**Details:**

| Founded | 2023 |
| Total Value Locked | ~$12 billion |
| Blockchains | Ethereum |
| Security Audits | Multiple independent audits |
| Regulatory / Track Record | $2M bug bounty program on Immunefi |

**Links:** Website: eigenlayer.xyz | X: @eigenlayer

---

### Category 3: Stablecoins and Synthetic Assets

**Title:** Stablecoins and Synthetic Assets

**Description:**

```
These systems create digital assets designed to hold a stable value, usually pegged to the US dollar. Stablecoins can lose their peg.
```

`[CLO NOTE: Added "Stablecoins can lose their peg" to the category description itself. Matches P0-1 from Strategies page review. Risk is embedded, not buried.]`

---

#### Protocol Card: Sky Protocol / SSR (formerly MakerDAO)

**Name:** Sky Protocol / SSR (formerly MakerDAO)

**Description:**

```
The original DeFi system. Running since 2014. Deposit crypto as collateral, generate stablecoins, earn the savings rate. Survived every major market crash since 2017.
```

**Details:**

| Founded | 2014 |
| Total Value Locked | ~$6 billion |
| Blockchains | Ethereum (diBoaS strategies use the Arbitrum deployment) |
| Security Audits | 10+ independent audits |
| Regulatory / Track Record | 10+ years of continuous operation through multiple market cycles |

**Links:** Website: sky.money | X: @SkyEcosystem

**Used in diBoaS strategies:** All 10 strategies (Safe Harbor, Stable Growth, Goal Keeper, Steady Progress, Patient Builder, Balanced Builder, Steady Compounder, Wealth Accelerator, Yield Maximizer, Full Throttle)

---

#### Protocol Card: Ethena

**Name:** Ethena

**Description:**

```
Creates a synthetic dollar (USDe) through hedged positions. Offers higher yields than traditional stablecoins, but with a more complex mechanism and higher risk profile.
```

**Details:**

| Founded | 2023 |
| Total Value Locked | ~$6.5 billion |
| Blockchains | Ethereum + 23 chains |
| Security Audits | 7+ independent audits |
| Regulatory / Track Record | BaFin (Germany) rejected MiCA authorization application in March 2025, citing "significant deficiencies" in organizational structure and reserve compliance. BaFin ordered halt to USDe minting/redemption and froze reserve assets. Ethena GmbH agreed to wind down German operations (April 2025). All activity now operates via Ethena (BVI) Limited, a British Virgin Islands entity. BaFin also raised concerns that sUSDe may constitute an unregistered security under German law. Sources: BaFin official notice (March 21, 2025); Decrypt, The Block, CoinTelegraph, Ledger Insights. |

**Badge:** ⚠ (amber warning indicator)

**Links:** Website: ethena.fi | X: @ethena_labs

`[CLO FLAG: RESOLVED (P1-5). Ethena/BaFin language tightened. Key corrections: (1) BaFin FORCED the exit (rejected application + enforcement actions), not a voluntary withdrawal. (2) Added BVI entity context per CLO requirement (material for EU users). (3) Added sUSDe securities concern. (4) Sourced to BaFin official notice + major outlets.]`

---

#### Protocol Card: Ondo Finance

**Name:** Ondo Finance

**Description:**

```
Brings traditional financial assets on-chain. US Treasuries, bonds, and stocks as digital tokens. Acquired SEC-registered broker-dealer and transfer agent licenses through its purchase of Oasis Pro (completed October 2025).
```

**Details:**

| Founded | 2021 |
| Total Value Locked | ~$1.7 billion |
| Blockchains | Ethereum, Solana, Arbitrum |
| Security Audits | 4+ independent audits |
| Regulatory / Track Record | SEC-registered broker-dealer, Alternative Trading System (ATS), and Transfer Agent licenses acquired via Oasis Pro (FINRA member since 2020). Acquisition completed October 2025. $1.6B+ in tokenized assets under management. Sources: Ondo Finance blog, Blockworks, CoinDesk, FINRA BrokerCheck (Oasis Pro Markets LLC). |

**Badge:** ✓ (green success indicator)

**Links:** Website: ondo.finance | X: @ondofinance

`[CLO FLAG: RESOLVED (P1-6). Ondo/Oasis Pro acquisition verified. Completed October 6, 2025. Oasis Pro Markets LLC is FINRA member since 2020, SEC-registered broker-dealer and transfer agent. Confirmed via Blockworks, Crowdfund Insider, BSC News, official Ondo blog.]`

---

### Category 4: Yield and Trading Protocols

**Title:** Yield and Trading Protocols

**Description:**

```
These systems generate returns through trading fees, yield optimization, or structured products.
```

---

#### Protocol Card: Pendle Finance

**Name:** Pendle Finance

**Description:**

```
Separates yield from principal so you can trade, lock in, or speculate on future returns. Lets you secure a fixed rate or bet that rates will go higher.
```

**Details:**

| Founded | 2021 |
| Total Value Locked | ~$4.5 billion |
| Blockchains | Ethereum, Arbitrum, BNB Chain |
| Security Audits | 6+ independent audits |
| Regulatory / Track Record | $250K bug bounty. Safe Harbor Agreement in place. |

**Links:** Website: pendle.finance | X: @pendle_fi

---

#### Protocol Card: Yearn Finance

**Name:** Yearn Finance

**Description:**

```
Automated yield farming. Moves your money between systems to chase the best available returns. A pioneer that has been running since 2020.
```

**Details:**

| Founded | 2020 |
| Total Value Locked | ~$500 million |
| Blockchains | Ethereum, Arbitrum, Fantom |
| Security Audits | 6+ independent audits |
| Regulatory / Track Record | Pioneer of yield aggregation. 5+ years of continuous operation. |

**Links:** Website: yearn.fi | X: @yearnfinance

---

#### Protocol Card: Curve Finance

**Name:** Curve Finance

**Description:**

```
Specialized exchange for stablecoins and similar assets. Designed for minimal price impact when swapping between assets of similar value.
```

**Details:**

| Founded | 2020 |
| Total Value Locked | ~$2.2 billion |
| Blockchains | Ethereum + 20 chains |
| Security Audits | 15+ independent audits |
| Regulatory / Track Record | July 2023: $70M exploit. 73% of funds recovered. Root cause was a compiler bug (Vyper), not Curve's own code. |

**Badge:** ⚠ (amber warning indicator)

**Links:** Website: curve.finance | X: @CurveFinance

---

#### Protocol Card: Convex Finance

**Name:** Convex Finance

**Description:**

```
Boosts your Curve rewards without requiring you to lock tokens for years. Simplifies Curve participation.
```

**Details:**

| Founded | 2021 |
| Total Value Locked | ~$1.5 billion |
| Blockchains | Ethereum, Arbitrum |
| Security Audits | 7 independent audits |
| Regulatory / Track Record | No exploits in 4 years. A critical vulnerability was found and patched in 2022 before any funds were lost. |

**Links:** Website: convexfinance.com | X: @ConvexFinance

---

### Category 5: Perpetual and Trading Exchanges

**Title:** Perpetual and Trading Exchanges

**Description:**

```
Traders use these systems to bet on price movements. You earn returns by providing the liquidity they trade against.
```

---

#### Protocol Card: GMX V2

**Name:** GMX V2

**Description:**

```
Decentralized perpetual exchange. You provide liquidity to a shared pool. Traders pay fees to the pool. You earn a share of every trade.
```

**Details:**

| Founded | 2021 |
| Total Value Locked | ~$400 million |
| Blockchains | Arbitrum, Avalanche, Solana |
| Security Audits | 10+ independent audits |
| Regulatory / Track Record | $5M bug bounty on Immunefi (one of the largest in DeFi) |

**Links:** Website: gmx.io | X: @GMX_IO

---

#### Protocol Card: Jupiter JLP

**Name:** Jupiter JLP

**Description:**

```
Solana's leading perpetual exchange. Provide liquidity, earn 70% of all trading fees. Used in several diBoaS growth strategies.
```

**Details:**

| Founded | 2021 (perpetuals: 2023) |
| Total Value Locked | ~$1.6 billion |
| Blockchains | Solana |
| Security Audits | 6+ independent audits |
| Regulatory / Track Record | Over $137M paid to liquidity providers from January to October 2024, based on Dune Analytics fee data (75% of $183M total fees). Source: SolanaFloor / Dune Analytics (October 2024). Figure is likely significantly higher at time of publication. |

**Links:** Website: jup.ag | X: @JupiterExchange

**Used in diBoaS strategies:** Balanced Builder, Wealth Accelerator, Full Throttle

`[CLO FLAG: RESOLVED (P1-3b). Jupiter $137M figure verified via SolanaFloor article (Oct 9, 2024) citing Dune Analytics. Calculation: $183M total fees x 75% JLP share = $137.6M. Data as of Oct 2024. Note: actual current figure is likely much higher given continued trading volume growth. Consider updating with current data before publication.]`

---

#### Protocol Card: Drift Protocol

**Name:** Drift Protocol

**Description:**

```
Full-featured trading platform on Solana. Perpetuals, spot trading, and lending in one system. Real-time risk monitoring dashboard is public.
```

**Details:**

| Founded | 2021 |
| Total Value Locked | ~$850 million |
| Blockchains | Solana |
| Security Audits | 3+ audits by Trail of Bits, OtterSec |
| Regulatory / Track Record | Open-source code. Public risk monitoring. |

**Links:** Website: drift.trade | X: @DriftProtocol

---

### Category 6: Decentralized Exchanges (DEX)

**Title:** Decentralized Exchanges

**Description:**

```
Swap one token for another without a centralized exchange. You can also earn fees by providing liquidity for others to trade against.
```

---

#### Protocol Card: Raydium

**Name:** Raydium

**Description:**

```
Solana's main decentralized exchange. Automated market making, concentrated liquidity, and token launches.
```

**Details:**

| Founded | 2021 |
| Total Value Locked | ~$2 billion |
| Blockchains | Solana |
| Security Audits | 4+ independent audits |
| Regulatory / Track Record | November 2022: $4.4M exploit caused by compromised admin key. All affected users were reimbursed. |

**Badge:** ⚠ (amber warning indicator)

**Links:** Website: raydium.io | X: @RaydiumProtocol

---

#### Protocol Card: Orca

**Name:** Orca

**Description:**

```
User-friendly Solana exchange known for clean design, efficient swaps, and one of the strongest security records in the ecosystem. You can provide liquidity and earn fees from trades on the platform.
```

**Details:**

| Founded | 2021 |
| Total Value Locked | ~$400 million |
| Blockchains | Solana |
| Security Audits | 6+ independent audits |
| Regulatory / Track Record | No exploits in 4+ years. Praised for code quality by independent reviewers. |

**Links:** Website: orca.so | X: @orca_so

---

#### Protocol Card: Balancer

**Name:** Balancer

**Description:**

```
Programmable liquidity pools that can hold multiple tokens in custom ratios. More flexible than standard exchange pools. You provide tokens to the pool and earn a share of trading fees.
```

**Details:**

| Founded | 2020 |
| Total Value Locked | ~$258 million (post-exploit; was ~$775M pre-November 2025) |
| Blockchains | Ethereum, Arbitrum, Polygon |
| Security Audits | 11+ independent audits |
| Regulatory / Track Record | November 3, 2025: $128M exploit affecting V2 pools across Ethereum, Polygon, Base, Arbitrum, and other chains. Rounding error vulnerability in ComposableStablePool contracts. Approximately $28M recovered through whitehat operations and protocol interventions. Majority of funds (~$100M) remain unrecovered as of February 2026. Balancer DAO approved 10% recovery bounty (BIP-908, February 2026). V3 (current version) was NOT affected by this exploit. diBoaS strategies use V3 only. Sources: Check Point Research, CoinJournal, The Defiant, DL News, Halborn. |

**Badge:** ⚠ (amber warning indicator)

**Links:** Website: balancer.fi | X: @Balancer

`[CLO FLAG: RESOLVED (P1-4). Balancer exploit details verified and significantly expanded. CRITICAL FINDING: ~$100M of $128M was NOT recovered. Only ~$28M returned ($8M whitehat/internal reimbursement plan + ~$20M StakeWise/Berachain recoveries). This technically contradicts the selection criterion "No unresolved exploits where user funds were permanently lost." HOWEVER: (1) V3 was not affected, (2) diBoaS uses V3 only, (3) the exploit targeted V2 composable stable pools specifically. Recommendation: Balancer remains listed with amber badge because V3 is unaffected and diBoaS has no V2 exposure, but Section 4 criteria language must be updated to reflect this nuance. See Section 4 edit below.]`

---

### Category 7: Payment and Real-World Asset Infrastructure

**Title:** Payment and Real-World Asset Infrastructure

**Description:**

```
These systems connect traditional finance and crypto. Cross-border payments, trade financing, and real-world assets on-chain.
```

---

#### Protocol Card: Huma Finance

**Name:** Huma Finance

**Description:**

```
Instant cross-border payments and trade financing using crypto infrastructure. Partners with Circle and the Stellar Development Foundation. Returns come from fees charged on cross-border payment processing.
```

**Details:**

| Founded | 2022 |
| Total Value Locked | ~$100 million |
| Blockchains | Solana, Stellar, Polygon |
| Security Audits | 6+ independent audits |
| Regulatory / Track Record | Strategic partnerships with Circle and Stellar Development Foundation |

**Links:** Website: huma.finance | X: @humafinance

---

### Protocol Card Implementation Notes

**For CTO / Claude Code:**

- Each protocol card renders as a white card with shadow, matching the current `ProtocolCard.tsx` component.
- Amber warning badge (⚠) uses the existing `hasWarning` flag with `AlertTriangle` icon in amber-600.
- Green success badge (✓) uses the existing `hasSuccess` flag with `CheckCircle` icon in teal-600.
- External links open in new tabs with `rel="noopener noreferrer"`.
- Protocol descriptions in `protocolsData.ts` should be updated to match this copy.
- Category descriptions in `en/protocols.json` should be updated to match this copy.

**Badge criteria (for CLO review):**

| Badge | Criteria | Protocols |
|-------|----------|-----------|
| ⚠ Amber | Has had a significant exploit, regulatory issue, or elevated risk profile | Ethena, Curve, Raydium, Balancer |
| ✓ Green | Has exceptional compliance credentials (SOC2, SEC license, etc.) | Marinade, Ondo |
| None | Standard track record, no exceptional flags | All others |

`[CLO FLAG: Badge criteria should be formally defined and documented. Currently applied case-by-case. Recommend CLO Board establishes a rubric.]`

---

## SECTION 4: HOW WE CHOOSE

**Transition:**

```
How did these 26 make the list?
```

**H2:**

```
Our Selection Process
```

**Body:**

```
We don't add protocols because they are popular. We add them because they passed our checklist.
```

**Criteria (rendered as checkmark list):**

```
✓ At least 1 year of continuous operation. We make exceptions for protocols built by teams with long track records, but we note it clearly.

✓ Professional security audits from recognized firms. Not just one. We look for multiple independent audits.

✓ No unresolved exploits affecting the version we use where user funds were permanently lost. Past incidents and version-specific exploits are disclosed on each card with a warning badge.

✓ Transparent operations. We can verify how the protocol works. Open-source code is preferred.

✓ Real usage. Actual users depositing real money. Not just hype, not just a token price.
```

**Below criteria:**

```
When protocols have had security incidents, we note them on the card with an amber warning. Transparency works both ways. We show the good and the bad.
```

`[CLO FLAG: RESOLVED (P1-4 criteria). Updated language from "no unresolved exploits where user funds were permanently lost" to "no unresolved exploits affecting the version we use." This accurately reflects the Balancer situation: V2 had $128M exploit with ~$100M unrecovered, but diBoaS uses V3 only (which was unaffected). The amber badge + full card disclosure maintains transparency.]`

### Notes

- The criteria list should use teal checkmarks (✓) matching current implementation.
- "We make exceptions" addresses the Fluid case (founded 2024) without calling it out by name.
- The closing line about transparency echoes the B2C brand promise.

---

**Transition:**

```
So how much real money is in these systems?
```

---

## SECTION 5: COMBINED TVL

**H2:**

```
Combined Value Secured
```

**Body:**

```
The protocols on this page collectively hold over
```

**Large number (styled as hero stat, teal-700, bold):**

```
$120 billion
```

**Continuation:**

```
in user deposits across all their deployments. That is more than most regional banks hold in total deposits.
```

**Context (smaller text below):**

```
This does not mean your money is in all of them. Each diBoaS strategy uses specific protocols suited to its risk level and goals. See the Strategies page for which protocols are used in which strategy.
```

**Source line (micro-text):**

```
Combined TVL sourced from DeFiLlama. Last verified: January 2026. Values fluctuate daily.
```

`[CLO FLAG: "$120 billion" needs re-verification against current DeFiLlama data before publication. TVL is highly volatile. Recommend a freshness SLA: this number must be re-verified monthly and updated if it changes by more than 15%.]`

### Notes

- "Combined Value Secured" avoids "Total Combined TVL" (TVL is jargon for casual readers).
- Cross-link to Strategies page creates internal navigation.
- The context line prevents misinterpretation that all $120B is related to diBoaS users.

---

**Transition:**

```
Before you go further, something important.
```

---

## SECTION 6: WHAT THIS PAGE IS NOT

**H2:**

```
What This Page Is Not
```

**Body:**

```
This is not a recommendation to use any of these protocols directly.

diBoaS strategies are built on top of these systems, and our team handles the complexity. You do not need to interact with any protocol yourself. This page exists so you can see exactly where your money goes and verify everything we say.

Every protocol here carries risk. Smart contracts can have bugs. Markets can crash. Stablecoins can lose their peg. Systems that have operated safely for years can still face problems tomorrow. We monitor these systems continuously, but we cannot eliminate risk. No one can.

This page exists because we believe you deserve to know. Not because you need to act on it.

If you are unsure whether this is right for you, consult a licensed financial advisor before making any investment decisions.
```

### Notes

- This section does not exist in the current implementation. It is new.
- Purpose: pre-emptively addresses the CLO concern that listing protocols could be interpreted as direct endorsement or recommendation.
- Matches the "Professional Advice Disclaimer" pattern established in the Strategies page footer.
- The "You do not need to interact with any protocol yourself" line is important. It clarifies diBoaS's role as the interface layer.

---

**Transition:**

```
You probably still have questions. Good.
```

---

## SECTION 7: FAQ

**H2:**

```
Questions About Our Protocols
```

---

**Q1: Why don't you list every DeFi protocol?**

```
There are thousands of DeFi protocols. We would rather list 26 we have thoroughly researched than 200 we have not.
```

---

**Q2: How often do you update this list?**

```
We monitor all listed protocols continuously. If a protocol has a security incident, regulatory change, or significant operational issue, we update this page. We also review the full list quarterly to decide whether to add or remove protocols.
```

---

**Q3: Can I request a protocol to be added?**

```
Yes. Email hello@diboas.com with your suggestion and why you think it should be included. We review every request against our selection criteria.
```

---

**Q4: Does being listed here mean diBoaS endorses these protocols?**

```
No. Being listed means we have researched them, they meet our criteria, and we use them in our strategies. We are not affiliated with any protocol. Their inclusion does not imply they endorse diBoaS, and our listing does not constitute an endorsement or recommendation to use them directly.
```

`[CLO NOTE: This FAQ directly addresses the P2-1 concern from the Strategies page review about protocol association. Mirrors the micro-disclaimer added to the Strategies protocol table.]`

---

**Q5: What happens if a protocol gets hacked?**

```
It depends on the severity. For minor incidents that are resolved quickly, we may keep the protocol listed with an updated warning note. For serious exploits where user funds are permanently lost, we remove the protocol from our list and adjust any affected strategies. If the exploit affected an older version that we do not use, we may keep the protocol listed with a clear warning. See our selection criteria above for details. We will always communicate changes to our users.
```

---

**Q6: Why do some protocols have warning badges?**

```
The amber warning badge means the protocol has had a notable security incident, regulatory issue, or carries an elevated risk profile compared to peers. We include these protocols because they still meet our overall criteria, but we want you to see the full picture. The details are on each card.
```

---

**Q7: What is TVL and why does it matter?**

```
TVL stands for Total Value Locked. It is the total amount of money deposited in a protocol by all users worldwide. Higher TVL generally means more people trust the system with real money. It is not a guarantee of safety, but it is one signal we look at.
```

---

**Q8: Do I need to interact with these protocols myself?**

```
No. diBoaS handles all protocol interactions on your behalf when you choose a strategy. You do not need to create accounts with any protocol, manage wallets on different blockchains, or understand the technical details. This page is here for transparency, not because you need to do anything with it.
```

### Notes

- Expanded from 3 FAQs to 8. Current implementation only had 3 very thin answers.
- Q4 (endorsement) and Q8 (no direct interaction) are the most important for compliance.
- Q5 (hack response) builds trust through honesty about incident handling.
- Q7 (TVL explanation) helps casual readers understand the metric used throughout the page.

---

## SECTION 8: WAITLIST / CTA

**Transition:**

```
Satisfied with what you see? Join the waitlist.
```

**CTA:**

This section uses the shared `WaitlistSection` component. No custom copy needed. It inherits the waitlist copy from the shared component.

### Notes

- Current implementation already includes the WaitlistSection with error boundary.
- No changes needed to the component. Just ensure it renders correctly below the FAQ.

---

## SECTION 9: FOOTER

**Last updated line:**

```
Last updated: February 2026
```

**Data sources:**

```
Data sources: DeFiLlama (TVL), official protocol documentation, published security audit reports, SEC EDGAR (regulatory filings), CoinGecko, and direct protocol communications.
```

**Main disclaimer:**

```
The information on this page is for educational and transparency purposes only. It does not constitute investment advice, financial advice, or a recommendation to use any protocol listed. Protocol inclusion reflects our research and does not imply endorsement by or affiliation with any listed protocol. All DeFi protocols carry technical risk, smart contract risk, market risk, liquidity risk, and stablecoin depeg risk. Protocol performance, TVL, and regulatory status can change at any time. Only invest money you can afford to lose. diBoaS is not a bank and your funds are not insured.
```

**MiCA Article 68 (EN, DE, ES only):**

```
The value of crypto-assets may fluctuate. You may lose some or all of your money. Crypto-assets are not covered by deposit guarantee schemes.
```

**MiCA Article 7 (EN, DE, ES only):**

```
This crypto-asset marketing communication has not been reviewed or approved by any competent authority in any Member State of the European Union. The offeror of the crypto-asset is solely responsible for the content of this crypto-asset marketing communication.
```

**AI Disclosure:**

```
Certain content on this platform, including market analysis and educational materials, is generated or assisted by artificial intelligence. AI-generated content may contain errors or limitations. Users should verify information independently before making financial decisions.
```

**US Disclosure:**

```
diBoaS is a non-custodial interface providing access to decentralized finance protocols. diBoaS is not registered with the SEC, CFTC, FinCEN, or any state regulatory agency. US regulatory treatment of DeFi is evolving. You are responsible for determining whether your use of this interface complies with applicable laws.
```

**External Links:**

```
External links on this page lead to third-party websites not controlled by diBoaS. We are not responsible for their content, privacy practices, or availability.
```

**Professional Advice:**

```
Consider consulting a licensed financial advisor before making investment decisions.
```

**(c) 2026 diBoaS. All rights reserved.**

### PT-BR Footer Requirements (for localization reference)

When building the pt-BR locale, include these three CVM warnings instead of MiCA text:

```
1. Retornos passados não são garantia de retorno futuro
2. Investimentos envolvem riscos e podem ensejar perdas, inclusive da totalidade do capital investido
3. Percentuais prospectivos refletem apenas a opinião do autor, com base em informações disponíveis à época e consideradas confiáveis
```

### Locale-Specific Implementation Notes

| Locale | Action |
|--------|--------|
| EN | Include MiCA Article 68 + Article 7 + AI Disclosure + US Disclosure |
| DE | Include MiCA Article 68 + Article 7 (in German) + AI Disclosure (in German) |
| ES | Include MiCA Article 68 + Article 7 (in Spanish) + AI Disclosure (in Spanish) |
| pt-BR | Remove ALL MiCA text. Add CVM 3-Warning (in Portuguese). Include AI Disclosure (in Portuguese). |

---

## CLO BOARD REVIEW: FLAGS AND QUESTIONS

This section collects all CLO flags raised during copy creation for structured review.

### Priority 0 (Must resolve before production)

| # | Issue | Location | Status | Resolution |
|---|-------|----------|--------|------------|
| P0-1 | SEC regulatory claims | Aave, Lido, Rocket Pool, Jito cards | ✅ RESOLVED | All SEC claims verified via web search. Sources added to each card. Aave: SEC closure letter Dec 16, 2025. Lido/Rocket Pool/Jito: SEC Div. of Corp. Finance staff statement Aug 5, 2025. **Jito date corrected from March → August 2025.** |
| P0-2 | TVL freshness | Section 5, all cards | ✅ RESOLVED | Added "as of February 2026" micro-text to Section 3 header. Added crash-trigger rule to Data Freshness SLA: re-verify all TVL within 72 hours if BTC drops >25%. CTO recommendation: DeFiLlama API at build time. |

### Priority 1 (Should resolve before production)

| # | Issue | Location | Status | Resolution |
|---|-------|----------|--------|------------|
| P1-1 | "Our own money" language | Section 2 | ✅ RESOLVED | Replaced with "If it does not meet our standards, it does not make this list." Removes suitability implication. |
| P1-2 | Fluid exception | Card: Fluid | ✅ RESOLVED | Added explicit micro-text: "Exception to our 1-year minimum: Fluid launched in 2024 but is built by the Instadapp team, which has 6+ years of DeFi infrastructure experience." |
| P1-3 | Badge criteria formalization | Section 3 notes | ⏳ DEFERRED | Not a copy issue. Recommend CTO/CLO define formal rubric in implementation spec. |
| P1-3a | Coinbase/Morpho claim | Card: Morpho | ✅ RESOLVED | Verified via Coinbase blog (Jan 16, 2025), morpho.org case study, CoinDesk. $1.2B loan origination confirmed. Sources added. |
| P1-3b | Jupiter fee claim | Card: Jupiter JLP | ✅ RESOLVED | Verified $137.6M via SolanaFloor / Dune Analytics (Oct 2024). Source + date added. Note: figure likely higher at publication. |
| P1-4 | Balancer V2 exploit | Card: Balancer + Section 4 | ✅ RESOLVED (⚠️ ESCALATION NOTE) | **CRITICAL:** Only ~$28M of $128M recovered. ~$100M permanently lost. V3 unaffected; diBoaS uses V3 only. Card expanded with full exploit details + sources. Section 4 criteria updated: "no unresolved exploits affecting the version we use." Amber badge retained. **CEO should confirm comfort with keeping Balancer listed given V2 losses.** |
| P1-5 | Ethena BaFin language | Card: Ethena | ✅ RESOLVED | Rewrote from "exited after review" to full factual sequence: BaFin rejected MiCA application, ordered halt, froze reserves. Now accurately reflects forced exit, not voluntary. BVI entity disclosed. Sources added. |
| P1-6 | Ondo broker-dealer | Card: Ondo | ✅ RESOLVED | Verified Oasis Pro acquisition (Oct 6, 2025). FINRA member since 2020. ATS + Transfer Agent licenses confirmed. Sources added. |

### Priority 2 (Nice to have)

| # | Issue | Location | Status | Resolution |
|---|-------|----------|--------|------------|
| P2-1 | External link liability | All cards | ✅ RESOLVED | External link disclaimer added to footer: "External links on this page lead to third-party websites not controlled by diBoaS." |
| P2-2 | Jupiter fee claim | Card: Jupiter JLP | ✅ RESOLVED | Moved to P1-3b and resolved. |
| P2-3 | Ethena BaFin language | Card: Ethena | ✅ RESOLVED | Moved to P1-5 and resolved. |
| P2-4 | Ondo SEC broker-dealer | Card: Ondo | ✅ RESOLVED | Moved to P1-6 and resolved. |

---

## COPYWRITER REVIEW: NOTES

Areas where copywriter input would improve the page:

1. **Hero subtitle** — "Every system. Every name. Nothing hidden." works but may want alternatives tested.
2. **Category descriptions** — Currently one-liners. Could benefit from more personality while staying clear.
3. **Protocol descriptions** — Some are still slightly technical. Copywriter can push the "what does this mean for your money" angle further.
4. **Section 6 (What This Page Is Not)** — Tone check. Should feel honest and protective, not defensive or scary.
5. **FAQ answers** — Some could be shorter. Copywriter to judge length vs completeness.
6. **Transition hooks** — Only two explicit transitions in this draft. More could be added between sections.

---

## DATA FRESHNESS SLA

| Data Point | Current Value | Source | Freshness Rule |
|------------|---------------|--------|----------------|
| Protocol TVL (each card) | ~$X billion (as of Feb 2026) | DeFiLlama | Re-verify monthly. Update if change > 15%. |
| Audit counts | X+ audits | Protocol documentation | Re-verify quarterly. |
| Regulatory status | Various | SEC EDGAR, protocol announcements | Update within 48 hours of any regulatory change. |
| Combined TVL (Section 5) | $120 billion (as of Feb 2026) | DeFiLlama aggregate | Re-verify monthly. Update if change > 15%. |
| "Last updated" date (footer) | February 2026 | Manual | Update whenever any data point changes. |

**Crash-Trigger Rule (CLO P0-2):**

If BTC drops more than 25% from the last TVL verification date, ALL TVL figures on this page must be re-verified within 72 hours using current DeFiLlama data. The "Last updated" date in the footer must be refreshed to reflect the new verification. CTO recommendation: implement build-time TVL pull from DeFiLlama API rather than hardcoded values for long-term automation.

---

## CTO IMPLEMENTATION CHECKLIST

### Content Updates

- [ ] Update `protocolsData.ts` descriptions to match this copy
- [ ] Update `en/protocols.json` with new i18n strings
- [ ] Add new Section 6 ("What This Page Is Not") component
- [ ] Expand FAQ from 3 to 8 items
- [ ] Add transition hooks between sections
- [ ] Add footer legal disclosures (matching B2C/Strategies pattern)
- [ ] Add "Data sources" line to footer

### New i18n Keys Required

- `protocols.section6.header` — "What This Page Is Not"
- `protocols.section6.paragraph1` through `paragraph4`
- `protocols.faq.q4` through `protocols.faq.q8` (5 new FAQ items)
- `protocols.footer.mainDisclaimer`
- `protocols.footer.micaArticle68`
- `protocols.footer.micaArticle7`
- `protocols.footer.aiDisclosure`
- `protocols.footer.usDisclosure`
- `protocols.footer.professionalAdvice`
- `protocols.footer.dataSources`
- `protocols.transitions.t1` through `protocols.transitions.t5` (5 total: Section 1→2, 3→4, 4→5, 5→6, 6→7)
- `protocols.card.usedInStrategies` (shared micro-line template for 6 active protocol cards)

### Cross-Page Consistency

- [ ] Verify protocol names match between Strategies page protocol table and this page
- [ ] Verify TVL numbers are consistent (or note that each page has its own freshness date)
- [ ] Footer disclaimers should use identical text across B2C, Strategies, and Protocols pages

### Locale Tasks

- [ ] EN: implement this document as-is
- [ ] DE: translate (separate document)
- [ ] ES: translate (separate document)
- [ ] pt-BR: translate, remove MiCA, add CVM warnings (separate document)

---

## DOCUMENT HISTORY

| Version | Date | Changes |
|---------|------|---------|
| DRAFT | Feb 28, 2026 | Full rewrite from current implementation. New sections (6, expanded FAQ, footer). CLO flags raised. Compliance patterns from B2C + Strategies applied. |
| v1.1 | Feb 28, 2026 | **CLO P0/P1 audit fixes applied.** All SEC claims verified + sourced (Aave Dec 2025, Lido/RP/Jito Aug 2025). Jito date corrected March→August. "Our own money" → "our standards." Fluid exception note added. Morpho/Coinbase sourced ($1.2B). Jupiter JLP dated (Oct 2024). Balancer card expanded with full $128M exploit details + $100M unrecovered disclosure. Section 4 criteria updated for version-specific exploit language. Ethena BaFin rewritten as forced exit. Ondo sourced to FINRA/Oasis Pro. TVL freshness framework + crash-trigger rule added. |
| v1.2 | Feb 28, 2026 | **CLO second-pass polish.** Section 4 criterion #3 tightened from 3 sentences to 2 (style consistency with other criteria). FAQ Q5 updated with version-specific exploit cross-reference (eliminates Balancer tension). External link disclaimer added to footer (closes P2-1). |
| v1.3 | Feb 28, 2026 | **Copywriter audit fixes.** FIX-1: 6 protocol cards updated with "what does this mean for my money" payoff sentences (Kamino, EigenLayer, Fluid, Balancer, Orca, Huma). FIX-2: 3 transition hooks added (Section 4→5, 5→6, 6→7). FIX-3: "Used in diBoaS strategies" micro-lines added to all 6 active protocol cards with verified strategy names from JSON. FIX-4: Section 2 rewritten with warmer voice + explains 26 listed vs 6 used. FIX-5: Sky card title → "Sky Protocol / SSR", Sanctum → "Sanctum (INF)" for cross-page naming consistency. FIX-6: Sky chain field updated to note Arbitrum deployment. POLISH: Section 6 warm line added, FAQ Q1 tightened, $120B context comparison added, Section 8 transition updated. |

**Status: ✅ CLO APPROVED FOR PRODUCTION — US, EU, BRAZIL. ✅ COPYWRITER APPROVED (6 fixes + 4 polish applied). Pending: CEO confirmation on Balancer listing (CLO says defensible). Badge rubric deferred to CTO/CLO internal docs. Category personality sentences deferred to post-launch (POLISH-1).**
