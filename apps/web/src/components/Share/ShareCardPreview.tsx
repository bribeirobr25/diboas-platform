'use client';

/**
 * Share Card Preview Component
 *
 * Displays the rendered share card with loading state
 * Extracted from ShareModal for better separation of concerns
 *
 * Domain-Driven Design: Single responsibility - card preview display
 * Code Reusability: Can be used independently in other contexts
 */

import React from 'react';
import type { RenderedCard } from '@/lib/share';
import styles from './ShareModal.module.css';

interface ShareCardPreviewProps {
  /** The rendered card to display */
  renderedCard: RenderedCard | null;
  /** Whether the card is currently being rendered */
  isRendering: boolean;
  /** Loading text to display */
  loadingText: string;
  /** No preview text to display when no card is available */
  noPreviewText: string;
  /** Custom class name */
  className?: string;
}

export function ShareCardPreview({
  renderedCard,
  isRendering,
  loadingText,
  noPreviewText,
  className = '',
}: ShareCardPreviewProps) {
  if (isRendering) {
    return (
      <div className={`${styles.preview} ${className}`}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>{loadingText}</span>
        </div>
      </div>
    );
  }

  if (renderedCard) {
    return (
      <div className={`${styles.preview} ${className}`}>
        <img
          src={renderedCard.dataUrl}
          alt="Share card preview"
          className={styles.cardImage}
        />
      </div>
    );
  }

  return (
    <div className={`${styles.preview} ${className}`}>
      <div className={styles.noCard}>
        <span>{noPreviewText}</span>
      </div>
    </div>
  );
}

export default ShareCardPreview;
