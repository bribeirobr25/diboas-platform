/**
 * E1 — the daily-source ETF-01 route's contracts (2026-10-20), on SYNTHETIC data only.
 *
 * Calendar, universe, normalisation, the private-ledger stability rule, the
 * one-provider-per-window selection, the cross-check, rounding sensitivity,
 * insufficient history → LOW, and the R+10 / R+11 / R+21 freshness boundaries.
 * Not wired into the published score (that is E3), so nothing here reads data.
 *
 * Lives OUTSIDE the weekly workflow's blocking directories: it tests code.
 */
import { describe, expect, it } from 'vitest';
import {
  CalendarCoverageError,
  NYSE_CALENDAR,
  isSession,
  latestFridayBefore,
  sessionsInWeek,
} from '../../../../scripts/market-refresh/etf-daily/calendar.mjs';
import {
  ETF_UNIVERSE,
  requiredFunds,
} from '../../../../scripts/market-refresh/etf-daily/universe.mjs';
import {
  normalizeCryptoEtf,
  normalizeSosoValue,
} from '../../../../scripts/market-refresh/etf-daily/providers.mjs';
import {
  indexLedger,
  ledgerRowProblems,
  stableValue,
} from '../../../../scripts/market-refresh/etf-daily/ledger.mjs';
import {
  decideEtf01,
  etf01Outcome,
  freshnessFromReference,
  isPastDeadline,
  roundingSensitivity,
} from '../../../../scripts/market-refresh/etf-daily/window.mjs';
import { SPOT_BTC_ETFS } from '../../../../scripts/market-refresh/providers/polygon.mjs';

type Provider = 'cryptoetf' | 'sosovalue';
type Row = Record<string, unknown>;

/** Monday 05:30 UTC, the information cutoff; the window ends Friday 2026-10-16. */
const CUTOFF = Date.parse('2026-10-19T05:30:00Z');
const FRIDAYS = ['2026-09-25', '2026-10-02', '2026-10-09', '2026-10-16'];
const H = 3_600_000;

function row(
  provider: Provider,
  session: string,
  ticker: string,
  value: number | null,
  at: number,
  kind = 'pull'
): Row {
  return {
    schema: 1,
    provider,
    session,
    ticker,
    net_flow_usd: value,
    retrieved_at: new Date(at).toISOString(),
    attempt_id: `a-${at}`,
    response_sha256: 'f'.repeat(64),
    kind,
    universe_version: ETF_UNIVERSE.version,
  };
}

/**
 * A provider's ledger for the given weekly nets (null = week absent): each
 * week's net sits on IBIT's first session, every other fund-day is 0, and
 * every value is retrieved twice, 28 h and 2 h before the cutoff (stable).
 */
function ledger(
  provider: Provider,
  nets: (number | null)[],
  {
    fridays = FRIDAYS,
    override = {} as Record<string, number | null | 'absent'>,
    times = [CUTOFF - 28 * H, CUTOFF - 2 * H],
  } = {}
): Row[] {
  const rows: Row[] = [];
  fridays.forEach((friday, i) => {
    if (nets[i] === null) return;
    sessionsInWeek(friday).forEach((session, s) => {
      for (const ticker of requiredFunds(session)) {
        const key = `${session}|${ticker}`;
        const o = override[key];
        if (o === 'absent') continue;
        const v = o !== undefined ? o : s === 0 && ticker === 'IBIT' ? (nets[i] as number) : 0;
        for (const t of times) rows.push(row(provider, session, ticker, v, t));
      }
    });
  });
  return rows;
}

