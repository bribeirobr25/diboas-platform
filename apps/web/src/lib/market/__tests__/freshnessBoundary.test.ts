/**
 * FRESH-BOUNDARY-1 (5.630, N02): for every source, the build-time panel and
 * the page-view check agree at the freshness deadline, 1 ms before it, at it,
 * and 1 ms after it. Before the fix the monthly BTC close disagreed for exactly
 * one instant each month: the build already said DELAYED at day 4 00:00 UTC
 * while the page still said FRESH. The three-day grace, the deadlines'
 * meaning and the confidence rules are unchanged (CON:155: no bulk change of
 * comparators). Rule-only: synthetic inputs, no committed data.
 */
import { describe, expect, it } from 'vitest';
import { applyReadTimeFreshness } from '../../analytics-sdk/freshness';
import type { DataStatus } from '../../analytics-sdk/types';
import { deriveDataStatus } from '../../../../scripts/market-refresh/lib/data-status.mjs';

const ETF = { id: 'ETF-01', anchor: null };

/** A run whose monthly signals anchor `monthYm` and weekly ones the Friday before `runAt`. */
function computedAt(runAt: string, monthYm: string, m2Ym = monthYm) {
  const now = new Date(runAt);
  const weekly = new Date(now);
  do weekly.setUTCDate(weekly.getUTCDate() - 1);
  while (weekly.getUTCDay() !== 5);
  const w = weekly.toISOString().slice(0, 10);
  return {
    computed_at: runAt,
    signals: [
      { id: 'BTC-01', anchor: monthYm },
      { id: 'MAC-03', anchor: m2Ym },
      ...['MAC-01', 'MAC-02', 'REL-01', 'REL-03'].map((id) => ({ id, anchor: w })),
      ETF,
    ],
  };
}

const fresh = (ds: DataStatus, source: string) =>
  ds.sources.find((s) => s.source === source)?.status === 'FRESH';

/** Build at `buildAt`, then compare build-time vs page-view freshness at deadline −1/0/+1 ms. */
function agreeAround(buildAt: string, monthYm: string) {
  const base = computedAt(buildAt, monthYm);
  const panel = deriveDataStatus(base, []) as DataStatus;
  const checked: string[] = [];
  for (const src of panel.sources) {
    if (!src.delayed_after || src.source.startsWith('Polygon')) continue;
    const t = Date.parse(src.delayed_after);
    for (const offset of [-1, 0, 1]) {
      const at = new Date(t + offset);
      const built = deriveDataStatus({ ...base, computed_at: at.toISOString() }, []) as DataStatus;
      const read = applyReadTimeFreshness(panel, at);
      expect(
        fresh(read, src.source),
        `${src.source} at delayed_after${offset >= 0 ? '+' : ''}${offset} ms`
      ).toBe(fresh(built, src.source));
    }
    checked.push(src.source);
  }
  return checked;
}

describe('FRESH-BOUNDARY-1 — build time and page view agree at every freshness deadline', () => {
  it('should agree for every source with a deadline (weekly, monthly print, monthly close)', () => {
    const checked = agreeAround('2026-10-12T06:20:00Z', '2026-09-01');
    expect(checked.length).toBeGreaterThanOrEqual(5);
    expect(checked).toContain('in-repo:monthlyPrices.json (BTC)');
    expect(checked).toContain('FRED:M2SL');
  });

  it.each([
    ['across a year change (Nov anchor, deadline 4 Jan)', '2026-12-15T06:20:00Z', '2026-11-01'],
    ['after a 28-day February', '2027-03-15T06:20:00Z', '2027-02-01'],
    ['after a 29-day February', '2028-03-15T06:20:00Z', '2028-02-01'],
    ['after a 30-day month', '2026-05-15T06:20:00Z', '2026-04-01'],
    ['after a 31-day month', '2026-08-15T06:20:00Z', '2026-07-01'],
  ])('should agree %s', (_label, buildAt, monthYm) => {
    expect(agreeAround(buildAt, monthYm)).toContain('in-repo:monthlyPrices.json (BTC)');
  });

  it('should keep the monthly-close deadline at the last instant before grace day 4', () => {
    const panel = deriveDataStatus(
      computedAt('2026-10-12T06:20:00Z', '2026-09-01'),
      []
    ) as DataStatus;
    const btc = panel.sources.find((s) => s.source === 'in-repo:monthlyPrices.json (BTC)');
    expect(btc?.delayed_after).toBe('2026-11-03T23:59:59.999Z');
  });
});
