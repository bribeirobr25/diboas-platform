import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { catalogueRequirementFor, legRequiresCurrentRate } from '../catalogueEvidence';
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
    for (const id of PROTOCOLS) {
      expect(catalogueRequirementFor(id), id).toMatch(/^(CURRENT_RATE|NONE)$/);
    }
  });

  it('should require a current rate from an ACCRUAL leg — the rate IS its return', () => {
    const accrual = PROTOCOLS.filter((id) => PROTOCOL_DOMAIN_IDENTITY[id].kind === 'lending');
    expect(accrual.length).toBeGreaterThan(0);
    for (const id of accrual) {
      expect(catalogueRequirementFor(id), id).toBe('CURRENT_RATE');
      expect(legRequiresCurrentRate(id), id).toBe(true);
    }
  });

  it('should require NO current rate from a MARKET leg — the price IS its return', () => {
    const market = PROTOCOLS.filter((id) => PROTOCOL_DOMAIN_IDENTITY[id].kind === 'market');
    expect(market.length).toBeGreaterThan(0);
    for (const id of market) {
      expect(catalogueRequirementFor(id), id).toBe('NONE');
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
    expect(code).toContain('catalogueRequirementFor');
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
    const alien = { kind: 'perpetual' } as unknown as (typeof PROTOCOL_DOMAIN_IDENTITY)['jito'];
    const original = PROTOCOL_DOMAIN_IDENTITY.jito;
    try {
      (PROTOCOL_DOMAIN_IDENTITY as Record<string, unknown>).jito = alien;
      expect(catalogueRequirementFor('jito')).toBeUndefined();
    } finally {
      (PROTOCOL_DOMAIN_IDENTITY as Record<string, unknown>).jito = original;
    }
    expect(catalogueRequirementFor('jito')).toBe('NONE');
  });
});
