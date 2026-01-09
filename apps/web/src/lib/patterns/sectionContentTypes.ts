/**
 * Section Content Type Definitions
 *
 * Content patterns and structures
 */

/**
 * Base content item interface
 */
export interface BaseSectionContentItem {
  /** Unique identifier */
  id: string;

  /** Display title */
  title: string;

  /** Description or subtitle */
  description?: string;

  /** Associated media assets */
  media?: {
    image?: string;
    video?: string;
    audio?: string;
    alt?: string;
  };

  /** Call-to-action configuration */
  cta?: {
    text: string;
    href: string;
    target?: '_blank' | '_self';
    rel?: string;
  };

  /** Metadata for tracking and organization */
  metadata?: Record<string, unknown>;
}

/**
 * Content collection interface
 */
export interface SectionContentCollection<T extends BaseSectionContentItem = BaseSectionContentItem> {
  /** Collection of content items */
  items: T[];

  /** Collection metadata */
  meta: {
    total: number;
    displayOrder: 'sequential' | 'random' | 'priority';
    pagination?: {
      enabled: boolean;
      itemsPerPage: number;
    };
  };
}
