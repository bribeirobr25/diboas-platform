'use client';

/**
 * QuickActions Component
 *
 * 2x2 grid with enabled/disabled/highlighted states
 * Sequential unlock: deposit -> send -> buy/goals (buy + goals unlock together after deposit)
 * Badge logic: "Start" for first uncompleted, "Next" for next
 */

import { useMemo } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { usePreDemo } from '../PreDemoProvider';
import type { PreDemoScreen } from '@/lib/pre-demo';
import styles from '../PreDemo.module.css';

interface QuickAction {
  id: string;
  labelKey: string;
  subtitleKey: string;
  screen: PreDemoScreen;
  step: 'deposit' | 'send' | 'buy' | 'goals';
}

const ACTIONS: QuickAction[] = [
  {
    id: 'deposit',
    labelKey: 'preDemo.home.addMoney',
    subtitleKey: 'preDemo.home.addMoneySubtitle',
    screen: 'deposit',
    step: 'deposit',
  },
  {
    id: 'send',
    labelKey: 'preDemo.home.send',
    subtitleKey: 'preDemo.home.sendSubtitle',
    screen: 'send',
    step: 'send',
  },
  {
    id: 'buy',
    labelKey: 'preDemo.home.invest',
    subtitleKey: 'preDemo.home.investSubtitle',
    screen: 'buy',
    step: 'buy',
  },
  {
    id: 'goals',
    labelKey: 'preDemo.home.goals',
    subtitleKey: 'preDemo.home.goalsSubtitle',
    screen: 'dream-mode',
    step: 'goals',
  },
];

const STEP_ORDER: Array<'deposit' | 'send' | 'buy' | 'goals'> = ['deposit', 'send', 'buy', 'goals'];

/** SVG icons for each action */
function ActionIcon({ id }: { id: string }) {
  switch (id) {
    case 'deposit':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case 'send':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case 'buy':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );
    case 'goals':
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    default:
      return null;
  }
}

export function QuickActions() {
  const intl = useTranslation();
  const { state, setScreen } = usePreDemo();

  const t = (key: string) => intl.formatMessage({ id: key });

  // Find the first uncompleted step
  const firstUncompletedIndex = useMemo(() => {
    return STEP_ORDER.findIndex((step) => !state.completedSteps[step]);
  }, [state.completedSteps]);

  // Determine which actions are enabled
  // After deposit: send, buy, AND goals all unlock
  const isActionEnabled = (step: (typeof STEP_ORDER)[number]) => {
    const isCompleted = state.completedSteps[step];
    if (isCompleted) return true;
    const stepIndex = STEP_ORDER.indexOf(step);
    // Deposit is always enabled as step 0
    if (stepIndex === 0) return true;
    // After deposit is completed, send/buy/goals are all enabled
    if (state.completedSteps.deposit) return true;
    return false;
  };

  return (
    <>
      <h3 className={styles.quickActionsHeading}>{t('preDemo.home.quickActions')}</h3>
      <div className={styles.quickActionsGrid}>
        {ACTIONS.map((action) => {
          const isCompleted = state.completedSteps[action.step];
          const enabled = isActionEnabled(action.step);
          const stepIndex = STEP_ORDER.indexOf(action.step);
          const isHighlighted = stepIndex === firstUncompletedIndex;

          // Badge text
          let badge: string | null = null;
          if (isHighlighted && !isCompleted) {
            badge =
              firstUncompletedIndex === 0
                ? t('preDemo.home.badgeStart')
                : t('preDemo.home.badgeNext');
          }

          return (
            <button
              key={action.id}
              onClick={() => enabled && setScreen(action.screen)}
              disabled={!enabled}
              className={`${styles.quickActionButton} ${
                isHighlighted ? styles.quickActionHighlighted : ''
              } ${isCompleted ? styles.quickActionCompleted : ''} ${
                !enabled ? styles.quickActionDisabled : ''
              }`}
              {...(action.id === 'deposit' ? { 'data-autofocus': true } : {})}
            >
              {/* Badge */}
              {badge && <span className={styles.quickActionBadge}>{badge}</span>}

              {/* Icon */}
              <span className={styles.quickActionIcon}>
                <ActionIcon id={action.id} />
              </span>

              {/* Label */}
              <span className={styles.quickActionLabel}>{t(action.labelKey)}</span>

              {/* Subtitle */}
              <span className={styles.quickActionSubtitle}>{t(action.subtitleKey)}</span>

              {/* Completed indicator */}
              {isCompleted && (
                <span className={styles.quickActionCheck}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
