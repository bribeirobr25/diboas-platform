/**
 * logEmailDelivery — the email delivery log (register 5.824).
 *
 * The recipient's address is stored only encrypted, with its blind index. With no usable key
 * (production misconfiguration) the row is skipped and the failure logged; the address is
 * never written in clear, and the logger never throws (fire-and-forget).
 */
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const mockSql = vi.fn();
vi.mock('@/lib/database/client', () => ({ sql: (...args: unknown[]) => mockSql(...args) }));
vi.mock('@/lib/security/encryption', () => ({
  encrypt: vi.fn((v: string) => `enc:${v}`),
  hmacHash: vi.fn(() => 'hash'),
}));
vi.mock('@/lib/monitoring/Logger', () => ({ Logger: { error: vi.fn() } }));

import { logEmailDelivery } from '../deliveryLogger';
import * as encryption from '@/lib/security/encryption';
import { Logger } from '@/lib/monitoring/Logger';

const INPUT = {
  recipientEmail: 'User@Example.com',
  template: 'welcome',
  subject: 'Hi',
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
