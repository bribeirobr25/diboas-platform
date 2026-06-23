/**
 * CinematicHeroFactory — SSR/SEO contract + fallback tests.
 *
 * The WebGL hook is mocked (Three.js never loads in tests) so we assert the
 * load-bearing guarantees: the headline/copy/CTAs are real server-rendered DOM
 * (LCP/SEO), the canvas layer is decorative (aria-hidden), and a WebGL failure
 * degrades to the gradient fallback (no <canvas>) without breaking content.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockState = { failed: false };
vi.mock('../scenes/useWebGLScene', () => ({
  useWebGLScene: () => ({
    canvasRef: { current: null },
    containerRef: { current: null },
    failed: mockState.failed,
  }),
}));

// next/image → plain img in tests
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, never>)} />;
  },
}));

import { CinematicHeroFactory } from '../CinematicHeroFactory';

describe('CinematicHeroFactory', () => {
  it('should server-render the headline as an <h1> when given content', () => {
    render(
      <CinematicHeroFactory
        scene="fluid"
        theme="dark"
        eyebrow="YOUR SIDE-POCKET"
        headline="Your money shouldn't sit still."
        subheadline="Put your idle money to work."
        sectionId="test-hero"
      />
    );
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.textContent).toContain("Your money shouldn't sit still.");
    expect(h1.getAttribute('id')).toBe('test-hero-title');
    expect(screen.getByText('YOUR SIDE-POCKET')).toBeTruthy();
    expect(screen.getByText('Put your idle money to work.')).toBeTruthy();
  });

  it('should label the section landmark by the headline id (a11y/SEO)', () => {
    const { container } = render(
      <CinematicHeroFactory scene="fluid" theme="dark" headline="Hi" sectionId="s1" />
    );
    const section = container.querySelector('section');
    expect(section?.getAttribute('aria-labelledby')).toBe('s1-title');
    expect(section?.getAttribute('data-theme')).toBe('dark');
    expect(section?.getAttribute('data-scene')).toBe('fluid');
  });

  it('should render CTAs as real <a> links and fire onClick without blocking navigation', () => {
    const onClick = vi.fn();
    render(
      <CinematicHeroFactory
        scene="fluid"
        theme="dark"
        headline="Hi"
        primaryCta={{ label: 'Try the live demo', href: '/en/demo', onClick }}
      />
    );
    const link = screen.getByRole('link', { name: /try the live demo/i });
    expect(link.getAttribute('href')).toBe('/en/demo');
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should render the decorative canvas host as aria-hidden when WebGL is available', () => {
    mockState.failed = false;
    const { container } = render(<CinematicHeroFactory scene="fluid" theme="dark" headline="Hi" />);
    expect(container.querySelector('[aria-hidden="true"] canvas')).not.toBeNull();
  });

  it('should fall back (no <canvas>) when WebGL fails, keeping content intact', () => {
    mockState.failed = true;
    const { container } = render(
      <CinematicHeroFactory scene="fluid" theme="dark" headline="Still here" />
    );
    expect(container.querySelector('canvas')).toBeNull();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('Still here');
    mockState.failed = false;
  });
});
