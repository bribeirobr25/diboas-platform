/**
 * ⛑ LEDGER-CHAR-1 · row 9, `advanceTime` (plan P12 §4.1, D12: moved alone, last, in PR-3).
 *
 * Every history is LITERAL-dated (never the defi fixture calendar, which reads the real clock:
 * `fixtures.ts:153`), and one crosses Berlin's daylight-saving change on 2026-10-25, since the
 * epoch arithmetic at `journey.ts:478-480` runs on the history's dates.
 */
import type { ProtocolApyHistory, ProtocolPriceHistory } from '@diboas/defi';
import { HISTORY_SETTLE_DAYS_MAX } from '@/lib/market/historyWindow';
import type { CaseDef } from '../harness';
import { history } from '../seed';

const STAMP = {
  source: 'fixture',
  origin: 'MODELLED',
  asOf: '2026-12-31',
  observedAt: null,
  fallbackUsed: false,
  fixtureVersion: 'characterization-1',
} as const;

const day = (start: string, i: number) => {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + i);
  return d.toISOString().slice(0, 10);
};

function apy(protocolId: string, start: string, days: number, base = 5): ProtocolApyHistory {
  return {
    protocolId: protocolId as never,
    points: Array.from({ length: days }, (_, i) => ({
      date: day(start, i),
      apyPercent: base + (i % 7) * 0.25,
    })),
    stamp: STAMP as never,
  };
}

function price(protocolId: string, start: string, days: number, from = 1): ProtocolPriceHistory {
  return {
    protocolId: protocolId as never,
    // Up and down, so a market leg can fall (the lesson `5.105` exists for).
    points: Array.from({ length: days }, (_, i) => ({
      date: day(start, i),
      priceUsd: from * (1 + 0.01 * Math.sin(i / 3)),
    })),
    stamp: STAMP as never,
  };
}

const live = <T extends { stamp: unknown; protocolId: unknown }>(hs: T[]): T[] =>
  hs.map((h) => ({
    ...h,
    stamp: {
      ...(h.stamp as object),
      source:
        'points' in h &&
        (h as { points: { apyPercent?: number }[] }).points[0]?.apyPercent !== undefined
          ? 'defillama'
          : 'coingecko',
      origin: 'OBSERVED',
      fixtureVersion: null,
    },
  }));
const undated = <T extends { points: { date: string }[] }>(hs: T[]): T[] =>
  hs.map((h) => ({ ...h, points: h.points.map((p) => ({ ...p, date: '' })) }));

const START = '2026-01-01';
const LONG = 420;
const lending = (start = START, days = LONG) => [
  apy('skySsr', start, days),
  apy('aaveV3', start, days, 4),
  apy('compoundV3', start, days, 3),
];
const market = (start = START, days = LONG) => [
  price('sanctumInf', start, days, 1.2),
  price('jupiterJlp', start, days, 4),
];

/** A goal with an open lending position (safeHarbor) and an open market one (stableGrowth). */
const invested = () =>
  history()
    .grant()
    .goal('g1')
    .fund('g1', '4000.00')
    .enterV2('g1', 'p1', '1000.00', 'safeHarbor')
    .enterV2('g1', 'p2', '1000.00', 'stableGrowth');
const withRecurring = () =>
  invested().add('RecurringSet', {
    goalId: 'g1',
    positionId: 'p1',
    monthlyAmount: '100.00',
    startSimDay: 0,
  });

const emitted = { expected: 'emitted' };
const threw = { expected: 'throw' };

const advance = (
  id: string,
  seed: ReturnType<typeof history>,
  days: number,
  source: 'real' | 'machine',
  apyH = lending(),
  priceH = market(),
  label: { expected: string } = emitted
): CaseDef => ({
  id,
  row: 9,
  label,
  seed: seed.get(),
  run: ({ ledger }) => ledger.advanceTime(days, apyH, source, priceH),
});

