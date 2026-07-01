/**
 * "How it works" visual section configuration.
 *
 * Three product screens in phone frames, each keeping its existing one-line
 * caption. Config-driven (i18n keys) so the Factory's `useConfigTranslation`
 * resolves copy per locale.
 *
 * IMAGES: `how-it-works-{goal,path,move}.jpg` are TEMPORARY stock placeholders
 * (portrait, for layout review only). Replace with the final product-screen
 * mockups (same file names, or update the paths) when they are ready. Assets
 * live directly in `public/assets/images/` (project convention — no sub-dir).
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

/** Temporary placeholder screens (replace with final mockups). */
const PLACEHOLDER_IMAGES = {
  step1: '/assets/images/how-it-works-goal.jpg',
  step2: '/assets/images/how-it-works-path.jpg',
  step3: '/assets/images/how-it-works-move.jpg',
} as const;

/** Default config for the en/de/es EU spine (shared `draper.*` keys). */
export const B2C_HOW_IT_WORKS_VISUAL_CONFIG: HowItWorksConfig = {
  variant: 'threeUp',
  content: {
    header: 'landing-b2c.draper.howItWorks.header',
    steps: [
      {
        caption: 'landing-b2c.draper.howItWorks.step1',
        imageAlt: 'landing-b2c.draper.howItWorks.step1Alt',
        image: PLACEHOLDER_IMAGES.step1,
      },
      {
        caption: 'landing-b2c.draper.howItWorks.step2',
        imageAlt: 'landing-b2c.draper.howItWorks.step2Alt',
        image: PLACEHOLDER_IMAGES.step2,
      },
      {
        caption: 'landing-b2c.draper.howItWorks.step3',
        imageAlt: 'landing-b2c.draper.howItWorks.step3Alt',
        image: PLACEHOLDER_IMAGES.step3,
      },
    ],
  },
  seo: { ariaLabel: 'landing-b2c.draper.howItWorks.header' },
  analytics: { sectionId: 'how-it-works-visual-b2c', category: 'landing-b2c' },
};

/** pt-BR spine config (its own `ptbr.*` keys; LandingPtBR composition). */
export const B2C_PTBR_HOW_IT_WORKS_VISUAL_CONFIG: HowItWorksConfig = {
  variant: 'threeUp',
  content: {
    header: 'landing-b2c.ptbr.howItWorks.header',
    steps: [
      {
        caption: 'landing-b2c.ptbr.howItWorks.step1',
        imageAlt: 'landing-b2c.ptbr.howItWorks.step1Alt',
        image: PLACEHOLDER_IMAGES.step1,
      },
      {
        caption: 'landing-b2c.ptbr.howItWorks.step2',
        imageAlt: 'landing-b2c.ptbr.howItWorks.step2Alt',
        image: PLACEHOLDER_IMAGES.step2,
      },
      {
        caption: 'landing-b2c.ptbr.howItWorks.step3',
        imageAlt: 'landing-b2c.ptbr.howItWorks.step3Alt',
        image: PLACEHOLDER_IMAGES.step3,
      },
    ],
  },
  seo: { ariaLabel: 'landing-b2c.ptbr.howItWorks.header' },
  analytics: { sectionId: 'how-it-works-visual-ptbr', category: 'landing-b2c' },
};
