/**
 * WaitlistApplicationService
 *
 * Domain-Driven Design: Application service that orchestrates the three
 * waitlist flows — signup, GDPR deletion request, GDPR deletion confirmation —
 * behind discriminated-result methods. API route handlers become thin HTTP
 * adapters that:
 *   1. Run HTTP-layer concerns (CSRF, rate limit, idempotency, validation)
 *   2. Pack a typed input
 *   3. Delegate to this service
 *   4. Map the discriminated result to an HTTP response
 *
 * The service itself trusts that the route has already validated and
 * normalized inputs (email shape, locale shape, etc.); its only checks are
 * minimal preconditions for domain operations (presence of email, GDPR flag).
 *
 * Phase 2 M4 (audit/2026-05-08): wired into both routes; no longer dead code.
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
  deleteByEmail,
  checkEmailOptOut,
  resetEmailOptOut,
  getFoundingMemberCount,
  type WaitlistSource,
  type WaitlistTier,
} from '@/lib/waitingList/store';
import { Logger } from '@/lib/monitoring/Logger';
import { logAuditEvent } from '@/lib/audit/AuditService';
import { logGdprDeletion } from '@/lib/audit/GdprDeletionLogger';
import { sendEmailAsync } from '@/lib/email/sendEmail';
import { buildUnsubscribeUrls } from '@/lib/email/unsubscribeUrl';
import { hmacHash, encrypt, decrypt } from '@/lib/security/encryption';
import { generateDeletionToken, hashToken } from '@/lib/security';
import { sql } from '@/lib/database/client';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';
import { DuplicateEntryError } from '@/lib/errors/domainErrors';

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

interface AuditContext {
  /** From `x-request-id` header, set by middleware */
  correlationId?: string;
  /** From `x-forwarded-for` header (first hop) */
  actorIp?: string;
  /** From `user-agent` header */
  actorUserAgent?: string;
}

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

export interface SubmitSignupInput extends AuditContext {
  /** Pre-validated, lowercased + trimmed by the caller. */
  email: string;
  name?: string;
  /** Pre-validated locale code; defaults to 'en' inside the service. */
  locale?: string;
  gdprAccepted: boolean;
  referredBy?: string;
  source?: WaitlistSource;
  tags?: string[];
  /** Country detected from CDN geo-IP headers; pure passthrough. */
  country?: string;
}

export interface SubmitSignupSuccess {
  ok: true;
  data: {
    position: number;
    referralCode: string;
    referralUrl: string;
    tier: WaitlistTier;
  };
}

export type SubmitSignupError =
  | { ok: false; code: 'EMAIL_REQUIRED' }
  | { ok: false; code: 'CONSENT_REQUIRED' }
  | { ok: false; code: 'PROCESSING_ERROR'; cause?: unknown }
  | { ok: false; code: 'SERVER_ERROR'; cause?: unknown };

export type SubmitSignupResult = SubmitSignupSuccess | SubmitSignupError;

// ---------------------------------------------------------------------------
// Deletion — request + confirmation
// ---------------------------------------------------------------------------

const DELETION_TOKEN_TTL_MS = 15 * 60 * 1000;

export interface RequestDeletionInput extends AuditContext {
  /** Pre-validated, lowercased + trimmed by the caller. */
  email: string;
}

export type RequestDeletionResult =
  | { ok: true; entryExists: boolean }
  | { ok: false; code: 'SERVER_ERROR'; cause?: unknown };

export interface ConfirmDeletionInput extends AuditContext {
  token: string;
}

