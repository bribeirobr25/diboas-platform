/**
 * C1 (2026-10-21, owner-approved): a weekly run that does not lose a week.
 *
 *  C1c — one Money Tools series that cannot be read (a Yahoo error, a timeout,
 *        a bar that fails its checks) is that series' failure, reported in the
 *        PR, never the whole run's.
 *  C1d — a second, Tuesday attempt refreshes only when this week has no
 *        successful run and no refresh PR is open.
 *
 * Synthetic data only: a temporary prices file and a fake Yahoo fetcher.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  appendPriceMonths,
  toolsMonthliesOutcome,
  toolsReport,
} from '../../../../scripts/market-refresh/tools-monthlies.mjs';
import { retryDecision, weekStartUtc } from '../../../../scripts/market-refresh/retry-decision.mjs';

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

describe('C1c — one series failing never stops the others', () => {
  it('should update every other series and report the one Yahoo could not serve', async () => {
    const file = pricesFile('2026-08-01');
    const fetchBars = async (ticker: string) => {
      if (ticker === 'GLD') throw new Error('Yahoo answered 503\nretry later');
      return { bars: new Map([['2026-09-01', good('2026-09-01')]]), provenance: PROVENANCE };
    };
    const r = await appendPriceMonths('2026-09-01', false, { fetchBars, pricesPath: file });
    expect(r.failed).toEqual([{ code: 'GOLD', reason: 'Yahoo answered 503 retry later' }]);
    expect(r.planned.map((p: { code: string }) => p.code).sort()).toEqual(
      SERIES.filter((c) => c !== 'GOLD').sort()
    );
    expect(monthsOf(file, 'GOLD')).toEqual(['2026-08-01']);
    expect(monthsOf(file, 'SP500')).toEqual(['2026-08-01', '2026-09-01']);
  });

  it('should keep a checked earlier month and stop at a bar that fails its checks', async () => {
    const file = pricesFile('2026-07-01');
    const fetchBars = async (ticker: string) => ({
      bars: new Map([
        ['2026-08-01', good('2026-08-01')],
        ['2026-09-01', ticker === 'QQQ' ? { ...good('2026-09-01'), high: 10 } : good('2026-09-01')],
      ]),
      provenance: PROVENANCE,
    });
    const r = await appendPriceMonths('2026-09-01', false, { fetchBars, pricesPath: file });
    expect(r.failed.map((f: { code: string }) => f.code)).toEqual(['QQQ']);
    expect(monthsOf(file, 'QQQ')).toEqual(['2026-07-01', '2026-08-01']);
  });

  it('should let an append run continue, fail --check, and say so in the PR note', () => {
    const failed = [{ code: 'GOLD', reason: 'Yahoo answered 503' }];
    const base = { planned: [], missing: [], failed, expectedYm: '2026-09-01' };
    expect(toolsMonthliesOutcome({ ...base, check: false }).exitCode).toBe(0);
    expect(toolsMonthliesOutcome({ ...base, check: true }).exitCode).toBe(1);
    expect(toolsMonthliesOutcome({ ...base, check: false }).nothingToDo).toBe(false);
    const note = toolsReport({ missing: ['DAX'], failed, expectedYm: '2026-09-01' });
    expect(note).toContain('- DAX: Yahoo has no closed 2026-09-01 bar yet');
    expect(note).toContain('- GOLD: not updated this run (Yahoo answered 503)');
    expect(note).toContain('do not feed the /market score');
    expect(toolsReport({ missing: [], failed: [], expectedYm: '2026-09-01' })).toBe('');
  });
});

describe('C1d — the Tuesday attempt', () => {
  const now = new Date('2026-10-27T06:20:00Z'); // a Tuesday
  const run = (id: number, conclusion: string | null, createdAt: string) => ({
    databaseId: id,
    conclusion,
    createdAt,
  });

  it('should find Monday 00:00 UTC of the current week', () => {
    expect(weekStartUtc(now).toISOString()).toBe('2026-10-26T00:00:00.000Z');
    expect(weekStartUtc(new Date('2026-10-26T00:00:00Z')).toISOString()).toBe(
      '2026-10-26T00:00:00.000Z'
    );
    expect(weekStartUtc(new Date('2026-11-01T23:59:00Z')).toISOString()).toBe(
      '2026-10-26T00:00:00.000Z'
    );
  });

  it('should always refresh on the Monday schedule or a manual run', () => {
    expect(retryDecision({ retrySchedule: false, openPrUrl: 'x', runs: [], now }).run).toBe(true);
  });

  it('should skip when this week already has a successful run', () => {
    const d = retryDecision({
      retrySchedule: true,
      openPrUrl: 'https://github.com/o/r/pull/1',
      runs: [run(9, 'success', '2026-10-26T07:10:00Z')],
      now,
    });
    expect(d).toEqual({ run: false, reason: "this week's refresh already succeeded (run 9)" });
  });

  it('should retry when Monday failed or never ran, and only last week succeeded', () => {
    expect(
      retryDecision({
        retrySchedule: true,
        openPrUrl: '',
        runs: [
          run(8, 'success', '2026-10-19T07:00:00Z'),
          run(9, 'failure', '2026-10-26T07:00:00Z'),
        ],
        now,
      }).run
    ).toBe(true);
    expect(retryDecision({ retrySchedule: true, openPrUrl: '', runs: [], now }).run).toBe(true);
  });

  it('should not retry while a refresh PR is open (the run would refuse it anyway)', () => {
    const d = retryDecision({
      retrySchedule: true,
      openPrUrl: 'https://github.com/o/r/pull/1',
      runs: [run(9, 'failure', '2026-10-26T07:00:00Z')],
      now,
    });
    expect(d.run).toBe(false);
    expect(d.reason).toMatch(/refresh PR is open/);
  });
});

describe('C1 wiring in the weekly workflow', () => {
  const wf = fs.readFileSync(
    path.resolve(__dirname, '../../../../../../.github/workflows/market-refresh-weekly.yml'),
    'utf8'
  );

  it('should schedule Monday and the Tuesday second attempt, gated by the decision job', () => {
    expect(wf).toMatch(/- cron: '17 6 \* \* 1'/);
    expect(wf).toMatch(/- cron: '17 6 \* \* 2'/);
    expect(wf).toMatch(
      /RETRY_SCHEDULE: \$\{\{ github\.event_name == 'schedule' && github\.event\.schedule == '17 6 \* \* 2' \}\}/
    );
    expect(wf).toMatch(
      /node apps\/web\/scripts\/market-refresh\/retry-decision\.mjs >> "\$GITHUB_OUTPUT"/
    );
    expect(wf).toMatch(/refresh:\n\s+needs: decide\n\s+if: needs\.decide\.outputs\.run == 'true'/);
  });

  it('should pass the tools report into the PR body', () => {
    expect(wf).toMatch(/tools-monthlies\.mjs --report "\$RUNNER_TEMP\/tools-note\.md"/);
    expect(wf).toMatch(/if \[ -s "\$RUNNER_TEMP\/tools-note\.md" \]; then/);
  });
});
