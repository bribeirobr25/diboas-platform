// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { ModeChip } from '../ModeChip';

const MESSAGES = { 'common.playBadge': 'Practice · no real money' };

function renderChip() {
  return render(
    <IntlProvider locale="en" messages={MESSAGES}>
      <ModeChip />
    </IntlProvider>
  );
}

describe('ModeChip (A1 primitive — the persistent play-money label)', () => {
  it('should render the one-lexicon "Practice · no real money" label', () => {
    renderChip();
    expect(screen.getByText('Practice · no real money')).toBeTruthy();
  });

  it('should NOT render an uppercased legacy label', () => {
    renderChip();
    expect(screen.queryByText('PLAY MONEY')).toBeNull();
    expect(screen.queryByText('Play money')).toBeNull();
  });
});
