/**
 * InvestorRequestService — domain orchestration for investor-materials requests.
 *
 * The API route is a thin HTTP adapter; this service owns the domain flow:
 * precondition checks, duplicate detection, encrypted persistence, audit
 * logging, and the founder notification. Mirrors WaitlistApplicationService.
 */

import { Logger } from '@/lib/monitoring/Logger';
import { isEncryptionEnabled } from '@/lib/security/encryption';
import { logAuditEvent } from '@/lib/audit';
import { investorEmailExists, insertInvestorRequest } from './store';
import { notifyFounderOfInvestorRequest } from './notify';
import type { InvestorRequestInput, InvestorRequestResult } from './types';

class InvestorRequestService {
  async submit(
    input: InvestorRequestInput,
    actor?: { ip?: string; userAgent?: string }
  ): Promise<InvestorRequestResult> {
    if (!input.email) return { ok: false, code: 'EMAIL_REQUIRED' };
    // Fail closed — never persist unencrypted PII.
    if (!isEncryptionEnabled()) return { ok: false, code: 'ENCRYPTION_UNAVAILABLE' };

    try {
      // Duplicate (blind-index) — treated as success to prevent enumeration; no re-insert.
      if (await investorEmailExists(input.email)) {
        return { ok: true, duplicate: true };
      }

      const stored = await insertInvestorRequest(input);
      if (!stored) return { ok: false, code: 'ENCRYPTION_UNAVAILABLE' };

      // Audit trail (masked — no raw PII; same facility as GDPR-sensitive events).
      void logAuditEvent({
        eventType: 'investor_request.created',
        entityType: 'investor_request',
        correlationId: input.correlationId,
        actorIp: actor?.ip,
        actorUserAgent: actor?.userAgent,
        details: {
          investorType: input.investorType ?? null,
          locale: input.locale ?? null,
          country: input.country ?? null,
        },
      }).catch(() => {
        /* audit logging must never break the request path */
      });

      // Founder notification (fire-and-forget; PII-masked).
      notifyFounderOfInvestorRequest(input);

      return { ok: true, duplicate: false };
    } catch (error) {
      Logger.error('[investor] submit failed', {}, error instanceof Error ? error : undefined);
      return { ok: false, code: 'SERVER_ERROR', cause: error };
    }
  }
}

export const investorRequestService = new InvestorRequestService();
