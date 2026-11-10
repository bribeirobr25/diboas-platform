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
};

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    // P1.2 slice 1-0 (E2): coverage tooling for the C-P0 ledger invariant. The invariant's
    // 100% target is enforced by the invariant tests themselves (conservation + closed
    // event-type set); COV-1 (5.70) adds the package floor below, checked by CI.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/index.ts'],
      reporter: ['text-summary', 'json-summary'],
      thresholds: COVERAGE_THRESHOLDS,
    },
  },
});
