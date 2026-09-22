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

import { CURRENT_CATALOG_PROTOCOL_NETWORK } from '../catalog';
import { FIXTURE_APYS } from '../fixtures';
import type { ApyPoint, IApyProvider, ProtocolApy, ProtocolApyHistory, ProtocolId } from '../types';
import { evidenceStamp } from '../types';
import { PROVIDER_FETCH_TIMEOUT_MS, SANDBOX_MARKET_TTL_MS } from '../types';
import { createRevalidatingCache, type RevalidatedEntry } from './revalidatingCache';
import { permitsUse } from '../providerDisposition';
import { fallbackFor } from '../fallbackEligibility';

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

/**
 * Module-level caches (server runtime). ONE ruled TTL (founder 2026-08-19):
 * every externally-fetched market value in the SANDBOX refreshes at most every
 * 6 hours — free-tier protection at visitor scale (1k/10k/100k visits must
 * never fan out to the providers). Real-time data is the REAL app's property,
 * served by paid APIs through the analytics layer (P2BD-14).
 *
 * The stamp is the FETCH moment, carried on the cache entry. It used to be
 * minted as `new Date()` at serve time, so a value up to six hours old was
 * stamped as "now" — verified live: three requests seconds apart returned three
 * different `asOf` values for the same cached pools. Data Vintage P-4: freshness
 * is never simulated by re-stamping.
 */
const POOLS_TTL_MS = SANDBOX_MARKET_TTL_MS; // founder-ruled 6 h (was 30 min)
const CHART_TTL_MS = SANDBOX_MARKET_TTL_MS; // daily-granularity history — 6 h
/* ⛑ One shared revalidation primitive, not four hand-rolled TTL checks. The
   TTL constants, the call timing and the lazy request-driven pattern are all
   unchanged — this is a refactor of WHERE the rule lives, not of WHEN we
   fetch. */
const poolsCache = createRevalidatingCache<LlamaPool[]>(POOLS_TTL_MS);
const chartCache = createRevalidatingCache<ApyPoint[]>(CHART_TTL_MS);
/** Single-entry caches key on a constant; the primitive is keyed for both shapes. */
const POOLS_KEY = 'pools';

async function fetchPools(
  fetchImpl: typeof fetch,
  timeoutMs: number
): Promise<RevalidatedEntry<LlamaPool[]>> {
  return poolsCache.revalidate(POOLS_KEY, async () => {
    const res = await fetchImpl(POOLS_URL, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`defillama /pools ${res.status}`);
    const body = (await res.json()) as { data?: LlamaPool[] };
    if (!Array.isArray(body.data)) throw new Error('defillama /pools: unexpected shape');
    return body.data;
  });
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
  /**
   * `5.407` · NO CROSS-NETWORK FALLBACK.
   *
   * This read `return [...candidates].sort(byTvl)[0]` — so when the preferred
   * network had no pool, the highest-TVL deployment on ANY network was accepted
   * because the project name matched. Founder/Strategy 2026-09-17 §3 names that
   * exactly: *"Do not silently substitute another deployment."* The caller
   * degrades to this protocol's OWN fixture (right network, `fallbackUsed`
   * stamped), which is the existing ruled treatment for an absent observation.
   *
   * ⚑ A test asserted the deleted behaviour (*"should fall back to highest TVL
   * on any chain"*) — a `5.114`-class test protecting a defect. It is inverted,
   * not removed, so the reason survives.
   */
  return null;
}

function fixtureFor(protocolId: ProtocolId): ProtocolApy {
  return { protocolId, ...FIXTURE_APYS[protocolId] };
}

/** This adapter's source identity. Declared once; never spelled at a call site. */
const SOURCE = 'defillama' as const;

