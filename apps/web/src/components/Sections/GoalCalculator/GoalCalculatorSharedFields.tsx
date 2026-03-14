import { memo } from 'react';
import type { RiskTierIndex } from './goalCalculatorTypes';
import styles from './GoalCalculator.module.css';

const TIER_KEYS = ['careful', 'moderate', 'aggressive'] as const;

interface GoalCalculatorSharedFieldsProps {
  readonly initialDepositRaw: string;
  readonly displayedMonthly: string;
  readonly effectiveTierIndex: RiskTierIndex;
  readonly isOneMonth: boolean;
  readonly currencySymbol: string;
  readonly showBigCommitment: boolean;
  readonly translated: {
    content: {
      fields: {
        initialDeposit: { label: string; helper: string };
        monthlyDeposit: { label: string; helper: string };
        riskTier: { label: string };
      };
      tiers: Record<string, string>;
      helpers: { bigCommitment: string; oneMonthWarning: string };
    };
  };
  readonly onInitialDepositChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onMonthlyDepositChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly onTierChange: (index: RiskTierIndex) => void;
}

export const GoalCalculatorSharedFields = memo(function GoalCalculatorSharedFields({
  initialDepositRaw,
  displayedMonthly,
  effectiveTierIndex,
  isOneMonth,
  currencySymbol,
  showBigCommitment,
  translated,
  onInitialDepositChange,
  onMonthlyDepositChange,
  onTierChange,
}: GoalCalculatorSharedFieldsProps) {
  return (
    <>
      {/* Field 2: Initial deposit */}
      <div className={styles.inputField}>
        <label htmlFor="goal-initial-deposit" className={styles.inputLabel}>
          {translated.content.fields.initialDeposit.label}
        </label>
        <div className={styles.inputWrapper}>
          <span className={styles.currencySymbol} aria-hidden="true">{currencySymbol}</span>
          <input
            id="goal-initial-deposit"
            type="text"
            inputMode="numeric"
            className={styles.input}
            value={initialDepositRaw}
            onChange={onInitialDepositChange}
            placeholder="0"
            aria-label={translated.content.fields.initialDeposit.label}
          />
        </div>
        <span className={styles.inputHelper}>{translated.content.fields.initialDeposit.helper}</span>
      </div>

      {/* Field 3: Monthly deposit (auto-calculated, overridable) */}
      <div className={styles.inputField}>
        <label htmlFor="goal-monthly-deposit" className={styles.inputLabel}>
          {translated.content.fields.monthlyDeposit.label}
        </label>
        <div className={styles.inputWrapper}>
          <span className={styles.currencySymbol} aria-hidden="true">{currencySymbol}</span>
          <input
            id="goal-monthly-deposit"
            type="text"
            inputMode="numeric"
            className={styles.input}
            value={displayedMonthly}
            onChange={onMonthlyDepositChange}
            placeholder="0"
            aria-label={translated.content.fields.monthlyDeposit.label}
          />
        </div>
        <span className={styles.inputHelper}>{translated.content.fields.monthlyDeposit.helper}</span>
      </div>

      {/* Big commitment warning */}
      {showBigCommitment ? (
        <p className={styles.warningNotice}>{translated.content.helpers.bigCommitment}</p>
      ) : null}

      {/* Field 4: Risk tier (segmented control) */}
      <div className={styles.inputField}>
        <span className={styles.inputLabel}>{translated.content.fields.riskTier.label}</span>
        <div className={styles.segmentedControl} role="group" aria-label={translated.content.fields.riskTier.label}>
          {TIER_KEYS.map((key, index) => (
            <button
              key={key}
              type="button"
              className={`${styles.segmentButton} ${effectiveTierIndex === index ? styles.segmentButtonActive : ''} ${isOneMonth && index !== 0 ? styles.segmentButtonDisabled : ''}`}
              onClick={() => onTierChange(index as RiskTierIndex)}
              aria-pressed={effectiveTierIndex === index}
              disabled={isOneMonth && index !== 0}
            >
              {translated.content.tiers[key]}
            </button>
          ))}
        </div>
      </div>

      {/* One month warning */}
      {isOneMonth ? (
        <p className={styles.infoNotice}>{translated.content.helpers.oneMonthWarning}</p>
      ) : null}
    </>
  );
});
