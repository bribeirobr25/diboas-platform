import { describe, expect, it } from 'vitest';
import { LEGAL_READINESS_LOCALES, SANDBOX_LOCALES, WALLET_NOTE_LOCALES } from '../config';
import { getMessages } from '../loadMessages';

/**
 * The key-parity guard next door checks that every locale has every KEY. It
 * cannot see that a key's value is still the English sentence — and that gap
 * has now shipped twice: de/es went out untranslated on G11, and the whole
 * pt-BR goal-creation, comprehension and error screens were English until the
 * 5.115 pass caught them. Parity was green the entire time.
 *
 * A string identical to English is not automatically wrong, so the guard needs
 * an explicit list of what may legitimately match: brand, third-party protocol
 * names, diBoaS strategy product names (deliberately untranslated in ALL four
 * locales) and pure format strings. Everything else must differ.
 *
 * es/de carry real translation debt — the native pass (P-7) is out of Phase 2
 * scope — so they get a RATCHET rather than zero: the count may fall, never
 * rise. That keeps the debt visible and stops it growing, without pretending it
 * is fixed.
 */

/** Keys whose value is SUPPOSED to read the same in every locale. */
const SHARED_BY_DESIGN = (key: string) =>
  key === 'common.appName' ||
  key === 'common.wordmarkAlt' ||
  key === 'gate.title' ||
  // Brand's approved German navigation label for Community IS "Community"
  // (Strategy Canon disposition §11.2, Legal-approved with no edits). It is
  // identical to English on purpose, like the protocol and strategy names.
  key === 'nav.community' ||
  key.startsWith('catalog.protocols.') || // Sky SSR, Aave V3 — third-party names
  key.startsWith('catalog.strategies.') || // diBoaS product names, English in all 4
  key === 'monthReport.signedUp' || // "+{amount}" — pure format
  key === 'monthReport.signedDown';

/**
 * Keys whose non-English value is INTENTIONALLY still English because no
 * authority-approved localized wording exists yet, and whose RENDERING is gated
 * per locale in code (Strategy Canon correction 2, 2026-09-07). Each entry names
 * the gate; the test below proves the gate excludes every locale still carrying
 * the English value, so the English can never leak to a user in that locale.
 */
const GATED_PENDING_AUTHORITY: { key: string; renderedIn: readonly string[] }[] = [
  { key: 'authWelcome.walletNote', renderedIn: WALLET_NOTE_LOCALES },
  // I-0b Legal readiness chrome (Product EN-03A copy, English only so far). The
  // four Legal control strings are NOT listed: LC-TD-02 approved them ×4.
  ...[
    'step',
    'subtitle',
    'requiredBadge',
    'informationBadge',
    'optionalBadge',
    'termsHeading',
    'optionalNote',
    'continue',
  ].map((k) => ({ key: `legalReadiness.${k}`, renderedIn: LEGAL_READINESS_LOCALES })),
];
const isGated = (key: string) => GATED_PENDING_AUTHORITY.some((g) => g.key === key);

/**
 * Known debt, 2026-08-21. LOWER these as the native pass lands; a rise fails
 * the test, which is the point.
 */
const DEBT_CEILING: Record<string, number> = { 'pt-BR': 0, es: 239, de: 238 };

function untranslated(locale: string): string[] {
  const en = getMessages('en');
  const loc = getMessages(locale as (typeof SANDBOX_LOCALES)[number]);
  return Object.keys(en).filter(
    (k) => !SHARED_BY_DESIGN(k) && !isGated(k) && en[k].length > 3 && loc[k] === en[k]
  );
}

describe('5.115 — a translated locale must not still be speaking English', () => {
  it('should have NO untranslated strings in pt-BR', () => {
    const left = untranslated('pt-BR');
    expect(left, `\npt-BR still English:\n  ${left.join('\n  ')}\n`).toEqual([]);
  });

  it.each(['es', 'de'])('should not GROW the known %s translation debt', (locale) => {
    const left = untranslated(locale);
    // A ratchet, not a target. If this fails because the number went DOWN,
    // lower DEBT_CEILING in the same commit — that is the pass working.
    expect(left.length).toBeLessThanOrEqual(DEBT_CEILING[locale]);
  });

  it('should never render a gated-pending-authority key in a locale that still carries the English', () => {
    const en = getMessages('en');
    for (const g of GATED_PENDING_AUTHORITY) {
      expect(en[g.key], g.key).toBeTruthy();
      for (const locale of SANDBOX_LOCALES) {
        const stillEnglish = getMessages(locale)[g.key] === en[g.key];
        // Sabotage: add 'de' to WALLET_NOTE_LOCALES while de.json still holds the
        // English sentence and this fails — the gate must not outrun the authority.
        if (locale !== 'en' && stillEnglish) {
          expect(g.renderedIn, `${g.key} would render English in ${locale}`).not.toContain(locale);
        }
      }
    }
  });

  it('should be reading real catalogs (the guard itself must not go vacuous)', () => {
    // With a bad locale key every lookup would be undefined, nothing would ever
    // equal English, and the guards above would pass while checking nothing.
    expect(Object.keys(getMessages('en')).length).toBeGreaterThan(100);
    expect(Object.keys(getMessages('pt-BR')).length).toBeGreaterThan(100);
    expect(SANDBOX_LOCALES).toContain('pt-BR');
  });
});
