/**
 * logEmailDelivery — the email delivery log (register 5.824).
 *
 * The recipient's address is stored only encrypted, with its blind index. With no usable key
 * (production misconfiguration) the row is skipped and the failure logged; the address is
 * never written in clear, and the logger never throws (fire-and-forget).
 *
 * ⛑ RETENTION-1 guard 6 (P14, E5; register `5.863`): a row holds no free text. A failed send
 * stores `provider_rejected`, the subject comes from the pinned set, and no metadata is written.
 */
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const mockSql = vi.fn();
vi.mock('@/lib/database/client', () => ({ sql: (...args: unknown[]) => mockSql(...args) }));
vi.mock('@/lib/security/encryption', () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
  hmacHash: vi.fn(() => 'hash'),
}));
vi.mock('@/lib/monitoring/Logger', () => ({ Logger: { error: vi.fn() } }));

import {
  DELIVERY_ERROR_CODES,
  DELIVERY_SUBJECTS,
  logEmailDelivery,
  type DeliveryTemplate,
} from '../deliveryLogger';
import * as encryption from '@/lib/security/encryption';
import { Logger } from '@/lib/monitoring/Logger';

const INPUT = {
  recipientEmail: 'User@Example.com',
  template: 'welcome' as const,
  locale: 'en',
  status: 'sent' as const,
};

/** Every value interpolated into the sql`` calls. */
const written = () => mockSql.mock.calls.flatMap((c) => c.slice(1));

beforeEach(() => {
  mockSql.mockReset().mockResolvedValue([]);
  (Logger.error as Mock).mockReset();
});

describe('logEmailDelivery', () => {
  it('should store the encrypted address and its blind index, never the clear address', async () => {
    await logEmailDelivery(INPUT);
    expect(written()).toContain('enc:User@Example.com');
    expect(written()).toContain('hash');
    expect(written()).not.toContain('User@Example.com');
  });

  it.each([
    ['encrypt has no key', () => (encryption.encrypt as Mock).mockReturnValueOnce(null)],
    ['the blind index has no key', () => (encryption.hmacHash as Mock).mockReturnValueOnce(null)],
  ])('should write no row and log the failure when %s (5.824)', async (_label, arrange) => {
    arrange();
    await expect(logEmailDelivery(INPUT)).resolves.toBeUndefined();
    expect(mockSql).not.toHaveBeenCalled();
    expect(Logger.error).toHaveBeenCalledTimes(1);
  });
});

describe('RETENTION-1 guard 6 · no free text in a delivery row (P14, E5)', () => {
  it('should store the code, never the provider text, when a send failed', async () => {
    await logEmailDelivery({ ...INPUT, status: 'failed', providerId: 'msg_1' });
    expect(written()).toContain('provider_rejected');
    // the only value carrying the address is its ciphertext (the mock prefixes `enc:`)
    expect(
      written().filter((v) => typeof v === 'string' && v.includes('@') && !v.startsWith('enc:'))
    ).toEqual([]);
  });

  it('should store no error code when a send succeeded', async () => {
    await logEmailDelivery(INPUT);
    expect(written()).not.toContain('provider_rejected');
    expect(written()).toContain(null);
  });

  it.each(Object.entries(DELIVERY_SUBJECTS))(
    'should record the pinned subject when the template is %s',
    async (template, subject) => {
      await logEmailDelivery({ ...INPUT, template: template as DeliveryTemplate });
      expect(written()).toContain(subject);
    }
  );

  it('should write no metadata column when it logs a row', async () => {
    await logEmailDelivery(INPUT);
    const statement = (mockSql.mock.calls[0]![0] as TemplateStringsArray).join('?');
    expect(statement).not.toMatch(/metadata/);
    expect(statement).toMatch(/error_message/);
  });

  it('should write no row when the template is outside the pinned set', async () => {
    // @ts-expect-error a template outside the set is refused at the type level too
    await logEmailDelivery({ ...INPUT, template: 'free-text-subject' });
    expect(mockSql).not.toHaveBeenCalled();
    expect(Logger.error).toHaveBeenCalledTimes(1);
  });

  it('should pin the four templates the website sends', () => {
    expect(Object.keys(DELIVERY_SUBJECTS).sort()).toEqual([
      'deletion-complete',
      'deletion-confirmation',
      'referral-success',
      'welcome',
    ]);
    expect([...DELIVERY_ERROR_CODES]).toEqual(['provider_rejected', 'legacy_redacted']);
  });
});
