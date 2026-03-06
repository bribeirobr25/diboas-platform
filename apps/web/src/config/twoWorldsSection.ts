/**
 * TwoWorldsSection Configuration
 *
 * Configuration interface for the dual-audience self-selection section.
 * Two side-by-side cards (desktop) / stacked (mobile).
 * Each card: headline, body text, CTA button scrolling to calculator anchor.
 */

export interface TwoWorldsSectionConfig {
  readonly content: {
    readonly header: string;
    readonly cardA: {
      readonly headline: string;
      readonly body: string;
      readonly cta: string;
      readonly ctaHref: string;
      readonly image?: string;
      readonly imageAlt?: string;
    };
    readonly cardB: {
      readonly headline: string;
      readonly body: string;
      readonly cta: string;
      readonly ctaHref: string;
      readonly image?: string;
      readonly imageAlt?: string;
    };
  };
  readonly seo: {
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly category: string;
  };
}
