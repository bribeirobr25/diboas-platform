// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

// Accept is WIRED to the submitConsent server action; mock it so the test
// asserts the wiring (called with the locale) without real navigation.
const submitConsent = vi.fn();
vi.mock('@/app/[locale]/consent/actions', () => ({
  submitConsent: (locale: string) => submitConsent(locale),
}));

import { Consent } from '../Consent';

const M = {
  'common.playBadge': 'Sandbox · play money',
  'common.wordmarkAlt': 'diBoaS',
  'consent.title': 'Before you start',
  'consent.intro': 'intro',
  'consent.requiredTitle': 'Your consent is required',
  'consent.requiredBody':
    'Tap Accept to agree to our <terms>Terms</terms>, <privacy>Privacy Policy</privacy>, and confirm 18+.',
  'consent.accept': 'Accept & continue',
  'consent.optionalTitle': 'Make it your experience',
  'consent.optionalIntro': 'settings',
  'consent.financialProfileTitle': 'Financial profile',
  'consent.financialProfileBody': 'a',
  'consent.analyticsTitle': 'Analytics',
  'consent.analyticsBody': 'b',
  'consent.marketingTitle': 'Marketing communications',
  'consent.marketingBody': 'c',
  'consent.footer': 'We never sell your data. <privacy>Privacy Policy</privacy>.',
};

function renderConsent(locale = 'en') {
  return render(
    <IntlProvider locale="en" messages={M}>
      <Consent locale={locale} />
    </IntlProvider>
  );
}

describe('Consent (A3 — the W-3 shape)', () => {
  it('should render ONE blocking accept + THREE optional switches (all off)', () => {
    renderConsent();
    expect(screen.getByRole('button', { name: /Accept & continue/ })).toBeTruthy();
    const switches = screen.getAllByRole('switch');
    expect(switches).toHaveLength(3);
    // W-3: all opt-ins OFF by default (never pre-checked).
    switches.forEach((s) => expect(s.getAttribute('aria-checked')).toBe('false'));
  });

  it('should keep opt-ins off until the user turns them on', () => {
    renderConsent();
    const analytics = screen.getByRole('switch', { name: 'Analytics' });
    expect(analytics.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(analytics);
    expect(analytics.getAttribute('aria-checked')).toBe('true');
  });

  it('should WIRE Accept into the flow (submitConsent called with the locale)', () => {
    submitConsent.mockClear();
    renderConsent('de');
    fireEvent.click(screen.getByRole('button', { name: /Accept & continue/ }));
    expect(submitConsent).toHaveBeenCalledWith('de');
  });

  it('should present Terms/Privacy as links (explicit accept is the consent act)', () => {
    renderConsent();
    expect(screen.getAllByRole('link', { name: 'Terms' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Privacy Policy' }).length).toBeGreaterThan(0);
  });
});
