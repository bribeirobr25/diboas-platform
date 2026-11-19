/**
 * ⛑ RETIRED-SURFACES-1 guard 5 · the Practice labels (plan P13, D4).
 *
 * `common.navigation.tryPractice` replaces the demo's two keys; the landing tool CTA's key is
 * `toolCtas.practice`; the English wedge says "Try it in Practice". "Practice" is the public
 * name, untranslated in all four locales (CLAUDE.md, F-R4).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const TRANSLATIONS = join(__dirname, '../../../../../../packages/i18n/translations');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;

const read = (locale: string, file: string): Record<string, unknown> =>
  JSON.parse(readFileSync(join(TRANSLATIONS, locale, file), 'utf8')) as Record<string, unknown>;

const at = (obj: Record<string, unknown>, path: string): unknown =>
  path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj);

describe('the Practice labels (P13 · D4)', () => {
  it.each(LOCALES)('should label the navigation CTA with Practice in %s', (locale) => {
    const common = read(locale, 'common.json');
    const label = at(common, 'navigation.tryPractice');
    expect(typeof label).toBe('string');
    expect(label as string).toMatch(/Practice/);
    expect(at(common, 'navigation.landing.tryDemo')).toBeUndefined();
    expect(at(common, 'navigation.actions.demo')).toBeUndefined();
  });

  it.each(LOCALES)('should keep the play-money CTA under its Practice key in %s', (locale) => {
    const landing = read(locale, 'landing-b2c.json');
    expect(String(at(landing, 'toolCtas.practice') ?? '')).not.toBe('');
    expect(at(landing, 'toolCtas.demo')).toBeUndefined();
    expect(at(landing, 'demo')).toBeUndefined();
    expect(at(landing, 'draper.demo')).toBeUndefined();
    expect(at(landing, 'ptbr.demo')).toBeUndefined();
  });

  it('should word the English wedge for Practice', () => {
    expect(at(read('en', 'landing-b2c.json'), 'wedge.cta')).toBe('Try it in Practice');
  });
});
