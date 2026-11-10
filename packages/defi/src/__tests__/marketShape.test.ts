import { describe, expect, it } from 'vitest';
import {
  CHAINS,
  EVIDENCE_ORIGINS,
  FIXTURE_STAMP,
  dataStampIssue,
  datesAreConsecutiveDays,
  datesStrictlyAscending,
  isCalendarDay,
  isStampTime,
} from '../index';
import {
  apyHistoryListIssue,
  gasQuoteListIssue,
  priceHistoryListIssue,
  protocolApyListIssue,
} from '../marketShape';
import { buildHistoricalSeries } from '../historicalEvidence';

/**
 * REQUIREMENTS (`5.353`): the wire-format primitives the market boundary is built from.
 * Dates are checked against the CALENDAR, not their spelling; the series ordering rule is
 * the same one the server's series builder applies; and the real reference stamp — a
 * day-only `asOf` — is a valid stamp, not a malformed one.
 */
describe('market wire-format primitives', () => {
  it('should accept real calendar days and refuse impossible or mis-shaped ones', () => {
    for (const d of ['2026-10-19', '2028-02-29', '2026-12-31', '2026-01-01'])
      expect(isCalendarDay(d), d).toBe(true);
    for (const d of [
      '2026-02-29',
      '2026-02-30',
      '2026-04-31',
      '2026-13-01',
      '2026-00-10',
      '2026-1-01',
      '2026-10-19T00:00:00Z',
      '',
      20261019,
      null,
    ])
      expect(isCalendarDay(d), String(d)).toBe(false);
  });

  it('should accept a day or an ISO timestamp as a stamp time, and refuse anything else', () => {
    for (const t of [
      '2026-07-18',
      '2026-10-19T11:55:00.000Z',
      '2026-10-19T11:55Z',
      '2026-10-19T11:55:00+02:00',
    ])
      expect(isStampTime(t), t).toBe(true);
    for (const t of [
      '2026-02-30T00:00:00Z',
      '2026-10-19T24:00:00Z',
      '2026-10-19T11:60:00Z',
      '2026-10-19T11:55:00',
      'yesterday',
      '19/10/2026',
      1760870100000,
    ])
      expect(isStampTime(t), String(t)).toBe(false);
  });

  it('should treat the real reference stamp (day-only asOf) as valid', () => {
    expect(dataStampIssue(FIXTURE_STAMP, 's')).toBeNull();
    expect(dataStampIssue(JSON.parse(JSON.stringify(FIXTURE_STAMP)), 's')).toBeNull();
  });

  it('should name the failing field, and never a value', () => {
    expect(dataStampIssue({ ...FIXTURE_STAMP, source: 'SECRET' }, 'x.stamp')).toBe(
      'x.stamp.source'
    );
    expect(dataStampIssue({ ...FIXTURE_STAMP, origin: 'GUESS' }, 'x')).toBe('x.origin');
    expect(dataStampIssue(null, 'x')).toBe('x');
    expect(dataStampIssue([], 'x')).toBe('x');
  });

  it('should list every chain and origin at runtime', () => {
    expect([...CHAINS].sort()).toEqual(['Arbitrum', 'Bitcoin', 'Ethereum', 'Solana', 'Sui']);
    expect([...EVIDENCE_ORIGINS].sort()).toEqual(['MODELLED', 'OBSERVED', 'PROXY']);
  });

  it('should refuse a repeated or backwards day on its own terms', () => {
    // Asserted directly, not only through the builder: the builder now CALLS this helper,
    // so comparing the two alone would pass if both broke together (sabotage S3, 2026-10-19).
    expect(datesStrictlyAscending(['2026-10-17', '2026-10-18'])).toBe(true);
    expect(datesStrictlyAscending(['2026-10-18', '2026-10-18'])).toBe(false);
    expect(datesStrictlyAscending(['2026-10-18', '2026-10-17'])).toBe(false);
    expect(datesStrictlyAscending([])).toBe(true);
  });

  it('should share ONE ordering rule with the server series builder', () => {
    const cases: string[][] = [
      ['2026-10-17', '2026-10-18'],
      ['2026-10-18', '2026-10-17'],
      ['2026-10-18', '2026-10-18'],
      ['2026-10-18'],
      [],
    ];
    for (const dates of cases) {
      const built = buildHistoricalSeries({
        kind: 'RATE',
        protocolId: 'skySsr',
        points: dates.map((date) => ({ date, value: 1 })),
        stamp: FIXTURE_STAMP,
        via: 'AGGREGATOR',
      });
      // Empty is refused by the builder for a different reason (NO_OBSERVATION); every
      // non-empty case must agree with the shared rule exactly.
      if (dates.length > 0)
        expect(built.available, dates.join(',')).toBe(datesAreConsecutiveDays(dates));
      else expect(built.available).toBe(false);
    }
  });
});

