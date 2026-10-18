/**
 * `run.mjs --etf-snapshot` is SNAPSHOT-ONLY (gate SNAP-ONLY-1, 2026-10-18).
 *
 * A behavioural test, not a text check: it runs the real `run.mjs` in a child
 * process against a throw-away copy of the pipeline scripts and a made-up data
 * folder, with a fixed clock, a dummy key and a stubbed network
 * (`fixtures/etfSnapshotNetworkStub.mjs`). Published data is never read or
 * written. Every request the child makes is logged before it is answered, and
 * anything other than Polygon or the 11 funds' Yahoo prices is refused — so a
 * run that falls through into the full pipeline fails here even when the
 * application catches the refusal.
 *
 * Lives in the normal CI suite and deliberately OUTSIDE `src/lib/market-data`
 * and `src/lib/analytics-sdk`, the two directories the weekly workflow runs as
 * its blocking step: it checks code behaviour, never data, so it belongs to
 * every PR's CI (the bot's weekly PR included) and not to the weekly gate.
 *
 * Re-run on its own:
 *   pnpm --filter web exec vitest run src/lib/market/__tests__/etfSnapshotOnly.test.ts
 * Against another version of the scripts (e.g. to prove it catches the old
 * fall-through), point MARKET_SNAPSHOT_TEST_SCRIPTS at that version's
 * `apps/web/scripts/market-refresh` directory.
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

const REPO_ROOT = path.join(__dirname, '../../../../../..');
const SCRIPTS =
  process.env.MARKET_SNAPSHOT_TEST_SCRIPTS ??
  path.join(REPO_ROOT, 'apps/web/scripts/market-refresh');
const STUB_URL = pathToFileURL(path.join(__dirname, 'fixtures/etfSnapshotNetworkStub.mjs')).href;

/** Monday 06:20 UTC, the weekly run's slot; the anchor is the previous Friday. */
const NOW = '2026-10-19T06:20:00Z';
const ANCHOR = '2026-10-16';
const LEDGER_REL = 'apps/web/data/market/shared/etf-shares-weekly.jsonl';
const TIMEOUT_MS = 30_000;

let tickers: string[] = [];
let fixture: { funds: Record<string, { shares: number; price: number }> } = { funds: {} };

beforeAll(async () => {
  // The fund list comes from the provider under test, never a copy of it.
  const polygon = await import(pathToFileURL(path.join(SCRIPTS, 'providers/polygon.mjs')).href);
  tickers = polygon.SPOT_BTC_ETFS;
  fixture = {
    funds: Object.fromEntries(
      tickers.map((t, i) => [t, { shares: 1_000_000 * (i + 1), price: 20 + i }])
    ),
  };
});

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

/** A throw-away repo layout: the scripts under test plus made-up data. */
function makeTree(): string {
  // realpath: macOS reaches the temp dir through the /var -> /private/var symlink.
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'etf-snapshot-')));
  roots.push(root);
  fs.cpSync(SCRIPTS, path.join(root, 'apps/web/scripts/market-refresh'), { recursive: true });
  const shared = path.join(root, 'apps/web/data/market/shared');
  fs.mkdirSync(shared, { recursive: true });
  const priorWeek = (anchor: string) =>
    JSON.stringify({
      anchor,
      funds: Object.fromEntries(
        tickers.map((t) => [t, { shares: 1, price: 1, lastUpdated: null }])
      ),
    });
  fs.writeFileSync(
    path.join(root, LEDGER_REL),
    `${priorWeek('2026-10-02')}\n${priorWeek('2026-10-09')}\n`
  );
  // Sentinels for what the full pipeline would write: any write changes their bytes.
  fs.writeFileSync(path.join(shared, 'computed.json'), '{"sentinel":"computed"}\n');
  fs.writeFileSync(path.join(shared, 'regime.json'), '{"sentinel":"regime"}\n');
  fs.writeFileSync(path.join(shared, 'run-archive.jsonl'), '{"sentinel":"archive"}\n');
  // No candle for the due month, so a BTC append that ran would have to fetch.
  const monthly = path.join(root, 'apps/web/src/lib/market-data/data');
  fs.mkdirSync(monthly, { recursive: true });
  fs.writeFileSync(
    path.join(monthly, 'monthlyPrices.json'),
    `${JSON.stringify({ BTC: { months: [{ ym: '2026-01-01', close: 1 }] } })}\n`
  );
  return root;
}

/** sha256 of every file under `apps/`, keyed by path relative to the tree. */
function fingerprint(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else
        out[path.relative(root, p)] = crypto
          .createHash('sha256')
          .update(fs.readFileSync(p))
          .digest('hex');
    }
  };
  walk(path.join(root, 'apps'));
  return out;
}

/**
 * A clean environment for the child: a developer's real POLYGON_API_KEY (or any
 * other secret in the shell) never reaches it.
 */
function childEnv(extra: Record<string, string>): NodeJS.ProcessEnv {
  return {
    NODE_ENV: 'test',
    PATH: process.env.PATH ?? '',
    SNAPSHOT_STUB_NOW: NOW,
    SNAPSHOT_STUB_FIXTURE: JSON.stringify(fixture),
    ...extra,
  };
}

