/**
 * F-M4 (P2, 2026-07-11) — the reconciliation gate as CI.
 *
 * `computed.json` is written ONLY by the market-refresh pipeline
 * (`apps/web/scripts/market-refresh/run.mjs`) after its quality gate passes.
 * These tests assert the hand-written editorial files AGREE with it — so a
 * transcribed score, band, or group total that disagrees with the engine can
 * never merge again. On every refresh: run the pipeline first, then write
 * the editorial JSONs to match.
 *
 * The ETF-01 manual input (etf01-manual.json) is validated for shape here
 * too — an expired entry auto-degrades to UNAVAILABLE inside the engine, so
 * expiry is NOT a test failure, but a malformed file is.
 *
 * Plan: docs/audit/MARKET_REFRESH_AUDIT_AND_AUTOMATION_PLAN_2026-07-11.md
 * §B Stage 4 ("reconciliation gate in CI — permanent") + Part E.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const MARKET_DIR = join(__dirname, '../../../../data/market/shared');

const computed = JSON.parse(readFileSync(join(MARKET_DIR, 'computed.json'), 'utf8')) as {
  score: number;
  max_score: number;
  regime_code: string;
  group_totals: Record<string, number>;
  signals: Array<{ id: string; state: string; weight: number; points: number }>;
};
const regime = JSON.parse(readFileSync(join(MARKET_DIR, 'regime.json'), 'utf8')) as {
  score: number;
  max_score: number;
  regime_code: string;
};
const signals = JSON.parse(readFileSync(join(MARKET_DIR, 'signals.json'), 'utf8')) as {
  groups: Array<{ id: string; points_awarded: number; max_points: number }>;
};

describe('computed.json ↔ editorial reconciliation (F-M4)', () => {
  it('should match regime.json score, max_score and regime_code', () => {
    expect(regime.score).toBe(computed.score);
    expect(regime.max_score).toBe(computed.max_score);
    expect(regime.regime_code).toBe(computed.regime_code);
  });

  it('should match signals.json per-group points_awarded', () => {
    for (const group of signals.groups) {
      expect(
        { id: group.id, points: group.points_awarded },
        `group ${group.id} disagrees with the engine — regenerate via market-refresh/run.mjs`
      ).toEqual({ id: group.id, points: computed.group_totals[group.id] });
    }
  });

  it('should have internally consistent computed.json (points sum to score; weights sum to max)', () => {
    const pointSum = computed.signals.reduce((s, x) => s + x.points, 0);
    const weightSum = computed.signals.reduce((s, x) => s + x.weight, 0);
    expect(pointSum).toBe(computed.score);
    expect(weightSum).toBe(computed.max_score);
  });
});

describe('etf01-manual.json shape (P2 Stage 1 manual input)', () => {
  const manual = JSON.parse(readFileSync(join(MARKET_DIR, 'etf01-manual.json'), 'utf8')) as {
    state: string;
    detail: string;
    entered_by: string;
    entered_at: string;
    expires_at: string;
  };

  it('should carry a valid state, provenance fields, and parseable timestamps', () => {
    expect(['ACTIVE', 'INACTIVE', 'UNAVAILABLE']).toContain(manual.state);
    expect(manual.detail.length).toBeGreaterThan(10);
    expect(manual.entered_by.length).toBeGreaterThan(0);
    expect(Number.isNaN(Date.parse(manual.entered_at))).toBe(false);
    expect(Number.isNaN(Date.parse(manual.expires_at))).toBe(false);
    expect(Date.parse(manual.expires_at)).toBeGreaterThan(Date.parse(manual.entered_at));
  });
});
