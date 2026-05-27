'use client';

/**
 * GoogleAnalyticsLoader
 *
 * Defers the GA4 script (`gtag/js`) until the user grants analytics consent.
 *
 * The Consent Mode v2 bootstrap in `apps/web/src/app/layout.tsx` is the contract
 * with Google: it sets `analytics_storage: 'denied'` by default and listens to
 * the `cookie-consent-changed` DOM event to update consent. That listener is
 * the *one* pre-hydration React-unaware consumer in the codebase and stays
 * exactly as-is — see `consentUtils.ts -> dispatchConsentEvent` docstring.
 *
 * This component handles the *script loading* gate: the ~67 KB `gtag/js`
 * bundle does not download until consent is granted. After consent:
 *  1. The Consent Mode v2 inline bootstrap flushes any buffered events
 *     (via `wait_for_update: 500`).
 *  2. This loader mounts the `<Script>` tags, and `gtag('config', …)` runs.
 *
 * Mirrors the verified PostHogProvider pattern — subscribes to
 * `applicationEventBus` `CONSENT_GIVEN`, NOT the DOM event.
 *
 * Withdrawal path: no teardown needed here. Consent Mode v2 handles the
 * data-send gate (the inline bootstrap in `layout.tsx` calls
 * `gtag('consent', 'update', {analytics_storage: 'denied'})` on the
 * withdrawal branch of its DOM-event listener). The script itself stays
 * loaded after first-grant; this matches PostHog's pattern.
 *
 * Plan reference: docs/audit/LIGHTHOUSE_REMEDIATION_PLAN_2026-05-22.md
 * Workstream D.1 (merges old A.4 + D per CTO Board v1.1 review item #5).
 */

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { hasAnalyticsConsent } from '@/components/CookieConsent';
import {
  applicationEventBus,
  ApplicationEventType,
  type ConsentEventPayload,
} from '@/lib/events/ApplicationEventBus';

interface GoogleAnalyticsLoaderProps {
  measurementId: string;
  /** CSP nonce from middleware (`x-nonce` header). Undefined when middleware
      did not set a nonce (edge dev-mode fallback); script tags still render
      but without a nonce attribute — matches the prior inline-Script behaviour. */
  nonce?: string;
}

export function GoogleAnalyticsLoader({ measurementId, nonce }: GoogleAnalyticsLoaderProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    // Honor existing consent on cold start (user already accepted on prior visit).
    // hasAnalyticsConsent() is SSR-safe (returns false when typeof window === 'undefined');
    // calling it in useEffect (not useState init) prevents hydration mismatch on the
    // first client render. The lint warning below is the CLAUDE.md-documented escape
    // hatch for SSR-safe localStorage reads that must defer setState until mount.
    if (hasAnalyticsConsent()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShouldLoad(true);
      return;
    }

    // Subscribe to runtime consent grants via ApplicationEventBus.
    // NOT the `cookie-consent-changed` DOM event — that channel exists for
    // the pre-hydration GA4 inline bootstrap only; React consumers use the
    // bus per `consentUtils.ts` docstring and the PostHogProvider precedent.
    const unsub = applicationEventBus.on<ConsentEventPayload>(
      ApplicationEventType.CONSENT_GIVEN,
      (payload) => {
        // Accept 'analytics' or 'all'; explicitly reject 'marketing' alone.
        // Filter on type, not on current dispatchConsentEvent emit behaviour —
        // future marketing-consent feature must not silently activate analytics.
        if (payload.consentType === 'analytics' || payload.consentType === 'all') {
          setShouldLoad(true);
        }
      }
    );

    return unsub;
  }, []);

  if (!shouldLoad) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
        nonce={nonce}
      />
      <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
        {`gtag('js', new Date()); gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}
