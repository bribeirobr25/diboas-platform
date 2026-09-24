import { describe, expect, it } from 'vitest';

import { legRequiresCurrentRate } from '../catalogueEvidence';
import { strategyProvenance } from '../provenance';
import { STRATEGY_CATALOG } from '../catalog';
import { FIXTURE_STAMP } from '../fixtures';
import { observedStamp } from '../testing';
import type { ProtocolApy, ProtocolId } from '../types';

const live = (protocolId: ProtocolId): ProtocolApy => ({
  protocolId,
  apyPercent: 4,
  tvlUsd: null,
  chain: 'Arbitrum',
  stamp: observedStamp('defillama', '2026-09-20T00:00:00Z'),
});
const fixture = (protocolId: ProtocolId): ProtocolApy => ({
  protocolId,
  apyPercent: 4,
  tvlUsd: null,
  chain: 'Arbitrum',
  stamp: FIXTURE_STAMP,
});

const HETERO = STRATEGY_CATALOG.filter((s) =>
  s.allocation.some((l) => !legRequiresCurrentRate(l.protocolId))
);

/** S2 · the APY provenance axis describes only legs that participate in the rate. */
describe('S2 · provenance names only what the number is built from', () => {
  it('should find heterogeneous strategies to reason about', () => {
    expect(HETERO.length).toBe(5);
  });

  it('should NOT name a market leg as the provenance of an APY', () => {
    /**
     * The `mixed` copy NAMES these legs ("reference values for: …"). A market
     * leg owes no rate and contributes none, so naming it would state — in four
     * locales — that a rate was built from something it was not built from.
     */
    for (const s of HETERO) {
      const apys = s.allocation.map((l) =>
        legRequiresCurrentRate(l.protocolId) ? live(l.protocolId) : fixture(l.protocolId)
      );
      const p = strategyProvenance(s, apys);
      for (const leg of s.allocation.filter((l) => !legRequiresCurrentRate(l.protocolId))) {
        expect(p.fixtureProtocolIds, `${s.id} names ${leg.protocolId}`).not.toContain(
          leg.protocolId
        );
      }
      /* Every accrual leg is live, so the axis is LIVE — a market leg on a
         fixture stamp must not drag it to `mixed`. */
      expect(p.apyProvenance, s.id).toBe('live');
    }
  });

  it('should STILL name an accrual leg that is genuinely fixture-backed', () => {
    /* The scoping must not silence the axis it exists to keep honest: a
       legitimate mixed live/fixture accrual provenance stays reachable. */
    const pure = STRATEGY_CATALOG.find((s) =>
      s.allocation.every((l) => legRequiresCurrentRate(l.protocolId))
    )!;
    const [first, ...rest] = pure.allocation;
    const apys = [fixture(first.protocolId), ...rest.map((l) => live(l.protocolId))];
    const p = strategyProvenance(pure, apys);
    expect(p.fixtureProtocolIds).toContain(first.protocolId);
    expect(p.apyProvenance).toBe('mixed');
  });
});
