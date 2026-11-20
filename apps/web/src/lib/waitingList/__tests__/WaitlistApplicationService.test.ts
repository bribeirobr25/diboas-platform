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

// The real limiter is one in-memory window shared by every test (2 sends / 5 min per hash, and
// every test hashes to 'test-hmac-hash'), so tests reaching a send starved their neighbours.
vi.mock('@/lib/security/rateLimiter', () => ({
  checkOutboundEmailRateLimit: vi.fn().mockResolvedValue({ success: true, reset: 0 }),
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
import * as rateLimiter from '@/lib/security/rateLimiter';
import * as encryption from '@/lib/security/encryption';
import { EncryptionUnavailableError } from '@/lib/errors/domainErrors';

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

  /** 5.824: with no usable key (production), refuse; never store the email in clear. */
  it.each([
    ['encrypt has no key', () => (encryption.encrypt as Mock).mockReturnValueOnce(null)],
    ['the blind index has no key', () => (encryption.hmacHash as Mock).mockReturnValueOnce(null)],
  ])('should write nothing and send no email when %s', async (_label, arrange) => {
    (store.getByEmail as Mock).mockResolvedValue({
      id: 'wl_1',
      email: 'user@example.com',
      locale: 'en',
      name: 'User',
    });
    mockedSql.mockResolvedValue([]);
    arrange();

    const result = await service.requestDeletion({ email: 'user@example.com', correlationId: 'r' });

    expect(result).toMatchObject({ ok: false, code: 'SERVER_ERROR' });
    expect((result as { cause?: unknown }).cause).toBeInstanceOf(EncryptionUnavailableError);
    expect(mockedSql).not.toHaveBeenCalled();
    expect(emailModule.sendEmailAsync).not.toHaveBeenCalled();
  });

  /* twelfth audit: refusing only after the lookup answered 500 for a known email and 202 for
   * an unknown one — an existence oracle whenever the key is unusable. */
  it.each([
    ['an existing entry', { id: 'wl_1', email: 'user@example.com', locale: 'en' }],
    ['no entry', undefined],
  ])(
    'should refuse the same way, before any lookup, for %s when encryption is unavailable',
    async (_l, entry) => {
      (store.getByEmail as Mock).mockResolvedValue(entry);
      (encryption.encrypt as Mock).mockReturnValueOnce(null);

      const result = await service.requestDeletion({
        email: 'user@example.com',
        correlationId: 'r',
      });

      expect(result).toMatchObject({ ok: false, code: 'SERVER_ERROR' });
      expect(store.getByEmail).not.toHaveBeenCalled();
      expect(mockedSql).not.toHaveBeenCalled();
    }
  );

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
      })
    );
    expect(eventBus.applicationEventBus.emit).toHaveBeenCalledWith(
      'WAITLIST_DELETION_REQUESTED',
      expect.objectContaining({
        domain: 'waitlist',
        correlationId: 'req-2',
        reason: 'user_request',
      })
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
      })
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
  /*
   * ⛑ RETENTION-1 guards 4 and 5 at the service level (P14, E3′/E4): the link is consumed and the
   * person erased in one statement (PrivacyPersonErasureService, proven on Postgres in
   * lib/privacy/__tests__/erasure.pg.test.ts); this pins what the service does around it.
   */
  let service: WaitlistApplicationService;
  const erasure = {
    findLink: vi.fn(),
    consumeAndErase: vi.fn(),
    isErased: vi.fn(),
  };
  const LINK = { encryptedEmail: 'enc:user@example.com', emailHash: 'stored-hash' };
  const ENTRY = { id: 'wl_1', email: 'user@example.com', locale: 'de', name: 'Hans' };
  const ERASED = { consumed: true, entryId: 'wl_1', deliveryRows: 2, otherLinks: 1 };

  beforeEach(() => {
    mockedSql.mockReset();
    vi.clearAllMocks();
    erasure.findLink.mockReset().mockResolvedValue(LINK);
    erasure.consumeAndErase.mockReset().mockResolvedValue(ERASED);
    erasure.isErased.mockReset().mockResolvedValue(false);
    (store.getByEmail as Mock).mockResolvedValue(ENTRY);
    (encryption.hmacHash as Mock).mockReturnValue('test-hmac-hash');
    service = new WaitlistApplicationService(erasure as never);
  });

  const noCompletionEffects = () => {
    expect(audit.logAuditEvent).not.toHaveBeenCalled();
    expect(gdpr.logGdprDeletion).not.toHaveBeenCalled();
    expect(emailModule.sendEmailAsync).not.toHaveBeenCalled();
  };

  it('should answer INVALID_TOKEN and erase nothing when the link is not live', async () => {
    erasure.findLink.mockResolvedValue(null);
    expect(await service.confirmDeletion({ token: 'bogus' })).toEqual({
      ok: false,
      code: 'INVALID_TOKEN',
    });
    expect(erasure.consumeAndErase).not.toHaveBeenCalled();
    noCompletionEffects();
  });

  it('should answer INVALID_TOKEN when a concurrent request consumed the link first', async () => {
    erasure.consumeAndErase.mockResolvedValue({ ...ERASED, consumed: false, entryId: null });
    expect(await service.confirmDeletion({ token: 'tok' })).toEqual({
      ok: false,
      code: 'INVALID_TOKEN',
    });
    noCompletionEffects();
  });

  it('should erase by the link stored hash, audit, log, emit and email unrecorded when the link is valid', async () => {
    const result = await service.confirmDeletion({ token: 'valid-token', correlationId: 'req-3' });

    expect(result).toEqual({ ok: true, deleted: true });
    expect(erasure.consumeAndErase).toHaveBeenCalledWith('hashed:valid-token', 'stored-hash');
    expect(audit.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'gdpr.deletion.completed', correlationId: 'req-3' })
    );
    expect(gdpr.logGdprDeletion).toHaveBeenCalledWith(
      expect.objectContaining({ deletedBy: 'user_request', reason: 'gdpr_article_17' })
    );
    expect(eventBus.applicationEventBus.emit).toHaveBeenCalledWith(
      'WAITLIST_DELETION_COMPLETED',
      expect.objectContaining({ domain: 'waitlist', correlationId: 'req-3' })
    );
    expect(emailModule.sendEmailAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'sendDeletionComplete',
        recipient: 'user@example.com',
        template: 'deletion-complete',
        recordDelivery: false,
        locale: 'de',
        data: expect.objectContaining({ name: 'Hans' }),
      })
    );
  });

  it('should answer deleted=false with no completion effects when the person had no entry', async () => {
    erasure.consumeAndErase.mockResolvedValue({ ...ERASED, entryId: null });
    (store.getByEmail as Mock).mockResolvedValue(undefined);
    expect(await service.confirmDeletion({ token: 'valid' })).toEqual({ ok: true, deleted: false });
    noCompletionEffects();
  });

  it('should erase by the stored hash and send no email when the address cannot be decrypted', async () => {
    (encryption.decrypt as Mock).mockReturnValueOnce(null);
    const result = await service.confirmDeletion({ token: 'tok' });
    expect(result).toEqual({ ok: true, deleted: true });
    expect(erasure.consumeAndErase).toHaveBeenCalledWith('hashed:tok', 'stored-hash');
    expect(store.getByEmail).not.toHaveBeenCalled();
    expect(emailModule.sendEmailAsync).not.toHaveBeenCalled();
    // the ciphertext is never used as an address
    expect(JSON.stringify(vi.mocked(store.getByEmail).mock.calls)).not.toMatch(/enc:/);
  });

  it('should key a link written before its stored hash on the hash of its address', async () => {
    erasure.findLink.mockResolvedValue({ ...LINK, emailHash: null });
    await service.confirmDeletion({ token: 'tok' });
    expect(erasure.consumeAndErase).toHaveBeenCalledWith('hashed:tok', 'test-hmac-hash');
  });

  it('should keep the link and answer SERVER_ERROR when no hash can key the erasure', async () => {
    erasure.findLink.mockResolvedValue({ ...LINK, emailHash: null });
    (encryption.hmacHash as Mock).mockReturnValue(null);
    const result = await service.confirmDeletion({ token: 'tok' });
    expect(result).toMatchObject({ ok: false, code: 'SERVER_ERROR' });
    expect(erasure.consumeAndErase).not.toHaveBeenCalled();
  });

  /* Thirteenth audit: the per-address limiter used to ALLOW a send when the blind index was null,
   * so a refactor away from the earlier refusals would have switched off anti-bombing. */
  it('should send no email, never asking the limiter, when the blind index is unavailable', async () => {
    (encryption.hmacHash as Mock).mockReturnValue(null);
    const result = await service.confirmDeletion({ token: 'tok' });
    expect(result).toMatchObject({ ok: true, deleted: true });
    expect(rateLimiter.checkOutboundEmailRateLimit).not.toHaveBeenCalled();
    expect(emailModule.sendEmailAsync).not.toHaveBeenCalled();
  });

  it('should answer as completed, with every record and the email, when the statement committed after a reported failure', async () => {
    erasure.consumeAndErase.mockRejectedValue(new Error('Database query timed out after 8000ms'));
    erasure.isErased.mockResolvedValue(true);
    const result = await service.confirmDeletion({ token: 'tok', correlationId: 'req-9' });
    expect(result).toEqual({ ok: true, deleted: true });
    expect(erasure.isErased).toHaveBeenCalledWith('hashed:tok', 'stored-hash');
    expect(audit.logAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'gdpr.deletion.completed', correlationId: 'req-9' })
    );
    expect(gdpr.logGdprDeletion).toHaveBeenCalledTimes(1);
    expect(emailModule.sendEmailAsync).toHaveBeenCalledWith(
      expect.objectContaining({ template: 'deletion-complete', recordDelivery: false })
    );
  });

  it('should answer SERVER_ERROR, the link still live, when the statement did not commit', async () => {
    erasure.consumeAndErase.mockRejectedValue(new Error('Database query timed out after 8000ms'));
    erasure.isErased.mockResolvedValue(false);
    const result = await service.confirmDeletion({ token: 'tok' });
    expect(result).toMatchObject({ ok: false, code: 'SERVER_ERROR' });
    noCompletionEffects();
  });

  it('should not re-check, and answer SERVER_ERROR, when the person had no entry before', async () => {
    erasure.consumeAndErase.mockRejectedValue(new Error('db down'));
    (store.getByEmail as Mock).mockResolvedValue(undefined);
    const result = await service.confirmDeletion({ token: 'tok' });
    expect(result).toMatchObject({ ok: false, code: 'SERVER_ERROR' });
    expect(erasure.isErased).not.toHaveBeenCalled();
    noCompletionEffects();
  });

  it('should answer SERVER_ERROR when reading the link fails', async () => {
    erasure.findLink.mockRejectedValue(new Error('db down'));
    const result = await service.confirmDeletion({ token: 'tok' });
    expect(result).toMatchObject({ ok: false, code: 'SERVER_ERROR' });
  });
});
