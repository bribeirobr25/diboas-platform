// @vitest-environment happy-dom
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FEE_RATES } from '@diboas/banking';
import { getMessages } from '@/i18n/loadMessages';
import { grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { MoneyOut } from '../MoneyOut';

/**
 * The expected figures are DERIVED from the fee constants and the worked base,
 * not read off the rendered output (coding-standards rule 4). FE-1's cash-out
 * rate is `FEE_RATES.ramp`; the example is worked against 100.
 */
const BASE = 100;
const FEE = FEE_RATES.ramp.times(BASE).toNumber(); // 0.48 at FE-1's 0.48%

/** What `useFormatters(currency)` must produce for a given ledger currency. */
const expectMoney = (locale: string, currency: string, amount: number) =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);

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

    // The EXACT derived figures, in the ledger's currency with the interface
    // locale's number format — 0.48% of 100 = 0.48, and the base itself.
    const rendered = document.body.textContent ?? '';
    expect(rendered).toContain(expectMoney('en', 'EUR', FEE));
    expect(rendered).toContain(expectMoney('en', 'EUR', BASE));
    // …and no dollar figure may appear anywhere on the surface.
    expect(rendered).not.toContain('$');
  });

  it('should state the fee in BRL when the ledger is BRL, even while the interface is German', () => {
    grantPlayMoney(10_000, 'BRL', 'b2c');
    openWithdrawSheet('de');

    const rendered = document.body.textContent ?? '';
    expect(rendered).toContain(expectMoney('de', 'BRL', FEE));
    expect(rendered).toContain(expectMoney('de', 'BRL', BASE));
    expect(rendered).not.toContain('€');
  });

  it('should state the fee in USD when the ledger is USD, even while the interface is Portuguese', () => {
    grantPlayMoney(10_000, 'USD', 'b2c');
    openWithdrawSheet('pt-BR');

    const rendered = document.body.textContent ?? '';
    expect(rendered).toContain(expectMoney('pt-BR', 'USD', FEE));
    expect(rendered).toContain(expectMoney('pt-BR', 'USD', BASE));
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
