import { describe, expect, it } from 'vitest';
import { FIXTURE_STAMP } from '../fixtures';
import { observedStamp } from '../types';
import { strategyProvenance } from '../provenance';
import type { ProtocolApy, ProtocolId, StrategyDef } from '../types';

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
