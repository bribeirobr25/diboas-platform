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
