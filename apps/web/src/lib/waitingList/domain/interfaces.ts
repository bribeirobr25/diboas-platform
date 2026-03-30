/**
 * Waitlist Repository Interface — Domain-Driven Design
 *
 * Defines the contract for waitlist data access, decoupled from
 * the concrete PostgreSQL implementation in `../store.ts`.
 *
 * Consumers depend on this interface; the store module is the
 * current (and only) implementation.
 */

import type { WaitlistEntry, WaitlistSource, WaitlistTier, AddEntryInput } from '../store';

export interface IWaitlistRepository {
  /** Insert a new waitlist entry. Throws DuplicateEntryError if email exists. */
  addEntry(input: AddEntryInput): Promise<WaitlistEntry>;

  /** Check whether an email is already registered. */
  exists(email: string): Promise<boolean>;

  /** Look up an entry by email. Returns undefined if not found. */
  getByEmail(email: string): Promise<WaitlistEntry | undefined>;

  /** Look up an entry by its unique referral code. */
  getByReferralCode(referralCode: string): Promise<WaitlistEntry | undefined>;

  /** Look up an entry by its ID. */
  getById(id: string): Promise<WaitlistEntry | undefined>;

  /** GDPR/LGPD deletion — permanently removes the entry. */
  deleteByEmail(email: string): Promise<boolean>;

  /**
   * Update mutable fields on an existing entry.
   * Supports optimistic locking via `currentVersion`.
   * Throws ConcurrencyConflictError on version mismatch.
   */
  updateEntry(
    email: string,
    updates: Partial<Omit<WaitlistEntry, 'id' | 'email' | 'originalPosition' | 'createdAt' | 'tier'>>,
    currentVersion?: number
  ): Promise<WaitlistEntry | undefined>;

  /**
   * Increment a referrer's invite count (founding/early members only, max 5).
   * Supports optimistic locking via `currentVersion`.
   */
  processReferral(
    referrerEmail: string,
    currentVersion?: number
  ): Promise<WaitlistEntry | undefined>;

  /** Return the current founding-member count and cap, optionally filtered by source audience. */
  getFoundingMemberCount(source?: WaitlistSource): Promise<{ count: number; cap: number }>;

  /** Return all entries ordered by position. */
  getAllEntries(): Promise<WaitlistEntry[]>;

  /** Return total signup count, optionally filtered by source. */
  getTotalCount(source?: WaitlistSource): Promise<number>;

  /** Return the number of distinct countries represented, optionally filtered by source. */
  getDistinctCountryCount(source?: WaitlistSource): Promise<number>;

  /** Append tags to an existing entry (de-duplicated). */
  addTags(email: string, newTags: string[]): Promise<WaitlistEntry | undefined>;
}

/** Re-export store types for convenience */
export type { WaitlistEntry, WaitlistSource, WaitlistTier, AddEntryInput };
