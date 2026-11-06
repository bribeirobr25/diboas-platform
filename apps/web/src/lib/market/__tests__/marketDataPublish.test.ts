/**
 * PUBLISH-1 — the Money Tools' monthly series are written from the market data
 * store by apps/web/scripts/market-data/publish.mjs (plan 5.760, increment 2).
 * A synthetic store in a temp folder; the committed files are never touched.
 * The workflow steps that read the store are run as GitHub runs them (their own
 * `run:` scripts, GITHUB_ACTIONS=true) against stand-in `git`, `curl` and `gh`.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as prettier from 'prettier';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DATA_DIR,
  FX_SERIES,
  PRICE_SERIES,
  buildPublication,
  changedPublishedMonths,
  lastCompleteMonth,
  lastWeekday,
  main,
  seriesHashes,
} from '../../../../scripts/market-data/publish.mjs';
import { retryDecision } from '../../../../scripts/market-refresh/retry-decision.mjs';

type Row = Record<string, number | string>;
type Series = { months: Row[]; unit?: string; [k: string]: unknown };
type Files = { prices: Record<string, Series>; fx: Record<string, Series> };
const PRICES = PRICE_SERIES as Record<
  string,
  { store: string; since: string; totalReturn: boolean; prec: number }
>;
const FX = FX_SERIES as Record<string, { store: string; usdPerLocal: boolean }>;
type Built = Files & { through: string; binding: string[] };
// publish.mjs is untyped JavaScript: its result is read through this shape
const build = (store: string, current: Files) =>
  buildPublication(store, current) as unknown as Built;

const REPO = path.resolve(__dirname, '../../../../../..');
const TIMEOUT = 30_000;
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

/**
 * A store whose every series runs from 2010-01 to `through` (or its own `end`),
 * each month ending on its last weekday, and a daily file ending on that day.
 */
function makeStore(through = '2026-10', end: Record<string, string> = {}) {
  const root = tmp();
  const dir = path.join(root, 'derived', 'monthly');
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(root, 'daily'));
  const write = (id: string, tr: boolean, base: number) => {
    const ms = months('2010-01', end[id] ?? through);
    const rows = ms.map((ym, i) => {
      const c = base * (1 + i * 0.002);
      const tri = tr ? (base * (1 + i * 0.003)).toFixed(6) : '';
      return `${ym},${(c * 0.99).toFixed(4)},${(c * 1.02).toFixed(4)},${(c * 0.97).toFixed(4)},${c.toFixed(4)},${tri},0,${lastWeekday(ym)}`;
    });
    fs.writeFileSync(path.join(dir, `${id}.csv`), `${HEAD}\n${rows.join('\n')}\n`);
    const last = lastWeekday(ms.at(-1) as string);
    fs.writeFileSync(
      path.join(root, 'daily', `${id}.csv`),
      `date,open,high,low,close,source\n${last},,,,${base},test\n`
    );
  };
  for (const s of Object.values(PRICES)) write(s.store, s.totalReturn, 100);
  // H.10 quotes EUR, GBP, AUD as USD per unit (about 1.1) and the rest as units per USD
  for (const s of Object.values(FX)) write(s.store, false, s.usdPerLocal ? 1.1 : 5.2);
  return root;
}
/** Rewrite one store file's lines (header kept). */
function editStore(store: string, rel: string, fn: (rows: string[]) => string[]) {
  const f = path.join(store, rel);
  const [head, ...rows] = fs.readFileSync(f, 'utf8').trimEnd().split('\n');
  fs.writeFileSync(f, `${[head, ...fn(rows)].join('\n')}\n`);
}
const setCell = (row: string, col: number, v: string) =>
  row
    .split(',')
    .map((c, i) => (i === col ? v : c))
    .join(',');
