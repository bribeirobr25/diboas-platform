/**
 * The Polygon key never travels in a request URL (register 5.917): request logs and error
 * messages carry URLs. The provider sends it as `Authorization: Bearer …` (header auth verified
 * live 2026-11-11). Fetch stubbed; no network. Outside the weekly-gate directories.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchEtfSharesOutstanding } from '../../../../scripts/market-refresh/providers/polygon.mjs';

describe('Polygon key handling (5.917)', () => {
  const original = process.env.POLYGON_API_KEY;
  afterEach(() => {
    vi.unstubAllGlobals();
    if (original === undefined) delete process.env.POLYGON_API_KEY;
    else process.env.POLYGON_API_KEY = original;
  });

  it('should send the key in the Authorization header and never in the URL', async () => {
    process.env.POLYGON_API_KEY = 'pk-stand-in';
    const calls: Array<{ url: string; headers: Record<string, string> }> = [];
    vi.stubGlobal('fetch', async (url: string, init: { headers?: Record<string, string> }) => {
      calls.push({ url, headers: init?.headers ?? {} });
      return new Response(JSON.stringify({ results: { share_class_shares_outstanding: 1 } }), {
        status: 200,
      });
    });
    const out = await fetchEtfSharesOutstanding(['IBIT']);
    expect((out.funds as Record<string, { shares: number | null }>).IBIT?.shares).toBe(1);
    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe('https://api.polygon.io/v3/reference/tickers/IBIT');
    expect(calls[0]!.url).not.toContain('pk-stand-in');
    expect(calls[0]!.headers.Authorization).toBe('Bearer pk-stand-in');
  });
});
