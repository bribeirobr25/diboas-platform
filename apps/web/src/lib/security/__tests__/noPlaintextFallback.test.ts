/**
 * 5.824 · NO PLAINTEXT FALLBACK FOR ENCRYPTED PII.
 *
 * `encrypt()` and `hmacHash()` return null in production when no usable key exists. Two writers
 * used `encrypt(x) || x` and `hmacHash(x) || ''`, which stored an email in clear (and under an
 * empty blind index) exactly then. Every writer must refuse instead (`EncryptionUnavailableError`,
 * as `store/repository.ts` does). This scans all web source, comments stripped by the parser.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';

const WEB_SRC = path.resolve(__dirname, '../../..');

/** A fallback after encrypt(...) or hmacHash(...): `||` or `??` straight after the call. */
const FALLBACK = /\b(?:encrypt|hmacHash)\([^()]*(?:\([^()]*\)[^()]*)*\)\s*(?:\|\||\?\?)/;

const sources = (): string[] =>
  (fs.readdirSync(WEB_SRC, { recursive: true }) as string[])
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/__tests__|\.test\.|\.stories\.|\.d\.ts$/.test(f))
    .map((f) => path.join(WEB_SRC, f));

describe('5.824 · no plaintext fallback for encrypted PII', () => {
  it('should recognise the fallback shapes it guards against (non-vacuity)', () => {
    for (const bad of [
      'const a = encrypt(email) || email;',
      'const b = hmacHash(email.toLowerCase().trim()) || "";',
      'const c = encrypt(x) ?? x;',
    ])
      expect(FALLBACK.test(bad), bad).toBe(true);
    expect(FALLBACK.test('const d = encrypt(email);')).toBe(false);
    expect(FALLBACK.test('if (!enc || !hash) throw new EncryptionUnavailableError();')).toBe(false);
  });

  it('should find no encrypt() or hmacHash() fallback anywhere in web source', () => {
    const files = sources();
    expect(files.length).toBeGreaterThan(100);
    const hits = files.flatMap((f) =>
      stripComments(fs.readFileSync(f, 'utf8'), f)
        .split('\n')
        .map((line, i) => (FALLBACK.test(line) ? `${path.relative(WEB_SRC, f)}:${i + 1}` : null))
        .filter((x): x is string => x !== null)
    );
    expect(hits).toEqual([]);
  });
});
