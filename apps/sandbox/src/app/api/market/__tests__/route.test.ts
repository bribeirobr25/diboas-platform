import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * `/api/market` — the Product response is UNCHANGED by F-A.
 *
 * The requirement F-A rests on: evidence persistence is scheduled with
 * `after()`, so the response is composed and returned before ingestion starts,
 * and nothing rendered reads persisted evidence. A test that only asserted
 * "ingestion was called" would not prove that; these compare the response
 * BYTES with ingestion enabled and disabled, and check that the route never
 * awaits the ingestion promise.
 */
const hoisted = vi.hoisted(() => ({
  afterCallbacks: [] as Array<() => unknown>,
  ingestCalls: 0,
  ingestResolve: null as null | (() => void),
}));

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return {
    ...actual,
    after: (cb: () => unknown) => {
      hoisted.afterCallbacks.push(cb);
    },
  };
});

vi.mock('@/lib/evidence/ingest', () => ({
  ingestNetworkCosts: async () => {
    hoisted.ingestCalls += 1;
    /* Never settles until released: if the route awaited it, the request would
       hang and the test would time out rather than pass quietly. */
    await new Promise<void>((resolve) => {
      hoisted.ingestResolve = resolve;
    });
    return [];
  },
}));

const request = (currency?: string) =>
  new NextRequest(new URL(`http://localhost/api/market${currency ? `?currency=${currency}` : ''}`));

describe('GET /api/market — unchanged by evidence persistence', () => {
  beforeEach(() => {
    hoisted.afterCallbacks = [];
    hoisted.ingestCalls = 0;
    hoisted.ingestResolve = null;
  });
  afterEach(() => {
    hoisted.ingestResolve?.();
  });

  it('should answer 200 with the documented shape and the market cache header', async () => {
    const { GET } = await import('../route');
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=300, stale-while-revalidate=3600'
    );
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual([
      'apys',
      'currency',
      'gas',
      'usdPriceLocal',
      'usdPriceStamp',
    ]);
  });

  it('should return the response WITHOUT awaiting ingestion', async () => {
    const { GET } = await import('../route');
    /* The mocked ingestion never settles. Reaching this line at all is the
       proof: an awaited ingestion would hang here. */
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(hoisted.afterCallbacks).toHaveLength(1);
    expect(hoisted.ingestCalls).toBe(0);
  });

  it('should produce IDENTICAL bytes whether or not the scheduled work runs', async () => {
    const { GET } = await import('../route');
    const withoutIngestion = await (await GET(request('EUR'))).text();
    /* Now run what `after()` captured, exactly as the platform would. */
    const ran = hoisted.afterCallbacks.pop();
    void ran?.();
    expect(hoisted.ingestCalls).toBe(1);
    const withIngestion = await (await GET(request('EUR'))).text();
    expect(withIngestion).toBe(withoutIngestion);
  });

  it('should schedule ingestion for the chains it already quotes', async () => {
    const { GET } = await import('../route');
    const response = await GET(request());
    const body = (await response.json()) as { gas: Array<{ chain: string }> };
    expect(body.gas.map((g) => g.chain).sort()).toEqual(['Arbitrum', 'Solana']);
    expect(hoisted.afterCallbacks).toHaveLength(1);
  });
});
