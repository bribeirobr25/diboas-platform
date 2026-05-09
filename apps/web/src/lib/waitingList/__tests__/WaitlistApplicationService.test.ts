/**
 * WaitlistApplicationService — contract tests
 *
 * Phase 2 M4 (audit/2026-05-08): the route-level tests in
 * `app/api/waitlist/__tests__/signup.test.ts` already cover the signup path
 * transitively (the route delegates to the service, so any signup-flow break
 * is caught there). These tests pin the two new methods that don't yet have
 * a route-level test of their own:
 *
 *   - requestDeletion(): GDPR Art.17 step 1 — token issuance
 *   - confirmDeletion(): GDPR Art.17 step 2 — token consumption + erasure
 */

import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { WaitlistApplicationService } from '../WaitlistApplicationService';

// ---- Mocks ---------------------------------------------------------------

vi.mock('@/lib/waitingList/store', () => ({
  addEntry: vi.fn(),
  exists: vi.fn(),
  getByEmail: vi.fn(),
  getByReferralCode: vi.fn(),
  processReferral: vi.fn(),
  deleteByEmail: vi.fn(),
  checkEmailOptOut: vi.fn().mockResolvedValue(false),
  resetEmailOptOut: vi.fn().mockResolvedValue(false),
  getFoundingMemberCount: vi.fn().mockResolvedValue({ count: 100, cap: 1200 }),
}));

vi.mock('@/lib/security', () => ({
  generateDeletionToken: vi.fn().mockReturnValue('test-token-abc'),
  hashToken: vi.fn().mockImplementation((t: string) => `hashed:${t}`),
}));

vi.mock('@/lib/security/encryption', () => ({
  hmacHash: vi.fn().mockReturnValue('test-hmac-hash'),
  encrypt: vi.fn((v: string) => `enc:${v}`),
  decrypt: vi.fn((v: string) => v.replace(/^enc:/, '')),
}));

vi.mock('@/lib/database/client', () => ({
  sql: vi.fn(),
}));

vi.mock('@/lib/audit/AuditService', () => ({
  logAuditEvent: vi.fn(),
}));

vi.mock('@/lib/audit/GdprDeletionLogger', () => ({
  logGdprDeletion: vi.fn(),
}));

vi.mock('@/lib/email/sendEmail', () => ({
  sendEmailAsync: vi.fn(),
}));

vi.mock('@/lib/email/unsubscribeUrl', () => ({
  buildUnsubscribeUrls: vi.fn().mockReturnValue({
    pageUrl: 'https://diboas.com/en/email-preferences',
    apiUrl: 'https://diboas.com/api/email/unsubscribe',
  }),
}));

vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/events/ApplicationEventBus', () => ({
  applicationEventBus: { emit: vi.fn() },
  ApplicationEventType: {
    WAITLIST_DELETION_REQUESTED: 'WAITLIST_DELETION_REQUESTED',
    WAITLIST_DELETION_COMPLETED: 'WAITLIST_DELETION_COMPLETED',
    WAITLIST_SIGNUP_COMPLETED: 'WAITLIST_SIGNUP_COMPLETED',
    WAITLIST_SIGNUP_FAILED: 'WAITLIST_SIGNUP_FAILED',
  },
}));

// ---- Imports of mocked modules (after vi.mock declarations) -------------

import * as store from '@/lib/waitingList/store';
import * as audit from '@/lib/audit/AuditService';
import * as gdpr from '@/lib/audit/GdprDeletionLogger';
import * as emailModule from '@/lib/email/sendEmail';
import * as eventBus from '@/lib/events/ApplicationEventBus';
import { sql } from '@/lib/database/client';

const mockedSql = sql as unknown as Mock;

// ---- Tests ---------------------------------------------------------------

