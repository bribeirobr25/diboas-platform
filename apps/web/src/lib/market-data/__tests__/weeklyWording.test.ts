/**
 * "This week" wording only against a run 7±1 days back (2026-10-21, founder
 * decision on the review-gate findings). After a missed Monday the previous
 * run is two weeks old; a change over that span is not "this week".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  beatKey,
  composeStateLead,
  depthKey,
  priorRun,
  STATE_BEAT_ORDER,
} from '../../../../scripts/market-refresh/lib/state-lead.mjs';
import { ETF_VARIANT } from '../../../../scripts/market-refresh/lib/regime-engine.mjs';
import {
  isWeekApart,
  planWeeklyOpener,
  WEEKLY_GAP_DAYS,
} from '../../../../scripts/market-refresh/lib/weekly-opener.mjs';

const TEMPLATES = JSON.parse(
  readFileSync(
    join(__dirname, '../../../../scripts/market-refresh/templates/state-beats.json'),
    'utf8'
  )
);
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
const active = { state: 'ACTIVE' };
const inactive = { state: 'INACTIVE' };

describe('isWeekApart — 7±1 days', () => {
  it('should accept 6, 7 and 8 days and refuse 5 and 9', () => {
    expect(WEEKLY_GAP_DAYS).toEqual({ min: 6, max: 8 });
    expect(isWeekApart('2026-10-12', '2026-10-17')).toBe(false);
    expect(isWeekApart('2026-10-12', '2026-10-18')).toBe(true);
    expect(isWeekApart('2026-10-12', '2026-10-19T06:17:00Z')).toBe(true);
    expect(isWeekApart('2026-10-12T00:00:00Z', '2026-10-20')).toBe(true);
    expect(isWeekApart('2026-10-12', '2026-10-21')).toBe(false);
    expect(isWeekApart('2026-10-05', '2026-10-19')).toBe(false); // a missed Monday
  });

  it('should refuse a missing or unparseable day', () => {
    expect(isWeekApart(undefined, '2026-10-19')).toBe(false);
    expect(isWeekApart(null, '2026-10-19')).toBe(false);
    expect(isWeekApart('not a day', '2026-10-19')).toBe(false);
  });
});

describe('beats and depth when the previous run is not a week back', () => {
  it('should give a changed condition the NOW beat, an unchanged one HOLD', () => {
    expect(beatKey(active, inactive, false)).toBe('nowSupportive');
    expect(beatKey(inactive, active, false)).toBe('nowRestrictive');
    expect(beatKey(active, active, false)).toBe('holdSupportive');
    expect(beatKey(active, inactive)).toBe('movedSupportive'); // weekly by default
  });

  it('should never use the fresh depth sentence ("a week earlier")', () => {
    expect(depthKey(active, inactive, false)).toBe('supportive');
    expect(depthKey(inactive, active, false)).toBe('restrictive');
    expect(depthKey(active, inactive, true)).toBe('freshSupportive');
  });

  it('should have a NOW beat for every condition in all four locales, with no time claim', () => {
    for (const id of STATE_BEAT_ORDER) {
      for (const key of ['nowSupportive', 'nowRestrictive']) {
        for (const locale of LOCALES) {
          const text: string = TEMPLATES.beat[id][key][locale];
          expect(text, `${id}.${key}.${locale}`).toBeTruthy();
          expect(text).not.toMatch(/this week|esta semana|nesta semana|diese Woche|—/i);
        }
      }
    }
  });

  it('should render the NOW beat into the lead for a changed condition', () => {
    const ctx = {
      byId: { 'MAC-01': { id: 'MAC-01', state: 'ACTIVE' } },
      groupTotals: { macro_environment: 1 },
      signalLabels: {},
      groupTpl: {},
    };
    const prior = { 'MAC-01': { state: 'INACTIVE' } };
    const lead = composeStateLead(ctx, TEMPLATES, 'en', prior, false);
    expect(lead).toContain('The dollar is now below its 20 week trend.');
    expect(lead).not.toMatch(/this week/);
    expect(composeStateLead(ctx, TEMPLATES, 'en', prior, true)).toContain('this week');
  });
});

describe('planWeeklyOpener when the previous snapshot is not a week back', () => {
  const base = {
    prior: { score: 9, regime_code: 'CONSTRUCTIVE' },
    score: 10,
    regimeCode: 'CONSTRUCTIVE',
    currentEtf: undefined,
    priorEtf: undefined,
  };

  it('should omit the ordinary openers, which say "this week"', () => {
    expect(planWeeklyOpener({ ...base, weekly: false })).toEqual([]);
    expect(planWeeklyOpener({ ...base, weekly: true }).map((p) => p.key)).toEqual(['moveUp']);
    expect(planWeeklyOpener({ ...base, score: 9, weekly: false })).toEqual([]);
  });

  it('should still disclose a suspension that starts on that cycle ("from this update")', () => {
    const parts = planWeeklyOpener({
      ...base,
      weekly: false,
      currentEtf: {
        id: 'ETF-01',
        state: 'UNAVAILABLE',
        values: { variant: ETF_VARIANT.SUSPENDED },
      },
      priorEtf: { id: 'ETF-01', state: 'ACTIVE', points: 2, values: {} },
    });
    expect(parts.map((p) => p.key)).toEqual(['suspensionStart', 'othersUp']);
  });
});

describe('priorRun — the previous run DAY, with its date', () => {
  it('should return the day and its signals', () => {
    const archive = [
      JSON.stringify({
        run_at: '2026-10-05T06:00:00Z',
        signals: [{ id: 'MAC-01', state: 'ACTIVE' }],
      }),
      JSON.stringify({
        run_at: '2026-10-19T06:00:00Z',
        signals: [{ id: 'MAC-01', state: 'INACTIVE' }],
      }),
    ].join('\n');
    const r = priorRun(archive, '2026-10-19T09:00:00Z');
    expect(r?.day).toBe('2026-10-05');
    expect(r?.signals['MAC-01'].state).toBe('ACTIVE');
    expect(isWeekApart(r?.day, '2026-10-19')).toBe(false);
  });
});
