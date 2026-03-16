'use client';

import { useGoalCalculator } from '../GoalCalculatorProvider';
import type { GoalTab, GoalCalculatorConfig } from '../goalCalculatorTypes';
import styles from '../GoalCalculator.module.css';

interface GoalOption {
  readonly goal: GoalTab;
  readonly icon: string;
  readonly className: string;
}

const GOAL_OPTIONS: readonly GoalOption[] = [
  { goal: 'christmas', icon: '🎄', className: 'goalChristmas' },
  { goal: 'emergency', icon: '🛡️', className: 'goalEmergency' },
  { goal: 'vacation', icon: '✈️', className: 'goalVacation' },
] as const;

interface GoalSelectionScreenProps {
  readonly translated: GoalCalculatorConfig;
}

export function GoalSelectionScreen({ translated }: GoalSelectionScreenProps) {
  const { selectGoal } = useGoalCalculator();

  const descriptions: Record<GoalTab, string> = {
    christmas: 'Build your year-end bonus automatically',
    emergency: 'Create a safety net for the unexpected',
    vacation: 'Save for the trip you deserve',
  };

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenHeader}>
        <h2 className={styles.screenTitle}>{translated.content.header}</h2>
        <p className={styles.screenSubtitle}>Pick a goal. We&apos;ll show you a path.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
        {GOAL_OPTIONS.map(({ goal, icon, className }) => (
          <button
            key={goal}
            type="button"
            className={`${styles.goalCard} ${styles[className]}`}
            onClick={() => selectGoal(goal)}
          >
            <span className={styles.goalCardIcon} aria-hidden="true">{icon}</span>
            <div className={styles.goalCardContent}>
              <span className={styles.goalCardTitle}>{translated.content.tabs[goal]}</span>
              <span className={styles.goalCardDescription}>{descriptions[goal]}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
