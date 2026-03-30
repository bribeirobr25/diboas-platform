/**
 * WaitlistApplicationService
 *
 * Domain-Driven Design: Application service that orchestrates the waitlist
 * signup flow. Encapsulates validation, store operations, referral processing,
 * founding member claim, and email sending behind a single submitSignup() call.
 *
 * The API route handler becomes a thin HTTP adapter that delegates here.
 *
 * Service Agnostic Abstraction: Email sending is loaded dynamically so the
 * service is not statically coupled to any email provider.
 */

import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';
import { sanitizeUserName } from '@/lib/utils/sanitize';
import {
  generateReferralCode,
  generateReferralUrl,
  isValidReferralCode,
} from '@/lib/waitingList/helpers';
import {
  addEntry,
  exists,
  getByEmail,
  getByReferralCode,
  processReferral,
  getFoundingMemberCount,
  type WaitlistSource,
  type WaitlistTier,
} from '@/lib/waitingList/store';
import { Logger } from '@/lib/monitoring/Logger';
import { logEmailDelivery } from '@/lib/email/deliveryLogger';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';
import { DuplicateEntryError } from '@/lib/errors/domainErrors';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SignupInput {
  email: string;
  name?: string;
  locale: string;
  gdprAccepted: boolean;
  referredBy?: string;
  source?: WaitlistSource;
  tags?: string[];
  country?: string;
}

export interface SignupResult {
  success: true;
  position: number;
  referralCode: string;
  referralUrl: string;
  tier: WaitlistTier;
}

