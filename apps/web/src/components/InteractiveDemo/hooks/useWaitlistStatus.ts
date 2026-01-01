/**
 * useWaitlistStatus Hook
 *
 * Checks if the user is on the waitlist by looking at localStorage
 * and optionally verifying with the API.
 *
 * Storage keys used (from lib/waitingList/constants.ts):
 * - diboas_waitlist_email
 * - diboas_waitlist_position
 * - diboas_waitlist_referral_code
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { POSITION_STORAGE_KEYS } from '@/lib/waitingList/constants';
import type { WaitlistUserStatus } from '../types';

/**
 * Hook options
 */
interface UseWaitlistStatusOptions {
  /** Whether to verify status with API (default: false for performance) */
  verifyWithApi?: boolean;
}

/**
 * Check if user is on the waitlist
 *
 * @param options - Hook options
 * @returns Waitlist user status and refresh function
 */
export function useWaitlistStatus(options: UseWaitlistStatusOptions = {}) {
  const { verifyWithApi = false } = options;

  const [status, setStatus] = useState<WaitlistUserStatus>({
    isOnWaitlist: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check localStorage for waitlist data
   */
  const checkLocalStorage = useCallback((): WaitlistUserStatus => {
    if (typeof window === 'undefined') {
      return { isOnWaitlist: false };
    }

    try {
      const email = localStorage.getItem(POSITION_STORAGE_KEYS.email);
      const position = localStorage.getItem(POSITION_STORAGE_KEYS.position);
      const referralCode = localStorage.getItem(POSITION_STORAGE_KEYS.referralCode);

      if (email) {
        return {
          isOnWaitlist: true,
          email,
          position: position ? parseInt(position, 10) : undefined,
          referralCode: referralCode || undefined,
        };
      }
    } catch (error) {
      console.warn('[useWaitlistStatus] Failed to read localStorage:', error);
    }

    return { isOnWaitlist: false };
  }, []);

  /**
   * Verify status with API
   */
  const verifyWithApiCall = useCallback(async (email: string): Promise<WaitlistUserStatus> => {
    try {
      const response = await fetch(`/api/waitlist/signup?email=${encodeURIComponent(email)}`);

      if (response.ok) {
        const data = await response.json();

        if (data.exists) {
          // Update localStorage with latest data
          localStorage.setItem(POSITION_STORAGE_KEYS.position, String(data.position));
          localStorage.setItem(POSITION_STORAGE_KEYS.referralCode, data.referralCode);

          return {
            isOnWaitlist: true,
            email,
            position: data.position,
            referralCode: data.referralCode,
          };
        }
      }
    } catch (error) {
      console.warn('[useWaitlistStatus] API verification failed:', error);
    }

    return { isOnWaitlist: false };
  }, []);

  /**
   * Refresh status
   */
  const refresh = useCallback(async () => {
    setIsLoading(true);

    // First check localStorage
    const localStatus = checkLocalStorage();

    if (localStatus.isOnWaitlist && verifyWithApi && localStatus.email) {
      // Verify with API if requested
      const apiStatus = await verifyWithApiCall(localStatus.email);
      setStatus(apiStatus);
    } else {
      setStatus(localStatus);
    }

    setIsLoading(false);
  }, [checkLocalStorage, verifyWithApi, verifyWithApiCall]);

  /**
   * Save status to localStorage (called after successful signup)
   */
  const saveStatus = useCallback((data: {
    email: string;
    position: number;
    referralCode: string;
  }) => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(POSITION_STORAGE_KEYS.email, data.email);
      localStorage.setItem(POSITION_STORAGE_KEYS.position, String(data.position));
      localStorage.setItem(POSITION_STORAGE_KEYS.referralCode, data.referralCode);

      setStatus({
        isOnWaitlist: true,
        email: data.email,
        position: data.position,
        referralCode: data.referralCode,
      });
    } catch (error) {
      console.warn('[useWaitlistStatus] Failed to save to localStorage:', error);
    }
  }, []);

  /**
   * Clear status (for logout/reset)
   */
  const clearStatus = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(POSITION_STORAGE_KEYS.email);
      localStorage.removeItem(POSITION_STORAGE_KEYS.position);
      localStorage.removeItem(POSITION_STORAGE_KEYS.referralCode);

      setStatus({ isOnWaitlist: false });
    } catch (error) {
      console.warn('[useWaitlistStatus] Failed to clear localStorage:', error);
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    ...status,
    isLoading,
    refresh,
    saveStatus,
    clearStatus,
  };
}

export default useWaitlistStatus;
