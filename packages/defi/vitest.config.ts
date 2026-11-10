import { defineConfig } from 'vitest/config';

/**
 * COV-1 (register 5.70): a RATCHET. Each floor is the coverage measured on 2026-11-10, rounded
 * down; CI's `pnpm test:coverage` fails when any falls below. Raise a floor when coverage rises;
 * never lower one to make a run pass. CLAUDE.md requires 100% for security utilities.
 */
const COVERAGE_THRESHOLDS = {
  lines: 99,
  branches: 96,
  functions: 100,
  statements: 98,
  'src/providers/**': { lines: 100, branches: 98, functions: 100, statements: 100 },
};

export default defineConfig({
  test: {
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
