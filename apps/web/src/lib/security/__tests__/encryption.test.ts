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
    for (const key of ['ENCRYPTION_KEY', 'HMAC_KEY', 'NODE_ENV']) {
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

      const expectedSha = crypto
        .createHash('sha256')
        .update('test@example.com')
        .digest('hex');

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

  describe('isEncryptionEnabled', () => {
    it('should return true when key is set', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);

      const { isEncryptionEnabled } = await import('@/lib/security/encryption');

      expect(isEncryptionEnabled()).toBe(true);
    });

    it('should return false when key is not set', async () => {
      deleteEnv('ENCRYPTION_KEY');

      const { isEncryptionEnabled } = await import('@/lib/security/encryption');

      expect(isEncryptionEnabled()).toBe(false);
    });
  });

  describe('encryptFields / decryptFields', () => {
    it('should encrypt and decrypt specified fields', async () => {
      setEnv('ENCRYPTION_KEY', TEST_KEY_BASE64);
      setEnv('NODE_ENV', 'production');

      const { encryptFields, decryptFields } = await import('@/lib/security/encryption');

      const obj = { email: 'user@test.com', name: 'Alice', id: '123' };
      const encrypted = encryptFields(obj, ['email', 'name']);

      expect(encrypted.email).not.toBe('user@test.com');
      expect(encrypted.name).not.toBe('Alice');
      expect(encrypted.id).toBe('123'); // Unchanged

      const decrypted = decryptFields(encrypted, ['email', 'name']);
      expect(decrypted.email).toBe('user@test.com');
      expect(decrypted.name).toBe('Alice');
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate a valid base64-encoded 32-byte key', async () => {
      const { generateEncryptionKey } = await import('@/lib/security/encryption');

      const key = generateEncryptionKey();
      const buf = Buffer.from(key, 'base64');

      expect(buf.length).toBe(32);
    });
  });
});
