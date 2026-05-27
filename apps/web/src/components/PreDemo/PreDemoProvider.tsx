'use client';

/**
 * PreDemo Provider
 *
 * Context provider for PreDemo state management.
 * Single responsibility: state + screen transitions + analytics tracking.
 * Timer sequences live in useScreenTransitionSequence hook at PreDemoContent level.
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { PreDemoContextValue } from './types';
import type { PreDemoScreen, FeeRateOverrides } from '@/lib/pre-demo';
import { preDemoReducer, initialPreDemoState } from './preDemoReducer';
import { analyticsService } from '@/lib/analytics';

const PreDemoContext = createContext<PreDemoContextValue | null>(null);

interface PreDemoProviderProps {
  children: React.ReactNode;
  onExit?: () => void;
  feeRateOverrides?: FeeRateOverrides; // From diBoaS analytics API when available
}

// TODO: Wire feeRateOverrides through context → transactionService when analytics API ships
export function PreDemoProvider({
  children,
  onExit,
  feeRateOverrides: _feeRateOverrides,
}: PreDemoProviderProps) {
  const [state, dispatch] = useReducer(preDemoReducer, initialPreDemoState);

  // setScreen is stable (no dependencies on state) — dispatch is stable by React guarantee
  const setScreen = useCallback((screen: PreDemoScreen) => {
    analyticsService.track({
      name: 'pre_demo_screen_view',
      parameters: { screen },
    });

    dispatch({ type: 'SET_SCREEN', screen });
  }, []);

  const value = useMemo<PreDemoContextValue>(
    () => ({ state, dispatch, setScreen, onExit }),
    [state, setScreen, onExit]
  );

  return <PreDemoContext.Provider value={value}>{children}</PreDemoContext.Provider>;
}

export function usePreDemo(): PreDemoContextValue {
  const context = useContext(PreDemoContext);
  if (!context) {
    throw new Error('usePreDemo must be used within a PreDemoProvider');
  }
  return context;
}
