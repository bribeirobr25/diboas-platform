'use client';

/**
 * Currency Depreciation Calculator (Tier-2 tool, 6D.3).
 *
 * **FX-16 adoption (2026-05-26, Bar D1+D8):** picker expanded from 3 (USD/BRL/EUR)
 * to 17 currencies (USD + 16 from `docs/tools/usd_fx_projection_model_consolidated.md`
 * §6). ARS/CLP/COP excluded per the FX model's §5 hyperinflation/multi-regime gate.
 *
 * Two modes:
 *   - Forward: compares 3 outcomes for a today-amount held in a non-USD
 *     currency: cash idle, local bank rate, digital dollar at Historical rate.
 *   - Retrospective: shows what an amount in local currency from Jan 2010 was
 *     worth in USD then vs now, using `historicalRateStart` / `historicalRateEnd`
 *     from Phase A. **BRL/EUR only** (D4 — `HistoricalAnchorsData.fxBuckets` is
 *     a closed two-key type; the 14 new currencies have no anchor data).
 *
 * Math: `calculateWithCurrencyHedge` and `calculateLumpSum` from market-data
 * formulas. **Forward depreciation rate (FX-16 D1 priority inversion, 2026-05-26):**
 * `resolveHorizonMatchedDepreciation` now consults the calibrated constant
 * `exchangeRates.rates[CURRENCY].annualDepreciation` FIRST and falls back to a
 * monthly-FX horizon-matched CAGR only when the constant is missing. The
 * pre-2026-05-26 policy was inverted ("live FX wins"); D1 corrected the misuse
 * — see `lib/market-data/formulas/horizonMatchedCagr.ts` for full rationale.
 * Retrospective USD-equivalent uses the locked anchor pair from Phase A.
 *
 * **Bank-rate gate (FX-16 D3):** `getBankRateForCurrency` returns `null` for
 * the 14 new currencies (no `LOCALE_CURRENCY` mapping). The bank card hides
 * on null — honest "no card" over fake fallback.
 *
 * For en (USD) where there's no foreign-currency depreciation to model, the
 * tool still works — forward depreciation defaults to 0; retrospective mode's
 * tab disables for USD too (only BRL/EUR have anchor data per D4).
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Select } from '@diboas/ui';
import { useLocale } from '@/components/Providers';
import { useCalculatorAnalytics } from '@/hooks/useCalculatorAnalytics';
import { LOCALE_CURRENCY, marketDataService, type SupportedLocale } from '@/lib/market-data';
import { formatCurrency } from '@/lib/compound-interest';
import {
  calculateCurrencyDepreciationForward,
  calculateCurrencyDepreciationRetrospective,
  CURRENCY_DEPRECIATION_OPTIONS,
  CURRENCY_DEPRECIATION_SCENARIO_USD_PERCENT,
  type CurrencyDepreciationOption,
} from '@/lib/currency-depreciation';
import { CURRENCY_BUCKET } from '@/lib/currency-depreciation/buckets';
import {
  CURRENCY_DEPRECIATION_AMOUNT_BOUNDS,
  CURRENCY_DEPRECIATION_DEFAULTS,
  CURRENCY_DEPRECIATION_YEARS_BOUNDS,
  clampInput,
} from '@/lib/tools';
import styles from './CurrencyDepreciationCalculator.module.css';

const HISTORICAL_RATE = CURRENCY_DEPRECIATION_SCENARIO_USD_PERCENT;

/**
 * Retrospective-mode is available only for currencies with a locked historical
 * anchor pair (FX-16 D4). Currently BRL + EUR. Expanding requires sourcing the
 * `historical*` field group + a `HistoricalAnchorsData.fxBuckets` schema change
 * — explicit downstream research work, not part of FX-16 adoption.
 */
const RETROSPECTIVE_AVAILABLE: ReadonlySet<CurrencyDepreciationOption> = new Set(['BRL', 'EUR']);

/**
 * Build the picker option list with FX-16 D7 ordering:
 *   1. User-locale currency first (USD for en, BRL for pt-BR, EUR for de/es)
 *   2. Remaining 16 in alphabetical order
 *
 * Defensive: if the locale currency is somehow not in CURRENCY_DEPRECIATION_OPTIONS
 * (e.g. a future locale with an unmapped currency), fall back to alphabetical only.
 */
function buildOrderedCurrencyOptions(
  userLocaleCurrency: CurrencyDepreciationOption
): readonly CurrencyDepreciationOption[] {
  const all = [...CURRENCY_DEPRECIATION_OPTIONS] as CurrencyDepreciationOption[];
  if (!all.includes(userLocaleCurrency)) {
    return all.sort();
  }
  const rest = all.filter((c) => c !== userLocaleCurrency).sort();
  return [userLocaleCurrency, ...rest];
}

type Mode = 'forward' | 'retrospective';

