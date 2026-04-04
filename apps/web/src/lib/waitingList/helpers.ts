/**
 * Waiting List Helpers
 *
 * Utility functions for waiting list operations.
 * Dead code removed 2026-04-04: generateSubmissionId, isValidXAccount,
 * isValidName (shadowed by api/validators), normalizeXAccount,
 * createConsentTimestamp, formatSubmissionDate, isStorageAvailable,
 * truncateString, extractReferralFromUrl, clearReferralStorage.
 */

import { VALIDATION_PATTERNS } from './constants';

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.email.test(email.trim());
};

/**
 * Generates a unique referral code using cryptographic randomness.
 * Format: REF + 6 alphanumeric characters (e.g., REF847ABC)
 */
export const generateReferralCode = (prefix: string = 'REF', length: number = 6): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding confusing chars (0, O, 1, I)
  const randomBytes = new Uint8Array(length);
  crypto.getRandomValues(randomBytes);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(randomBytes[i] % chars.length);
  }
  return `${prefix}${code}`;
};

/**
 * Validates a referral code format
 */
export const isValidReferralCode = (code: string, prefix: string = 'REF'): boolean => {
  if (!code) return false;
  const pattern = new RegExp(`^${prefix}[A-Z0-9]{4,8}$`, 'i');
  return pattern.test(code);
};

/**
 * Generates referral URL
 */
export const generateReferralUrl = (baseUrl: string, referralCode: string): string => {
  const url = new URL(baseUrl);
  url.searchParams.set('ref', referralCode);
  return url.toString();
};

/**
 * Formats position number with locale-specific formatting
 */
export const formatPosition = (position: number, locale: string = 'en'): string => {
  return position.toLocaleString(locale);
};

/**
 * Stores referral code in sessionStorage (survives cross-page navigation within tab).
 * Uses sessionStorage instead of cookies to avoid GDPR/ePrivacy consent requirements.
 */
export const setReferralStorage = (key: string, referralCode: string): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, referralCode);
  } catch {
    // sessionStorage full or unavailable
  }
};

/**
 * Gets referral code from sessionStorage.
 */
export const getReferralFromStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
