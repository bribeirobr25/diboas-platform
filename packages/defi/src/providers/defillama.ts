/**
 * DeFiLlama APY provider — REAL yield data, free, no API key.
 *
 * Design (decision G-9, docs/sandbox-app/BUILD_ORDER.md):
 * pool ids are NOT hardcoded. We fetch the public `/pools` feed once (cached),
 * then match each protocol by (project, chain, symbol) preference rules —
 * self-healing when DeFiLlama rotates pool UUIDs. The matched pool's id feeds
 * the `/chart/{pool}` history endpoint for return replay.
 *
 * Failure posture (Principle 7): any network/shape failure degrades to the
 * documented fixture value with an honest `fixture` stamp — never a crash,
 * never silent staleness (the stamp travels to the UI).
 */

import { FIXTURE_APYS } from '../fixtures';
import type { ApyPoint, IApyProvider, ProtocolApy, ProtocolApyHistory, ProtocolId } from '../types';

const POOLS_URL = 'https://yields.llama.fi/pools';
const CHART_URL = 'https://yields.llama.fi/chart/';

/** How each protocol is located in the pools feed (preference-ordered). */
interface PoolMatcher {
  /** DeFiLlama `project` slugs to accept, in preference order. */
  projects: string[];
  /** Accepted symbols (upper-cased compare). */
  symbols: string[];
  /** Preferred chains in order; falls back to highest-TVL match on any chain. */
  preferredChains: string[];
}

export const POOL_MATCHERS: Record<ProtocolId, PoolMatcher> = {
  skySsr: {
    projects: ['sky-lending', 'sky', 'makerdao', 'spark'],
    symbols: ['SUSDS', 'USDS', 'SDAI'],
    preferredChains: ['Arbitrum', 'Ethereum'],
  },
  aaveV3: {
    projects: ['aave-v3'],
    symbols: ['USDC', 'USDC.E'],
    preferredChains: ['Arbitrum'],
  },
  compoundV3: {
    projects: ['compound-v3'],
    symbols: ['USDC', 'USDC.E'],
    preferredChains: ['Arbitrum'],
  },
  sanctumInf: {
    projects: ['sanctum-infinity', 'sanctum', 'sanctum-validator-lsts'],
    symbols: ['INF'],
    preferredChains: ['Solana'],
  },
  jupiterJlp: {
    projects: ['jupiter-perpetual-exchange', 'jupiter-perps', 'jupiter'],
    symbols: ['JLP'],
    preferredChains: ['Solana'],
  },
  jito: {
    projects: ['jito-liquid-staking', 'jito'],
    symbols: ['JITOSOL'],
    preferredChains: ['Solana'],
  },
};

interface LlamaPool {
  pool: string;
  project: string;
  chain: string;
  symbol: string;
  apy: number | null;
  tvlUsd: number | null;
}

interface CacheEntry<T> {
  at: number;
  value: T;
}

/** Module-level caches (server runtime). TTLs sized to the free-tier budget. */
const POOLS_TTL_MS = 30 * 60 * 1000; // the pools feed is one big call — 30 min is plenty
const CHART_TTL_MS = 6 * 60 * 60 * 1000; // daily-granularity history — 6 h
let poolsCache: CacheEntry<LlamaPool[]> | null = null;
const chartCache = new Map<string, CacheEntry<ApyPoint[]>>();

async function fetchPools(fetchImpl: typeof fetch): Promise<LlamaPool[]> {
  if (poolsCache && Date.now() - poolsCache.at < POOLS_TTL_MS) return poolsCache.value;
  const res = await fetchImpl(POOLS_URL);
  if (!res.ok) throw new Error(`defillama /pools ${res.status}`);
  const body = (await res.json()) as { data?: LlamaPool[] };
  if (!Array.isArray(body.data)) throw new Error('defillama /pools: unexpected shape');
  poolsCache = { at: Date.now(), value: body.data };
  return body.data;
}

/**
 * Pick the best pool for a matcher: preferred chain first, then highest TVL.
 * Pools reporting apy ≤ 0 are excluded — DeFiLlama lists collateral-only
 * entries at 0% (e.g. JLP as lending collateral) and matching one would show
 * a real-stamped wrong number; no-match degrades to the honest fixture instead
 * (live-verified 2026-07-18: jupiterJlp intentionally rides its fixture until
 * research item R4 locates a true JLP yield feed).
 */
export function matchPool(pools: LlamaPool[], matcher: PoolMatcher): LlamaPool | null {
  const candidates = pools.filter(
    (p) =>
      matcher.projects.includes(p.project) &&
      matcher.symbols.includes((p.symbol ?? '').toUpperCase()) &&
      typeof p.apy === 'number' &&
      p.apy > 0
  );
  if (candidates.length === 0) return null;
  for (const chain of matcher.preferredChains) {
    const onChain = candidates
      .filter((p) => p.chain === chain)
      .sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0));
    if (onChain.length > 0) return onChain[0];
  }
  return [...candidates].sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0))[0];
}

function fixtureFor(protocolId: ProtocolId): ProtocolApy {
  return { protocolId, ...FIXTURE_APYS[protocolId] };
}

export class DefiLlamaApyProvider implements IApyProvider {
  constructor(private readonly fetchImpl: typeof fetch = fetch) {}

  async getCurrentApys(protocolIds: ProtocolId[]): Promise<ProtocolApy[]> {
    let pools: LlamaPool[];
    try {
      pools = await fetchPools(this.fetchImpl);
    } catch {
      return protocolIds.map(fixtureFor);
    }
    const asOf = new Date().toISOString();
    return protocolIds.map((protocolId) => {
      const match = matchPool(pools, POOL_MATCHERS[protocolId]);
      if (!match) return fixtureFor(protocolId);
      return {
        protocolId,
        apyPercent: match.apy as number,
        tvlUsd: match.tvlUsd,
        chain: (match.chain as ProtocolApy['chain']) ?? 'Solana',
        stamp: { source: 'defillama', asOf },
      };
    });
  }

  async getApyHistory(protocolId: ProtocolId, days: number): Promise<ProtocolApyHistory> {
    try {
      const pools = await fetchPools(this.fetchImpl);
      const match = matchPool(pools, POOL_MATCHERS[protocolId]);
      if (!match) throw new Error('no pool match');

      const cached = chartCache.get(match.pool);
      let points: ApyPoint[];
      if (cached && Date.now() - cached.at < CHART_TTL_MS) {
        points = cached.value;
      } else {
        const res = await this.fetchImpl(`${CHART_URL}${match.pool}`);
        if (!res.ok) throw new Error(`defillama /chart ${res.status}`);
        const body = (await res.json()) as {
          data?: Array<{ timestamp: string; apy: number | null }>;
        };
        if (!Array.isArray(body.data)) throw new Error('defillama /chart: unexpected shape');
        points = body.data
          .filter((d) => typeof d.apy === 'number')
          .map((d) => ({ date: d.timestamp.slice(0, 10), apyPercent: d.apy as number }));
        chartCache.set(match.pool, { at: Date.now(), value: points });
      }
      return {
        protocolId,
        points: points.slice(-days),
        stamp: { source: 'defillama', asOf: new Date().toISOString() },
      };
    } catch {
      // Honest degraded mode: a flat series at the fixture APY, stamped fixture.
      const fx = fixtureFor(protocolId);
      const today = new Date();
      const points: ApyPoint[] = Array.from({ length: days }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (days - 1 - i));
        return { date: d.toISOString().slice(0, 10), apyPercent: fx.apyPercent };
      });
      return { protocolId, points, stamp: fx.stamp };
    }
  }
}
