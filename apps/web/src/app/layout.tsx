import type { Metadata } from "next";
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
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: {
    template: `${UI_LAYOUT_CONSTANTS.TITLE_TEMPLATE} | ${BRAND_CONFIG.NAME}`,
    default: `${BRAND_CONFIG.NAME} - ${BRAND_CONFIG.TAGLINE}`
  },
  description: BRAND_CONFIG.DESCRIPTION,
  icons: {
    icon: [
      { url: '/favicon.avif', type: 'image/avif' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.avif',
    apple: '/assets/logos/logo-icon.avif',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={UI_LAYOUT_CONSTANTS.DEFAULT_LOCALE} suppressHydrationWarning>
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
