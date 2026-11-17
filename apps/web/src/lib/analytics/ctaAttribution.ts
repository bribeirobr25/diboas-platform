/**
 * CTA Attribution
 *
 * Remembers which button sent a person to the waitlist form, for the length of the tab
 * (sessionStorage, last touch wins). The waitlist hook reads it at submit and clears it only
 * once the signup succeeds or the address is already registered, so a failed attempt keeps it
 * for the retry. A middle-click or a new tab carries no label (accepted).
 *
 * Two writers: `setCtaSource` (Learn, demo launcher: written regardless of consent, as before)
 * and `setConsentedCtaSource` (the market band and the tool results: written only after
 * analytics consent, and dropped at submit if consent was withdrawn since).
 */
import { hasAnalyticsConsent } from '@/components/CookieConsent/consentUtils';
import {
  isConsentGatedCtaSource,
  isKnownCtaSource,
  type ConsentGatedCtaSource,
  type CtaSource,
} from './ctaSources';

const CTA_SOURCE_KEY = 'diboas-cta-source';

/** Store the label of the button that sent the person to #waitlist. */
export function setCtaSource(source: CtaSource): void {
  try {
    sessionStorage.setItem(CTA_SOURCE_KEY, source);
  } catch {
    // sessionStorage unavailable
  }
}

/**
 * Store a label only when analytics consent is given (decision C). Without consent the click is
 * still the last touch, so an older label (a Learn talk read earlier) is cleared rather than
 * left to claim this signup (2026-11-12 audit); clearing writes nothing.
 */
export function setConsentedCtaSource(source: ConsentGatedCtaSource): void {
  if (!hasAnalyticsConsent()) {
    clearCtaSource();
    return;
  }
  setCtaSource(source);
}

/**
 * The label to send with a signup, without clearing it: unknown labels are ignored, and a
 * consent-gated label is ignored once consent is gone.
 */
export function peekCtaSource(): CtaSource | null {
  try {
    const source = sessionStorage.getItem(CTA_SOURCE_KEY);
    if (!source) return null;
    if (!isKnownCtaSource(source) || (isConsentGatedCtaSource(source) && !hasAnalyticsConsent())) {
      // Never sent; never kept either (an unusable label must not outlive consent).
      sessionStorage.removeItem(CTA_SOURCE_KEY);
      return null;
    }
    return source;
  } catch {
    return null;
  }
}

/** Forget a consent-gated label when consent is withdrawn (the analytics service calls this). */
export function clearConsentGatedCtaSource(): void {
  try {
    const source = sessionStorage.getItem(CTA_SOURCE_KEY);
    if (source && isConsentGatedCtaSource(source)) sessionStorage.removeItem(CTA_SOURCE_KEY);
  } catch {
    // sessionStorage unavailable
  }
}

/** Forget the label (after a successful or already-registered signup). */
export function clearCtaSource(): void {
  try {
    sessionStorage.removeItem(CTA_SOURCE_KEY);
  } catch {
    // sessionStorage unavailable
  }
}
