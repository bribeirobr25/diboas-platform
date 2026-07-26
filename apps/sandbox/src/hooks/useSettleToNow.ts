'use client';

import { useEffect, useState } from 'react';
import { realDaysToSettle } from '@diboas/banking';
import { advanceTime, getLedgerState } from '@/lib/ledgerClient';
import { fetchHistories } from './useMarket';

/**
 * Module-level lock: serializes concurrent settles (React StrictMode's
 * double-invoke in dev, fast remounts) so real elapsed time can never be
 * DOUBLE-counted. Paired with a recompute-after-fetch below, the settle is
 * idempotent and race-safe.
 */
let settleInFlight = false;

/** Cap a single settle's span — matches the server-side history cap and guards
 *  against a far-future system clock janking the synchronous replay loop. A
 *  larger real gap simply settles across successive loads. */
const MAX_SETTLE_DAYS = 730;

/**
 * WS-F — on mount, settle the ledger to real "now": advance the clock by the
 * whole real days elapsed since genesis that haven't been settled yet,
 * replaying the ACTUAL recent market (D-M3). The gap is computed purely
 * (`realDaysToSettle`), histories are fetched sized to it, then the gap is
 * recomputed against the freshest state before applying — so a concurrent
 * settle can't double-count. **Fail-open** (a provider failure leaves time
 * unsettled — no crash, P7). Returns the days settled this mount (0 = nothing
 * new) so the caller can surface the "real market moved while you were away"
 * beat. Deployed/`next start` runs single-invoke (verified); the lock keeps it
 * correct under dev StrictMode too.
 *
 * ⚠ READY-DEPENDENCY IS STRUCTURAL (CTO §17 F4). This settles against
 * `getLedgerState()` on mount (`[]` deps → once). Its correctness relies on the
 * caller being BEHIND the `<LedgerReadyGate>`: today it lives only in
 * `HomeGate`, which mounts only after the ledger has hydrated, so the settle
 * reads a hydrated log. Do NOT hoist this to an ungated location (a layout, an
 * always-mounted shell) without gating it on ledger-`ready` first — an
 * unhydrated read settles 0 days and, with `[]` deps, never re-runs, silently
 * reinstating the §7 "skipped real-time settle" bug that nothing fails.
 */
export function useSettleToNow(): number {
  const [settled, setSettled] = useState(0);

  useEffect(() => {
    void (async () => {
      if (settleInFlight) return;
      settleInFlight = true;
      try {
        const before = getLedgerState();
        const gap = realDaysToSettle(
          before.genesisRecordedAt,
          before.realSettledDays,
          new Date().toISOString()
        );
        if (gap < 1) return;

        const histories = await fetchHistories(Math.max(Math.min(gap, MAX_SETTLE_DAYS) + 30, 120));

        // Recompute against the freshest state after the await — the settle is
        // applied once, idempotently, even if something advanced meanwhile.
        const now = getLedgerState();
        const toSettle = Math.min(
          realDaysToSettle(now.genesisRecordedAt, now.realSettledDays, new Date().toISOString()),
          MAX_SETTLE_DAYS
        );
        if (toSettle < 1) return;

        advanceTime(toSettle, histories, 'real');
        setSettled(toSettle); // React 18: a no-op if unmounted, no warning
      } catch {
        // Provider failure → leave time unsettled (fail-open); no crash.
      } finally {
        settleInFlight = false;
      }
    })();
  }, []);

  return settled;
}
