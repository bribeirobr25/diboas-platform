import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const scripts = path.resolve(
  process.env.MARKET_AUDIT_SCRIPTS ?? path.join(__dirname, '../../../../../scripts/market-refresh')
);
export const load = (file: string) => import(pathToFileURL(path.join(scripts, file)).href);
export const locales = ['en', 'pt-BR', 'es', 'de'] as const;
export const funds = [
  'IBIT',
  'FBTC',
  'GBTC',
  'BTC',
  'ARKB',
  'BITB',
  'HODL',
  'BTCO',
  'EZBC',
  'BRRR',
  'BTCW',
];
export function snapshot(anchor = '2026-10-09', shares: number | null = 1000) {
  return {
    anchor,
    funds: Object.fromEntries(funds.map((t) => [t, { shares, price: 40, lastUpdated: null }])),
  };
}
export type Snapshot = ReturnType<typeof snapshot>;
const dirs: string[] = [];
export function sandbox(rows: Snapshot[] = []) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'market-experiment-')));
  dirs.push(root);
  const shared = path.join(root, 'apps/web/data/market/shared');
  fs.mkdirSync(shared, { recursive: true });
  const ledgerPath = path.join(shared, 'etf-shares-weekly.jsonl');
  const attemptsPath = path.join(shared, 'etf-snapshot-attempts.jsonl');
  fs.writeFileSync(ledgerPath, rows.map((r) => `${JSON.stringify(r)}\n`).join(''));
  return {
    root,
    ledgerPath,
    attemptsPath,
    attemptedAt: '2026-10-26T06:20:00Z',
    source: 'synthetic',
  };
}
export function cleanup() {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
}
export const sha = (p: string) =>
  fs.existsSync(p) ? createHash('sha256').update(fs.readFileSync(p)).digest('hex') : 'absent';

/** Real CLI, copied scripts, inherited credential environment deliberately discarded. */
export function cli(box: ReturnType<typeof sandbox>, mode = 'ok', shares: number | null = 1100) {
  const dest = path.join(box.root, 'apps/web/scripts/market-refresh');
  fs.cpSync(scripts, dest, { recursive: true });
  const net = path.join(box.root, 'requests.jsonl');
  fs.writeFileSync(net, '');
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      path.join(__dirname, 'etfSnapshotNetworkStub.mjs'),
      path.join(dest, 'run.mjs'),
      '--etf-snapshot',
      '--no-archive',
    ],
    {
      cwd: box.root,
      encoding: 'utf8',
      timeout: 30_000,
      env: {
        PATH: process.env.PATH ?? '',
        NODE_ENV: 'test',
        TZ: 'UTC',
        POLYGON_API_KEY: 'synthetic-audit-key',
        SNAPSHOT_STUB_NOW: '2026-10-26T06:20:00Z',
        SNAPSHOT_STUB_MODE: mode,
        SNAPSHOT_STUB_LOG: net,
        SNAPSHOT_STUB_FIXTURE: JSON.stringify(snapshot('2026-10-23', shares)),
      },
    }
  );
  if (result.error) throw result.error;
  return {
    ...result,
    requests: fs
      .readFileSync(net, 'utf8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { kind: string; url: string }),
  };
}

/** Fresh other sources, while the caller independently controls ETF evidence. */
export function computed(at: string, etf: { id: string; anchor: string | null }) {
  const now = new Date(at);
  const monthly = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
    .toISOString()
    .slice(0, 10);
  const weekly = new Date(now);
  do weekly.setUTCDate(weekly.getUTCDate() - 1);
  while (weekly.getUTCDay() !== 5);
  return {
    computed_at: at,
    signals: [
      { id: 'BTC-01', anchor: monthly },
      { id: 'MAC-03', anchor: monthly },
      ...['MAC-01', 'MAC-02', 'REL-01', 'REL-03'].map((id) => ({
        id,
        anchor: weekly.toISOString().slice(0, 10),
      })),
      etf,
    ],
  };
}

/** Xorshift32: seed and fixed bound are part of the reproducibility contract. */
export function random(seed: number) {
  let value = seed;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 0x100000000;
  };
}
