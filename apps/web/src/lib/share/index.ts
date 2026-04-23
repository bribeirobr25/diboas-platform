/**
 * Share Library — Public API
 *
 * Minimal exports for social sharing:
 * - UTM parameter building (utm.ts)
 * - Platform URL builders (platformUrls.ts)
 * - Types (types.ts)
 */

// Types
export type { SharePlatform, CardType } from './types';

// UTM Utilities
export type { UtmSource, UtmMedium, UtmParams } from './utm';
export { UTM_CONFIGS, UTM_CONTENT_BY_PLATFORM, buildUtmUrl, getShareUrl, extractUtmParams } from './utm';

// Platform URL Builders
export {
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  getLinkedInShareUrl,
  getTelegramShareUrl,
  openShareWindow,
  copyToClipboard,
} from './platformUrls';

// Constants
export { OG_DIMENSIONS } from './constants';
