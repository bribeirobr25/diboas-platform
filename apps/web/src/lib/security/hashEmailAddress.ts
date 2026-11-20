/**
 * The one way an email address is hashed (plan P14, E8; register `5.863`).
 *
 * The blind index of an address is `hmacHash` of the address trimmed and lower-cased. Erasure and
 * the daily orphan sweep match rows across tables by this value, so every writer and every lookup
 * must spell it the same way: they all call this function. The only other `hmacHash` calls hash a
 * hash (the unsubscribe token), never an address.
 *
 * Returns null where `hmacHash` does (no usable key in production or with a database configured,
 * 5.865): a caller refuses to write or skips the lookup, never falls back (5.824).
 */
import { hmacHash } from './encryption';

export function hashEmailAddress(email: string): string | null {
  return hmacHash(email.trim().toLowerCase());
}
