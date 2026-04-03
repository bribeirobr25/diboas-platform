/**
 * useMarketData Hook
 *
 * SSR-safe React hook for accessing market data.
 * Returns fallback data synchronously on first render (no hydration mismatch).
 * Triggers async fetch on client mount for fresh data when API is available.
 */

'use client';

import { useState, useEffect } from 'react';
import { marketDataService } from '@/lib/market-data';
import type { MarketDataSnapshot } from '@/lib/market-data';

interface UseMarketDataResult {
  data: MarketDataSnapshot;
  isStale: boolean;
  source: 'api' | 'fallback';
}

export function useMarketData(): UseMarketDataResult {
  const [snapshot, setSnapshot] = useState<MarketDataSnapshot>(
    () => marketDataService.getSync()
  );

  useEffect(() => {
    let mounted = true;

    marketDataService.get().then((data) => {
      if (mounted) {
        setSnapshot(data);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    data: snapshot,
    isStale: snapshot.metadata.stale,
    source: snapshot.metadata.source,
  };
}
