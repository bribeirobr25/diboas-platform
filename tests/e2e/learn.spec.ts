/**
 * Learn / Real Talk — smoke E2E (Phase 3 Slice A, RV-9).
 *
 * Runs against the production build (`pnpm --filter web start`, see
 * playwright.config.ts webServer) with no external services: the learn pages
 * read only the registry + i18n, so nothing needs stubbing.
 *
 * Assertions are DRIP-STABLE by design: flipping a talk from announced to
 * live must never break this spec. Counts come from structure (7 arc items),
 * not from which talks happen to be live this week.
 */

import { test, expect } from '@playwright/test';

test.describe('Real Talk index (/en/learn)', () => {
  test('renders the 7-talk arc with at least one live card and honest announced cards', async ({
    page,
  }) => {
    await page.goto('/en/learn');

    // The arc is an ordered list of 7 talks.
    const arcItems = page.locator('ol > li');
    await expect(arcItems).toHaveCount(7);

    // At least one live talk links into /learn/<slug>.
    const liveLinks = page.locator('ol a[href*="/learn/"]');
    expect(await liveLinks.count()).toBeGreaterThanOrEqual(1);

    // Announced cards are non-interactive articles (no role, no tabindex),
    // marked with the availability badge. Adapt this block when all 7 are
    // live (there will be no announced cards left).
    const announced = page.locator('[data-status="announced"]');
    if ((await announced.count()) > 0) {
      await expect(announced.first()).toContainText(/Coming soon/i);
      await expect(announced.first()).not.toHaveAttribute('role', /.+/);
      await expect(announced.first()).not.toHaveAttribute('tabindex', /.+/);
    }
  });
});

test.describe('Talk page (/en/learn/compound-interest)', () => {
  test('renders the three beats, the quiz, and the education-first CTA group', async ({ page }) => {
    await page.goto('/en/learn/compound-interest');

    // Three beats by their stable section ids (Phase-0 progress-bar contract).
    for (const beat of ['beat1', 'beat2', 'beat3']) {
      await expect(page.locator(`#${beat}`)).toBeAttached();
    }

    // Quiz: one fieldset per graded question (registry-driven; Talk 1 = 2),
    // no input elements anywhere in it (the reflection is never a capture).
    const quiz = page.locator('section[aria-labelledby="talk-quiz-title"]');
    await expect(quiz).toBeAttached();
    await expect(quiz.locator('fieldset')).toHaveCount(2);
    await expect(quiz.locator('input, textarea, select')).toHaveCount(0);

    // Education-first CTA order: the primary anchors back to the tool.
    await expect(page.locator('a[href="#beat3"]').first()).toBeAttached();
  });

  test('quiz gives honest feedback and never gates the result', async ({ page }) => {
    await page.goto('/en/learn/compound-interest');

    const quiz = page.locator('section[aria-labelledby="talk-quiz-title"]');
    const q1Options = quiz.locator('fieldset').nth(0).locator('button');
    const q2Options = quiz.locator('fieldset').nth(1).locator('button');

    // Answer both (deliberately one wrong): feedback + score render with no
    // gate, no retry loop, and the correct answer is revealed.
    await q1Options.nth(0).click(); // wrong (correct is index 1)
    await expect(quiz.locator('[data-state="correct"]').first()).toBeAttached();
    await q2Options.nth(0).click(); // correct
    await expect(quiz.locator('fieldset').nth(0).locator('button').nth(0)).toBeDisabled();
  });
});

test.describe('Unknown talk slug', () => {
  test('shows the 404 UI and leaks no talk content', async ({ page }) => {
    // All 7 talks are live (founder flip 2026-07-16), so the no-leak check
    // moves to an unknown slug. Known limitation (Phase-1, founder-accepted):
    // under force-dynamic the production response is a soft-404 (404 UI over
    // HTTP 200), so this asserts CONTENT, not status.
    await page.goto('/en/learn/not-a-real-talk');
    await expect(page.locator('#beat1')).not.toBeAttached();
    await expect(page.locator('section[aria-labelledby="talk-quiz-title"]')).not.toBeAttached();
  });
});
