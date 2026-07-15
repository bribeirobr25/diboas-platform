/**
 * Learn Center analytics events.
 *
 * Naming follows the existing platform pattern: snake_case, feature-prefixed.
 * Event payloads always include locale + timestamp per the analytics
 * integration guide (docs/tech/analytics-integration.md).
 *
 * Phase 0 (learn redesign plan, 2026-07-15):
 * - ROADMAP_CARD_VIEWED replaced ROADMAP_CARD_CLICKED (impression, not a fake
 *   button; a11y fix B-2).
 * - TOOL_DEEPLINK_CLICKED: the lesson -> tool edge of the funnel (B-4).
 * - LESSON_COMPLETED KPI definition: the lesson counts as completed when the
 *   end-of-content CTA group becomes >=50% visible, once per mount.
 *   Dashboards depend on this definition staying stable.
 *
 * Phase 1: READ_TIME_MINUTES moved into the lesson registry entries
 * (lesson.readTimeMinutes); BEAT_PARAGRAPH_COUNTS retired in favor of
 * until-exhausted array reading (lib/learn/i18nArrays.ts).
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
  // Phase 3 (Slice A). QUIZ_SUBMITTED fires ONCE per mount when the last
  // graded answer lands; payload carries correctCount only (never the
  // per-question answers: non-sensitive by design).
  QUIZ_SUBMITTED: 'learn_quiz_submitted',
  SHARE_COPIED: 'learn_share_copied',
  // Phase 3 (Slice B). Watch-time completion is deliberately NOT tracked
  // (needs the IFrame API; YouTube Studio owns that KPI).
  VIDEO_STARTED: 'learn_video_started',
  VIDEO_ERROR: 'learn_video_error',
} as const;

export type LessonEventName = (typeof LESSON_EVENTS)[keyof typeof LESSON_EVENTS];
