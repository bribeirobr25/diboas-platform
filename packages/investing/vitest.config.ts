import { defineConfig } from 'vitest/config';

/**
 * COV-1 (register 5.70): a RATCHET. Each floor is the coverage measured on 2026-11-10, rounded
 * down; CI's `pnpm test:coverage` fails when any falls below. Raise a floor when coverage rises;
 * never lower one to make a run pass. CLAUDE.md requires 100% for security utilities.
 */
const COVERAGE_THRESHOLDS = {
  lines: 99,
  branches: 92,
  functions: 100,
  statements: 96,
};

export default defineConfig({
  test: {
    // Vitest 5's default, written out (fifteenth audit D-2): mock call history resets before
    // each test. A call made at import or in beforeAll is not visible to a test's assertions.
    clearMocks: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      // COV-1 (register 5.70): every source file counts, tested or not.
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: COVERAGE_THRESHOLDS,
    },
  },
});
