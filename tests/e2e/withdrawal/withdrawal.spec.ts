/**
 * WITHDRAW-1 (e2e) · Decline really stops GA4 and PostHog (market clean-up W-D1, spec §3.7).
 *
 * Runs only as the `withdrawal` project (`E2E_WITHDRAWAL=1`), against a build with stub analytics
 * keys: GA's and PostHog's hosts are routed here, so nothing leaves the machine. A `_ga` cookie is
 * planted before the Decline. Two paths: Accept → Decline in one page, and Accept → reload (consent
 * present at load) → Decline. After the Decline: GA4's `ga-disable-<ID>` flag is set, no `_ga*`
 * cookie is left, and PostHog keeps no `ph_*_posthog` item in cookies or storage.
 */
import { expect, test, type Page } from '@playwright/test';

const GA_ID = 'G-E2ESTUB1';

test.beforeEach(async ({ page }) => {
  await page.route(/googletagmanager\.com|google-analytics\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: '' })
  );
  await page.route(/posthog\.com/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );
});

async function accept(page: Page) {
  const banner = page.getByRole('dialog');
  await banner.waitFor({ state: 'visible', timeout: 15_000 });
  await banner.getByRole('button', { name: 'Accept cookies' }).click();
  await expect(banner).toBeHidden();
}

async function declineFromSettings(page: Page) {
  await page.getByRole('button', { name: 'Cookie settings' }).first().click();
  const banner = page.getByRole('dialog');
  await expect(banner).toBeVisible();
  await banner.getByRole('button', { name: 'Decline cookies' }).click();
  await expect(banner).toBeHidden();
}

async function expectStopped(page: Page) {
  await expect
    .poll(() => page.evaluate((id) => (window as never)[`ga-disable-${id}`], GA_ID))
    .toBe(true);
  const cookies = await page.context().cookies();
  expect(cookies.filter((c) => /^_ga(_|$)/.test(c.name)).map((c) => c.name)).toEqual([]);
  expect(cookies.filter((c) => /^ph_.*_posthog$/.test(c.name)).map((c) => c.name)).toEqual([]);
  const stored = await page.evaluate(() => [
    ...Object.keys(window.localStorage),
    ...Object.keys(window.sessionStorage),
  ]);
  expect(stored.filter((k) => /^ph_.*_posthog$/.test(k))).toEqual([]);
}

/** The positive control: PostHog really started (it stored its state) before the Decline. */
async function expectPostHogStarted(page: Page) {
  await expect
    .poll(async () => {
      const cookies = (await page.context().cookies()).map((c) => c.name);
      const stored = await page.evaluate(() => Object.keys(window.localStorage));
      return [...cookies, ...stored].some((k) => /^ph_.*_posthog$/.test(k));
    })
    .toBe(true);
}

async function plantGaCookie(page: Page) {
  const { hostname } = new URL(page.url());
  await page.context().addCookies([
    { name: '_ga', value: 'GA1.1.123.456', domain: hostname, path: '/' },
    { name: `_ga_${GA_ID.slice(2)}`, value: 'GS1.1.1', domain: hostname, path: '/' },
  ]);
}

test('Accept, then Decline from "Cookie settings", stops GA4 and PostHog', async ({ page }) => {
  await page.goto('/en');
  await accept(page);
  await expectPostHogStarted(page);
  await plantGaCookie(page);
  await declineFromSettings(page);
  await expectStopped(page);
});

test('Accept, reload, then Decline stops them too (consent present at load)', async ({ page }) => {
  await page.goto('/en');
  await accept(page);
  await page.reload();
  await expectPostHogStarted(page);
  await plantGaCookie(page);
  await declineFromSettings(page);
  await expectStopped(page);
});
