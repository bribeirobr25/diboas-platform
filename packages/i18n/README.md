# @diboas/i18n - Internationalization Package

Complete internationalization solution for the diBoaS platform with support for 4 locales.

## Supported Locales

- `en` - English (default)
- `pt-BR` - Portuguese (Brazil)
- `es` - Spanish
- `de` - German

## Features

✅ **Automatic Locale Detection** - Browser language detection with fallback to English
✅ **4 Complete Translation Sets** - Common and Marketing translations for all locales
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
  const messages = await loadMessages(locale, 'marketing');

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

Translation files are organized by locale and namespace:

```
packages/i18n/translations/
├── en/
│   ├── common.json      # Navigation, buttons, forms, etc.
│   └── marketing.json   # Hero, domains, mascots, trust content
├── pt-BR/
│   ├── common.json
│   └── marketing.json
├── es/
│   ├── common.json
│   └── marketing.json
└── de/
    ├── common.json
    └── marketing.json
```

## Translation Structure

### common.json

- `navigation` - Menu items and links
- `buttons` - CTA buttons and actions
- `common` - Universal words (and, or, yes, no)
- `forms` - Form validation messages
- `accessibility` - ARIA labels and skip links
- `seo` - Default SEO metadata
- `footer` - Footer content

### marketing.json

- `hero` - Hero section content
- `domains` - Banking, Investing, DeFi content
- `mascots` - Acqua, Mystic, Coral descriptions
- `trust` - Security and trust indicators
- `pages` - Page-specific hero content

## API Reference

### Server-Safe Functions

```typescript
// Load messages for a specific namespace
loadMessages(locale: SupportedLocale, namespace: 'common' | 'marketing'): Promise<Messages>

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
import type {
  SupportedLocale,
  LocaleConfig,
  DomainI18nConfig,
  I18nProviderProps
} from '@diboas/i18n';
```

## Status

✅ **Complete** - All 4 locales implemented
✅ **Production Ready** - Build and type-check passing
✅ **Automatic Detection** - Browser language detection working
✅ **Zero Hardcoded Values** - All text externalized

---

**For implementation details**, see the source code in `packages/i18n/src/`
