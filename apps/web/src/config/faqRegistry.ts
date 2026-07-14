/**
 * FAQ Registry — single source of truth for FAQ content selection.
 *
 * The canonical FAQ content store is `packages/i18n/translations/{locale}/faq.json`
 * (`faq.items.<semanticId>.{question,answer}`). This module owns:
 *   - FAQ_TOPICS: the /help topic taxonomy (ordered semantic-id lists per topic).
 *   - FAQ_SURFACES: the pertinent subset each non-/help surface shows.
 *   - getFAQForSurface(): the typed selector every page config calls.
 *   - buildFAQStructuredData(): the /help FAQPage JSON-LD builder (fixes E10).
 *
 * Domain-Driven Design: one FAQ domain module owns topic taxonomy + surface subsets.
 * DRY / single source of truth: `strategies.json#faq` and `protocols.json#faq` were
 *   absorbed into `faq.json` (2026-07-13, PLAN_FAQ_SSOT); there is now ONE content store.
 * Service Agnostic Abstraction: consumers ask for a surface, not ids/paths. The
 *   A/B wallet-architecture branch for `safeStrategy` lives here, not in page config.
 */

import type { FAQItem } from './faqAccordion';

type FaqCategory = FAQItem['category'];

/**
 * Canonical topic → ordered semantic-id map. Drives the /help accordion grouping.
 * Order matters: items render top-to-bottom in the order listed here.
 *
 * To add a question to /help: add the semantic id to the relevant topic list AND
 * add the entry to `packages/i18n/translations/{locale}/faq.json` (all 4 locales).
 */
export const FAQ_TOPICS = {
  gettingStarted: [
    'isBank',
    'isForEveryone',
    'minimum',
    'afterSignup',
    'whatKindOfMoney',
    'understanding',
    'micaRegulated',
    'pixFaq',
    'whySaveDollar',
  ],
  moneySafety: [
    'safety',
    'withdraw',
    'shutdown',
    'whatIfWrong',
    'lostPhone',
    'whatIsBalance',
    'liquidity',
    'whyCantTouch',
    'risk',
    'canLoseEverything',
  ],
  feesCosts: ['howPossible', 'catch', 'justTransfers'],
  investingStrategies: [
    'audited',
    'canSwitchStrategies',
    'multipleStrategies',
    'rebalancing',
    'returnsGuaranteed',
    'whereMoneyGoesProtocols',
    'protocolProblems',
    'vsBankSavings',
  ],
  forBusinesses: ['smbOrStartup', 'payments', 'compliance', 'sendMoney', 'whereMoneyGoes'],
  protocolsTransparency: [
    'protocolsListLimit',
    'protocolsUpdateFrequency',
    'protocolsRequest',
    'protocolsEndorsement',
    'protocolHacked',
    'protocolsWarningBadges',
    'tvlMeaning',
    'protocolsDirectInteraction',
  ],
} as const satisfies Record<string, readonly string[]>;

export type FaqTopicId = keyof typeof FAQ_TOPICS;

/**
 * Per-surface pertinent subset. Each entry pairs the stable accordion `id`
 * (used for React keys, DOM ids, and the `faq_expand` analytics event_label —
 * preserved verbatim from the pre-consolidation configs so analytics labels do
 * not churn) with the canonical `contentId` in `faq.json`.
 *
 * `abId` names the entry (if any) whose answer varies by wallet architecture.
 */
interface SurfaceEntry {
  readonly id: string;
  readonly contentId: string;
  readonly category: FaqCategory;
}

interface SurfaceDef {
  readonly items: readonly SurfaceEntry[];
  readonly abId?: string;
}

