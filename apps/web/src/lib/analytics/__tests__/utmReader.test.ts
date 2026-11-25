/**
 * UTM-READER-1 · campaign values have one reader and the shaped option has named sites (market
 * clean-up W-D1, registers 5.923, 5.924; spec §3.1, §3.10). A source scan of `apps/web/src`
 * (tests and stories excluded; comments stripped through `@diboas/test-support`, so a key named in
 * a comment counts for nothing).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';

const WEB = resolve(__dirname, '../../../..');
const sources = (): Array<{ file: string; text: string }> =>
  execSync('git ls-files src', { cwd: WEB, encoding: 'utf8' })
    .split('\n')
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/(__tests__\/|\.test\.|\.stories\.)/.test(f))
    .map((file) => ({ file, text: stripComments(readFileSync(join(WEB, file), 'utf8'), file) }));

const count = (text: string, pattern: RegExp) => (text.match(pattern) ?? []).length;

/** Files that may name a campaign key or prefix: the shape, the hold's server check, the generators. */
const UTM_ALLOWED = [
  'src/lib/analytics/utmShape.ts',
  'src/lib/api/validators.ts',
  'src/lib/waitingList/constants.ts',
  'src/lib/share/utm.ts',
  'src/app/[locale]/(landing)/email-preferences/page.tsx',
];

/** The shaped scrubber's call sites, by count (spec §3.10). */
const SHAPED_SITES: Record<string, number> = {
  'src/components/Performance/PageViewTracker.tsx': 1,
  'src/lib/analytics/scrubAnalyticsEvent.ts': 1,
  'src/hooks/useUtmCapture.ts': 1,
};

describe('UTM-READER-1: one reader for campaign values', () => {
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
    expect(named[0].text).not.toMatch(/export const HOLD/);
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
