import Decimal from 'decimal.js';
import {
  currentFacingTimeState,
  legRequiresCurrentRate,
  strategyProvenance,
  type CurrentFacingTimeState,
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
 * The rate line a strategy shows, by the rate's ORIGIN and its AGE (`5.814`).
 *
 * Origin and time are separate axes (architecture 2026-09-17 §4): the origin
 * comes from `strategyProvenance(...).apyProvenance` (`5.402`, `5.440`), the age
 * from `currentFacingTimeState`. Before `5.814` the label read the origin alone,
 * so every live rate said "current" although the Practice reference policy never
 * allows CURRENT — every live rate is DELAYED (DATA_VINTAGE_POLICY P-7: "a
 * DELAYED or STALE rate must be shown as such, never as current").
 *
 * ```text
 * live  · every live leg CURRENT        -> CURRENT        (no policy allows it today)
 * live  · worst DELAYED                 -> RECENT         dated by the stamp's date
 * live  · worst STALE · dates agree     -> STALE          dated
 * live  · worst STALE · dates differ    -> PARTLY_STALE   undated: a stale part is
 *                                                         never dated by its freshest leg
 * mixed · worst live CURRENT or DELAYED -> MIXED_RECENT   dated (its live part)
 * mixed · worst live STALE              -> MIXED_STALE
 * fixture                               -> REFERENCE      the stamp carries its date
 * ```
 *
 * Documented (fixture) legs never carry age wording: their own date is in the
 * stamp, and "reference values" already denies currency.
 */
export type RateLineKind =
  'CURRENT' | 'RECENT' | 'STALE' | 'PARTLY_STALE' | 'MIXED_RECENT' | 'MIXED_STALE' | 'REFERENCE';

/** The age of a live leg that may be shown (a MISSING leg makes the rate not displayable). */
export type LiveRateState = Exclude<CurrentFacingTimeState, 'MISSING'>;

export type RateLineInput =
  | { readonly origin: 'fixture' }
  | {
      readonly origin: 'live' | 'mixed';
      /** Non-empty: a live or mixed origin has at least one live leg. */
      readonly liveStates: readonly [LiveRateState, ...LiveRateState[]];
      /** Whether every live leg carries the same `asOf` (one fetch stamps them all today). */
      readonly liveDatesAgree: boolean;
    };

/** The message id per kind — literal, so the catalogues and `composedIds` can see them. */
export const RATE_LINE_IDS = {
  CURRENT: 'goalNew.apyNow',
  RECENT: 'goalNew.apyRecent',
  STALE: 'goalNew.apyStale',
  PARTLY_STALE: 'goalNew.apyPartlyStale',
  MIXED_RECENT: 'goalNew.apyMixedRecent',
  MIXED_STALE: 'goalNew.apyMixedStale',
  REFERENCE: 'goalNew.apyNowFixture',
} as const satisfies Record<RateLineKind, string>;

/** The kinds whose message carries a `{date}` — pinned against the catalogues by a test. */
export const DATED_RATE_LINE_KINDS = ['RECENT', 'STALE', 'MIXED_RECENT'] as const;
type DatedKind = (typeof DATED_RATE_LINE_KINDS)[number];
const isDated = (kind: RateLineKind): kind is DatedKind =>
  (DATED_RATE_LINE_KINDS as readonly RateLineKind[]).includes(kind);

/** Worst first: one STALE leg makes the whole rate STALE. */
function worstOf(states: readonly LiveRateState[]): LiveRateState {
  if (states.includes('STALE')) return 'STALE';
  if (states.includes('DELAYED')) return 'DELAYED';
  return 'CURRENT';
}

/** Pure and exhaustive: the one place a rate line's kind is decided. */
export function rateLineKind(input: RateLineInput): RateLineKind {
  if (input.origin === 'fixture') return 'REFERENCE';
  const worst = worstOf(input.liveStates);
  if (input.origin === 'mixed') return worst === 'STALE' ? 'MIXED_STALE' : 'MIXED_RECENT';
  if (worst === 'CURRENT') return 'CURRENT';
  if (worst === 'DELAYED') return 'RECENT';
  return input.liveDatesAgree ? 'STALE' : 'PARTLY_STALE';
}

/**
 * The words that travel WITH the number (CAT-2): a rate without its label, or a
 * label without its rate, is not representable. `asOf` is the raw timestamp the
 * component formats in the reader's locale — a string exactly for the kinds whose
 * message carries `{date}`, null for the others, so a dated line without its date
 * is not representable either.
 */
export type RateLineLabel =
  | {
      readonly kind: DatedKind;
      readonly id: (typeof RATE_LINE_IDS)[DatedKind];
      readonly asOf: string;
    }
  | {
      readonly kind: Exclude<RateLineKind, DatedKind>;
      readonly id: (typeof RATE_LINE_IDS)[Exclude<RateLineKind, DatedKind>];
      readonly asOf: null;
    };

/**
 * Whether a strategy has a displayable pool rate, what it is, and what its line says.
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
 * no code path that yields a number for a strategy that must show none, and
 * (`5.814`) none that yields a number without the line that states its age.
 *
 * Strategy's ruling: the pool rate is an APY-SPECIFIC SECONDARY representation,
 * never a universal whole-strategy return metric.
 *
 * ```text
 * PURE ACCRUAL + every required rate valid  -> displayable, unchanged to the cent
 *   where VALID means present, finite AND inside the current-facing vintage
 *   (every leg aged once, documented legs included)
 * HETEROGENEOUS (any market leg)            -> OMITTED — a market leg's return is
 *                                              its price, and no blend of rates
 *                                              can describe it
 * MISSING a REQUIRED accrual rate           -> WITHHELD, never zero-filled
 * NO rate-owing leg at all                  -> WITHHELD, never a 0% line
 * ```
 *
 * The legs are read in one pass, in allocation order, as before `5.814`, so which
 * refusal wins is unchanged. Renormalising over the accrual legs is explicitly
 * refused: it would silently change what the number MEANS while leaving its
 * label identical.
 */
export type StrategyRateDisplay =
  | { readonly displayable: true; readonly apy: Decimal; readonly label: RateLineLabel }
  | { readonly displayable: false; readonly reason: 'HETEROGENEOUS' | 'MISSING_REQUIRED_RATE' };

const WITHHELD = { displayable: false, reason: 'MISSING_REQUIRED_RATE' } as const;

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
  const aged = new Map<ProtocolId, { state: LiveRateState; asOf: string }>();
  for (const leg of strategy.allocation) {
    /* Asked of the leg's own economics, never of its id. */
    if (!legRequiresCurrentRate(leg.protocolId)) {
      return { displayable: false, reason: 'HETEROGENEOUS' };
    }
    const observation = byId.get(leg.protocolId);
    const observed = observation?.apyPercent;
    if (!observation || typeof observed !== 'number' || !Number.isFinite(observed)) {
      return WITHHELD;
    }
    /* Aged ONCE, under the leg's own source policy; the refusal is read from
       the same state, so the age shown and the refusal cannot disagree. */
    const state = currentFacingTimeState(observation.stamp, now);
    if (state === 'MISSING') return WITHHELD;
    aged.set(leg.protocolId, { state, asOf: observation.stamp.asOf });
    total = total.plus(new Decimal(observed).mul(leg.weightPercent).div(100));
  }
  if (aged.size === 0) return WITHHELD;

  /* ORIGIN from the provenance path only: the live legs are exactly those it
     did not list as documented — no second liveness test here. */
  const provenance = strategyProvenance(strategy, apys);
  const documented = new Set<string>(provenance.fixtureProtocolIds);
  const live = [...aged].filter(([id]) => !documented.has(id)).map(([, leg]) => leg);
  let input: RateLineInput;
  if (provenance.apyProvenance === 'fixture') {
    input = { origin: 'fixture' };
  } else {
    const [first, ...rest] = live;
    if (!first) return WITHHELD;
    input = {
      origin: provenance.apyProvenance,
      liveStates: [first.state, ...rest.map((leg) => leg.state)],
      liveDatesAgree: rest.every((leg) => leg.asOf === first.asOf),
    };
  }
  const kind = rateLineKind(input);
  if (!isDated(kind)) {
    return { displayable: true, apy: total, label: { kind, id: RATE_LINE_IDS[kind], asOf: null } };
  }
  /* The line's date is the stamp's date (P-7: "the stamp shown is the newest
     leg's"), so one rate never shows two dates on one screen. A dated line with
     no date to state is withheld, never rendered with a raw placeholder. */
  const asOf = provenance.newestLiveAsOf;
  if (asOf === null) return WITHHELD;
  return { displayable: true, apy: total, label: { kind, id: RATE_LINE_IDS[kind], asOf } };
}
