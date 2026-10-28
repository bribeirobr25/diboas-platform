/**
 * TOOLS-CLOSE-1 (5.627) — the `tools-monthlies.mjs` COMMAND, end to end
 * (founder point 3, 2026-10-19: "um teste funcional do comando").
 *
 * The real script runs in a child process against a throw-away copy of the
 * scripts and made-up data, with a fixed clock and a simulated network
 * (`fixtures/toolsMonthliesNetworkStub.mjs`). Any request other than Yahoo's
 * monthly chart for a fixture ticker is logged and fails the test, even if the
 * script catches the error. Each case has an explicit 30 s limit and its
 * duration is measured. Outside the weekly blocking directories: it checks code
 * behaviour, never committed data.
 *
 * The scenario Codex identified: SP500's September month is missing and
 * Yahoo's September bar carries no adjusted close.
 */
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import {
  MONTHLY_PRICES_PATH,
  REPO_ROOT as INREPO_ROOT,
} from '../../../../scripts/market-refresh/providers/inrepo.mjs';

const REPO_ROOT = path.join(__dirname, '../../../../../..');
const SCRIPTS =
  process.env.TOOLS_MONTHLIES_TEST_SCRIPTS ??
  path.join(REPO_ROOT, 'apps/web/scripts/market-refresh');
const STUB_URL = pathToFileURL(path.join(__dirname, 'fixtures/toolsMonthliesNetworkStub.mjs')).href;
// The prices file's place in the repo, from the pipeline's own constant: the
// test then writes it in the throw-away tree and never reads the committed one.
const PRICES_REL = path.relative(INREPO_ROOT, MONTHLY_PRICES_PATH);
const TIMEOUT_MS = 30_000;
/** Monday 2026-10-12 06:20 UTC: the due month is September 2026. */
const OCT_RUN = '2026-10-12T06:20:00Z';
/** Monday 2026-11-09 06:20 UTC: the due month is October 2026 (the month-roll). */
const NOV_RUN = '2026-11-09T06:20:00Z';

const SERIES = ['SP500', 'QQQ', 'MSCI_WORLD', 'GOLD', 'TLT', 'IBOVESPA', 'DAX'];
const bar = (ym: string, adjclose: number | null = 104) => ({
  ym,
  open: 100,
  high: 110,
  low: 90,
  close: 105,
  adjclose,
});

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

/** A throw-away tree: the scripts under test, and every series ending at `ends[code]`. */
function makeTree(ends: Record<string, string>): string {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'tools-monthlies-')));
  roots.push(root);
  fs.cpSync(SCRIPTS, path.join(root, 'apps/web/scripts/market-refresh'), { recursive: true });
  const file = path.join(root, PRICES_REL);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const prices = Object.fromEntries(
    SERIES.map((code) => [
      code,
      { months: [{ ym: ends[code], open: 1, high: 1, low: 1, close: 1, closePriceOnly: 1 }] },
    ])
  );
  fs.writeFileSync(file, `${JSON.stringify(prices, null, 2)}\n`);
  return root;
}

const sha = (root: string) =>
  crypto
    .createHash('sha256')
    .update(fs.readFileSync(path.join(root, PRICES_REL)))
    .digest('hex');
const monthsOf = (root: string, code: string): string[] =>
  JSON.parse(fs.readFileSync(path.join(root, PRICES_REL), 'utf8'))[code].months.map(
    (m: { ym: string }) => m.ym
  );

function run(root: string, now: string, fixture: Record<string, unknown[]>, args: string[]) {
  const log = path.join(root, `requests-${crypto.randomUUID()}.log`);
  fs.writeFileSync(log, '');
  const started = Date.now();
  const res = spawnSync(
    process.execPath,
    [
      '--import',
      STUB_URL,
      path.join(root, 'apps/web/scripts/market-refresh/tools-monthlies.mjs'),
      ...args,
    ],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: TIMEOUT_MS - 5_000,
      env: {
        NODE_ENV: 'test',
        PATH: process.env.PATH ?? '',
        TOOLS_STUB_NOW: now,
        TOOLS_STUB_LOG: log,
        TOOLS_STUB_FIXTURE: JSON.stringify(fixture),
      },
    }
  );
  const requests = fs
    .readFileSync(log, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l) as { url: string; kind: string });
  return {
    status: res.status,
    output: `${res.stdout}\n${res.stderr}`,
    requests,
    ms: Date.now() - started,
  };
}

