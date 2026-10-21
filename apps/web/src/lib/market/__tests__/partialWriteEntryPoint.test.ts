/**
 * A write that fails part-way, watched through the REAL `run.mjs` entry point
 * (2026-10-20, the E1 follow-up registered when #736 merged).
 *
 * Each case spawns `run.mjs` in a child process against a throw-away copy of
 * the pipeline scripts and synthetic data, with a fixed clock, a stubbed
 * network and ONE injected file-system fault (`fixtures/fsFaultInjector.mjs`).
 * It then checks three things together: the exit code, the exact first line
 * of the failure report, and what is actually on disk.
 *
 *   (a)  the ETF ledger append writes half a row, then fails
 *   (a') the same append fails before writing anything
 *   (b)  the refusal-evidence append writes half a row, then fails
 *   (c)  the run-archive append fails part-way AFTER computed.json was written
 *   (d)  computed.json fails AFTER the BTC monthly candle was appended
 *   (d') as (d), and removing the temporary file fails too: it stays behind.
 *        That is a STATED LIMIT, asserted here so it is never mistaken for
 *        something the pipeline cleans up.
 *
 * Where a ledger is involved, the ledger check the weekly workflow runs before
 * opening its PR (`check-ledgers.mjs`) is applied to the result, so the test
 * also proves the fragment would be flagged rather than merged silently.
 *
 * Lives OUTSIDE `src/lib/market-data` and `src/lib/analytics-sdk` (the weekly
 * workflow's blocking directories): it checks code behaviour, never data.
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { checkLedgerAppend } from '../../../../scripts/market-refresh/check-ledgers.mjs';
import {
  MONTHLY_PRICES_PATH,
  REPO_ROOT as INREPO_REPO_ROOT,
} from '../../../../scripts/market-refresh/providers/inrepo.mjs';

const REPO_ROOT = path.join(__dirname, '../../../../../..');
const SCRIPTS = path.join(REPO_ROOT, 'apps/web/scripts/market-refresh');
const fixture = (name: string) => pathToFileURL(path.join(__dirname, 'fixtures', name)).href;
const FAULT = fixture('fsFaultInjector.mjs');
const ETF_STUB = fixture('etfSnapshotNetworkStub.mjs');
const CORE_STUB = fixture('marketCoreNetworkStub.mjs');

/** Monday 06:20 UTC, the weekly slot; the snapshot anchor is the previous Friday. */
const NOW = '2026-10-19T06:20:00Z';
const SHARED_REL = 'apps/web/data/market/shared';
const LEDGER_REL = `${SHARED_REL}/etf-shares-weekly.jsonl`;
const ATTEMPTS_REL = `${SHARED_REL}/etf-snapshot-attempts.jsonl`;
const ARCHIVE_REL = `${SHARED_REL}/run-archive.jsonl`;
const COMPUTED_REL = `${SHARED_REL}/computed.json`;
// From the pipeline's own constant, so the test follows the file if it moves.
const MONTHLY_REL = path.relative(INREPO_REPO_ROOT, MONTHLY_PRICES_PATH);
const TIMEOUT_MS = 40_000;

let tickers: string[] = [];
let etfFixture = '';

beforeAll(async () => {
  const polygon = await import(pathToFileURL(path.join(SCRIPTS, 'providers/polygon.mjs')).href);
  tickers = polygon.SPOT_BTC_ETFS;
  etfFixture = JSON.stringify({
    funds: Object.fromEntries(
      tickers.map((t, i) => [t, { shares: 1_000_000 * (i + 1), price: 20 + i }])
    ),
  });
});

const roots: string[] = [];
afterEach(() => {
  for (const r of roots.splice(0)) fs.rmSync(r, { recursive: true, force: true });
});

/** Synthetic BTC monthly candles from 2019-01 up to and including `lastYm`. */
function monthlyPrices(lastYm: string): string {
  const months: object[] = [];
  for (let y = 2019; y <= 2026; y++) {
    for (let m = 1; m <= 12; m++) {
      const ym = `${y}-${String(m).padStart(2, '0')}-01`;
      if (ym > lastYm) break;
      const close = 10_000 + months.length * 700;
      months.push({ ym, open: close * 0.98, high: close * 1.05, low: close * 0.95, close });
    }
  }
  return `${JSON.stringify({ BTC: { months } })}\n`;
}

