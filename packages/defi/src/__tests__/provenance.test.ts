import { describe, expect, it } from 'vitest';
import { FIXTURE_STAMP } from '../fixtures';
import { observedStamp } from '../testing';
import { strategyProvenance } from '../provenance';
import type { DataStamp, ProtocolApy, ProtocolId, StrategyDef } from '../types';

const STRATEGY: StrategyDef = {
  id: 'safeHarbor',
  i18nKey: 'test',
  horizonBands: ['short'],
  riskBand: 'stable',
  icon: 'shield-check',
  growthExposurePercent: 0,
  allocation: [
    { protocolId: 'skySsr', weightPercent: 50 },
    { protocolId: 'aaveV3', weightPercent: 50 },
  ],
  entryChain: 'Arbitrum',
};

function apy(protocolId: ProtocolId, source: 'defillama' | 'fixture', asOf: string): ProtocolApy {
  /* The stamp is built, not literal (AUD-F05): §8.8 made every provenance field
     required precisely so a construction site cannot stay silent — including
     this one. A fixture leg carries the fixture set's version and
     `fallbackUsed`; a live leg carries neither. */
  const stamp = source === 'fixture' ? FIXTURE_STAMP : observedStamp('defillama', asOf);
  return { protocolId, apyPercent: 5, tvlUsd: null, chain: 'Arbitrum', stamp };
}

describe('strategyProvenance — THE shared three-state predicate (§3-A)', () => {
  it('should be live only when EVERY leg is live, carrying the newest live stamp', () => {
    const p = strategyProvenance(STRATEGY, [
      apy('skySsr', 'defillama', '2026-08-18T00:00:00Z'),
      apy('aaveV3', 'defillama', '2026-08-19T00:00:00Z'),
    ]);
    expect(p.state).toBe('live');
    expect(p.fixtureProtocolIds).toEqual([]);
    expect(p.newestLiveAsOf).toBe('2026-08-19T00:00:00Z');
  });

  it('should be mixed with ONE fixture leg, NAMING it (the E5 interim condition)', () => {
    const p = strategyProvenance(STRATEGY, [
      apy('skySsr', 'defillama', '2026-08-19T00:00:00Z'),
      apy('aaveV3', 'fixture', '2026-07-18'),
    ]);
    expect(p.state).toBe('mixed');
    expect(p.fixtureProtocolIds).toEqual(['aaveV3']);
    expect(p.newestLiveAsOf).toBe('2026-08-19T00:00:00Z');
  });

  it('should be fixture when no leg is live', () => {
    const p = strategyProvenance(STRATEGY, [
      apy('skySsr', 'fixture', '2026-07-18'),
      apy('aaveV3', 'fixture', '2026-07-18'),
    ]);
    expect(p.state).toBe('fixture');
    expect(p.fixtureProtocolIds).toEqual(['skySsr', 'aaveV3']);
    expect(p.newestLiveAsOf).toBeNull();
  });

  it('should count a MISSING APY entry as a fixture leg (absence is never presented as live)', () => {
    const p = strategyProvenance(STRATEGY, [apy('skySsr', 'defillama', '2026-08-19T00:00:00Z')]);
    expect(p.state).toBe('mixed');
    expect(p.fixtureProtocolIds).toEqual(['aaveV3']);
  });
});

describe('gas provenance (GAS-1)', () => {
  const LIVE_APYS: ProtocolApy[] = STRATEGY.allocation.map((leg) => ({
    protocolId: leg.protocolId,
    apyPercent: 5,
    tvlUsd: null,
    chain: 'Ethereum',
    stamp: observedStamp('defillama', '2026-08-20'),
  }));

  it('should stay live when the fee source is live too', () => {
    const p = strategyProvenance(STRATEGY, LIVE_APYS, observedStamp('coingecko', '2026-08-20'));
    expect(p.state).toBe('live');
  });

  it('should NOT call itself live when the network fee comes from a fixture', () => {
    // The pre-commit cost surface renders the fee beside the rates. Stamping
    // it "Live from DeFiLlama" while the fee is a hardcoded 2026-07-18 fixture
    // is the provenance dishonesty GAS-1 required a decision on.
    const p = strategyProvenance(STRATEGY, LIVE_APYS, FIXTURE_STAMP);
    expect(p.state).toBe('mixed');
  });

  it('should keep APY-only scope where no fee is rendered', () => {
    // The picker shows rates only; omitting the stamp keeps the old meaning.
    expect(strategyProvenance(STRATEGY, LIVE_APYS).state).toBe('live');
  });
});

/**
 * The 2026-09-17 rulings, encoded at the domain layer because the ruling is
 * explicit that component control flow is not the proof.
 *
 *   §1  5.402 — APY copy derives from APY legs ONLY; gas must never change it.
 *   §2  Finding 1 — fee provenance is its own axis; `unavailable` is not
 *       `reference`, because no fee value is used in a refused calculation.
 *   §3  Finding 2 — provenance may reduce asserted truth, never increase it.
 */
