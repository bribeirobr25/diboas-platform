/**
 * Experimental contract audit; intentionally outside the weekly blocking directories.
 * `fails` cases are unresolved defects, NOT a waiver or a successful scenario.
 * MARKET_AUDIT_STRICT=1 exposes them as ordinary failing assertions.
 * Script mutation experiments use MARKET_AUDIT_SCRIPTS, always a disposable copy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { applyReadTimeFreshness } from '../../analytics-sdk/freshness';
import type { DataStatus } from '../../analytics-sdk/types';
import {
  cleanup,
  cli,
  computed,
  load,
  locales,
  random,
  sandbox,
  scripts,
  sha,
  snapshot,
} from './fixtures/experimentalAudit';

const { recordEtfSnapshot, readSnapshots, readAttempts, resolveEtfSignals } =
  await load('lib/etf-flows.mjs');
const { deriveDataStatus } = await load('lib/data-status.mjs');
const { scoreSignals, strictFridayCloses, evaluateMacro, evaluateBtcStructure } =
  await load('lib/regime-engine.mjs');
const { writeFileAtomic } = await load('lib/atomic.mjs');
const { selectSignalTemplate } = await load('lib/template-select.mjs');
const defect = process.env.MARKET_AUDIT_STRICT === '1' ? it : it.fails;
const now = new Date('2026-10-26T06:20:00Z');
const signal = (rows: object[]) => resolveEtfSignals({ snapshots: rows, manual: null }, now)[0];
const panel = (at: string, rows: object[]) =>
  deriveDataStatus(computed(at, signal(rows)), rows) as DataStatus;
afterAll(cleanup);

describe('A: ledger integrity and recovery', () => {
  it('A01 rejects each unusable field independently, preserving original ledger bytes', () => {
    for (const field of ['shares', 'price'] as const) {
      for (const value of [null, 0, -1, NaN, Infinity]) {
        const box = sandbox([snapshot()]);
        const bad = snapshot('2026-10-23');
        Object.assign(bad.funds.IBIT, { [field]: value });
        const before = sha(box.ledgerPath);
        expect(recordEtfSnapshot(bad, box).outcome).toBe('refused');
        expect(sha(box.ledgerPath)).toBe(before);
        expect(readAttempts(box.attemptsPath)).toHaveLength(1);
        expect(readAttempts(box.attemptsPath)[0].missing[field]).toContain('IBIT');
      }
    }
  });

  it('A02 seeded failure/retry sequences preserve every accepted row and prior evidence', () => {
    const rng = random(20261020);
    for (let trial = 0; trial < 200; trial++) {
      const box = sandbox([snapshot()]);
      let prefix = fs.readFileSync(box.ledgerPath, 'utf8');
      for (let week = 0; week < 4; week++) {
        const anchor = new Date(Date.UTC(2026, 9, 16 + 7 * week)).toISOString().slice(0, 10);
        const refusals = Math.floor(rng() * 4);
        for (let attempt = 0; attempt < refusals; attempt++) {
          const previous = fs.existsSync(box.attemptsPath)
            ? fs.readFileSync(box.attemptsPath, 'utf8')
            : '';
          expect(recordEtfSnapshot(snapshot(anchor, null), box).outcome).toBe('refused');
          expect(fs.readFileSync(box.attemptsPath, 'utf8').startsWith(previous)).toBe(true);
          expect(fs.readFileSync(box.ledgerPath, 'utf8')).toBe(prefix);
        }
        const evidence = sha(box.attemptsPath);
        const accepted = snapshot(anchor, 1000 + Math.floor(rng() * 100));
        expect(recordEtfSnapshot(accepted, box).outcome).toBe('recorded');
        expect(fs.readFileSync(box.ledgerPath, 'utf8')).toBe(
          `${prefix + JSON.stringify(accepted)}\n`
        );
        prefix = fs.readFileSync(box.ledgerPath, 'utf8');
        expect(recordEtfSnapshot(snapshot(anchor, 99999), box).outcome).toBe('already-recorded');
        expect(fs.readFileSync(box.ledgerPath, 'utf8')).toBe(prefix);
        expect(sha(box.attemptsPath)).toBe(evidence);
      }
      expect(readSnapshots(box.ledgerPath)).toHaveLength(5);
    }
  });

  it('A03 real CLI refuses partial collection with exit 20, then accepts a complete retry', () => {
    const box = sandbox([snapshot()]);
    const before = sha(box.ledgerPath);
    const failed = cli(box, 'ok', null);
    expect(failed.status).toBe(20);
    expect(failed.stderr).toContain('only the attempt evidence was written');
    expect(sha(box.ledgerPath)).toBe(before);
    const evidence = sha(box.attemptsPath);
    const retry = cli(box);
    // A complete retry is snapshot-only, including after a refused attempt.
    expect(retry.requests.filter((r) => r.kind === 'unexpected')).toEqual([]);
    expect(retry.status).toBe(0);
    expect(readSnapshots(box.ledgerPath).map((r: { anchor: string }) => r.anchor)).toEqual([
      '2026-10-09',
      '2026-10-23',
    ]);
    expect(sha(box.attemptsPath)).toBe(evidence);
    expect(retry.requests.every((r) => !r.url.includes('synthetic-audit-key'))).toBe(true);
  });

  it('A04 provider failure changes neither ledger nor evidence and remains recoverable', () => {
    const box = sandbox([snapshot()]);
    const before = sha(box.ledgerPath);
    const failed = cli(box, 'polygon-fail');
    expect(failed.status).toBe(1);
    expect(failed.requests.every((r) => r.kind === 'polygon')).toBe(true);
    expect(sha(box.ledgerPath)).toBe(before);
    expect(sha(box.attemptsPath)).toBe('absent');
    const retry = cli(box);
    expect(retry.requests.filter((r) => r.kind === 'unexpected')).toEqual([]);
    expect(retry.status).toBe(0);
    expect(readSnapshots(box.ledgerPath)).toHaveLength(2);
  });

  it('A05 historical incomplete record is preserved; CLI exits 21 with no request', () => {
    const box = sandbox([snapshot(), snapshot('2026-10-23', null)]);
    const before = sha(box.ledgerPath);
    const result = cli(box);
    expect(result.status).toBe(21);
    expect(result.requests).toEqual([]);
    expect(result.stderr).toContain('nothing written beyond the log');
    expect(sha(box.ledgerPath)).toBe(before);
  });

  // A06/K06: canonical success + repeat + request isolation coverage now lives
  // in etfSnapshotOnly.test.ts (SNAP-ONLY-1), included by pnpm market:audit.

  defect('K01 torn tail must not swallow the next accepted ledger row (known CC finding)', () => {
    const box = sandbox([snapshot()]);
    const before = fs.readFileSync(box.ledgerPath, 'utf8');
    fs.appendFileSync(box.ledgerPath, '{"anchor":');
    expect(recordEtfSnapshot(snapshot('2026-10-23'), box).outcome).toBe('recorded');
    expect(fs.readFileSync(box.ledgerPath, 'utf8').startsWith(before)).toBe(true);
    expect(readSnapshots(box.ledgerPath).map((r: { anchor: string }) => r.anchor)).toContain(
      '2026-10-23'
    );
  });

  defect('N01 torn attempt tail must not swallow newly acknowledged refusal evidence', () => {
    const box = sandbox([snapshot()]);
    fs.writeFileSync(box.attemptsPath, '{"anchor":');
    expect(recordEtfSnapshot(snapshot('2026-10-23', null), box).outcome).toBe('refused');
    expect(readAttempts(box.attemptsPath)).toHaveLength(1);
  });

  it('A07 interrupted atomic replacement leaves the old JSON and supports retry', () => {
    const box = sandbox();
    const target = path.join(box.root, 'synthetic.json');
    fs.writeFileSync(target, '{"version":1}\n');
    const before = sha(target);
    const rename = vi.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
      throw new Error('synthetic rename failure');
    });
    try {
      expect(() => writeFileAtomic(target, '{"version":2}\n')).toThrow('synthetic rename failure');
      expect(sha(target)).toBe(before);
      expect(fs.readdirSync(box.root).filter((n) => n.endsWith('.tmp'))).toEqual([]);
    } finally {
      rename.mockRestore();
    }
    writeFileAtomic(target, '{"version":2}\n');
    expect(JSON.parse(fs.readFileSync(target, 'utf8'))).toEqual({ version: 2 });
  });
});

describe('B: independent time and scoring oracles', () => {
  it('B01 exhausts 1024 states of the other ten signals: suspended ETF never scores or rescales', () => {
    const weights = [2, 2, 1, 1, 1, 1, 1, 1, 1, 1];
    for (let bits = 0; bits < 1024; bits++) {
      const rest = weights.map((weight, i) => ({
        id: `synthetic-${i}`,
        weight,
        state: bits & (1 << i) ? 'ACTIVE' : 'INACTIVE',
      }));
      const etf = signal([snapshot()]);
      expect(etf.state).toBe('UNAVAILABLE');
      expect(etf.values.variant).toBe('suspended');
      const result = scoreSignals({
        btc: rest.slice(0, 4),
        macro: rest.slice(4, 7),
        rel: rest.slice(7),
        etf: [etf],
      });
      const expected = weights.reduce((sum, w, i) => sum + (bits & (1 << i) ? w : 0), 0);
      expect(result.score).toBe(expected);
      expect(result.groupTotals.institutional_demand).toBe(0);
      const band =
        expected <= 2
          ? 'HOSTILE'
          : expected <= 5
            ? 'DEFENSIVE'
            : expected <= 8
              ? 'NEUTRAL_MIXED'
              : expected <= 11
                ? 'CONSTRUCTIVE'
                : 'VERY_FAVORABLE';
      expect(result.band.code).toBe(band);
    }
  });

  it.each([-1, 0, 1])(
    'B02 ETF 21-day expiry at offset %i ms; incomplete cycles cannot renew it',
    (delta) => {
      const at = new Date(Date.parse('2026-10-30T00:00:00Z') + delta);
      const rows = [snapshot(), snapshot('2026-10-16', null), snapshot('2026-10-23', null)];
      const ds = panel(at.toISOString(), rows);
      const etf = ds.sources.find((s) => s.source.startsWith('Polygon'))!;
      expect(etf.last_updated_at).toBe('2026-10-09T00:00:00Z');
      expect(etf.stale_after).toBe('2026-10-30T00:00:00Z');
      expect(ds.overall_confidence).toBe(delta <= 0 ? 'MODERATE' : 'LOW');
      expect(applyReadTimeFreshness(ds, at).overall_confidence).toBe(ds.overall_confidence);
    }
  );

  it('B03 per-source deadlines are strict (past, not at); clock-only reading never promotes a source', () => {
    // Requirement: the read-time overlay only DOWNGRADES (freshness.ts header:
    // "it never promotes a source the pipeline called DELAYED"), and a deadline
    // is passed only strictly after its instant. Starting from every status the
    // overlay can receive, the result is the worse of the input status and the
    // clock's verdict, never better.
    expect.hasAssertions();
    const rank = { FRESH: 0, DELAYED: 1, STALE: 2 } as const;
    type Graded = keyof typeof rank;
    const ds = panel('2026-10-26T06:20:00Z', [snapshot()]);
    for (const source of ds.sources) {
      for (const key of ['delayed_after', 'stale_after'] as const) {
        const deadline = source[key];
        if (!deadline) continue;
        for (const start of ['FRESH', 'DELAYED', 'STALE'] as const) {
          const isolated = { ...ds, sources: [{ ...source, status: start }] };
          for (const delta of [-1, 0, 1]) {
            const t = new Date(Date.parse(deadline) + delta);
            const output = applyReadTimeFreshness(isolated, t).sources[0].status as Graded;
            const stale = t.getTime() > Date.parse(source.stale_after ?? '');
            const delayed = t.getTime() > Date.parse(source.delayed_after ?? '');
            const clock: Graded = stale ? 'STALE' : delayed ? 'DELAYED' : 'FRESH';
            const expected = rank[start] >= rank[clock] ? start : clock;
            expect(output).toBe(expected);
            expect(rank[output]).toBeGreaterThanOrEqual(rank[start]);
          }
        }
      }
    }
  });

  defect('N02 exact monthly grace boundary must agree at generation and read time', () => {
    const before = panel('2026-11-03T23:59:59.999Z', [snapshot('2026-10-30')]);
    const at = new Date('2026-11-04T00:00:00Z');
    // Hold all observations fixed; only the clock moves.
    const input = computed(before.last_successful_update_at!, signal([snapshot('2026-10-30')]));
    input.signals.find((s) => s.id === 'BTC-01')!.anchor = '2026-09-01';
    const old = deriveDataStatus(input, [snapshot('2026-10-30')]) as DataStatus;
    const built = deriveDataStatus({ ...input, computed_at: at.toISOString() }, [
      snapshot('2026-10-30'),
    ]);
    expect(applyReadTimeFreshness(old, at).sources[0].status).toBe(built.sources[0].status);
  });

  defect('N03 empty ledger must not invent last-updated dates from each new run', () => {
    const first = panel('2026-10-26T06:20:00Z', []);
    const later = panel('2026-12-28T06:20:00Z', []);
    const row = (ds: DataStatus) => ds.sources.find((s) => s.source.startsWith('Polygon'))!;
    // R3: with no evidence added, a new run cannot advance the evidence date.
    // Do not prescribe null representation or a new confidence policy here.
    expect(row(later).last_updated_at).toBe(row(first).last_updated_at);
  });

  it('B04 the host time zone never changes generation or read-time results (DST, month and year rolls)', () => {
    // Requirement: deadlines are UTC instants, so the panel built AND read on a
    // host in any time zone equals the UTC result. (The earlier version compared
    // two spellings of the same instant, which can never differ.) Node honours
    // a runtime change of process.env.TZ; it is restored afterwards.
    const instants = [
      '2026-10-29T23:59:59.999Z',
      '2026-10-30T00:00:00.000Z',
      '2026-10-30T00:00:00.001Z',
      '2026-11-01T06:00:00Z', // US DST ends
      '2026-10-25T01:00:00Z', // EU DST ends
      '2027-01-01T00:00:00Z',
    ];
    const run = () =>
      instants.map((at) =>
        applyReadTimeFreshness(panel('2026-10-26T06:20:00Z', [snapshot()]), new Date(at))
      );
    const original = process.env.TZ;
    try {
      process.env.TZ = 'UTC';
      const utc = run();
      for (const tz of [
        'Asia/Tokyo',
        'America/Los_Angeles',
        'Pacific/Kiritimati',
        'America/Sao_Paulo',
        'Europe/Berlin',
      ]) {
        process.env.TZ = tz;
        expect(new Date(0).getTimezoneOffset()).not.toBe(0); // the switch really happened
        expect(run()).toEqual(utc);
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});

describe('C: communication contract', () => {
  it.each(locales)('C01 missing suspension translation fails closed in %s', (locale) => {
    const templates = JSON.parse(
      fs.readFileSync(path.join(scripts, 'templates/signal-sentences.json'), 'utf8')
    );
    const set = templates['ETF-01'].UNAVAILABLE;
    expect(selectSignalTemplate(set, 'suspended', locale, 'ETF-01')).toBeTruthy();
    delete set.variants.suspended[locale];
    expect(() => selectSignalTemplate(set, 'suspended', locale, 'ETF-01')).toThrow(
      `has no ${locale} template`
    );
  });

  // K02: canonical ordinary regressions in presentationState.test.ts.
});

describe('D: bounded expansion justified by source-quality gaps', () => {
  const daily = Array.from(
    { length: 200 },
    (_, i) => [new Date(Date.UTC(2026, 2, 1 + i)), 100 + i / 100] as [Date, number]
  );
  const m2 = Array.from(
    { length: 13 },
    (_, i) => [new Date(Date.UTC(2025, 9 + i, 1)), 100 + i] as [Date, number]
  );
  defect('K03 M2 with a missing mandatory month must not silently become a 12-month change', () => {
    const missing = m2.map(([d, v]) => [new Date(d), v] as [Date, number]);
    missing[0][0] = new Date('2025-09-01T00:00:00Z'); // 13 months, still 13 rows
    expect(() =>
      evaluateMacro({ dxyDaily: daily, us10yDaily: daily, m2Monthly: missing }, now)
    ).toThrow();
  });
  defect('K04 M2 invalid numeric value must fail closed (known M2 quality gap)', () => {
    const invalid = m2.map(([d, v]) => [d, v] as [Date, number]);
    invalid[0][1] = NaN;
    expect(() =>
      evaluateMacro({ dxyDaily: daily, us10yDaily: daily, m2Monthly: invalid }, now)
    ).toThrow();
  });
  defect('K05 Friday before close is not a confirmed Friday (known CC finding)', () => {
    expect(
      strictFridayCloses(
        [[new Date('2026-10-23T00:00:00Z'), 123]],
        new Date('2026-10-23T01:00:00Z')
      )
    ).toEqual([]);
  });
  it('D01 missing expected BTC month is refused, independent of sufficient history depth', () => {
    const months = Array.from({ length: 60 }, (_, i) => ({
      ym: new Date(Date.UTC(2021, 8 + i, 1)).toISOString().slice(0, 10),
      close: 100 + i,
    }));
    expect(() => evaluateBtcStructure(months, now)).toThrow(/STALE INPUT/);
  });
});
