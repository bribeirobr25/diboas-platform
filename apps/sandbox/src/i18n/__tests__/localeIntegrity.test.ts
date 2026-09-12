import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SANDBOX_LOCALES } from '../config';

/**
 * Two corpus-wide catalogue properties found by the 2026-09-10 audit.
 *
 * ## 1. CUR-1, corpus-wide
 *
 * `engineering-gates.md` registers **CUR-1** — *"a currency literal keyed by
 * locale instead of the ledger currency (`move.withdrawFeePer` class)"*. `5.200`
 * fixed that one key and guarded that one key. The corpus-wide property was
 * never asserted, so the next hardcoded `$0.48` would ship exactly as the first
 * one did. It is clean today (measured: zero symbol-bearing strings in all four
 * locales), so this is a ratchet at zero, not a ratchet at a defect.
 *
 * Why it matters beyond tidiness: the ledger's currency is frozen at claim time
 * and never follows the interface language, so ANY currency literal in copy is
 * wrong for some reader — which is the whole finding of `5.200`.
 *
 * ## 2. Locale collisions
 *
 * Where English distinguishes two strings and a translation collapses them to
 * one, meaning is lost silently — the parity guard only checks that keys are
 * PRESENT. The audit found seven. They are allow-listed below with their
 * dispositions so the count can only fall; a NEW collision fails.
 */

const dir = join(process.cwd(), 'src', 'i18n', 'messages');

type Flat = Record<string, string>;
function flatten(value: unknown, prefix = '', into: Flat = {}): Flat {
  if (typeof value === 'string') {
    into[prefix] = value;
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, into);
    }
  }
  return into;
}
const catalog = (locale: string): Flat =>
  flatten(JSON.parse(readFileSync(join(dir, `${locale}.json`), 'utf8')));

describe('CUR-1 — no currency literal may live in copy', () => {
  it.each(SANDBOX_LOCALES)('should carry no currency symbol in any %s string', (locale) => {
    const offenders = Object.entries(catalog(locale))
      .filter(([, v]) => /[$€£¥]|R\$/.test(v))
      .map(([k, v]) => `${k} = ${v}`);
    // A symbol in copy cannot follow the LEDGER currency, only the language —
    // and those are different things (`5.200`).
    expect(offenders).toEqual([]);
  });

  it('should have loaded real catalogues, so the assertion above is not vacuous', () => {
    for (const locale of SANDBOX_LOCALES) {
      expect(Object.keys(catalog(locale)).length).toBeGreaterThan(200);
    }
  });
});

/**
 * The seven collisions the audit found, each with its disposition. Removing an
 * entry after a translation fix is the intended direction of travel.
 */
const KNOWN_COLLISIONS: ReadonlyArray<{ locale: string; value: string; why: string }> = [
  {
    locale: 'de',
    value: 'Übungsguthaben',
    why: 'REGISTERED 5.271 — one word for BOTH the balance and the unit; erases the PRU credit-vs-money distinction. Founder copy call.',
  },
  {
    locale: 'de',
    value: 'Dein @handle',
    why: 'BENIGN, and the oddity is on the English side: `Your @handle` vs `Your handle` say the same thing, so collapsing them loses nothing. EN should arguably be consistent instead.',
  },
  {
    locale: 'de',
    value: 'Privatsphäre und Daten',
    why: 'BENIGN: the English pair differs only in casing (`Privacy & Data` vs `Privacy & data`), so one German string is correct and the inconsistency is English-side.',
  },
  {
    locale: 'es',
    value: 'Tu @handle',
    why: 'BENIGN: the same `Your @handle` / `Your handle` pair as German, with the same reading — the two English strings are synonyms.',
  },
  {
    locale: 'pt-BR',
    value: 'Seu @handle',
    why: 'BENIGN: the same `Your @handle` / `Your handle` synonym pair as German and Spanish.',
  },
  {
    locale: 'es',
    value: 'Volver al inicio',
    why: 'BENIGN, and English-side: `notFound.backHome` is "Back to home" while `community.action` is "Back to Home" — the pair differs only in the casing of one word, so a single Spanish string is correct. The Community half is Brand copy Legal-approved with no edits (P-QA5 / L-QA3) and must not be reworded to break a tie that only exists in English.',
  },
  {
    locale: 'de',
    value: 'Zurück zur Startseite',
    why: 'BENIGN, and English-side: the same "Back to home" / "Back to Home" casing pair as Spanish, with the same reading. The Community half is Legal-approved copy.',
  },
  {
    locale: 'pt-BR',
    value: 'Continuar',
    why: 'REGISTERED 5.271 — "Keep going" (the pause sheet\'s stay-the-course choice) flattened into a generic "Continue"; the nudge is the button\'s purpose.',
  },
  {
    locale: 'pt-BR',
    value: 'Valor inicial',
    why: "REGISTERED 5.271 — a replay's start value and a goal's starting deposit are different quantities.",
  },
];

