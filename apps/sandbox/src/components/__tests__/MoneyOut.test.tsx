// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { beforeEach, describe, expect, it } from 'vitest';
import { getMessages } from '@/i18n/loadMessages';
import { SANDBOX_LOCALES } from '@/i18n/config';
import { grantPlayMoney, resetSandbox } from '@/lib/ledgerClient';
import { MoneyOut, MONEY_OUT_ACTIONS } from '../MoneyOut';

/**
 * /move (I-0a, PENDING_ALL 5.155). The screen composes its ids from
 * MONEY_OUT_ACTIONS; from 2026-08-25 to 2026-09-07 it rendered `move.earn`,
 * `move.earnTitle` and `move.earnBody` raw in four locales because the keys had
 * been deleted as orphans. This renders every tile AND every sheet with the
 * REAL catalogs — no `onError={() => {}}` — so a missing key throws.
 */
const RAW_ID = /\bmove\.[A-Za-z]+/;

function renderMove(locale: (typeof SANDBOX_LOCALES)[number]) {
  return render(
    <IntlProvider locale={locale} messages={getMessages(locale)}>
      <MoneyOut />
    </IntlProvider>
  );
}

describe('MoneyOut — no raw message ids on the money doors', () => {
  beforeEach(() => {
    resetSandbox();
    grantPlayMoney(10_000, 'USD', 'b2c');
  });

  it.each(SANDBOX_LOCALES)(
    'should render every tile and sheet without a raw id in %s',
    (locale) => {
      const { unmount } = renderMove(locale);
      expect(document.body.textContent).not.toMatch(RAW_ID);
      for (const id of MONEY_OUT_ACTIONS) {
        const label = getMessages(locale)[`move.${id}`];
        fireEvent.click(screen.getByRole('button', { name: new RegExp(label) }));
        expect(document.body.textContent).toContain(getMessages(locale)[`move.${id}Body`]);
        expect(document.body.textContent).not.toMatch(RAW_ID);
        fireEvent.click(screen.getByText(getMessages(locale)['move.okay']));
      }
      unmount();
    }
  );

  it('should offer exactly the two ruled doors — the earn tile is gone (its door is /weekly)', () => {
    renderMove('en');
    expect(MONEY_OUT_ACTIONS).toEqual(['add', 'withdraw']);
    expect(screen.queryByText(/\bEarn credits\b/)).toBeNull();
    expect(screen.getByRole('button', { name: /Add credits/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Withdraw/ })).toBeTruthy();
  });

  it('should keep Withdraw visibly unavailable but tappable (W-9c: an explainer, never a dead control)', () => {
    renderMove('en');
    const withdraw = screen.getByRole('button', { name: /Withdraw/ });
    expect(withdraw.getAttribute('data-disabled')).toBe('true');
    fireEvent.click(withdraw);
    expect(document.body.textContent).toContain(getMessages('en')['move.withdrawBody']);
  });
});
