/**
 * Waitlist signup — happy-path E2E test.
 *
 * Phase 4.3.c (audit/2026-05-08): smoke test that exercises the full UI
 * flow without touching the database. The `POST /api/waitlist/signup`
 * call is intercepted via `page.route()` and a deterministic stub
 * response is returned, so the test runs against the production build
 * without needing DATABASE_URL, encryption keys, or any other secret.
 *
 * Scope: verifies the form renders, validates client-side, submits, and
 * shows the confirmation. Does NOT verify the persistence layer — that
 * lives in `apps/web/src/app/api/waitlist/__tests__/signup.test.ts`
 * (route-level, with mocked store) and the contract tests in
 * `apps/web/src/lib/waitingList/__tests__/WaitlistApplicationService.test.ts`.
 */

import { test, expect, type Page } from '@playwright/test';
import { WAITLIST_SOURCES } from '../../apps/web/src/lib/waitingList/store/types';

/**
 * ⛑ `5.979` · WAITLIST-SOURCE-1 guard 8. This stub answered 200 to ANY body, so every modal
 * signup could be refused in production (an unaccepted `source`) while this test stayed
 * green. Every stub now checks the posted source against the one list the server uses.
 */
function expectListedSource(body: Record<string, unknown>) {
  if (body.source !== undefined) {
    expect(WAITLIST_SOURCES as readonly unknown[]).toContain(body.source);
  }
}

test.describe('Waitlist signup — happy path', () => {
  /* What each stubbed request posted, so a test can assert the exact source its form sends
     (WAITLIST-SOURCE-1, kept honest after the Dream Mode modal's test went with it, P13 PR-2). */
  let posted: Record<string, unknown>[] = [];

  test.beforeEach(async ({ page }) => {
    posted = [];
    // Stub the signup API. The real handler runs through CSRF, rate
    // limiting, encryption, and DB writes — all of which require env
    // vars / external services. The stub keeps the test hermetic.
    await page.route('**/api/waitlist/signup', async (route) => {
      const request = route.request();
      // Sanity: assert the client actually sent the email + consent.
      const body = request.postDataJSON() as Record<string, unknown>;
      expect(body.email).toBeTruthy();
      expect(body.gdprAccepted).toBe(true);
      expectListedSource(body);
      posted.push(body);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          position: 421,
          referralCode: 'DIBOAS-E2E1',
          referralUrl: 'https://diboas.com/?ref=DIBOAS-E2E1',
          tier: 'founding_member',
        }),
      });
    });

    // Stub the stats endpoint so the section deterministically renders
    // VersionA (founding-member spots remaining) regardless of real
    // counter state.
    await page.route('**/api/waitlist/stats**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalSignups: 100,
          foundingMemberSpotsRemaining: 1100,
          foundingMemberCap: 1200,
        }),
      });
    });
  });

  test('submits the homepage waitlist form and shows confirmation', async ({ page }) => {
    // Use the homepage hash anchor (#waitlist) so the browser scrolls
    // straight to the section — the section is below-the-fold and the
    // page lazy-loads heavy below-the-fold sections via next/dynamic,
    // so we navigate to the anchor rather than visiting + scrolling.
    await page.goto('/en#waitlist');

    // The B2C homepage wraps the WaitlistSection in `<div id="waitlist">`
    // (see apps/web/src/app/[locale]/(landing)/page.tsx). That ID is the
    // stable DOM anchor used for navigation; the inner section's
    // data-testid is keyed by its B2C config (`waitlist-section-b2c`).
    const waitlistSection = page.locator('#waitlist');
    await waitlistSection.waitFor({ state: 'visible', timeout: 15_000 });
    await expect(waitlistSection).toBeVisible();

    // Fill the form. The form uses native HTML inputs — name attributes
    // are stable, role-based locators stay readable.
    const emailInput = waitlistSection.locator('input[name="email"]').first();
    const consentCheckbox = waitlistSection.locator('input[name="gdprAccepted"]').first();

    await emailInput.fill('e2e+playwright@example.com');
    await consentCheckbox.check();

    // Submit. The submit button is the only one inside the form.
    const submitButton = waitlistSection.locator('form button[type="submit"]').first();
    await submitButton.click();

    // The form swaps to a confirmation view rendered by
    // `WaitlistConfirmation`. We don't assert on copy (it's i18n + may
    // change) — instead we look for the position number we returned in
    // the stub, which the confirmation component is required to render.
    await expect(waitlistSection.getByText('421')).toBeVisible({ timeout: 10_000 });
    expect(posted).toHaveLength(1);
    expect(posted[0]!.source).toBe('landing_b2c');
  });

  test('posts landing_b2b from the business page waitlist form', async ({ page }) => {
    await page.goto('/en/business#waitlist');
    const waitlistSection = page.locator('#waitlist');
    await waitlistSection.waitFor({ state: 'visible', timeout: 15_000 });
    await waitlistSection.locator('input[name="email"]').first().fill('e2e+b2b@example.com');
    await waitlistSection.locator('input[name="gdprAccepted"]').first().check();
    await waitlistSection.locator('form button[type="submit"]').first().click();
    await expect.poll(() => posted.length, { timeout: 10_000 }).toBe(1);
    expect(posted[0]!.source).toBe('landing_b2b');
  });

  test('posts tool_money_jobs from the Money Jobs gate', async ({ page }) => {
    await page.goto('/en/tools/money-jobs');
    // the gate appears under a computed split; enter an amount if the page opens without one
    const gate = page.locator('form[class*="gateForm"]').first();
    if (!(await gate.isVisible())) {
      const amount = page
        .locator('input[inputmode="decimal"], input[inputmode="numeric"], input[type="number"]')
        .first();
      await amount.fill('3000');
      await amount.press('Tab');
    }
    await gate.waitFor({ state: 'visible', timeout: 15_000 });
    await gate.locator('input[name="email"]').fill('e2e+gate@example.com');
    await gate.locator('input[type="checkbox"]').check();
    await gate.locator('button[type="submit"]').click();
    await expect.poll(() => posted.length, { timeout: 10_000 }).toBe(1);
    expect(posted[0]!.source).toBe('tool_money_jobs');
  });
});
