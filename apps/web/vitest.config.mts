import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * COV-1 (register 5.70, 5.837): a RATCHET. Each floor is the coverage measured on 2026-11-10 (raised the same day after the eleventh audit), rounded
 * down; CI's `pnpm test:coverage` fails when any falls below. Raise a floor when coverage rises;
 * never lower one to make a run pass. Below the 80/60 policy: see register 5.832 (web is ratcheted, not yet compliant). CLAUDE.md requires 100% for security utilities.
 */
const COVERAGE_THRESHOLDS = {
  // Re-measured 2026-11-20 (P13 PR-2, `pnpm --filter web test:coverage`) and rounded down, as
  // COV-1 prescribes: global 47.07/41.00/40.83/46.71, app 40.05/32.61/32.32/39.98, components
  // 24.03/22.45/23.58/23.66, config 43.68/53.49/37.50/44.22, hooks 57.47/53.52/60.78/57.23,
  // lib 66.18/59.47/58.94/65.78 (lines/branches/functions/statements). Dream Mode's deletion
  // took tested code with it (app functions fell to 30.8); the business waitlist's and the
  // share card's own tests carried every floor back above it before any was raised.
  lines: 47,
  branches: 41,
  functions: 40,
  statements: 46,
  'src/app/**': { lines: 40, branches: 32, functions: 32, statements: 39 },
  'src/components/**': { lines: 24, branches: 22, functions: 23, statements: 23 },
  'src/config/**': { lines: 43, branches: 53, functions: 37, statements: 44 },
  'src/hooks/**': { lines: 57, branches: 53, functions: 60, statements: 57 },
  'src/lib/**': { lines: 66, branches: 59, functions: 58, statements: 65 },
  // Security utilities: 100% on every metric.
  'src/lib/security/**': { 100: true },
  'middleware.ts': { 100: true },
  'src/app/api/email/unsubscribe/route.ts': { 100: true },
  'src/app/api/cron/purge-audit-logs/route.ts': { 100: true },
  'src/app/api/consent/route.ts': { 100: true },
  'src/app/api/monitoring/route.ts': { 100: true },
  'src/lib/api/routeHelpers.ts': { 100: true },
  'src/lib/api/validators.ts': { 100: true },
  'src/lib/utils/redactContext.ts': { 100: true },
  // Twelfth audit: the unsubscribe token's mint and decode (the only authority to unsubscribe).
  'src/lib/email/unsubscribeUrl.ts': { 100: true },
  'src/lib/email/unsubscribeToken.ts': { 100: true },
  // 5.862 / 5.864: the scrubbers between the site and Sentry, PostHog and GA4.
  'src/lib/utils/scrubUrl.ts': { 100: true },
  'src/lib/monitoring/sentryScrub.ts': { 100: true },
  'src/lib/analytics/scrubAnalyticsEvent.ts': { 100: true },
  // 5.866: the GDPR erasure door and the store helpers under every waitlist read and write.
  'src/app/api/waitlist/delete/route.ts': { 100: true },
  'src/lib/waitingList/store/internals.ts': { 100: true },
};

export default defineConfig({
  plugins: [react()],
  test: {
    // Vitest 5's default, written out (fifteenth audit D-2): mock call history resets before
    // each test. A call made at import or in beforeAll is not visible to a test's assertions.
    clearMocks: true,
    environment: 'node',
    // Hermeticity (Phase-3 audit, 2026-07-16): happy-dom fetches iframe srcs
    // for real by default, so the VideoFacade suite was firing live network
    // requests at youtube-nocookie from unit tests. Unit tests never need a
    // real iframe document; the component under test only cares about the
    // element + its events.
    environmentOptions: {
      happyDOM: {
        // happy-dom 21 disables iframe page loading by default and deprecates the old
        // `disableIframePageLoading`; the explicit form keeps tests off the network if a
        // future default changes.
        settings: { enableIframePageLoading: false },
      },
    },
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      // COV-1 (register 5.70): every source file counts, tested or not (vitest 4 otherwise
      // counts only files a test loads), plus the root middleware (CSP nonce, geo, locale).
      include: ['src/**/*.{ts,tsx}', 'middleware.ts'],
      exclude: [
        '**/__tests__/**',
        '**/*.test.{ts,tsx}',
        '**/*.stories.tsx',
        '**/*.d.ts',
        'src/test/**',
      ],
      reporter: ['text-summary', 'json-summary'],
      thresholds: COVERAGE_THRESHOLDS,
    },
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
