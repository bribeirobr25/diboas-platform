/**
 * Registry invariants (Phase 0 + Phase 1 of the learn redesign plan).
 *
 * The registry is the single source of truth for the 7-talk series; these
 * tests make every remaining hand-maintained sync point fail loudly:
 *  - LIVE lessons: i18n namespace registered in SUPPORTED_NAMESPACES and a
 *    PAGE_SEO_CONFIG entry (drives sitemap + metadata). Announced lessons
 *    must have NEITHER (they'd leak into the sitemap / break i18n loading).
 *  - Slugs unique; namespace follows the learn-<slug> convention.
 *  - The prev/next spine is mutually consistent and covers all 7 talks.
 *  - Illustrations (when present) follow the /assets/learn/ convention.
 */

import { describe, it, expect } from 'vitest';
import { SUPPORTED_NAMESPACES } from '@diboas/i18n/config';
import { LESSONS, getActiveLessons, getLessonBySlug } from '../registry';
import { PAGE_SEO_CONFIG } from '@/lib/seo/constants';

const lessons = Object.values(LESSONS);
const namespaceSet = SUPPORTED_NAMESPACES as readonly string[];

describe('lesson registry invariants', () => {
  it('should register the full 7-talk series with at least one live', () => {
    expect(lessons).toHaveLength(7);
    expect(getActiveLessons().length).toBeGreaterThan(0);
  });

  it('should have unique slugs that resolve via getLessonBySlug', () => {
    const slugs = lessons.map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const lesson of lessons) {
      expect(getLessonBySlug(lesson.slug)?.id).toBe(lesson.id);
    }
  });

  it.each(lessons.map((l) => [l.id, l] as const))(
    'lesson "%s" satisfies its per-status sync points',
    (_id, lesson) => {
      expect(lesson.readTimeMinutes).toBeGreaterThan(0);
      expect(lesson.namespace).toBe(`learn-${lesson.slug}`);

      const seoKey = `learn/${lesson.slug}`;
      const hasSeo = Object.prototype.hasOwnProperty.call(PAGE_SEO_CONFIG, seoKey);
      const hasNamespace = namespaceSet.includes(lesson.namespace);

      if (lesson.status === 'live') {
        expect(hasNamespace, `SUPPORTED_NAMESPACES missing "${lesson.namespace}"`).toBe(true);
        expect(hasSeo, `PAGE_SEO_CONFIG missing "${seoKey}" (sitemap + metadata)`).toBe(true);
      } else {
        // Announced talks must not leak: no sitemap entry until they go live.
        expect(hasSeo, `announced "${lesson.id}" must not have PAGE_SEO_CONFIG yet`).toBe(false);
      }

      if (lesson.illustration) {
        expect(lesson.illustration).toMatch(/^\/assets\/learn\//);
      }
    }
  );

  it('should have a mutually-consistent prev/next spine covering the series', () => {
    for (const lesson of lessons) {
      if (lesson.next) {
        const next = LESSONS[lesson.next];
        expect(next, `"${lesson.id}".next points at unknown "${lesson.next}"`).toBeDefined();
        expect(next.prev, `spine broken between "${lesson.id}" and "${lesson.next}"`).toBe(
          lesson.id
        );
      }
      if (lesson.prev) {
        const prev = LESSONS[lesson.prev];
        expect(prev, `"${lesson.id}".prev points at unknown "${lesson.prev}"`).toBeDefined();
        expect(prev.next, `spine broken between "${lesson.prev}" and "${lesson.id}"`).toBe(
          lesson.id
        );
      }
    }
    // Exactly one head (no prev) and one tail (no next).
    expect(lessons.filter((l) => !l.prev)).toHaveLength(1);
    expect(lessons.filter((l) => !l.next)).toHaveLength(1);
  });
});
