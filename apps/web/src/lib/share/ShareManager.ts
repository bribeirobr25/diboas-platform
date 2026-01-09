/**
 * Share Manager
 *
 * Handles platform-specific sharing logic with:
 * - Web Share API support
 * - Fallback URL sharing
 * - Image download functionality
 * - Analytics tracking
 */

import type {
  SharePlatform,
  ShareContent,
  ShareResult,
  ShareTrackingData,
  RenderedCard,
  CardLocale,
  CardType,
} from './types';

import { SHARE_EVENTS } from './constants';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';
import { isWebShareAvailable, isWebShareFilesAvailable } from './shareUtils';
import {
  shareToTwitter,
  shareToWhatsApp,
  shareToFacebook,
  shareToLinkedIn,
  shareToTelegram,
  copyToClipboard,
  downloadImage,
} from './platformHandlers';

// Re-export utilities for backwards compatibility
export {
  isWebShareAvailable,
  isWebShareFilesAvailable,
  getHashtags,
  truncateForPlatform,
} from './shareUtils';

export { buildShareUrl } from './platformHandlers';

/**
 * Share Manager class
 */
export class ShareManager {
  private trackingCallback?: (data: ShareTrackingData) => void;
  private locale: CardLocale;
  private cardType: CardType;
  private referralCode?: string;

  constructor(
    locale: CardLocale = 'en',
    trackingCallback?: (data: ShareTrackingData) => void,
    cardType: CardType = 'dream',
    referralCode?: string
  ) {
    this.locale = locale;
    this.trackingCallback = trackingCallback;
    this.cardType = cardType;
    this.referralCode = referralCode;
  }

  /**
   * Set card type for UTM tracking
   */
  setCardType(cardType: CardType): void {
    this.cardType = cardType;
  }

  /**
   * Set referral code for tracking
   */
  setReferralCode(referralCode: string): void {
    this.referralCode = referralCode;
  }

  /**
   * Set locale
   */
  setLocale(locale: CardLocale): void {
    this.locale = locale;
  }

  /**
   * Set tracking callback
   */
  setTrackingCallback(callback: (data: ShareTrackingData) => void): void {
    this.trackingCallback = callback;
  }

