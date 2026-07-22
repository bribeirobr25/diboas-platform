import { describe, expect, it } from 'vitest';
import { CoinGeckoPriceProvider } from '../providers/coingecko';
import { DefiLlamaApyProvider, matchPool } from '../providers/defillama';
import { FixtureGasProvider } from '../providers/gas';

/** A fetch stub that always fails — exercises the fail-open fixture path. */
const failingFetch: typeof fetch = async () => {
  throw new Error('network down');
};

/** A fetch stub returning a canned JSON body. */
function jsonFetch(body: unknown): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;
}

describe('DefiLlamaApyProvider (fail-open contract, Principle 7)', () => {
  it('should degrade to fixture APYs with an honest fixture stamp when the network fails', async () => {
    const provider = new DefiLlamaApyProvider(failingFetch);
    const apys = await provider.getCurrentApys(['skySsr', 'jito']);
    expect(apys).toHaveLength(2);
    for (const apy of apys) {
      expect(apy.stamp.source).toBe('fixture');
      expect(apy.apyPercent).toBeGreaterThan(0);
    }
  });

  it('should return live-stamped APYs when the pools feed matches', async () => {
    const provider = new DefiLlamaApyProvider(
      jsonFetch({
        data: [
          {
            pool: 'uuid-1',
            project: 'aave-v3',
            chain: 'Arbitrum',
            symbol: 'USDC',
            apy: 5.4,
            tvlUsd: 100_000_000,
          },
        ],
      })
    );
    const [aave] = await provider.getCurrentApys(['aaveV3']);
    expect(aave.stamp.source).toBe('defillama');
    expect(aave.apyPercent).toBe(5.4);
    expect(aave.chain).toBe('Arbitrum');
  });

  it('should produce a flat fixture-stamped history series when the chart endpoint fails', async () => {
    const provider = new DefiLlamaApyProvider(failingFetch);
    const history = await provider.getApyHistory('compoundV3', 30);
    expect(history.points).toHaveLength(30);
    expect(history.stamp.source).toBe('fixture');
    // Flat series: every point equals the fixture APY.
    const distinct = new Set(history.points.map((p) => p.apyPercent));
    expect(distinct.size).toBe(1);
  });
});

describe('matchPool (preference rules)', () => {
  const pools = [
    { pool: 'a', project: 'aave-v3', chain: 'Ethereum', symbol: 'USDC', apy: 4, tvlUsd: 900 },
    { pool: 'b', project: 'aave-v3', chain: 'Arbitrum', symbol: 'USDC', apy: 5, tvlUsd: 100 },
    { pool: 'c', project: 'aave-v3', chain: 'Arbitrum', symbol: 'USDC', apy: 6, tvlUsd: 500 },
  ];

  it('should prefer the preferred chain and the highest TVL within it', () => {
    const match = matchPool(pools, {
      projects: ['aave-v3'],
      symbols: ['USDC'],
      preferredChains: ['Arbitrum'],
    });
    expect(match?.pool).toBe('c');
  });

  it('should fall back to highest TVL on any chain when the preferred chain has no pool', () => {
    const match = matchPool(pools, {
      projects: ['aave-v3'],
      symbols: ['USDC'],
      preferredChains: ['Solana'],
    });
    expect(match?.pool).toBe('a');
  });

  it('should return null when nothing matches (caller degrades to fixture)', () => {
    expect(
      matchPool(pools, { projects: ['nope'], symbols: ['USDC'], preferredChains: ['Arbitrum'] })
    ).toBeNull();
  });
});

describe('CoinGeckoPriceProvider (fail-open contract)', () => {
  it('should degrade to fixture prices with an honest stamp when the network fails', async () => {
    const provider = new CoinGeckoPriceProvider(failingFetch, undefined);
    const quotes = await provider.getPrices(['BTC', 'USDC'], 'BRL');
    expect(quotes).toHaveLength(2);
    for (const q of quotes) expect(q.stamp.source).toBe('fixture');
    // USDC fixture in BRL uses the documented fixture FX, never 1:1.
    const usdc = quotes.find((q) => q.assetId === 'USDC');
    expect(usdc?.price).toBeGreaterThan(1);
  });
});

describe('FixtureGasProvider', () => {
  it('should stamp every quote as fixture and cover all chains of the asset scope', async () => {
    const provider = new FixtureGasProvider();
    for (const chain of ['Solana', 'Arbitrum', 'Ethereum', 'Bitcoin', 'Sui'] as const) {
      const quote = await provider.getGas(chain);
      expect(quote.stamp.source).toBe('fixture');
      expect(quote.typicalFeeUsd).toBeGreaterThan(0);
    }
  });
});
