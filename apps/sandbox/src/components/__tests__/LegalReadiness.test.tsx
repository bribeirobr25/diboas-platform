// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMessages } from '@/i18n/loadMessages';
import { LEGAL_CHOICES_STORAGE_KEY, readLegalChoices } from '@/lib/legal/readiness';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/en/readiness',
}));

import { LegalReadiness } from '../LegalReadiness';

const EN = getMessages('en');
const renderIt = () =>
  render(
    <IntlProvider locale="en" messages={EN}>
      <LegalReadiness locale="en" />
    </IntlProvider>
  );

/** LC-TD-02 §4 · Product EN-03A with the Legal REQUIRED PATCH (I-0b). */
describe('LegalReadiness — four separate concepts, nothing bundled', () => {
  beforeEach(() => {
    push.mockClear();
    localStorage.clear();
  });

  it('should render the exact Legal control strings and two SEPARATE required checkboxes, both unchecked', () => {
    renderIt();
    const terms = screen.getByLabelText(EN['legalReadiness.terms']) as HTMLInputElement;
    const age = screen.getByLabelText(EN['legalReadiness.age']) as HTMLInputElement;
    expect(terms.type).toBe('checkbox');
    expect(age.type).toBe('checkbox');
    expect(terms).not.toBe(age);
    // Sabotage: pre-check either control (defaultChecked) and this fails (LB-04).
    expect(terms.checked).toBe(false);
    expect(age.checked).toBe(false);
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
  });

  it('should present the Privacy Notice as information (a link), never as a control', () => {
    renderIt();
    const privacy = screen.getByRole('link', {
      name: new RegExp(EN['legalReadiness.privacy'].slice(0, 14)),
    });
    expect(privacy.getAttribute('href')).toContain('/legal/privacy');
    expect(screen.queryByRole('checkbox', { name: /Privacy/ })).toBeNull();
  });

  it('should keep analytics an optional switch, OFF by default', () => {
    renderIt();
    const sw = screen.getByRole('switch', { name: EN['legalReadiness.analytics'] });
    expect(sw.getAttribute('aria-checked')).toBe('false');
  });

  it('should disable Continue until BOTH required declarations are affirmative, and never require analytics', () => {
    renderIt();
    const cont = screen.getByRole('button', {
      name: EN['legalReadiness.continue'],
    }) as HTMLButtonElement;
    expect(cont.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(EN['legalReadiness.terms']));
    expect(cont.disabled).toBe(true); // Terms alone is not enough (18+ is its own declaration)
    fireEvent.click(screen.getByLabelText(EN['legalReadiness.age']));
    expect(cont.disabled).toBe(false); // analytics still off
    fireEvent.click(screen.getByLabelText(EN['legalReadiness.age']));
    expect(cont.disabled).toBe(true); // unchecking age blocks again
  });

  it('should write the §4.3 evidence record on Continue and advance to the claim', () => {
    renderIt();
    fireEvent.click(screen.getByLabelText(EN['legalReadiness.terms']));
    fireEvent.click(screen.getByLabelText(EN['legalReadiness.age']));
    fireEvent.click(screen.getByRole('button', { name: EN['legalReadiness.continue'] }));
    const records = readLegalChoices();
    expect(records.map((r) => [r.controlId, r.state])).toEqual([
      ['LEGAL-TERMS', 'accepted'],
      ['LEGAL-AGE', 'declared'],
      ['LEGAL-ANALYTICS', 'refused'],
    ]);
    for (const r of records) {
      expect(r.documentId && r.documentVersion && r.locale && r.timestamp).toBeTruthy();
    }
    expect(localStorage.getItem(LEGAL_CHOICES_STORAGE_KEY)).toBeTruthy();
    expect(push).toHaveBeenCalledWith('/en/claim');
  });

  it('should record an affirmative analytics choice when the switch is on', () => {
    renderIt();
    fireEvent.click(screen.getByLabelText(EN['legalReadiness.terms']));
    fireEvent.click(screen.getByLabelText(EN['legalReadiness.age']));
    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: EN['legalReadiness.continue'] }));
    expect(readLegalChoices().find((r) => r.controlId === 'LEGAL-ANALYTICS')?.state).toBe(
      'allowed'
    );
  });

  it('should never say the Privacy Notice is agreed to', () => {
    renderIt();
    expect(document.body.textContent).not.toMatch(/agree/i);
  });
});
