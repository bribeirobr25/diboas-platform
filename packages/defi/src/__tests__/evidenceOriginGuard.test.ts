import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Structural guards — the two rules that would otherwise be tribal knowledge.
 *
 * Both exist because a comment cannot stop a future caller, and both fail the
 * build rather than a review.
 */

const SRC = join(__dirname, '..');

/** Every `.ts` under `packages/defi/src` that is NOT a test. */
function productionFiles(dir: string = SRC, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== '__tests__') productionFiles(full, acc);
      continue;
    }
    if (entry.endsWith('.ts') && entry !== 'testing.ts') acc.push(full);
  }
  return acc;
}

describe('EXTERNAL SOURCE ≠ OBSERVED — production may not use the fixture helper', () => {
  it('should find production files to scan (the instrument is not vacuous)', () => {
    /* A guard whose corpus is empty passes while asserting nothing — the exact
       failure `5.134`/`checkExports` were raised for. Prove the scan sees the
       real modules before trusting its verdict. */
    const files = productionFiles();
    expect(files.length).toBeGreaterThan(5);
    expect(files.some((f) => f.endsWith('types.ts'))).toBe(true);
    expect(files.some((f) => f.includes('providers'))).toBe(true);
  });

  it('should have NO production reference to observedStamp', () => {
    /**
     * `observedStamp` bakes `origin: 'OBSERVED'` into its name. In a fixture
     * that is an explicit statement; in production it would be a semantic
     * default, and silence-means-observed is what the explicit-origin contract
     * exists to prevent. Production uses `evidenceStamp`, where `origin` is a
     * required argument.
     *
     * Sabotage: reintroduce `observedStamp(` into any non-test module and this
     * fails, naming the file.
     */
    const offenders = productionFiles().filter((f) =>
      /\bobservedStamp\b/.test(readFileSync(f, 'utf8'))
    );
    expect(offenders.map((f) => f.replace(SRC, ''))).toEqual([]);
  });

  it('should stamp every production provider reading with an EXPLICIT origin', () => {
    /* The positive half: the four production stamping sites each name their
       origin at the call site rather than inheriting one. */
    for (const provider of ['providers/defillama.ts', 'providers/coingecko.ts']) {
      const src = readFileSync(join(SRC, provider), 'utf8');
      const stamps = src.match(/evidenceStamp\(\{[\s\S]*?\}\)/g) ?? [];
      expect(stamps.length, provider).toBeGreaterThan(0);
      for (const call of stamps) expect(call, provider).toMatch(/origin:\s*'/);
    }
  });
});
