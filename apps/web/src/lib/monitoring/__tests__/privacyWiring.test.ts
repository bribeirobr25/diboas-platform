import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { stripComments } from '@diboas/test-support';
import { describe, expect, it } from 'vitest';

/**
 * 5.862 / 5.864 (twelfth audit) — EVERY RUNTIME AND EVERY ANALYTICS DOOR SCRUBS.
 *
 * The scrubbers are tested on their own (`sentryScrub.test.ts`, `scrubUrl.test.ts`,
 * `scrubAnalyticsEvent.test.ts`); this pins that each door calls them. Until 2026-11-10 only the
 * client's Sentry scrubbed, and no door removed a `?token=` from a URL.
 */

const WEB = resolve(__dirname, '../../../..');
const read = (rel: string) => stripComments(readFileSync(join(WEB, rel), 'utf8'), rel);

/** The body of `beforeSend(event) { … }` up to the `beforeSendTransaction` that follows it. */
const beforeSendBody = (src: string): string => {
  const start = src.indexOf('beforeSend(event) {');
  const end = src.indexOf('beforeSendTransaction', start);
  return start >= 0 && end > start ? src.slice(start, end) : '';
};

describe('5.862 · every Sentry runtime scrubs errors and transactions', () => {
  it.each(['sentry.server.config.ts', 'sentry.edge.config.ts', 'src/instrumentation-client.ts'])(
    'should return only scrubbed events from %s',
    (file) => {
      const src = read(file);
      const body = beforeSendBody(src);
      expect(body, `${file}: beforeSend then beforeSendTransaction`).not.toBe('');
      expect(body).toMatch(/return scrubSentryEvent\(event\);/);
      expect(body, `${file}: an unscrubbed return`).not.toMatch(/return event\b/);
      expect(src).toMatch(/beforeSendTransaction:\s*\(event\)\s*=>\s*scrubSentryEvent\(event\)/);
    }
  );

  it('should scrub the request path the server error door puts in extra', () => {
    expect(read('src/instrumentation.ts')).toMatch(/path:\s*scrubUrl\(request\.path\)/);
  });
});

describe('5.864 · every analytics door records scrubbed addresses', () => {
  it('should give PostHog the scrubber as before_send', () => {
    expect(read('src/components/Providers/PostHogProvider.tsx')).toMatch(
      /before_send:\s*scrubAnalyticsEvent\b/
    );
  });

  it('should configure GA4 with a scrubbed page location and referrer', () => {
    const src = read('src/components/Providers/GoogleAnalyticsLoader.tsx');
    expect(src).toContain('var scrub=${SCRUB_URL_INLINE_JS}');
    expect(src).toMatch(/page_location:\s*scrub\(location\.href\)/);
    expect(src).toMatch(/page_referrer:\s*scrub\(document\.referrer\)/);
  });

  it('should set a scrubbed page location before each GA4 page view', () => {
    const src = read('src/components/Performance/PageViewTracker.tsx');
    const set = src.indexOf("gtag('set', { page_location: scrubUrl(window.location.href) })");
    expect(set).toBeGreaterThan(-1);
    expect(set).toBeLessThan(src.indexOf("gtag('event', 'page_view'"));
  });

  it('should scrub the page location and referrer the analytics service records', () => {
    const src = read('src/lib/analytics/service.ts');
    expect(src).toMatch(/page_location:[^\n]*scrubUrl\(window\.location\.href\)/);
    expect(src).toMatch(/referrer:[^\n]*scrubUrl\(document\.referrer\)/);
  });
});
