/**
 * Waiting List Helpers
 *
 * Utility functions for waiting list operations
 * Following DRY principles
 */

import { VALIDATION_PATTERNS } from './constants';

/**
 * Generates a unique submission ID
 */
export const generateSubmissionId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `wl_${timestamp}_${random}`;
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.email.test(email.trim());
};

/**
 * Validates X (Twitter) account format
 */
export const isValidXAccount = (xAccount: string): boolean => {
  if (!xAccount) return true; // Optional field
  const cleaned = xAccount.startsWith('@') ? xAccount.slice(1) : xAccount;
  return VALIDATION_PATTERNS.xAccount.test(`@${cleaned}`);
};

/**
 * Validates name format
 */
export const isValidName = (name: string): boolean => {
  if (!name) return true; // Optional field
  return VALIDATION_PATTERNS.name.test(name.trim());
};

/**
 * Normalizes X account (ensures @ prefix)
 */
export const normalizeXAccount = (xAccount: string): string => {
  if (!xAccount) return '';
  const trimmed = xAccount.trim();
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
};

/**
 * Creates ISO timestamp for consent tracking
 */
export const createConsentTimestamp = (): Date => {
  return new Date();
};

/**
 * Formats date for display
 */
export const formatSubmissionDate = (date: Date): string => {
  return date.toISOString();
};

/**
 * Checks if storage is available (client-side only)
 */
export const isStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Truncates string to max length
 */
export const truncateString = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength);
};

/**
 * Generates a unique referral code
 * Format: REF + 6 alphanumeric characters (e.g., REF847ABC)
 */
export const generateReferralCode = (prefix: string = 'REF', length: number = 6): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoiding confusing chars (0, O, 1, I)
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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
 * Extracts referral code from URL query params
 */
export const extractReferralFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref') || null;
  } catch {
    return null;
  }
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
 * Calculates new position after referral bumps
 */
export const calculateNewPosition = (
  currentPosition: number,
  referralCount: number,
  spotsPerReferral: number
): number => {
  const newPosition = currentPosition - (referralCount * spotsPerReferral);
  return Math.max(1, newPosition); // Position can't go below 1
};

/**
 * Gets referral code from cookie or local storage
 */
export const getReferralFromStorage = (cookieName: string): string | null => {
  if (typeof window === 'undefined') return null;

  // Try cookie first
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === cookieName) {
      return decodeURIComponent(value);
    }
  }

  return null;
};

/**
 * Sets referral code in cookie
 */
export const setReferralCookie = (
  cookieName: string,
  referralCode: string,
  expiryDays: number = 30
): void => {
  if (typeof window === 'undefined') return;

  const expires = new Date();
  expires.setDate(expires.getDate() + expiryDays);
  document.cookie = `${cookieName}=${encodeURIComponent(referralCode)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

/**
 * Clears referral cookie
 */
export const clearReferralCookie = (cookieName: string): void => {
  if (typeof window === 'undefined') return;
  document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};
