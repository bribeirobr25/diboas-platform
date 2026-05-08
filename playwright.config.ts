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
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
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
