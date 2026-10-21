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
