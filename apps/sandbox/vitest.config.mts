import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    // Default stays node (lib/ledger suites). Component tests opt into DOM via
    // a per-file `// @vitest-environment happy-dom` annotation — the same split
    // the web app uses. Hermeticity: happy-dom never loads iframe pages here.
    environment: 'node',
    environmentOptions: {
      happyDOM: {
        settings: { disableIframePageLoading: true },
      },
    },
    globals: true,
    /**
     * `5.397` — DECLARED, and deliberately IDENTICAL to vitest's default.
     *
     * This is not a tuning knob. It was implicit until 2026-09-16, when a
     * fixture helper of mine called a `days`-long builder inside a per-point
     * callback (O(days²)) and pushed one test to **5076ms** — visible only in
     * the FULL suite, never in isolation. The timeout was the only thing that
     * caught it.
     *
     * So the value stays 5000 and is written down instead of inherited:
     *   - RAISING it would hide exactly the class of defect it just found;
     *   - leaving it IMPLICIT let a future author bump a number nobody chose.
     * Changing this line is now a reviewable act. If a test needs longer, give
     * THAT test its own timeout argument and say why — do not move the floor
     * for everything.
     */
    testTimeout: 5000,
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
