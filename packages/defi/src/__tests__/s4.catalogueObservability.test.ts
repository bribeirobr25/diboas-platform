import { beforeEach, describe, expect, it } from 'vitest';
import { STRATEGY_CATALOG } from '../catalog';
import { legRequiresCurrentRate } from '../catalogueEvidence';
import { FIXTURE_STAMP } from '../fixtures';
import {
  __resetEvidenceEvents,
  drainEvidenceEvents,
  evidenceEvents,
  evidenceOutcomeCounts,
} from '../evidenceObservability';
import { __resetRateAvailabilityReporting, strategyRateAvailability } from '../rateAvailability';
import { observedStamp } from '../testing';
import type { ProtocolApy, ProtocolId, StrategyDef } from '../types';

/**
 * `5.444` §16 · MINIMUM REQUIRED OBSERVABILITY for the S1–S3 contract.
 *
 * The plan required two decisions to be observable and the implementation
 * shipped without them, while the system review simultaneously recorded
 * "observability unchanged" — two statements that could not both satisfy the
 * controlling plan. These prove the gap is closed, and closed HONESTLY:
 *
 *   a leg that owes nothing  -> an INTENTIONAL typed decision, not a silence
 *   a required rate missing  -> a refusal that names WHICH leg
 *   a market rate missing    -> NOT a refusal, because none was owed
 *
 * ⚑ These assert the RECORDED EVENT, never a call count or a spy. An event a
 * drain cannot read is not observability.
 */

const NOW = '2026-09-24T00:00:00.000Z';

/** A strategy with at least one leg that owes nothing — measured, not assumed. */
const HETERO: StrategyDef[] = STRATEGY_CATALOG.filter((s) =>
  s.allocation.some((l) => !legRequiresCurrentRate(l.protocolId))
);
/** A strategy whose every leg owes a rate. */
const PURE: StrategyDef[] = STRATEGY_CATALOG.filter((s) =>
  s.allocation.every((l) => legRequiresCurrentRate(l.protocolId))
);

function live(protocolId: ProtocolId): ProtocolApy {
  return {
    protocolId,
    apyPercent: 4,
    tvlUsd: null,
    chain: 'Arbitrum',
    stamp: observedStamp('defillama', NOW),
  };
}

/** Rates for the legs that owe one, and nothing for the legs that do not. */
function accrualOnly(s: StrategyDef): ProtocolApy[] {
  return s.allocation
    .filter((l) => legRequiresCurrentRate(l.protocolId))
    .map((l) => live(l.protocolId));
}

beforeEach(() => {
  __resetEvidenceEvents();
  __resetRateAvailabilityReporting();
});

describe('§16 · the fixtures this suite depends on are real', () => {
  it('should have BOTH kinds of strategy in the catalogue, or every test below is vacuous', () => {
    expect(HETERO.length, 'no heterogeneous strategy — nothing to observe').toBeGreaterThan(0);
    expect(PURE.length, 'no pure-accrual strategy — nothing to compare against').toBeGreaterThan(0);
  });

  it('should start each test with an empty ring (the reset actually resets)', () => {
    expect(evidenceEvents()).toHaveLength(0);
  });
});

describe('§16 · a leg that owes nothing is an INTENTIONAL decision, and it is observable', () => {
  it('should record NOT_REQUIRED naming the market leg, with no source and no reason', () => {
    const s = HETERO[0]!;
    const market = s.allocation.filter((l) => !legRequiresCurrentRate(l.protocolId));
    expect(market.length).toBeGreaterThan(0);

    strategyRateAvailability(s, accrualOnly(s), NOW);

    const notRequired = evidenceEvents().filter((e) => e.outcome === 'NOT_REQUIRED');
    expect(notRequired.length, 'the typed decision left no trace').toBe(market.length);
    for (const e of notRequired) {
      expect(market.map((l) => l.protocolId)).toContain(e.leg);
      /* No source was consulted — a catalogue decision precedes any fetch. */
      expect(e.source, 'a source was named for a decision no source took part in').toBeNull();
      /* Not a refusal, so no refusal reason. */
      expect(e.reason).toBeNull();
      expect(e.subject).toBe('APY_CURRENT');
    }
  });

  it('should NOT record NOT_REQUIRED for a strategy whose every leg owes a rate', () => {
    const s = PURE[0]!;
    strategyRateAvailability(s, accrualOnly(s), NOW);
    expect(evidenceEvents().filter((e) => e.outcome === 'NOT_REQUIRED')).toEqual([]);
  });

  it('should count the new outcome, so a drain-free reader can still see it', () => {
    strategyRateAvailability(HETERO[0]!, accrualOnly(HETERO[0]!), NOW);
    expect(evidenceOutcomeCounts().NOT_REQUIRED).toBeGreaterThan(0);
  });
});

