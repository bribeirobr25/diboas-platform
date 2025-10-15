/**
 * Content Management Types
 * Content Abstraction: Type definitions for content system
 * DDD: Domain-driven content modeling
 */

import type { SupportedLocale } from '@diboas/i18n/server';

export interface ContentMetadata {
  id: string;
  type: 'page' | 'section' | 'component';
  locale: SupportedLocale;
  lastModified: string;
  version: string;
}

export interface PageContent {
  metadata: ContentMetadata;
  seo: {
    title: string;
    description: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  sections: ContentSection[];
}

export interface ContentSection {
  id: string;
  type: string;
  order: number;
  isVisible: boolean;
  content: Record<string, any>;
  variant?: string;
}

export interface ContentField {
  id: string;
  type: 'text' | 'richtext' | 'image' | 'url' | 'number' | 'boolean' | 'array';
  value: any;
  metadata?: {
    alt?: string;
    caption?: string;
    source?: string;
  };
}

export interface ContentService {
  getPageContent(pageId: string, locale: SupportedLocale): Promise<PageContent | null>;
  getSectionContent(sectionId: string, locale: SupportedLocale): Promise<ContentSection | null>;
  getFieldValue<T = any>(fieldId: string, defaultValue?: T): T;
  updateContent(content: Partial<PageContent>): Promise<void>;
  validateContent(content: PageContent): boolean;
}

export interface ContentConfig {
  defaultLocale: SupportedLocale;
  fallbackLocale: SupportedLocale;
  cacheTtl: number;
  validateOnLoad: boolean;
}