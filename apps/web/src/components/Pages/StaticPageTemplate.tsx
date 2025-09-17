/**
 * Static Page Template
 * Code Reusability: Reusable template for all static pages
 * SEO Optimization: Consistent structure across pages
 */

import { generateStaticPageMetadata, MetadataFactory } from '@/lib/seo';
import { PAGE_SEO_CONFIG } from '@/lib/seo/constants';
import { StructuredData } from '@/components/SEO/StructuredData';
import type { SupportedLocale } from '@diboas/i18n';
import type { Metadata } from 'next';

interface StaticPageTemplateProps {
  pageKey: string;
  locale: SupportedLocale;
  children?: React.ReactNode;
}

export function StaticPageTemplate({ pageKey, locale, children }: StaticPageTemplateProps) {
  // Generate breadcrumbs based on page path
  const generateBreadcrumbs = (pageKey: string): Array<{ name: string; url?: string }> => {
    const pathParts = pageKey.split('/');
    const breadcrumbs: Array<{ name: string; url?: string }> = [{ name: 'Home', url: '/' }];

    let currentPath = '';
    pathParts.forEach((part, index) => {
      currentPath += `/${part}`;
      const isLast = index === pathParts.length - 1;

      breadcrumbs.push({
        name: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
        url: isLast ? undefined : currentPath
      });
    });

    return breadcrumbs;
  };

  // Generate structured data for the page
  const breadcrumbData = MetadataFactory.generateBreadcrumbs(
    generateBreadcrumbs(pageKey),
    locale
  );

  return (
    <>
      <StructuredData data={breadcrumbData} />

      <div className="page-wrapper">
        <div className="page-content-container">
          {children || (
            <div className="page-content-center">
              <div className="page-content-text-center">
                <h1 className="page-title-construction">
                  Page Under Construction
                </h1>
                <p className="page-description-construction">
                  This page is being built. Check back soon for content.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/**
 * Generate metadata for static pages
 * SEO: Centralized metadata generation
 */
export async function generatePageMetadata(
  pageKey: string,
  locale: SupportedLocale
): Promise<Metadata> {
  // Ensure pageKey is valid by checking if it exists in the config
  if (pageKey in PAGE_SEO_CONFIG) {
    return generateStaticPageMetadata(pageKey as keyof typeof PAGE_SEO_CONFIG, locale);
  }
  // Fallback to home if pageKey is not found
  console.warn(`Invalid pageKey: ${pageKey}, falling back to home`);
  return generateStaticPageMetadata('home', locale);
}