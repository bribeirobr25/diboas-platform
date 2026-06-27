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
import {
  ANCHOR_PRICES,
  BRL_USD_BUCKETS,
  EUR_USD_BUCKETS,
  LAST_RESEARCH_UPDATE,
} from './historical';
import { derivePoupancaRate } from './formulas/brazilPoupanca';

export const FALLBACK_MARKET_DATA: MarketDataSnapshot = {
  rates: {
    // Phase C (TOOLS_IMPROVEMENT.md, 2026-05-23): per Decision C1/C2/C3, en/pt-BR
    // gain optional `savingsCurrent` + `savingsHighYield` toggle pairs; ES/DE
    // `savings` raised to typical-remunerated-account values per Decision C3.
    // pt-BR `selicAnnualPct` + `trMonthlyPct` added for Phase G regime switch.
    bankRates: {
      en: {
        savings: 0.38, // Live FDIC national avg April 2026 (was 0.32 5y-avg)
        savingsHighYield: 4.1, // NerdWallet HYSA top-1% May 2026 (NEW Phase C)
        neobank: 3.35,
        treasury: 3.32,
        source: 'FDIC/FRED',
        sourceDate: '2026-04 (current); HYSA NerdWallet 2026-05',
      },
      'pt-BR': {
        savings: 6.83, // 5y avg poupança 2021-2025 (kept as default toggle baseline)
        savingsCurrent: 6.17, // Live poupança under Selic > 8.5% rule (NEW Phase C)
        selicAnnualPct: 14.5, // Live Selic after April 29, 2026 Copom (NEW Phase G)
        trMonthlyPct: 0.0, // Near-zero in current high-Selic regime
        neobank: 8.53,
        treasury: 8.53,
        source: 'BCB SGS 195/1178/7811',
        sourceDate: '2026-05',
      },
      es: {
        savings: 2.0, // Typical cuenta remunerada (was 0.14% ECB overnight)
        neobank: 2.1,
        treasury: 1.77,
        source: 'Rankia / ECB MIR',
        sourceDate: '2026-05',
      },
      de: {
        savings: 2.3, // Typical Tagesgeld 2026 (was 1.22%, refreshed per Decision C3)
        neobank: 2.83,
        treasury: 1.62,
        source: 'Verivox / Bundesbank MFI',
        sourceDate: '2026-05',
      },
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
  // Phase C (TOOLS_IMPROVEMENT.md, 2026-05-23): refreshed to May-21/22 live spots
  // per Phase A authoritative numbers (Fortune BTC, TradingEconomics gold/TLT).
  assetPrices: {
    // Weekly refresh 2026-06-26 (tools-data-weekly-runbook.md): risk-off leg
    // vs the May stamp — BTC 77.3k→60k, gold 4524→4103, ETH/SOL down sharply.
    // CoinGecko + Yahoo cross-checked; consistent with the firm-dollar /market read.
    crypto: { BTC: 59986, ETH: 1577, SOL: 72, SUI: 0.7, TRX: 0.32 }, // 2026-06-26 spot (CoinGecko/Yahoo)
    etfs: { SPYx: 729, QQQx: 707, IWMon: 234 }, // SPY/QQQ Yahoo 2026-06-26 close; IWM unchanged
    commodities: { XAUT: 4103 }, // Tether Gold ≈ spot gold/oz, Yahoo GC=F 2026-06-26
    updatedAt: '2026-06-26T00:00:00Z',
  },
  // FX rate unit-convention header (R2 — Phase 1 step 4 / FX-16 adoption 2026-05-26):
  //   • `annualDepreciation`         — decimal (0.0055 = 0.55%; negative = local currency strengthened)
  //   • `historicalCagr`             — decimal (same scale as annualDepreciation)
  //   • `historicalRateStart`/`End`  — USD per 1 unit of local currency (anchor-pair endpoints)
  //   • `rateToUsd`                  — units of local currency per 1 USD (current spot)
  // Pegged currencies (HKD, AED) carry `annualDepreciation: 0` — see FX-16 plan D3 + model §8.3.
  // Negative-FX currencies (CHF, SGD, ILS) carry negative decimals — local currency strengthened
  // against USD over the calibration window; the effective-rate formula handles this natively.
  exchangeRates: {
    rates: {
      BRL: {
        rateToUsd: 5.1695,
        // Phase C (TOOLS_IMPROVEMENT.md, 2026-05-23, Decision PT1 ACCEPTED):
        // raised to live full-series CAGR per Phase A — 6.21%/yr USD/BRL
        // depreciation Jan 2010 → May 2026 (BCB PTAX). The Phase D
        // horizon-matched-CAGR helper recomputes from monthlySeries.fx[BRL]
        // at runtime; this constant is the data-unavailable fallback.
        annualDepreciation: 0.0621,
        rateDate: '2026-06-26',
        depreciationBasis:
          'live full-series CAGR Jan 2010 → May 2026 (BCB PTAX); horizon-matched at runtime via monthlySeries.fx[BRL]',
        historicalCagr: 0.0621,
        historicalAnchorStart: '2010-01-01',
        historicalAnchorEnd: '2026-05-22',
        historicalRateStart: 1.874,
        historicalRateEnd: 5.0134, // LOCKED anchor endpoint (do not refresh with spot)
      },
      EUR: {
        rateToUsd: 0.8771,
        // FX-16 adoption D1 ACCEPTED 2026-05-26 (Bar): retired prior PT3 1.23% in
        // `annualDepreciation` — 1.23% was an endpoint-pair retrospective CAGR
        // mistakenly placed in the forward field. 1.23% remains in `historicalCagr`
        // (correct field) for the locked 2010→2026 anchor pair; 0.55% is the
        // forward calibration assumption. See `docs/audit/PENDING_ALL.md` D1.
        annualDepreciation: 0.0055,
        rateDate: '2026-06-26',
        depreciationBasis:
          'Bar-signed forward calibration assumption (NOT a literal series CAGR). FRED AEXUSEU annual series 2010→2025 endpoint-pair CAGR is ~1.07%; 2005→2025 annual-average CAGR is ~0.48%. The 0.55% value is calibrated between those frames as a smoothed long-horizon projection assumption — see decision register D1 (2026-05-26) for the reasoning, and `docs/tech/audit-bundle/GLOSSARY_AND_LIMITATIONS.md` §"FX-16 forward calibration provenance" for the auditor-facing disclosure.',
        historicalCagr: 0.0123,
        historicalAnchorStart: '2010-01-01',
        historicalAnchorEnd: '2026-04-30',
        historicalRateStart: 1.4272,
        historicalRateEnd: 1.1706,
      },
      // FX-16 adoption 2026-05-26 (Bar D1–D8): 14 new currencies added per
      // `docs/tools/usd_fx_projection_model_consolidated.md` §6. Each carries
      // ONLY the 4 required `CurrencyRate` fields (rateToUsd / annualDepreciation
      // / rateDate / depreciationBasis). The 5 `historical*` fields are LEFT
      // ABSENT — populating `historicalCagr` without the matching anchor pair
      // would produce a malformed `CurrencyRate` and contradict D4 (retrospective
      // mode stays BRL/EUR-only; `HistoricalAnchorsData.fxBuckets` is a closed
      // 2-key type). `depreciationBasis` strings use calibration-smoothing framing
      // — NOT "annual-average CAGR" framing — per D1 provenance footnote.
      GBP: {
        rateToUsd: 0.795,
        annualDepreciation: 0.009,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (FRED AEXUSUK annual series); see decision register D1+D8 (2026-05-26)',
      },
      CAD: {
        rateToUsd: 1.3625,
        annualDepreciation: 0.0057,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (FRED AEXCAUS annual series); see decision register D1+D8 (2026-05-26)',
      },
      AUD: {
        rateToUsd: 1.532,
        annualDepreciation: 0.0075,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (FRED AEXUSAL annual series); see decision register D1+D8 (2026-05-26)',
      },
      JPY: {
        rateToUsd: 149.5,
        annualDepreciation: 0.015,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (FRED AEXJPUS annual series); see decision register D1+D8 (2026-05-26)',
      },
      INR: {
        rateToUsd: 83.45,
        annualDepreciation: 0.033,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (FRED AEXINUS annual series); see decision register D1+D8 (2026-05-26)',
      },
      MXN: {
        rateToUsd: 17.2,
        annualDepreciation: 0.0275,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (FRED AEXMXUS annual series); see decision register D1+D8 (2026-05-26)',
      },
      ZAR: {
        rateToUsd: 18.35,
        annualDepreciation: 0.0473,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (FRED AEXSFUS annual series); see decision register D1+D8 (2026-05-26)',
      },
      KRW: {
        rateToUsd: 1382.5,
        annualDepreciation: 0.0153,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (FRED AEXKOUS annual series); see decision register D1+D8 (2026-05-26)',
      },
      SGD: {
        rateToUsd: 1.338,
        // Negative — SGD has historically strengthened vs USD over the calibration window.
        annualDepreciation: -0.007,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (FRED AEXSIUS annual series; negative = local currency strengthened); see decision register D1+D8 (2026-05-26)',
      },
      HKD: {
        rateToUsd: 7.835,
        // Pegged to USD via HKMA Linked Exchange Rate System (LERS); FX = 0.
        annualDepreciation: 0,
        rateDate: '2026-05-26',
        depreciationBasis:
          'pegged to USD via HKMA Linked Exchange Rate System (LERS); annualDepreciation = 0 per FX model §8.3 — see decision register D1+D8 (2026-05-26)',
      },
      AED: {
        rateToUsd: 3.6725,
        // Pegged to USD via CBUAE; FX = 0.
        annualDepreciation: 0,
        rateDate: '2026-05-26',
        depreciationBasis:
          'pegged to USD via Central Bank of the UAE (CBUAE); annualDepreciation = 0 per FX model §8.3 — see decision register D1+D8 (2026-05-26)',
      },
      ILS: {
        rateToUsd: 3.645,
        // Negative — ILS has historically strengthened vs USD over the calibration window.
        annualDepreciation: -0.0023,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (OECD/FRED CCUSMA02ILA618N; negative = local currency strengthened); see decision register D1+D8 (2026-05-26)',
      },
      CHF: {
        rateToUsd: 0.881,
        // Negative — CHF has historically strengthened vs USD over the calibration window.
        annualDepreciation: -0.0179,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (FRED AEXSZUS annual series; negative = local currency strengthened); see decision register D1+D8 (2026-05-26)',
      },
      PLN: {
        rateToUsd: 4.025,
        annualDepreciation: 0.0119,
        rateDate: '2026-05-26',
        depreciationBasis:
          'forward annualDepreciation assumption calibrated from long-horizon FX behavior (OECD/FRED CCUSMA02PLA618N); see decision register D1+D8 (2026-05-26)',
      },
    },
  },
  // Phase A additions: cumulativeSince2010 + average16y per locale, per
  // BLS CPI-U (US 52.3%), IBGE IPCA (Brazil 145%), Destatis (Germany 41%),
  // INE (Spain 41%). cumulativeSince2010 is a decimal (0.523 = 52.3%).
  // average16y is the geometric average: (1 + cumulative)^(1/16.33) − 1.
  // Phase C (TOOLS_IMPROVEMENT.md, 2026-05-23, Decision F1 ACCEPTED): live
  // April 2026 YoY prints — BLS CPI-U 3.8% (en), IBGE IPCA 4.39% (pt-BR),
  // Destatis HICP 2.9% (de), Eurostat HICP 3.5% (es). The Iran-war energy
  // shock in April 2026 elevated all four readings vs pre-shock January
  // values; `average5y` stays at the prior 5y rolling-mean per Decision F2
  // (quarterly refresh cadence per Decision X1).
  inflationRates: {
    rates: {
      en: { current: 0.038, average5y: 0.045, cumulativeSince2010: 0.523, average16y: 0.0262 },
      'pt-BR': { current: 0.0439, average5y: 0.059, cumulativeSince2010: 1.45, average16y: 0.0565 },
      de: { current: 0.029, average5y: 0.041, cumulativeSince2010: 0.41, average16y: 0.0212 },
      es: { current: 0.035, average5y: 0.041, cumulativeSince2010: 0.41, average16y: 0.0212 },
    },
  },
  platformFees: {
    deposit: { rate: 0.0048, minFee: 0.25, maxFee: 25.0 },
    sell: { rate: 0.0039, minFee: 0.25, maxFee: 25.0 },
    send: { rate: 0, minFee: 0, maxFee: 0 },
    receive: { rate: 0, minFee: 0, maxFee: 0 },
    swap: { rate: 0, minFee: 0, maxFee: 0 },
    strategyEntry: { rate: 0, minFee: 0, maxFee: 0 },
    strategyExit: { rate: 0.0039, minFee: 0.25, maxFee: 25.0 },
    cashOut: { rate: 0.0048, minFee: 0.25, maxFee: 25.0 },
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
  // Phase I (2026-05-16): populate the existing `protocolData.tvl` field
  // (CC2 round-1 correction — extend, do not parallel). v1 ships the combined
  // summary only; per-protocol card values still flow from i18n until a future
  // refactor migrates them through this same field. Refresh cadence: monthly
  // manual until iter-5 SDK swap delivers daily via DeFiLlama-equivalent.
  protocolData: {
    tvl: {
      combined: '$120 billion',
    },
    updatedAt: '2026-05-15T00:00:00Z',
  },
  metadata: {
    fetchedAt: '2026-03-15T00:00:00Z',
    source: 'fallback',
    stale: false,
    ttl: 0,
  },
  // Phase C+ (2026-05-16): historicalAnchors slice populated from
  // ./historical.ts (research-derived, annual refresh cadence). Consumers
  // (Phase D + E) route through `marketDataService.getSync().historicalAnchors`
  // — direct imports from `./historical` outside `lib/market-data/` are
  // §6.10-prohibited and enforced by the §3.13 pre-merge grep gate.
  historicalAnchors: {
    anchors: ANCHOR_PRICES,
    fxBuckets: {
      BRL: BRL_USD_BUCKETS,
      EUR: EUR_USD_BUCKETS,
    },
    lastResearchUpdate: LAST_RESEARCH_UPDATE,
  },
};

// A3 fix (2026-05-23): wire `derivePoupancaRate` to production. The pt-BR
// `savingsCurrent` value is now ALWAYS computed from `selicAnnualPct +
// trMonthlyPct` via the BCB regime-switch formula (Lei nº 12.703/2012) — the
// hardcoded literal is overwritten here at module load and becomes a one-time
// visual reference for review only. Single source of truth = the formula, not
// the constant. When Selic crosses 8.5%, the formula auto-switches regime; no
// manual recompute needed. (Cast through `unknown` because the type is marked
// readonly for consumer safety; this constructor-time override is the only
// allowed write.)
(() => {
  const ptBR = FALLBACK_MARKET_DATA.rates.bankRates['pt-BR'] as unknown as {
    selicAnnualPct?: number;
    trMonthlyPct?: number;
    savingsCurrent?: number;
  };
  if (typeof ptBR.selicAnnualPct === 'number') {
    const derived = derivePoupancaRate(ptBR.selicAnnualPct, ptBR.trMonthlyPct ?? 0);
    ptBR.savingsCurrent = +(derived * 100).toFixed(2);
  }
})();

/** Currency code for each supported locale */
export const LOCALE_CURRENCY: Record<string, string> = {
  en: 'USD',
  'pt-BR': 'BRL',
  de: 'EUR',
  es: 'EUR',
};

/**
 * Phase C (TOOLS_IMPROVEMENT.md, 2026-05-23, Decision R2): per-field
 * `last_verified` audit-trail timestamps for the Hardcoded subset of
 * FALLBACK_MARKET_DATA. Consumers don't read this directly; it's the
 * audit lineage record for the K.3 weekly manual update runbook.
 *
 * Format: ISO 8601 date strings. Source notes per field.
 */
export const FALLBACK_MARKET_DATA_METADATA = {
  rates: {
    bankRates: {
      en: {
        savings: {
          last_verified: '2026-05-22',
          source: 'FDIC National Rates and Rate Caps, April 2026',
        },
        savingsHighYield: {
          last_verified: '2026-05-22',
          source: 'NerdWallet HYSA top-1% May 2026',
        },
      },
      'pt-BR': {
        savings: {
          last_verified: '2026-05-22',
          source: 'Computed 5y avg from BCB SGS 195 2021-2025',
        },
        savingsCurrent: {
          last_verified: '2026-05-22',
          source: 'BCB SGS 195 (poupança under Selic > 8.5% rule)',
        },
        selicAnnualPct: {
          last_verified: '2026-05-22',
          source: 'BCB Copom April 29, 2026 decision',
        },
        trMonthlyPct: {
          last_verified: '2026-05-22',
          source: 'BCB SGS 7811 (near-zero current regime)',
        },
      },
      es: {
        savings: {
          last_verified: '2026-05-22',
          source: 'Rankia / Kelisto cuentas remuneradas typical May 2026',
        },
      },
      de: {
        savings: {
          last_verified: '2026-05-22',
          source: 'Verivox / Finanztip Tagesgeld typical May 2026',
        },
      },
    },
    scenarioRates: {
      last_verified: '2026-05-12',
      source: 'CLAUDE.md Phase 6E.2 lock (decoupled from DeFi per Decision D2)',
    },
    strategyApys: { last_verified: '2026-05-12', source: 'diBoaS internal product config' },
  },
  assetPrices: {
    crypto: {
      BTC: {
        last_verified: '2026-05-22',
        source: 'Fortune May 21 09:15 ET (Phase A reconciliation reference)',
      },
    },
    commodities: {
      XAUT: { last_verified: '2026-05-22', source: 'TradingEconomics LBMA spot May 22 2026' },
    },
  },
  exchangeRates: {
    BRL: {
      annualDepreciation: {
        last_verified: '2026-05-22',
        source: 'BCB PTAX OData full-series CAGR Jan 2010 → May 2026 (Phase A)',
      },
      historicalCagr: { last_verified: '2026-05-22', source: 'Same series; identical methodology' },
    },
    EUR: {
      annualDepreciation: {
        last_verified: '2026-05-26',
        source:
          'FX-16 adoption D1 (Bar 2026-05-26): forward calibration assumption from long-horizon FRED AEXUSEU annual series, USD per 1 EUR, Fed G.5A — supersedes prior PT3 ECB-EXR endpoint-pair CAGR which now lives in historicalCagr only',
      },
      historicalCagr: {
        last_verified: '2026-05-22',
        source:
          'ECB EXR Jan 2010 → Apr 2026 endpoint-pair CAGR (anchor pair 1.4272 → 1.1706 USD/EUR); retrospective field only — see D1 (2026-05-26)',
      },
    },
    // FX-16 adoption 2026-05-26 (Bar D1+D8): 14 new currencies. Each `rateToUsd`
    // is a point-in-time spot snapshot stamped with `last_verified` so future
    // readers know it's not a maintained value. Sourced from FRED daily-fixings.
    GBP: {
      annualDepreciation: { last_verified: '2026-05-26', source: 'FX model §6: FRED AEXUSUK' },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    CAD: {
      annualDepreciation: { last_verified: '2026-05-26', source: 'FX model §6: FRED AEXCAUS' },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    AUD: {
      annualDepreciation: { last_verified: '2026-05-26', source: 'FX model §6: FRED AEXUSAL' },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    JPY: {
      annualDepreciation: { last_verified: '2026-05-26', source: 'FX model §6: FRED AEXJPUS' },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    INR: {
      annualDepreciation: { last_verified: '2026-05-26', source: 'FX model §6: FRED AEXINUS' },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    MXN: {
      annualDepreciation: { last_verified: '2026-05-26', source: 'FX model §6: FRED AEXMXUS' },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    ZAR: {
      annualDepreciation: { last_verified: '2026-05-26', source: 'FX model §6: FRED AEXSFUS' },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    KRW: {
      annualDepreciation: { last_verified: '2026-05-26', source: 'FX model §6: FRED AEXKOUS' },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    SGD: {
      annualDepreciation: {
        last_verified: '2026-05-26',
        source: 'FX model §6: FRED AEXSIUS (negative — SGD strengthened vs USD)',
      },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    HKD: {
      annualDepreciation: {
        last_verified: '2026-05-26',
        source: 'FX model §8.3: pegged via HKMA LERS; FX = 0',
      },
      rateToUsd: { last_verified: '2026-05-26', source: 'HKMA peg midpoint snapshot' },
    },
    AED: {
      annualDepreciation: {
        last_verified: '2026-05-26',
        source: 'FX model §8.3: pegged via CBUAE; FX = 0',
      },
      rateToUsd: { last_verified: '2026-05-26', source: 'CBUAE peg midpoint snapshot' },
    },
    ILS: {
      annualDepreciation: {
        last_verified: '2026-05-26',
        source: 'FX model §6: OECD/FRED CCUSMA02ILA618N (negative — ILS strengthened vs USD)',
      },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    CHF: {
      annualDepreciation: {
        last_verified: '2026-05-26',
        source: 'FX model §6: FRED AEXSZUS (negative — CHF strengthened vs USD)',
      },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
    PLN: {
      annualDepreciation: {
        last_verified: '2026-05-26',
        source: 'FX model §6: OECD/FRED CCUSMA02PLA618N',
      },
      rateToUsd: { last_verified: '2026-05-26', source: 'FRED daily fixing spot snapshot' },
    },
  },
  inflationRates: {
    en: {
      current: {
        last_verified: '2026-05-22',
        source: 'BLS USDL-26-0721 (April 2026 CPI-U, released May 12)',
      },
      average5y: { last_verified: '2026-Q2', source: 'Quarterly refresh per Decision X1' },
      cumulativeSince2010: {
        last_verified: '2026-05-16',
        source: 'Phase A research stamp (Hardcoded; annual refresh)',
      },
      average16y: { last_verified: '2026-05-16', source: 'Same' },
    },
    'pt-BR': {
      current: {
        last_verified: '2026-05-22',
        source: 'IBGE press release May 12, 2026 (April 2026 IPCA)',
      },
    },
    de: {
      current: {
        last_verified: '2026-05-22',
        source: 'Destatis PE26_161 / Eurostat flash April 2026',
      },
    },
    es: { current: { last_verified: '2026-05-22', source: 'INE / Eurostat flash April 2026' } },
  },
  platformFees: {
    last_verified: '2026-04-10',
    source: 'docs/full-view/FEES.md (Hardcoded; never provider-driven per iter5-sdk-migration-map)',
  },
  monthlySeries: {
    assets: { last_verified: '2026-05-23', source: 'Yahoo Finance v8 chart API (Phase A pull)' },
    fx: {
      last_verified: '2026-05-23',
      source: 'BCB PTAX (BRL); ECB EXR cross-via-EUR (8 other currencies); 3 PENDING (ARS/CLP/COP)',
    },
    inflation: {
      last_verified: '2026-05-23-PENDING',
      source: 'Stub; 12 series pending per Phase B.3 incremental work',
    },
  },
} as const;
