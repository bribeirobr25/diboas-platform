/**
 * THE SHARED REVALIDATION PRIMITIVE — one implementation of "is this value
 * still fresh enough to reuse, and if not, fetch it once".
 *
 * Practice Market Data & Provider-Agnostic Evidence Architecture canon
 * (2026-09-22) forbids Engineering from *"duplicat[ing] refresh infrastructure
 * unnecessarily"*. Four hand-rolled caches implemented the identical
 * `Date.now() - entry.at < TTL` check across two provider files, with two
 * separate `CacheEntry` type declarations:
 *
 * ```text
 * defillama.ts   poolsCache   chartCache
 * coingecko.ts   priceCache   historyCache
 * ```
 *
 * One rule, four copies. This is the one.
 *
 * ⚑ THIS IS A REVALIDATION PRIMITIVE, NOT A FRESHNESS POLICY. It answers
 * "should I call the source again?" — an operational question about retrieval
 * cadence. Whether the resulting datum may answer a CURRENT-FACING question is
 * Stage H's, decided from the stamp against a source/class-aware policy, and
 * nothing here may be mistaken for it. The canon states the separation
 * directly: `REFRESH CADENCE != FRESHNESS THRESHOLD`.
 *
 * ⚑ IT KNOWS NO PROVIDER. No DeFiLlama, no CoinGecko, no APY, price, FX or
 * chain, and no vendor payload shape — it holds an opaque `T` and one number.
 * Adapters keep sole responsibility for retrieval and normalization, which is
 * what makes the canon's §7 replacement rule ("old adapter -> new adapter")
 * true rather than aspirational.
 *
 * ⚑ IT NEVER TOUCHES OBSERVATION TIME. The `at` it records is the RETRIEVAL
 * moment and nothing else. `observedAt` is source truth and is not this
 * module's to invent, move or overwrite — canon §5: *"a scheduled refresh must
 * never manufacture freshness"*, which applies equally to a lazy one.
 *
 * ⚑ NOT A SCHEDULER. Revalidation still happens only when a caller asks. This
 * slice deliberately preserves the request-driven pattern: moving to scheduled
 * polling changes the ACCESS PATTERN against third-party providers, which is a
 * rights question under `LC-LIC-01` and is not Engineering's to decide.
 */

/** A retrieved value and the moment it was retrieved. Never an observation time. */
export interface RevalidatedEntry<T> {
  /** RETRIEVAL moment, epoch ms — when we fetched, never when we served. */
  at: number;
  value: T;
}

export interface RevalidatingCache<T> {
  /**
   * The cached value for `key`, revalidating through `fetch` when it has aged
   * past the TTL.
   *
   * A rejected `fetch` propagates to the caller and leaves any previously
   * cached entry untouched: the primitive never fabricates a value and never
   * decides what a failure means. The provider's own fallback path stays
   * authoritative, which is what keeps `MISSING != 0` a property of the
   * adapter layer rather than something this module could quietly break.
   */
  revalidate(key: string, fetch: () => Promise<T>): Promise<RevalidatedEntry<T>>;
}

/**
 * Create a cache that revalidates entries older than `ttlMs`.
 *
 * ⚑ SINGLE-FLIGHT, and why it is safe to include here.
 *
 * Today two concurrent callers arriving past the TTL both see a stale entry and
 * both fetch — the read and the write are not atomic across an `await`. This
 * collapses them: the first caller's promise is shared, and the rest await it.
 *
 * That is a REDUCTION in provider requests and never an increase, so it cannot
 * move any cadence or rate-limit boundary in the direction Legal would need to
 * clear. It is also continuous with the existing design intent rather than new:
 * the CoinGecko adapter records that three uncached calls in quick succession
 * returned HTTP 429 on the free tier, and that *"at visitor scale the cache IS
 * the rate-limit strategy"*. Externally, callers still observe a value and its
 * retrieval moment; they simply stop occasionally observing two fetches where
 * one would do.
 *
 * A rejected in-flight promise is cleared rather than retained, so a failure
 * never becomes a cached failure that starves later callers of a retry.
 */
export function createRevalidatingCache<T>(ttlMs: number): RevalidatingCache<T> {
  const entries = new Map<string, RevalidatedEntry<T>>();
  const inFlight = new Map<string, Promise<RevalidatedEntry<T>>>();

  return {
    async revalidate(key, fetch) {
      const cached = entries.get(key);
      if (cached && Date.now() - cached.at < ttlMs) return cached;

      const existing = inFlight.get(key);
      if (existing) return existing;

      const pending = (async () => {
        const value = await fetch();
        /* The retrieval moment is stamped HERE, when the fetch resolved — not
           when the caller asked and not when the value is later served. The
           providers learned this the hard way: a serve-time stamp made three
           requests seconds apart report three different `asOf` values for one
           cached payload (Data Vintage P-4). */
        const entry: RevalidatedEntry<T> = { at: Date.now(), value };
        entries.set(key, entry);
        return entry;
      })();

      inFlight.set(key, pending);
      try {
        return await pending;
      } finally {
        /* Cleared on BOTH paths: a retained rejection would make one failed
           fetch permanent for every later caller. */
        inFlight.delete(key);
      }
    },
  };
}