describe('§16 · a refusal names WHICH leg', () => {
  it('should identify the leg whose REQUIRED evidence is missing', () => {
    const s = PURE[0]!;
    const rates = accrualOnly(s);
    const dropped = rates[0]!.protocolId;

    const r = strategyRateAvailability(s, rates.slice(1), NOW);
    expect(r).toEqual({ available: false, reason: 'NO_OBSERVATION' });

    const refusals = evidenceEvents().filter((e) => e.outcome === 'REFUSED');
    expect(refusals, 'a refusal with no event is an undiagnosable one').toHaveLength(1);
    expect(refusals[0]!.leg, 'the refusal does not say WHICH leg').toBe(dropped);
    expect(refusals[0]!.reason).toBe('NO_OBSERVATION');
  });

  it('should identify the leg whose required evidence is REFUSED BY CONTRACT (over-age)', () => {
    const s = PURE[0]!;
    /* Every leg present, all far outside the current-facing window. */
    const stale = s.allocation
      .filter((l) => legRequiresCurrentRate(l.protocolId))
      .map((l) => ({ ...live(l.protocolId), stamp: FIXTURE_STAMP }));

    const r = strategyRateAvailability(s, stale, NOW);
    expect(r).toEqual({ available: false, reason: 'REFUSED_BY_CONTRACT' });

    const refusals = evidenceEvents().filter((e) => e.outcome === 'REFUSED');
    expect(refusals).toHaveLength(1);
    expect(refusals[0]!.reason).toBe('REFUSED_BY_CONTRACT');
    expect(refusals[0]!.leg).toBe(stale[0]!.protocolId);
  });
});

describe('§16 · a missing NON-REQUIRED market rate produces NO false refusal', () => {
  it('should stay available and record no REFUSED when only a market rate is absent', () => {
    const s = HETERO[0]!;
    /* Deliberately supply nothing for the market legs. */
    const r = strategyRateAvailability(s, accrualOnly(s), NOW);
    expect(r, 'a leg that owes nothing made the strategy unavailable').toEqual({ available: true });

    expect(
      evidenceEvents().filter((e) => e.outcome === 'REFUSED'),
      'a refusal was reported for evidence no leg owed'
    ).toEqual([]);
    expect(evidenceOutcomeCounts().REFUSED).toBe(0);
  });
});

describe('§16 · PROVIDER ID ≠ DOMAIN IDENTITY', () => {
  it('should carry a catalogue ProtocolId as the leg, never a provider id or slug', () => {
    strategyRateAvailability(HETERO[0]!, accrualOnly(HETERO[0]!), NOW);
    const catalogueIds = new Set<string>(
      STRATEGY_CATALOG.flatMap((s) => s.allocation.map((l) => l.protocolId))
    );
    const legs = evidenceEvents().map((e) => e.leg);
    expect(legs.length).toBeGreaterThan(0);
    for (const leg of legs) {
      expect(leg, 'a non-catalogue identity reached the leg field').toBeTruthy();
      expect(catalogueIds.has(leg as string), String(leg)).toBe(true);
      /* The three source ids must never appear here. */
      expect(['defillama', 'coingecko', 'fixture']).not.toContain(leg);
    }
  });
});

describe('§16 · the instrumentation must not evict the events it joins', () => {
  it('should report each distinct decision ONCE, not once per render', () => {
    /**
     * MEASURED, not assumed: one picker render at `horizon=any` evaluates 29
     * legs, 9 of them market legs. Per-call emission would fill a 500-event
     * ring in ~20 renders and evict the DeFiLlama degradation events — the
     * silence Block G exists to end. Ten evaluations must therefore cost the
     * same as one.
     */
    const s = HETERO[0]!;
    const rates = accrualOnly(s);
    for (let i = 0; i < 10; i += 1) strategyRateAvailability(s, rates, NOW);

    const market = s.allocation.filter((l) => !legRequiresCurrentRate(l.protocolId));
    expect(evidenceEvents()).toHaveLength(market.length);
  });

  it('should report again after a DRAIN — "once" means once per drain window', () => {
    const s = HETERO[0]!;
    const rates = accrualOnly(s);
    strategyRateAvailability(s, rates, NOW);
    const first = drainEvidenceEvents();
    expect(first.length).toBeGreaterThan(0);

    /* A host that drains also clears the reporting window. */
    __resetRateAvailabilityReporting();
    strategyRateAvailability(s, rates, NOW);
    expect(evidenceEvents().length, 'a decision that recurred after a drain went unreported').toBe(
      first.length
    );
  });
});