  /**
   * Track a share event
   */
  private track(data: Omit<ShareTrackingData, 'timestamp'>): void {
    if (this.trackingCallback) {
      this.trackingCallback({
        ...data,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Share using Web Share API
   */
  async shareWithWebAPI(content: ShareContent): Promise<ShareResult> {
    if (!isWebShareAvailable()) {
      return {
        success: false,
        platform: 'copy',
        error: 'Web Share API not available',
      };
    }

    try {
      const shareData: ShareData = {
        text: content.text,
        url: content.url,
      };

      // Add file if supported
      if (content.image && isWebShareFilesAvailable()) {
        const file = new File([content.image.blob], 'diboas-share.png', {
          type: 'image/png',
        });

        if (navigator.canShare?.({ files: [file] })) {
          shareData.files = [file];
        }
      }

      await navigator.share(shareData);

      this.track({
        platform: 'copy',
        locale: this.locale,
      });

      return { success: true, platform: 'copy' };
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return { success: false, platform: 'copy', cancelled: true };
      }

      return {
        success: false,
        platform: 'copy',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Share to Twitter/X
   */
  shareToTwitter(content: ShareContent): ShareResult {
    const result = shareToTwitter(content, this.locale, this.cardType, this.referralCode);
    if (result.success) {
      this.track({ platform: 'twitter', cardType: this.cardType, locale: this.locale });
    }
    return result;
  }

  /**
   * Share to WhatsApp
   */
  shareToWhatsApp(content: ShareContent): ShareResult {
    const result = shareToWhatsApp(content, this.cardType, this.referralCode);
    if (result.success) {
      this.track({ platform: 'whatsapp', cardType: this.cardType, locale: this.locale });
    }
    return result;
  }

  /**
   * Share to Facebook
   */
  shareToFacebook(content: ShareContent): ShareResult {
    const result = shareToFacebook(content, this.cardType, this.referralCode);
    if (result.success) {
      this.track({ platform: 'facebook', cardType: this.cardType, locale: this.locale });
    }
    return result;
  }

  /**
   * Share to LinkedIn
   */
  shareToLinkedIn(content: ShareContent): ShareResult {
    const result = shareToLinkedIn(content, this.cardType, this.referralCode);
    if (result.success) {
      this.track({ platform: 'linkedin', cardType: this.cardType, locale: this.locale });
    }
    return result;
  }

  /**
   * Share to Telegram
   */
  shareToTelegram(content: ShareContent): ShareResult {
    const result = shareToTelegram(content, this.cardType, this.referralCode);
    if (result.success) {
      this.track({ platform: 'telegram', cardType: this.cardType, locale: this.locale });
    }
    return result;
  }

  /**
   * Copy link to clipboard
   */
  async copyToClipboard(content: ShareContent): Promise<ShareResult> {
    const result = await copyToClipboard(content);
    if (result.success) {
      this.track({ platform: 'copy', locale: this.locale });
    }
    return result;
  }

  /**
   * Download image
   */
  async downloadImage(card: RenderedCard, filename?: string): Promise<ShareResult> {
    const result = downloadImage(card.dataUrl, card.type, filename);
    if (result.success) {
      this.track({ platform: 'download', cardType: card.type, locale: this.locale });
    }
    return result;
  }

  /**
   * Share to a specific platform
   */
  async share(platform: SharePlatform, content: ShareContent): Promise<ShareResult> {
    // Emit share initiated event
    applicationEventBus.emit(ApplicationEventType.SHARE_INITIATED, {
      source: 'share',
      timestamp: Date.now(),
      platform,
      cardType: this.cardType,
      locale: this.locale,
      hasImage: !!content.image,
    });

    // Emit feature used event for audit trail
    applicationEventBus.emit(ApplicationEventType.FEATURE_USED, {
      source: 'share',
      timestamp: Date.now(),
      metadata: {
        feature: 'share_card',
        platform,
        cardType: this.cardType,
      },
    });

    let result: ShareResult;

    switch (platform) {
      case 'twitter':
        result = this.shareToTwitter(content);
        break;
      case 'whatsapp':
        result = this.shareToWhatsApp(content);
        break;
      case 'facebook':
        result = this.shareToFacebook(content);
        break;
      case 'linkedin':
        result = this.shareToLinkedIn(content);
        break;
      case 'telegram':
        result = this.shareToTelegram(content);
        break;
      case 'copy':
        result = await this.copyToClipboard(content);
        break;
      case 'download':
        if (content.image) {
          result = await this.downloadImage(content.image);
        } else {
          result = {
            success: false,
            platform: 'download',
            error: 'No image provided for download',
          };
        }
        break;
      case 'instagram':
        if (content.image) {
          result = await this.downloadImage(content.image, 'diboas-instagram.png');
        } else {
          result = await this.shareWithWebAPI(content);
        }
        break;
      default:
        result = {
          success: false,
          platform,
          error: `Unknown platform: ${platform}`,
        };
    }

    // Emit result event based on outcome
    if (result.success) {
      applicationEventBus.emit(ApplicationEventType.SHARE_COMPLETED, {
        source: 'share',
        timestamp: Date.now(),
        platform,
        cardType: this.cardType,
        locale: this.locale,
        hasImage: !!content.image,
        success: true,
      });
    } else if (result.cancelled) {
      applicationEventBus.emit(ApplicationEventType.SHARE_CANCELLED, {
        source: 'share',
        timestamp: Date.now(),
        platform,
        cardType: this.cardType,
        locale: this.locale,
        hasImage: !!content.image,
        success: false,
      });
    } else {
      applicationEventBus.emit(ApplicationEventType.SHARE_FAILED, {
        source: 'share',
        timestamp: Date.now(),
        platform,
        cardType: this.cardType,
        locale: this.locale,
        hasImage: !!content.image,
        success: false,
        error: result.error,
      });
    }

    return result;
  }
}

/**
 * Create a share manager with analytics tracking
 */
export function createShareManager(
  locale: CardLocale,
  analyticsTrack?: (event: string, params: Record<string, unknown>) => void
): ShareManager {
  const trackingCallback = analyticsTrack
    ? (data: ShareTrackingData) => {
        analyticsTrack(SHARE_EVENTS.SHARE_COMPLETED, {
          platform: data.platform,
          cardType: data.cardType,
          locale: data.locale,
          timestamp: data.timestamp,
        });
      }
    : undefined;

  return new ShareManager(locale, trackingCallback);
}

/**
 * Default share manager instance
 */
export const shareManager = new ShareManager();
