import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n/server';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { BRAND_CONFIG } from '@/config/brand';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface PrivacyPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the privacy page
 * SEO Optimization: Dynamic metadata generation with i18n support
 */
export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('legal/privacy', locale as SupportedLocale);
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Generate structured data for the privacy page
  const webPageData = MetadataFactory.generateServiceStructuredData({
    name: 'Privacy Policy',
    description: 'Privacy policy and data protection information for diBoaS platform',
    category: 'Legal'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Legal', url: '/legal' },
    { name: 'Privacy Policy', url: '/legal/privacy' }
  ], locale);

  return (
    <>
      <StructuredData data={[webPageData, breadcrumbData]} />
      
      <main className="main-page-wrapper">
        <h1 className="sr-only">Privacy Policy - {BRAND_CONFIG.FULL_NAME}</h1>
        {/* Content will be developed later */}
      </main>
    </>
  );
}