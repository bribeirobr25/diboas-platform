import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces } from 'next/font/google';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { isSandboxLocale, SANDBOX_LOCALES } from '@/i18n/config';
import { IntlProviderClient } from '@/components/IntlProviderClient';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ThemeScript } from '@/components/ThemeScript';
import '@/styles/tokens.css';
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
 * ## Why this file does not stamp the mode
 *
 * `<html>` is also where the Mode × Appearance contract's mode value belongs
 * (six themes = Appearance × Mode), and owning the document shell here is what
 * made that possible. It is not stamped HERE because the value is
 * **family-determined, not scope-determined**: the Shell Spec puts `welcome` ·
 * `consent` · `gate` · `readiness` in S0, which carries *"no financial mode
 * marker"*, and names `claim` as *"the transition seam… the first explicit
 * Practice surface"*. This layout cannot know which child surface is rendering,
 * and reading `headers()` to find out would make every page dynamic. So I-1e's
 * `AppShell` stamps it from the declared `S0 | S1 | S2 | S3` family registry
 * via `ModeStamp` — which is also the ONLY writer of those attributes
 * (`SHELL-3`), and never infers them from the route string. This increment gave
 * the value somewhere true to live.
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

  // The CSP nonce, minted per request by `middleware.ts` and forwarded on the
  // request headers. `ThemeScript` is inline and `script-src` carries no
  // `'unsafe-inline'`, so without this the pre-paint theme is blocked and every
  // visit flashes the wrong design (register `5.212`).
  //
  // ⚑ This is NOT the `headers()` call the comment above warns about. That
  // warning is about inferring the SHELL FAMILY here to stamp the mode, which
  // would couple the document shell to whichever child is rendering — `ModeStamp`
  // owns that instead (`SHELL-3`). Reading a per-request nonce costs nothing
  // extra: this layout is already dynamic, because it awaits `params` one line
  // above. Same pattern as `apps/web/src/app/layout.tsx`, in production today.
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    // suppressHydrationWarning: ThemeScript stamps <html data-theme> before
    // hydration (the no-flash pre-paint), so the client <html> carries an
    // attribute the server HTML doesn't. This is shallow — it silences ONLY the
    // <html> element's own attribute diff (the intended data-theme), never any
    // child mismatch. Standard theme-script pattern.
    <html lang={locale} className={fraunces.variable} suppressHydrationWarning>
      <body>
        <ThemeScript nonce={nonce} />
        <ThemeProvider>
          <IntlProviderClient locale={locale}>{children}</IntlProviderClient>
        </ThemeProvider>
      </body>
    </html>
  );
}
