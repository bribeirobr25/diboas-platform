// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { AuthWelcome } from '../AuthWelcome';

const MESSAGES = {
  'common.appName': 'diBoaS',
  'common.playBadge': 'Sandbox · play money',
  'authWelcome.tagline': 'Practice money. Build wisdom.',
  'authWelcome.title': 'Practice money decisions. Build real confidence.',
  'authWelcome.body': 'Explore strategies, set goals, and grow your money intuition.',
  'authWelcome.google': 'Continue with Google',
  'authWelcome.email': 'Continue with email',
  'authWelcome.wallet': 'Connect wallet',
  'authWelcome.legal':
    'Review our <terms>Terms</terms> and <privacy>Privacy Policy</privacy> anytime.',
};

function renderWelcome(onMethod?: (m: 'google' | 'email' | 'wallet') => void) {
  return render(
    <IntlProvider locale="en" messages={MESSAGES}>
      <AuthWelcome onMethod={onMethod} />
    </IntlProvider>
  );
}

describe('AuthWelcome (A2 front door)', () => {
  it('should offer exactly the three ruled R1 methods, equal weight', () => {
    renderWelcome();
    expect(screen.getByRole('button', { name: /Continue with Google/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Continue with email/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Connect wallet/ })).toBeTruthy();
    // No fourth method (Apple correctly absent — PL-1c).
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('should call onMethod with the chosen method', () => {
    const onMethod = vi.fn();
    renderWelcome(onMethod);
    screen.getByRole('button', { name: /Continue with email/ }).click();
    expect(onMethod).toHaveBeenCalledWith('email');
  });

  it('should present Terms/Privacy as reviewable links, not agreement-by-continuing', () => {
    renderWelcome();
    const terms = screen.getByRole('link', { name: 'Terms' });
    const privacy = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(terms).toBeTruthy();
    expect(privacy).toBeTruthy();
    // The word "agree" must not appear (bundled agreement-by-continuing declined, W-3).
    expect(document.body.textContent).not.toMatch(/agree/i);
  });
});
