/**
 * WaitlistConfirmation — founding-member celebration beat (Phase 6).
 *
 * The post-signup confirmation gains a filling GoalRing + a live scarcity line
 * when founding spots remain. Verifies the render guard (shown with spots left,
 * hidden when full) and the fill fraction, without any DB/API — the confirmation
 * itself only renders after a real signup in product, so this is the safe
 * functional guard.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WaitlistConfirmation } from '../WaitlistConfirmation';

vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({
    formatMessage: ({ id }: { id: string }, values?: Record<string, unknown>) =>
      values ? `${id} ${JSON.stringify(values)}` : id,
  }),
}));
vi.mock('@/components/Providers', () => ({ useLocale: () => ({ locale: 'en' }) }));
vi.mock('../ReferralLink', () => ({ ReferralLink: () => <div data-testid="referral" /> }));
vi.mock('@/components/UI/GoalRing', () => ({
  GoalRing: ({ progress, ariaLabel }: { progress: number; ariaLabel: string }) => (
    <div data-testid="founding-ring" data-progress={progress} aria-label={ariaLabel} role="img" />
  ),
}));

const base = {
  position: 247,
  referralCode: 'ABC123',
  referralUrl: 'https://diboas.com/?ref=ABC123',
};

describe('WaitlistConfirmation founding beat', () => {
  it('renders the ring + scarcity line when founding spots remain', () => {
    render(
      <WaitlistConfirmation {...base} tier="founding_member" foundingCap={1200} foundingSpotsRemaining={800} />
    );
    const ring = screen.getByTestId('founding-ring');
    // 800 of 1200 remaining → (1200-800)/1200 = 0.333… filled
    expect(Number(ring.getAttribute('data-progress'))).toBeCloseTo(1 / 3, 2);
    expect(screen.getByText(/waitlistFounding\.spotsLeft/)).toBeTruthy();
  });

  it('hides the founding beat when spots are full (remaining = 0)', () => {
    render(
      <WaitlistConfirmation {...base} tier="early_member" foundingCap={1200} foundingSpotsRemaining={0} />
    );
    expect(screen.queryByTestId('founding-ring')).toBeNull();
  });

  it('hides the founding beat when no founding data is supplied', () => {
    render(<WaitlistConfirmation {...base} />);
    expect(screen.queryByTestId('founding-ring')).toBeNull();
  });
});
