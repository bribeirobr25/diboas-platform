// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from '../Card';

describe('Card (A1 primitive)', () => {
  it('should render its children', () => {
    render(<Card>Grow steadily</Card>);
    expect(screen.getByText('Grow steadily')).toBeTruthy();
  });

  it('should pass through semantic attributes (role, aria-label)', () => {
    render(
      <Card role="group" aria-label="Goal">
        content
      </Card>
    );
    const el = screen.getByRole('group', { name: 'Goal' });
    expect(el).toBeTruthy();
  });
});
