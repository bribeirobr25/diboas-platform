/**
 * Card Renderer
 *
 * Canvas-based card generation for viral sharing
 * Supports dream cards, waitlist cards, referral cards, and milestone cards
 */

import type {
  CardType,
  CardConfig,
  CardData,
  DreamCardData,
  WaitlistCardData,
  ReferralCardData,
  MilestoneCardData,
  RenderedCard,
  CardLocale,
} from './types';

import {
  CARD_COLORS,
  CARD_FONTS,
  CARD_DIMENSIONS,
  WATERMARK_TEXT,
  DREAM_CARD_HEADLINES,
  TIMEFRAME_LABELS,
  DISCLAIMERS_BY_LOCALE,
  DEFAULT_CARD_CONFIG,
  BANK_GAP_MESSAGES,
  CARD_CTA_TEXTS,
  WAITLIST_VIRAL_MESSAGES,
  WAITLIST_BANK_GAP,
  DREAM_BANK_COMPARISON_LABEL,
  CARD_URL,
  BCB_DISCLAIMER,
} from './constants';

/**
 * Format currency amount with locale
 */
function formatCurrency(
  amount: number,
  currency: string,
  locale: CardLocale
): string {
  const localeMap: Record<CardLocale, string> = {
    en: 'en-US',
    de: 'de-DE',
    'pt-BR': 'pt-BR',
    es: 'es-ES',
  };

  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with locale
 */
function formatNumber(value: number, locale: CardLocale): string {
  const localeMap: Record<CardLocale, string> = {
    en: 'en-US',
    de: 'de-DE',
    'pt-BR': 'pt-BR',
    es: 'es-ES',
  };

  return new Intl.NumberFormat(localeMap[locale]).format(value);
}

/**
 * Draw gradient background
 */
function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gradient: string
): void {
  // Parse gradient string (simplified - assumes linear-gradient format)
  const colors = gradient.match(/#[a-fA-F0-9]{6}/g) || ['#0f172a', '#1e293b'];
  const angle = 135; // Default angle

  // Calculate gradient points
  const angleRad = (angle * Math.PI) / 180;
  const x1 = width / 2 - (Math.cos(angleRad) * width) / 2;
  const y1 = height / 2 - (Math.sin(angleRad) * height) / 2;
  const x2 = width / 2 + (Math.cos(angleRad) * width) / 2;
  const y2 = height / 2 + (Math.sin(angleRad) * height) / 2;

  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  colors.forEach((color, index) => {
    grad.addColorStop(index / (colors.length - 1), color);
  });

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

/**
 * Draw watermark in top-right corner (CLO compliant - amber color)
 */
function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  locale: CardLocale,
  padding: number = 60
): void {
  const watermarkText = WATERMARK_TEXT[locale];
  const watermarkColor = CARD_COLORS.dark.watermarkColor;

  ctx.save();

  // Draw semi-transparent background pill for watermark
  ctx.font = `bold 18px ${CARD_FONTS.heading.family}`;
  const textMetrics = ctx.measureText(watermarkText);
  const pillPadding = 12;
  const pillWidth = textMetrics.width + pillPadding * 2;
  const pillHeight = 28;
  const pillX = width - padding - pillWidth;
  const pillY = padding;

  // Draw pill background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 6);
  ctx.fill();

  // Draw watermark text
  ctx.fillStyle = watermarkColor;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(watermarkText, width - padding - pillPadding, padding + 6);

  ctx.restore();
}

/**
 * Draw diBoaS logo/branding (top-left per spec)
 */
function drawBranding(
  ctx: CanvasRenderingContext2D,
  width: number,
  padding: number,
  accentColor: string
): void {
  ctx.save();
  ctx.fillStyle = accentColor;
  ctx.font = `bold 36px ${CARD_FONTS.heading.family}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('diBoaS', padding, padding);
  ctx.restore();
}

/**
 * Draw horizontal divider line
 */
function drawDivider(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  padding: number
): void {
  ctx.save();
  ctx.strokeStyle = CARD_COLORS.dark.dividerColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw disclaimer text at bottom (with BCB disclaimer for PT-BR)
 */
function drawDisclaimer(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: number,
  locale: CardLocale,
  secondaryColor: string
): void {
  const disclaimer = DISCLAIMERS_BY_LOCALE[locale];
  // Add BCB disclaimer for PT-BR per CLO compliance
  const fullDisclaimer = locale === 'pt-BR'
    ? `${disclaimer} ${BCB_DISCLAIMER}`
    : disclaimer;

  ctx.save();
  ctx.fillStyle = secondaryColor;
  ctx.font = `12px ${CARD_FONTS.body.family}`; // 12px per spec
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  // Word wrap disclaimer
  const maxWidth = width - padding * 2;
  const words = fullDisclaimer.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);

  // Draw lines from bottom
  const lineHeight = 18;
  lines.reverse().forEach((line, index) => {
    ctx.fillText(line, width / 2, height - padding - index * lineHeight);
  });

  ctx.restore();
}

/**
 * Render a Dream Card (per CMO spec)
 */
function renderDreamCard(
  ctx: CanvasRenderingContext2D,
  data: DreamCardData,
  config: CardConfig
): void {
  const { width, height, accentColor, textColor } = config;
  const padding = 60;
  const colors = CARD_COLORS.dark;

  // Draw background
  drawGradientBackground(ctx, width, height, colors.background);

  // Draw watermark (top-right, amber)
  drawWatermark(ctx, width, height, data.locale, padding);

  // Draw branding (top-left)
  drawBranding(ctx, width, padding, accentColor);

  // Draw headline (24px Semibold per spec)
  ctx.fillStyle = colors.secondaryText;
  ctx.font = `600 24px ${CARD_FONTS.heading.family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(DREAM_CARD_HEADLINES[data.locale], width / 2, height * 0.15);

  // Draw amount with start → end format (64px Bold per spec)
  const initialFormatted = formatCurrency(data.initialAmount, data.currency, data.locale);
  const growthFormatted = formatCurrency(data.growthAmount, data.currency, data.locale);
  ctx.fillStyle = accentColor;
  ctx.font = `bold 64px ${CARD_FONTS.display.family}`;
  ctx.fillText(`${initialFormatted} → ${growthFormatted}`, width / 2, height * 0.26);

  // Draw timeframe (20px Regular per spec)
  const timeframeLabel = TIMEFRAME_LABELS[data.locale][data.timeframe];
  ctx.fillStyle = textColor;
  ctx.font = `20px ${CARD_FONTS.body.family}`;
  ctx.fillText(`in ${timeframeLabel}`, width / 2, height * 0.33);

  // Draw divider
  drawDivider(ctx, width, height * 0.38, padding);

  // Draw bank comparison section
  if (data.bankBalance !== undefined) {
    // Label
    ctx.fillStyle = colors.secondaryText;
    ctx.font = `16px ${CARD_FONTS.body.family}`;
    ctx.fillText(DREAM_BANK_COMPARISON_LABEL[data.locale], width / 2, height * 0.43);

    // Bank amount (red for emphasis)
    const bankFormatted = formatCurrency(data.bankBalance, data.currency, data.locale);
    ctx.fillStyle = '#ef4444';
    ctx.font = `bold 32px ${CARD_FONTS.body.family}`;
    ctx.fillText(bankFormatted, width / 2, height * 0.49);
  }

  // Draw divider
  drawDivider(ctx, width, height * 0.55, padding);

  // Draw CTA (centered, accent color)
  ctx.fillStyle = accentColor;
  ctx.font = `bold 24px ${CARD_FONTS.body.family}`;
  ctx.fillText(CARD_CTA_TEXTS[data.locale], width / 2, height * 0.62);

  // Draw URL
  ctx.fillStyle = colors.secondaryText;
  ctx.font = `18px ${CARD_FONTS.body.family}`;
  ctx.fillText(CARD_URL, width / 2, height * 0.68);

  // Draw hashtag
  ctx.fillStyle = colors.secondaryText;
  ctx.font = `bold 18px ${CARD_FONTS.body.family}`;
  ctx.fillText('#WhileISlept', width / 2, height * 0.74);

  // Draw disclaimer (12px per spec)
  drawDisclaimer(ctx, width, height, padding, data.locale, colors.secondaryText);
}

/**
 * Render a Waitlist Position Card (per CMO spec)
 */
function renderWaitlistCard(
  ctx: CanvasRenderingContext2D,
  data: WaitlistCardData,
  config: CardConfig
): void {
  const { width, height, accentColor, textColor } = config;
  const padding = 60;
  const colors = CARD_COLORS.dark;

  // Draw background
  drawGradientBackground(ctx, width, height, colors.background);

  // Draw branding (top-left)
  drawBranding(ctx, width, padding, accentColor);

  // Get bank gap messages for locale
  const bankGap = WAITLIST_BANK_GAP[data.locale];

  // Draw 3-line bank gap message (core viral hook)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Line 1: "Banks earn 7% with our savings."
  ctx.fillStyle = '#f59e0b'; // Amber for emphasis
  ctx.font = `bold 20px ${CARD_FONTS.body.family}`;
  ctx.fillText(bankGap.line1, width / 2, height * 0.14);

  // Line 2: "They pay us 0.5%."
  ctx.fillStyle = '#ef4444'; // Red for contrast
  ctx.font = `bold 20px ${CARD_FONTS.body.family}`;
  ctx.fillText(bankGap.line2, width / 2, height * 0.18);

  // Line 3: "That gap? It's been there the whole time."
  ctx.fillStyle = textColor;
  ctx.font = `600 18px ${CARD_FONTS.body.family}`;
  ctx.fillText(bankGap.line3, width / 2, height * 0.22);

  // Draw divider
  drawDivider(ctx, width, height * 0.26, padding);

  // Draw position headline with position number (per spec format)
  ctx.fillStyle = colors.secondaryText;
  ctx.font = `24px ${CARD_FONTS.heading.family}`;
  ctx.fillText(`I'M #${formatNumber(data.position, data.locale)} ON THE DIBOAS WAITLIST`, width / 2, height * 0.34);

  // Draw position number (large, accent)
  ctx.fillStyle = accentColor;
  ctx.font = `bold 80px ${CARD_FONTS.display.family}`;
  ctx.fillText(`#${formatNumber(data.position, data.locale)}`, width / 2, height * 0.46);

  // Draw divider
  drawDivider(ctx, width, height * 0.54, padding);

  // Draw "Join me:" CTA intro
  ctx.fillStyle = textColor;
  ctx.font = `20px ${CARD_FONTS.body.family}`;
  ctx.fillText('Join me:', width / 2, height * 0.60);

  // Draw full referral URL (per spec)
  ctx.fillStyle = accentColor;
  ctx.font = `bold 22px ${CARD_FONTS.mono.family}`;
  ctx.fillText(`${CARD_URL}/?ref=${data.referralCode}`, width / 2, height * 0.66);

  // Draw hashtag
  ctx.fillStyle = colors.secondaryText;
  ctx.font = `bold 18px ${CARD_FONTS.body.family}`;
  ctx.fillText('#WhileISlept', width / 2, height * 0.74);
}

/**
 * Render a Referral Success Card
 */
function renderReferralCard(
  ctx: CanvasRenderingContext2D,
  data: ReferralCardData,
  config: CardConfig
): void {
  const { width, height, accentColor, textColor } = config;
  const padding = 60;
  const colors = CARD_COLORS.dark;

  // Draw background
  drawGradientBackground(ctx, width, height, colors.background);

  // Draw branding
  drawBranding(ctx, width, padding, accentColor);

  // Draw celebration
  ctx.fillStyle = colors.secondaryText;
  ctx.font = `${CARD_FONTS.heading.sizes.small}px ${CARD_FONTS.heading.family}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('REFERRAL SUCCESS!', width / 2, height * 0.3);

  // Draw spots moved
  ctx.fillStyle = accentColor;
  ctx.font = `bold ${CARD_FONTS.display.sizes.medium}px ${CARD_FONTS.display.family}`;
  ctx.fillText(`+${data.spotsMoved} SPOTS`, width / 2, height * 0.42);

  // Draw new position
  ctx.fillStyle = textColor;
  ctx.font = `${CARD_FONTS.body.sizes.large}px ${CARD_FONTS.body.family}`;
  ctx.fillText(
    `New Position: #${formatNumber(data.newPosition, data.locale)}`,
    width / 2,
    height * 0.55
  );

  // Draw total referrals
  ctx.fillStyle = colors.secondaryText;
  ctx.font = `${CARD_FONTS.body.sizes.medium}px ${CARD_FONTS.body.family}`;
  ctx.fillText(
    `Total Referrals: ${data.totalReferrals}`,
    width / 2,
    height * 0.65
  );

  // Draw hashtag
  ctx.fillStyle = accentColor;
  ctx.font = `bold ${CARD_FONTS.body.sizes.medium}px ${CARD_FONTS.body.family}`;
  ctx.fillText('#WhileISlept', width / 2, height * 0.80);
}

/**
 * Render a Milestone Card
 */
function renderMilestoneCard(
  ctx: CanvasRenderingContext2D,
  data: MilestoneCardData,
  config: CardConfig
): void {
  const { width, height, accentColor, textColor } = config;
  const padding = 60;
  const colors = CARD_COLORS.dark;

  // Draw background
  drawGradientBackground(ctx, width, height, colors.background);

  // Draw branding
  drawBranding(ctx, width, padding, accentColor);

  // Draw celebration emoji
  ctx.font = `80px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎉', width / 2, height * 0.25);

  // Draw milestone headline
  ctx.fillStyle = colors.secondaryText;
  ctx.font = `${CARD_FONTS.heading.sizes.small}px ${CARD_FONTS.heading.family}`;
  ctx.fillText('MILESTONE ACHIEVED!', width / 2, height * 0.38);

  // Draw milestone value
  ctx.fillStyle = accentColor;
  ctx.font = `bold ${CARD_FONTS.display.sizes.medium}px ${CARD_FONTS.display.family}`;
  ctx.fillText(formatNumber(data.value, data.locale), width / 2, height * 0.50);

  // Draw message
  ctx.fillStyle = textColor;
  ctx.font = `${CARD_FONTS.body.sizes.large}px ${CARD_FONTS.body.family}`;
  ctx.fillText(data.message, width / 2, height * 0.62);

  // Draw hashtag
  ctx.fillStyle = accentColor;
  ctx.font = `bold ${CARD_FONTS.body.sizes.medium}px ${CARD_FONTS.body.family}`;
  ctx.fillText('#WhileISlept', width / 2, height * 0.80);
}

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

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    });

    return {
      dataUrl: canvas.toDataURL('image/png'),
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
