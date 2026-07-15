/**
 * Until-exhausted array reading (Phase 1). Replaces the temporary
 * BEAT_PARAGRAPH_COUNTS contract + lessonCopyShape drift guard: the JSON is
 * now the single source of truth for paragraph counts, so the thing to test
 * is the reading mechanism itself plus a real-catalog roundtrip (flatten a
 * locale JSON, read it back, lengths match the raw arrays) across all four
 * locales for the live lesson.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { readMessageArray } from '../i18nArrays';

describe('readMessageArray', () => {
  const format = (id: string) => `formatted:${id}`;

  it('should read consecutive indexes until the first gap', () => {
    const messages = { 'ns.body.0': 'a', 'ns.body.1': 'b', 'ns.body.2': 'c' };
    expect(readMessageArray(messages, 'ns.body', format)).toEqual([
      'formatted:ns.body.0',
      'formatted:ns.body.1',
      'formatted:ns.body.2',
    ]);
  });

  it('should return an empty array for a missing prefix', () => {
    expect(readMessageArray({ other: 'x' }, 'ns.body', format)).toEqual([]);
  });

  it('should stop at a hole rather than skipping it', () => {
    const messages = { 'ns.body.0': 'a', 'ns.body.2': 'c' };
    expect(readMessageArray(messages, 'ns.body', format)).toHaveLength(1);
  });

  it('should respect the safety bound', () => {
    const messages: Record<string, string> = {};
    for (let i = 0; i < 200; i++) messages[`ns.body.${i}`] = 'x';
    expect(readMessageArray(messages, 'ns.body', format).length).toBeLessThanOrEqual(50);
  });
});

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

/** Minimal re-implementation of the flattener's dotted-key behavior for arrays/objects. */
function flatten(obj: unknown, prefix: string, out: Record<string, string>): void {
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flatten(v, `${prefix}.${i}`, out));
  } else if (obj !== null && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      flatten(v, `${prefix}.${k}`, out);
    }
  } else {
    out[prefix] = String(obj);
  }
}

describe('roundtrip against the real learn-compound-interest catalogs', () => {
  const translationsDir = findTranslationsDir();
  const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

  it.each([...LOCALES])('locale "%s": read-back lengths match the raw JSON arrays', (locale) => {
    const raw = JSON.parse(
      readFileSync(join(translationsDir, locale, 'learn-compound-interest.json'), 'utf-8')
    );
    const flat: Record<string, string> = {};
    flatten(raw, 'learn-compound-interest', flat);

    const cases: Array<[string, unknown[]]> = [
      ['learn-compound-interest.beat1.body', raw.beat1.body],
      ['learn-compound-interest.beat2.intro', raw.beat2.intro],
      ['learn-compound-interest.beat2.outro', raw.beat2.outro],
      ['learn-compound-interest.beat3.intro', raw.beat3.intro],
      ['learn-compound-interest.beat3.wrap', raw.beat3.wrap],
    ];
    for (const [prefix, arr] of cases) {
      expect(readMessageArray(flat, prefix, (id) => flat[id]!)).toHaveLength(arr.length);
    }
  });
});
