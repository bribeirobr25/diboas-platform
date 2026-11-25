/**
 * UTM-READER-1 · campaign values have one reader and the shaped option has named sites (market
 * clean-up W-D1, registers 5.923, 5.924; spec §3.1, §3.10). A source scan of `apps/web/src`
 * (tests and stories excluded; comments stripped through `@diboas/test-support`, so a key named in
 * a comment counts for nothing).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';

const WEB = resolve(__dirname, '../../../..');
/** Read once per file run (a scan per test timed out under coverage). */
let cached: Array<{ file: string; text: string }> | undefined;
const sources = (): Array<{ file: string; text: string }> =>
  (cached ??= execSync('git ls-files src', { cwd: WEB, encoding: 'utf8' })
    .split('\n')
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/(__tests__\/|\.test\.|\.stories\.)/.test(f))
    .map((file) => ({ file, text: stripComments(readFileSync(join(WEB, file), 'utf8'), file) })));

const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;

/** Files that may name a campaign key or prefix: the shape, the hold's server check, the generators. */
const UTM_ALLOWED = [
  'src/lib/analytics/utmShape.ts',
  'src/lib/api/validators.ts',
  'src/lib/waitingList/constants.ts',
  'src/lib/share/utm.ts',
  'src/app/[locale]/(landing)/email-preferences/page.tsx',
];

/** The only modules that use the campaign keys or the raw reader (the one reader rule). */
const READER_USERS = [
  'src/lib/analytics/posthogInitOptions.ts',
  'src/lib/analytics/posthogLegacySessionCleanup.ts',
  'src/lib/analytics/utmAttribution.ts',
  'src/lib/analytics/utmShape.ts',
  'src/lib/utils/scrubUrl.ts',
];

/** The shaped scrubber's call sites, by count (spec §3.10). */
const SHAPED_SITES: Record<string, number> = {
  'src/components/Performance/PageViewTracker.tsx': 1,
  'src/lib/analytics/scrubAnalyticsEvent.ts': 1,
  'src/hooks/useUtmCapture.ts': 1,
  // the session-recording mask (W-D1, spec §3.7)
  'src/lib/analytics/posthogInitOptions.ts': 1,
};

describe('UTM-READER-1: one reader for campaign values', () => {
  // the scan runs once, with its own budget (slow under a full coverage run)
  beforeAll(() => void sources(), 60_000);

  it('should name a campaign key or prefix only in the allow-listed files', () => {
    const outside = sources()
      .filter(({ text }) => /utm_/.test(text))
      .map(({ file }) => file)
      .filter((file) => !UTM_ALLOWED.includes(file));
    expect(outside).toEqual([]);
  });

  it('should name the two legacy storage keys only in the hold, for their removal', () => {
    const named = sources().filter(({ text }) => /diboas-utm-params|diboas-cta-source/.test(text));
    expect(named.map(({ file }) => file)).toEqual(['src/lib/analytics/utmAttribution.ts']);
    const hold = named[0].text;
    expect(hold).not.toMatch(/setItem|document\.cookie|localStorage/);
  });

  it('should keep the hold private to its module', () => {
    const named = sources().filter(({ text }) => /diboas\.attributionHold/.test(text));
    expect(named.map(({ file }) => file)).toEqual(['src/lib/analytics/utmAttribution.ts']);
    // no export of the hold's symbol in any form (`export const`, `export {`, a default export)
    expect(named[0].text).not.toMatch(
      /export\s+(?:const|let|var)\s+HOLD\b|export\s*\{[^}]*\bHOLD\b|export\s+default\s+HOLD\b/
    );
  });

  it('should use the campaign keys or the raw reader only in the named modules', () => {
    const users = sources()
      .filter(({ text }) =>
        /\b(?:UTM_KEYS|readUtmParams|readRawQueryValues|rawQueryPieces)\b/.test(text)
      )
      .map(({ file }) => file)
      .sort();
    expect(users).toEqual(READER_USERS);
  });

  it('should read the query string only through the shared readers', () => {
    // a module reading `location.search` with URLSearchParams would be a second reader; the two
    // that do read only the invite code (`ref`), never a campaign name (the test above)
    const readers = sources()
      .filter(({ text }) => /new URLSearchParams\(\s*(?:window\.)?location\.search/.test(text))
      .map(({ file }) => file)
      .sort();
    expect(readers).toEqual([
      'src/components/WaitingList/ReferralCapture.tsx',
      'src/components/WaitingList/hooks/useWaitlistForm.ts',
    ]);
  });

  it('should ask for the shaped scrubber only at its named sites, as often as listed', () => {
    const found: Record<string, number> = {};
    for (const { file, text } of sources()) {
      const n = count(text, /campaign: 'shaped'/g);
      if (n > 0) found[file] = n;
    }
    expect(found).toEqual(SHAPED_SITES);
  });

  it("should run GA4's shaped inline copy in its loader only, once (the import excluded)", () => {
    const uses: Record<string, number> = {};
    for (const { file, text } of sources()) {
      const lines = text.split('\n').filter((l) => !/^\s*import\b/.test(l));
      const n = count(lines.join('\n'), /SCRUB_URL_INLINE_JS_SHAPED/g);
      if (n > 0 && file !== 'src/lib/utils/scrubUrl.ts') uses[file] = n;
    }
    expect(uses).toEqual({ 'src/components/Providers/GoogleAnalyticsLoader.tsx': 1 });
  });
});
