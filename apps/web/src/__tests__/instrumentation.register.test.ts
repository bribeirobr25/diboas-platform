/**
 * register() on the server and edge runtimes.
 *
 * 5.865 (founder rulings 2026-11-10): a wrong-length encryption key raises ONE FATAL Sentry event
 * per server start, and the site stays up. The event is flushed at once (5.891): a function frozen
 * after a cold start may never send a queued one.
 * 5.888: both runtimes connect the Logger's error sink, so errors a route catches reach Sentry.
 *
 * Fourteenth audit (5.889): the missing-secret case used to `vi.doUnmock('@/config/env')`, which
 * also removed this file's top-level mock, so every later case loaded the real env.ts and passed
 * whatever the code did; under a shuffled order one case failed. Every case now keeps the one
 * module mock and only changes what the mocked function does.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const captureMessage = vi.fn();
const flush = vi.fn(async () => true);
vi.mock('@sentry/nextjs', () => ({
  captureMessage: (...a: unknown[]) => captureMessage(...a),
  flush: (...a: unknown[]) => flush(...(a as [])),
}));
vi.mock('../../sentry.server.config', () => ({}));
vi.mock('../../sentry.edge.config', () => ({}));
const connectServerErrorSink = vi.fn();
vi.mock('@/lib/monitoring/serverErrorSink', () => ({
  connectServerErrorSink: () => connectServerErrorSink(),
}));
const malformedKeyProblems = vi.fn<() => string[]>();
vi.mock('@/config/env', () => ({ malformedKeyProblems: () => malformedKeyProblems() }));

describe('register() · the malformed-key alert (5.865) and the error sink (5.888)', () => {
  beforeEach(() => {
    vi.resetModules();
    captureMessage.mockReset();
    flush.mockClear();
    connectServerErrorSink.mockReset();
    malformedKeyProblems.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should send one FATAL Sentry event naming every problem, then flush, on the server runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    malformedKeyProblems.mockReturnValue(['ENCRYPTION_KEY must decode to 32 bytes', 'HMAC_KEY x']);
    const { register } = await import('../instrumentation');
    await register();
    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(captureMessage).toHaveBeenCalledWith(
      'Malformed production secret: ENCRYPTION_KEY must decode to 32 bytes; HMAC_KEY x',
      'fatal'
    );
    expect(flush).toHaveBeenCalledTimes(1);
    expect(flush.mock.invocationCallOrder[0]).toBeGreaterThan(
      captureMessage.mock.invocationCallOrder[0]
    );
  });

  it('should send nothing when the keys are well formed', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    malformedKeyProblems.mockReturnValue([]);
    const { register } = await import('../instrumentation');
    await register();
    expect(malformedKeyProblems).toHaveBeenCalledTimes(1);
    expect(captureMessage).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
  });

  it('should not turn a missing secret into a startup crash', async () => {
    malformedKeyProblems.mockImplementation(() => {
      throw new Error('Missing required production environment variables: HMAC_KEY');
    });
    const { alertOnMalformedKeys } = await import('../instrumentation');
    await expect(alertOnMalformedKeys()).resolves.toBeUndefined();
    expect(malformedKeyProblems).toHaveBeenCalledTimes(1);
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('should not check the keys on the edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    malformedKeyProblems.mockReturnValue(['ENCRYPTION_KEY must decode to 32 bytes']);
    const { register } = await import('../instrumentation');
    await register();
    expect(malformedKeyProblems).not.toHaveBeenCalled();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it.each(['nodejs', 'edge'])(
    'should connect the Logger error sink on the %s runtime',
    async (runtime) => {
      vi.stubEnv('NEXT_RUNTIME', runtime);
      malformedKeyProblems.mockReturnValue([]);
      const { register } = await import('../instrumentation');
      await register();
      expect(connectServerErrorSink).toHaveBeenCalledTimes(1);
    }
  );
});
