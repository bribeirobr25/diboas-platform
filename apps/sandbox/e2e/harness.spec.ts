import type { Page } from '@playwright/test';
import type { DisplayCurrency } from '@diboas/defi';
import { marketResponseIssue } from '../src/lib/market/responseShape';
import { expect, setLifecycle, test } from './harness';

/**
 * Q0 self-tests: the trivial journey the acceptance names, then one test per
 * harness capability — each asserts the capability actually took effect, not just
 * that the call returned.
 */

const LEDGER_KEY = 'diboas-ledger-v2:sandbox';

/** Public-mode onboarding, through the real UI: welcome → consent → claim → Home. */
async function onboard(page: Page, origin = ''): Promise<void> {
  await page.goto(`${origin}/en/welcome`);
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await page.waitForURL('**/en/consent');
  await page.getByRole('button', { name: 'Accept & continue' }).click();
  await page.waitForURL('**/en/claim');
  await page.getByRole('button', { name: /Get your first/ }).click();
  await page.waitForURL(/\/en$/);
}

/**
 * Home has rendered: its h1 is named by the "Play balance" label. The visible label is
 * aria-hidden and the h1 carries the same words for assistive tech (lane audit 2026-10-21, C1),
 * so the text appears twice; the heading's accessible name is the one unambiguous target.
 */
const homeHeading = (page: Page) =>
  page.getByRole('heading', { level: 1, name: /^Play balance\b/ });

const ledgerLength = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '[]').length as number,
    LEDGER_KEY
  );

test('a trivial journey: onboarding lands on Home with the play-money grant', async ({ page }) => {
  await onboard(page);
  await expect(homeHeading(page)).toBeVisible();
  await expect(homeHeading(page)).toContainText('10,000.00');
  expect(await ledgerLength(page)).toBe(1);
});

test('MULTI-PAGE: two live tabs in one context share the origin’s storage and session', async ({
  tabs,
}) => {
  const [a, b] = await tabs(2);
  // B is open BEFORE A writes: two live documents, the way a user has two tabs.
  await b!.goto('/en/welcome');
  await b!.evaluate((key) => {
    const w = window as unknown as { __storage: number };
    w.__storage = 0;
    addEventListener('storage', (e) => {
      if (e.key === key) w.__storage += 1;
    });
  }, LEDGER_KEY);
  await onboard(a!);
  // A's write reached B's live document (a storage event fires only in OTHER documents).
  await expect
    .poll(() => b!.evaluate(() => (window as unknown as { __storage: number }).__storage))
    .toBeGreaterThan(0);
  // B never onboarded; it is the same user, so it sees A's ledger and session.
  await b!.goto('/en');
  await expect(homeHeading(b!)).toBeVisible();
  expect(await ledgerLength(b!)).toBe(1);
});

test('CDP LIFECYCLE: a tab is frozen and resumed the way the browser does it', async ({
  freezable,
  server,
}) => {
  const [a, b] = await freezable.tabs(2);
  // Tabs of one window: only the front one paints, so each is brought forward to act.
  await a!.bringToFront();
  await onboard(a!, server.origin);
  await a!.evaluate(() => {
    const w = window as unknown as { __ticks: number; __lifecycle: string[] };
    w.__ticks = 0;
    w.__lifecycle = [];
    setInterval(() => w.__ticks++, 50);
    for (const type of ['freeze', 'resume'])
      document.addEventListener(type, () => w.__lifecycle.push(type));
  });
  const ticks = () => a!.evaluate(() => (window as unknown as { __ticks: number }).__ticks);
  // Control: the timer runs before the freeze, so a zero below is the freeze, not a dead timer.
  const t0 = await ticks();
  await a!.waitForTimeout(500);
  expect(await ticks()).toBeGreaterThan(t0 + 3);

  await setLifecycle(a!, 'frozen');
  const frozenAt = await ticks();
  await b!.waitForTimeout(1_000);
  // The page's own tasks stopped; DevTools can still read it.
  expect(await ticks(), 'no timer task ran while frozen').toBe(frozenAt);
  // The other tab of the same user stays live and sees the frozen tab's ledger.
  await b!.bringToFront();
  await b!.goto(`${server.origin}/en`);
  await expect(homeHeading(b!)).toBeVisible();
  expect(await ledgerLength(b!)).toBe(1);

  await setLifecycle(a!, 'active');
  await a!.waitForTimeout(500);
  expect(await ticks(), 'timers run again after resume').toBeGreaterThan(frozenAt);
  expect(
    await a!.evaluate(() => (window as unknown as { __lifecycle: string[] }).__lifecycle)
  ).toEqual(['freeze', 'resume']);
});

test('CDP LIFECYCLE fails closed on a tab that cannot be frozen', async ({ page }) => {
  // Playwright's own pages are focus-emulated, which Chrome never freezes; the helper
  // must say so instead of returning as if the freeze happened.
  await page.goto('/en/welcome');
  await expect(setLifecycle(page, 'frozen')).rejects.toThrow(
    /had no effect: no 'freeze' event fired/
  );
});

