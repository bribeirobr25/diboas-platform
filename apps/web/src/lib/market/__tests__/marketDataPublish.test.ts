/**
 * PUBLISH-1 — the Money Tools' monthly series are written from the market data
 * store by apps/web/scripts/market-data/publish.mjs (plan 5.760, increment 2).
 * A synthetic store in a temp folder; the committed files are never touched.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FX_SERIES,
  PRICE_SERIES,
  buildPublication,
  main,
  seriesHashes,
} from '../../../../scripts/market-data/publish.mjs';

type Row = Record<string, number | string>;
type Series = { months: Row[]; unit?: string; [k: string]: unknown };
const PRICES = PRICE_SERIES as Record<
  string,
  { store: string; since: string; totalReturn: boolean; prec: number }
>;
const FX = FX_SERIES as Record<string, { store: string; usdPerLocal: boolean }>;
type Built = { prices: Record<string, Series>; fx: Record<string, Series>; through: string };
// publish.mjs is untyped JavaScript: its result is read through this shape
const build = (store: string, current: { prices: object; fx: object }) =>
  buildPublication(store, current) as unknown as Built;

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});
const tmp = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-'));
  dirs.push(d);
  return d;
};

const months = (from: string, to: string) => {
  const out: string[] = [];
  const d = new Date(`${from}-01T00:00:00Z`);
  while (d.toISOString().slice(0, 7) <= to) {
    out.push(d.toISOString().slice(0, 7));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
};
const HEAD = 'ym,open,high,low,close,tr_close,distributions,last_day';

/** A store whose every series runs from 2010-01 to `through` (or its own `end`). */
function makeStore(through = '2026-10', end: Record<string, string> = {}) {
  const root = tmp();
  const dir = path.join(root, 'derived', 'monthly');
  fs.mkdirSync(dir, { recursive: true });
  const write = (id: string, tr: boolean, base: number) => {
    const rows = months('2010-01', end[id] ?? through).map((ym, i) => {
      const c = base * (1 + i * 0.002);
      const tri = tr ? (base * (1 + i * 0.003)).toFixed(6) : '';
      return `${ym},${(c * 0.99).toFixed(4)},${(c * 1.02).toFixed(4)},${(c * 0.97).toFixed(4)},${c.toFixed(4)},${tri},0,${ym}-28`;
    });
    fs.writeFileSync(path.join(dir, `${id}.csv`), `${HEAD}\n${rows.join('\n')}\n`);
  };
  for (const s of Object.values(PRICES)) write(s.store, s.totalReturn, 100);
  for (const s of Object.values(FX)) write(s.store, false, s.usdPerLocal ? 1.1 : 5.2);
  return root;
}
const CURRENT = () => ({
  prices: {
    BTC: {
      basis: 'price_only',
      months: [{ ym: '2026-09-01', open: 1, high: 2, low: 1, close: 2 }],
    },
  },
  fx: { ARS: { source: 'PENDING', months: [] } },
});

describe('publish.mjs builds the Money Tools series from the store', () => {
  it('should publish every series only through the last month ALL of them have', () => {
    const store = makeStore('2026-10', { fx_brl: '2026-09' });
    const out = build(store, CURRENT());
    expect(out.through).toBe('2026-09');
    for (const code of Object.keys(PRICES))
      expect(out.prices[code].months.at(-1)?.ym, code).toBe('2026-09-01');
    for (const code of Object.keys(FX))
      expect(out.fx[code].months.at(-1)?.ym, code).toBe('2026-09-01');
  });

  it('should start each series at the month it starts at on the site today', () => {
    const out = build(makeStore(), CURRENT());
    for (const [code, s] of Object.entries(PRICES))
      expect(out.prices[code].months[0].ym, code).toBe(`${s.since}-01`);
  });

  it('should refuse a store that starts after the site does instead of shortening a series', () => {
    const store = makeStore();
    const f = path.join(store, 'derived', 'monthly', 'spy.csv');
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    fs.writeFileSync(f, [lines[0], ...lines.slice(10)].join('\n'));
    expect(() => build(store, CURRENT())).toThrow(/SP500: the store starts at 2010-10/);
  });

  it('should carry BTC over untouched, because the score reads those rows (5.138)', () => {
    const cur = CURRENT();
    const out = build(makeStore(), cur);
    expect(out.prices.BTC).toBe(cur.prices.BTC);
  });

  it('should re-base a fund so its latest close equals its price, keeping every monthly return', () => {
    const out = build(makeStore(), CURRENT());
    const m = out.prices.SP500.months;
    const last = m.at(-1) as Row;
    expect(last.close).toBe(last.closePriceOnly);
    // the store's total-return index grows 0.3% per step; the published ratio keeps it
    const r = (m[100].close as number) / (m[99].close as number);
    const want = (1 + 0.003 * 105) / (1 + 0.003 * 104); // month index = position + 6 (since 2010-07)
    expect(r).toBeCloseTo(want, 4); // closes are written with 4 decimals
  });

  it('should write each currency in both directions from the way H.10 quotes it', () => {
    const out = build(makeStore(), CURRENT());
    const eur = out.fx.EUR.months.at(-1) as Row;
    const brl = out.fx.BRL.months.at(-1) as Row;
    expect(eur.closeUsdPerLocal).toBeGreaterThan(1); // USD per EUR
    expect(brl.closeLocalPerUsd).toBeGreaterThan(5); // BRL per USD
    expect((eur.closeUsdPerLocal as number) * (eur.closeLocalPerUsd as number)).toBeCloseTo(1, 5);
  });

  it('should keep the placeholders the store does not hold yet', () => {
    const cur = CURRENT();
    const out = build(makeStore(), cur);
    expect(out.fx.ARS).toBe(cur.fx.ARS);
  });

  it('should give a series the same hash every time it is built (the drift check depends on it)', () => {
    const store = makeStore();
    expect(seriesHashes(build(store, CURRENT()))).toEqual(seriesHashes(build(store, CURRENT())));
  });
});

