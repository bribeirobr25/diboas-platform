/**
 * Monthly series grow by exactly one month (2026-10-21, 12-principle review gate
 * of the market lane). The Money Tools' non-BTC series are now published from
 * the market data store (publish.mjs, plan 5.760 increment 2), so the Yahoo
 * appender these tests once covered is gone; the month rule itself stays, and
 * the BTC candle append still uses it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertNextMonth,
  nextMonthYM,
} from '../../../../scripts/market-refresh/lib/regime-engine.mjs';

describe('a monthly series grows by exactly the next month', () => {
  it('should compute the next month across a year end', () => {
    expect(nextMonthYM('2026-12-01')).toBe('2027-01-01');
    expect(nextMonthYM('2026-01-01')).toBe('2026-02-01');
  });

  it('should accept the next month and an empty series, and refuse a repeat or a gap', () => {
    expect(() => assertNextMonth('X', '2026-08-01', '2026-09-01')).not.toThrow();
    expect(() => assertNextMonth('X', undefined, '2026-09-01')).not.toThrow();
    expect(() => assertNextMonth('X', '2026-09-01', '2026-09-01')).toThrow(
      'is not after the last row'
    );
    expect(() => assertNextMonth('X', '2026-08-01', '2026-10-01')).toThrow(
      'does not follow the last row 2026-08-01 (expected 2026-09-01)'
    );
  });
});

describe('the BTC candle append uses the same rule (structural)', () => {
  it('should call assertNextMonth in appendBtcMonth (it writes the committed file, so it is not run here)', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../../../../scripts/market-refresh/providers/inrepo.mjs'),
      'utf8'
    );
    const body = src.slice(src.indexOf('export function appendBtcMonth'));
    expect(body.slice(0, body.indexOf('writeJsonAtomic'))).toContain(
      "assertNextMonth('appendBtcMonth'"
    );
  });
});
