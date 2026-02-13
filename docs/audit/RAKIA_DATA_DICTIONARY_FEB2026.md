# Rakia Board — Data Dictionary

**Document Version:** 1.0  
**Date:** February 10, 2026  
**Prepared by:** Rakia Board (Investment/DeFi Opportunities Analyst)  
**Companion to:** RAKIA_UNIFIED_AUDIT_REPORT_FEB2026.md  
**Purpose:** Comprehensive reference for all data elements collected by diboas-analytics

---

## Document Structure

Each data element is documented with:

| Attribute | Description |
|-----------|-------------|
| **Name** | The specific data point (e.g., "BTC Price", not "crypto_prices.csv") |
| **Granularity** | Data resolution: Hourly, Daily, Weekly, Monthly |
| **Update Frequency** | How often it should be refreshed |
| **Source** | API endpoint or data provider |
| **So What** | Plain English explanation of what this data means |
| **Reason** | Why diBoaS collects this data and how it's used |

---

## Table of Contents

1. [Crypto Price Data](#1-crypto-price-data)
2. [DeFi Protocol Yields](#2-defi-protocol-yields)
3. [Perpetual LP Yields](#3-perpetual-lp-yields)
4. [Treasury Yields & Fixed Income](#4-treasury-yields--fixed-income)
5. [TradFi Market Data](#5-tradfi-market-data)
6. [Capital Rotation Indicators](#6-capital-rotation-indicators)
7. [Macro Economic Data](#7-macro-economic-data)
8. [Credit Spreads](#8-credit-spreads)
9. [Sentiment Indicators](#9-sentiment-indicators)
10. [On-Chain Intelligence](#10-on-chain-intelligence)
11. [Institutional Flows](#11-institutional-flows)
12. [Commodities](#12-commodities)

---

## 1. Crypto Price Data

**CSV File:** `crypto_prices.csv`

### 1.1 BTC Price (Bitcoin)

| Attribute | Value |
|-----------|-------|
| **Name** | Bitcoin Closing Price (USD) |
| **Granularity** | Daily |
| **Update Frequency** | Daily (after 00:00 UTC) |
| **Source** | Yahoo Finance API (`BTC-USD`) or CoinGecko API |
| **So What** | The price at which Bitcoin closed trading for the day. Bitcoin is the largest cryptocurrency by market cap and serves as the benchmark for the entire crypto market. When BTC goes up, most other crypto assets tend to follow. |
| **Reason** | Used for: (1) Strategy performance benchmarking, (2) Battle Test backtesting, (3) Adelaide newsletter market updates, (4) Correlation analysis with traditional assets, (5) Calculating user portfolio values in Strategies 4-10 that have crypto exposure. |

### 1.2 ETH Price (Ethereum)

| Attribute | Value |
|-----------|-------|
| **Name** | Ethereum Closing Price (USD) |
| **Granularity** | Daily |
| **Update Frequency** | Daily (after 00:00 UTC) |
| **Source** | Yahoo Finance API (`ETH-USD`) or CoinGecko API |
| **So What** | The daily closing price of Ethereum, the second-largest cryptocurrency. ETH powers most DeFi protocols including Aave, Compound, and Sky where diBoaS strategies deploy capital. |
| **Reason** | Used for: (1) Strategies 4-6 that have ETH-based yields, (2) Gas cost estimation for Ethereum-based strategies, (3) DeFi protocol health monitoring, (4) Adelaide market context. |

### 1.3 SOL Price (Solana)

| Attribute | Value |
|-----------|-------|
| **Name** | Solana Closing Price (USD) |
| **Granularity** | Daily |
| **Update Frequency** | Daily (after 00:00 UTC) |
| **Source** | Yahoo Finance API (`SOL-USD`) or CoinGecko API |
| **So What** | The daily price of Solana, a high-performance blockchain. SOL is the native token used for staking in Jito, Sanctum, and Jupiter protocols where diBoaS deploys Solana-based strategies. |
| **Reason** | Used for: (1) Strategies 7-10 that use Solana protocols, (2) JitoSOL and Sanctum INF staking returns, (3) Jupiter JLP performance tracking, (4) Solana ecosystem health monitoring. |

### 1.4 USDC Price

| Attribute | Value |
|-----------|-------|
| **Name** | USD Coin Price |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Yahoo Finance API (`USDC-USD`) or CoinGecko API |
| **So What** | USDC is a regulated stablecoin pegged to $1.00. Price deviations from $1.00 indicate stress in crypto markets. A "depeg" below $0.99 is a critical risk event. |
| **Reason** | Used for: (1) **Depeg detection** — MANDATORY monitoring per CLO Board, (2) Primary stablecoin for all diBoaS strategies, (3) Risk alerts if price deviates >0.5% from $1.00, (4) Compliance with stablecoin risk disclosure requirements. |

### 1.5 USDT Price

| Attribute | Value |
|-----------|-------|
| **Name** | Tether Price |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Yahoo Finance API (`USDT-USD`) or CoinGecko API |
| **So What** | USDT is the largest stablecoin by market cap. It's particularly popular in emerging markets and on the Tron blockchain. Price stability is critical for user confidence. |
| **Reason** | Used for: (1) **Depeg detection** — MANDATORY monitoring per CLO Board, (2) USDT/Tron support planned for Q3/Q4 2026, (3) Emerging market user flows (Brazil focus), (4) Stablecoin ecosystem health indicator. |

---

## 2. DeFi Protocol Yields

**CSV Files:** `defillama_historical_apy.csv`, `sky_ssr_historical_apy.csv`, `compound_v3_arbitrum_usdc_apy.csv`, `sanctum_inf_historical_apy.csv`, `jito_historical_apy.csv`

### 2.1 Sky Savings Rate (SSR) APY

| Attribute | Value |
|-----------|-------|
| **Name** | Sky Savings Rate Annual Percentage Yield |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | DeFiLlama Yields API — Pool ID: `d8c4eff5-c8a9-46fc-a888-057c4c668e72` |
| **So What** | The yield you earn by depositing USDS (formerly DAI) into Sky Protocol's savings contract. This is a governance-controlled rate set by Sky DAO, typically ranging 4-12%. It's one of the most stable DeFi yields available. |
| **Reason** | Used in: **Strategies 1-9** (all except Full Throttle). Sky SSR is the primary stable yield anchor for conservative strategies. Critical for: (1) Adelaide yield updates, (2) "Beat Inflation" strategy validation, (3) Battle Test backtesting, (4) Strategy allocation decisions. **NOTE:** Strategy Board found actual rate is ~4%, lower than previously assumed 6-10%. |

### 2.2 Compound V3 USDC APY (Arbitrum)

| Attribute | Value |
|-----------|-------|
| **Name** | Compound V3 USDC Lending Yield on Arbitrum L2 |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | DeFiLlama Yields API — Pool ID: `d9c395b9-00d0-4426-a6b3-572a6dd68e54` |
| **So What** | The yield earned by lending USDC on Compound V3's Arbitrum deployment. Includes base lending rate plus COMP token rewards. Rates vary with utilization — higher borrowing demand means higher yields. Historical range: 3-20%. |
| **Reason** | Used in: **Strategies 1, 3, 5, 7, 9** (stable-focused strategies). Provides: (1) Alternative yield source when Sky SSR is low, (2) L2 deployment reduces gas costs, (3) COMP rewards add extra yield, (4) Portfolio diversification across protocols. |

### 2.3 Aave V3 USDC APY

| Attribute | Value |
|-----------|-------|
| **Name** | Aave V3 USDC Lending Yield |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | DeFiLlama Yields API — Multiple chains (Ethereum, Arbitrum, Base) |
| **So What** | Yield from lending USDC on Aave, the largest DeFi lending protocol with $35B+ TVL. Aave is considered the "blue chip" of DeFi lending — battle-tested and audited. |
| **Reason** | Used in: **Strategies 4-6**. Provides: (1) Institutional-grade DeFi exposure, (2) Cross-chain yield optimization, (3) Deep liquidity for large positions, (4) Protocol treasury health monitoring. |

### 2.4 Jito LST (JitoSOL) APY

| Attribute | Value |
|-----------|-------|
| **Name** | Jito Liquid Staking Token Yield |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | DeFiLlama Yields API — Pool ID: `0e7d0722-9054-4907-8593-567b353c0900` |
| **So What** | The yield from staking SOL through Jito's liquid staking protocol. Combines: (1) Base Solana staking rewards (~7-8%), and (2) MEV rewards from Jito's validator network. JitoSOL holders get staking rewards while keeping SOL liquid. |
| **Reason** | Used in: **Strategies 7, 9**. Provides: (1) Solana staking exposure, (2) MEV rewards unique to Jito, (3) Liquid position (can exit anytime vs. native staking lockup), (4) Yield enhancement over basic SOL staking. |

### 2.5 Sanctum Infinity (INF) APY

| Attribute | Value |
|-----------|-------|
| **Name** | Sanctum Infinity LST Basket Yield |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | **Calculated** from DeFiLlama Protocol API + Fees API (not direct yield endpoint) |
| **So What** | Sanctum INF is a basket of Solana liquid staking tokens. It earns: (1) Base staking yield (~7.5%), plus (2) Trading fees when users swap between LSTs. Think of it as an index fund of Solana staking. Historical range: 5.9-14.6%. |
| **Reason** | Used in: **Strategies 2, 4, 6, 8, 10** (crypto-exposure strategies). Provides: (1) Diversified LST exposure, (2) Trading fee income, (3) Lower single-protocol risk than pure JitoSOL, (4) DeFi composability. **NOTE:** Requires special calculation — not available via standard yield API. |

### 2.6 Lido stETH APY

| Attribute | Value |
|-----------|-------|
| **Name** | Lido Staked ETH Yield |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | DeFiLlama Yields API |
| **So What** | The yield from staking ETH through Lido, the largest liquid staking provider on Ethereum (~$27B TVL). stETH earns Ethereum consensus rewards (~3-4%) while remaining liquid and usable in DeFi. |
| **Reason** | Used for: (1) ETH-based strategy benchmarking, (2) Understanding Ethereum staking economics, (3) Protocol health monitoring (Lido is systemic to Ethereum DeFi), (4) Adelaide context for ETH yield strategies. |

---

## 3. Perpetual LP Yields

**CSV Files:** `jupiter_jlp_historical_apy.csv`, `perps_lp_combined_apy.csv`, `gmx_v2_current_apy.csv`

### 3.1 Jupiter JLP APY

| Attribute | Value |
|-----------|-------|
| **Name** | Jupiter Perpetuals Liquidity Provider Yield |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Jupiter API (`https://perps-api.jup.ag/v1/statistics`) |
| **So What** | JLP is Jupiter's liquidity pool for perpetual futures trading on Solana. LPs earn: (1) 75% of trading fees, (2) Borrowing fees from traders. Higher trading volume = higher yields. Risk: LPs are counterparty to traders — they lose when traders win big. Historical APY: 20-80%. |
| **Reason** | Used in: **Strategies 9-10** (aggressive). Provides: (1) High yield potential, (2) Perps market exposure, (3) Solana ecosystem diversification. Risk disclosure required for Adelaide. **NOTE:** Higher risk than lending protocols — users must understand counterparty risk. |

### 3.2 GMX V2 GLP/GM APY

| Attribute | Value |
|-----------|-------|
| **Name** | GMX V2 Liquidity Provider Yield |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | GMX Subgraph (GraphQL API) |
| **So What** | GMX V2 is the leading perpetuals DEX on Arbitrum. GM tokens represent liquidity provided to specific markets (ETH, BTC, etc.). LPs earn trading fees and funding payments. Similar risk profile to JLP — counterparty to traders. |
| **Reason** | Used in: **Strategies 9-10**. Provides: (1) Arbitrum L2 exposure, (2) Diversification from Jupiter, (3) Different trader population than Solana. Comparison with JLP helps identify best perps LP opportunity. |

---

## 4. Treasury Yields & Fixed Income

**CSV Files:** `treasury_yields.csv`, `real_yields.csv`

### 4.1 US 2-Year Treasury Yield

| Attribute | Value |
|-----------|-------|
| **Name** | 2-Year US Treasury Constant Maturity Rate |
| **Granularity** | Daily |
| **Update Frequency** | Daily (after US market close) |
| **Source** | FRED API — Series: `DGS2` |
| **So What** | The yield on a 2-year US government bond. The 2Y yield closely tracks Federal Reserve interest rate expectations. When markets expect the Fed to cut rates, the 2Y yield falls. It's the market's best guess at where short-term rates are heading. |
| **Reason** | Used for: (1) Yield curve calculations (2s10s spread), (2) Fed policy expectations, (3) Opportunity cost comparison for DeFi yields, (4) Adelaide macro context. If 2Y yield is 5% and DeFi yields are 4%, traditional savings look more attractive. |

### 4.2 US 10-Year Treasury Yield

| Attribute | Value |
|-----------|-------|
| **Name** | 10-Year US Treasury Constant Maturity Rate |
| **Granularity** | Daily |
| **Update Frequency** | Daily (after US market close) |
| **Source** | FRED API — Series: `DGS10` |
| **So What** | The benchmark US government bond yield. The 10Y yield affects everything from mortgage rates to corporate borrowing costs. It represents the market's view on long-term inflation and growth. When it rises sharply, risk assets (including crypto) often fall. |
| **Reason** | Used for: (1) **Key macro indicator** for Adelaide, (2) Real yield calculation (10Y nominal - inflation), (3) TLT price correlation, (4) Regime classification (high rates = tighter financial conditions). |

### 4.3 US 30-Year Treasury Yield

| Attribute | Value |
|-----------|-------|
| **Name** | 30-Year US Treasury Constant Maturity Rate |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | FRED API — Series: `DGS30` |
| **So What** | The yield on long-duration US government debt. The 30Y reflects very long-term inflation expectations and economic outlook. Moves more slowly than shorter maturities but signals major regime shifts. |
| **Reason** | Used for: (1) Long-term rate environment assessment, (2) 2s30s yield curve spread, (3) Pension fund allocation context, (4) Adelaide long-term macro outlook. |

### 4.4 2s10s Yield Spread

| Attribute | Value |
|-----------|-------|
| **Name** | 2-Year vs 10-Year Treasury Yield Spread |
| **Granularity** | Daily |
| **Update Frequency** | Daily (calculated) |
| **Source** | Calculated: 10Y Yield - 2Y Yield |
| **So What** | The difference between 10-year and 2-year Treasury yields. **Inverted curve** (negative spread) has historically preceded every US recession in the past 50 years. When short-term rates exceed long-term rates, it signals the market expects economic trouble ahead. |
| **Reason** | **CRITICAL recession indicator** for: (1) Adelaide macro alerts, (2) Risk regime classification, (3) Strategy allocation guidance. An inverted curve is a warning to reduce risk exposure. |

### 4.5 10-Year Real Yield (TIPS)

| Attribute | Value |
|-----------|-------|
| **Name** | 10-Year Treasury Inflation-Protected Securities Yield |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | FRED API — Series: `DFII10` |
| **So What** | The real (inflation-adjusted) yield on 10-year Treasuries. **Negative real yields** mean holding cash loses purchasing power — this historically drives money into risk assets like crypto. **Positive real yields** above 1.5% create stiff competition for crypto. |
| **Reason** | **#2 macro indicator** after M2 liquidity. Used for: (1) "Beat Inflation" strategy validation, (2) Adelaide yield context, (3) Opportunity cost analysis. If real yields are +2%, DeFi must offer meaningfully higher returns to compensate for smart contract risk. |

---

## 5. TradFi Market Data

**CSV File:** `tradfi_benchmark_data.csv`

### 5.1 S&P 500 Index

| Attribute | Value |
|-----------|-------|
| **Name** | S&P 500 Index Closing Value |
| **Granularity** | Daily |
| **Update Frequency** | Daily (after US market close) |
| **Source** | Yahoo Finance API (`^GSPC`) |
| **So What** | The benchmark US stock index tracking 500 large companies. When S&P 500 rises, it indicates risk appetite is healthy — investors are comfortable owning equities. BTC has 0.6-0.8 correlation with S&P 500 during risk-on periods. |
| **Reason** | Used for: (1) Risk sentiment gauge, (2) Correlation analysis with crypto, (3) Adelaide TradFi context, (4) Regime classification (rising S&P = risk-on). |

### 5.2 NASDAQ Composite

| Attribute | Value |
|-----------|-------|
| **Name** | NASDAQ Composite Index Closing Value |
| **Granularity** | Daily |
| **Update Frequency** | Daily (after US market close) |
| **Source** | Yahoo Finance API (`^IXIC`) |
| **So What** | Tech-heavy US stock index. NASDAQ moves more aggressively than S&P 500 and correlates even more closely with crypto. When tech stocks sell off, crypto typically follows. |
| **Reason** | Used for: (1) Tech sector sentiment, (2) Higher beta correlation with crypto than S&P, (3) MAG 7 stock proxy, (4) Adelaide risk context. |

### 5.3 VIX (Fear Index)

| Attribute | Value |
|-----------|-------|
| **Name** | CBOE Volatility Index |
| **Granularity** | Daily (real-time during market hours) |
| **Update Frequency** | Daily |
| **Source** | Yahoo Finance API (`^VIX`) |
| **So What** | The "fear gauge" — measures expected S&P 500 volatility over 30 days. VIX below 15 = complacent markets. VIX above 30 = elevated fear. VIX above 40 = panic. High VIX readings often precede or accompany crypto selloffs. |
| **Reason** | **Key risk indicator** for: (1) Adelaide fear/greed context, (2) Risk regime classification, (3) Potential entry signals (VIX spikes can mark bottoms), (4) Alert thresholds for user notifications. |

### 5.4 DXY (US Dollar Index)

| Attribute | Value |
|-----------|-------|
| **Name** | US Dollar Index |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Yahoo Finance API (`DX-Y.NYB`) |
| **So What** | Measures USD strength against a basket of major currencies. **Strong inverse correlation with crypto** — when DXY rises, BTC typically falls. DXY above 105 is a headwind; DXY below 100 is a tailwind for risk assets. |
| **Reason** | Used for: (1) Macro regime assessment, (2) Adelaide dollar context, (3) Emerging market impact (strong USD hurts Brazil), (4) Risk-on/off classification. |

### 5.5 Bovespa Index (Brazil)

| Attribute | Value |
|-----------|-------|
| **Name** | Bovespa Stock Index (IBOVESPA) |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Yahoo Finance API (`^BVSP`) |
| **So What** | Brazil's main stock index. Relevant for diBoaS's Brazil market focus. Bovespa performance indicates local risk appetite and economic conditions for Brazilian users. |
| **Reason** | Used for: (1) **Brazil market context** for Adelaide PT-BR edition, (2) BRL/USD correlation analysis, (3) Regional risk sentiment, (4) Brazilian user portfolio context. |

---

## 6. Capital Rotation Indicators

**CSV File:** `rotation_indicators.csv`

### 6.1 SPY/TLT Ratio

| Attribute | Value |
|-----------|-------|
| **Name** | S&P 500 ETF to 20+ Year Treasury ETF Ratio |
| **Granularity** | Daily |
| **Update Frequency** | Daily (calculated) |
| **Source** | Calculated from Yahoo Finance: SPY price ÷ TLT price |
| **So What** | Measures rotation between stocks and bonds. **Rising ratio** = money flowing into stocks (risk-on). **Falling ratio** = money flowing into bonds (risk-off). Crossing above/below 50-day moving average signals regime changes. |
| **Reason** | **Primary rotation indicator** for: (1) Risk regime classification, (2) Adelaide macro guidance, (3) Strategy allocation suggestions, (4) Automated alert triggers. |

### 6.2 XLF/XLU Ratio

| Attribute | Value |
|-----------|-------|
| **Name** | Financial Sector to Utilities Sector Ratio |
| **Granularity** | Daily |
| **Update Frequency** | Daily (calculated) |
| **Source** | Calculated from Yahoo Finance: XLF price ÷ XLU price |
| **So What** | Measures rotation between cyclical (financials) and defensive (utilities) sectors. **Rising ratio** = cyclical outperformance (economic optimism). **Falling ratio** = defensive outperformance (economic caution). |
| **Reason** | Used for: (1) Economic cycle positioning, (2) Leading indicator for broader risk appetite, (3) Adelaide sector context, (4) Complements SPY/TLT signal. |

### 6.3 IWM/SPY Ratio

| Attribute | Value |
|-----------|-------|
| **Name** | Small Cap to Large Cap Ratio |
| **Granularity** | Daily |
| **Update Frequency** | Daily (calculated) |
| **Source** | Calculated from Yahoo Finance: IWM price ÷ SPY price |
| **So What** | Measures relative performance of small caps vs large caps. **Rising ratio** = risk appetite for smaller, riskier companies. **Falling ratio** = flight to quality (large cap safety). Small caps often lead crypto moves. |
| **Reason** | Used for: (1) Risk appetite gauge, (2) Breadth indicator (healthy rally lifts all boats), (3) Leading signal for crypto, (4) Adelaide market breadth context. |

### 6.4 Copper/Gold Ratio

| Attribute | Value |
|-----------|-------|
| **Name** | Copper Futures to Gold Futures Price Ratio |
| **Granularity** | Daily |
| **Update Frequency** | Daily (calculated) |
| **Source** | Calculated from Yahoo Finance: HG=F price ÷ GC=F price |
| **So What** | "Dr. Copper" is an economic barometer — copper demand rises with industrial activity. Gold is a safe haven. **Rising ratio** = economic growth expectations. **Falling ratio** = growth concerns, defensive positioning. |
| **Reason** | Used for: (1) Global growth expectations, (2) Industrial vs safe-haven sentiment, (3) Adelaide macro context, (4) Leading indicator for risk assets. |

---

## 7. Macro Economic Data

**CSV File:** `global_liquidity.csv`

### 7.1 US M2 Money Supply

| Attribute | Value |
|-----------|-------|
| **Name** | US M2 Money Supply (Billions USD) |
| **Granularity** | Monthly |
| **Update Frequency** | Monthly (released ~3 weeks after month end) |
| **Source** | FRED API — Series: `M2SL` |
| **So What** | Total money in circulation including cash, checking deposits, and savings. **THIS IS THE #1 MACRO INDICATOR FOR CRYPTO.** When M2 grows (money printing), risk assets rise. When M2 shrinks (QT), risk assets fall. BTC has ~0.85 correlation with global M2. |
| **Reason** | **CRITICAL indicator** for: (1) Adelaide macro regime, (2) Long-term crypto outlook, (3) Liquidity cycle timing, (4) "Why crypto?" narrative support. M2 expansion = fiat debasement = crypto bullish narrative. |

### 7.2 US M2 Year-over-Year Change

| Attribute | Value |
|-----------|-------|
| **Name** | US M2 Annual Growth Rate |
| **Granularity** | Monthly |
| **Update Frequency** | Monthly (calculated) |
| **Source** | Calculated from M2SL: (Current - 12 months ago) ÷ 12 months ago × 100 |
| **So What** | The percentage change in money supply compared to one year ago. **M2 YoY > 5%** = liquidity expansion, bullish for risk assets. **M2 YoY < 0%** = liquidity contraction, bearish. Regime changes (crossing 0%) are major signals. |
| **Reason** | Used for: (1) Liquidity regime classification, (2) Adelaide macro alerts, (3) Historical correlation analysis, (4) Long-term strategy positioning. |

---

## 8. Credit Spreads

**CSV File:** `credit_spreads.csv`

### 8.1 High-Yield Credit Spread

| Attribute | Value |
|-----------|-------|
| **Name** | ICE BofA US High Yield Index Option-Adjusted Spread |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | FRED API — Series: `BAMLH0A0HYM2` |
| **So What** | The extra yield investors demand to hold risky corporate bonds vs safe Treasuries. **Tight spreads (<300bps)** = credit markets healthy, risk-on. **Wide spreads (>500bps)** = credit stress, risk-off. Blowouts (>700bps) indicate crisis. |
| **Reason** | Used for: (1) Credit market health, (2) Risk regime classification, (3) Leading indicator for equity/crypto stress, (4) Adelaide risk context. Widening spreads often precede equity selloffs. |

### 8.2 Investment-Grade Credit Spread

| Attribute | Value |
|-----------|-------|
| **Name** | ICE BofA BBB US Corporate Index Spread |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | FRED API — Series: `BAMLC0A4CBBB` |
| **So What** | Spread for investment-grade corporate bonds. Less volatile than high-yield but still informative. Widening IG spreads indicate broad credit concerns, not just junk bond stress. |
| **Reason** | Used for: (1) Broad credit market health, (2) HY-IG differential calculation, (3) Systemic risk indicator, (4) Adelaide context for institutional sentiment. |

---

## 9. Sentiment Indicators

**CSV Files:** `sentiment_indicators.csv`, `aaii_sentiment.csv`

### 9.1 Crypto Fear & Greed Index

| Attribute | Value |
|-----------|-------|
| **Name** | Alternative.me Crypto Fear & Greed Index |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Alternative.me API: `https://api.alternative.me/fng/` (FREE, no API key) |
| **So What** | A 0-100 index measuring crypto market sentiment. 0-24 = Extreme Fear, 25-44 = Fear, 45-55 = Neutral, 56-75 = Greed, 76-100 = Extreme Greed. **Best used as contrarian indicator** — extreme fear often marks bottoms, extreme greed often marks tops. |
| **Reason** | Used for: (1) Adelaide sentiment section, (2) Contrarian entry/exit signals, (3) User psychology context, (4) Risk warnings during extreme greed. Helps users avoid buying tops and selling bottoms. |

### 9.2 AAII Bull Sentiment

| Attribute | Value |
|-----------|-------|
| **Name** | AAII Investor Sentiment Survey — Bullish Percentage |
| **Granularity** | Weekly |
| **Update Frequency** | Weekly (Thursday) |
| **Source** | AAII website (manual collection or scraping) |
| **So What** | Percentage of retail investors who are bullish on stocks. **Contrarian indicator** — extreme bullishness (>50%) often precedes pullbacks. Extreme bearishness (<20%) often precedes rallies. Measures the "average investor" mindset. |
| **Reason** | Used for: (1) Adelaide contrarian signals, (2) Retail sentiment context, (3) TradFi sentiment crossover, (4) Historical accuracy tracking. |

### 9.3 BTC Perpetual Funding Rate

| Attribute | Value |
|-----------|-------|
| **Name** | Bitcoin Perpetual Futures Funding Rate |
| **Granularity** | 8-hourly |
| **Update Frequency** | Every 8 hours |
| **Source** | Binance API: `https://fapi.binance.com/fapi/v1/fundingRate` |
| **So What** | The fee longs pay shorts (positive) or shorts pay longs (negative) to keep perpetual futures price aligned with spot. **High positive funding (>0.1%)** = overleveraged longs, potential for liquidation cascade. **Negative funding** = crowded shorts, potential for squeeze. |
| **Reason** | Used for: (1) Leverage sentiment, (2) Liquidation risk assessment, (3) Adelaide positioning context, (4) Short-term directional bias. Extreme funding rates often precede reversals. |

---

## 10. On-Chain Intelligence

**CSV Files:** `estate_wallet_tracker.csv`, `market_maker_wallet_tracker.csv`, `whale_wallet_master_list.csv`, `protocol_treasury_tracker.csv`

### 10.1 Mt. Gox Estate Wallet Balance

| Attribute | Value |
|-----------|-------|
| **Name** | Mt. Gox Bankruptcy Trustee BTC Holdings |
| **Granularity** | Real-time (15-minute checks) |
| **Update Frequency** | Every 15 minutes for active monitoring |
| **Source** | Blockchain.info API, Arkham Intelligence (labeled wallets) |
| **So What** | Mt. Gox still holds ~47,000 BTC (~$4.7B) to distribute to creditors. **Any outflow is a critical event** — past Mt. Gox distributions crashed BTC 50%+. This is the single largest known selling pressure in crypto. |
| **Reason** | **CRITICAL RISK INDICATOR** for: (1) Immediate Adelaide alerts, (2) Push notifications to users, (3) diBoaS competitive moat (no other consumer platform tracks this), (4) Protecting user capital from predictable selloffs. |

### 10.2 FTX Estate Wallet Balance

| Attribute | Value |
|-----------|-------|
| **Name** | FTX Bankruptcy Estate Crypto Holdings |
| **Granularity** | Real-time |
| **Update Frequency** | Every 15 minutes |
| **Source** | Etherscan API, Arkham Intelligence |
| **So What** | FTX estate holds $5-7B in mixed crypto assets being liquidated. Court-approved sales can move markets. Large transfers to exchanges signal imminent selling. |
| **Reason** | **Critical risk indicator** for: (1) Adelaide alerts, (2) Market impact warnings, (3) Timing around court-approved sales, (4) User capital protection. |

### 10.3 Market Maker Net Flows

| Attribute | Value |
|-----------|-------|
| **Name** | Tier 1 Market Maker 7-Day Net Balance Change |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Etherscan/Solscan APIs, Arkham Intelligence labels |
| **So What** | Tracks whether major market makers (Wintermute, Jump, Cumberland, GSR) are accumulating or distributing crypto. **Net accumulation >$50M/week** = bullish signal. **Net distribution >$50M/week** = bearish signal. Market makers often move before retail. |
| **Reason** | Used for: (1) Smart money signals, (2) Directional bias confirmation, (3) Adelaide "what institutions are doing" context, (4) Early warning of distribution patterns. |

### 10.4 Whale Wallet Activity

| Attribute | Value |
|-----------|-------|
| **Name** | Large Holder (>1000 BTC) Wallet Movements |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Blockchain APIs, Arkham Intelligence |
| **So What** | Tracks wallets holding >$50M in crypto. Dormant whales awakening (first move in 12+ months) is historically significant. Large whale transfers to exchanges often precede selling. |
| **Reason** | Used for: (1) Large holder sentiment, (2) Dormancy pattern alerts, (3) Exchange flow warnings, (4) Adelaide "whale watching" section. |

---

## 11. Institutional Flows

**CSV Files:** `btc_etf_holdings.csv`, `corporate_btc_holdings.csv`, `institutional_13f.csv`

### 11.1 BTC ETF Daily Flows

| Attribute | Value |
|-----------|-------|
| **Name** | Bitcoin Spot ETF Daily Net Flows (USD) |
| **Granularity** | Daily |
| **Update Frequency** | Daily (after US market close) |
| **Source** | Farside Investors (`farside.co.uk/btc`), SoSoValue |
| **So What** | Net buying/selling of Bitcoin through spot ETFs. **Daily inflows >$500M** = strong institutional demand. **Daily outflows >$500M** = institutional selling. ETF flows have been the primary BTC price driver since January 2024 launch. |
| **Reason** | **Key institutional indicator** for: (1) Adelaide institutional section, (2) Demand/supply analysis, (3) Price support levels, (4) "Smart money" narrative for users. |

### 11.2 IBIT (BlackRock) Holdings

| Attribute | Value |
|-----------|-------|
| **Name** | iShares Bitcoin Trust Total BTC Holdings |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | BlackRock disclosures, Farside Investors |
| **So What** | BlackRock's Bitcoin ETF is the largest, with $50B+ AUM. IBIT flows dominate total ETF flows. BlackRock accumulation signals institutional legitimacy and sustained demand. |
| **Reason** | Used for: (1) Institutional adoption narrative, (2) Total ETF flow context, (3) Adelaide "BlackRock is buying" messaging, (4) Long-term demand trends. |

### 11.3 Corporate BTC Holdings

| Attribute | Value |
|-----------|-------|
| **Name** | Public Company Bitcoin Treasury Holdings |
| **Granularity** | Quarterly |
| **Update Frequency** | Quarterly (after earnings) |
| **Source** | BitcoinTreasuries.net, SEC 10-Q/8-K filings |
| **So What** | Total BTC held by public companies (MicroStrategy, Tesla, Block, etc.). MicroStrategy alone holds 400,000+ BTC. Corporate adoption legitimizes BTC as treasury asset. New corporate buyers signal institutional acceptance. |
| **Reason** | Used for: (1) Institutional adoption tracking, (2) Adelaide corporate section, (3) Supply absorption analysis, (4) "Companies are buying" narrative. |

### 11.4 13F Institutional Holdings

| Attribute | Value |
|-----------|-------|
| **Name** | Quarterly Institutional Crypto Exposure (13F Filings) |
| **Granularity** | Quarterly |
| **Update Frequency** | Quarterly (45 days after quarter end) |
| **Source** | SEC EDGAR — 13F-HR filings |
| **So What** | Large investors ($100M+ AUM) must disclose holdings quarterly. Tracks positions in crypto-related stocks (COIN, MSTR) and ETFs (IBIT, FBTC). Shows what BlackRock, Fidelity, Bridgewater, etc. are actually holding. |
| **Reason** | Used for: (1) Institutional positioning, (2) Adelaide quarterly updates, (3) Smart money sentiment, (4) Crowded trade identification. **NOTE:** Manual collection required — parsing is complex. |

---

## 12. Commodities

**CSV File:** `commodities.csv`

### 12.1 Gold Price

| Attribute | Value |
|-----------|-------|
| **Name** | Gold Futures Closing Price (USD/oz) |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Yahoo Finance API (`GC=F`) |
| **So What** | Gold is the traditional safe-haven asset. Rising gold often indicates inflation fears or geopolitical uncertainty. Gold competes with Bitcoin for "store of value" narrative. Central banks buying gold signals de-dollarization trends. |
| **Reason** | Used for: (1) Copper/Gold ratio calculation, (2) Safe-haven demand indicator, (3) "Digital gold" BTC comparison, (4) Adelaide macro context. |

### 12.2 Copper Price

| Attribute | Value |
|-----------|-------|
| **Name** | Copper Futures Closing Price (USD/lb) |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Yahoo Finance API (`HG=F`) |
| **So What** | "Dr. Copper" — called this because copper demand reflects global industrial activity and economic health. Rising copper = economic growth. Falling copper = growth concerns. Leading indicator for the global economy. |
| **Reason** | Used for: (1) Copper/Gold ratio (growth vs safety), (2) Global economic health proxy, (3) Industrial demand indicator, (4) Adelaide macro context. |

### 12.3 Crude Oil Price

| Attribute | Value |
|-----------|-------|
| **Name** | WTI Crude Oil Futures Closing Price (USD/barrel) |
| **Granularity** | Daily |
| **Update Frequency** | Daily |
| **Source** | Yahoo Finance API (`CL=F`) |
| **So What** | Oil prices affect everything from inflation to consumer spending. Oil spikes hurt economic growth and can trigger Fed hawkishness. Oil crashes signal recession fears. Major input cost for the global economy. |
| **Reason** | Used for: (1) Inflation expectations, (2) Geopolitical risk gauge, (3) Consumer impact for Adelaide users, (4) Energy sector context. |

---

## Appendix A: Data Collection Priority Matrix

| Priority | Data Element | Status | Impact |
|----------|--------------|--------|--------|
| 🔴 P0 | USDC Depeg Detection | ✅ Monitoring | Risk mitigation |
| 🔴 P0 | USDT Depeg Detection | ✅ Monitoring | Risk mitigation |
| 🔴 P0 | Estate Wallet Movements | ⚠️ Not automated | Competitive moat |
| 🔴 P0 | Sky SSR APY | ✅ Collecting | Strategy accuracy |
| 🟠 P1 | ETF Flows | ⚠️ Not automated | Institutional signal |
| 🟠 P1 | M2 Money Supply | ✅ Collecting | Macro regime |
| 🟠 P1 | Fear & Greed Index | ✅ Collecting | Sentiment |
| 🟠 P1 | Treasury Yields | ✅ Collecting | Rate context |
| 🟡 P2 | Credit Spreads | ✅ Collecting | Risk indicator |
| 🟡 P2 | Rotation Ratios | ✅ Calculating | Regime signal |
| 🟢 P3 | AAII Sentiment | ⚠️ Manual | Contrarian signal |
| 🟢 P3 | 13F Holdings | 🔴 Manual only | Quarterly context |

---

## Appendix B: Data Freshness SLA

| Data Category | Acceptable Staleness | Current State |
|---------------|---------------------|---------------|
| Crypto Prices | <24 hours | ✅ Daily |
| DeFi Yields | <24 hours | ⚠️ ~3 weeks stale |
| Treasury Yields | <24 hours | ✅ Daily |
| TradFi Markets | <24 hours | ✅ Daily |
| Sentiment | <24 hours | ✅ Daily |
| M2 Money Supply | <30 days | ✅ Monthly |
| ETF Flows | <24 hours | 🔴 Not collected |
| Estate Wallets | <15 minutes | 🔴 Not automated |
| 13F Holdings | <50 days | ⚠️ Manual |

---

## Appendix C: Source API Reference

| API | Base URL | Auth | Rate Limit | Cost |
|-----|----------|------|------------|------|
| DeFiLlama Yields | `yields.llama.fi` | None | 500/min | FREE |
| DeFiLlama Protocol | `api.llama.fi` | None | 500/min | FREE |
| FRED | `api.stlouisfed.org` | API Key | 120/min | FREE |
| Yahoo Finance | `yfinance` Python | None | Reasonable | FREE |
| Alternative.me | `api.alternative.me` | None | 30/min | FREE |
| CoinGecko | `api.coingecko.com` | None | 30/min | FREE |
| Etherscan | `api.etherscan.io` | API Key | 5/sec | FREE tier |
| SEC EDGAR | `data.sec.gov` | None | 10/sec | FREE |
| Binance | `fapi.binance.com` | None | 1200/min | FREE |

---

**Document Prepared by:** Rakia Board (Investment/DeFi Opportunities Analyst)  
**Date:** February 10, 2026  
**Status:** Companion to RAKIA_UNIFIED_AUDIT_REPORT_FEB2026.md

---

*For questions or updates, contact the diBoaS Analytics team or raise in the appropriate Board session.*
