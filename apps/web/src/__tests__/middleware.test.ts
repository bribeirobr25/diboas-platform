// Why unit tests rather than a dev-server curl smoke test (B5, 2026-05-30):
// Next.js 16 / Turbopack serves prerendered routes from the full-route cache
// in dev mode (`x-nextjs-cache: HIT` + `x-nextjs-prerender: 1`), and the cached
// response is returned WITHOUT the middleware-set headers (`Content-Security-
// Policy`, `x-nonce`, `x-request-id`). Production behavior is unaffected.
// Verifying middleware-set headers via dev-server curl is unreliable as a
// result — these tests invoke the middleware function directly and assert
// on the returned `NextResponse.headers`, which is the production code path.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware, config } from '../../middleware';

// `x-request-id` continues to use crypto.randomUUID() (UUID v4) — only the
// CSP nonce switched to base64 (F4, 2026-05-29). Kept separate to avoid coupling.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// F4 (2026-05-29): CSP nonce is base64 of 16 random bytes (22 base64 chars + `==`
// padding = 24 chars total). Charset per RFC 4648 §4: `A-Za-z0-9+/=`.
const CSP_NONCE_BASE64_REGEX = /^[A-Za-z0-9+/]{22}==$/;

function makeRequest(
  path: string,
  options?: { acceptLanguage?: string; localeCookie?: string }
): NextRequest {
  const url = new URL(path, 'http://localhost:3000');
  const headers = new Headers();
  if (options?.acceptLanguage) {
    headers.set('Accept-Language', options.acceptLanguage);
  }
  if (options?.localeCookie) {
    // Cookie header must be set before NextRequest construction for cookies API to read it
    headers.set('cookie', `NEXT_LOCALE=${options.localeCookie}`);
  }
  return new NextRequest(url, { headers });
}

