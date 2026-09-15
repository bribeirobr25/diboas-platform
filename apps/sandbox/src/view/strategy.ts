import type { AllocationLeg, ProtocolApyHistory, ProtocolId } from '@diboas/defi';
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
