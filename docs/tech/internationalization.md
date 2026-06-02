# Internationalization (i18n)

> Config-driven, DRY internationalization for the diBoaS platform across 4 locales.

**Last updated:** 2026-06-02 (condensed — the pre-Phase-6 implementation log and the stale 2-namespace file tree were removed; the canonical namespace inventory now lives in `packages/i18n/README.md`).

## Overview

The platform supports **4 locales** — English (`en`, reference/source of truth), Brazilian Portuguese (`pt-BR`), Spanish (`es`), German (`de`) — with automatic browser-language detection and a reusable, config-driven translation system.

- **Canonical namespace inventory** (currently **31 namespaces per locale**) + the Phase-7 Q4 banned-term grep gate: **`packages/i18n/README.md`**.
- **Translation files:** `packages/i18n/translations/{en,pt-BR,es,de}/<namespace>.json` (+ `legal/` subdirectory).
- **Parity enforcement:** `pnpm validate:translations` (`scripts/validate-translations.js`) checks key parity across all 4 locales — required before any PR that touches copy.
- **All new user-facing strings must be added to all 4 locales.** German text runs ~30% longer than English — verify components handle expansion.

## Recent additions (2026-05-23)

Phase I + audit-followup work added the following keys across all 4 locales. Translation parity verified via `pnpm validate:translations`.

**`tools-shared.json`:**

- `scenarios.conservativeTooltip` / `historicalTooltip` / `optimisticTooltip` — scenario-rate explainer (Phase I.4)
- `scenarios.tooltipLabel` — accessibility label for the `?` trigger
- `warnings.over30Years` — >360-month stop-condition advisory (Phase I.3)
- `confidence.high` / `medium` / `low` — confidence-stratification badge labels (Phase I.1)
- `labels.usdEquivalent` — "≈ {usd} USD today" parenthetical on forward tools (Audit follow-up Part 3)

**`tools-asset-history.json`:**

- `inputs.assetDescriptions.{BTC,SP500,QQQ,MSCI_WORLD,GOLD,TLT,IBOVESPA,DAX}` — per-asset hover tooltip (v1.5 TLT UX work)
- `inputs.gainBadgeTooltip` — explanation of the `(+N%)` / `(−N%)` gain/loss badge next to the terminal value

**`tools-emergency-fund.json`:** `output.unreachable` — "At this savings rate, inflation outpaces your bank's return" (Phase I.2)

**`tools-time-to-target.json`:** `output.cannotReach` rewritten from "—" to an explicit "Out of reach at this contribution…" sentence (Phase I.2)

**`tools-inflation-impact.json`, `tools-currency-depreciation.json`:** `output.uncertaintyMedium` / `uncertaintyLow` — confidence-stratification footnotes (Phase I.1)

## Translation Integration Layer

**File:** `apps/web/src/lib/i18n/config-translator.ts`

The reusable translation-resolution system for config-driven components. Components stay decoupled from translations — they reference translation keys in their config, and the factory resolves them.

- `useConfigTranslation<T>()` — recursively translates config objects (supports an optional `valuesByKey` map for ICU `{slot}` injection — see below)
- `useTranslate()` — simple one-off translations
- `useTranslateWithValues()` — translations with interpolation
- `useNamespacedTranslation()` — scoped translations
- `withTranslations()` — higher-order function for translation-aware configs (mirrors `useConfigTranslation`, same optional `valuesByKey` arg)

### `valuesByKey` extension (Phase 7 Followup, 2026-05-20)

`useConfigTranslation` and `withTranslations` accept an optional 3rd-positional `valuesByKey: Map<string, Record<string, string | number | boolean | Date>>`. The map keys are fully-qualified translation ids (e.g. `'landing-b2c.fees.rows.adding.diboas'`); the values are slot-name → slot-value records (e.g. `{ rate: '0.48%', min: '$0.25', max: '$25' }`). When the recursion resolves a key matched in `valuesByKey`, the values are passed to `intl.formatMessage` for ICU `{slot}` substitution.

