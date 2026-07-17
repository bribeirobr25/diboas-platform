/**
 * Founder-notification contract: PII-masked body, Reply-To carries the
 * requester's address (the founder answers with a plain "Reply"), and the
 * fire-and-forget path never throws into the request.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const sendViaResendMock = vi.fn().mockResolvedValue({ success: true });
vi.mock('@diboas/email', () => ({
  sendViaResend: (...args: unknown[]) => sendViaResendMock(...args),
}));

import { notifyFounderOfInvestorRequest } from '../notify';

const INPUT = {
  email: 'jane.doe@fund.example',
  company: 'Fund Example',
  investorType: 'vc',
  ticketSize: '$100k',
  locale: 'en',
} as const;

async function flushDynamicImport(): Promise<void> {
  // notify fires the dynamic import without awaiting; drain the microtask queue.
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('notifyFounderOfInvestorRequest', () => {
  beforeEach(() => {
    sendViaResendMock.mockClear();
    vi.stubEnv('INVESTOR_NOTIFY_EMAIL', 'founder@diboas.com');
    vi.stubEnv('RESEND_API_KEY', 'test-key');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should set replyTo to the requester email when sending the notification', async () => {
    notifyFounderOfInvestorRequest(INPUT);
    await flushDynamicImport();

    expect(sendViaResendMock).toHaveBeenCalledTimes(1);
    const payload = sendViaResendMock.mock.calls[0][0];
    expect(payload.replyTo).toBe('jane.doe@fund.example');
    expect(payload.to).toBe('founder@diboas.com');
  });

  it('should keep the requester email masked in the body when notifying', async () => {
    notifyFounderOfInvestorRequest(INPUT);
    await flushDynamicImport();

    const payload = sendViaResendMock.mock.calls[0][0];
    expect(payload.text).toContain('ja***@fund.example');
    expect(payload.text).not.toContain('jane.doe@fund.example');
    expect(payload.html).not.toContain('jane.doe@fund.example');
  });

  it('should skip sending when the notify recipient is not configured', async () => {
    vi.stubEnv('INVESTOR_NOTIFY_EMAIL', '');
    notifyFounderOfInvestorRequest(INPUT);
    await flushDynamicImport();

    expect(sendViaResendMock).not.toHaveBeenCalled();
  });
});
