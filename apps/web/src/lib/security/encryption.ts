/**
 * AES-256-GCM Encryption Utilities
 *
 * Provides secure encryption for PII (Personally Identifiable Information)
 * using AES-256-GCM authenticated encryption.
 *
 * Security features:
 * - 256-bit key strength
 * - Authenticated encryption (GCM mode)
 * - Random 12-byte IV per encryption
 * - Authentication tag verification
 */

import { Logger } from '@/lib/monitoring/Logger';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM standard
const AUTH_TAG_LENGTH = 16;
const ENCODING = 'base64';

/**
 * Get encryption key from environment
 * Key must be 32 bytes (256 bits), base64-encoded
 */
function getEncryptionKey(): Buffer | null {
  const keyBase64 = process.env.ENCRYPTION_KEY;

  if (!keyBase64) {
    if (process.env.NODE_ENV === 'production') {
      Logger.error('[Encryption] ENCRYPTION_KEY not set in production');
    }
    return null;
  }

  try {
    const key = Buffer.from(keyBase64, 'base64');
    if (key.length !== 32) {
      Logger.error('[Encryption] Invalid key length. Expected 32 bytes (256 bits)');
      return null;
    }
    return key;
  } catch {
    Logger.error('[Encryption] Invalid base64 key format');
    return null;
  }
}

/**
 * Check if encryption is available
 */
export function isEncryptionEnabled(): boolean {
  return getEncryptionKey() !== null;
}

/**
 * Encrypt plaintext using AES-256-GCM
 *
 * @param plaintext - The text to encrypt
 * @returns Base64-encoded string: IV + ciphertext + authTag, or null if encryption unavailable
 */
export function encrypt(plaintext: string): string | null {
  const key = getEncryptionKey();

  if (!key) {
    // Return plaintext if encryption not configured (dev mode)
    if (process.env.NODE_ENV !== 'production') {
      return plaintext;
    }
    return null;
  }

  try {
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine: IV + ciphertext + authTag
    const combined = Buffer.concat([iv, encrypted, authTag]);

    return combined.toString(ENCODING);
  } catch (error) {
    Logger.error('[Encryption] Encryption failed:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 *
 * @param ciphertext - Base64-encoded string: IV + ciphertext + authTag
 * @returns Decrypted plaintext, or null if decryption failed
 */
export function decrypt(ciphertext: string): string | null {
  const key = getEncryptionKey();

  if (!key) {
    // Return as-is if encryption not configured (dev mode)
    // This handles unencrypted legacy data
    if (process.env.NODE_ENV !== 'production') {
      return ciphertext;
    }
    return null;
  }

  try {
    // Decode from base64
    const combined = Buffer.from(ciphertext, ENCODING);

    // Check minimum length (IV + authTag)
    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      // Likely unencrypted data, return as-is
      return ciphertext;
    }

    // Extract components
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(combined.length - AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH, combined.length - AUTH_TAG_LENGTH);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    // If decryption fails, it might be unencrypted legacy data
    // Check if it looks like a valid email/name
    if (isLikelyUnencrypted(ciphertext)) {
      return ciphertext;
    }
    Logger.error('[Encryption] Decryption failed:', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Check if a string is likely unencrypted (legacy data)
 * Used to handle migration from unencrypted to encrypted storage
 */
function isLikelyUnencrypted(value: string): boolean {
  // Check if it looks like an email
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return true;
  }

  // Check if it looks like a name (alphanumeric with spaces)
  if (/^[\p{L}\s'-]+$/u.test(value) && value.length < 100) {
    return true;
  }

  return false;
}

/**
 * Encrypt an object's specified fields
 *
 * @param obj - The object to encrypt
 * @param fields - Array of field names to encrypt
 * @returns New object with encrypted fields
 */
export function encryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of fields) {
    const value = obj[field];
    if (typeof value === 'string' && value.length > 0) {
      const encrypted = encrypt(value);
      if (encrypted !== null) {
        (result as Record<string, unknown>)[field as string] = encrypted;
      }
    }
  }

  return result;
}

/**
 * Decrypt an object's specified fields
 *
 * @param obj - The object to decrypt
 * @param fields - Array of field names to decrypt
 * @returns New object with decrypted fields
 */
export function decryptFields<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[]
): T {
  const result = { ...obj };

  for (const field of fields) {
    const value = obj[field];
    if (typeof value === 'string' && value.length > 0) {
      const decrypted = decrypt(value);
      if (decrypted !== null) {
        (result as Record<string, unknown>)[field as string] = decrypted;
      }
    }
  }

  return result;
}

/**
 * Generate a new encryption key
 * For use in generating ENCRYPTION_KEY environment variable
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('base64');
}