const CURRENT = (): Files => ({
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
    expect(out.binding).toEqual(['fx_brl']);
    for (const code of Object.keys(PRICES))
      expect(out.prices[code].months.at(-1)?.ym, code).toBe('2026-09-01');
    for (const code of Object.keys(FX))
      expect(out.fx[code].months.at(-1)?.ym, code).toBe('2026-09-01');
  });

  it('should hold a month back while a series lacks its month-end (H.10 arrives a week late)', () => {
    // The Saturday after a month-roll: FX ends on the last Friday of November,
    // and November 30 (a Monday) is not in the store yet.
    const store = makeStore('2026-11');
    editStore(store, 'derived/monthly/fx_eur.csv', (rows) => [
      ...rows.slice(0, -1),
      setCell(rows.at(-1) as string, 7, '2026-11-27'),
    ]);
    fs.writeFileSync(
      path.join(store, 'daily', 'fx_eur.csv'),
      'date,open,high,low,close,source\n2026-11-27,,,,1.1,test\n'
    );
    const out = build(store, CURRENT());
    expect(out.through).toBe('2026-10');
    expect(out.binding).toEqual(['fx_eur']);
  });

  it('should take a holiday month-end as complete once the store holds a later day', () => {
    // B3 is closed on December 31: the month's last stored day is the 30th.
    const store = makeStore('2025-12');
    editStore(store, 'derived/monthly/ibovespa.csv', (rows) => [
      ...rows.slice(0, -1),
      setCell(rows.at(-1) as string, 7, '2025-12-30'),
    ]);
    const daily = path.join(store, 'daily', 'ibovespa.csv');
    fs.writeFileSync(daily, 'date,open,high,low,close,source\n2025-12-30,,,,1,test\n');
    expect(build(store, CURRENT()).through).toBe('2025-11');
    fs.appendFileSync(daily, '2026-01-02,,,,1,test\n');
    expect(build(store, CURRENT()).through).toBe('2025-12');
  });

  it('should find the last weekday of a month and judge completeness from it', () => {
    expect(lastWeekday('2026-10')).toBe('2026-10-30'); // Oct 31 is a Saturday
    expect(lastWeekday('2026-11')).toBe('2026-11-30'); // a Monday
    const rows = [
      { ym: '2026-09', last_day: '2026-09-30' },
      { ym: '2026-10', last_day: '2026-10-29' },
    ];
    expect(lastCompleteMonth(rows, '2026-10-29')).toBe('2026-09');
    expect(lastCompleteMonth(rows, '2026-11-02')).toBe('2026-10');
  });

  it('should refuse to remove a month the website already shows', () => {
    const store = makeStore('2026-10', { fx_brl: '2026-09' });
    const cur = CURRENT();
    cur.prices.SP500 = { months: [{ ym: '2026-10-01', open: 1, high: 1, low: 1, close: 1 }] };
    expect(() => build(store, cur)).toThrow(
      /last complete month for every series is 2026-09 \(fx_brl\), but the website already shows 2026-10/
    );
  });

  it('should start each series at its fixed month, FX included', () => {
    const out = build(makeStore(), CURRENT());
    for (const [code, s] of Object.entries(PRICES))
      expect(out.prices[code].months[0].ym, code).toBe(`${s.since}-01`);
    for (const code of Object.keys(FX)) expect(out.fx[code].months[0].ym, code).toBe('2010-01-01');
  });

  it('should refuse a store that starts after the site does instead of shortening a series', () => {
    const store = makeStore();
    editStore(store, 'derived/monthly/spy.csv', (rows) => rows.slice(9));
    expect(() => build(store, CURRENT())).toThrow(/SP500: the store starts at 2010-10/);
    const store2 = makeStore();
    editStore(store2, 'derived/monthly/fx_chf.csv', (rows) => rows.slice(3));
    expect(() => build(store2, CURRENT())).toThrow(/CHF: the store starts at 2010-04/);
  });

  it.each([
    ['a zero close', 'gold_spot', 4, '0'],
    ['a negative close', 'ibovespa', 4, '-5'],
    ['a blank close', 'dax', 4, ''],
    ['a value that is not a number', 'qqq', 1, 'n/a'],
    ['a zero total-return close (the re-base)', 'spy', 5, '0'],
  ])('should refuse %s instead of publishing it (TOOLS-CLOSE-1)', (_, id, col, v) => {
    const store = makeStore();
    editStore(store, `derived/monthly/${id}.csv`, (rows) => [
      ...rows.slice(0, -1),
      setCell(rows.at(-1) as string, col, v),
    ]);
    expect(() => build(store, CURRENT())).toThrow(/not a positive number/);
  });

  it('should refuse a bar whose open or close lies outside its low/high', () => {
    const store = makeStore();
    editStore(store, 'derived/monthly/dax.csv', (rows) => [
      ...rows.slice(0, -1),
      setCell(rows.at(-1) as string, 1, '999999'),
    ]);
    expect(() => build(store, CURRENT())).toThrow(/dax 2026-10: the open lies outside/);
    const store2 = makeStore();
    editStore(store2, 'derived/monthly/dax.csv', (rows) => [
      ...rows.slice(0, -1),
      setCell(rows.at(-1) as string, 4, '999999'),
    ]);
    expect(() => build(store2, CURRENT())).toThrow(/dax 2026-10: the close lies outside/);
  });

  it('should widen a bar by a rounding hair to hold its own close', () => {
    // high 100.004 rounds to 100.00 at 2 decimals; the close keeps 4: 100.004
    const store = makeStore();
    editStore(store, 'derived/monthly/spy.csv', (rows) => [
      ...rows.slice(0, -1),
      '2026-10,99.5,100.004,99,100.004,120,0,2026-10-30',
    ]);
    const last = build(store, CURRENT()).prices.SP500.months.at(-1) as Row;
    expect(last.high).toBe(100.004);
    expect(last.closePriceOnly).toBe(100.004);
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

  it('should write each currency in both directions from the way H.10 quotes it, with a unit', () => {
    const store = makeStore();
    const out = build(store, CURRENT());
    const lastClose = (id: string) =>
      Number(
        fs
          .readFileSync(path.join(store, 'derived', 'monthly', `${id}.csv`), 'utf8')
          .trimEnd()
          .split('\n')
          .at(-1)
          ?.split(',')[4]
      );
    // each lands in the field of the direction H.10 quotes it in
    const eur = out.fx.EUR.months.at(-1) as Row;
    expect(eur.closeUsdPerLocal).toBeCloseTo(lastClose('fx_eur'), 6);
    expect(out.fx.BRL.months.at(-1)?.closeLocalPerUsd).toBeCloseTo(lastClose('fx_brl'), 6);
    expect((eur.closeUsdPerLocal as number) * (eur.closeLocalPerUsd as number)).toBeCloseTo(1, 5);
    expect(out.fx.BRL.unit).toBe('closeUsdPerLocal: USD per BRL; closeLocalPerUsd: BRL per USD');
  });

  it('should keep the placeholders the store does not hold yet', () => {
    const cur = CURRENT();
    const out = build(makeStore(), cur);
    expect(out.fx.ARS).toBe(cur.fx.ARS);
  });

  it('should give a series the same hash every time, and hash every key but BTC', () => {
    const store = makeStore();
    const h = seriesHashes(build(store, CURRENT()));
    expect(h).toEqual(seriesHashes(build(store, CURRENT())));
    expect(Object.keys(h)).toContain('fx.ARS');
    expect(Object.keys(h)).not.toContain('prices.BTC');
    expect(Object.keys(h)).toHaveLength(16);
  });
});

