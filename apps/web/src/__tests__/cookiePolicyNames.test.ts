import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COOKIE_CONFIG } from '@/config/env';

/**
 * ⚙ THE COOKIE POLICY NAMES THE COOKIES THE SITE REALLY SETS (register 5.794; 7th audit).
 *
 * The policy listed `dream_mode_data` and `session_id`, which nothing set, and named two real
 * cookies wrongly ('locale' for NEXT_LOCALE, 'cookie_consent' for diboas-consent). This reads the
 * first-party names in the policy's essential and functional tables and the cookies the code
 * writes, and fails either way: a name nothing sets, or a cookie the policy does not name.
 * Analytics cookies are set by third-party libraries after consent and are out of this scope.
 */

const SRC = join(__dirname, '..');
const POLICY = join(SRC, 'components', 'Legal', 'CookiePolicyContent.tsx');

/** Listed but deliberately not set: the founder's 2026-11-06 ruling keeps this entry as it is. */
const KEPT_UNSET: Record<string, string> = { theme: 'founder 2026-11-06: keep the theme entry' };

function policyNames(): string[] {
  const src = readFileSync(POLICY, 'utf8');
  const names: string[] = [];
  for (const table of ['essentialRows', 'functionalRows']) {
    const start = src.indexOf(`const ${table} = [`);
    expect(start, table).toBeGreaterThan(-1);
    const body = src.slice(start, src.indexOf('];', start));
    for (const m of body.matchAll(/\[\s*'([^']+)',/g)) names.push(m[1]);
  }
  return names;
}

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    if (e === '__tests__' || e === 'test') continue;
    const full = join(dir, e);
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.(ts|tsx)$/.test(e) && !/\.(test|stories)\.tsx?$/.test(e)) acc.push(full);
  }
  return acc;
}

/** Every first-party cookie the code writes. */
function cookiesSet(): string[] {
  const set = new Set<string>();
  for (const f of sourceFiles(SRC)) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/document\.cookie\s*=\s*[`'"]([A-Za-z0-9_-]+)=/g)) set.add(m[1]);
    if (relative(SRC, f) === join('lib', 'security', 'cookies.ts')) {
      // The consent cookie and its browser-readable copy, named from config.
      expect(text).toContain('name: CONSENT_COOKIE_NAME');
      expect(text).toContain('name: `${CONSENT_COOKIE_NAME}_js`');
      set.add(COOKIE_CONFIG.consentCookieName);
      set.add(`${COOKIE_CONFIG.consentCookieName}_js`);
    }
  }
  return [...set].sort();
}

describe('5.794 · the cookie policy names exactly the cookies the site sets', () => {
  it('should list no first-party cookie that nothing sets', () => {
    const real = new Set(cookiesSet());
    const unset = policyNames().filter((n) => !real.has(n) && !(n in KEPT_UNSET));
    expect(unset).toEqual([]);
  });

  it('should name every first-party cookie the code sets', () => {
    const named = new Set(policyNames());
    expect(cookiesSet().filter((c) => !named.has(c))).toEqual([]);
  });

  it('should have actually found the cookies (non-vacuity)', () => {
    expect(cookiesSet()).toEqual(['NEXT_LOCALE', 'diboas-consent', 'diboas-consent_js']);
    expect(policyNames().length).toBeGreaterThanOrEqual(3);
  });
});
