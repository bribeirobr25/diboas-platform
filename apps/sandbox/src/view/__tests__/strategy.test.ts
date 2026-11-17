import { describe, expect, it } from 'vitest';
import { blendDatedSeries } from '@diboas/investing';
import { FIXTURE_STAMP, getStrategy, observedStamp } from '@diboas/defi';
import type {
  AllocationLeg,
  DataStamp,
  ProtocolApy,
  ProtocolApyHistory,
  ProtocolId,
} from '@diboas/defi';
import {
  isArgumentElement,
  isDateElement,
  isNumberElement,
  isPluralElement,
  isSelectElement,
  isTagElement,
  parse,
  type MessageFormatElement,
} from '@formatjs/icu-messageformat-parser';
import { SANDBOX_LOCALES } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';
import {
  CHART_TIMEFRAMES,
  DATED_RATE_LINE_KINDS,
  RATE_LINE_IDS,
  rateLineKind,
  selectStrategyChartSeries,
  strategyRateDisplay,
  type RateLineInput,
  type RateLineKind,
} from '../strategy';

const ALLOC: AllocationLeg[] = [
  { protocolId: 'skySsr', weightPercent: 50 },
  { protocolId: 'aaveV3', weightPercent: 30 },
  { protocolId: 'compoundV3', weightPercent: 20 },
];

function history(protocolId: ProtocolApyHistory['protocolId'], apy: number, days = 120) {
  return {
    protocolId,
    points: Array.from({ length: days }, (_, i) => ({
      date: `2026-0${1 + Math.floor(i / 31)}-${String((i % 31) + 1).padStart(2, '0')}`,
      apyPercent: apy,
    })),
    /* Built, not literal: §8.8 made every provenance field required so no
       construction site can stay silent — test harnesses included. */
    stamp: observedStamp('defillama', '2026-09-14'),
  } satisfies ProtocolApyHistory;
}

const FULL = [history('skySsr', 4), history('aaveV3', 6), history('compoundV3', 10)];

describe('selectStrategyChartSeries', () => {
  it('should blend every leg by its own weight when all history is present', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: FULL,
      requestedTimeframe: 90,
    });
    expect(v.complete).toBe(true);
    expect(v.weightCovered).toBe(100);
    expect(v.missingProtocolIds).toEqual([]);
    // 4*0.5 + 6*0.3 + 10*0.2 = 5.8
    expect(v.series[0].apyPercent).toBeCloseTo(5.8, 10);
  });

  /**
   * The defect this selector exists to prevent, asserted on the DOMAIN function
   * so the class is recorded rather than described: drop the 50% leg and
   * `blendDatedSeries` still returns a confident number — 3.8, not 5.8 — with
   * nothing marking it partial. Rendering that as the strategy's own history is
   * a `MISSING ≠ 0` untruth, so the selector must refuse instead.
   */
  it('should refuse rather than publish the low curve a missing leg produces', () => {
    const partial = [history('aaveV3', 6), history('compoundV3', 10)];

    const raw = blendDatedSeries(
      ALLOC.map((leg) => ({
        weightPercent: leg.weightPercent,
        points: partial.find((h) => h.protocolId === leg.protocolId)?.points ?? [],
      }))
    );
    expect(raw[0].apyPercent).toBeCloseTo(3.8, 10); // silently low, and unmarked

    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: partial,
      requestedTimeframe: 90,
    });
    expect(v.complete).toBe(false);
    expect(v.missingProtocolIds).toEqual(['skySsr']);
    expect(v.weightCovered).toBe(50);
    expect(v.series).toEqual([]);
    expect(v.sparkSeries).toEqual([]);
  });

  it('should treat a leg present but EMPTY as missing, not as zero', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: [{ ...history('skySsr', 4), points: [] }, FULL[1], FULL[2]],
      requestedTimeframe: 90,
    });
    expect(v.complete).toBe(false);
    expect(v.missingProtocolIds).toEqual(['skySsr']);
  });

  it('should never show a timeframe wider than the data can fill', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: [
        history('skySsr', 4, 40),
        history('aaveV3', 6, 40),
        history('compoundV3', 10, 40),
      ],
      requestedTimeframe: 365,
    });
    expect(v.series.length).toBeLessThan(90);
    expect(v.widestFit).toBe(30);
    expect(v.timeframe).toBe(30);
  });

  it('should honour the requested timeframe when history covers it', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: FULL,
      requestedTimeframe: 7,
    });
    expect(v.timeframe).toBe(7);
  });

  it('should fall back to the narrowest timeframe when there is no series at all', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: [],
      requestedTimeframe: 365,
    });
    expect(v.complete).toBe(false);
    expect(v.timeframe).toBe(CHART_TIMEFRAMES[0]);
    expect(v.missingProtocolIds).toEqual(['skySsr', 'aaveV3', 'compoundV3']);
  });

  it('should summarise only the trailing 30 readings in the sparkline', () => {
    const v = selectStrategyChartSeries({
      allocation: ALLOC,
      histories: FULL,
      requestedTimeframe: 90,
    });
    expect(v.sparkSeries).toHaveLength(30);
    expect(v.sparkSeries.every((n) => Math.abs(n - 5.8) < 1e-9)).toBe(true);
  });
});

