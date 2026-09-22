import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRevalidatingCache } from '../providers/revalidatingCache';

/**
 * The shared revalidation primitive.
 *
 * ⚑ THESE TESTS TARGET THE PRIMITIVE DIRECTLY, and that is deliberate. `5.438`
 * recorded the dominant failure mode in this codebase's guards: a test passes
 * because a DOWNSTREAM gate produces the same observable result. Asserting the
 * cache only through a provider would do exactly that — the provider's fixture
 * fallback returns a plausible value whether or not revalidation works, so a
 * broken primitive would still render a strategy card. Every assertion below
 * counts FETCH CALLS at the seam that owns the behaviour.
 */

const TTL = 6 * 60 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-22T00:00:00.000Z'));
});
afterEach(() => vi.useRealTimers());

describe('revalidation cadence — counted at the seam, never inferred', () => {
  it('should NOT refetch inside the TTL', async () => {
    const fetch = vi.fn(async () => 'v1');
    const cache = createRevalidatingCache<string>(TTL);
    await cache.revalidate('k', fetch);
    vi.setSystemTime(new Date(Date.now() + TTL - 1));
    const second = await cache.revalidate('k', fetch);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(second.value).toBe('v1');
  });

  it('should revalidate AT the TTL boundary, not one tick later', async () => {
    /* The existing providers used `>= TTL` to revalidate and `< TTL` to reuse;
       the boundary is preserved exactly, in both directions. */
    const fetch = vi.fn(async () => 'v');
    const cache = createRevalidatingCache<string>(TTL);
    await cache.revalidate('k', fetch);
    vi.setSystemTime(new Date(Date.now() + TTL));
    await cache.revalidate('k', fetch);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should stamp the RETRIEVAL moment when the fetch resolved', async () => {
    /* Data Vintage P-4: a serve-time stamp once made three requests seconds
       apart report three different `asOf` values for one cached payload. */
    const cache = createRevalidatingCache<string>(TTL);
    const entry = await cache.revalidate('k', async () => 'v');
    expect(entry.at).toBe(Date.parse('2026-09-22T00:00:00.000Z'));
    vi.setSystemTime(new Date(Date.now() + 1000));
    const served = await cache.revalidate('k', async () => 'v');
    expect(served.at, 'serving must not re-stamp').toBe(entry.at);
  });

  it('should keep keys independent', async () => {
    const fetch = vi.fn(async () => 'v');
    const cache = createRevalidatingCache<string>(TTL);
    await cache.revalidate('a', fetch);
    await cache.revalidate('b', fetch);
    await cache.revalidate('a', fetch);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('failure semantics — never fabricate', () => {
  it('should propagate the failure and cache nothing', async () => {
    const cache = createRevalidatingCache<string>(TTL);
    await expect(
      cache.revalidate('k', async () => {
        throw new Error('provider down');
      })
    ).rejects.toThrow('provider down');
    /* Nothing cached: the next call really does try again. */
    const ok = vi.fn(async () => 'v');
    expect((await cache.revalidate('k', ok)).value).toBe('v');
    expect(ok).toHaveBeenCalledTimes(1);
  });

  it('should leave a PREVIOUSLY cached entry untouched when a later fetch fails', async () => {
    /* The provider's own fallback path stays authoritative; the primitive must
       not destroy what it already held on the way to failing. */
    const cache = createRevalidatingCache<string>(TTL);
    await cache.revalidate('k', async () => 'good');
    vi.setSystemTime(new Date(Date.now() + TTL));
    await expect(
      cache.revalidate('k', async () => {
        throw new Error('down');
      })
    ).rejects.toThrow();
    vi.setSystemTime(new Date(Date.now() + 1));
    const after = await cache.revalidate('k', async () => 'recovered');
    expect(after.value).toBe('recovered');
  });

  it('should not turn a rejection into a permanent cached failure', async () => {
    const cache = createRevalidatingCache<string>(TTL);
    await expect(
      cache.revalidate('k', async () => {
        throw new Error('a');
      })
    ).rejects.toThrow('a');
    await expect(
      cache.revalidate('k', async () => {
        throw new Error('b');
      })
    ).rejects.toThrow('b');
  });
});

describe('single-flight — a reduction in provider calls, never an increase', () => {
  it('should collapse concurrent callers past the TTL into ONE fetch', async () => {
    let resolve!: (v: string) => void;
    const fetch = vi.fn(
      () =>
        new Promise<string>((r) => {
          resolve = r;
        })
    );
    const cache = createRevalidatingCache<string>(TTL);
    const a = cache.revalidate('k', fetch);
    const b = cache.revalidate('k', fetch);
    const c = cache.revalidate('k', fetch);
    resolve('v');
    const results = await Promise.all([a, b, c]);
    expect(fetch, 'three concurrent callers must not become three requests').toHaveBeenCalledTimes(
      1
    );
    expect(results.map((r) => r.value)).toEqual(['v', 'v', 'v']);
    expect(new Set(results.map((r) => r.at)).size, 'one fetch, one retrieval moment').toBe(1);
  });

  it('should let concurrent callers all see a shared failure, then retry cleanly', async () => {
    let reject!: (e: Error) => void;
    const fetch = vi.fn(
      () =>
        new Promise<string>((_, rj) => {
          reject = rj;
        })
    );
    const cache = createRevalidatingCache<string>(TTL);
    const a = cache.revalidate('k', fetch);
    const b = cache.revalidate('k', fetch);
    reject(new Error('down'));
    await expect(a).rejects.toThrow('down');
    await expect(b).rejects.toThrow('down');
    expect(fetch).toHaveBeenCalledTimes(1);
    const ok = vi.fn(async () => 'v');
    expect((await cache.revalidate('k', ok)).value).toBe('v');
  });
});

describe('provider-agnostic by construction', () => {
  it('should give provider A and provider B identical lifecycle semantics', async () => {
    /* Same primitive, two unrelated payload shapes: the behaviour must not
       differ, which is what makes the canon's "old adapter -> new adapter"
       replacement rule true. */
    const shapes = [
      { name: 'A', value: [{ pool: 'x', apy: 1 }] },
      { name: 'B', value: { usdc: { usd: 1 } } },
    ] as const;
    for (const shape of shapes) {
      const fetch = vi.fn(async () => shape.value);
      const cache = createRevalidatingCache<unknown>(TTL);
      await cache.revalidate('k', fetch);
      vi.setSystemTime(new Date(Date.now() + TTL - 1));
      await cache.revalidate('k', fetch);
      expect(fetch, `${shape.name} reused inside TTL`).toHaveBeenCalledTimes(1);
      vi.setSystemTime(new Date(Date.now() + 1));
      await cache.revalidate('k', fetch);
      expect(fetch, `${shape.name} revalidated at TTL`).toHaveBeenCalledTimes(2);
    }
  });

  it('should name no provider, evidence class, chain or payload field', async () => {
    const src = (await import('node:fs'))
      .readFileSync(new URL('../providers/revalidatingCache.ts', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const forbidden of [
      'defillama',
      'coingecko',
      'chainstack',
      'apy',
      'price',
      'usd',
      'fx',
      'arbitrum',
      'solana',
      'pool',
      'protocol',
    ]) {
      expect(
        src.toLowerCase(),
        `${forbidden} would couple the primitive to a source`
      ).not.toContain(forbidden);
    }
  });

  it('should hold no freshness policy — cadence is not a freshness threshold', async () => {
    const src = (await import('node:fs'))
      .readFileSync(new URL('../providers/revalidatingCache.ts', import.meta.url), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const forbidden of [
      'CURRENT',
      'DELAYED',
      'STALE',
      'MISSING',
      'dataFreshness',
      'observedAt',
    ]) {
      expect(src, `${forbidden} belongs to Stage H, not to a revalidation cache`).not.toContain(
        forbidden
      );
    }
  });
});
