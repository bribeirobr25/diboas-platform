/**
 * ScenarioCards Configuration
 *
 * Configuration interface for real-life scenario cards section.
 */

export interface ScenarioCardsConfig {
  readonly section: {
    readonly title: string;
    readonly transitionHook?: string;
    readonly clarificationLine?: string;
    readonly footnote?: string;
  };
  readonly cards: readonly {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly backgroundImage: string;
    readonly imageAlt: string;
    readonly costComparison?: string;
  }[];
  readonly style?: {
    readonly backgroundColor?: string;
  };
  readonly seo: {
    readonly headingLevel: 'h2';
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly category: string;
  };
}
