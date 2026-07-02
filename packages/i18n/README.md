# @diboas/i18n - Internationalization Package

Complete internationalization solution for the diBoaS platform with support for 4 locales.

> **Scope:** This README is the canonical **namespace registry** (the 32-namespace inventory below) plus the package API reference. For app-level integration patterns — the config-translation layer (`useConfigTranslation`, `valuesByKey`), locale detection in middleware, SEO-per-locale, and the architecture principles — see `docs/tech/internationalization.md`.

## Supported Locales

- `en` - English (default)
- `pt-BR` - Portuguese (Brazil)
- `es` - Spanish
- `de` - German

## Features

✅ **Automatic Locale Detection** - Browser language detection with fallback to English
✅ **Complete Translation Coverage** - 32 namespaces per locale across all 4 locales (see Translation Files below)
✅ **Server & Client Support** - Separate entry points for optimal bundle size
✅ **Type-Safe** - Full TypeScript support
✅ **Zero Hardcoded Values** - All text externalized to JSON files
✅ **React-Intl Integration** - Built on industry-standard react-intl

## Installation

```bash
pnpm add @diboas/i18n
```

## Usage

### Server Components (Next.js App Router)

For server components, use the `/server` entry point which doesn't include React dependencies:

```typescript
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, isValidLocale, loadMessages } from '@diboas/i18n/server';

export default async function Page() {
  const locale = 'en';
  const messages = await loadMessages(locale, 'landing-b2c');

  return <div>{messages.hero.title}</div>;
}
```

### Client Components

For client components that need react-intl hooks, use the `/client` entry point:

```typescript
'use client';

import { I18nProvider, useTranslation, useMessage } from '@diboas/i18n/client';

function MyComponent() {
  const intl = useTranslation();
  const title = useMessage('hero.title');

  return <h1>{title}</h1>;
}
```

### Configuration Only

If you only need configuration constants, use `/config`:

```typescript
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@diboas/i18n/config';
```

## Translation Files

Translation files are organized by locale × namespace (32 namespaces per locale — most recently `investor-docs.json` — generated investor-room document bodies):

```
packages/i18n/translations/{en, pt-BR, es, de}/
├── about.json                          # About page
├── common.json                         # Navigation, buttons, forms
├── dreamMode.json                      # Dream-mode goal simulator
├── faq.json                            # FAQ content
├── investor-docs.json                  # Investor-room document bodies (generated blocks[])
├── landing-b2b.json                    # B2B landing page (incl. goal cards)
├── landing-b2c.json                    # B2C landing page
├── landing-help.json                   # Help center
├── learn.json                          # Learn center landing
├── learn-compound-interest.json        # Lesson 01 + Beat 2 vignettes + calculator
├── market.json                         # Adelaide Daily — BTC macro-regime dashboard (/market)
├── preDemo.json                        # Demo onboarding
├── preDream.json                       # Dream-mode onboarding
├── protocols.json                      # Protocol transparency
├── security.json                       # Security page
├── share.json                          # Social sharing
├── strategies.json                     # Investment strategies
├── waitlist.json                       # Waitlist signup
├── tools-shared.json                   # Cross-tool common copy (scenarios, disclaimer, hedge note, warnings, confidence labels)
├── tools-asset-history.json            # Asset History calculator (8 assets, per-asset descriptions, gain badge)
├── tools-card-fees.json                # B2B Card Fees calculator
├── tools-compound-interest.json        # Compound Interest tool page
├── tools-currency-depreciation.json    # Currency Depreciation tool
├── tools-emergency-fund.json           # Emergency Fund tool
├── tools-goal-savings.json             # Goal Savings tool
├── tools-idle-cash.json                # B2B Idle Cash tool
├── tools-inflation-impact.json         # Inflation Impact tool
├── tools-retirement.json               # Retirement tool
├── tools-time-to-target.json           # Time-to-Target tool
└── legal/
    ├── cookies.json                    # Cookie policy
    ├── privacy.json                    # Privacy policy
    └── terms.json                      # Terms of use
```

