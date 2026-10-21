'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { DEFAULT_LOCALE, isSandboxLocale, type SandboxLocale } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';
import { reportError } from '@/lib/monitoring/reportError';

/**
 * The ROOT error boundary (`5.206`, Principle 7 / R-10).
 *
 * **What was measured 2026-09-25:** the sandbox is LIVE and PUBLIC and had
 * exactly ONE boundary — `[locale]/(app)/error.tsx`, which only covers the
 * gated app group. A throw in the root layout, in the locale layout, or on any
 * ungated surface (`/welcome`, `/consent`, `/claim`, `/gate`, `/missing`,
 * `/unavailable`) produced Next's default error screen on a public product.
 *
 * ## Why this file looks different from every other screen
 *
 * `global-error.tsx` REPLACES the root layout, so it must render its own
 * `<html>` and `<body>`, and there is no `IntlProvider` above it —
 * `FormattedMessage` would throw inside the boundary that exists to stop
 * throwing. Copy is therefore resolved directly from the catalogue.
 *
 * ⚑ **NO NEW COPY IS INVENTED HERE.** It renders `error.title`, `error.body`
 * and `error.retry` — the same three keys `(app)/error.tsx` already uses, live
 * in all four locales. The locale comes from the URL because `params` is not
 * available to a global boundary, and falls back to `en`.
 *
 * ⚑ **NO TOKENS, DELIBERATELY.** The root layout is gone, so
 * `globals.css`/`tokens.css` are not guaranteed to have loaded — a token
 * reference here would resolve to nothing and render invisible text. The
 * inline styles are the documented exception, and they are neutral greys, not
 * brand colour: this surface must never be the place a palette is re-stated.
 *
 * ⚑ **NO R-4 play-money disclaimer.** It rides with balances and results, and
 * this screen renders neither — the same reasoning `missing/page.tsx` records.
 *
 * ⛑ **THE LOCALE IS READ THROUGH `useSyncExternalStore`, NOT DURING RENDER**
 * (P0 review, PB-4). Reading `window.location` in the render body gives the
 * server `en` and the client the URL's locale — a hydration mismatch on any
 * path where this boundary is SERVER-rendered. The server snapshot is the
 * default locale; React swaps in the client snapshot after hydration.
 * ⚑ Measured on a production build (2026-10-15): for a ROOT-LAYOUT crash the
 * server sends an empty error shell and this screen renders in the browser
 * only, so the old code showed the right locale there and no mismatch. This
 * change is a defensive correction, not the fix of an observed defect.
 */
function localeFromUrl(): SandboxLocale {
  const segment = window.location.pathname.split('/')[1] ?? '';
  return isSandboxLocale(segment) ? segment : DEFAULT_LOCALE;
}
const serverLocale = (): SandboxLocale => DEFAULT_LOCALE;
/* The URL does not change while this screen is shown; `popstate` covers back/forward. */
function subscribeToUrl(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  return () => window.removeEventListener('popstate', onChange);
}

export default function GlobalError({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Next ≥ 16.3: re-FETCHES and re-renders. `reset` only re-renders the same
      children, so after a server-render error it usually fails again. */
  retry?: () => void;
}) {
  /**
   * ⛑ R-4 · ONE-SHOT EFFECT, GUARDED BY A REF — NOT BY LUCK.
   *
   * `next.config.mjs` sets `reactStrictMode: true`, so in development React
   * runs this effect, tears it down, and runs it AGAIN. Without the ref every
   * crash was reported TWICE, and a sink that duplicates is a sink you stop
   * trusting — "did it happen twice, or is the reporter broken?" is exactly the
   * question an error record exists to answer.
   *
   * Keyed on the error IDENTITY, so a genuinely NEW error still reports. The
   * repository already carries this pattern for the same reason
   * (`useSettleToNow`'s module-level lock).
   */
  const reported = useRef<unknown>(null);
  useEffect(() => {
    if (reported.current === error) return;
    reported.current = error;
    reportError('root', error);
  }, [error]);

  const locale = useSyncExternalStore(subscribeToUrl, localeFromUrl, serverLocale);
  const t = getMessages(locale);

  return (
    <html lang={locale}>
      <head>
        <title>{t['error.title']}</title>
      </head>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          background: '#f7f7f6',
          color: '#1c1c1a',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        {/* `role="alert"` sits INSIDE <main>: on <main> itself it replaced the
            main landmark, which is the one a screen-reader user jumps to. */}
        <main style={{ maxWidth: '28rem', textAlign: 'center' }}>
          <div role="alert">
            <h1 style={{ fontSize: '1.25rem', lineHeight: 1.3, margin: '0 0 0.75rem' }}>
              {t['error.title']}
            </h1>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.55, margin: '0 0 1.5rem' }}>
              {t['error.body']}
            </p>
          </div>
          <button
            type="button"
            onClick={retry ?? reset}
            style={{
              minHeight: '2.75rem',
              padding: '0 1.25rem',
              borderRadius: '0.5rem',
              border: '1px solid #1c1c1a',
              background: '#1c1c1a',
              color: '#f7f7f6',
              fontSize: '0.95rem',
              cursor: 'pointer',
            }}
          >
            {t['error.retry']}
          </button>
        </main>
      </body>
    </html>
  );
}
