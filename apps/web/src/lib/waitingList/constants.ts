/**
 * Waiting List Constants
 *
 * Configuration values for the waiting list feature
 * Following DRY principles and centralized configuration
 */

import { APP_URL, WAITLIST_STORAGE_KEYS, REFERRAL_COOKIE_CONFIG } from '@/config/env';

// Referral mechanics configuration
export const REFERRAL_CONFIG = {
  // Base URL for referral links
  referralBaseUrl: APP_URL,
  // Referral code prefix (for identification)
  codePrefix: REFERRAL_COOKIE_CONFIG.codePrefix,
  // Code length (excluding prefix)
  codeLength: 6,
  // Cookie name for tracking referral attribution
  referralCookieName: REFERRAL_COOKIE_CONFIG.name,
  // Cookie expiry in days
  referralCookieExpiry: REFERRAL_COOKIE_CONFIG.expiryDays,
} as const;

// The member's email, kept on the device so the Money Jobs gate opens without asking again
export const POSITION_STORAGE_KEYS = {
  email: WAITLIST_STORAGE_KEYS.email,
} as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  xAccount: /^@?[a-zA-Z0-9_]{1,15}$/,
  name: /^[\p{L}\p{M}\s'-]{1,100}$/u,
} as const;

/**
 * The waitlist note's tag prefixes (market clean-up W-D1, spec §3.5, §3.6): campaign values
 * (`utm_<key>:<value>`), the button label (`cta_source:<label>`) and the server's evidence tag
 * (`consent:<text>:v<version>:<date>`). One home, read by the signup route's consent check, the
 * note removal and the analytics label list, so the store never imports the API layer.
 */
export const UTM_TAG_PREFIX = 'utm_';
export const CTA_SOURCE_TAG_PREFIX = 'cta_source:';
export const CONSENT_TAG_PREFIX = 'consent:';
export const NOTE_TAG_PREFIXES = [
  UTM_TAG_PREFIX,
  CTA_SOURCE_TAG_PREFIX,
  CONSENT_TAG_PREFIX,
] as const;

/**
 * The two texts of the signup forms' note box (W-D1, spec §3.4, §6.4) and their current versions.
 * A ticked box sends `{ text, version }`; the route keeps the note's tags only when the version is
 * the current one for its text (CONSENT-TEXT-1 pins each version's wording, ×4). `note` (the
 * landing forms) covers campaign values and the button label; `note-campaign` (the Money Jobs
 * gate, which reads no label) covers campaign values only.
 */
export type NoteConsentText = 'note' | 'note-campaign';
export const SIGNUP_NOTE_BOX_VERSIONS: Readonly<Record<NoteConsentText, number>> = {
  note: 1,
  'note-campaign': 1,
};
/**
 * The join notice's current version (CONSENT-TEXT-1): it dates which notice a signup was shown,
 * so `gdpr_accepted`'s meaning after W-D1 ("joined with the notice shown") stays checkable.
 */
export const JOIN_NOTICE_VERSION = 1;

/**
 * The current versions of the policy paragraphs that describe the note (CONSENT-TEXT-1): the cookie
 * policy's analytics paragraph, the privacy policy's note items, and its retention sentence that
 * offers removal on request (`5.999`).
 */
export const POLICY_NOTE_VERSIONS = { cookie: 1, privacy: 1, retention: 1 } as const;

export interface AttributionConsent {
  text: NoteConsentText;
  version: number;
}

/**
 * The bounded `errorCode` set of `waiting_list_submission_failure` (`5.996`, `5.991`): the codes
 * the signup route and its rate limiter answer; anything else is reported as `OTHER`.
 */
export const SIGNUP_FAILURE_CODES = [
  'EMAIL_REQUIRED',
  'INVALID_EMAIL',
  'CONSENT_REQUIRED',
  'INVALID_LOCALE',
  'INVALID_SOURCE',
  'INVALID_TAGS',
  'INVALID_NAME',
  'RATE_LIMITED',
  'PROCESSING_ERROR',
  'SERVER_ERROR',
] as const;
export type SignupFailureCode = (typeof SIGNUP_FAILURE_CODES)[number] | 'OTHER';
export function toSignupFailureCode(code: unknown): SignupFailureCode {
  return (SIGNUP_FAILURE_CODES as readonly unknown[]).includes(code)
    ? (code as SignupFailureCode)
    : 'OTHER';
}

// Event types for analytics
export const WAITING_LIST_EVENTS = {
  FORM_SUBMITTED: 'waiting_list_form_submitted',
  FORM_VALIDATION_ERROR: 'waiting_list_form_validation_error',
  SUBMISSION_SUCCESS: 'waiting_list_submission_success',
  SUBMISSION_FAILURE: 'waiting_list_submission_failure',
  // Referral events
  REFERRAL_LINK_COPIED: 'waitlist_referral_link_copied',
  REFERRAL_LINK_SHARED: 'waitlist_referral_link_shared',
  REFERRAL_SIGNUP: 'waitlist_referral_signup',
  POSITION_UPDATED: 'waitlist_position_updated',
  // Share events
  SHARE_MODAL_OPENED: 'waitlist_share_modal_opened',
  SHARE_INITIATED: 'waitlist_share_initiated',
  SHARE_COMPLETED: 'waitlist_share_completed',
  SHARE_CANCELLED: 'waitlist_share_cancelled',
  CARD_GENERATED: 'waitlist_card_generated',
  CARD_DOWNLOADED: 'waitlist_card_downloaded',
  VERSION_SHOWN: 'waitlist_version_shown',
} as const;

// XSS prevention - allowed HTML tags (none for waiting list)
export const SANITIZATION_CONFIG = {
  ALLOWED_TAGS: [] as string[],
  ALLOWED_ATTR: [] as string[],
} as const;
