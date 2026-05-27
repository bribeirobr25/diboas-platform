/**
 * Tier Determiner
 *
 * Determines the waitlist tier for a new signup based on referral
 * context, founding member cap status, and source audience.
 * Extracted from store.ts for single-responsibility compliance.
 *
 * Tier rules:
 * | Scenario                                                        | Tier              |
 * |----------------------------------------------------------------|-------------------|
 * | No referral + cap not full                                      | founding_member   |
 * | No referral + cap full                                          | priority_waitlist |
 * | Valid referral + referrer is founder/early_member + invites < 5 + cap not full | founding_member |
 * | Valid referral + referrer is founder/early_member + invites < 5 + cap full     | early_member    |
 * | Valid referral + referrer has >= 5 invites                       | priority_waitlist |
 * | Valid referral + referrer is standard/priority_waitlist          | standard          |
 */

import type { WaitlistEntry, WaitlistTier, WaitlistSource } from './store';
import { sourceToAudience, tryClaimFoundingSlot } from './counterManager';

/** Max invites per founding_member or early_member */
const INVITE_LIMIT = 5;

export async function determineTier(
  referrer: WaitlistEntry | undefined,
  source: WaitlistSource | undefined
): Promise<WaitlistTier> {
  const audience = sourceToAudience(source);

  // Referrer exists — check their tier and invite count
  if (referrer) {
    const referrerCanInvite =
      (referrer.tier === 'founding_member' || referrer.tier === 'early_member') &&
      referrer.referralCount < INVITE_LIMIT;

    if (!referrerCanInvite) {
      // Referrer is standard/priority_waitlist, or has used all 5 invites
      if (referrer.tier === 'standard' || referrer.tier === 'priority_waitlist') {
        return 'standard';
      }
      // Founder/early_member with >= 5 invites
      return 'priority_waitlist';
    }

    // Referrer can invite — try to claim a founding slot for the right audience
    const claimed = await tryClaimFoundingSlot(audience);
    return claimed !== null ? 'founding_member' : 'early_member';
  }

  // No referrer — direct signup
  const claimed = await tryClaimFoundingSlot(audience);
  return claimed !== null ? 'founding_member' : 'priority_waitlist';
}
