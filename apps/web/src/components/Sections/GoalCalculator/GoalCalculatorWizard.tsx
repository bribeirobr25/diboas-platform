'use client';

import { useEffect, useRef } from 'react';
import { useGoalCalculator } from './GoalCalculatorProvider';
import {
  GoalSelectionScreen,
  GoalAmountScreen,
  TimelineScreen,
  DepositRiskScreen,
  SimulationScreen,
  ResultsScreen,
} from './screens';
import { getStepNumber, getTotalSteps } from './goalCalculatorReducer';
import { GOAL_CALCULATOR_EVENTS } from './goalCalculatorConstants';
import type { GoalCalculatorConfig } from './goalCalculatorTypes';
import styles from './GoalCalculator.module.css';

interface GoalCalculatorWizardProps {
  readonly translated: GoalCalculatorConfig;
  readonly formatCurrency: (value: number) => string;
  readonly locale: string;
  readonly enableAnalytics: boolean;
}

export function GoalCalculatorWizard({
  translated,
  formatCurrency,
  locale,
  enableAnalytics,
}: GoalCalculatorWizardProps) {
  const { state } = useGoalCalculator();
  const containerRef = useRef<HTMLDivElement>(null);

  // Track screen views
  useEffect(() => {
    if (!enableAnalytics) return;
    import('posthog-js')
      .then(({ default: posthog }) => {
        if (posthog.__loaded) {
          posthog.capture(GOAL_CALCULATOR_EVENTS.SCREEN_VIEW, {
            screen: state.screen,
            goal: state.activeGoal,
            locale,
            timestamp: Date.now(),
          });
        }
      })
      .catch(() => {});
  }, [state.screen, state.activeGoal, enableAnalytics, locale]);

  // Focus first focusable element on screen change
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0].focus();
  }, [state.screen]);

  const currentStep = getStepNumber(state.screen, state.activeGoal);
  const totalSteps = getTotalSteps(state.activeGoal);

  const renderScreen = () => {
    switch (state.screen) {
      case 'goalSelection':
        return <GoalSelectionScreen translated={translated} />;
      case 'goalAmount':
        return <GoalAmountScreen translated={translated} formatCurrency={formatCurrency} />;
      case 'timeline':
        return <TimelineScreen translated={translated} />;
      case 'depositRisk':
        return (
          <DepositRiskScreen
            translated={translated}
            formatCurrency={formatCurrency}
            locale={locale}
            enableAnalytics={enableAnalytics}
          />
        );
      case 'simulation':
        return <SimulationScreen formatCurrency={formatCurrency} />;
      case 'results':
        return (
          <ResultsScreen
            translated={translated}
            formatCurrency={formatCurrency}
            locale={locale}
            enableAnalytics={enableAnalytics}
          />
        );
      default:
        return <GoalSelectionScreen translated={translated} />;
    }
  };

  return (
    <div ref={containerRef} className={styles.wizardContainer}>
      <div className={styles.screenContainer}>
        <div aria-live="polite" aria-atomic="true">
          <span className={styles.srOnly}>
            {(translated.content.stepIndicator ?? 'Step {current} of {total}:')
              .replace('{current}', String(currentStep))
              .replace('{total}', String(totalSteps))}
          </span>
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}