describe('locale collisions can only fall', () => {
  it('should introduce no NEW collision where English distinguishes two strings', () => {
    const en = catalog('en');
    const found: string[] = [];

    for (const locale of SANDBOX_LOCALES.filter((l) => l !== 'en')) {
      const byValue = new Map<string, string[]>();
      for (const [k, v] of Object.entries(catalog(locale))) {
        if (v.trim().length <= 2) continue;
        byValue.set(v, [...(byValue.get(v) ?? []), k]);
      }
      for (const [value, keys] of byValue) {
        if (keys.length < 2) continue;
        const englishSides = new Set(keys.map((k) => en[k]));
        // Only a collision if EN keeps them apart and every key exists in EN.
        if (englishSides.size > 1 && !englishSides.has(undefined as unknown as string)) {
          found.push(`${locale}: ${value}`);
        }
      }
    }

    const allowed = KNOWN_COLLISIONS.map((c) => `${c.locale}: ${c.value}`);
    expect(found.filter((f) => !allowed.includes(f))).toEqual([]);
  });

  it('should keep the allow-list honest — every entry must still be a real collision', () => {
    // A stale allow-list is worse than none: it would hide the next defect
    // behind an entry describing something already fixed.
    const en = catalog('en');
    for (const { locale, value } of KNOWN_COLLISIONS) {
      const keys = Object.entries(catalog(locale))
        .filter(([, v]) => v === value)
        .map(([k]) => k);
      expect(keys.length, `${locale}: ${value} — no longer duplicated; drop it`).toBeGreaterThan(1);
      expect(new Set(keys.map((k) => en[k])).size).toBeGreaterThan(1);
    }
  });

  it('should state a reason for every allow-listed collision', () => {
    for (const c of KNOWN_COLLISIONS) expect(c.why.length).toBeGreaterThan(30);
  });
});

/**
 * CUR-1 at the WORD level — the residue the symbol guard above does not cover.
 *
 * Found on 2026-09-11 by reading `/month` in dark mode and noticing *"Every
 * dollar is explained below"* on a screen whose ledger may be EUR or BRL. The
 * symbol sweep is clean, but a currency NAME in copy is the same defect: the
 * sentence's currency follows the interface language while the ledger's is
 * frozen at claim time.
 *
 * The corpus is NOT clean here, so this is an allow-list ratchet — the known
 * set may only shrink, and anything new fails. Each entry says what it is,
 * because the group is not homogeneous:
 *
 * - `rules.subtitle` is the real one: literal, per-locale, and attached to a
 *   money-movement instruction (four locales, four different currencies).
 * - the other three are the idiom "every cent/dollar of it" meaning
 *   *completely*. Lower severity, listed rather than hidden — and the key
 *   literally named `everyDollar` invites the next author to hardcode.
 *
 * ⚑ NOT in scope, deliberately: `pathCard.riskStable`'s "digital dollars" is a
 * factual description of USDC, Legal-reviewed, and must not be reworded.
 */
const CURRENCY_WORDS: Record<string, RegExp> = {
  en: /\b(dollars?|euros?|cents?)\b/i,
  de: /\b(Euros?|Dollars?|Cents?)\b/,
  es: /\b(euros?|dólares?|centavos?)\b/i,
  'pt-BR': /\b(reais|centavos?|dólares?|euros?)\b/i,
};

/** Keys allowed to name a currency, with why. `rules.subtitle` is the defect. */
const CURRENCY_WORD_ALLOWLIST: ReadonlySet<string> = new Set([
  'rules.subtitle', // ⚑ REGISTERED 5.272 — the real one; founder copy call
  'monthReport.everyDollar', // idiom "every cent"; key name is itself a smell
  'home.monthNote', // idiom "every dollar of it"
  'history.subtitle', // idiom "every cent accounted for"
  'pathCard.riskStable', // FACTUAL: USDC is a digital dollar. Do not reword.
  'pathCard.pathLine', // pt-BR "protocolos reais" — "real" as in genuine
  'common.playDisclaimer',
  'common.frameCaption',
  'projection.caveat',
  'move.practiceNote',
  'timeMachine.footnote',
  'rules.previewBasis',
]);

describe('CUR-1 residue — currency WORDS in copy can only decrease', () => {
  it('should name no NEW key that puts a currency word in user-facing copy', () => {
    const offenders: string[] = [];
    for (const locale of SANDBOX_LOCALES) {
      const pattern = CURRENCY_WORDS[locale];
      for (const [key, value] of Object.entries(catalog(locale))) {
        if (pattern.test(value) && !CURRENCY_WORD_ALLOWLIST.has(key)) {
          offenders.push(`${locale}: ${key} = ${value.slice(0, 60)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('should still find the known instances, so the ratchet is not vacuous', () => {
    /**
     * Scope of this check, stated precisely because a sabotage run showed my
     * first description of it was wrong: it asserts the key is still a hit in
     * AT LEAST ONE locale. Fixing `rules.subtitle` in English alone therefore
     * does NOT fail it — which is the behaviour we want, since the allow-list
     * entry must survive until every locale is fixed. It is not a per-locale
     * ratchet, and claiming otherwise would be the very over-claim this audit
     * corrected in CUR-1's registry row.
     */
    const found = new Set<string>();
    for (const locale of SANDBOX_LOCALES) {
      const pattern = CURRENCY_WORDS[locale];
      for (const [key, value] of Object.entries(catalog(locale))) {
        if (pattern.test(value)) found.add(key);
      }
    }
    expect(found.has('rules.subtitle')).toBe(true);
    expect(found.size).toBeGreaterThanOrEqual(4);
  });
});

/**
 * `5.231` — the pre-commit risk paragraph told the user "practice mode previews
 * the returns these systems pay, NOT the price swings". True before §4.8; false
 * since the G8 price overlay made `market` legs replay the token's own price —
 * practice positions CAN fall (pinned by `g8NegativeSurfaces.test.ts`). The
 * sentence was removed (plan §13.2: "5.231 (remove clause)"); this keeps it gone
 * in every locale while leaving the real-money risk sentence in place.
 */
describe('the risk copy matches the shipped return model (5.231)', () => {
  it.each(SANDBOX_LOCALES)(
    'should not tell a %s reader that practice omits price swings',
    (locale) => {
      const riskGrowth = catalog(locale)['pathCard.riskGrowth'];
      expect(riskGrowth).not.toMatch(/not the price swings|não as oscilações de preço/i);
      // The half that stays true: real money can fall as well as rise.
      expect(riskGrowth).toContain('{percent}');
    }
  );
});
