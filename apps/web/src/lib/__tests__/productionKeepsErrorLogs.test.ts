/**
 * Production keeps its error and warning logs (register `5.876`).
 *
 * `compiler.removeConsole: true` stripped EVERY console call from production builds, so
 * `Logger.error`/`warn` printed nothing and the Vercel runtime logs stayed empty (thirteenth
 * audit, 2026-11-10). This reads the REAL `next.config.js` as a production build evaluates it,
 * so going back to stripping everything, or dropping `error` or `warn` from the exclusions,
 * fails here. Logger redacts context before it prints (`logRedactor`).
 */

import { createRequire } from 'node:module';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const CONFIG_PATH = join(__dirname, '../../../next.config.js');

interface CompilerConfig {
  removeConsole?: boolean | { exclude?: string[] };
}

function loadConfig(nodeEnv: string, sentryDsn = ''): { compiler?: CompilerConfig } {
  vi.stubEnv('NODE_ENV', nodeEnv);
  // With a DSN the config goes through withSentryConfig, the branch production builds take
  // (fourteenth audit, 5.890: the test only ever read the unwrapped branch).
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', sentryDsn);
  delete require.cache[require.resolve(CONFIG_PATH)];
  return require(CONFIG_PATH) as { compiler?: CompilerConfig };
}

afterEach(() => {
  vi.unstubAllEnvs();
  delete require.cache[require.resolve(CONFIG_PATH)];
});

/* 5.904: each case loads the real next.config.js as a production build evaluates it (3.0 s under
   a heavy parallel run, on the 5 s default; fifteenth audit B-5). */
describe('production keeps error and warning logs (5.876)', { timeout: 20_000 }, () => {
  it.each([
    ['without a Sentry DSN', ''],
    ['through withSentryConfig, as production builds', 'https://public@o0.ingest.sentry.io/0'],
  ])(
    'should keep console.error and console.warn when the build is production %s',
    (_label, dsn) => {
      const removeConsole = loadConfig('production', dsn).compiler?.removeConsole;
      expect(removeConsole, 'production must not strip every console call').not.toBe(true);
      expect(typeof removeConsole).toBe('object');
      const exclude = (removeConsole as { exclude?: string[] }).exclude ?? [];
      expect(exclude).toEqual(expect.arrayContaining(['error', 'warn']));
    }
  );

  it('should strip nothing when the build is not production', () => {
    expect(loadConfig('development').compiler?.removeConsole).toBe(false);
  });
});
