/**
 * The OG image routes record a failure instead of answering 500 from a bare catch (fourteenth
 * audit, 5.892).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '@/lib/monitoring/Logger';

const checkRateLimit = vi.fn();
vi.mock('@/lib/security/rateLimiter', () => ({
  checkRateLimit: (...a: unknown[]) => checkRateLimit(...a),
  getClientIP: () => '198.51.100.1',
  createRateLimitHeaders: () => ({}),
}));

describe('OG routes record their failures (5.892)', () => {
  beforeEach(() => {
    checkRateLimit.mockReset().mockRejectedValue(new Error('rate limiter down'));
  });

  it('should log and answer 500 when /api/og/[page] fails', async () => {
    const { GET } = await import('../[page]/route');
    const res = await GET(new Request('https://diboas.com/api/og/about'), {
      params: Promise.resolve({ page: 'about' }),
    });
    expect(res.status).toBe(500);
    expect(Logger.error).toHaveBeenCalledWith(
      '[og/[page]] OG image generation failed',
      {},
      expect.objectContaining({ message: 'rate limiter down' })
    );
  });

  it('should log and answer 500 when /api/og/share fails', async () => {
    const { GET } = await import('../share/route');
    const { NextRequest } = await import('next/server');
    const res = await GET(new NextRequest('https://diboas.com/api/og/share?type=calculator'));
    expect(res.status).toBe(500);
    expect(Logger.error).toHaveBeenCalledWith(
      '[og/share] OG image generation failed',
      {},
      expect.objectContaining({ message: 'rate limiter down' })
    );
  });
});
