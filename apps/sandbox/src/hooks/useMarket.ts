'use client';

import { useEffect, useState } from 'react';
import {
  type DataStamp,
  type DisplayCurrency,
  type GasQuote,
  type ProtocolApy,
  type ProtocolApyHistory,
  type ProtocolPriceHistory,
} from '@diboas/defi';
import { Logger } from '@/lib/monitoring/Logger';
import { BoundedFailure, failureReason } from '@/lib/monitoring/failureReason';
import { historyResponseIssue, marketResponseIssue } from '@/lib/market/responseShape';

export interface MarketData {
  currency: DisplayCurrency;
  apys: ProtocolApy[];
  gas: GasQuote[];
  /** `null` when no USDC quote resolved — the conversion is UNKNOWN (§8.7). */
  usdPriceLocal: number | null;
  /**
   * The FX quote's own stamp (`5.225`). The route has serialised this since
   * AUD-F05; the client discarded it, so the conversion's vintage could not be
   * reasoned about downstream. CARRIED, not displayed — no approved string
   * states FX provenance, and inventing one is not this increment's call.
   */
  usdPriceStamp: DataStamp | null;
}

/**
 * Market data hook. One fetch per (currency, refresh); the active flag +
 * AbortController guard the unmount race (R-rows: every async effect carries
 * its cancel path), and state updates happen only in async continuations.
 *
 * ⚑ BOUND TO THE CURRENCY ASKED FOR (2026-10-19 review). The answer is stored WITH the
 * currency it was fetched for, and exposed only while that is still the currency asked
 * for — derived during render, so a currency change hides the old answer in the same
 * render, while the new request is pending and after it fails. A failure is bound the
 * same way. A SAME-currency answer is deliberately kept through a refresh and a failed
 * refresh: every value's age is judged from its own stamp before a new decision uses it
 * (`isRefusedForCurrentFacingUse`), so keeping it hides nothing.
 */
export function useMarket(currency: DisplayCurrency) {
  const [answer, setAnswer] = useState<{ currency: DisplayCurrency; data: MarketData } | null>(
    null
  );
  const [failedFor, setFailedFor] = useState<DisplayCurrency | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/market?currency=${currency}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new BoundedFailure(`http-${res.status}`);
        const body: unknown = await res.json();
        const issue = marketResponseIssue(body, currency);
        if (issue) throw new BoundedFailure(`malformed market response: ${issue}`);
        if (active) {
          const data = body as MarketData;
          // `tvlUsd` may be ABSENT on the wire (accepted, display-only); store it as the
          // contract's `null` = unknown, so the stored data is what its type says (final
          // review 2026-10-19). Nothing else is reshaped.
          setAnswer({
            currency,
            data: { ...data, apys: data.apys.map((a) => ({ ...a, tvlUsd: a.tvlUsd ?? null })) },
          });
          setFailedFor(null);
        }
      } catch (e) {
        if (!active || (e as Error).name === 'AbortError') return;
        // A path or a status, never the payload (P12 with bounded reasons).
        Logger.warn('market response unusable', { currency, reason: failureReason(e) });
        setFailedFor(currency);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [currency, reloadKey]);

  return {
    market: answer !== null && answer.currency === currency ? answer.data : null,
    marketError: failedFor === currency,
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
 * cached response from before §4.8 parses rather than throwing; a market leg with
 * no price series is then REFUSED by the replay (an honest unavailable span,
 * `lib/ledger/journey.ts`), never held flat — corrected 2026-10-18 (lane audit):
 * this comment still described the removed hold-its-value fallback.
 */
export async function fetchSeries(
  days: number
): Promise<{ histories: ProtocolApyHistory[]; priceHistories: ProtocolPriceHistory[] }> {
  const res = await fetch(`/api/market/history?days=${days}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new BoundedFailure(`http-${res.status}`);
  const body: unknown = await res.json();
  // `5.353`, same rule as the hook (`responseShape.ts`): a shape this code cannot use is
  // an error naming its PATH, not data.
  const issue = historyResponseIssue(body);
  if (issue) throw new BoundedFailure(`malformed history response: ${issue}`);
  const b = body as Record<string, unknown>;
  return {
    histories: b.histories as ProtocolApyHistory[],
    priceHistories: (b.priceHistories as ProtocolPriceHistory[] | undefined) ?? [],
  };
}
