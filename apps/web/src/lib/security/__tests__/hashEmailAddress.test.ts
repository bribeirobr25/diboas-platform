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
  }
);
