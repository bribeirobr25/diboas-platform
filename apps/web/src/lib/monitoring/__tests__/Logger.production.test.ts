/**
 * The Logger's half of "production keeps its error logs" (5.890) and the error sink (5.888).
 *
 * `src/test/setup.ts` mocks the Logger in every other file, so nothing exercised the real one:
 * changing `console.error` to `console.log` (which production builds strip) passed the whole
 * suite. Here the REAL Logger is loaded as a production build evaluates it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('@/lib/monitoring/Logger');

const captureException = vi.fn();
vi.mock('@sentry/nextjs', () => ({
  captureException: (...a: unknown[]) => captureException(...a),
}));

async function loadProductionLogger() {
  vi.stubEnv('NODE_ENV', 'production');
  vi.resetModules();
  return import('../Logger');
}

describe('the real Logger in production', () => {
  let error: ReturnType<typeof vi.spyOn>;
  let warn: ReturnType<typeof vi.spyOn>;
  let log: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    captureException.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should print errors with console.error and warnings with console.warn when the build is production', async () => {
    const { Logger } = await loadProductionLogger();
    Logger.error('purge failed', { table: 'audit_logs' });
    Logger.critical('database down', {});
    Logger.warn('slow response', {});
    expect(error).toHaveBeenCalledTimes(2);
    expect(String(error.mock.calls[0][0])).toContain('purge failed');
    expect(String(error.mock.calls[1][0])).toContain('database down');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(log).not.toHaveBeenCalled();
  });

  it('should redact emails, IPs and token URLs in the message when it is printed', async () => {
    const { Logger } = await loadProductionLogger();
    Logger.error('no row for ana@example.com from 203.0.113.7', {});
    const printed = String(error.mock.calls[0][0]);
    expect(printed).not.toContain('ana@example.com');
    expect(printed).not.toContain('203.0.113.7');
  });

  it('should hand ERROR and CRITICAL entries, and only those, to the sink when one is connected', async () => {
    const { Logger, LogLevel } = await loadProductionLogger();
    const sink = vi.fn();
    Logger.setErrorSink(sink);
    Logger.warn('a warning', {});
    Logger.info('an info', {});
    Logger.error('an error', { email: 'ana@example.com' });
    Logger.critical('a critical', {});
    expect(sink).toHaveBeenCalledTimes(2);
    expect(sink.mock.calls[0][0]).toMatchObject({
      level: LogLevel.ERROR,
      message: 'an error',
      context: { email: '[REDACTED]' },
    });
    expect(sink.mock.calls[1][0]).toMatchObject({ level: LogLevel.CRITICAL });
    Logger.setErrorSink(undefined);
    Logger.error('after disconnect', {});
    expect(sink).toHaveBeenCalledTimes(2);
  });

  it('should never let a failing sink break the caller', async () => {
    const { Logger } = await loadProductionLogger();
    Logger.setErrorSink(() => {
      throw new Error('tracker down');
    });
    expect(() => Logger.error('still logged', {})).not.toThrow();
    expect(error).toHaveBeenCalledTimes(1);
    Logger.setErrorSink(undefined);
  });
});

describe('serverErrorSink (5.888)', () => {
  beforeEach(() => captureException.mockReset());

  it('should send a logged error to Sentry with its own Error, the level and the redacted context', async () => {
    vi.resetModules();
    const { Logger, LogLevel } = await import('../Logger');
    const { connectServerErrorSink } = await import('../serverErrorSink');
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    connectServerErrorSink();
    const cause = new Error('connect ETIMEDOUT');
    Logger.error('[cron/purge-audit-logs] purge failed', { email: 'ana@example.com' }, cause);
    Logger.critical('database down', {});
    expect(captureException).toHaveBeenCalledTimes(2);
    const [sent, options] = captureException.mock.calls[0] as [Error, Record<string, unknown>];
    expect(sent).toBe(cause);
    expect(options).toMatchObject({
      level: 'error',
      tags: { source: 'logger' },
      extra: {
        logMessage: '[cron/purge-audit-logs] purge failed',
        context: { email: '[REDACTED]' },
      },
    });
    const [synthetic, critical] = captureException.mock.calls[1] as [Error, { level: string }];
    expect(synthetic.message).toBe('database down');
    expect(critical.level).toBe('fatal');
    expect(LogLevel.CRITICAL).toBeGreaterThan(LogLevel.ERROR);
    Logger.setErrorSink(undefined);
  });
});
