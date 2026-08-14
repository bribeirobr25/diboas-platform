// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { ClaimCeremony } from '../ClaimCeremony';

const M = {
  'common.playBadge': 'Sandbox · play money',
  'claim.eyebrow': 'Practice credits',
  'claim.body': 'These are play money for practising. They never convert to real money.',
  'claim.amountLabel': 'practice credits',
  'claim.cta': 'Get your first {amount}',
  'claim.reassure': 'Nothing here ever becomes real money.',
};

function renderClaim(onClaim?: () => void) {
  return render(
    <IntlProvider locale="en" messages={M}>
      <ClaimCeremony locale="en" onClaim={onClaim} />
    </IntlProvider>
  );
}

describe('ClaimCeremony (A3.2 — W-5a claim)', () => {
  it('should show the real grant amount and a claim CTA', () => {
    renderClaim();
    // 10,000 (PLAY_MONEY_GRANT.b2c, formatted) appears twice: the hero + the CTA.
    expect(screen.getAllByText(/10,000/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: /Get your first .*10,000/ })).toBeTruthy();
  });

  it('should carry the no-value / never-converts framing (C-P0)', () => {
    renderClaim();
    expect(screen.getByText(/never convert to real money/i)).toBeTruthy();
    expect(screen.getByText(/ever becomes real money/i)).toBeTruthy();
  });

  it('should fire onClaim on the tap (the claim act)', () => {
    const onClaim = vi.fn();
    renderClaim(onClaim);
    screen.getByRole('button', { name: /Get your first/ }).click();
    expect(onClaim).toHaveBeenCalledOnce();
  });
});
