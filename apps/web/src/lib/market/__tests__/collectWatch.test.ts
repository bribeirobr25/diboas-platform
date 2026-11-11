/**
 * COLLECT-WATCH-1 · the store's Saturday collection is watched (plan MP-3b).
 * Requirement: a weekend with no scheduled collection fails visibly by Sunday night; a
 * collection that started (even one that later blocked a series) passes. Fixtures only.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectWatch, saturdayStartUtc } from '../../../../scripts/market-data/collect-watch.mjs';

const SUNDAY_NIGHT = new Date('2026-11-15T23:05:00Z');

describe('COLLECT-WATCH-1: the Saturday collection ran', () => {
  it('should find Saturday 00:00 UTC of the current weekend', () => {
    expect(saturdayStartUtc(SUNDAY_NIGHT).toISOString()).toBe('2026-11-14T00:00:00.000Z');
    expect(saturdayStartUtc(new Date('2026-11-14T00:00:00Z')).toISOString()).toBe(
      '2026-11-14T00:00:00.000Z'
    );
  });

  it('should pass when a scheduled collection started this weekend, even late or blocked', () => {
    const late = [
      { createdAt: '2026-11-14T15:40:00Z', status: 'completed', conclusion: 'failure' },
    ];
    expect(collectWatch({ runs: late, now: SUNDAY_NIGHT }).ok).toBe(true);
  });

  it("should fail with a remedy when only last weekend's collection exists", () => {
    const r = collectWatch({
      runs: [{ createdAt: '2026-11-07T15:47:00Z', status: 'completed', conclusion: 'success' }],
      now: SUNDAY_NIGHT,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/"Market data collection" → Run workflow, branch main/);
    expect(collectWatch({ runs: [], now: SUNDAY_NIGHT }).ok).toBe(false);
  });

  it('should count the manual remedy from main, and nothing but a schedule or a dispatch', () => {
    const at = (event: string) => [
      { createdAt: '2026-11-15T10:00:00Z', event, status: 'completed', conclusion: 'success' },
    ];
    expect(collectWatch({ runs: at('workflow_dispatch'), now: SUNDAY_NIGHT }).ok).toBe(true);
    expect(collectWatch({ runs: at('push'), now: SUNDAY_NIGHT }).ok).toBe(false);
  });

  it('should not count a run that collected nothing (cancelled, skipped, refused at startup)', () => {
    for (const conclusion of ['cancelled', 'skipped', 'startup_failure'])
      expect(
        collectWatch({
          runs: [
            {
              createdAt: '2026-11-14T10:00:00Z',
              event: 'schedule',
              status: 'completed',
              conclusion,
            },
          ],
          now: SUNDAY_NIGHT,
        }).ok,
        conclusion
      ).toBe(false);
  });

  it('should run on Sunday night against the collections from main', () => {
    const wf = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../../../../.github/workflows/market-data-collect-watchdog.yml'
      ),
      'utf8'
    );
    expect(wf).toMatch(/- cron: '0 23 \* \* 0'/);
    expect(wf).toMatch(/--workflow market-data-collect\.yml --branch main/);
    expect(wf).toMatch(/--json createdAt,event,status,conclusion/);
    expect(wf).toMatch(/node apps\/web\/scripts\/market-data\/collect-watch\.mjs/);
  });
});