test('HERMETIC: the market API answers from the fixture provider, never a live source', async ({
  request,
}) => {
  const body: unknown = await (await request.get('/api/market')).json();
  const sources = new Set<string>();
  JSON.stringify(body, (key, value: unknown) => {
    if (key === 'source' && typeof value === 'string') sources.add(value);
    return value;
  });
  expect(sources.size, 'the response carries evidence stamps').toBeGreaterThan(0);
  expect([...sources]).toEqual(['fixture']);
});

test('BUILD SWAP: an open tab survives a deploy on the same origin', async ({ page, server }) => {
  const swapDir = process.env.SANDBOX_E2E_SWAP_DIST;
  // CI must run a REAL two-build swap: a restart of the same build cannot show a
  // deploy that kept serving the old build.
  if (process.env.CI) expect(swapDir, 'CI sets SANDBOX_E2E_SWAP_DIST').toBeTruthy();
  await onboard(page);
  const before = { buildId: server.buildId, starts: server.starts, pid: server.pid };
  await page.evaluate(() => {
    (window as unknown as { __beforeSwap: boolean }).__beforeSwap = true;
  });

  await server.swapBuild(swapDir);
  expect(server.starts, 'the server restarted').toBe(before.starts + 1);
  expect(server.pid, 'a new server process').not.toBe(before.pid);
  if (swapDir)
    expect(server.buildId, 'the swapped-in build is a different build').not.toBe(before.buildId);
  else
    test
      .info()
      .annotations.push({ type: 'swap', description: 'restart-only (no SANDBOX_E2E_SWAP_DIST)' });
  // What the origin SERVES is the build now in place, not just what is on disk.
  expect(await (await page.request.get('/en/welcome')).text()).toContain(server.buildId);

  // The document open across the deploy was not reloaded by it…
  expect(
    await page.evaluate(() => (window as unknown as { __beforeSwap?: boolean }).__beforeSwap)
  ).toBe(true);
  // …and it still works against the new server: an in-app navigation lands on Goals.
  // Next answers a client on an older build with a full document load (deployment
  // skew), so the read retries through that reload; how many loads it took is
  // recorded as evidence for P8c, not asserted.
  let loads = 0;
  page.on('load', () => (loads += 1));
  await page.getByRole('link', { name: 'Goals' }).click();
  await page.waitForURL('**/en/goals');
  await expect(async () => expect(await ledgerLength(page)).toBe(1)).toPass({ timeout: 15_000 });
  test.info().annotations.push({
    type: 'skew',
    description: `${loads} document load(s) on the first in-app navigation after the deploy`,
  });
});

/**
 * PR 2 (P3 §8): the harness serves FIXTURE stamps only, and a fixture is never an observed rate —
 * so the rate ranges are unavailable and the goal's projection must say the rates can't be read
 * (Case U), with no number. Asserted at the route AND on the real goal page.
 */
test('PROJECTION: under fixture data the goal block says the pool rates cannot be read', async ({
  page,
  request,
}) => {
  const res = await request.get('/api/market/rate-ranges');
  expect(res.status()).toBe(200);
  expect(res.headers()['cache-control']).toBe('public, max-age=0, s-maxage=60');
  const body = (await res.json()) as {
    strategies: Array<{ available: boolean; reason?: string }>;
    aggregate: { available: boolean };
  };
  expect(body.strategies.length).toBeGreaterThan(0);
  expect(body.strategies.every((s) => !s.available && s.reason === 'NOT_OBSERVED')).toBe(true);
  expect(body.aggregate.available).toBe(false);

  await onboard(page);
  await page.goto('/en/goals/new');
  await page.getByLabel('Goal name').fill('Trip');
  await page.getByLabel('Target amount').fill('10000');
  const [month, year] = await page.evaluate(() => [
    new Date().getMonth(),
    new Date().getFullYear() + 3,
  ]);
  await page.getByLabel('Month').selectOption(String(month));
  await page.getByLabel('Year').selectOption(String(year));
  await page.getByRole('button', { name: 'Create goal' }).click();
  await page.waitForURL(/\/en$/);
  const goalId = await page.evaluate((key) => {
    const events = JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{
      type: string;
      goalId?: string;
    }>;
    return events.find((e) => e.type === 'GoalCreated')?.goalId ?? '';
  }, LEDGER_KEY);
  expect(goalId).not.toBe('');

  // The PAGE must call the real route and get an answer (7th audit: a mistyped URL 404s into the
  // same "can't be read" text, so the text alone cannot prove the wiring).
  const rateRanges = page.waitForResponse(
    (r) => new URL(r.url()).pathname === '/api/market/rate-ranges'
  );
  await page.goto(`/en/goals/${goalId}`);
  expect((await rateRanges).status()).toBe(200);
  const block = page.getByTestId('goal-projection');
  await expect(block).toContainText("Pool rates can't be read right now");
  await expect(block).not.toContainText('Illustrative projection');
  expect(await block.textContent()).not.toMatch(/\d/);
});

