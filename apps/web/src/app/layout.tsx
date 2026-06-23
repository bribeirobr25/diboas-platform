import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import { Inter, Geist, Space_Grotesk, Fraunces, IBM_Plex_Mono } from 'next/font/google';
import { BRAND_CONFIG } from '@/config/brand';
import { UI_LAYOUT_CONSTANTS } from '@/config/ui-constants';
import { WebVitalsTracker } from '@/components/Performance/WebVitalsTracker';
import { MonitoringInit } from '@/components/Performance/MonitoringInit';
import { PostHogProvider, GoogleAnalyticsLoader } from '@/components/Providers';
import './globals.css';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
});

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});

// Space Grotesk — display/heading face for the cinematic redesign.
// Self-hosted at build time via next/font (GDPR/CSP-safe; no runtime Google Fonts).
const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  weight: ['500', '600', '700'],
  fallback: ['system-ui', 'arial'],
  adjustFontFallback: true,
});

// Fraunces (serif) + IBM Plex Mono — the editorial typeface system for /market
// ("Adelaide Daily"), replicating 02-editorial-motion. Self-hosted via next/font.
// Not preloaded: only /market uses them, so they load on-demand for that route.
const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  display: 'swap',
  axes: ['opsz'],
  style: ['normal', 'italic'],
  fallback: ['Georgia', 'serif'],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  fallback: ['ui-monospace', 'monospace'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export const metadata: Metadata = {
  title: {
    template: `${UI_LAYOUT_CONSTANTS.TITLE_TEMPLATE} | ${BRAND_CONFIG.NAME}`,
    default: `${BRAND_CONFIG.NAME} - ${BRAND_CONFIG.TAGLINE}`,
  },
  // V2 (audit/2026-05-08 visual review): the root-level `description`
  // here was rendering as a SECOND `<meta name="description">` tag in
  // every locale, BEFORE the per-page localized description. Search
  // crawlers picked up the first (English brand default), making every
  // localized page appear as English to Google. Page-level
  // generateMetadata already provides a description for each route, so
  // removing this root default has no fallback impact for production
  // pages.
  // description: BRAND_CONFIG.DESCRIPTION,
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/favicon.avif', type: 'image/avif' }],
    shortcut: '/favicon.avif',
    apple: '/assets/logos/logo-icon.avif',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? undefined;
  // Phase 2 L1 (audit/2026-05-08): expose x-request-id to the client
  // Logger via a meta tag, so Sentry/Logger events on the client can
  // be correlated back to the originating server request.
  const requestId = headersList.get('x-request-id') ?? undefined;
  // V3 (audit/2026-05-08 visual review): middleware sets `x-locale`
  // based on the URL prefix; we read it here so SSR `<html lang>`
  // matches the actual locale being served. Was previously hard-coded
  // to DEFAULT_LOCALE, which gave Google + screen readers `en` for
  // every locale. Falls back to DEFAULT_LOCALE for the root redirect
  // and for any request middleware didn't tag.
  const htmlLang = headersList.get('x-locale') ?? UI_LAYOUT_CONSTANTS.DEFAULT_LOCALE;

  return (
    <html
      lang={htmlLang}
      className={`${inter.variable} ${geist.variable} ${spaceGrotesk.variable} ${fraunces.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta charSet="utf-8" />
        {/*
          V2 (audit/2026-05-08 visual review): hardcoded `<meta name="description">`
          removed — Next.js's metadata API renders one from
          `export const metadata.description` below, plus per-page overrides
          from each route's `generateMetadata`. Having both produced two
          `<meta name="description">` tags in the rendered HTML, with the
          hardcoded brand default winning over the localized per-page text.
        */}
        {requestId && <meta name="x-request-id" content={requestId} />}
        {/* Google Fonts removed for GDPR compliance - using next/font/google self-hosted */}
        <link rel="preconnect" href="https://vitals.vercel-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link
          rel="preconnect"
          href="https://region1.google-analytics.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://diboas.com" />
        <link rel="dns-prefetch" href="https://cdn.diboas.com" />
        <script
          type="application/ld+json"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'diBoaS',
              url: 'https://diboas.com',
              logo: 'https://diboas.com/assets/logos/logo-icon.avif',
            }),
          }}
        />
        {/* Google Analytics 4 with Consent Mode */}
        {GA_MEASUREMENT_ID && (
          <>
            <script
              nonce={nonce}
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}

                // Default: deny analytics until consent is given (GDPR compliant)
                gtag('consent', 'default', {
                  'analytics_storage': 'denied',
                  'ad_storage': 'denied',
                  'wait_for_update': 500
                });

                // Check for existing consent in localStorage
                try {
                  var consent = JSON.parse(localStorage.getItem('diboas-cookie-consent') || '{}');
                  if (consent.analytics && consent.version === '1.0') {
                    gtag('consent', 'update', { 'analytics_storage': 'granted' });
                  }
                } catch(e) {}

                // Listen for consent changes — registered on \`window\`, intentionally
                // without a corresponding removeEventListener: this is an inline
                // bootstrap script (not a React component), so the listener is
                // tied to the document lifecycle. GA4 needs to receive every
                // consent toggle for as long as the page is open. Phase 3 L12
                // (audit/2026-05-08): documented to silence the parity-rule heuristic.
                window.addEventListener('cookie-consent-changed', function(e) {
                  if (e.detail && e.detail.analytics) {
                    gtag('consent', 'update', { 'analytics_storage': 'granted' });
                  } else {
                    gtag('consent', 'update', { 'analytics_storage': 'denied' });
                  }
                });
              `,
              }}
            />
            {/* GA4 script (gtag/js) loads only AFTER consent — defers ~67 KB.
                The inline Consent Mode v2 bootstrap above keeps the contract
                with Google (default-denied + DOM-event listener for that
                pre-hydration script). The script-loading gate is here in a
                React component subscribing to applicationEventBus. */}
            <GoogleAnalyticsLoader measurementId={GA_MEASUREMENT_ID!} nonce={nonce} />
          </>
        )}
      </head>
      <body className={UI_LAYOUT_CONSTANTS.BODY_BASE_CLASS} suppressHydrationWarning>
        <PostHogProvider>
          <MonitoringInit />
          <WebVitalsTracker
            debug={process.env.NODE_ENV === 'development'}
            sampleRate={process.env.NODE_ENV === 'production' ? 0.1 : 0.1}
          />
          {children}
        </PostHogProvider>
      </body>
    </html>
  );
}
