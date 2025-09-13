import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import { PageBuilder } from '@/lib/page-builder';
import { bankingPageConfig } from '@/lib/content/pages/banking';

/**
 * Banking Page - Product Page
 * 
 * SEO: Product-specific metadata and structured data
 * i18n: Locale-aware banking content
 * Performance: Static generation with ISR
 * Analytics: Product page tracking
 */

interface BankingPageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({ 
  params 
}: { 
  params: { locale: string } 
}): Promise<Metadata> {
  const locale = params.locale as SupportedLocale;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  return {
    title: bankingPageConfig.metadata.title,
    description: bankingPageConfig.metadata.description,
    keywords: bankingPageConfig.metadata.keywords,
    openGraph: {
      title: bankingPageConfig.metadata.openGraph?.title,
      description: bankingPageConfig.metadata.openGraph?.description,
      url: `https://diboas.com/${locale}/banking`,
      siteName: 'diBoaS',
      images: [
        {
          url: bankingPageConfig.metadata.openGraph?.image || '/assets/social/banking-og.jpg',
          width: 1200,
          height: 630,
          alt: 'diBoaS Banking Services'
        }
      ],
      locale: locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: bankingPageConfig.metadata.twitter?.title,
      description: bankingPageConfig.metadata.twitter?.description,
      images: [bankingPageConfig.metadata.twitter?.image || '/assets/social/banking-twitter.jpg'],
    },
    alternates: {
      canonical: `https://diboas.com/${locale}/banking`,
      languages: {
        'en': 'https://diboas.com/en/banking',
        'pt-BR': 'https://diboas.com/pt-BR/banking',
        'es': 'https://diboas.com/es/banking', 
        'de': 'https://diboas.com/de/banking'
      }
    },
    other: {
      'script:ld+json': JSON.stringify(bankingPageConfig.metadata.jsonLd)
    }
  };
}

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'pt-BR' },
    { locale: 'es' },
    { locale: 'de' }
  ];
}

export default function BankingPage({ params }: BankingPageProps) {
  const locale = params.locale as SupportedLocale;
  
  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <>
      {/* Performance: Preload banking-specific assets */}
      {bankingPageConfig.optimization?.preloadAssets?.map((asset) => (
        <link
          key={asset}
          rel="preload"
          as="image" 
          href={asset}
        />
      ))}
      
      <PageBuilder 
        sections={bankingPageConfig.sections}
        locale={locale}
      />
    </>
  );
}

export const revalidate = 3600;
export const dynamic = 'force-static';