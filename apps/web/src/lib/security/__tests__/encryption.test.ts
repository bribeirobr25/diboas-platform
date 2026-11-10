/**
 * Encryption & HMAC Tests
 *
 * 100% coverage target for security utilities.
 * Tests AES-256-GCM encrypt/decrypt, HMAC-SHA256 blind index,
 * and key management (HMAC_KEY separation, fallbacks).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'crypto';

// We need to dynamically import the module after setting env vars,
// so we use vi.resetModules() + dynamic import per test group.

const TEST_KEY_BASE64 = crypto.randomBytes(32).toString('base64');
const TEST_HMAC_KEY_BASE64 = crypto.randomBytes(32).toString('base64');

/**
 * Helper to set env vars in tests — works around TS strict read-only NODE_ENV.
 */
function setEnv(key: string, value: string): void {
  (process.env as Record<string, string | undefined>)[key] = value;
}

function deleteEnv(key: string): void {
  delete (process.env as Record<string, string | undefined>)[key];
}

describe('encryption module', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    vi.resetModules();
    // Save current values of keys we'll mutate
    for (const key of ['ENCRYPTION_KEY', 'HMAC_KEY', 'NODE_ENV', 'DATABASE_URL']) {
      savedEnv[key] = process.env[key as keyof NodeJS.ProcessEnv] as string | undefined;
    }
  });

  afterEach(() => {
    // Restore saved values
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) {
        deleteEnv(key);
      } else {
        setEnv(key, value);
      }
    }
  });

  /* 5.865 (founder ruling 2026-11-10): with a database configured and no key, refuse in every
   * environment; the pass-through stays only for development with no database. */
  describe('no key: pass-through only without a database', () => {
    it.each(['development', 'test'])(
      'should refuse to encrypt or hash when NODE_ENV is %s and a database is configured',
      async (env) => {
        deleteEnv('ENCRYPTION_KEY');
        deleteEnv('HMAC_KEY');
        setEnv('NODE_ENV', env);
        setEnv('DATABASE_URL', 'postgresql://dev:dev@localhost:5432/dev');
        const { encrypt, hmacHash } = await import('@/lib/security/encryption');
        expect(encrypt('ana@example.com')).toBeNull();
        expect(hmacHash('ana@example.com')).toBeNull();
      }
    );

    it('should pass through in development when no database is configured', async () => {
      deleteEnv('ENCRYPTION_KEY');
      deleteEnv('HMAC_KEY');
      deleteEnv('DATABASE_URL');
      setEnv('NODE_ENV', 'development');
      const { encrypt, hmacHash } = await import('@/lib/security/encryption');
      expect(encrypt('ana@example.com')).toBe('ana@example.com');
      expect(hmacHash('ana@example.com')).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('hmacHash', () => {
    it('should produce deterministic output for the same input', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'development');

      const { hmacHash } = await import('@/lib/security/encryption');

      const hash1 = hmacHash('test@example.com');
      const hash2 = hmacHash('test@example.com');

      expect(hash1).toBe(hash2);
    });

    it('should produce different output for different inputs', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'development');

      const { hmacHash } = await import('@/lib/security/encryption');

      const hash1 = hmacHash('alice@example.com');
      const hash2 = hmacHash('bob@example.com');

      expect(hash1).not.toBe(hash2);
    });

    it('should return a 64-character hex string', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'development');

      const { hmacHash } = await import('@/lib/security/encryption');

      const hash = hmacHash('test@example.com');

      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should use HMAC_KEY when available (separate from ENCRYPTION_KEY)', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('HMAC_KEY', TEST_HMAC_KEY_BASE64);
      setEnv('NODE_ENV', 'production');

      const { hmacHash } = await import('@/lib/security/encryption');

      const hashWithHmacKey = hmacHash('test@example.com');
      expect(hashWithHmacKey).toMatch(/^[a-f0-9]{64}$/);

      // Verify it uses HMAC_KEY, not ENCRYPTION_KEY, by comparing with manual computation
      const expectedHmac = crypto
        .createHmac('sha256', Buffer.from(TEST_HMAC_KEY_BASE64, 'base64'))
        .update('test@example.com')
        .digest('hex');

      expect(hashWithHmacKey).toBe(expectedHmac);
    });

    it('should produce different hashes with different HMAC keys', async () => {
      // Hash with HMAC_KEY = TEST_HMAC_KEY_BASE64
      setEnv('HMAC_KEY', TEST_HMAC_KEY_BASE64);
      setEnv('NODE_ENV', 'production');

      const mod1 = await import('@/lib/security/encryption');
      const hash1 = mod1.hmacHash('test@example.com');

      // Hash with HMAC_KEY = TEST_KEY_BASE64 (different key)
      vi.resetModules();
      setEnv('HMAC_KEY', TEST_KEY_BASE64);

      const mod2 = await import('@/lib/security/encryption');
      const hash2 = mod2.hmacHash('test@example.com');

      expect(hash1).not.toBe(hash2);
    });

    it('should fall back to ENCRYPTION_KEY when HMAC_KEY not set', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      deleteEnv('HMAC_KEY');
      setEnv('NODE_ENV', 'development');

      const { hmacHash } = await import('@/lib/security/encryption');

      const hash = hmacHash('test@example.com');

      // Should use ENCRYPTION_KEY as HMAC key (fallback)
      const expectedHmac = crypto
        .createHmac('sha256', Buffer.from(TEST_KEY_BASE64, 'base64'))
        .update('test@example.com')
        .digest('hex');

      expect(hash).toBe(expectedHmac);
    });

    it('should return plain SHA-256 in dev mode when no key is set', async () => {
      deleteEnv('ENCRYPTION_KEY');
      deleteEnv('HMAC_KEY');
      setEnv('NODE_ENV', 'development');

      const { hmacHash } = await import('@/lib/security/encryption');

      const hash = hmacHash('test@example.com');

      const expectedSha = crypto.createHash('sha256').update('test@example.com').digest('hex');

      expect(hash).toBe(expectedSha);
    });

    it('should return null in production when no key is set', async () => {
      deleteEnv('ENCRYPTION_KEY');
      deleteEnv('HMAC_KEY');
      setEnv('NODE_ENV', 'production');

      const { hmacHash } = await import('@/lib/security/encryption');

      const hash = hmacHash('test@example.com');

      expect(hash).toBeNull();
    });

    it('should return null when HMAC_KEY is too short', async () => {
      setEnv('HMAC_KEY', crypto.randomBytes(16).toString('base64')); // 16 bytes, needs 32
      deleteEnv('ENCRYPTION_KEY');
      setEnv('NODE_ENV', 'production');

      const { hmacHash } = await import('@/lib/security/encryption');

      const hash = hmacHash('test@example.com');

      expect(hash).toBeNull();
    });

    it('should return null when HMAC_KEY is invalid base64', async () => {
      setEnv('HMAC_KEY', '!!!invalid-base64!!!');
      deleteEnv('ENCRYPTION_KEY');
      setEnv('NODE_ENV', 'production');

      const { hmacHash } = await import('@/lib/security/encryption');

      const hash = hmacHash('test@example.com');

      // Invalid base64 may decode to short buffer → null
      expect(hash).toBeNull();
    });
  });

  describe('encrypt / decrypt round-trip', () => {
    it('should encrypt and decrypt to original plaintext', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'production');

      const { encrypt, decrypt } = await import('@/lib/security/encryption');

      const plaintext = 'test@example.com';
      const ciphertext = encrypt(plaintext);

      expect(ciphertext).not.toBeNull();
      expect(ciphertext).not.toBe(plaintext);

      const decrypted = decrypt(ciphertext!);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext each time (random IV)', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'production');

      const { encrypt } = await import('@/lib/security/encryption');

      const plaintext = 'same-input@example.com';
      const ct1 = encrypt(plaintext);
      const ct2 = encrypt(plaintext);

      expect(ct1).not.toBe(ct2); // Random IV → different ciphertext
    });

    it('should return plaintext in dev mode without key', async () => {
      deleteEnv('ENCRYPTION_KEY');
      setEnv('NODE_ENV', 'development');

      const { encrypt, decrypt } = await import('@/lib/security/encryption');

      const plaintext = 'dev@example.com';
      expect(encrypt(plaintext)).toBe(plaintext);
      expect(decrypt(plaintext)).toBe(plaintext);
    });

    it('should return null in production without key', async () => {
      deleteEnv('ENCRYPTION_KEY');
      setEnv('NODE_ENV', 'production');

      const { encrypt, decrypt } = await import('@/lib/security/encryption');

      expect(encrypt('test')).toBeNull();
      expect(decrypt('test')).toBeNull();
    });
  });

  describe('decrypt legacy unencrypted data (isLikelyUnencrypted)', () => {
    it('should return plain email when decryption fails on legacy unencrypted email', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'production');

      const { decrypt } = await import('@/lib/security/encryption');

      // Use a long email so base64-decoded buffer >= 28 bytes (IV + authTag),
      // ensuring it goes through the full decryption attempt rather than
      // the short-circuit at the minimum length check.
      const longEmail = 'verylongemailaddressthatisverylong@exampledomain.com';
      const result = decrypt(longEmail);
      expect(result).toBe(longEmail);
    });

    it('should return plain name when decryption fails on legacy unencrypted name', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'production');

      const { decrypt } = await import('@/lib/security/encryption');

      // Use a long name so base64-decoded buffer >= 28 bytes
      const longName = 'Alexanderrrrr Bartholomewwwww Christopherrrr';
      const result = decrypt(longName);
      expect(result).toBe(longName);
    });

    it('should return null when decryption fails on garbage data', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'production');

      const { decrypt } = await import('@/lib/security/encryption');

      // Random base64 that is long enough to attempt decryption but is not
      // a valid ciphertext and does not look like an email or name
      const garbage = crypto.randomBytes(64).toString('base64');
      const result = decrypt(garbage);
      expect(result).toBeNull();
    });

    it('should return short unencrypted data as-is when buffer is too short', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'production');

      const { decrypt } = await import('@/lib/security/encryption');

      // Short string whose base64-decoded buffer < 28 bytes hits the minimum length check
      const shortEmail = 'a@b.com';
      const result = decrypt(shortEmail);
      expect(result).toBe(shortEmail);
    });
  });

  describe('invalid HMAC_KEY base64 format', () => {
    it('should return null when HMAC_KEY has invalid base64 that decodes to short buffer', async () => {
      // This string decodes to a buffer shorter than 32 bytes
      setEnv('HMAC_KEY', 'YQ=='); // decodes to "a" (1 byte)
      deleteEnv('ENCRYPTION_KEY');
      setEnv('NODE_ENV', 'production');

      const { hmacHash } = await import('@/lib/security/encryption');

      const result = hmacHash('test@example.com');
      expect(result).toBeNull();
    });

    it('should return null when Buffer.from throws on HMAC_KEY', async () => {
      // The catch block at lines 243-244 is defensive code for when Buffer.from throws.
      // Node's Buffer.from('...', 'base64') never actually throws, but we mock it
      // to exercise this defensive path.
      setEnv('HMAC_KEY', 'trigger-throw');
      deleteEnv('ENCRYPTION_KEY');
      setEnv('NODE_ENV', 'production');

      const originalFrom = Buffer.from;

      vi.spyOn(Buffer, 'from').mockImplementation((...args: any[]) => {
        if (args[0] === 'trigger-throw' && args[1] === 'base64') {
          throw new Error('Simulated Buffer.from failure');
        }
        return originalFrom(args[0], args[1]);
      });

      const { hmacHash } = await import('@/lib/security/encryption');
      const result = hmacHash('test@example.com');

      expect(result).toBeNull();
      vi.restoreAllMocks();
    });
  });

  // 5.70 (100% for security utilities): the key is read per call, not cached
  // at import, so every key-validation and cipher-failure path is reachable.
  describe('invalid ENCRYPTION_KEY (fails closed in production)', () => {
    it('should refuse to encrypt, decrypt or hash when the key is not 32 bytes in production', async () => {
      setEnv('ENCRYPTION_KEY', crypto.randomBytes(16).toString('base64'));
      deleteEnv('HMAC_KEY');
      setEnv('NODE_ENV', 'production');

      const { encrypt, decrypt, hmacHash } = await import('@/lib/security/encryption');
      const { Logger } = await import('@/lib/monitoring/Logger');

      expect(encrypt('user@example.com')).toBeNull();
      expect(decrypt('user@example.com')).toBeNull();
      expect(hmacHash('user@example.com')).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith(
        '[Encryption] Invalid key length. Expected 32 bytes (256 bits)'
      );
    });

    it('should refuse to encrypt when decoding the key throws in production', async () => {
      setEnv('ENCRYPTION_KEY', 'trigger-key-throw');
      setEnv('NODE_ENV', 'production');

      const originalFrom = Buffer.from;
      vi.spyOn(Buffer, 'from').mockImplementation((...args: any[]) => {
        if (args[0] === 'trigger-key-throw' && args[1] === 'base64') {
          throw new Error('Simulated Buffer.from failure');
        }
        return originalFrom(args[0], args[1]);
      });

      const { encrypt } = await import('@/lib/security/encryption');
      const { Logger } = await import('@/lib/monitoring/Logger');

      expect(encrypt('user@example.com')).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith('[Encryption] Invalid base64 key format');
    });
  });

  describe('cipher failures (fail closed)', () => {
    it('should return null and log the message when the cipher throws an Error', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'production');
      vi.spyOn(crypto, 'createCipheriv').mockImplementation(() => {
        throw new Error('cipher unavailable');
      });

      const { encrypt } = await import('@/lib/security/encryption');
      const { Logger } = await import('@/lib/monitoring/Logger');

      expect(encrypt('user@example.com')).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith('[Encryption] Encryption failed:', {
        error: 'cipher unavailable',
      });
    });

    it('should return null and log the stringified value when the cipher throws a non-Error', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'production');
      vi.spyOn(crypto, 'createCipheriv').mockImplementation(() => {
        throw 'raw cipher failure';
      });

      const { encrypt } = await import('@/lib/security/encryption');
      const { Logger } = await import('@/lib/monitoring/Logger');

      expect(encrypt('user@example.com')).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith('[Encryption] Encryption failed:', {
        error: 'raw cipher failure',
      });
    });

    it('should return null and log the stringified value when the decipher throws a non-Error', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'production');
      vi.spyOn(crypto, 'createDecipheriv').mockImplementation(() => {
        throw 'raw decipher failure';
      });

      const { decrypt } = await import('@/lib/security/encryption');
      const { Logger } = await import('@/lib/monitoring/Logger');

      // Long enough to attempt decryption; looks like neither an email nor a name.
      const garbage = crypto.randomBytes(64).toString('base64');
      expect(decrypt(garbage)).toBeNull();
      expect(Logger.error).toHaveBeenCalledWith('[Encryption] Decryption failed:', {
        error: 'raw decipher failure',
      });
    });
  });
});
