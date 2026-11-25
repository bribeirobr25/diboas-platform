/**
 * COOKIE-STORAGE-1 (code side) · every first-party write to the browser's storage or cookies is a
 * known, named item (market clean-up W-D1, D1, D7; spec §4, §6.1). A scan of `apps/web/src`
 * (tests and stories excluded; comments stripped) for `setItem(`, `document.cookie =` and
 * `.cookies.set(`; each call site is pinned to the names it writes. A new writer, or a writer that
 * moves to another file, fails until it is mapped here (and, in a later W-D1 group, listed in the
 * cookie policy's tables, which this map feeds).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';
import { COOKIE_CONFIG, STORAGE_PREFIX, WAITLIST_STORAGE_KEYS } from '@/config/env';

const WEB = resolve(__dirname, '../..');
const WRITE = /setItem\(|document\.cookie\s*=[^=]|\.cookies\.set\(/g;

/** Each write site (file → how many writes) and the item names it writes. */
export const STORAGE_WRITERS: Record<string, { writes: number; names: string[]; note?: string }> = {
  'src/components/CookieConsent/consentUtils.ts': {
    writes: 1,
    names: [COOKIE_CONFIG.consentLocalStorageKey],
  },
  'src/lib/security/cookies.ts': {
    writes: 2,
    names: [COOKIE_CONFIG.consentCookieName, `${COOKIE_CONFIG.consentCookieName}_js`],
  },
  'src/components/LanguageSwitcher/useLanguageSwitcher.ts': { writes: 1, names: ['NEXT_LOCALE'] },
  'src/components/Sections/MoneyJobsCalculator/MoneyJobsGate.tsx': {
    writes: 1,
    names: [WAITLIST_STORAGE_KEYS.email],
  },
  'src/hooks/useWaitlistStats.ts': {
    writes: 1,
    names: [`${STORAGE_PREFIX}-waitlist-stats`, `${STORAGE_PREFIX}-waitlist-stats-<source>`],
  },
  'src/lib/waitingList/helpers.ts': { writes: 1, names: [`${STORAGE_PREFIX}_ref`] },
  'src/lib/monitoring/storageLogDestination.ts': { writes: 1, names: ['diboas_logs'] },
  'src/lib/analytics/ga4ConsentBootstrap.ts': {
    writes: 2,
    names: [],
    note: "GA4's withdrawal: expiries only (_ga, _ga_*, _gid), never a write of a value",
  },
  'src/lib/monitoring/performanceUtils.ts': {
    writes: 1,
    names: [],
    note: 'perf-session-id: exempt, never written (its only caller runs only with a performance endpoint, and nothing sets one)',
  },
};

function scan(): Record<string, number> {
  const found: Record<string, number> = {};
  const files = execSync('git ls-files src', { cwd: WEB, encoding: 'utf8' })
    .split('\n')
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/(__tests__\/|\.test\.|\.stories\.)/.test(f));
  for (const file of files) {
    const n = (stripComments(readFileSync(join(WEB, file), 'utf8'), file).match(WRITE) ?? [])
      .length;
    if (n > 0) found[file] = n;
  }
  return found;
}

describe('COOKIE-STORAGE-1: every storage write is a mapped, named item', () => {
  it('should find exactly the mapped write sites, each as often as mapped', () => {
    const expected = Object.fromEntries(
      Object.entries(STORAGE_WRITERS).map(([f, w]) => [f, w.writes])
    );
    expect(scan()).toEqual(expected);
  });

  it('should keep a floor of writers (the scan is not vacuous)', () => {
    expect(Object.values(scan()).reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(10);
  });

  it('should name what each writer writes, or say why it writes nothing', () => {
    for (const [file, writer] of Object.entries(STORAGE_WRITERS))
      expect(writer.names.length > 0 || Boolean(writer.note), file).toBe(true);
  });

  it('should write no attribution item anywhere (the hold is memory-only)', () => {
    const names = Object.values(STORAGE_WRITERS).flatMap((w) => w.names);
    expect(names).not.toContain('diboas-utm-params');
    expect(names).not.toContain('diboas-cta-source');
  });
});