/** A throw-away repo layout: the scripts under test plus synthetic data. */
function makeTree({ lastMonth = '2026-09-01' } = {}): string {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'partial-write-')));
  roots.push(root);
  fs.cpSync(SCRIPTS, path.join(root, 'apps/web/scripts/market-refresh'), { recursive: true });
  fs.mkdirSync(path.join(root, SHARED_REL), { recursive: true });
  const week = (anchor: string) =>
    JSON.stringify({
      anchor,
      funds: Object.fromEntries(
        tickers.map((t) => [t, { shares: 1, price: 1, lastUpdated: null }])
      ),
    });
  fs.writeFileSync(path.join(root, LEDGER_REL), `${week('2026-10-02')}\n${week('2026-10-09')}\n`);
  fs.writeFileSync(path.join(root, ARCHIVE_REL), '{"run_at":"2026-10-12T06:20:00Z"}\n');
  fs.mkdirSync(path.dirname(path.join(root, MONTHLY_REL)), { recursive: true });
  fs.writeFileSync(path.join(root, MONTHLY_REL), monthlyPrices(lastMonth));
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

function changedFiles(before: Record<string, string>, after: Record<string, string>): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((k) => before[k] !== after[k]).sort();
}

const read = (root: string, rel: string) =>
  fs.existsSync(path.join(root, rel)) ? fs.readFileSync(path.join(root, rel), 'utf8') : '';

type Fault = { kind: string; target: string };

/** Run `run.mjs` with one stub, one fault and a clean environment. */
function run(root: string, args: string[], stub: 'etf' | 'core', fault: Fault, mode = 'ok') {
  const log = path.join(root, `requests-${crypto.randomUUID()}.log`);
  fs.writeFileSync(log, '');
  const res = spawnSync(
    process.execPath,
    [
      '--import',
      FAULT,
      '--import',
      stub === 'etf' ? ETF_STUB : CORE_STUB,
      path.join(root, 'apps/web/scripts/market-refresh/run.mjs'),
      ...args,
    ],
    {
      cwd: root,
      encoding: 'utf8',
      timeout: TIMEOUT_MS - 5_000,
      env: {
        NODE_ENV: 'test',
        PATH: process.env.PATH ?? '',
        FAULT_KIND: fault.kind,
        FAULT_TARGET: fault.target,
        SNAPSHOT_STUB_NOW: NOW,
        SNAPSHOT_STUB_LOG: log,
        SNAPSHOT_STUB_MODE: mode,
        SNAPSHOT_STUB_FIXTURE: etfFixture,
        CORE_STUB_NOW: NOW,
        CORE_STUB_LOG: log,
        POLYGON_API_KEY: 'test-dummy-key',
      },
    }
  );
  const output = `${res.stdout}\n${res.stderr}`;
  const headline = output.split('\n').find((l) => l.startsWith('✖ ')) ?? '';
  const unexpected = fs.readFileSync(log, 'utf8').includes('"kind":"unexpected"');
  return { status: res.status, output, headline, unexpected };
}

