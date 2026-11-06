'use client';

import { useEffect, useState } from 'react';
import { fetchWithRetry } from '@/lib/fetchWithRetry';
import { Logger } from '@/lib/monitoring/Logger';
import { BoundedFailure, failureReason } from '@/lib/monitoring/failureReason';
import { rateRangesResponseIssue } from '@/lib/market/responseShape';
import type { RateRangesPayload } from '@/lib/rateRangesContract';

/** null = not asked for or still loading; 'error' = the answer could not be used (Case U). */
export type RateRangesState = RateRangesPayload | null | 'error';

/** The projection gives up after this long, retries included, so a stall still ends in Case U. */
export const RATE_RANGES_TIMEOUT_MS = 15_000;

/** The route the block reads (`app/api/market/rate-ranges/route.ts`). */
export const RATE_RANGES_URL = '/api/market/rate-ranges';

/**
 * PR 2 · the stable strategies' observed rate ranges for the goal projection
 * (private docs `audit/WEBAPP_PLANS_2026-11-04/P3_PROJECTION_PR2.md` §2).
 *
 * Fetched only while `enabled` (the block can show something — `selectProjectionCanShow`), so the
 * goal page never pays for data it will not show. R-rows: R-8 `fetchWithRetry` (2 retries with
 * backoff, transient failures only); an `AbortController` aborted by a timer at 15 s, the timer
 * cleared on settle and in cleanup (R-1, R-2); an `active` flag guards the unmount race; state is
 * set only in async continuations. A failed or malformed answer is LOGGED with a bounded reason
 * and becomes 'error', never a crash and never a number (P7, P12).
 *
 * Each time the block is (re)enabled is a new REQUEST; an answer is shown only for the request it
 * belongs to, so re-enabling shows "loading" — never the previous answer — until the new one lands.
 */
export function useRateRanges(enabled: boolean): RateRangesState {
  const [request, setRequest] = useState(0);
  const [wasEnabled, setWasEnabled] = useState(enabled);
  const [answer, setAnswer] = useState<{ request: number; value: RateRangesState }>({
    request: -1,
    value: null,
  });
  // A new request each time `enabled` turns true — adjusted during render, React's sanctioned way
  // to derive state from a prop change (no effect, no extra commit of the stale answer).
  if (enabled !== wasEnabled) {
    setWasEnabled(enabled);
    if (enabled) setRequest((r) => r + 1);
  }

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const controller = new AbortController();
    // Aborted with a TimeoutError reason, as `AbortSignal.timeout` would, so the failure is logged
    // as a timeout, never as an unexpected abort (9th audit).
    const timer = setTimeout(
      () => controller.abort(new DOMException('The request timed out.', 'TimeoutError')),
      RATE_RANGES_TIMEOUT_MS
    );
    fetchWithRetry(RATE_RANGES_URL, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new BoundedFailure(`http-${res.status}`);
        const body: unknown = await res.json();
        const issue = rateRangesResponseIssue(body);
        if (issue) throw new BoundedFailure(`malformed rate-ranges response: ${issue}`);
        if (active) setAnswer({ request, value: body as RateRangesPayload });
      })
      .catch((error: unknown) => {
        // Not after leaving: a request the screen no longer waits for is not news.
        if (!active) return;
        Logger.warn('rate ranges unavailable; projection shows that rates cannot be read', {
          reason: failureReason(error),
        });
        setAnswer({ request, value: 'error' });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, request]);

  return enabled && answer.request === request ? answer.value : null;
}
