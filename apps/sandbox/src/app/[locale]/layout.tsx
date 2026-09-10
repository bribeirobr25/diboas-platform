import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces } from 'next/font/google';
import { notFound } from 'next/navigation';
import { isSandboxLocale, SANDBOX_LOCALES } from '@/i18n/config';
import { IntlProviderClient } from '@/components/IntlProviderClient';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeScript } from '@/components/ThemeScript';
import '@/styles/design-tokens.css';
import '@/styles/globals.css';

/**
 * `[locale]` IS the root layout (I-1 sub-phase `1c`, register `5.203`).
 *
 * ## Why the document shell moved down here
 *
 * It used to live in `app/layout.tsx`, which never receives the locale param —
 * so `<html lang>` was hardcoded `"en"` and no nested layout could override it.
 * Every non-English page therefore declared itself English. Verified in
 * production before this change: `/de/welcome`, `/pt-BR/welcome` and
 * `/es/welcome` all served `<html lang="en">`.
 *
 * That is **WCAG 2.1 SC 3.1.1 (Level A)**, and the consequences are concrete:
 * a screen reader speaks Portuguese, Spanish and German copy in an English
 * voice; browser translation offers never appear; hyphenation and locale font
 * selection both fall back to English rules.
 *
 * In the App Router only the ROOT layout may render `<html>`/`<body>`, so
 * making the language correct is not a one-line change — the document shell has
 * to be owned by the segment that knows the language. Hence: no
 * `app/layout.tsx`, and the bare-path locale redirect that used to live in
 * `app/page.tsx` moves into `middleware.ts`, which runs before routing and
 * already exists for the geofence.
 *
 * ## Why `data-mode` is NOT stamped here yet
 *
 * `<html>` is also where the Mode × Appearance contract's mode value belongs
 * (six themes = Appearance × Mode), and moving the shell here is what makes
 * that possible. It is deliberately not stamped in this increment, because the
 * value is **family-determined, not scope-determined**: the Shell Spec puts
 * `welcome` · `consent` · `gate` · `readiness` in S0, which carries *"no
 * financial mode marker"*, and names `claim` as *"the transition seam… the
 * first explicit Practice surface"*. The `S0 | S1 | S2 | S3` family model is
 * `1e`'s first-class value and must *"never be inferred from the route string"*
 * — so stamping a value now would either be wrong for four S0 surfaces or
 * pre-empt that resolver with a route-string guess. `1e` stamps it; this
 * increment gives it somewhere true to live.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-sandbox-serif',
});

export const metadata: Metadata = {
  title: 'diBoaS Sandbox',
  robots: { index: false, follow: false },
};

/** The four locales are a closed set, so the shell prerenders per language. */
export function generateStaticParams() {
  return SANDBOX_LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isSandboxLocale(locale)) notFound();
  return (
    // suppressHydrationWarning: ThemeScript stamps <html data-theme> before
    // hydration (the no-flash pre-paint), so the client <html> carries an
    // attribute the server HTML doesn't. This is shallow — it silences ONLY the
    // <html> element's own attribute diff (the intended data-theme), never any
    // child mismatch. Standard theme-script pattern.
    <html lang={locale} className={fraunces.variable} suppressHydrationWarning>
      <body>
        <ThemeScript />
        <ThemeProvider>
          <IntlProviderClient locale={locale}>{children}</IntlProviderClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
