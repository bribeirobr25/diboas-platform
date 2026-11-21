/**
 * ⛑ RETENTION-1 guard 7 · one way to hash an address (plan P14, E8; register `5.863`).
 *
 * Erasure and the orphan sweep match rows across tables by the address's blind index, so every
 * site must spell it the same way. Every `hmacHash(` call in the website's source goes through
 * `hashEmailAddress`, except the two named calls that hash a hash (the unsubscribe token).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from '@diboas/test-support';
import { hashEmailAddress } from '../hashEmailAddress';
import { hmacHash } from '../encryption';

describe('RETENTION-1 guard 7 · hashEmailAddress', () => {
  it('should give two spellings of one address the same hash when they differ in case and spaces', () => {
    expect(hashEmailAddress('  Ana@Example.COM ')).toBe(hashEmailAddress('ana@example.com'));
    expect(hashEmailAddress('ana@example.com')).not.toBe(hashEmailAddress('bob@example.com'));
  });

  it('should equal the hash stored the old normalised way, so no stored hash changes', () => {
    expect(hashEmailAddress('Ana@Example.com')).toBe(hmacHash('ana@example.com'));
  });
});

/* A whole-tree source scan: its own timeout under coverage (COV-1, 5.1023). */
describe(
  'RETENTION-1 guard 7 · every address hash goes through one function',
  { timeout: 30_000 },
  () => {
    const SRC = join(__dirname, '../../..');
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const full = join(dir, e.name);
        if (e.isDirectory()) return e.name === '__tests__' ? [] : files(full);
        return /\.tsx?$/.test(e.name) && !/\.(test|stories)\./.test(e.name) ? [full] : [];
      });
    /** The two calls that hash a hash, never an address (the unsubscribe token). */
    const HASH_OF_HASH = [
      'app/api/email/unsubscribe/route.ts: hmacHash(emailHash)',
      'lib/email/unsubscribeUrl.ts: hmacHash(emailHash)',
    ];

    it('should find no hmacHash call outside the one function and the two named hash-of-hash calls', () => {
      const calls = files(SRC)
        .filter(
          (f) => !/lib\/security\/(encryption|hashEmailAddress)\.ts$/.test(f.split(sep).join('/'))
        )
        .flatMap((f) =>
          [...stripComments(readFileSync(f, 'utf8'), f).matchAll(/\bhmacHash\(([^)]*)\)/g)].map(
            (m) => `${relative(SRC, f).split(sep).join('/')}: hmacHash(${m[1]})`
          )
        );
      expect(calls.sort()).toEqual(HASH_OF_HASH);
    });

    /** Every file that imports hmacHash: the one function and the two hash-of-hash sites. */
    const IMPORTERS = [
      'app/api/email/unsubscribe/route.ts',
      'lib/email/unsubscribeUrl.ts',
      'lib/security/hashEmailAddress.ts',
    ];
    /** Imports hmacHash by name, aliased or not (P14 review: an alias hid a raw address hash). */
    const IMPORTS_HMAC =
      /import\s*\{[^}]*\bhmacHash\b[^}]*\}\s*from|import\(\s*['"][^'"]*encryption['"]/;

    it('should find hmacHash imported only where its calls are listed', () => {
      const importers = files(SRC)
        .filter((f) => IMPORTS_HMAC.test(stripComments(readFileSync(f, 'utf8'), f)))
        .map((f) => relative(SRC, f).split(sep).join('/'))
        .sort();
      expect(importers).toEqual(IMPORTERS);
    });

    it('should see an aliased or dynamic import of hmacHash (detector self-test)', () => {
      expect(IMPORTS_HMAC.test("import { hmacHash as blindIndex } from '../encryption';")).toBe(
        true
      );
      expect(IMPORTS_HMAC.test("const e = await import('@/lib/security/encryption');")).toBe(true);
      expect(IMPORTS_HMAC.test("import { encrypt } from '../encryption';")).toBe(false);
    });
  }
);