interface FormState {
  amount: number;
  years: number;
  /** Currency override — defaults to user locale's currency; can be changed to compare. */
  currency: CurrencyDepreciationOption;
}

export function CurrencyDepreciationCalculator() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();
  const localeKey = (locale ?? 'en') as SupportedLocale;
  const initialCurrency = LOCALE_CURRENCY[localeKey] ?? 'USD';

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-currency-depreciation.${key}` }, values);
  const tShared = (key: string) => intl.formatMessage({ id: `tools-shared.${key}` });

  const initial = useMemo<FormState>(
    () => ({
      amount: CURRENCY_DEPRECIATION_DEFAULTS.amount[localeKey],
      years: CURRENCY_DEPRECIATION_DEFAULTS.years,
      currency: initialCurrency as CurrencyDepreciationOption,
    }),
    [localeKey, initialCurrency]
  );
  const [form, setForm] = useState<FormState>(initial);
  const [mode, setMode] = useState<Mode>('forward');
  const currency = form.currency;
  const bucket = CURRENCY_BUCKET[currency];
  const isPeg = bucket === 'peg';
  // FX-16 D4 (2026-05-26): retrospective stays BRL/EUR-only. If the user is in
  // retrospective mode and switches to a currency without anchor data, derive
  // the effective mode as 'forward' so the panel renders correctly — state
  // isn't mutated during render. The retrospective tab is also disabled, so
  // the user can re-enter retrospective by first switching to BRL/EUR.
  const retrospectiveSupported = RETROSPECTIVE_AVAILABLE.has(currency);
  const effectiveMode: Mode =
    mode === 'retrospective' && !retrospectiveSupported ? 'forward' : mode;
  const currencyOptions = useMemo(
    () => buildOrderedCurrencyOptions(initialCurrency as CurrencyDepreciationOption),
    [initialCurrency]
  );

  // C32 close (TOOLS_41_DEFECTS_FIX_PLAN.md §5.7, 2026-05-26): named constant
  // for the USD formatting locale instead of hardcoded literal `'en'`. The
  // retrospective cards' USD-equivalent values ARE always USD-denominated
  // (the math converts to dollars), so they should always format under en-US
  // conventions — not the page locale. Forward cards keep `localeKey`. Making
  // this explicit prevents a future "fix" from applying the wrong locale to
  // either branch.
  const usdLocale: SupportedLocale = 'en';

  const snapshot = marketDataService.getSync();

  const forwardResult = useMemo(
    () =>
      effectiveMode === 'forward'
        ? calculateCurrencyDepreciationForward(
            { amount: form.amount, years: form.years, currency: form.currency },
            snapshot
          )
        : null,
    [effectiveMode, form, snapshot]
  );

  const retrospectiveResult = useMemo(
    () =>
      effectiveMode === 'retrospective'
        ? calculateCurrencyDepreciationRetrospective(
            { amount: form.amount, currency: form.currency },
            snapshot
          )
        : null,
    [effectiveMode, form.amount, form.currency, snapshot]
  );

  // A16/O-1: open + compute analytics, uniform with the CalculatorDefault tools.
  useCalculatorAnalytics(
    'currency-depreciation',
    localeKey,
    forwardResult || retrospectiveResult ? `${effectiveMode}:${JSON.stringify(form)}` : null
  );

  // Derived values for display
  // FX-16 D3 (2026-05-26): `bankRatePercent` is `number | null`. Null means no
  // local bank-rate proxy exists (the 14 new currencies); the bank card hides.
  const bankRate = forwardResult?.bankRatePercent ?? null;
  const depreciation = forwardResult?.depreciation ?? 0;
  const hasBankRate = bankRate !== null;

  // Architecture audit V1 (2026-05-26 post-CTO-Action-6 cleanup): bounds were
  // originally inlined here as `AMOUNT_MAX = 100M` + `YEARS_MAX = 40`, which
  // violated the C14/C27/C34/C36 pattern (P4 DRY + P8 input-validation
  // centralization). Bounds now live in `lib/tools/clampInput.ts` alongside
  // the other 5 per-tool `*_BOUNDS` constants; this component consumes them
  // via the shared `clampInput()` helper. Single source of truth for every
  // numeric input in the tools suite.
  const handleNumber = (field: 'amount' | 'years', value: number) =>
    setForm((prev) => ({
      ...prev,
      [field]: clampInput(
        value,
        field === 'years' ? CURRENCY_DEPRECIATION_YEARS_BOUNDS : CURRENCY_DEPRECIATION_AMOUNT_BOUNDS
      ),
    }));
  const handleCurrency = (newCurrency: string) =>
    setForm((prev) => ({ ...prev, currency: newCurrency as CurrencyDepreciationOption }));

  const isUsd = currency === 'USD';
  const showYearsInput = effectiveMode === 'forward';
  // FX-16 D6 (2026-05-26): single neutral copy that reads naturally for all 3
  // FX directions (positive-FX/erosion, negative-FX/strengthening, peg/no-drift).
  // The bucket informs the dep-source note framing; the cash card uses one key.
  // Pegs don't need the depreciation-source explainer (FX = 0 by policy is
  // simpler to state than horizon-matched-vs-anchor-pair distinction).
  const showDepSourceNote = !isUsd && !isPeg;

  return (
    <div className={styles.calculator}>
      <div className={styles.modeToggle} role="tablist" aria-label={t('mode.ariaLabel')}>
        <button
          type="button"
          role="tab"
          aria-selected={effectiveMode === 'forward'}
          className={`${styles.modeButton} ${effectiveMode === 'forward' ? styles.modeButtonActive : ''}`}
          onClick={() => setMode('forward')}
        >
          {t('mode.forward')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={effectiveMode === 'retrospective'}
          aria-disabled={!retrospectiveSupported}
          disabled={!retrospectiveSupported}
          title={!retrospectiveSupported ? t('mode.retrospectiveDisabledTooltip') : undefined}
          className={`${styles.modeButton} ${effectiveMode === 'retrospective' ? styles.modeButtonActive : ''}`}
          onClick={() => retrospectiveSupported && setMode('retrospective')}
        >
          {t('mode.retrospective')}
        </button>
      </div>

      {/* C30 close (TOOLS_41_DEFECTS_FIX_PLAN.md §6, 2026-05-26): for USD users
          the tool collapses (no foreign-currency depreciation to model).
          Instead of a thin "this tool is for non-USD" note, render a stability
          framing card that contextualizes why USD users are already on the
          strong side AND prompts them to switch the selector to BRL/EUR if
          they want to see the comparison. */}
      {isUsd && (
        <div className={styles.usdStabilityCard} role="note">
          <p className={styles.usdStabilityTitle}>{t('output.usdStabilityFramingTitle')}</p>
          <p className={styles.usdStabilityBody}>{t('output.usdStabilityFramingBody')}</p>
        </div>
      )}

      {/* C28 close (TOOLS_41_DEFECTS_FIX_PLAN.md §5.5, 2026-05-26): forward
          mode uses a horizon-matched CAGR from recent FX data; retrospective
          uses the locked 2010→2026 anchor pair. The two numbers can disagree
          for the same currency — this note tells the user the math reason
          rather than letting them silently see different stories. */}
      {showDepSourceNote && effectiveMode === 'forward' && (
        <p className={styles.depSourceNote}>
          {t('output.depSourceForward', { years: form.years })}
        </p>
      )}
      {showDepSourceNote && effectiveMode === 'retrospective' && (
        <p className={styles.depSourceNote}>{t('output.depSourceRetrospective', { currency })}</p>
      )}
      {/* FX-16 D6/peg variant: explicit note for pegged currencies (HKD/AED) */}
      {!isUsd && isPeg && effectiveMode === 'forward' && (
        <p className={styles.depSourceNote}>{t('output.depSourcePeg', { currency })}</p>
      )}

      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-currency`} className={styles.label}>
            {t('inputs.currencyLabel')}
          </label>
          <Select
            id={`${baseId}-currency`}
            value={currency}
            onChange={(e) => handleCurrency(e.target.value)}
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-amount`} className={styles.label}>
            {mode === 'forward'
              ? t('inputs.amountLabel', { currency })
              : t('inputs.amountLabel2010', { currency })}
          </label>
          <input
            id={`${baseId}-amount`}
            type="number"
            inputMode="decimal"
            min={CURRENCY_DEPRECIATION_AMOUNT_BOUNDS.min}
            max={CURRENCY_DEPRECIATION_AMOUNT_BOUNDS.max}
            step={1000}
            value={form.amount}
            onChange={(e) => handleNumber('amount', Number(e.target.value))}
            className={styles.numberInput}
          />
        </div>
        {showYearsInput && (
          <div className={styles.field}>
            <label htmlFor={`${baseId}-years`} className={styles.label}>
              {t('inputs.yearsLabel')}
            </label>
            <input
              id={`${baseId}-years`}
              type="number"
              inputMode="numeric"
              min={CURRENCY_DEPRECIATION_YEARS_BOUNDS.min}
              max={CURRENCY_DEPRECIATION_YEARS_BOUNDS.max}
              step={1}
              value={form.years}
              onChange={(e) => handleNumber('years', Math.round(Number(e.target.value)))}
              className={styles.numberInput}
            />
            {!isUsd && (
              <span className={styles.help}>
                {t('inputs.depreciationHelp', {
                  rate: (depreciation * 100).toFixed(1),
                  currency,
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {effectiveMode === 'forward' && forwardResult && (
        <div className={styles.resultsGrid}>
          {!isUsd && (
            <div className={styles.resultCardCash}>
              <p className={styles.resultLabel}>{t('output.cashLabel')}</p>
              <p className={styles.resultValueMuted}>
                {formatCurrency(forwardResult.cashUsdEquivalent, localeKey, {
                  maximumFractionDigits: 0,
                })}
              </p>
              <p className={styles.resultRate}>
                {t('output.cashEvolution', {
                  rate: (depreciation * 100).toFixed(1),
                  currency,
                })}
              </p>
            </div>
          )}
          {/* FX-16 D3 (2026-05-26): bank card hides when no local bank-rate
              proxy exists (the 14 new currencies). Honest "no card" beats
              stretched data. */}
          {hasBankRate && bankRate !== null && (
            <div className={styles.resultCardBank}>
              <p className={styles.resultLabel}>{t('output.bankLabel')}</p>
              <p className={styles.resultValueMuted}>
                {formatCurrency(forwardResult.bankLocal, localeKey, { maximumFractionDigits: 0 })}
              </p>
              <p className={styles.resultRate}>
                {t('output.bankRateNote', { rate: bankRate.toFixed(2) })}
              </p>
            </div>
          )}
          <div className={styles.resultCardDiboas}>
            <p className={styles.resultLabel}>{t('output.diboasLabel')}</p>
            <p className={styles.resultValue}>
              {formatCurrency(forwardResult.usdcLocal, localeKey, { maximumFractionDigits: 0 })}
            </p>
            <p className={styles.resultRate}>
              {t('output.diboasNote', { rate: HISTORICAL_RATE.toString() })}
            </p>
          </div>
        </div>
      )}

      {effectiveMode === 'retrospective' && retrospectiveResult && (
        <div className={styles.resultsGrid}>
          <div className={styles.resultCardCash}>
            <p className={styles.resultLabel}>{t('output.retrospectiveThenLabel')}</p>
            <p className={styles.resultValueMuted}>
              {formatCurrency(retrospectiveResult.usdValueThen, usdLocale, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className={styles.resultRate}>
              {t('output.retrospectiveThenNote', {
                currency,
                rate: retrospectiveResult.rateStart.toFixed(2),
              })}
            </p>
          </div>
          <div className={styles.resultCardBank}>
            <p className={styles.resultLabel}>{t('output.retrospectiveNowLabel')}</p>
            <p className={styles.resultValueMuted}>
              {formatCurrency(retrospectiveResult.usdValueNow, usdLocale, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className={styles.resultRate}>
              {t('output.retrospectiveNowNote', {
                currency,
                rate: retrospectiveResult.rateEnd.toFixed(2),
              })}
            </p>
          </div>
          <div className={styles.resultCardDiboas}>
            <p className={styles.resultLabel}>{t('output.retrospectiveLossLabel')}</p>
            <p className={styles.resultValue}>
              −{retrospectiveResult.percentLossInUsdTerms.toFixed(0)}%
            </p>
            <p className={styles.resultRate}>
              {t('output.retrospectiveLossNote', {
                currency,
                cagr: (retrospectiveResult.historicalCagr * 100).toFixed(2),
              })}
            </p>
            {/* FX-16 Phase 2 step 4 baseline (2026-05-26): confidence map
                rewritten — ARS/CLP/COP branches deleted (per FX model §5
                hyperinflation exclusion); MXN activated at MEDIUM (currency-pain
                bucket, moderate-volatility). HIGH/MEDIUM split for the full
                16-currency set is deferred to a follow-up sub-PR per M5; that
                sub-PR must cite specific cells from the model §7 divergence
                matrix per assignment (no vibes-based assignments). Today,
                retrospective is only reachable for BRL/EUR (D4), so the
                MEDIUM/HIGH branches are the only paths actually exercised. */}
            {(() => {
              const confidence: 'HIGH' | 'MEDIUM' | 'LOW' = ['BRL', 'MXN'].includes(currency)
                ? 'MEDIUM'
                : 'HIGH';
              return (
                <>
                  <span
                    className={`${styles.confidenceBadge} ${
                      confidence === 'HIGH'
                        ? styles.confidenceHigh
                        : confidence === 'MEDIUM'
                          ? styles.confidenceMedium
                          : styles.confidenceLow
                    }`}
                  >
                    {tShared(`confidence.${confidence.toLowerCase()}`)}
                  </span>
                  {confidence === 'MEDIUM' && (
                    <p className={styles.uncertaintyNote}>{t('output.uncertaintyMedium')}</p>
                  )}
                  {/* uncertaintyLow branch retained in i18n but currently
                      unreachable — ARS/CLP/COP removed per FX-16 §5 exclusion;
                      re-activates if/when LOW-confidence currencies ship in
                      the deferred Phase 2 step-4 confidence sub-PR (per M5). */}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default CurrencyDepreciationCalculator;
