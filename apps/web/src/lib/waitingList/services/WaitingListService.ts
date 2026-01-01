/**
 * Waiting List Service - Service Layer Implementation
 *
 * Implements WaitingListDomainService interface
 * Currently uses LocalStorage, easily swappable to API
 * Includes validation, sanitization, and consent tracking
 */

import DOMPurify from 'dompurify';
import {
  WaitingListDomainService,
  SubmissionInput,
  SubmissionResult,
  ValidationResult,
  ValidationError,
  WaitingListSubmission,
  ConsentRecord,
  WaitingListValidationError,
  WaitingListDuplicateError,
  WaitingListStorageError,
  WaitingListRepository,
  WaitlistPosition,
} from '../domain/WaitingListDomain';
import {
  WAITING_LIST_CONFIG,
  VALIDATION_PATTERNS,
  ERROR_CODES,
  SANITIZATION_CONFIG,
} from '../constants';
import {
  generateSubmissionId,
  isValidEmail,
  isValidXAccount,
  isValidName,
  normalizeXAccount,
  createConsentTimestamp,
  isStorageAvailable,
  truncateString,
} from '../helpers';
import {
  errorReportingService,
  ErrorSeverity,
  ErrorCategory,
} from '@/lib/errors/ErrorReportingService';

// LocalStorage Repository Implementation
class LocalStorageRepository implements WaitingListRepository {
  private readonly storageKey: string;

  constructor(storageKey: string = WAITING_LIST_CONFIG.storageKey) {
    this.storageKey = storageKey;
  }

  async save(submission: WaitingListSubmission): Promise<SubmissionResult> {
    if (!isStorageAvailable()) {
      const storageError = new WaitingListStorageError('LocalStorage is not available');
      // P12: Report storage unavailable error
      errorReportingService.reportError(storageError, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.USER_INTERACTION,
        context: {
          customData: {
            operation: 'waiting_list_save',
            submissionId: submission.id,
          },
        },
        tags: ['waiting-list', 'storage', 'unavailable'],
      });
      throw storageError;
    }

