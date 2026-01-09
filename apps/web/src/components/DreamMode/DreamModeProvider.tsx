'use client';

/**
 * Dream Mode Provider
 *
 * Context provider for managing Dream Mode state and navigation
 * Includes CLO compliance features (disclaimer tracking, path selection)
 *
 * Domain-Driven Design: Orchestration layer using extracted reducer and calculator
 * Code Reusability: Logic extracted into separate modules for testing
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { DreamContextValue, DreamScreen, DreamInput } from './types';
import { dreamReducer, initialState } from './dreamReducer';
import { calculateSimulationResult } from './simulationCalculator';
import { analyticsService } from '@/lib/analytics';
import { DREAM_MODE_EVENTS, type DreamPath } from '@/lib/dream-mode';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

/**
 * Dream Mode Context
 */
const DreamContext = createContext<DreamContextValue | null>(null);

/**
 * Dream Mode Provider Props
 */
interface DreamModeProviderProps {
  children: React.ReactNode;
  /** Initial input values */
  initialInput?: Partial<DreamInput>;
  /** Callback when simulation completes */
  onComplete?: () => void;
  /** Callback when user shares */
  onShare?: () => void;
}

/**
 * Dream Mode Provider Component
 */
export function DreamModeProvider({
  children,
  initialInput,
  onComplete,
  onShare,
}: DreamModeProviderProps) {
  const [state, dispatch] = useReducer(dreamReducer, {
    ...initialState,
    input: { ...initialState.input, ...initialInput },
  });

  // Navigation helpers
  const goToScreen = useCallback((screen: DreamScreen) => {
    analyticsService.track({
      name: 'dream_mode_screen_view',
      parameters: { screen },
    });
    dispatch({ type: 'GO_TO_SCREEN', screen });
  }, []);

  const nextScreen = useCallback(() => {
    dispatch({ type: 'NEXT_SCREEN' });
  }, []);

  const previousScreen = useCallback(() => {
    dispatch({ type: 'PREVIOUS_SCREEN' });
  }, []);

  // Accept disclaimer (CLO compliance)
  const acceptDisclaimer = useCallback(() => {
    analyticsService.track({
      name: DREAM_MODE_EVENTS.DISCLAIMER_ACCEPTED,
      parameters: { timestamp: new Date().toISOString() },
    });

    // Emit disclaimer accepted event for audit trail
    applicationEventBus.emit(ApplicationEventType.DREAM_MODE_DISCLAIMER_ACCEPTED, {
      source: 'dreamMode',
      timestamp: Date.now(),
    });

    dispatch({ type: 'ACCEPT_DISCLAIMER' });
  }, []);

  // Select investment path
  const selectPath = useCallback((path: DreamPath) => {
    analyticsService.track({
      name: DREAM_MODE_EVENTS.PATH_SELECTED,
      parameters: { path },
    });

    // Emit path selected event for analytics and audit trail
    applicationEventBus.emit(ApplicationEventType.DREAM_MODE_PATH_SELECTED, {
      source: 'dreamMode',
      timestamp: Date.now(),
      path,
    });

    dispatch({ type: 'SELECT_PATH', path });
  }, []);

  // Input setter
  const setInput = useCallback((input: Partial<DreamInput>) => {
    dispatch({ type: 'SET_INPUT', input });
  }, []);

  // Start simulation
  const startSimulation = useCallback(() => {
    // Emit feature used event for audit trail
    applicationEventBus.emit(ApplicationEventType.FEATURE_USED, {
      source: 'dreamMode',
      timestamp: Date.now(),
      metadata: {
        feature: 'dream_mode_simulation',
        path: state.selectedPath || 'balance',
        timeframe: state.input.timeframe,
      },
    });

    // Emit calculation started event
    applicationEventBus.emit(ApplicationEventType.DREAM_MODE_CALCULATION_STARTED, {
      source: 'dreamMode',
      timestamp: Date.now(),
      amount: state.input.initialAmount,
    });

    dispatch({ type: 'START_SIMULATION' });

    const selectedPath = state.selectedPath || 'balance';
    const result = calculateSimulationResult(state.input, selectedPath);

    dispatch({ type: 'SET_RESULT', result });

    // Track simulation start
    analyticsService.track({
      name: 'dream_mode_simulation_started',
      parameters: {
        initialAmount: state.input.initialAmount,
        monthlyContribution: state.input.monthlyContribution,
        timeframe: state.input.timeframe,
        selectedPath,
        pathApy: result.pathApy,
      },
    });

    // Emit calculation completed event (via ApplicationEventBus for audit trail)
    // Note: The detailed analytics tracking is also done in calculateBankComparison
    applicationEventBus.emit(ApplicationEventType.DREAM_MODE_CALCULATION_COMPLETED, {
      source: 'dreamMode',
      timestamp: Date.now(),
      amount: state.input.initialAmount,
      path: selectedPath,
      timeframe: state.input.timeframe,
      result: {
        finalBalance: result.defiBalance,
        growthPercentage: result.growthPercentage,
        bankComparison: result.difference,
      },
    });
  }, [state.input, state.selectedPath]);

  // Reset
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo<DreamContextValue>(
    () => ({
      state,
      dispatch,
      goToScreen,
      nextScreen,
      previousScreen,
      acceptDisclaimer,
      selectPath,
      setInput,
      startSimulation,
      reset,
    }),
    [state, goToScreen, nextScreen, previousScreen, acceptDisclaimer, selectPath, setInput, startSimulation, reset]
  );

  return <DreamContext.Provider value={value}>{children}</DreamContext.Provider>;
}

/**
 * Hook to use Dream Mode context
 */
export function useDreamMode(): DreamContextValue {
  const context = useContext(DreamContext);
  if (!context) {
    throw new Error('useDreamMode must be used within a DreamModeProvider');
  }
  return context;
}
