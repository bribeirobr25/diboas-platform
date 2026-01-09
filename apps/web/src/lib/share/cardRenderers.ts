/**
 * Card Renderers
 *
 * Render functions for each card type
 */

import type {
  CardConfig,
  DreamCardData,
  WaitlistCardData,
  ReferralCardData,
  MilestoneCardData,
} from './types';

import {
  CARD_COLORS,
  CARD_FONTS,
  DREAM_CARD_HEADLINES,
  TIMEFRAME_LABELS,
  DREAM_BANK_COMPARISON_LABEL,
  CARD_CTA_TEXTS,
  CARD_URL,
  CANVAS_COLORS,
  WAITLIST_BANK_GAP,
} from './constants';

import { formatCurrency, formatNumber } from './cardFormatters';
import {
  drawGradientBackground,
  drawWatermark,
  drawBranding,
  drawDivider,
  drawDisclaimer,
} from './canvasUtils';

/**
 * Render a Dream Card (per CMO spec)
 */
export function renderDreamCard(
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
    ctx.fillStyle = CANVAS_COLORS.bankComparison;
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
export function renderWaitlistCard(
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
  ctx.fillStyle = CANVAS_COLORS.highlightAmber;
  ctx.font = `bold 20px ${CARD_FONTS.body.family}`;
  ctx.fillText(bankGap.line1, width / 2, height * 0.14);

  // Line 2: "They pay us 0.5%."
  ctx.fillStyle = CANVAS_COLORS.bankComparison;
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
export function renderReferralCard(
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
export function renderMilestoneCard(
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
