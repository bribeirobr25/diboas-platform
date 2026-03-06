/**
 * ExpandableSection Configuration
 *
 * Configuration interface for collapsible content sections.
 * Used for "Under the Hood" technical details.
 */

export interface ExpandableSectionConfig {
  readonly content: {
    readonly toggleLabel: string;
    readonly paragraphs: readonly string[];
    readonly linkText?: string;
    readonly linkHref?: string;
  };
  readonly style?: {
    readonly backgroundColor?: string;
  };
  readonly seo: {
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly category: string;
  };
}
