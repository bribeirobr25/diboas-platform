/**
 * Learn Center analytics events.
 *
 * Naming follows the existing platform pattern: snake_case, feature-prefixed.
 * Event payloads always include locale + timestamp per the analytics
 * integration guide (docs/tech/analytics-integration.md).
 *
 * Phase 0 (learn redesign plan, 2026-07-15):
 * - ROADMAP_CARD_CLICKED replaced by ROADMAP_CARD_VIEWED: the coming-soon card
 *   is informational (no navigation), so the honest signal is an impression,
 *   not a click on a fake button (a11y fix B-2).
 * - TOOL_DEEPLINK_CLICKED added: the lesson -> tool edge of the funnel (B-4).
 * - LESSON_COMPLETED now fires (B-4). KPI definition: the lesson counts as
 *   completed when the end-of-content CTA group becomes >=50% visible, once
 *   per mount. Dashboards depend on this definition staying stable.
 */

export const LESSON_EVENTS = {
  INDEX_VIEWED: 'learn_index_viewed',
  LESSON_VIEWED: 'learn_lesson_viewed',
  BEAT_VIEWED: 'learn_beat_viewed',
  LESSON_COMPLETED: 'learn_lesson_completed',
  ROADMAP_CARD_VIEWED: 'learn_roadmap_card_viewed',
  CTA_PRIMARY_CLICKED: 'learn_cta_primary_clicked',
  CTA_SECONDARY_CLICKED: 'learn_cta_secondary_clicked',
  TOOL_DEEPLINK_CLICKED: 'learn_tool_deeplink_clicked',
} as const;

export type LessonEventName = (typeof LESSON_EVENTS)[keyof typeof LESSON_EVENTS];

export const READ_TIME_MINUTES = {
  'compound-interest': 5,
} as const;

/**
 * Paragraph counts per beat for the `learn-compound-interest` namespace.
 *
 * TEMPORARY CONTRACT (until the Phase-1 config-driven variant): the
 * LessonThreeBeat component reads translation arrays with fixed lengths, so
 * these counts MUST match the actual array lengths in
 * `packages/i18n/translations/{locale}/learn-compound-interest.json` for all
 * four locales. Drift is caught by `__tests__/lessonCopyShape.test.ts`.
 *
 * Updated 2026-07-15 for the approved Talk 1 rework (was 7/4/3/5/2).
 */
export const BEAT_PARAGRAPH_COUNTS = {
  beat1Body: 6,
  beat2Intro: 3,
  beat2Outro: 2,
  beat3Intro: 4,
  beat3Wrap: 3,
} as const;
