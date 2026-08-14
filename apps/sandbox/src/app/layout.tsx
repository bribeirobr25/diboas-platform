import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Fraunces } from 'next/font/google';
import { ThemeProvider } from '../components/ThemeProvider';
import { ThemeScript } from '../components/ThemeScript';
import '../styles/design-tokens.css';
import '../styles/globals.css';

/**
 * Fraunces — a warm, characterful editorial serif for display headlines (the
 * diBoaS-editorial direction). Self-hosted by next/font at build time: no
 * runtime external request, CSP-clean, $0. Falls back to a system serif.
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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body>
        <ThemeScript />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
