// @vitest-environment happy-dom
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { getMessages } from '@/i18n/loadMessages';
import { RecurringControl } from '../RecurringControl';

/**
 * REQUIREMENT (WCAG 1.3.1/4.1.1; 2026-10-18 lane audit): each open recurring form labels
 * ITS OWN input. A fixed `id="recurring-amount"` repeated when two positions were edited
 * at once, so the second label pointed at — and focused — the first input.
 */
describe('RecurringControl — one label per input', () => {
  it('should give two open forms distinct ids, each label naming its own input', () => {
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        {['p1', 'p2'].map((positionId) => (
          <RecurringControl
            key={positionId}
            goalId="g1"
            positionId={positionId}
            schedule={undefined}
            workingBalance="1000"
            currency="USD"
          />
        ))}
      </IntlProvider>
    );
    for (const cta of screen.getAllByRole('button', { name: 'Add a monthly amount' })) {
      fireEvent.click(cta);
    }
    const inputs = screen.getAllByLabelText('How much each month');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]!.id).not.toBe(inputs[1]!.id);
    expect(inputs[0]!.id).not.toBe('');
  });
});
