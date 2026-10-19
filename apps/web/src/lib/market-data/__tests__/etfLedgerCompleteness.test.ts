/**
 * ETF-01 ledger: records, completeness and refused collections (2026-10-19).
 *
 * The 2026-10-19 run appended a ledger record anchored 2026-10-16 with a price
 * for all 11 funds and NO share count for any of them. Until this change such
 * a record was accepted as a week, would have read as a zero flow had ETF-01
 * been scored, and moved the panel's "last updated" forward. Locked here:
 *   1. a record is COMPLETE only when every fund it lists has a positive share
 *      count and price; an incomplete record is never a usable week or a zero
 *      flow;
 *   2. an incomplete collection is refused as ledger data and kept as evidence
 *      apart from the ledger; the ledger is untouched and the same week can be
 *      collected again; existing records (complete or not) are never modified;
 *   3. the panel counts records and complete records apart, never calls a
 *      complete record a usable week, and dates the row by the latest COMPLETE
 *      record, so an incomplete record or a refused attempt cannot make the
 *      source look updated.
 * Rules only: synthetic ledgers in throw-away files, no committed data read
 * (this directory is a weekly blocking gate, GATE-BOUND-1).
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  evaluateEtf01FromFlows,
  readAttempts,
  readSnapshots,
  recordEtfSnapshot,
} from '../../../../scripts/market-refresh/lib/etf-flows.mjs';
import {
  isCompleteSnapshot,
  ledgerCoverage,
  missingFields,
} from '../../../../scripts/market-refresh/lib/etf-coverage.mjs';
import { suspendedEtfSignal } from '../../../../scripts/market-refresh/lib/etf-suspension.mjs';
import { deriveDataStatus } from '../../../../scripts/market-refresh/lib/data-status.mjs';
import { applyReadTimeFreshness } from '../../analytics-sdk/freshness';
import type { DataStatus } from '../../analytics-sdk/types';

type Fund = { shares: number | null; price: number | null; lastUpdated: string | null };
const ok = (shares: number, price = 40): Fund => ({ shares, price, lastUpdated: null });
const noShares = (price = 40): Fund => ({ shares: null, price, lastUpdated: null });

const complete = (anchor: string, ibit: number) => ({
  anchor,
  funds: { IBIT: ok(ibit), FBTC: ok(200e6) },
});
/** The 2026-10-16 shape: prices for every fund, no share counts at all. */
const noCounts = (anchor: string) => ({ anchor, funds: { IBIT: noShares(), FBTC: noShares() } });

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) fs.rmSync(d, { recursive: true, force: true });
});
function files(ledgerRows: object[]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'etf-ledger-'));
  dirs.push(dir);
  const ledgerPath = path.join(dir, 'etf-shares-weekly.jsonl');
  const attemptsPath = path.join(dir, 'etf-snapshot-attempts.jsonl');
  fs.writeFileSync(ledgerPath, ledgerRows.map((r) => `${JSON.stringify(r)}\n`).join(''));
  return { ledgerPath, attemptsPath };
}
const sha = (p: string) =>
  fs.existsSync(p) ? createHash('sha256').update(fs.readFileSync(p)).digest('hex') : 'absent';

describe('completeness', () => {
  it('should call a record complete only when every listed fund has a share count and a price', () => {
    expect(isCompleteSnapshot(complete('2026-10-09', 1000e6))).toBe(true);
    expect(isCompleteSnapshot(noCounts('2026-10-16'))).toBe(false);
    expect(
      isCompleteSnapshot({
        anchor: 'x',
        funds: { IBIT: ok(1e6), FBTC: { ...ok(1e6), price: null } },
      })
    ).toBe(false);
    expect(isCompleteSnapshot({ anchor: 'x', funds: { IBIT: ok(0) } })).toBe(false);
    expect(isCompleteSnapshot({ anchor: 'x', funds: {} })).toBe(false);
  });

  it('should name what is missing, per field', () => {
    expect(missingFields(noCounts('2026-10-16'))).toEqual({ shares: ['IBIT', 'FBTC'], price: [] });
  });

  it('should count records and complete records apart, with both latest anchors', () => {
    const ledger = [
      complete('2026-10-02', 1000e6),
      complete('2026-10-09', 1001e6),
      noCounts('2026-10-16'),
    ];
    expect(ledgerCoverage(ledger)).toEqual({
      records: 3,
      complete: 2,
      latestRecordAnchor: '2026-10-16',
      latestRecordComplete: false,
      latestCompleteAnchor: '2026-10-09',
    });
  });
});

