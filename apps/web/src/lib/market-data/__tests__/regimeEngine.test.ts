/**
 * regime-engine unit tests (P2, 2026-07-11) — the pure engine module shared
 * by the manual CLI and the market-refresh pipeline.
 *
 * Locks the four behaviors that guard data honesty:
 *   1. F-M2: computing on a stale BTC candle THROWS (never silent).
 *   2. Candle-lock grace: within MONTH_APPEND_GRACE_DAYS of a month-roll the
 *      expectation steps back one month.
 *   3. Strict-Friday: intra-week values never become "the latest weekly
 *      close"; holiday Fridays fall back within the closed week only.
 *   4. ETF-01 manual input degrades to UNAVAILABLE on expiry.
 */

import { describe, it, expect } from 'vitest';
import {
  strictFridayCloses,
  expectedConfirmedMonthYM,
  evaluateBtcStructure,
  evaluateEtfManual,
  anchorCoherence,
  MONTH_APPEND_GRACE_DAYS,
  assertMonthlyContract,
  M2_MONTHS_FOR_ROC,
} from '../../../../scripts/market-refresh/lib/regime-engine.mjs';

const D = (s: string) => new Date(`${s}T00:00:00Z`);

describe('expectedConfirmedMonthYM (F-M2 grace)', () => {
  it('should expect the prior month once the grace has passed', () => {
    expect(expectedConfirmedMonthYM(D('2026-07-11'))).toBe('2026-06-01');
  });

  it(`should step back a month within the first ${MONTH_APPEND_GRACE_DAYS} days`, () => {
    expect(expectedConfirmedMonthYM(D('2026-07-03'))).toBe('2026-05-01');
    expect(expectedConfirmedMonthYM(D('2026-07-04'))).toBe('2026-06-01');
  });
});

describe('evaluateBtcStructure — F-M2 stale-input gate', () => {
  const months = (lastYm: string) => {
    // 60 synthetic monthly closes ending at lastYm — enough history for the indicators.
    const out: Array<{ ym: string; close: number }> = [];
    const [y, m] = lastYm.split('-').map(Number);
    for (let i = 59; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(y, m - 1 - i, 1));
      out.push({ ym: d.toISOString().slice(0, 10), close: 30000 + (59 - i) * 250 });
    }
    return out;
  };

  it('should throw STALE INPUT when the expected confirmed candle is missing', () => {
    expect(() => evaluateBtcStructure(months('2026-05-01'), D('2026-07-11'))).toThrow(
      /STALE INPUT \(F-M2\)/
    );
  });

  it('should compute when the expected candle is present', () => {
    const signals = evaluateBtcStructure(months('2026-06-01'), D('2026-07-11'));
    expect(signals).toHaveLength(4);
    expect(signals.map((s: { id: string }) => s.id)).toEqual([
      'BTC-01',
      'BTC-02',
      'BTC-03',
      'BTC-04',
    ]);
  });
});

describe('strictFridayCloses — locked convention', () => {
  it('should never admit intra-week values of the current (unclosed) week', () => {
    // Data ends Wednesday 2026-07-08; today is Thursday 2026-07-09 — the
    // week's Friday (Jul 10) has not happened, so that week must be skipped.
    const daily: Array<[Date, number]> = [];
    for (let d = 1; d <= 8; d += 1) {
      const date = D(`2026-07-${String(d).padStart(2, '0')}`);
      if (date.getUTCDay() === 0 || date.getUTCDay() === 6) continue;
      daily.push([date, 100 + d]);
    }
    const fridays = strictFridayCloses(daily, D('2026-07-09'));
    expect(fridays).toHaveLength(1);
    expect(fridays[0][0].toISOString().slice(0, 10)).toBe('2026-07-03');
  });

  it('should fall back to the prior trading day for a MID-SERIES holiday Friday', () => {
    // Friday 2026-07-03 missing (US holiday) but the series continues into
    // the next week → the closed week counts at Thursday's value.
    const daily: Array<[Date, number]> = [
      [D('2026-06-29'), 1],
      [D('2026-06-30'), 2],
      [D('2026-07-01'), 3],
      [D('2026-07-02'), 4],
      [D('2026-07-06'), 5],
      [D('2026-07-07'), 6],
      [D('2026-07-08'), 7],
      [D('2026-07-09'), 8],
      [D('2026-07-10'), 9],
    ];
    const fridays = strictFridayCloses(daily, D('2026-07-11'));
    expect(fridays.map(([d]: [Date, number]) => d.toISOString().slice(0, 10))).toEqual([
      '2026-07-03',
      '2026-07-10',
    ]);
    expect(fridays[0][1]).toBe(4); // Thursday close stands in for the holiday Friday
  });

  it('should DROP a tail week whose Friday is beyond the last observation (locked tail-drop)', () => {
    // A series ending Thursday at its TAIL is ambiguous: holiday (Thursday
    // IS the weekly close) or publication lag (Friday traded but is not yet
    // published — Thursday would be WRONG). The locked convention drops the
    // week rather than guess; the resulting older anchor is made VISIBLE by
    // the F-M3 anchor printout + DELAYED status instead (this is exactly the
    // DTWEXBGS Jun-26 case from the 2026-07-11 refresh). Changing this is a
    // methodology decision, not a bug fix.
    const daily: Array<[Date, number]> = [
      [D('2026-06-29'), 1],
      [D('2026-06-30'), 2],
      [D('2026-07-01'), 3],
      [D('2026-07-02'), 4],
    ];
    const fridays = strictFridayCloses(daily, D('2026-07-11'));
    expect(fridays).toHaveLength(0);
  });
});