describe('provenance axes — ruled 2026-09-17', () => {
  const GAS_FIXTURE: DataStamp = FIXTURE_STAMP;
  const GAS_LIVE: DataStamp = observedStamp('defillama', '2026-09-17T00:00:00Z');

  /* Declared HERE rather than borrowed: the `LIVE_APYS` above is scoped inside
     the GAS-1 describe, so a sibling block cannot reach it. Built through the
     shared `apy()` helper so the stamps stay constructed, never literal (AUD-F05). */
  const LIVE_APYS: ProtocolApy[] = [
    apy('skySsr', 'defillama', '2026-09-16T00:00:00Z'),
    apy('aaveV3', 'defillama', '2026-09-17T00:00:00Z'),
  ];
  const FIXTURE_APYS: ProtocolApy[] = [
    apy('skySsr', 'fixture', '2026-07-18'),
    apy('aaveV3', 'fixture', '2026-07-18'),
  ];
  const MIXED_APYS: ProtocolApy[] = [
    apy('skySsr', 'defillama', '2026-09-17T00:00:00Z'),
    apy('aaveV3', 'fixture', '2026-07-18'),
  ];

  it('should keep the APY axis LIVE when every rate is live, whatever gas does (5.402)', () => {
    for (const gas of [undefined, GAS_FIXTURE, 'missing' as const, GAS_LIVE]) {
      const p = strategyProvenance(STRATEGY, LIVE_APYS, gas);
      expect(
        p.apyProvenance,
        `gas=${String(gas && typeof gas === 'object' ? gas.source : gas)}`
      ).toBe('live');
    }
  });

  it('should distinguish an unavailable fee from a reference fee (Finding 1)', () => {
    /**
     * ⚑ STRUCTURAL UPDATE 2026-09-18 — the four-value `feeProvenance` was
     * decomposed into independent axes (canon §5). The ASSERTED TRUTHS are
     * unchanged and are restated here on the new shape; only the representation
     * generalized. This is a type/structure test, not an approved-output one:
     * `StrategyDetail.test.tsx` and `provenanceRender.test.tsx` assert the
     * rendered strings and were NOT touched.
     */
    expect(strategyProvenance(STRATEGY, LIVE_APYS, undefined).feeEvidence).toEqual({
      rendered: false,
    });

    const live = strategyProvenance(STRATEGY, LIVE_APYS, GAS_LIVE).feeEvidence;
    expect(live).toMatchObject({ rendered: true, availability: 'AVAILABLE', origin: 'OBSERVED' });

    const reference = strategyProvenance(STRATEGY, LIVE_APYS, GAS_FIXTURE).feeEvidence;
    expect(reference).toMatchObject({
      rendered: true,
      availability: 'AVAILABLE',
      origin: 'MODELLED',
    });

    const missing = strategyProvenance(STRATEGY, LIVE_APYS, 'missing').feeEvidence;
    expect(missing).toMatchObject({ rendered: true, availability: 'UNAVAILABLE' });
  });

  it('should state actionability EXPLICITLY on every available fee, never inferring it', () => {
    /* Canon §5: `Practice ≠ automatically REFERENCE`. Every fee this build can
       produce IS reference evidence — but it says so, and the value is read
       from the evidence rather than from mode. */
    for (const stamp of [GAS_LIVE, GAS_FIXTURE]) {
      const fee = strategyProvenance(STRATEGY, LIVE_APYS, stamp).feeEvidence;
      expect(fee).toMatchObject({ availability: 'AVAILABLE', actionability: 'REFERENCE' });
    }
  });

  it('should carry the fee cost category as NETWORK, never bundling another category in', () => {
    const fee = strategyProvenance(STRATEGY, LIVE_APYS, GAS_FIXTURE).feeEvidence;
    expect(fee).toMatchObject({ coverage: { kind: 'single', category: 'network' } });
  });

  it('should DEGRADE live -> mixed when the expected fee is missing (Finding 2, permitted)', () => {
    const p = strategyProvenance(STRATEGY, LIVE_APYS, 'missing');
    expect(p.state).toBe('mixed');
    expect(p.apyProvenance).toBe('live');
  });

  it('should NEVER lift a fixture strategy because gas is missing (Finding 2, forbidden)', () => {
    // Sabotage target: an implementation that computed `state` from the fee axis
    // would report `mixed` here and make a fixture surface look fresher.
    for (const gas of [GAS_FIXTURE, 'missing' as const, GAS_LIVE, undefined]) {
      const p = strategyProvenance(STRATEGY, FIXTURE_APYS, gas);
      expect(p.state).toBe('fixture');
      expect(p.apyProvenance).toBe('fixture');
    }
  });

  it('should never report a non-fixture state without a live timestamp (the deref invariant)', () => {
    const cases = [
      [LIVE_APYS, undefined],
      [LIVE_APYS, GAS_FIXTURE],
      [LIVE_APYS, 'missing' as const],
      [FIXTURE_APYS, 'missing' as const],
      [MIXED_APYS, 'missing' as const],
      [MIXED_APYS, GAS_FIXTURE],
    ] as const;
    for (const [apys, gas] of cases) {
      const p = strategyProvenance(STRATEGY, apys as ProtocolApy[], gas);
      if (p.state !== 'fixture') {
        expect(p.newestLiveAsOf, `state=${p.state}`).not.toBeNull();
      }
    }
  });

  it('should never let state be fresher than the APY axis', () => {
    const rank = { fixture: 0, mixed: 1, live: 2 } as const;
    for (const apys of [LIVE_APYS, MIXED_APYS, FIXTURE_APYS]) {
      for (const gas of [undefined, GAS_FIXTURE, 'missing' as const, GAS_LIVE]) {
        const p = strategyProvenance(STRATEGY, apys as ProtocolApy[], gas);
        expect(rank[p.state]).toBeLessThanOrEqual(rank[p.apyProvenance]);
      }
    }
  });
});