describe('an incomplete record is neither a usable week nor a zero flow', () => {
  const weekly = (n: number, start = '2026-08-28') => {
    const out = [];
    const d = new Date(`${start}T00:00:00Z`);
    let ibit = 1000e6;
    for (let i = 0; i < n; i += 1) {
      ibit += 5e6;
      out.push(complete(d.toISOString().slice(0, 10), ibit));
      d.setUTCDate(d.getUTCDate() + 7);
    }
    return out;
  };

  it('control: six complete weekly records with rising counts score ACTIVE', () => {
    expect(evaluateEtf01FromFlows(weekly(6), new Date('2026-10-12T00:00:00Z')).state).toBe(
      'ACTIVE'
    );
  });

  it('should leave a gap, not a zero flow, where an incomplete record sits in the window', () => {
    const rows = weekly(6);
    rows.splice(4, 1, noCounts(rows[4].anchor)); // the 5th week came back without counts
    const sig = evaluateEtf01FromFlows(rows, new Date('2026-10-12T00:00:00Z'));
    expect(sig.state).toBe('UNAVAILABLE');
    expect(sig.values.variant).toBe('gapped');
    expect(sig.detail).not.toMatch(/\+\$0M|-\$0M/);
  });

  it('should not count an incomplete record toward the warm-up', () => {
    const rows = [...weekly(4), noCounts('2026-09-25')];
    const sig = evaluateEtf01FromFlows(rows, new Date('2026-10-12T00:00:00Z'));
    expect(sig.state).toBe('UNAVAILABLE');
    expect(sig.values.snapshots).toBe(4);
  });
});

describe('recording a collection', () => {
  const at = '2026-10-26T06:20:00Z';
  const io = (p: { ledgerPath: string; attemptsPath: string }) => ({
    ...p,
    attemptedAt: at,
    source: 'test',
  });

  it('should refuse an incomplete collection, keep it as evidence, and leave the ledger untouched', () => {
    const p = files([complete('2026-10-09', 1000e6), noCounts('2026-10-16')]);
    const before = sha(p.ledgerPath);
    const res = recordEtfSnapshot(noCounts('2026-10-23'), io(p));
    expect(res.outcome).toBe('refused');
    expect(sha(p.ledgerPath)).toBe(before);
    const [evidence] = readAttempts(p.attemptsPath) as Array<{ funds: Record<string, Fund> }>;
    expect(evidence).toMatchObject({
      anchor: '2026-10-23',
      attempted_at: at,
      outcome: 'refused-incomplete',
      missing: { shares: ['IBIT', 'FBTC'], price: [] },
    });
    expect(evidence.funds.IBIT.price).toBe(40); // what DID come back is kept
  });

  it('should accept a complete collection for the same week after a refusal, keeping the evidence', () => {
    const p = files([complete('2026-10-09', 1000e6)]);
    expect(recordEtfSnapshot(noCounts('2026-10-23'), io(p)).outcome).toBe('refused');
    const evidence = sha(p.attemptsPath);
    expect(recordEtfSnapshot(complete('2026-10-23', 1002e6), io(p)).outcome).toBe('recorded');
    expect(readSnapshots(p.ledgerPath).map((r: { anchor: string }) => r.anchor)).toEqual([
      '2026-10-09',
      '2026-10-23',
    ]);
    expect(sha(p.attemptsPath)).toBe(evidence);
  });

  it('should never collect a week twice and never rewrite an existing record', () => {
    const p = files([complete('2026-10-09', 1000e6), noCounts('2026-10-16')]);
    const before = sha(p.ledgerPath);
    expect(recordEtfSnapshot(complete('2026-10-16', 1001e6), io(p)).outcome).toBe(
      'already-recorded'
    );
    expect(sha(p.ledgerPath)).toBe(before);
    expect(sha(p.attemptsPath)).toBe('absent');
  });
});

