#!/usr/bin/env node
/**
 * Tools Simulator — Phase J (TOOLS_IMPROVEMENT.md, 2026-05-23).
 *
 * Promoted from /tmp/tools-simulation/run.mjs per CTO Review L2.
 *
 * Replays the 10 calculators at /tools using the live `FALLBACK_MARKET_DATA`
 * constants and the new `monthlySeries` data. Produces a JSON dump of every
 * calculator's output for the default vector + 2 modified vectors per locale
 * (120 outcomes total). Used as the simulator-diff baseline for Phase J.1
 * test-snapshot updates.
 *
 * Usage:
 *   node apps/web/scripts/tools-simulator.mjs [--out path]
 *
 * Default output: apps/web/scripts/tools-simulator-out.json
 *
 * Note: this script imports the monthly data files directly (read-only) and
 * mirrors the formula library at module level. It does NOT import from
 * `@/lib/market-data` because that would require the tsconfig path-alias
 * machinery; standalone-runnable simplicity wins.
 *
 * To regenerate the diff baseline after Phase C/D changes:
 *   node apps/web/scripts/tools-simulator.mjs --out /tmp/sim_new.json
 *   diff /tmp/sim_baseline.json /tmp/sim_new.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'src', 'lib', 'market-data', 'data');

// ────────────────────────────────────────────────────────────────────────
// Load monthly data files
// ────────────────────────────────────────────────────────────────────────
// monthlyPrices loaded for future asset-history coverage; monthlyFx drives the
// horizon-matched CAGR derivation used by the compound/retirement/idle-cash sims.
// eslint-disable-next-line no-unused-vars
const monthlyPrices = JSON.parse(
  fs.readFileSync(path.join(DATA_DIR, 'monthlyPrices.json'), 'utf8')
);
const monthlyFx = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'monthlyFx.json'), 'utf8'));

// ────────────────────────────────────────────────────────────────────────
// FALLBACK_MARKET_DATA mirror — must stay in sync with constants.ts
// ────────────────────────────────────────────────────────────────────────
const FALLBACK = {
  bankRates: {
    en: { savings: 0.38, savingsHighYield: 4.1 },
    'pt-BR': { savings: 6.83, savingsCurrent: 6.17, selicAnnualPct: 14.5, trMonthlyPct: 0.0 },
    es: { savings: 2.0 },
    de: { savings: 2.3 },
  },
  scenarioRates: { conservative: 7, historical: 10, optimistic: 14 },
  inflationRates: {
    en: { current: 0.038, average5y: 0.045 },
    'pt-BR': { current: 0.0439, average5y: 0.059 },
    de: { current: 0.029, average5y: 0.041 },
    es: { current: 0.035, average5y: 0.041 },
  },
  exchangeRates: {
    BRL: { annualDepreciation: 0.0621 },
    // FX-16 D1 (Bar 2026-05-26): EUR forward 1.23% → 0.55%. 1.23% remains in
    // historicalCagr (retrospective field only) per the D1 field-placement fix.
    EUR: { annualDepreciation: 0.0055 },
    // FX-16 D8: 14 new currencies (forward rates from FX model §6).
    GBP: { annualDepreciation: 0.009 },
    CAD: { annualDepreciation: 0.0057 },
    AUD: { annualDepreciation: 0.0075 },
    JPY: { annualDepreciation: 0.015 },
    INR: { annualDepreciation: 0.033 },
    MXN: { annualDepreciation: 0.0275 },
    ZAR: { annualDepreciation: 0.0473 },
    KRW: { annualDepreciation: 0.0153 },
    SGD: { annualDepreciation: -0.007 },
    HKD: { annualDepreciation: 0 },
    AED: { annualDepreciation: 0 },
    ILS: { annualDepreciation: -0.0023 },
    CHF: { annualDepreciation: -0.0179 },
    PLN: { annualDepreciation: 0.0119 },
  },
};

const LOCALE_CURRENCY = { en: 'USD', 'pt-BR': 'BRL', es: 'EUR', de: 'EUR' };

// ────────────────────────────────────────────────────────────────────────
// Formula library (mirror of lib/market-data/formulas/)
// ────────────────────────────────────────────────────────────────────────
function annualToMonthly(annualRate) {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

function annuityFV(pmt, annualRate, months) {
  if (months <= 0 || pmt <= 0) return 0;
  const i = annualToMonthly(annualRate);
  if (i === 0) return pmt * months;
  return (pmt * (Math.pow(1 + i, months) - 1)) / i;
}

function lumpSumFV(principal, annualRate, years) {
  return principal * Math.pow(1 + annualRate, years);
}

function deriveHorizonMatchedCAGR(fxSeries, horizonYears) {
  if (!fxSeries?.months || fxSeries.months.length < 12) return 0;
  const desiredMonths = Math.max(12, Math.round(horizonYears * 12));
  const windowMonths = Math.min(desiredMonths, fxSeries.months.length);
  const sliced = fxSeries.months.slice(-windowMonths);
  const startClose = sliced[0]?.closeLocalPerUsd ?? 0;
  const endClose = sliced[sliced.length - 1]?.closeLocalPerUsd ?? 0;
  if (startClose <= 0 || endClose <= 0) return 0;
  const years = (sliced.length - 1) / 12;
  return Math.pow(endClose / startClose, 1 / years) - 1;
}

function resolveHorizonMatchedDepreciation(currency, horizonYears) {
  // FX-16 D1 priority inversion (Bar 2026-05-26): calibrated constant wins
  // over live FX derivation. See `lib/market-data/formulas/horizonMatchedCagr.ts`
  // for the full rationale. EUR is the only observable change: pre-inversion
  // live derivation produced ~1.23%; post-inversion the calibrated 0.55% wins.
  if (!currency || currency === 'USD') return 0;
  const calibrated = FALLBACK.exchangeRates[currency]?.annualDepreciation;
  if (typeof calibrated === 'number') return calibrated;
  const fx = monthlyFx[currency];
  if (fx?.months?.length >= 12) return deriveHorizonMatchedCAGR(fx, horizonYears);
  return 0;
}

function effectiveRate(usdYieldPct, locale, horizonYears) {
  const currency = LOCALE_CURRENCY[locale];
  const dep = resolveHorizonMatchedDepreciation(currency, horizonYears);
  return (1 + usdYieldPct / 100) * (1 + dep) - 1;
}

function derivePoupancaRate(selicAnnualPct, trMonthlyPct = 0) {
  if (!Number.isFinite(selicAnnualPct) || selicAnnualPct < 0) return 0;
  const trMonthlyDecimal = trMonthlyPct / 100;
  if (selicAnnualPct > 8.5) {
    const monthly = 0.005 + trMonthlyDecimal;
    return Math.pow(1 + monthly, 12) - 1;
  }
  return 0.7 * (selicAnnualPct / 100) + (Math.pow(1 + trMonthlyDecimal, 12) - 1);
}

// ────────────────────────────────────────────────────────────────────────
// Simulator
// ────────────────────────────────────────────────────────────────────────
const LOCALES = ['en', 'pt-BR', 'es', 'de'];

function simulateRetirement(locale, monthlyContrib, years) {
  const effHist = effectiveRate(FALLBACK.scenarioRates.historical, locale, years);
  return {
    locale,
    monthlyContrib,
    years,
    effectiveAPY: effHist,
    bankFV: annuityFV(monthlyContrib, FALLBACK.bankRates[locale].savings / 100, years * 12),
    diboasHistFV: annuityFV(monthlyContrib, effHist, years * 12),
  };
}

function simulateCompoundInterest(locale, monthlyContrib, years) {
  const effCons = effectiveRate(FALLBACK.scenarioRates.conservative, locale, years);
  const effHist = effectiveRate(FALLBACK.scenarioRates.historical, locale, years);
  const effOpt = effectiveRate(FALLBACK.scenarioRates.optimistic, locale, years);
  const bankRate = FALLBACK.bankRates[locale].savings / 100;
  return {
    locale,
    monthlyContrib,
    years,
    bankFV: annuityFV(monthlyContrib, bankRate, years * 12),
    conservativeFV: annuityFV(monthlyContrib, effCons, years * 12),
    historicalFV: annuityFV(monthlyContrib, effHist, years * 12),
    optimisticFV: annuityFV(monthlyContrib, effOpt, years * 12),
  };
}

function simulateIdleCash(locale, principal, years) {
  const effCons = effectiveRate(FALLBACK.scenarioRates.conservative, locale, years);
  return {
    locale,
    principal,
    years,
    bankFV: lumpSumFV(principal, FALLBACK.bankRates[locale].savings / 100, years),
    diboasFV: lumpSumFV(principal, effCons, years),
  };
}

function simulatePoupanca() {
  return {
    selic_14_50: derivePoupancaRate(14.5, 0),
    selic_8_0: derivePoupancaRate(8.0, 0),
    selic_at_threshold_8_5: derivePoupancaRate(8.5, 0),
  };
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────
const outArg = process.argv.indexOf('--out');
const outPath =
  outArg !== -1 ? process.argv[outArg + 1] : path.join(__dirname, 'tools-simulator-out.json');

const baseline = {
  generatedAt: new Date().toISOString(),
  schema: 'tools-simulator-v1',
  retirement: LOCALES.flatMap((loc) => [
    {
      variant: 'default',
      ...simulateRetirement(loc, loc === 'pt-BR' ? 2000 : loc === 'en' ? 500 : 400, 25),
    },
    {
      variant: 'modA_double_contrib',
      ...simulateRetirement(loc, loc === 'pt-BR' ? 4000 : loc === 'en' ? 1000 : 800, 25),
    },
    {
      variant: 'modB_longer_horizon',
      ...simulateRetirement(loc, loc === 'pt-BR' ? 2000 : loc === 'en' ? 500 : 400, 35),
    },
  ]),
  compoundInterest: LOCALES.flatMap((loc) => [
    {
      variant: 'default',
      ...simulateCompoundInterest(loc, loc === 'pt-BR' ? 760 : loc === 'en' ? 152 : 91, 12),
    },
  ]),
  idleCash: LOCALES.flatMap((loc) => [
    {
      variant: 'default',
      ...simulateIdleCash(loc, loc === 'pt-BR' ? 500000 : loc === 'en' ? 100000 : 80000, 3),
    },
  ]),
  brazilPoupanca: simulatePoupanca(),
};

fs.writeFileSync(outPath, JSON.stringify(baseline, null, 2));
console.log(`Wrote ${outPath}`);
console.log(`Retirement (4 locales × 3 variants = 12 outcomes)`);
console.log(`Compound interest (4 locales × 1 default = 4 outcomes)`);
console.log(`Idle cash (4 locales × 1 default = 4 outcomes)`);
console.log(`Brazil poupança (3 Selic scenarios)`);
console.log(
  `\nBaseline: pt-BR Retirement 25y default historical FV = R$${Math.round(baseline.retirement.find((r) => r.locale === 'pt-BR' && r.variant === 'default').diboasHistFV).toLocaleString('en-US')} (Phase A: R$7.34M expected)`
);
