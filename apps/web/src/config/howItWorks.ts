/**
 * "How it works" visual section configuration.
 *
 * Replaces the plain text steps with product screens shown in phone frames,
 * each keeping its existing one-line caption. Config-driven (i18n keys) so the
 * Factory's `useConfigTranslation` resolves copy per locale. Image paths are
 * populated once the rendered phone mockups land in
 * `public/assets/images/how-it-works/`; an empty `image` renders a placeholder
 * frame so the section is previewable before the assets exist.
 */

export interface HowItWorksStep {
  /** i18n key — the one-line caption shown under the phone. */
  readonly caption: string;
  /** i18n key — alt text describing the product screen (a11y). */
  readonly imageAlt: string;
  /** Image path for the phone screen. Empty string renders a placeholder frame. */
  readonly image: string;
}

export interface HowItWorksConfig {
  /** Visual variant. `threeUp` (default) = three phones in a responsive row. */
  readonly variant?: 'threeUp';
  readonly content: {
    /** i18n key for the section header. */
    readonly header: string;
    readonly steps: readonly HowItWorksStep[];
  };
  readonly seo: {
    /** i18n key for the section aria-label. */
    readonly ariaLabel: string;
  };
  readonly analytics: {
    readonly sectionId: string;
    readonly category: string;
  };
}

/**
 * Default config for the en/de/es EU spine (shared `draper.*` keys). Captions
 * reuse the existing `howItWorks.step1/2/3`; the `*Alt` keys are new. Image
 * paths are placeholders until the mockups are produced.
 */
export const B2C_HOW_IT_WORKS_VISUAL_CONFIG: HowItWorksConfig = {
  variant: 'threeUp',
  content: {
    header: 'landing-b2c.draper.howItWorks.header',
    steps: [
      {
        caption: 'landing-b2c.draper.howItWorks.step1',
        imageAlt: 'landing-b2c.draper.howItWorks.step1Alt',
        image: '',
      },
      {
        caption: 'landing-b2c.draper.howItWorks.step2',
        imageAlt: 'landing-b2c.draper.howItWorks.step2Alt',
        image: '',
      },
      {
        caption: 'landing-b2c.draper.howItWorks.step3',
        imageAlt: 'landing-b2c.draper.howItWorks.step3Alt',
        image: '',
      },
    ],
  },
  seo: { ariaLabel: 'landing-b2c.draper.howItWorks.header' },
  analytics: { sectionId: 'how-it-works-visual-b2c', category: 'landing-b2c' },
};

/**
 * pt-BR spine config (its own `ptbr.*` keys; LandingPtBR composition).
 */
export const B2C_PTBR_HOW_IT_WORKS_VISUAL_CONFIG: HowItWorksConfig = {
  variant: 'threeUp',
  content: {
    header: 'landing-b2c.ptbr.howItWorks.header',
    steps: [
      {
        caption: 'landing-b2c.ptbr.howItWorks.step1',
        imageAlt: 'landing-b2c.ptbr.howItWorks.step1Alt',
        image: '',
      },
      {
        caption: 'landing-b2c.ptbr.howItWorks.step2',
        imageAlt: 'landing-b2c.ptbr.howItWorks.step2Alt',
        image: '',
      },
      {
        caption: 'landing-b2c.ptbr.howItWorks.step3',
        imageAlt: 'landing-b2c.ptbr.howItWorks.step3Alt',
        image: '',
      },
    ],
  },
  seo: { ariaLabel: 'landing-b2c.ptbr.howItWorks.header' },
  analytics: { sectionId: 'how-it-works-visual-ptbr', category: 'landing-b2c' },
};
