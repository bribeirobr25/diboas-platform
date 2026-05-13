#!/usr/bin/env node
/**
 * Phase-7 B2B card derivation script.
 *
 * Computes per-locale `diboasResult` and `bankResult` for the two B2B cards
 * (Payment Fees + Idle Cash) via canonical functions — preventing the stale-
 * value drift documented in M1+M2+NF1 audit findings.
 *
 * Run once when scenario rates / bank rates / depreciation values change in
 * `apps/web/src/lib/market-data/constants.ts`. Output is copy-pasted into
 * `packages/i18n/translations/{locale}/landing-b2b.json`.
 *
 * Usage:   node scripts/derive-b2b-card-numbers.mjs
 */

// ─── canonical references (kept in sync with FALLBACK_MARKET_DATA) ───
const SCENARIO_CONSERVATIVE_PCT = 7;
const BANK_RATES_PCT = {
  en: 0.32,    // FDIC/FRED 5yr avg savings (US)
  'pt-BR': 6.83, // BCB/B3 5yr avg NET (after 22.5% IR tax)
  de: 1.22,    // Bundesbank/ECB 5yr avg
  es: 0.14,    // ECB/Tesoro 5yr avg
};
const DEPRECIATION_DECIMAL = {
  BRL: 0.03,
  EUR: 0.009,
};
const LOCALE_CURRENCY = { en: 'USD', 'pt-BR': 'BRL', de: 'EUR', es: 'EUR' };

// ─── canonical formula (effective-rate model — currencyHedge.ts:43) ───
const effectiveLocalAPY = (usdYieldDecimal, depDecimal) =>
  (1 + usdYieldDecimal) * (1 + depDecimal) - 1;

// ─── Card 1: Payment Fees (annual lump-sum @ Historical 10%, per M1 owner-locked) ───
const PAYMENT_FEES_ANNUAL_SAVINGS = {
  en: 10_800,   // $1,000/day × 30 × 3%  × 12 = $10,800
  'pt-BR': 72_000, // R$5,000/day × 30 × 4% × 12 = R$72,000
  de: 9_000,    // €1,000/day × 30 × 2.5% × 12 = €9,000
  es: 9_000,
};
const PAYMENT_FEES_DIBOAS_RATE = 1.10; // 10% historical

// ─── Card 2: Idle Cash (NF1 owner-locked: en M2(b), pt-BR/de/es NF1(a)) ───
const IDLE_CASH_PRINCIPAL = {
  en: 100_000,
  'pt-BR': 500_000,
  de: 100_000,
  es: 100_000,
};

console.log('# Phase-7 B2B card numbers — derived 2026-05-13\n');

console.log('## Payment Fees (annual lump-sum @ 10% historical)\n');
for (const locale of ['en', 'pt-BR', 'de', 'es']) {
  const savings = PAYMENT_FEES_ANNUAL_SAVINGS[locale];
  const diboasResult = Math.round(savings * PAYMENT_FEES_DIBOAS_RATE);
  const difference = diboasResult; // card narrative: "more than R$X/year"
  console.log(`  ${locale}: diboasResult=${diboasResult}, difference=${difference} (from savings=${savings})`);
}

console.log('\n## Idle Cash\n');
console.log('  en (M2(b) — high-yield savings, no hedge):');
{
  const principal = IDLE_CASH_PRINCIPAL.en;
  const bank = Math.round(principal * 0.035); // 3.5% high-yield savings
  const diboas = Math.round(principal * (SCENARIO_CONSERVATIVE_PCT / 100));
  const diff = diboas - bank;
  console.log(`    bankResult=${bank}, diboasResult=${diboas}, difference=${diff}`);
}
for (const locale of ['pt-BR', 'de', 'es']) {
  const principal = IDLE_CASH_PRINCIPAL[locale];
  const bankPct = BANK_RATES_PCT[locale];
  const bank = Math.round(principal * (bankPct / 100));
  const currency = LOCALE_CURRENCY[locale];
  const dep = DEPRECIATION_DECIMAL[currency];
  const eff = effectiveLocalAPY(SCENARIO_CONSERVATIVE_PCT / 100, dep);
  const diboas = Math.round(principal * eff);
  const diff = diboas - bank;
  console.log(
    `  ${locale} (NF1(a) — currency hedge, ${(eff * 100).toFixed(4)}% effective local APY):`,
  );
  console.log(
    `    bankResult=${bank} (${bankPct}% canonical savings), diboasResult=${diboas}, difference=${diff}`,
  );
}
