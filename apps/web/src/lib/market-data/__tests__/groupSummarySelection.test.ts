/**
 * Group-summary template selection (B1, 2026-08-11) — the pure selection
 * module shared by generate.mjs, tested against the REAL template library so
 * the copy each state ships is exactly what these cases assert.
 *
 * Locks the relative_strength 'mixed' ladder:
 *   1. composed split when a BTC-relative win exists (REL-01/REL-02),
 *   2. 'mixedBackdropOnly' when BOTH BTC-relative reads are INACTIVE (the
 *      point is REL-03 alone — the generic "Bitcoin leads on part of the
 *      board" is false there; first hit 2026-08-10),
 *   3. generic 'mixed' as the residual fallback (e.g. an UNAVAILABLE REL
 *      signal breaks the both-INACTIVE guarantee, so no trailing claim).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { groupSummary } from '../../../../scripts/market-refresh/lib/group-summaries.mjs';

const TPL_DIR = join(__dirname, '../../../../scripts/market-refresh/templates');
const groupTpl = JSON.parse(readFileSync(join(TPL_DIR, 'group-summaries.json'), 'utf8'));
const signalLabels = JSON.parse(readFileSync(join(TPL_DIR, 'signal-labels.json'), 'utf8'));

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

type SignalState = 'ACTIVE' | 'INACTIVE' | 'UNAVAILABLE';

function relCtx(states: Record<string, SignalState>, relTotal: number) {
  return {
    byId: Object.fromEntries(Object.entries(states).map(([id, state]) => [id, { id, state }])),
    groupTotals: { relative_strength: relTotal },
    groupTpl,
    signalLabels,
  };
}

describe('relative_strength mixed-state template selection (B1)', () => {
  it('should select mixedBackdropOnly when both BTC-relative reads are INACTIVE and only REL-03 scores', () => {
    const ctx = relCtx({ 'REL-01': 'INACTIVE', 'REL-02': 'INACTIVE', 'REL-03': 'ACTIVE' }, 1);
    const en = groupSummary(ctx, 'relative_strength', 'en');
    expect(en).toBe(
      'Relative strength is split: Bitcoin trails both gold and the Nasdaq, but the wider risk market itself stays structurally healthy (1 of 3 points).'
    );
    for (const loc of LOCALES) {
      const out = groupSummary(ctx, 'relative_strength', loc);
      expect(out).toBe(
        groupTpl.relative_strength.mixedBackdropOnly[loc]
          .replace('{points}', '1')
          .replace('{max}', '3')
      );
      expect(out).not.toContain('{');
    }
  });

  it('should never claim a Bitcoin lead when no BTC-relative signal is ACTIVE', () => {
    const ctx = relCtx({ 'REL-01': 'INACTIVE', 'REL-02': 'INACTIVE', 'REL-03': 'ACTIVE' }, 1);
    expect(groupSummary(ctx, 'relative_strength', 'en')).not.toContain(
      'leads on part of the board'
    );
  });

  it('should compose the actual split when one BTC-relative read is ACTIVE', () => {
    const ctx = relCtx({ 'REL-01': 'ACTIVE', 'REL-02': 'INACTIVE', 'REL-03': 'INACTIVE' }, 1);
    expect(groupSummary(ctx, 'relative_strength', 'en')).toBe(
      'Relative strength is split: Bitcoin leads gold but lags the Nasdaq (1 of 3 points).'
    );
  });

  it('should compose the split when a BTC-relative win pairs with REL-03 for two points', () => {
    const ctx = relCtx({ 'REL-01': 'ACTIVE', 'REL-02': 'INACTIVE', 'REL-03': 'ACTIVE' }, 2);
    expect(groupSummary(ctx, 'relative_strength', 'en')).toBe(
      'Relative strength is split: Bitcoin leads gold but lags the Nasdaq (2 of 3 points).'
    );
  });

  it('should fall back to the generic mixed template when a BTC-relative read is UNAVAILABLE', () => {
    // Both-INACTIVE is required for the "trails both" claim; an UNAVAILABLE
    // read means we cannot honestly assert either a lead or a trail.
    const ctx = relCtx({ 'REL-01': 'UNAVAILABLE', 'REL-02': 'INACTIVE', 'REL-03': 'ACTIVE' }, 1);
    expect(groupSummary(ctx, 'relative_strength', 'en')).toBe(
      groupTpl.relative_strength.mixed.en.replace('{points}', '1').replace('{max}', '3')
    );
  });
});

describe('other groups keep their existing selection behavior', () => {
  it('should compose the btc_structure split exactly as shipped in the 2026-08-10 cycle', () => {
    const ctx = {
      byId: {
        'BTC-01': { id: 'BTC-01', state: 'INACTIVE' },
        'BTC-02': { id: 'BTC-02', state: 'ACTIVE' },
        'BTC-03': { id: 'BTC-03', state: 'ACTIVE' },
        'BTC-04': { id: 'BTC-04', state: 'INACTIVE' },
      },
      groupTotals: { btc_structure: 3 },
      groupTpl,
      signalLabels,
    };
    expect(groupSummary(ctx, 'btc_structure', 'en')).toBe(
      "Bitcoin's structure is split: the long-term trend and monthly momentum still holding, the mid-term trend and short-term momentum faltering (3 of 6 points)."
    );
  });

  it('should say unavailable-not-weak when ETF-01 is UNAVAILABLE', () => {
    const ctx = {
      byId: { 'ETF-01': { id: 'ETF-01', state: 'UNAVAILABLE' } },
      groupTotals: { institutional_demand: 0 },
      groupTpl,
      signalLabels,
    };
    expect(groupSummary(ctx, 'institutional_demand', 'en')).toContain('unavailable, not weak');
  });
});
