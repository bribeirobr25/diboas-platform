// @vitest-environment happy-dom
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMessages } from '@/i18n/loadMessages';
import { grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { MoneyOut } from '../MoneyOut';

/**
 * `5.200` — the P0 CUR-1 defect, and the regression guard.
 *
 * `move.withdrawFeePer` used to be keyed by LOCALE, carrying a hardcoded
 * currency example per language (`$0.48 per $100` / `R$0,48 por R$100` /
 * `0,48 € por 100 €`). But the ledger's currency is frozen at claim time
 * (`PlayMoneyGranted.currency`) and never follows the interface language —
 * which the LocaleSwitcher and Settings both let the user change. Reproduced on
 * production: claim at `/de` (ledger EUR), read `/en/move`, and the withdrawal
 * panel stated the fee in **dollars**.
 *
 * So the property under test is a cross product, not a string: the example must
 * follow the LEDGER, and the interface locale must only change grammar and
 * number format.
 *
 * The REAL catalogs are used deliberately. A stub would prove the component
 * renders whatever this file supplied; emptying or re-hardcoding
 * `move.withdrawFeePer` must fail this suite.
 */

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const openWithdrawSheet = (locale: 'en' | 'de' | 'pt-BR' | 'es') => {
  render(
    <IntlProvider locale={locale} messages={getMessages(locale)} onError={() => {}}>
      <MoneyOut />
    </IntlProvider>
  );
  // The withdraw door opens the explainer sheet that carries the fee panel.
  const messages = getMessages(locale);
  fireEvent.click(screen.getByText(messages['move.withdraw']));
};

describe('the withdrawal-fee example follows the LEDGER currency (5.200)', () => {
  beforeEach(() => resetSandbox());

  it('should state the fee in EUR when the ledger is EUR, even while the interface is English', () => {
    // The exact production reproduction: EUR ledger, English interface.
    grantPlayMoney(10_000, 'EUR', 'b2c');
    openWithdrawSheet('en');

    // The euro amounts must be present…
    expect(screen.getByText(/€/)).toBeTruthy();
    // …and no dollar figure may appear anywhere in the fee panel.
    expect(screen.queryByText(/\$\s?0[.,]48/)).toBeNull();
    expect(screen.queryByText(/\$\s?100/)).toBeNull();
  });

  it('should state the fee in BRL when the ledger is BRL, even while the interface is German', () => {
    grantPlayMoney(10_000, 'BRL', 'b2c');
    openWithdrawSheet('de');

    expect(screen.getByText(/R\$/)).toBeTruthy();
    expect(screen.queryByText(/€\s?0,48/)).toBeNull();
  });

  it('should state the fee in USD when the ledger is USD, even while the interface is Portuguese', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    openWithdrawSheet('pt-BR');

    expect(screen.getByText(/\$/)).toBeTruthy();
    expect(screen.queryByText(/R\$\s?0,48/)).toBeNull();
  });

  it('should carry NO currency symbol in the catalog string itself, in any locale', () => {
    // The structural half of the fix: if a symbol ever returns to the copy,
    // the cross-product tests above can pass by luck on one locale. This one
    // cannot be satisfied by anything except a parameterized string.
    for (const locale of ['en', 'pt-BR', 'es', 'de'] as const) {
      const template = getMessages(locale)['move.withdrawFeePer'];
      expect(template).toContain('{fee}');
      expect(template).toContain('{base}');
      expect(template).not.toMatch(/[$€]|R\$/);
      // and no digits: an amount in the copy is an amount that cannot follow
      // the ledger
      expect(template).not.toMatch(/\d/);
    }
  });
});
