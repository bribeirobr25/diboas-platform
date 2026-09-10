import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPracticeAccountsEnabled } from '@/lib/capabilities';

/**
 * `5.201` + `5.202` — the two scaffold surfaces that made operational claims,
 * and the guard that keeps them shut.
 *
 * Both were live, reachable (200) and linked from Profile:
 *
 * - `/handle-claim` told the user their handle "is available" (from FORMAT
 *   alone — no namespace exists), was "permanent and cannot be changed"
 *   (nothing is stored), "will be part of your public link" (no public link)
 *   and that "your public page stays private until you switch it on" (no page,
 *   no switch) — behind a button that only navigated.
 * - `/practice-record` wired a Toggle labelled "Show milestones on your public
 *   page" to `useState` alone. Sharper, because it reads as a PRIVACY control.
 *
 * P01 §6.2 `P01-IA-03` states the rule this test enforces: **"A visible
 * affordance is a claim. If it cannot persist, secure, export, delete, claim,
 * or operate as implied, it should be hidden, disabled with truthful
 * explanation, or completed."**
 *
 * The capabilities are PRESERVED, not deleted (P-Q2 preserves capability, not
 * placement) — hence a flag, not a removal.
 */

const SRC = join(process.cwd(), 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');

const GATED_ROUTES = [
  'app/[locale]/(app)/handle-claim/page.tsx',
  'app/[locale]/(app)/practice-record/page.tsx',
];

describe('the scaffold surfaces stay gated (5.201, 5.202)', () => {
  it('should keep PRACTICE_ACCOUNTS_ENABLED off by default, so the default state is shut', () => {
    // The flag is an explicit opt-in: nothing is inferred from a missing value.
    expect(isPracticeAccountsEnabled({})).toBe(false);
    expect(isPracticeAccountsEnabled({ PRACTICE_ACCOUNTS_ENABLED: 'TRUE' })).toBe(false);
    expect(isPracticeAccountsEnabled({ PRACTICE_ACCOUNTS_ENABLED: '1' })).toBe(false);
    expect(isPracticeAccountsEnabled({ PRACTICE_ACCOUNTS_ENABLED: 'true' })).toBe(true);
  });

  it.each(GATED_ROUTES)('should 404 %s unless the capability is enabled', (route) => {
    const source = read(route);
    // The route must consult the capability AND refuse when it is off. Both
    // halves matter: importing the check without calling `notFound()` would
    // read as gated while still rendering.
    expect(source).toContain('isPracticeAccountsEnabled');
    expect(source).toMatch(/if \(!isPracticeAccountsEnabled\(\)\) notFound\(\);/);
  });

  it('should not link either surface from Profile while it cannot honour its claims', () => {
    const profile = read('components/ProfileScreen.tsx');
    // The affordances are what made the claims reachable. A row may state the
    // field; it may not offer navigation to a screen that cannot deliver.
    expect(profile).not.toContain('handle-claim');
    expect(profile).not.toContain('practice-record`');
  });

  it('should keep the capability itself intact rather than deleting the screens (P-Q2)', () => {
    // Preserve capability, not placement: the components and routes still
    // exist and render as built once the flag is on.
    expect(read('components/HandleClaim.tsx').length).toBeGreaterThan(0);
    expect(read('components/PracticeRecord.tsx').length).toBeGreaterThan(0);
    for (const route of GATED_ROUTES) expect(read(route)).toMatch(/return <\w+/);
  });
});
