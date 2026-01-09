'use client';

/**
 * useWaitlistModalForm Hook
 *
 * Manages form state and submission logic for the WaitingListModal
 * Extracted from WaitingListModal for better separation of concerns
 *
 * Domain-Driven Design: Form logic isolated in custom hook
 * Code Reusability: Can be used in different modal implementations
 */

import { useState, useCallback } from 'react';
import { analyticsService } from '@/lib/analytics';
import type {
  WaitingListFormData,
  WaitingListFormErrors,
} from '@/lib/waitingList/types';

interface UseWaitlistModalFormOptions {
  /** Current locale */
  locale: string;
  /** Translation function */
  t: (key: string, values?: Record<string, string>) => string;
}

interface UseWaitlistModalFormReturn {
  /** Current form data */
  formData: WaitingListFormData;
  /** Current form errors */
  errors: WaitingListFormErrors;
  /** Whether form is submitting */
  isLoading: boolean;
  /** Whether submission was successful */
  isSuccess: boolean;
  /** Email that was submitted (for success message) */
  submittedEmail: string;
  /** Handle input changes */
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handle form submission */
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  /** Reset form state */
  resetForm: () => void;
}

const initialFormData: WaitingListFormData = {
  name: '',
  email: '',
  xAccount: '',
  gdprAccepted: false,
};

export function useWaitlistModalForm({
  locale,
  t,
}: UseWaitlistModalFormOptions): UseWaitlistModalFormReturn {
  const [formData, setFormData] = useState<WaitingListFormData>(initialFormData);
  const [errors, setErrors] = useState<WaitingListFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error for this field when user types
    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Track form submission attempt
    analyticsService.track({
      name: 'waiting_list_form_submitted',
      parameters: {
        hasName: !!formData.name,
        hasXAccount: !!formData.xAccount,
        locale,
        timestamp: Date.now(),
      },
    });

    try {
      const response = await fetch('/api/waitlist/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          name: formData.name || undefined,
          locale,
          gdprAccepted: formData.gdprAccepted,
          source: 'modal',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorType = 'unknown';
        if (data.errorCode === 'ALREADY_REGISTERED') {
          errorType = 'duplicate';
          setErrors({ email: t('errors.duplicateEmail') });
        } else if (data.errorCode === 'INVALID_EMAIL') {
          errorType = 'validation';
          setErrors({ email: t('errors.invalidEmail') });
        } else if (data.errorCode === 'CONSENT_REQUIRED') {
          errorType = 'validation';
          setErrors({ gdprAccepted: t('errors.consentRequired') });
        } else {
          errorType = 'submission_failed';
          setErrors({ general: t('errors.submissionFailed') });
        }

        analyticsService.track({
          name: 'waiting_list_signup_error',
          parameters: { errorType, timestamp: Date.now() },
        });
        return;
      }

      setSubmittedEmail(formData.email);
      setIsSuccess(true);

      analyticsService.track({
        name: 'waiting_list_signup_success',
        parameters: {
          locale,
          position: data.position,
          timestamp: Date.now(),
        },
      });
    } catch {
      analyticsService.track({
        name: 'waiting_list_signup_error',
        parameters: { errorType: 'network_error', timestamp: Date.now() },
      });

      setErrors({ general: t('errors.submissionFailed') });
    } finally {
      setIsLoading(false);
    }
  }, [formData, locale, t]);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    setIsLoading(false);
    setIsSuccess(false);
    setSubmittedEmail('');
  }, []);

  return {
    formData,
    errors,
    isLoading,
    isSuccess,
    submittedEmail,
    handleInputChange,
    handleSubmit,
    resetForm,
  };
}
