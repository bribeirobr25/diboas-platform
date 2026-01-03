import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { BRAND_CONFIG } from '@/config/brand';
import { UI_LAYOUT_CONSTANTS } from '@/config/ui-constants';
import { WebVitalsTracker } from '@/components/Performance/WebVitalsTracker';
import { PostHogProvider } from '@/components/Providers';
import "./globals.css";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
  fallback: ['ui-monospace', 'Courier New', 'monospace'],
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
    default: `${BRAND_CONFIG.NAME} - ${BRAND_CONFIG.TAGLINE}`
  },
  description: BRAND_CONFIG.DESCRIPTION,
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.avif', type: 'image/avif' }
    ],
    shortcut: '/favicon.svg',
    apple: '/assets/logos/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={UI_LAYOUT_CONSTANTS.DEFAULT_LOCALE} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="description" content={BRAND_CONFIG.DESCRIPTION} />
        {/* Google Fonts removed for GDPR compliance - using next/font/google self-hosted */}
        <link rel="preconnect" href="https://vitals.vercel-analytics.com" />
        <link rel="dns-prefetch" href="https://diboas.com" />
        <link rel="dns-prefetch" href="https://cdn.diboas.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'diBoaS',
              url: 'https://diboas.com',
              logo: 'https://diboas.com/assets/logos/logo-icon.avif'
            })
          }}
        />
        {/* Google Analytics 4 with Consent Mode */}
        {GA_MEASUREMENT_ID && (
          <>
            <Script id="gtag-consent-default" strategy="beforeInteractive">
              {`
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

                // Listen for consent changes
                window.addEventListener('cookie-consent-changed', function(e) {
                  if (e.detail && e.detail.analytics) {
                    gtag('consent', 'update', { 'analytics_storage': 'granted' });
                  } else {
                    gtag('consent', 'update', { 'analytics_storage': 'denied' });
                  }
                });
              `}
            </Script>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body
        className={`${UI_LAYOUT_CONSTANTS.BODY_BASE_CLASS} ${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <PostHogProvider>
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
