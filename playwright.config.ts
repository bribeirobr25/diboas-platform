/**
 * Playwright configuration — pre-launch happy-path coverage.
 *
 * Phase 4.3.c (audit/2026-05-08): bootstrap config that runs against the
 * Next.js production build on localhost:3000. The DB layer is stubbed
 * inside the test via `page.route()` interception, so no DB or env
 * secrets are required. Future tests can override per-test if needed.
 */

import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PLAYWRIGHT_TEST_PORT ?? '3000';
/**
 * WITHDRAW-1 (W-D1): the withdrawal spec lives in its own folder and runs as its own project, only
 * when `E2E_WITHDRAWAL` is set (Playwright runs every project it is given), against a build with
 * stub analytics keys; the `chromium` project ignores that folder. Pinned by
 * `apps/web/src/lib/__tests__/playwrightConfig.test.ts`.
 */
const WITHDRAWAL = Boolean(process.env.E2E_WITHDRAWAL);
const CHROME = {
  ...devices['Desktop Chrome'],
  ...(process.env.CI ? { channel: 'chrome' } : {}),
};
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  // Each test must self-contain its setup and teardown.
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // CI-only retries — locally we want fast-fail to surface flake quickly.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    // Video needs Playwright's ffmpeg binary, which `playwright install` would
    // fetch — but CI uses the runner's preinstalled Chrome (channel:'chrome')
    // and skips that download, so ffmpeg is absent. Disable video in CI to avoid
    // a `newPage` failure; trace (on-first-retry) + screenshot cover debugging.
    // Locally, bundled Chromium includes ffmpeg, so keep video-on-failure.
    video: process.env.CI ? 'off' : 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      testIgnore: ['**/withdrawal/**'],
      // In CI, run against the runner's preinstalled Google Chrome (the same
      // binary the pa11y job uses at /usr/bin/google-chrome) instead of
      // downloading Playwright's bundled Chromium — that 170 MB CDN download is
      // slow/flaky on the runner and was timing out the job. Locally, `channel`
      // is undefined → bundled Chromium (run `pnpm exec playwright install
      // chromium` once), preserving the existing local workflow.
      use: CHROME,
    },
    ...(WITHDRAWAL ? [{ name: 'withdrawal', testDir: './tests/e2e/withdrawal', use: CHROME }] : []),
  ],

  // Spin up the production server before tests run. Reuses an
  // already-running server when developing locally so iterating on
  // tests doesn't pay the start-up cost every time.
  webServer: {
    command: 'pnpm --filter web start',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