describe('changedPublishedMonths: what the weekly PR body reports', () => {
  it('should not count a fund re-based to a new price, and should count a revised month', () => {
    const store = makeStore('2026-09');
    const first = build(store, CURRENT());
    const later = makeStore('2026-10');
    const second = build(later, first);
    // every SP500 close moved (re-based to October's price), yet no month changed
    expect(second.prices.SP500.months[5].close).not.toBe(first.prices.SP500.months[5].close);
    expect(changedPublishedMonths(first, second)).toEqual({});
    editStore(later, 'derived/monthly/fx_gbp.csv', (rows) =>
      rows.map((r) => (r.startsWith('2015-03') ? setCell(r, 4, '5.3') : r))
    );
    expect(changedPublishedMonths(first, build(later, first))).toEqual({ GBP: ['2015-03'] });
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
  const NOW = new Date('2026-11-09T07:00:00Z');
  const json = (out: string, f: string) => JSON.parse(fs.readFileSync(path.join(out, f), 'utf8'));
  const edit = (out: string, f: string, fn: (d: Record<string, Series>) => void) => {
    const d = json(out, f);
    fn(d);
    fs.writeFileSync(path.join(out, f), JSON.stringify(d));
  };

  it('should write both files and a manifest of hashes, never values', () => {
    const { out, store } = setup();
    expect(quiet(() => main(['--store', store, '--store-commit', SHA, '--out', out], NOW))).toBe(0);
    const manifest = json(out, 'store-manifest.json');
    expect(manifest.store_commit).toBe(SHA);
    expect(manifest.published_at).toBe('2026-11-09T07:00:00.000Z');
    expect(manifest.methodology_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.not_covered).toBe(
      'prices.BTC (appended by run.mjs --append-btc until increment 3)'
    );
    expect(Object.keys(manifest.series)).toHaveLength(16);
    for (const v of Object.values(manifest.series)) expect(v).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should write files the weekly run's prettier check accepts", async () => {
    const { out, store } = setup();
    quiet(() => main(['--store', store, '--store-commit', SHA, '--out', out], NOW));
    // the repository's config for the folder the weekly run checks (the files
    // themselves are not read: these are the ones just written to `out`)
    for (const f of ['monthlyPrices.json', 'monthlyFx.json', 'store-manifest.json']) {
      const config = await prettier.resolveConfig(path.join(DATA_DIR, f));
      expect(
        await prettier.check(fs.readFileSync(path.join(out, f), 'utf8'), {
          ...config,
          filepath: f,
        }),
        f
      ).toBe(true);
    }
  });

  it('should pass --check on its own output and fail it after a hand edit of either file', () => {
    const { out, store } = setup();
    quiet(() => main(['--store', store, '--store-commit', SHA, '--out', out], NOW));
    expect(quiet(() => main(['--check', '--store', store, '--out', out]))).toBe(0);
    edit(out, 'monthlyFx.json', (d) => {
      (d.CHF.months[3] as Row).closeLocalPerUsd = 9;
    });
    expect(quiet(() => main(['--check', '--store', store, '--out', out]))).toBe(1);
  });

  it.each([
    [
      'an edited price',
      'monthlyPrices.json',
      (d: Record<string, Series>) => void ((d.GOLD.months[5] as Row).close = 1),
    ],
    [
      'an edited rate',
      'monthlyFx.json',
      (d: Record<string, Series>) => void ((d.EUR.months[0] as Row).closeUsdPerLocal = 9),
    ],
    [
      'an added series',
      'monthlyPrices.json',
      (d: Record<string, Series>) => void (d.SP500_COPY = d.SP500),
    ],
    [
      'an edited placeholder',
      'monthlyFx.json',
      (d: Record<string, Series>) => void d.ARS.months.push({ ym: '2026-01-01' }),
    ],
  ])('should fail --verify-manifest after %s, with no store at all', (_, f, fn) => {
    const { out, store } = setup();
    quiet(() => main(['--store', store, '--store-commit', SHA, '--out', out], NOW));
    expect(quiet(() => main(['--verify-manifest', '--out', out]))).toBe(0);
    edit(out, f, fn);
    expect(quiet(() => main(['--verify-manifest', '--out', out]))).toBe(1);
  });

  it('should leave BTC to its own writer: a BTC append does not trip the manifest', () => {
    const { out, store } = setup();
    quiet(() => main(['--store', store, '--store-commit', SHA, '--out', out], NOW));
    edit(out, 'monthlyPrices.json', (d) => {
      d.BTC.months.push({ ym: '2026-10-01', open: 2, high: 3, low: 2, close: 3 });
    });
    expect(quiet(() => main(['--verify-manifest', '--out', out]))).toBe(0);
  });

  it('should write nothing, exit 3 and say why in the report when the store cannot be read', () => {
    const { out, store } = setup();
    fs.rmSync(path.join(store, 'derived', 'monthly', 'fx_eur.csv'));
    const before = fs.readFileSync(path.join(out, 'monthlyPrices.json'), 'utf8');
    const report = path.join(out, 'note.md');
    const args = ['--store', store, '--store-commit', SHA, '--out', out, '--report', report];
    expect(quiet(() => main(args, NOW))).toBe(3);
    expect(fs.readFileSync(path.join(out, 'monthlyPrices.json'), 'utf8')).toBe(before);
    expect(fs.readFileSync(report, 'utf8')).toMatch(/no derived\/monthly\/fx_eur\.csv/);
  });

  it('should report what it published, and which series held the newest month back', () => {
    const { out } = setup();
    const store = makeStore('2026-10', { fx_jpy: '2026-09' });
    const report = path.join(out, 'note.md');
    const args = ['--store', store, '--store-commit', SHA, '--out', out, '--report', report];
    expect(quiet(() => main(args, NOW))).toBe(0);
    const note = fs.readFileSync(report, 'utf8');
    expect(note).toMatch(
      /^Published through 2026-09 from the market data store \(commit aaaaaaaaaaaa\)\./
    );
    expect(note).toMatch(/2026-10 is not published yet: it is not complete in fx_jpy/);
  });

  it('should refuse a store checkout that is not at the commit it is told to record', () => {
    const { out, store } = setup();
    const git = (...a: string[]) =>
      execFileSync('git', ['-C', store, ...a], { encoding: 'utf8', stdio: 'pipe' }).trim();
    git('init', '-q');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 't');
    const report = path.join(out, 'note.md');
    const args = ['--store', store, '--store-commit', SHA, '--out', out, '--report', report];
    expect(quiet(() => main(args, NOW))).toBe(3);
    expect(fs.readFileSync(report, 'utf8')).toMatch(
      /the store checkout is at [0-9a-f]{12}, not aaaaaaaaaaaa/
    );
    const head = git('rev-parse', 'HEAD');
    expect(quiet(() => main(['--store', store, '--store-commit', head, '--out', out], NOW))).toBe(
      0
    );
  });

  it('should refuse bad arguments with exit 2', () => {
    expect(quiet(() => main(['--store-commit', 'abc']))).toBe(2);
    expect(quiet(() => main(['--store', '/x', '--store-commit', 'abc']))).toBe(2);
    expect(quiet(() => main(['--store', '/x']))).toBe(2); // writing needs the commit it records
    expect(quiet(() => main(['--verify-manifest', '--out']))).toBe(2);
    expect(quiet(() => main(['--store', '/x', '--store-commit', SHA, '--report']))).toBe(2);
  });
});

// ── The workflow steps, run as GitHub runs them ───────────────────────────

const read = (rel: string) => fs.readFileSync(path.join(REPO, rel), 'utf8');
const WEEKLY = read('.github/workflows/market-refresh-weekly.yml');
const DRIFT = read('.github/workflows/market-publish-drift.yml');

/** The `run:` script of a named step (a `run: |` block or a one-line `run:`), dedented. */
function runScript(wf: string, name: string): string {
  const start = wf.indexOf(`- name: ${name}`);
  expect(start, `step "${name}" not found`).toBeGreaterThan(-1);
  const rest = wf.slice(start);
  const next = rest.slice(1).search(/\n {6}- (name|uses):/);
  const lines = (next === -1 ? rest : rest.slice(0, next + 1)).split('\n');
  const at = lines.findIndex((l) => /^\s*run: /.test(l));
  if (!/run: \|\s*$/.test(lines[at])) return lines[at].replace(/^\s*run: /, '');
  const indent = lines[at].search(/\S/) + 2;
  return lines
    .slice(at + 1)
    .filter((l) => l.trim() === '' || l.search(/\S/) >= indent)
    .map((l) => l.slice(indent))
    .join('\n');
}

const TOKEN = 'rt-stand-in'; // a stand-in: real tokens are far longer
const SHA40 = '0123456789abcdef0123456789abcdef01234567';

/**
 * A runner: a repo-shaped folder (the scripts linked in), stand-in `git`,
 * `curl` and `gh` on PATH that log their arguments and environment, and the
 * GitHub files a step writes to.
 */
function runner(
  opts: { fetchFails?: boolean; compare?: string; manifestCommit?: string | null } = {}
) {
  const root = tmp();
  fs.mkdirSync(path.join(root, 'apps/web/scripts'), { recursive: true });
  fs.symlinkSync(
    path.join(REPO, 'apps/web/scripts/market-data'),
    path.join(root, 'apps/web/scripts/market-data')
  );
  const data = path.join(root, 'apps/web/src/lib/market-data/data');
  fs.mkdirSync(data, { recursive: true });
  if (opts.manifestCommit !== undefined)
    fs.writeFileSync(
      path.join(data, 'store-manifest.json'),
      JSON.stringify({ store_commit: opts.manifestCommit })
    );
  const bin = path.join(root, '.bin');
  fs.mkdirSync(bin);
  const log = path.join(root, '.calls.log');
  const stub = (name: string, body: string) => {
    fs.writeFileSync(
      path.join(bin, name),
      `#!/bin/bash\n{ printf '%s ARGV:' ${name}; printf ' %s' "$@"; printf ' ENV:%s\\n' "\${GIT_CONFIG_VALUE_0:-}"; } >> "${log}"\n${body}\n`,
      { mode: 0o755 }
    );
  };
  stub(
    'git',
    `case " $* " in
  *" init "*) mkdir -p "\${@: -1}" ;;
  *" fetch "*) ${opts.fetchFails ? 'echo "fatal: could not read from remote" >&2; exit 128' : 'exit 0'} ;;
  *" rev-parse HEAD"*) [ -d "$2" ] && echo ${SHA40} || exit 128 ;;
  *) exit 0 ;;
esac`
  );
  stub('curl', `cat "\${2}" >/dev/null 2>&1; echo '{"status":"${opts.compare ?? 'ahead'}"}'`);
  const temp = path.join(root, '.runner');
  fs.mkdirSync(temp);
  const output = path.join(temp, 'github-output');
  fs.writeFileSync(output, '');
  const run = (script: string, env: Record<string, string> = {}) => {
    const r = spawnSync('bash', ['--noprofile', '--norc', '-eo', 'pipefail', '-c', script], {
      cwd: root,
      encoding: 'utf8',
      env: {
        PATH: `${bin}:${process.env.PATH ?? ''}`,
        HOME: process.env.HOME ?? '',
        GITHUB_ACTIONS: 'true',
        RUNNER_TEMP: temp,
        GITHUB_OUTPUT: output,
        ...env,
      } as unknown as NodeJS.ProcessEnv,
      timeout: TIMEOUT,
    });
    const outputs = Object.fromEntries(
      fs
        .readFileSync(output, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => l.split(/=(.*)/s).slice(0, 2))
    );
    const calls = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
    return { ...r, outputs, calls, temp };
  };
  return { run };
}
const auth = Buffer.from(`x-access-token:${TOKEN}`).toString('base64');

describe('PUBLISH-1 wiring: the weekly store read, run as on GitHub Actions', () => {
  const script = runScript(WEEKLY, 'Read the market data store (read-only)');

  it(
    'should read the store, register the mask with the runner and output the commit',
    () => {
      const r = runner().run(script, { TOKEN });
      expect(r.status).toBe(0);
      expect(r.outputs).toEqual({ ok: 'true', commit: SHA40 });
      // the mask command reaches the runner (stdout is not captured)
      expect(r.stdout).toContain(`::add-mask::${auth}`);
      // the credential rides in the environment, never on a command line
      expect(r.calls).toMatch(new RegExp(`git ARGV: .*fetch .* ENV:AUTHORIZATION: basic ${auth}`));
      expect(
        r.calls
          .split('ENV:')
          .map((c) => c.split('\n')[0])
          .join('')
      ).not.toContain(TOKEN);
      expect(r.calls.replace(/ENV:[^\n]*/g, '')).not.toMatch(new RegExp(`${TOKEN}|${auth}`));
    },
    TIMEOUT
  );

  it(
    'should fail open: a store that cannot be read leaves the series and says why (C1c)',
    () => {
      const r = runner({ fetchFails: true }).run(script, { TOKEN });
      expect(r.status).toBe(0);
      expect(r.outputs).toEqual({ ok: 'false' });
      expect(fs.readFileSync(path.join(r.temp, 'tools-note.md'), 'utf8')).toMatch(
        /the market data store could not be read/
      );
      const noToken = runner().run(script, { TOKEN: '' });
      expect(noToken.outputs).toEqual({ ok: 'false' });
    },
    TIMEOUT
  );

  it(
    'should fail open when publish.mjs refuses, warning that the reason is in the PR body',
    () => {
      const r = runner();
      const pub = runScript(WEEKLY, 'Publish the Money Tools series from the store').replace(
        'node apps/web/scripts/market-data/publish.mjs',
        'false'
      );
      const res = r.run(pub, { STORE_COMMIT: SHA40 });
      expect(res.status).toBe(0);
      expect(res.stdout).toMatch(/::warning::the Money Tools series were not updated/);
      expect(runScript(WEEKLY, 'Publish the Money Tools series from the store')).toMatch(
        /publish\.mjs --store "\$RUNNER_TEMP\/analytics\/market" --store-commit "\$STORE_COMMIT" --report "\$RUNNER_TEMP\/tools-note\.md"/
      );
    },
    TIMEOUT
  );

  it('should read the store before any install, and publish after the score pipeline', () => {
    const at = (n: string) => WEEKLY.indexOf(`- name: ${n}`);
    expect(at('Read the market data store (read-only)')).toBeLessThan(
      at('Install dependencies (frozen)')
    );
    expect(at('Refresh pipeline (fetch → gate → compute → archive)')).toBeLessThan(
      at('Publish the Money Tools series from the store')
    );
    expect(WEEKLY).toMatch(
      /- name: Publish the Money Tools series from the store\n\s+if: steps\.store\.outputs\.ok == 'true'/
    );
    expect(WEEKLY).toMatch(/if \[ -s "\$RUNNER_TEMP\/tools-note\.md" \]; then/);
  });
});

describe('PUBLISH-1 wiring: the drift check, run as on GitHub Actions', () => {
  const script = runScript(DRIFT, "Read the store at the manifest's commit (read-only)");

  it(
    'should read the store at the manifest commit, after checking it is on the store main',
    () => {
      const r = runner({ manifestCommit: SHA40 }).run(script, { TOKEN });
      expect(r.status).toBe(0);
      expect(r.outputs).toEqual({ skip: 'false', commit: SHA40 });
      expect(r.stdout).toContain(`::add-mask::${auth}`);
      expect(r.calls).toMatch(new RegExp(`curl ARGV: .*compare/${SHA40}\\.\\.\\.main`));
      expect(r.calls.replace(/ENV:[^\n]*/g, '')).not.toMatch(new RegExp(`${TOKEN}|${auth}`));
      expect(
        runScript(DRIFT, 'Rebuild every published series from the store and compare (hashes only)')
      ).toMatch(
        /publish\.mjs --check --store "\$RUNNER_TEMP\/analytics\/market" --store-commit "\$STORE_COMMIT"/
      );
    },
    TIMEOUT
  );

  it.each([
    ['a commit that is not on the store main', { manifestCommit: SHA40, compare: 'diverged' }],
    ['a manifest that records no commit', { manifestCommit: null }],
  ])(
    'should fail on %s',
    (_, opts) => {
      const r = runner(opts).run(script, { TOKEN });
      expect(r.status).not.toBe(0);
    },
    TIMEOUT
  );

  it(
    'should skip, saying so, on a PR without the secret (a fork or Dependabot)',
    () => {
      const r = runner({ manifestCommit: SHA40 }).run(script, { TOKEN: '' });
      expect(r.status).toBe(0);
      expect(r.outputs).toEqual({ skip: 'true' });
      expect(r.stdout).toMatch(/::notice::PUBLISH-1 skipped/);
    },
    TIMEOUT
  );

  it('should verify the manifest on every PR in the CI quality job, without the store', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(
      /run: node apps\/web\/scripts\/market-data\/publish\.mjs --verify-manifest/
    );
    expect(DRIFT).toMatch(/persist-credentials: false/);
  });
});

