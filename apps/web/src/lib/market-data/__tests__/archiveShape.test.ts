/**
 * One archive shape, two writers (PENDING_ALL 5.187a).
 *
 * `run-archive.jsonl` is appended by the weekly pipeline AND by the manual
 * verification CLI. They wrote different shapes: the CLI dropped `points` and
 * `values`. That is load-bearing — `state-lead.mjs#priorRunSignals` reads this
 * archive to pick the /market/backdrop beats, and the "fresh crossing" depth
 * sentences fill `{priorGapAbsPrecise}` / `{priorClosePrecise}` from
 * `prior.values`, with `renderTemplate` throwing on any empty slot. A
 * values-less line as the most recent prior run day, on a week when a macro
 * condition flips, stops the weekly automation.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { archiveSignals, archiveLine } from '../../../../scripts/market-refresh/lib/archive.mjs';

const ROOT = join(__dirname, '../../../..');
const SCRIPTS = join(ROOT, 'scripts');

const RAW = [
  {
    id: 'MAC-01',
    state: 'ACTIVE',
    weight: 1,
    detail: 'd',
    values: { close: 118.7, ema20: 119.5 },
    anchor: '2026-08-28',
    anchorKind: 'weekly',
  },
  {
    id: 'MAC-02',
    state: 'INACTIVE',
    weight: 1,
    detail: 'd',
    values: { close: 4.73, ema20: 4.55 },
    anchor: '2026-08-28',
    anchorKind: 'weekly',
  },
  {
    id: 'ETF-01',
    state: 'UNAVAILABLE',
    weight: 2,
    detail: 'd',
    anchor: null,
    anchorKind: 'weekly',
  },
];

describe('archiveSignals — the canonical per-signal record', () => {
  it('should match the key set of the newest committed archive line', () => {
    // Ties the producer to reality: the newest line was written by run.mjs, so
    // if the helper ever emits a different shape the two have drifted again.
    const lines = readFileSync(join(ROOT, 'data/market/shared/run-archive.jsonl'), 'utf8')
      .split('\n')
      .filter(Boolean);
    const newest = JSON.parse(lines[lines.length - 1]);
    const committedKeys = Object.keys(newest.signals[0]).sort();
    const producedKeys = Object.keys(archiveSignals(RAW)[0]).sort();
    expect(producedKeys).toEqual(committedKeys);
  });

  it('should always carry points AND values — the two the CLI used to drop', () => {
    for (const s of archiveSignals(RAW, { etfSnapshotCount: 3 })) {
      expect(s, `${s.id} missing points`).toHaveProperty('points');
      expect(s, `${s.id} missing values`).toHaveProperty('values');
      expect(s.values, `${s.id} values must not be undefined`).not.toBeUndefined();
    }
  });

  it('should derive points from state, never trust an input field', () => {
    const [active, inactive] = archiveSignals(RAW);
    expect(active.points).toBe(1); // ACTIVE, weight 1
    expect(inactive.points).toBe(0); // INACTIVE
  });

  it('should inject the warm-up slots the ETF UNAVAILABLE sentence needs (5.133)', () => {
    const etf = archiveSignals(RAW, { etfSnapshotCount: 3 }).find((s) => s.id === 'ETF-01');
    expect(etf!.values).toEqual({ snapshots: 3, warmupTarget: 5 });
  });

  it('should preserve the values the depth sentences read as `prior`', () => {
    // The consumer contract, stated as a test: state-lead fills
    // {priorClosePrecise} from prior.values.close. Dropping it is what broke.
    const mac02 = archiveSignals(RAW).find((s) => s.id === 'MAC-02');
    expect(mac02!.values).toMatchObject({ close: 4.73, ema20: 4.55 });
  });
});

describe('archiveLine — one line shape for both writers', () => {
  it('should produce the committed line key set', () => {
    const lines = readFileSync(join(ROOT, 'data/market/shared/run-archive.jsonl'), 'utf8')
      .split('\n')
      .filter(Boolean);
    const newest = JSON.parse(lines[lines.length - 1]);
    const produced = archiveLine({
      runAt: '2026-09-12T00:00:00.000Z',
      pipeline: 'test',
      score: 13,
      regimeCode: 'VERY_FAVORABLE',
      groupTotals: {},
      published: { score: 13, regime_code: 'VERY_FAVORABLE' },
      anchorSpreadDays: 7,
      anchorWarning: null,
      signals: archiveSignals(RAW),
    });
    expect(Object.keys(produced).sort()).toEqual(Object.keys(newest).sort());
  });

  it('should null btc_append for writers that never append a candle', () => {
    const l = archiveLine({
      runAt: 'x',
      pipeline: 'p',
      score: 1,
      regimeCode: 'HOSTILE',
      groupTotals: {},
      published: null,
      anchorSpreadDays: 0,
      anchorWarning: null,
      signals: [],
    });
    expect(l.btc_append).toBeNull();
    expect(l.published).toBeNull();
  });
});

describe('both writers use the shared producer (structural — stops a re-inline)', () => {
  it.each([
    ['market-refresh/run.mjs', 'market-refresh/run.mjs'],
    ['data-fetchers/compute-regime.mjs', 'data-fetchers/compute-regime.mjs'],
  ])('should import archive.mjs in %s', (_label, rel) => {
    const src = readFileSync(join(SCRIPTS, rel), 'utf8');
    expect(src, `${rel} must not hand-roll an archive line`).toMatch(
      /import \{[^}]*archiveLine[^}]*\} from '.*lib\/archive\.mjs'/
    );
    // and must not rebuild the signal record inline
    expect(src).not.toMatch(/points: state === 'ACTIVE' \? weight : 0/);
  });
});
