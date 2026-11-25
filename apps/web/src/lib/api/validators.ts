/**
 * Input Validators — Security Standards Phase 1
 *
 * Server-side validation for API route inputs.
 * All user-supplied data must pass through these before processing.
 */

import { SUPPORTED_LOCALES } from '@diboas/i18n/config';
import { isKnownCtaSource } from '@/lib/analytics/ctaSources';
import { isShapedUtmValue } from '@/lib/analytics/utmShape';
import {
  CONSENT_TAG_PREFIX,
  CTA_SOURCE_TAG_PREFIX,
  SIGNUP_NOTE_BOX_VERSIONS,
  UTM_TAG_PREFIX,
  type NoteConsentText,
} from '@/lib/waitingList/constants';
import { WAITLIST_SOURCES, type WaitlistSource } from '@/lib/waitingList/store/types';

/** Supported locales — single source of truth from @diboas/i18n */
const SUPPORTED_LOCALES_SET = new Set<string>(SUPPORTED_LOCALES);

/**
 * Known waitlist sources: exactly the one list (`5.979`, plan P11 D2), never a copy of it, so
 * the type, the validator and what a client may send cannot drift apart.
 */
const KNOWN_SOURCES: ReadonlySet<string> = new Set<string>(WAITLIST_SOURCES);

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
export function isValidSource(source: unknown): source is WaitlistSource {
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

const NOTE_TEXTS: ReadonlySet<string> = new Set(Object.keys(SIGNUP_NOTE_BOX_VERSIONS));

/** The box text and version a ticked box sent, or `null` when absent or malformed. */
function readAttributionConsent(value: unknown): { text: NoteConsentText; version: number } | null {
  if (typeof value !== 'object' || value === null) return null;
  const { text, version } = value as { text?: unknown; version?: unknown };
  if (typeof text !== 'string' || !NOTE_TEXTS.has(text)) return null;
  if (typeof version !== 'number' || !Number.isInteger(version)) return null;
  return { text: text as NoteConsentText, version };
}

/**
 * The signup note under the box's consent (market clean-up W-D1, register 5.923; spec §3.5).
 * Runs after `sanitizeTags`. A malformed `attributionConsent` is dropped, never refused (the
 * `5.922` rule), and counts as an unticked box:
 * 1. no box, or a box whose version is not the current version of its text: every note tag goes;
 * 2. `note` keeps campaign values and the button label; `note-campaign` campaign values only; a
 *    campaign value must already have the shape as received (the server never rewrites);
 * 3. when at least one note tag is kept, the server appends ONE evidence tag
 *    `consent:<text>:v<version>:<YYYY-MM-DD>` (a client's `consent:` tag never survives
 *    `sanitizeTags`).
 * Pure: `now` is passed in. `dropped` is a count, logged by the route, never the content.
 */
export function applyNoteConsent(
  tags: readonly string[] | undefined,
  attributionConsent: unknown,
  now: Date
): { tags: string[]; dropped: number } {
  const input = tags ?? [];
  const consent = readAttributionConsent(attributionConsent);
  const current = consent !== null && SIGNUP_NOTE_BOX_VERSIONS[consent.text] === consent.version;
  const kept = !current
    ? []
    : input.filter((tag) => {
        if (tag.startsWith(CTA_SOURCE_TAG_PREFIX)) return consent.text === 'note';
        if (tag.startsWith(UTM_TAG_PREFIX))
          return isShapedUtmValue(tag.slice(tag.indexOf(':') + 1));
        return false;
      });
  const dropped = input.length - kept.length;
  if (kept.length === 0) return { tags: [], dropped };
  const day = now.toISOString().slice(0, 10);
  return {
    tags: [...kept, `${CONSENT_TAG_PREFIX}${consent!.text}:v${consent!.version}:${day}`],
    dropped,
  };
}

/**
 * Validate name length (max 100 chars, non-empty after trim).
 */
export function isValidName(name: string): boolean {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_NAME_LENGTH;
}
