import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CoinGeckoPriceProvider,
  DefiLlamaApyProvider,
  FallbackOnlyApyProvider,
  FallbackOnlyPriceProvider,
  FixtureGasProvider,
} from '@diboas/defi';
import {
  __resetMarketProviders,
  getApyProvider,
  getGasProvider,
  getPriceProvider,
} from '../factory';

/**
 * `5.414` — the market-provider seam is exercised, and its reset helper has a caller.
 *
 * ## The defect this exists to close
 *
 * The factory shipped with `__resetMarketProviders` exported and called by
 * NOTHING — one occurrence repo-wide, its own declaration — while
 * `apps/sandbox/src/lib/market/` contained no test file at all. The seam
 * introduced as the Pre-F step-3 deliverable was therefore itself unexercised,
 * and its cited precedent `__resetAuthProvider` *is* called by
 * `lib/auth/__tests__/authProvider.test.ts`, which sharpened the gap rather
 * than excusing it.
 *
 * ## Why no gate could see it
 *
 * `pnpm check:dead-code` runs `knip --exclude exports,nsExports,types,nsTypes,
 * duplicates`. An unused EXPORT is outside that run's vision by construction,
 * so its exit 0 was never evidence that nothing was orphaned. Same family as
 * the untranslated ratchet's `length > 3` and `TOK-1`'s attribute check: a
 * filter decides what can never be found.
 *
 * ## Why the classes are imported from `@diboas/defi`, never from source
 *
 * `instanceof` compares CLASS IDENTITY. The factory resolves `@diboas/defi`
 * through `package.json#main` → `dist/index.js` (tsup bundle). A test importing
 * the same classes from `packages/defi/src` would hold DIFFERENT class objects,
 * and every `toBeInstanceOf` below would fail for a reason having nothing to do
 * with the seam. Importing through the specifier the code under test actually
 * loads keeps one identity — the `5.413` hazard seen from the other side.
 *
 * ## What is deliberately never called
 *
 * Construction and identity only. `getCurrentApys` / `getPrices` default their
 * `fetchImpl` to the global `fetch` and would perform real network I/O, so they
 * are not invoked here. Construction itself is inert: both provider
 * constructors have empty bodies and default every parameter.
 */

const FACTORY = join(__dirname, '..', 'factory.ts');

/** Strip comments, so vocabulary quoted in prose is never read as code. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

beforeEach(() => {
  __resetMarketProviders();
});

describe('market provider factory — the selection seam (`5.243`)', () => {
  it('should resolve each port to the implementation the app currently uses', () => {
    /* Sabotage: rewire any port to a different class and this fails. The seam
       exists so that swapping a provider is an edit HERE and nowhere else —
       which is only true if what it returns is actually pinned. */
    expect(getApyProvider()).toBeInstanceOf(DefiLlamaApyProvider);
    expect(getPriceProvider()).toBeInstanceOf(CoinGeckoPriceProvider);
    expect(getGasProvider()).toBeInstanceOf(FixtureGasProvider);
  });

  it('should memoise ONE instance per port, so the ruled 6 h cache stays shared', () => {
    /* The TTL cache lives on the provider instance. A second instance would
       silently double the upstream request rate and halve the cache's effect —
       the exact regression the module-scope construction used to prevent by
       accident, and which the factory must now prevent on purpose. */
    expect(getApyProvider()).toBe(getApyProvider());
    expect(getPriceProvider()).toBe(getPriceProvider());
    expect(getGasProvider()).toBe(getGasProvider());
  });

  it('should drop every memoised instance when __resetMarketProviders() is called', () => {
    /* This is the assertion that gives the reset helper a caller at all. A
       no-op reset would leave the previous instances in place and let one
       test's provider state leak into the next. */
    const apy = getApyProvider();
    const price = getPriceProvider();
    const gas = getGasProvider();

    __resetMarketProviders();

    expect(getApyProvider()).not.toBe(apy);
    expect(getPriceProvider()).not.toBe(price);
    expect(getGasProvider()).not.toBe(gas);
  });

  it('should still return the right implementations after a reset', () => {
    __resetMarketProviders();
    expect(getApyProvider()).toBeInstanceOf(DefiLlamaApyProvider);
    expect(getPriceProvider()).toBeInstanceOf(CoinGeckoPriceProvider);
    expect(getGasProvider()).toBeInstanceOf(FixtureGasProvider);
  });
});

