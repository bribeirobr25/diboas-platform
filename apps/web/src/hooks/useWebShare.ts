'use client';

/**
 * useWebShare — the provider-agnostic share engine shared by every redesign
 * share surface (Money Tools result moment via `useResultShare`, and the
 * Adelaide Daily `MarketCtaBand`). Owns ONE copy of the mechanics so the two
 * surfaces can never drift (Principle 4 / DRY):
 *
 *   - Web Share API where available (mobile/native sheet), copy-to-clipboard
 *     everywhere else.
 *   - `copied` feedback flag with a self-resetting timer (cleaned up on unmount).
 *   - `AbortError` (user dismissed the native sheet) is a no-op, not a failure
 *     and not a completion.
 *   - Any other native error falls through to the copy fallback.
 *
 * Analytics live in the CALLER (params differ per surface — `tool_key` vs
 * `source`), surfaced via the `onInitiated` / `onCompleted` callbacks, which
 * receive the resolved platform. Event NAMES are centralized in `SHARE_EVENTS`
 * so both callers reference one constant instead of inline literals.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { copyToClipboard } from '@/lib/share/platformUrls';
import { Logger } from '@/lib/monitoring/Logger';

/** Canonical Format-A (GA4 snake_case) share event names — reused, not invented. */
export const SHARE_EVENTS = {
  INITIATED: 'share_initiated',
  COMPLETED: 'share_completed',
} as const;

export type WebShareMethod = 'native' | 'copy';

interface UseWebShareInput {
  /** Pre-built, localized share text (without the URL — appended on copy). */
  shareText: string;
  /** Pre-built, localized title for the native share sheet. */
  shareTitle: string;
  /** Absolute URL to share (carries the OG card). */
  shareUrl: string;
  /** Fired on tap with the resolved platform (before the share is attempted). */
  onInitiated?: (platform: WebShareMethod) => void;
  /** Fired on a successful native share or copy. */
  onCompleted?: (platform: WebShareMethod) => void;
  /** How long the `copied` flag stays true after a copy. Default 2000ms. */
  copiedResetMs?: number;
}

interface UseWebShareResult {
  /** Trigger the share (native sheet or copy fallback). */
  share: () => Promise<void>;
  /** True briefly after a successful copy (for button feedback). */
  copied: boolean;
  /** Whether the Web Share API is available (resolved post-mount, SSR-safe). */
  canNativeShare: boolean;
}

export function useWebShare({
  shareText,
  shareTitle,
  shareUrl,
  onInitiated,
  onCompleted,
  copiedResetMs = 2000,
}: UseWebShareInput): UseWebShareResult {
  const [copied, setCopied] = useState(false);
  // Resolved after mount so SSR markup matches the first client render.
  const [canNativeShare, setCanNativeShare] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Latest-ref the callbacks so `share` stays stable without forcing callers
  // to memoize their analytics closures. Updated in an effect (not during
  // render) — `share` is only ever invoked from a user event, post-commit.
  const onInitiatedRef = useRef(onInitiated);
  const onCompletedRef = useRef(onCompleted);
  useEffect(() => {
    onInitiatedRef.current = onInitiated;
    onCompletedRef.current = onCompleted;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot capability probe; `navigator` is unavailable during SSR so it must run post-mount
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const share = useCallback(async () => {
    const usedNative = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
    const platform: WebShareMethod = usedNative ? 'native' : 'copy';
    onInitiatedRef.current?.(platform);

    try {
      if (usedNative) {
        try {
          await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
          onCompletedRef.current?.('native');
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
        copyTimerRef.current = setTimeout(() => setCopied(false), copiedResetMs);
        onCompletedRef.current?.('copy');
      }
    } catch (err) {
      Logger.warn('Share failed', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, [shareText, shareTitle, shareUrl, copiedResetMs]);

  return { share, copied, canNativeShare };
}
