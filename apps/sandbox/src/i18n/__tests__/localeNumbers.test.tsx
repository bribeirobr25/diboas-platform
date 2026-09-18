// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { FormattedMessage, IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { SANDBOX_LOCALES } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';

/**
 * `5.405` — a rate or percentage must be formatted by its LOCALE, not emitted raw.
 *
 * ## The defect this exists to prevent
 *
 * `goalNew.apyNow` and its siblings interpolated a bare `{apy}`, and react-intl
 * renders a bare argument as a PLAIN value. So German showed
 * *"Aktuelle Pool-Rate: 3.2%/Jahr"* where it must read **3,2** — measured in the
 * browser on the built artefact. `de`, `pt-BR` and `es` all expect a comma;
 * only `en` expects a dot, which is why every English cell looked correct and
 * hid it on a money-adjacent surface.
 *
 * ## Why no existing guard could see it
 *
 * Measured at the time: **0** decimal-separator assertions in the suite.
 * - the untranslated ratchet asks only "does this locale differ from English";
 * - the ICU-argument guard extracts `["apy"]` from BOTH `{apy}` and
 *   `{apy, number}`, so the skeleton is invisible to it;
 * - `testCopyDrift` requires a stub to equal the catalogue only when the test
 *   ASSERTS on that stub's text, and these assertions match the rendered output
 *   (`/\(real, variable\)/`), never the raw stub — so its filter correctly
 *   excludes them. That is X6 behaving as designed, and it is also why the
 *   component harnesses still render the bare form.
 *
 * This test therefore renders through the **real catalogue**, per locale, which
 * is the only place the separator becomes observable.
 */

/** Every key that interpolates a number the locale must format (`5.405`). */
const NUMERIC_KEYS: readonly { key: string; arg: 'apy' | 'percent' }[] = [
  { key: 'goalNew.apyNow', arg: 'apy' },
  { key: 'goalNew.apyNowMixed', arg: 'apy' },
  { key: 'goalNew.apyNowFixture', arg: 'apy' },
  { key: 'goalNew.growthExposure', arg: 'percent' },
  { key: 'pathCard.riskGrowth', arg: 'percent' },
];

/** What each locale must produce for 3.2 — Intl's own answer, not a guess. */
const expectedSeparator = (locale: string) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(3.2);

describe('5.405 — a rate is formatted by its locale, never emitted raw', () => {
  it.each(SANDBOX_LOCALES)('should render 3.2 in the %s separator, every numeric key', (locale) => {
    const messages = getMessages(locale);
    const want = expectedSeparator(locale);
    for (const { key, arg } of NUMERIC_KEYS) {
      const { unmount } = render(
        <IntlProvider locale={locale} messages={messages} onError={() => {}}>
          <FormattedMessage id={key} values={{ [arg]: 3.2 }} />
        </IntlProvider>
      );
      // The VALUE as the reader sees it — not the attribute meant to produce it.
      expect(
        screen.getByText(new RegExp(want.replace('.', '\\.')), { exact: false }),
        `${locale}:${key}`
      ).toBeTruthy();
      unmount();
    }
  });

  it('should show German and English genuinely differ, so the test is not vacuous', () => {
    // If both rendered the same, the assertion above would pass for the wrong
    // reason. 3,2 vs 3.2 is the whole point of the row.
    expect(expectedSeparator('de')).toBe('3,2');
    expect(expectedSeparator('en')).toBe('3.2');
    expect(expectedSeparator('pt-BR')).toBe('3,2');
    expect(expectedSeparator('es')).toBe('3,2');
  });

  it('should carry the number skeleton in every locale, for every numeric key', () => {
    /* The catalogue half of the same requirement. A future edit that drops
       `, number` would still render in English and would silently regress the
       other three, so the skeleton itself is asserted.
       Sabotage: remove `, number` from any one value and this fails. */
    for (const locale of SANDBOX_LOCALES) {
      const messages = getMessages(locale);
      for (const { key, arg } of NUMERIC_KEYS) {
        expect(messages[key], `${locale}:${key}`).toContain(`{${arg}, number}`);
      }
    }
  });
});
