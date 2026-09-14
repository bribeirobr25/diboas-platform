import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `public/robots.txt` — the second half of register `5.212`.
 *
 * REQUIREMENT: `app.diboas.com` is PUBLIC but must never be indexed (play
 * money). Before this file, `/robots.txt` fell through to the `[locale]` route
 * and answered a 7.7 KB HTML error page under a 404 — measured in production
 * (`x-matched-path: /[locale]`), not inferred.
 *
 * Guarded here because a static asset has no other enforcement: nothing
 * type-checks it, no component imports it, and `screen-check` never opens it.
 * An unguarded file is the "built, working, referenced by nothing" shape this
 * suite exists to refuse.
 */
const ROBOTS = readFileSync(join(process.cwd(), 'public/robots.txt'), 'utf8');

/**
 * The DIRECTIVES only — comments stripped.
 *
 * Asserting against the raw text is what the first draft of this file did, and
 * it failed immediately: the comment explaining why there is no sitemap
 * contains the word "sitemap". A robots.txt requirement is always about the
 * directives a crawler obeys, never about the prose around them, and a guard
 * that cannot tell those apart would also break the next time someone writes a
 * comment mentioning `Allow:`.
 */
const DIRECTIVES = ROBOTS.split('\n')
  .map((l) => l.trim())
  .filter((l) => l.length > 0 && !l.startsWith('#'));

describe('robots.txt refuses the whole host (5.212)', () => {
  it('should disallow every path for every agent', () => {
    expect(DIRECTIVES).toContain('User-agent: *');
    expect(DIRECTIVES).toContain('Disallow: /');
  });

  it('should NOT be the marketing site policy, which ALLOWS crawling', () => {
    // apps/web/public/robots.txt shapes crawling (Disallow: /api/, Allow:
    // /_next/static/). Copying it here would invite indexing of a play-money
    // app. The distinction is the point of the file.
    expect(DIRECTIVES.filter((d) => /^Allow:/i.test(d))).toEqual([]);
    expect(DIRECTIVES.filter((d) => /^Disallow: \/api\/$/i.test(d))).toEqual([]);
  });

  it('should advertise NO sitemap, because the sandbox publishes none', () => {
    // Naming a sitemap that does not exist is the class of untruth the audit
    // gates exist to catch.
    expect(DIRECTIVES.filter((d) => /^sitemap:/i.test(d))).toEqual([]);
  });

  it('should not carry an Allow line that would reopen what Disallow closes', () => {
    expect(DIRECTIVES.filter((d) => /^Allow: \/\s*$/i.test(d))).toEqual([]);
  });
});
