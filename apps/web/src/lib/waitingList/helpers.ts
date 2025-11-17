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