describe('the rehearsal input (plan 5.760 §8.7)', () => {
  it('should skip the carry, the ETF leg and the PR, and write the would-be PR to the summary', () => {
    expect(WEEKLY).toMatch(/run-name: .*inputs\.rehearsal && 'Market Refresh REHEARSAL \(no PR\)'/);
    for (const step of [
      'Carry an open refresh PR, or refuse (5.632)',
      'Re-check the refresh PR before publishing (5.632)',
      'Open refresh PR',
    ])
      expect(WEEKLY, step).toMatch(
        new RegExp(
          `- name: ${step.replace(/[()]/g, '\\$&')}\\n(\\s+id: \\w+\\n)?\\s+if: \\$\\{\\{ !inputs\\.rehearsal \\}\\}`
        )
      );
    expect(WEEKLY).toMatch(
      /if: \$\{\{ env\.HAS_POLYGON_API_KEY == 'true' && !inputs\.rehearsal \}\}/
    );
    expect(runScript(WEEKLY, 'Rehearsal summary (no PR)')).toMatch(/>> "\$GITHUB_STEP_SUMMARY"/);
  });

  it('should never count a rehearsal as this week’s refresh (the Tuesday retry)', () => {
    const now = new Date('2026-11-10T06:20:00Z');
    const runs = [
      {
        databaseId: 7,
        conclusion: 'success',
        createdAt: '2026-11-09T10:00:00Z',
        displayTitle: 'Market Refresh REHEARSAL (no PR)',
      },
    ];
    expect(retryDecision({ retrySchedule: true, openPrUrl: '', runs, now }).run).toBe(true);
    runs.push({ ...runs[0], databaseId: 8, displayTitle: 'Market Refresh (weekly)' });
    expect(retryDecision({ retrySchedule: true, openPrUrl: '', runs, now }).run).toBe(false);
  });

  it(
    'should never count a rehearsal as the weekly run (the watchdog)',
    () => {
      const wd = read('.github/workflows/market-refresh-watchdog.yml');
      // The listing and its filter only: the age arithmetic below it uses GNU
      // `date -d`, which this suite's macOS hosts lack.
      const full = runScript(wd, 'Assert a Market Refresh run started in the last 24h');
      const script = `${full.slice(0, full.indexOf('if [ -z "$latest" ]'))}echo "LATEST=$latest"`;
      const r = runner();
      const runs = JSON.stringify([
        { createdAt: '2026-11-09T10:00:00Z', displayTitle: 'Market Refresh REHEARSAL (no PR)' },
        { createdAt: '2026-11-02T13:00:00Z', displayTitle: 'Market Refresh (weekly)' },
      ]);
      // gh applies its --jq filter to the listing; the stand-in does the same with jq
      const gh = `gh() { local q=''; while [ $# -gt 0 ]; do [ "$1" = --jq ] && q="$2"; shift; done; printf '%s' '${runs}' | jq -r "$q"; }\n`;
      const res = r.run(gh + script, { GH_TOKEN: 'x', GITHUB_REPOSITORY: 'o/r' });
      expect(res.status).toBe(0);
      expect(res.stdout).toBe('LATEST=2026-11-02T13:00:00Z\n');
    },
    TIMEOUT
  );
});