Namespace parity across the 4 locales is enforced by `scripts/validate-translations.js` (run via `pnpm validate:translations`).

**`tools-shared` (Phase 6C):** cross-tool common copy — scenario captions (Conservative/Historical/Optimistic), action buttons, default disclaimer. The `disclaimer` key carries the Q5(B) Phase-7 currency-hedge sentence (4 locales). `scenarios.digitalDollarSuffix` is the Phase-7 §5.2 suffix appended to diBoaS scenario labels on tool surfaces for non-USD locales.

**Banned-term grep gate (Phase 7 Q4):** body copy must not contain `stablecoin`, `USDC`, `DeFi`, `tokenized`, `yield farming`, `liquidity pool`, `blockchain`, or `APY`/`APR` outside regulatory disclosure keys (`*.disclosure*`, `*.regulatoryFootnote*`, `*.tilaDisclosure*`, `*.usDisclosure*`). See `docs/audit/_archive/PRE_PHASE_7_TOOLS_POLISH.md` §5.3 for the bash gate.

## API Reference

### Server-Safe Functions

```typescript
// Load messages for a specific namespace (one of the 32 — see Translation Files)
loadMessages(locale: SupportedLocale, namespace: string): Promise<Messages>

// Load all namespaces
loadAllMessages(locale: SupportedLocale, namespaces?: string[]): Promise<Messages>

// Flatten nested messages for react-intl
flattenMessages(messages: object, prefix?: string): Record<string, string>

// Validate locale
isValidLocale(locale: string): boolean

// Get safe locale with fallback
getSafeLocale(locale: string | null | undefined): SupportedLocale
```

### Client Hooks

```typescript
// Get intl instance
useTranslation(): IntlShape

// Format message
useMessage(id: string, defaultMessage?: string): string

// Format message with values
useMessageWithValues(id: string, values?: object, defaultMessage?: string): string

// Format date
useDateFormat(date: Date | number, options?: Intl.DateTimeFormatOptions): string

// Format number
useNumberFormat(value: number, options?: Intl.NumberFormatOptions): string

// Format currency
useCurrencyFormat(value: number, currency: string): string
```

## Automatic Locale Detection

The middleware automatically detects user locale from:

1. URL path segment (`/pt-BR/about`)
2. `Accept-Language` header from browser
3. Fallback to English (`en`)

### Example Redirects

- User visits `/` with Portuguese browser → Redirects to `/pt-BR/`
- User visits `/` with Spanish browser → Redirects to `/es/`
- User visits `/` with German browser → Redirects to `/de/`
- User visits `/` with any other language → Redirects to `/en/`

## Adding New Translations

1. Add translation key to `translations/en/{namespace}.json`
2. Translate to other locales (`pt-BR`, `es`, `de`)
3. Use the translation key in your components

## Best Practices

✅ **DO** use `/server` entry point in Server Components
✅ **DO** use `/client` entry point in Client Components
✅ **DO** keep translations organized by namespace
✅ **DO** provide default messages as fallbacks

❌ **DON'T** use main entry point in server components
❌ **DON'T** hardcode text - use translation keys
❌ **DON'T** mix server and client imports

## Bundle Optimization

The package provides separate entry points to optimize bundle size:

- `@diboas/i18n/server` - ~40KB (no React dependencies)
- `@diboas/i18n/client` - ~1.5KB (+ react-intl peer dependency)
- `@diboas/i18n/config` - ~2.7KB (constants only)

## Example: Full Implementation

```typescript
// app/[locale]/layout.tsx (Server Component)
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'pt-BR' },
    { locale: 'es' },
    { locale: 'de' }
  ];
}

export default async function Layout({ children, params }: Props) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return <div lang={locale}>{children}</div>;
}
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type { SupportedLocale, LocaleConfig, I18nProviderProps } from '@diboas/i18n';
```

## Status

✅ **Complete** - All 4 locales implemented
✅ **Production Ready** - Build and type-check passing
✅ **Automatic Detection** - Browser language detection working
✅ **Zero Hardcoded Values** - All text externalized

---

**For implementation details**, see the source code in `packages/i18n/src/`
