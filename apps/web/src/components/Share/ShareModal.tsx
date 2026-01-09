'use client';

/**
 * Share Modal Component
 *
 * Modal orchestrator that combines:
 * - ShareCardPreview for card display
 * - ShareButtons for platform selection
 * - ShareLinkSection for copy functionality
 *
 * Domain-Driven Design: Orchestration layer for share functionality
 * Code Reusability: Uses extracted sub-components
 * File Decoupling: Each concern in its own component
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import { useLocale } from '@/components/Providers';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { ShareButtons } from './ShareButtons';
import { ShareCardPreview } from './ShareCardPreview';
import { ShareLinkSection } from './ShareLinkSection';
import { CloseIcon, DownloadIcon } from './ShareIcons';
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
  const intl = useTranslation();
  const { locale } = useLocale();
  const modalRef = useRef<HTMLDivElement>(null);
  const [renderedCard, setRenderedCard] = useState<RenderedCard | null>(
    preRenderedCard || null
  );
  const [isRendering, setIsRendering] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // WCAG 2.4.3: Focus trap for modal
  useFocusTrap(modalRef, isOpen);

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
        .catch(() => {
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

  // Handle copy link
  const handleCopyLink = useCallback(() => {
    handleShare('copy');
  }, [handleShare]);

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
      <div ref={modalRef} className={styles.modal}>
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
        <ShareCardPreview
          renderedCard={renderedCard}
          isRendering={isRendering}
          loadingText={t('modal.generating')}
          noPreviewText={t('modal.noPreview')}
        />

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
          <ShareLinkSection
            url={shareContent.url}
            copySuccess={copySuccess}
            onCopy={handleCopyLink}
            labels={{
              shareLink: t('modal.shareLink'),
              copyLink: t('modal.copyLink'),
              copied: t('modal.copied'),
            }}
          />
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