```ts
const valuesByKey = new Map([
  ['landing-b2c.fees.rows.adding.diboas', { rate: '0.48%', min: '$0.25', max: '$25' }],
  ['landing-b2c.fees.rows.cashout.diboas', { rate: '0.48%' }],
]);
const translated = useConfigTranslation(config, undefined, valuesByKey);
```

**Canonical builder pattern (omnibus map):** `apps/web/src/lib/market-data/feeComparisonValues.ts` exports `buildAllFeeValues(fees, locale)` returning a single `Map<string, Record<string, string>>` covering all migrated landing-page rate-citation keys. Consumers wrap it in `useMemo([locale])` and pass it to `useConfigTranslation`. Verified consumers: `FeeTable`, `ProseSection`, `FAQAccordionFactory`. Direct `intl.formatMessage` consumers with their own `t` helpers (e.g. `B2BGoalCards`, `GoalExampleCard`) extend the local helper with an optional `values?` parameter instead — no omnibus-map dependency.

**Import-path constraint:** the builder imports `formatRate` from `@/lib/market-data/formatters` and `formatCurrency` from `@/lib/compound-interest` — these MUST stay split. The market-data barrel re-exports a 2-arg `formatCurrency` that hardcodes 0 decimals + `Math.round()`, which would silently break minFee rendering ($0.25 → "$0"). The 3-arg `Intl.NumberFormatOptions`-aware version lives in `lib/compound-interest`.

**Dev-mode safety:** the recursion includes a `NODE_ENV === 'development'` warning that scans the resolved ICU template for `{slot}` markers and `console.warn`s if any are missing from the values record. Stripped from production by `removeConsole`.

**Backward compatibility:** the 3rd arg is optional — existing `useConfigTranslation(config)` / `useConfigTranslation(config, translationKeyMap)` call sites are unchanged.

## Package Architecture

The `@diboas/i18n` package ships three entry points to keep React out of the server bundle:

| Entry point | Size | Contents |
| ----------- | ---- | -------- |
| `@diboas/i18n/server` | ~40 KB | Server-safe (no React): `loadMessages`, `loadAllMessages`, `flattenMessages`, `isValidLocale`, `getSafeLocale`, `SUPPORTED_LOCALES`, `DEFAULT_LOCALE` |
| `@diboas/i18n/client` | ~1.5 KB (+ react-intl) | `I18nProvider`, `useTranslation`, `useMessage`, and the formatting hooks |
| `@diboas/i18n/config` | ~2.7 KB | Constants only |

See `packages/i18n/README.md` for the full API reference and usage examples. **Never** use the main entry point in Server Components, and never mix server/client imports.

## Automatic Locale Detection

**File:** `apps/web/middleware.ts`

Detection order: URL path segment (`/pt-BR/about`) → `Accept-Language` header → fallback to `en`. Bare paths redirect to the locale-prefixed equivalent.

- `Accept-Language: pt-BR` → `/pt-BR`
- `Accept-Language: es` → `/es`
- `Accept-Language: de` → `/de`
- any unsupported language → `/en`

The middleware also applies the per-request CSP nonce and security headers (see `docs/tech/security.md` §2) and the `x-request-id` header.

## SEO per Locale

Each locale gets unique titles/descriptions, `hreflang` tags for all locales, and canonical URLs. `generateStaticParams` pre-renders all 4 locale roots.

## Architecture Principles

- **Service-agnostic abstraction:** components render variants (`<HeroSection variant="…" />`); the factory resolves translations internally via `useConfigTranslation` — components never know about the translation implementation.
- **DRY / config-driven:** all config files use translation keys, never hardcoded English. Adding a language = add the locale's JSON files + extend `SUPPORTED_LOCALES`.
- **No hardcoded values:** all user-facing content comes from translation files; non-content values (URLs, flags) come from environment variables.
