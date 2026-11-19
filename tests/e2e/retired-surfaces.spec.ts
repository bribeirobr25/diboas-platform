/**
 * ⛑ RETIRED-SURFACES-1 guard 10 · the retired demo in the browser (plan P13; register `5.112`).
 *
 * On the production build: the demo's old addresses answer 308 to exactly Practice's address (no
 * path, no query: the welcome emails' `utm_*` never reach Practice); every link to Practice on the
 * four landings has exactly that address; and a click on the navigation's "Try Practice" leaves
 * for Practice and opens no dialog (before P13 a document-level interceptor turned every
 * app.diboas.com link into the waitlist modal). Practice itself is never reached: its requests
 * are answered here.
 */
import { test, expect } from '@playwright/test';

const PRACTICE = 'https://app.diboas.com';

test.describe('the retired demo (P13)', () => {
  for (const path of ['/de/demo', '/en/demo?utm_source=x&ref=DIBOAS-1', '/demo']) {
    test(`should answer ${path} with a 308 to exactly the Practice address`, async ({
      request,
    }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(308);
      expect(res.headers()['location']).toBe(`${PRACTICE}/`);
    });
  }

  test('should end a trailing-slash address at Practice after Next strips the slash', async ({
    request,
  }) => {
    const first = await request.get('/en/demo/', { maxRedirects: 0 });
    expect([301, 308]).toContain(first.status());
    const next = first.headers()['location'] ?? '';
    expect(next).not.toContain(PRACTICE);
    const second = await request.get(next, { maxRedirects: 0 });
    expect(second.status()).toBe(308);
    expect(second.headers()['location']).toBe(`${PRACTICE}/`);
  });

  for (const locale of ['en', 'pt-BR', 'de', 'es']) {
    test(`should give every Practice link on /${locale} exactly the Practice address`, async ({
      page,
    }) => {
      // The play-money tool CTA is picked at random per visit and is the last of its set: force it.
      await page.addInitScript(() => {
        Math.random = () => 0.999;
      });
      const errors: string[] = [];
      let tunnelRefused = 0;
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => {
        if (m.type() !== 'error') return;
        // One named exception: the Sentry tunnel (`/api/monitoring`) answers 429 when the run has
        // no reachable Upstash Redis, because its limiter fails closed in production mode (F9,
        // `rateLimiter.ts` createDedicatedLimiter); this run and CI have none. Any other
        // resource or status is a fault, and more than ten refusals on one page would be a loop.
        if (
          /status of 429 \(Too Many Requests\)/.test(m.text()) &&
          new URL(m.location().url).pathname === '/api/monitoring'
        ) {
          tunnelRefused += 1;
          return;
        }
        errors.push(m.text());
      });
      await page.goto(`/${locale}`);
      // The play-money CTA sits in the "picture the future" section (pt-BR: "imagine"), which
      // renders as it scrolls into view: go there and wait for it, rather than racing a scroll.
      const future = page
        .locator(
          '[data-section-id^="picture-future-section"], [data-section-id="imagine-section-ptbr"]'
        )
        .first();
      await future.scrollIntoViewIfNeeded();
      await expect(future.locator(`a[href="${PRACTICE}"]`)).toHaveCount(1);
      await page.mouse.wheel(0, 20000);
      const hrefs = await page
        .locator('a[href*="app.diboas.com"]')
        .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
      // the two navigation CTAs (desktop and mobile) and the play-money CTA
      expect(hrefs.length).toBeGreaterThanOrEqual(3);
      for (const href of hrefs) expect(href).toBe(PRACTICE);
      expect(await page.locator('a[href*="/demo"]').count()).toBe(0);
      expect(errors).toEqual([]);
      expect(tunnelRefused).toBeLessThanOrEqual(10);
    });
  }

  test('should leave for Practice and open no dialog when "Try Practice" is clicked', async ({
    page,
  }) => {
    const visited: string[] = [];
    await page.route(`${PRACTICE}/**`, async (route) => {
      visited.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Practice</p>' });
    });
    await page.goto('/en');
    await page
      .getByRole('link', { name: 'Try Practice' })
      .filter({ visible: true })
      .first()
      .click();
    await expect.poll(() => visited.length).toBeGreaterThan(0);
    expect(visited[0]).toBe(`${PRACTICE}/`);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
