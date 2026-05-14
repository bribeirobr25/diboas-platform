'use client';

/**
 * Mock SDK — client surface. Carries the AnalyticsProvider + hooks that the
 * dashboard components consume. Hooks resolve from `initialData` SSR-prefetched
 * by the RSC per NF5; no client-side fetching in iteration 2.
 *
 * Iteration 5 swap: replace this file with `import { AnalyticsProvider, useRegime, … } from '@analytics-platform/client'`.
 * Public names below match the future SDK.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type {
  AnalyticsError,
  AnalyticsInitialData,
  AnalyticsProviderProps,
  DataStatus,
  FallbackMessages,
  HistoricalRegimes,
  HookResult,
  MethodologyData,
  ProductDisclaimerData,
  RegimeData,
  SignalGroup,
} from './types';

interface AnalyticsContextValue {
  initialData: AnalyticsInitialData;
  fallbackMessages: FallbackMessages | null;
  onError: ((err: AnalyticsError) => void) | null;
}

const DEFAULT_FALLBACK: FallbackMessages = {
  outageTitle: 'Live data is temporarily unavailable',
  outageBody: 'We are restoring the connection to our data sources.',
  partialOutageTitle: 'Some data is delayed',
  partialOutageBody: 'Most signals are current; one or more upstream feeds are catching up.',
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({
  initialData,
  fallbackMessages,
  onError,
  children,
}: AnalyticsProviderProps) {
  const value = useMemo<AnalyticsContextValue>(
    () => ({
      initialData: initialData ?? {},
      fallbackMessages: fallbackMessages ?? DEFAULT_FALLBACK,
      onError: onError ?? null,
    }),
    [initialData, fallbackMessages, onError],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

function useAnalyticsContext(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    throw new Error('useAnalytics* hooks must be used inside <AnalyticsProvider>');
  }
  return ctx;
}

const NOOP_REFETCH = async () => {
  // Mock SDK: refetch is a no-op; iteration-5 SDK will rehit the network.
};

function resolveFromInitial<T>(value: T | null | undefined): HookResult<T> {
  return {
    data: value ?? null,
    isLoading: false,
    error: null,
    refetch: NOOP_REFETCH,
  };
}

export function useRegimeData(): HookResult<RegimeData> {
  const { initialData } = useAnalyticsContext();
  return resolveFromInitial(initialData.regime);
}

export function useHistoricalRegimes(): HookResult<HistoricalRegimes> {
  const { initialData } = useAnalyticsContext();
  return resolveFromInitial(initialData.historical);
}

export function useSignals(): HookResult<{ signal_groups: SignalGroup[] }> {
  const { initialData } = useAnalyticsContext();
  return resolveFromInitial(initialData.signals);
}

export function useDataStatus(): HookResult<DataStatus> {
  const { initialData } = useAnalyticsContext();
  return resolveFromInitial(initialData.dataStatus);
}

export function useMethodology(): HookResult<MethodologyData> {
  const { initialData } = useAnalyticsContext();
  return resolveFromInitial(initialData.methodology);
}

export function useProductDisclaimer(): HookResult<ProductDisclaimerData> {
  const { initialData } = useAnalyticsContext();
  return resolveFromInitial(initialData.productDisclaimer);
}

export function useFallbackMessages(): FallbackMessages {
  const { fallbackMessages } = useAnalyticsContext();
  return fallbackMessages ?? DEFAULT_FALLBACK;
}

export { AnalyticsContext };

export interface AnalyticsAttributionProps {
  children?: ReactNode;
  className?: string;
}
