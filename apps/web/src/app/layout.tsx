import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BRAND_CONFIG } from '@/config/brand';
import { UI_LAYOUT_CONSTANTS } from '@/config/ui-constants';
import { WebVitalsTracker } from '@/components/Performance/WebVitalsTracker';
import "./globals.css";

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
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.avif', type: 'image/avif' }
    ],
    shortcut: '/favicon.png',
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
      </head>
      <body
        className={`${UI_LAYOUT_CONSTANTS.BODY_BASE_CLASS} ${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <WebVitalsTracker
          debug={process.env.NODE_ENV === 'development'}
          sampleRate={process.env.NODE_ENV === 'production' ? 0.1 : 0.1}
        />
        {children}
      </body>
    </html>
  );
}
