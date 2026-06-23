'use client';

/**
 * Emergency Fund Calculator (Tier-1 tool, 6C.3).
 *
 * Phase 2 §2.1 refactor (2026-05-25): all composition logic extracted to
 * `lib/emergency-fund/calculator.ts`. This component is now a thin renderer
 * that:
 *   1. Manages form state.
 *   2. Reads `marketDataService.getSync()` once per render.
 *   3. Delegates math to `calculateEmergencyFundTimeline(input, snapshot)`.
 *   4. Formats the result for display.
 * The split mirrors the compound-interest family pattern. Closes C11.
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { useCalculatorAnalytics } from '@/hooks/useCalculatorAnalytics';
import type { SupportedLocale } from '@/lib/market-data';
import { marketDataService } from '@/lib/market-data/service';
import { formatCurrency } from '@/lib/compound-interest';
import { calculateEmergencyFundTimeline } from '@/lib/emergency-fund';
import {
  EMERGENCY_FUND_DEFAULTS,
  EMERGENCY_FUND_TARGET_MULTIPLIER_BOUNDS,
  clampInput,
} from '@/lib/tools';
import { UsdEquivalentBadge } from '@/components/UI';
import styles from './EmergencyFundCalculator.module.css';

interface FormState {
  monthlyExpenses: number;
  monthlySavings: number;
  targetMultiplier: number;
}

export function EmergencyFundCalculator() {
  const intl = useTranslation();
  const { locale } = useLocale();
  const baseId = useId();

  const t = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-emergency-fund.${key}` }, values);
  const tShared = (key: string, values?: Record<string, string | number>) =>
    intl.formatMessage({ id: `tools-shared.${key}` }, values);

  const localeKey = (locale ?? 'en') as SupportedLocale;
  const initial = useMemo<FormState>(
    () => ({
      monthlyExpenses: EMERGENCY_FUND_DEFAULTS.monthlyExpenses[localeKey],
      monthlySavings: EMERGENCY_FUND_DEFAULTS.monthlySavings[localeKey],
      targetMultiplier: EMERGENCY_FUND_DEFAULTS.targetMultiplier,
    }),
    [localeKey]
  );

  const [form, setForm] = useState<FormState>(initial);
  const snapshot = marketDataService.getSync();

  const result = useMemo(
    () =>
      calculateEmergencyFundTimeline(
        {
          monthlyExpenses: form.monthlyExpenses,
          monthlySavings: form.monthlySavings,
          targetMultiplier: form.targetMultiplier,
          locale: localeKey,
        },
        snapshot
      ),
    [form, localeKey, snapshot]
  );

  // A16/O-1: open + compute analytics, uniform with the CalculatorDefault tools.
  useCalculatorAnalytics('emergency-fund', localeKey, result ? JSON.stringify(form) : null);

  const target = form.monthlyExpenses * form.targetMultiplier;
  const bankApy = result?.bankApy ?? 0;
  const hedged = result?.hedged ?? false;

  const formatMonths = (m: number | null): string => {
    if (m === null) return t('output.unreachable');
    if (m < 12) return t('output.monthsLabel', { months: m });
    const years = (m / 12).toFixed(1);
    return t('output.yearsLabel', { years });
  };

  const showOver30Warning = result?.over30Years ?? false;

  const handleChange = (field: keyof FormState, value: number) =>
    setForm((prev) => {
      if (field === 'targetMultiplier') {
        // C14 close: real clamp matches UI <input min/max>, not the generic
        // 0-1M ceiling that silently accepted out-of-range typos.
        return {
          ...prev,
          targetMultiplier: clampInput(value, EMERGENCY_FUND_TARGET_MULTIPLIER_BOUNDS),
        };
      }
      return { ...prev, [field]: clamp(value, 0, 1_000_000) };
    });

  return (
    <div className={styles.calculator}>
      <div className={styles.inputsRow}>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-expenses`} className={styles.label}>
            {t('inputs.monthlyExpensesLabel')}
          </label>
          <input
            id={`${baseId}-expenses`}
            type="number"
            inputMode="decimal"
            min={0}
            step={50}
            value={form.monthlyExpenses}
            onChange={(e) => handleChange('monthlyExpenses', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.monthlyExpensesHelp')}</span>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-savings`} className={styles.label}>
            {t('inputs.monthlySavingsLabel')}
          </label>
          <input
            id={`${baseId}-savings`}
            type="number"
            inputMode="decimal"
            min={0}
            step={25}
            value={form.monthlySavings}
            onChange={(e) => handleChange('monthlySavings', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>
            {t('inputs.monthlySavingsHelp')}
            <UsdEquivalentBadge
              amount={form.monthlySavings}
              locale={localeKey}
              className={styles.usdEquivalent}
            />
          </span>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${baseId}-multiplier`} className={styles.label}>
            {t('inputs.targetMultiplierLabel')}
          </label>
          <input
            id={`${baseId}-multiplier`}
            type="number"
            inputMode="numeric"
            min={EMERGENCY_FUND_TARGET_MULTIPLIER_BOUNDS.min}
            max={EMERGENCY_FUND_TARGET_MULTIPLIER_BOUNDS.max}
            step={1}
            value={form.targetMultiplier}
            onChange={(e) => handleChange('targetMultiplier', Number(e.target.value))}
            className={styles.numberInput}
          />
          <span className={styles.help}>{t('inputs.targetMultiplierHelp')}</span>
        </div>
      </div>

      <p className={styles.targetLine}>
        {t('output.targetLabel', {
          amount: formatCurrency(target, localeKey, { maximumFractionDigits: 0 }),
        })}
      </p>

      {result ? (
        <div className={styles.resultsGrid}>
          <div className={styles.resultCardDiboas}>
            <p className={styles.resultLabel}>{t('output.withDiboas')}</p>
            <p className={styles.resultValue}>{formatMonths(result.diboasMonths)}</p>
            <p className={styles.resultRate}>
              {tShared('scenarios.historical')}
              {hedged ? tShared('scenarios.digitalDollarSuffix') : ''}
              <span
                className={styles.tooltip}
                title={tShared('scenarios.historicalTooltip')}
                aria-label={tShared('scenarios.historicalTooltip')}
                role="note"
                tabIndex={0}
              >
                {' '}
                <sup>?</sup>
              </span>
            </p>
          </div>
          <div className={styles.resultCardBank}>
            <p className={styles.resultLabel}>{t('output.withBank')}</p>
            <p className={styles.resultValueMuted}>{formatMonths(result.bankMonths)}</p>
            <p className={styles.resultRate}>
              {/* Reg DD (TILA) terminology — the bank deposit rate is shown as
                  APY in en; non-US locales keep the "(rate%)" form (no APY
                  obligation, English acronym). Crosswalk §5.3. */}
              {tShared('scenarios.bankApyDisplay', {
                label: tShared('scenarios.bank'),
                rate: (bankApy * 100).toFixed(2),
              })}
            </p>
          </div>
          {result.savedMonths > 0 && (
            <div className={styles.savedHighlight}>
              <span className={styles.savedLabel}>{t('output.saved')}</span>
              <span className={styles.savedValue}>{formatMonths(result.savedMonths)}</span>
            </div>
          )}
        </div>
      ) : (
        <p className={styles.noResult}>{t('output.noResult')}</p>
      )}

      {showOver30Warning && (
        <p className={styles.warningCallout} role="status">
          {tShared('warnings.over30Years')}
        </p>
      )}
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default EmergencyFundCalculator;
