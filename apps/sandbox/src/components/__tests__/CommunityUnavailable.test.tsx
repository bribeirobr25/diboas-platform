// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { SANDBOX_LOCALES } from '@/i18n/config';
import { getMessages } from '@/i18n/loadMessages';
import { CommunityUnavailable } from '../CommunityUnavailable';

/**
 * Community's controlled unavailable state — and the Legal condition attached
 * to its approval.
 *
 * The copy is Brand's canonical wording, approved by Legal in ALL FOUR locales
 * with no edits (`P-QA5` / `L-QA3`). Two things therefore need guarding, and
 * neither is visible in a screenshot:
 *
 * 1. **The implementation condition, verbatim:** *"Do not render the
 *    explanation alone in a way that could be read as a description of an
 *    operational service."* So the explanation may never appear without the
 *    unavailable title AND the availability line. That is a property of the
 *    rendered surface, asserted per locale below.
 * 2. **Approved copy cannot drift.** The same discipline as the `COPY-1` gate:
 *    the catalogue must still hold the approved sentences, in every locale, so
 *    a later "tidy-up" cannot quietly reword Legal-reviewed text.
 */

const renderIn = (locale: (typeof SANDBOX_LOCALES)[number]) =>
  render(
    <IntlProvider locale={locale} messages={getMessages(locale)} onError={() => {}}>
      <CommunityUnavailable locale={locale} />
    </IntlProvider>
  );

describe('Community — visible, and truthfully unavailable (Spec §9.5, §23)', () => {
  it.each(SANDBOX_LOCALES)('should render all four approved beats together in %s', (locale) => {
    const M = getMessages(locale);
    renderIn(locale);
    // The explanation NEVER stands alone: the title says it is not available,
    // and the availability line says access is not open. All three, one block.
    expect(screen.getByText(M['community.title'])).toBeTruthy();
    expect(screen.getByText(M['community.explanation'])).toBeTruthy();
    expect(screen.getByText(M['community.availability'])).toBeTruthy();
    // …and a safe way back (§23's fourth beat).
    expect(screen.getByText(M['community.action'])).toBeTruthy();
  });

  it.each(SANDBOX_LOCALES)('should send the way back to Home in %s', (locale) => {
    const M = getMessages(locale);
    renderIn(locale);
    const back = screen.getByText(M['community.action']).closest('a');
    expect(back?.getAttribute('href')).toBe(`/${locale}`);
  });

  it('should title the surface as unavailable, so the explanation is never the heading', () => {
    // A surface whose heading was the explanation would read as a description
    // of a live service — precisely the Legal condition.
    const M = getMessages('en');
    renderIn('en');
    expect(screen.getByRole('heading').textContent).toBe(M['community.title']);
  });

  it('should still hold the APPROVED wording in every locale', () => {
    // Transcribed from the Strategy Canon disposition §11.2. If a future edit
    // reworded any of these, this fails — which is the point: the wording was
    // reviewed, and re-approval is a Legal step, not a code review.
    const approved: Record<string, { title: string; action: string }> = {
      en: { title: "Community isn't available yet", action: 'Back to Home' },
      de: { title: 'Community ist noch nicht verfügbar', action: 'Zurück zur Startseite' },
      es: { title: 'La Comunidad aún no está disponible', action: 'Volver al inicio' },
      'pt-BR': { title: 'A Comunidade ainda não está disponível', action: 'Voltar ao início' },
    };
    for (const locale of SANDBOX_LOCALES) {
      const M = getMessages(locale);
      expect(M['community.title'], locale).toBe(approved[locale].title);
      expect(M['community.action'], locale).toBe(approved[locale].action);
      // The explanation is long; assert its load-bearing promise survives.
      expect(M['community.explanation'].length, locale).toBeGreaterThan(80);
    }
    // The English explanation carries the sentence that makes the surface
    // honest about ownership; a reworded version must not drop it.
    expect(getMessages('en')['community.explanation']).toContain(
      'Your goals, decisions and money stay yours'
    );
  });
});
