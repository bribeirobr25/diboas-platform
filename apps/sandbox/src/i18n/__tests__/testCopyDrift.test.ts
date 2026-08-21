import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getMessages } from '../loadMessages';

/**
 * PENDING_ALL 5.114 — a test must assert a REQUIREMENT, never its own fiction.
 *
 * Component tests hand a stub message map to `IntlProvider` instead of loading
 * the real catalog. Abbreviating a long string is legitimate when the test is
 * about STRUCTURE — `'Earnings'` reads better than the shipped sentence and the
 * assertion never looks at the words.
 *
 * It stops being legitimate the moment the test ASSERTS on that text. Then the
 * component renders the stub, `getByText(stub)` finds the stub, and the test
 * passes by construction — it proves the file agrees with itself and says
 * nothing about the product. Correcting the shipped copy cannot make it fail;
 * REGRESSING the shipped copy cannot make it fail either.
 *
 * That is not hypothetical. `GoalPauseSheet.test.tsx` inlined
 * `goalPause.alsoStop` as "...a small 0.39% fee applies)" and kept asserting it
 * long after the shipped string gained its floor ("...at least {min}"). The
 * test documented the FE-1-violating wording as the expected one — quoting the
 * exit rate without its floor understates a small exit ($0.25 on $50 is 0.5%,
 * not 0.39%), the same defect class as live-web 5.103.
 *
 * So the rule this guard enforces is narrow and precise:
 *
 *   **A stub whose text is used as an assertion target must equal the catalog.**
 *
 * Stubs that are never asserted on stay free to abbreviate.
 */
const TESTS_DIR = join(__dirname, '..', '..', 'components', '__tests__');

/** `'some.key': 'value'` — the shape of a stub entry in a test's message map. */
const STUB = /'([a-zA-Z][\w.]*\.[\w]+)':\s*\n?\s*'((?:[^'\\]|\\.)*)'/g;

/** The queries that make a string an assertion target rather than set dressing. */
const ASSERTED =
  /(?:getByText|queryByText|findByText|getAllByText|queryAllByText|toContain|toHaveTextContent)\(\s*'((?:[^'\\]|\\.)*)'/g;

const unescape = (s: string) => s.replace(/\\'/g, "'");

describe('5.114 — a test may abbreviate copy, but never ASSERT on an abbreviation', () => {
  it('should keep every asserted stub identical to the shipped string', () => {
    const catalog = getMessages('en');
    const offences: string[] = [];

    for (const file of readdirSync(TESTS_DIR).filter((f) => f.endsWith('.test.tsx'))) {
      const src = readFileSync(join(TESTS_DIR, file), 'utf8');

      const asserted = new Set<string>();
      for (const m of src.matchAll(ASSERTED)) asserted.add(unescape(m[1]));
      if (asserted.size === 0) continue;

      for (const m of src.matchAll(STUB)) {
        const [, key, raw] = m;
        const stub = unescape(raw);
        const real = catalog[key];
        if (real === undefined || real === stub) continue;
        if (!asserted.has(stub)) continue; // abbreviated but never asserted — fine
        offences.push(
          `${file} :: ${key}\n    asserts: ${stub}\n    shipped: ${real}\n` +
            `    → assert the shipped string (or stop asserting this one)`
        );
      }
    }

    expect(offences, `\n\n${offences.join('\n\n')}\n`).toEqual([]);
  });

  it('should be looking at real files (the guard itself must not go vacuous)', () => {
    // A wrong path would make the loop body unreachable and the guard above
    // would pass forever while checking nothing — the exact failure 5.114 names.
    const files = readdirSync(TESTS_DIR).filter((f) => f.endsWith('.test.tsx'));
    expect(files.length).toBeGreaterThan(10);
    expect(Object.keys(getMessages('en')).length).toBeGreaterThan(100);
  });
});
