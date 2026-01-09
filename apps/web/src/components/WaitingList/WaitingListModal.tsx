'use client';

/**
 * Waiting List Modal Component
 *
 * Full-screen modal orchestrator with 40/60 split layout on desktop
 * Uses extracted sub-components for better maintainability
 *
 * Domain-Driven Design: Orchestration layer for modal functionality
 * Code Reusability: Uses extracted form, success, and hook components
 * File Decoupling: Each concern in its own component
 */

import React, { useRef, useEffect } from 'react';
import { useTranslation } from '@diboas/i18n/client';
import Image from 'next/image';
import { useLocale } from '@/components/Providers';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useWaitlistModalForm } from './hooks/useWaitlistModalForm';
import { WaitlistModalForm } from './WaitlistModalForm';
import { WaitlistModalSuccess } from './WaitlistModalSuccess';
import styles from './WaitingListModal.module.css';

interface WaitingListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitingListModal({ isOpen, onClose }: WaitingListModalProps) {
  const intl = useTranslation();
  const { locale } = useLocale();
  const modalRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  // WCAG 2.4.3: Focus trap for modal
  useFocusTrap(modalRef, isOpen, { initialFocus: '#email' });

  // Helper function for translations
  const t = (key: string, values?: Record<string, string>) => {
    return intl.formatMessage({ id: `common.waitingList.${key}` }, values);
  };

  // Form state and handlers from custom hook
  const {
    formData,
    errors,
    isLoading,
    isSuccess,
    submittedEmail,
    handleInputChange,
    handleSubmit,
    resetForm,
  } = useWaitlistModalForm({ locale, t });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

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
      <div ref={modalRef} className={styles.modal}>
        {/* Close button */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t('close')}
          type="button"
        >
          <CloseIcon />
        </button>

        {/* Left side - Image (desktop only) */}
        <div className={styles.imageSection}>
          <div className={styles.imageWrapper}>
            <Image
              src="/assets/socials/drawing/phone-hero.avif"
              alt={t('imageAlt')}
              fill
              priority
              className={styles.bannerImage}
            />
          </div>
        </div>

        {/* Right side - Form or Success */}
        <div className={styles.formSection}>
          {isSuccess ? (
            <WaitlistModalSuccess
              submittedEmail={submittedEmail}
              onClose={onClose}
              labels={{
                title: t('success.title'),
                message: t('success.message'),
                emailSent: t('success.emailSent', { email: submittedEmail }),
                closeButton: t('success.close'),
              }}
            />
          ) : (
            <WaitlistModalForm
              formRef={formRef}
              emailInputRef={emailInputRef}
              formData={formData}
              errors={errors}
              isLoading={isLoading}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              labels={{
                title: t('title'),
                subtitle: t('subtitle'),
                emailLabel: t('form.email.label'),
                emailPlaceholder: t('form.email.placeholder'),
                nameLabel: t('form.name.label'),
                namePlaceholder: t('form.name.placeholder'),
                xAccountLabel: t('form.xAccount.label'),
                xAccountPlaceholder: t('form.xAccount.placeholder'),
                optional: t('form.optional'),
                required: '*',
                consentText: t('form.consent.text'),
                privacyPolicy: t('form.consent.privacyPolicy'),
                submit: t('form.submit'),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
