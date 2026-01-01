'use client';

/**
 * Dream Mode Provider
 *
 * Context provider for managing Dream Mode state and navigation
 * Includes CLO compliance features (disclaimer tracking, path selection)
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { DreamState, DreamAction, DreamContextValue, DreamScreen, DreamInput } from './types';
import type { DreamPath } from '@/lib/dream-mode';
import { calculateFullResult } from '@/lib/calculator';
import { analyticsService } from '@/lib/analytics';
import { STORAGE_KEYS, DREAM_MODE_EVENTS } from '@/lib/dream-mode';

/**
 * Screen order for navigation
 * Flow: disclaimer → welcome → pathSelect → input → timeframe → simulation → results → share
 */
const SCREEN_ORDER: DreamScreen[] = [
  'disclaimer',
  'welcome',
  'pathSelect',
  'input',
  'timeframe',
  'simulation',
  'results',
  'share',
];

/**
 * Initial state
 */
const initialState: DreamState = {
  screen: 'disclaimer',
  disclaimerAccepted: false,
  selectedPath: null,
  input: {
    initialAmount: 1000,
    monthlyContribution: 100,
    currency: 'USD',
    timeframe: '1year',
  },
  result: null,
  animationProgress: 0,
  isPlaying: false,
};

/**
 * State reducer
 */
function dreamReducer(state: DreamState, action: DreamAction): DreamState {
  switch (action.type) {
    case 'GO_TO_SCREEN':
      return { ...state, screen: action.screen };

    case 'NEXT_SCREEN': {
      const currentIndex = SCREEN_ORDER.indexOf(state.screen);
      const nextIndex = Math.min(currentIndex + 1, SCREEN_ORDER.length - 1);
      return { ...state, screen: SCREEN_ORDER[nextIndex] };
    }

    case 'PREVIOUS_SCREEN': {
      const currentIndex = SCREEN_ORDER.indexOf(state.screen);
      // Don't go back past disclaimer if it's been accepted
      const minIndex = state.disclaimerAccepted ? 1 : 0;
      const prevIndex = Math.max(currentIndex - 1, minIndex);
      return { ...state, screen: SCREEN_ORDER[prevIndex] };
    }

    case 'ACCEPT_DISCLAIMER': {
      // Store acceptance timestamp in sessionStorage for CLO compliance
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEYS.DISCLAIMER_ACCEPTED, 'true');
        sessionStorage.setItem(STORAGE_KEYS.DISCLAIMER_TIMESTAMP, new Date().toISOString());
      }
      return {
        ...state,
        disclaimerAccepted: true,
        screen: 'welcome',
      };
    }

    case 'SELECT_PATH': {
      // Store selected path for analytics
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEYS.SELECTED_PATH, action.path);
      }
      return {
        ...state,
        selectedPath: action.path,
        screen: 'input',
      };
    }

    case 'SET_INPUT':
      return {
        ...state,
        input: { ...state.input, ...action.input },
      };

    case 'SET_RESULT':
      return { ...state, result: action.result };

    case 'SET_ANIMATION_PROGRESS':
      return { ...state, animationProgress: action.progress };

    case 'START_SIMULATION':
      return { ...state, isPlaying: true, animationProgress: 0 };

    case 'COMPLETE_SIMULATION':
      return { ...state, isPlaying: false, animationProgress: 100 };

    case 'RESET':
      // Reset to path selection (keep disclaimer accepted)
      return {
        ...initialState,
        disclaimerAccepted: state.disclaimerAccepted,
        screen: state.disclaimerAccepted ? 'pathSelect' : 'disclaimer',
      };

    default:
      return state;
  }
}

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
    dispatch({ type: 'ACCEPT_DISCLAIMER' });
  }, []);

  // Select investment path
  const selectPath = useCallback((path: DreamPath) => {
    analyticsService.track({
      name: DREAM_MODE_EVENTS.PATH_SELECTED,
      parameters: { path },
    });
    dispatch({ type: 'SELECT_PATH', path });
  }, []);

  // Input setter
  const setInput = useCallback((input: Partial<DreamInput>) => {
    dispatch({ type: 'SET_INPUT', input });
  }, []);

  // Start simulation
  const startSimulation = useCallback(() => {
    dispatch({ type: 'START_SIMULATION' });

    // Calculate results
    const result = calculateFullResult(
      {
        initialAmount: state.input.initialAmount,
        monthlyContribution: state.input.monthlyContribution,
        currency: state.input.currency,
      },
      state.input.timeframe
    );

    const comparison = result.projections[state.input.timeframe];

    dispatch({
      type: 'SET_RESULT',
      result: {
        defiBalance: comparison.defi.finalBalance,
        bankBalance: comparison.bank.finalBalance,
        defiInterest: comparison.defi.interestEarned,
        bankInterest: comparison.bank.interestEarned,
        difference: comparison.difference,
        growthPercentage: comparison.defi.growthPercentage,
      },
    });

    // Track simulation start
    analyticsService.track({
      name: 'dream_mode_simulation_started',
      parameters: {
        initialAmount: state.input.initialAmount,
        monthlyContribution: state.input.monthlyContribution,
        timeframe: state.input.timeframe,
      },
    });
  }, [state.input]);

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