export const advanceTimeCases: CaseDef[] = [
  advance('advance-machine-30', invested(), 30, 'machine'),
  advance('advance-machine-365', invested(), 365, 'machine'),
  advance('advance-machine-1', invested(), 1, 'machine'),
  advance('advance-machine-0', invested(), 0, 'machine'),
  advance('advance-real-3', invested(), 3, 'real'),
  /* S1b, accepted today: a real settle repeated on the same day (the hook skips < 1 day). */
  advance('advance-accepted-today-real-zero-days', invested().advance(3, 'real'), 0, 'real'),
  advance('advance-real-max-settle-gap', withRecurring(), HISTORY_SETTLE_DAYS_MAX, 'real'),
  advance('advance-no-positions', history().grant().goal('g1'), 30, 'machine'),
  advance('advance-uninitialized', history(), 30, 'machine'),
  advance('advance-recurring-due', withRecurring(), 95, 'machine'),
  advance(
    'advance-recurring-working-short',
    history()
      .grant('150.00')
      .goal('g1')
      .fund('g1', '100.00')
      .enterV2('g1', 'p1', '100.00')
      .add('RecurringSet', {
        goalId: 'g1',
        positionId: 'p1',
        monthlyAmount: '40.00',
        startSimDay: 0,
      }),
    120,
    'machine'
  ),
  advance(
    'advance-paused-goal-schedule-inert',
    withRecurring().add('GoalPaused', { goalId: 'g1', expectedVersion: 0 }),
    95,
    'machine'
  ),
  advance('advance-missing-market-history', invested(), 30, 'machine', lending(), []),
  advance(
    'advance-missing-lending-leg',
    invested(),
    30,
    'machine',
    [apy('skySsr', START, LONG)],
    market()
  ),
  advance(
    'advance-undated-corpus',
    invested(),
    30,
    'machine',
    lending().map((h) => ({ ...h, points: h.points.map((p) => ({ ...p, date: '' })) })),
    []
  ),
  advance(
    'advance-undated-corpus-real',
    invested(),
    30,
    'real',
    lending().map((h) => ({ ...h, points: h.points.map((p) => ({ ...p, date: '' })) })),
    []
  ),
  advance('advance-single-price-point', invested(), 30, 'machine', lending(), [
    price('sanctumInf', START, 1),
    price('jupiterJlp', START, 1),
  ]),
  advance(
    'advance-short-window',
    invested(),
    400,
    'machine',
    lending(START, 60),
    market(START, 60)
  ),
  advance(
    'advance-epoch-pinned',
    invested().add('TimeAdvanced', {
      days: 30,
      source: 'machine',
      replayEpoch: '2026-01-02',
    } as never),
    30,
    'machine'
  ),
  advance('advance-after-real-settle', invested().advance(10, 'real'), 30, 'machine'),
  /* The window crosses Berlin's daylight-saving change on 2026-10-25 (plan §4.1, final check L1). */
  advance(
    'advance-dst-crossing',
    invested(),
    20,
    'machine',
    lending('2026-10-15', 60),
    market('2026-10-15', 60)
  ),
  advance(
    'advance-unknown-strategy-position',
    history().grant().goal('g1').fund('g1', '500.00').enterV2('g1', 'px', '100.00', 'nope'),
    30,
    'machine'
  ),
  /* A schedule whose goal is gone (`journey.ts:498`, the `false` branch): inert, like a paused one. */
  advance(
    'advance-orphan-schedule',
    invested().add('RecurringSet', {
      goalId: 'g-gone',
      positionId: 'p1',
      monthlyAmount: '50.00',
      startSimDay: 0,
    }),
    95,
    'machine'
  ),
  /* Planner branches (plan §4.1, PR-3's bar recorded here, on today's code): */
  advance(
    'advance-two-schedules-same-day',
    invested()
      .add('RecurringSet', {
        goalId: 'g1',
        positionId: 'p2',
        monthlyAmount: '30.00',
        startSimDay: 0,
      })
      .add('RecurringSet', {
        goalId: 'g1',
        positionId: 'p1',
        monthlyAmount: '20.00',
        startSimDay: 0,
      }),
    65,
    'machine'
  ),
  advance(
    'advance-zero-schedule',
    invested().add('RecurringSet', {
      goalId: 'g1',
      positionId: 'p1',
      monthlyAmount: '0.00',
      startSimDay: 0,
    }),
    65,
    'machine'
  ),
  advance('advance-live-sources', invested(), 30, 'machine', live(lending()), live(market())),
  advance(
    'advance-live-lending-only',
    history().grant().goal('g1').fund('g1', '2000.00').enterV2('g1', 'p1', '1000.00', 'safeHarbor'),
    30,
    'machine',
    live(lending()),
    []
  ),
  advance(
    'advance-live-mixed-sources',
    invested(),
    30,
    'machine',
    [...live(lending()).slice(0, 2), lending()[2]!],
    live(market())
  ),
  advance(
    'advance-undated-everything',
    invested(),
    30,
    'machine',
    undated(lending()),
    undated(market())
  ),
  advance(
    'advance-unresolved-strategy-schedule',
    history()
      .grant()
      .goal('g1')
      .fund('g1', '500.00')
      .enterV2('g1', 'px', '100.00', 'nope')
      .add('RecurringSet', {
        goalId: 'g1',
        positionId: 'px',
        monthlyAmount: '10.00',
        startSimDay: 0,
      }),
    65,
    'machine'
  ),
  advance(
    'advance-window-past-history',
    invested().add('TimeAdvanced', {
      days: 50,
      source: 'machine',
      replayEpoch: '2026-01-02',
    } as never),
    30,
    'machine',
    lending(START, 60),
    market(START, 60)
  ),
  advance(
    'advance-real-after-machine-epoch',
    invested().add('TimeAdvanced', {
      days: 30,
      source: 'machine',
      replayEpoch: '2026-01-02',
    } as never),
    12,
    'real'
  ),
  advance(
    'advance-two-schedules-same-day-ordered',
    invested()
      .add('RecurringSet', {
        goalId: 'g1',
        positionId: 'p1',
        monthlyAmount: '20.00',
        startSimDay: 0,
      })
      .add('RecurringSet', {
        goalId: 'g1',
        positionId: 'p2',
        monthlyAmount: '30.00',
        startSimDay: 0,
      }),
    65,
    'machine'
  ),
  advance(
    'advance-live-window-outside-series',
    invested().add('TimeAdvanced', {
      days: 50,
      source: 'machine',
      replayEpoch: '2026-01-02',
    } as never),
    30,
    'machine',
    live(lending(START, 60)),
    live(market(START, 60))
  ),
  advance(
    'advance-no-leg-covers-one-undated',
    invested().add('TimeAdvanced', {
      days: 50,
      source: 'machine',
      replayEpoch: '2026-01-02',
    } as never),
    30,
    'machine',
    lending(START, 60),
    undated(market())
  ),
  advance(
    'advance-v1-position',
    history().grant().goal('g1').fund('g1', '500.00').enterV1('g1', 'p1', '99.50'),
    30,
    'machine'
  ),
  advance('advance-nan-days', invested(), Number.NaN, 'machine', lending(), market(), threw),
  {
    id: 'advance-histories-not-array',
    row: 9,
    label: threw,
    seed: invested().get(),
    run: ({ ledger }) => ledger.advanceTime(30, 'x' as never, 'machine', market()),
  },
  {
    id: 'advance-history-without-points',
    row: 9,
    label: threw,
    seed: invested().get(),
    run: ({ ledger }) =>
      ledger.advanceTime(
        30,
        [{ protocolId: 'skySsr', stamp: STAMP } as never],
        'machine',
        market()
      ),
  },
  {
    id: 'advance-price-history-without-stamp',
    row: 9,
    label: threw,
    seed: invested().get(),
    run: ({ ledger }) =>
      ledger.advanceTime(30, lending(), 'machine', [
        {
          protocolId: 'sanctumInf',
          points: [
            { date: START, priceUsd: 1 },
            { date: day(START, 1), priceUsd: 1.1 },
          ],
        } as never,
      ]),
  },
  {
    id: 'advance-default-source-and-prices',
    row: 9,
    label: emitted,
    seed: invested().get(),
    run: ({ ledger }) => ledger.advanceTime(30, lending()),
  },
  /* A long realistic history: months of deposits, a pause and resume, a refused event, an
     existing replay epoch, then a real advance at the maximum settle gap (plan §4.1). */
  {
    id: 'advance-long-realistic-history',
    row: 9,
    label: emitted,
    seed: withRecurring()
      .add('TimeAdvanced', { days: 60, source: 'machine', replayEpoch: '2026-01-02' } as never)
      .add('GoalPaused', { goalId: 'g1', expectedVersion: 0 })
      .add('GoalPaused', { goalId: 'g1', expectedVersion: 0 })
      .add('GoalResumed', { goalId: 'g1', expectedVersion: 1 })
      .add('RecurringSet', {
        goalId: 'g1',
        positionId: 'p2',
        monthlyAmount: '25.50',
        startSimDay: 60,
      })
      .get(),
    run: ({ ledger }) => ledger.advanceTime(HISTORY_SETTLE_DAYS_MAX, lending(), 'real', market()),
  },
];
