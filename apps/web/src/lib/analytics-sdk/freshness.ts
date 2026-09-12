/**
 * Read-time freshness evaluation (PENDING_ALL 5.173).
 *
 * THE DEFECT THIS EXISTS FOR: `deriveDataStatus()` runs ONCE, at generation,
 * with `run = computed_at`, and its verdict is frozen into static JSON that is
 * then served for a week. `DataFreshnessBadge` does no date maths. So the panel
 * could not degrade: the moment a cycle slipped or a PR sat unmerged, the page
 * kept asserting a freshness it could not have. Measured on production
 * 2026-09-12: seven sources rendering FRESH / HIGH while two FRED anchors were
 * 15 days old against the pipeline's own 14-day allowance. **This was the
 * steady state, not an incident** — FRED anchors are ~10 days old at generation
 * and the artifact serves for 7 more, so even a punctual pipeline published a
 * false FRESH roughly 3 days in every 7.
 *
 * WHY IT IS SHAPED LIKE THIS — the cadence POLICY stays in the pipeline
 * (`scripts/market-refresh/lib/data-status.mjs`), which is the only place that
 * knows the doc-02 rules. It now ships `delayed_after` per source: the instant
 * its own rule flips FRESH to DELAYED. This module does arithmetic against that
 * instant and nothing else. Two consequences worth stating:
 *   - shipped code never imports build tooling (no `src` file imports from
 *     `scripts/`, and this does not become the first);
 *   - there is no second copy of the cadence rules to drift, which was the
 *     failure mode the fix had to avoid, not create.
 *
 * DIRECTION IS ONE-WAY. This can only ever DOWNGRADE. It never promotes a
 * source the pipeline called DELAYED or UNAVAILABLE back to FRESH: the
 * pipeline knows things (a missing candle, a warm-up count) that a clock does
 * not, and time never makes a stale source fresh.
 *
 * Swap note: at iteration 5 the real `/data-status` computes freshness
 * server-side per request (doc-07 §23.1 gives it a 15-minute TTL), so this
 * module is deleted with the rest of the mock rather than ported.
 */

import type { DataStatus, ConfidenceLevel, FreshnessStatus } from './types';

function isPast(instant: string | null | undefined, now: Date): boolean {
  if (!instant) return false;
  const t = Date.parse(instant);
  return Number.isFinite(t) && now.getTime() > t;
}

/**
 * Recompute the headline confidence from the (possibly downgraded) sources.
 * Mirrors `deriveDataStatus`'s rule exactly — HIGH when all fresh, LOW when two
 * or more are unavailable or any source is past its own `stale_after`,
 * MODERATE otherwise. The equivalence test pins the two together at
 * `now === computed_at`, so a change to one that is not made to the other fails.
 */
function overallConfidence(sources: DataStatus['sources'], now: Date): ConfidenceLevel {
  const unavailable = sources.filter((s) => s.status === 'UNAVAILABLE').length;
  const delayed = sources.filter((s) => s.status === 'DELAYED').length;
  const pastStale = sources.some((s) => isPast(s.stale_after, now));
  if (unavailable >= 2 || pastStale) return 'LOW';
  if (delayed || unavailable) return 'MODERATE';
  return 'HIGH';
}

/**
 * Apply the clock to a generated panel. Pure; returns a new object.
 *
 * @param status the panel as generated at build time
 * @param now    evaluation instant (injected — never read from the ambient clock
 *               here, so the behaviour is testable at any date)
 */
export function applyReadTimeFreshness(status: DataStatus, now: Date): DataStatus {
  const sources = status.sources.map((src) => {
    const downgrade = src.status === 'FRESH' && isPast(src.delayed_after, now);
    return downgrade ? { ...src, status: 'DELAYED' as FreshnessStatus } : src;
  });

  return {
    ...status,
    sources,
    delayed_sources: sources.filter((s) => s.status === 'DELAYED').map((s) => s.source),
    unavailable_sources: sources.filter((s) => s.status === 'UNAVAILABLE').map((s) => s.source),
    overall_confidence: overallConfidence(sources, now),
  };
}
