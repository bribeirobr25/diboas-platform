import type { Page } from '@playwright/test';
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
