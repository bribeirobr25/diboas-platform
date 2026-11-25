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
 *
 * **Withdrawal really stops GA4** (W-D1, spec §3.7, WITHDRAW-1), in this order: consent denied
 * first; then `window['ga-disable-<ID>'] = true`; then, inside a try/catch (a cookie write can
 * throw and must never undo the denial), every `_ga` / `_ga_*` / `_gid` cookie read from
 * `document.cookie` is expired on `path=/`, once without a domain and once on every parent
 * domain of `location.hostname` (never a literal): GA sets them on the highest domain it can, which
 * on a multi-part suffix (`co.uk`, `vercel.app`) is not the last two labels; a write on a public
 * suffix is ignored by the browser (W-D1 audit). Consent clears the flag. Withdrawal reaches
 * this tab; other open tabs stop at their next load (stated).
 */
import { COOKIE_CONFIG } from '@/config/env';

export interface Ga4ConsentBootstrapOptions {
  /** The banner's local-storage key (default `COOKIE_CONFIG.consentLocalStorageKey`). */
  storageKey?: string;
  /** The banner's current version (default `COOKIE_CONFIG.consentVersion`). */
  version?: string;
  /** The GA4 measurement id, for the `ga-disable-<ID>` flag. */
  measurementId: string;
}

/** The inline script's source. The window listener is never removed: it lives with the page. */
export function buildGa4ConsentBootstrap(options: Ga4ConsentBootstrapOptions): string {
  const key = JSON.stringify(options.storageKey ?? COOKIE_CONFIG.consentLocalStorageKey);
  const version = JSON.stringify(options.version ?? COOKIE_CONFIG.consentVersion);
  const flag = JSON.stringify(`ga-disable-${options.measurementId}`);
  return [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){dataLayer.push(arguments);}',
    "gtag('consent', 'default', { 'analytics_storage': 'denied', 'ad_storage': 'denied', 'wait_for_update': 500 });",
    `try { var consent = JSON.parse(localStorage.getItem(${key}) || '{}'); if (consent.analytics === true && consent.version === ${version}) { gtag('consent', 'update', { 'analytics_storage': 'granted' }); } } catch (e) {}`,
    `function withdrawGa4() { gtag('consent', 'update', { 'analytics_storage': 'denied' }); window[${flag}] = true; try { var host = location.hostname; var parts = host.split('.'); var domains = []; if (!/^[0-9.]+$/.test(host)) { for (var i = parts.length - 2; i >= 0; i--) { domains.push('.' + parts.slice(i).join('.')); } } var expire = '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'; document.cookie.split(';').forEach(function (pair) { var name = pair.split('=')[0].trim(); if (/^_ga(_|$)/.test(name) || name === '_gid') { document.cookie = name + expire; domains.forEach(function (d) { document.cookie = name + expire + '; domain=' + d; }); } }); } catch (e) {} }`,
    `window.addEventListener('cookie-consent-changed', function (e) { if (e.detail && e.detail.analytics) { window[${flag}] = false; gtag('consent', 'update', { 'analytics_storage': 'granted' }); } else { withdrawGa4(); } });`,
  ].join('\n');
}