describe('calendar — expected sessions come from the published exchange calendar', () => {
  it('should treat a holiday Friday as no session and keep the rest of the week', () => {
    expect(isSession('2026-04-03')).toBe(false); // Good Friday
    expect(sessionsInWeek('2026-04-03')).toEqual([
      '2026-03-30',
      '2026-03-31',
      '2026-04-01',
      '2026-04-02',
    ]);
  });

  it('should treat full closures as no session and early closes as sessions', () => {
    expect(isSession('2026-11-26')).toBe(false); // Thanksgiving
    expect(isSession('2026-11-27')).toBe(true); // early close is still a session
    expect(isSession('2027-12-24')).toBe(false); // Christmas observed
    expect(isSession('2026-10-17')).toBe(false); // Saturday
  });

  it('should fail closed outside the covered years and on malformed days', () => {
    expect(() => isSession('2025-12-31')).toThrow(CalendarCoverageError);
    expect(() => isSession('2029-01-02')).toThrow(CalendarCoverageError);
    expect(() => isSession('2026-02-30')).toThrow(/not a real calendar day/);
    expect(NYSE_CALENDAR.coverage).toEqual({ from: '2026-01-01', to: '2028-12-31' });
  });

  it('should take the latest Friday strictly before the cutoff day', () => {
    expect(latestFridayBefore(Date.parse('2026-10-19T05:30:00Z'))).toBe('2026-10-16');
    expect(latestFridayBefore(Date.parse('2026-10-16T23:00:00Z'))).toBe('2026-10-09');
    expect(latestFridayBefore(Date.parse('2026-10-17T01:00:00Z'))).toBe('2026-10-16');
  });
});

describe('universe — explicit, versioned, membership by date', () => {
  it('should hold the share-count route’s eleven funds plus MSBT', () => {
    const tickers = ETF_UNIVERSE.funds.map((f) => f.ticker);
    expect([...tickers].sort()).toEqual([...SPOT_BTC_ETFS, 'MSBT'].sort());
    expect(Object.isFrozen(ETF_UNIVERSE.funds)).toBe(true);
  });

  it('should require MSBT only from its listing day', () => {
    expect(requiredFunds('2026-04-07')).not.toContain('MSBT');
    expect(requiredFunds('2026-04-08')).toContain('MSBT');
    expect(requiredFunds('2026-10-16')).toHaveLength(12);
  });
});

describe('normalisation — units, pending values and bad rows', () => {
  it('should convert CryptoETF millions to whole dollars and keep a missing value pending', () => {
    const { rows, problems } = normalizeCryptoEtf({
      days: [
        {
          date: '2026-10-15',
          funds: [
            { ticker: 'IBIT', netFlowUsdM: -110.9 },
            { ticker: 'FBTC', netFlowUsdM: null },
          ],
        },
      ],
    });
    expect(rows).toEqual([
      { session: '2026-10-15', ticker: 'IBIT', netFlowUsd: -110_900_000 },
      { session: '2026-10-15', ticker: 'FBTC', netFlowUsd: null },
    ]);
    expect(problems).toEqual([]);
  });

  it('should drop weekend rows, duplicates and non-finite values, and report each', () => {
    const { rows, problems } = normalizeCryptoEtf({
      days: [
        { date: '2026-10-17', funds: [{ ticker: 'IBIT', netFlowUsdM: 0 }] }, // Saturday "0"
        {
          date: '2026-10-15',
          funds: [
            { ticker: 'IBIT', netFlowUsdM: 1 },
            { ticker: 'IBIT', netFlowUsdM: 2 },
          ],
        },
        { date: '2026-10-15', funds: [{ ticker: 'FBTC', netFlowUsdM: '3' }] },
      ],
    });
    expect(rows).toEqual([]);
    expect(problems.map((p: { kind: string }) => p.kind).sort()).toEqual([
      'duplicate',
      'non-finite',
      'non-session',
    ]);
  });

  it('should read SoSoValue in dollars, keep null pending, and refuse a wrong ticker or a failed response', () => {
    const ok = normalizeSosoValue('IBIT', {
      code: 0,
      data: [
        { date: '2026-10-16', ticker: 'IBIT', net_inflow: null },
        { date: '2026-10-15', ticker: 'IBIT', net_inflow: 526595998.025 },
        { date: '2026-10-14', ticker: 'FBTC', net_inflow: 1 },
      ],
    });
    expect(ok.rows).toEqual([
      { session: '2026-10-16', ticker: 'IBIT', netFlowUsd: null },
      { session: '2026-10-15', ticker: 'IBIT', netFlowUsd: 526595998 },
    ]);
    expect(ok.problems).toEqual([{ kind: 'wrong-ticker', session: '2026-10-14', ticker: 'FBTC' }]);
    expect(normalizeSosoValue('IBIT', { code: 40001, data: [] }).problems).toEqual([
      { kind: 'bad-payload', ticker: 'IBIT' },
    ]);
  });
});

