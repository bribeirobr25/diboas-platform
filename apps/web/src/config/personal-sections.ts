/**
 * Personal Pages — Unique Section Configurations
 *
 * Each personal sub-page uses one additional section component
 * to break the identical Hero→FeatureShowcase→BenefitsCards→StickyFeaturesNav→FAQ template.
 *
 * - Account: ProseSection (between Hero and FeatureShowcase)
 * - Banking: CashflowExplainerSection (after FeatureShowcase)
 * - Investing: ScenarioCards (after BenefitsCards)
 */

import type { ProseSectionConfig } from './proseSection';
import type { CashflowExplainerSectionConfig } from './cashflowExplainerSection';
import type { ScenarioCardsConfig } from './scenarioCards';

// ─── Account: ProseSection ──────────────────────────────────────

export const PERSONAL_ACCOUNT_PROSE_CONFIG: ProseSectionConfig = {
  content: {
    transitionHook: 'personal/account.proseSection.transitionHook',
    header: 'personal/account.proseSection.header',
    paragraphs: [
      'personal/account.proseSection.paragraphs.0',
      'personal/account.proseSection.paragraphs.1',
      'personal/account.proseSection.paragraphs.2',
    ],
    emphasisLine: 'personal/account.proseSection.emphasisLine',
  },
  style: {
    backgroundColor: 'var(--section-bg-warm)',
    verticalPadding: 'generous',
  },
  seo: {
    ariaLabel: 'personal/account.proseSection.ariaLabel',
  },
  analytics: {
    sectionId: 'prose-personal-account',
    category: 'personal-account',
  },
};

// ─── Banking: CashflowExplainerSection ──────────────────────────

export const PERSONAL_BANKING_CASHFLOW_CONFIG: CashflowExplainerSectionConfig = {
  content: {
    header: 'personal/banking.cashflowExplainer.header',
    subheader: 'personal/banking.cashflowExplainer.subheader',
    partA: {
      title: 'personal/banking.cashflowExplainer.saveIt.title',
      body: 'personal/banking.cashflowExplainer.saveIt.body',
    },
    partB: {
      title: 'personal/banking.cashflowExplainer.growIt.title',
      body: 'personal/banking.cashflowExplainer.growIt.body',
    },
    microExample: 'personal/banking.cashflowExplainer.microExample',
    limitation: 'personal/banking.cashflowExplainer.limitation',
    brandPromise: 'personal/banking.cashflowExplainer.brandPromise',
    cta: 'personal/banking.cashflowExplainer.cta',
    ctaHref: '#faq',
    microDisclosure: 'personal/banking.cashflowExplainer.microDisclosure',
  },
  seo: {
    ariaLabel: 'personal/banking.cashflowExplainer.ariaLabel',
  },
  analytics: {
    sectionId: 'cashflow-explainer-personal-banking',
    category: 'personal-banking',
  },
};

// ─── Investing: ScenarioCards ───────────────────────────────────

export const PERSONAL_INVESTING_SCENARIOS_CONFIG: ScenarioCardsConfig = {
  section: {
    title: 'personal/investing.scenarioCards.title',
    transitionHook: 'personal/investing.scenarioCards.transitionHook',
    clarificationLine: 'personal/investing.scenarioCards.clarificationLine',
  },
  cards: [
    {
      id: 'scenario-student',
      title: 'personal/investing.scenarioCards.cards.0.title',
      description: 'personal/investing.scenarioCards.cards.0.description',
      backgroundImage: '/assets/images/quiet-growth.avif',
      imageAlt: 'personal/investing.scenarioCards.cards.0.imageAlt',
    },
    {
      id: 'scenario-freelancer',
      title: 'personal/investing.scenarioCards.cards.1.title',
      description: 'personal/investing.scenarioCards.cards.1.description',
      backgroundImage: '/assets/images/morning-pause.avif',
      imageAlt: 'personal/investing.scenarioCards.cards.1.imageAlt',
    },
    {
      id: 'scenario-parent',
      title: 'personal/investing.scenarioCards.cards.2.title',
      description: 'personal/investing.scenarioCards.cards.2.description',
      backgroundImage: '/assets/images/moment-of-ease.avif',
      imageAlt: 'personal/investing.scenarioCards.cards.2.imageAlt',
    },
  ],
  seo: {
    headingLevel: 'h2',
    ariaLabel: 'personal/investing.scenarioCards.ariaLabel',
  },
  analytics: {
    sectionId: 'scenario-cards-personal-investing',
    category: 'personal-investing',
  },
};
