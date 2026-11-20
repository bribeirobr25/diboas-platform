/**
 * Waitlist store — public barrel.
 *
 * Phase 3.2.a (audit/2026-05-08): split from a 573-LoC monolith into
 * focused sub-modules under `store/`:
 *
 *   - `store/types.ts`       — domain types + INVITE_LIMIT constant
 *   - `store/internals.ts`   — shared row helpers, hashing, optimistic-update,
 *                               lazy event emitter (NOT re-exported)
 *   - `store/repository.ts`  — entry CRUD: get*, exists, addEntry,
 *                               updateEntry, addTags
 *   - `store/referral.ts`    — processReferral
 *   - `store/stats.ts`       — counters, totals, opt-out, clearStore
 *
 * Call sites continue to import `from '@/lib/waitingList/store'`; this
 * barrel preserves the original public surface unchanged. One exception: the source
 * list and the request shape (`WAITLIST_SOURCES`, `WaitlistSignupBody`) are imported from
 * `store/types` directly, which has no imports, so client code and tests that mock this
 * barrel read the real list (plan P11, D2).
 */

export type { WaitlistEntry, WaitlistTier, WaitlistSource, AddEntryInput } from './store/types';

export {
  getAllEntries,
  getByEmail,
  getById,
  getByReferralCode,
  exists,
  addEntry,
  updateEntry,
  addTags,
} from './store/repository';

export { processReferral } from './store/referral';

export {
  getFoundingMemberCount,
  getCurrentPositionCounter,
  getTotalCount,
  getDistinctCountryCount,
  checkEmailOptOut,
  resetEmailOptOut,
  clearStore,
} from './store/stats';
