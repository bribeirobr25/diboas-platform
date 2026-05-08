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
 *                               updateEntry, addTags, deleteByEmail
 *   - `store/referral.ts`    — processReferral
 *   - `store/stats.ts`       — counters, totals, opt-out, clearStore
 *
 * Call sites continue to import `from '@/lib/waitingList/store'`; this
 * barrel preserves the original public surface unchanged.
 */

export type {
  WaitlistEntry,
  WaitlistTier,
  WaitlistSource,
  AddEntryInput,
} from './store/types';

export {
  getAllEntries,
  getByEmail,
  getById,
  getByReferralCode,
  exists,
  addEntry,
  updateEntry,
  addTags,
  deleteByEmail,
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
