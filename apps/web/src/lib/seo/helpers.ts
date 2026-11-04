/**
 * SEO Helper Functions
 * Code Reusability: Common SEO utilities
 */

import { SEOMetadataFactory } from './metadata-factory';
import type { SupportedLocale } from '@diboas/i18n/server';
import type { Metadata } from 'next';

/**
 * Convenience wrapper for dynamic page metadata
 */
export async function generateDynamicPageMetadata(
  title: string,
  description: string,
  path: string,
  locale: SupportedLocale
): Promise<Metadata> {
  return SEOMetadataFactory.generateDynamicPageMetadata(title, description, path, locale);
}

/**
 * Generate static params for Next.js locale-based routing
 * DRY Principle: Single source for generateStaticParams across pages
 */
export function generateLocaleStaticParams() {
  return SEOMetadataFactory.generateLocaleStaticParams();
}
