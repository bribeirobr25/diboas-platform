/**
 * HowItWorksThreeUp — render contract.
 *
 * The variant is presentational (the Factory translates the config before it
 * reaches here), so we assert: the header + the three captions render, an empty
 * `image` shows a placeholder (no <img>), and a provided `image` renders an
 * <img> with its distinct alt text.
 *
 * @vitest-environment happy-dom
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// next/image -> plain img in tests
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(props as Record<string, never>)} />;
  },
}));

import { HowItWorksThreeUp } from '../variants/HowItWorksThreeUp';
import type { HowItWorksConfig } from '@/config/howItWorks';

const makeConfig = (images: [string, string, string]): HowItWorksConfig => ({
  variant: 'threeUp',
  content: {
    header: 'How it works',
    steps: [
      { caption: 'Pick a job for your money.', imageAlt: 'Goal screen', image: images[0] },
      { caption: 'See the path first.', imageAlt: 'Path screen', image: images[1] },
      { caption: "Move when you're ready.", imageAlt: 'Move screen', image: images[2] },
    ],
  },
  seo: { ariaLabel: 'How it works' },
  analytics: { sectionId: 'how-it-works-visual-b2c', category: 'landing-b2c' },
});

describe('HowItWorksThreeUp', () => {
  it('should render the header and all three captions', () => {
    render(<HowItWorksThreeUp config={makeConfig(['', '', ''])} />);
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeTruthy();
    expect(screen.getByText('Pick a job for your money.')).toBeTruthy();
    expect(screen.getByText('See the path first.')).toBeTruthy();
    expect(screen.getByText("Move when you're ready.")).toBeTruthy();
  });

  it('should render three list items', () => {
    render(<HowItWorksThreeUp config={makeConfig(['', '', ''])} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('should show placeholders (no img) when images are empty', () => {
    const { container } = render(<HowItWorksThreeUp config={makeConfig(['', '', ''])} />);
    expect(container.querySelectorAll('img')).toHaveLength(0);
  });

  it('should render images with distinct alt text when paths are provided', () => {
    render(<HowItWorksThreeUp config={makeConfig(['/a.png', '/b.png', '/c.png'])} />);
    expect(screen.getByAltText('Goal screen')).toBeTruthy();
    expect(screen.getByAltText('Path screen')).toBeTruthy();
    expect(screen.getByAltText('Move screen')).toBeTruthy();
  });
});
