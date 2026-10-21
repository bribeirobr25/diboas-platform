// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMessages } from '@/i18n/loadMessages';
import { grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { GoalNewScreen } from '../GoalNewScreen';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

/**
 * REQUIREMENT (WCAG 3.3.1 / 1.3.1; 2026-10-18 lane audit): a field-level error is tied to
 * its field — the field reports `aria-invalid` and is described by its own message — so a
 * screen-reader user who lands on it hears what is wrong. An untouched or valid field
 * carries neither attribute (no red on untouched).
 */
const renderNew = () =>
  render(
    <IntlProvider locale="en" messages={getMessages('en')}>
      <GoalNewScreen locale="en" />
    </IntlProvider>
  );

describe('GoalNewScreen — errors are tied to their fields', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(100, 'USD', 'b2c');
  });

  it('should mark nothing invalid before a field is touched', () => {
    const { container } = renderNew();
    expect(container.querySelectorAll('[aria-invalid]')).toHaveLength(0);
  });

  it('should tie the target and starting-amount errors to their own fields', () => {
    const { container } = renderNew();
    const target = container.querySelector<HTMLInputElement>('#goal-target')!;
    const fund = container.querySelector<HTMLInputElement>('#goal-fund')!;
    fireEvent.change(target, { target: { value: '0' } });
    fireEvent.change(fund, { target: { value: '5000' } });

    for (const [field, text] of [
      [target, 'The target needs to be a positive amount.'],
      [fund, 'That is more than your working money right now.'],
    ] as const) {
      expect(field.getAttribute('aria-invalid')).toBe('true');
      const described = document.getElementById(field.getAttribute('aria-describedby') ?? '');
      expect(described?.textContent).toBe(text);
    }
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('should clear the tie once the value is valid again', () => {
    const { container } = renderNew();
    const target = container.querySelector<HTMLInputElement>('#goal-target')!;
    fireEvent.change(target, { target: { value: '0' } });
    fireEvent.change(target, { target: { value: '500' } });
    expect(target.hasAttribute('aria-invalid')).toBe(false);
    expect(target.hasAttribute('aria-describedby')).toBe(false);
  });
});
