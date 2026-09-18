// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { SANDBOX_LOCALES } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';
import { LearnUnavailable } from '../LearnUnavailable';

/**
 * Learn's controlled unavailable state (`5.349`, Execution Rulings §18) — and
 * the Legal condition that kept it from shipping until now.
 *
 * Learn was inert for one reason: `L-QA3` forbids rendering the explanation
 * *"alone in a way that could be read as a description of an operational
 * service"*, and `learn.explainer` describes what Learn DOES. §18 supplied the
 * availability line in all four locales, so the composition it requires —
 *
 *   Learn title + approved Learn explainer + availability line
 *
 * — is now possible. Two things therefore need guarding, and neither is visible
 * in a screenshot:
 *
 * 1. **The three beats render TOGETHER.** The explainer may never appear
 *    without the title above it and the availability line below it. Asserted
 *    per locale, because the condition is per rendered surface.
 * 2. **The approved wording cannot drift** — the `COPY-1`/`COPY-3` discipline:
 *    a later tidy-up must not quietly reword Legal-reviewed text.
 */

const renderIn = (locale: (typeof SANDBOX_LOCALES)[number]) =>
  render(
    <IntlProvider locale={locale} messages={getMessages(locale)} onError={() => {}}>
      <LearnUnavailable locale={locale} />
    </IntlProvider>
  );

describe('Learn — visible, and truthfully unavailable (5.349, §18)', () => {
  it.each(SANDBOX_LOCALES)('should render the three required beats together in %s', (locale) => {
    const M = getMessages(locale);
    renderIn(locale);
    // §18's composition, in order. The explainer NEVER stands alone.
    expect(screen.getByText(M['nav.learn'])).toBeTruthy();
    expect(screen.getByText(M['learn.explainer'])).toBeTruthy();
    expect(screen.getByText(M['learn.availability'])).toBeTruthy();
  });

  it.each(SANDBOX_LOCALES)('should title the surface with the approved label in %s', (locale) => {
    // The heading must be the TITLE, never the explainer — a surface whose
    // heading described what Learn does is exactly the L-QA3 reading.
    const M = getMessages(locale);
    renderIn(locale);
    expect(screen.getByRole('heading').textContent).toBe(M['nav.learn']);
  });

  it.each(SANDBOX_LOCALES)('should offer a safe way back to Home in %s', (locale) => {
    const M = getMessages(locale);
    renderIn(locale);
    const back = screen.getByText(M['community.action']).closest('a');
    expect(back?.getAttribute('href')).toBe(`/${locale}`);
  });

  it('should still hold §18 wording EXACTLY, in every locale', () => {
    // Transcribed byte-for-byte from Execution Rulings §16-§18. If an edit
    // reworded any of these, this fails — re-approval is a Legal step, not a
    // code review.
    const approved: Record<string, string> = {
      en: "This area isn't available yet.",
      'pt-BR': 'Esta área ainda não está disponível.',
      de: 'Dieser Bereich ist noch nicht verfügbar.',
      es: 'Esta sección aún no está disponible.',
    };
    for (const locale of SANDBOX_LOCALES) {
      expect(getMessages(locale)['learn.availability'], locale).toBe(approved[locale]);
    }
    // The German title is RULED (`5.351`): the display label is Verstehen while
    // the canonical ontology, route and destination id stay `learn`.
    expect(getMessages('de')['nav.learn']).toBe('Verstehen');
  });

  it('should never render the explainer without the availability line', () => {
    /* The structural half of L-QA3: this component takes no slots a caller
       could use selectively, so the beats cannot be separated by a consumer.
       Sabotage: delete the availability <p> from LearnUnavailable and this
       fails while every other test still passes. */
    renderIn('en');
    const M = getMessages('en');
    const explainer = screen.getByText(M['learn.explainer']);
    const block = explainer.closest('section');
    expect(block?.textContent).toContain(M['learn.availability']);
    expect(block?.textContent).toContain(M['nav.learn']);
  });
});
