/**
 * Copy-shape drift guard (Phase 0 of the learn redesign plan, 2026-07-15).
 *
 * LessonThreeBeat reads translation arrays with FIXED lengths from
 * BEAT_PARAGRAPH_COUNTS. If a copy update changes a paragraph count in the
 * JSON without updating the constant, the page renders raw translation keys
 * (count too high) or silently drops approved paragraphs (count too low).
 * That exact bug shipped with the 2026-07-15 Talk 1 rework (7/4/3/5/2 vs the
 * new 6/3/2/4/3) and was caught in review; this test makes it impossible to
 * repeat. The Phase-1 config-driven variant will retire both the constant and
 * this guard.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { BEAT_PARAGRAPH_COUNTS } from '../constants';

const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

/** Walk up from this test to the repo root and locate the translations dir. */
function findTranslationsDir(): string {
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, 'packages/i18n/translations');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error('Could not locate packages/i18n/translations');
}

interface LessonNamespace {
  beat1: { body: string[] };
  beat2: { intro: string[]; outro: string[] };
  beat3: { intro: string[]; wrap: string[] };
}

describe('learn-compound-interest copy shape matches BEAT_PARAGRAPH_COUNTS', () => {
  const translationsDir = findTranslationsDir();

  it.each([...LOCALES])('locale "%s" array lengths match the component contract', (locale) => {
    const raw = readFileSync(
      join(translationsDir, locale, 'learn-compound-interest.json'),
      'utf-8'
    );
    const json = JSON.parse(raw) as LessonNamespace;

    expect(json.beat1.body).toHaveLength(BEAT_PARAGRAPH_COUNTS.beat1Body);
    expect(json.beat2.intro).toHaveLength(BEAT_PARAGRAPH_COUNTS.beat2Intro);
    expect(json.beat2.outro).toHaveLength(BEAT_PARAGRAPH_COUNTS.beat2Outro);
    expect(json.beat3.intro).toHaveLength(BEAT_PARAGRAPH_COUNTS.beat3Intro);
    expect(json.beat3.wrap).toHaveLength(BEAT_PARAGRAPH_COUNTS.beat3Wrap);
  });
});
