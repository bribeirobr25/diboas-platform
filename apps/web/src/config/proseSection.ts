/**
 * ProseSection Configuration
 *
 * Configuration interface for long-form prose content sections.
 * Used for Origin Story and "What's the Catch?" sections.
 */

export interface ProseSectionConfig {
  readonly content: {
    readonly transitionHook?: string;
    readonly header?: string;
    readonly paragraphs: readonly string[];
    readonly signatureLine?: string;
    readonly emphasisLine?: string;
    readonly earlyEmphasisLine?: string;
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
