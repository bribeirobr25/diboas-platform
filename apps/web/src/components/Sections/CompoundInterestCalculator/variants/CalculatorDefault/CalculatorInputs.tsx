'use client';

import { useId } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import {
  INPUT_BOUNDS,
  formatCurrency,
  type Cadence,
  type CalculatorInput,
} from '@/lib/compound-interest';
import styles from './CalculatorDefault.module.css';

interface CalculatorInputsProps {
  value: CalculatorInput;
  onChange: (next: CalculatorInput) => void;
}

const CADENCE_OPTIONS: readonly Cadence[] = ['daily', 'weekly', 'monthly'];

export function CalculatorInputs({ value, onChange }: CalculatorInputsProps) {
  const intl = useTranslation();
  const baseId = useId();

  const labelAmount = intl.formatMessage({
    id: 'learn-compound-interest.calculator.amountLabel',
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

  const setAmount = (n: number) =>
    onChange({ ...value, amount: clamp(n, INPUT_BOUNDS.amount.min, INPUT_BOUNDS.amount.max) });
  const setCadence = (c: Cadence) => onChange({ ...value, cadence: c });
  const setYears = (n: number) =>
    onChange({ ...value, years: clamp(Math.round(n), INPUT_BOUNDS.years.min, INPUT_BOUNDS.years.max) });

  return (
    <div className={styles.inputs}>
      {/* Amount: numeric input + slider, both bound to value.amount */}
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
            max={250}
            step={1}
            value={Math.min(value.amount, 250)}
            onChange={(e) => setAmount(Number(e.target.value))}
            aria-label={ariaAmount}
            aria-valuetext={formatCurrency(value.amount, value.locale, { maximumFractionDigits: 0 })}
            className={styles.range}
          />
        </div>
      </div>

      {/* Cadence: native fieldset/legend with radio buttons */}
      <fieldset className={styles.field}>
        <legend className={styles.label}>{labelCadence}</legend>
        <div className={styles.radioGroup} role="radiogroup">
          {CADENCE_OPTIONS.map((opt) => {
            const optLabel = intl.formatMessage({
              id: `learn-compound-interest.calculator.cadenceOptions.${opt}`,
            });
            const id = `${baseId}-cadence-${opt}`;
            const checked = value.cadence === opt;
            return (
              <label key={opt} htmlFor={id} className={styles.radioLabel} data-checked={checked}>
                <input
                  id={id}
                  type="radio"
                  name={`${baseId}-cadence`}
                  value={opt}
                  checked={checked}
                  onChange={() => setCadence(opt)}
                  className={styles.radioInput}
                />
                <span>{optLabel}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

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
