/**
 * ATTR-1 · which button sent a person to the waitlist, recorded honestly (market clean-up W-C,
 * rewritten by W-D1: registers 5.923, 5.924; spec §3.1).
 *
 *   * Every button holds its label in MEMORY only (the attribution hold), with no consent check:
 *     the signup form's note box decides whether it is ever stored. Nothing is written to the
 *     device, under any consent.
 *   * An unknown label is never held (the server drops it too, `sanitizeTags`).
 *   * The analytics reader sees the label only under analytics consent; withdrawal does not
 *     clear the hold.
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
  clearCtaSource,
  getConsentedCtaLabel,
  getNoteForSignup,
  setCtaSource,
} from '../utmAttribution';
import { CTA_SOURCES, TOOL_CTA_SLUGS, type CtaSource } from '../ctaSources';
import { LESSONS } from '@/lib/learn/registry';
import { MarketCtaBand } from '@/components/Market/MarketCtaBand/MarketCtaBand';
import { ResultMoment } from '@/components/Sections/ResultMoment';

const HOLD = Symbol.for('diboas.attributionHold');
const heldLabel = () => getNoteForSignup().ctaLabel;

/** Every storage write the page makes. */
const writes: string[] = [];
beforeEach(() => {
  delete (globalThis as Record<symbol, unknown>)[HOLD];
  consent.given = false;
  writes.length = 0;
  for (const store of [Storage.prototype]) {
    vi.spyOn(store, 'setItem').mockImplementation(function (this: Storage, key: string) {
      writes.push(key);
    });
  }
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ATTR-1: the signup-source label', () => {
  it('should hold any known label in memory, with or without consent, and store nothing', () => {
    setCtaSource('market');
    expect(heldLabel()).toBe('market');
    consent.given = true;
    setCtaSource('learn-compound-interest');
    expect(heldLabel()).toBe('learn-compound-interest');
    expect(writes).toEqual([]);
    expect(document.cookie).toBe('');
  });

  it('should never hold an unknown or free-text label', () => {
    setCtaSource('ana@example.com' as CtaSource);
    expect(heldLabel()).toBeNull();
    setCtaSource('tool-idle-cash');
    setCtaSource('nope' as CtaSource);
    expect(heldLabel()).toBe('tool-idle-cash');
  });

  it('should give the analytics reader the label only under consent, and keep it on withdrawal', () => {
    setCtaSource('market');
    expect(getConsentedCtaLabel()).toBeNull();
    consent.given = true;
    expect(getConsentedCtaLabel()).toBe('market');
    consent.given = false;
    expect(getConsentedCtaLabel()).toBeNull();
    expect(heldLabel()).toBe('market');
  });

  it('should forget the label when cleared (after a successful signup)', () => {
    setCtaSource('learn-ten-percent');
    clearCtaSource();
    expect(heldLabel()).toBeNull();
    clearCtaSource();
    expect(heldLabel()).toBeNull();
  });

  it('should list every lesson and tool label, each short enough to be stored as a tag', () => {
    for (const id of Object.keys(LESSONS))
      expect(CTA_SOURCES.has(`learn-${id}` as never)).toBe(true);
    for (const slug of TOOL_CTA_SLUGS) expect(CTA_SOURCES.has(`tool-${slug}`)).toBe(true);
    for (const label of CTA_SOURCES) expect(`cta_source:${label}`.length).toBeLessThanOrEqual(50);
  });

  it('should list no label that no button writes', () => {
    const written = new Set<string>([
      'market',
      ...TOOL_CTA_SLUGS.map((slug) => `tool-${slug}`),
      ...Object.keys(LESSONS).map((id) => `learn-${id}`),
    ]);
    for (const label of CTA_SOURCES) expect(written.has(label)).toBe(true);
  });

  it('should hold "market" when the market band link is clicked, with no ?source= on the link', () => {
    const { container } = render(
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
    const a = [...container.querySelectorAll('a')].find(
      (el) => el.textContent === 'Join the waitlist'
    )!;
    expect(a.getAttribute('href')).not.toMatch(/\?source=/);
    fireEvent.click(a);
    expect(heldLabel()).toBe('market');
    expect(writes).toEqual([]);
  });

  it('should hold the tool label when a result CTA is clicked', () => {
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
    expect(heldLabel()).toBe('tool-card-fees');
    expect(writes).toEqual([]);
  });
});
