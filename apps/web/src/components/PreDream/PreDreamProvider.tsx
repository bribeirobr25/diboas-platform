'use client';

/**
 * PreDream Provider
 *
 * Context provider for PreDream state management within the Demo flow
 * Handles simulation calculations, animation orchestration, and analytics
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { PreDreamContextValue } from './types';
import type { GoalCardKey } from '@/config/goalCards';
import {
  calculatePreDreamResult,
  resolveBankRate,
  resolveStrategyApy,
  type StrategyApyOverrides,
  type PreDreamPath,
  type PreDreamTimeframe,
  type PreDreamScreen,
} from '@/lib/pre-dream';
import { preDreamReducer, initialPreDreamState } from './preDreamReducer';
import { analyticsService } from '@/lib/analytics';
import { useLocale } from '@/components/Providers';
import { useMarketData } from '@/hooks/useMarketData';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';

const PreDreamContext = createContext<PreDreamContextValue | null>(null);

interface PreDreamProviderProps {
  children: React.ReactNode;
  onClose?: () => void;
  bankApyOverride?: number;
  strategyApyOverrides?: StrategyApyOverrides;
}

export function PreDreamProvider({
  children,
  bankApyOverride,
  strategyApyOverrides,
}: PreDreamProviderProps) {
  const [state, dispatch] = useReducer(preDreamReducer, initialPreDreamState);
  const { locale } = useLocale();
  const { data: marketData } = useMarketData();

  const acceptDisclaimer = useCallback(() => {
    analyticsService.track({
      name: 'pre_dream_disclaimer_accepted',
      parameters: { timestamp: Date.now() },
    });
    dispatch({ type: 'ACCEPT_DISCLAIMER' });
  }, []);

  const goToGoalStrategy = useCallback(() => {
    dispatch({ type: 'GO_TO_GOAL_STRATEGY' });
  }, []);

  const selectGoal = useCallback((goal: GoalCardKey) => {
    analyticsService.track({
      name: 'pre_dream_goal_selected',
      parameters: { goal },
    });
    dispatch({ type: 'SELECT_GOAL', goal });
  }, []);

  const selectPath = useCallback((path: PreDreamPath) => {
    analyticsService.track({
      name: 'pre_dream_path_selected',
      parameters: { path },
    });
    dispatch({ type: 'SELECT_PATH', path });
  }, []);

  const setInitialAmount = useCallback((amount: number) => {
    dispatch({ type: 'SET_INITIAL_AMOUNT', amount });
  }, []);

  const setMonthlyContribution = useCallback((amount: number) => {
    dispatch({ type: 'SET_MONTHLY_CONTRIBUTION', amount });
  }, []);

  const goToTimeframe = useCallback(() => {
    dispatch({ type: 'GO_TO_TIMEFRAME' });
  }, []);

  const selectTimeframe = useCallback((timeframe: PreDreamTimeframe) => {
    dispatch({ type: 'SELECT_TIMEFRAME', timeframe });
  }, []);

  const startSimulation = useCallback(() => {
    if (state.isAnimating || !state.selectedPath) return;

    const bankRate = resolveBankRate(locale, marketData, bankApyOverride);
    const defiApy = resolveStrategyApy(state.selectedPath, marketData, strategyApyOverrides);

    const result = calculatePreDreamResult(
      state.selectedPath,
      state.selectedTimeframe,
      state.initialAmount,
      state.monthlyContribution,
      bankRate.apy,
      locale,
      marketData,
      defiApy
    );

    applicationEventBus.emit(ApplicationEventType.PRE_DREAM_STARTED, {
      domain: 'preDream',
      source: 'preDream',
      timestamp: Date.now(),
      metadata: {
        path: state.selectedPath,
        timeframe: state.selectedTimeframe,
        initialAmount: state.initialAmount,
        monthlyContribution: state.monthlyContribution,
      },
    });

    dispatch({ type: 'START_SIMULATION', result });
  }, [
    state.isAnimating,
    state.selectedPath,
    state.selectedTimeframe,
    state.initialAmount,
    state.monthlyContribution,
    locale,
    marketData,
    bankApyOverride,
    strategyApyOverrides,
  ]);

  const goToScreen = useCallback((screen: PreDreamScreen) => {
    dispatch({ type: 'GO_TO_SCREEN', screen });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo<PreDreamContextValue>(
    () => ({
      state,
      acceptDisclaimer,
      goToGoalStrategy,
      selectGoal,
      selectPath,
      setInitialAmount,
      setMonthlyContribution,
      goToTimeframe,
      selectTimeframe,
      startSimulation,
      goToScreen,
      reset,
    }),
    [
      state,
      acceptDisclaimer,
      goToGoalStrategy,
      selectGoal,
      selectPath,
      setInitialAmount,
      setMonthlyContribution,
      goToTimeframe,
      selectTimeframe,
      startSimulation,
      goToScreen,
      reset,
    ]
  );

  return <PreDreamContext.Provider value={value}>{children}</PreDreamContext.Provider>;
}

export function usePreDream(): PreDreamContextValue {
  const context = useContext(PreDreamContext);
  if (!context) {
    throw new Error('usePreDream must be used within a PreDreamProvider');
  }
  return context;
}
