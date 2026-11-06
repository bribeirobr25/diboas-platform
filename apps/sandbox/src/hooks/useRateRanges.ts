'use client';

import { useEffect, useState } from 'react';
import { Logger } from '@/lib/monitoring/Logger';
import { BoundedFailure, failureReason } from '@/lib/monitoring/failureReason';
import { rateRangesResponseIssue } from '@/lib/market/responseShape';
import type { RateRangesPayload } from '@/lib/rateRangesContract';

/** null = not asked for or still loading; 'error' = the answer could not be used (Case U). */
export type RateRangesState = RateRangesPayload | null | 'error';

/** The projection gives up after this long, so a stalled connection still ends in Case U. */
export const RATE_RANGES_TIMEOUT_MS = 15_000;

/**
 * PR 2 · the stable strategies' observed rate ranges for the goal projection
 * (private docs `audit/WEBAPP_PLANS_2026-11-04/P3_PROJECTION_PR2.md` §2).
 *
 * Fetched only while `enabled` (the block can show something — `projectionCanShow`), so the goal
 * page never pays for data it will not show. R-rows: an `AbortController` aborted by a timer at
 * 15 s, the timer cleared in cleanup (R-1, R-2, R-8); an `active` flag guards the unmount race;
 * state is set only in async continuations. A failed or malformed answer is LOGGED with a bounded
 * reason and becomes 'error', never a crash and never a number (P7, P12).
 */
export function useRateRanges(enabled: boolean): RateRangesState {
  const [answer, setAnswer] = useState<RateRangesState>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RATE_RANGES_TIMEOUT_MS);
    fetch('/api/market/rate-ranges', { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new BoundedFailure(`http-${res.status}`);
        const body: unknown = await res.json();
        const issue = rateRangesResponseIssue(body);
        if (issue) throw new BoundedFailure(`malformed rate-ranges response: ${issue}`);
        if (active) setAnswer(body as RateRangesPayload);
      })
      .catch((error: unknown) => {
        // Not after leaving: a request the screen no longer waits for is not news.
        if (!active) return;
        Logger.warn('rate ranges unavailable; projection shows that rates cannot be read', {
          reason: failureReason(error),
        });
        setAnswer('error');
      })
      .finally(() => clearTimeout(timer));
    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [enabled]);

  return enabled ? answer : null;
}
