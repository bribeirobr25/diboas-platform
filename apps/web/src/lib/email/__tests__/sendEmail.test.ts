/**
 * ⛑ RETENTION-1 guard 5 · no record after erasure (plan P14, E4; register `5.863`).
 *
 * `sendEmailAsync` writes a delivery row only when its caller says so; `recordDelivery` is
 * required, so every call site states it. The deletion-complete email goes to a person already
 * erased and passes `false` (pinned in WaitlistApplicationService.test.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();
vi.mock('@diboas/email', () => ({
  createEmailService: () => ({ sendWelcome: send }),
  sendViaResend: vi.fn(),
}));
const logEmailDelivery = vi.fn();
vi.mock('@/lib/email/deliveryLogger', () => ({
  logEmailDelivery: (...a: unknown[]) => logEmailDelivery(...a),
}));
vi.mock('@/lib/monitoring/Logger', () => ({
  Logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { sendEmailAsync } from '../sendEmail';

const settle = () => new Promise((r) => setTimeout(r, 20));
const BASE = {
  method: 'sendWelcome' as const,
  recipient: 'ana@example.com',
  template: 'welcome' as const,
  locale: 'en',
  data: {},
};

describe('RETENTION-1 guard 5 · sendEmailAsync records only when told to', () => {
  beforeEach(() => {
    send.mockReset();
    logEmailDelivery.mockReset();
  });

  it.each([
    ['sent', { success: true, messageId: 'm1' }],
    ['failed', { success: false, error: 'Mailbox ana@example.com rejected' }],
  ])(
    'should write no delivery row when recordDelivery is false and the send %s',
    async (_l, result) => {
      send.mockResolvedValue(result);
      sendEmailAsync({ ...BASE, recordDelivery: false });
      await settle();
      expect(send).toHaveBeenCalledTimes(1);
      expect(logEmailDelivery).not.toHaveBeenCalled();
    }
  );

  it('should record the outcome, never the provider text, when recordDelivery is true', async () => {
    send.mockResolvedValue({ success: false, error: 'Mailbox ana@example.com rejected' });
    sendEmailAsync({ ...BASE, recordDelivery: true });
    await settle();
    expect(logEmailDelivery).toHaveBeenCalledWith({
      recipientEmail: 'ana@example.com',
      template: 'welcome',
      locale: 'en',
      providerId: undefined,
      status: 'failed',
    });
    expect(JSON.stringify(logEmailDelivery.mock.calls)).not.toMatch(/rejected/);
  });

  it('should require every call site to state recordDelivery (type level)', () => {
    // @ts-expect-error recordDelivery is required
    const missing: Parameters<typeof sendEmailAsync>[0] = { ...BASE };
    expect(missing).toBeDefined();
  });
});
