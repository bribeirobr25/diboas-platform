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
  it('should compute month-on-month changes only between consecutive months when one is missing', () => {
    const rows = [
      { date: '2025-09-01', close: 100 },
      { date: '2025-11-01', close: 101 }, // 2025-10 never published (the 2025 shutdown)
      { date: '2025-12-01', close: 102.01 },
    ];
    const ch = monthlyChanges(rows);
    expect(ch.map((r) => r.date)).toEqual(['2025-12-01']);
    expect(ch[0].close).toBeCloseTo(1, 9);
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
const indexSeries = {
  id: 't',
  kind: 'index',
  since: '2024-09-01',
  primary: { provider: 'ecb', parser: 'sdmx', url: () => 'https://p.test/x' },
  checks: [
    {
      source: { provider: 'bis', parser: 'sdmx', url: () => 'https://c.test/x' },
      compare: 'change',
      tolerance: 0.02,
    },
  ],
  fullHistory: true,
};
const runIndex = async (check: { date: string; close: number }[]) => {
  const store = freshStore();
  const fetcher = createFetcher({
    store,
    retryBaseMs: 1,
    fetchImpl: fakeFetch({ 'p.test': sdmx(PRIMARY), 'c.test': sdmx(check) }),
  });
  // collect.mjs is untyped JavaScript: its result is read as a plain record here
  const out: { blocked: string[]; added?: number } = await collectSeries(indexSeries, {
    store,
    fetcher,
    today: TODAY,
    backfill: true,
    exceptions: [],
  });
  return { out, store };
};

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

  it('should block when the check is the same index labelled one month early', async () => {
    const early = PRIMARY.map((r, i) => ({ ...r, date: DATES[i - 1] ?? '2024-08-01' }));
    const { out } = await runIndex(early);
    expect(out.blocked.join(' ')).toMatch(/shifted by a day|beyond/);
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
      Results: { series: [{ data: [{ year: '2010', period: 'M01', value: '216.687' }] }] },
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
