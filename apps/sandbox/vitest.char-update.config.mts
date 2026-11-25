import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

/**
 * ⛑ LEDGER-CHAR-1 · the recording run (plan P12 D11 as amended by P12a J4; register 5.1029).
 *
 * SELF-CONTAINED on purpose: the CI job `ledger-char-base` restores this file from the base into the
 * PR's tree, and it must not read anything the PR can still change, so it imports nothing from
 * `vitest.config.mts`. The settings that shape a test run are declared here and kept EQUAL to the
 * main config's (environment, environment options, globals, clearMocks, the `@` alias, the React
 * plugin, the setup file) — `charBaseJudge.test.ts` fails if they drift. Only the characterization
 * folder runs, plus the one setup file that may write recordings; files run one at a time, so two
 * families never rewrite the shared manifest at once. No coverage: COV-1's one-config check matches
 * only `vitest.config.*` and `vite.config.*` names.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    clearMocks: true,
    environment: 'node',
    environmentOptions: {
      happyDOM: {
        settings: { enableIframePageLoading: false },
      },
    },
    globals: true,
    testTimeout: 5000,
    include: ['src/lib/ledger/decide/__tests__/characterization/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts', './scripts/characterization/updateSetup.ts'],
    globalSetup: ['./scripts/characterization/updateTeardown.ts'],
    fileParallelism: false,
    coverage: { enabled: false },
  },
});
