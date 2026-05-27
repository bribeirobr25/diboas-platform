import { describe, it, expect, vi, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware, config } from '../../middleware';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
      expect(csp).toMatch(/'nonce-[0-9a-f-]+'/i);
    });

    it('should set x-nonce response header', () => {
      const response = middleware(makeRequest('/en/about'));
      expect(response.headers.get('x-nonce')).toBeTruthy();
    });

    it('should set x-nonce as a valid UUID', () => {
      const response = middleware(makeRequest('/en/about'));
      const nonce = response.headers.get('x-nonce')!;
      expect(nonce).toMatch(UUID_REGEX);
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
  });
});