describe('evaluateEtfManual — expiry degradation', () => {
  const base = {
    state: 'ACTIVE',
    detail: '4-week net inflows positive per manual read',
    // doc 02 §8.3 scores ETF-01 on how many of the trailing 4 weekly aggregates
    // were positive, and the ACTIVE/INACTIVE sentence templates render it. A
    // manual verdict without it is now refused rather than rendered as "n/a"
    // (self-audit 2026-08-24).
    positives: 4,
    entered_at: '2026-07-01T00:00:00Z',
    expires_at: '2026-07-08T23:59:59Z',
  };

  it('should honor the manual state before expiry', () => {
    const [etf] = evaluateEtfManual(base, D('2026-07-05'));
    expect(etf.state).toBe('ACTIVE');
  });

  it('should degrade to UNAVAILABLE after expiry (never a stale ACTIVE)', () => {
    const [etf] = evaluateEtfManual(base, D('2026-07-11'));
    expect(etf.state).toBe('UNAVAILABLE');
    expect(etf.detail).toContain('expired');
  });

  it('should default to UNAVAILABLE with no manual file (never a measured miss)', () => {
    // Was INACTIVE. That state's published sentence is "flows were positive in
    // only N of the last 4 weeks" — a measurement claim, from no measurement.
    // Both states award 0 points, so the score is unchanged.
    const [etf] = evaluateEtfManual(null, D('2026-07-11'));
    expect(etf.state).toBe('UNAVAILABLE');
  });

  it('should refuse a manual ACTIVE/INACTIVE verdict that omits its 4-week count', () => {
    const noCount = { ...base, positives: undefined };
    expect(() => evaluateEtfManual(noCount, D('2026-07-05'))).toThrow(/positives/);
  });
});

describe('anchorCoherence (F-M3)', () => {
  it('should stay silent within a 7-day spread and name laggards beyond it', () => {
    const ok = anchorCoherence([
      { id: 'A', anchor: '2026-07-10', anchorKind: 'weekly' },
      { id: 'B', anchor: '2026-07-03', anchorKind: 'weekly' },
    ]);
    expect(ok.warning).toBeNull();

    const bad = anchorCoherence([
      { id: 'A', anchor: '2026-07-10', anchorKind: 'weekly' },
      { id: 'B', anchor: '2026-06-26', anchorKind: 'weekly' },
    ]);
    expect(bad.warning).toContain('B@2026-06-26');
    expect(bad.spreadDays).toBe(14);
  });
});

