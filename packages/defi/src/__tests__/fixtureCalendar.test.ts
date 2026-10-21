import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixtureDateSeries } from '../fixtures';
import { DefiLlamaApyProvider } from '../providers/defillama';
import { FallbackOnlyApyProvider } from '../providers/fallbackOnly';

/**
 * REQUIREMENT (do-not-regress, implementation-notes 2026-09-16): every fixture series —
 * APY and price — is built on ONE calendar, `fixtureDateSeries`, so one position's legs
 * can never disagree about dates (replay would refuse it as mixed-calendar). And that
 * calendar is a run of CONSECUTIVE UTC days ending today, on any machine (`5.556`: the
 * local-time step repeated 2026-03-29 and skipped a day in October in Europe/Berlin).
 */
const ORIGINAL_TZ = process.env.TZ;
afterEach(() => {
  process.env.TZ = ORIGINAL_TZ;
  vi.useRealTimers();
});

function assertConsecutiveUtcDays(dates: string[], days: number, today: string) {
  expect(dates).toHaveLength(days);
  expect(dates[dates.length - 1]).toBe(today); // not `.at()`: defi targets ES2020
  for (let i = 1; i < dates.length; i++) {
    const step = Date.parse(`${dates[i]}T00:00:00Z`) - Date.parse(`${dates[i - 1]}T00:00:00Z`);
    expect(step, `${dates[i - 1]} → ${dates[i]}`).toBe(86_400_000);
  }
}

describe('the fixture calendar', () => {
  it('should be consecutive UTC days across both DST changes in a DST time zone (5.556)', () => {
    process.env.TZ = 'Europe/Berlin';
    // 01:30 local (CEST) on 2026-10-19 = 23:30 UTC on 2026-10-18: the hour where the
    // local-time step went wrong; the 400-day window spans 2025-10-26 and 2026-03-29.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T23:30:00Z'));
    assertConsecutiveUtcDays(fixtureDateSeries(400), 400, '2026-10-18');
  });

  it('should be the SAME calendar for the APY fallback histories and the price fixture', async () => {
    process.env.TZ = 'Europe/Berlin';
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T23:30:00Z'));
    // 400 days so the window spans BOTH DST changes — a 120-day window has none, and a
    // second, local-time ladder would then still agree (measured: that sabotage stayed green).
    const expected = fixtureDateSeries(400);
    const fallback = await new FallbackOnlyApyProvider().getApyHistory('aaveV3', 400);
    expect(fallback?.points.map((p) => p.date)).toEqual(expected);
    // DeFiLlama's degraded path, with its fetch failing.
    const offline = (() => Promise.reject(new Error('offline'))) as unknown as typeof fetch;
    const degraded = await new DefiLlamaApyProvider(offline, 50).getApyHistory('aaveV3', 400);
    expect(degraded).not.toBeNull();
    expect(degraded!.points.map((p) => p.date)).toEqual(expected);
  });
});
