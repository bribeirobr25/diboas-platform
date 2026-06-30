import { describe, it, expect } from 'vitest';
import { makeEuLandingConfig, EU_SHARED_ANCHORS, type EuLocale } from '../landing-b2c-eu';

/**
 * Phase B regression oracle (audit B-5).
 *
 * Freezes the exact analytics ids and scroll anchors the live en/de/es landing
 * shipped with (captured from the pre-refactor LandingEn/De/Es compositions),
 * independent of the EU_VARIANTS source. Any drift here is an analytics-id or
 * anchor regression — it must fail CI, not reach production. Traps it guards:
 *  - B-1: `how-it-works-{loc}` has NO `-section-` infix (unlike the other five).
 *  - B-2: the `founder` anchor is shared (`#founder`) while its section-id is
 *         locale-suffixed; the other anchors are translated per locale.
 *  - hero CTA target stays in lockstep with the per-locale howItWorks anchor.
 */
const EXPECTED = {
  en: {
    ids: {
      tension: 'tension-section-en',
      sidePocket: 'sidepocket-section-en',
      neverHold: 'neverhold-section-en',
      upside: 'upside-section-en',
      pictureFuture: 'picture-future-section-en',
      howItWorks: 'how-it-works-en',
      catch: 'catch-section-en',
      founder: 'founder-section-en',
    },
    anchors: {
      tension: 'what-is-this-for',
      sidePocket: 'a-place-of-its-own',
      neverHold: 'we-never-hold',
      upside: 'the-upside',
      pictureFuture: 'picture',
      howItWorks: 'how-it-works',
      catch: 'the-catch',
    },
    heroCtaHref: '#how-it-works',
    pictureCta: ['compound-interest', 'idle-cash', 'demo'],
  },
  de: {
    ids: {
      tension: 'tension-section-de',
      sidePocket: 'sidepocket-section-de',
      neverHold: 'neverhold-section-de',
      upside: 'upside-section-de',
      pictureFuture: 'picture-future-section-de',
      howItWorks: 'how-it-works-de',
      catch: 'catch-section-de',
      founder: 'founder-section-de',
    },
    anchors: {
      tension: 'wofuer-dieses-geld',
      sidePocket: 'ein-eigener-platz',
      neverHold: 'wir-halten-nie',
      upside: 'der-gewinn',
      pictureFuture: 'stell-dir-vor',
      howItWorks: 'so-funktioniert',
      catch: 'haken',
    },
    heroCtaHref: '#so-funktioniert',
    pictureCta: ['inflation-impact', 'compound-interest', 'demo'],
  },
  es: {
    ids: {
      tension: 'tension-section-es',
      sidePocket: 'sidepocket-section-es',
      neverHold: 'neverhold-section-es',
      upside: 'upside-section-es',
      pictureFuture: 'picture-future-section-es',
      howItWorks: 'how-it-works-es',
      catch: 'catch-section-es',
      founder: 'founder-section-es',
    },
    anchors: {
      tension: 'para-que-este-dinero',
      sidePocket: 'un-lugar-propio',
      neverHold: 'nunca-guardamos',
      upside: 'el-rendimiento',
      pictureFuture: 'imagina',
      howItWorks: 'como-funciona',
      catch: 'la-trampa',
    },
    heroCtaHref: '#como-funciona',
    pictureCta: ['inflation-impact', 'compound-interest', 'demo'],
  },
} as const;

const LOCALES: EuLocale[] = ['en', 'de', 'es'];

describe('EU landing config — id/anchor preservation (Phase B)', () => {
  it.each(LOCALES)('%s: section-ids match the frozen inventory', (locale) => {
    const cfg = makeEuLandingConfig(locale);
    const exp = EXPECTED[locale];

    // Locale-suffixed section-ids (single source of truth used by the spine JSX).
    expect(cfg.ids).toEqual(exp.ids);
    // Each ProseSection's analytics.sectionId must equal the spine id.
    expect(cfg.neverHold.analytics?.sectionId).toBe(exp.ids.neverHold);
    expect(cfg.upside.analytics?.sectionId).toBe(exp.ids.upside);
    expect(cfg.pictureFuture.analytics?.sectionId).toBe(exp.ids.pictureFuture);
    expect(cfg.howItWorks.analytics?.sectionId).toBe(exp.ids.howItWorks);
    expect(cfg.catch.analytics?.sectionId).toBe(exp.ids.catch);
    expect(cfg.founder.analytics?.sectionId).toBe(exp.ids.founder);
    // Shared, non-locale ids.
    expect(cfg.hero.cinematic?.sectionId).toBe('hero-b2c');
    expect(cfg.demo.analytics.sectionId).toBe('demo-section-b2c');
    expect(cfg.waitlist.sectionId).toBe('waitlist-section-b2c');
    // B-1: how-it-works carries no `-section-` infix.
    expect(exp.ids.howItWorks).toBe(`how-it-works-${locale}`);
    expect(exp.ids.howItWorks).not.toContain('-section-');
  });

  it.each(LOCALES)('%s: anchors match (translated + shared founder)', (locale) => {
    const cfg = makeEuLandingConfig(locale);
    expect(cfg.anchors).toEqual(EXPECTED[locale].anchors);
  });

  it('B-2: the founder anchor is shared `#founder` across all locales', () => {
    expect(EU_SHARED_ANCHORS.founder).toBe('founder');
  });

  it.each(LOCALES)('%s: hero CTA targets the howItWorks anchor', (locale) => {
    const cfg = makeEuLandingConfig(locale);
    expect(cfg.hero.content.ctaHref).toBe(EXPECTED[locale].heroCtaHref);
    expect(cfg.hero.content.ctaHref).toBe(`#${EXPECTED[locale].anchors.howItWorks}`);
  });

  it.each(LOCALES)('%s: pictureFuture rotating CTA set', (locale) => {
    const cfg = makeEuLandingConfig(locale);
    expect(cfg.pictureFuture.cta?.map((c) => c.id)).toEqual(EXPECTED[locale].pictureCta);
  });

  it.each(LOCALES)('%s: full ordered 13-id inventory is unique and complete', (locale) => {
    const cfg = makeEuLandingConfig(locale);
    const ordered = [
      'hero-section-b2c',
      'wedge-section-b2c',
      cfg.ids.neverHold,
      cfg.ids.upside,
      cfg.ids.pictureFuture,
      cfg.ids.howItWorks,
      cfg.ids.catch,
      'demo-section-b2c',
      'fees-section-b2c',
      'comparison-section-b2c',
      cfg.ids.founder,
      'waitlist-section-b2c',
      'faq-section-b2c',
    ];
    expect(ordered).toHaveLength(13);
    expect(new Set(ordered).size).toBe(13);
  });
});
