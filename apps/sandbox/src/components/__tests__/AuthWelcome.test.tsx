// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

// The method buttons are WIRED to the onboarding server action; mock it so the
// test asserts the wiring (called with the chosen method + locale) without
// invoking real navigation.
const startOnboarding = vi.fn();
vi.mock('@/app/[locale]/welcome/actions', () => ({
  startOnboarding: (method: string, locale: string) => startOnboarding(method, locale),
}));

// LocaleSwitcher (in the hero) uses the app router; stub it for render.
const routerPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/welcome',
  useRouter: () => ({ push: routerPush, replace: vi.fn(), prefetch: vi.fn() }),
}));

import { AuthWelcome } from '../AuthWelcome';

const MESSAGES = {
  'authWelcome.wordmarkAlt': 'diBoaS',
  'authWelcome.tagline': 'Practice money. Build wisdom.',
  'authWelcome.title': 'Practice money decisions. Build real confidence.',
  'authWelcome.body': 'Explore strategies, set goals, and grow your money intuition.',
  'authWelcome.google': 'Continue with Google',
  'authWelcome.email': 'Continue with email',
  'authWelcome.wallet': 'Connect wallet',
  'authWelcome.legal':
    'Review our <terms>Terms</terms> and <privacy>Privacy Policy</privacy> anytime.',
  'theme.toggle': 'Switch to {target} mode',
  'theme.light': 'light',
  'theme.dark': 'dark',
  'locale.label': 'Language',
  'locale.switch': 'Change language, current: {current}',
};

function renderWelcome(locale = 'en') {
  return render(
    <IntlProvider locale="en" messages={MESSAGES}>
      <AuthWelcome locale={locale} />
    </IntlProvider>
  );
}

describe('AuthWelcome (A2 front door — wired)', () => {
  it('should offer exactly the three ruled R1 methods, equal weight', () => {
    renderWelcome();
    expect(screen.getByText('Continue with Google')).toBeTruthy();
    expect(screen.getByText('Continue with email')).toBeTruthy();
    expect(screen.getByText('Connect wallet')).toBeTruthy();
    // Three method buttons + the language + theme controls = 5 buttons total.
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  it('should offer a language chooser on the front door', () => {
    renderWelcome();
    expect(
      screen.getByRole('button', { name: 'Change language, current: English' })
    ).toBeTruthy();
  });

  it('should show the diBoaS wordmark (not "diBoaS Sandbox")', () => {
    renderWelcome();
    expect(screen.getByRole('img', { name: 'diBoaS' })).toBeTruthy();
    // No "diBoaS Sandbox" text title (internal-page rule).
    expect(screen.queryByText('diBoaS Sandbox')).toBeNull();
  });

  it('should offer a light/dark theme choice (the two approved designs)', () => {
    renderWelcome();
    // Default theme is light, so the toggle offers a switch TO dark.
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeTruthy();
  });

  it('should WIRE the method tap into the onboarding flow (action called with method + locale)', () => {
    startOnboarding.mockClear();
    renderWelcome('de');
    fireEvent.click(screen.getByText('Continue with email'));
    expect(startOnboarding).toHaveBeenCalledWith('email', 'de');
  });

  it('should present Terms/Privacy as reviewable links, not agreement-by-continuing', () => {
    renderWelcome();
    expect(screen.getByRole('link', { name: 'Terms' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/agree/i);
  });
});
