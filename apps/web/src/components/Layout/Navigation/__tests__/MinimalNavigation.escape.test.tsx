/**
 * The mobile menu closes on Escape and gives focus back to the menu button (visual pass,
 * 2026-11-11). The close button sits outside the focus-trapped menu, so before this a keyboard
 * user who opened the menu could not close it (WCAG 2.1.2 No Keyboard Trap).
 *
 * @vitest-environment happy-dom
 */
import { act, fireEvent, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({ usePathname: () => '/en/about' }));
vi.mock('@diboas/i18n/client', () => ({
  useTranslation: () => ({ formatMessage: ({ id }: { id: string }) => id }),
}));
vi.mock('@diboas/ui', () => ({
  Button: ({ children }: { children: ReactNode }) => <button type="button">{children}</button>,
}));
vi.mock('@/components/UI', () => ({
  Container: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexBetween: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  LocaleLink: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));
vi.mock('@/components/UI/BrandWordmark', () => ({ BrandWordmark: () => <span>diBoaS</span> }));
vi.mock('@/components/LanguageSwitcher', () => ({ LanguageSwitcher: () => <div /> }));

beforeEach(() => {
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    cb(0);
    return 0;
  });
});

describe('MinimalNavigation mobile menu', () => {
  it('should close on Escape and return focus to the menu button when the menu is open', async () => {
    const { default: MinimalNavigation } = await import('../MinimalNavigation');
    const { container } = render(<MinimalNavigation />);
    const toggle = container.querySelector<HTMLButtonElement>(
      'button[aria-controls="mobile-menu"]'
    );
    expect(toggle).not.toBeNull();

    toggle!.focus();
    act(() => toggle!.click());
    expect(toggle!.getAttribute('aria-expanded')).toBe('true');

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(toggle!.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('should leave a closed menu alone when Escape is pressed', async () => {
    const { default: MinimalNavigation } = await import('../MinimalNavigation');
    const { container } = render(<MinimalNavigation />);
    const toggle = container.querySelector<HTMLButtonElement>(
      'button[aria-controls="mobile-menu"]'
    )!;
    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
