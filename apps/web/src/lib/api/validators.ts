/**
 * Input Validators — Security Standards Phase 1
 *
 * Server-side validation for API route inputs.
 * All user-supplied data must pass through these before processing.
 */

import { SUPPORTED_LOCALES } from '@diboas/i18n/config';

/** Supported locales — single source of truth from @diboas/i18n */
const SUPPORTED_LOCALES_SET = new Set<string>(SUPPORTED_LOCALES);

/** Known waitlist sources — must stay in sync with WaitlistSource type */
const KNOWN_SOURCES = new Set([
  'landing_b2c',
  'landing_b2b',
  'interactive_demo',
  'dream_mode',
  'calculator',
  'referral',
  'direct',
]);

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;
const MAX_NAME_LENGTH = 100;

/**
 * Validate locale against supported list.
 */
export function isValidLocale(locale: string): boolean {
  return typeof locale === 'string' && SUPPORTED_LOCALES_SET.has(locale);
}

/**
 * Validate waitlist source against known values.
 */
export function isValidSource(source: string): boolean {
  return typeof source === 'string' && KNOWN_SOURCES.has(source);
}

/**
 * Validate tags array: must be an array of strings, max 10 items, each max 50 chars.
 */
export function isValidTags(tags: unknown): tags is string[] {
  if (!Array.isArray(tags)) return false;
  if (tags.length > MAX_TAGS) return false;

  return tags.every(
    (tag) => typeof tag === 'string' && tag.length > 0 && tag.length <= MAX_TAG_LENGTH
  );
}

/**
 * Validate name length (max 100 chars, non-empty after trim).
 */
export function isValidName(name: string): boolean {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH;
}
