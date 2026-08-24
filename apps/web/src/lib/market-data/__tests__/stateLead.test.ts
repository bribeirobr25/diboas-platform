/**
 * State-grammar lead + depth composer (/market/backdrop, 5.140 + 5.141).
 *
 * The risky part is the BEAT SELECTOR. A lead built from levels says "the
 * dollar crossed below its trend this week" every week it happens to be below,
 * which implies a recency the data does not have; that is the defect the
 * 2026-08-24 review caught in a draft. These tests pin the selector to
 * state CHANGE against the previous run day, and pin the fail-safe direction:
 * with no prior run we say HOLD, never MOVED.
 */

import { describe, it, expect } from 'vitest';
import {
  priorRunSignals,
  beatKey,
  depthKey,
  composeStateLead,
  STATE_BEAT_ORDER,
} from '../../../../scripts/market-refresh/lib/state-lead.mjs';

const line = (day: string, states: Record<string, string>) =>
  JSON.stringify({
    run_at: `${day}T06:00:00.000Z`,
    signals: Object.entries(states).map(([id, state]) => ({
      id,
      state,
      values: { close: 100, ema20: 101 },
    })),
  });

const ARCHIVE = [
  line('2026-08-03', { 'MAC-01': 'INACTIVE', 'MAC-02': 'INACTIVE', 'MAC-03': 'ACTIVE' }),
  line('2026-08-04', { 'MAC-01': 'ACTIVE', 'MAC-02': 'INACTIVE', 'MAC-03': 'ACTIVE' }),
].join('\n');

describe('priorRunSignals — the previous RUN DAY, not the previous line', () => {
  it('should return the last day strictly before the current run', () => {
    const prior = priorRunSignals(ARCHIVE, '2026-08-24T06:00:00Z');
    expect(prior?.['MAC-01'].state).toBe('ACTIVE');
  });

  it('should ignore same-day lines so a re-run never reads as "last week"', () => {
    // A correction re-run on 08-04 must still compare against 08-03, otherwise
    // every re-run reports a move of zero and silently flips beats to HOLD on
    // a week something genuinely changed.
    const prior = priorRunSignals(ARCHIVE, '2026-08-04T09:00:00Z');
    expect(prior?.['MAC-01'].state).toBe('INACTIVE');
  });

  it('should return null with no archive, and survive a truncated tail', () => {
    expect(priorRunSignals('', '2026-08-24T06:00:00Z')).toBeNull();
    expect(
      priorRunSignals(`${ARCHIVE}\n{"run_at":"2026-08-1`, '2026-08-24T06:00:00Z')
    ).not.toBeNull();
  });
});

describe('beatKey — reports CHANGE, and fails safe to hold', () => {
  const active = { state: 'ACTIVE' };
  const inactive = { state: 'INACTIVE' };

  it('should say moved only when the prior state differs', () => {
    expect(beatKey(active, inactive)).toBe('movedSupportive');
    expect(beatKey(inactive, active)).toBe('movedRestrictive');
    expect(beatKey(active, active)).toBe('holdSupportive');
    expect(beatKey(inactive, inactive)).toBe('holdRestrictive');
  });

  it('should NEVER claim a move when there is no prior run', () => {
    // Fresh clone or rebuilt archive. Claiming an unevidenced move is the
    // failure that matters; describing a visible state is always true.
    expect(beatKey(active, undefined)).toBe('holdSupportive');
    expect(beatKey(inactive, null)).toBe('holdRestrictive');
  });

  it('should DROP the beat for a state that is not a measurement', () => {
    // UNAVAILABLE is not "restrictive" — every beat sentence asserts a measured
    // condition, and defaulting an absent reading to one is the ETF-01 defect
    // shape. Unreachable from evaluateMacro today; guarded anyway.
    expect(beatKey({ state: 'UNAVAILABLE' }, undefined)).toBeNull();
    expect(depthKey({ state: 'UNAVAILABLE' }, undefined)).toBeNull();
    expect(beatKey(undefined, undefined)).toBeNull();
  });

  it('should give the moved condition the fresh depth framing, others the plain one', () => {
    expect(depthKey(active, inactive)).toBe('freshSupportive');
    expect(depthKey(active, active)).toBe('supportive');
    expect(depthKey(inactive, inactive)).toBe('restrictive');
    expect(depthKey(inactive, undefined)).toBe('restrictive');
  });
});

describe('composeStateLead — opening plus one beat per condition, fixed order', () => {
  const tpl = {
    opening: {
      weak: { en: 'OPEN-WEAK.' },
      mixed: { en: 'OPEN-MIXED.' },
      mixedComposed: { en: 'OPEN {supportive} vs {against}.' },
      strong: { en: 'OPEN-STRONG.' },
    },
    beat: Object.fromEntries(
      STATE_BEAT_ORDER.map((id: string) => [
        id,
        {
          movedSupportive: { en: `${id}-MOVED-SUP.` },
          movedRestrictive: { en: `${id}-MOVED-RES.` },
          holdSupportive: { en: `${id}-HOLD-SUP.` },
          holdRestrictive: { en: `${id}-HOLD-RES.` },
        },
      ])
    ),
    depth: {},
  };

  const ctx = (states: Record<string, string>) => ({
    byId: Object.fromEntries(Object.entries(states).map(([id, state]) => [id, { id, state }])),
    groupTotals: { macro_environment: Object.values(states).filter((s) => s === 'ACTIVE').length },
    signalLabels: {
      'MAC-01': { en: 'the dollar' },
      'MAC-02': { en: 'yields' },
      'MAC-03': { en: 'liquidity' },
    },
    groupTpl: {},
  });

  it('should keep the three beats in dollar, rates, liquidity order', () => {
    const states = { 'MAC-01': 'ACTIVE', 'MAC-02': 'INACTIVE', 'MAC-03': 'ACTIVE' };
    const out = composeStateLead(ctx(states), tpl, 'en', null);
    expect(out.indexOf('MAC-01')).toBeLessThan(out.indexOf('MAC-02'));
    expect(out.indexOf('MAC-02')).toBeLessThan(out.indexOf('MAC-03'));
  });

  it('should carry NO score fragment (MM-2: state views carry no score)', () => {
    const out = composeStateLead(
      ctx({ 'MAC-01': 'ACTIVE', 'MAC-02': 'INACTIVE', 'MAC-03': 'ACTIVE' }),
      tpl,
      'en',
      null
    );
    expect(out).not.toMatch(/\d\s*(of|de|von)\s*\d\s*(points|pontos|puntos|Punkten)/i);
  });

  it('should mark only the condition that actually moved', () => {
    const states = { 'MAC-01': 'ACTIVE', 'MAC-02': 'INACTIVE', 'MAC-03': 'ACTIVE' };
    const prior = {
      'MAC-01': { state: 'INACTIVE' },
      'MAC-02': { state: 'INACTIVE' },
      'MAC-03': { state: 'ACTIVE' },
    };
    const out = composeStateLead(ctx(states), tpl, 'en', prior);
    expect(out).toContain('MAC-01-MOVED-SUP.');
    expect(out).toContain('MAC-02-HOLD-RES.');
    expect(out).toContain('MAC-03-HOLD-SUP.');
  });

  it('should report every condition as holding when there is no prior run', () => {
    const out = composeStateLead(
      ctx({ 'MAC-01': 'ACTIVE', 'MAC-02': 'INACTIVE', 'MAC-03': 'ACTIVE' }),
      tpl,
      'en',
      null
    );
    expect(out).not.toContain('MOVED');
  });
});