export type ConfirmDeletionResult =
  | { ok: true; deleted: boolean }
  | { ok: false; code: 'INVALID_TOKEN' }
  | { ok: false; code: 'SERVER_ERROR'; cause?: unknown };

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class WaitlistApplicationService {
  // -------------------------------------------------------------------------
  // Signup
  // -------------------------------------------------------------------------

  async submitSignup(input: SubmitSignupInput): Promise<SubmitSignupResult> {
    if (!input.email) return { ok: false, code: 'EMAIL_REQUIRED' };
    if (!input.gdprAccepted) return { ok: false, code: 'CONSENT_REQUIRED' };

    const locale = input.locale || 'en';

    try {
      // --- Existing email — return same shape to prevent enumeration -----
      if (await exists(input.email)) {
        const existing = await getByEmail(input.email);
        if (existing) {
          await this.handleResubscribe(existing.id, input.email, locale);
          const referralUrl = generateReferralUrl(
            REFERRAL_CONFIG.referralBaseUrl,
            existing.referralCode
          );
          return {
            ok: true,
            data: {
              position: existing.position,
              referralCode: existing.referralCode,
              referralUrl,
              tier: existing.tier,
            },
          };
        }
      }

      // --- Referral validation ------------------------------------------
      let referredBy: string | undefined;
      if (input.referredBy && isValidReferralCode(input.referredBy, REFERRAL_CONFIG.codePrefix)) {
        referredBy = input.referredBy.toUpperCase();
      }

      // --- Insert the new entry -----------------------------------------
      const referralCode = generateReferralCode(
        REFERRAL_CONFIG.codePrefix,
        REFERRAL_CONFIG.codeLength
      );

      const entry = await addEntry({
        email: input.email,
        name: input.name ? sanitizeUserName(input.name) : undefined,
        referralCode,
        referredBy,
        locale,
        source: input.source || (referredBy ? 'referral' : 'direct'),
        tags: input.tags || [],
        country: input.country,
      });

      // --- Audit + observability -----------------------------------------
      logAuditEvent({
        eventType: 'waitlist.signup',
        entityType: 'waitlist_entry',
        entityId: String(entry.id),
        actorIp: input.actorIp,
        actorUserAgent: input.actorUserAgent,
        correlationId: input.correlationId,
        details: {
          locale,
          source: input.source || 'direct',
          hasReferral: !!referredBy,
        },
      });

      // --- Referrer credit + notification --------------------------------
      // Inline-awaited to preserve the original route's behaviour. The
      // outer try/catch funnels any failure here into SERVER_ERROR — same
      // as before the M4 refactor. `sendEmailAsync` itself is internally
      // fire-and-forget, so the email send never blocks the response.
      if (referredBy) {
        await this.creditReferrer(referredBy, locale);
      }

      const referralUrl = generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, referralCode);

      // --- Welcome email (opt-out aware, awaited check) ------------------
      // Same pattern as the original route: opt-out check is awaited
      // inline; the email send itself is internally fire-and-forget.
      const welcomeName = input.name ? sanitizeUserName(input.name) : undefined;
      const emailHash = hmacHash(input.email);
      const isOptedOut = emailHash ? await checkEmailOptOut(emailHash) : false;
      if (!isOptedOut) {
        const unsubUrls = buildUnsubscribeUrls(input.email, locale);
        sendEmailAsync({
          method: 'sendWelcome',
          recipient: input.email,
          template: 'welcome',
          subject: 'Welcome to diBoaS',
          locale,
          data: {
            position: entry.position,
            referralCode,
            referralUrl,
            locale,
            name: welcomeName,
            tier: entry.tier,
            unsubscribeUrl: unsubUrls?.pageUrl,
            unsubscribeApiUrl: unsubUrls?.apiUrl,
          },
          enrichData: async () => {
            const foundingMember = await getFoundingMemberCount();
            return {
              foundingMemberSpotsRemaining: Math.max(0, foundingMember.cap - foundingMember.count),
            };
          },
        });
      }

      // --- Domain event for analytics + audit trail ---------------------
      applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_COMPLETED, {
        domain: 'waitlist',
        source: 'waitlist',
        timestamp: Date.now(),
        correlationId: input.correlationId,
        submissionId: entry.id,
        locale,
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
          position: entry.position,
          referralCode: entry.referralCode,
          referralUrl,
          tier: entry.tier,
        },
      };
    } catch (error) {
      Logger.error(
        'WaitlistApplicationService.submitSignup failed',
        {},
        error instanceof Error ? error : undefined
      );

      applicationEventBus.emit(ApplicationEventType.WAITLIST_SIGNUP_FAILED, {
        domain: 'waitlist',
        source: 'waitlist',
        timestamp: Date.now(),
        correlationId: input.correlationId,
        metadata: {
          errorType: error instanceof DuplicateEntryError ? 'duplicate' : 'unknown',
        },
      });

      if (error instanceof DuplicateEntryError) {
        return { ok: false, code: 'PROCESSING_ERROR', cause: error };
      }
      return { ok: false, code: 'SERVER_ERROR', cause: error };
    }
  }

  // -------------------------------------------------------------------------
  // Deletion — request
  // -------------------------------------------------------------------------

  async requestDeletion(input: RequestDeletionInput): Promise<RequestDeletionResult> {
    try {
      const entry = await getByEmail(input.email);

      if (!entry) {
        // Anti-enumeration: route adds artificial delay; service simply
        // reports that no entry was found.
        return { ok: true, entryExists: false };
      }

      // Generate + persist token (15 min TTL, encrypted email at rest).
      const token = generateDeletionToken();
      const tokenHash = hashToken(token);
      await this.persistDeletionToken(tokenHash, input.email);

      Logger.info('[GDPR] Deletion requested for email, token generated');

      logAuditEvent({
        eventType: 'gdpr.deletion.request',
        entityType: 'waitlist_entry',
        actorIp: input.actorIp,
        actorUserAgent: input.actorUserAgent,
        correlationId: input.correlationId,
      });

      applicationEventBus.emit(ApplicationEventType.WAITLIST_DELETION_REQUESTED, {
        domain: 'waitlist',
        source: 'waitlist',
        timestamp: Date.now(),
        correlationId: input.correlationId,
        reason: 'user_request',
        metadata: { tokenExpiry: Date.now() + DELETION_TOKEN_TTL_MS },
      });

      const locale = entry.locale || 'en';
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://diboas.com';
      const confirmationUrl = `${baseUrl}/${locale}/delete-confirm?token=${token}`;

      sendEmailAsync({
        method: 'sendDeletionConfirmation',
        recipient: input.email,
        template: 'deletion-confirmation',
        subject: 'Confirm deletion request',
        locale,
        data: {
          locale,
          confirmationUrl,
          expiresInMinutes: 15,
          name: entry.name,
        },
      });

      return { ok: true, entryExists: true };
    } catch (error) {
      Logger.error('[GDPR] Deletion request error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { ok: false, code: 'SERVER_ERROR', cause: error };
    }
  }

  // -------------------------------------------------------------------------
  // Deletion — confirmation
  // -------------------------------------------------------------------------

  async confirmDeletion(input: ConfirmDeletionInput): Promise<ConfirmDeletionResult> {
    try {
      const found = await this.consumeDeletionToken(input.token);
      if (!found) return { ok: false, code: 'INVALID_TOKEN' };

      // Capture entry before deletion for the completion email.
      const entryBefore = await getByEmail(found.email);
      const locale = entryBefore?.locale || 'en';
      const name = entryBefore?.name;

      const deleted = await deleteByEmail(found.email);

      if (deleted) {
        Logger.info('[GDPR] Data deleted successfully');

        logAuditEvent({
          eventType: 'gdpr.deletion.completed',
          entityType: 'waitlist_entry',
          actorIp: input.actorIp,
          actorUserAgent: input.actorUserAgent,
          correlationId: input.correlationId,
          details: { method: 'token_confirmation' },
        });

        logGdprDeletion({
          entityType: 'waitlist_entry',
          deletedBy: 'user_request',
          reason: 'gdpr_article_17',
          correlationId: input.correlationId,
          metadata: { method: 'token_confirmation' },
        });

        applicationEventBus.emit(ApplicationEventType.WAITLIST_DELETION_COMPLETED, {
          domain: 'waitlist',
          source: 'waitlist',
          timestamp: Date.now(),
          correlationId: input.correlationId,
          reason: 'gdpr',
          metadata: { method: 'token_confirmation' },
        });

        sendEmailAsync({
          method: 'sendDeletionComplete',
          recipient: found.email,
          template: 'deletion-complete',
          subject: 'Data deleted',
          locale,
          data: { locale, name },
        });
      }

      return { ok: true, deleted };
    } catch (error) {
      Logger.error('[GDPR] Deletion confirmation error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { ok: false, code: 'SERVER_ERROR', cause: error };
    }
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async handleResubscribe(entryId: string, email: string, locale: string): Promise<void> {
    const hash = hmacHash(email);
    if (!hash) return;
    const wasOptedOut = await checkEmailOptOut(hash);
    if (!wasOptedOut) return;
    const didReset = await resetEmailOptOut(hash);
    if (!didReset) return;
    logAuditEvent({
      eventType: 'EMAIL_RESUBSCRIBED',
      entityType: 'waitlist_entry',
      entityId: entryId,
      details: { method: 'waitlist_re_signup', locale },
    });
  }

  /**
   * Look up the referrer, increment their invite count, and queue the
   * referral-success email. Awaited by `submitSignup()` so any failure
   * surfaces through the outer try/catch — matches the pre-M4 route's
   * behaviour exactly. The email send itself is internally fire-and-forget.
   */
  private async creditReferrer(referredBy: string, locale: string): Promise<void> {
    const referrer = await getByReferralCode(referredBy);
    if (!referrer) return;

    const updatedReferrer = await processReferral(referrer.email);
    if (!updatedReferrer) return;

    const referrerHash = hmacHash(referrer.email);
    const referrerOptedOut = referrerHash ? await checkEmailOptOut(referrerHash) : false;
    if (referrerOptedOut) return;

    const referrerLocale = updatedReferrer.locale || referrer.locale || locale;
    const referrerUnsubUrls = buildUnsubscribeUrls(referrer.email, referrerLocale);

    sendEmailAsync({
      method: 'sendReferralSuccess',
      recipient: referrer.email,
      template: 'referral-success',
      subject: 'Someone used your invite!',
      locale: referrerLocale,
      data: {
        locale: referrerLocale,
        name: updatedReferrer.name,
        referralCount: updatedReferrer.referralCount,
        tier: updatedReferrer.tier,
        invitesRemaining: Math.max(0, 5 - updatedReferrer.referralCount),
        referralCode: referrer.referralCode,
        referralUrl: generateReferralUrl(REFERRAL_CONFIG.referralBaseUrl, referrer.referralCode),
        unsubscribeUrl: referrerUnsubUrls?.pageUrl,
        unsubscribeApiUrl: referrerUnsubUrls?.apiUrl,
      },
    });
  }

  private async persistDeletionToken(tokenHash: string, email: string): Promise<void> {
    const expiresAt = new Date(Date.now() + DELETION_TOKEN_TTL_MS).toISOString();
    const emailEnc = encrypt(email) || email;
    const emailHmac = hmacHash(email.toLowerCase().trim()) || '';

    await sql`
      INSERT INTO deletion_tokens (token_hash, email, email_hash, expires_at)
      VALUES (${tokenHash}, ${emailEnc}, ${emailHmac}, ${expiresAt})
      ON CONFLICT (token_hash) DO UPDATE SET
        email = ${emailEnc},
        email_hash = ${emailHmac},
        expires_at = ${expiresAt}
    `;
  }

  /**
   * Atomic find-and-delete: two concurrent requests with the same token
   * see only one RETURNING row. Probabilistically reaps expired tokens.
   */
  private async consumeDeletionToken(token: string): Promise<{ email: string } | null> {
    if (Math.random() < 0.1) {
      await sql`DELETE FROM deletion_tokens WHERE expires_at < NOW()`;
    }

    const tokenHash = hashToken(token);
    const rows = await sql`
      DELETE FROM deletion_tokens
      WHERE token_hash = ${tokenHash}
        AND expires_at > NOW()
      RETURNING email
    `;

    if (rows.length === 0) return null;
    const row = rows[0] as Record<string, unknown> | undefined;
    const emailValue = typeof row?.email === 'string' ? row.email : null;
    if (!emailValue) return null;

    // Decrypt email; fall back to plaintext for pre-migration rows.
    const decrypted = decrypt(emailValue) || emailValue;
    return { email: decrypted };
  }
}

/** Singleton instance */
export const waitlistApplicationService = new WaitlistApplicationService();
