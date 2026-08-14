// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../Button';

describe('Button (A1 primitive)', () => {
  it('should render a native button with its label and fire onClick', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Put money to work</Button>);
    const btn = screen.getByRole('button', { name: 'Put money to work' });
    expect(btn).toBeTruthy();
    btn.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('should default to type=button (never an accidental form submit)', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });

  it('should not fire onClick when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Confirm
      </Button>
    );
    screen.getByRole('button').click();
    expect(onClick).not.toHaveBeenCalled();
  });
});
