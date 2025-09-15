/**
 * SEO Helper Functions
 * Code Reusability: Common SEO utilities
 */

import { MetadataFactory } from './metadata-factory';
import { PAGE_SEO_CONFIG } from './constants';
import type { SupportedLocale } from '@diboas/i18n';
import type { Metadata } from 'next';

/**
 * Convenience wrapper for static page metadata
 */
export async function generateStaticPageMetadata(
  pageKey: keyof typeof PAGE_SEO_CONFIG,
  locale: SupportedLocale
): Promise<Metadata> {
  return MetadataFactory.generateStaticPageMetadata(pageKey, locale);
}

/**
 * Convenience wrapper for dynamic page metadata
 */
export async function generateDynamicPageMetadata(
  title: string,
  description: string,
  path: string,
  locale: SupportedLocale
): Promise<Metadata> {
  return MetadataFactory.generateDynamicPageMetadata(title, description, path, locale);
}