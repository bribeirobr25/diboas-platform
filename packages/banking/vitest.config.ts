import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    // P1.2 slice 1-0 (E2): coverage tooling — the C-P0 ledger invariant test
    // lives here and had no coverage runner. `test:coverage` (v8 provider). The
    // 100% target on the invariant is enforced by the invariant tests
    // themselves (conservation + closed event-type set), not a blanket
    // threshold; this makes the number observable and is where a per-file
    // threshold lands when the Postgres store tests arrive in slice 1b.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/__tests__/**', 'src/index.ts'],
      reporter: ['text', 'text-summary'],
    },
  },
});
