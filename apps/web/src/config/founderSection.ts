/**
 * FounderSection Configuration
 *
 * Configuration interface for the About the Founder section.
 * Simple 2-column layout: circular photo + paragraphs + contact link.
 */

export interface FounderSectionConfig {
  readonly content: {
    readonly header: string;
    readonly paragraphs: readonly string[];
    readonly emailText?: string;
    readonly emailHref?: string;
    readonly socialLinks?: readonly {
      readonly label: string;
      readonly href: string;
      readonly icon: string;
    }[];
  };
  readonly image?: {
    readonly src: string;
    readonly alt: string;
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
