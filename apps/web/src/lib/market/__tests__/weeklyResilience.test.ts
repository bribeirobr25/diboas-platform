/**
 * C1 (2026-10-21, owner-approved): a weekly run that does not lose a week.
 *
 *  C1c — one Money Tools series that cannot be read (a Yahoo error, a timeout,
 *        a bar that fails its checks) is that series' failure, reported in the
 *        PR, never the whole run's.
 *  C1d — a second attempt (Wednesday since MP-3b) refreshes only when this cycle has no
 *        successful run. Since C1a (2026-10-28) an open refresh PR no longer
 *        stops it (the run carries that PR), unless a run this week already
 *        refused to carry it. SUPERSEDED: "and no refresh PR is open".
 *
 * Synthetic data only: a temporary prices file and a fake Yahoo fetcher.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  retryDecision,
  cycleStartUtc,
} from '../../../../scripts/market-refresh/retry-decision.mjs';

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});

const SERIES = ['SP500', 'QQQ', 'MSCI_WORLD', 'GOLD', 'TLT', 'IBOVESPA', 'DAX'];
const good = (ym: string) => ({ ym, open: 100, high: 110, low: 90, close: 105, adjclose: 104 });
const PROVENANCE = { source: 'test', url: 'synthetic', fetchedAt: '', licence: 'test' };

function pricesFile(lastYm: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'weekly-resilience-'));
  dirs.push(dir);
  const file = path.join(dir, 'prices.json');
  fs.writeFileSync(
    file,
    JSON.stringify(
      Object.fromEntries(
        SERIES.map((c) => [c, { months: [{ ym: lastYm, open: 1, high: 1, low: 1, close: 1 }] }])
      )
    )
  );
  return file;
}
const monthsOf = (file: string, code: string): string[] =>
  JSON.parse(fs.readFileSync(file, 'utf8'))[code].months.map((m: { ym: string }) => m.ym);

describe('C1d — the Wednesday attempt (the refresh runs on Tuesday since MP-3b)', () => {
  const now = new Date('2026-10-28T06:20:00Z'); // a Wednesday
  const run = (id: number, conclusion: string | null, createdAt: string) => ({
    databaseId: id,
    conclusion,
    createdAt,
  });

  it('should find Tuesday 00:00 UTC, the start of the current cycle', () => {
    expect(cycleStartUtc(now).toISOString()).toBe('2026-10-27T00:00:00.000Z');
    expect(cycleStartUtc(new Date('2026-10-27T00:00:00Z')).toISOString()).toBe(
      '2026-10-27T00:00:00.000Z'
    );
    // a Monday still belongs to the cycle that started the Tuesday before
    expect(cycleStartUtc(new Date('2026-11-02T23:59:00Z')).toISOString()).toBe(
      '2026-10-27T00:00:00.000Z'
    );
  });

  it('should always refresh on the Tuesday schedule or a manual run', () => {
    expect(retryDecision({ retrySchedule: false, openPrUrl: 'x', runs: [], now }).run).toBe(true);
  });

  it('should skip when this week already has a successful run', () => {
    const d = retryDecision({
      retrySchedule: true,
      openPrUrl: 'https://github.com/o/r/pull/1',
      runs: [run(9, 'success', '2026-10-27T07:10:00Z')],
      now,
    });
    expect(d).toEqual({ run: false, reason: "this week's refresh already succeeded (run 9)" });
  });

  it('should retry when Tuesday failed or never ran, and only last week succeeded', () => {
    expect(
      retryDecision({
        retrySchedule: true,
        openPrUrl: '',
        runs: [
          run(8, 'success', '2026-10-20T07:00:00Z'),
          run(9, 'failure', '2026-10-27T07:00:00Z'),
        ],
        now,
      }).run
    ).toBe(true);
    expect(retryDecision({ retrySchedule: true, openPrUrl: '', runs: [], now }).run).toBe(true);
  });

  // C1a (5.632, 2026-10-28) reverses the C1d rule "not while a refresh PR is
  // open": the run now carries that PR (carry-open-pr.mjs), so Tuesday's failure
  // is retried and last week's PR rides along.
  it('should retry when Tuesday failed even while a refresh PR is open, and say it carries it', () => {
    const d = retryDecision({
      retrySchedule: true,
      openPrUrl: 'https://github.com/o/r/pull/1',
      runs: [run(9, 'failure', '2026-10-27T07:00:00Z')],
      now,
    });
    expect(d.run).toBe(true);
    expect(d.reason).toMatch(
      /carrying the open refresh PR \(https:\/\/github\.com\/o\/r\/pull\/1\)/
    );
  });

  it('should not retry a run that refused to carry this week (the refusal would repeat)', () => {
    const d = retryDecision({
      retrySchedule: true,
      openPrUrl: 'https://github.com/o/r/pull/1',
      runs: [run(9, 'failure', '2026-10-27T07:00:00Z')],
      now,
      refusedRunIds: ['9'],
    });
    expect(d.run).toBe(false);
    expect(d.reason).toMatch(/run 9 this week refused to carry/);
  });

  it('should still retry when the refusal was last week, not this week', () => {
    const d = retryDecision({
      retrySchedule: true,
      openPrUrl: 'https://github.com/o/r/pull/1',
      runs: [run(9, 'failure', '2026-10-27T07:00:00Z'), run(8, 'failure', '2026-10-20T07:00:00Z')],
      now,
      refusedRunIds: ['8'],
    });
    expect(d.run).toBe(true);
  });

  it('should still skip a PR-open Wednesday when this cycle already succeeded', () => {
    const d = retryDecision({
      retrySchedule: true,
      openPrUrl: 'https://github.com/o/r/pull/1',
      runs: [run(9, 'success', '2026-10-27T07:00:00Z')],
      now,
    });
    expect(d.run).toBe(false);
    expect(d.reason).toMatch(/already succeeded/);
  });
});

describe('MP-3b: the watchdog checks the day the refresh runs', () => {
  it('should run the refresh watchdog on the refresh day, after the 06:17 slot', () => {
    const read = (f: string) =>
      fs.readFileSync(path.resolve(__dirname, '../../../../../../.github/workflows', f), 'utf8');
    const day = /- cron: '17 6 \* \* (\d)' # Tuesdays/.exec(read('market-refresh-weekly.yml'))?.[1];
    const wd = /- cron: '0 22 \* \* (\d)'/.exec(read('market-refresh-watchdog.yml'))?.[1];
    expect(day).toBe('2');
    expect(wd).toBe(day);
  });
});

describe('MP-3b: a refresh is never a day or two after the last one', () => {
  const run = (id: number, conclusion: string | null, createdAt: string) => ({
    databaseId: id,
    conclusion,
    createdAt,
  });
  // the switch week: the last Monday run, then the first Tuesday schedule
  const monday = [run(1, 'success', '2026-11-16T07:00:00Z')];

  it('should skip the Tuesday and Wednesday schedules right after a Monday run', () => {
    const tue = retryDecision({
      retrySchedule: false,
      scheduled: true,
      openPrUrl: '',
      runs: monday,
      now: new Date('2026-11-17T06:20:00Z'),
    });
    expect(tue.run).toBe(false);
    expect(tue.reason).toMatch(/a refresh succeeded 1\.0 days ago \(run 1\)/);
    const wed = retryDecision({
      retrySchedule: true,
      scheduled: true,
      openPrUrl: '',
      runs: monday,
      now: new Date('2026-11-18T06:20:00Z'),
    });
    expect(wed.run).toBe(false);
  });

  it('should refresh on the next Tuesday, and on any manual dispatch', () => {
    expect(
      retryDecision({
        retrySchedule: false,
        scheduled: true,
        openPrUrl: '',
        runs: monday,
        now: new Date('2026-11-24T06:20:00Z'),
      }).run
    ).toBe(true);
    expect(
      retryDecision({
        retrySchedule: false,
        scheduled: false,
        openPrUrl: '',
        runs: monday,
        now: new Date('2026-11-17T09:00:00Z'),
      }).run
    ).toBe(true);
  });

  it('should count a run whose refresh succeeded though a fail-open top-up left it cancelled', () => {
    const runs = [run(7, 'cancelled', '2026-11-24T07:00:00Z')];
    const at = {
      retrySchedule: true,
      scheduled: true,
      openPrUrl: '',
      runs,
      now: new Date('2026-11-25T06:20:00Z'),
    };
    expect(retryDecision(at).run).toBe(true); // without the job check it looks failed
    expect(retryDecision({ ...at, refreshedRunIds: ['7'] })).toEqual({
      run: false,
      reason: "this week's refresh already succeeded (run 7)",
    });
  });

  it('should read the refresh job of failed and cancelled runs, and pass both lists', () => {
    const wf = fs.readFileSync(
      path.resolve(__dirname, '../../../../../../.github/workflows/market-refresh-weekly.yml'),
      'utf8'
    );
    expect(wf).toMatch(/SCHEDULED: \$\{\{ github\.event_name == 'schedule' \}\}/);
    expect(wf).toMatch(/select\(\.name == "refresh" and \.conclusion == "success"\)/);
    expect(wf).toMatch(/REFRESHED_RUNS="\$refreshed"/);
  });
});

describe('C1 wiring in the weekly workflow', () => {
  const wf = fs.readFileSync(
    path.resolve(__dirname, '../../../../../../.github/workflows/market-refresh-weekly.yml'),
    'utf8'
  );

  it('should schedule Tuesday and the Wednesday second attempt, gated by the decision job', () => {
    expect(wf).toMatch(/- cron: '17 6 \* \* 2'/);
    expect(wf).toMatch(/- cron: '17 6 \* \* 3'/);
    expect(wf).not.toMatch(/- cron: '17 6 \* \* 1'/);
    expect(wf).toMatch(
      /RETRY_SCHEDULE: \$\{\{ github\.event_name == 'schedule' && github\.event\.schedule == '17 6 \* \* 3' \}\}/
    );
    expect(wf).toMatch(
      /node apps\/web\/scripts\/market-refresh\/retry-decision\.mjs >> "\$GITHUB_OUTPUT"/
    );
    expect(wf).toMatch(
      /refresh:\n\s+needs: \[decide, topup\]\n(?:\s*#.*\n)*\s+if: \$\{\{ !cancelled\(\) && needs\.decide\.outputs\.run == 'true' \}\}/
    );
  });

  // The store-read and publish steps are RUN, as on Actions, in
  // marketDataPublish.test.ts ('PUBLISH-1 wiring'): a text match passed while
  // the read step could never succeed on a runner (#827 review).
  it('should publish the Money Tools series from the store, not the deleted appender', () => {
    expect(wf).toMatch(/TOKEN: \$\{\{ secrets\.MARKET_DATA_READ_TOKEN \}\}/);
    expect(wf).not.toMatch(/tools-monthlies/);
  });
});
