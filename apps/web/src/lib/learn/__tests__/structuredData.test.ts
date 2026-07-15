/**
 * Unit tests for the Learn Center structured data (JSON-LD).
 *
 * Phase 0 (B-1): the live lesson page emitted "PT[object Object]M" because a
 * whole record was interpolated instead of the lesson's value. Phase 1 moved
 * the read time into the registry entry and made `teaches` caller-localized
 * (the pre-refactor hardcode emitted lesson-01's subject for every lesson).
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/seo', () => ({
  seoService: {
    generateCanonicalUrl: (path: string, locale: string) => `https://diboas.com/${locale}${path}`,
  },
}));

import { buildLessonStructuredData, buildLearnIndexStructuredData } from '../structuredData';
import { LESSONS, getActiveLessons } from '../registry';

describe('buildLessonStructuredData', () => {
  it('should emit a valid ISO-8601 timeRequired for the lesson (B-1 regression)', () => {
    const data = buildLessonStructuredData({
      lessonId: 'compound-interest',
      locale: 'en',
      title: 'How Money Really Grows',
      description: 'Test description',
    });

    expect(data).not.toBeNull();
    expect(data!.timeRequired).toBe(`PT${LESSONS['compound-interest'].readTimeMinutes}M`);
    expect(String(data!.timeRequired)).not.toContain('[object Object]');
    expect(String(data!.timeRequired)).toMatch(/^PT\d+M$/);
  });

  it('should use the localized teaches line, falling back to the description', () => {
    const withTeaches = buildLessonStructuredData({
      lessonId: 'compound-interest',
      locale: 'en',
      title: 'T',
      description: 'D',
      teaches: 'Personal finance: how compound interest works',
    });
    expect(withTeaches!.teaches).toBe('Personal finance: how compound interest works');

    const withoutTeaches = buildLessonStructuredData({
      lessonId: 'money-objective',
      locale: 'en',
      title: 'T',
      description: 'Why unnamed money leaks',
    });
    // No lesson may emit another lesson's subject (the pre-Phase-1 hardcode).
    expect(withoutTeaches!.teaches).toBe('Why unnamed money leaks');
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

describe('VideoObject (Phase 3 Slice B, G-5)', () => {
  it('should embed a VideoObject only when the video arg is passed', () => {
    const withVideo = buildLessonStructuredData({
      lessonId: 'compound-interest',
      locale: 'en',
      title: 'T',
      description: 'D',
      video: {
        embedUrl: 'https://www.youtube-nocookie.com/embed/abc',
        thumbnailUrl: 'https://diboas.com/assets/learn/talk-01-hero.avif',
        uploadDate: '2026-08-01',
      },
    }) as Record<string, unknown>;
    const video = withVideo.video as Record<string, unknown>;
    expect(video['@type']).toBe('VideoObject');
    expect(video.embedUrl).toBe('https://www.youtube-nocookie.com/embed/abc');
    expect(video.uploadDate).toBe('2026-08-01');
    expect(video.name).toBe('T');
  });

  it('should emit NO video key without the arg (regression-locks the emitter)', () => {
    const without = buildLessonStructuredData({
      lessonId: 'compound-interest',
      locale: 'en',
      title: 'T',
      description: 'D',
    }) as Record<string, unknown>;
    expect('video' in without).toBe(false);
  });
});
