/**
 * Rate limiting keeps no visitor IPs beyond its own window (5.937) and no two routes share a
 * counter by accident (5.939). Fifteenth audit, agent A.
 *
 * Upstash's `analytics: true` records every identifier (`<operation>:<IP>`) in hourly keys that
 * never expire; nothing in the code reads them, and the privacy policy keeps an IP for at most
 * 90 days. Every limiter must say `analytics: false` explicitly (the library default could
 * change), so the source is scanned, comments stripped (5.623).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { stripComments } from '@diboas/test-support';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const REPO = resolve(__dirname, '../../../../../..');

function sourceFiles(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .map((f) => f.replace(/\\/g, '/'))
    .filter(
      (f) => /\.(ts|tsx|mjs|js)$/.test(f) && !/(__tests__|\.test\.|node_modules|\.next)/.test(f)
    )
    .map((f) => join(dir, f));
}

/** Every `new Ratelimit({ … })` with the text of its options object. */
export function limiterOptions(code: string): string[] {
  const out: string[] = [];
  for (const m of code.matchAll(/new\s+Ratelimit\s*\(\s*\{/g)) {
    let depth = 0;
    let i = m.index! + m[0].length - 1;
    const start = i;
    for (; i < code.length; i += 1) {
      if (code[i] === '{') depth += 1;
      else if (code[i] === '}' && --depth === 0) break;
    }
    out.push(code.slice(start, i + 1));
  }
  return out;
}

const unsafe = (options: string) => !/\banalytics\s*:\s*false\b/.test(options);

describe('rate limiting stores no visitor IPs for analytics (5.937)', () => {
  const found = ['apps/web/src', 'apps/sandbox/src', 'packages']
    .flatMap((d) => sourceFiles(join(REPO, d)))
    .flatMap((file) =>
      limiterOptions(stripComments(readFileSync(file, 'utf8'))).map((o) => ({ file, o }))
    );

  it('should find the limiters (the scan is not vacuous)', () => {
    expect(found.length).toBeGreaterThanOrEqual(3);
  });

  it('should build every Upstash limiter with analytics: false', () => {
    expect(found.filter(({ o }) => unsafe(o)).map(({ file }) => file)).toEqual([]);
  });

  it.each([
    ['analytics: true', '{ redis, limiter: x, analytics: true, prefix: p }', true],
    ['analytics left out (the library default)', '{ redis, limiter: x, prefix: p }', true],
    ['analytics: false', '{ redis, limiter: x, analytics: false, prefix: p }', false],
  ])('should judge %s', (_label, options, isUnsafe) => {
    expect(unsafe(limiterOptions(`new Ratelimit(${options})`)[0])).toBe(isUnsafe);
  });
});

const checkRateLimit = vi.fn();
vi.mock('@/lib/security/rateLimiter', () => ({
  checkRateLimit: (...a: unknown[]) => checkRateLimit(...a),
  getClientIP: () => '198.51.100.1',
  createRateLimitHeaders: () => ({}),
}));

describe('each OG route has its own rate-limit counter (5.939)', () => {
  beforeEach(() => {
    checkRateLimit
      .mockReset()
      .mockResolvedValue({ success: false, limit: 1, remaining: 0, reset: 0 });
  });

  it('should key /api/og/[page] and /api/og/share apart', async () => {
    const page = await import('@/app/api/og/[page]/route');
    await page.GET(new Request('https://diboas.com/api/og/about'), {
      params: Promise.resolve({ page: 'about' }),
    });
    const share = await import('@/app/api/og/share/route');
    const { NextRequest } = await import('next/server');
    await share.GET(new NextRequest('https://diboas.com/api/og/share?type=calculator'));
    const keys = checkRateLimit.mock.calls.map((c) => c[0]);
    expect(keys).toEqual(['og-page:198.51.100.1', 'og-share:198.51.100.1']);
  });
});
