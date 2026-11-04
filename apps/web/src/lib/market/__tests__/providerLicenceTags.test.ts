/**
 * SRC-TAG-1 (5.724). Every market-refresh provider stamps a `licence` value on
 * its provenance, and the pipeline publishes it in `computed.json`. The public
 * repository states no licence class for any source; the per-source terms are
 * recorded privately. A provider may therefore only stamp a value that states
 * nothing: `recorded-privately`, or FRED's `unverified` (5.307).
 *
 * Reads the provider sources, not `computed.json`: the published file changes
 * only when the weekly run rewrites it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const PROVIDERS = path.join(__dirname, '../../../../scripts/market-refresh/providers');
const ALLOWED = new Set(['recorded-privately', 'unverified']);

/** Every `licence` value a provider file stamps, literal or not. */
function licenceValues(source: string): string[] {
  return [...source.matchAll(/\blicence\s*:\s*([^,\n}]+)/g)].map((m) => m[1].trim());
}

describe('SRC-TAG-1 market provider licence tags state no licence class', () => {
  const files = fs.readdirSync(PROVIDERS).filter((f) => f.endsWith('.mjs'));

  it('should find the providers it guards', () => {
    expect(files).toEqual(
      expect.arrayContaining(['coingecko.mjs', 'fred.mjs', 'polygon.mjs', 'yahoo.mjs'])
    );
  });

  it.each(files)('should stamp only a neutral licence value in %s', (file) => {
    const values = licenceValues(fs.readFileSync(path.join(PROVIDERS, file), 'utf8'));
    for (const v of values)
      expect(ALLOWED.has(v.replace(/^'|'$/g, '')), `${file}: licence ${v}`).toBe(true);
  });

  it('should catch the tags this rule replaced, and a value that is not a literal', () => {
    for (const old of [
      "licence: 'quote-display',",
      "licence: 'attribution',",
      "licence: 'polygon-free-tier',",
      'licence: TERMS,',
    ]) {
      const [v] = licenceValues(old);
      expect(ALLOWED.has(v.replace(/^'|'$/g, '')), old).toBe(false);
    }
  });
});