describe('ledger — "stable in the observations made", never proof', () => {
  const at = (h: number) => CUTOFF - h * H;
  const status = (rows: Row[]) =>
    stableValue(indexLedger(rows, CUTOFF), 'cryptoetf', '2026-10-16', 'IBIT');

  it('should not accept a one-off import on its own', () => {
    expect(status([row('cryptoetf', '2026-10-16', 'IBIT', 5, at(30), 'import')])).toEqual({
      status: 'single-observation',
    });
  });

  it('should accept two equal retrievals at least 12 hours apart', () => {
    const rows = [
      row('cryptoetf', '2026-10-16', 'IBIT', 5, at(30), 'import'),
      row('cryptoetf', '2026-10-16', 'IBIT', 5, at(18)),
    ];
    expect(status(rows)).toEqual({ status: 'stable', value: 5 });
  });

  it('should not accept equal retrievals less than 12 hours apart', () => {
    const rows = [
      row('cryptoetf', '2026-10-16', 'IBIT', 5, at(8)),
      row('cryptoetf', '2026-10-16', 'IBIT', 5, at(1)),
    ];
    expect(status(rows)).toEqual({ status: 'too-close' });
  });

  it('should not accept a value that changed recently, even back to an earlier value', () => {
    const rows = [
      row('cryptoetf', '2026-10-16', 'IBIT', 5, at(40)),
      row('cryptoetf', '2026-10-16', 'IBIT', 7, at(20)),
      row('cryptoetf', '2026-10-16', 'IBIT', 5, at(1)),
    ];
    expect(status(rows)).toEqual({ status: 'changing' });
  });

  it('should keep a null latest value pending, never zero', () => {
    const rows = [
      row('cryptoetf', '2026-10-16', 'IBIT', 5, at(30)),
      row('cryptoetf', '2026-10-16', 'IBIT', null, at(1)),
    ];
    expect(status(rows)).toEqual({ status: 'pending' });
  });

  it('should ignore retrievals after the cutoff, so a published cycle stays reproducible', () => {
    const rows = [
      row('cryptoetf', '2026-10-16', 'IBIT', 5, at(30)),
      row('cryptoetf', '2026-10-16', 'IBIT', 5, at(2)),
      row('cryptoetf', '2026-10-16', 'IBIT', 9, CUTOFF + H), // a later revision
    ];
    expect(status(rows)).toEqual({ status: 'stable', value: 5 });
  });

  it('should ignore invalid rows', () => {
    const bad = { ...row('cryptoetf', '2026-10-16', 'IBIT', 5.5, at(30)) };
    expect(ledgerRowProblems(bad)).toEqual(['net_flow_usd']);
    expect(status([bad, row('cryptoetf', '2026-10-16', 'IBIT', 5, at(2))])).toEqual({
      status: 'single-observation',
    });
  });
});

