/**
 * Vitest Test Setup
 *
 * Global setup for all tests
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables for tests
// Note: NODE_ENV is typically set by the test runner, not here
process.env.ENCRYPTION_KEY = 'dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcyE='; // 32-byte base64 key for testing

// Mock Logger to avoid console noise in tests.
// Keep this surface in sync with `Logger`'s static methods that production hot
// paths call: a missing method here throws inside try/catch blocks (e.g.
// ErrorReportingService.reportError) and silently degrades to the catch branch,
// passing assertions that only check truthiness while breaking exact-value ones.
// Per-file inline `vi.mock('@/lib/monitoring/Logger', …)` overrides must do the same.
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    // Correlation-ID helpers (used by ErrorReportingService + monitoring service)
    getRequestId: vi.fn(() => undefined),
    setRequestId: vi.fn(),
    initFromMeta: vi.fn(),
  },
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
