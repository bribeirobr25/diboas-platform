/**
 * UTM-SHAPE-1 (header half) · our pages pass only the origin as the referrer (W-D1, 5.924, DR G3).
 *
 * With `strict-origin-when-cross-origin`, a full load from one of our pages to another sent the
 * whole address, query included, as `document.referrer`, which PostHog saves unmasked on the
 * device. `strict-origin` (or the stricter `no-referrer`) sends only `https://diboas.com/`. Reads
 * the REAL `next.config.js`, so a policy relaxed again fails here.
 */
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

interface HeaderRule {
  source: string;
  headers: Array<{ key: string; value: string }>;
}

const require = createRequire(import.meta.url);
const nextConfig = require(join(__dirname, '../../../next.config.js')) as {
  headers: () => Promise<HeaderRule[]>;
};

/** Policies that never pass a page's path or query, even to the same origin. */
const ORIGIN_ONLY = ['strict-origin', 'no-referrer'];

describe('UTM-SHAPE-1: Referrer-Policy passes no page address', () => {
  it('should set an origin-only Referrer-Policy on every rule that sets one, and on all pages', async () => {
    const rules = await nextConfig.headers();
    const policies = rules.flatMap((rule) =>
      rule.headers
        .filter((h) => h.key.toLowerCase() === 'referrer-policy')
        .map((h) => ({ source: rule.source, value: h.value }))
    );
    expect(policies.length).toBeGreaterThan(0);
    for (const { source, value } of policies) expect(ORIGIN_ONLY, source).toContain(value);
    expect(policies.some((p) => p.source === '/:path*' || p.source === '/(.*)')).toBe(true);
  });
});
