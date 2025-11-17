/**
 * Waiting List Domain Layer - Domain-Driven Design Implementation
 *
 * Domain Services: Waiting list specific business logic
 * Service Abstraction: Clean interfaces for waiting list operations
 * Error Handling: Resilient submission with validation and fallbacks
 * GDPR/LGPD/CCPA Compliance: Consent tracking with audit trail
 */

import { SupportedLocale } from '@diboas/i18n/server';

// Domain Entities
export interface WaitingListSubmission {
  readonly id: string;
  readonly email: string;
  readonly name?: string;
  readonly xAccount?: string;
  readonly consent: ConsentRecord;
  readonly locale: SupportedLocale;
  readonly submittedAt: Date;
  readonly source: SubmissionSource;
}

export type SubmissionSource = 'marketing_site' | 'app_intercept';

// Value Objects
export interface ConsentRecord {
  readonly gdprAccepted: boolean;
  readonly timestamp: Date;
  readonly consentVersion: string;
  readonly privacyPolicyVersion: string;
  readonly consentText: string;
}

export interface SubmissionInput {
  readonly email: string;
  readonly name?: string;
  readonly xAccount?: string;
  readonly gdprAccepted: boolean;
  readonly locale: SupportedLocale;
}

export interface SubmissionResult {
  readonly success: boolean;
  readonly id?: string;
  readonly error?: string;
  readonly isDuplicate?: boolean;
}

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: ValidationError[];
}

export interface ValidationError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

// Domain Services Interface (Service Agnostic Abstraction Layer)
export interface WaitingListDomainService {
  submitToWaitingList(input: SubmissionInput): Promise<SubmissionResult>;
  checkEmailExists(email: string): Promise<boolean>;
  validateInput(input: SubmissionInput): ValidationResult;
  sanitizeInput(input: SubmissionInput): SubmissionInput;
}

// Domain Events (Event-Driven Architecture)
export interface WaitingListEvent {
  readonly type: WaitingListEventType;
  readonly timestamp: Date;
  readonly data: Record<string, unknown>;
}

export type WaitingListEventType =
  | 'submission-created'
  | 'submission-failed'
  | 'email-validated'
  | 'consent-recorded'
  | 'duplicate-detected';

// Domain Errors
export class WaitingListDomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly recoverable: boolean = true
  ) {
    super(message);
    this.name = 'WaitingListDomainError';
  }
}

export class WaitingListValidationError extends WaitingListDomainError {
  constructor(
    message: string,
    public readonly validationErrors: ValidationError[]
  ) {
    super(message, 'VALIDATION_FAILED', true);
  }
}

export class WaitingListSubmissionError extends WaitingListDomainError {
  constructor(message: string, public readonly email: string) {
    super(message, 'SUBMISSION_FAILED', true);
  }
}

export class WaitingListDuplicateError extends WaitingListDomainError {
  constructor(public readonly email: string) {
    super(`Email ${email} already exists in waiting list`, 'DUPLICATE_EMAIL', false);
  }
}

export class WaitingListStorageError extends WaitingListDomainError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR', true);
  }
}

// Configuration
export interface WaitingListConfiguration {
  readonly consentVersion: string;
  readonly privacyPolicyVersion: string;
  readonly privacyPolicyUrl: string;
  readonly maxNameLength: number;
  readonly maxXAccountLength: number;
  readonly storageKey: string;
}

// Repository Interface (for future backend swap)
export interface WaitingListRepository {
  save(submission: WaitingListSubmission): Promise<SubmissionResult>;
  findByEmail(email: string): Promise<WaitingListSubmission | null>;
  exists(email: string): Promise<boolean>;
}
