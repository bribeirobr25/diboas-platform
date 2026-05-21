/**
 * Unit tests for `marketArticleSchema()` — iter-4 §3.4.
 *
 * Scope per CC1 round-1 + M7 round-2: helper-function unit tests for
 * function-output shape live here, in the standard `lib/<feature>/__tests__/`
 * convention. Source-data drift assertions (e.g., `regime.last_updated_at`
 * is ISO-8601-format-parseable) live in the iter-3 drift guard at
 * `apps/web/src/lib/analytics-sdk/__tests__/fixtures.test.ts`. Different
 * concerns, different files.
 */

import { describe, expect, it } from 'vitest';
import { marketArticleSchema } from '../structuredData';
import type { AnalyticsInitialData, RegimeData } from '@/lib/analytics-sdk/types';

const SITE_URL = 'https://diboas.com';
const DESCRIPTION = 'Calm macro intelligence for Bitcoin.';
const HEADLINE = 'Adelaide Daily';

const VALID_REGIME = {
  score: 10,
  max_score: 14 as const,
  regime_code: 'CONSTRUCTIVE',
  regime_label: 'Constructive',
  environment_bias: 'CONSTRUCTIVE',
  last_updated_at: '2026-05-15T12:00:00Z',
  summary: {
    short: 's',
    detailed: 'd',
    confidence_level: 'HIGH',
    mixed_signals: false,
    key_supportive_factors: [],
    key_headwinds: [],
  },
  signal_groups: [],
  data_status: {
    overall_confidence: 'HIGH',
    last_successful_update_at: null,
    sources: [],
    delayed_sources: [],
    unavailable_sources: [],
  },
} as unknown as RegimeData;

const buildArgs = (overrides: Partial<AnalyticsInitialData> = {}) =>
  ({
    data: { regime: VALID_REGIME, ...overrides },
    locale: 'en' as const,
    siteUrl: SITE_URL,
    description: DESCRIPTION,
    headline: HEADLINE,
  });

describe('marketArticleSchema — inLanguage (BCP-47 per locale)', () => {
  it('should emit inLanguage = en-US for en locale', () => {
    const result = marketArticleSchema({ ...buildArgs(), locale: 'en' });
    expect(result?.inLanguage).toBe('en-US');
  });

  it('should emit inLanguage = pt-BR for pt-BR locale', () => {
    const result = marketArticleSchema({ ...buildArgs(), locale: 'pt-BR' });
    expect(result?.inLanguage).toBe('pt-BR');
  });

  it('should emit inLanguage = es for es locale', () => {
    const result = marketArticleSchema({ ...buildArgs(), locale: 'es' });
    expect(result?.inLanguage).toBe('es');
  });

  it('should emit inLanguage = de for de locale', () => {
    const result = marketArticleSchema({ ...buildArgs(), locale: 'de' });
    expect(result?.inLanguage).toBe('de');
  });
});

describe('marketArticleSchema — null-regime fallback', () => {
  it('should return null when regime is null', () => {
    const result = marketArticleSchema({
      data: { regime: null },
      locale: 'en',
      siteUrl: SITE_URL,
      description: DESCRIPTION,
      headline: HEADLINE,
    });
    expect(result).toBeNull();
  });

  it('should return null when regime is missing entirely', () => {
    const result = marketArticleSchema({
      data: {},
      locale: 'en',
      siteUrl: SITE_URL,
      description: DESCRIPTION,
      headline: HEADLINE,
    });
    expect(result).toBeNull();
  });

  it('should return null when last_updated_at is not ISO-8601', () => {
    const malformed = { ...VALID_REGIME, last_updated_at: '01/15/2026' } as unknown as RegimeData;
    const result = marketArticleSchema({
      data: { regime: malformed },
      locale: 'en',
      siteUrl: SITE_URL,
      description: DESCRIPTION,
      headline: HEADLINE,
    });
    expect(result).toBeNull();
  });
});

describe('marketArticleSchema — schema shape', () => {
  it('should set @context, @type, headline, description from parameters', () => {
    const result = marketArticleSchema(buildArgs());
    expect(result?.['@context']).toBe('https://schema.org');
    expect(result?.['@type']).toBe('Article');
    expect(result?.headline).toBe(HEADLINE);
    expect(result?.description).toBe(DESCRIPTION);
  });

  it('should set datePublished and dateModified to regime.last_updated_at', () => {
    const result = marketArticleSchema(buildArgs());
    expect(result?.datePublished).toBe(VALID_REGIME.last_updated_at);
    // MVP decision (§3.4 M4 round-1): daily-cadence editorial — each day's
    // regime IS a new publication, so dateModified = datePublished.
    expect(result?.dateModified).toBe(VALID_REGIME.last_updated_at);
  });

  it('should set publisher.logo.url to canonical /assets/logos/logo-icon.avif (M6 round-2)', () => {
    const result = marketArticleSchema(buildArgs());
    const publisher = result?.publisher as Record<string, unknown>;
    const logo = publisher?.logo as Record<string, unknown>;
    expect(logo?.url).toBe(`${SITE_URL}/assets/logos/logo-icon.avif`);
  });

  it('should mark the article isAccessibleForFree', () => {
    const result = marketArticleSchema(buildArgs());
    expect(result?.isAccessibleForFree).toBe(true);
  });

  it('should set author to diBoaS Analytics organization', () => {
    const result = marketArticleSchema(buildArgs());
    const author = result?.author as Record<string, unknown>;
    expect(author?.['@type']).toBe('Organization');
    expect(author?.name).toBe('diBoaS Analytics');
    expect(author?.url).toBe('https://diboas-analytics.com');
  });
});
