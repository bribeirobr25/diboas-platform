import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { I18nProvider } from '@diboas/i18n';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import { SkipLinks } from '@/components/accessibility/SkipLinks';
import { LiveRegion } from '@/components/accessibility/LiveRegion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

/**
 * Marketing Layout - Localized Pages
 * 
 * i18n: Locale-aware layout with proper validation
 * Accessibility: Skip links and live regions
 * SEO: Proper metadata and language attributes
 * Security: Locale validation and sanitization
 */

interface MarketingLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

// SEO: Generate metadata for marketing pages
export async function generateMetadata({ 
  params 
}: { 
  params: { locale: string } 
}): Promise<Metadata> {
  const locale = params.locale as SupportedLocale;
  
  // Security: Validate locale
  if (!isValidLocale(locale)) {
    notFound();
  }

  return {
    title: {
      template: '%s | diBoaS',
      default: 'diBoaS - Financial Freedom Made Simple'
    },
    description: 'Manage your banking, investing, and DeFi assets all in one secure platform. The future of finance is here.',
    keywords: [
      'digital banking',
      'cryptocurrency investing', 
      'DeFi platform',
      'financial freedom',
      'secure banking'
    ],
    authors: [{ name: 'diBoaS Team' }],
    creator: 'diBoaS',
    publisher: 'diBoaS',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // SEO: Language alternates
    alternates: {
      canonical: `https://diboas.com/${locale}`,
      languages: {
        'en': 'https://diboas.com/en',
        'pt-BR': 'https://diboas.com/pt-BR', 
        'es': 'https://diboas.com/es',
        'de': 'https://diboas.com/de',
      }
    },
    // Performance: Preconnect to external domains
    other: {
      'link': [
        '<https://fonts.googleapis.com>; rel=preconnect',
        '<https://cdn.diboas.com>; rel=dns-prefetch'
      ].join(', ')
    }
  };
}

// Performance: Static generation for supported locales
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'pt-BR' },
    { locale: 'es' },
    { locale: 'de' }
  ];
}

export default async function MarketingLayout({ 
  children, 
  params 
}: MarketingLayoutProps) {
  const locale = params.locale as SupportedLocale;
  
  // Security: Validate locale parameter
  if (!isValidLocale(locale)) {
    notFound();
  }

  // Load translations for the locale
  const messages = await loadMessages(locale, 'marketing');

  return (
    <html lang={locale} dir="ltr" className="scroll-smooth">
      <head>
        {/* Performance: Critical CSS can be inlined here */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#14b8a6" />
        
        {/* Security: Content Security Policy */}
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googletagmanager.com *.google-analytics.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: blob: *.diboas.com; connect-src 'self' *.google-analytics.com *.doubleclick.net;" />
      </head>
      
      <body className="font-sans antialiased bg-white text-neutral-900">
        {/* Accessibility: Skip navigation links */}
        <SkipLinks />
        
        {/* i18n: Internationalization provider */}
        <I18nProvider 
          locale={locale}
          messages={messages}
          namespace="marketing"
        >
          {/* Accessibility: Live region for announcements */}
          <LiveRegion />
          
          {/* Marketing site structure */}
          <div className="flex min-h-screen flex-col">
            <Header currentLocale={locale} />
            
            <main 
              id="main-content"
              className="flex-1"
              tabIndex={-1}
            >
              {children}
            </main>
            
            <Footer currentLocale={locale} />
          </div>
        </I18nProvider>
        
        {/* Analytics: Google Analytics (conditional) */}
        {process.env.NODE_ENV === 'production' && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                    language: '${locale}',
                    custom_map: {
                      dimension1: 'locale',
                      dimension2: 'page_type'
                    }
                  });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}

// Performance: Load translations dynamically
async function loadMessages(locale: SupportedLocale, namespace: string) {
  try {
    // Load common messages
    const common = await import(`@diboas/i18n/translations/${locale}/common.json`);
    
    // Load namespace-specific messages
    const namespaceMessages = await import(`@diboas/i18n/translations/${locale}/${namespace}.json`);
    
    return {
      ...common.default,
      ...namespaceMessages.default
    };
  } catch (error) {
    console.error(`Failed to load messages for ${locale}/${namespace}:`, error);
    
    // Error Handling: Fallback to English
    const fallback = await import(`@diboas/i18n/translations/en/${namespace}.json`);
    return fallback.default;
  }
}