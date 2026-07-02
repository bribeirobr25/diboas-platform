/**
 * Startup Treasury Section Configuration
 *
 * Config type for the B2B "Startup Treasury" section (business landing, Section 2).
 * Domain-Driven Design: content is decoupled from presentation — every copy field
 * is an i18n key (resolved via useConfigTranslation), never a literal string.
 * Structural fields (image src, CTA hrefs, analytics ids) are literals.
 */

export interface StartupTreasuryStep {
  /** Stable id (analytics/keys) — not translated. */
  readonly id: string;
  /** i18n key for the beat label. */
  readonly label: string;
}

export interface StartupTreasuryCta {
  /** i18n key for the button/link text. */
  readonly text: string;
  /** Literal href (internal path or hash) — not translated. */
  readonly href: string;
}

export interface StartupTreasurySectionConfig {
  readonly content: {
    /** i18n key. */
    readonly eyebrow: string;
    /** i18n key. */
    readonly headline: string;
    /** i18n key. */
    readonly subheadline: string;
    /** i18n keys, one per body paragraph. */
    readonly body: readonly string[];
  };
  /** Operating-floor mechanic as an ordered 3-beat strip. */
  readonly steps: readonly StartupTreasuryStep[];
  readonly image: {
    /** Literal asset path — not translated. */
    readonly src: string;
    /** i18n key for alt text. */
    readonly alt: string;
    /** Image column side on desktop (default 'right'). */
    readonly position?: 'left' | 'right';
  };
  readonly cta: {
    /** i18n key — tool-CTA bridge line above the buttons. */
    readonly bridgeLine: string;
    /** Secondary, lighter CTA (ghost + arrow → calculator). */
    readonly secondary: StartupTreasuryCta;
    /** Primary, solid CTA (Talk to Bar). */
    readonly primary: StartupTreasuryCta;
  };
  readonly style: {
    readonly backgroundColor: string;
    readonly verticalPadding?: 'standard' | 'generous';
  };
  readonly seo: {
    /** i18n key for the section aria-label. */
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly trackingPrefix: string;
  };
}
