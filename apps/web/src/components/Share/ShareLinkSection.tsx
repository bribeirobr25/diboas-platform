'use client';

/**
 * Share Link Section Component
 *
 * Displays a copyable share link with copy button
 * Extracted from ShareModal for better separation of concerns
 *
 * Domain-Driven Design: Single responsibility - link copy functionality
 * Code Reusability: Can be used independently in other contexts
 */

import React from 'react';
import styles from './ShareModal.module.css';

interface ShareLinkSectionProps {
  /** The URL to display and copy */
  url: string;
  /** Whether the link was successfully copied */
  copySuccess: boolean;
  /** Callback when copy is requested */
  onCopy: () => void;
  /** Labels for accessibility and display */
  labels: {
    shareLink: string;
    copyLink: string;
    copied: string;
  };
  /** Custom class name */
  className?: string;
}

export function ShareLinkSection({
  url,
  copySuccess,
  onCopy,
  labels,
  className = '',
}: ShareLinkSectionProps) {
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).select();
  };

  return (
    <div className={`${styles.linkSection} ${className}`}>
      <div className={styles.linkBox}>
        <label htmlFor="share-link" className="sr-only">
          {labels.shareLink}
        </label>
        <input
          id="share-link"
          type="text"
          value={url}
          readOnly
          className={styles.linkInput}
          onClick={handleInputClick}
        />
        <button
          onClick={onCopy}
          className={`${styles.copyButton} ${copySuccess ? styles.copied : ''}`}
        >
          {copySuccess ? (
            <>
              <CheckIcon />
              <span>{labels.copied}</span>
            </>
          ) : (
            <>
              <CopyIcon />
              <span>{labels.copyLink}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Icon components
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
      aria-hidden="true"
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
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default ShareLinkSection;
