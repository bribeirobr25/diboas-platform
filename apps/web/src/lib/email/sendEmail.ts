/**
 * Shared sendEmail utility
 *
 * Wraps email sending in a non-blocking fire-and-forget pattern.
 * Failures are logged but never propagated to the caller.
 *
 * Usage:
 *   sendEmailAsync('welcome', recipientEmail, data, locale);
 *
 * This eliminates duplicated fire-and-forget boilerplate across routes.
 */

import { Logger } from '@/lib/monitoring/Logger';
import { logEmailDelivery } from '@/lib/email/deliveryLogger';
import { CircuitBreaker } from '@/lib/utils/CircuitBreaker';
type EmailServiceMethod =
  | 'sendWelcome'
  | 'sendReferralSuccess'
  | 'sendDeletionConfirmation'
  | 'sendDeletionComplete';

/** Type-safe accessor for email service methods that accept (to, data) args */
type EmailSendFn = (
  email: string,
  payload: Record<string, unknown>
) => Promise<{ success: boolean; messageId?: string; error?: string }>;

/** Circuit breaker for the Resend API — opens after 3 consecutive failures, resets after 60s */
const resendCircuit = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 60_000 });

/**
 * Determine whether an email service error is a client error (4xx) that should NOT be retried.
 * Network errors and 5xx server errors are retryable.
 */
function isClientError(error: unknown): boolean {
  if (error instanceof Error) {
    // Resend SDK and fetch errors often include status codes in the message
    const match = error.message.match(/\b(4\d{2})\b/);
    if (match) return true;
  }
  return false;
}

/**
 * Call an async function with exponential-backoff retry.
 * Retries on 5xx / network errors only; 4xx errors are thrown immediately.
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry client errors (4xx)
      if (isClientError(error)) throw error;

      if (attempt === maxAttempts) throw error;
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
      Logger.warn(`[Email] Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`, {
        error: error instanceof Error ? error.message : String(error),
      });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

interface SendEmailOptions {
  /** The email service method to call */
  method: EmailServiceMethod;
  /** Recipient email address */
  recipient: string;
  /** Template name for delivery logging */
  template: string;
  /** Email subject for delivery logging */
  subject: string;
  /** Locale for delivery logging */
  locale: string;
  /** Data payload passed to the email service method */
  data: Record<string, unknown>;
  /** Optional: additional setup before calling the method (e.g., fetching founding member count) */
  enrichData?: () => Promise<Record<string, unknown>>;
}

/**
 * Send an email asynchronously (fire-and-forget).
 *
 * The function returns void synchronously. The actual email sending
 * happens in a detached promise chain. Errors are caught and logged
 * but never thrown to the caller.
 */
export function sendEmailAsync(options: SendEmailOptions): void {
  const { method, recipient, template, subject, locale, data, enrichData } = options;

  const execute = async (): Promise<void> => {
    const { createEmailService, sendViaResend } = await import('@diboas/email');

    let finalData = data;
    if (enrichData) {
      const extra = await enrichData();
      finalData = { ...data, ...extra };
    }

    const emailService = createEmailService({ send: sendViaResend });
    const serviceFn = emailService[method] as unknown as EmailSendFn | undefined;

    if (!serviceFn) {
      Logger.error(`[Email] Unknown email service method: ${method}`);
      return;
    }

    const result = await resendCircuit.execute(() =>
      callWithRetry(() => serviceFn.call(emailService, recipient, finalData))
    );

    if (result.success) {
      Logger.info(`[Email] ${template} email sent`, { email: recipient });
    } else {
      Logger.error(`[Email] ${template} email failed`, { email: recipient, error: result.error });
    }

    logEmailDelivery({
      recipientEmail: recipient,
      template,
      subject,
      locale,
      providerId: result.messageId,
      status: result.success ? 'sent' : 'failed',
      errorMessage: result.error,
    });
  };

  execute().catch((err) => {
    Logger.error(
      `[Email] Failed to send ${template} email`,
      {},
      err instanceof Error ? err : undefined
    );
  });
}
