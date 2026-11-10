/**
 * 5.865 (founder rulings 2026-11-10): a wrong-length encryption key raises a FATAL Sentry event
 * once per server start, and the site stays up. The first version printed a console line, which
 * production builds strip (next.config.js removeConsole), so nobody would have seen it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const captureMessage = vi.fn();
vi.mock('@sentry/nextjs', () => ({ captureMessage: (...a: unknown[]) => captureMessage(...a) }));
vi.mock('../../sentry.server.config', () => ({}));
vi.mock('../../sentry.edge.config', () => ({}));
const malformedKeyProblems = vi.fn<() => string[]>();
vi.mock('@/config/env', () => ({ malformedKeyProblems: () => malformedKeyProblems() }));

describe('register() · the malformed-key alert (5.865)', () => {
  beforeEach(() => {
    vi.resetModules();
    captureMessage.mockReset();
    malformedKeyProblems.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should send one FATAL Sentry event naming every problem on the server runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    malformedKeyProblems.mockReturnValue(['ENCRYPTION_KEY must decode to 32 bytes', 'HMAC_KEY x']);
    const { register } = await import('../instrumentation');
    await register();
    expect(captureMessage).toHaveBeenCalledTimes(1);
    expect(captureMessage).toHaveBeenCalledWith(
      'Malformed production secret: ENCRYPTION_KEY must decode to 32 bytes; HMAC_KEY x',
      'fatal'
    );
  });

  it('should send nothing when the keys are well formed', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    malformedKeyProblems.mockReturnValue([]);
    const { register } = await import('../instrumentation');
    await register();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('should not turn a missing secret into a startup crash', async () => {
    vi.doMock('@/config/env', () => {
      throw new Error('Missing required production environment variables: HMAC_KEY');
    });
    const { alertOnMalformedKeys } = await import('../instrumentation');
    await expect(alertOnMalformedKeys()).resolves.toBeUndefined();
    expect(captureMessage).not.toHaveBeenCalled();
    vi.doUnmock('@/config/env');
  });

  it('should not check on the edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    malformedKeyProblems.mockReturnValue(['ENCRYPTION_KEY must decode to 32 bytes']);
    const { register } = await import('../instrumentation');
    await register();
    expect(captureMessage).not.toHaveBeenCalled();
  });
});