/**
 * `5.70` · EVERY FIELD REFUSAL OF THE LIST CHECKS, EACH ONE REACHED.
 *
 * The app's market boundary refuses a response through these checks, and most of
 * their per-field refusals were never taken by a test — so any one of them could
 * start passing a malformed entry and nothing would go red. Each case breaks ONE
 * field of an otherwise valid list and asserts the exact path refused; the valid
 * list itself is asserted `null` first, so every refusal below is caused by the
 * one mutation and not by a broken baseline.
 */
describe('market list checks — each malformed field is refused at its own path', () => {
  type Rec = Record<string, unknown>;
  const stamp: Rec = { ...FIXTURE_STAMP };
  const apy: Rec = {
    protocolId: 'aaveV3',
    apyPercent: 5.2,
    tvlUsd: null,
    chain: 'Arbitrum',
    stamp,
  };
  const gasQuote: Rec = { chain: 'Arbitrum', typicalFeeUsd: 0.03, stamp };
  const apySeries: Rec = {
    protocolId: 'aaveV3',
    points: [
      { date: '2026-10-17', apyPercent: 5, apyBasePercent: 5 },
      { date: '2026-10-18', apyPercent: 5.1, apyBasePercent: null },
    ],
    stamp,
  };
  const priceSeries: Rec = {
    protocolId: 'jito',
    points: [
      { date: '2026-10-17', priceUsd: 70.1 },
      { date: '2026-10-18', priceUsd: 70.4 },
    ],
    stamp,
  };
  const withPoint = (s: Rec, i: number, patch: Rec): Rec => ({
    ...s,
    points: (s.points as Rec[]).map((p, j) => (j === i ? { ...p, ...patch } : p)),
  });

  it('should accept each valid baseline, so every refusal below is caused by its mutation', () => {
    expect(protocolApyListIssue([apy, { ...apy, protocolId: 'skySsr' }], 'apys')).toBeNull();
    expect(protocolApyListIssue([{ ...apy, tvlUsd: undefined }], 'apys')).toBeNull();
    expect(gasQuoteListIssue([gasQuote, { ...gasQuote, chain: 'Solana' }], 'gas')).toBeNull();
    expect(apyHistoryListIssue([apySeries], 'h')).toBeNull();
    expect(priceHistoryListIssue([priceSeries], 'p')).toBeNull();
    expect(
      dataStampIssue(
        { ...stamp, derivedAt: '2026-10-18T00:00:00Z', methodology: 'm', proxyOf: 'x' },
        's'
      )
    ).toBeNull();
  });

  it('should refuse a malformed rate entry at the failing field', () => {
    const cases: Array<[unknown, string]> = [
      ['not a list', 'apys'],
      [{ 0: apy }, 'apys'],
      [[null], 'apys[0]'],
      [[[apy]], 'apys[0]'],
      [[{ ...apy, protocolId: 'unknownProtocol' }], 'apys[0].protocolId'],
      [[{ ...apy, apyPercent: '5.2' }], 'apys[0].apyPercent'],
      [[{ ...apy, apyPercent: Number.NaN }], 'apys[0].apyPercent'],
      [[{ ...apy, tvlUsd: 'big' }], 'apys[0].tvlUsd'],
      [[{ ...apy, tvlUsd: Number.POSITIVE_INFINITY }], 'apys[0].tvlUsd'],
      [[{ ...apy, chain: 'Mars' }], 'apys[0].chain'],
      [[{ ...apy, stamp: { ...stamp, origin: 'GUESS' } }], 'apys[0].stamp.origin'],
      [[apy, { ...apy }], 'apys[1]'], // one entry per protocol: a duplicate is refused
    ];
    for (const [v, path] of cases) expect(protocolApyListIssue(v, 'apys'), path).toBe(path);
  });

  it('should refuse a malformed network-cost entry at the failing field', () => {
    const cases: Array<[unknown, string]> = [
      [{}, 'gas'],
      [[null], 'gas[0]'],
      [[{ ...gasQuote, chain: 'Mars' }], 'gas[0].chain'],
      [[{ ...gasQuote, typicalFeeUsd: '0.03' }], 'gas[0].typicalFeeUsd'],
      [[{ ...gasQuote, typicalFeeUsd: Number.NaN }], 'gas[0].typicalFeeUsd'],
      [[{ ...gasQuote, stamp: null }], 'gas[0].stamp'],
      [[gasQuote, { ...gasQuote }], 'gas[1]'], // one quote per chain
    ];
    for (const [v, path] of cases) expect(gasQuoteListIssue(v, 'gas'), path).toBe(path);
  });

  it('should refuse a malformed series at the failing field', () => {
    const cases: Array<[unknown, string]> = [
      [[null], 'h[0]'],
      [[{ ...apySeries, protocolId: 'unknownProtocol' }], 'h[0].protocolId'],
      [[{ ...apySeries, points: {} }], 'h[0].points'],
      [[{ ...apySeries, points: [null] }], 'h[0].points[0]'],
      [[withPoint(apySeries, 0, { date: '2026-02-30' })], 'h[0].points[0].date'],
      [[withPoint(apySeries, 1, { apyPercent: null })], 'h[0].points[1].apyPercent'],
      [[withPoint(apySeries, 1, { apyPercent: '5.1' })], 'h[0].points[1].apyPercent'],
      [[withPoint(apySeries, 0, { apyBasePercent: '5' })], 'h[0].points[0].apyBasePercent'],
      [[withPoint(apySeries, 0, { apyBasePercent: Number.NaN })], 'h[0].points[0].apyBasePercent'],
      [[withPoint(apySeries, 1, { date: '2026-10-19' })], 'h[0].points'], // a missing day
      [[withPoint(apySeries, 1, { date: '2026-10-17' })], 'h[0].points'], // a repeated day
      [[{ ...apySeries, stamp: { ...stamp, asOf: 'yesterday' } }], 'h[0].stamp.asOf'],
      [[apySeries, { ...apySeries }], 'h[1]'], // one series per protocol
    ];
    for (const [v, path] of cases) expect(apyHistoryListIssue(v, 'h'), path).toBe(path);

    expect(priceHistoryListIssue([withPoint(priceSeries, 0, { priceUsd: '70' })], 'p')).toBe(
      'p[0].points[0].priceUsd'
    );
    expect(priceHistoryListIssue([withPoint(priceSeries, 1, { priceUsd: undefined })], 'p')).toBe(
      'p[0].points[1].priceUsd'
    );
    /* The base-rate check belongs to APY series only: a price point is not
       refused for a field it does not carry. */
    expect(
      priceHistoryListIssue([withPoint(priceSeries, 0, { apyBasePercent: 'n/a' })], 'p')
    ).toBeNull();
  });

  it('should refuse a malformed stamp at the failing field', () => {
    const noObservedAt: Rec = { ...stamp };
    delete noObservedAt.observedAt;
    const noFixtureVersion: Rec = { ...stamp };
    delete noFixtureVersion.fixtureVersion;
    const cases: Array<[unknown, string]> = [
      [{ ...stamp, source: 42 }, 's.source'],
      [{ ...stamp, asOf: '2026-10-19T24:00:00Z' }, 's.asOf'],
      [noObservedAt, 's.observedAt'],
      [{ ...stamp, observedAt: 'later' }, 's.observedAt'],
      [{ ...stamp, derivedAt: 'later' }, 's.derivedAt'],
      [{ ...stamp, fallbackUsed: 'true' }, 's.fallbackUsed'],
      [noFixtureVersion, 's.fixtureVersion'],
      [{ ...stamp, fixtureVersion: 3 }, 's.fixtureVersion'],
      [{ ...stamp, methodology: 7 }, 's.methodology'],
      [{ ...stamp, proxyOf: false }, 's.proxyOf'],
    ];
    for (const [v, path] of cases) expect(dataStampIssue(v, 's'), path).toBe(path);
    /* `null` is the declared "none" for the nullable stamp times and the version. */
    expect(
      dataStampIssue({ ...stamp, observedAt: null, derivedAt: null, fixtureVersion: null }, 's')
    ).toBeNull();
  });
});
