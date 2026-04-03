/**
 * Market Data Fallback Constants
 *
 * Canonical fallback values used when diboas-analytics API is unavailable.
 * All rates are 5-year averages (2021-2025) per Strategy Board decision.
 * Sources documented in docs/audit/YIELD_INFLATION_FX.md.
 *
 * Brazil rates are NET (after 22.5% IR tax).
 * diBoaS strategy rates are gross (before platform fees and user-specific tax).
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
    scenarioRates: { conservative: 4, historical: 7, optimistic: 10 },
  },
  assetPrices: {
    crypto: { BTC: 97250, ETH: 2650, SOL: 195.40, SUI: 3.85, TRX: 0.27 },
    etfs: { SPYx: 592.45, QQQx: 518.23, IWMon: 224.67 },
    commodities: { XAUT: 2945 },
    updatedAt: '2026-03-15T00:00:00Z',
  },
  exchangeRates: {
    rates: {
      BRL: {
        rateToUsd: 5.2546,
        annualDepreciation: 0.03,
        rateDate: '2026-03-15',
        depreciationBasis: '20-year historical average (6-8%), adjusted conservative',
      },
      EUR: {
        rateToUsd: 0.92,
        annualDepreciation: 0.009,
        rateDate: '2026-03-15',
        depreciationBasis: '5-year average',
      },
    },
  },
  inflationRates: {
    rates: {
      en: { current: 0.026, average5y: 0.045 },
      'pt-BR': { current: 0.0426, average5y: 0.059 },
      de: { current: 0.022, average5y: 0.041 },
      es: { current: 0.027, average5y: 0.041 },
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
