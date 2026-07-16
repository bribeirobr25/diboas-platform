/**
 * verifyHuman (BotID 5.22 Stage-1 wrapper) — security utility, 100% coverage rule.
 *
 * Contract under test:
 *  - human/bot verdicts map through verbatim;
 *  - ANY provider failure fails OPEN (`unavailable`, isBot:false) — a bot-check
 *    outage must never take down signup;
 *  - log-only stage: the function never throws.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const checkBotIdMock = vi.fn();
vi.mock('botid/server', () => ({
  checkBotId: (...args: unknown[]) => checkBotIdMock(...args),
}));

import { classifyRequest } from '../verifyHuman';

describe('classifyRequest', () => {
  beforeEach(() => {
    checkBotIdMock.mockReset();
  });

  it('should classify as human when the provider verdict is isBot=false', async () => {
    checkBotIdMock.mockResolvedValue({ isBot: false });
    const result = await classifyRequest('test-surface');
    expect(result).toEqual({ classification: 'human', isBot: false });
  });

  it('should classify as bot when the provider verdict is isBot=true', async () => {
    checkBotIdMock.mockResolvedValue({ isBot: true });
    const result = await classifyRequest('test-surface');
    expect(result).toEqual({ classification: 'bot', isBot: true });
  });

  it('should fail OPEN as unavailable when the provider throws', async () => {
    checkBotIdMock.mockRejectedValue(new Error('no vercel context'));
    const result = await classifyRequest('test-surface');
    expect(result).toEqual({ classification: 'unavailable', isBot: false });
  });

  it('should fail OPEN as unavailable on a non-Error rejection', async () => {
    checkBotIdMock.mockRejectedValue('string failure');
    const result = await classifyRequest('test-surface');
    expect(result).toEqual({ classification: 'unavailable', isBot: false });
  });

  it('should never throw regardless of provider behavior', async () => {
    checkBotIdMock.mockImplementation(() => {
      throw new Error('sync explosion');
    });
    await expect(classifyRequest('test-surface')).resolves.toMatchObject({
      classification: 'unavailable',
    });
  });
});
