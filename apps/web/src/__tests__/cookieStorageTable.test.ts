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
import { beforeAll, describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';
import { COOKIE_CONFIG, STORAGE_PREFIX, WAITLIST_STORAGE_KEYS } from '@/config/env';

const WEB = resolve(__dirname, '../..');
const WRITE = /setItem\(|document\.cookie\s*=[^=]|\.cookies\.set\(/g;

/** Each write site (file → how many writes) and the item names it writes. */
/**
 * `keys` is the source text of each write's key, in order (the first `setItem` argument, the start
 * of a `document.cookie` assignment, a `cookies.set` call's `name:`), so a write that changes its
 * key fails here even when the count stays (W-D1 audit).
 */
export const STORAGE_WRITERS: Record<
  string,
  { writes: number; keys: string[]; names: string[]; note?: string }
> = {
  'src/components/CookieConsent/consentUtils.ts': {
    writes: 1,
    keys: ['CONSENT_KEY'],
    names: [COOKIE_CONFIG.consentLocalStorageKey],
  },
  'src/lib/security/cookies.ts': {
    writes: 2,
    keys: ['CONSENT_COOKIE_NAME', '`${CONSENT_COOKIE_NAME}_js`'],
    names: [COOKIE_CONFIG.consentCookieName, `${COOKIE_CONFIG.consentCookieName}_js`],
  },
  'src/components/LanguageSwitcher/useLanguageSwitcher.ts': {
    writes: 1,
    keys: ['`NEXT_LOCALE'],
    names: ['NEXT_LOCALE'],
  },
  'src/components/Sections/MoneyJobsCalculator/MoneyJobsGate.tsx': {
    writes: 1,
    keys: ['POSITION_STORAGE_KEYS.email'],
    names: [WAITLIST_STORAGE_KEYS.email],
  },
  'src/hooks/useWaitlistStats.ts': {
    writes: 1,
    keys: ['cacheKey'],
    names: [`${STORAGE_PREFIX}-waitlist-stats`, `${STORAGE_PREFIX}-waitlist-stats-<source>`],
  },
  'src/lib/waitingList/helpers.ts': {
    writes: 1,
    keys: ['key'],
    names: [`${STORAGE_PREFIX}_ref`],
    note: "setReferralStorage's key comes from its callers, pinned in REFERRAL_WRAPPER_CALLERS",
  },
  'src/lib/monitoring/storageLogDestination.ts': {
    writes: 1,
    keys: ["'diboas_logs'"],
    names: ['diboas_logs'],
  },
  'src/lib/analytics/ga4ConsentBootstrap.ts': {
    writes: 2,
    keys: ['name', 'name'],
    names: [],
    note: "GA4's withdrawal: expiries only (_ga, _ga_*, _gid), never a write of a value",
  },
  'src/lib/monitoring/performanceUtils.ts': {
    writes: 1,
    keys: ["'perf-session-id'"],
    names: [],
    note: 'perf-session-id: exempt, never written (its only caller runs only with a performance endpoint, and nothing sets one)',
  },
};

/** Every call of the referral wrapper (it writes whatever key it is given), with its key. */
const REFERRAL_WRAPPER_CALLERS: Record<string, string[]> = {
  'src/components/WaitingList/ReferralCapture.tsx': ['REFERRAL_CONFIG.referralCookieName'],
};

/** The key's source text of each write in one file, in order. */
function keysOf(text: string): string[] {
  const keys: string[] = [];
  for (const m of text.matchAll(WRITE)) {
    const rest = text.slice((m.index ?? 0) + m[0].length);
    if (m[0].startsWith('setItem')) keys.push(/^\s*([^,]+?)\s*,/.exec(rest)?.[1] ?? '?');
    else if (m[0].startsWith('.cookies'))
      keys.push(/name:\s*([^,\n]+?)\s*,/.exec(rest)?.[1] ?? '?');
    else keys.push(/^\s*([^=\s]+?)(?:=|\s)/.exec(m[0].slice(-1) + rest)?.[1] ?? '?');
  }
  return keys;
}

/** Scanned once per file run (a scan per test timed out under coverage). */
let scanned: Record<string, number> | undefined;
const foundKeys: Record<string, string[]> = {};
const wrapperCalls: Record<string, string[]> = {};
function scan(): Record<string, number> {
  if (scanned) return scanned;
  const found: Record<string, number> = {};
  const files = execSync('git ls-files src', { cwd: WEB, encoding: 'utf8' })
    .split('\n')
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/(__tests__\/|\.test\.|\.stories\.)/.test(f));
  for (const file of files) {
    const text = stripComments(readFileSync(join(WEB, file), 'utf8'), file);
    const n = (text.match(WRITE) ?? []).length;
    if (n > 0) {
      found[file] = n;
      foundKeys[file] = keysOf(text);
    }
    if (!file.endsWith('waitingList/helpers.ts')) {
      const calls = [...text.matchAll(/setReferralStorage\(\s*([^,]+?)\s*,/g)].map((c) => c[1]);
      if (calls.length > 0) wrapperCalls[file] = calls;
    }
  }
  scanned = found;
  return found;
}

describe('COOKIE-STORAGE-1: every storage write is a mapped, named item', () => {
  beforeAll(() => void scan(), 60_000);

  it('should find exactly the mapped write sites, each as often as mapped', () => {
    const expected = Object.fromEntries(
      Object.entries(STORAGE_WRITERS).map(([f, w]) => [f, w.writes])
    );
    expect(scan()).toEqual(expected);
  });

  it("should pin each write's key, so a changed key fails even at the same count", () => {
    scan();
    expect(foundKeys).toEqual(
      Object.fromEntries(Object.entries(STORAGE_WRITERS).map(([f, w]) => [f, w.keys]))
    );
  });

  it('should pin every caller of the referral wrapper and the key it passes', () => {
    scan();
    expect(wrapperCalls).toEqual(REFERRAL_WRAPPER_CALLERS);
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

  /** The names the cookie policy's tables list (read from the component that renders them). */
  function policyNames(): { storage: string[]; cookies: string[] } {
    const src = readFileSync(join(WEB, 'src/components/Legal/CookiePolicyContent.tsx'), 'utf8');
    const block = /const STORAGE_NAMES = \[([\s\S]*?)\];/.exec(src)?.[1] ?? '';
    const storage = [...block.matchAll(/'([^']+)'/g)].flatMap((m) => m[1].split(', '));
    const cookies = [
      ...src.matchAll(
        /^\s+'([A-Za-z_][\w.<>*-]*)',\n\s+t\('sections\.cookiesWeUse\.(?:essential|analytics)/gm
      ),
    ].map((m) => m[1]);
    return { storage, cookies };
  }
  /** Items the analytics libraries write themselves (read on production, `5.1000`). */
  const LIBRARY_ITEMS = ['ph_<project>_*', '__ph_opt_in_out_<project>'];

  it("should list every item a writer writes in the policy's tables", () => {
    const { storage, cookies } = policyNames();
    expect(storage.length).toBeGreaterThanOrEqual(7);
    for (const name of Object.values(STORAGE_WRITERS).flatMap((w) => w.names))
      expect([...storage, ...cookies], name).toContain(
        name.replace(`${STORAGE_PREFIX}-waitlist-stats-<source>`, 'diboas-waitlist-stats-<form>')
      );
  });

  it('should list no storage row that nothing writes, except the named library items', () => {
    const written = new Set(
      Object.values(STORAGE_WRITERS)
        .flatMap((w) => w.names)
        .map((n) =>
          n.replace(`${STORAGE_PREFIX}-waitlist-stats-<source>`, 'diboas-waitlist-stats-<form>')
        )
    );
    for (const name of policyNames().storage)
      expect(written.has(name) || LIBRARY_ITEMS.includes(name), name).toBe(true);
  });
});
