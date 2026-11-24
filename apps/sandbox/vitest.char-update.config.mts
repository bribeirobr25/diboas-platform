import { defineConfig } from 'vitest/config';
import base from './vitest.config.mts';

/**
 * ⛑ LEDGER-CHAR-1 · the golden UPDATE run (plan P12 D11): the normal config with two fields
 * replaced (never merged, which would concatenate the arrays): only the characterization
 * folder runs, plus the one setup file that may write goldens; files run one at a time, so
 * two families never rewrite the shared manifest at once. Coverage is off. COV-1's one-config
 * check matches only `vitest.config.*` and `vite.config.*` names, so this file is not counted
 * as a second coverage config (it enables no coverage).
 */
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ['src/lib/ledger/decide/__tests__/characterization/**/*.test.ts'],
    setupFiles: ['./src/test/setup.ts', './scripts/characterization/updateSetup.ts'],
    globalSetup: ['./scripts/characterization/updateTeardown.ts'],
    fileParallelism: false,
    coverage: { ...base.test?.coverage, enabled: false },
  },
});
