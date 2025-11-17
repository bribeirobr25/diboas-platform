'use client';

/**
 * Waiting List Modal Component
 *
 * Full-screen modal with 40/60 split layout on desktop
 * Includes form with validation, sanitization, and consent tracking
 * Internationalized with react-intl
 */

import React, { useState, useRef, useEffect } from 'react';
import { useIntl } from 'react-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '@/components/LocaleProvider';
import { waitingListService } from '@/lib/waitingList';
import {
  WaitingListFormData,
  WaitingListFormErrors,
  WaitingListValidationError,
  WaitingListDuplicateError,
  SubmissionInput,
} from '@/lib/waitingList/types';
import { WAITING_LIST_CONFIG } from '@/lib/waitingList/constants';
import { analyticsService } from '@/lib/analytics';
import styles from './WaitingListModal.module.css';

interface WaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitingListModal({ isOpen, onClose }: WaitingListModalProps) {
  const intl = useIntl();
  const { locale } = useLocale();
  const formRef = useRef<HTMLFormElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<WaitingListFormData>({
    name: '',
    email: '',
    xAccount: '',
    gdprAccepted: false,
  });

  const [errors, setErrors] = useState<WaitingListFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Helper function for translations
  const t = (key: string, values?: Record<string, string>) => {
    return intl.formatMessage({ id: `common.waitingList.${key}` }, values);
  };

  // Focus email input when modal opens
  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        email: '',
        xAccount: '',
        gdprAccepted: false,
      });
      setErrors({});
      setIsLoading(false);
      setIsSuccess(false);
      setSubmittedEmail('');
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field when user types
    if (errors[name as keyof WaitingListFormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // P10: Track form submission attempt
    analyticsService.track({
      name: 'waiting_list_form_submitted',
      parameters: {
        hasName: !!formData.name,
        hasXAccount: !!formData.xAccount,
        locale: locale,
        timestamp: Date.now(),
      },
    });

    try {
      const input: SubmissionInput = {
        email: formData.email,
        name: formData.name || undefined,
        xAccount: formData.xAccount || undefined,
        gdprAccepted: formData.gdprAccepted,
        locale: locale,
      };

      await waitingListService.submitToWaitingList(input);

      setSubmittedEmail(formData.email);
      setIsSuccess(true);

      // P10: Track successful signup
      analyticsService.track({
        name: 'waiting_list_signup_success',
        parameters: {
          locale: locale,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      // P10: Track signup error
      let errorType = 'unknown';
      if (error instanceof WaitingListValidationError) {
        errorType = 'validation';
        const fieldErrors: WaitingListFormErrors = {};
        error.validationErrors.forEach((validationError) => {
          const field = validationError.field as keyof WaitingListFormErrors;
          // Extract the error key from the full path
          const errorKey = validationError.message.replace('common.waitingList.', '');
          fieldErrors[field] = t(errorKey);
        });
        setErrors(fieldErrors);
      } else if (error instanceof WaitingListDuplicateError) {
        errorType = 'duplicate';
        setErrors({
          email: t('errors.duplicateEmail'),
        });
      } else {
        errorType = 'submission_failed';
        setErrors({
          general: t('errors.submissionFailed'),
        });
      }

      analyticsService.track({
        name: 'waiting_list_signup_error',
        parameters: {
          errorType,
          timestamp: Date.now(),
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="waiting-list-title"
    >
      <div className={styles.modal}>
        {/* Close button */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('close')}
          type="button"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Left side - Image (desktop only) */}
        <div className={styles.imageSection}>
          <div className={styles.imageWrapper}>
            <Image
              src="/assets/socials/drawing/phone-activity-and-rewards.avif"
              alt={t('imageAlt')}
              fill
              priority
              className={styles.bannerImage}
            />
          </div>
        </div>

        {/* Right side - Form */}
        <div className={styles.formSection}>
          {isSuccess ? (
            <div className={styles.successContainer}>
              <div className={styles.successIcon}>
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h2 className={styles.successTitle}>{t('success.title')}</h2>
              <p className={styles.successMessage}>{t('success.message')}</p>
              <p className={styles.successEmail}>
                {t('success.emailSent', { email: submittedEmail })}
              </p>
              <button
                className={styles.closeModalButton}
                onClick={onClose}
                type="button"
              >
                {t('success.close')}
              </button>
            </div>
          ) : (
            <>
              <h2 id="waiting-list-title" className={styles.title}>
                {t('title')}
              </h2>
              <p className={styles.subtitle}>{t('subtitle')}</p>

              <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
                {errors.general && (
                  <div className={styles.generalError} role="alert">
                    {errors.general}
                  </div>
                )}

                {/* Email field (required) - First because it's the only mandatory field */}
                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    {t('form.email.label')}
                    <span className={styles.required}>*</span>
                  </label>
                  <input
                    ref={emailInputRef}
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder={t('form.email.placeholder')}
                    className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                    required
                    autoComplete="email"
                  />
                  {errors.email && (
                    <span className={styles.errorMessage} role="alert">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Name field (optional) */}
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    {t('form.name.label')}
                    <span className={styles.optional}>{t('form.optional')}</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder={t('form.name.placeholder')}
                    className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                    maxLength={WAITING_LIST_CONFIG.maxNameLength}
                    autoComplete="name"
                  />
                  {errors.name && (
                    <span className={styles.errorMessage} role="alert">
                      {errors.name}
                    </span>
                  )}
                </div>

                {/* X Account field (optional) */}
                <div className={styles.formGroup}>
                  <label htmlFor="xAccount" className={styles.label}>
                    {t('form.xAccount.label')}
                    <span className={styles.optional}>{t('form.optional')}</span>
                  </label>
                  <input
                    type="text"
                    id="xAccount"
                    name="xAccount"
                    value={formData.xAccount}
                    onChange={handleInputChange}
                    placeholder={t('form.xAccount.placeholder')}
                    className={`${styles.input} ${errors.xAccount ? styles.inputError : ''}`}
                    maxLength={WAITING_LIST_CONFIG.maxXAccountLength}
                  />
                  {errors.xAccount && (
                    <span className={styles.errorMessage} role="alert">
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
                    onChange={handleInputChange}
                    className={styles.checkbox}
                    required
                  />
                  <label htmlFor="gdprAccepted" className={styles.checkboxLabel}>
                    {t('form.consent.text')}{' '}
                    <Link
                      href={WAITING_LIST_CONFIG.privacyPolicyUrl}
                      target="_blank"
                      className={styles.privacyLink}
                    >
                      {t('form.consent.privacyPolicy')}
                    </Link>
                    <span className={styles.required}>*</span>
                  </label>
                  {errors.gdprAccepted && (
                    <span className={styles.errorMessage} role="alert">
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
                    t('form.submit')
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
