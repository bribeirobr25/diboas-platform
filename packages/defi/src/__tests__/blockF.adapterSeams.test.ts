import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { isSourceUsable } from '../providerDisposition';
import { EVIDENCE_SOURCES, type EvidenceSourceId } from '../types';

const SRC = join(__dirname, '..');
const SOURCES = Object.keys(EVIDENCE_SOURCES) as EvidenceSourceId[];

function productionFiles(dir: string = SRC, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== '__tests__') productionFiles(full, acc);
      continue;
    }
    if (entry.endsWith('.ts')) acc.push(full);
  }
  return acc;
}

/**
 * BLOCK F · ADAPTER SEAMS.
 *
 * The mechanism already exists and is proven in `providerSafety.test.ts`:
 * fail-closed for an undeclared source, configuration that subtracts but never
 * grants, independent disablement, collection stopped at the seam. This file
 * asserts the two things that ARE new — the semantics the ratified plan had to
 * rewrite so Block F could not be read as reinstating containment.
 */
describe('Block F · authorized ACTIVE providers stay active', () => {
  it('should keep every currently authorized source usable for BOTH uses', () => {
    /**
     * ⚑ THE CLAUSE THIS GUARDS. Founder risk acceptance allows CoinGecko and
     * DeFiLlama fetching for the reviewed Practice fact pattern, and the
     * Authority & Supersession Map lists *"Block A must disable both
     * providers"* among superseded operational statements BY NAME.
     *
     * Sabotage: set either disposition to DISABLED or RESTRICTED and this
     * fails, naming the source.
     */
    for (const source of SOURCES) {
      expect(isSourceUsable(source), `${source} NEW_COLLECTION`).toBe(true);
    }
  });

  it('should contain NO containment switch that disables a provider by default', () => {
    /**
     * A default-off flag, an env-var allowlist, or a hard-coded disable list
     * would reinstate the superseded containment through the back door. The
     * only configuration path is SUBTRACTIVE and is injected, never read from
     * the environment inside this package.
     */
    const offenders = productionFiles().filter((f) => {
      const code = readFileSync(f, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      return /DISABLE_|CONTAINMENT|disabledByDefault|DEFAULT_DISABLED/i.test(code);
    });
    expect(offenders.map((f) => f.replace(SRC, ''))).toEqual([]);
    /**
     * ⛑ NARROWED AFTER A FALSE POSITIVE, and narrowed by MEANING.
     *
     * The first version flagged any `process.env`, which caught
     * `COINGECKO_API_KEY` — an OPTIONAL credential that raises a rate limit and
     * disables nothing. A detector that cannot tell a key from a kill switch
     * reports a finding that is not there.
     *
     * The env read that matters is asserted positively instead: the ONE
     * configuration path is subtractive, injected, and lives in the app.
     */
    const cg = readFileSync(join(SRC, 'providers', 'coingecko.ts'), 'utf8');
    expect(cg).toMatch(/process\.env\.COINGECKO_API_KEY/);
    expect(cg).not.toMatch(/process\.env\.[A-Z_]*DISABL/i);
  });

  it('should apply "not constructed until cleared" ONLY to what is not yet allowed', () => {
    /* An UNDECLARED source is refused — that is the fail-closed half, and it
       must not be confused with the declared-and-allowed half above. */
    expect(isSourceUsable('nope' as EvidenceSourceId)).toBe(false);
    expect(isSourceUsable('coingecko')).toBe(true);
  });
});

describe('Block F · provider state is INFRASTRUCTURE, never Product', () => {
  it('should keep disposition and eligibility out of the package barrel', () => {
    /**
     * Refresh §6 ⚑: operational disposition and fallback eligibility are
     * infrastructure state, not Product concepts. A disabled source must reach
     * Product as an ABSENT OBSERVATION — a state that already exists, with
     * handling that already exists — never as new ontology, copy, information
     * architecture, ranking or hiding rules.
     *
     * The barrel is where that boundary is actually kept: only the predicate
     * the app's factory needs crosses it.
     */
    /* ⛑ CODE, NOT PROSE. The barrel's own comment explains which symbols were
       deliberately NOT exported and names them, so a raw scan flags the
       explanation of the rule as a breach of it. */
    const barrel = readFileSync(join(SRC, 'index.ts'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    for (const internal of [
      'SOURCE_DISPOSITIONS',
      'permitsUse',
      'fallbackFor',
      'sourceHealth',
      'isSourceHealthy',
      'recordSourceOutcome',
      'persistenceRightFor',
      'originDetermination',
    ]) {
      expect(barrel, internal).not.toMatch(new RegExp(`\\b${internal}\\b`));
    }
    /* And the two that DO have an outside consumer are exported, so this is a
       boundary and not simply an empty assertion. */
    expect(barrel).toMatch(/\bisSourceUsable\b/);
    expect(barrel).toMatch(/\bmayPersistNormalized\b/);
  });

  it('should carry no provider NAME in a Product-facing decision', () => {
    /* `5.440`: liveness is a property of the stamp, not of who supplied it.
       Provider names may appear in a source registry and in adapters; they may
       not appear in a predicate that decides what Product shows. */
    const decisionModules = ['provenance.ts', 'rateAvailability.ts', 'currentFacing.ts'];
    for (const mod of decisionModules) {
      const code = readFileSync(join(SRC, mod), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '');
      for (const vendor of ['coingecko', 'defillama', 'CoinGecko', 'DeFiLlama']) {
        expect(code, `${mod} / ${vendor}`).not.toContain(vendor);
      }
    }
  });
});
