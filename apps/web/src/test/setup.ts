/**
 * Vitest Test Setup
 *
 * Global setup for all tests
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Mock environment variables for tests
// Note: NODE_ENV is typically set by the test runner, not here
process.env.ENCRYPTION_KEY = 'dGVzdC1lbmNyeXB0aW9uLWtleS0zMi1ieXRlcyE='; // 32-byte base64 key for testing

// Mock Logger to avoid console noise in tests
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
