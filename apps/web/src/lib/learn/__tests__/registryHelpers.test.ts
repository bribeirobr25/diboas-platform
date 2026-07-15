/**
 * Phase 2 registry helpers (learn redesign plan, 2026-07-15).
 *
 * - getSeriesLessons: the TalkArc's ordering contract. Series order is the
 *   prev/next spine walked from the head, never object-key order.
 * - getNextLiveLesson: the talk-page CTA contract (D-2 drip). The next-talk
 *   link renders ONLY when the next talk is live; announced or absent next
 *   talks fall back to the honest "more talks are on the way" line.
 * - Arc i18n drift guard: every registry talk has learn.arc.<id>.title +
 *   .line in the en reference locale (parity across locales is enforced by
 *   validate:translations; en is the source of truth).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { LESSONS, getSeriesLessons, getNextLiveLesson, getPrevLiveLesson } from '../registry';
import type { LessonId, LessonMetadata } from '../types';

function makeLesson(id: LessonId, overrides: Partial<LessonMetadata> = {}): LessonMetadata {
  return {
    id,
    slug: id,
    namespace: `learn-${id}`,
    status: 'announced',
    variant: 'threeBeat',
    readTimeMinutes: 5,
    blocks: { beat3Tool: { kind: 'toolCard', href: '/tools/money-jobs' } },
    ...overrides,
  };
}

describe('getSeriesLessons', () => {
  it('should walk the real registry spine completely and in order', () => {
    const series = getSeriesLessons();
    expect(series).toHaveLength(7);
    expect(series[0].id).toBe('compound-interest');
    expect(series[6].id).toBe('putting-it-together');
    // Every step follows the spine.
    for (let i = 0; i < series.length - 1; i++) {
      expect(series[i].next).toBe(series[i + 1].id);
    }
  });

  it('should order by the spine even when object-key order disagrees', () => {
    // Keys deliberately reversed vs the spine.
    const fixture = {
      'ten-percent': makeLesson('ten-percent', { prev: 'money-objective' }),
      'money-objective': makeLesson('money-objective', { next: 'ten-percent' }),
    } as const;
    const series = getSeriesLessons(fixture);
    expect(series.map((l) => l.id)).toEqual(['money-objective', 'ten-percent']);
  });

  it('should return [] when no head exists (defensive; invariants test guards the real registry)', () => {
    const fixture = {
      'ten-percent': makeLesson('ten-percent', { prev: 'money-objective', next: 'ten-percent' }),
    } as const;
    expect(getSeriesLessons(fixture)).toEqual([]);
  });
});

describe('getNextLiveLesson', () => {
  it('should return the next talk when it is live', () => {
    const next = makeLesson('money-objective', { status: 'live', prev: 'compound-interest' });
    const current = makeLesson('compound-interest', { status: 'live', next: 'money-objective' });
    expect(
      getNextLiveLesson(current, { 'compound-interest': current, 'money-objective': next })?.id
    ).toBe('money-objective');
  });

  it('should return undefined when the next talk is only announced', () => {
    const next = makeLesson('money-objective', { prev: 'compound-interest' });
    const current = makeLesson('compound-interest', { status: 'live', next: 'money-objective' });
    expect(
      getNextLiveLesson(current, { 'compound-interest': current, 'money-objective': next })
    ).toBeUndefined();
  });

  it('should return undefined for the last talk (no next)', () => {
    const current = makeLesson('putting-it-together', { status: 'live' });
    expect(getNextLiveLesson(current, { 'putting-it-together': current })).toBeUndefined();
  });

  it('should reflect the real registry today: talk 1 has no live next yet', () => {
    expect(getNextLiveLesson(LESSONS['compound-interest'])).toBeUndefined();
  });
});

/** Walk up from this test to the repo root and locate the translations dir. */
function findTranslationsDir(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, 'packages/i18n/translations');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error('Could not locate packages/i18n/translations');
}

