/**
 * Umbrella card model (M3 — plan v3 D-M3-3 + CTO R-1′). Pure derivation —
 * every degraded state assertable without rendering: null feeds degrade ONE
 * card honestly (available:false → the calm unavailable line), never blank,
 * never dropped.
 */

import { describe, it, expect } from 'vitest';
import { umbrellaCardModel } from '../umbrellaModel';
import { MARKET_VIEWS } from '../viewRegistry';
import type { AnalyticsInitialData } from '@/lib/analytics-sdk/types';

const NULL_DATA: AnalyticsInitialData = {
  regime: null,
  historical: null,
  signals: null,
  dataStatus: null,
  methodology: null,
  productDisclaimer: null,
};

const snaps = (...scores: number[]) => ({
  synthetic_seed: false,
  range: '1y',
  snapshots: scores.map((score, i) => ({
    date: `2026-08-0${i + 1}T00:00:00Z`,
    score,
    regime_code: 'NEUTRAL_MIXED',
  })),
});

function scoredData(over: Partial<AnalyticsInitialData>): AnalyticsInitialData {
  return {
    ...NULL_DATA,
    regime: { regime_code: 'NEUTRAL_MIXED' } as AnalyticsInitialData['regime'],
    ...over,
  };
}

describe('scored cards', () => {
  const bitcoin = MARKET_VIEWS.bitcoin;

  it('should carry the band code and week-over-week direction', () => {
    const m = umbrellaCardModel(
      bitcoin,
      scoredData({ historical: snaps(7, 6) as AnalyticsInitialData['historical'] })
    );
    expect(m).toMatchObject({ available: true, bandCode: 'NEUTRAL_MIXED', direction: 'down' });
  });

  it('should report up and held directions', () => {
    const up = umbrellaCardModel(
      bitcoin,
      scoredData({ historical: snaps(5, 8) as AnalyticsInitialData['historical'] })
    );
    const held = umbrellaCardModel(
      bitcoin,
      scoredData({ historical: snaps(6, 6) as AnalyticsInitialData['historical'] })
    );
    expect(up.direction).toBe('up');
    expect(held.direction).toBe('held');
  });

  it('should omit direction with fewer than two real snapshots or a synthetic seed', () => {
    const one = umbrellaCardModel(
      bitcoin,
      scoredData({ historical: snaps(6) as AnalyticsInitialData['historical'] })
    );
    const seeded = umbrellaCardModel(
      bitcoin,
      scoredData({
        historical: {
          ...snaps(7, 6),
          synthetic_seed: true,
        } as unknown as AnalyticsInitialData['historical'],
      })
    );
    expect(one.available).toBe(true);
    expect(one.direction).toBeUndefined();
    expect(seeded.direction).toBeUndefined();
  });

  it('should carry the first sentence of the plain summary as the card line (view-voice)', () => {
    const m = umbrellaCardModel(
      bitcoin,
      scoredData({
        regime: {
          regime_code: 'NEUTRAL_MIXED',
          summary: { plain: 'The score eased a little this week. More detail follows.' },
        } as unknown as AnalyticsInitialData['regime'],
      })
    );
    expect(m.plainLine).toBe('The score eased a little this week.');
    // Cycles predating the plain layer: no line, never a crash.
    const bare = umbrellaCardModel(bitcoin, scoredData({}));
    expect(bare.available).toBe(true);
    expect(bare.plainLine).toBeUndefined();
  });

  it('should degrade honestly on a null or unknown regime (R-1′)', () => {
    expect(umbrellaCardModel(bitcoin, NULL_DATA)).toMatchObject({
      available: false,
      slug: 'bitcoin',
    });
    const unknown = umbrellaCardModel(
      bitcoin,
      scoredData({
        regime: { regime_code: 'BANANAS' } as unknown as AnalyticsInitialData['regime'],
      })
    );
    expect(unknown.available).toBe(false);
  });
});