/** Every series current at September except SP500, which ends at August. */
const SP500_BEHIND = Object.fromEntries(
  SERIES.map((c) => [c, c === 'SP500' ? '2026-08-01' : '2026-09-01'])
);

describe('TOOLS-CLOSE-1 — the command with a required month whose adjusted close is null', () => {
  it(
    'the stub logs and refuses a request it was not told to expect (instrument self-test)',
    () => {
      const root = makeTree(SP500_BEHIND);
      // No fixture ticker at all: SPY's request must be logged as unexpected.
      const r = run(root, OCT_RUN, {}, ['--check']);
      expect(r.requests.map((q) => q.kind)).toEqual(['unexpected', 'unexpected', 'unexpected']);
      expect(r.status).not.toBe(0);
    },
    TIMEOUT_MS
  );

  it(
    '--check fails, names SP500 and the reason, writes nothing, and never says all series are complete',
    () => {
      const root = makeTree(SP500_BEHIND);
      const before = sha(root);
      const r = run(root, OCT_RUN, { SPY: [bar('2026-08-01'), bar('2026-09-01', null)] }, [
        '--check',
      ]);
      expect(r.status, r.output).toBe(1);
      expect(r.output).toMatch(
        /SP500: not updated this run \(2026-09-01 bar has no usable adjusted close/
      );
      expect(r.output).not.toMatch(/nothing to do/);
      expect(sha(root)).toBe(before);
      expect(r.requests.filter((q) => q.kind !== 'yahoo-monthly')).toEqual([]);
      expect(r.ms).toBeLessThan(TIMEOUT_MS);
    },
    TIMEOUT_MS
  );

  it(
    'an append run continues (exit 0), writes no September for SP500, and reports it for the PR',
    () => {
      const root = makeTree(SP500_BEHIND);
      const report = path.join(root, 'tools-report.md');
      const r = run(root, OCT_RUN, { SPY: [bar('2026-08-01'), bar('2026-09-01', null)] }, [
        '--report',
        report,
      ]);
      expect(r.status, r.output).toBe(0);
      expect(monthsOf(root, 'SP500')).toEqual(['2026-08-01']);
      expect(fs.readFileSync(report, 'utf8')).toMatch(
        /SP500: not updated this run \(2026-09-01 bar has no usable adjusted close/
      );
      expect(r.requests.filter((q) => q.kind !== 'yahoo-monthly')).toEqual([]);
    },
    TIMEOUT_MS
  );
});

describe('TOOLS-CLOSE-1 — recovery across the month-roll (tested, not promised)', () => {
  const allBehind = Object.fromEntries(
    SERIES.map((c) => [c, c === 'SP500' ? '2026-08-01' : '2026-09-01'])
  );
  const fixtureFor = (sepAdj: number | null) => ({
    SPY: [bar('2026-08-01'), bar('2026-09-01', sepAdj), bar('2026-10-01')],
    QQQ: [bar('2026-10-01')],
    URTH: [bar('2026-10-01')],
    GLD: [bar('2026-10-01')],
    TLT: [bar('2026-10-01')],
    '^BVSP': [bar('2026-10-01')],
    '^GDAXI': [bar('2026-10-01')],
  });

  it(
    'should append September then October for SP500 once Yahoo carries the adjusted close',
    () => {
      const root = makeTree(allBehind);
      const r = run(root, NOV_RUN, fixtureFor(104), []);
      expect(r.status, r.output).toBe(0);
      expect(monthsOf(root, 'SP500')).toEqual(['2026-08-01', '2026-09-01', '2026-10-01']);
      for (const c of SERIES.filter((s) => s !== 'SP500'))
        expect(monthsOf(root, c)).toEqual(['2026-09-01', '2026-10-01']);
    },
    TIMEOUT_MS
  );

  it(
    'should keep SP500 at August, report it, and still update the others when September stays null',
    () => {
      const root = makeTree(allBehind);
      const report = path.join(root, 'tools-report.md');
      const r = run(root, NOV_RUN, fixtureFor(null), ['--report', report]);
      expect(r.status, r.output).toBe(0);
      expect(monthsOf(root, 'SP500')).toEqual(['2026-08-01']);
      expect(fs.readFileSync(report, 'utf8')).toMatch(/SP500: not updated this run/);
      for (const c of SERIES.filter((s) => s !== 'SP500'))
        expect(monthsOf(root, c)).toEqual(['2026-09-01', '2026-10-01']);
    },
    TIMEOUT_MS
  );
});
