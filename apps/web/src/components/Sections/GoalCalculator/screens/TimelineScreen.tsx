'use client';

import { useGoalCalculator } from '../GoalCalculatorProvider';
import {
  EMERGENCY_COVERAGE_OPTIONS,
  EMERGENCY_TIMELINE_OPTIONS,
} from '../goalCalculatorConstants';
import { monthsUntil } from '../goalCalculatorFormulas';
import type { EmergencyCoverage, EmergencyTimeline, GoalCalculatorConfig } from '../goalCalculatorTypes';
import styles from '../GoalCalculator.module.css';

const COVERAGE_KEYS: Record<EmergencyCoverage, 'months3' | 'months4' | 'months6'> = {
  3: 'months3',
  4: 'months4',
  6: 'months6',
};

const TIMELINE_KEYS: Record<EmergencyTimeline, 'months6' | 'months9' | 'months12' | 'months18'> = {
  6: 'months6',
  9: 'months9',
  12: 'months12',
  18: 'months18',
};

function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getMinDateValue(): string {
  const now = new Date();
  now.setMonth(now.getMonth() + 3);
  return formatDateInputValue(now);
}

interface TimelineScreenProps {
  readonly translated: GoalCalculatorConfig;
}

export function TimelineScreen({ translated }: TimelineScreenProps) {
  const { state, dispatch, goNext, goBack } = useGoalCalculator();
  const goal = state.activeGoal;

  const handleVacationDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split('-').map(Number);
    if (year && month) {
      dispatch({ type: 'SET_VACATION_DATE', date: new Date(year, month - 1, 1) });
    }
  };

  const showVacationWarning =
    goal === 'vacation' && state.vacationDate !== null && monthsUntil(state.vacationDate) < 3;

  const canProceed =
    goal === 'emergency'
      ? true
      : goal === 'vacation' && state.vacationDate !== null && monthsUntil(state.vacationDate) >= 3;

  return (
    <div className={styles.screenContent}>
      {goal === 'emergency' ? (
        <>
          <div className={styles.screenHeader}>
            <h2 className={styles.screenTitle}>{translated.content.timeline.label}</h2>
          </div>

          {/* Coverage selector */}
          <div>
            <fieldset className={styles.fieldsetReset}>
              <legend className={styles.sliderLabel}>{translated.content.coverage.label}</legend>
              <div
                className={styles.segmentedControl}
                role="group"
                aria-label={translated.content.coverage.label}
              >
                {EMERGENCY_COVERAGE_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`${styles.segmentButton} ${
                      state.emergencyCoverage === val ? styles.segmentButtonActive : ''
                    }`}
                    onClick={() => dispatch({ type: 'SET_COVERAGE', coverage: val })}
                    aria-pressed={state.emergencyCoverage === val}
                  >
                    {translated.content.coverage[COVERAGE_KEYS[val]]}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Timeline selector */}
          <div>
            <fieldset className={styles.fieldsetReset}>
              <legend className={styles.sliderLabel}>{translated.content.timeline.label}</legend>
              <div
                className={styles.segmentedControl}
                role="group"
                aria-label={translated.content.timeline.label}
              >
                {EMERGENCY_TIMELINE_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    className={`${styles.segmentButton} ${
                      state.emergencyTimeline === val ? styles.segmentButtonActive : ''
                    }`}
                    onClick={() => dispatch({ type: 'SET_TIMELINE', timeline: val })}
                    aria-pressed={state.emergencyTimeline === val}
                  >
                    {translated.content.timeline[TIMELINE_KEYS[val]]}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        </>
      ) : null}

      {goal === 'vacation' ? (
        <>
          <div className={styles.screenHeader}>
            <h2 className={styles.screenTitle}>{translated.content.vacationDate.label}</h2>
          </div>

          <div>
            <label htmlFor="goal-vacation-date" className={styles.sliderLabel}>
              {translated.content.vacationDate.label}
            </label>
            <input
              id="goal-vacation-date"
              type="month"
              className={styles.dateInput}
              value={state.vacationDate ? formatDateInputValue(state.vacationDate) : ''}
              min={getMinDateValue()}
              onChange={handleVacationDateChange}
              aria-label={translated.content.vacationDate.label}
            />
          </div>

          {showVacationWarning ? (
            <p className={styles.warningNotice}>
              {translated.content.helpers.vacationDateMinimum}
            </p>
          ) : null}
        </>
      ) : null}

      <div className={styles.wizardNavigation}>
        <button type="button" className={styles.backButton} onClick={goBack}>
          {translated.content.back ?? 'Back'}
        </button>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={goNext}
          disabled={!canProceed}
        >
          {translated.content.next ?? 'Next'}
        </button>
      </div>
    </div>
  );
}
