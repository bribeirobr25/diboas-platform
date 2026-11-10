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

function loadConfig(nodeEnv: string): { compiler?: CompilerConfig } {
  vi.stubEnv('NODE_ENV', nodeEnv);
  delete require.cache[require.resolve(CONFIG_PATH)];
  return require(CONFIG_PATH) as { compiler?: CompilerConfig };
}

afterEach(() => {
  vi.unstubAllEnvs();
  delete require.cache[require.resolve(CONFIG_PATH)];
});

describe('production keeps error and warning logs (5.876)', () => {
  it('should keep console.error and console.warn when the build is production', () => {
    const removeConsole = loadConfig('production').compiler?.removeConsole;
    expect(removeConsole, 'production must not strip every console call').not.toBe(true);
    expect(typeof removeConsole).toBe('object');
    const exclude = (removeConsole as { exclude?: string[] }).exclude ?? [];
    expect(exclude).toEqual(expect.arrayContaining(['error', 'warn']));
  });

  it('should strip nothing when the build is not production', () => {
    expect(loadConfig('development').compiler?.removeConsole).toBe(false);
  });
});
