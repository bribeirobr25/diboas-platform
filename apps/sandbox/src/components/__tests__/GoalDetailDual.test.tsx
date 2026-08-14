// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { GoalDetailDual } from '../GoalDetailDual';

const M = {
  'common.playBadge': 'Sandbox · play money',
  'goalDual.simple': 'Simple',
  'goalDual.detailed': 'Detailed',
  'goalDual.onTrackLabel': 'Am I on track to get there?',
  'goalDual.onTrack': 'On track',
  'goalDual.pace': 'At this pace, about {months} months to go.',
  'goalDual.paceNote': 'This is a pace, not a promise.',
  'goalDual.howLabel': "What your money's doing",
  'goalDual.howLead': 'Growing gently in {strategy}, with small ups and downs.',
  'goalDual.nextLabel': 'What you can do next',
  'goalDual.add': 'Add money',
  'goalDual.pausePlan': 'Pause plan',
  'goalDual.more': 'More',
  'goalDual.seeDetail': 'See the detail',
  'goalDual.currentOfTarget': '{current} of {target}',
  'goalDual.contributions': 'Your contributions',
  'goalDual.marketChange': 'Market change',
  'goalDual.inStrategy': 'In strategy',
  'goalExample.name': 'Trip to Lisbon',
};

function renderGoal(props?: { onAdd?: () => void; onPause?: () => void }) {
  return render(
    <IntlProvider locale="en" messages={M}>
      <GoalDetailDual
        current="2,000.00"
        target="5,000.00"
        monthsToGo={14}
        strategyName="Grow steadily"
        series={[1800, 1830, 1810, 1880, 1900, 2000]}
        contributions="1,850.00"
        marketChange="150.00"
        {...props}
      />
    </IntlProvider>
  );
}

describe('GoalDetailDual (Phase B goal dual-view)', () => {
  it('should default to Simple and lead with on-track + an HONEST pace (a pace not a promise)', () => {
    renderGoal();
    expect(screen.getByText('Am I on track to get there?')).toBeTruthy();
    expect(screen.getByText(/about 14 months to go/)).toBeTruthy();
    expect(screen.getByText('This is a pace, not a promise.')).toBeTruthy();
  });

  it('should show source-separated contributions vs market change only in Detailed (UX-63)', () => {
    renderGoal();
    expect(screen.queryByText('Your contributions')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Detailed' }));
    expect(screen.getByText('Your contributions')).toBeTruthy();
    expect(screen.getByText('Market change')).toBeTruthy();
    expect(screen.getByText('1,850.00')).toBeTruthy();
  });

  it('should offer the W-17d pause action and fire the seams', () => {
    const onAdd = vi.fn();
    const onPause = vi.fn();
    renderGoal({ onAdd, onPause });
    fireEvent.click(screen.getByRole('button', { name: /Pause plan/ }));
    expect(onPause).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /Add money/ }));
    expect(onAdd).toHaveBeenCalledOnce();
  });
});