    try {
      const existing = this.getAll();
      existing.push(submission);
      localStorage.setItem(this.storageKey, JSON.stringify(existing));
      return { success: true, id: submission.id };
    } catch (error) {
      const storageError = new WaitingListStorageError(
        `Failed to save submission: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      // P12: Report storage save error
      errorReportingService.reportError(storageError, {
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.USER_INTERACTION,
        context: {
          customData: {
            operation: 'waiting_list_save',
            submissionId: submission.id,
            originalError: error instanceof Error ? error.message : String(error),
          },
        },
        tags: ['waiting-list', 'storage', 'save-failed'],
      });
      throw storageError;
    }
  }

  async findByEmail(email: string): Promise<WaitingListSubmission | null> {
    const submissions = this.getAll();
    return submissions.find((s) => s.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async exists(email: string): Promise<boolean> {
    const submission = await this.findByEmail(email);
    return submission !== null;
  }

  // Position and referral methods - not fully supported in LocalStorage
  // These are handled by the in-memory store in API routes for pre-launch
  async getPosition(_email: string): Promise<WaitlistPosition | null> {
    // LocalStorage doesn't track positions - use API routes instead
    return null;
  }

  async findByReferralCode(_code: string): Promise<WaitingListSubmission | null> {
    // LocalStorage doesn't track referral codes - use API routes instead
    return null;
  }

  async updatePosition(_email: string, _newPosition: number): Promise<void> {
    // LocalStorage doesn't track positions - use API routes instead
  }

  async incrementReferralCount(_email: string): Promise<number> {
    // LocalStorage doesn't track referral counts - use API routes instead
    return 0;
  }

  private getAll(): WaitingListSubmission[] {
    if (!isStorageAvailable()) return [];
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}

export class WaitingListService implements WaitingListDomainService {
  private readonly repository: WaitingListRepository;
  private readonly config: typeof WAITING_LIST_CONFIG;
  private purify: typeof DOMPurify | null = null;

  constructor(
    repository?: WaitingListRepository,
    config: typeof WAITING_LIST_CONFIG = WAITING_LIST_CONFIG
  ) {
    this.repository = repository || new LocalStorageRepository(config.storageKey);
    this.config = config;

    // Initialize DOMPurify only on client side
    if (typeof window !== 'undefined') {
      this.purify = DOMPurify;
    }
  }

  async submitToWaitingList(input: SubmissionInput): Promise<SubmissionResult> {
    try {
      // 1. Validate input
      const validationResult = this.validateInput(input);
      if (!validationResult.isValid) {
        throw new WaitingListValidationError('Validation failed', validationResult.errors);
      }

      // 2. Sanitize input
      const sanitizedInput = this.sanitizeInput(input);

      // 3. Check for duplicates
      const exists = await this.checkEmailExists(sanitizedInput.email);
      if (exists) {
        throw new WaitingListDuplicateError(sanitizedInput.email);
      }

      // 4. Create consent record (GDPR/LGPD/CCPA compliance)
      const consentRecord: ConsentRecord = {
        gdprAccepted: sanitizedInput.gdprAccepted,
        timestamp: createConsentTimestamp(),
        consentVersion: this.config.consentVersion,
        privacyPolicyVersion: this.config.privacyPolicyVersion,
        consentText: this.getConsentText(sanitizedInput.locale),
      };

      // 5. Create submission entity
      const submission: WaitingListSubmission = {
        id: generateSubmissionId(),
        email: sanitizedInput.email.toLowerCase().trim(),
        name: sanitizedInput.name ? truncateString(sanitizedInput.name.trim(), this.config.maxNameLength) : undefined,
        xAccount: sanitizedInput.xAccount ? normalizeXAccount(sanitizedInput.xAccount) : undefined,
        consent: consentRecord,
        locale: sanitizedInput.locale,
        submittedAt: new Date(),
        source: 'marketing_site',
      };

      // 6. Persist submission
      const result = await this.repository.save(submission);

      return result;
    } catch (error) {
      // P12: Report unexpected errors (not validation or duplicate errors)
      if (
        !(error instanceof WaitingListValidationError) &&
        !(error instanceof WaitingListDuplicateError) &&
        !(error instanceof WaitingListStorageError)
      ) {
        const unexpectedError = error instanceof Error ? error : new Error(String(error));
        errorReportingService.reportError(unexpectedError, {
          severity: ErrorSeverity.CRITICAL,
          category: ErrorCategory.USER_INTERACTION,
          context: {
            customData: {
              operation: 'waiting_list_submission',
              locale: input.locale,
              hasName: !!input.name,
              hasXAccount: !!input.xAccount,
            },
          },
          tags: ['waiting-list', 'submission', 'unexpected-error'],
        });
      }
      throw error;
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    return this.repository.exists(email.toLowerCase().trim());
  }

  validateInput(input: SubmissionInput): ValidationResult {
    const errors: ValidationError[] = [];

    // Email validation (required)
    if (!input.email || input.email.trim() === '') {
      errors.push({
        field: 'email',
        code: 'EMAIL_REQUIRED',
        message: ERROR_CODES.EMAIL_REQUIRED,
      });
    } else if (!isValidEmail(input.email)) {
      errors.push({
        field: 'email',
        code: 'INVALID_EMAIL',
        message: ERROR_CODES.INVALID_EMAIL,
      });
    }

    // Name validation (optional)
    if (input.name && !isValidName(input.name)) {
      errors.push({
        field: 'name',
        code: 'INVALID_NAME',
        message: ERROR_CODES.INVALID_NAME,
      });
    }

    // X Account validation (optional)
    if (input.xAccount && !isValidXAccount(input.xAccount)) {
      errors.push({
        field: 'xAccount',
        code: 'INVALID_X_ACCOUNT',
        message: ERROR_CODES.INVALID_X_ACCOUNT,
      });
    }

    // Consent validation (required)
    if (!input.gdprAccepted) {
      errors.push({
        field: 'gdprAccepted',
        code: 'CONSENT_REQUIRED',
        message: ERROR_CODES.CONSENT_REQUIRED,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  sanitizeInput(input: SubmissionInput): SubmissionInput {
    const sanitize = (str: string): string => {
      if (!str) return str;
      // Use DOMPurify if available (client-side), otherwise basic sanitization
      if (this.purify) {
        return this.purify.sanitize(str, {
          ALLOWED_TAGS: SANITIZATION_CONFIG.ALLOWED_TAGS,
          ALLOWED_ATTR: SANITIZATION_CONFIG.ALLOWED_ATTR,
        });
      }
      // Server-side fallback: basic HTML entity encoding
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    return {
      email: sanitize(input.email.trim()),
      name: input.name ? sanitize(input.name.trim()) : undefined,
      xAccount: input.xAccount ? sanitize(input.xAccount.trim()) : undefined,
      gdprAccepted: input.gdprAccepted,
      locale: input.locale,
    };
  }

  private getConsentText(locale: string): string {
    // This text should match what's shown to the user in the UI
    // For audit trail compliance
    const consentTexts: Record<string, string> = {
      en: `I accept to receive communications from diBoaS and agree with the Privacy Policy (version ${this.config.privacyPolicyVersion})`,
      'pt-BR': `Aceito receber comunicações do diBoaS e concordo com a Política de Privacidade (versão ${this.config.privacyPolicyVersion})`,
      es: `Acepto recibir comunicaciones de diBoaS y estoy de acuerdo con la Política de Privacidad (versión ${this.config.privacyPolicyVersion})`,
      de: `Ich akzeptiere Mitteilungen von diBoaS zu erhalten und stimme der Datenschutzerklärung zu (Version ${this.config.privacyPolicyVersion})`,
    };

    return consentTexts[locale] || consentTexts.en;
  }
}

// Export singleton instance for convenience
export const waitingListService = new WaitingListService();