/**
 * `5.814` · A POOL RATE SAYS HOW OLD IT IS — guard 1 of plan P10.
 *
 * DATA_VINTAGE_POLICY P-7: "a DELAYED or STALE rate must be shown as such,
 * never as current"; handoff 2026-09-12 §8.6: STALE is "explicitly represented
 * as stale/fallback … not described as current market truth". Before `5.814`
 * the line read the ORIGIN alone, so every live rate said "current" although no
 * Practice policy allows CURRENT. These cases pin the kind table on real
 * catalogue strategies and real stamps, never on a stubbed classifier.
 */
describe('5.814 · the rate line follows the rate age as well as its origin', () => {
  const NOW = '2026-11-17T12:00:00.000Z';
  const ago = (hours: number) => new Date(Date.parse(NOW) - hours * 3_600_000).toISOString();
  const DAY = 24;
  const found = getStrategy('safeHarbor'); // three lending legs, every one owes a rate
  if (!found) throw new Error('safeHarbor is in the catalogue');
  const SAFE = found;
  const apyOf = (protocolId: ProtocolId, apyPercent: number, stamp: DataStamp): ProtocolApy => ({
    protocolId,
    apyPercent,
    tvlUsd: null,
    chain: 'Arbitrum',
    stamp,
  });
  const live = (protocolId: ProtocolId, hoursAgo: number, apy = 4) =>
    apyOf(protocolId, apy, observedStamp('defillama', ago(hoursAgo)));
  const documented = (protocolId: ProtocolId, hoursAgo: number, apy = 4) =>
    apyOf(protocolId, apy, { ...FIXTURE_STAMP, asOf: ago(hoursAgo), observedAt: ago(hoursAgo) });
  const legs = SAFE.allocation.map((l) => l.protocolId);
  const show = (apys: ProtocolApy[]) => {
    const d = strategyRateDisplay(SAFE, apys, NOW);
    if (!d.displayable) throw new Error(`expected a displayable rate, got ${d.reason}`);
    return d;
  };

  describe('rateLineKind — the whole table, exhaustively', () => {
    const TABLE = [
      [{ origin: 'fixture' } as const, 'REFERENCE'],
      [
        { origin: 'live', liveStates: ['CURRENT', 'CURRENT'], liveDatesAgree: true } as const,
        'CURRENT',
      ],
      [
        { origin: 'live', liveStates: ['CURRENT', 'DELAYED'], liveDatesAgree: true } as const,
        'RECENT',
      ],
      [
        { origin: 'live', liveStates: ['DELAYED', 'DELAYED'], liveDatesAgree: false } as const,
        'RECENT',
      ],
      [
        { origin: 'live', liveStates: ['DELAYED', 'STALE'], liveDatesAgree: true } as const,
        'STALE',
      ],
      [
        { origin: 'live', liveStates: ['DELAYED', 'STALE'], liveDatesAgree: false } as const,
        'PARTLY_STALE',
      ],
      [{ origin: 'mixed', liveStates: ['CURRENT'], liveDatesAgree: true } as const, 'MIXED_RECENT'],
      [{ origin: 'mixed', liveStates: ['DELAYED'], liveDatesAgree: true } as const, 'MIXED_RECENT'],
      [
        { origin: 'mixed', liveStates: ['DELAYED', 'STALE'], liveDatesAgree: false } as const,
        'MIXED_STALE',
      ],
    ] satisfies [RateLineInput, RateLineKind][];

    it.each(TABLE)('should classify %j as %s', (input, kind) => {
      expect(rateLineKind(input)).toBe(kind);
    });

    it('should cover every kind that has a message', () => {
      /* The table above reaches each kind in RATE_LINE_IDS at least once. */
      const reached = new Set<RateLineKind>(TABLE.map(([input]) => rateLineKind(input)));
      expect([...reached].sort()).toEqual(Object.keys(RATE_LINE_IDS).sort());
    });

    it('should never call a state it does not know current (fail closed)', () => {
      /* A future TimeState member that slipped past the type system reads as
         stale, never as "Current pool rate" — the claim 5.814 removed. */
      const unknown = 'EXPIRED' as unknown as 'CURRENT';
      expect(rateLineKind({ origin: 'live', liveStates: [unknown], liveDatesAgree: true })).toBe(
        'STALE'
      );
      expect(
        rateLineKind({ origin: 'live', liveStates: ['CURRENT', unknown], liveDatesAgree: false })
      ).toBe('PARTLY_STALE');
      expect(rateLineKind({ origin: 'mixed', liveStates: [unknown], liveDatesAgree: true })).toBe(
        'MIXED_STALE'
      );
    });

    it('should say CURRENT only when every live leg is CURRENT', () => {
      /* No policy allows CURRENT today; this proves the kind exists and is
         guarded by the table rather than unreachable code. */
      expect(rateLineKind({ origin: 'live', liveStates: ['CURRENT'], liveDatesAgree: true })).toBe(
        'CURRENT'
      );
    });
  });

  it('should label a 1-hour-old live rate RECENT, dated by the stamp date', () => {
    const d = show(legs.map((id) => live(id, 1)));
    expect(d.label).toEqual({ kind: 'RECENT', id: 'goalNew.apyRecent', asOf: ago(1) });
  });

  it('should never label a live rate current under the Practice policy', () => {
    /* The defect itself: today every live render is DELAYED. */
    for (const hours of [0, 1, 6, 7 * DAY]) {
      expect(show(legs.map((id) => live(id, hours))).label.kind).not.toBe('CURRENT');
    }
  });

  it('should label a 13-day-old live rate STALE, dated', () => {
    const d = show(legs.map((id) => live(id, 13 * DAY)));
    expect(d.label).toEqual({ kind: 'STALE', id: 'goalNew.apyStale', asOf: ago(13 * DAY) });
  });

  it('should drop the date when stale live legs carry different dates (PARTLY_STALE)', () => {
    const d = show([live(legs[0]!, 1), live(legs[1]!, 9 * DAY), live(legs[2]!, 9 * DAY)]);
    expect(d.label).toEqual({ kind: 'PARTLY_STALE', id: 'goalNew.apyPartlyStale', asOf: null });
  });

  it('should date a recent rate with differing live dates by the newest (the stamp date)', () => {
    /* The newest leg is neither first nor last, so "first leg" or "last leg"
       cannot pass for "newest". */
    const d = show([live(legs[0]!, 3 * DAY), live(legs[1]!, 1), live(legs[2]!, 2 * DAY)]);
    expect(d.label).toEqual({ kind: 'RECENT', id: 'goalNew.apyRecent', asOf: ago(1) });
  });

  it('should date a blend by its LIVE part even when a documented leg is newer', () => {
    /* The documented leg's date belongs to the stamp's reference clause; the line
       dates only what was fetched. "Newest of any leg" would say 1 hour here. */
    const d = show([documented(legs[0]!, 1), live(legs[1]!, 3 * DAY), live(legs[2]!, 3 * DAY)]);
    expect(d.label).toEqual({
      kind: 'MIXED_RECENT',
      id: 'goalNew.apyMixedRecent',
      asOf: ago(3 * DAY),
    });
  });

  it('should label a blend with a 1-hour live part MIXED_RECENT, dated by its live part', () => {
    const d = show([
      live(legs[0]!, 1),
      documented(legs[1]!, 2 * DAY),
      documented(legs[2]!, 2 * DAY),
    ]);
    expect(d.label).toEqual({ kind: 'MIXED_RECENT', id: 'goalNew.apyMixedRecent', asOf: ago(1) });
  });

  it('should label a blend whose live part is 9 days old MIXED_STALE, undated', () => {
    const d = show([
      live(legs[0]!, 9 * DAY),
      documented(legs[1]!, 2 * DAY),
      documented(legs[2]!, 2 * DAY),
    ]);
    expect(d.label).toEqual({ kind: 'MIXED_STALE', id: 'goalNew.apyMixedStale', asOf: null });
  });

  it('should take no age wording from a documented leg', () => {
    /* A 9-day-old documented leg beside a fresh live one: the line is RECENT
       for the live part, never STALE because of the reference value. */
    const d = show([live(legs[0]!, 1), live(legs[1]!, 1), documented(legs[2]!, 9 * DAY)]);
    expect(d.label.kind).toBe('MIXED_RECENT');
  });

  it('should WITHHOLD a blend whose documented leg is past 14 days', () => {
    /* Every leg is aged, documented ones included: a blend must not print a
       rate built on a refused value (plan P10 round three). */
    const d = strategyRateDisplay(
      SAFE,
      [live(legs[0]!, 1), live(legs[1]!, 1), documented(legs[2]!, 15 * DAY)],
      NOW
    );
    expect(d).toEqual({ displayable: false, reason: 'MISSING_REQUIRED_RATE' });
  });

  it('should label documented values only REFERENCE, undated (the stamp carries the date)', () => {
    const d = show(legs.map((id) => documented(id, 2 * DAY)));
    expect(d.label).toEqual({ kind: 'REFERENCE', id: 'goalNew.apyNowFixture', asOf: null });
  });

  it('should treat an OBSERVED stamp from another registered source as live', () => {
    /* Origin by `isLiveObservation` (5.440), never by the source name. */
    const d = show(legs.map((id) => apyOf(id, 4, observedStamp('coingecko', ago(1)))));
    expect(d.label.kind).toBe('RECENT');
  });

  it('should WITHHOLD a live rate past 14 days', () => {
    expect(
      strategyRateDisplay(
        SAFE,
        legs.map((id) => live(id, 15 * DAY)),
        NOW
      ).displayable
    ).toBe(false);
  });

  it('should WITHHOLD a strategy with no rate-owing leg rather than show 0%', () => {
    const empty = { ...SAFE, allocation: [] };
    expect(strategyRateDisplay(empty, [], NOW)).toEqual({
      displayable: false,
      reason: 'MISSING_REQUIRED_RATE',
    });
  });

  it('should carry a label on every displayable result and none on a refusal', () => {
    const cases: ProtocolApy[][] = [
      legs.map((id) => live(id, 1)),
      legs.map((id) => live(id, 10 * DAY)),
      legs.map((id) => documented(id, 2 * DAY)),
      legs.map((id) => live(id, 20 * DAY)),
      [],
    ];
    let displayable = 0;
    let refused = 0;
    for (const apys of cases) {
      const d = strategyRateDisplay(SAFE, apys, NOW);
      if (d.displayable) {
        displayable += 1;
        expect(d.label.id).toBe(RATE_LINE_IDS[d.label.kind]);
      } else {
        refused += 1;
        expect(d).not.toHaveProperty('label');
      }
    }
    /* Non-vacuity: both arms were exercised. */
    expect(displayable).toBeGreaterThan(0);
    expect(refused).toBeGreaterThan(0);
  });

  it('should keep the number unchanged to the cent by the label', () => {
    const d = show([live(legs[0]!, 1, 4), live(legs[1]!, 1, 6), live(legs[2]!, 1, 10)]);
    expect(d.apy.toString()).toBe('5.8'); // 4×0.5 + 6×0.3 + 10×0.2
  });
});

