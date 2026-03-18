'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type {
  GoalCalculatorContextValue,
  GoalTab,
  ScenarioResult,
} from './goalCalculatorTypes';
import { goalCalculatorReducer, initialGoalCalculatorState } from './goalCalculatorReducer';
import { GOAL_CALCULATOR_EVENTS } from './goalCalculatorConstants';

const GoalCalculatorContext = createContext<GoalCalculatorContextValue | null>(null);

interface GoalCalculatorProviderProps {
  readonly children: React.ReactNode;
  readonly enableAnalytics: boolean;
  readonly locale: string;
}

export function GoalCalculatorProvider({
  children,
  enableAnalytics,
  locale,
}: GoalCalculatorProviderProps) {
  const [state, dispatch] = useReducer(
    goalCalculatorReducer,
    initialGoalCalculatorState,
    (init) => ({
      ...init,
      vacationDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000),
    }),
  );

  const trackEvent = useCallback(
    (event: string, payload: Record<string, unknown>) => {
      if (!enableAnalytics) return;
      const enriched = { ...payload, locale, timestamp: Date.now() };
      import('posthog-js')
        .then(({ default: posthog }) => {
          if (posthog.__loaded) {
            posthog.capture(event, enriched);
          }
        })
        .catch(() => {});
    },
    [enableAnalytics, locale],
  );

  const addBreadcrumb = useCallback(
    (message: string) => {
      import('@/lib/errors/ErrorReportingService')
        .then(({ errorReportingService }) => {
          errorReportingService.addBreadcrumb({
            timestamp: Date.now(),
            category: 'custom',
            message,
            level: 'info',
          });
        })
        .catch(() => {});
    },
    [],
  );

  const selectGoal = useCallback(
    (goal: GoalTab) => {
      dispatch({ type: 'SELECT_GOAL', goal });
      trackEvent(GOAL_CALCULATOR_EVENTS.GOAL_SELECTED, { goal });
      addBreadcrumb(`Screen: goalAmount (goal: ${goal})`);
    },
    [trackEvent, addBreadcrumb],
  );

  const goNext = useCallback(() => {
    dispatch({ type: 'GO_NEXT' });
    addBreadcrumb(`GO_NEXT from ${state.screen}`);
  }, [state.screen, addBreadcrumb]);

  const goBack = useCallback(() => {
    trackEvent(GOAL_CALCULATOR_EVENTS.BACK_NAVIGATED, {
      fromScreen: state.screen,
      goal: state.activeGoal,
    });
    dispatch({ type: 'GO_BACK' });
    addBreadcrumb(`GO_BACK from ${state.screen}`);
  }, [state.screen, state.activeGoal, trackEvent, addBreadcrumb]);

  const startSimulation = useCallback(
    (result: ScenarioResult) => {
      if (state.isAnimating || !state.activeGoal) return;
      try {
        dispatch({ type: 'START_SIMULATION', result });
        trackEvent(GOAL_CALCULATOR_EVENTS.SIMULATION_STARTED, {
          goal: state.activeGoal,
          tier: state.riskTierIndex,
          initialDeposit: state.initialDepositRaw,
          monthlyDeposit: state.monthlyDepositRaw,
        });
        addBreadcrumb('Screen: simulation');
      } catch (error) {
        import('@/lib/errors/ErrorReportingService')
          .then(({ errorReportingService }) => {
            errorReportingService.reportError(
              error instanceof Error ? error : new Error('Simulation start failed'),
              {
                context: {
                  timestamp: Date.now(),
                  customData: { source: 'GoalCalculator.startSimulation', goal: state.activeGoal },
                },
              },
            );
          })
          .catch(() => {});
        dispatch({ type: 'RESET' });
      }
    },
    [
      state.isAnimating,
      state.activeGoal,
      state.riskTierIndex,
      state.initialDepositRaw,
      state.monthlyDepositRaw,
      trackEvent,
      addBreadcrumb,
    ],
  );

  const finishSimulation = useCallback(() => {
    dispatch({ type: 'FINISH_SIMULATION' });
    trackEvent(GOAL_CALCULATOR_EVENTS.COMPLETED, {
      goal: state.activeGoal,
      tier: state.riskTierIndex,
    });
    addBreadcrumb('Screen: results');
  }, [state.activeGoal, state.riskTierIndex, trackEvent, addBreadcrumb]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    addBreadcrumb('Screen: goalSelection (reset)');
  }, [addBreadcrumb]);

  const value = useMemo<GoalCalculatorContextValue>(
    () => ({
      state,
      dispatch,
      selectGoal,
      goNext,
      goBack,
      startSimulation,
      finishSimulation,
      reset,
      trackEvent,
    }),
    [state, selectGoal, goNext, goBack, startSimulation, finishSimulation, reset, trackEvent],
  );

  return (
    <GoalCalculatorContext.Provider value={value}>
      {children}
    </GoalCalculatorContext.Provider>
  );
}

export function useGoalCalculator(): GoalCalculatorContextValue {
  const context = useContext(GoalCalculatorContext);
  if (!context) {
    throw new Error('useGoalCalculator must be used within a GoalCalculatorProvider');
  }
  return context;
}