describe('state cards (backdrop)', () => {
  const backdrop = MARKET_VIEWS.backdrop;

  const macroData = (states: [string, string, string]): AnalyticsInitialData => ({
    ...NULL_DATA,
    signals: {
      signal_groups: [
        {
          id: 'macro_environment',
          signals: [
            { id: 'MAC-01', state: states[0] },
            { id: 'MAC-02', state: states[1] },
            { id: 'MAC-03', state: states[2] },
          ],
        },
      ],
    } as unknown as AnalyticsInitialData['signals'],
  });

  it('should derive the three conditions in fixed component order', () => {
    const m = umbrellaCardModel(backdrop, macroData(['ACTIVE', 'INACTIVE', 'ACTIVE']));
    expect(m.available).toBe(true);
    expect(m.conditions).toEqual([
      { id: 'MAC-01', active: true },
      { id: 'MAC-02', active: false },
      { id: 'MAC-03', active: true },
    ]);
  });

  /**
   * 5.305: the version of this test that shipped before 2026-09-12 asserted the
   * 5.174 DEFECT and hid it. It set `summary` to
   * "Macro conditions are mixed: two of three supportive." — points spelled in
   * WORDS — and asserted `plainLine` equalled it. The real `summary` ends
   * "(2 of 3 points)", so the assertion was strong, precise, and pinned the
   * wrong behaviour (coding-standards §Testing class 3, "Wrong"). The fixtures
   * below now carry the REAL shape of both fields.
   */
  const REAL_SUMMARY =
    'Macro conditions are mixed: the dollar and liquidity on the supportive side, ' +
    'yields on the restrictive side (2 of 3 points).';
  const REAL_LEAD =
    'Macro conditions are mixed: the dollar and liquidity on the supportive side, ' +
    'yields on the restrictive side. The dollar is still below its 20 week trend. ' +
    'Money has not got cheaper. Liquidity keeps expanding.';

  const withCopy = (summary?: string, lead?: string) => {
    const data = macroData(['ACTIVE', 'INACTIVE', 'ACTIVE']);
    const group = (
      data.signals as unknown as {
        signal_groups: { id: string; summary?: string; state_view?: { lead: string } }[];
      }
    ).signal_groups[0];
    if (summary !== undefined) group.summary = summary;
    if (lead !== undefined) group.state_view = { lead };
    return data;
  };

  it('should take the state-view lead, first sentence only (view-voice)', () => {
    const m = umbrellaCardModel(backdrop, withCopy(REAL_SUMMARY, REAL_LEAD));
    expect(m.plainLine).toBe(
      'Macro conditions are mixed: the dollar and liquidity on the supportive side, ' +
        'yields on the restrictive side.'
    );
  });

  it('should carry NO score fragment on a state card (MM-2, 5.174)', () => {
    // The binding rule: state views carry no score (viewRegistry.ts). The
    // scored `summary` ends with the points parenthetical by design, so reading
    // it here is the defect. Same regex the state-lead guard uses, so the two
    // cannot drift apart.
    const m = umbrellaCardModel(backdrop, withCopy(REAL_SUMMARY, REAL_LEAD));
    expect(m.plainLine).not.toMatch(/\d\s*(of|de|von)\s*\d\s*(points|pontos|puntos|Punkten)/i);
  });

  it('should fall back to summary only when no lead exists (pre-state_view payload)', () => {
    // A stale fragment still beats a blank card — but only when there is no
    // alternative. Any current cycle has the lead.
    const m = umbrellaCardModel(backdrop, withCopy(REAL_SUMMARY, undefined));
    expect(m.plainLine).toBe(REAL_SUMMARY);
  });

  it('should degrade honestly when the macro group or a component is missing (R-1′)', () => {
    expect(umbrellaCardModel(backdrop, NULL_DATA).available).toBe(false);
    const partial: AnalyticsInitialData = {
      ...NULL_DATA,
      signals: {
        signal_groups: [{ id: 'macro_environment', signals: [{ id: 'MAC-01', state: 'ACTIVE' }] }],
      } as unknown as AnalyticsInitialData['signals'],
    };
    expect(umbrellaCardModel(backdrop, partial).available).toBe(false);
  });
});
