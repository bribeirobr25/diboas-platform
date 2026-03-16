'use client';

import { useGoalCalculator } from '../GoalCalculatorProvider';
import { SLIDER_CONFIG } from '../goalCalculatorConstants';
import type { GoalCalculatorConfig } from '../goalCalculatorTypes';
import { parseLocaleNumber } from '@/lib/currency';
import { getChristmasTarget, monthsUntil } from '../goalCalculatorFormulas';
import styles from '../GoalCalculator.module.css';

interface GoalAmountScreenProps {
  readonly translated: GoalCalculatorConfig;
  readonly formatCurrency: (value: number) => string;
}

export function GoalAmountScreen({ translated, formatCurrency }: GoalAmountScreenProps) {
  const { state, dispatch, goNext, goBack } = useGoalCalculator();
  const goal = state.activeGoal;
  if (!goal) return null;

  const fieldConfig = translated.content.fields[goal];
  const sliderConfig = SLIDER_CONFIG[goal];
  const numericValue = parseLocaleNumber(state.field1Raw) || sliderConfig.min;
  const clampedSlider = Math.max(sliderConfig.min, Math.min(sliderConfig.max, numericValue));

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_FIELD1', value: e.target.value });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseInt(raw) || 0;
    const clamped = Math.max(sliderConfig.min, Math.min(sliderConfig.max, parsed));
    dispatch({ type: 'SET_FIELD1', value: String(clamped) });
  };

  // Christmas: compute and display target + timeline info
  let christmasInfo: { target: string; months: number; year: number; rolledOver: boolean } | null = null;
  if (goal === 'christmas' && numericValue > 0) {
    const christmas = getChristmasTarget();
    let targetDate = christmas.date;
    let rolledOver = christmas.rolledOver;
    let months = monthsUntil(christmas.date);
    if (months === 0) {
      targetDate = new Date(targetDate.getFullYear() + 1, 11, 1);
      rolledOver = true;
      months = monthsUntil(targetDate);
    }
    christmasInfo = {
      target: formatCurrency(Math.round(numericValue / 12)),
      months,
      year: targetDate.getFullYear(),
      rolledOver,
    };
  }

  const canProceed = numericValue >= sliderConfig.min;

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenHeader}>
        <h2 className={styles.screenTitle}>{fieldConfig.label}</h2>
        <p className={styles.screenSubtitle}>{fieldConfig.helper}</p>
      </div>

      <div className={styles.sliderCard}>
        <div className={styles.sliderHeader}>
          <span className={styles.sliderLabel}>{fieldConfig.label}</span>
          <input
            type="number"
            className={styles.sliderValueInput}
            value={state.field1Raw || ''}
            onChange={handleInputChange}
            min={sliderConfig.min}
            max={sliderConfig.max}
            aria-label={`${fieldConfig.label} amount`}
          />
        </div>
        <input
          type="range"
          className={styles.rangeSlider}
          min={sliderConfig.min}
          max={sliderConfig.max}
          step={sliderConfig.step}
          value={clampedSlider}
          onChange={handleSliderChange}
          aria-label={`${fieldConfig.label} slider`}
        />
        <div className={styles.sliderRange}>
          <span>{formatCurrency(sliderConfig.min)}</span>
          <span>{formatCurrency(sliderConfig.max)}</span>
        </div>
      </div>

      {/* Christmas: combined timeline info */}
      {christmasInfo ? (
        <div className={styles.infoNotice}>
          Your target: {christmasInfo.target}. {christmasInfo.months} months until December {christmasInfo.year}.
          {christmasInfo.rolledOver ? (
            <> {translated.content.helpers.christmasRollover.replace('{year}', String(christmasInfo.year))}</>
          ) : null}
        </div>
      ) : null}

      <div className={styles.wizardNavigation}>
        <button type="button" className={styles.backButton} onClick={goBack}>
          Back
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={goNext}
          disabled={!canProceed}
        >
          Next
        </button>
      </div>
    </div>
  );
}
