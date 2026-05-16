/**
 * Market Data Fallback Constants
 *
 * Canonical fallback values used when diboas-analytics API is unavailable.
 *
 * Brazil bank rates are NET (after 22.5% IR tax). FDIC/FRED/BCB/B3/ECB/Tesoro
 * bank rates are 5-year averages (2021-2025) per Strategy Board decision.
 *
 * diBoaS scenarioRates were updated 2026-05-12 from 4/7/10 → 7/10/14 to
 * reflect the actual digital-dollar yield envelope diBoaS delivers via the
 * Solana-first DeFi stack (Sky, Aave, Compound, Jito, Jupiter):
 *   - Conservative 7%: top-tier passive (Aave/Compound high-utilization,
 *     Morpho curated vaults, Kamino JLP). Sources: Aavescan, Compound V3,
 *     Sky SSR (3.75-4.5% base + Solana premium).
 *   - Historical 10%: blended active across base + Solana mid-tier strategies.
 *   - Optimistic 14%: curated/looped strategies via diversified Solana yield routes.
 * Substantiation tracked in `docs/audit/YIELD_INFLATION_FX.md`. Rates are
 * gross (before platform fees and user-specific tax). Regulatory disclaimers
 * (MiCA / FTC / CVM) remain in the relevant locale translation files.
 */

import type { MarketDataSnapshot } from './types';

export const FALLBACK_MARKET_DATA: MarketDataSnapshot = {
  rates: {
    bankRates: {
      en: { savings: 0.32, neobank: 3.35, treasury: 3.32, source: 'FDIC/FRED', sourceDate: '5yr avg 2021-2025' },
      'pt-BR': { savings: 6.83, neobank: 8.53, treasury: 8.53, source: 'BCB/B3', sourceDate: '5yr avg 2021-2025' },
      es: { savings: 0.14, neobank: 2.10, treasury: 1.77, source: 'ECB/Tesoro', sourceDate: '5yr avg 2021-2025' },
      de: { savings: 1.22, neobank: 2.83, treasury: 1.62, source: 'Bundesbank/ECB', sourceDate: '5yr avg 2021-2025' },
    },
    strategyApys: { safety: 7, balance: 12, growth: 18 },
    scenarioRates: { conservative: 7, historical: 10, optimistic: 14 },
  },
  // Phase A (2026-05-16): asset spot prices refreshed to mid-May 2026
  // readings per the calibration plan §3.1. The previous Mar-2026 stamp
  // conflicted with the research doc's May-2026 anchor (e.g. BTC 97.25k vs
  // 80k) — without this refresh, Phase E's asset-history tool would show
  // "BTC May 2026 = $80,000" while the comparison-table surfaces would
  // show "BTC current = $97,250" on the same site.
  assetPrices: {
    crypto: { BTC: 80000, ETH: 2300, SOL: 152, SUI: 2.85, TRX: 0.21 },
    etfs: { SPYx: 740, QQQx: 711, IWMon: 234 },
    commodities: { XAUT: 4700 },
    updatedAt: '2026-05-15T00:00:00Z',
  },
  exchangeRates: {
    rates: {
      BRL: {
        rateToUsd: 5.2546,
        annualDepreciation: 0.03,
        rateDate: '2026-03-15',
        // Phase A: kept forward 3% conservative; added historical fields
        // for retrospective consumers (asset-history tool, /tools/goal-savings
        // path-dependent mode). Forward planning uses annualDepreciation;
        // retrospective uses historicalCagr.
        depreciationBasis: 'forward: conservative 3%; historical: 6.71% Jan 2010→May 2026 per docs/researches/btc-vs-assets-inflation-fx-final-analysis.md',
        historicalCagr: 0.0671,
        historicalAnchorStart: '2010-01-01',
        historicalAnchorEnd: '2026-05-15',
        historicalRateStart: 1.78,
        historicalRateEnd: 5.50,
      },
      EUR: {
        rateToUsd: 0.92,
        annualDepreciation: 0.009,
        rateDate: '2026-03-15',
        depreciationBasis: 'forward: 5y avg 0.9%; historical: 1.45% Jan 2010→May 2026',
        historicalCagr: 0.0145,
        historicalAnchorStart: '2010-01-01',
        historicalAnchorEnd: '2026-05-15',
        historicalRateStart: 1.43,
        historicalRateEnd: 1.13,
      },
    },
  },
  // Phase A additions: cumulativeSince2010 + average16y per locale, per
  // BLS CPI-U (US 52.3%), IBGE IPCA (Brazil 145%), Destatis (Germany 41%),
  // INE (Spain 41%). cumulativeSince2010 is a decimal (0.523 = 52.3%).
  // average16y is the geometric average: (1 + cumulative)^(1/16.33) − 1.
  inflationRates: {
    rates: {
      en: { current: 0.026, average5y: 0.045, cumulativeSince2010: 0.523, average16y: 0.0262 },
      'pt-BR': { current: 0.0426, average5y: 0.059, cumulativeSince2010: 1.45, average16y: 0.0565 },
      de: { current: 0.022, average5y: 0.041, cumulativeSince2010: 0.41, average16y: 0.0212 },
      es: { current: 0.027, average5y: 0.041, cumulativeSince2010: 0.41, average16y: 0.0212 },
    },
  },
  platformFees: {
    deposit: { rate: 0.0048, minFee: 0.25, maxFee: 25.00 },
    sell: { rate: 0.0039, minFee: 0.25, maxFee: 25.00 },
    send: { rate: 0, minFee: 0, maxFee: 0 },
    receive: { rate: 0, minFee: 0, maxFee: 0 },
    swap: { rate: 0, minFee: 0, maxFee: 0 },
    strategyEntry: { rate: 0, minFee: 0, maxFee: 0 },
    strategyExit: { rate: 0.0039, minFee: 0.25, maxFee: 25.00 },
    cashOut: { rate: 0.0048, minFee: 0.25, maxFee: 25.00 },
  },
  thirdPartyFees: {
    paymentProcessor: 0.01,
    networkFee: 0.00001,
    crossChainSwap: 0.003,
    btcMiner: 0.02,
    xautIssuer: 0.0025,
  },
  networkGas: {
    solReserve: 0.03,
    ethGasGwei: 30,
    solPriorityFee: 0.009,
  },
  protocolData: {
    tvl: {},
    updatedAt: '2026-03-15T00:00:00Z',
  },
  metadata: {
    fetchedAt: '2026-03-15T00:00:00Z',
    source: 'fallback',
    stale: false,
    ttl: 0,
  },
};

/** Currency code for each supported locale */
export const LOCALE_CURRENCY: Record<string, string> = {
  en: 'USD',
  'pt-BR': 'BRL',
  de: 'EUR',
  es: 'EUR',
};