type Request = { url: string; kind: 'polygon' | 'yahoo-etf' | 'unexpected' };

function run(root: string, args: string[], mode: 'ok' | 'polygon-fail' = 'ok') {
  const log = path.join(root, `requests-${crypto.randomUUID()}.log`);
  fs.writeFileSync(log, '');
  const res = spawnSync(
    process.execPath,
    ['--import', STUB_URL, path.join(root, 'apps/web/scripts/market-refresh/run.mjs'), ...args],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: TIMEOUT_MS - 5_000,
      env: childEnv({
        POLYGON_API_KEY: 'test-dummy-key',
        SNAPSHOT_STUB_LOG: log,
        SNAPSHOT_STUB_MODE: mode,
      }),
    }
  );
  const requests: Request[] = fs
    .readFileSync(log, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));
  return { status: res.status, output: `${res.stdout}\n${res.stderr}`, requests };
}

function changedFiles(before: Record<string, string>, after: Record<string, string>): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((k) => before[k] !== after[k]).sort();
}

function ledgerLines(root: string): string[] {
  return fs.readFileSync(path.join(root, LEDGER_REL), 'utf8').split('\n').filter(Boolean);
}

describe('SNAP-ONLY-1 — run.mjs --etf-snapshot takes the snapshot and nothing else', () => {
  it(
    'the network stub logs and refuses a request it was not told to expect (instrument self-test)',
    () => {
      const root = makeTree();
      const log = path.join(root, 'self-test.log');
      fs.writeFileSync(log, '');
      const res = spawnSync(
        process.execPath,
        [
          '--import',
          STUB_URL,
          '-e',
          "fetch('https://api.stlouisfed.org/fred/series').then(() => process.exit(0), () => process.exit(3))",
        ],
        {
          encoding: 'utf8',
          env: childEnv({ SNAPSHOT_STUB_LOG: log }),
        }
      );
      expect(res.status).toBe(3);
      expect(fs.readFileSync(log, 'utf8')).toContain('"kind":"unexpected"');
    },
    TIMEOUT_MS
  );

  it(
    'should append exactly one ledger line with the expected anchor and values when the sources answer',
    () => {
      const root = makeTree();
      const before = fingerprint(root);
      const linesBefore = ledgerLines(root);
      const r = run(root, ['--etf-snapshot', '--no-archive']);

      expect(r.status, r.output).toBe(0);
      expect(r.requests.filter((q) => q.kind === 'unexpected')).toEqual([]);
      expect(r.requests.filter((q) => q.kind === 'polygon')).toHaveLength(tickers.length);
      expect(r.requests.filter((q) => q.kind === 'yahoo-etf')).toHaveLength(tickers.length);
      // Only the ledger changed: no computed.json, archive, regime or monthly write.
      expect(changedFiles(before, fingerprint(root))).toEqual([LEDGER_REL]);

      const linesAfter = ledgerLines(root);
      expect(linesAfter.slice(0, -1)).toEqual(linesBefore);
      expect(JSON.parse(linesAfter[linesAfter.length - 1])).toEqual({
        anchor: ANCHOR,
        funds: Object.fromEntries(
          tickers.map((t) => [
            t,
            { shares: fixture.funds[t].shares, price: fixture.funds[t].price, lastUpdated: null },
          ])
        ),
      });
    },
    TIMEOUT_MS
  );

  it(
    'should make no request and add no line when the week is already recorded',
    () => {
      const root = makeTree();
      expect(run(root, ['--etf-snapshot', '--no-archive']).status).toBe(0);
      const before = fingerprint(root);
      const again = run(root, ['--etf-snapshot', '--no-archive']);

      expect(again.status, again.output).toBe(0);
      expect(again.output).toContain(`${ANCHOR} already recorded`);
      expect(again.requests).toEqual([]);
      expect(changedFiles(before, fingerprint(root))).toEqual([]);
    },
    TIMEOUT_MS
  );

  it(
    'should exit non-zero and leave the ledger untouched when Polygon fails',
    () => {
      const root = makeTree();
      const before = fingerprint(root);
      const r = run(root, ['--etf-snapshot', '--no-archive'], 'polygon-fail');

      expect(r.status, r.output).not.toBe(0);
      expect(r.requests.length).toBeGreaterThan(0);
      // Only Polygon was contacted: no fund price, no FRED, no other Yahoo series.
      expect(r.requests.every((q) => q.kind === 'polygon')).toBe(true);
      expect(changedFiles(before, fingerprint(root))).toEqual([]);
    },
    TIMEOUT_MS
  );

  it(
    'should refuse --append-btc with --etf-snapshot before any request or write',
    () => {
      const root = makeTree();
      const before = fingerprint(root);
      const r = run(root, ['--append-btc', '--etf-snapshot']);

      expect(r.status, r.output).not.toBe(0);
      expect(r.output).toContain('cannot be combined with --append-btc');
      expect(r.requests).toEqual([]);
      expect(changedFiles(before, fingerprint(root))).toEqual([]);
    },
    TIMEOUT_MS
  );
});
