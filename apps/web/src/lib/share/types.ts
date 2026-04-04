/**
 * Share Library — Types
 *
 * Minimal types for social sharing. Card rendering types removed
 * (CardRenderer and related canvas utilities were dead code, deleted 2026-04-04).
 */

/** Supported share platforms */
export type SharePlatform = 'twitter' | 'whatsapp' | 'linkedin' | 'telegram' | 'copy';

/** Card types for UTM tracking */
export type CardType = 'dream' | 'waitlist' | 'referral' | 'milestone';
