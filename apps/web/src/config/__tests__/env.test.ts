/**
 * Production-secret validator tests (C-2).
 *
 * Guards the `validateProductionSecrets` contract — notably that a prod runtime
 * missing `NEXT_PUBLIC_SENTRY_DSN` fails loud instead of silently shipping no
 * error tracking.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { malformedKeyProblems, validateProductionSecrets } from '@/config/env';

const REQUIRED = [
  'ENCRYPTION_KEY',
  'DATABASE_URL',
  'INTERNAL_API_KEY',
  'RESEND_API_KEY',
  'HMAC_KEY',
  'NEXT_PUBLIC_SENTRY_DSN',
] as const;

/** 32 bytes, base64 — the shape `lib/security/encryption.ts` accepts. */
const KEY_32 = Buffer.alloc(32, 7).toString('base64');
const KEY_16 = Buffer.alloc(16, 7).toString('base64');

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

/* 5.865 (founder rulings 2026-11-10): a present but wrong-length key makes every personal-data
 * route refuse; it is returned here and sent to Sentry as FATAL at server start (instrumentation). */
describe('malformedKeyProblems (5.865)', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PHASE', undefined);
    vi.stubEnv('ENCRYPTION_KEY', KEY_32);
    vi.stubEnv('HMAC_KEY', KEY_32);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should find nothing when both keys have their lengths', () => {
    expect(malformedKeyProblems()).toEqual([]);
  });

  it.each([
    [
      'a 16-byte ENCRYPTION_KEY',
      'ENCRYPTION_KEY',
      KEY_16,
      'ENCRYPTION_KEY must decode to 32 bytes',
    ],
    [
      'a 48-byte ENCRYPTION_KEY (64 hex characters)',
      'ENCRYPTION_KEY',
      Buffer.alloc(48, 7).toString('base64'),
      'ENCRYPTION_KEY must decode to 32 bytes',
    ],
    [
      'a 28-byte HMAC_KEY',
      'HMAC_KEY',
      'ci-stub-hmac-key-32-chars-padding-here',
      'HMAC_KEY must decode to at least 32 bytes',
    ],
  ])('should name %s', (_l, name, value, problem) => {
    vi.stubEnv(name, value);
    expect(malformedKeyProblems()).toEqual([problem]);
  });

  it('should accept a key the encryption module accepts, a trailing newline included', () => {
    vi.stubEnv('ENCRYPTION_KEY', `${KEY_32}\n`);
    vi.stubEnv('HMAC_KEY', Buffer.alloc(48, 1).toString('base64'));
    expect(malformedKeyProblems()).toEqual([]);
  });

  it('should check nothing outside production, during the build, or for an absent key', () => {
    vi.stubEnv('ENCRYPTION_KEY', KEY_16);
    vi.stubEnv('NODE_ENV', 'development');
    expect(malformedKeyProblems()).toEqual([]);
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    expect(malformedKeyProblems()).toEqual([]);
    vi.stubEnv('NEXT_PHASE', undefined);
    vi.stubEnv('ENCRYPTION_KEY', undefined);
    vi.stubEnv('HMAC_KEY', undefined);
    expect(malformedKeyProblems()).toEqual([]);
  });
});
