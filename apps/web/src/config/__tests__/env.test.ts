/**
 * Production-secret validator tests (C-2).
 *
 * Guards the `validateProductionSecrets` contract — notably that a prod runtime
 * missing `NEXT_PUBLIC_SENTRY_DSN` fails loud instead of silently shipping no
 * error tracking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateProductionSecrets } from '@/config/env';

const REQUIRED = [
  'ENCRYPTION_KEY',
  'DATABASE_URL',
  'INTERNAL_API_KEY',
  'RESEND_API_KEY',
  'HMAC_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
] as const;

describe('validateProductionSecrets (C-2)', () => {
  beforeEach(() => {
    // vi.stubEnv handles the read-only `NODE_ENV` type and auto-restores below.
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PHASE', undefined); // not the build phase
    for (const k of REQUIRED) vi.stubEnv(k, 'test-value');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('passes when all required production vars are present', () => {
    expect(() => validateProductionSecrets()).not.toThrow();
  });

  it('throws (naming the var) when NEXT_PUBLIC_SENTRY_DSN is absent in production', () => {
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', undefined);
    expect(() => validateProductionSecrets()).toThrow(/NEXT_PUBLIC_SENTRY_DSN/);
  });

  it('throws when a core secret is absent in production', () => {
    vi.stubEnv('ENCRYPTION_KEY', undefined);
    expect(() => validateProductionSecrets()).toThrow(/ENCRYPTION_KEY/);
  });

  it('does not validate outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', undefined);
    expect(() => validateProductionSecrets()).not.toThrow();
  });
});