describe('decision — insufficient or unreadable history is LOW, never adverse, never re-dated', () => {
  it('should give LOW with no dates for an empty ledger', () => {
    const d = decideEtf01({ cutoffMs: CUTOFF, rows: [] });
    expect(d).toMatchObject({
      state: 'UNAVAILABLE',
      points: 0,
      reason: 'insufficient-history',
      confidenceEffect: 'LOW',
      reference_week_end: null,
      stale_after: null,
    });
  });

  it('should give LOW when only partial records exist (one fund-day missing)', () => {
    const rows = ledger('cryptoetf', [1, 1, 1, 1], { override: { '2026-10-14|BRRR': 'absent' } });
    const d = decideEtf01({ cutoffMs: CUTOFF, rows });
    expect(d).toMatchObject({ reason: 'insufficient-history', confidenceEffect: 'LOW' });
    expect(d.problems?.cryptoetf).toEqual([
      { session: '2026-10-14', ticker: 'BRRR', status: 'missing' },
    ]);
  });

  it.each([1, 2, 3])('should give LOW with only %i complete week(s)', (n) => {
    const nets = [1e8, 1e8, 1e8, 1e8].map((v, i) => (i >= 4 - n ? v : null));
    expect(decideEtf01({ cutoffMs: CUTOFF, rows: ledger('cryptoetf', nets) }).reason).toBe(
      'insufficient-history'
    );
  });

  it('should keep only the last verified reference when the ledger cannot be read, without renewing it', () => {
    const d = decideEtf01({ cutoffMs: CUTOFF, rows: null, lastVerifiedReference: '2026-09-25' });
    expect(d).toMatchObject({
      reason: 'history-unreadable',
      confidenceEffect: 'LOW',
      reference_week_end: '2026-09-25',
      stale_after: '2026-10-16T00:00:00.000Z',
    });
    expect(isPastDeadline(CUTOFF, d.stale_after)).toBe(true); // aged, not renewed
    expect(decideEtf01({ cutoffMs: CUTOFF, rows: null }).reference_week_end).toBeNull();
  });

  it('should not renew any date from repeated partial collection', () => {
    const partial = ledger('cryptoetf', [1, 1, 1, 1], {
      override: { '2026-10-16|IBIT': 'absent' },
      times: [CUTOFF - 50 * H, CUTOFF - 26 * H, CUTOFF - 2 * H],
    });
    const d = decideEtf01({ cutoffMs: CUTOFF, rows: partial });
    expect(d).toMatchObject({
      confidenceEffect: 'LOW',
      reference_week_end: null,
      expected_update_at: null,
    });
  });

  it('should treat a fund missing from one provider as making that window ineligible, never as a removed fund', () => {
    const rows = ledger('cryptoetf', [1e8, 1e8, 1e8, 1e8], {
      override: Object.fromEntries(
        FRIDAYS.flatMap((f) => sessionsInWeek(f)).map((s) => [`${s}|MSBT`, 'absent'])
      ),
    });
    expect(decideEtf01({ cutoffMs: CUTOFF, rows }).reason).toBe('insufficient-history');
  });
});

describe('decision — one provider for the whole window, disclosed', () => {
  it('should use the primary for exactly four eligible weeks and set R to the last Friday', () => {
    const d = decideEtf01({ cutoffMs: CUTOFF, rows: ledger('cryptoetf', [1e8, -1e8, 1e8, 1e8]) });
    expect(d).toMatchObject({
      state: 'ACTIVE',
      points: 2,
      selected: 'cryptoetf',
      crossCheck: 'unavailable',
      positives: 3,
      reference_week_end: '2026-10-16',
      confidenceEffect: null,
    });
  });

  it('should use the backup as a whole window when the primary is not eligible', () => {
    const rows = [
      ...ledger('cryptoetf', [1e8, 1e8, 1e8, null]),
      ...ledger('sosovalue', [1e8, 1e8, -1e8, -1e8]),
    ];
    expect(decideEtf01({ cutoffMs: CUTOFF, rows })).toMatchObject({
      selected: 'sosovalue',
      crossCheck: 'unavailable',
      state: 'INACTIVE',
    });
  });

  it('should report "agreed" only when both were compared and nothing was flagged', () => {
    const rows = [
      ...ledger('cryptoetf', [1e8, 1e8, 1e8, -1e8]),
      ...ledger('sosovalue', [1e8, 1e8, 1e8, -1e8]),
    ];
    expect(decideEtf01({ cutoffMs: CUTOFF, rows })).toMatchObject({
      crossCheck: 'agreed',
      holdForReview: false,
    });
  });

  it('should count a week of exactly zero as not positive (the unchanged > 0 rule)', () => {
    expect(
      etf01Outcome([{ netUsd: 0 }, { netUsd: 1 }, { netUsd: 1 }, { netUsd: 1 }] as never)
    ).toEqual({
      positives: 3,
      state: 'ACTIVE',
    });
    expect(
      etf01Outcome([{ netUsd: 0 }, { netUsd: 0 }, { netUsd: 1 }, { netUsd: 1 }] as never).state
    ).toBe('INACTIVE');
  });
});

