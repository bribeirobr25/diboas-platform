'use client';

/**
 * Waitlist Form Hook
 *
 * Manages waitlist form state and submission logic
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocale } from '@/components/Providers';
import { analyticsService } from '@/lib/analytics';
import { getReferralFromStorage, isValidEmail } from '@/lib/waitingList/helpers';
import { REFERRAL_CONFIG, WAITING_LIST_EVENTS } from '@/lib/waitingList/constants';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import { getStoredUtmParams, utmToTags } from '@/hooks/useUtmCapture';
import { getCtaSource } from '@/lib/analytics/ctaAttribution';
import {
  applicationEventBus,
  ApplicationEventType,
} from '@/lib/events/ApplicationEventBus';

export interface FormState {
  email: string;
  gdprAccepted: boolean;
}

export interface WaitlistSuccessData {
  position: number;
  referralCode: string;
  referralUrl: string;
  tier?: string;
}

interface UseWaitlistFormOptions {
  compact?: boolean;
  /** Override referral code (e.g. from manually entered invite code) */
  referredBy?: string;
  /** Waitlist source identifier (e.g. 'landing_b2b') */
  source?: string;
  onSuccess: (data: WaitlistSuccessData) => void;
  onError?: (error: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

interface UseWaitlistFormReturn {
  formState: FormState;
  error: string | null;
  isLoading: boolean;
  hasReferral: boolean;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

/**
 * Get referral code from URL or cookie
 */
function getReferralCode(): string | null {
  if (typeof window === 'undefined') return null;

  // Check URL first
  const urlParams = new URLSearchParams(window.location.search);
  const refFromUrl = urlParams.get('ref');
  if (refFromUrl) return refFromUrl;

  // Check cookie
  return getReferralFromStorage(REFERRAL_CONFIG.referralCookieName);
}

export function useWaitlistForm(options: UseWaitlistFormOptions): UseWaitlistFormReturn {
  const {
    compact = false,
    referredBy: referredByOverride,
    source,
    onSuccess,
    onError,
    t,
  } = options;
  const { locale } = useLocale();

  const [formState, setFormState] = useState<FormState>({
    email: '',
    gdprAccepted: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);

  // Ref to prevent double-submit (immediate check before React state update)
  const isSubmittingRef = useRef(false);
  // AbortController for cancelling in-flight requests on unmount
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setHasReferral(!!referredByOverride || getReferralCode() !== null);
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [referredByOverride]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user types
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double-submit using ref (immediate check before state update)
    if (isSubmittingRef.current) {
      return;
    }
    isSubmittingRef.current = true;

    setError(null);
    setIsLoading(true);

    // Track form submission
    analyticsService.track({
      name: WAITING_LIST_EVENTS.FORM_SUBMITTED,
      parameters: {
        locale,
        timestamp: Date.now(),
      },
    });

    // Emit feature used event for audit trail
    applicationEventBus.emit(ApplicationEventType.FEATURE_USED, {
      source: 'waitlist',
      timestamp: Date.now(),
      metadata: {
        feature: 'waitlist_signup_form',
        locale,
        compact,
      },
    });

    // Validate email
    if (!formState.email || !isValidEmail(formState.email)) {
      setError(t('error.invalidEmail'));
      setIsLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    // Validate consent (unless compact mode)
    if (!compact && !formState.gdprAccepted) {
      setError(t('error.consentRequired'));
      setIsLoading(false);
      isSubmittingRef.current = false;
      return;
    }

    try {
      const referredBy = referredByOverride || getReferralCode();

      // Capture UTM params and CTA source for attribution
      const utmParams = getStoredUtmParams();
      const utmTags = utmToTags(utmParams);
      const ctaSource = getCtaSource();
      if (ctaSource) utmTags.push(`cta_source:${ctaSource}`);

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const response = await fetchWithRetry('/api/waitlist/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formState.email.toLowerCase().trim(),
          locale,
          gdprAccepted: compact ? true : formState.gdprAccepted,
          referredBy,
          ...(source ? { source } : {}),
          ...(utmTags.length > 0 ? { tags: utmTags } : {}),
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.errorCode === 'ALREADY_REGISTERED') {
          setError(t('error.alreadyRegistered'));
          // If already registered, still call onSuccess with existing data
          if (data.position && data.referralCode) {
            onSuccess({
              position: data.position,
              referralCode: data.referralCode,
              referralUrl: data.referralUrl,
              tier: data.tier,
            });
          }
        } else if (data.errorCode === 'INVALID_EMAIL') {
          setError(t('error.invalidEmail'));
        } else {
          setError(t('error.generic'));
        }
        onError?.(data.error || 'Unknown error');
        return;
      }

      // Track success with attribution data
      analyticsService.track({
        name: WAITING_LIST_EVENTS.SUBMISSION_SUCCESS,
        parameters: {
          position: data.position,
          hasReferral: !!referredBy,
          locale,
          timestamp: Date.now(),
          ...(utmParams.utm_source ? { utm_source: utmParams.utm_source } : {}),
          ...(utmParams.utm_medium ? { utm_medium: utmParams.utm_medium } : {}),
          ...(utmParams.utm_campaign ? { utm_campaign: utmParams.utm_campaign } : {}),
          ...(ctaSource ? { cta_source: ctaSource } : {}),
        },
      });

      // Clear social proof cache so counter updates on next render/refresh
      try {
        sessionStorage.removeItem('diboas-waitlist-stats');
        if (source) sessionStorage.removeItem(`diboas-waitlist-stats-${source}`);
      } catch { /* SSR or unavailable */ }

      // Call success callback
      onSuccess({
        position: data.position,
        referralCode: data.referralCode,
        referralUrl: data.referralUrl,
        tier: data.tier,
      });

    } catch (error) {
      setError(t('error.network'));
      onError?.('Network error');

      analyticsService.track({
        name: WAITING_LIST_EVENTS.SUBMISSION_FAILURE,
        parameters: {
          error: 'network_error',
          locale,
          timestamp: Date.now(),
        },
      });

      // Emit application error for monitoring
      applicationEventBus.emit(ApplicationEventType.APPLICATION_ERROR, {
        source: 'waitlist',
        timestamp: Date.now(),
        error: error instanceof Error ? error : new Error('Network error'),
        severity: 'medium',
        context: {
          operation: 'form_submission',
          locale,
        },
      });
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  }, [formState, compact, referredByOverride, source, locale, t, onSuccess, onError]);

  return {
    formState,
    error,
    isLoading,
    hasReferral,
    handleInputChange,
    handleSubmit,
  };
}
