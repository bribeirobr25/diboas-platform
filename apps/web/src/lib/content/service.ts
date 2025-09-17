/**
 * Content Management Service
 * Service Agnostic Abstraction: Centralized content logic
 * Future-Proof: Easy integration with CMS or external services
 */

import { ContentService, PageContent, ContentSection, ContentConfig } from './types';
import { CONTENT_DEFAULTS } from './constants';
import type { SupportedLocale } from '@diboas/i18n';

class ContentServiceImpl implements ContentService {
  private config: ContentConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: ContentConfig = CONTENT_DEFAULTS) {
    this.config = config;
  }

  /**
   * Get page content with fallback support
   * DRY Principle: Centralized content retrieval
   */
  async getPageContent(pageId: string, locale: SupportedLocale): Promise<PageContent | null> {
    const cacheKey = `page_${pageId}_${locale}`;

    // Check cache first
    const cached = this.getCachedContent(cacheKey);
    if (cached) return cached;

    try {
      // Try to load content for the requested locale
      let content = await this.loadPageContent(pageId, locale);

      // Fallback to default locale if content not found
      if (!content && locale !== this.config.fallbackLocale) {
        content = await this.loadPageContent(pageId, this.config.fallbackLocale);
      }

      if (content) {
        // Validate content if enabled
        if (this.config.validateOnLoad && !this.validateContent(content)) {
          console.warn(`Invalid content structure for page: ${pageId}`);
          return null;
        }

        // Cache the content
        this.setCachedContent(cacheKey, content);
      }

      return content;
    } catch (error) {
      console.error(`Failed to load page content: ${pageId}`, error);
      return null;
    }
  }

  /**
   * Get section content with caching
   * Performance: Reduce redundant content loading
   */
  async getSectionContent(sectionId: string, locale: SupportedLocale): Promise<ContentSection | null> {
    const cacheKey = `section_${sectionId}_${locale}`;

    const cached = this.getCachedContent(cacheKey);
    if (cached) return cached;

    try {
      const content = await this.loadSectionContent(sectionId, locale);
      if (content) {
        this.setCachedContent(cacheKey, content);
      }
      return content;
    } catch (error) {
      console.error(`Failed to load section content: ${sectionId}`, error);
      return null;
    }
  }

  /**
   * Get field value with type safety and defaults
   * Code Reusability: Common field access pattern
   */
  getFieldValue<T = any>(fieldId: string, defaultValue?: T): T {
    // This method would typically access a content store or context
    // For now, return the default value as this is the abstraction layer

    if (defaultValue !== undefined) {
      return defaultValue;
    }

    throw new Error(`Field '${fieldId}' not found and no default value provided`);
  }

  /**
   * Update content (Future: CMS integration)
   * Flexibility: Support for dynamic content updates
   */
  async updateContent(content: Partial<PageContent>): Promise<void> {
    // Future: Implement content updates for CMS integration
    console.log('Content update requested:', content);

    // Clear related cache entries
    if (content.metadata?.id) {
      this.clearCacheByPrefix(`page_${content.metadata.id}`);
    }
  }

  /**
   * Validate content structure
   * Data Integrity: Ensure content meets schema requirements
   */
  validateContent(content: PageContent): boolean {
    try {
      // Basic validation - extend as needed
      if (!content.metadata?.id || !content.metadata?.type) {
        return false;
      }

      if (!content.seo?.title || !content.seo?.description) {
        return false;
      }

      if (!Array.isArray(content.sections)) {
        return false;
      }

      // Validate each section
      for (const section of content.sections) {
        if (!section.id || !section.type || typeof section.order !== 'number') {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Private: Load page content from source
   * Abstraction: Hide implementation details
   */
  private async loadPageContent(pageId: string, locale: SupportedLocale): Promise<PageContent | null> {
    // Future: Replace with actual content loading logic
    // This could be file system, API, CMS, etc.

    // For now, return null to indicate no content found
    // This allows the system to work without breaking
    return null;
  }

  /**
   * Private: Load section content from source
   */
  private async loadSectionContent(sectionId: string, locale: SupportedLocale): Promise<ContentSection | null> {
    // Future: Implement section content loading
    return null;
  }

  /**
   * Private: Cache management
   */
  private getCachedContent(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.config.cacheTtl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCachedContent(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private clearCacheByPrefix(prefix: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const contentService = new ContentServiceImpl();