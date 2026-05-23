'use client';

/**
 * Time-to-Target Calculator (Tier-2 tool, 6D.2).
 *
 * Inverse of compound interest: "When will I reach $X?". Outputs years
 * across 4 scenarios (bank, conservative 7%, historical 10%, optimistic 14%)
 * given target + initial deposit + recurring contribution + cadence.
 *
 * Math: `monthsToInflationAdjustedTarget` from market-data formulas with
 * inflation hard-locked to 0 (this tool is "nominal time-to-target",
 * inflation-adjusted variant lives in Emergency Fund tool 6C).
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Select } from '@diboas/ui';
import { useLocale } from '@/components/Providers';
import {
  calculateLumpSum,
  marketDataService,
  monthsToInflationAdjustedTarget,
  type SupportedLocale,
} from '@/lib/market-data';
import { LOCALE_CURRENCY } from '@/lib/market-data/constants';
import { resolveHorizonMatchedDepreciation } from '@/lib/market-data/formulas';
import {
  convertCadenceToMonthly,
  isOneTime,
  formatCurrency,
  type Cadence,
} from '@/lib/compound-interest';
import { SCENARIO_RATES } from '@/lib/compound-interest/scenarios';
import { TIME_TO_TARGET_DEFAULTS } from '@/lib/tools';
import styles from './TimeToTargetCalculator.module.css';

const CADENCE_OPTIONS: readonly Cadence[] = [
  'oneTime',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semiAnnual',
  'yearly',
];

const SCENARIO_KEYS = ['bank', 'conservative', 'historical', 'optimistic'] as const;
type ScenarioKey = (typeof SCENARIO_KEYS)[number];

interface FormState {
  target: number;
  initialAmount: number;
  contribution: number;
  cadence: Cadence;
}

export function TimeToTargetCalculator() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();
  const localeKey = (locale ?? 'en') as SupportedLocale;

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-time-to-target.${key}` }, values);
  const tShared = (key: string) => intl.formatMessage({ id: `tools-shared.${key}` });
  const tCadence = (cadence: Cadence) =>
    intl.formatMessage({ id: `learn-compound-interest.calculator.cadenceOptions.${cadence}` });

  const initial = useMemo<FormState>(
    () => ({
      target: TIME_TO_TARGET_DEFAULTS.target[localeKey],
      initialAmount: TIME_TO_TARGET_DEFAULTS.initialAmount[localeKey],
      contribution: TIME_TO_TARGET_DEFAULTS.contribution[localeKey],
      cadence: TIME_TO_TARGET_DEFAULTS.cadence,
    }),
    [localeKey],
  );
  const [form, setForm] = useState<FormState>(initial);

  const snapshot = marketDataService.getSync();
  const bankRate = snapshot.rates.bankRates[localeKey]?.savings ?? 0;

  // Phase D (TOOLS_IMPROVEMENT.md, 2026-05-23): horizon-matched depreciation
  // helper. For time-to-target, horizon is unknown a priori — use a rough
  // estimate from the target ÷ contribution. Phase-7 currency-hedge precedent:
  // useGoalCardData.ts:57-61. Bank scenario stays at locale savings rate
  // (no hedge — bank pays in local currency, not USD).
  const currency = LOCALE_CURRENCY[localeKey];
  const estimatedHorizonYears = form.contribution > 0
    ? Math.max(1, Math.min(40, form.target / (form.contribution * 12)))
    : 10;
  const depreciation = resolveHorizonMatchedDepreciation(snapshot, currency, estimatedHorizonYears);
  const hedge = (usdRatePercent: number): number => {
    if (depreciation === 0) return usdRatePercent;
    return ((1 + usdRatePercent / 100) * (1 + depreciation) - 1) * 100;
  };

  const scenarioRates: Record<ScenarioKey, number> = {
    bank: bankRate,
    conservative: hedge(SCENARIO_RATES.conservative),
    historical: hedge(SCENARIO_RATES.historical),
    optimistic: hedge(SCENARIO_RATES.optimistic),
  };

  const monthlyContribution = isOneTime(form.cadence)
    ? 0
    : convertCadenceToMonthly(form.contribution, form.cadence);

  const results: Record<ScenarioKey, number | null> = useMemo(() => {
    const out = {} as Record<ScenarioKey, number | null>;
    for (const key of SCENARIO_KEYS) {
      out[key] = computeMonthsToTarget({
        target: form.target,
        initialAmount: form.initialAmount,
        monthlyContribution,
        annualRate: scenarioRates[key] / 100,
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, monthlyContribution, bankRate]);

  const formatTime = (months: number | null) => {
    if (months === null) return t('output.cannotReach');
    if (months < 12) return t('output.monthsLabel', { months });
    return t('output.yearsLabel', { years: (months / 12).toFixed(1) });
  };

  // Phase I.3 (2026-05-23): over-30-years stop-condition warning. Fires when
  // ANY scenario takes > 360 months. The 1200-month-cap → null case is shown
  // separately via t('output.cannotReach'); over30Years is the "long but
  // finite" advisory.
  const showOver30Warning = SCENARIO_KEYS.some(
    (k) => results[k] !== null && (results[k] as number) > 360,
  );

  const handleChange = (field: keyof FormState, value: number | Cadence) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className={styles.calculator}>
      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-target`} className={styles.label}>
            {t('inputs.targetLabel')}
          </label>
          <input
            id={`${baseId}-target`}
            type="number"
            inputMode="decimal"
            min={0}
            step={1000}
            value={form.target}
            onChange={(e) => handleChange('target', clamp(Number(e.target.value), 0, 100_000_000))}
            className={styles.numberInput}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-initial`} className={styles.label}>
            {tShared('labels.initialDeposit')}
          </label>
          <input
            id={`${baseId}-initial`}
            type="number"
            inputMode="decimal"
            min={0}
            step={100}
            value={form.initialAmount}
            onChange={(e) => handleChange('initialAmount', clamp(Number(e.target.value), 0, 100_000_000))}
            className={styles.numberInput}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-contribution`} className={styles.label}>
            {t('inputs.contributionLabel')}
          </label>
          <input
            id={`${baseId}-contribution`}
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            value={form.contribution}
            onChange={(e) => handleChange('contribution', clamp(Number(e.target.value), 0, 1_000_000))}
            className={styles.numberInput}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-cadence`} className={styles.label}>
            {tShared('labels.cadence')}
          </label>
          <Select
            id={`${baseId}-cadence`}
            value={form.cadence}
            onChange={(e) => handleChange('cadence', e.target.value as Cadence)}
          >
            {CADENCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {tCadence(opt)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className={styles.targetLine}>
        {t('output.targetLine', {
          target: formatCurrency(form.target, localeKey, { maximumFractionDigits: 0 }),
        })}
      </p>

      <div className={styles.resultsGrid}>
        {SCENARIO_KEYS.map((key) => {
          const tooltip = key !== 'bank' ? tShared(`scenarios.${key}Tooltip`) : null;
          return (
            <div
              key={key}
              className={key === 'historical' ? styles.resultCardHighlight : styles.resultCard}
            >
              <p className={styles.resultLabel}>
                {tShared(`scenarios.${key}`)}
                {key !== 'bank' && depreciation > 0 ? tShared('scenarios.digitalDollarSuffix') : ''}
                {tooltip && (
                  <span
                    className={styles.tooltip}
                    title={tooltip}
                    aria-label={tooltip}
                    role="note"
                    tabIndex={0}
                  >
                    {' '}
                    <sup>?</sup>
                  </span>
                )}
              </p>
              <p
                className={
                  key === 'historical' ? styles.resultValue : styles.resultValueMuted
                }
              >
                {formatTime(results[key])}
              </p>
            </div>
          );
        })}
      </div>

      {showOver30Warning && (
        <p className={styles.warningCallout} role="status">
          {tShared('warnings.over30Years')}
        </p>
      )}
    </div>
  );
}

/**
 * Compute months to reach `target` given starting principal + recurring monthly
 * contribution + annual rate. Reuses the canonical `monthsToInflationAdjustedTarget`
 * helper (with annualInflation=0 for nominal time-to-target). Lump-sum-only
 * path uses `calculateLumpSum` since it has a closed-form alternative.
 */
function computeMonthsToTarget(args: {
  target: number;
  initialAmount: number;
  monthlyContribution: number;
  annualRate: number;
}): number | null {
  const { target, initialAmount, monthlyContribution, annualRate } = args;
  if (target <= initialAmount) return 0;
  if (monthlyContribution <= 0) {
    // Lump-sum-only path: solve year-by-year against `calculateLumpSum`.
    // The recurring helper requires monthlyPayment > 0 OR initialAmount > 0,
    // and would still need the loop, so doing it inline here is clearer.
    if (initialAmount <= 0 || annualRate <= 0) return null;
    for (let years = 1; years <= 100; years++) {
      const fv = calculateLumpSum(initialAmount, annualRate, 0, years).nominalFV;
      if (fv >= target) return years * 12;
    }
    return null;
  }
  try {
    return monthsToInflationAdjustedTarget(
      target,
      monthlyContribution,
      annualRate,
      0,
      'end',
      initialAmount,
    );
  } catch {
    return null;
  }
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default TimeToTargetCalculator;
