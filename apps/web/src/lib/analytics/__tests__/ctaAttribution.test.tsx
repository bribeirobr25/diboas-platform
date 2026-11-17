/**
 * ATTR-1 · which button sent a person to the waitlist, recorded honestly (market clean-up W-C;
 * founder decisions DR-2026-11-11-market-cleanup-decisions item 6 and -c2-decisions C, H).
 *
 *   * The market band and the four tool results store their label only after analytics
 *     consent; the Learn and demo-launcher writer stays ungated (decision C: nothing changes
 *     for existing callers; the pre-consent question is register `5.923`).
 *   * A consent-gated label is not sent once consent is withdrawn; an unknown label is never
 *     sent (the server drops it too, `sanitizeTags`).
 *   * No waitlist link carries `?source=` (nothing ever read it).
 *
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

const consent = vi.hoisted(() => ({ given: false }));
vi.mock('@/components/CookieConsent/consentUtils', () => ({
  hasAnalyticsConsent: () => consent.given,
}));
vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('@/lib/analytics', () => ({ analyticsService: { track: vi.fn() } }));

import {
  clearConsentGatedCtaSource,
  clearCtaSource,
  peekCtaSource,
  setConsentedCtaSource,
  setCtaSource,
} from '../ctaAttribution';
import { CTA_SOURCES, TOOL_CTA_SLUGS } from '../ctaSources';
import { LESSONS } from '@/lib/learn/registry';
import { MarketCtaBand } from '@/components/Market/MarketCtaBand/MarketCtaBand';
import { ResultMoment } from '@/components/Sections/ResultMoment';

const KEY = 'diboas-cta-source';

beforeEach(() => {
  sessionStorage.clear();
  consent.given = false;
});
afterEach(() => cleanup());

describe('ATTR-1: the signup-source label', () => {
  it('should store a market or tool label only when analytics consent is given', () => {
    setConsentedCtaSource('market');
    expect(sessionStorage.getItem(KEY)).toBeNull();
    consent.given = true;
    setConsentedCtaSource('tool-idle-cash');
    expect(sessionStorage.getItem(KEY)).toBe('tool-idle-cash');
  });

  it('should keep the Learn and demo-launcher writer ungated when there is no consent', () => {
    setCtaSource('learn-compound-interest');
    expect(sessionStorage.getItem(KEY)).toBe('learn-compound-interest');
    expect(peekCtaSource()).toBe('learn-compound-interest');
  });

  it('should not send a consent-gated label once consent is withdrawn', () => {
    consent.given = true;
    setConsentedCtaSource('market');
    expect(peekCtaSource()).toBe('market');
    consent.given = false;
    expect(peekCtaSource()).toBeNull();
  });

  it('should never send an unknown or free-text label (and drop it), while peek keeps a usable one', () => {
    sessionStorage.setItem(KEY, 'ana@example.com');
    expect(peekCtaSource()).toBeNull();
    expect(sessionStorage.getItem(KEY)).toBeNull();
    setCtaSource('demo-launcher');
    expect(peekCtaSource()).toBe('demo-launcher');
    expect(peekCtaSource()).toBe('demo-launcher');
    clearCtaSource();
    expect(peekCtaSource()).toBeNull();
  });

  it('should list every lesson and tool label, each short enough to be stored as a tag', () => {
    for (const id of Object.keys(LESSONS))
      expect(CTA_SOURCES.has(`learn-${id}` as never)).toBe(true);
    for (const slug of TOOL_CTA_SLUGS) expect(CTA_SOURCES.has(`tool-${slug}`)).toBe(true);
    for (const label of CTA_SOURCES) expect(`cta_source:${label}`.length).toBeLessThanOrEqual(50);
  });

  it('should store "market" when the market band link is clicked with consent, and nothing without', () => {
    const band = (
      <MarketCtaBand
        locale="en"
        cadence="c"
        headline="h"
        body="b"
        waitlistLabel="Join the waitlist"
        shareLabel="s"
        shareCopied="sc"
        shareUrl="https://example.test"
        shareText="t"
        shareTitle="tt"
      />
    );
    const link = (c: HTMLElement) =>
      [...c.querySelectorAll('a')].find((a) => a.textContent === 'Join the waitlist')!;
    const first = render(band);
    fireEvent.click(link(first.container));
    expect(sessionStorage.getItem(KEY)).toBeNull();
    cleanup();
    consent.given = true;
    const second = render(band);
    const a = link(second.container);
    expect(a.getAttribute('href')).not.toMatch(/\?source=/);
    fireEvent.click(a);
    expect(sessionStorage.getItem(KEY)).toBe('market');
  });

  it.each(TOOL_CTA_SLUGS)(
    'should neither send nor keep the tool-%s label once consent is withdrawn',
    (slug) => {
      consent.given = true;
      setConsentedCtaSource(`tool-${slug}`);
      consent.given = false;
      expect(peekCtaSource()).toBeNull();
      expect(sessionStorage.getItem(KEY)).toBeNull();
    }
  );

  it('should clear an older label when a gated button is clicked without consent (last touch wins)', () => {
    setCtaSource('learn-compound-interest');
    setConsentedCtaSource('market');
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('should clear only a consent-gated label when consent is withdrawn', () => {
    consent.given = true;
    setConsentedCtaSource('tool-idle-cash');
    clearConsentGatedCtaSource();
    expect(sessionStorage.getItem(KEY)).toBeNull();
    setCtaSource('learn-ten-percent');
    clearConsentGatedCtaSource();
    expect(sessionStorage.getItem(KEY)).toBe('learn-ten-percent');
  });

  it('should store nothing when a result CTA is clicked without consent', () => {
    const { container } = render(
      <ResultMoment
        eyebrow="e"
        headlineValue={1}
        headlineFormatter={String}
        headlineCaption="c"
        cta={{ headline: 'h', label: 'Join', href: '/#waitlist', toolSlug: 'card-fees' }}
      />
    );
    fireEvent.click([...container.querySelectorAll('a')].find((a) => a.textContent === 'Join')!);
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('should store the tool label when a result CTA is clicked with consent', () => {
    consent.given = true;
    const { container } = render(
      <ResultMoment
        eyebrow="e"
        headlineValue={1}
        headlineFormatter={String}
        headlineCaption="c"
        cta={{ headline: 'h', label: 'Join', href: '/#waitlist', toolSlug: 'card-fees' }}
      />
    );
    fireEvent.click([...container.querySelectorAll('a')].find((a) => a.textContent === 'Join')!);
    expect(sessionStorage.getItem(KEY)).toBe('tool-card-fees');
  });
});
