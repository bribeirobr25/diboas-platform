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
import {
  groupStatus,
  groupSummary,
} from '../../../../scripts/market-refresh/lib/group-summaries.mjs';

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

/**
 * Status chip and sentence from ONE decision (2026-10-19). From 2026-07-11 an
 * unavailable ETF-01 gave the group the sentence "unavailable, not weak" while
 * its status stayed WEAK; the status is now UNAVAILABLE exactly when nothing in
 * the group was evaluated, and an evaluated zero stays WEAK.
 */
describe('group status (2026-10-19)', () => {
  const byId = (states: Record<string, SignalState>, extra: Record<string, unknown> = {}) =>
    Object.fromEntries(Object.entries(states).map(([id, state]) => [id, { id, state, ...extra }]));

  it('should be UNAVAILABLE for a suspended ETF-01, beside the suspended sentence', () => {
    const ids = byId({ 'ETF-01': 'UNAVAILABLE' }, { values: { variant: 'suspended' } });
    expect(groupStatus(ids, 'institutional_demand', 0)).toBe('UNAVAILABLE');
    const ctx = { byId: ids, groupTotals: { institutional_demand: 0 }, groupTpl, signalLabels };
    expect(groupSummary(ctx, 'institutional_demand', 'en')).toContain('suspended');
  });

  it('should be UNAVAILABLE for a warm-up or gapped ETF-01 too, with the non-suspended sentence', () => {
    const ids = byId({ 'ETF-01': 'UNAVAILABLE' }, { values: { variant: 'gapped' } });
    expect(groupStatus(ids, 'institutional_demand', 0)).toBe('UNAVAILABLE');
    const ctx = { byId: ids, groupTotals: { institutional_demand: 0 }, groupTpl, signalLabels };
    for (const loc of LOCALES) {
      expect(groupSummary(ctx, 'institutional_demand', loc)).toBe(
        groupTpl.institutional_demand.unavailable[loc]
          .replace('{points}', '0')
          .replace('{max}', '2')
      );
    }
  });

  it('control: an EVALUATED ETF-01 at 0 points is WEAK with the weak sentence', () => {
    const ids = byId({ 'ETF-01': 'INACTIVE' });
    expect(groupStatus(ids, 'institutional_demand', 0)).toBe('WEAK');
    const ctx = { byId: ids, groupTotals: { institutional_demand: 0 }, groupTpl, signalLabels };
    expect(groupSummary(ctx, 'institutional_demand', 'en')).toBe(
      groupTpl.institutional_demand.weak.en.replace('{points}', '0').replace('{max}', '2')
    );
  });

  it('should keep the scored band when only SOME signals are unavailable', () => {
    const ids = byId({ 'MAC-01': 'INACTIVE', 'MAC-02': 'INACTIVE', 'MAC-03': 'UNAVAILABLE' });
    expect(groupStatus(ids, 'macro_environment', 0)).toBe('WEAK');
    const one = byId({ 'MAC-01': 'ACTIVE', 'MAC-02': 'INACTIVE', 'MAC-03': 'UNAVAILABLE' });
    expect(groupStatus(one, 'macro_environment', 1)).toBe('MIXED');
  });

  it('should keep the suspension wording to the group that holds ETF-01', () => {
    // Another group with nothing evaluated, given an 'unavailable' wording,
    // while ETF-01 is suspended: it takes ITS OWN wording, never a 'suspended'
    // lookup it does not have.
    const ids = byId(
      { 'REL-01': 'UNAVAILABLE', 'REL-02': 'UNAVAILABLE', 'REL-03': 'UNAVAILABLE' },
      { values: { variant: 'suspended' } }
    );
    const withEtf = {
      ...ids,
      'ETF-01': { id: 'ETF-01', state: 'UNAVAILABLE', values: { variant: 'suspended' } },
    };
    const tpl = {
      ...groupTpl,
      relative_strength: {
        ...groupTpl.relative_strength,
        unavailable: { en: 'Relative strength could not be measured ({points} of {max} points).' },
      },
    };
    const ctx = {
      byId: withEtf,
      groupTotals: { relative_strength: 0 },
      groupTpl: tpl,
      signalLabels,
    };
    expect(groupSummary(ctx, 'relative_strength', 'en')).toBe(
      'Relative strength could not be measured (0 of 3 points).'
    );
  });

  it('should stop the generator for a group with nothing evaluated and no unavailable wording', () => {
    const ids = byId({ 'REL-01': 'UNAVAILABLE', 'REL-02': 'UNAVAILABLE', 'REL-03': 'UNAVAILABLE' });
    expect(groupStatus(ids, 'relative_strength', 0)).toBe('UNAVAILABLE');
    const ctx = { byId: ids, groupTotals: { relative_strength: 0 }, groupTpl, signalLabels };
    expect(() => groupSummary(ctx, 'relative_strength', 'en')).toThrow(/no 'unavailable' template/);
  });
});