describe('middleware', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ── CSP nonce generation ──────────────────────────────────────────

  describe('CSP nonce generation', () => {
    it('should include a nonce in the CSP header', () => {
      const response = middleware(makeRequest('/en/about'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      // F4 (2026-05-29): nonce is base64 of 16 random bytes (24 chars incl. `==`).
      expect(csp).toMatch(/'nonce-[A-Za-z0-9+/]{22}=='/);
    });

    it('should set x-nonce response header', () => {
      const response = middleware(makeRequest('/en/about'));
      expect(response.headers.get('x-nonce')).toBeTruthy();
    });

    it('should set x-nonce as a valid base64-encoded nonce (F4: 16-byte CSP nonce per CSP Level 3 charset)', () => {
      const response = middleware(makeRequest('/en/about'));
      const nonce = response.headers.get('x-nonce')!;
      expect(nonce).toMatch(CSP_NONCE_BASE64_REGEX);
    });

    it('should set x-request-id as a valid UUID v4 (kept separate from CSP nonce per F4 design)', () => {
      const response = middleware(makeRequest('/en/about'));
      const requestId = response.headers.get('x-request-id')!;
      expect(requestId).toMatch(UUID_REGEX);
    });

    it('should NOT include unsafe-eval in production', () => {
      vi.stubEnv('NODE_ENV', 'production');
      const response = middleware(makeRequest('/en/about'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).not.toContain("'unsafe-eval'");
    });

    it('should include unsafe-eval in development', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const response = middleware(makeRequest('/en/about'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).toContain("'unsafe-eval'");
    });
  });

  // ── CSP directives ────────────────────────────────────────────────

  describe('CSP directives', () => {
    it("should include frame-ancestors 'none'", () => {
      const response = middleware(makeRequest('/en'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("should include object-src 'none'", () => {
      const response = middleware(makeRequest('/en'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).toContain("object-src 'none'");
    });

    it("should include base-uri 'self'", () => {
      const response = middleware(makeRequest('/en'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).toContain("base-uri 'self'");
    });

    // 2026-05-14 (iter-2 CC5): the analytics product API must be in the
    // connect-src allowlist so the SDK swap in iteration 5 doesn't ship with
    // a broken CSP. Staging origin only in non-prod; production CSP stays
    // minimal.
    it('should include api.diboas-analytics.com in connect-src', () => {
      const response = middleware(makeRequest('/en'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).toMatch(/connect-src[^;]*https:\/\/api\.diboas-analytics\.com/);
    });

    it('should include staging.api.diboas-analytics.com in connect-src when in dev', () => {
      // NODE_ENV is 'test' in Vitest, which evaluates `isDev = process.env.NODE_ENV !== 'production'`
      // to TRUE — same path as development. Staging origin should be present.
      const response = middleware(makeRequest('/en'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).toMatch(/connect-src[^;]*https:\/\/staging\.api\.diboas-analytics\.com/);
    });

    // Regression guard for the PostHog CSP fix (2026-06-01, corrected same day).
    // PostHog SDK loads `array.js`, `recorder.js`, `surveys.js` etc. from
    // `<region>-assets.i.posthog.com` (US: `us-assets.i.posthog.com`,
    // EU: `eu-assets.i.posthog.com`). Without this entry in `script-src`,
    // every page load on production triggers 5+ CSP violation errors and
    // the SDK falls back to a degraded mode (no feature flags, no surveys).
    //
    // The pattern MUST be `https://*.i.posthog.com` — not `*-assets.i.posthog.com`
    // (invalid per CSP 3 spec: wildcards can only replace a full subdomain label,
    // never a partial label). Browsers silently ignore invalid sources, which
    // is hard to spot in code review and easy to introduce by accident. If you
    // change this pattern, run the live site and watch the browser console for
    // "contains an invalid source" warnings before merging.
    //
    // If this test fails, do NOT just delete it — restore the allowlist
    // entry in `apps/web/middleware.ts` `scriptSrc` constant.
    it('should include *.i.posthog.com in script-src (CSP fix 2026-06-01 / PostHog assets)', () => {
      const response = middleware(makeRequest('/en'));
      const csp = response.headers.get('Content-Security-Policy') ?? '';
      expect(csp).toMatch(/script-src[^;]*https:\/\/\*\.i\.posthog\.com/);
    });
  });

  // ── Locale detection & redirect ───────────────────────────────────

  describe('locale detection & redirect', () => {
    it('should NOT redirect when locale is in path', () => {
      const response = middleware(makeRequest('/en/about'));
      expect(response.status).not.toBe(307);
      expect(response.headers.get('Location')).toBeNull();
    });

    it('should redirect /about to /en/about when locale is missing', () => {
      const response = middleware(makeRequest('/about'));
      expect(response.status).toBe(307);
      const location = response.headers.get('Location');
      expect(location).toBe('http://localhost:3000/en/about');
    });

    it('should redirect preserving search params', () => {
      const response = middleware(makeRequest('/strategies?q=1'));
      expect(response.status).toBe(307);
      const location = response.headers.get('Location');
      expect(location).toBe('http://localhost:3000/en/strategies?q=1');
    });

    it('should pass through root path / (page.tsx handles redirect)', () => {
      const response = middleware(makeRequest('/'));
      // Root "/" redirect is handled by app/page.tsx, not middleware
      expect(response.status).toBe(200);
    });

    it('should detect pt-BR locale', () => {
      const response = middleware(makeRequest('/pt-BR/about'));
      expect(response.status).not.toBe(307);
      expect(response.headers.get('Content-Language')).toBe('pt-BR');
    });

    it('should detect es locale', () => {
      const response = middleware(makeRequest('/es/about'));
      expect(response.status).not.toBe(307);
      expect(response.headers.get('Content-Language')).toBe('es');
    });

    it('should detect de locale', () => {
      const response = middleware(makeRequest('/de/about'));
      expect(response.status).not.toBe(307);
      expect(response.headers.get('Content-Language')).toBe('de');
    });
  });

  // ── Locale detection chain ────────────────────────────────────────

  describe('locale detection chain', () => {
    it('should use NEXT_LOCALE cookie when present', () => {
      const response = middleware(makeRequest('/about', { localeCookie: 'de' }));
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('http://localhost:3000/de/about');
    });

    it('should use Accept-Language when no cookie set', () => {
      const response = middleware(
        makeRequest('/about', { acceptLanguage: 'pt-BR,pt;q=0.9,en;q=0.8' })
      );
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('http://localhost:3000/pt-BR/about');
    });

    it('should match language prefix from Accept-Language (de-AT → de)', () => {
      const response = middleware(makeRequest('/about', { acceptLanguage: 'de-AT,de;q=0.9' }));
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('http://localhost:3000/de/about');
    });

    it('should match language prefix (pt → pt-BR)', () => {
      const response = middleware(makeRequest('/about', { acceptLanguage: 'pt;q=0.9' }));
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('http://localhost:3000/pt-BR/about');
    });

    it('should prefer cookie over Accept-Language', () => {
      const response = middleware(
        makeRequest('/about', {
          localeCookie: 'es',
          acceptLanguage: 'de,en;q=0.8',
        })
      );
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('http://localhost:3000/es/about');
    });

    it('should fall back to en when Accept-Language has no match', () => {
      const response = middleware(makeRequest('/about', { acceptLanguage: 'ja,zh;q=0.9' }));
      expect(response.status).toBe(307);
      expect(response.headers.get('Location')).toBe('http://localhost:3000/en/about');
    });

    it('should pass through root / even with cookie locale (page.tsx handles redirect)', () => {
      const response = middleware(makeRequest('/', { localeCookie: 'pt-BR' }));
      // Root "/" redirect is handled by app/page.tsx, not middleware
      expect(response.status).toBe(200);
    });

    it('should ignore invalid cookie locale values', () => {
      const response = middleware(makeRequest('/about', { localeCookie: 'fr' }));
      expect(response.status).toBe(307);
      // Falls through to default (no Accept-Language set)
      expect(response.headers.get('Location')).toBe('http://localhost:3000/en/about');
    });

    it('should handle Accept-Language with q-factors correctly', () => {
      const response = middleware(
        makeRequest('/about', {
          acceptLanguage: 'en-US;q=0.5,es;q=0.9,de;q=0.7',
        })
      );
      expect(response.status).toBe(307);
      // es has highest q-factor
      expect(response.headers.get('Location')).toBe('http://localhost:3000/es/about');
    });
  });

  // ── Content-Language header ───────────────────────────────────────

  describe('Content-Language header', () => {
    it('should set Content-Language when locale is in path', () => {
      const response = middleware(makeRequest('/en/about'));
      expect(response.headers.get('Content-Language')).toBe('en');
    });
  });

  // ── config.matcher ────────────────────────────────────────────────

  describe('config.matcher', () => {
    it('should export a matcher config', () => {
      expect(config).toBeDefined();
      expect(config.matcher).toBeDefined();
      expect(Array.isArray(config.matcher)).toBe(true);
      expect(config.matcher.length).toBeGreaterThan(0);
    });

    // Phase 1 fallback step 1.3.b regression guard (2026-05-30):
    // Production U4 caught the matcher redirecting `/.well-known/security.txt`
    // to `/en/.well-known/security.txt` (307), violating RFC 9116. The literal
    // `security.txt` token excludes `/security.txt` (root) only — not the
    // nested `/.well-known/security.txt`. `\.well-known/` was added to the
    // negative-lookahead alternation to prevent middleware from running on
    // any `/.well-known/*` path. This test guards against a future edit
    // silently dropping the exclusion and reintroducing the 307.
    it('should exclude /.well-known/ from middleware execution (RFC 9116 / F6)', () => {
      const pattern = String(config.matcher[0]);
      expect(pattern).toContain('\\.well-known/');
    });
  });
});