export const FAQ_SURFACES = {
  landing: {
    items: [
      { id: 'isBank', contentId: 'isBank', category: 'general' },
      { id: 'safety', contentId: 'safety', category: 'security' },
      { id: 'howPossible', contentId: 'howPossible', category: 'fees' },
      { id: 'withdraw', contentId: 'withdraw', category: 'fees' },
      { id: 'afterSignup', contentId: 'afterSignup', category: 'getting-started' },
    ],
  },
  business: {
    items: [
      { id: 'catch', contentId: 'catch', category: 'general' },
      { id: 'safety', contentId: 'safetyBusiness', category: 'security' },
      { id: 'payments', contentId: 'payments', category: 'operations' },
      { id: 'compliance', contentId: 'compliance', category: 'compliance' },
      { id: 'risk', contentId: 'risk', category: 'security' },
    ],
  },
  strategies: {
    items: [
      { id: 'faq-guaranteed', contentId: 'returnsGuaranteed', category: 'general' },
      { id: 'faq-safe', contentId: 'safeStrategy', category: 'general' },
      { id: 'faq-switch', contentId: 'canSwitchStrategies', category: 'general' },
      { id: 'faq-whereMoneyGoes', contentId: 'whereMoneyGoesProtocols', category: 'general' },
      { id: 'faq-loseEverything', contentId: 'canLoseEverything', category: 'general' },
    ],
    abId: 'safeStrategy',
  },
  protocols: {
    items: [
      { id: 'faq-q1', contentId: 'protocolsListLimit', category: 'general' },
      { id: 'faq-q5', contentId: 'protocolHacked', category: 'general' },
      { id: 'faq-q7', contentId: 'tvlMeaning', category: 'general' },
      { id: 'faq-q8', contentId: 'protocolsDirectInteraction', category: 'general' },
      { id: 'faq-q4', contentId: 'protocolsEndorsement', category: 'general' },
    ],
  },
} as const satisfies Record<string, SurfaceDef>;

export type FaqSurface = keyof typeof FAQ_SURFACES;

/**
 * Every canonical id that must exist in `faq.json` — the drift anchor for the
 * parity test (`faqRegistry.test.ts`). Union of all FAQ_TOPICS ids and every
 * surface `contentId` (e.g. `safetyBusiness`, `safeStrategy`, which are not in
 * any /help topic).
 */
export const ALL_FAQ_IDS: readonly string[] = Array.from(
  new Set([
    ...Object.values(FAQ_TOPICS).flat(),
    ...Object.values(FAQ_SURFACES).flatMap((s) => s.items.map((i) => i.contentId)),
  ])
);

type WalletArchitecture = 'non-custodial' | 'mpc';

function resolveWalletArchitecture(explicit?: WalletArchitecture): WalletArchitecture {
  if (explicit) return explicit;
  return process.env.NEXT_PUBLIC_WALLET_ARCHITECTURE === 'mpc' ? 'mpc' : 'non-custodial';
}

/**
 * The typed selector every non-/help FAQ config calls. Returns FAQItem[] whose
 * `question`/`answer` are still `faq.items.<id>.…` translation KEYS, so the
 * existing `useConfigTranslation` render path is unchanged.
 *
 * For the A/B surface entry (strategies `safeStrategy`), the answer key resolves
 * to `answerA` (non-custodial) or `answerB` (mpc) per NEXT_PUBLIC_WALLET_ARCHITECTURE.
 */
export function getFAQForSurface(
  surface: FaqSurface,
  opts?: { walletArchitecture?: WalletArchitecture }
): FAQItem[] {
  const def: SurfaceDef = FAQ_SURFACES[surface];
  const walletArch = resolveWalletArchitecture(opts?.walletArchitecture);
  const abKey = walletArch === 'mpc' ? 'answerB' : 'answerA';

  return def.items.map(({ id, contentId, category }) => ({
    id,
    question: `faq.items.${contentId}.question`,
    answer:
      def.abId === contentId ? `faq.items.${contentId}.${abKey}` : `faq.items.${contentId}.answer`,
    category,
  }));
}

interface FAQStructuredDataEntry {
  readonly '@type': 'Question';
  readonly name: string;
  readonly acceptedAnswer: { readonly '@type': 'Answer'; readonly text: string };
}

/**
 * Build the /help FAQPage JSON-LD `mainEntity` from RESOLVED (not key) answers.
 * Fixes E10: the previous builder read `landing-help.topics.*.questions.*` — a
 * path that exists in no locale — so `mainEntity` always shipped empty.
 */
export function buildFAQStructuredData(
  items: ReadonlyArray<{ question: string; answer: string }>
): { '@context': string; '@type': 'FAQPage'; mainEntity: FAQStructuredDataEntry[] } {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: { '@type': 'Answer', text: q.answer },
    })),
  };
}
