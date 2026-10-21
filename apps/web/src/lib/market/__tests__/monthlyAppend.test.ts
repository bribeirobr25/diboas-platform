/**
 * Monthly series grow by exactly one month, and a month Yahoo has not
 * published is reported as missing (2026-10-21, 12-principle review gate of
 * the market lane). Synthetic data only: a temporary prices file and a fake
 * Yahoo fetcher; the committed series is never read or written here.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  assertNextMonth,
  nextMonthYM,
} from '../../../../scripts/market-refresh/lib/regime-engine.mjs';
import {
  appendPriceMonths,
  toolsMonthliesOutcome,
} from '../../../../scripts/market-refresh/tools-monthlies.mjs';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

const SERIES = ['SP500', 'QQQ', 'MSCI_WORLD', 'GOLD', 'TLT', 'IBOVESPA', 'DAX'];
const bar = { open: 100, high: 110, low: 90, close: 105, adjclose: 104 };

/** A prices file whose every series ends at `lastYm`. */
function pricesFile(lastYm: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'monthly-append-'));
  dirs.push(dir);
  const file = path.join(dir, 'prices.json');
  const series = Object.fromEntries(
    SERIES.map((code) => [code, { months: [{ ym: lastYm, open: 1, high: 1, low: 1, close: 1 }] }])
  );
  fs.writeFileSync(file, JSON.stringify(series));
  return file;
}

/** A fake Yahoo: `has` lists the tickers that already have the month's bar. */
const fakeBars = (ym: string, has: (ticker: string) => boolean) => async (ticker: string) => ({
  bars: new Map(has(ticker) ? [[ym, bar]] : []),
  provenance: { source: `test:${ticker}`, url: 'synthetic', fetchedAt: '', licence: 'test' },
});

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

  it('should refuse a tools-series append that would leave a hole, before writing anything', async () => {
    const file = pricesFile('2026-07-01');
    const before = fs.readFileSync(file, 'utf8');
    await expect(
      appendPriceMonths('2026-09-01', false, {
        fetchBars: fakeBars('2026-09-01', () => true),
        pricesPath: file,
      })
    ).rejects.toThrow('does not follow the last row 2026-07-01');
    expect(fs.readFileSync(file, 'utf8')).toBe(before);
  });
});

describe('a month Yahoo has not published yet is missing, never "nothing to do"', () => {
  it('should report the series without a bar as missing and append the others', async () => {
    const file = pricesFile('2026-08-01');
    const out = await appendPriceMonths('2026-09-01', false, {
      fetchBars: fakeBars('2026-09-01', (t) => t !== 'TLT'),
      pricesPath: file,
    });
    expect(out.missing).toEqual(['TLT']);
    expect(out.planned.map((p) => p.code)).toEqual(SERIES.filter((c) => c !== 'TLT'));
  });

  it('should warn in an append run and fail a --check run when a month is still missing', () => {
    const missingOnly = { planned: [], missing: ['TLT'], expectedYm: '2026-09-01' };
    expect(toolsMonthliesOutcome({ ...missingOnly, check: false })).toMatchObject({
      nothingToDo: false,
      exitCode: 0,
      warnings: ['TLT: no closed 2026-09-01 bar yet — the month is still missing'],
    });
    expect(toolsMonthliesOutcome({ ...missingOnly, check: true }).exitCode).toBe(1);
    expect(
      toolsMonthliesOutcome({ planned: [], missing: [], check: true, expectedYm: '2026-09-01' })
    ).toMatchObject({ nothingToDo: true, exitCode: 0, warnings: [] });
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
