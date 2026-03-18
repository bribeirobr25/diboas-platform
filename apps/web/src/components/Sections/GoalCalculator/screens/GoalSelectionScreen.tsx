'use client';

import { Gift, ShieldCheck, Plane } from '@/components/UI/LucideIcon';
import { useGoalCalculator } from '../GoalCalculatorProvider';
import type { GoalTab, GoalCalculatorConfig } from '../goalCalculatorTypes';
import styles from '../GoalCalculator.module.css';

interface GoalOption {
  readonly goal: GoalTab;
  readonly icon: React.ReactNode;
  readonly className: string;
}

const GOAL_OPTIONS: readonly GoalOption[] = [
  { goal: 'christmas', icon: <Gift size={28} />, className: 'goalChristmas' },
  { goal: 'emergency', icon: <ShieldCheck size={28} />, className: 'goalEmergency' },
  { goal: 'vacation', icon: <Plane size={28} />, className: 'goalVacation' },
] as const;

interface GoalSelectionScreenProps {
  readonly translated: GoalCalculatorConfig;
}

export function GoalSelectionScreen({ translated }: GoalSelectionScreenProps) {
  const { selectGoal } = useGoalCalculator();

  return (
    <div className={styles.screenContent}>
      <div className={styles.screenHeader}>
        <h2 className={styles.screenTitle}>{translated.content.header}</h2>
        <p className={styles.screenSubtitle}>{translated.content.subtitle}</p>
      </div>

      <div className={styles.flexColumn}>
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
              <span className={styles.goalCardDescription}>{translated.content.goalDescriptions[goal]}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
