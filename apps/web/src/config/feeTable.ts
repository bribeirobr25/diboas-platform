/**
 * FeeTable Configuration
 *
 * Configuration interface for the transparent fee comparison table section.
 * 4-column layout: Action | diBoaS | Competitors | Difference
 * Optional 5th column: Example
 */

export interface FeeTableConfig {
  readonly content: {
    readonly title: string;
    readonly subtitle?: string;
    readonly disclaimer: string;
    readonly example: string;
    readonly painIntro?: string;
    readonly footerLine?: string;
    readonly transitionHook?: string;
    readonly headers: {
      readonly action: string;
      readonly diboas: string;
      readonly competitors: string;
      readonly difference: string;
      readonly example?: string;
    };
    readonly rows: readonly {
      readonly id: string;
      readonly action: string;
      readonly diboas: string;
      readonly competitors: string;
      readonly difference: string;
      readonly example?: string;
      readonly isFree?: boolean;
      readonly isHighlight?: boolean;
    }[];
  };
  readonly seo: {
    readonly headingLevel: 'h2';
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly category: string;
  };
  /** Lean mode: when set, only the first N rows show until expanded. The expand
   *  also reveals `expandedSlot` (e.g. the comparison chart). Omit for a full table. */
  readonly previewRows?: number;
  /** i18n key for the expand toggle label (e.g. "See the numbers"). */
  readonly expandToggleLabel?: string;
}
