/**
 * ProcessSteps — render contract.
 *
 * The Factory-less section translates its config (via useConfigTranslation) and
 * renders every step at once: a numbered badge + title + description, plus an
 * image when the step provides one. We assert the header, all step titles, the
 * numbered badges, and that an image renders when present.
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

// useConfigTranslation is identity here (strings are already literal in the mock config).
vi.mock('@/lib/i18n/config-translator', () => ({
  useConfigTranslation: (c: unknown) => c,
}));

import { ProcessSteps } from '../ProcessSteps';
import type { AppFeaturesCarouselVariantConfig } from '@/config/appFeaturesCarousel';

const CONFIG = {
  variant: 'default',
  sectionTitle: 'Cash, separated by purpose.',
  cards: [
    {
      id: 'a',
      content: { title: 'Connect your flow', description: 'd1' },
      assets: { image: '/a.jpg' },
      seo: { imageAlt: 'alt a' },
    },
    {
      id: 'b',
      content: { title: 'Set your floor', description: 'd2' },
      assets: { image: '/b.jpg' },
      seo: { imageAlt: 'alt b' },
    },
    {
      id: 'c',
      content: { title: 'Review the path', description: 'd3' },
      assets: { image: '/c.jpg' },
      seo: { imageAlt: 'alt c' },
    },
    {
      id: 'd',
      content: { title: 'Move when approved', description: 'd4' },
      assets: { image: '/d.jpg' },
      seo: { imageAlt: 'alt d' },
    },
  ],
  settings: {},
  analytics: { trackingPrefix: 'how_it_works_b2b', enabled: true },
} as unknown as AppFeaturesCarouselVariantConfig;

describe('ProcessSteps', () => {
  it('should render the header and all four step titles', () => {
    render(<ProcessSteps config={CONFIG} enableAnalytics={false} />);
    expect(screen.getByRole('heading', { name: 'Cash, separated by purpose.' })).toBeTruthy();
    ['Connect your flow', 'Set your floor', 'Review the path', 'Move when approved'].forEach((t) =>
      expect(screen.getByText(t)).toBeTruthy()
    );
  });

  it('should render a numbered badge per step and one image per step', () => {
    const { container } = render(<ProcessSteps config={CONFIG} enableAnalytics={false} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    ['1', '2', '3', '4'].forEach((n) => expect(screen.getByText(n)).toBeTruthy());
    expect(container.querySelectorAll('img')).toHaveLength(4);
  });
});