export class DefiLlamaApyProvider implements IApyProvider {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs: number = PROVIDER_FETCH_TIMEOUT_MS,
    /**
     * The deployment's operational kill switch — sources disabled by
     * configuration rather than by declaration. Injected rather than read from
     * `process.env`, because this package must stay environment-free and
     * because an injected restriction is testable without mutating globals.
     */
    private readonly alsoDisabled?: ReadonlySet<string>
  ) {}

  /**
   * The eligible fallback for a subject, or `null` when nothing may stand in.
   *
   * ⚑ THE CATCH BLOCKS NO LONGER DECIDE THIS. Each one used to return the
   * fixture on its own authority; now each one ASKS. `technically eligible` is
   * the second half of the test: a declaration naming a source this adapter
   * cannot actually produce is refused rather than trusted.
   */
  private mayServeFixture(subject: Parameters<typeof fallbackFor>[0]): boolean {
    const decision = fallbackFor(subject, this.alsoDisabled);
    return decision.eligible && decision.source === 'fixture';
  }

  async getCurrentApys(protocolIds: ProtocolId[]): Promise<ProtocolApy[]> {
    /**
     * ⚑ THE KILL SWITCH, AT THE POINT OF COLLECTION. A source without
     * `NEW_COLLECTION` never reaches `fetchPools`, so no request is issued —
     * the refusal is not "the response is ignored", it is "the call is not
     * made". The sabotage case asserts the fetch COUNT at this seam, because a
     * downstream controlled-unavailable would look identical either way.
     */
    let pools: RevalidatedEntry<LlamaPool[]> | null = null;
    if (permitsUse(SOURCE, 'NEW_COLLECTION', this.alsoDisabled)) {
      try {
        pools = await fetchPools(this.fetchImpl, this.timeoutMs);
      } catch {
        pools = null;
      }
    }
    /* Decided ONCE per call, not per leg: eligibility is a property of the
       subject and the sources, never of how many protocols were asked for. */
    const fixtureMayServe = this.mayServeFixture('APY_CURRENT');
    const degrade = (protocolId: ProtocolId): ProtocolApy | null =>
      fixtureMayServe ? fixtureFor(protocolId) : null;

    if (!pools) {
      return protocolIds.map(degrade).filter((a): a is ProtocolApy => a !== null);
    }
    const asOf = new Date(pools.at).toISOString(); // when fetched, not when served
    const resolved = protocolIds.map((protocolId) => {
      const match = matchPool(pools.value, POOL_MATCHERS[protocolId]);
      if (!match) return degrade(protocolId);
      /**
       * `5.406`/`5.407` §3 · THE OBSERVATION MUST AGREE WITH PRODUCT IDENTITY.
       *
       * `chain` previously read `(match.chain as …) ?? 'Solana'`, so an absent
       * chain became a real, named network — and `ProtocolApy.chain` was never
       * compared to the leg's intended network anywhere in app code, so the
       * invariant held by luck. §3's rule: expected network + matching
       * observation may be used; a MISMATCHED or UNKNOWN network is UNAVAILABLE.
       *
       * Unavailable here means the LIVE OBSERVATION is refused and the leg falls
       * back to its own documented fixture — never another network's data.
       * Making the rate itself null is §8.5 consumer enforcement, i.e. H, which
       * sits behind F/G (`5.355`); this containment must not pull it forward.
       */
      const observed = match.chain as ProtocolApy['chain'] | undefined;
      if (!observed || observed !== CURRENT_CATALOG_PROTOCOL_NETWORK[protocolId])
        return degrade(protocolId);
      return {
        protocolId,
        apyPercent: match.apy as number,
        tvlUsd: match.tvlUsd,
        chain: observed,
        stamp: evidenceStamp({ source: SOURCE, origin: 'OBSERVED', asOf }),
      };
    });
    /* A refused leg is OMITTED, never zero-filled: an absent observation is
       what `strategyRateAvailability` already turns into NO_OBSERVATION, i.e.
       the existing controlled-unavailable path. No new Product semantics. */
    return resolved.filter((a): a is ProtocolApy => a !== null);
  }

  async getApyHistory(protocolId: ProtocolId, days: number): Promise<ProtocolApyHistory | null> {
    try {
      if (!permitsUse(SOURCE, 'NEW_COLLECTION', this.alsoDisabled)) {
        throw new Error('source may not collect');
      }
      const pools = await fetchPools(this.fetchImpl, this.timeoutMs);
      const match = matchPool(pools.value, POOL_MATCHERS[protocolId]);
      if (!match) throw new Error('no pool match');

      const entry = await chartCache.revalidate(match.pool, async () => {
        const res = await this.fetchImpl(`${CHART_URL}${match.pool}`, {
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (!res.ok) throw new Error(`defillama /chart ${res.status}`);
        const body = (await res.json()) as {
          data?: Array<{ timestamp: string; apy: number | null }>;
        };
        if (!Array.isArray(body.data)) throw new Error('defillama /chart: unexpected shape');
        return body.data
          .filter((d) => typeof d.apy === 'number')
          .map((d) => ({ date: d.timestamp.slice(0, 10), apyPercent: d.apy as number }));
      });
      return {
        protocolId,
        points: entry.value.slice(-days),
        stamp: evidenceStamp({
          source: 'defillama',
          origin: 'OBSERVED',
          asOf: new Date(entry.at).toISOString(),
        }),
      };
    } catch {
      /**
       * Honest degraded mode — but only if a fallback is ELIGIBLE.
       *
       * This block used to be unconditional: any failure produced a flat series
       * at the fixture APY. The series is still exactly that when the fixture
       * may serve; when it may not, the answer is `null` — refused — rather
       * than a synthetic series nobody cleared.
       */
      if (!this.mayServeFixture('APY_HISTORY')) return null;
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
