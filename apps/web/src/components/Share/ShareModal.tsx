'use client';

/**
 * Share Modal Component
 *
 * Modal that displays:
 * - Generated card preview
 * - Share platform buttons
 * - Copy link functionality
 * - Download option
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useLocale } from '@/components/LocaleProvider';
import { ShareButtons } from './ShareButtons';
import {
  CardRenderer,
  ShareManager,
  type SharePlatform,
  type CardData,
  type RenderedCard,
  type ShareContent,
  type CardLocale,
  SHARE_EVENTS,
} from '@/lib/share';
import { analyticsService } from '@/lib/analytics';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Card data to render */
  cardData?: CardData;
  /** Pre-rendered card (if already generated) */
  renderedCard?: RenderedCard;
  /** Share content (text, url, hashtags) */
  shareContent: ShareContent;
  /** Title for the modal */
  title?: string;
  /** Platforms to show */
  platforms?: SharePlatform[];
  /** Custom class name */
  className?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  cardData,
  renderedCard: preRenderedCard,
  shareContent,
  title,
  platforms,
  className = '',
}: ShareModalProps) {
  const intl = useIntl();
  const { locale } = useLocale();
  const [renderedCard, setRenderedCard] = useState<RenderedCard | null>(
    preRenderedCard || null
  );
  const [isRendering, setIsRendering] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const t = (key: string) => intl.formatMessage({ id: `share.${key}` });

  // Memoize share manager to prevent recreation on every render
  const shareManager = useMemo(
    () =>
      new ShareManager(locale as CardLocale, (data) => {
        analyticsService.track({
          name: SHARE_EVENTS.SHARE_COMPLETED,
          parameters: {
            platform: data.platform,
            cardType: data.cardType,
            locale: data.locale,
          },
        });
      }),
    [locale]
  );

  // Render card when modal opens
  useEffect(() => {
    if (isOpen && cardData && !renderedCard && !isRendering) {
      setIsRendering(true);
      const renderer = new CardRenderer();

      renderer
        .render(cardData)
        .then((card) => {
          setRenderedCard(card);
          analyticsService.track({
            name: SHARE_EVENTS.CARD_GENERATED,
            parameters: {
              cardType: cardData.type,
              locale,
            },
          });
        })
        .catch((err) => {
          console.error('Failed to render card:', err);
          setShareError('Failed to generate share card');
        })
        .finally(() => {
          setIsRendering(false);
        });
    }
  }, [isOpen, cardData, renderedCard, isRendering, locale]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShareError(null);
      setCopySuccess(false);
      // Don't reset renderedCard if preRenderedCard was provided
      if (!preRenderedCard) {
        setRenderedCard(null);
      }
    }
  }, [isOpen, preRenderedCard]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Handle share
  const handleShare = useCallback(
    async (platform: SharePlatform) => {
      setShareError(null);

      const content: ShareContent = {
        ...shareContent,
        image: renderedCard || undefined,
      };

      const result = await shareManager.share(platform, content);

      if (!result.success && !result.cancelled) {
        setShareError(result.error || 'Share failed');
      }

      if (platform === 'copy' && result.success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    },
    [shareContent, renderedCard, shareManager]
  );

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.backdrop} ${className}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <h2 id="share-modal-title" className={styles.title}>
            {title || t('modal.title')}
          </h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label={t('modal.close')}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Card preview */}
        <div className={styles.preview}>
          {isRendering ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>{t('modal.generating')}</span>
            </div>
          ) : renderedCard ? (
            <img
              src={renderedCard.dataUrl}
              alt="Share card preview"
              className={styles.cardImage}
            />
          ) : (
            <div className={styles.noCard}>
              <span>{t('modal.noPreview')}</span>
            </div>
          )}
        </div>

        {/* Share buttons */}
        <div className={styles.shareSection}>
          <p className={styles.shareLabel}>{t('modal.shareVia')}</p>
          <ShareButtons
            onShare={handleShare}
            platforms={platforms}
            disabled={isRendering}
          />
        </div>

        {/* Copy link section */}
        {shareContent.url && (
          <div className={styles.linkSection}>
            <div className={styles.linkBox}>
              <input
                type="text"
                value={shareContent.url}
                readOnly
                className={styles.linkInput}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => handleShare('copy')}
                className={`${styles.copyButton} ${copySuccess ? styles.copied : ''}`}
              >
                {copySuccess ? (
                  <>
                    <CheckIcon />
                    <span>{t('modal.copied')}</span>
                  </>
                ) : (
                  <>
                    <CopyIcon />
                    <span>{t('modal.copyLink')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {shareError && (
          <div className={styles.error}>
            <span>{shareError}</span>
          </div>
        )}

        {/* Download button */}
        {renderedCard && (
          <button
            onClick={() => handleShare('download')}
            className={styles.downloadButton}
          >
            <DownloadIcon />
            <span>{t('modal.download')}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Icon components
function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CopyIcon() {
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
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
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
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      width="20"
      height="20"
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
