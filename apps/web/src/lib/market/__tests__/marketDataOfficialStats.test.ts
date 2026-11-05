/**
 * The market data store's official statistics (plan 5.760, founder rulings of
 * 2026-11-05): consumer-price indices and interest rates. Parsers on fixtures
 * cut from real responses, the two new comparison modes, a monthly index end
 * to end with every provider faked, the zero-value rule, the POST source and
 * the commit guard's revisable list. No network; no committed data.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectSeries, comparable } from '../../../../scripts/market-data/collect.mjs';
import { compareCloses, monthlyChanges } from '../../../../scripts/market-data/checks.mjs';
import { createFetcher } from '../../../../scripts/market-data/fetch-source.mjs';
import { createStore, sameValue } from '../../../../scripts/market-data/store.mjs';
import { evaluateStaged } from '../../../../scripts/market-data/commit-guard.mjs';
import { SERIES as SERIES_MJS, SOURCES } from '../../../../scripts/market-data/catalogue.mjs';
import * as P from '../../../../scripts/market-data/parsers.mjs';

// catalogue.mjs is untyped JavaScript; its rows are read through this shape
type CatalogueRow = {
  id: string;
  kind: string;
  revisable?: boolean;
  checks: { compare?: string; tolerance: number }[];
};
const SERIES = SERIES_MJS as unknown as CatalogueRow[];

const tmp: string[] = [];
afterEach(() => {
  for (const d of tmp.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});
const freshStore = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'mdo-'));
  tmp.push(d);
  return createStore(d);
};

// ---- parsers (fixtures are cut from responses saved on 2026-11-05) ----

describe('official-statistics parsers read the real formats', () => {
  it('should read SDMX CSV by column name, quoted commas included, when it comes from BIS or the ECB', () => {
    const bis =
      'FREQ,REF_AREA,UNIT_MEASURE,TITLE_TS,TIME_PERIOD,OBS_VALUE\n' +
      'M,US,628,"Consumer prices, US",2026-08,153.62144\n' +
      'M,US,628,"Consumer prices, US",2026-09,154.520294\n';
    expect(P.parseSdmxCsv(bis, 'bis').rows).toEqual([
      { date: '2026-08-01', close: 153.62144 },
      { date: '2026-09-01', close: 154.520294 },
    ]);
  });

  it('should read the Bundesbank CSV when it is semicolon-separated with a byte-order mark', () => {
    const bbk =
      '﻿DATAFLOW;BBK_STD_FREQ;TIME_PERIOD;OBS_VALUE;BBK_UNIT\n' +
      'BBK:BBIM1(1.0);M;2026-08;0.51;% p.a.\n' +
      'BBK:BBIM1(1.0);M;2026-09;0.52;% p.a.\n';
    expect(P.parseSdmxCsv(bbk, 'bbk').rows.map((r) => r.close)).toEqual([0.51, 0.52]);
  });

  it('should refuse an SDMX body without TIME_PERIOD and OBS_VALUE when the agency returns an error page', () => {
    expect(() => P.parseSdmxCsv('{"status":406}', 'bbk')).toThrow(/no TIME_PERIOD/);
  });

  it('should read BLS v1 months and skip the annual average M13 when it is present', () => {
    const body = JSON.stringify({
      status: 'REQUEST_SUCCEEDED',
      Results: {
        series: [
          {
            data: [
              { year: '2025', period: 'M13', value: '322.0' },
              { year: '2026', period: 'M09', value: '336.940' },
              { year: '2026', period: 'M08', value: '334.980' },
            ],
          },
        ],
      },
    });
    expect(P.parseBlsV1(body, 'bls').rows).toEqual([
      { date: '2026-08-01', close: 334.98 },
      { date: '2026-09-01', close: 336.94 },
    ]);
  });

  it('should refuse a BLS reply that did not succeed when the daily limit or a bad request comes back', () => {
    const body = JSON.stringify({ status: 'REQUEST_NOT_PROCESSED', message: ['threshold'] });
    expect(() => P.parseBlsV1(body, 'bls')).toThrow(/REQUEST_NOT_PROCESSED/);
  });

  it('should read IBGE SIDRA, skipping its header row, when the IPCA index is requested', () => {
    const body = JSON.stringify([
      { V: 'Valor', D3C: 'Mês (Código)' },
      { V: '7633.23', D3C: '202608' },
      { V: '7695.82', D3C: '202609' },
    ]);
    expect(P.parseSidra(body, 'ibge').rows).toEqual([
      { date: '2026-08-01', close: 7633.23 },
      { date: '2026-09-01', close: 7695.82 },
    ]);
  });

  it('should read BCB SGS dates written dd/mm/yyyy when a monthly or daily series is requested', () => {
    const body = '[{"data":"01/08/2026","valor":"-0.32"},{"data":"04/11/2026","valor":"13.75"}]';
    expect(P.parseSgs(body, 'bcb').rows).toEqual([
      { date: '2026-08-01', close: -0.32 },
      { date: '2026-11-04', close: 13.75 },
    ]);
  });

  it('should read Eurostat JSON-stat for one series and refuse a response holding several', () => {
    const one = {
      id: ['freq', 'geo', 'time'],
      size: [1, 1, 2],
      dimension: { time: { category: { index: { '2026-09': 0, '2026-10': 1 } } } },
      value: { '0': 103.93, '1': 103.8 },
    };
    expect(P.parseEurostat(JSON.stringify(one), 'estat').rows).toEqual([
      { date: '2026-09-01', close: 103.93 },
      { date: '2026-10-01', close: 103.8 },
    ]);
    const two = { ...one, size: [1, 2, 2] };
    expect(() => P.parseEurostat(JSON.stringify(two), 'estat')).toThrow(/2 categories/);
  });

  it('should read a Banco de España table by series code, skipping "_" values, when it is Latin-1', () => {
    const body = [
      '"CÓDIGO DE LA SERIE",DN_1TI1T0010,DN_1TI2T0025',
      '"FRECUENCIA","MENSUAL","MENSUAL"',
      '"AGO 2026",0.1582,2.20',
      '"SEP 2026",0.1601,"_"',
    ].join('\n');
    expect(P.parseBdeTable(body, 'bde', { code: 'DN_1TI2T0025' }).rows).toEqual([
      { date: '2026-08-01', close: 2.2 },
    ]);
    expect(() => P.parseBdeTable(body, 'bde', { code: 'NOPE' })).toThrow(/not in the table/);
  });

  it('should read the US Treasury par-yield CSV by column name when one maturity is wanted', () => {
    const body =
      'Date,"1 Mo","6 Mo","1 Yr","2 Yr"\n11/04/2026,4.01,4.25,4.39,4.58\n11/03/2026,4.03,4.26,4.40,4.61\n';
    expect(P.parseTreasuryCsv(body, 'ust', { column: '1 Yr' }).rows).toEqual([
      { date: '2026-11-03', close: 4.4 },
      { date: '2026-11-04', close: 4.39 },
    ]);
  });
});

// ---- the comparison modes ----

const months = (start: string, n: number) =>
  Array.from({ length: n }, (_, i) => {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() + i);
    return d.toISOString().slice(0, 10);
  });
const index = (dates: string[], base = 100, step = (i: number) => 0.2 + 0.1 * Math.sin(i)) => {
  let v = base;
  return dates.map((date, i) => {
    if (i) v *= 1 + step(i) / 100;
    return { date, close: Math.round(v * 1000) / 1000 };
  });
};

describe('checks compare official statistics the way each is published', () => {
  it('should give each change its span in months when the publisher skipped one', () => {
    const rows = [
      { date: '2025-09-01', close: 100 },
      { date: '2025-11-01', close: 101 }, // 2025-10 never published (the 2025 shutdown)
      { date: '2025-12-01', close: 102.01 },
    ];
    const ch = monthlyChanges(rows);
    expect(ch.map((r) => [r.date, r.span])).toEqual([
      ['2025-11-01', 2],
      ['2025-12-01', 1],
    ]);
    expect(ch[1].close).toBeCloseTo(1, 9);
  });

  it('should compare a change across a gap only with a change over the same months', () => {
    const both = [
      { date: '2025-09-01', close: 100 },
      { date: '2025-11-01', close: 101 },
    ];
    const gapless = [
      { date: '2025-09-01', close: 100 },
      { date: '2025-10-01', close: 100.5 },
      { date: '2025-11-01', close: 101 },
    ];
    const s = { kind: 'index' };
    const c = { compare: 'change' };
    // both skipped 2025-10: the two-month changes are compared
    expect(comparable(s, c, both, both).check.map((r: { date: string }) => r.date)).toEqual([
      '2025-11-01',
    ]);
    // only the primary skipped it: its two-month change has nothing to match
    expect(comparable(s, c, both, gapless).check).toEqual([]);
  });

  it('should not call an exact same-day match misaligned when a rate stays flat for weeks', () => {
    const flat = Array.from({ length: 40 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10),
      close: 13.75,
    }));
    expect(compareCloses(flat, flat, 0.001, { mode: 'points' }).alignment?.misaligned).toBe(false);
  });

  it('should agree on changes when two agencies publish the same index on different base years', () => {
    const dates = months('2024-01-01', 24);
    const a = index(dates, 100);
    const b = a.map((r) => ({ ...r, close: Math.round(r.close * 1.6543 * 1000) / 1000 }));
    const res = compareCloses(monthlyChanges(a), monthlyChanges(b), 0.02, {
      mode: 'points',
      shiftUnit: 'month',
    });
    expect(res.outliers).toEqual([]);
    expect(res.alignment?.misaligned).toBe(false);
  });

  it('should report a check shifted by one month when the months are labelled one month early', () => {
    const dates = months('2024-01-01', 24);
    const a = index(dates);
    const shifted = a.map((r, i) => ({ date: dates[i - 1] ?? '2023-12-01', close: r.close }));
    const res = compareCloses(monthlyChanges(a), monthlyChanges(shifted), 5, {
      mode: 'points',
      shiftUnit: 'month',
    });
    expect(res.alignment?.misaligned).toBe(true);
  });

  it('should measure interest rates in absolute points, not relative change, in points mode', () => {
    const p = [{ date: '2026-11-03', close: 0.16 }];
    const c = [{ date: '2026-11-03', close: 0.2 }];
    // 0.04 points apart: 25% in relative terms, inside a 0.05-point tolerance
    expect(compareCloses(p, c, 0.05, { mode: 'points' }).outliers).toEqual([]);
    expect(compareCloses(p, c, 0.05).outliers).toHaveLength(1);
  });

  it('should compare a published change and a daily first-of-month value when the catalogue says so', () => {
    const s = { kind: 'index' };
    const prim = index(months('2026-01-01', 3));
    const pub = monthlyChanges(prim);
    const cmp = comparable(s, { compare: 'change', checkIsChange: true }, prim, pub);
    expect(cmp.primary).toEqual(cmp.check);
    const daily = [
      { date: '2026-10-01', close: 0.1616 },
      { date: '2026-10-02', close: 0.12 },
      { date: '2026-11-01', close: 0.1196 },
    ];
    const tr = comparable(
      { kind: 'monthly' },
      { compare: 'points', onlyFirstOfMonth: true },
      [],
      daily
    );
    expect(tr.check.map((r: { date: string }) => r.date)).toEqual(['2026-10-01', '2026-11-01']);
    expect(tr.opts).toMatchObject({ mode: 'points', shiftUnit: 'month' });
  });
});

// ---- a monthly index end to end ----

const TODAY = '2026-11-05';
const DATES = months('2024-09-01', 25); // 2024-09 .. 2026-09
const PRIMARY = index(DATES, 300);
const sdmx = (rows: { date: string; close: number }[]) =>
  `TIME_PERIOD,OBS_VALUE\n${rows.map((r) => `${r.date.slice(0, 7)},${r.close}`).join('\n')}\n`;
const fakeFetch = (routes: Record<string, string>) => async (url: string) => {
  const r = routes[new URL(url).host];
  if (r == null) throw new Error(`connect ECONNREFUSED ${new URL(url).host}`);
  return new Response(r, { status: 200 });
};
const indexSeries = (tolerance = 0.02, over: object = {}) => ({
  id: 't',
  kind: 'index',
  since: '2024-09-01',
  primary: { provider: 'ecb', parser: 'sdmx', url: () => 'https://p.test/x' },
  checks: [
    {
      source: { provider: 'bis', parser: 'sdmx', url: () => 'https://c.test/x' },
      compare: 'change',
      tolerance,
      relation: 'same-figure',
    },
  ],
  fullHistory: true,
  ...over,
});
type Run = {
  blocked: string[];
  added?: number;
  held?: number;
  notes: string[];
  revisions?: object[];
};
type Rows = { date: string; close: number }[];
const runIdx = async ({
  primary = PRIMARY,
  check,
  store = freshStore(),
  series = indexSeries(),
  backfill = true,
}: {
  primary?: Rows;
  check: Rows;
  store?: ReturnType<typeof createStore>;
  series?: object;
  backfill?: boolean;
}) => {
  const fetcher = createFetcher({
    store,
    retryBaseMs: 1,
    fetchImpl: fakeFetch({ 'p.test': sdmx(primary), 'c.test': sdmx(check) }),
  });
  // collect.mjs is untyped JavaScript: its result is read as a plain record here
  const out: Run = await collectSeries(series, {
    store,
    fetcher,
    today: TODAY,
    backfill,
    exceptions: [],
  });
  return { out, store };
};
const runIndex = (check: Rows) => runIdx({ check });
const storedRows = (store: ReturnType<typeof createStore>) =>
  fs.existsSync(path.join(store.root, 'daily', 't.csv'))
    ? fs
        .readFileSync(path.join(store.root, 'daily', 't.csv'), 'utf8')
        .trim()
        .split('\n').length - 1
    : 0;

describe('a monthly price index is stored only when its changes agree', () => {
  it('should store the index and no weekly series when the check agrees on another base year', async () => {
    const rebased = PRIMARY.map((r) => ({ ...r, close: Math.round((r.close / 3) * 1e6) / 1e6 }));
    const { out, store } = await runIndex(rebased);
    expect(out.blocked).toEqual([]);
    expect(out.added).toBe(25);
    expect(fs.existsSync(path.join(store.root, 'derived', 'weekly', 't.csv'))).toBe(false);
    expect(fs.existsSync(path.join(store.root, 'derived', 'monthly', 't.csv'))).toBe(true);
  });

  it('should block and write nothing when one month-on-month change disagrees', async () => {
    const wrong = PRIMARY.map((r, i) => (i === 20 ? { ...r, close: r.close * 1.004 } : r));
    const { out, store } = await runIndex(wrong);
    expect(out.blocked.join(' ')).toMatch(/beyond 0.02 points/);
    expect(fs.existsSync(path.join(store.root, 'daily', 't.csv'))).toBe(false);
  });

  it('should block by the month-shift alignment alone when the check is labelled one month early', async () => {
    const early = PRIMARY.map((r, i) => ({ ...r, date: DATES[i - 1] ?? '2024-08-01' }));
    // a tolerance wide enough that no single month is an outlier: only the
    // alignment test can see the shift
    const { out } = await runIdx({ check: early, series: indexSeries(5) });
    expect(out.blocked).toEqual(['check bis looks shifted by one month']);
  });
});

describe('the collector holds, re-checks and refuses what no check has verified', () => {
  it('should hold the newest month until the check publishes it, then check it', async () => {
    const store = freshStore();
    const lagging = PRIMARY.slice(0, -1); // the check has not published 2026-09 yet
    const first = await runIdx({ check: lagging, store });
    expect(first.out.blocked).toEqual([]);
    expect(first.out.held).toBe(1);
    expect(storedRows(store)).toBe(24);
    // a week later the check publishes 2026-09, and the primary's value is wrong
    const wrong = PRIMARY.map((r, i) => (i === 24 ? { ...r, close: r.close * 1.05 } : r));
    const second = await runIdx({ primary: wrong, check: PRIMARY, store, backfill: false });
    expect(second.out.blocked.join(' ')).toMatch(/beyond 0.02 points \(first 2026-09-01\)/);
    expect(storedRows(store)).toBe(24);
  });

  it('should block as stale when a check has published nothing for longer than the limit', async () => {
    const old = PRIMARY.slice(0, -3); // three months behind (limit: 2)
    const { out, store } = await runIdx({ check: old });
    expect(out.blocked.join(' ')).toMatch(/checks are stale: 3 row\(s\)/);
    expect(storedRows(store)).toBe(0);
  });

  it('should block a revision of a stored month when the check still disagrees with it', async () => {
    const store = freshStore();
    await runIdx({ check: PRIMARY, store, series: indexSeries(0.02, { revisable: true }) });
    const revised = PRIMARY.map((r, i) => (i === 10 ? { ...r, close: r.close * 1.08 } : r));
    const { out } = await runIdx({
      primary: revised,
      check: PRIMARY,
      store,
      series: indexSeries(0.02, { revisable: true }),
      backfill: false,
    });
    expect(out.blocked.join(' ')).toMatch(/beyond 0.02 points/);
  });

  it('should check the month after a gap both sources skipped', async () => {
    const gap = PRIMARY.filter((_, i) => i !== 20);
    const wrongAfter = gap.map((r) => (r.date === DATES[21] ? { ...r, close: r.close * 1.1 } : r));
    const { out } = await runIdx({ primary: wrongAfter, check: gap });
    expect(out.blocked.join(' ')).toMatch(/beyond 0.02 points/);
  });

  it('should report a value the publisher flags as estimated when the primary is Eurostat', async () => {
    const estat = {
      id: ['geo', 'time'],
      size: [1, 2],
      dimension: { time: { category: { index: { '2026-09': 0, '2026-10': 1 } } } },
      value: { '0': 103.93, '1': 103.8 },
      status: { '1': 'e' },
    };
    expect(P.parseEurostat(JSON.stringify(estat), 'estat').flagged).toEqual([
      { date: '2026-10-01', flag: 'e' },
    ]);
  });
});

// ---- the store, the fetch layer and the commit guard ----

describe('the store, the fetch layer and the guard handle official statistics', () => {
  it('should treat zero as a real value when an interest rate is 0 in both the store and the source', () => {
    expect(sameValue(0, 0)).toBe(true);
    expect(sameValue(-0.5, -0.5)).toBe(true);
    expect(sameValue(0.1196, 0.1196 * (1 + 1e-12))).toBe(true);
    expect(sameValue(0, 0.0001)).toBe(false);
    expect(sameValue(13.75, 13.65)).toBe(false);
  });

  it('should send BLS its years in a POST body when the series is fetched', async () => {
    const seen: { url: string; method?: string; body?: string }[] = [];
    const body = JSON.stringify({
      status: 'REQUEST_SUCCEEDED',
      Results: {
        series: [
          {
            seriesID: 'CUUR0000SA0',
            data: [{ year: '2010', period: 'M01', value: '216.687' }],
          },
        ],
      },
    });
    const store = freshStore();
    const fetcher = createFetcher({
      store,
      retryBaseMs: 1,
      fetchImpl: async (url: string, opts: { method?: string; body?: string }) => {
        seen.push({ url, method: opts?.method, body: opts?.body });
        return new Response(body, { status: 200 });
      },
    });
    await fetcher.fetchSource(SOURCES.bls('CUUR0000SA0'), {
      from: '2010-01-01',
      to: '2026-10-31',
      series: 'cpi_us',
    });
    expect(seen.length).toBeGreaterThanOrEqual(2); // ten years at most per request
    for (const s of seen) {
      expect(s.method).toBe('POST');
      const q = JSON.parse(String(s.body));
      expect(q.seriesid).toEqual(['CUUR0000SA0']);
      expect(Number(q.endyear) - Number(q.startyear)).toBeLessThan(10);
    }
  });

  it('should let only revisable catalogue series change stored lines when the commit is checked', () => {
    const revisable = SERIES.filter((s) => s.revisable).map((s) => s.id);
    expect(revisable).toEqual(expect.arrayContaining(['us_m2', 'hicp_de', 'hicp_es']));
    const mod = (id: string) => ({ status: 'M', path: `market/daily/${id}.csv` });
    const numstat = new Map(
      ['hicp_de', 'cpi_us'].map((id) => [`market/daily/${id}.csv`, { added: 1, deleted: 1 }])
    );
    expect(evaluateStaged([mod('hicp_de')], numstat)).toEqual([]);
    expect(evaluateStaged([mod('cpi_us')], numstat)).toEqual([
      'market/daily/cpi_us.csv: lines removed from an append-only file',
    ]);
  });

  it('should give every catalogue series a unique id and a comparison its kind supports', () => {
    const ids = SERIES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SERIES) {
      for (const c of s.checks) {
        if (c.compare === 'change') expect(s.kind, s.id).toBe('index');
        if (s.kind === 'index') expect(c.compare, s.id).toBe('change');
        expect(c.tolerance, s.id).toBeGreaterThan(0);
      }
    }
  });
});

// ---- review of #820 (2026-11-05): strict parsing, the fetch layer, the catalogue rules ----

describe('official-statistics parsers refuse what they cannot read exactly', () => {
  it('should refuse a decimal comma instead of storing a value 100 times too large', () => {
    expect(() => P.parseSdmxCsv('TIME_PERIOD;OBS_VALUE\n2026-09;0,51\n', 'bbk')).toThrow(
      /unreadable number "0,51"/
    );
    expect(() => P.parseSgs('[{"data":"01/08/2026","valor":"0,32"}]', 'bcb')).toThrow(
      /unreadable number/
    );
    const bde = '"CÓDIGO DE LA SERIE",X\n"SEP 2026","0,57"\n';
    expect(() => P.parseBdeTable(bde, 'bde', { code: 'X' })).toThrow(/unreadable number/);
  });

  it('should refuse a date seen twice when two series arrive in one SDMX response', () => {
    const two = 'REF_AREA,TIME_PERIOD,OBS_VALUE\nDE,2026-09,1\nES,2026-09,999\n';
    expect(() => P.parseSdmxCsv(two, 'ecb')).toThrow(/appears twice/);
  });

  it('should refuse a cut-off SDMX row or a quoted field that spans lines', () => {
    expect(() => P.parseSdmxCsv('A,TIME_PERIOD,OBS_VALUE\nx,2026-09\n', 'ecb')).toThrow(
      /2 of 3 fields/
    );
    expect(() => P.parseSdmxCsv('A,TIME_PERIOD,OBS_VALUE\n"x,2026-09,1\n', 'ecb')).toThrow(
      /spans lines/
    );
  });

  it('should refuse a SIDRA reply without its header row instead of losing the first month', () => {
    const noHeader = JSON.stringify([{ V: '7633.23', D3C: '202608' }]);
    expect(() => P.parseSidra(noHeader, 'ibge')).toThrow(/no SIDRA header row/);
  });

  it('should refuse a BLS reply for a different series than the one asked for', () => {
    const body = JSON.stringify({
      status: 'REQUEST_SUCCEEDED',
      Results: { series: [{ seriesID: 'CUUR0000SA0L1E', data: [] }] },
    });
    expect(() => P.parseBlsV1(body, 'bls', { seriesId: 'CUUR0000SA0' })).toThrow(/not CUUR0000SA0/);
  });

  it('should keep the full-month TR period when several periods start on 1 March', () => {
    const body = JSON.stringify([
      { data: '28/02/2010', dataFim: '28/03/2010', valor: '0.0013' },
      { data: '01/03/2010', dataFim: '29/03/2010', valor: '0.0016' },
      { data: '01/03/2010', dataFim: '31/03/2010', valor: '0.0566' },
      { data: '01/03/2010', dataFim: '01/04/2010', valor: '0.0792' },
    ]);
    expect(P.parseSgs(body, 'bcb', { fullMonthPeriods: true }).rows).toEqual([
      { date: '2010-02-28', close: 0.0013 },
      { date: '2010-03-01', close: 0.0792 },
    ]);
    // read without the option, the same reply mixes three periods on one date
    expect(() => P.parseSgs(body, 'bcb')).toThrow(/appears twice/);
  });

  it('should refuse bad dates in SGS and Treasury replies instead of skipping them', () => {
    expect(() => P.parseSgs('[{"data":"2026-08-01","valor":"1"}]', 'bcb')).toThrow(/bad date/);
    expect(() =>
      P.parseTreasuryCsv('Date,"1 Yr"\n2026-11-04,4.39\n', 'ust', { column: '1 Yr' })
    ).toThrow(/bad date/);
  });

  it('should map every Spanish month label to its own month when a Banco de España table is read', () => {
    const labels = [
      'ENE',
      'FEB',
      'MAR',
      'ABR',
      'MAY',
      'JUN',
      'JUL',
      'AGO',
      'SEP',
      'OCT',
      'NOV',
      'DIC',
    ];
    const body = ['"CÓDIGO DE LA SERIE",X', ...labels.map((m, i) => `"${m} 2026",${i + 1}`)].join(
      '\n'
    );
    const rows = P.parseBdeTable(body, 'bde', { code: 'X' }).rows;
    expect(rows.map((r) => [r.date.slice(5, 7), r.close])).toEqual(
      labels.map((_, i) => [String(i + 1).padStart(2, '0'), i + 1])
    );
  });
});

describe('the fetch layer sends what each official source needs', () => {
  const okBls = JSON.stringify({
    status: 'REQUEST_SUCCEEDED',
    Results: { series: [{ seriesID: 'X', data: [] }] },
  });

  it('should send a POST even when the source is not fetched in chunks', async () => {
    const seen: { method?: string }[] = [];
    const store = freshStore();
    const fetcher = createFetcher({
      store,
      retryBaseMs: 1,
      fetchImpl: async (_url: string, opts: { method?: string }) => {
        seen.push({ method: opts?.method });
        return new Response(okBls, { status: 200 });
      },
    });
    const one = { ...SOURCES.bls('X'), chunkDays: undefined };
    await fetcher.fetchSource(one, { from: '2025-01-01', to: '2026-10-31', series: 't' });
    expect(seen).toEqual([{ method: 'POST' }]);
  });

  it('should pass the method and body through the shared fetchWithTimeout to the network', async () => {
    const http = await import('node:http');
    const got: { method?: string; body: string }[] = [];
    const server = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        got.push({ method: req.method, body });
        res.end(okBls);
      });
    });
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()));
    const { port } = server.address() as { port: number };
    try {
      const { fetchWithTimeout } =
        await import('../../../../scripts/market-refresh/lib/fetch-timeout.mjs');
      const res = await fetchWithTimeout(`http://127.0.0.1:${port}/`, {
        method: 'POST',
        body: '{"seriesid":["X"]}',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(res.status).toBe(200);
      const plain = await fetchWithTimeout(`http://127.0.0.1:${port}/`);
      expect(plain.status).toBe(200);
    } finally {
      server.close();
    }
    expect(got).toEqual([
      { method: 'POST', body: '{"seriesid":["X"]}' },
      { method: 'GET', body: '' },
    ]);
  });

  it('should record a POST method and request body in the raw manifest', async () => {
    const store = freshStore();
    const fetcher = createFetcher({
      store,
      retryBaseMs: 1,
      fetchImpl: async () => new Response(okBls, { status: 200 }),
    });
    await fetcher.fetchSource(SOURCES.bls('X'), {
      from: '2025-01-01',
      to: '2026-10-31',
      series: 't',
    });
    const lines = fs
      .readFileSync(path.join(store.root, 'raw', 'manifest.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .map((l) => JSON.parse(l));
    expect(lines[0]).toMatchObject({ method: 'POST' });
    expect(JSON.parse(lines[0].request_body)).toMatchObject({ seriesid: ['X'], startyear: '2025' });
  });

  it('should send the Bundesbank its Accept header and decode Banco de España as Latin-1', async () => {
    const seen: Record<string, string>[] = [];
    const latin1 = Buffer.from('"CÓDIGO DE LA SERIE",X\n"SEP 2026",0.16\n', 'latin1');
    const store = freshStore();
    const fetcher = createFetcher({
      store,
      retryBaseMs: 1,
      fetchImpl: async (url: string, opts: { headers: Record<string, string> }) => {
        seen.push(opts.headers);
        return url.includes('bde.es')
          ? new Response(latin1, { status: 200 })
          : new Response('TIME_PERIOD;OBS_VALUE\n2026-09;0.52\n', { status: 200 });
      },
    });
    await fetcher.fetchSource(SOURCES.bundesbank('BBIM1', 'K'), {
      from: '2026-09-01',
      to: '2026-10-31',
      series: 't',
    });
    expect(seen[0].Accept).toBe('text/csv');
    const r = await fetcher.fetchSource(SOURCES.bde('be1907', 'X'), {
      from: '2026-09-01',
      to: '2026-10-31',
      series: 't',
    });
    expect(r.rows).toEqual([{ date: '2026-09-01', close: 0.16 }]);
  });
});

describe('every catalogue check states what it is and is re-read whole when monthly', () => {
  type Check = {
    relation?: string;
    compare?: string;
    tolerance: number;
    source: { url: (...a: string[]) => string };
  };
  const rows = SERIES as unknown as {
    id: string;
    kind: string;
    fullHistory?: boolean;
    checks: Check[];
  }[];

  it('should give every check a relation, independent or another publication of the same figure', () => {
    for (const s of rows)
      for (const c of s.checks) expect(['independent', 'same-figure'], s.id).toContain(c.relation);
  });

  it('should re-read every monthly or index series with a check in full, so the check sees it', () => {
    for (const s of rows)
      if (['monthly', 'index'].includes(s.kind) && s.checks.length)
        expect(s.fullHistory, s.id).toBe(true);
  });

  it('should keep every tolerance small enough to catch a real error', () => {
    for (const s of rows)
      for (const c of s.checks) {
        if (c.compare) expect(c.tolerance, s.id).toBeLessThanOrEqual(0.05);
        else expect(c.tolerance, s.id).toBeLessThanOrEqual(0.05);
      }
  });

  it('should check the IPCA against the BCB series that publishes its monthly change (SGS 433)', () => {
    const br = rows.find((s) => s.id === 'cpi_br');
    expect(br?.checks[0].source.url('2026-01-01', '2026-10-31')).toContain('bcdata.sgs.433/');
  });
});
