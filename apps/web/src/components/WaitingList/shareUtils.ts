/**
 * Waitlist Share Utilities
 *
 * Thin wrapper around lib/share/platformUrls.ts for waitlist-specific sharing.
 * Handles per-platform share config (Twitter mention, LinkedIn clipboard).
 */

import {
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  getLinkedInShareUrl,
  openShareWindow,
  copyToClipboard,
} from '@/lib/share/platformUrls';

export type SharePlatform = 'twitter' | 'whatsapp' | 'linkedin' | 'copy';

interface ShareConfig {
  referralUrl: string;
  shareText: string;
  onLinkedInCopy: () => void;
}

/**
 * Handle sharing to a specific platform.
 * Twitter appends @diboasfi mention automatically.
 */
export function shareToPlatform(
  platform: SharePlatform,
  config: ShareConfig
): void {
  const { referralUrl, shareText, onLinkedInCopy } = config;

  switch (platform) {
    case 'twitter': {
      const twitterText = `${shareText} @diboasfi`;
      openShareWindow(getTwitterShareUrl(twitterText, referralUrl));
      break;
    }
    case 'whatsapp':
      openShareWindow(getWhatsAppShareUrl(shareText, referralUrl));
      break;
    case 'linkedin':
      copyToClipboard(`${shareText} ${referralUrl}`).then(() => {
        onLinkedInCopy();
        openShareWindow(getLinkedInShareUrl(referralUrl));
      });
      break;
  }
}

export { copyToClipboard };
