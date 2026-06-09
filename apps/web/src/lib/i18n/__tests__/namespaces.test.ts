/**
 * Drift-guard for the SUPPORTED_NAMESPACES registry (I-4).
 *
 * `isTranslationKey` (config-translator) keys off `SUPPORTED_NAMESPACES` to decide
 * whether a config value is a translation key. If a new namespace JSON is added
 * to `translations/` but not to the registry, that namespace's config keys would
 * silently render the raw key string again — the exact foot-gun I-4 closes. This
 * test fails if the registry drifts from the actual `translations/en` file set.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { SUPPORTED_NAMESPACES, isKnownNamespace } from '@diboas/i18n/config';

/** Walk up from this test to the repo root and locate the reference (en) translations. */
function findEnTranslationsDir(): string {
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, 'packages/i18n/translations/en');
    if (existsSync(candidate)) return candidate;
    dir = dirname(dir);
  }
  throw new Error('Could not locate packages/i18n/translations/en');
}

/** Every `*.json` under the dir → namespace name (incl. `legal/*` subpaths). */
function listNamespaces(dir: string): string[] {
  return (readdirSync(dir, { recursive: true }) as string[])
    .filter((f) => typeof f === 'string' && f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, '').replace(/\\/g, '/'))
    .sort();
}

describe('SUPPORTED_NAMESPACES registry (I-4)', () => {
  it('matches the translations/en file set exactly', () => {
    const fromFiles = listNamespaces(findEnTranslationsDir());
    const fromConst = [...SUPPORTED_NAMESPACES].sort();
    expect(fromConst).toEqual(fromFiles);
  });

  it('isKnownNamespace recognises every registered namespace and nothing else', () => {
    for (const ns of SUPPORTED_NAMESPACES) {
      expect(isKnownNamespace(ns)).toBe(true);
    }
    expect(isKnownNamespace('not-a-namespace')).toBe(false);
    // `marketing` was a recognised prefix in the old hardcoded list but is not a
    // real namespace file (no marketing.json) — deliberately dropped.
    expect(isKnownNamespace('marketing')).toBe(false);
  });
});