/**
 * `5.814` guard 1 · EVERY RATE-LINE ID RESOLVES, WITH EXACTLY ITS PLACEHOLDERS.
 *
 * The view decides which kinds carry a date; the catalogues decide which
 * messages have a `{date}`. If the two disagree, the reader sees a raw
 * "{date}" or a date silently dropped — and the cross-locale parity check
 * cannot see it, because it compares the locales only with each other.
 */
describe('5.814 · each rate line id carries exactly its placeholders, in four locales', () => {
  const argumentsOf = (message: string): string[] => {
    const names = new Set<string>();
    const walk = (elements: MessageFormatElement[]) => {
      for (const el of elements) {
        if (isArgumentElement(el) || isNumberElement(el) || isDateElement(el)) names.add(el.value);
        if (isPluralElement(el) || isSelectElement(el)) {
          names.add(el.value);
          for (const option of Object.values(el.options)) walk(option.value);
        }
        if (isTagElement(el)) walk(el.children);
      }
    };
    walk(parse(message));
    return [...names].sort();
  };

  it.each(SANDBOX_LOCALES)(
    'should match the dated kinds to the {date} messages in %s',
    (locale) => {
      const messages = getMessages(locale);
      let checked = 0;
      for (const [kind, id] of Object.entries(RATE_LINE_IDS) as [RateLineKind, string][]) {
        const message = messages[id];
        expect(message, `${locale}:${id} exists`).toBeDefined();
        const dated = (DATED_RATE_LINE_KINDS as readonly string[]).includes(kind);
        expect(argumentsOf(message!), `${locale}:${id} (${kind})`).toEqual(
          dated ? ['apy', 'date'] : ['apy']
        );
        checked += 1;
      }
      expect(checked).toBe(Object.keys(RATE_LINE_IDS).length);
    }
  );

  /**
   * A stale kind that loses its age wording is the `5.814` defect itself: P-7 says
   * a STALE rate "must be shown as such". Each stale kind ×4 states that it is
   * over a week old and may have changed.
   */
  const STALE_WORDING: Record<string, { age: RegExp; changed: RegExp }> = {
    en: { age: /over a week/, changed: /may have changed/ },
    'pt-BR': { age: /mais de uma semana/, changed: /pode ter mudado/ },
    es: { age: /más de una semana/, changed: /puede haber cambiado/ },
    de: { age: /über einer Woche|älter als eine Woche/, changed: /kann sich geändert haben/ },
  };
  it.each(SANDBOX_LOCALES)('should state the age in every stale kind in %s', (locale) => {
    const messages = getMessages(locale);
    for (const kind of ['STALE', 'PARTLY_STALE', 'MIXED_STALE'] as const) {
      const message = messages[RATE_LINE_IDS[kind]]!;
      expect(message, `${locale}:${kind}`).toMatch(STALE_WORDING[locale]!.age);
      expect(message, `${locale}:${kind}`).toMatch(STALE_WORDING[locale]!.changed);
    }
  });
});
