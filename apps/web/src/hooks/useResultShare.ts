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

import { useCallback, useEffect, useRef, useState } from 'react';
import { APP_URL } from '@/config/env';
import { analyticsService } from '@/lib/analytics';
import { getToolResultSharePageUrl } from '@/lib/og/share';
import { copyToClipboard } from '@/lib/share/platformUrls';
import { Logger } from '@/lib/monitoring/Logger';
import type { ToolKey } from '@/lib/tools';

/** Canonical Format-A (GA4 snake_case) share event names — reused, not invented. */
const RESULT_SHARE_EVENTS = {
  INITIATED: 'share_initiated',
  COMPLETED: 'share_completed',
} as const;

interface UseResultShareInput {
  toolKey: ToolKey;
  /** Hero figure rendered on the share card. */
  value: number;
  /** ISO 4217 currency code (the holder's locale currency). */
  currency: string;
  years?: number;
  locale: string;
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
  shareText,
  shareTitle,
  enabled = true,
}: UseResultShareInput): UseResultShareResult {
  const [copied, setCopied] = useState(false);
  // Resolved after mount so SSR markup matches the first client render.
  const [canNativeShare, setCanNativeShare] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot capability probe; `navigator` is unavailable during SSR so it must run post-mount
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const shareUrl = getToolResultSharePageUrl({ toolKey, value, currency, years }, locale, APP_URL);

  const share = useCallback(async () => {
    const usedNative =
      typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    const platform = usedNative ? 'native' : 'copy';

    if (enabled) {
      analyticsService.track({
        name: RESULT_SHARE_EVENTS.INITIATED,
        parameters: { tool_key: toolKey, platform, locale },
      });
    }

    const trackCompleted = (resolvedPlatform: string) => {
      if (enabled) {
        analyticsService.track({
          name: RESULT_SHARE_EVENTS.COMPLETED,
          parameters: { tool_key: toolKey, platform: resolvedPlatform, locale },
        });
      }
    };

    try {
      if (usedNative) {
        try {
          await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
          trackCompleted('native');
          return;
        } catch (err) {
          // User dismissed the sheet — not a failure, and not a completion.
          if (err instanceof DOMException && err.name === 'AbortError') return;
          // Any other native error → fall through to the copy fallback.
          Logger.warn('Native share failed; falling back to copy', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const ok = await copyToClipboard(`${shareText} ${shareUrl}`);
      if (ok) {
        setCopied(true);
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
        trackCompleted('copy');
      }
    } catch (err) {
      Logger.warn('Result share failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [toolKey, locale, shareText, shareTitle, shareUrl, enabled]);

  return { share, copied, canNativeShare, shareUrl };
}
