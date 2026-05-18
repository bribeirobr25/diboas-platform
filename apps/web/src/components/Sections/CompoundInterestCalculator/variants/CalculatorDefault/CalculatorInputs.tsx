'use client';

import { useId } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { Select } from '@diboas/ui';
import {
  INPUT_BOUNDS,
  formatCurrency,
  isOneTime,
  type Cadence,
  type CalculatorInput,
} from '@/lib/compound-interest';
import styles from './CalculatorDefault.module.css';

interface CalculatorInputsProps {
  value: CalculatorInput;
  onChange: (next: CalculatorInput) => void;
}

const CADENCE_OPTIONS: readonly Cadence[] = [
  'oneTime',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semiAnnual',
  'yearly',
];

const RANGE_MAX_RECURRING = 250;
const RANGE_MAX_ONETIME = 5000;

export function CalculatorInputs({ value, onChange }: CalculatorInputsProps) {
  const intl = useTranslation();
  const baseId = useId();

  const oneTime = isOneTime(value.cadence);

  const labelAmount = intl.formatMessage({
    id: oneTime
      ? 'learn-compound-interest.calculator.oneTimeAmountLabel'
      : 'learn-compound-interest.calculator.amountLabel',
  });
  const ariaAmount = intl.formatMessage({
    id: 'learn-compound-interest.calculator.amountAriaLabel',
  });
  const labelCadence = intl.formatMessage({
    id: 'learn-compound-interest.calculator.cadenceLabel',
  });
  const labelYears = intl.formatMessage({
    id: 'learn-compound-interest.calculator.yearsLabel',
  });
  const yearsTooltip = intl.formatMessage({
    id: 'learn-compound-interest.calculator.yearsTooltip',
  });

  const rangeMax = oneTime ? RANGE_MAX_ONETIME : RANGE_MAX_RECURRING;

  const setAmount = (n: number) =>
    onChange({ ...value, amount: clamp(n, INPUT_BOUNDS.amount.min, INPUT_BOUNDS.amount.max) });
  const setCadence = (c: Cadence) => onChange({ ...value, cadence: c });
  const setYears = (n: number) =>
    onChange({ ...value, years: clamp(Math.round(n), INPUT_BOUNDS.years.min, INPUT_BOUNDS.years.max) });

  return (
    <div className={styles.inputs}>
      {/* Amount: numeric input + slider, both bound to value.amount.
          Label switches to "Initial deposit" when cadence is oneTime. */}
      <div className={styles.field}>
        <label htmlFor={`${baseId}-amount`} className={styles.label}>
          {labelAmount}
        </label>
        <div className={styles.amountRow}>
          <input
            id={`${baseId}-amount`}
            type="number"
            inputMode="decimal"
            min={INPUT_BOUNDS.amount.min}
            max={INPUT_BOUNDS.amount.max}
            step={1}
            value={value.amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label={ariaAmount}
            className={styles.numberInput}
          />
          <input
            type="range"
            min={INPUT_BOUNDS.amount.min}
            max={rangeMax}
            step={1}
            value={Math.min(value.amount, rangeMax)}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label={ariaAmount}
            aria-valuetext={formatCurrency(value.amount, value.locale, { maximumFractionDigits: 0 })}
            className={styles.range}
          />
        </div>
      </div>

      {/* Cadence: styled Select primitive (Phase 1 PR-1B, 2026-05-18).
          7 options exceeds comfortable horizontal radio-group width on mobile. */}
      <div className={styles.field}>
        <label htmlFor={`${baseId}-cadence`} className={styles.label}>
          {labelCadence}
        </label>
        <Select
          id={`${baseId}-cadence`}
          name={`${baseId}-cadence`}
          value={value.cadence}
          onChange={(e) => setCadence(e.target.value as Cadence)}
        >
          {CADENCE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {intl.formatMessage({ id: `learn-compound-interest.calculator.cadenceOptions.${opt}` })}
            </option>
          ))}
        </Select>
      </div>

      {/* Years: slider + tooltip */}
      <div className={styles.field}>
        <label htmlFor={`${baseId}-years`} className={styles.label}>
          {labelYears}
          <span className={styles.tooltip} title={yearsTooltip}>
            ⓘ
          </span>
        </label>
        <div className={styles.yearsRow}>
          <input
            id={`${baseId}-years`}
            type="range"
            min={INPUT_BOUNDS.years.min}
            max={INPUT_BOUNDS.years.max}
            step={1}
            value={value.years}
            onChange={(e) => setYears(Number(e.target.value))}
            aria-valuetext={`${value.years}`}
            className={styles.range}
          />
          <span className={styles.yearsValue}>{value.years}</span>
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}