describe('the panel row while suspended', () => {
  const ledger = [
    complete('2026-09-25', 1000e6),
    complete('2026-10-02', 1001e6),
    complete('2026-10-09', 1002e6),
    noCounts('2026-10-16'),
  ];
  const computed = (computedAt: string) => ({
    computed_at: computedAt,
    signals: [
      { id: 'BTC-01', anchor: '2026-09-01' },
      { id: 'MAC-01', anchor: '2026-10-16' },
      { id: 'MAC-02', anchor: '2026-10-16' },
      { id: 'MAC-03', anchor: '2026-09-01' },
      { id: 'REL-01', anchor: '2026-10-16' },
      { id: 'REL-03', anchor: '2026-10-16' },
      suspendedEtfSignal(ledger),
    ],
  });
  const row = (ds: { sources: Array<{ source: string }> }) =>
    ds.sources.find((s) => s.source.startsWith('Polygon')) as Record<string, string>;

  it('should date the row by the latest COMPLETE record, not the incomplete one', () => {
    const r = row(deriveDataStatus(computed('2026-10-19T13:16:47Z'), ledger));
    expect(r.last_updated_at).toBe('2026-10-09T00:00:00Z');
    expect(r.stale_after).toBe('2026-10-30T00:00:00Z');
  });

  it('should count records and complete records apart and never call them usable weeks', () => {
    const msg = row(deriveDataStatus(computed('2026-10-19T13:16:47Z'), ledger)).message;
    expect(msg).toContain('4 records, 3 complete');
    expect(msg).toContain('The latest record (anchor 2026-10-16) is incomplete.');
    expect(msg).toContain('The latest complete record is anchored 2026-10-09.');
    expect(msg).toMatch(/does not show that the share counts are current/);
    expect(msg).not.toMatch(/usable|weeks? of flows|still collected \(/i);
  });

  it('should name a refused attempt without moving the row dates', () => {
    const attempts = [
      { anchor: '2026-10-23', attempted_at: '2026-10-26T06:20:00Z', outcome: 'refused-incomplete' },
    ];
    const without = row(deriveDataStatus(computed('2026-10-26T06:30:00Z'), ledger));
    const withAttempt = row(deriveDataStatus(computed('2026-10-26T06:30:00Z'), ledger, attempts));
    expect(withAttempt.message).toContain(
      'The latest collection attempt (anchor 2026-10-23, 2026-10-26) returned incomplete data'
    );
    expect(withAttempt.last_updated_at).toBe(without.last_updated_at);
    expect(withAttempt.stale_after).toBe(without.stale_after);
  });

  it('should leave the confidence rule unchanged: MODERATE before stale_after, LOW after', () => {
    const ds = deriveDataStatus(computed('2026-10-19T13:16:47Z'), ledger) as unknown as DataStatus;
    expect(ds.overall_confidence).toBe('MODERATE');
    expect(applyReadTimeFreshness(ds, new Date('2026-10-29T23:00:00Z')).overall_confidence).toBe(
      'MODERATE'
    );
    expect(applyReadTimeFreshness(ds, new Date('2026-10-30T01:00:00Z')).overall_confidence).toBe(
      'LOW'
    );
  });

  it('should say the same in the suspended record itself: records and complete records', () => {
    const sig = suspendedEtfSignal(ledger);
    expect(sig.detail).toContain('4 records, 3 complete');
    expect(sig.values).toMatchObject({ snapshots: 4, completeRecords: 3, variant: 'suspended' });
  });
});
