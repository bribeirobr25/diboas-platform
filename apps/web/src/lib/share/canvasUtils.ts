/**
 * Canvas Utilities
 *
 * Helper functions for canvas-based card rendering
 */

import type { CardLocale } from './types';
import {
  CARD_COLORS,
  CARD_FONTS,
  WATERMARK_TEXT,
  DISCLAIMERS_BY_LOCALE,
  BCB_DISCLAIMER,
  CANVAS_COLORS,
} from './constants';

/**
 * Draw gradient background
 */
export function drawGradientBackground(
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
export function drawWatermark(
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
  ctx.fillStyle = CANVAS_COLORS.overlayDark;
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
export function drawBranding(
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
export function drawDivider(
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
export function drawDisclaimer(
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
