import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPracticeAccountsEnabled } from '@/lib/capabilities';
import HandleClaimPage from '@/app/[locale]/(app)/handle-claim/page';
import PracticeRecordPage from '@/app/[locale]/(app)/practice-record/page';

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

  /**
   * BEHAVIOURAL, not textual: invoke the route component with the flag off and
   * require it to refuse. Next's `notFound()` throws a digest-tagged error, so
   * a route that merely imported the check without calling it would resolve
   * instead of throwing — and that is the exact half-fix this asserts against.
   */
  it('should REFUSE to render /handle-claim while the capability is off', async () => {
    delete process.env.PRACTICE_ACCOUNTS_ENABLED;
    await expect(
      HandleClaimPage({ params: Promise.resolve({ locale: 'en' }) })
    ).rejects.toThrowError(/NEXT_HTTP_ERROR_FALLBACK|NEXT_NOT_FOUND/);
  });

  it('should REFUSE to render /practice-record while the capability is off', () => {
    delete process.env.PRACTICE_ACCOUNTS_ENABLED;
    expect(() => PracticeRecordPage()).toThrowError(/NEXT_HTTP_ERROR_FALLBACK|NEXT_NOT_FOUND/);
  });

  it('should RENDER both once the capability is explicitly enabled (the gate opens, P-Q2)', async () => {
    process.env.PRACTICE_ACCOUNTS_ENABLED = 'true';
    try {
      // Preserve capability, not placement: with the flag on, both resolve to
      // their real elements rather than refusing.
      await expect(
        HandleClaimPage({ params: Promise.resolve({ locale: 'en' }) })
      ).resolves.toBeTruthy();
      expect(PracticeRecordPage()).toBeTruthy();
    } finally {
      delete process.env.PRACTICE_ACCOUNTS_ENABLED;
    }
  });

  it.each(GATED_ROUTES)(
    'should keep the refusal explicit in %s (review-time readability)',
    (route) => {
      // The behavioural tests above are the guard; this one keeps the intent
      // legible at the call site so a future reader sees the gate, not just a
      // passing test.
      expect(read(route)).toMatch(/if \(!isPracticeAccountsEnabled\(\)\) notFound\(\);/);
    }
  );

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
    // The components still export their surfaces, and the routes still return
    // them — a later cleanup cannot quietly delete the capability.
    expect(read('components/HandleClaim.tsx')).toMatch(/export function HandleClaim/);
    expect(read('components/PracticeRecord.tsx')).toMatch(/export function PracticeRecord/);
    for (const route of GATED_ROUTES) expect(read(route)).toMatch(/return <\w+/);
  });
});