describe('publish.mjs as a command: write, --check, --verify-manifest', () => {
  const setup = () => {
    const out = tmp();
    fs.writeFileSync(path.join(out, 'monthlyPrices.json'), JSON.stringify(CURRENT().prices));
    fs.writeFileSync(path.join(out, 'monthlyFx.json'), JSON.stringify(CURRENT().fx));
    return { out, store: makeStore() };
  };
  const quiet = <T>(fn: () => T): T => {
    const [log, err] = [console.log, console.error];
    console.log = () => {};
    console.error = () => {};
    try {
      return fn();
    } finally {
      [console.log, console.error] = [log, err];
    }
  };
  const SHA = 'a'.repeat(40);

  it('should write both files and a manifest of hashes, never values', () => {
    const { out, store } = setup();
    expect(quiet(() => main(['--store', store, '--store-commit', SHA, '--out', out]))).toBe(0);
    const manifest = JSON.parse(fs.readFileSync(path.join(out, 'store-manifest.json'), 'utf8'));
    expect(manifest.store_commit).toBe(SHA);
    expect(Object.keys(manifest.series)).toHaveLength(15);
    for (const v of Object.values(manifest.series)) expect(v).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should pass --check on its own output and fail it after a hand edit', () => {
    const { out, store } = setup();
    quiet(() => main(['--store', store, '--store-commit', SHA, '--out', out]));
    expect(quiet(() => main(['--check', '--store', store, '--out', out]))).toBe(0);
    const f = path.join(out, 'monthlyPrices.json');
    const p = JSON.parse(fs.readFileSync(f, 'utf8'));
    p.GOLD.months[5].close += 1;
    fs.writeFileSync(f, JSON.stringify(p));
    expect(quiet(() => main(['--check', '--store', store, '--out', out]))).toBe(1);
  });

  it('should fail --verify-manifest after a hand edit, with no store at all', () => {
    const { out, store } = setup();
    quiet(() => main(['--store', store, '--store-commit', SHA, '--out', out]));
    expect(quiet(() => main(['--verify-manifest', '--out', out]))).toBe(0);
    const f = path.join(out, 'monthlyFx.json');
    const x = JSON.parse(fs.readFileSync(f, 'utf8'));
    x.EUR.months[0].closeUsdPerLocal = 9;
    fs.writeFileSync(f, JSON.stringify(x));
    expect(quiet(() => main(['--verify-manifest', '--out', out]))).toBe(1);
  });

  it('should write nothing, exit 3 and say why in the report when the store cannot be read', () => {
    const { out, store } = setup();
    fs.rmSync(path.join(store, 'derived', 'monthly', 'fx_eur.csv'));
    const before = fs.readFileSync(path.join(out, 'monthlyPrices.json'), 'utf8');
    const report = path.join(out, 'note.md');
    expect(quiet(() => main(['--store', store, '--out', out, '--report', report]))).toBe(3);
    expect(fs.readFileSync(path.join(out, 'monthlyPrices.json'), 'utf8')).toBe(before);
    expect(fs.readFileSync(report, 'utf8')).toMatch(/no derived\/monthly\/fx_eur\.csv/);
  });

  it('should refuse bad arguments with exit 2', () => {
    expect(quiet(() => main(['--store-commit', 'abc']))).toBe(2);
    expect(quiet(() => main(['--store', '/x', '--store-commit', 'abc']))).toBe(2);
  });
});

describe('PUBLISH-1 wiring', () => {
  const repo = path.resolve(__dirname, '../../../../../..');
  const read = (rel: string) => fs.readFileSync(path.join(repo, rel), 'utf8');

  it('should verify the manifest on every PR in the CI quality job, without the store', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(
      /run: node apps\/web\/scripts\/market-data\/publish\.mjs --verify-manifest/
    );
  });

  it('should rebuild from the store in its own job, skipping a PR without the secret', () => {
    const wf = read('.github/workflows/market-publish-drift.yml');
    expect(wf).toMatch(/TOKEN: \$\{\{ secrets\.MARKET_DATA_READ_TOKEN \}\}/);
    expect(wf).toMatch(/PUBLISH-1 skipped: this PR has no MARKET_DATA_READ_TOKEN/);
    expect(wf).toMatch(/read-store\.sh "\$RUNNER_TEMP\/analytics" "\$commit"/);
    expect(wf).toMatch(/publish\.mjs --check --store "\$RUNNER_TEMP\/analytics\/market"/);
    expect(wf).toMatch(/persist-credentials: false/);
  });

  it('should read the store without putting the token in a URL or the git config', () => {
    const sh = read('apps/web/scripts/market-data/read-store.sh');
    expect(sh).toMatch(/http\.extraHeader="AUTHORIZATION: basic \$auth"/);
    expect(sh).toMatch(/::add-mask::\$auth/);
    expect(sh).not.toMatch(/x-access-token:\$\{?TOKEN\}?@/);
    expect(sh).toMatch(/compare\/\$want\.\.\.main/);
  });
});