describe('WaitlistApplicationService.requestDeletion', () => {
  let service: WaitlistApplicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WaitlistApplicationService();
  });

  it('returns entryExists=false when the email has no entry', async () => {
    (store.getByEmail as Mock).mockResolvedValue(undefined);

    const result = await service.requestDeletion({
      email: 'noone@example.com',
      correlationId: 'req-1',
    });

    expect(result).toEqual({ ok: true, entryExists: false });
    expect(mockedSql).not.toHaveBeenCalled();
    expect(emailModule.sendEmailAsync).not.toHaveBeenCalled();
  });

  it('issues a token, persists it, audits, and emails when the entry exists', async () => {
    (store.getByEmail as Mock).mockResolvedValue({
      id: 'wl_1',
      email: 'user@example.com',
      locale: 'pt-BR',
      name: 'User',
    });
    mockedSql.mockResolvedValue([]);

    const result = await service.requestDeletion({
      email: 'user@example.com',
      correlationId: 'req-2',
      actorIp: '1.2.3.4',
      actorUserAgent: 'TestUA',
    });

    expect(result).toEqual({ ok: true, entryExists: true });

    // Token persisted
    expect(mockedSql).toHaveBeenCalled();

    // Audit + event emitted
    expect(audit.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'gdpr.deletion.request',
        correlationId: 'req-2',
        actorIp: '1.2.3.4',
        actorUserAgent: 'TestUA',
      }),
    );
    expect(eventBus.applicationEventBus.emit).toHaveBeenCalledWith(
      'WAITLIST_DELETION_REQUESTED',
      expect.objectContaining({
        domain: 'waitlist',
        correlationId: 'req-2',
        reason: 'user_request',
      }),
    );

    // Confirmation email queued with locale + token in URL
    expect(emailModule.sendEmailAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'sendDeletionConfirmation',
        recipient: 'user@example.com',
        locale: 'pt-BR',
        data: expect.objectContaining({
          confirmationUrl: expect.stringContaining('token=test-token-abc'),
          locale: 'pt-BR',
        }),
      }),
    );
  });

  it('returns SERVER_ERROR with the cause when the store throws', async () => {
    const err = new Error('db down');
    (store.getByEmail as Mock).mockRejectedValue(err);

    const result = await service.requestDeletion({
      email: 'user@example.com',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('SERVER_ERROR');
      expect(result.cause).toBe(err);
    }
  });
});

describe('WaitlistApplicationService.confirmDeletion', () => {
  let service: WaitlistApplicationService;
  let randomSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset SQL mock between tests so leftover `mockResolvedValueOnce`
    // queues from prior tests don't pollute the next one.
    mockedSql.mockReset();
    vi.clearAllMocks();
    // Pin Math.random above the 0.1 cleanup threshold for determinism.
    randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.5);
    service = new WaitlistApplicationService();
  });

  afterEach(() => {
    randomSpy.mockRestore();
  });

  it('returns INVALID_TOKEN when no row is consumed', async () => {
    // Math.random is pinned > 0.1 in beforeEach, so cleanup is skipped and
    // the only sql() call is the DELETE…RETURNING (returning empty).
    mockedSql.mockResolvedValue([]);

    const result = await service.confirmDeletion({ token: 'bogus' });

    expect(result).toEqual({ ok: false, code: 'INVALID_TOKEN' });
    expect(store.deleteByEmail).not.toHaveBeenCalled();
  });

  it('deletes, audits, GDPR-logs, emits event, and emails on a valid token', async () => {
    // Cleanup is skipped (Math.random pinned), so the first sql call is
    // the DELETE…RETURNING that returns the encrypted email row.
    mockedSql.mockResolvedValue([{ email: 'enc:user@example.com' }]);
    (store.getByEmail as Mock).mockResolvedValue({
      id: 'wl_1',
      email: 'user@example.com',
      locale: 'de',
      name: 'Hans',
    });
    (store.deleteByEmail as Mock).mockResolvedValue(true);

    const result = await service.confirmDeletion({
      token: 'valid-token',
      correlationId: 'req-3',
    });

    expect(result).toEqual({ ok: true, deleted: true });

    expect(store.deleteByEmail).toHaveBeenCalledWith('user@example.com');

    expect(audit.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'gdpr.deletion.completed',
        correlationId: 'req-3',
      }),
    );
    expect(gdpr.logGdprDeletion).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedBy: 'user_request',
        reason: 'gdpr_article_17',
        correlationId: 'req-3',
      }),
    );
    expect(eventBus.applicationEventBus.emit).toHaveBeenCalledWith(
      'WAITLIST_DELETION_COMPLETED',
      expect.objectContaining({ domain: 'waitlist', correlationId: 'req-3' }),
    );

    expect(emailModule.sendEmailAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'sendDeletionComplete',
        recipient: 'user@example.com',
        locale: 'de',
        data: expect.objectContaining({ name: 'Hans' }),
      }),
    );
  });

  it('returns deleted=false when the row was already gone (race) but still ok', async () => {
    mockedSql.mockResolvedValue([{ email: 'enc:user@example.com' }]);
    (store.getByEmail as Mock).mockResolvedValue(undefined);
    (store.deleteByEmail as Mock).mockResolvedValue(false);

    const result = await service.confirmDeletion({ token: 'valid' });

    expect(result).toEqual({ ok: true, deleted: false });
    // No completion side effects fired when nothing was actually deleted.
    expect(audit.logAuditEvent).not.toHaveBeenCalled();
    expect(gdpr.logGdprDeletion).not.toHaveBeenCalled();
    expect(emailModule.sendEmailAsync).not.toHaveBeenCalled();
  });

  it('returns SERVER_ERROR when the database throws', async () => {
    const err = new Error('db down');
    mockedSql.mockRejectedValue(err);

    const result = await service.confirmDeletion({ token: 'valid' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('SERVER_ERROR');
    }
  });
});