describe('arc i18n drift guard (registry <-> learn.arc.*)', () => {
  const learnJson = JSON.parse(
    readFileSync(join(findTranslationsDir(), 'en', 'learn.json'), 'utf-8')
  ) as { arc?: Record<string, unknown> };

  it('should carry arc.badge, arc.readTime, arc.cardCta, arc.comingSoon', () => {
    for (const key of ['badge', 'readTime', 'cardCta', 'comingSoon']) {
      expect(typeof learnJson.arc?.[key], `learn.arc.${key} missing in en`).toBe('string');
    }
  });

  it.each(Object.keys(LESSONS))('should carry arc.%s.title + .line in en', (id) => {
    const entry = learnJson.arc?.[id] as { title?: unknown; line?: unknown } | undefined;
    expect(typeof entry?.title, `learn.arc.${id}.title missing in en`).toBe('string');
    expect(typeof entry?.line, `learn.arc.${id}.line missing in en`).toBe('string');
  });
});

describe('getPrevLiveLesson (Phase 3 mirror)', () => {
  it('should return the previous talk when it is live', () => {
    const prev = makeLesson('compound-interest', { status: 'live', next: 'money-objective' });
    const current = makeLesson('money-objective', { status: 'live', prev: 'compound-interest' });
    expect(
      getPrevLiveLesson(current, { 'compound-interest': prev, 'money-objective': current })?.id
    ).toBe('compound-interest');
  });

  it('should return undefined when the previous talk is only announced', () => {
    const prev = makeLesson('compound-interest', { next: 'money-objective' });
    const current = makeLesson('money-objective', { status: 'live', prev: 'compound-interest' });
    expect(
      getPrevLiveLesson(current, { 'compound-interest': prev, 'money-objective': current })
    ).toBeUndefined();
  });

  it('should return undefined for the first talk (no prev)', () => {
    expect(getPrevLiveLesson(LESSONS['compound-interest'])).toBeUndefined();
  });
});

describe('quiz drift guards (registry <-> en quiz keys, RV-4)', () => {
  const enDir = join(findTranslationsDir(), 'en');

  function enNamespace(ns: string): Record<string, unknown> {
    return JSON.parse(readFileSync(join(enDir, `${ns}.json`), 'utf-8')) as Record<string, unknown>;
  }

  it.each(Object.values(LESSONS).filter((l) => l.blocks.quiz))(
    'talk "$id": every correctIndex is in bounds of the en option list and questions exist',
    (lesson) => {
      const json = enNamespace(lesson.namespace) as {
        quiz?: Record<string, { question?: string; options?: string[] }> & {
          reflection?: string;
          share?: { line?: string };
        };
      };
      expect(
        json.quiz,
        `${lesson.namespace} has a registry quiz but no en quiz block`
      ).toBeTruthy();
      lesson.blocks.quiz!.correctIndexes.forEach((correctIndex, i) => {
        const q = json.quiz![`q${i + 1}`] as { question?: string; options?: string[] };
        expect(q?.question, `quiz.q${i + 1}.question missing in en`).toBeTypeOf('string');
        expect(Array.isArray(q?.options), `quiz.q${i + 1}.options missing in en`).toBe(true);
        expect(
          correctIndex,
          `correctIndex ${correctIndex} out of bounds for q${i + 1}`
        ).toBeLessThan(q!.options!.length);
        expect(correctIndex).toBeGreaterThanOrEqual(0);
      });
      expect(json.quiz!.reflection, 'quiz.reflection missing').toBeTypeOf('string');
      expect(json.quiz!.share?.line, 'quiz.share.line missing').toBeTypeOf('string');
    }
  );

  it('should have a registry quiz block for every LIVE talk namespace that ships quiz keys (two-way seam)', () => {
    for (const lesson of Object.values(LESSONS).filter((l) => l.status === 'live')) {
      const json = enNamespace(lesson.namespace) as { quiz?: unknown };
      const hasKeys = Boolean(json.quiz);
      const hasRegistry = Boolean(lesson.blocks.quiz);
      expect(hasKeys, `"${lesson.id}": quiz keys/registry mismatch`).toBe(hasRegistry);
    }
  });
});
