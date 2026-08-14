// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routerPush = vi.fn();
let currentPath = '/en/welcome';
vi.mock('next/navigation', () => ({
  usePathname: () => currentPath,
  useRouter: () => ({ push: routerPush, replace: vi.fn(), prefetch: vi.fn() }),
}));

import { LocaleSwitcher } from '../LocaleSwitcher';

const MESSAGES = {
  'locale.label': 'Language',
  'locale.switch': 'Change language, current: {current}',
};

function renderSwitcher(locale = 'en', path = '/en/welcome') {
  currentPath = path;
  return render(
    <IntlProvider locale="en" messages={MESSAGES}>
      <LocaleSwitcher locale={locale} />
    </IntlProvider>
  );
}

beforeEach(() => {
  routerPush.mockClear();
  document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
});
afterEach(() => {
  document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
});

describe('LocaleSwitcher', () => {
  it('should list every locale as an endonym once opened', () => {
    renderSwitcher();
    fireEvent.click(screen.getByRole('button', { name: 'Change language, current: English' }));
    for (const name of ['English', 'Português', 'Español', 'Deutsch']) {
      expect(screen.getByText(name)).toBeTruthy();
    }
  });

  it('should persist the choice to the NEXT_LOCALE cookie and swap the locale segment', () => {
    renderSwitcher('en', '/en/welcome');
    fireEvent.click(screen.getByRole('button', { name: 'Change language, current: English' }));
    fireEvent.click(screen.getByText('Deutsch'));

    expect(document.cookie).toContain('NEXT_LOCALE=de');
    expect(routerPush).toHaveBeenCalledWith('/de/welcome');
  });

  it('should preserve deeper paths when switching (only the locale segment changes)', () => {
    renderSwitcher('en', '/en/goals/new');
    fireEvent.click(screen.getByRole('button', { name: 'Change language, current: English' }));
    fireEvent.click(screen.getByText('Português'));
    expect(routerPush).toHaveBeenCalledWith('/pt-BR/goals/new');
  });

  it('should not navigate when the current language is reselected', () => {
    renderSwitcher('en', '/en/welcome');
    fireEvent.click(screen.getByRole('button', { name: 'Change language, current: English' }));
    fireEvent.click(screen.getByText('English'));
    expect(routerPush).not.toHaveBeenCalled();
  });
});
