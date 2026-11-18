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

import { useState, useCallback, useRef } from 'react';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { analyticsService } from '@/lib/analytics';
import type { WaitingListFormData, WaitingListFormErrors } from '@/lib/waitingList/types';
import type { WaitlistSource } from '@/lib/waitingList/store/types';
import { buildModalSignupBody } from '@/lib/waitingList/modalSignupBody';

/** The server's error codes are fixed upper-case names; anything else is not forwarded. */
const SERVER_ERROR_CODE = /^[A-Z][A-Z_]{0,39}$/;

interface UseWaitlistModalFormOptions {
  /** Current locale */
  locale: string;
  /** Translation function */
  t: (key: string, values?: Record<string, string>) => string;
  /**
   * The path that opened the modal (`5.979`, plan P11 D1): `dream_mode` or `app_link`,
   * never the container: the route accepts only the listed paths.
   */
  source: WaitlistSource;
  /** Called once the server has stored the signup (Dream Mode unlocks on it, D5). */
  onJoined?: () => void;
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
  source,
  onJoined,
}: UseWaitlistModalFormOptions): UseWaitlistModalFormReturn {
  const [formData, setFormData] = useState<WaitingListFormData>(initialFormData);
  const [errors, setErrors] = useState<WaitingListFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  // Ref to prevent double-submit (immediate check before React state update)
  const isSubmittingRef = useRef(false);

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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent double-submit using ref (immediate check before state update)
      if (isSubmittingRef.current) {
        return;
      }
      isSubmittingRef.current = true;

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
        const response = await fetchWithRetry('/api/waitlist/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildModalSignupBody(formData, locale, source)),
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
            // The server's fixed code makes a refusal countable by reason (plan P11 D6).
            parameters: {
              errorType,
              errorCode:
                typeof data.errorCode === 'string' && SERVER_ERROR_CODE.test(data.errorCode)
                  ? data.errorCode
                  : 'none',
              timestamp: Date.now(),
            },
          });
          return;
        }

        setSubmittedEmail(formData.email);
        setIsSuccess(true);
        onJoined?.();

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
          parameters: { errorType: 'network_error', errorCode: 'none', timestamp: Date.now() },
        });

        setErrors({ general: t('errors.submissionFailed') });
      } finally {
        setIsLoading(false);
        isSubmittingRef.current = false;
      }
    },
    [formData, locale, t, source, onJoined]
  );

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
