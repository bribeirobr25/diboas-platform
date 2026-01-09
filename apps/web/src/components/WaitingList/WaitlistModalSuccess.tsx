'use client';

/**
 * Waitlist Modal Success Component
 *
 * Displays success state after successful waitlist signup
 * Extracted from WaitingListModal for better separation of concerns
 *
 * Domain-Driven Design: Single responsibility - success display
 * Code Reusability: Can be used in different modal implementations
 */

import React from 'react';
import styles from './WaitingListModal.module.css';

interface WaitlistModalSuccessProps {
  /** Email that was submitted */
  submittedEmail: string;
  /** Close button click handler */
  onClose: () => void;
  /** Labels for display */
  labels: {
    title: string;
    message: string;
    emailSent: string;
    closeButton: string;
  };
  /** Custom class name */
  className?: string;
}

export function WaitlistModalSuccess({
  submittedEmail,
  onClose,
  labels,
  className = '',
}: WaitlistModalSuccessProps) {
  return (
    <div className={`${styles.successContainer} ${className}`}>
      <div className={styles.successIcon}>
        <SuccessIcon />
      </div>
      <h2 className={styles.successTitle}>{labels.title}</h2>
      <p className={styles.successMessage}>{labels.message}</p>
      <p className={styles.successEmail}>{labels.emailSent}</p>
      <button
        className={styles.closeModalButton}
        onClick={onClose}
        type="button"
      >
        {labels.closeButton}
      </button>
    </div>
  );
}

function SuccessIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

export default WaitlistModalSuccess;
