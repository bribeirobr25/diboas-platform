/**
 * ScenarioCards Configuration
 *
 * Configuration interface for real-life scenario cards section.
 */

export interface ScenarioCardsConfig {
  readonly section: {
    readonly title: string;
  };
  readonly cards: readonly {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly backgroundImage: string;
    readonly imageAlt: string;
  }[];
  readonly seo: {
    readonly headingLevel: 'h2';
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly category: string;
  };
}
