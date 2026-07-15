/**
 * Registry invariants (Phase 0 of the learn redesign plan, 2026-07-15).
 *
 * Adding a lesson currently requires keeping several hand-maintained maps in
 * sync (the technical audit's "registry facade" finding). Until the Phase-1
 * refactor collapses them, this test makes every sync point fail loudly:
 *  - READ_TIME_MINUTES has an entry per lesson
 *  - the lesson's i18n namespace is registered in SUPPORTED_NAMESPACES
 *  - the lesson's route has a PAGE_SEO_CONFIG entry (drives sitemap + metadata)
 */

import { describe, it, expect } from 'vitest';
import { SUPPORTED_NAMESPACES } from '@diboas/i18n/config';
import { LESSONS, getActiveLessons } from '../registry';
import { READ_TIME_MINUTES } from '../constants';
import { PAGE_SEO_CONFIG } from '@/lib/seo/constants';

describe('lesson registry invariants', () => {
  const lessons = Object.values(LESSONS);

  it('should register at least one lesson and expose active ones', () => {
    expect(lessons.length).toBeGreaterThan(0);
    expect(getActiveLessons().length).toBeGreaterThan(0);
  });

  it.each(lessons.map((l) => [l.id, l] as const))(
    'lesson "%s" has all hand-maintained sync points',
    (_id, lesson) => {
      // Read time
      expect(
        READ_TIME_MINUTES[lesson.id],
        `READ_TIME_MINUTES missing "${lesson.id}"`
      ).toBeGreaterThan(0);

      // i18n namespace registered (drift-guarded against the file set elsewhere)
      expect(
        (SUPPORTED_NAMESPACES as readonly string[]).includes(lesson.namespace),
        `SUPPORTED_NAMESPACES missing "${lesson.namespace}"`
      ).toBe(true);

      // SEO config drives the sitemap; without it the lesson never gets indexed
      const seoKey = `learn/${lesson.slug}`;
      expect(
        Object.prototype.hasOwnProperty.call(PAGE_SEO_CONFIG, seoKey),
        `PAGE_SEO_CONFIG missing "${seoKey}" (sitemap + metadata)`
      ).toBe(true);
    }
  );
});
