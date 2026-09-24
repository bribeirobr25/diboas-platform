/**
 * THE REPLAY-OUTCOME TRIGGER — provenance, never a guess.
 *
 * ⚑ These assert the TRIGGER, not a rendered surface. The trigger is where the
 * ruling's hard boundaries live: a lending-only outcome must not be attributed
 * merely because CoinGecko exists upstream, and an aggregate must be attributed
 * when it CONTAINS an affected outcome. A component test could pass for a
 * trigger that simply returned `true`.
 */

import { describe, expect, it } from 'vitest';
import type { LedgerEvent } from '@diboas/banking';
import {
  anyOutcomeUsesCoinGeckoPrices,
  goalUsesCoinGeckoPrices,
  marketPriceSourcesByGoal,
} from '../marketDataAttribution';

const entered = (goalId: string, positionId: string): LedgerEvent =>
  ({
    type: 'StrategyEntered',
    schemaVersion: 2,
    goalId,
    positionId,
    strategyId: 'fullThrottle',
    amount: '1000.00',
    modeledNetworkFee: '0.00',
    eventId: `e-${positionId}`,
    recordedAt: '2026-09-01T00:00:00.000Z',
    correlationId: `c-${positionId}`,
  }) as unknown as LedgerEvent;

const accrual = (
  positionId: string,
  legs: { kind: 'lending' | 'market'; source: string }[] | undefined
): LedgerEvent =>
  ({
    type: 'AccrualApplied',
    positionId,
    fromSimDay: 0,
    toSimDay: 7,
    earnings: '1.23',
    apySource: 'defillama',
    ...(legs
      ? {
          legsReplayed: legs.map((l) => ({
            weightPercent: 50,
            kind: l.kind,
            source: l.source,
            multiple: '1.01',
          })),
        }
      : {}),
    eventId: `a-${positionId}`,
    recordedAt: '2026-09-02T00:00:00.000Z',
    correlationId: `c-${positionId}`,
  }) as unknown as LedgerEvent;

describe('market-leg replay IS the trigger', () => {
  it('should attribute a goal whose replay consumed a provider price series', () => {
    const events = [
      entered('g1', 'p1'),
      accrual('p1', [
        { kind: 'lending', source: 'defillama' },
        { kind: 'market', source: 'coingecko' },
      ]),
    ];
    expect(goalUsesCoinGeckoPrices(events, 'g1')).toBe(true);
    expect(anyOutcomeUsesCoinGeckoPrices(events)).toBe(true);
  });

  it('should attribute an AGGREGATE that merely CONTAINS such an outcome', () => {
    // Two goals; only one has a market leg. The aggregate triggers, the
    // lending-only goal does not — both halves asserted together, because one
    // without the other would pass for an indiscriminate implementation.
    const events = [
      entered('stable', 'pS'),
      accrual('pS', [{ kind: 'lending', source: 'defillama' }]),
      entered('growth', 'pG'),
      accrual('pG', [{ kind: 'market', source: 'coingecko' }]),
    ];
    expect(anyOutcomeUsesCoinGeckoPrices(events)).toBe(true);
    expect(goalUsesCoinGeckoPrices(events, 'growth')).toBe(true);
    expect(goalUsesCoinGeckoPrices(events, 'stable')).toBe(false);
  });
});

describe('what must NOT trigger', () => {
  it('should NOT attribute a lending-only outcome', () => {
    const events = [entered('g1', 'p1'), accrual('p1', [{ kind: 'lending', source: 'defillama' }])];
    expect(goalUsesCoinGeckoPrices(events, 'g1')).toBe(false);
    expect(anyOutcomeUsesCoinGeckoPrices(events)).toBe(false);
  });

  it('should NOT attribute a SOLE-LENDING span, whose accrual carries no legsReplayed', () => {
    /* The planner writes `ratesUsed` instead for a sole lending leg. Absence is
       not missing data — it positively means "no market leg", so it must read
       as a NON-trigger rather than as unknown. */
    const events = [entered('g1', 'p1'), accrual('p1', undefined)];
    expect(goalUsesCoinGeckoPrices(events, 'g1')).toBe(false);
  });

  it('should NOT attribute a market leg that replayed the FIXTURE series', () => {
    // No provider data entered the calculation, so there is nothing to credit.
    const events = [entered('g1', 'p1'), accrual('p1', [{ kind: 'market', source: 'fixture' }])];
    expect(goalUsesCoinGeckoPrices(events, 'g1')).toBe(false);
  });

  it('should NOT attribute an unknown source id', () => {
    // Fail closed: a future writer's unrecognised id is not silently credited.
    const events = [
      entered('g1', 'p1'),
      accrual('p1', [{ kind: 'market', source: 'some-future-source' }]),
    ];
    expect(goalUsesCoinGeckoPrices(events, 'g1')).toBe(false);
  });

  it('should NOT attribute a goal with no events at all', () => {
    expect(goalUsesCoinGeckoPrices([], 'g1')).toBe(false);
    expect(anyOutcomeUsesCoinGeckoPrices([])).toBe(false);
  });

  it('should NOT depend on raw price VISIBILITY — no price is ever rendered', () => {
    /* RAW PRICE VISIBILITY REQUIRED = NO. The trigger reads the replay record;
       nothing about it consults what is on screen, so hiding or showing a price
       cannot change the answer. */
    const events = [entered('g1', 'p1'), accrual('p1', [{ kind: 'market', source: 'coingecko' }])];
    expect(goalUsesCoinGeckoPrices(events, 'g1')).toBe(true);
  });
});

describe('the trigger reads provenance, not names', () => {
  it('should not care which STRATEGY produced the position', () => {
    // Same strategy id, opposite answers — decided purely by the recorded legs.
    const withMarket = [
      entered('g1', 'p1'),
      accrual('p1', [{ kind: 'market', source: 'coingecko' }]),
    ];
    const withoutMarket = [
      entered('g1', 'p1'),
      accrual('p1', [{ kind: 'lending', source: 'defillama' }]),
    ];
    expect(goalUsesCoinGeckoPrices(withMarket, 'g1')).toBe(true);
    expect(goalUsesCoinGeckoPrices(withoutMarket, 'g1')).toBe(false);
  });

  it('should report WHICH sources contributed, per goal', () => {
    const events = [
      entered('g1', 'p1'),
      accrual('p1', [
        { kind: 'market', source: 'coingecko' },
        { kind: 'lending', source: 'defillama' },
      ]),
    ];
    const byGoal = marketPriceSourcesByGoal(events);
    // Only the MARKET leg's source is a price contribution; the lending leg's
    // rate source is not a price series and must not appear here.
    expect([...(byGoal.get('g1') ?? [])]).toEqual(['coingecko']);
  });

  it('should ignore an accrual whose position was never entered', () => {
    // No position->goal link means no goal can be attributed from it.
    const events = [accrual('orphan', [{ kind: 'market', source: 'coingecko' }])];
    expect(marketPriceSourcesByGoal(events).size).toBe(0);
    // ...but the OVERALL aggregate still sees it, because it asks a different
    // question: does any rendered outcome incorporate provider prices?
    expect(anyOutcomeUsesCoinGeckoPrices(events)).toBe(true);
  });
});
