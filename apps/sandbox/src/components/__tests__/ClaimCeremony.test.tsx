// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

// The claim tap is WIRED to the play ledger grant + a route into the app home.
const grantPlayMoney = vi.fn();
const push = vi.fn();
const replace = vi.fn();
vi.mock('@/lib/ledgerClient', () => ({
  grantPlayMoney: (...args: unknown[]) => grantPlayMoney(...args),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));
// `5.542`: the ceremony now reads hydration + the ledger's `initialized` flag.
const ledger = { ready: true, initialized: false };
vi.mock('@/hooks/useLedgerReady', () => ({ useLedgerReady: () => ledger.ready }));
vi.mock('@/hooks/useLedger', () => ({ useLedger: () => ({ initialized: ledger.initialized }) }));

import { ClaimCeremony } from '../ClaimCeremony';
import { getMessages } from '@/i18n/loadMessages';

const EN = getMessages('en');

const M = {
  // 2026-10-19 (test cleanup): keys the rendered tree uses but this stub lacked —
  // MISSING_TRANSLATION noise, not a product gap (every key exists in all four
  // locales). Taken from the real catalogue so nothing is invented.
  'common.appName': EN['common.appName'],
  'common.frameCaption': EN['common.frameCaption'],
  'common.playBadge': 'Practice · no real money',
  'common.wordmarkAlt': 'diBoaS',
  'claim.eyebrow': 'Claim ceremony',
  'claim.heading': "You're about to receive",
  'claim.amountLabel': 'practice credits',
  'claim.infoTitle': 'Practice credits are play money',
  'claim.infoBody': 'They have no real-world value and never convert to real money.',
  'claim.cta': 'Get your first {amount}',
  'claim.footer': 'Secure. Private. Yours to explore.',
};

function renderClaim(locale = 'en') {
  return render(
    <IntlProvider locale="en" messages={M}>
      <ClaimCeremony locale={locale as 'en'} />
    </IntlProvider>
  );
}

describe('ClaimCeremony (A3.2 — W-5a claim)', () => {
  it('should show the real grant amount and a claim CTA', () => {
    renderClaim();
    // 10,000 (PLAY_MONEY_GRANT.b2c, locale-formatted) appears in the hero + CTA.
    expect(screen.getAllByText(/10,000/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Get your first .*10,000/ })).toBeTruthy();
  });

  it('should carry the no-value / never-converts framing (C-P0)', () => {
    renderClaim();
    expect(screen.getByText('Practice credits are play money')).toBeTruthy();
    expect(screen.getByText(/never convert to real money/i)).toBeTruthy();
  });

  it('should WIRE the claim tap: grant the play money, then route to the app home', () => {
    grantPlayMoney.mockClear();
    push.mockClear();
    replace.mockClear();
    renderClaim('pt-BR');
    fireEvent.click(screen.getByRole('button', { name: /Get your first/ }));
    // PlayMoneyGranted alone (no JobsSplitSet) lands the grant in Available, in
    // the locale currency (pt-BR -> BRL).
    expect(grantPlayMoney).toHaveBeenCalledWith(10000, 'BRL', 'b2c');
    // `replace` (5.542): the ceremony's history entry is replaced by Home, so Back
    // never returns to a grant promise in this session.
    expect(replace).toHaveBeenCalledWith('/pt-BR');
    expect(push).not.toHaveBeenCalled();
  });

  /**
   * `5.542` — a claimed ledger must never be promised the grant again (Back, or a
   * direct `/claim` link), and nothing may flash before hydration settles. The
   * assertions are on rendered TEXT, never on a flag.
   */
  describe('5.542 · never promise the grant to a ledger that already has it', () => {
    const promise = () => screen.queryByText("You're about to receive");

    it('should show the promise to a hydrated, UNCLAIMED ledger (first run unchanged)', () => {
      ledger.ready = true;
      ledger.initialized = false;
      replace.mockClear();
      renderClaim();
      expect(promise()).toBeTruthy();
      expect(replace).not.toHaveBeenCalled();
    });

    it('should show NO promise and route Home for a hydrated, CLAIMED ledger', () => {
      ledger.ready = true;
      ledger.initialized = true;
      replace.mockClear();
      renderClaim('de');
      expect(promise()).toBeNull();
      expect(screen.queryByRole('button', { name: /Get your first/ })).toBeNull();
      expect(screen.queryByText(/10,000/)).toBeNull();
      expect(replace).toHaveBeenCalledWith('/de');
      // No dangling label: the section does not point at a heading that is absent.
      expect(document.querySelector('[aria-labelledby="claim-title"]')).toBeNull();
    });

    it('should show NO promise before hydration settles (no flash), and not redirect yet', () => {
      ledger.ready = false;
      ledger.initialized = false;
      replace.mockClear();
      renderClaim();
      expect(promise()).toBeNull();
      expect(replace).not.toHaveBeenCalled();
      ledger.ready = true; // restore the default for the other tests
    });
  });
});
