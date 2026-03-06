/**
 * DualCtaSection Configuration
 *
 * Configuration interface for the Social Proof + Dual CTA section.
 * Path A: WaitlistForm (email signup for SMBs).
 * Path B: cal.com booking link + email fallback (for startups).
 * Uses useWaitlistStats() hook for live counter.
 */

export interface DualCtaSectionConfig {
  readonly content: {
    readonly header: string;
    readonly counterTemplate: string;
    readonly pathA: {
      readonly header: string;
      readonly description: string;
      readonly emailPlaceholder: string;
      readonly cta: string;
      readonly noSpam: string;
      readonly privacyLabel: string;
    };
    readonly pathB: {
      readonly header: string;
      readonly description: string;
      readonly cta: string;
      readonly ctaHref: string;
      readonly alternative: string;
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
