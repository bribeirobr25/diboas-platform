/**
 * Tests for `useConfigTranslation` / `withTranslations` `valuesByKey` extension.
 *
 * These tests target the shared `translateValue` implementation through
 * `withTranslations` (the non-hook surface) so we don't need a React context.
 *
 * Convention: `should [behavior] when [condition]`.
 */

import { describe, it, expect, vi } from 'vitest';
import { createIntl, createIntlCache, type IntlShape } from 'react-intl';
import { withTranslations, type ValuesByKey } from '../config-translator';

const cache = createIntlCache();

function buildIntl(messages: Record<string, string>): IntlShape {
  return createIntl(
    {
      locale: 'en',
      messages,
      onError: () => {
        /* swallow missing-translation warnings in tests */
      },
    },
    cache
  );
}

describe('useConfigTranslation / withTranslations valuesByKey', () => {
  it('should produce identical output when valuesByKey is not provided', () => {
    const intl = buildIntl({
      'landing-b2c.demo.header': 'Hello world',
    });
    const config = { header: 'landing-b2c.demo.header' };

    const withMap = withTranslations(intl, config, undefined, undefined);
    const withoutMap = withTranslations(intl, config);

    expect(withMap).toEqual(withoutMap);
    expect(withMap.header).toBe('Hello world');
  });

  it('should resolve slot values when valuesByKey contains the leaf key', () => {
    const intl = buildIntl({
      'landing-b2c.fees.rows.adding.diboas': '{rate} (min {min}, max {max})',
    });
    const config = { diboas: 'landing-b2c.fees.rows.adding.diboas' };
    const values: ValuesByKey = new Map([
      [
        'landing-b2c.fees.rows.adding.diboas',
        { rate: '0.48%', min: '$0.25', max: '$25' },
      ],
    ]);

    const result = withTranslations(intl, config, undefined, values);
    expect(result.diboas).toBe('0.48% (min $0.25, max $25)');
  });

  it('should propagate values through nested config objects when keys match', () => {
    const intl = buildIntl({
      'landing-b2c.fees.rows.adding.diboas': '{rate}',
      'landing-b2c.fees.rows.selling.diboas': '{rate}',
    });
    const config = {
      content: {
        rows: {
          adding: { diboas: 'landing-b2c.fees.rows.adding.diboas' },
          selling: { diboas: 'landing-b2c.fees.rows.selling.diboas' },
        },
      },
    };
    const values: ValuesByKey = new Map([
      ['landing-b2c.fees.rows.adding.diboas', { rate: '0.48%' }],
      ['landing-b2c.fees.rows.selling.diboas', { rate: '0.39%' }],
    ]);

    const result = withTranslations(intl, config, undefined, values);
    expect(result.content.rows.adding.diboas).toBe('0.48%');
    expect(result.content.rows.selling.diboas).toBe('0.39%');
  });

  it('should propagate values through arrays of objects when keys match', () => {
    const intl = buildIntl({
      'landing-b2c.fees.rows.adding.diboas': '{rate}',
      'landing-b2c.fees.rows.selling.diboas': '{rate}',
    });
    const config = {
      rows: [
        { id: 'a', diboas: 'landing-b2c.fees.rows.adding.diboas' },
        { id: 'b', diboas: 'landing-b2c.fees.rows.selling.diboas' },
      ],
    };
    const values: ValuesByKey = new Map([
      ['landing-b2c.fees.rows.adding.diboas', { rate: '0.48%' }],
      ['landing-b2c.fees.rows.selling.diboas', { rate: '0.39%' }],
    ]);

    const result = withTranslations(intl, config, undefined, values);
    expect(result.rows[0].diboas).toBe('0.48%');
    expect(result.rows[1].diboas).toBe('0.39%');
  });

  it('should fall back to literal {slot} text when valuesByKey is missing the key', () => {
    const intl = buildIntl({
      'landing-b2c.fees.rows.adding.diboas': '{rate} (min {min}, max {max})',
    });
    const config = { diboas: 'landing-b2c.fees.rows.adding.diboas' };

    // valuesByKey provided, but for a DIFFERENT key — entry for this key is undefined.
    const values: ValuesByKey = new Map([
      ['landing-b2c.fees.rows.selling.diboas', { rate: '0.39%' }],
    ]);

    const result = withTranslations(intl, config, undefined, values);
    // react-intl renders {slot} markers literally when no values are supplied.
    expect(result.diboas).toBe('{rate} (min {min}, max {max})');
  });

  it('should look up values by RESOLVED translation id when translationKeyMap is used', () => {
    const intl = buildIntl({
      'landing-b2c.fees.rows.adding.diboas': '{rate}',
    });
    const config = { diboas: 'OLD_LITERAL' };
    const translationKeyMap = new Map([
      ['OLD_LITERAL', 'landing-b2c.fees.rows.adding.diboas'],
    ]);
    // Values keyed by the RESOLVED id, not the original string.
    const values: ValuesByKey = new Map([
      ['landing-b2c.fees.rows.adding.diboas', { rate: '0.48%' }],
    ]);

    const result = withTranslations(intl, config, translationKeyMap, values);
    expect(result.diboas).toBe('0.48%');
  });

  it('should resolve all slots when ICU template is multi-slot', () => {
    const intl = buildIntl({
      'landing-b2b.fees.example': 'Cash out: keep {kept} (after {rate} fee).',
    });
    const config = { example: 'landing-b2b.fees.example' };
    const values: ValuesByKey = new Map([
      ['landing-b2b.fees.example', { kept: '$995.20', rate: '0.48%' }],
    ]);

    const result = withTranslations(intl, config, undefined, values);
    expect(result.example).toBe('Cash out: keep $995.20 (after 0.48% fee).');
  });

  it('should leave non-translation literals unchanged when valuesByKey is provided', () => {
    const intl = buildIntl({
      'landing-b2c.fees.rows.adding.diboas': '{rate}',
    });
    const config = {
      diboas: 'landing-b2c.fees.rows.adding.diboas',
      literal: 'FREE',
      another: 'just a plain string',
    };
    const values: ValuesByKey = new Map([
      ['landing-b2c.fees.rows.adding.diboas', { rate: '0.48%' }],
    ]);

    const result = withTranslations(intl, config, undefined, values);
    expect(result.diboas).toBe('0.48%');
    expect(result.literal).toBe('FREE');
    expect(result.another).toBe('just a plain string');
  });

  it('should resolve only matched keys when valuesByKey is a partial/mixed map', () => {
    const intl = buildIntl({
      'landing-b2c.fees.rows.adding.diboas': '{rate}',
      'landing-b2c.fees.rows.swapping.diboas': 'FREE',
    });
    const config = {
      adding: { diboas: 'landing-b2c.fees.rows.adding.diboas' },
      swapping: { diboas: 'landing-b2c.fees.rows.swapping.diboas' },
    };
    // Only one of the two keys has values; the other should still render its template.
    const values: ValuesByKey = new Map([
      ['landing-b2c.fees.rows.adding.diboas', { rate: '0.48%' }],
    ]);

    const result = withTranslations(intl, config, undefined, values);
    expect(result.adding.diboas).toBe('0.48%');
    expect(result.swapping.diboas).toBe('FREE');
  });

  it('should warn in development when a slot in the template has no value', () => {
    const intl = buildIntl({
      'landing-b2c.fees.rows.adding.diboas': '{rate} (min {min}, max {max})',
    });
    const config = { diboas: 'landing-b2c.fees.rows.adding.diboas' };
    // Provide `rate` but forget `min` and `max`.
    const values: ValuesByKey = new Map([
      ['landing-b2c.fees.rows.adding.diboas', { rate: '0.48%' }],
    ]);
    const originalEnv = process.env.NODE_ENV;
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    try {
      // @ts-expect-error — NODE_ENV is readonly in d.ts but mutable at runtime.
      process.env.NODE_ENV = 'development';
      withTranslations(intl, config, undefined, values);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      const msg = warnSpy.mock.calls[0]![0] as string;
      expect(msg).toContain('landing-b2c.fees.rows.adding.diboas');
      expect(msg).toContain('min');
      expect(msg).toContain('max');
      expect(msg).not.toContain('rate'); // `rate` is provided
    } finally {
      // @ts-expect-error — NODE_ENV is readonly in d.ts but mutable at runtime.
      process.env.NODE_ENV = originalEnv;
      warnSpy.mockRestore();
    }
  });
});