describe('FRIDAY-1 — a Friday counts only once its UTC day is over (5.625)', () => {
  /** Weekdays of July 2026 up to `last` (day of month), value 100 + day. */
  const weekdays = (last: number): Array<[Date, number]> => {
    const out: Array<[Date, number]> = [];
    for (let d = 1; d <= last; d += 1) {
      const date = D(`2026-07-${String(d).padStart(2, '0')}`);
      if (date.getUTCDay() === 0 || date.getUTCDay() === 6) continue;
      out.push([date, 100 + d]);
    }
    return out;
  };
  const days = (rows: Array<[Date, number]>) => rows.map(([d]) => d.toISOString().slice(0, 10));

  it('should not count the Friday while its UTC day is running, with or without its candle', () => {
    const fridayAfternoon = new Date('2026-07-10T15:00:00Z');
    expect(days(strictFridayCloses(weekdays(10), fridayAfternoon))).toEqual(['2026-07-03']);
    expect(days(strictFridayCloses(weekdays(9), fridayAfternoon))).toEqual(['2026-07-03']);
  });

  it('should switch exactly at Saturday 00:00 UTC (±1 ms)', () => {
    expect(days(strictFridayCloses(weekdays(10), new Date('2026-07-10T23:59:59.999Z')))).toEqual([
      '2026-07-03',
    ]);
    expect(days(strictFridayCloses(weekdays(10), new Date('2026-07-11T00:00:00.000Z')))).toEqual([
      '2026-07-03',
      '2026-07-10',
    ]);
  });

  it('should keep the prior week when run on a Friday', () => {
    const rows = strictFridayCloses(weekdays(10), new Date('2026-07-10T09:00:00Z'));
    expect(rows.at(-1)).toEqual([D('2026-07-03'), 103]);
  });

  it('should leave Monday and Tuesday runs unchanged: last Friday is included', () => {
    for (const run of ['2026-07-13T13:00:00Z', '2026-07-14T13:00:00Z']) {
      expect(days(strictFridayCloses(weekdays(14), new Date(run))).at(-1)).toBe('2026-07-10');
    }
  });

  it('should fall back to Thursday for a holiday Friday once that Friday is over (2026-12-25)', () => {
    const dec: Array<[Date, number]> = [
      [D('2026-12-21'), 1],
      [D('2026-12-22'), 2],
      [D('2026-12-23'), 3],
      [D('2026-12-24'), 4],
      [D('2026-12-28'), 5],
    ];
    expect(strictFridayCloses(dec, new Date('2026-12-28T13:00:00Z'))).toEqual([
      [D('2026-12-25'), 4],
    ]);
    expect(strictFridayCloses(dec, new Date('2026-12-25T13:00:00Z'))).toEqual([]);
  });

  it('should use a short trading day like any Friday (2026-11-27)', () => {
    const nov: Array<[Date, number]> = [
      [D('2026-11-23'), 1],
      [D('2026-11-24'), 2],
      [D('2026-11-25'), 3],
      [D('2026-11-27'), 9],
      [D('2026-11-30'), 10],
    ];
    expect(strictFridayCloses(nov, new Date('2026-11-30T13:00:00Z'))).toEqual([
      [D('2026-11-27'), 9],
    ]);
  });
});

describe('M2-CONTRACT-1 — the monthly series the 12-month change is computed from (5.626)', () => {
  const months = (n: number, startYm = '2025-08'): Array<[Date, number]> => {
    const [y, m] = startYm.split('-').map(Number);
    return Array.from({ length: n }, (_, i) => [new Date(Date.UTC(y, m - 1 + i, 1)), 21_000 + i]);
  };

  it('should accept 13 consecutive, valid months', () => {
    expect(M2_MONTHS_FOR_ROC).toBe(13);
    expect(() => assertMonthlyContract('M2', months(13), 13)).not.toThrow();
  });

  it('should refuse a repeated month, naming it', () => {
    const s = months(13);
    s[5] = [new Date(s[4][0]), s[5][1]];
    expect(() => assertMonthlyContract('M2', s, 13)).toThrow(/repeats the month 2025-12/);
  });

  it('should refuse a gap inside the last 13 months, naming it', () => {
    const s = months(14).filter((_, i) => i !== 7);
    expect(() => assertMonthlyContract('M2', s, 13)).toThrow(/skips from 2026-02 to 2026-04/);
  });

  it('should accept a gap older than the last 13 months', () => {
    const s = [[new Date(Date.UTC(2024, 0, 1)), 20_000] as [Date, number], ...months(13)];
    expect(() => assertMonthlyContract('M2', s, 13)).not.toThrow();
  });

  it('should refuse a date that is not the first of a month, and descending order', () => {
    const notFirst = months(13);
    notFirst[3] = [new Date(Date.UTC(2025, 10, 2)), notFirst[3][1]];
    expect(() => assertMonthlyContract('M2', notFirst, 13)).toThrow(/not the first day of a month/);
    expect(() => assertMonthlyContract('M2', months(13).reverse(), 13)).toThrow(/ascending/);
  });

  it('should refuse zero, negative, NaN and Infinity', () => {
    for (const bad of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const s = months(13);
      s[12] = [s[12][0], bad];
      expect(() => assertMonthlyContract('M2', s, 13)).toThrow(/non-finite or non-positive/);
    }
  });
});
