'use client';

/**
 * Waitlist Form Hook
 *
 * Manages waitlist form state and submission logic
 */

import type { WaitlistSignupBody, WaitlistSource } from '@/lib/waitingList/store/types';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocale } from '@/components/Providers';
import { analyticsService } from '@/lib/analytics';
import { getReferralFromStorage, isValidEmail } from '@/lib/waitingList/helpers';
import {
  REFERRAL_CONFIG,
  SIGNUP_NOTE_BOX_VERSIONS,
  WAITING_LIST_EVENTS,
  toSignupFailureCode,
  type NoteConsentText,
} from '@/lib/waitingList/constants';
import { fetchWithRetry } from '@/lib/utils/fetchWithRetry';
import {
  clearCtaSource,
  getConsentedCtaLabel,
  getNoteForSignup,
  noteTags,
} from '@/lib/analytics/utmAttribution';
import { applicationEventBus, ApplicationEventType } from '@/lib/events/ApplicationEventBus';

export interface FormState {
  email: string;
  /**
   * The note box (W-D1, spec §3.3): unticked by default, optional. Ticked, the signup also stores
   * which button or campaign link brought the person (held in memory only until then).
   */
  noteConsent: boolean;
}

export interface WaitlistSuccessData {
  position: number;
  referralCode: string;
  referralUrl: string;
  tier?: string;
}

interface UseWaitlistFormOptions {
  /** Override referral code (e.g. from manually entered invite code) */
  referredBy?: string;
  /** The signup's source, from the one list (`5.979`, plan P11 D3) */
  source?: WaitlistSource;
  /**
   * Send the held button label (`cta_source:<label>`) with a ticked note. Default true. The
   * Money Jobs gate passes false: it carries its own `source`, must not consume a label another
   * button set (market clean-up W-C, decision H), and its box text names campaign links only.
   */
  readCtaSource?: boolean;
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
    referredBy: referredByOverride,
    source,
    readCtaSource = true,
    onSuccess,
    onError,
    t,
  } = options;
  const { locale } = useLocale();

  const [formState, setFormState] = useState<FormState>({
    email: '',
    noteConsent: false,
  });
  const noteText: NoteConsentText = readCtaSource ? 'note' : 'note-campaign';
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasReferral, setHasReferral] = useState(false);

  // Ref to prevent double-submit (immediate check before React state update)
  const isSubmittingRef = useRef(false);
  // AbortController for cancelling in-flight requests on unmount
  const abortControllerRef = useRef<AbortController | null>(null);
  // Mounted flag — prevents setState after unmount (defensive best practice)
  const mountedRef = useRef(true);

  useEffect(() => {
    setHasReferral(!!referredByOverride || getReferralCode() !== null);
    return () => {
      mountedRef.current = false;
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

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
        domain: 'waitlist',
        source: 'waitlist',
        timestamp: Date.now(),
        metadata: {
          feature: 'waitlist_signup_form',
          locale,
        },
      });

      // Validate email
      if (!formState.email || !isValidEmail(formState.email)) {
        setError(t('error.invalidEmail'));
        setIsLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      try {
        const referredBy = referredByOverride || getReferralCode();

        // The note (W-D1, spec §3.3–§3.4): only with the box ticked, from the in-memory hold.
        // Read, not consumed: the label survives a failed attempt and is cleared below only on
        // success (decision H). Unticked, neither the note nor its consent field is sent.
        const noteTagList = formState.noteConsent
          ? noteTags(getNoteForSignup(), readCtaSource)
          : [];

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
            // The join notice replaced the emails box (F5, G1): the route's contract stays `true`.
            gdprAccepted: true,
            // The route treats a missing and a null code alike; the shared shape takes undefined.
            referredBy: referredBy ?? undefined,
            ...(source ? { source } : {}),
            ...(noteTagList.length > 0 ? { tags: noteTagList } : {}),
            ...(formState.noteConsent
              ? {
                  attributionConsent: {
                    text: noteText,
                    version: SIGNUP_NOTE_BOX_VERSIONS[noteText],
                  },
                }
              : {}),
          } satisfies WaitlistSignupBody),
          signal: abortControllerRef.current.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          // A refused request leaves a trace with a bounded code (`5.996`, `5.991`; ATTR-2).
          analyticsService.track({
            name: WAITING_LIST_EVENTS.SUBMISSION_FAILURE,
            parameters: {
              errorCode: toSignupFailureCode(data?.errorCode),
              status: response.status,
              locale,
              timestamp: Date.now(),
            },
          });
          // Handle specific error codes
          if (data.errorCode === 'ALREADY_REGISTERED') {
            if (readCtaSource) clearCtaSource();
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

        // The label under analytics consent only (W-D1, MKT-EVENT-2); the campaign values are
        // added by the service's own consented enrichment.
        const consentedLabel = readCtaSource ? getConsentedCtaLabel() : null;
        // Cleared whether or not it was sent: a label must not attach to a later signup in the tab.
        if (readCtaSource) clearCtaSource();

        analyticsService.track({
          name: WAITING_LIST_EVENTS.SUBMISSION_SUCCESS,
          parameters: {
            position: data.position,
            hasReferral: !!referredBy,
            locale,
            timestamp: Date.now(),
            ...(consentedLabel ? { cta_source: consentedLabel } : {}),
          },
        });

        // Clear social proof cache so counter updates on next render/refresh
        try {
          sessionStorage.removeItem('diboas-waitlist-stats');
          if (source) sessionStorage.removeItem(`diboas-waitlist-stats-${source}`);
        } catch {
          /* SSR or unavailable */
        }

        // Call success callback
        onSuccess({
          position: data.position,
          referralCode: data.referralCode,
          referralUrl: data.referralUrl,
          tier: data.tier,
        });
      } catch (error) {
        if (!mountedRef.current) return;
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
          domain: 'waitlist',
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
    },
    [formState, noteText, referredByOverride, source, readCtaSource, locale, t, onSuccess, onError]
  );

  return {
    formState,
    error,
    isLoading,
    hasReferral,
    handleInputChange,
    handleSubmit,
  };
}
