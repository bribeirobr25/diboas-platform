'use client';

/**
 * Time-to-Target Calculator (Tier-2 tool, 6D.2).
 *
 * Phase 2 §2.2 refactor (2026-05-25): composition logic extracted to
 * `lib/time-to-target/calculator.ts`. This component is now a thin renderer.
 * Closes C16 (useMemo deps), C17 (inlined math), and C15 (cap alignment).
 */

import { useId, useMemo, useState } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Select } from '@diboas/ui';
import { useLocale } from '@/components/Providers';
import { marketDataService, type SupportedLocale } from '@/lib/market-data';
import { formatCurrency, isOneTime, type Cadence } from '@/lib/compound-interest';
import {
  calculateTimeToTargetTimeline,
  TIME_TO_TARGET_SCENARIO_KEYS,
  type TimeToTargetScenarioKey,
} from '@/lib/time-to-target';
import { TIME_TO_TARGET_DEFAULTS } from '@/lib/tools';
import { UsdEquivalentBadge } from '@/components/UI';
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

const SCENARIO_KEYS = TIME_TO_TARGET_SCENARIO_KEYS;
type ScenarioKey = TimeToTargetScenarioKey;

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
    [localeKey]
  );
  const [form, setForm] = useState<FormState>(initial);

  const snapshot = marketDataService.getSync();
  const timeline = useMemo(
    () =>
      calculateTimeToTargetTimeline(
        {
          target: form.target,
          initialAmount: form.initialAmount,
          contribution: form.contribution,
          cadence: form.cadence,
          locale: localeKey,
        },
        snapshot
      ),
    [form, localeKey, snapshot]
  );

  const results: Record<ScenarioKey, number | null> = timeline.months;
  const depreciation = timeline.hedged ? 1 : 0; // for the digitalDollarSuffix check below

  // C18 close (TOOLS_41_DEFECTS_FIX_PLAN.md §5.1, 2026-05-26): cadence
  // `oneTime` with `initialAmount = 0` makes every scenario unreachable.
  // The result is technically correct (zero money never reaches a positive
  // target) but the all-`null` cards offer no guidance — show an inline
  // helper telling the user to enter a starting amount.
  const showOneTimeGuidance = isOneTime(form.cadence) && form.initialAmount <= 0;

  const formatTime = (months: number | null) => {
    if (months === null) return t('output.cannotReach');
    if (months < 12) return t('output.monthsLabel', { months });
    return t('output.yearsLabel', { years: (months / 12).toFixed(1) });
  };

  const showOver30Warning = timeline.over30Years;

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
            onChange={(e) =>
              handleChange('initialAmount', clamp(Number(e.target.value), 0, 100_000_000))
            }
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
            onChange={(e) =>
              handleChange('contribution', clamp(Number(e.target.value), 0, 1_000_000))
            }
            className={styles.numberInput}
          />
          <UsdEquivalentBadge
            amount={form.contribution}
            locale={localeKey}
            className={styles.usdEquivalent}
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

      {showOneTimeGuidance && (
        <p className={styles.guidanceCallout} role="status" aria-live="polite">
          {t('guidance.oneTimeNeedsInitial')}
        </p>
      )}

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
              <p className={key === 'historical' ? styles.resultValue : styles.resultValueMuted}>
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

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export default TimeToTargetCalculator;
