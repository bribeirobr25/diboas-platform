'use client';

/**
 * Waitlist Modal Form Component
 *
 * Full-featured form with name, email, xAccount fields
 * Extracted from WaitingListModal for better separation of concerns
 *
 * Domain-Driven Design: Single responsibility - form rendering
 * Code Reusability: Uses shared useWaitlistModalForm hook
 */

import React from 'react';
import Link from 'next/link';
import type {
  WaitingListFormData,
  WaitingListFormErrors,
} from '@/lib/waitingList/types';
import { WAITING_LIST_CONFIG } from '@/lib/waitingList/constants';
import styles from './WaitingListModal.module.css';

interface WaitlistModalFormProps {
  /** Form reference */
  formRef: React.RefObject<HTMLFormElement>;
  /** Email input reference */
  emailInputRef: React.RefObject<HTMLInputElement>;
  /** Current form data */
  formData: WaitingListFormData;
  /** Current form errors */
  errors: WaitingListFormErrors;
  /** Whether form is submitting */
  isLoading: boolean;
  /** Handle input changes */
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handle form submission */
  onSubmit: (e: React.FormEvent) => void;
  /** Labels for display */
  labels: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    xAccountLabel: string;
    xAccountPlaceholder: string;
    optional: string;
    required: string;
    consentText: string;
    privacyPolicy: string;
    submit: string;
  };
  /** Custom class name */
  className?: string;
}

export function WaitlistModalForm({
  formRef,
  emailInputRef,
  formData,
  errors,
  isLoading,
  onInputChange,
  onSubmit,
  labels,
  className = '',
}: WaitlistModalFormProps) {
  return (
    <div className={className}>
      <h2 id="waiting-list-title" className={styles.title}>
        {labels.title}
      </h2>
      <p className={styles.subtitle}>{labels.subtitle}</p>

      <form ref={formRef} onSubmit={onSubmit} className={styles.form}>
        {errors.general && (
          <div className={styles.generalError} role="alert" aria-live="assertive">
            {errors.general}
          </div>
        )}

        {/* Email field (required) */}
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>
            {labels.emailLabel}
            <span className={styles.required}>{labels.required}</span>
          </label>
          <input
            ref={emailInputRef}
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            placeholder={labels.emailPlaceholder}
            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={!!errors.email}
            required
            autoComplete="email"
          />
          {errors.email && (
            <span id="email-error" className={styles.errorMessage} role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Name field (optional) */}
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.label}>
            {labels.nameLabel}
            <span className={styles.optional}>{labels.optional}</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={onInputChange}
            placeholder={labels.namePlaceholder}
            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={!!errors.name}
            maxLength={WAITING_LIST_CONFIG.maxNameLength}
            autoComplete="name"
          />
          {errors.name && (
            <span id="name-error" className={styles.errorMessage} role="alert">
              {errors.name}
            </span>
          )}
        </div>

        {/* X Account field (optional) */}
        <div className={styles.formGroup}>
          <label htmlFor="xAccount" className={styles.label}>
            {labels.xAccountLabel}
            <span className={styles.optional}>{labels.optional}</span>
          </label>
          <input
            type="text"
            id="xAccount"
            name="xAccount"
            value={formData.xAccount}
            onChange={onInputChange}
            placeholder={labels.xAccountPlaceholder}
            className={`${styles.input} ${errors.xAccount ? styles.inputError : ''}`}
            aria-describedby={errors.xAccount ? 'xAccount-error' : undefined}
            aria-invalid={!!errors.xAccount}
            maxLength={WAITING_LIST_CONFIG.maxXAccountLength}
          />
          {errors.xAccount && (
            <span id="xAccount-error" className={styles.errorMessage} role="alert">
              {errors.xAccount}
            </span>
          )}
        </div>

        {/* GDPR Consent checkbox (required) */}
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="gdprAccepted"
            name="gdprAccepted"
            checked={formData.gdprAccepted}
            onChange={onInputChange}
            className={styles.checkbox}
            aria-describedby={errors.gdprAccepted ? 'gdpr-error' : undefined}
            aria-invalid={!!errors.gdprAccepted}
            aria-required="true"
            required
          />
          <label htmlFor="gdprAccepted" className={styles.checkboxLabel}>
            {labels.consentText}{' '}
            <Link
              href={WAITING_LIST_CONFIG.privacyPolicyUrl}
              target="_blank"
              className={styles.privacyLink}
            >
              {labels.privacyPolicy}
            </Link>
            <span className={styles.required}>{labels.required}</span>
          </label>
          {errors.gdprAccepted && (
            <span id="gdpr-error" className={styles.errorMessage} role="alert">
              {errors.gdprAccepted}
            </span>
          )}
        </div>

        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading || !formData.gdprAccepted}
        >
          {isLoading ? (
            <span className={styles.loadingSpinner} />
          ) : (
            labels.submit
          )}
        </button>
      </form>
    </div>
  );
}

export default WaitlistModalForm;
