// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';

// The claim tap is WIRED to the claimGrant server action; mock it.
const claimGrant = vi.fn();
vi.mock('@/app/[locale]/claim/actions', () => ({
  claimGrant: (locale: string) => claimGrant(locale),
}));

import { ClaimCeremony } from '../ClaimCeremony';

const M = {
  'common.playBadge': 'Sandbox · play money',
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

  it('should WIRE the claim tap into the flow (claimGrant called with the locale)', () => {
    claimGrant.mockClear();
    renderClaim('pt-BR');
    fireEvent.click(screen.getByRole('button', { name: /Get your first/ }));
    expect(claimGrant).toHaveBeenCalledWith('pt-BR');
  });
});
