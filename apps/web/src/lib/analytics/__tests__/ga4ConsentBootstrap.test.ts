/**
 * GA4's Consent Mode bootstrap (W-D1, spec §3.7, §3.9): the root layout's inline script, run here
 * as the browser runs it. Its storage key and version come from `COOKIE_CONFIG`, so a version bump
 * cannot leave GA4 granting on a stale choice.
 *
 * @vitest-environment happy-dom
 */
import { runInNewContext } from 'node:vm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { COOKIE_CONFIG } from '@/config/env';
import { buildGa4ConsentBootstrap } from '../ga4ConsentBootstrap';

const KEY = COOKIE_CONFIG.consentLocalStorageKey;

type FakeWindow = EventTarget & { dataLayer?: IArguments[]; gtag?: unknown };
let win: FakeWindow;

/**
 * Runs the script as an inline script runs, against a fresh window per case (a real page's
 * listener lives as long as the page, so each case gets its own page). Its bare `dataLayer` and
 * `gtag` are the window's, as they are in a browser.
 */
function run(source = buildGa4ConsentBootstrap()) {
  win = new EventTarget() as FakeWindow;
  const patched = source.replace(
    'function gtag(){dataLayer.push(arguments);}',
    'window.gtag = function gtag(){window.dataLayer.push(arguments);}; var gtag = window.gtag;'
  );
  runInNewContext(patched, { window: win, localStorage: window.localStorage });
  return calls();
}
const calls = () => (win.dataLayer ?? []).map((args) => Array.from(args));

describe('buildGa4ConsentBootstrap', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it('should read the key and version from COOKIE_CONFIG, quoted', () => {
    const source = buildGa4ConsentBootstrap();
    expect(source).toContain(`localStorage.getItem(${JSON.stringify(KEY)})`);
    expect(source).toContain(`consent.version === ${JSON.stringify(COOKIE_CONFIG.consentVersion)}`);
    expect(buildGa4ConsentBootstrap({ storageKey: 'k"x', version: '2.0' })).toContain(
      'localStorage.getItem("k\\"x")'
    );
  });

  it('should deny by default and grant nothing without a stored choice', () => {
    const calls = run();
    expect(calls[0]).toEqual([
      'consent',
      'default',
      { analytics_storage: 'denied', ad_storage: 'denied', wait_for_update: 500 },
    ]);
    expect(calls).toHaveLength(1);
  });

  it('should grant for a current-version accept only', () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ analytics: true, version: COOKIE_CONFIG.consentVersion })
    );
    expect(run()[1]).toEqual(['consent', 'update', { analytics_storage: 'granted' }]);
  });

  it('should not grant for an older accept, a decline or a broken value', () => {
    for (const value of [
      JSON.stringify({ analytics: true, version: '0.9' }),
      JSON.stringify({ analytics: false, version: COOKIE_CONFIG.consentVersion }),
      JSON.stringify({ analytics: 'yes', version: COOKIE_CONFIG.consentVersion }),
      '{not json',
    ]) {
      window.localStorage.setItem(KEY, value);
      expect(run()).toHaveLength(1);
    }
  });

  it("should follow the banner's window event both ways", () => {
    run();
    win.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { analytics: true } }));
    win.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { analytics: false } }));
    win.dispatchEvent(new CustomEvent('cookie-consent-changed'));
    expect(calls().slice(1)).toEqual([
      ['consent', 'update', { analytics_storage: 'granted' }],
      ['consent', 'update', { analytics_storage: 'denied' }],
      ['consent', 'update', { analytics_storage: 'denied' }],
    ]);
  });

  it('should keep its own gtag line exactly, so the harness above runs the real one', () => {
    expect(buildGa4ConsentBootstrap()).toContain('function gtag(){dataLayer.push(arguments);}');
  });
});
