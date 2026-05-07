# Translators — diBoaS i18n Notes

> **Read this before translating any file in this directory.**
> Source: CMO Board Session 027 + GTM Playbook §7 (locale tone flags), §9 (Adelaide Filter).
> Last updated: 2026-05-07.

---

## How this directory works

- **Reference locale:** `en` is the source of truth. Every other locale (`pt-BR`, `es`, `de`) mirrors `en`'s key tree.
- **Validation:** `pnpm validate:translations` (run automatically in CI) compares key trees across all 4 locales. Missing or orphaned keys block merge.
- **Locale-specific exceptions** (keys that legitimately exist only in one locale, e.g., BCB disclaimers for Brazil) are listed in `packages/i18n/scripts/validate-translations.js` under `LOCALE_SPECIFIC_KEYS`.
- **Phase 1 lesson copy:** Some lessons (notably `learn-compound-interest.json`) currently ship with English values in non-`en` locales as placeholders for narrative paragraphs. Locale-specific cultural anchors (Beat 2 vignettes, habit lines) are already populated per CMO Session 027. Translation team replaces the English placeholders before public launch.
- **Naming guard:** the validator extracts every key recursively, including any `_meta` or `_translatorNotes` blocks. Do **not** add such blocks to JSON files — keep notes here in `TRANSLATORS.md` instead.

---

## Per-locale tone flags

The following constraints come from the GTM Playbook §7 and were ratified for Lesson 01 by the CMO Board (Session 027). They apply to **every** Learn Center lesson and to any other diBoaS surface in these locales.

### 🇧🇷 PT-BR — Brazil

- **Avoid** "especular" (speculate), aggressive growth or get-rich language, anything that sounds like investment hype.
- **Prefer** "fazer o dinheiro render" (make money work / yield), "render mais" (yield more), "trabalhar para você" (work for you).
- **Currency hedge angle is the BR thesis** (per GTM §7.1) — when bridging to diBoaS, frame the value as protecting purchasing power against BRL depreciation, **not** as "diBoaS beats CDI". Comparing diBoaS to CDI rates is off-message and can attract regulatory attention. Lesson 01 uses generic 7% historical compounding — that's fine because it's not a product claim.
- **Voice:** second-person informal "você". Conversational but not slangy.
- **Regulatory:** CVM 3-warning disclaimer text already exists in `pt-BR/strategies.json → cvmWarnings` and is reused via the existing translation namespace. Do not paraphrase those strings — they are CLO-approved as-is.

### 🇩🇪 DE — Germany

