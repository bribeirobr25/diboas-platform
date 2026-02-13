'use client';

/**
 * PreDemo Provider
 *
 * Context provider for PreDemo state management
 * Handles screen transitions, fee calculations, and event emissions
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { PreDemoContextValue } from './types';
import type { PreDemoScreen } from '@/lib/pre-demo';
import { preDemoReducer, initialPreDemoState } from './preDemoReducer';
import { analyticsService } from '@/lib/analytics';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

const PreDemoContext = createContext<PreDemoContextValue | null>(null);

interface PreDemoProviderProps {
  children: React.ReactNode;
  onExit?: () => void;
}

export function PreDemoProvider({ children, onExit }: PreDemoProviderProps) {
  const [state, dispatch] = useReducer(preDemoReducer, initialPreDemoState);

  const setScreen = useCallback((screen: PreDemoScreen) => {
    analyticsService.track({
      name: 'pre_demo_screen_view',
      parameters: { screen },
    });

    // Emit events for key milestones
    if (screen === 'home' && state.screen === 'login') {
      applicationEventBus.emit(ApplicationEventType.PRE_DEMO_STARTED, {
        source: 'preDemo',
        timestamp: Date.now(),
      });
    }

    dispatch({ type: 'SET_SCREEN', screen });
  }, [state.screen]);

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
