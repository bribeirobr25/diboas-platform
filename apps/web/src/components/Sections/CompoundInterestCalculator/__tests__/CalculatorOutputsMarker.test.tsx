/**
 * HEDGE-PRED-1 (C2-S G3, `5.933`) — the compound tool's " in USD" marker, rendered.
 *
 * The marker says a scenario's rate is a dollar rate grown in local currency. It must show
 * exactly when the tool engine hedged that figure: in every locale whose tool rates differ from
 * the unhedged (lesson) rates, and nowhere else — never in en, never on the lesson engine.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  calculateCompoundProjection,
  calculateCompoundProjectionHedged,
  LESSON_DEFAULT_INPUT_BY_LOCALE,
} from '@/lib/compound-interest';
import type { SupportedLocale } from '@diboas/i18n/config';

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({ locale: 'en', formatMessage: ({ id }: { id: string }) => id }),
}));

import { CalculatorOutputs } from '../variants/CalculatorDefault/CalculatorOutputs';

const LOCALES: SupportedLocale[] = ['en', 'pt-BR', 'es', 'de'];
const SUFFIX = 'tools-shared.scenarios.usdSuffix';

const inputFor = (locale: SupportedLocale) => ({
  ...LESSON_DEFAULT_INPUT_BY_LOCALE[locale],
  locale,
});
const markers = (container: HTMLElement) => (container.textContent ?? '').split(SUFFIX).length - 1;

describe('HEDGE-PRED-1: the compound tool marks a rate in USD exactly when it is hedged', () => {
  it.each(LOCALES)('tool engine, %s', (locale) => {
    const tool = calculateCompoundProjectionHedged(inputFor(locale));
    const lesson = calculateCompoundProjection(inputFor(locale));
    const hedged = tool.series.some(
      (s, i) => s.scenario !== 'bank' && s.rate !== lesson.series[i]?.rate
    );
    const { container } = render(<CalculatorOutputs output={tool} engine="tool" />);
    expect(markers(container) > 0).toBe(hedged);
    expect(hedged).toBe(locale !== 'en');
  });

  it.each(LOCALES)('lesson engine, %s: never marked', (locale) => {
    const { container } = render(
      <CalculatorOutputs output={calculateCompoundProjection(inputFor(locale))} engine="lesson" />
    );
    expect(markers(container)).toBe(0);
  });
});
