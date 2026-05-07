/**
 * Learn Center analytics events.
 *
 * Naming follows the existing platform pattern: snake_case, feature-prefixed.
 * Event payloads always include locale + timestamp per the analytics
 * integration guide (docs/tech/analytics-integration.md).
 */

export const LESSON_EVENTS = {
  INDEX_VIEWED: 'learn_index_viewed',
  LESSON_VIEWED: 'learn_lesson_viewed',
  BEAT_VIEWED: 'learn_beat_viewed',
  LESSON_COMPLETED: 'learn_lesson_completed',
  ROADMAP_CARD_CLICKED: 'learn_roadmap_card_clicked',
  CTA_PRIMARY_CLICKED: 'learn_cta_primary_clicked',
  CTA_SECONDARY_CLICKED: 'learn_cta_secondary_clicked',
} as const;

export type LessonEventName = typeof LESSON_EVENTS[keyof typeof LESSON_EVENTS];

export const READ_TIME_MINUTES = {
  'compound-interest': 5,
} as const;
