'use client';

/**
 * CurrencyInput - Reusable Currency Input with Slider
 *
 * DRY Principle: Consolidates the repeated pattern of number input
 * with linked range slider and currency symbol prefix.
 *
 * Used by: FutureYouCalculator, DreamMode InputScreen
 */

import React, { useCallback, useId } from 'react';
import styles from './CurrencyInput.module.css';

export interface CurrencyInputProps {
  /** Current value */
  value: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Input label text */
  label: string;
  /** Currency code (USD, EUR, BRL) */
  currency?: string;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value for number input */
  max?: number;
  /** Maximum value for slider (can differ from number input max) */
  sliderMax?: number;
  /** Step increment for number input */
  step?: number;
  /** Step increment for slider */
  sliderStep?: number;
  /** Additional CSS class */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Get currency symbol from currency code
 */
function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'EUR': return '€';
    case 'BRL': return 'R$';
    case 'GBP': return '£';
    case 'USD':
    default: return '$';
  }
}

/**
 * Currency input component with linked number input and range slider.
 * Provides consistent UX for monetary value entry across the application.
 */
export function CurrencyInput({
  value,
  onChange,
  label,
  currency = 'USD',
  min = 0,
  max = 100000,
  sliderMax,
  step = 1,
  sliderStep,
  className = '',
  disabled = false,
}: CurrencyInputProps) {
  const inputId = useId();
  const sliderId = useId();
  const currencySymbol = getCurrencySymbol(currency);

  // Use sliderMax if provided, otherwise use max
  const effectiveSliderMax = sliderMax ?? max;
  const effectiveSliderStep = sliderStep ?? step;

  const handleChange = useCallback((newValue: number) => {
    const clamped = Math.min(Math.max(newValue, min), max);
    onChange(clamped);
  }, [onChange, min, max]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(Number(e.target.value));
  }, [handleChange]);

  return (
    <div className={`${styles.inputGroup} ${className}`}>
      <label htmlFor={inputId} className={styles.inputLabel}>
        {label}
      </label>
      <div className={styles.inputWrapper}>
        <span className={styles.currencySymbol} aria-hidden="true">
          {currencySymbol}
        </span>
        <input
          id={inputId}
          type="number"
          value={value}
          onChange={handleInputChange}
          className={styles.input}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          aria-describedby={sliderId}
        />
      </div>
      <input
        id={sliderId}
        type="range"
        value={value}
        onChange={handleInputChange}
        className={styles.slider}
        min={min}
        max={effectiveSliderMax}
        step={effectiveSliderStep}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}
