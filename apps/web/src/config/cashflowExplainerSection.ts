/**
 * CashflowExplainerSection Configuration
 *
 * Configuration interface for the Cashflow Investing explainer section.
 * Two-part layout: "Save it" + "Grow it" with micro-example,
 * honest limitation text, brand promise, and CTA.
 */

export interface CashflowExplainerSectionConfig {
  readonly content: {
    readonly header: string;
    readonly partA: {
      readonly title: string;
      readonly body: string;
    };
    readonly partB: {
      readonly title: string;
      readonly body: string;
    };
    readonly microExample: string;
    readonly limitation: string;
    readonly brandPromise: string;
    readonly cta: string;
    readonly ctaHref: string;
    readonly microDisclosure: string;
  };
  readonly seo: {
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly category: string;
  };
}