describe('PROVIDER SELECTION ≠ MODE SELECTION (canon 2026-09-18 §5)', () => {
  const body = code(readFileSync(FACTORY, 'utf8'));

  it('should leave real code to inspect, so this check can never be vacuous', () => {
    /* Without this, a stripper that accidentally removed EVERYTHING would make
       every assertion below pass against an empty string. */
    expect(body).toContain('getApyProvider');
    expect(body).toContain('new DefiLlamaApyProvider');
    expect(body).toContain('__resetMarketProviders');
  });

  it('should keep the mode vocabulary in prose only, never in code', () => {
    /* ⚑ The stripper is LOAD-BEARING, not decorative: factory.ts's own header
       comment contains "Practice/Real", "LedgerScope" and "mode" while stating
       that it reads none of them. Asserting against the raw file would fail on
       its own documentation. Sabotage both ways: add `process.env.LEDGER_MODE`
       to the code and this fails; remove the `code()` call and it fails too. */
    for (const token of ['LedgerScope', 'practice', 'mode']) {
      expect(new RegExp(`\\b${token}\\b`, 'i').test(body), token).toBe(false);
    }
  });
});

/**
 * THE KILL SWITCH, AT THE CONSTRUCTION SEAM.
 *
 * ⚑ THESE ASSERT THE CONSTRUCTED TYPE, not the returned data. A disabled source
 * and a failing network produce the same Product result, so asserting the
 * result would pass either way — the `5.438` failure mode. `instanceof` is the
 * only instrument that distinguishes "the adapter was never built" from "the
 * adapter was built and declined to call".
 */
describe('provider kill switch', () => {
  const ENV = 'MARKET_SOURCES_DISABLED';
  const original = process.env[ENV];

  beforeEach(() => {
    delete process.env[ENV];
    __resetMarketProviders();
  });

  afterEach(() => {
    if (original === undefined) delete process.env[ENV];
    else process.env[ENV] = original;
    __resetMarketProviders();
  });

  it('should build the real adapters when nothing is disabled', () => {
    expect(getApyProvider()).toBeInstanceOf(DefiLlamaApyProvider);
    expect(getPriceProvider()).toBeInstanceOf(CoinGeckoPriceProvider);
  });

  it('should NOT construct a disabled source adapter', () => {
    // Sabotage A. The object holding the endpoint, fetch impl and timeout is
    // never created — a structural guarantee, not a behavioural promise.
    process.env[ENV] = 'defillama';
    __resetMarketProviders();
    expect(getApyProvider()).not.toBeInstanceOf(DefiLlamaApyProvider);
    expect(getApyProvider()).toBeInstanceOf(FallbackOnlyApyProvider);
  });

  it('should disable each source INDEPENDENTLY', () => {
    process.env[ENV] = 'coingecko';
    __resetMarketProviders();
    expect(getApyProvider()).toBeInstanceOf(DefiLlamaApyProvider);
    expect(getPriceProvider()).toBeInstanceOf(FallbackOnlyPriceProvider);
  });

  it('should disable both when both are named', () => {
    process.env[ENV] = 'defillama,coingecko';
    __resetMarketProviders();
    expect(getApyProvider()).toBeInstanceOf(FallbackOnlyApyProvider);
    expect(getPriceProvider()).toBeInstanceOf(FallbackOnlyPriceProvider);
  });

  it('should tolerate whitespace and empty entries', () => {
    process.env[ENV] = ' defillama , , ';
    __resetMarketProviders();
    expect(getApyProvider()).toBeInstanceOf(FallbackOnlyApyProvider);
    expect(getPriceProvider()).toBeInstanceOf(CoinGeckoPriceProvider);
  });

  it('should make a typo INERT rather than disabling something by accident', () => {
    process.env[ENV] = 'defilama';
    __resetMarketProviders();
    expect(getApyProvider()).toBeInstanceOf(DefiLlamaApyProvider);
  });

  it('should never let configuration ENABLE a source', () => {
    /* The override is monotone-restrictive: there is no env value that grants
       a use. This asserts the only syntax that exists is subtraction — an
       "enable" spelling is simply an unmatched id, i.e. inert. */
    process.env[ENV] = '!defillama';
    __resetMarketProviders();
    expect(getApyProvider()).toBeInstanceOf(DefiLlamaApyProvider);
    expect(getApyProvider()).not.toBeInstanceOf(FallbackOnlyApyProvider);
  });

  it('should leave the fixture-backed gas port alone (stated scope limit)', () => {
    process.env[ENV] = 'defillama,coingecko';
    __resetMarketProviders();
    expect(getGasProvider()).toBeInstanceOf(FixtureGasProvider);
  });
});
