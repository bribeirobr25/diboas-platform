/**
 * Card Renderer
 *
 * Canvas-based card generation for viral sharing
 * Supports dream cards, waitlist cards, referral cards, and milestone cards
 */

import type {
  CardConfig,
  CardData,
  DreamCardData,
  WaitlistCardData,
  ReferralCardData,
  MilestoneCardData,
  RenderedCard,
} from './types';

import { DEFAULT_CARD_CONFIG } from './constants';
import {
  renderDreamCard,
  renderWaitlistCard,
  renderReferralCard,
  renderMilestoneCard,
} from './cardRenderers';

/**
 * Main CardRenderer class
 */
export class CardRenderer {
  private config: CardConfig;

  constructor(config: Partial<CardConfig> = {}) {
    this.config = { ...DEFAULT_CARD_CONFIG, ...config };
  }

  /**
   * Render a card based on type and data
   */
  async render(cardData: CardData): Promise<RenderedCard> {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = this.config.width;
    canvas.height = this.config.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Update config locale from card data
    const locale = cardData.data.locale;
    const configWithLocale = { ...this.config, locale };

    // Render based on card type
    switch (cardData.type) {
      case 'dream':
        renderDreamCard(ctx, cardData.data, configWithLocale);
        break;
      case 'waitlist':
        renderWaitlistCard(ctx, cardData.data, configWithLocale);
        break;
      case 'referral':
        renderReferralCard(ctx, cardData.data, configWithLocale);
        break;
      case 'milestone':
        renderMilestoneCard(ctx, cardData.data, configWithLocale);
        break;
      default:
        throw new Error(`Unknown card type: ${(cardData as CardData).type}`);
    }

    // Get the data URL before blob conversion (synchronous operation)
    const dataUrl = canvas.toDataURL('image/png');

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    });

    // Clean up canvas resources
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;

    return {
      dataUrl,
      blob,
      width: this.config.width,
      height: this.config.height,
      type: cardData.type,
    };
  }

  /**
   * Render a dream card
   */
  async renderDreamCard(data: DreamCardData): Promise<RenderedCard> {
    return this.render({ type: 'dream', data });
  }

  /**
   * Render a waitlist position card
   */
  async renderWaitlistCard(data: WaitlistCardData): Promise<RenderedCard> {
    return this.render({ type: 'waitlist', data });
  }

  /**
   * Render a referral success card
   */
  async renderReferralCard(data: ReferralCardData): Promise<RenderedCard> {
    return this.render({ type: 'referral', data });
  }

  /**
   * Render a milestone card
   */
  async renderMilestoneCard(data: MilestoneCardData): Promise<RenderedCard> {
    return this.render({ type: 'milestone', data });
  }

  /**
   * Update renderer configuration
   */
  setConfig(config: Partial<CardConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): CardConfig {
    return { ...this.config };
  }
}

/**
 * Default card renderer instance
 */
export const cardRenderer = new CardRenderer();
