import Decimal from 'decimal.js';
import {
  isRefusedForCurrentFacingUse,
  legRequiresCurrentRate,
  type AllocationLeg,
  type ProtocolApy,
  type ProtocolApyHistory,
  type ProtocolId,
  type StrategyDef,
} from '@diboas/defi';
import { blendDatedSeries, type DatedApyPoint } from '@diboas/investing';

/**
 * `view/strategy.ts` — the strategy surface's selectors.
 *
 * Deliberately a NEW file rather than more of `home.ts`: `5.321` (whether that
 * misnamed module should be split, and how) is the founder's call, and growing
 * it would quietly pre-empt the decision.
 *
 * ## Why this exists (AUD-C02)
 *
 * `StrategyDetail` imported `blendDatedSeries` and invoked it in its render
 * body — weighted APY arithmetic inside a component, the same class the
 * auditor raised against `StrategyPicker`'s blended APY. `VIEW-2` names that
 * class, so the honest remedy is migration, not an exception. `VIEW-1` does not
 * ban `@diboas/investing`, so a pure selector may own the blend.
 */

/** The timeframes the G6 detailed view offers (mockup 4-goal-strategy-2views-detailed). */
export const CHART_TIMEFRAMES = [7, 30, 90, 365] as const;
export type ChartTimeframe = (typeof CHART_TIMEFRAMES)[number];

/** How many trailing points the pre-commit sparkline summarises. */
const SPARK_DAYS = 30;

export interface StrategyChartView {
  /**
   * The blended series — EMPTY when coverage is incomplete. Empty is what makes
   * `ApyChart` fall to its existing `apyChart.noData` line, which is already
   * approved in all four locales, so refusing costs no new copy.
   */
  series: DatedApyPoint[];
  /** Trailing values for the sparkline; empty whenever `series` is. */
  sparkSeries: number[];
  /** The timeframe that may honestly be shown (never wider than the data). */
  timeframe: ChartTimeframe;
  /** The widest timeframe the data can actually fill. */
  widestFit: ChartTimeframe;
  /** True only when EVERY leg contributed real history. */
  complete: boolean;
  /** Which legs had no history at all — named, so a disclosure can say so. */
  missingProtocolIds: ProtocolId[];
  /** Percent of the strategy's weight that history actually covered. */
  weightCovered: number;
}

/**
 * Blends the strategy's own legs over real history, and REFUSES rather than
 * under-report.
 *
 * ## The `MISSING ≠ 0` rule, and why it is load-bearing here
 *
 * `blendDatedSeries` skips a leg with no points (`if (leg.points.length === 0)
 * return`). The remaining legs still contribute only their OWN weights, so the
 * total weight falls below 100 and the curve comes out silently LOW — a 50/30/20
 * strategy missing its 50% leg reports roughly half the true rate, presented as
 * "the strategy's own history". Nothing on screen says a leg is missing.
 *
 * That is the chart twin of `typicalFeeUsd ?? 0`: an absent input treated as a
 * real zero. An incomplete derivation is reported as incomplete — never
 * completed with a silent assumption, and never rendered as though whole.
 */
export function selectStrategyChartSeries(input: {
  allocation: readonly AllocationLeg[];
  histories: readonly ProtocolApyHistory[];
  requestedTimeframe: ChartTimeframe;
}): StrategyChartView {
  const { allocation, histories, requestedTimeframe } = input;

  const byProtocol = new Map(histories.map((h) => [h.protocolId, h]));
  const missingProtocolIds = allocation
    .filter((leg) => (byProtocol.get(leg.protocolId)?.points.length ?? 0) === 0)
    .map((leg) => leg.protocolId);

  const weightCovered = allocation
    .filter((leg) => (byProtocol.get(leg.protocolId)?.points.length ?? 0) > 0)
    .reduce((sum, leg) => sum + leg.weightPercent, 0);

  const complete = allocation.length > 0 && missingProtocolIds.length === 0;

  const series = complete
    ? blendDatedSeries(
        allocation.map((leg) => ({
          weightPercent: leg.weightPercent,
          points: byProtocol.get(leg.protocolId)?.points ?? [],
        }))
      )
    : [];

  /* Keep the shown timeframe honest: never mark a window active that the data
     cannot fill. Derived, never synced through an effect. */
  const fitting = CHART_TIMEFRAMES.filter((d) => d <= series.length);
  const widestFit = fitting.length > 0 ? fitting[fitting.length - 1] : CHART_TIMEFRAMES[0];

  return {
    series,
    sparkSeries: series.slice(-SPARK_DAYS).map((p) => p.apyPercent),
    timeframe: requestedTimeframe <= widestFit ? requestedTimeframe : widestFit,
    widestFit,
    complete,
    missingProtocolIds,
    weightCovered,
  };
}

