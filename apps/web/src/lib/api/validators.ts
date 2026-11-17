/**
 * Input Validators — Security Standards Phase 1
 *
 * Server-side validation for API route inputs.
 * All user-supplied data must pass through these before processing.
 */

import { SUPPORTED_LOCALES } from '@diboas/i18n/config';
import { CTA_SOURCE_TAG_PREFIX, isKnownCtaSource } from '@/lib/analytics/ctaSources';

/** Supported locales — single source of truth from @diboas/i18n */
const SUPPORTED_LOCALES_SET = new Set<string>(SUPPORTED_LOCALES);

/** Known waitlist sources — must stay in sync with WaitlistSource type */
const KNOWN_SOURCES = new Set([
  'landing_b2c',
  'landing_b2b',
  'interactive_demo',
  'dream_mode',
  'calculator',
  'tool_money_jobs',
  'referral',
  'direct',
]);

const MAX_TAGS = 10;
/**
 * The only tag keys a signup may carry (2026-11-12 audit: any `key:value` used to be stored
 * verbatim, in plaintext): the five UTM keys the client captures and the CTA label. UTM VALUES
 * are still free text from the visit URL (register `5.924`).
 */
const TAG_KEYS: ReadonlySet<string> = new Set([
  'utm_source:',
  'utm_medium:',
  'utm_campaign:',
  'utm_term:',
  'utm_content:',
  CTA_SOURCE_TAG_PREFIX,
]);

export interface SanitizedTags {
  tags: string[];
  /** How many tags were dropped (logged as a count, never their content). */
  dropped: number;
}
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
 * The tags to store, or `null` for a malformed request (not an array, a non-string entry, or
 * more than ten). Within a well-formed request a bad tag is DROPPED, never a reason to refuse
 * the signup: an empty or over-50-character tag (a long `utm_campaign` used to refuse every
 * attempt in that tab, register `5.922`), a tag whose key is not a UTM key or `cta_source:`,
 * a `cta_source:` label not on the shared list (`ctaSources.ts`), and any second
 * `cta_source:`. Labels are client-asserted (anyone can post a known one); that is inherent.
 */
export function sanitizeTags(tags: unknown): SanitizedTags | null {
  if (!Array.isArray(tags) || tags.length > MAX_TAGS) return null;
  if (!tags.every((tag) => typeof tag === 'string')) return null;
  let sawCtaSource = false;
  const kept = (tags as string[]).filter((tag) => {
    if (tag.length === 0 || tag.length > MAX_TAG_LENGTH) return false;
    const key = tag.slice(0, tag.indexOf(':') + 1);
    if (!TAG_KEYS.has(key)) return false;
    if (key !== CTA_SOURCE_TAG_PREFIX) return true;
    if (sawCtaSource || !isKnownCtaSource(tag.slice(key.length))) return false;
    sawCtaSource = true;
    return true;
  });
  return { tags: kept, dropped: tags.length - kept.length };
}

/**
 * Validate name length (max 100 chars, non-empty after trim).
 */
export function isValidName(name: string): boolean {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH;
}
