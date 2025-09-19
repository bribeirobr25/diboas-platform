import { notFound } from 'next/navigation';
import { isValidLocale, type SupportedLocale } from '@diboas/i18n';
import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { StructuredData } from '@/components/SEO/StructuredData';
import { BRAND_CONFIG } from '@/config/brand';
import type { Metadata } from 'next';

export const dynamic = 'auto';

interface CookiesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

/**
 * Generate metadata for the cookies page
 * SEO Optimization: Dynamic metadata generation with i18n support
 */
export async function generateMetadata({ params }: CookiesPageProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStaticPageMetadata('legal/cookies', locale as SupportedLocale);
}

export default async function CookiesPage({ params }: CookiesPageProps) {
  const { locale: localeParam } = await params;
  const locale = localeParam as SupportedLocale;

  if (!isValidLocale(locale)) {
    notFound();
  }

  // Generate structured data for the cookies page
  const webPageData = MetadataFactory.generateServiceStructuredData({
    name: 'Cookie Policy',
    description: 'Cookie policy and usage information for diBoaS platform',
    category: 'Legal'
  });

  const breadcrumbData = MetadataFactory.generateBreadcrumbs([
    { name: 'Home', url: '/' },
    { name: 'Legal', url: '/legal' },
    { name: 'Cookie Policy', url: '/legal/cookies' }
  ], locale);

  return (
    <>
      <StructuredData data={[webPageData, breadcrumbData]} />
      
      <main className="main-page-wrapper">
        <h1 className="sr-only">Cookie Policy - {BRAND_CONFIG.FULL_NAME}</h1>
        {/* Content will be developed later */}
      </main>
    </>
  );
}