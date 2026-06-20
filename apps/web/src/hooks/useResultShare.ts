'use client';

/**
 * useResultShare — the share half of the Money Tools "result moment" (Phase 3
 * redesign). Turns a computed, market-data-bound tool result into a one-tap,
 * branded share: the Web Share API where available (mobile/native sheet),
 * copy-to-clipboard everywhere else. The shared link points at the locale
 * `/share` page, which carries the dynamic OG card (`/api/og/share`).
 *
 * Honesty + privacy: the card and link preview render only an allowlisted tool
 * name, the hero figure, and the holder's locale currency — never PII, never
 * free text. Analytics are Format-A only (GA4 via `analyticsService`), matching
 * the `useCalculatorAnalytics` precedent: `share_initiated` on tap,
 * `share_completed` on success. No `ApplicationEventBus` emission here, so the
 * existing `SHARE_COMPLETED → share_completed` bridge can never double-fire.
 */

import { APP_URL } from '@/config/env';
import { analyticsService } from '@/lib/analytics';
import { getToolResultSharePageUrl } from '@/lib/og/share';
import { useWebShare, SHARE_EVENTS, type SharePlatform } from '@/hooks/useWebShare';
import type { ToolKey } from '@/lib/tools';

interface UseResultShareInput {
  toolKey: ToolKey;
  /** Hero figure rendered on the share card. */
  value: number;
  /** ISO 4217 currency code (the holder's locale currency). */
  currency: string;
  years?: number;
  locale: string;
  /** Hero color semantics for the share card — a loss never renders as green. */
  tone?: 'positive' | 'negative' | 'neutral';
  /** Pre-built, localized share text (without the URL — appended on copy). */
  shareText: string;
  /** Pre-built, localized title for the native share sheet. */
  shareTitle: string;
  /** Analytics gate (defaults to true). */
  enabled?: boolean;
}

interface UseResultShareResult {
  /** Trigger the share (native sheet or copy fallback). */
  share: () => Promise<void>;
  /** True briefly after a successful copy (for button feedback). */
  copied: boolean;
  /** Whether the Web Share API is available (resolved post-mount, SSR-safe). */
  canNativeShare: boolean;
  /** The full share-page URL (also surfaced for the copy fallback). */
  shareUrl: string;
}

export function useResultShare({
  toolKey,
  value,
  currency,
  years,
  locale,
  tone,
  shareText,
  shareTitle,
  enabled = true,
}: UseResultShareInput): UseResultShareResult {
  const shareUrl = getToolResultSharePageUrl(
    { toolKey, value, currency, years, tone },
    locale,
    APP_URL
  );

  // Analytics are tool-specific (tool_key); the share mechanics live in the
  // shared useWebShare engine so this hook and MarketCtaBand cannot drift.
  const trackShare = (eventName: string, platform: SharePlatform) => {
    if (!enabled) return;
    analyticsService.track({
      name: eventName,
      parameters: { tool_key: toolKey, platform, locale },
    });
  };

  const { share, copied, canNativeShare } = useWebShare({
    shareText,
    shareTitle,
    shareUrl,
    onInitiated: (platform) => trackShare(SHARE_EVENTS.INITIATED, platform),
    onCompleted: (platform) => trackShare(SHARE_EVENTS.COMPLETED, platform),
  });

  return { share, copied, canNativeShare, shareUrl };
}