- **Avoid** hype, exclamations, or emotional copy. German finance audiences read measured, sober prose as trustworthy; energetic marketing reads as suspicious.
- **Prefer** the math itself doing the talking. "Hier ist die Rechnung" (here's the math). Calm, factual sentence rhythm.
- **"Zinseszins"** (compound interest) is a respected financial term in Germany — use it confidently. No need to soften it or split into "Zinsen, die Zinsen verdienen". German readers know what it means and trust the term.
- **Voice:** "du" form (informal second-person singular) per GTM §7.2. The `Sie` form would feel cold and corporate — wrong for diBoaS positioning.
- **Number formatting:** thousands separator is `.`, decimal separator is `,` — e.g., `€1.040` not `€1,040`. Currency symbol position varies by context but `€` before the number is most common in DE retail finance copy.
- **Regulatory:** MiCA-compliant phrasing exists in `de/strategies.json` and is reused. Do not invent new disclaimer text.

### 🇪🇸 ES — Spain

- **Avoid** post-2008 trigger language. Words like "inversión arriesgada", "rentabilidad garantizada", or any phrasing that echoes the bank-bailout / preferentes-scandal era.
- **Prefer** "ahorro inteligente" (smart saving), "poner el dinero a trabajar" (put money to work), "rendimiento" (yield/return).
- **Voice:** Peninsular Spanish, "tú" form (informal second-person singular). Avoid Latin American constructions and vocabulary unless the term genuinely has no Peninsular equivalent.
- **Number formatting:** thousands separator `.`, decimal separator `,` — same as German. Currency symbol `€` after the number is more common in ES retail copy (e.g., `1.300 €`), but the existing diBoaS copy in `es/strategies.json` uses `€1.300` (symbol before) for consistency with other EUR locales. Match the existing convention.
- **Regulatory:** MiCA-compliant phrasing exists in `es/strategies.json` and is reused.

---

## The Adelaide Filter (universal)

Every line of every diBoaS surface — Learn Center lessons, landing pages, emails, push copy, in-app strings — passes the Adelaide Filter before publication. This is not optional and not relaxed for "internal" or "small" copy.

The filter is a 7-point pass-through. For each translated lesson, your output must satisfy all 7:

| # | Test | Pass criterion |
|---|---|---|
| 1 | Beat 1 (or any concept introduction) leads with concrete math, not jargon | The first specific number appears **before** any technical term like "compound interest" / "juros compostos" / "Zinseszins" / "interés compuesto" |
| 2 | Beat 2 (or any "you might be thinking" moment) names the user's voice authentically | Translated form preserves direct second-person voice. Not "the user", not "one might think" — directly addressed |
| 3 | Acknowledges economic reality without moralizing | No "you should", "you must", "stop doing X". Frame is "did you know" / "if you wanted to", never prescriptive |
| 4 | Vignettes / examples show math, never prescribe behavior | Cultural anchors describe what someone *might* spend on; never command them to change |
| 5 | Beat 3 (or any final CTA section) preserves user agency | Equivalent locale phrase carries "your life is yours" / "the choice is yours" energy. The user always has the last word |
| 6 | Complementary positioning toward existing finance | Not "abandon your bank" / "ditch your bank". Frame is "and" — "your bank stays where it is, *and* diBoaS is for X" |
| 7 | Brand callbacks land in canonical positions | The signature line "Same money. Different job." (or its locale equivalent) appears **twice** in Lesson 01 — at the end of Beat 2 and at the bottom of Beat 3 |

A lesson that fails any of these 7 returns to the translator before merge — same gate as test failures or lint errors. Engineering's PR template tracks this as a per-locale checkbox.

---

## Locale equivalents of brand callbacks

The signature line **"Same money. Different job."** must land in a way that preserves the rhetorical pivot (same input, transformed output). Suggested locale equivalents (for translator review, not locked):

- 🇺🇸 EN: *Same money. Different job.*
- 🇧🇷 PT-BR: *O mesmo dinheiro. Trabalho diferente.* / *Mesmo dinheiro. Outro propósito.*
- 🇩🇪 DE: *Gleiches Geld. Andere Aufgabe.* / *Dasselbe Geld. Anderer Job.*
- 🇪🇸 ES: *El mismo dinero. Otro trabajo.* / *Mismo dinero. Distinto papel.*

Final phrasing per locale is a translator decision; the constraint is the rhetorical pattern, not the literal words.

---

## Working checklist when adding or editing a translation

1. Find the matching key in the `en` reference file. Do not invent keys.
2. Translate per the tone flags above.
3. Run the locale-relevant Adelaide Filter pass (7 checks).
4. For currency / number values: match the locale's number-formatting convention (separators) but mirror the diBoaS-house symbol convention from existing files.
5. Run `pnpm validate:translations` from the repo root before committing.
6. PR description records: per-locale Adelaide Filter pass (✅ / blocked) + reviewer name.

---

## Source documents

- **CMO Board Session 027** (2026-05-07) — `docs/post-launch/LESSON_01_COMPOUND_INTEREST_PACKAGE.md` §7 (tone flags), §9 (Adelaide Filter checklist), §8 (permanent editorial guideline).
- **GTM Playbook** §6.6, §6.7, §7.1, §7.2 — APY display rules, BR currency-hedge thesis, DE voice convention.
- **Engineering plan** — `docs/audit/LEARN_CALC_COMPOUND_INTEREST.md` (Phase A.0.6 created this file; Phase A.9 enforces the per-locale Adelaide Filter pass before public launch).
