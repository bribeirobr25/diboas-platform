/**
 * Waitlist Domain — Public API
 */

export type { IWaitlistRepository } from './interfaces';
export type { WaitlistEntry, WaitlistSource, WaitlistTier, AddEntryInput } from './interfaces';

// Re-export existing domain types
export {
  type WaitingListSubmission,
  type WaitlistPosition,
  type ReferralInfo,
  type ConsentRecord,
  type SubmissionInput,
  type SubmissionResult,
  type ExtendedSubmissionInput,
  type ValidationResult,
  type ValidationError,
  type WaitingListDomainService,
  type WaitingListEvent,
  type WaitingListEventType,
  type WaitingListConfiguration,
  type WaitingListRepository,
  WaitingListDomainError,
  WaitingListValidationError,
  WaitingListSubmissionError,
  WaitingListDuplicateError,
  WaitingListStorageError,
} from './WaitingListDomain';