/*
 * Moved here from `components/StrategyPicker.tsx` (2026-10-18 lane audit, P1/VIEW-2): a
 * Decimal rate blend plus a freshness check is a money derivation, and it lived in a
 * component on the I-5 replacement list while a second screen (`StrategyDetail`)
 * imported it from there. Pure move — behaviour unchanged.
 */
/**
 * Whether a strategy has a displayable `Current pool rate`, and what it is.
 *
 * ⛑ `5.444` · REPLACES `blendedApy`, WHICH COULD NOT REFUSE.
 *
 * The old function returned a bare `Decimal` and read
 * `byId.get(leg.protocolId)?.apyPercent ?? 0` — so a leg with no APY silently
 * contributed **zero** to a rate a user reads. That was invisible only because
 * the availability gate happened to stop the number rendering; S3 removes that
 * accident, and a `MISSING -> 0` understatement would have shipped with it.
 *
 * ⚑ A DISCRIMINATED RESULT, so the wrong answer is not representable. There is
 * no code path that yields a number for a strategy that must show none.
 *
 * Strategy's ruling: `"Current pool rate"` is an APY-SPECIFIC SECONDARY
 * representation, never a universal whole-strategy return metric.
 *
 * ```text
 * PURE ACCRUAL + every required rate valid  -> displayable, unchanged to the cent
 *   where VALID means present, finite AND inside the current-facing vintage
 * HETEROGENEOUS (any market leg)            -> OMITTED — a market leg's return is
 *                                              its price, and no blend of rates
 *                                              can describe it
 * MISSING a REQUIRED accrual rate           -> WITHHELD, never zero-filled
 * ```
 *
 * Renormalising over the accrual legs is explicitly refused: it would silently
 * change what the number MEANS while leaving its label identical.
 */
export type StrategyRateDisplay =
  | { readonly displayable: true; readonly apy: Decimal }
  | { readonly displayable: false; readonly reason: 'HETEROGENEOUS' | 'MISSING_REQUIRED_RATE' };

export function strategyRateDisplay(
  strategy: StrategyDef,
  apys: ProtocolApy[],
  /**
   * The current-facing reference moment. REQUIRED, and not defaulted.
   *
   * ⛑ Added after the `5.436` guard caught this function rendering a STALE
   * number: presence and finiteness are not validity. A rate refused for
   * current-facing use is exactly the "stale number" that ruling forbids, and a
   * displayable-rate check that cannot see a clock cannot refuse one. Silence
   * must not mean "unenforced".
   */
  now: Date | string
): StrategyRateDisplay {
  const byId = new Map(apys.map((a) => [a.protocolId, a]));
  let total = new Decimal(0);
  for (const leg of strategy.allocation) {
    /* Asked of the leg's own economics, never of its id. */
    if (!legRequiresCurrentRate(leg.protocolId)) {
      return { displayable: false, reason: 'HETEROGENEOUS' };
    }
    const observation = byId.get(leg.protocolId);
    const observed = observation?.apyPercent;
    if (
      !observation ||
      typeof observed !== 'number' ||
      !Number.isFinite(observed) ||
      isRefusedForCurrentFacingUse(observation.stamp, now)
    ) {
      return { displayable: false, reason: 'MISSING_REQUIRED_RATE' };
    }
    total = total.plus(new Decimal(observed).mul(leg.weightPercent).div(100));
  }
  return { displayable: true, apy: total };
}
