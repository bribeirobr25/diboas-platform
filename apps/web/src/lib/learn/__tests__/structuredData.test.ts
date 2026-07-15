/**
 * Unit tests for the Learn Center structured data (JSON-LD).
 *
 * Phase 0 of the learn redesign plan (B-1): the live lesson page emitted
 * `"timeRequired": "PT[object Object]M"` because the whole READ_TIME_MINUTES
 * record was interpolated instead of the lesson's value. These tests lock the
 * fix and the schema shape so future lessons can't regress it.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/seo', () => ({
  seoService: {
    generateCanonicalUrl: (path: string, locale: string) => `https://diboas.com/${locale}${path}`,
  },
}));

import { buildLessonStructuredData, buildLearnIndexStructuredData } from '../structuredData';
import { READ_TIME_MINUTES } from '../constants';
import { getActiveLessons } from '../registry';

describe('buildLessonStructuredData', () => {
  it('should emit a valid ISO-8601 timeRequired for the lesson (B-1 regression)', () => {
    const data = buildLessonStructuredData({
      lessonId: 'compound-interest',
      locale: 'en',
      title: 'How Money Really Grows',
      description: 'Test description',
    });

    expect(data).not.toBeNull();
    expect(data!.timeRequired).toBe(`PT${READ_TIME_MINUTES['compound-interest']}M`);
    // The exact bug: interpolating the record produced "[object Object]".
    expect(String(data!.timeRequired)).not.toContain('[object Object]');
    expect(String(data!.timeRequired)).toMatch(/^PT\d+M$/);
  });

  it('should emit a LearningResource with locale-aware URL and caller-provided copy', () => {
    const data = buildLessonStructuredData({
      lessonId: 'compound-interest',
      locale: 'pt-BR',
      title: 'Como o Dinheiro Realmente Cresce',
      description: 'Descrição',
    });

    expect(data!['@type']).toBe('LearningResource');
    expect(data!.url).toBe('https://diboas.com/pt-BR/learn/compound-interest');
    expect(data!.inLanguage).toBe('pt-BR');
    expect(data!.name).toBe('Como o Dinheiro Realmente Cresce');
    expect(data!.isAccessibleForFree).toBe(true);
  });

  it('should have a timeRequired entry for every registered lesson', () => {
    for (const lesson of getActiveLessons()) {
      expect(
        READ_TIME_MINUTES[lesson.id],
        `READ_TIME_MINUTES missing entry for lesson "${lesson.id}"`
      ).toBeGreaterThan(0);
    }
  });
});

describe('buildLearnIndexStructuredData', () => {
  it('should emit an ItemList with one positioned entry per active lesson', () => {
    const data = buildLearnIndexStructuredData({
      locale: 'en',
      lessonTitles: { 'compound-interest': 'How Money Really Grows' },
    });

    expect(data).not.toBeNull();
    expect(data!['@type']).toBe('ItemList');
    expect(data!.itemListElement).toHaveLength(getActiveLessons().length);
    expect(data!.itemListElement[0]).toMatchObject({
      '@type': 'ListItem',
      position: 1,
      name: 'How Money Really Grows',
    });
  });
});
