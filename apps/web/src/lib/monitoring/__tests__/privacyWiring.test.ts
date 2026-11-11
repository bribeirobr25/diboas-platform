import { readdirSync, readFileSync } from 'node:fs';
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

  /* Fourteenth audit: the server SDK attached request bodies (deletion and unsubscribe tokens) to
   * errors and sampled transactions by default. */
  it('should capture no incoming request body on the server', () => {
    expect(read('sentry.server.config.ts')).toMatch(
      /Sentry\.httpIntegration\(\{\s*maxIncomingRequestBodySize:\s*'none'\s*\}\)/
    );
  });

  it('should scrub the URL the CSRF warning logs', () => {
    expect(read('src/lib/security/csrf.ts')).toMatch(/url:\s*scrubUrl\(request\.url\)/);
  });

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

  /* Thirteenth audit: a page_location given to `config` outranks every later `set`, so each
   * route change reported the landing page. The scrubbed location is SET before config. */
  it('should set a scrubbed page location and referrer BEFORE configuring GA4, inside a function', () => {
    const src = read('src/components/Providers/GoogleAnalyticsLoader.tsx');
    expect(src).toContain('(function(){var scrub=${SCRUB_URL_INLINE_JS};');
    const set = src.indexOf(
      "gtag('set', { page_location: scrub(location.href), page_referrer: scrub(document.referrer) });"
    );
    const config = src.indexOf("gtag('config', '${measurementId}');");
    expect(set).toBeGreaterThan(-1);
    expect(config).toBeGreaterThan(set);
    expect(src).not.toMatch(/gtag\('config',[^)]*page_location/);
  });

  it('should mask token parameters at the PostHog source and evaluate no feature flag', () => {
    const src = read('src/components/Providers/PostHogProvider.tsx');
    expect(src).toMatch(/mask_personal_data_properties:\s*true/);
    expect(src).toMatch(/custom_personal_data_properties:\s*\[[^\]]*'t'[^\]]*'token'/);
    expect(src).toMatch(/advanced_disable_feature_flags:\s*true/);
  });

  /* Fourteenth audit: session recordings keep page TEXT, which before_send never sees, and the
   * waitlist success view prints the visitor's email. */
  it('should mask all text and inputs and record no network data or console lines in PostHog sessions', () => {
    const src = read('src/components/Providers/PostHogProvider.tsx');
    const recording = /session_recording:\s*\{([^}]*)\}/.exec(src)?.[1] ?? '';
    expect(recording, 'session_recording options').not.toBe('');
    expect(recording).toMatch(/maskAllInputs:\s*true/);
    expect(recording).toMatch(/maskTextSelector:\s*'\*'/);
    expect(recording).toMatch(/recordHeaders:\s*false/);
    expect(recording).toMatch(/recordBody:\s*false/);
    expect(src).toMatch(/enable_recording_console_log:\s*false/);
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

/**
 * Thirteenth audit: a new raw door (`page_location: window.location.href` in the web-vitals
 * sender) passed every test. Any READ of the page address or referrer anywhere in web source
 * must sit inside a scrubber call on the same line; an assignment (navigation) is not a read.
 */
describe('5.864 · no source reads the page address without scrubbing it', () => {
  const SRC = join(WEB, 'src');
  const READ = /(?:location\.href(?!\s*=[^=])|document\.referrer)/;
  const SCRUBBED = /\b(?:scrubUrl|scrub)\([^)]*(?:location\.href|document\.referrer)/;
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
      const p = join(dir, d.name);
      if (d.isDirectory()) return d.name === '__tests__' ? [] : walk(p);
      return /\.(ts|tsx)$/.test(d.name) && !/\.(test|stories)\./.test(d.name) ? [p] : [];
    });

  it('should find every read wrapped in a scrubber', () => {
    const raw = walk(SRC).flatMap((f) => {
      const text = readFileSync(f, 'utf8');
      if (!READ.test(text)) return [];
      return stripComments(text, f)
        .split('\n')
        .map((line, i) => ({ line, at: `${f.slice(WEB.length + 1)}:${i + 1}` }))
        .filter(({ line }) => READ.test(line) && !SCRUBBED.test(line))
        .map(({ at }) => at);
    });
    expect(raw).toEqual([]);
  });

  it('should tell a read from a navigation and a scrubbed read (detector self-test)', () => {
    expect(READ.test('page_location: window.location.href,')).toBe(true);
    expect(READ.test("window.location.href = '/'")).toBe(false);
    expect(READ.test('if (location.href === x)')).toBe(true);
    expect(SCRUBBED.test('url: scrubUrl(window.location.href),')).toBe(true);
    expect(SCRUBBED.test('url: window.location.href,')).toBe(false);
  });
});
