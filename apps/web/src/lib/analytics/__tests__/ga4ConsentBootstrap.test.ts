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

type FakeWindow = EventTarget & {
  dataLayer?: IArguments[];
  gtag?: unknown;
  [flag: string]: unknown;
};
let win: FakeWindow;
const ID = 'G-TEST1';
const FLAG = `ga-disable-${ID}`;
const build = (extra: { storageKey?: string; version?: string } = {}) =>
  buildGa4ConsentBootstrap({ measurementId: ID, ...extra });

/** A page's cookie jar seen through the `document.cookie` setter (happy-dom merges domain and
 * host-only cookies a browser keeps apart, so the exact writes are what is asserted). */
let cookieWrites: string[];
let jar: string;
let cookieThrows: boolean;
const fakeDocument = {
  get cookie() {
    return jar;
  },
  set cookie(value: string) {
    if (cookieThrows) throw new Error('blocked');
    cookieWrites.push(value);
  },
};

/**
 * Runs the script as an inline script runs, against a fresh window per case (a real page's
 * listener lives as long as the page, so each case gets its own page). Its bare `dataLayer` and
 * `gtag` are the window's, as they are in a browser.
 */
function run(source = build(), hostname = 'diboas.com') {
  win = new EventTarget() as FakeWindow;
  const patched = source.replace(
    'function gtag(){dataLayer.push(arguments);}',
    'window.gtag = function gtag(){window.dataLayer.push(arguments);}; var gtag = window.gtag;'
  );
  runInNewContext(patched, {
    window: win,
    localStorage: window.localStorage,
    document: fakeDocument,
    location: { hostname },
  });
  return calls();
}
const calls = () => (win.dataLayer ?? []).map((args) => Array.from(args));

describe('buildGa4ConsentBootstrap', () => {
  beforeEach(() => {
    window.localStorage.clear();
    cookieWrites = [];
    jar = '';
    cookieThrows = false;
  });
  afterEach(() => window.localStorage.clear());

  it('should read the key and version from COOKIE_CONFIG, quoted', () => {
    const source = build();
    expect(source).toContain(`localStorage.getItem(${JSON.stringify(KEY)})`);
    expect(source).toContain(`consent.version === ${JSON.stringify(COOKIE_CONFIG.consentVersion)}`);
    expect(build({ storageKey: 'k"x', version: '2.0' })).toContain('localStorage.getItem("k\\"x")');
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
    expect(build()).toContain('function gtag(){dataLayer.push(arguments);}');
  });

  it('should withdraw in order: deny, set the flag, then expire every GA cookie on both scopes', () => {
    jar = '_ga=GA1.1.1; _ga_ABC123=GS1.1; _gid=GA1.1.2; diboas-cookie-consent=x; _gat=1';
    run();
    win.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { analytics: false } }));
    expect(calls().at(-1)).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    expect(win[FLAG]).toBe(true);
    const expire = '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    expect(cookieWrites).toEqual([
      `_ga${expire}`,
      `_ga${expire}; domain=.diboas.com`,
      `_ga_ABC123${expire}`,
      `_ga_ABC123${expire}; domain=.diboas.com`,
      `_gid${expire}`,
      `_gid${expire}; domain=.diboas.com`,
    ]);
  });

  it('should expire on every parent domain of the host, and on none for an IP or a bare host', () => {
    jar = '_ga=1';
    run(build(), 'www.diboas.com');
    win.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { analytics: false } }));
    expect(cookieWrites.map((w) => /domain=(.*)$/.exec(w)?.[1] ?? null)).toEqual([
      null,
      '.diboas.com',
      '.www.diboas.com',
    ]);
    // a multi-part suffix: GA's cookie sits on the project's own domain, not on `.vercel.app`
    cookieWrites = [];
    run(build(), 'diboas-git-x.vercel.app');
    win.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { analytics: false } }));
    expect(cookieWrites.some((w) => w.endsWith('; domain=.diboas-git-x.vercel.app'))).toBe(true);
    for (const host of ['localhost', '127.0.0.1']) {
      cookieWrites = [];
      run(build(), host);
      win.dispatchEvent(
        new CustomEvent('cookie-consent-changed', { detail: { analytics: false } })
      );
      expect(cookieWrites).toHaveLength(1);
    }
  });

  it('should keep the denial and the flag when a cookie write throws', () => {
    jar = '_ga=1';
    cookieThrows = true;
    run();
    expect(() =>
      win.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { analytics: false } }))
    ).not.toThrow();
    expect(calls().at(-1)).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    expect(win[FLAG]).toBe(true);
  });

  it('should clear the flag when consent is given again', () => {
    run();
    win.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { analytics: false } }));
    win.dispatchEvent(new CustomEvent('cookie-consent-changed', { detail: { analytics: true } }));
    expect(win[FLAG]).toBe(false);
  });

  it('should quote the measurement id into the flag name', () => {
    expect(buildGa4ConsentBootstrap({ measurementId: "G-1'];alert(1);//" })).toContain(
      JSON.stringify("ga-disable-G-1'];alert(1);//")
    );
  });
});