export type SignupError =
  | { code: 'EMAIL_REQUIRED' }
  | { code: 'CONSENT_REQUIRED' }
  | { code: 'PROCESSING_ERROR' }
  | { code: 'SERVER_ERROR'; cause?: unknown };

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class WaitlistApplicationService {
  /**
   * Submit a new waitlist signup.
   *
   * Returns either a SignupResult on success or a SignupError on failure.
   * Handles duplicate detection, referral processing, and email dispatch.
   */
  async submitSignup(
    input: SignupInput,
  ): Promise<{ ok: true; data: SignupResult } | { ok: false; error: SignupError }> {
    try {
      // --- Validation ---
      if (!input.email) {
        return { ok: false, error: { code: 'EMAIL_REQUIRED' } };
      }

      if (!input.gdprAccepted) {
        return { ok: false, error: { code: 'CONSENT_REQUIRED' } };
      }

      // --- Duplicate check (anti-enumeration: return identical structure) ---
      if (await exists(input.email)) {
        const existing = await getByEmail(input.email);
        if (existing) {
          const referralUrl = generateReferralUrl(
            REFERRAL_CONFIG.referralBaseUrl,
            existing.referralCode,
          );
          return {
            ok: true,
            data: {
              success: true,
              position: existing.position,
              referralCode: existing.referralCode,
              referralUrl,
              tier: existing.tier,
            },
          };
        }
      }

      // --- Referral validation ---
      let referredBy: string | undefined;
      if (
        input.referredBy &&
        isValidReferralCode(input.referredBy, REFERRAL_CONFIG.codePrefix)
      ) {
        referredBy = input.referredBy.toUpperCase();
      }

      // --- Generate referral code ---
      const referralCode = generateReferralCode(
        REFERRAL_CONFIG.codePrefix,
        REFERRAL_CONFIG.codeLength,
      );

      // --- Add entry ---
      const entry = await addEntry({
        email: input.email,
        name: input.name ? sanitizeUserName(input.name) : undefined,
        referralCode,
        referredBy,
        locale: input.locale || 'en',
        source: input.source || (referredBy ? 'referral' : 'direct'),
        tags: input.tags || [],
        country: input.country,
      });

      // --- Referral processing (fire-and-forget) ---
      if (referredBy) {
        this.processReferralAsync(referredBy, input.locale || 'en');
      }

      const referralUrl = generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, referralCode);

      // --- Welcome email (fire-and-forget) ---
      this.sendWelcomeEmailAsync(input.email, {
        position: entry.position,
        referralCode,
        referralUrl,
        locale: input.locale || 'en',
        name: input.name ? sanitizeUserName(input.name) : undefined,
        tier: entry.tier,
      });

      // --- Analytics event ---
      applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, {
        source: 'waitlist',
        timestamp: Date.now(),
        submissionId: entry.id,
        locale: input.locale || 'en',
        hasName: !!input.name,
        referralCode: referredBy,
        metadata: {
          position: entry.position,
          hasReferral: !!referredBy,
          signupSource: input.source || (referredBy ? 'referral' : 'direct'),
        },
      });

      return {
        ok: true,
        data: {
          success: true,
          position: entry.position,
          referralCode: entry.referralCode,
          referralUrl,
          tier: entry.tier,
        },
      };
    } catch (error) {
      Logger.error('WaitlistApplicationService.submitSignup failed', {}, error instanceof Error ? error : undefined);

      applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_FAILED, {
        source: 'waitlist',
        timestamp: Date.now(),
        metadata: {
          errorType:
            error instanceof DuplicateEntryError
              ? 'duplicate'
              : 'unknown',
        },
      });

      if (error instanceof DuplicateEntryError) {
        return { ok: false, error: { code: 'PROCESSING_ERROR' } };
      }

      return { ok: false, error: { code: 'SERVER_ERROR', cause: error } };
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers — fire-and-forget async operations
  // -------------------------------------------------------------------------

  private processReferralAsync(referredBy: string, locale: string): void {
    getByReferralCode(referredBy)
      .then(async (referrer) => {
        if (!referrer) return;
        const updatedReferrer = await processReferral(referrer.email);
        if (!updatedReferrer) return;

        this.sendReferralNotificationAsync(referrer.email, {
          locale,
          name: updatedReferrer.name,
          referralCount: updatedReferrer.referralCount,
          tier: updatedReferrer.tier,
          invitesRemaining: Math.max(0, 5 - updatedReferrer.referralCount),
        });
      })
      .catch((err) => {
        Logger.error('[Referral] Processing error', {}, err instanceof Error ? err : undefined);
      });
  }

  private sendWelcomeEmailAsync(
    email: string,
    data: {
      position: number;
      referralCode: string;
      referralUrl: string;
      locale: string;
      name?: string;
      tier: string;
    },
  ): void {
    Promise.all([import('@diboas/email'), getFoundingMemberCount()])
      .then(async ([{ createEmailService, sendViaResend }, foundingMember]) => {
        try {
          const spotsRemaining = Math.max(0, foundingMember.cap - foundingMember.count);
          const emailService = createEmailService({ send: sendViaResend });
          const result = await emailService.sendWelcome(email, {
            position: data.position,
            referralCode: data.referralCode,
            referralUrl: data.referralUrl,
            locale: data.locale,
            name: data.name,
            tier: data.tier as 'founding_member' | 'early_member' | 'priority_waitlist' | 'standard',
            foundingMemberSpotsRemaining: spotsRemaining,
          });

          if (result.success) {
            Logger.info('[Email] Welcome email sent', { email });
          } else {
            Logger.error('[Email] Welcome email failed', { email, error: result.error });
          }

          logEmailDelivery({
            recipientEmail: email,
            template: 'welcome',
            subject: 'Welcome to diBoaS',
            locale: data.locale,
            providerId: result.messageId,
            status: result.success ? 'sent' : 'failed',
            errorMessage: result.error,
          });
        } catch (err) {
          Logger.error('[Email] Welcome email error', {}, err instanceof Error ? err : undefined);
        }
      })
      .catch((err) => {
        Logger.error('[Email] Failed to load email service', {}, err instanceof Error ? err : undefined);
      });
  }

  private sendReferralNotificationAsync(
    referrerEmail: string,
    data: {
      locale: string;
      name?: string;
      referralCount: number;
      tier: WaitlistTier;
      invitesRemaining: number;
    },
  ): void {
    import('@diboas/email')
      .then(async ({ createEmailService, sendViaResend }) => {
        try {
          const emailService = createEmailService({ send: sendViaResend });
          const result = await emailService.sendReferralSuccess(referrerEmail, {
            locale: data.locale,
            name: data.name,
            referralCount: data.referralCount,
            tier: data.tier as 'founding_member' | 'early_member' | 'priority_waitlist' | 'standard',
            invitesRemaining: data.invitesRemaining,
          });

          if (result.success) {
            Logger.info('[Email] Referral success email sent', { email: referrerEmail });
          } else {
            Logger.error('[Email] Referral success email failed', { email: referrerEmail, error: result.error });
          }

          logEmailDelivery({
            recipientEmail: referrerEmail,
            template: 'referral-success',
            subject: 'Someone used your invite!',
            locale: data.locale,
            providerId: result.messageId,
            status: result.success ? 'sent' : 'failed',
            errorMessage: result.error,
          });
        } catch (err) {
          Logger.error('[Email] Referral success email error', {}, err instanceof Error ? err : undefined);
        }
      })
      .catch((err) => {
        Logger.error('[Email] Failed to load email service for referral', {}, err instanceof Error ? err : undefined);
      });
  }
}

/** Singleton instance */
export const waitlistApplicationService = new WaitlistApplicationService();
