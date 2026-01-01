/**
 * ShareableCard Component
 *
 * Preview component for shareable cards.
 * Displays a card preview with optional share actions.
 *
 * Usage:
 * ```tsx
 * <ShareableCard
 *   card={renderedCard}
 *   onShare={(platform) => handleShare(platform)}
 *   onDownload={() => handleDownload()}
 * />
 * ```
 */

'use client';

import { useState, useCallback } from 'react';
import { useIntl } from 'react-intl';
import Image from 'next/image';
import type { RenderedCard, SharePlatform, CardType } from '@/lib/share/types';
import { ShareButtons } from './ShareButtons';
import styles from './ShareableCard.module.css';

/**
 * ShareableCard Props
 */
export interface ShareableCardProps {
  /** Rendered card to display */
  card: RenderedCard | null;
  /** Card type for analytics */
  cardType?: CardType;
  /** Whether card is loading */
  isLoading?: boolean;
  /** Error message if generation failed */
  error?: string;
  /** Show share buttons */
  showShareButtons?: boolean;
  /** Show download button */
  showDownload?: boolean;
  /** Share handler */
  onShare?: (platform: SharePlatform) => void;
  /** Download handler */
  onDownload?: () => void;
  /** Retry handler (if error) */
  onRetry?: () => void;
  /** Optional class name */
  className?: string;
}

export function ShareableCard({
  card,
  cardType,
  isLoading = false,
  error,
  showShareButtons = true,
  showDownload = true,
  onShare,
  onDownload,
  onRetry,
  className,
}: ShareableCardProps) {
  const intl = useIntl();
  const [imageLoaded, setImageLoaded] = useState(false);

  // Handle share click
  const handleShare = useCallback(
    (platform: SharePlatform) => {
      onShare?.(platform);
    },
    [onShare]
  );

  // Handle download
  const handleDownload = useCallback(() => {
    if (!card) return;

    // Create download link
    const link = document.createElement('a');
    link.href = card.dataUrl;
    link.download = `diboas-${cardType || 'card'}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onDownload?.();
  }, [card, cardType, onDownload]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`${styles.cardContainer} ${styles.loading} ${className || ''}`}>
        <div className={styles.cardPlaceholder}>
          <div className={styles.loadingSpinner} />
          <span className={styles.loadingText}>
            {intl.formatMessage({ id: 'common.share.generating' }, { defaultMessage: 'Generating card...' })}
          </span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${styles.cardContainer} ${styles.error} ${className || ''}`}>
        <div className={styles.cardPlaceholder}>
          <span className={styles.errorIcon}>!</span>
          <span className={styles.errorText}>{error}</span>
          {onRetry && (
            <button className={styles.retryButton} onClick={onRetry}>
              {intl.formatMessage({ id: 'common.share.retry' }, { defaultMessage: 'Try Again' })}
            </button>
          )}
        </div>
      </div>
    );
  }

  // No card state
  if (!card) {
    return (
      <div className={`${styles.cardContainer} ${styles.empty} ${className || ''}`}>
        <div className={styles.cardPlaceholder}>
          <span className={styles.emptyText}>
            {intl.formatMessage({ id: 'common.share.noCard' }, { defaultMessage: 'No card available' })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.cardContainer} ${className || ''}`}>
      {/* Card Preview */}
      <div className={styles.cardWrapper}>
        <div
          className={`${styles.cardImage} ${imageLoaded ? styles.loaded : ''}`}
          style={{ aspectRatio: `${card.width} / ${card.height}` }}
        >
          <Image
            src={card.dataUrl}
            alt={intl.formatMessage({ id: 'common.share.cardAlt' }, { defaultMessage: 'Shareable card preview' })}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className={styles.image}
            onLoadingComplete={() => setImageLoaded(true)}
          />
        </div>

        {/* Watermark indicator */}
        <div className={styles.watermarkBadge}>
          {intl.formatMessage({ id: 'common.share.simulationBadge' }, { defaultMessage: 'SIMULATION' })}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {/* Share Buttons */}
        {showShareButtons && (
          <div className={styles.shareSection}>
            <span className={styles.shareLabel}>
              {intl.formatMessage({ id: 'common.share.shareVia' }, { defaultMessage: 'Share via:' })}
            </span>
            <ShareButtons
              onShare={handleShare}
              platforms={['twitter', 'instagram', 'whatsapp', 'linkedin', 'facebook']}
              compact
            />
          </div>
        )}

        {/* Download Button */}
        {showDownload && (
          <button className={styles.downloadButton} onClick={handleDownload}>
            <DownloadIcon />
            {intl.formatMessage({ id: 'common.share.download' }, { defaultMessage: 'Download' })}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Download Icon SVG
 */
function DownloadIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

export default ShareableCard;