describe('decision — disagreement between providers', () => {
  it('should make ETF-01 UNAVAILABLE and hold the PR when the result differs between providers', () => {
    const rows = [
      ...ledger('cryptoetf', [1e8, 1e8, 1e8, -1e8]),
      ...ledger('sosovalue', [1e8, 1e8, -1e8, -1e8]),
    ];
    const d = decideEtf01({ cutoffMs: CUTOFF, rows });
    expect(d).toMatchObject({
      state: 'UNAVAILABLE',
      reason: 'provider-disagreement',
      holdForReview: true,
      confidenceEffect: null,
    });
    expect(d.comparison?.weekFlags.map((w: { reason: string }) => w.reason)).toEqual(['sign']);
  });

  it('should publish from the primary but hold the PR when a week differs in magnitude only', () => {
    const rows = [
      ...ledger('cryptoetf', [1e8, 1e8, 1e8, -1e8]),
      ...ledger('sosovalue', [1e8, 1.1e8, 1e8, -1e8]),
    ];
    const d = decideEtf01({ cutoffMs: CUTOFF, rows });
    expect(d).toMatchObject({
      state: 'ACTIVE',
      selected: 'cryptoetf',
      crossCheck: 'flagged',
      holdForReview: true,
    });
    expect(d.comparison?.weekFlags).toEqual([
      { friday: '2026-10-02', reason: 'magnitude', primaryUsd: 1e8, secondaryUsd: 1.1e8 },
    ]);
  });

  it('should flag opposing fund-day errors even when they cancel in the weekly net', () => {
    const swap = { '2026-10-13|FBTC': 3_000_000, '2026-10-13|ARKB': -3_000_000 };
    const rows = [
      ...ledger('cryptoetf', [1e8, 1e8, 1e8, -1e8]),
      ...ledger('sosovalue', [1e8, 1e8, 1e8, -1e8], { override: swap }),
    ];
    const d = decideEtf01({ cutoffMs: CUTOFF, rows });
    expect(d.comparison?.weekFlags).toEqual([]);
    expect(d.comparison?.fundDayFlags.map((f: { ticker: string }) => f.ticker).sort()).toEqual([
      'ARKB',
      'FBTC',
    ]);
    expect(d).toMatchObject({ crossCheck: 'flagged', holdForReview: true });
  });

  it('should not flag a difference that the declared rounding explains', () => {
    const rows = [
      ...ledger('cryptoetf', [1e8, 1e8, 1e8, -1e8], { override: { '2026-10-13|FBTC': 100_000 } }),
      ...ledger('sosovalue', [1e8, 1e8, 1e8, -1e8], { override: { '2026-10-13|FBTC': 140_000 } }),
    ];
    expect(decideEtf01({ cutoffMs: CUTOFF, rows }).crossCheck).toBe('agreed');
  });
});

describe('decision — a near-zero week is reported, the > 0 rule is not changed', () => {
  it('should hold for review when a week inside its rounding bound could flip the result', () => {
    // Week 4 net +US$100,000 with 60 CryptoETF fund-days: inside ±US$3 M.
    const d = decideEtf01({
      cutoffMs: CUTOFF,
      rows: ledger('cryptoetf', [1e8, -1e8, 1e8, 100_000]),
    });
    expect(d).toMatchObject({ state: 'ACTIVE', positives: 3, holdForReview: true });
    expect(d.sensitivity).toEqual({ uncertainWeeks: ['2026-10-16'], robust: false });
  });

  it('should not hold when the uncertain week cannot change the result', () => {
    const d = decideEtf01({
      cutoffMs: CUTOFF,
      rows: ledger('cryptoetf', [1e8, 1e8, 1e8, 100_000]),
    });
    expect(d.sensitivity).toEqual({ uncertainWeeks: ['2026-10-16'], robust: true });
    expect(d.holdForReview).toBe(false);
  });

  it('should compute the bound from the declared rounding of the values used', () => {
    const w = (netUsd: number, roundingBoundUsd: number) => ({
      friday: 'x',
      netUsd,
      roundingBoundUsd,
    });
    expect(roundingSensitivity([w(5, 10), w(1e8, 10), w(1e8, 10), w(-1e8, 10)] as never)).toEqual({
      uncertainWeeks: ['x'],
      robust: false,
    });
  });
});

