'use client';

import type { GoalTab, EmergencyCoverage, EmergencyTimeline } from './goalCalculatorTypes';
import { EMERGENCY_COVERAGE_OPTIONS, EMERGENCY_TIMELINE_OPTIONS } from './goalCalculatorConstants';
import styles from './GoalCalculator.module.css';

interface GoalCalculatorInputsProps {
  readonly tab: GoalTab;
  readonly field1Raw: string;
  readonly currencySymbol: string;
  readonly vacationDate: Date;
  readonly emergencyCoverage: EmergencyCoverage;
  readonly emergencyTimeline: EmergencyTimeline;
  readonly translated: {
    readonly content: {
      readonly fields: {
        readonly christmas: { readonly label: string; readonly helper: string };
        readonly emergency: { readonly label: string; readonly helper: string };
        readonly vacation: { readonly label: string; readonly helper: string };
      };
      readonly coverage: {
        readonly label: string;
        readonly months3: string;
        readonly months4: string;
        readonly months6: string;
      };
      readonly timeline: {
        readonly label: string;
        readonly months6: string;
        readonly months9: string;
        readonly months12: string;
        readonly months18: string;
      };
      readonly vacationDate: { readonly label: string };
    };
  };
  readonly onField1Change: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onCoverageChange: (coverage: EmergencyCoverage) => void;
  readonly onTimelineChange: (timeline: EmergencyTimeline) => void;
  readonly onVacationDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

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

export function GoalCalculatorInputs({
  tab,
  field1Raw,
  currencySymbol,
  vacationDate,
  emergencyCoverage,
  emergencyTimeline,
  translated,
  onField1Change,
  onCoverageChange,
  onTimelineChange,
  onVacationDateChange,
}: GoalCalculatorInputsProps) {
  const fieldConfig = translated.content.fields[tab];

  return (
    <div className={styles.tabInputs}>
      {/* Field 1: Goal-specific input */}
      <div className={styles.inputField}>
        <label htmlFor="goal-field1" className={styles.inputLabel}>
          {fieldConfig.label}
        </label>
        <div className={styles.inputWrapper}>
          <span className={styles.currencySymbol} aria-hidden="true">{currencySymbol}</span>
          <input
            id="goal-field1"
            type="text"
            inputMode="numeric"
            className={styles.input}
            value={field1Raw}
            onChange={onField1Change}
            aria-label={fieldConfig.label}
          />
        </div>
        <span className={styles.inputHelper}>{fieldConfig.helper}</span>
      </div>

      {/* Emergency: Coverage selector */}
      {tab === 'emergency' ? (
        <div className={styles.inputField}>
          <span className={styles.inputLabel}>{translated.content.coverage.label}</span>
          <div className={styles.segmentedControl} role="group" aria-label={translated.content.coverage.label}>
            {EMERGENCY_COVERAGE_OPTIONS.map((val) => (
              <button
                key={val}
                type="button"
                className={`${styles.segmentButton} ${emergencyCoverage === val ? styles.segmentButtonActive : ''}`}
                onClick={() => onCoverageChange(val)}
                aria-pressed={emergencyCoverage === val}
              >
                {translated.content.coverage[COVERAGE_KEYS[val]]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Emergency: Timeline selector */}
      {tab === 'emergency' ? (
        <div className={styles.inputField}>
          <span className={styles.inputLabel}>{translated.content.timeline.label}</span>
          <div className={styles.segmentedControl} role="group" aria-label={translated.content.timeline.label}>
            {EMERGENCY_TIMELINE_OPTIONS.map((val) => (
              <button
                key={val}
                type="button"
                className={`${styles.segmentButton} ${emergencyTimeline === val ? styles.segmentButtonActive : ''}`}
                onClick={() => onTimelineChange(val)}
                aria-pressed={emergencyTimeline === val}
              >
                {translated.content.timeline[TIMELINE_KEYS[val]]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Vacation: Date picker */}
      {tab === 'vacation' ? (
        <div className={styles.inputField}>
          <label htmlFor="goal-vacation-date" className={styles.inputLabel}>
            {translated.content.vacationDate.label}
          </label>
          <input
            id="goal-vacation-date"
            type="month"
            className={styles.dateInput}
            value={formatDateInputValue(vacationDate)}
            min={getMinDateValue()}
            onChange={onVacationDateChange}
            aria-label={translated.content.vacationDate.label}
          />
        </div>
      ) : null}
    </div>
  );
}
