import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PROTOCOL_DOMAIN_IDENTITY,
  domainIdentityOf,
  rateComposition,
  sourceAssetId,
  symbolSatisfies,
} from '../domainIdentity';
import { PROTOCOL_RETURN_MODEL, type ProtocolId } from '../types';

const PROTOCOLS = Object.keys(PROTOCOL_DOMAIN_IDENTITY) as ProtocolId[];

const pool = (over: Record<string, unknown> = {}) => ({
  pool: 'p1',
  project: 'aave-v3',
  chain: 'Arbitrum',
  symbol: 'USDC',
  apy: 5.4,
  apyBase: 5.4,
  apyReward: null,
  tvlUsd: 1_000_000,
  ...over,
});

const feed = (pools: unknown[]) =>
  (async () =>
    ({
      ok: true,
      status: 200,
      json: async () => ({ data: pools }),
    }) as unknown as Response) as unknown as typeof fetch;

/**
 * BLOCK B · DOMAIN / PROVIDER DECOUPLING.
 *
 * `PROVIDER ID ≠ DOMAIN IDENTITY`, and a rate whose meaning cannot be
 * determined is not acceptable evidence.
 */
describe('Block B · identity belongs to the domain, not to a vendor', () => {
  it('should declare an identity with a stated basis for every catalogue protocol', () => {
    expect(PROTOCOLS.length).toBe(6);
    for (const id of PROTOCOLS) {
      const d = domainIdentityOf(id);
      expect(d.because.length, id).toBeGreaterThan(20);
      expect(d.chain, id).toMatch(/^(Arbitrum|Solana|Ethereum|Bitcoin|Sui)$/);
    }
  });

  it('should carry NO vendor identifier on any domain type', () => {
    /**
     * The defect, stated as a guard. `ProtocolReturnModel`'s market arm used to
     * hold a CoinGecko slug, so replacing the price source would have changed a
     * DOMAIN type. Sabotage: put `coingeckoId` back on the model and this fails.
     */
    const types = readFileSync(join(__dirname, '..', 'types.ts'), 'utf8');
    const modelBlock = types.slice(
      types.indexOf('export type ProtocolReturnModel'),
      types.indexOf('export const PROTOCOL_RETURN_MODEL')
    );
    /**
     * ⛑ THE PATTERN WAS WIDENED AFTER IT FAILED TO FAIL.
     *
     * The first version matched `/coingeckoId\s*:/`, so the sabotage case —
     * adding `coingeckoId?: string` to the market arm — slipped through on the
     * optional marker between the name and the colon. A detector that cannot
     * match the real string reports absence and means nothing.
     *
     * It now matches any vendor NAME appearing as a property on the domain
     * type, however it is punctuated, and the field list is what the guard is
     * really about: the domain arm may carry `kind` and `asset`, nothing else.
     */
    for (const vendor of ['coingecko', 'defillama', 'llama', 'chainstack', 'ankr']) {
      expect(modelBlock.toLowerCase(), vendor).not.toMatch(
        new RegExp(`${vendor}[a-z]*\\s*\\??\\s*:`, 'i')
      );
    }
    const armStart = modelBlock.indexOf("{ kind: 'market'");
    const marketArm = modelBlock.slice(armStart, modelBlock.indexOf('}', armStart));
    const fields = [...marketArm.matchAll(/(\w+)\s*\??\s*:/g)].map((m) => m[1]);
    expect(fields).toEqual(['kind', 'asset']);
    for (const id of PROTOCOLS) {
      const m = PROTOCOL_RETURN_MODEL[id];
      if (m.kind === 'market') expect(m).not.toHaveProperty('coingeckoId');
    }
  });

  it('should resolve a vendor spelling per SOURCE, and refuse where a source names nothing', () => {
    expect(sourceAssetId('coingecko', 'jitoStakedSol')).toBe('jito-staked-sol');
    /* A rate source names no price asset; the honest answer is null, not a guess. */
    expect(sourceAssetId('defillama', 'jitoStakedSol')).toBeNull();
    expect(sourceAssetId('fixture', 'jupiterJlpLp')).toBeNull();
  });

  it('should distinguish a bridged asset from the native one', () => {
    const aave = domainIdentityOf('aaveV3');
    expect(aave.kind).toBe('lending');
    if (aave.kind !== 'lending') throw new Error('unreachable');
    expect(aave.assetForm).toBe('NATIVE');
    expect(symbolSatisfies(aave, 'USDC')).toBe(true);
    expect(symbolSatisfies(aave, 'usdc')).toBe(true);
    /* The entire reason the function exists: USDC.e is a different asset. */
    expect(symbolSatisfies(aave, 'USDC.E')).toBe(false);
    expect(symbolSatisfies(aave, 'USDCE')).toBe(false);
  });

  it('should name every catalogue leg as a SUPPLY position — diBoaS borrows nowhere', () => {
    for (const id of PROTOCOLS) {
      const d = domainIdentityOf(id);
      if (d.kind === 'lending') expect(d.side, id).toBe('SUPPLY');
    }
  });
});

describe('Block B · a rate must be identifiable to be usable', () => {
  /**
   * Fresh module state per test. `poolsCache` is a module-level cache with no
   * exported reset, so without this every test re-serves the FIRST feed and a
   * refusal case would silently assert nothing — the documented pattern in
   * `providers.test.ts`.
   */
  beforeEach(() => vi.resetModules());

  const providerWith = async (pools: unknown[]) => {
    const { DefiLlamaApyProvider } = await import('../providers/defillama');
    return new DefiLlamaApyProvider(feed(pools));
  };

  it('should classify composition from what the payload actually supplies', () => {
    expect(rateComposition({ apyBase: 5.4, apyReward: null })).toBe('BASE_ONLY');
    expect(rateComposition({ apyBase: 5.4, apyReward: 0 })).toBe('BASE_ONLY');
    expect(rateComposition({ apyBase: 5.4, apyReward: 1.2 })).toBe('BASE_PLUS_INCENTIVE');
    expect(rateComposition({ apyReward: 1.2 })).toBe('BASE_PLUS_INCENTIVE');
    /* Neither component supplied: the composite is not KNOWN. */
    expect(rateComposition({})).toBe('UNDETERMINED');
    expect(rateComposition({ apyBase: null, apyReward: null })).toBe('UNDETERMINED');
  });

  it('should accept a live rate whose composition IS determinable', async () => {
    const p = await providerWith([pool()]);
    const [aave] = await p.getCurrentApys(['aaveV3']);
    expect(aave.stamp.source).toBe('defillama');
    expect(aave.apyPercent).toBe(5.4);
  });

  it('should REFUSE a live rate whose composition is UNDETERMINED', async () => {
    /**
     * M&E: an ambiguous rate is NOT ACCEPTABLE evidence — not acceptable with a
     * caveat. Refused here means the LIVE observation is dropped and the leg
     * takes its documented fixture, the existing degrade path.
     */
    const p = await providerWith([pool({ apyBase: null, apyReward: null })]);
    const [aave] = await p.getCurrentApys(['aaveV3']);
    expect(aave.stamp.source).toBe('fixture');
  });

  it('should REFUSE a bridged pool standing in for the native leg', async () => {
    const p = await providerWith([pool({ symbol: 'USDC.E', apy: 9.9, apyBase: 9.9 })]);
    const [aave] = await p.getCurrentApys(['aaveV3']);
    /* The higher bridged rate must NOT be what the native leg reports. */
    expect(aave.stamp.source).toBe('fixture');
    expect(aave.apyPercent).not.toBe(9.9);
  });
});
