import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MARKET_CACHE_CONTROL, MARKET_ERROR_CACHE_CONTROL } from '../marketCacheHeaders';

/**
 * The two market routes are PUBLICLY reachable (SANDBOX_PUBLIC_ACCESS, founder
 * 2026-08-22) and proxy a metered free-tier feed. The CDN in front of them is
 * the quota protection, so the policy is guarded rather than trusted to survive
 * the next edit.
 */
const ROUTES = ['route.ts', join('history', 'route.ts')].map((r) =>
  join(__dirname, '..', '..', 'app', 'api', 'market', r)
);

describe('market route cache policy', () => {
  it('should let a shared cache hold success responses', () => {
    // `public` is what allows the CDN to serve it at all; without it the header
    // is decoration and every request still reaches a function.
    expect(MARKET_CACHE_CONTROL).toMatch(/\bpublic\b/);
    expect(MARKET_CACHE_CONTROL).toMatch(/s-maxage=\d+/);
  });

  it('should keep browsers from pinning a stale rate in an open tab', () => {
    // Without an explicit max-age=0 a browser may cache heuristically — an
    // honest market surface must not show a rate the server no longer believes.
    expect(MARKET_CACHE_CONTROL).toMatch(/(^|,\s*)max-age=0(,|$)/);
  });

  it('should never let a shared cache hold a failure', () => {
    // A cached 503 turns a momentary provider blip into a multi-minute outage
    // for everyone behind that edge.
    expect(MARKET_ERROR_CACHE_CONTROL).toBe('no-store');
    expect(MARKET_ERROR_CACHE_CONTROL).not.toMatch(/s-maxage/);
  });

  it.each(ROUTES)('should apply both policies in %s', (file) => {
    const src = readFileSync(file, 'utf8');
    // The success path must use the shared constant, not a re-inlined header —
    // both routes drifting apart is how one of them quietly goes back to
    // no-store and starts burning the quota again.
    expect(src).toContain('MARKET_CACHE_CONTROL');
    expect(src).toContain('MARKET_ERROR_CACHE_CONTROL');
    expect(src).not.toMatch(/'Cache-Control':\s*'no-store'/);
  });
});
