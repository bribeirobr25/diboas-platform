'use client';

import { useEffect, useState } from 'react';
import type { GasQuote, ProtocolApy, ProtocolApyHistory, ProtocolPriceHistory } from '@diboas/defi';

export interface MarketData {
  currency: 'USD' | 'BRL' | 'EUR';
  apys: ProtocolApy[];
  gas: GasQuote[];
  usdPriceLocal: number;
}

/**
 * Market data hook. One fetch per (currency, refresh); the active flag +
 * AbortController guard the unmount race (R-rows: every async effect carries
 * its cancel path), and state updates happen only in async continuations.
 */
export function useMarket(currency: 'USD' | 'BRL' | 'EUR') {
  const [data, setData] = useState<MarketData | null>(null);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/market?currency=${currency}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const body = (await res.json()) as MarketData;
        if (active) {
          setData(body);
          setError(false);
        }
      } catch (e) {
        if (active && (e as Error).name !== 'AbortError') setError(true);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [currency, reloadKey]);

  return {
    market: data,
    marketError: error,
    refreshMarket: () => setReloadKey((k) => k + 1),
  };
}

/**
 * Fetch the per-protocol APY history needed by the time machine + the WS-F
 * real-time settle. A 15s timeout guarantees the promise settles even on a
 * stalled connection — so the settle's in-flight lock is always released
 * (never a permanently-wedged settle), and the time machine can't hang.
 */
export async function fetchHistories(days: number): Promise<ProtocolApyHistory[]> {
  return (await fetchSeries(days)).histories;
}

/**
 * Both replay series in one round trip (§4.8): APY for lending legs, price for
 * market legs. `priceHistories` is optional in the response shape so a stale
 * cached response from before §4.8 degrades to "no price movement" rather than
 * throwing — the leg then holds its value instead of inventing a move.
 */
export async function fetchSeries(
  days: number
): Promise<{ histories: ProtocolApyHistory[]; priceHistories: ProtocolPriceHistory[] }> {
  const res = await fetch(`/api/market/history?days=${days}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(String(res.status));
  const body = (await res.json()) as {
    histories: ProtocolApyHistory[];
    priceHistories?: ProtocolPriceHistory[];
  };
  return { histories: body.histories, priceHistories: body.priceHistories ?? [] };
}
