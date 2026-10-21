import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { legRequiresCurrentRate } from '../catalogueEvidence';
import { PROTOCOL_DOMAIN_IDENTITY } from '../domainIdentity';
import { PROTOCOL_RETURN_MODEL, type ProtocolId } from '../types';

const PROTOCOLS = Object.keys(PROTOCOL_DOMAIN_IDENTITY) as ProtocolId[];

/**
 * S1 · TYPED CURRENT-CATALOGUE EVIDENCE REQUIREMENT (`5.444`).
 *
 * Not user-visible: nothing consumes this yet. It is tested and sabotaged FIRST
 * so the contract is proven before S2 and S3 depend on it.
 */
describe('S1 · the catalogue asks each leg for what its return mechanism produces', () => {
  it('should cover every catalogue protocol exhaustively', () => {
    /* The instrument before the verdict: a resolver that silently skipped a
       protocol would answer nothing while looking green. */
    expect(PROTOCOLS.length).toBe(6);
    /* Exact per kind, not merely "a boolean" (PB-3): `typeof boolean` could not
       tell a real NONE from an unknown kind collapsed to false. */
    for (const id of PROTOCOLS) {
      expect(legRequiresCurrentRate(id), id).toBe(PROTOCOL_DOMAIN_IDENTITY[id].kind === 'lending');
    }
  });

  it('should require a current rate from an ACCRUAL leg — the rate IS its return', () => {
    const accrual = PROTOCOLS.filter((id) => PROTOCOL_DOMAIN_IDENTITY[id].kind === 'lending');
    expect(accrual.length).toBeGreaterThan(0);
    for (const id of accrual) {
      expect(legRequiresCurrentRate(id), id).toBe(true);
    }
  });

  it('should require NO current rate from a MARKET leg — the price IS its return', () => {
    const market = PROTOCOLS.filter((id) => PROTOCOL_DOMAIN_IDENTITY[id].kind === 'market');
    expect(market.length).toBeGreaterThan(0);
    for (const id of market) {
      expect(legRequiresCurrentRate(id), id).toBe(false);
    }
  });

  it('should agree with the RETURN MODEL, which is the other declaration of the same fact', () => {
    /**
     * Two tables describe a leg's economics — `PROTOCOL_DOMAIN_IDENTITY.kind`
     * and `PROTOCOL_RETURN_MODEL.kind`. They must not drift: replay reads the
     * second, the catalogue now reads the first, and a divergence would mean a
     * leg is priced one way and listed another.
     */
    for (const id of PROTOCOLS) {
      expect(PROTOCOL_DOMAIN_IDENTITY[id].kind, id).toBe(PROTOCOL_RETURN_MODEL[id].kind);
    }
  });

  it('should name NO protocol in any condition — the answer comes from the type', () => {
    /**
     * `jupiterJlp` gets its behaviour from the generic market-leg contract. A
     * protocol-id condition here would be the JLP special case the ruling
     * forbids, wearing a general name.
     *
     * Scans CODE, not prose — the module's own comment names the protocols it
     * deliberately does not branch on, and a raw scan would flag the
     * explanation of the rule as a breach of it.
     */
    const code = readFileSync(join(__dirname, '..', 'catalogueEvidence.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const id of PROTOCOLS) {
      expect(code, id).not.toContain(id);
    }
    /* Prove the stripper did not simply empty the file. */
    expect(code).toContain(
      'catalogueRequirementFor'
    ); /* still the derivation, now module-private */
  });

  it('should stay NARROW — no universal resolver crept in', () => {
    const code = readFileSync(join(__dirname, '..', 'catalogueEvidence.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const banned of ['ProductFunction', 'CURRENT_PRICE', 'REPLAY', 'EXIT', 'VALUATION']) {
      expect(code, banned).not.toContain(banned);
    }
  });

  it('should fail loudly on an unsupported leg type rather than default', () => {
    /* A default would recreate the type-blindness this module removes. The
       switch is exhaustive, so an unknown kind returns undefined at runtime and
       is a compile error at build time — asserted here at runtime. */
    /**
     * ⛑ RESTATED 2026-09-25 (Block D). `catalogueRequirementFor` became
     * module-private (`5.449`), and the regex edit that removed its call sites
     * left this test with NO assertion at all — it passed while proving
     * nothing. `VAC-1` caught it within minutes of the edit, which is the
     * clearest argument for that gate existing.
     *
     * The claim is restated through `legRequiresCurrentRate`, and deliberately
     * on a LENDING leg: `skySsr` requires a rate, so if an unknown kind were
     * silently defaulted to `CURRENT_RATE` this assertion could not fail. On a
     * market leg it would have been true either way.
     */
    const alien = { kind: 'perpetual' } as unknown as (typeof PROTOCOL_DOMAIN_IDENTITY)['skySsr'];
    const original = PROTOCOL_DOMAIN_IDENTITY.skySsr;
    expect(legRequiresCurrentRate('skySsr')).toBe(true);
    try {
      (PROTOCOL_DOMAIN_IDENTITY as Record<string, unknown>).skySsr = alien;
      /* ⛑ RESTATED (P0 review, PB-3 — coding-standards rule 5). Requirement, as
         this test's own title states it: an unsupported leg FAILS LOUDLY rather
         than defaulting. The previous assertion pinned `false` — "needs no
         current rate" — which IS a default, and the one that requires no
         evidence. Neither default is acceptable; the throw is. */
      expect(() => legRequiresCurrentRate('skySsr'), 'an unknown kind defaulted silently').toThrow(
        /unsupported leg kind/
      );
    } finally {
      (PROTOCOL_DOMAIN_IDENTITY as Record<string, unknown>).skySsr = original;
    }
    expect(legRequiresCurrentRate('skySsr'), 'the restore must put it back').toBe(true);
  });
});
