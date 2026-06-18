/**
 * ProseSection Configuration
 *
 * Configuration interface for long-form prose content sections.
 * Used for Origin Story and "What's the Catch?" sections.
 */

export interface ProseSectionConfig {
  readonly content: {
    /** Optional editorial eyebrow/kicker rendered above the header. */
    readonly eyebrow?: string;
    readonly transitionHook?: string;
    readonly header?: string;
    readonly paragraphs: readonly string[];
    readonly signatureLine?: string;
    readonly emphasisLine?: string;
    readonly earlyEmphasisLine?: string;
    /**
     * Phase 8 Item B (CC8 closeout): optional fee-paragraph injection.
     * `feeParagraph` is a translation key whose ICU template carries
     * `{sellRate}` / `{maxFee}` / `{exampleFee}` slots resolved via the
     * omnibus map. It REPLACES `paragraphs[feeParagraphAt[locale]]` at
     * render time, allowing each locale to position the fee citation
     * at its narrative-appropriate index (pt-BR uses index 3 due to
     * BRL framing in earlier paragraphs; en/es/de use index 4).
     */
    readonly feeParagraph?: string;
    readonly feeParagraphAt?: Partial<Record<'en' | 'pt-BR' | 'es' | 'de', number>>;
  };
  readonly image?: {
    readonly src: string;
    readonly alt: string;
    readonly position?: 'left' | 'right';
    readonly aspectRatio?: 'landscape' | 'portrait';
  };
  readonly style: {
    readonly backgroundColor: string;
    readonly maxWidth?: string;
    readonly verticalPadding?: 'standard' | 'generous';
    readonly headerStyle?: 'inline' | 'centered';
  };
  readonly seo: {
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly category: string;
  };
}
