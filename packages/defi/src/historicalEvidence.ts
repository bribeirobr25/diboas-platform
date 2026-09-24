/**
 * HISTORICAL EVIDENCE — one provider-neutral contract for every replay series.
 *
 * ⚑ WHAT WAS MISSING. The repository had two historical shapes —
 * `ProtocolApyHistory` and `ProtocolPriceHistory` — each with its own point
 * type, each produced by one adapter, and refusal expressed as a bare `null`.
 * There was no contract a STORED snapshot, an aggregator series or a future
 * high-fidelity reconstruction could arrive through, so any of those would have
 * meant a new shape and a new Product-facing path.
 *
 * Canon asks for the opposite (plan §10 · handoff §11):
 *
 * > a generic historical-reference contract able to consume provider history,
 * > aggregator history, stored normalized snapshots and future high-fidelity
 * > history **without changing Product semantics**.
 *
 * ⚑ PROVENANCE IS PART OF THE CONTRACT, not a comment. `via` records HOW the
 * series was obtained, because a replay that cannot say where its history came
 * from cannot honour `historical replay preserves the evidence/version actually
 * used` (Strategy §24), and a stored snapshot is not the same claim as a live
 * provider read.
 *
 * ⚑ REFUSAL CARRIES A REASON. `null` said only "no series"; it could not
 * distinguish "the source refused" from "the window had a gap" from "no
 * fallback was eligible". The typed refusal is the same `UnavailableReason`
 * union the envelope already uses — one vocabulary, not a third spelling.
 */

import type { UnavailableReason } from './evidence';
import type { DataStamp, ProtocolId } from './types';

/** What the series measures. */
export type HistoricalSeriesKind = 'RATE' | 'PRICE';

/**
 * How the series reached us.
 *
 * ⚑ `STORED_SNAPSHOT` and `HIGH_FIDELITY` are declared but produced by nothing
 * today. They are not speculation: they are the two paths the ratified plan
 * names (Block D persistence, and the parked Real/advanced track), and naming
 * them here is what makes the contract able to consume them later without a
 * Product-facing change. Nothing branches on them yet.
 */
export type HistoricalProvenance =
  'PROVIDER' | 'AGGREGATOR' | 'STORED_SNAPSHOT' | 'HIGH_FIDELITY' | 'FIXTURE';

/** One dated observation. `date` is `YYYY-MM-DD` (UTC) — the replay's honest unit. */
export interface HistoricalPoint {
  readonly date: string;
  readonly value: number;
}

export interface HistoricalSeries {
  readonly kind: HistoricalSeriesKind;
  readonly protocolId: ProtocolId;
  /** Ascending by date, oldest first. */
  readonly points: readonly HistoricalPoint[];
  readonly stamp: DataStamp;
  readonly via: HistoricalProvenance;
}

/**
 * A historical read, available or refused.
 *
 * The same discriminated shape `RateAvailability` uses, so the codebase has ONE
 * way of saying "not available, and here is why" rather than three.
 */
export type HistoricalResult =
  | { readonly available: true; readonly series: HistoricalSeries }
  | { readonly available: false; readonly reason: UnavailableReason };

/**
 * ⛑ MODULE-PRIVATE. Exported in the first draft and consumed by nothing outside
 * this file — the system gate's dead-code front caught it. An unconsumed export
 * is dead code by the repository's standing rule, and the rule is to remove it
 * in the increment that created it, not to leave it for a later sweep.
 */
function historicalSeries(series: HistoricalSeries): HistoricalResult {
  return { available: true, series };
}

export function historicalUnavailable(reason: UnavailableReason): HistoricalResult {
  return { available: false, reason };
}

/**
 * Build a series from dated values, refusing rather than repairing.
 *
 * ⚑ NO INTERPOLATION, EVER. A caller that has a gap must refuse the SERIES;
 * this helper will not silently fill one, and it rejects a non-ascending or
 * duplicated date because a replay that walks an unordered series produces a
 * number nobody can reproduce (the `5.105` discipline).
 */
export function buildHistoricalSeries(input: {
  kind: HistoricalSeriesKind;
  protocolId: ProtocolId;
  points: readonly HistoricalPoint[];
  stamp: DataStamp;
  via: HistoricalProvenance;
}): HistoricalResult {
  const { points } = input;
  if (points.length === 0) return historicalUnavailable('NO_OBSERVATION');
  for (let i = 1; i < points.length; i += 1) {
    if (points[i].date <= points[i - 1].date) return historicalUnavailable('NOT_REPRESENTABLE');
  }
  return historicalSeries({
    kind: input.kind,
    protocolId: input.protocolId,
    points,
    stamp: input.stamp,
    via: input.via,
  });
}