describe('decision — a holiday Friday and a listing inside the window', () => {
  const CUTOFF_APRIL = Date.parse('2026-04-13T05:30:00Z'); // window Fridays 03-20 .. 04-10
  const APRIL = ['2026-03-20', '2026-03-27', '2026-04-03', '2026-04-10'];

  it('should keep a holiday Friday as R’s week without inventing a Friday session', () => {
    const d = decideEtf01({
      cutoffMs: Date.parse('2026-04-06T05:30:00Z'),
      rows: ledger('cryptoetf', [1e8, 1e8, 1e8, 1e8], {
        fridays: ['2026-03-13', '2026-03-20', '2026-03-27', '2026-04-03'],
        times: [Date.parse('2026-04-05T00:00:00Z'), Date.parse('2026-04-06T04:00:00Z')],
      }),
    });
    expect(d.reference_week_end).toBe('2026-04-03');
    expect(d.weeks?.[3].sessions).toEqual(['2026-03-30', '2026-03-31', '2026-04-01', '2026-04-02']);
  });

  it('should require MSBT only on the sessions after it listed', () => {
    const times = [CUTOFF_APRIL - 28 * H, CUTOFF_APRIL - 2 * H];
    const ok = ledger('cryptoetf', [1e8, 1e8, 1e8, 1e8], { fridays: APRIL, times });
    expect(decideEtf01({ cutoffMs: CUTOFF_APRIL, rows: ok }).selected).toBe('cryptoetf');
    const missing = ledger('cryptoetf', [1e8, 1e8, 1e8, 1e8], {
      fridays: APRIL,
      times,
      override: { '2026-04-09|MSBT': 'absent' },
    });
    expect(decideEtf01({ cutoffMs: CUTOFF_APRIL, rows: missing }).reason).toBe(
      'insufficient-history'
    );
  });
});

describe('decision — a window the calendar does not cover', () => {
  it('should be UNAVAILABLE and held, never throw (a throw would stop the whole weekly run)', () => {
    const d = decideEtf01({ cutoffMs: Date.parse('2029-01-08T05:30:00Z'), rows: [] });
    expect(d).toMatchObject({
      state: 'UNAVAILABLE',
      points: 0,
      reason: 'calendar-not-covering',
      calendarGap: '2029-01-01',
      holdForReview: true,
      confidenceEffect: null,
      reference_week_end: null,
    });
  });

  it('should still throw an error that is not a calendar gap (it is not swallowed)', () => {
    // The cutoff is valid, so only the ledger read can fail: a swallowing
    // handler would return 'calendar-not-covering' here instead of throwing.
    const unreadable = {
      [Symbol.iterator]() {
        throw new Error('synthetic ledger failure');
      },
    } as unknown as Record<string, unknown>[];
    expect(() => decideEtf01({ cutoffMs: CUTOFF, rows: unreadable })).toThrow(
      'synthetic ledger failure'
    );
  });
});

describe('freshness — R + 10 / R + 11 / R + 21 at 00:00 UTC, compared strictly', () => {
  const f = freshnessFromReference('2026-10-16');

  it('should derive the three instants from the calendar Friday', () => {
    expect(f).toEqual({
      reference_week_end: '2026-10-16',
      expected_update_at: '2026-10-26T00:00:00.000Z',
      delayed_after: '2026-10-27T00:00:00.000Z',
      stale_after: '2026-11-06T00:00:00.000Z',
    });
  });

  it.each([
    ['delayed_after', '2026-10-27T00:00:00.000Z'],
    ['stale_after', '2026-11-06T00:00:00.000Z'],
  ])('should not be past %s at the instant, and be past 1 ms later', (_name, instant) => {
    const t = Date.parse(instant);
    expect(isPastDeadline(t - 1, instant)).toBe(false);
    expect(isPastDeadline(t, instant)).toBe(false);
    expect(isPastDeadline(t + 1, instant)).toBe(true);
  });

  it('should never be past a missing deadline', () => {
    expect(isPastDeadline(CUTOFF, null as never)).toBe(false);
  });
});