describe('a partial append is reported, never "nothing written" (real run.mjs entry point)', () => {
  it(
    '(a) ETF ledger: half a row on disk, exit 1, the report names the ledger, nothing else changed',
    () => {
      const root = makeTree();
      const before = fingerprint(root);
      const ledgerBefore = read(root, LEDGER_REL);
      const r = run(root, ['--etf-snapshot', '--no-archive'], 'etf', {
        kind: 'append-partial',
        target: 'etf-shares-weekly.jsonl',
      });

      expect(r.status, r.output).toBe(1);
      expect(r.unexpected).toBe(false);
      const ledgerAfter = read(root, LEDGER_REL);
      const fragment = ledgerAfter.slice(ledgerBefore.length);
      expect(ledgerAfter.startsWith(ledgerBefore)).toBe(true); // nothing before it touched
      expect(fragment.length).toBeGreaterThan(0);
      expect(fragment.endsWith('\n')).toBe(false);
      expect(r.headline).toBe(
        `✖ market-refresh failed closed — no write completed, but ${LEDGER_REL} may now end in a ` +
          `partial line (${Buffer.byteLength(fragment)} bytes added before the failure, left as written; ` +
          `review before committing anything):`
      );
      expect(r.output).not.toContain('nothing written');
      expect(changedFiles(before, fingerprint(root))).toEqual([LEDGER_REL]);
      // The workflow's pre-PR check flags it.
      expect(checkLedgerAppend(ledgerBefore, ledgerAfter).ok).toBe(false);
    },
    TIMEOUT_MS
  );

  it(
    "(a') ETF ledger: the append fails before writing, so 'nothing written' is TRUE and kept",
    () => {
      const root = makeTree();
      const before = fingerprint(root);
      const r = run(root, ['--etf-snapshot', '--no-archive'], 'etf', {
        kind: 'append-none',
        target: 'etf-shares-weekly.jsonl',
      });

      expect(r.status, r.output).toBe(1);
      expect(r.headline).toBe('✖ market-refresh failed closed — nothing written beyond the log:');
      expect(changedFiles(before, fingerprint(root))).toEqual([]);
    },
    TIMEOUT_MS
  );

  it(
    '(b) refusal evidence: half a row in the attempts file, ledger untouched, exit 1',
    () => {
      const root = makeTree();
      const before = fingerprint(root);
      const r = run(
        root,
        ['--etf-snapshot', '--no-archive'],
        'etf',
        { kind: 'append-partial', target: 'etf-snapshot-attempts.jsonl' },
        'incomplete'
      );

      expect(r.status, r.output).toBe(1); // the refusal (exit 20) was never established
      const attempts = read(root, ATTEMPTS_REL);
      expect(attempts.length).toBeGreaterThan(0);
      expect(attempts.endsWith('\n')).toBe(false);
      expect(r.headline).toBe(
        `✖ market-refresh failed closed — no write completed, but ${ATTEMPTS_REL} may now end in a ` +
          `partial line (${Buffer.byteLength(attempts)} bytes added before the failure, left as written; ` +
          `review before committing anything):`
      );
      expect(changedFiles(before, fingerprint(root))).toEqual([ATTEMPTS_REL]);
      expect(checkLedgerAppend('', attempts).ok).toBe(false);
    },
    TIMEOUT_MS
  );

  it(
    '(c) run archive: computed.json is named as written AND the archive as possibly partial',
    () => {
      const root = makeTree();
      const before = fingerprint(root);
      const archiveBefore = read(root, ARCHIVE_REL);
      const r = run(root, [], 'core', { kind: 'append-partial', target: 'run-archive.jsonl' });

      expect(r.status, r.output).toBe(1);
      expect(r.unexpected).toBe(false);
      const archiveAfter = read(root, ARCHIVE_REL);
      const fragment = archiveAfter.slice(archiveBefore.length);
      expect(archiveAfter.startsWith(archiveBefore)).toBe(true);
      expect(fragment.length).toBeGreaterThan(0);
      expect(r.headline).toBe(
        '✖ market-refresh failed closed AFTER writing files; already written by this run ' +
          `(review before committing anything): ${COMPUTED_REL}; ${ARCHIVE_REL} may now end in a ` +
          `partial line (${Buffer.byteLength(fragment)} bytes added before the failure, left as written):`
      );
      expect(JSON.parse(read(root, COMPUTED_REL)).regime_code).toBeTruthy();
      expect(changedFiles(before, fingerprint(root))).toEqual([COMPUTED_REL, ARCHIVE_REL]);
      expect(checkLedgerAppend(archiveBefore, archiveAfter).ok).toBe(false);
    },
    TIMEOUT_MS
  );

  it(
    '(d) computed.json fails after the BTC candle was appended: the candle is named, the target untouched',
    () => {
      const root = makeTree({ lastMonth: '2026-08-01' }); // 2026-09 is due on 2026-10-19
      const before = fingerprint(root);
      const r = run(root, ['--append-btc'], 'core', { kind: 'rename', target: 'computed.json' });

      expect(r.status, r.output).toBe(1);
      expect(r.unexpected).toBe(false);
      expect(r.headline).toBe(
        '✖ market-refresh failed closed AFTER writing files; already written by this run ' +
          `(review before committing anything): ${MONTHLY_REL} (BTC 2026-09-01 candle):`
      );
      const months = JSON.parse(read(root, MONTHLY_REL)).BTC.months;
      expect(months[months.length - 1].ym).toBe('2026-09-01');
      // The target was never replaced, the archive never reached, no temp file left.
      expect(changedFiles(before, fingerprint(root))).toEqual([MONTHLY_REL]);
    },
    TIMEOUT_MS
  );

  it(
    "(d') STATED LIMIT: if removing the temporary file also fails, it stays behind and is not reported",
    () => {
      const root = makeTree({ lastMonth: '2026-08-01' });
      const before = fingerprint(root);
      const r = run(root, ['--append-btc'], 'core', {
        kind: 'rename-and-unlink',
        target: 'computed.json',
      });

      expect(r.status, r.output).toBe(1);
      const changed = changedFiles(before, fingerprint(root));
      expect(changed).toContain(MONTHLY_REL);
      const leftovers = changed.filter((f) => /\/\.computed\.json\.\d+\.tmp$/.test(f));
      expect(leftovers).toHaveLength(1);
      expect(fs.existsSync(path.join(root, COMPUTED_REL))).toBe(false);
      expect(r.headline).not.toContain('.tmp'); // the limit: the report does not name it
    },
    TIMEOUT_MS
  );
});
