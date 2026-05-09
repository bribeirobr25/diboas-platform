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

export type WaitlistTier =
  | 'founding_member'
  | 'early_member'
  | 'priority_waitlist'
  | 'standard';

export type WaitlistSource =
  | 'landing_b2c'
  | 'landing_b2b'
  | 'interactive_demo'
  | 'dream_mode'
  | 'calculator'
  | 'referral'
  | 'direct';

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
