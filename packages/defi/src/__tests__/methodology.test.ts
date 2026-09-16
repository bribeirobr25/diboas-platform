import { describe, expect, it } from 'vitest';
import {
  ARBITRUM_STRATEGY_ENTRY_V1,
  SOLANA_LAMPORTS_PER_SIGNATURE,
  SOLANA_STRATEGY_ENTRY_V1,
  archetypeFor,
  deriveNetworkFee,
  methodologyRef,
  type GasObservation,
} from '../methodology';

const arbObs: GasObservation = {
  chain: 'Arbitrum',
  value: 20_044_000, // wei — the baseFeePerGas measured on 2026-09-15
  observedAt: '2026-09-15T09:12:44Z',
  retrievedAt: '2026-09-15T09:13:00Z',
};
const solObs: GasObservation = {
  chain: 'Solana',
  value: 0, // micro-lamports/CU — measured at 0
  observedAt: '2026-09-15T09:12:33Z',
  retrievedAt: '2026-09-15T09:13:00Z',
};

describe('the archetype is the MODELLED step, and says so', () => {
  it('should stamp a derived fee MODELLED with its methodology version, never OBSERVED', () => {
    const r = deriveNetworkFee({
      observation: arbObs,
      archetype: ARBITRUM_STRATEGY_ENTRY_V1,
      inputs: { gasUnits: 300_000 },
      nativeTokenPriceUsd: 2500,
    })!;
    expect(r.stamp.origin).toBe('MODELLED');
    expect(r.stamp.methodology).toBe('arb-usdc-strategy-entry@1');
    // The two timestamps stay apart: block time is not fetch time.
    expect(r.stamp.observedAt).toBe('2026-09-15T09:12:44Z');
    expect(r.stamp.asOf).toBe('2026-09-15T09:13:00Z');
    expect(r.stamp.observedAt).not.toBe(r.stamp.asOf);
  });

  it('should make a methodology change a new VERSION, not a silent edit', () => {
    expect(methodologyRef(ARBITRUM_STRATEGY_ENTRY_V1)).toBe('arb-usdc-strategy-entry@1');
    expect(methodologyRef(SOLANA_STRATEGY_ENTRY_V1)).toBe('sol-usdc-strategy-entry@1');
    // Every archetype names the quantities no observation provides.
    expect(ARBITRUM_STRATEGY_ENTRY_V1.modelledInputs).toEqual(['gasUnits']);
    expect(SOLANA_STRATEGY_ENTRY_V1.modelledInputs).toEqual(['signatures', 'computeUnits']);
  });

  it('should define archetypes only for the two reachable chains', () => {
    expect(archetypeFor('Arbitrum')).toBeDefined();
    expect(archetypeFor('Solana')).toBeDefined();
    // Every catalog strategy enters on Arbitrum or Solana; the other three
    // chains the market route asks for can never price anything (5.352).
    expect(archetypeFor('Ethereum')).toBeUndefined();
    expect(archetypeFor('Bitcoin')).toBeUndefined();
    expect(archetypeFor('Sui')).toBeUndefined();
  });
});

describe('the arithmetic is exact and stated in the units it claims', () => {
  it('should compute Arbitrum as baseFeePerGas x gasUnits, converted once', () => {
    const r = deriveNetworkFee({
      observation: arbObs,
      archetype: ARBITRUM_STRATEGY_ENTRY_V1,
      inputs: { gasUnits: 300_000 },
      nativeTokenPriceUsd: 2500,
    })!;
    expect(r.nativeAmount).toBe(20_044_000 * 300_000); // wei
    expect(r.usd).toBeCloseTo(((20_044_000 * 300_000) / 1e18) * 2500, 12);
  });

  it('should compute Solana as base fee per signature PLUS the priority rate', () => {
    const r = deriveNetworkFee({
      observation: { ...solObs, value: 1000 }, // 1000 micro-lamports/CU
      archetype: SOLANA_STRATEGY_ENTRY_V1,
      inputs: { signatures: 2, computeUnits: 200_000 },
      nativeTokenPriceUsd: 140,
    })!;
    const base = SOLANA_LAMPORTS_PER_SIGNATURE * 2;
    const priority = Math.ceil((1000 * 200_000) / 1e6);
    expect(r.nativeAmount).toBe(base + priority);
    expect(r.usd).toBeCloseTo(((base + priority) / 1e9) * 140, 12);
  });

  it('should still charge the base fee when the priority rate is the measured 0', () => {
    // The live reading was 0 — a zero PRIORITY is real; a zero FEE would not be.
    const r = deriveNetworkFee({
      observation: solObs,
      archetype: SOLANA_STRATEGY_ENTRY_V1,
      inputs: { signatures: 1, computeUnits: 200_000 },
      nativeTokenPriceUsd: 140,
    })!;
    expect(r.nativeAmount).toBe(SOLANA_LAMPORTS_PER_SIGNATURE);
    expect(r.usd).toBeGreaterThan(0);
  });
});

describe('a missing leg makes the fee UNAVAILABLE, never zero', () => {
  it('should refuse without the modelled quantity (no invented gas units)', () => {
    // §2 forbids generic gas units, so there is no default to fall back on.
    expect(
      deriveNetworkFee({
        observation: arbObs,
        archetype: ARBITRUM_STRATEGY_ENTRY_V1,
        inputs: {},
        nativeTokenPriceUsd: 2500,
      })
    ).toBeNull();
  });

  it('should refuse without the native-token price (a separate evidence leg)', () => {
    expect(
      deriveNetworkFee({
        observation: arbObs,
        archetype: ARBITRUM_STRATEGY_ENTRY_V1,
        inputs: { gasUnits: 300_000 },
        nativeTokenPriceUsd: null,
      })
    ).toBeNull();
  });

  it('should refuse a partial Solana input set', () => {
    for (const inputs of [{ signatures: 1 }, { computeUnits: 200_000 }, {}]) {
      expect(
        deriveNetworkFee({
          observation: solObs,
          archetype: SOLANA_STRATEGY_ENTRY_V1,
          inputs,
          nativeTokenPriceUsd: 140,
        })
      ).toBeNull();
    }
  });

  it('should refuse a mismatched chain and archetype', () => {
    expect(
      deriveNetworkFee({
        observation: solObs,
        archetype: ARBITRUM_STRATEGY_ENTRY_V1,
        inputs: { gasUnits: 300_000 },
        nativeTokenPriceUsd: 2500,
      })
    ).toBeNull();
  });

  it('should refuse an unusable observation rather than treat it as free', () => {
    for (const value of [Number.NaN, -1, Number.POSITIVE_INFINITY]) {
      expect(
        deriveNetworkFee({
          observation: { ...arbObs, value },
          archetype: ARBITRUM_STRATEGY_ENTRY_V1,
          inputs: { gasUnits: 300_000 },
          nativeTokenPriceUsd: 2500,
        })
      ).toBeNull();
    }
  });
});
