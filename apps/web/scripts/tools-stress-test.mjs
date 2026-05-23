#!/usr/bin/env node
/**
 * Tools Stress Test — comprehensive scenario coverage (2026-05-23).
 *
 * Runs default + happy-path + edge-case + negative scenarios across all 10
 * /tools calculators × 4 locales. Output drives docs/tech/TOOLS_VALIDATION.md.
 *
 * Usage:
 *   node apps/web/scripts/tools-stress-test.mjs [--out path]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'src', 'lib', 'market-data', 'data');
const monthlyPrices = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'monthlyPrices.json'), 'utf8'));
const monthlyFx = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'monthlyFx.json'), 'utf8'));

// F1 invariant (2026-05-23): catches Yahoo partial-trailing-bar duplicates
// re-introduced by future pull runs. See audit finding F1.
function assertUniqueYm(label, dataset) {
  for (const code of Object.keys(dataset)) {
    const months = dataset[code]?.months;
    if (!months || !months.length) continue;
    const unique = new Set(months.map((m) => m.ym));
    if (unique.size !== months.length) {
      const seen = new Set();
      const dupes = [];
      for (const m of months) {
        if (seen.has(m.ym)) dupes.push(m.ym);
        seen.add(m.ym);
      }
      throw new Error(
        `${label}.${code}: ${months.length} rows but only ${unique.size} unique ym (duplicates: ${[...new Set(dupes)].join(', ')})`,
      );
    }
  }
}
assertUniqueYm('monthlyPrices', monthlyPrices);
assertUniqueYm('monthlyFx', monthlyFx);

// ────────────────────────────────────────────────────────────────────────
// FALLBACK_MARKET_DATA mirror (synced with apps/web/src/lib/market-data/constants.ts)
// ────────────────────────────────────────────────────────────────────────
const FALLBACK = {
  bankRates: {
    en: { savings: 0.38, savingsHighYield: 4.10 },
    'pt-BR': { savings: 6.83, savingsCurrent: 6.17, selicAnnualPct: 14.50, trMonthlyPct: 0.0 },
    es: { savings: 2.0 },
    de: { savings: 2.3 },
  },
  scenarioRates: { conservative: 7, historical: 10, optimistic: 14 },
  inflationRates: {
    en: { current: 0.038, average5y: 0.045, cumulativeSince2010: 0.523, average16y: 0.0262 },
    'pt-BR': { current: 0.0439, average5y: 0.059, cumulativeSince2010: 1.45, average16y: 0.0565 },
    de: { current: 0.029, average5y: 0.041, cumulativeSince2010: 0.41, average16y: 0.0212 },
    es: { current: 0.035, average5y: 0.041, cumulativeSince2010: 0.41, average16y: 0.0212 },
  },
  exchangeRates: {
    BRL: { annualDepreciation: 0.0621 },
    EUR: { annualDepreciation: 0.0123 },
  },
};
const LOCALE_CURRENCY = { en: 'USD', 'pt-BR': 'BRL', es: 'EUR', de: 'EUR' };

// ────────────────────────────────────────────────────────────────────────
// Formula library (mirror of lib/market-data/formulas/)
// ────────────────────────────────────────────────────────────────────────
const annualToMonthly = (r) => Math.pow(1 + r, 1 / 12) - 1;

function lumpSumFV(p, r, y) { return p * Math.pow(1 + r, y); }

function annuityFV(pmt, r, n) {
  if (n <= 0 || pmt <= 0) return 0;
  const i = annualToMonthly(r);
  return i === 0 ? pmt * n : pmt * (Math.pow(1 + i, n) - 1) / i;
}

function purchasingPower(amt, y, infl) {
  return infl <= 0 ? amt : amt / Math.pow(1 + infl, y);
}

function selectInflationRate(locale, horizonMonths) {
  return horizonMonths <= 24
    ? FALLBACK.inflationRates[locale].current
    : FALLBACK.inflationRates[locale].average5y;
}

function deriveHorizonMatchedCAGR(currency, horizonYears) {
  const fx = monthlyFx[currency];
  if (!fx?.months?.length || fx.months.length < 12) return 0;
  const desired = Math.max(12, Math.round(horizonYears * 12));
  const win = Math.min(desired, fx.months.length);
  const sliced = fx.months.slice(-win);
  const s = sliced[0]?.closeLocalPerUsd;
  const e = sliced[sliced.length - 1]?.closeLocalPerUsd;
  if (!s || !e || s <= 0 || e <= 0) return 0;
  return Math.pow(e / s, 1 / ((sliced.length - 1) / 12)) - 1;
}

function resolveDep(currency, years) {
  if (!currency || currency === 'USD') return 0;
  const live = deriveHorizonMatchedCAGR(currency, years);
  if (live !== 0) return live;
  return FALLBACK.exchangeRates[currency]?.annualDepreciation ?? 0;
}

function effRate(usdPct, locale, years) {
  const currency = LOCALE_CURRENCY[locale];
  const dep = resolveDep(currency, years);
  return (1 + usdPct / 100) * (1 + dep) - 1;
}

function derivePoupancaRate(selicPct, trMonthlyPct = 0) {
  if (!Number.isFinite(selicPct) || selicPct < 0) return 0;
  const trMo = trMonthlyPct / 100;
  if (selicPct > 8.5) return Math.pow(1 + 0.005 + trMo, 12) - 1;
  return 0.7 * (selicPct / 100) + (Math.pow(1 + trMo, 12) - 1);
}

function monthsToTarget(target, monthly, annualRate, annualInfl = 0, initial = 0) {
  if (monthly <= 0 && initial <= 0) return Infinity;
  const r = annualToMonthly(annualRate);
  const i = annualToMonthly(annualInfl);
  let bal = initial, tgt = target;
  for (let m = 1; m <= 1200; m++) {
    tgt *= 1 + i;
    bal = bal * (1 + r) + monthly;
    if (bal >= tgt) return m;
  }
  return Infinity;
}

function cadenceToMonthly(amount, cadence) {
  switch (cadence) {
    case 'oneTime': return 0;
    case 'daily': return amount * 365 / 12;
    case 'weekly': return amount * 52 / 12;
    case 'monthly': return amount;
    case 'quarterly': return amount / 3;
    case 'semiAnnual': return amount / 6;
    case 'yearly': return amount / 12;
  }
}

// Asset history monthly replay
function assetHistoryDcaReplay(asset, startYear, amount, basis = 'total_return') {
  const series = monthlyPrices[asset]?.months;
  if (!series) return null;
  // A2 fix (2026-05-23): data-driven first-month lookup; mirror of calculator.ts.
  const startIdx = series.findIndex(m => parseInt(m.ym.slice(0, 4), 10) === startYear);
  if (startIdx === -1) return { error: `no data for ${asset} in ${startYear}` };
  const window = series.slice(startIdx);
  // F2 fix (2026-05-23): factor-adjust raw high/low into TR space when
  // basis='total_return' on assets with a closePriceOnly overlay (the 4 TR-adj
  // assets: SP500, QQQ, MSCI_WORLD, TLT). Mirror of calculator.ts logic.
  let unitsClose = 0, unitsLow = 0, unitsHigh = 0;
  for (const m of window) {
    const usePriceOnly = basis === 'price_only' && m.closePriceOnly != null;
    const close = usePriceOnly ? m.closePriceOnly : m.close;
    let effHigh = m.high;
    let effLow = m.low;
    if (basis === 'total_return' && m.closePriceOnly != null && m.closePriceOnly > 0) {
      const factor = m.close / m.closePriceOnly;
      effHigh = m.high * factor;
      effLow = m.low * factor;
    }
    if (close <= 0 || effLow <= 0 || effHigh <= 0) continue;
    unitsClose += amount / close;
    unitsLow += amount / effLow;
    unitsHigh += amount / effHigh;
  }
  const final = window[window.length - 1];
  const finalUsePriceOnly = basis === 'price_only' && final.closePriceOnly != null;
  const finalPrice = finalUsePriceOnly ? final.closePriceOnly : final.close;
  const confidence = asset === 'BTC' ? (startYear <= 2012 ? 'LOW' : 'MEDIUM') : 'HIGH';
  return {
    months: window.length,
    totalContributed: amount * window.length,
    terminalValue: Math.round(unitsClose * finalPrice),
    rangeLow: Math.round(unitsHigh * finalPrice),
    rangeHigh: Math.round(unitsLow * finalPrice),
    confidence,
    basis,
    startYm: window[0].ym,
    endYm: final.ym,
  };
}

function assetHistoryLumpSum(asset, startYear, amount, basis = 'total_return') {
  const series = monthlyPrices[asset]?.months;
  if (!series) return null;
  // A2 fix mirror.
  const startIdx = series.findIndex(m => parseInt(m.ym.slice(0, 4), 10) === startYear);
  if (startIdx === -1) return { error: `no data for ${asset} in ${startYear}` };
  const start = series[startIdx];
  const final = series[series.length - 1];
  const startPrice = basis === 'price_only' && start.closePriceOnly != null ? start.closePriceOnly : start.close;
  const finalPrice = basis === 'price_only' && final.closePriceOnly != null ? final.closePriceOnly : final.close;
  return {
    months: series.length - startIdx,
    totalContributed: amount,
    terminalValue: Math.round(amount * (finalPrice / startPrice)),
    startYm: start.ym,
    endYm: final.ym,
    confidence: asset === 'BTC' && startYear <= 2012 ? 'LOW' : asset === 'BTC' ? 'MEDIUM' : 'HIGH',
    basis,
  };
}

function projectCardFeeSavings(monthlyVolume, processorFeeRate, avgTx) {
  if (monthlyVolume < 0 || processorFeeRate < 0) return null;
  const monthlyFee = monthlyVolume * processorFeeRate;
  return {
    monthlyFee: Math.round(monthlyFee * 100) / 100,
    annualFee: Math.round(monthlyFee * 12 * 100) / 100,
    diboasSavings: Math.round(monthlyFee * 12 * 100) / 100,
    perTxFee: avgTx > 0 ? Math.round(avgTx * processorFeeRate * 100) / 100 : null,
  };
}

// ────────────────────────────────────────────────────────────────────────
// Scenario runners — one per tool, returning array of {label, input, output, expectation, status}
// ────────────────────────────────────────────────────────────────────────
const LOCALES = ['en', 'pt-BR', 'es', 'de'];

function runCompoundInterest() {
  const scenarios = [];
  // Defaults per locale
  const defaults = {
    en: { amount: 5, cadence: 'daily', years: 12 },
    'pt-BR': { amount: 25, cadence: 'daily', years: 12 },
    es: { amount: 3, cadence: 'daily', years: 12 },
    de: { amount: 4, cadence: 'daily', years: 12 },
  };
  for (const loc of LOCALES) {
    const i = defaults[loc];
    const monthly = cadenceToMonthly(i.amount, i.cadence);
    const months = i.years * 12;
    scenarios.push({
      category: 'default',
      label: `default ${loc}`,
      input: { ...i, locale: loc },
      output: {
        monthlyEq: Math.round(monthly * 100) / 100,
        bank: Math.round(annuityFV(monthly, FALLBACK.bankRates[loc].savings / 100, months)),
        conservative: Math.round(annuityFV(monthly, effRate(7, loc, i.years), months)),
        historical: Math.round(annuityFV(monthly, effRate(10, loc, i.years), months)),
        optimistic: Math.round(annuityFV(monthly, effRate(14, loc, i.years), months)),
      },
    });
  }
  // Cadence sweep
  for (const cad of ['oneTime', 'daily', 'weekly', 'monthly', 'quarterly', 'semiAnnual', 'yearly']) {
    const amount = cad === 'oneTime' ? 10000 : 200;
    const monthly = cadenceToMonthly(amount, cad);
    scenarios.push({
      category: 'happy-cadence',
      label: `cadence=${cad}`,
      input: { amount, cadence: cad, years: 10, locale: 'en' },
      output: {
        monthlyEq: Math.round(monthly * 100) / 100,
        historical: cad === 'oneTime' ? Math.round(lumpSumFV(amount, 0.10, 10)) : Math.round(annuityFV(monthly, 0.10, 120)),
      },
    });
  }
  // Edge: minimum amount per locale (exercises FX hedge at tiny scale)
  for (const loc of LOCALES) {
    scenarios.push({
      category: 'edge-min',
      label: `${loc}: amount=0.01 × 1y monthly`,
      input: { amount: 0.01, cadence: 'monthly', years: 1, locale: loc },
      output: { historical: Math.round(annuityFV(0.01, effRate(10, loc, 1), 12) * 100) / 100, effRate: Math.round(effRate(10, loc, 1) * 10000) / 100 + '%' },
    });
  }
  // Edge: max amount + max years per locale
  for (const loc of LOCALES) {
    scenarios.push({
      category: 'edge-max',
      label: `${loc}: INPUT_BOUNDS.amount.max × 14% × 40y oneTime`,
      input: { amount: 1_000_000_000, cadence: 'oneTime', years: 40, locale: loc },
      output: { lumpSumFV_optimistic: lumpSumFV(1_000_000_000, effRate(14, loc, 40), 40), effRate: Math.round(effRate(14, loc, 40) * 10000) / 100 + '%' },
    });
  }
  // Edge: pt-BR retirement R$7.34M (PT1 acceptance)
  scenarios.push({
    category: 'PT-acceptance',
    label: 'pt-BR R$2000/mo × 25y (PT1 Bar-signed)',
    input: { amount: 2000, cadence: 'monthly', years: 25, locale: 'pt-BR' },
    output: { historical: Math.round(annuityFV(2000, effRate(10, 'pt-BR', 25), 300)) },
  });
  // PT3: de €400/mo × 25y
  scenarios.push({
    category: 'PT-acceptance',
    label: 'de €400/mo × 25y (PT3 Bar-signed)',
    input: { amount: 400, cadence: 'monthly', years: 25, locale: 'de' },
    output: { historical: Math.round(annuityFV(400, effRate(10, 'de', 25), 300)) },
  });
  // Negative: amount=0 per locale
  for (const loc of LOCALES) {
    scenarios.push({
      category: 'negative-zero',
      label: `${loc}: amount=0`,
      input: { amount: 0, cadence: 'monthly', years: 10, locale: loc },
      output: { historical: 0, note: 'calculator validates >0; engine returns 0 FV' },
    });
  }
  return scenarios;
}

function runRetirement() {
  return [
    { category: 'default', label: 'default en', input: { amount: 500, years: 25, locale: 'en' },
      output: { historical: Math.round(annuityFV(500, 0.10, 300)) } },
    { category: 'default', label: 'default pt-BR (PT1 Bar-signed)', input: { amount: 2000, years: 25, locale: 'pt-BR' },
      output: { historical: Math.round(annuityFV(2000, effRate(10, 'pt-BR', 25), 300)) } },
    { category: 'default', label: 'default de (PT3 Bar-signed)', input: { amount: 400, years: 25, locale: 'de' },
      output: { historical: Math.round(annuityFV(400, effRate(10, 'de', 25), 300)) } },
    { category: 'default', label: 'default es', input: { amount: 400, years: 25, locale: 'es' },
      output: { historical: Math.round(annuityFV(400, effRate(10, 'es', 25), 300)) } },
    { category: 'edge-young', label: '$100/mo × 40y starting young', input: { amount: 100, years: 40, locale: 'en' },
      output: { historical: Math.round(annuityFV(100, 0.10, 480)) } },
    { category: 'edge-shorter', label: '$1000/mo × 10y', input: { amount: 1000, years: 10, locale: 'en' },
      output: { historical: Math.round(annuityFV(1000, 0.10, 120)) } },
  ];
}

function runGoalSavings() {
  return [
    { category: 'default', label: 'default en', input: { amount: 200, years: 10, locale: 'en' },
      output: { historical: Math.round(annuityFV(200, 0.10, 120)) } },
    { category: 'default', label: 'default pt-BR', input: { amount: 1000, years: 10, locale: 'pt-BR' },
      output: { historical: Math.round(annuityFV(1000, effRate(10, 'pt-BR', 10), 120)) } },
    { category: 'longer-horizon', label: 'en 20y', input: { amount: 200, years: 20, locale: 'en' },
      output: { historical: Math.round(annuityFV(200, 0.10, 240)) } },
  ];
}

function runEmergencyFund() {
  const scenarios = [];
  // Defaults
  const defaults = {
    en: { exp: 2900, sav: 300, mult: 6 },
    'pt-BR': { exp: 2700, sav: 270, mult: 6 },
    es: { exp: 1500, sav: 150, mult: 6 },
    de: { exp: 2000, sav: 200, mult: 6 },
  };
  for (const loc of LOCALES) {
    const i = defaults[loc];
    const target = i.exp * i.mult;
    const bankApy = FALLBACK.bankRates[loc].savings / 100;
    const infl = FALLBACK.inflationRates[loc].average5y;
    const horizonYrs = Math.max(1, target / (i.sav * 12));
    const dibApy = effRate(10, loc, horizonYrs);
    scenarios.push({
      category: 'default',
      label: `default ${loc}`,
      input: { ...i, locale: loc },
      output: {
        target,
        diboasMonths: monthsToTarget(target, i.sav, dibApy, infl),
        bankMonths: monthsToTarget(target, i.sav, bankApy, infl),
      },
    });
  }
  // Edge: bank rate vs inflation per locale (some unreachable, some fine)
  for (const loc of LOCALES) {
    const target = loc === 'pt-BR' ? 30000 : 15000;
    const sav = loc === 'pt-BR' ? 500 : 100;
    const bankApy = FALLBACK.bankRates[loc].savings / 100;
    const infl = FALLBACK.inflationRates[loc].average5y;
    scenarios.push({
      category: 'edge-bank-vs-inflation',
      label: `${loc}: bank ${(bankApy * 100).toFixed(2)}% vs infl ${(infl * 100).toFixed(1)}%, target ${target} sav ${sav}/mo`,
      input: { exp: target / 12, sav, mult: 12, locale: loc },
      output: {
        bankBeatsInflation: bankApy > infl,
        bankMonths: monthsToTarget(target, sav, bankApy, infl),
        diboasMonths: monthsToTarget(target, sav, effRate(10, loc, horizon0(target, sav)), infl),
      },
    });
  }
  // Edge: very high savings (fast reach) per locale
  for (const loc of LOCALES) {
    const target = loc === 'pt-BR' ? 15000 : 3000;
    const sav = loc === 'pt-BR' ? 25000 : 5000;
    scenarios.push({
      category: 'edge-fast',
      label: `${loc}: exp small sav large (fast)`,
      input: { exp: target / 3, sav, mult: 3, locale: loc },
      output: { diboasMonths: monthsToTarget(target, sav, effRate(10, loc, 1), FALLBACK.inflationRates[loc].average5y) },
    });
  }
  // Negative: savings=0 per locale
  for (const loc of LOCALES) {
    scenarios.push({
      category: 'negative-zero',
      label: `${loc}: sav=0 → unreachable`,
      input: { exp: 2900, sav: 0, mult: 6, locale: loc },
      output: { diboasMonths: Infinity, note: 'calculator returns null/blank' },
    });
  }
  return scenarios;
}
function horizon0(target, monthly) { return Math.max(1, target / (monthly * 12)); }

function runTimeToTarget() {
  const scenarios = [];
  for (const loc of LOCALES) {
    const target = loc === 'pt-BR' ? 250000 : loc === 'en' ? 50000 : 40000;
    const contrib = loc === 'pt-BR' ? 1000 : loc === 'en' ? 250 : 200;
    const horizonYrs = Math.max(1, target / (contrib * 12));
    scenarios.push({
      category: 'default',
      label: `default ${loc}`,
      input: { target, contribution: contrib, locale: loc },
      output: {
        bankMonths: monthsToTarget(target, contrib, FALLBACK.bankRates[loc].savings / 100),
        conservativeMonths: monthsToTarget(target, contrib, effRate(7, loc, horizonYrs)),
        historicalMonths: monthsToTarget(target, contrib, effRate(10, loc, horizonYrs)),
        optimisticMonths: monthsToTarget(target, contrib, effRate(14, loc, horizonYrs)),
      },
    });
  }
  // Edge: contribution=0 with positive initial (growth-only) per locale
  for (const loc of LOCALES) {
    const initial = loc === 'pt-BR' ? 50000 : 10000;
    const target = loc === 'pt-BR' ? 100000 : 20000;
    const ccy = LOCALE_CURRENCY[loc];
    scenarios.push({
      category: 'edge-growth-only',
      label: `${loc}: contrib=0 initial=${initial} ${ccy} target=${target}`,
      input: { target, initialAmount: initial, contribution: 0, locale: loc },
      output: { historicalMonths: monthsToTarget(target, 0, effRate(10, loc, 10), 0, initial) },
    });
  }
  // Edge: target unreachable per locale (1200-month cap)
  for (const loc of LOCALES) {
    const target = loc === 'pt-BR' ? 50_000_000 : 10_000_000;
    scenarios.push({
      category: 'edge-unreachable',
      label: `${loc}: target=${target} contrib=100/mo`,
      input: { target, contribution: 100, locale: loc },
      output: { historicalMonths: monthsToTarget(target, 100, effRate(10, loc, 100)), note: '1200-month cap → Infinity' },
    });
  }
  return scenarios;
}

function runAssetHistory() {
  const scenarios = [];
  // Defaults
  for (const loc of LOCALES) {
    const r = assetHistoryDcaReplay('BTC', 2016, loc === 'pt-BR' ? 500 : 100);
    scenarios.push({
      category: 'default',
      label: `BTC 2016 DCA default ${loc}`,
      input: { asset: 'BTC', startYear: 2016, mode: 'monthlyDca', amount: loc === 'pt-BR' ? 500 : 100, locale: loc },
      output: r,
    });
  }
  // All 8 assets at 2016 DCA $100/mo
  for (const asset of ['BTC', 'SP500', 'QQQ', 'MSCI_WORLD', 'GOLD', 'TLT', 'IBOVESPA', 'DAX']) {
    const r = assetHistoryDcaReplay(asset, 2016, 100);
    scenarios.push({ category: 'happy-asset-sweep', label: `${asset} 2016 DCA $100/mo`, input: { asset, startYear: 2016, mode: 'monthlyDca', amount: 100 }, output: r });
  }
  // BTC 2010 DCA — LOW confidence range (M6 calm-framing)
  scenarios.push({
    category: 'M6-low-confidence',
    label: 'BTC 2010 DCA $100/mo',
    input: { asset: 'BTC', startYear: 2010, mode: 'monthlyDca', amount: 100 },
    output: assetHistoryDcaReplay('BTC', 2010, 100),
    note: 'expected: error (BTC Yahoo data starts Sep 2014); 2010 BTC handled by legacy path with research-anchored range',
  });
  // BTC 2014 first available year for BTC
  scenarios.push({
    category: 'edge-data-floor',
    label: 'BTC 2014 DCA $100/mo (Sep 2014 first available BTC month)',
    input: { asset: 'BTC', startYear: 2014, mode: 'monthlyDca', amount: 100 },
    output: assetHistoryDcaReplay('BTC', 2014, 100),
  });
  // PT2 toggle: SP500 total return vs price only
  const trCase = assetHistoryDcaReplay('SP500', 2010, 100, 'total_return');
  const priceCase = assetHistoryDcaReplay('SP500', 2010, 100, 'price_only');
  scenarios.push({
    category: 'PT2-toggle',
    label: 'SP500 2010 DCA $100/mo — TR vs price-only delta',
    input: { asset: 'SP500', startYear: 2010, mode: 'monthlyDca', amount: 100 },
    output: {
      totalReturn: trCase?.terminalValue,
      priceOnly: priceCase?.terminalValue,
      deltaPct: trCase && priceCase ? Math.round((trCase.terminalValue / priceCase.terminalValue - 1) * 100 * 100) / 100 : null,
    },
  });
  // Lump sum vs DCA
  const lump = assetHistoryLumpSum('BTC', 2016, 12200);
  const dca = assetHistoryDcaReplay('BTC', 2016, 100);
  scenarios.push({
    category: 'mode-comparison',
    label: 'BTC 2016 lump $12,200 vs DCA $100/mo (same contributed)',
    input: { asset: 'BTC', startYear: 2016, amount: 12200 },
    output: { lumpSum: lump?.terminalValue, dca: dca?.terminalValue },
    note: 'F6-pending compound input: lumpSum leg = $12,200 (one-time at 2016-01-01 close); DCA leg = $100/mo × 125 months ($12,500 total contributed). Auditor implementations must NOT pass amount=12200 uniformly to both legs. Schema split into separate lumpSumAmount + dcaAmount fields deferred to v1.2 / v2 vectors per Auditor 4 F6 caveat.',
  });
  // 2026 start — only 6 months
  scenarios.push({
    category: 'edge-recent',
    label: 'SP500 2026 DCA $100/mo (only 6 months)',
    input: { asset: 'SP500', startYear: 2026, mode: 'monthlyDca', amount: 100 },
    output: assetHistoryDcaReplay('SP500', 2026, 100),
  });
  // Negative: invalid asset (would throw)
  scenarios.push({
    category: 'negative-bad-asset',
    label: 'invalid asset "FOO"',
    input: { asset: 'FOO', startYear: 2016, mode: 'monthlyDca', amount: 100 },
    output: { error: 'AssetHistoryDataError: no monthly series for FOO' },
  });
  return scenarios;
}

function runInflationImpact() {
  const scenarios = [];
  // Defaults
  for (const loc of LOCALES) {
    const amt = loc === 'pt-BR' ? 5000 : 1000;
    const yrs = 10;
    const inflRate = selectInflationRate(loc, yrs * 12);
    scenarios.push({
      category: 'default',
      label: `${loc} forward default`,
      input: { amount: amt, years: yrs, locale: loc },
      output: {
        cashRealValue: Math.round(purchasingPower(amt, yrs, inflRate)),
        loss: Math.round(amt - purchasingPower(amt, yrs, inflRate)),
        investedNominal: Math.round(lumpSumFV(amt, 0.10, yrs)),
        investedReal: Math.round(lumpSumFV(amt, 0.10, yrs) / Math.pow(1 + inflRate, yrs)),
      },
    });
  }
  // Retrospective mode
  for (const loc of LOCALES) {
    const amt = loc === 'pt-BR' ? 5000 : 1000;
    const cum = FALLBACK.inflationRates[loc].cumulativeSince2010;
    scenarios.push({
      category: 'retrospective',
      label: `${loc} since 2010`,
      input: { amount: amt, locale: loc, mode: 'retrospective' },
      output: {
        equivalentToday: Math.round(amt * (1 + cum)),
        purchasingPowerLost: Math.round(amt - amt / (1 + cum)),
      },
    });
  }
  // Edge: 2-year horizon per locale (uses .current vs .average5y)
  for (const loc of LOCALES) {
    const inflShort = selectInflationRate(loc, 24);  // ≤ 24mo → .current
    const inflLong = selectInflationRate(loc, 25);   // > 24mo → .average5y
    scenarios.push({
      category: 'edge-boundary-24mo',
      label: `${loc}: 2y uses .current ${(inflShort * 100).toFixed(2)}%; 3y uses .average5y ${(inflLong * 100).toFixed(2)}%`,
      input: { amount: 1000, years: 2, locale: loc },
      output: {
        inflRateAt24mo: inflShort,
        inflRateAt25mo: inflLong,
        cashRealValueAt2y: Math.round(purchasingPower(1000, 2, inflShort) * 100) / 100,
      },
    });
  }
  // Edge: 30-year horizon per locale
  for (const loc of LOCALES) {
    const infl = FALLBACK.inflationRates[loc].average5y;
    scenarios.push({
      category: 'edge-long',
      label: `${loc}: 30y at average5y inflation`,
      input: { amount: 1000, years: 30, locale: loc },
      output: { realValue: Math.round(purchasingPower(1000, 30, infl)), purchasingPowerLossPct: Math.round((1 - 1 / Math.pow(1 + infl, 30)) * 10000) / 100 + '%' },
    });
  }
  return scenarios;
}

function runCurrencyDepreciation() {
  const scenarios = [];
  for (const loc of LOCALES) {
    const ccy = LOCALE_CURRENCY[loc];
    const amt = loc === 'pt-BR' ? 50000 : 10000;
    const yrs = 5;
    const bankApy = FALLBACK.bankRates[loc].savings / 100;
    const dep = resolveDep(ccy, yrs);
    scenarios.push({
      category: 'default',
      label: `${loc} forward default`,
      input: { amount: amt, years: yrs, currency: ccy, locale: loc },
      output: {
        cashIdle: amt,
        bankFV: Math.round(lumpSumFV(amt, bankApy, yrs)),
        diboasFV: Math.round(lumpSumFV(amt, (1 + 0.10) * (1 + dep) - 1, yrs)),
        depreciationRate: Math.round(dep * 10000) / 100 + '%',
      },
    });
  }
  // pt-BR 10-year horizon (PT1 magnitude)
  scenarios.push({
    category: 'PT1-context',
    label: 'pt-BR R$50k × 10y (longer horizon → higher dep)',
    input: { amount: 50000, years: 10, currency: 'BRL', locale: 'pt-BR' },
    output: { diboasFV: Math.round(lumpSumFV(50000, (1.10)*(1 + resolveDep('BRL', 10)) - 1, 10)) },
  });
  // USD = no hedge
  scenarios.push({
    category: 'edge-usd',
    label: 'USD selected (no depreciation)',
    input: { amount: 10000, years: 5, currency: 'USD', locale: 'en' },
    output: { diboasFV: Math.round(lumpSumFV(10000, 0.10, 5)), depreciationRate: '0%' },
  });
  return scenarios;
}

function runCardFees() {
  const scenarios = [];
  const defaults = {
    en: { vol: 50000, fee: 0.029, tx: 75 },
    'pt-BR': { vol: 250000, fee: 0.03, tx: 250 },
    es: { vol: 40000, fee: 0.008, tx: 60 },
    de: { vol: 40000, fee: 0.008, tx: 60 },
  };
  for (const loc of LOCALES) {
    const i = defaults[loc];
    scenarios.push({
      category: 'default',
      label: `default ${loc} (Phase H fees)`,
      input: { monthlyVolume: i.vol, processorFeePct: i.fee * 100, avgTx: i.tx, locale: loc },
      output: projectCardFeeSavings(i.vol, i.fee, i.tx),
    });
  }
  // Edge: zero volume per locale
  for (const loc of LOCALES) {
    scenarios.push({
      category: 'edge-zero',
      label: `${loc}: monthlyVolume=0`,
      input: { monthlyVolume: 0, processorFeePct: defaults[loc].fee * 100, locale: loc },
      output: projectCardFeeSavings(0, defaults[loc].fee, 0),
    });
  }
  // Edge: very large volume per locale (B2B chain)
  for (const loc of LOCALES) {
    const vol = loc === 'pt-BR' ? 5_000_000 : 1_000_000;
    scenarios.push({
      category: 'edge-large',
      label: `${loc}: ${vol.toLocaleString('en-US')}/mo × ${defaults[loc].fee * 100}%`,
      input: { monthlyVolume: vol, processorFeePct: defaults[loc].fee * 100, locale: loc },
      output: projectCardFeeSavings(vol, defaults[loc].fee, 0),
    });
  }
  // IFR cap context: ES/DE at 0.8% (Phase H) vs US 2.9%
  scenarios.push({
    category: 'phase-h-IFR',
    label: 'EU IFR effective MSC vs US Stripe rate — same volume',
    input: { monthlyVolume: 50000, note: 'ES/DE 0.008 vs en 0.029' },
    output: {
      US_annual: projectCardFeeSavings(50000, 0.029, 75).annualFee,
      ES_DE_annual: projectCardFeeSavings(50000, 0.008, 60).annualFee,
      diBoaSSavingsDelta: projectCardFeeSavings(50000, 0.029, 75).annualFee - projectCardFeeSavings(50000, 0.008, 60).annualFee,
    },
  });
  // Edge: 0% fee
  scenarios.push({
    category: 'edge-no-fee',
    label: 'processorFee=0% (e.g., debit-only with US Durbin cap fully absorbed)',
    input: { monthlyVolume: 50000, processorFeePct: 0 },
    output: projectCardFeeSavings(50000, 0, 0),
  });
  return scenarios;
}

function runIdleCash() {
  const scenarios = [];
  const defaults = {
    en: { cash: 100000, yrs: 3, bank: 0.38 },
    'pt-BR': { cash: 500000, yrs: 3, bank: 6.83 },
    es: { cash: 80000, yrs: 3, bank: 2.0 },
    de: { cash: 80000, yrs: 3, bank: 2.3 },
  };
  for (const loc of LOCALES) {
    const i = defaults[loc];
    const dibApy = effRate(7, loc, i.yrs);  // Idle Cash uses CONSERVATIVE not Historical
    scenarios.push({
      category: 'default',
      label: `default ${loc}`,
      input: { idleCash: i.cash, years: i.yrs, bankYieldPct: i.bank, locale: loc },
      output: {
        bankFV: Math.round(lumpSumFV(i.cash, i.bank / 100, i.yrs)),
        diboasFV: Math.round(lumpSumFV(i.cash, dibApy, i.yrs)),
        diboasEffectiveAPY: Math.round(dibApy * 10000) / 100 + '%',
        deltaOverHorizon: Math.round(lumpSumFV(i.cash, dibApy, i.yrs) - lumpSumFV(i.cash, i.bank / 100, i.yrs)),
      },
    });
  }
  // Edge: zero idle cash per locale
  for (const loc of LOCALES) {
    scenarios.push({
      category: 'edge-zero',
      label: `${loc}: idleCash=0`,
      input: { idleCash: 0, years: 3, bankYieldPct: defaults[loc].bank, locale: loc },
      output: { bankFV: 0, diboasFV: 0, note: 'calculator returns null when idle <= 0' },
    });
  }
  // Edge: very long horizon per locale (10y) to expose hedge compounding
  for (const loc of LOCALES) {
    const i = defaults[loc];
    const dibApy = effRate(7, loc, 10);
    scenarios.push({
      category: 'edge-long',
      label: `${loc}: idleCash 10y at conservative+hedge`,
      input: { idleCash: i.cash, years: 10, bankYieldPct: i.bank, locale: loc },
      output: {
        bankFV: Math.round(lumpSumFV(i.cash, i.bank / 100, 10)),
        diboasFV: Math.round(lumpSumFV(i.cash, dibApy, 10)),
        delta: Math.round(lumpSumFV(i.cash, dibApy, 10) - lumpSumFV(i.cash, i.bank / 100, 10)),
      },
    });
  }
  // User overrides bank yield to high-yield (en HYSA 4.10%)
  scenarios.push({
    category: 'happy-hysa',
    label: 'en $100k × 5y, user override 4.10% HYSA',
    input: { idleCash: 100000, years: 5, bankYieldPct: 4.10, locale: 'en' },
    output: { bankFV: Math.round(lumpSumFV(100000, 0.0410, 5)), diboasFV: Math.round(lumpSumFV(100000, 0.07, 5)) },
  });
  // Negative: negative idle cash per locale
  for (const loc of LOCALES) {
    scenarios.push({
      category: 'negative',
      label: `${loc}: idleCash=-1000 (invalid)`,
      input: { idleCash: -1000, years: 3, bankYieldPct: defaults[loc].bank, locale: loc },
      output: { note: 'calculator clamps to 0 via handleChange; engine rejects negative' },
    });
  }
  return scenarios;
}

function runBrazilPoupanca() {
  return [
    { category: 'current-regime', label: 'Selic 14.50% + TR 0', input: { selic: 14.50, tr: 0 }, output: { rate: derivePoupancaRate(14.50, 0) } },
    { category: 'edge-threshold', label: 'Selic 8.5% (boundary, low regime)', input: { selic: 8.5, tr: 0 }, output: { rate: derivePoupancaRate(8.5, 0) } },
    { category: 'edge-threshold', label: 'Selic 8.51% (just above, high regime)', input: { selic: 8.51, tr: 0 }, output: { rate: derivePoupancaRate(8.51, 0) } },
    { category: 'low-regime', label: 'Selic 6% + TR 0 (low regime)', input: { selic: 6.0, tr: 0 }, output: { rate: derivePoupancaRate(6.0, 0) } },
    { category: 'edge-tr-nonzero', label: 'Selic 14.5% + TR 0.05%/mo', input: { selic: 14.5, tr: 0.05 }, output: { rate: derivePoupancaRate(14.5, 0.05) } },
    { category: 'negative', label: 'Selic = -1 (invalid)', input: { selic: -1, tr: 0 }, output: { rate: derivePoupancaRate(-1, 0) } },
    { category: 'negative', label: 'Selic = NaN', input: { selic: NaN, tr: 0 }, output: { rate: derivePoupancaRate(NaN, 0) } },
  ];
}

// ────────────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────────────
const outArg = process.argv.indexOf('--out');
const outPath = outArg !== -1 ? process.argv[outArg + 1] : path.join(__dirname, 'tools-stress-test-out.json');

const baseline = {
  generatedAt: new Date().toISOString(),
  schema: 'tools-stress-test-v1',
  inputData: {
    bankRates: FALLBACK.bankRates,
    scenarioRates: FALLBACK.scenarioRates,
    inflationRates: FALLBACK.inflationRates,
    exchangeRates: FALLBACK.exchangeRates,
    horizonMatchedDepreciations: {
      BRL_5y: deriveHorizonMatchedCAGR('BRL', 5),
      BRL_10y: deriveHorizonMatchedCAGR('BRL', 10),
      BRL_25y: deriveHorizonMatchedCAGR('BRL', 25),
      EUR_5y: deriveHorizonMatchedCAGR('EUR', 5),
      EUR_25y: deriveHorizonMatchedCAGR('EUR', 25),
    },
  },
  scenarios: {
    compoundInterest: runCompoundInterest(),
    retirement: runRetirement(),
    goalSavings: runGoalSavings(),
    emergencyFund: runEmergencyFund(),
    timeToTarget: runTimeToTarget(),
    assetHistory: runAssetHistory(),
    inflationImpact: runInflationImpact(),
    currencyDepreciation: runCurrencyDepreciation(),
    cardFees: runCardFees(),
    idleCash: runIdleCash(),
    brazilPoupanca: runBrazilPoupanca(),
  },
};

// Replace Infinity with string "INF" for JSON serialization
function sanitize(o) {
  if (o === null || o === undefined) return o;
  if (typeof o === 'number') return Number.isFinite(o) ? o : 'INF';
  if (Array.isArray(o)) return o.map(sanitize);
  if (typeof o === 'object') {
    const r = {};
    for (const k of Object.keys(o)) r[k] = sanitize(o[k]);
    return r;
  }
  return o;
}

fs.writeFileSync(outPath, JSON.stringify(sanitize(baseline), null, 2));
let totalScenarios = 0;
for (const k of Object.keys(baseline.scenarios)) totalScenarios += baseline.scenarios[k].length;
console.log(`Wrote ${outPath}`);
console.log(`Total scenarios: ${totalScenarios} across ${Object.keys(baseline.scenarios).length} tools`);
