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
 * 1. SSR-to-client depreciation flip on `/` (ComparisonTable — and any consumer
 *    of `useMarketData` — would re-render with different numbers post-hydration).
 * 2. Silently-stale data on `/tools/*` pages (calculators read `getSync()`
 *    directly with no `get()` trigger — they were stuck on static fallback).
 *
 * **Pattern note:** primes the singleton synchronously during render, rather than in
 * `useEffect`: the cache MUST be populated before child components call `getSync()` during
 * their first render, and `useEffect` would fire too late. C2-S G4: it primes on every render
 * (server and browser); `primeCache` makes that idempotent per snapshot object.
 */

import { type ReactNode } from 'react';
import { marketDataService, type MarketDataSnapshot } from '@/lib/market-data';

interface MarketDataContextProviderProps {
  /**
   * The server's snapshot. The tools layout sends it without the monthly series
   * (`toClientSnapshot`, C2-S G4); the home, business and Learn pages still send the full one
   * (their half is the webapp lane's).
   */
  initialSnapshot: Omit<MarketDataSnapshot, 'monthlySeries'>;
  children: ReactNode;
}

export function MarketDataContextProvider({
  initialSnapshot,
  children,
}: MarketDataContextProviderProps) {
  // Prime synchronously on every render, server and browser, so descendants reading
  // `marketDataService.getSync()` see the server's snapshot on their first render.
  // C2-S G4: the old guard compared `metadata.source` labels, and the fallback provider labels
  // both sides 'fallback', so the browser never primed and rendered the bare constants.
  // `primeCache` is idempotent per snapshot object, ignores a stale snapshot and keeps series
  // already loaded.
  marketDataService.primeCache(initialSnapshot);

  return <>{children}</>;
}
