'use client';

import { useEffect } from 'react';
import { setReferralStorage, isValidReferralCode } from '@/lib/waitingList/helpers';
import { REFERRAL_CONFIG } from '@/lib/waitingList/constants';

/**
 * Captures ?ref= parameter from URL on first page load and persists
 * it in sessionStorage so the referral survives cross-page navigation.
 *
 * Rendered in both (landing) and (marketing) layouts — no UI output.
 */
export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');

    if (ref && isValidReferralCode(ref, REFERRAL_CONFIG.codePrefix)) {
      setReferralStorage(REFERRAL_CONFIG.referralCookieName, ref.toUpperCase());
    }
  }, []);

  return null;
}
