'use client';

/**
 * MarketDataContextProvider — A8 fix (TOOLS_IMPROVEMENT.md, 2026-05-23).
 *
 * Server components pre-fetch `marketDataService.get()` and pass the resolved
 * snapshot to this provider via the `initialSnapshot` prop. The provider
 * primes the client-side singleton synchronously (before any child renders)
 * so calculators reading `marketDataService.getSync()` get live data on the
 * very first render, not the static fallback.
 *
 * **What this fixes:**
 * 1. SSR-to-client depreciation flip on `/` (ComparisonTable + GoalExampleCards
 *    using `useMarketData` would re-render with different numbers post-hydration).
 * 2. Silently-stale data on `/tools/*` pages (calculators read `getSync()`
 *    directly with no `get()` trigger — they were stuck on static fallback).
 *
 * **Pattern note:** intentionally primes the singleton at module-import time
 * (via the lazy `useState` initializer) rather than in `useEffect`. The cache
 * MUST be populated before child components call `getSync()` during their
 * first render. `useEffect` would fire too late.
 */

import { type ReactNode } from 'react';
import { marketDataService, type MarketDataSnapshot } from '@/lib/market-data';

interface MarketDataContextProviderProps {
  initialSnapshot: MarketDataSnapshot;
  children: ReactNode;
}

export function MarketDataContextProvider({ initialSnapshot, children }: MarketDataContextProviderProps) {
  // Prime synchronously on first render so descendants reading
  // `marketDataService.getSync()` see the live snapshot.
  // (Wrapping in a check avoids re-priming on every render.)
  if (
    typeof window !== 'undefined' &&
    marketDataService.getSync().metadata?.source !== initialSnapshot.metadata?.source
  ) {
    marketDataService.primeCache(initialSnapshot);
  } else if (typeof window === 'undefined') {
    // SSR: the singleton already has the live snapshot (server pre-fetched
    // it before this provider rendered), so priming is redundant but
    // idempotent and harmless.
    marketDataService.primeCache(initialSnapshot);
  }

  return <>{children}</>;
}