/**
 * `5.814` · RATE-AGE-1 on a production build (plan P10, guard 7).
 *
 * The harness serves only documented (fixture) stamps, so no live rate reaches
 * the page by itself. This case rewrites each APY stamp in the real `/api/market`
 * answer into a live observation of a chosen age, and reads the rate line on the
 * picker and on the strategy detail as the reader sees them. Gas is left as the
 * fixture, so the detail's stamp takes the GAS-1 partly-live branch.
 *
 * Controls: the answer carried at least one rewritten stamp and still passes the
 * app's own response-shape check, and a 1-hour age shows the RECENT line — so a
 * STALE line is the clock's doing, not the rewrite's.
 */
const DAY_MS = 86_400_000;

async function serveLiveRatesAged(page: Page, ageMs: number) {
  const seen = { rewritten: 0, issue: 'not checked' as string | null, asOf: '' };
  await page.route(
    (url) => url.pathname === '/api/market',
    async (route) => {
      const response = await route.fetch();
      const body = (await response.json()) as {
        currency?: string;
        apys: Array<{ stamp: Record<string, unknown> }>;
      };
      seen.asOf = new Date(Date.now() - ageMs).toISOString();
      for (const apy of body.apys) {
        apy.stamp = {
          source: 'defillama',
          origin: 'OBSERVED',
          fallbackUsed: false,
          fixtureVersion: null,
          observedAt: null,
          asOf: seen.asOf,
        };
        seen.rewritten += 1;
      }
      seen.issue = marketResponseIssue(body, (body.currency ?? 'USD') as DisplayCurrency);
      await route.fulfill({ response, json: body });
    }
  );
  return seen;
}

/** A goal funded at creation, three years out (the medium band holds pure-lending strategies). */
async function fundedGoalPage(page: Page): Promise<void> {
  await onboard(page);
  await page.goto('/en/goals/new');
  await page.getByLabel('Goal name').fill('Trip');
  await page.getByLabel('Target amount').fill('10000');
  const [month, year] = await page.evaluate(() => [
    new Date().getMonth(),
    new Date().getFullYear() + 3,
  ]);
  await page.getByLabel('Month').selectOption(String(month));
  await page.getByLabel('Year').selectOption(String(year));
  await page.locator('#goal-fund').fill('1000');
  await page.getByRole('button', { name: 'Create goal' }).click();
  await page.waitForURL(/\/en$/);
  const goalId = await page.evaluate((key) => {
    const events = JSON.parse(localStorage.getItem(key) ?? '[]') as Array<{
      type: string;
      goalId?: string;
    }>;
    return events.find((e) => e.type === 'GoalCreated')?.goalId ?? '';
  }, LEDGER_KEY);
  expect(goalId).not.toBe('');
  await page.goto(`/en/goals/${goalId}`);
}

/** The date as this page formats it: the browser's locale data and time zone. */
const pageDate = (page: Page, iso: string) =>
  page.evaluate(
    (at) => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(at)),
    iso
  );

async function openSafeHarbor(page: Page) {
  /* The goal page opens in its Simple view; the invest block is in the Detailed one. */
  await page.getByRole('button', { name: 'Detailed', exact: true }).click();
  await page.getByRole('button', { name: 'Put it to work' }).click();
  const row = page.locator('li', { hasText: 'Safe Harbor' }).first();
  await row.getByRole('radio').check();
  return {
    pickerLine: row.getByTestId('rate-line'),
    detail: page.locator('section[aria-labelledby="strategy-title"]'),
  };
}

test('RATE-AGE-1: a 9-day-old live rate reads as over a week old, never current', async ({
  page,
}) => {
  const seen = await serveLiveRatesAged(page, 9 * DAY_MS);
  await fundedGoalPage(page);
  const { pickerLine, detail } = await openSafeHarbor(page);
  expect(seen.rewritten, 'the answer carried live stamps to rewrite').toBeGreaterThan(0);
  expect(seen.issue, 'the rewritten answer passes the app’s own shape check').toBeNull();

  const date = await pageDate(page, seen.asOf);
  for (const line of [pickerLine, detail.getByTestId('rate-line')]) {
    await expect(line).toContainText(`Pool rate, fetched ${date}, over a week ago:`);
    await expect(line).toContainText('may have changed');
    await expect(line).not.toContainText(/current/i);
  }
  const stamp = detail.getByTestId('provenance-stamp-partly-live');
  await expect(stamp).toContainText(`Pool rates from DeFiLlama, fetched ${date}.`);
  await expect(stamp).not.toContainText(/live from/i);
});

test('RATE-AGE-1 control: a 1-hour-old live rate reads as fetched, not as stale', async ({
  page,
}) => {
  const seen = await serveLiveRatesAged(page, 3_600_000);
  await fundedGoalPage(page);
  const { pickerLine, detail } = await openSafeHarbor(page);
  expect(seen.rewritten).toBeGreaterThan(0);
  const date = await pageDate(page, seen.asOf);
  for (const line of [pickerLine, detail.getByTestId('rate-line')]) {
    await expect(line).toContainText(`Pool rate, fetched ${date}:`);
    await expect(line).not.toContainText('over a week');
    await expect(line).not.toContainText(/current/i);
  }
});
