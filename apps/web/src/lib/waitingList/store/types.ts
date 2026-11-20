/**
 * Waitlist domain types — shared by repository, referral, and stats modules.
 *
 * Tier system (determined at signup, permanent):
 * - founding_member:   first 1200 direct signups (or invited while cap not full)
 * - early_member:      invited by founder/early_member after cap is full
 * - priority_waitlist: signed up after cap is full with no invite, or referrer at invite limit
 * - standard:          invited by standard/priority_waitlist tier
 */

export interface WaitlistEntry {
  id: string;
  email: string;
  name?: string;
  position: number;
  originalPosition: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  locale: string;
  source: WaitlistSource;
  tags: string[];
  tier: WaitlistTier;
  country?: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type WaitlistTier = 'founding_member' | 'early_member' | 'priority_waitlist' | 'standard';

/**
 * ⛑ `5.979` · THE ONE LIST OF SIGNUP SOURCES.
 *
 * The validator's set, the type and every client that posts a source derive from this
 * array (plan P11, D2). Before it, two lists were kept in step by a comment, and the
 * modal's `'modal'` matched neither: every modal signup was refused from 2026-03-20.
 *
 * A source names the OBSERVED PATH that brought the reader (Growth canon CC-B:
 * "attribution describes observed paths"), never the container that collected the form:
 * the inline landing forms send `landing_b2c` / `landing_b2b`, the Money Jobs gate
 * `tool_money_jobs`. A source leaves the list in the change that removes its sender (plan P13,
 * D6): the demo's and the app-link interceptor's sources left with PR-1, Dream Mode's and the
 * never-sent calculator source with PR-2. Stored rows keep their value; nothing validates a
 * stored source.
 * This module has no imports, so the client, the validator and the e2e test can read it
 * without pulling the database in (D2). Adding a member is a decision: its audience must
 * be set in `counterManager.ts` before this compiles (D4).
 */
export const WAITLIST_SOURCES = [
  'landing_b2c',
  'landing_b2b',
  'tool_money_jobs',
  'referral',
  'direct',
] as const;

export type WaitlistSource = (typeof WAITLIST_SOURCES)[number];

/**
 * The sources whose audience counters a page may ask the stats route for (D3, D7): the two
 * landing audiences. Shared by the stats route, `useWaitlistStats` and the waitlist section.
 */
export const STATS_AUDIENCE_SOURCES = [
  'landing_b2c',
  'landing_b2b',
] as const satisfies readonly WaitlistSource[];

export type StatsAudienceSource = (typeof STATS_AUDIENCE_SOURCES)[number];

/**
 * The one request shape for `POST /api/waitlist/signup` (D3): the route reads it and every
 * client builds its body with `satisfies WaitlistSignupBody`, so a source outside the list
 * fails `type-check` at the line that sends it.
 */
export interface WaitlistSignupBody {
  email: string;
  name?: string;
  locale: string;
  gdprAccepted: boolean;
  referredBy?: string;
  source?: WaitlistSource;
  tags?: string[];
}

export interface AddEntryInput {
  email: string;
  name?: string;
  referralCode: string;
  referredBy?: string;
  locale: string;
  source?: WaitlistSource;
  tags?: string[];
  country?: string;
}

/** Max invites per founding_member or early_member */
export const INVITE_LIMIT = 5;
