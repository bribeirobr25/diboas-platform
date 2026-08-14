// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { Consent } from '../Consent';

const M = {
  'common.appName': 'diBoaS',
  'common.playBadge': 'Sandbox · play money',
  'consent.title': 'Before you start',
  'consent.intro': 'intro',
  'consent.requiredTitle': 'Your consent is required',
  'consent.requiredBody': 'Accept our <terms>Terms</terms> and <privacy>Privacy Policy</privacy>.',
  'consent.accept': 'Accept & continue',
  'consent.optionalTitle': 'Make it your experience',
  'consent.optionalAll': 'all optional',
  'consent.optionalIntro': 'settings',
  'consent.financialProfileTitle': 'Financial profile',
  'consent.financialProfileBody': 'a',
  'consent.analyticsTitle': 'Analytics',
  'consent.analyticsBody': 'b',
  'consent.marketingTitle': 'Marketing communications',
  'consent.marketingBody': 'c',
  'consent.optionalHint': 'Optional. Everything works either way.',
  'consent.footer': 'We never sell your data.',
};

function renderConsent(onAccept?: (o: Record<string, boolean>) => void) {
  return render(
    <IntlProvider locale="en" messages={M}>
      <Consent onAccept={onAccept} />
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

  it('should keep opt-ins off unless the user turns them on, and pass the map to onAccept', () => {
    const onAccept = vi.fn();
    renderConsent(onAccept);
    // Accept with nothing toggled → all false. (fireEvent = act-wrapped, so
    // state updates flush between interactions — raw .click() does not.)
    fireEvent.click(screen.getByRole('button', { name: /Accept & continue/ }));
    expect(onAccept).toHaveBeenCalledWith({
      financialProfile: false,
      analytics: false,
      marketing: false,
    });
    // Turn analytics on, accept again → only analytics true.
    fireEvent.click(screen.getByRole('switch', { name: 'Analytics' }));
    fireEvent.click(screen.getByRole('button', { name: /Accept & continue/ }));
    expect(onAccept).toHaveBeenLastCalledWith({
      financialProfile: false,
      analytics: true,
      marketing: false,
    });
  });

  it('should present Terms/Privacy as links (explicit accept is the consent act)', () => {
    renderConsent();
    expect(screen.getByRole('link', { name: 'Terms' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeTruthy();
  });
});
