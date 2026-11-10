import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * COV-1 (register 5.70, 5.837): a RATCHET. Each floor is the coverage measured on 2026-11-10 (raised the same day after the eleventh audit), rounded
 * down; CI's `pnpm test:coverage` fails when any falls below. Raise a floor when coverage rises;
 * never lower one to make a run pass. CLAUDE.md requires 100% for security utilities.
 */
const COVERAGE_THRESHOLDS = {
  lines: 89,
  branches: 81,
  functions: 87,
  statements: 88,
  'src/app/**': { lines: 72, branches: 58, functions: 62, statements: 73 },
  'src/components/**': { lines: 79, branches: 70, functions: 79, statements: 78 },
  'src/config/**': { 100: true },
  'src/hooks/**': { lines: 98, branches: 88, functions: 90, statements: 94 },
  'src/i18n/**': { lines: 100, branches: 100, functions: 95, statements: 98 },
  'src/lib/**': { lines: 97, branches: 92, functions: 96, statements: 95 },
  'src/view/**': { lines: 100, branches: 96, functions: 100, statements: 99 },
  // Security utilities: 100% on every metric.
  'src/lib/security/**': { 100: true },
  'src/middleware.ts': { 100: true },
  'src/lib/ids.ts': { 100: true },
  'src/app/*/gate/actions.ts': { 100: true },
  'src/lib/gate.ts': { 100: true },
  'src/config/geofence.ts': { 100: true },
  'src/lib/auth/admission.ts': { 100: true },
  // Twelfth audit: the session seam and the onboarding actions that issue or check admission.
  'src/lib/auth/SimulatedAuthProvider.ts': { 100: true },
  'src/lib/auth/factory.ts': { 100: true },
  'src/app/*/welcome/actions.ts': { 100: true },
  'src/app/*/consent/actions.ts': { 100: true },
};

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
    /**
     * `5.590` — a FIXED worker count, founder-authorized 2026-10-21 (Option A).
     *
     * Vitest's default is `availableParallelism − 1`: 7 forks on an 8-core laptop shared
     * with other sessions, where CPU-bound tests ran 3.5–7× their own cost and one
     * ordinary run in five timed out (measured: `simulatedEvents:511` at 5,903 ms).
     * Three is what a 4-vCPU GitHub runner already gets by default, so CI is unchanged;
     * at three workers every slow test stayed at or under 60% of its budget under load.
     * This caps contention; it does not raise any timeout, which stays the floor above.
     */
    maxWorkers: 3,
    include: ['src/**/__tests__/**/*.test.ts', 'src/**/__tests__/**/*.test.tsx'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      // COV-1 (register 5.70): every source file counts, tested or not.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/__tests__/**', '**/*.stories.tsx', '**/*.d.ts', 'src/test/**'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: COVERAGE_THRESHOLDS,
    },
  },
});
