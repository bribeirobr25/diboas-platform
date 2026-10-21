/**
 * Q0 · the Practice app's Playwright harness (register: Pre-I2 plan Track Q).
 *
 * Separate from the root `playwright.config.ts` (the marketing site): this one
 * drives the sandbox production build through `e2e/harness.ts`, which owns the
 * server process itself — Playwright's `webServer` cannot stop and restart a
 * server mid-run, and the build swap needs exactly that.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // One server, one origin, shared by every test in the worker — and a build swap
  // changes it for everyone, so nothing may run beside it.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // No retries: a harness that passes on the second try has a defect worth seeing.
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  timeout: 90_000,
  use: {
    trace: 'retain-on-failure',
    // CI runs the runner's preinstalled Chrome without Playwright's ffmpeg (see the
    // root config); video would fail `newPage` there.
    video: 'off',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      // CDP lifecycle control (freeze/resume) is Chromium-only by nature.
      use: { ...devices['Desktop Chrome'], ...(process.env.CI ? { channel: 'chrome' } : {}) },
    },
  ],
});
