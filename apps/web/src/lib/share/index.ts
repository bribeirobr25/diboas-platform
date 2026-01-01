/**
 * Share Library - Public API
 *
 * Exports for viral sharing functionality:
 * - Card generation (CardRenderer)
 * - Platform sharing (ShareManager)
 * - Types and constants
 */

// Types
export type {
  SharePlatform,
  CardType,
  DreamTimeframe,
  CardLocale,
  CardConfig,
  DreamCardData,
  WaitlistCardData,
  ReferralCardData,
  MilestoneCardData,
  CardData,
  RenderedCard,
  ShareContent,
  ShareResult,
  ShareTrackingData,
  PlatformConfig,
  RegionalDisclaimer,
} from './types';

// Constants
export {
  CARD_DIMENSIONS,
  CARD_COLORS,
  CARD_FONTS,
  PLATFORM_CONFIGS,
  REGIONAL_DISCLAIMERS,
  DISCLAIMERS_BY_LOCALE,
  WATERMARK_TEXT,
  DREAM_CARD_HEADLINES,
  TIMEFRAME_LABELS,
  CAMPAIGN_HASHTAGS,
  SHARE_EVENTS,
  DEFAULT_CARD_CONFIG,
  PLATFORM_PRIORITY_BY_LOCALE,
  BANK_GAP_MESSAGES,
  CARD_CTA_TEXTS,
  WAITLIST_VIRAL_MESSAGES,
  WAITLIST_BANK_GAP,
  DREAM_BANK_COMPARISON_LABEL,
  CARD_URL,
  BCB_DISCLAIMER,
} from './constants';

// Card Renderer
export { CardRenderer, cardRenderer } from './CardRenderer';

// Share Manager
export {
  ShareManager,
  shareManager,
  createShareManager,
  isWebShareAvailable,
  isWebShareFilesAvailable,
  getHashtags,
  buildShareUrl,
  truncateForPlatform,
} from './ShareManager';

// UTM Utilities
export type { UtmSource, UtmMedium, UtmParams } from './utm';
export {
  UTM_CONFIGS,
  UTM_CONTENT_BY_PLATFORM,
  buildUtmUrl,
  getShareUrl,
  extractUtmParams,
} from './utm';
