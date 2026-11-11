/**
 * Vitest Test Setup
 *
 * Global setup for all tests
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables for tests
// Note: NODE_ENV is typically set by the test runner, not here
// A real 32-byte key ("diboas-unit-test-encryption-key!"). The previous value decoded to 29 bytes,
// so every test silently ran on the plaintext pass-through (thirteenth audit, 5.865).
process.env.ENCRYPTION_KEY = Buffer.from('diboas-unit-test-encryption-key!').toString('base64');

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
    critical: vi.fn(),
    debug: vi.fn(),
    // Error-tracking hook (5.888), connected by instrumentation.ts on the server
    setErrorSink: vi.fn(),
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
