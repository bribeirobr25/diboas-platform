/**
 * GA4's Consent Mode bootstrap, the inline script the root layout renders before React loads
 * (market clean-up W-D1, spec §3.7, §3.9).
 *
 * It sets every Google consent to denied by default, grants analytics when a CURRENT-version
 * accept is already stored, and follows the `cookie-consent-changed` window event the banner
 * fires (`consentUtils.dispatchConsentEvent`) for as long as the page is open. Before W-D1 the
 * layout hard-coded the storage key and `'1.0'`; both now come from `COOKIE_CONFIG` through
 * `JSON.stringify`, so a version bump or a different storage prefix cannot leave GA4 reading a
 * stale choice. A builder (not a string in the layout) so `ga4ConsentBootstrap.test.ts` can run it.
 */
import { COOKIE_CONFIG } from '@/config/env';

export interface Ga4ConsentBootstrapOptions {
  /** The banner's local-storage key (default `COOKIE_CONFIG.consentLocalStorageKey`). */
  storageKey?: string;
  /** The banner's current version (default `COOKIE_CONFIG.consentVersion`). */
  version?: string;
}

/** The inline script's source. The window listener is never removed: it lives with the page. */
export function buildGa4ConsentBootstrap(options: Ga4ConsentBootstrapOptions = {}): string {
  const key = JSON.stringify(options.storageKey ?? COOKIE_CONFIG.consentLocalStorageKey);
  const version = JSON.stringify(options.version ?? COOKIE_CONFIG.consentVersion);
  return [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('consent', 'default', { 'analytics_storage': 'denied', 'ad_storage': 'denied', 'wait_for_update': 500 });",
    `try { var consent = JSON.parse(localStorage.getItem(${key}) || '{}'); if (consent.analytics === true && consent.version === ${version}) { gtag('consent', 'update', { 'analytics_storage': 'granted' }); } } catch (e) {}`,
    "window.addEventListener('cookie-consent-changed', function (e) { if (e.detail && e.detail.analytics) { gtag('consent', 'update', { 'analytics_storage': 'granted' }); } else { gtag('consent', 'update', { 'analytics_storage': 'denied' }); } });",
  ].join('\n');
}
